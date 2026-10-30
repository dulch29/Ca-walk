import {
  __resetOsmServiceStateForTests,
  formatDistance,
  getNearbyPlaces,
  getWalkingRoute,
  OsmServiceError,
  reverseGeocodeLocation,
  searchPlaces,
} from '../src/services/osmLocationService';

const response = (body: unknown, status = 200) => ({
  ok: status >= 200 && status < 300,
  status,
  json: async () => body,
});

describe('osmLocationService', () => {
  const originalFetch = globalThis.fetch;

  beforeEach(() => {
    __resetOsmServiceStateForTests();
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
    jest.useRealTimers();
    jest.clearAllMocks();
  });

  describe('formatDistance', () => {
    it('formats meters and kilometres', () => {
      expect(formatDistance(450)).toBe('450 ม.');
      expect(formatDistance(2450)).toBe('2.5 กม.');
    });
  });

  describe('getNearbyPlaces', () => {
    it('queries Overpass with the selected radius and sorts valid in-radius places nearest first', async () => {
      globalThis.fetch = jest.fn().mockResolvedValue(
        response({
          elements: [
            {
              type: 'way',
              id: 20,
              center: {lat: 13.748, lon: 100.54},
              tags: {name: 'Far Cafe', amenity: 'cafe'},
            },
            {
              type: 'node',
              id: 10,
              lat: 13.7404,
              lon: 100.5302,
              tags: {name: 'Near Cafe', amenity: 'cafe'},
            },
            {
              type: 'node',
              id: 30,
              lat: 13.9,
              lon: 100.7,
              tags: {name: 'Outside Radius', amenity: 'restaurant'},
            },
            {
              type: 'node',
              id: 40,
              lat: 'bad',
              lon: 100.53,
              tags: {name: 'Invalid', shop: 'convenience'},
            },
          ],
        }),
      );

      const places = await getNearbyPlaces([100.53, 13.74], 3000);

      expect(globalThis.fetch).toHaveBeenCalledTimes(1);
      const [url, init] = (globalThis.fetch as jest.Mock).mock.calls[0];
      expect(url).toContain('overpass-api.de/api/interpreter');
      const query = decodeURIComponent(String(init.body).replace(/^data=/, ''));
      expect(query).toContain('nwr(around:3000,13.74,100.53)');
      expect(query).toContain('out center tags');
      expect(places.map(place => place.name)).toEqual(['Near Cafe', 'Far Cafe']);
      expect(places[0].id).toBe('node/10');
      expect(places[0].distanceMeters).toBeLessThan(places[1].distanceMeters!);
    });

    it('supports only bounded 1/3/5 km radii and never falls back farther', async () => {
      globalThis.fetch = jest.fn();

      await expect(getNearbyPlaces([100.53, 13.74], 30000)).rejects.toMatchObject({
        code: 'invalid_input',
      });
      expect(globalThis.fetch).not.toHaveBeenCalled();
    });

    it('caches for repeated calls and reuses an in-flight request', async () => {
      let resolveFetch!: (value: unknown) => void;
      globalThis.fetch = jest.fn().mockImplementation(
        () => new Promise(resolve => (resolveFetch = resolve)),
      );

      const first = getNearbyPlaces([100.53, 13.74], 1000);
      const second = getNearbyPlaces([100.53, 13.74], 1000);
      await Promise.resolve();
      expect(globalThis.fetch).toHaveBeenCalledTimes(1);

      resolveFetch(response({elements: []}));
      await expect(Promise.all([first, second])).resolves.toEqual([[], []]);
      await getNearbyPlaces([100.53, 13.74], 1000);
      expect(globalThis.fetch).toHaveBeenCalledTimes(1);
    });

    it('lets an aborted caller stop waiting without poisoning the shared request', async () => {
      let resolveFetch!: (value: unknown) => void;
      globalThis.fetch = jest.fn().mockImplementation(
        () => new Promise(resolve => (resolveFetch = resolve)),
      );
      const controller = new AbortController();

      const aborted = getNearbyPlaces([100.53, 13.74], 1000, controller.signal);
      const survivor = getNearbyPlaces([100.53, 13.74], 1000);
      controller.abort();

      await expect(aborted).rejects.toMatchObject({code: 'aborted'});
      resolveFetch(response({elements: []}));
      await expect(survivor).resolves.toEqual([]);
    });

    it('starts a fresh same-key request immediately after the only caller aborts', async () => {
      globalThis.fetch = jest
        .fn()
        .mockImplementationOnce((_url, init: RequestInit) =>
          new Promise((_resolve, reject) => {
            init.signal?.addEventListener(
              'abort',
              () => reject(Object.assign(new Error('aborted'), {name: 'AbortError'})),
              {once: true},
            );
          }),
        )
        .mockResolvedValueOnce(response({elements: []}));
      const controller = new AbortController();
      const first = getNearbyPlaces([100.53, 13.74], 1000, controller.signal);
      await Promise.resolve();

      controller.abort();
      await expect(first).rejects.toMatchObject({code: 'aborted'});
      await expect(getNearbyPlaces([100.53, 13.74], 1000)).resolves.toEqual([]);

      expect(globalThis.fetch).toHaveBeenCalledTimes(2);
    });

    it('fails after the 12 second timeout with a retry-friendly typed error', async () => {
      jest.useFakeTimers();
      globalThis.fetch = jest.fn().mockImplementation(() => new Promise(() => {}));

      const pending = getNearbyPlaces([100.53, 13.74], 1000);
      const advance = jest.advanceTimersByTimeAsync(12000);
      await expect(pending).rejects.toEqual(
        expect.objectContaining({code: 'timeout', retryable: true}),
      );
      await advance;
    });

    it.each([429, 503])('maps HTTP %s to a retry-friendly typed error', async status => {
      globalThis.fetch = jest.fn().mockResolvedValue(response({}, status));

      await expect(getNearbyPlaces([100.53, 13.74], 1000)).rejects.toEqual(
        expect.objectContaining({retryable: true, status}),
      );
    });
  });

  describe('searchPlaces', () => {
    it('returns matching cached nearby inventory without a Nominatim request', async () => {
      globalThis.fetch = jest.fn().mockResolvedValue(
        response({
          elements: [
            {
              type: 'node',
              id: 1,
              lat: 13.7402,
              lon: 100.5301,
              tags: {name: 'Cat Coffee', amenity: 'cafe'},
            },
          ],
        }),
      );
      await getNearbyPlaces([100.53, 13.74], 1000);

      const places = await searchPlaces('cat', {
        userCoords: [100.53, 13.74],
        radiusMeters: 1000,
      });

      expect(places.map(place => place.name)).toEqual(['Cat Coffee']);
      expect(globalThis.fetch).toHaveBeenCalledTimes(1);
    });

    it('uses a bounded Nominatim viewbox, filters radius, dedupes and ranks nearest matches', async () => {
      globalThis.fetch = jest.fn().mockResolvedValue(
        response([
          {
            place_id: 1,
            osm_type: 'node',
            osm_id: 100,
            name: 'Cat Cafe Far',
            display_name: 'Cat Cafe Far, Bangkok',
            lat: '13.746',
            lon: '100.535',
            type: 'cafe',
          },
          {
            place_id: 2,
            osm_type: 'node',
            osm_id: 101,
            name: 'Cat Cafe Near',
            display_name: 'Cat Cafe Near, Bangkok',
            lat: '13.7402',
            lon: '100.5301',
            type: 'cafe',
          },
          {
            place_id: 3,
            osm_type: 'node',
            osm_id: 101,
            name: 'Cat Cafe Near duplicate',
            display_name: 'Cat Cafe Near duplicate, Bangkok',
            lat: '13.7402',
            lon: '100.5301',
          },
          {
            place_id: 4,
            name: 'Outside',
            display_name: 'Outside, Bangkok',
            lat: '13.9',
            lon: '100.7',
          },
          {
            place_id: 5,
            display_name: 'Invalid',
            lat: 'NaN',
            lon: '100.53',
          },
        ]),
      );

      const places = await searchPlaces('cat cafe', {
        userCoords: [100.53, 13.74],
        radiusMeters: 1000,
      });

      const [url] = (globalThis.fetch as jest.Mock).mock.calls[0];
      expect(url).toContain('bounded=1');
      expect(url).toContain('viewbox=');
      expect(places.map(place => place.name)).toEqual(['Cat Cafe Near', 'Cat Cafe Far']);
      expect(places).toHaveLength(2);
    });

    it('returns empty results without a far-distance fallback', async () => {
      globalThis.fetch = jest.fn().mockResolvedValue(
        response([
          {
            place_id: 1,
            name: 'Far Away',
            display_name: 'Far Away',
            lat: '7.008',
            lon: '100.476',
          },
        ]),
      );

      await expect(
        searchPlaces('far', {
          userCoords: [100.53, 13.74],
          radiusMeters: 5000,
        }),
      ).resolves.toEqual([]);
    });

    it('caches identical submitted searches', async () => {
      globalThis.fetch = jest.fn().mockResolvedValue(response([]));
      const options = {userCoords: [100.53, 13.74] as [number, number], radiusMeters: 1000};

      await searchPlaces('unique query', options);
      await searchPlaces('unique query', options);

      expect(globalThis.fetch).toHaveBeenCalledTimes(1);
    });

    it('queues public Nominatim submissions at no more than one request per second', async () => {
      jest.useFakeTimers({now: 10_000});
      globalThis.fetch = jest.fn().mockResolvedValue(response([]));
      const options = {userCoords: [100.53, 13.74] as [number, number], radiusMeters: 1000};

      const first = searchPlaces('first query', options);
      const second = searchPlaces('second query', options);
      await jest.advanceTimersByTimeAsync(0);
      expect(globalThis.fetch).toHaveBeenCalledTimes(1);

      await jest.advanceTimersByTimeAsync(999);
      expect(globalThis.fetch).toHaveBeenCalledTimes(1);
      await jest.advanceTimersByTimeAsync(1);
      expect(globalThis.fetch).toHaveBeenCalledTimes(2);
      await expect(Promise.all([first, second])).resolves.toEqual([[], []]);
    });
  });

  describe('reverseGeocodeLocation', () => {
    it('requests the configured Nominatim reverse endpoint and prefers the Thai name', async () => {
      globalThis.fetch = jest.fn().mockResolvedValue(
        response({
          namedetails: {'name:th': '  สวนสิริกิติ์  '},
          name: 'Queen Sirikit Park',
          address: {park: 'สวนสิริกิติ์'},
          display_name: 'สวนสิริกิติ์, จตุจักร, กรุงเทพมหานคร',
        }),
      );

      await expect(
        reverseGeocodeLocation([100.5503, 13.8054]),
      ).resolves.toBe('สวนสิริกิติ์');

      expect(globalThis.fetch).toHaveBeenCalledTimes(1);
      const [rawUrl, init] = (globalThis.fetch as jest.Mock).mock.calls[0];
      const url = new URL(String(rawUrl));
      expect(url.origin + url.pathname).toContain(
        'nominatim.openstreetmap.org/reverse',
      );
      expect(Object.fromEntries(url.searchParams.entries())).toMatchObject({
        format: 'jsonv2',
        lat: '13.8054',
        lon: '100.5503',
        zoom: '18',
        addressdetails: '1',
        namedetails: '1',
      });
      expect(init).toMatchObject({method: 'GET'});
    });

    it('caches repeated coordinates', async () => {
      globalThis.fetch = jest.fn().mockResolvedValue(
        response({address: {park: 'สวนสิริกิติ์'}}),
      );

      await expect(
        reverseGeocodeLocation([100.5503, 13.8054]),
      ).resolves.toBe('สวนสิริกิติ์');
      await expect(
        reverseGeocodeLocation([100.5503, 13.8054]),
      ).resolves.toBe('สวนสิริกิติ์');

      expect(globalThis.fetch).toHaveBeenCalledTimes(1);
    });

    it.each([
      {coords: [Infinity, 13.8054] as [number, number]},
      {coords: [100.5503, NaN] as [number, number]},
      {coords: [181, 13.8054] as [number, number]},
      {coords: [100.5503, 91] as [number, number]},
    ])('returns null for invalid coordinates %# without fetching', async ({coords}) => {
      globalThis.fetch = jest.fn();

      await expect(reverseGeocodeLocation(coords)).resolves.toBeNull();

      expect(globalThis.fetch).not.toHaveBeenCalled();
    });
  });
  describe('getWalkingRoute', () => {
    it('uses the configured routed-foot backend and parses a valid route', async () => {
      globalThis.fetch = jest.fn().mockResolvedValue(
        response({
          code: 'Ok',
          routes: [
            {
              distance: 1250.5,
              duration: 900.2,
              geometry: {
                coordinates: [
                  [100.5315, 13.7445],
                  [100.5347, 13.7462],
                ],
              },
            },
          ],
        }),
      );

      const route = await getWalkingRoute(
        [100.5315, 13.7445],
        [100.5347, 13.7462],
      );

      const [url] = (globalThis.fetch as jest.Mock).mock.calls[0];
      expect(url).toContain('routing.openstreetmap.de/routed-foot/route/v1/foot');
      expect(route).toEqual({
        coordinates: [
          [100.5315, 13.7445],
          [100.5347, 13.7462],
        ],
        distanceMeters: 1251,
        durationSeconds: 900,
      });
    });

    it.each([
      {code: 'NoRoute', routes: []},
      {code: 'Ok', routes: [{distance: 10, duration: 5, geometry: {coordinates: [[100, 13]]}}]},
      {code: 'Ok', routes: [{distance: 10, duration: 5, geometry: {coordinates: [[100, 13], [NaN, 13.1]]}}]},
    ])('returns null for NoRoute or malformed geometry', async payload => {
      globalThis.fetch = jest.fn().mockResolvedValue(response(payload));

      await expect(getWalkingRoute([100, 13], [100.1, 13.1])).resolves.toBeNull();
    });

    it('reuses route cache and rejects invalid coordinates before fetch', async () => {
      globalThis.fetch = jest.fn().mockResolvedValue(
        response({
          code: 'Ok',
          routes: [{distance: 10, duration: 5, geometry: {coordinates: [[100, 13], [100.1, 13.1]]}}],
        }),
      );

      await getWalkingRoute([100, 13], [100.1, 13.1]);
      await getWalkingRoute([100, 13], [100.1, 13.1]);
      await expect(getWalkingRoute([Infinity, 13], [100.1, 13.1])).resolves.toBeNull();

      expect(globalThis.fetch).toHaveBeenCalledTimes(1);
    });

    it('paces distinct route requests to protect the public foot endpoint', async () => {
      jest.useFakeTimers({now: 10_000});
      globalThis.fetch = jest.fn().mockResolvedValue(
        response({
          code: 'Ok',
          routes: [
            {
              distance: 10,
              duration: 5,
              geometry: {coordinates: [[100, 13], [100.1, 13.1]]},
            },
          ],
        }),
      );

      const first = getWalkingRoute([100, 13], [100.1, 13.1]);
      const second = getWalkingRoute([100, 13], [100.2, 13.2]);
      await jest.advanceTimersByTimeAsync(0);
      expect(globalThis.fetch).toHaveBeenCalledTimes(1);

      await jest.advanceTimersByTimeAsync(999);
      expect(globalThis.fetch).toHaveBeenCalledTimes(1);
      await jest.advanceTimersByTimeAsync(1);
      expect(globalThis.fetch).toHaveBeenCalledTimes(2);
      await expect(Promise.all([first, second])).resolves.toHaveLength(2);
    });

    it('surfaces abort and timeout as typed non-route results for the caller to ignore/retry', async () => {
      const controller = new AbortController();
      globalThis.fetch = jest.fn().mockImplementation(() => new Promise(() => {}));
      const aborted = getWalkingRoute([100, 13], [100.1, 13.1], controller.signal);
      controller.abort();
      await expect(aborted).rejects.toMatchObject({code: 'aborted'});
      expect(globalThis.fetch).not.toHaveBeenCalled();

      __resetOsmServiceStateForTests();
      jest.useFakeTimers();
      const timedOut = getWalkingRoute([100, 13], [100.1, 13.1]);
      const advance = jest.advanceTimersByTimeAsync(12000);
      await expect(timedOut).rejects.toMatchObject({code: 'timeout'});
      await advance;
    });
  });

  it('exports typed retry metadata for UI error states', () => {
    const error = new OsmServiceError('unavailable', 'ลองใหม่', true, 503);
    expect(error).toMatchObject({code: 'unavailable', retryable: true, status: 503});
  });
});
