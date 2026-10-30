/**
 * Bounded OpenStreetMap discovery, geocoding, and pedestrian routing.
 * Public endpoints are intentionally rate-limited, cached, and never rotated.
 */

import {OSM_CONFIG} from './osmMapService';
import {haversineDistanceMeters} from './locationUtils';

export interface OsmPlace {
  id: string;
  name: string;
  displayName: string;
  category: string;
  coordinates: [number, number];
  distanceMeters?: number;
}

export interface RoutePreview {
  coordinates: Array<[number, number]>;
  distanceMeters: number;
  durationSeconds: number;
}

export interface SearchPlacesOptions {
  userCoords: [number, number];
  radiusMeters: number;
  signal?: AbortSignal;
}

export type OsmServiceErrorCode =
  | 'aborted'
  | 'invalid_input'
  | 'network'
  | 'rate_limited'
  | 'timeout'
  | 'unavailable'
  | 'invalid_response';

export class OsmServiceError extends Error {
  constructor(
    public readonly code: OsmServiceErrorCode,
    message: string,
    public readonly retryable: boolean,
    public readonly status?: number,
  ) {
    super(message);
    this.name = 'OsmServiceError';
  }
}

const HEADERS = {
  'User-Agent': OSM_CONFIG.userAgent,
  'Accept-Language': 'th,en;q=0.8',
};
const ALLOWED_RADII = new Set([1000, 3000, 5000]);
export const MAX_SEARCH_RADIUS_METERS = 5000;

interface CacheEntry<T> {
  expiresAt: number;
  value: T;
}

interface InFlightEntry<T> {
  controller: AbortController;
  consumers: number;
  promise: Promise<T>;
  settled: boolean;
}

interface OverpassElement {
  type?: string;
  id?: number | string;
  lat?: number | string;
  lon?: number | string;
  center?: {lat?: number | string; lon?: number | string};
  tags?: Record<string, string | undefined>;
}

interface NominatimResult {
  place_id?: number | string;
  osm_type?: string;
  osm_id?: number | string;
  display_name?: string;
  name?: string;
  lat?: string;
  lon?: string;
  type?: string;
  class?: string;
}

interface NominatimReverseResult {
  display_name?: string;
  name?: string;
  namedetails?: Record<string, string | undefined>;
  address?: {
    park?: string;
    attraction?: string;
    amenity?: string;
    tourism?: string;
    building?: string;
    road?: string;
    neighbourhood?: string;
    suburb?: string;
    city?: string;
  };
}

const nearbyCache = new Map<string, CacheEntry<OsmPlace[]>>();
const searchCache = new Map<string, CacheEntry<OsmPlace[]>>();
const reverseCache = new Map<string, CacheEntry<string | null>>();
const routeCache = new Map<string, CacheEntry<RoutePreview>>();
const nearbyInFlight = new Map<string, InFlightEntry<OsmPlace[]>>();
const searchInFlight = new Map<string, InFlightEntry<OsmPlace[]>>();
const routeInFlight = new Map<string, InFlightEntry<RoutePreview | null>>();

let overpassQueue: Promise<unknown> = Promise.resolve();
let nominatimQueue: Promise<unknown> = Promise.resolve();
let routeQueue: Promise<unknown> = Promise.resolve();
let lastNominatimStartedAt = Number.NEGATIVE_INFINITY;
let lastRouteStartedAt = Number.NEGATIVE_INFINITY;

function enqueue<T>(
  service: 'overpass' | 'nominatim' | 'route',
  task: () => Promise<T>,
): Promise<T> {
  const current =
    service === 'overpass'
      ? overpassQueue
      : service === 'nominatim'
        ? nominatimQueue
        : routeQueue;
  const next = current.then(task, task);
  const settled = next.then(
    () => undefined,
    () => undefined,
  );
  if (service === 'overpass') {
    overpassQueue = settled;
  } else if (service === 'nominatim') {
    nominatimQueue = settled;
  } else {
    routeQueue = settled;
  }
  return next;
}

function getCached<T>(cache: Map<string, CacheEntry<T>>, key: string): T | undefined {
  const entry = cache.get(key);
  if (!entry) {
    return undefined;
  }
  if (entry.expiresAt <= Date.now()) {
    cache.delete(key);
    return undefined;
  }
  return entry.value;
}

function setCached<T>(cache: Map<string, CacheEntry<T>>, key: string, value: T): T {
  cache.set(key, {expiresAt: Date.now() + OSM_CONFIG.cacheTtlMs, value});
  return value;
}

function abortError(): OsmServiceError {
  return new OsmServiceError('aborted', 'ยกเลิกคำขอแล้ว', false);
}

function consumeInFlight<T>(
  entry: InFlightEntry<T>,
  signal?: AbortSignal,
): Promise<T> {
  entry.consumers += 1;
  return new Promise<T>((resolve, reject) => {
    let released = false;
    const release = () => {
      if (released) {
        return;
      }
      released = true;
      entry.consumers -= 1;
      if (entry.consumers === 0 && !entry.settled) {
        entry.controller.abort();
      }
    };
    const cleanup = () => signal?.removeEventListener('abort', onAbort);
    const onAbort = () => {
      cleanup();
      release();
      reject(abortError());
    };
    if (signal?.aborted) {
      onAbort();
      return;
    }
    signal?.addEventListener('abort', onAbort, {once: true});
    entry.promise.then(
      value => {
        cleanup();
        release();
        resolve(value);
      },
      error => {
        cleanup();
        release();
        reject(error);
      },
    );
  });
}

function resolvedWithAbort<T>(value: T, signal?: AbortSignal): Promise<T> {
  return signal?.aborted ? Promise.reject(abortError()) : Promise.resolve(value);
}

function serviceHttpError(status: number): OsmServiceError {
  if (status === 429) {
    return new OsmServiceError(
      'rate_limited',
      'ระบบแผนที่กำลังจำกัดคำขอ โปรดรอสักครู่แล้วลองใหม่',
      true,
      status,
    );
  }
  if (status === 503) {
    return new OsmServiceError(
      'unavailable',
      'บริการแผนที่ไม่พร้อมชั่วคราว โปรดลองใหม่',
      true,
      status,
    );
  }
  return new OsmServiceError(
    'network',
    'บริการแผนที่ตอบกลับผิดปกติ (' + status + ')',
    status >= 500,
    status,
  );
}

async function fetchJson<T>(
  url: string,
  init: RequestInit,
  serviceLabel: string,
  cancellationSignal?: AbortSignal,
): Promise<T> {
  const controller = new AbortController();
  let timer: ReturnType<typeof setTimeout> | undefined;
  let removeCancellationListener: () => void = () => {};
  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(() => {
      controller.abort();
      reject(
        new OsmServiceError(
          'timeout',
          serviceLabel + 'ใช้เวลานานเกินไป โปรดลองใหม่',
          true,
        ),
      );
    }, OSM_CONFIG.requestTimeoutMs);
  });
  const cancellation = new Promise<never>((_, reject) => {
    const onAbort = () => {
      controller.abort();
      reject(abortError());
    };
    if (cancellationSignal?.aborted) {
      onAbort();
      return;
    }
    cancellationSignal?.addEventListener('abort', onAbort, {once: true});
    removeCancellationListener = () =>
      cancellationSignal?.removeEventListener('abort', onAbort);
  });

  try {
    const fetchPromise = fetch(url, {...init, signal: controller.signal}).then(
      async response => {
        if (!response.ok) {
          throw serviceHttpError(response.status);
        }
        return (await response.json()) as T;
      },
    );
    return await Promise.race([fetchPromise, timeout, cancellation]);
  } catch (error) {
    if (error instanceof OsmServiceError) {
      throw error;
    }
    throw new OsmServiceError(
      'network',
      'เชื่อมต่อ' + serviceLabel + 'ไม่ได้ โปรดลองใหม่',
      true,
    );
  } finally {
    if (timer !== undefined) {
      clearTimeout(timer);
    }
    removeCancellationListener();
  }
}

function validateCoords(coords: [number, number]): boolean {
  const [longitude, latitude] = coords;
  return (
    Number.isFinite(longitude) &&
    Number.isFinite(latitude) &&
    longitude >= -180 &&
    longitude <= 180 &&
    latitude >= -90 &&
    latitude <= 90
  );
}

function validateRadius(radiusMeters: number): void {
  if (!ALLOWED_RADII.has(radiusMeters)) {
    throw new OsmServiceError(
      'invalid_input',
      'รองรับรัศมี 1, 3 หรือ 5 กิโลเมตรเท่านั้น',
      false,
    );
  }
}

function assertSearchArea(coords: [number, number], radiusMeters: number): void {
  if (!validateCoords(coords)) {
    throw new OsmServiceError('invalid_input', 'พิกัดไม่ถูกต้อง', false);
  }
  validateRadius(radiusMeters);
}

function distanceFrom(
  userCoords: [number, number],
  longitude: number,
  latitude: number,
): number {
  return Math.round(
    haversineDistanceMeters(
      {latitude: userCoords[1], longitude: userCoords[0]},
      {latitude, longitude},
    ),
  );
}

function areaKey(coords: [number, number], radiusMeters: number): string {
  return coords[0].toFixed(4) + ',' + coords[1].toFixed(4) + ':' + radiusMeters;
}

function routeKey(from: [number, number], to: [number, number]): string {
  return (
    from[0].toFixed(5) +
    ',' +
    from[1].toFixed(5) +
    ':' +
    to[0].toFixed(5) +
    ',' +
    to[1].toFixed(5)
  );
}

function normalizeText(value: string): string {
  return value.trim().toLocaleLowerCase().replace(/\s+/g, ' ');
}

function sortByDistance(places: OsmPlace[]): OsmPlace[] {
  return [...places].sort(
    (a, b) => (a.distanceMeters ?? Infinity) - (b.distanceMeters ?? Infinity),
  );
}

function dedupePlaces(places: OsmPlace[]): OsmPlace[] {
  const unique: OsmPlace[] = [];
  const ids = new Set<string>();
  for (const place of places) {
    if (ids.has(place.id)) {
      continue;
    }
    const normalizedName = normalizeText(place.name);
    const duplicate = unique.some(
      existing =>
        normalizeText(existing.name) === normalizedName &&
        haversineDistanceMeters(
          {latitude: existing.coordinates[1], longitude: existing.coordinates[0]},
          {latitude: place.coordinates[1], longitude: place.coordinates[0]},
        ) <= 25,
    );
    if (!duplicate) {
      ids.add(place.id);
      unique.push(place);
    }
  }
  return unique;
}

function parseOverpassPlaces(
  payload: {elements?: OverpassElement[]},
  userCoords: [number, number],
  radiusMeters: number,
): OsmPlace[] {
  if (!Array.isArray(payload?.elements)) {
    throw new OsmServiceError(
      'invalid_response',
      'ข้อมูลร้านใกล้ตัวไม่ถูกต้อง โปรดลองใหม่',
      true,
    );
  }

  const places: OsmPlace[] = [];
  for (const item of payload.elements) {
    const latitude = Number(item.lat ?? item.center?.lat);
    const longitude = Number(item.lon ?? item.center?.lon);
    const tags = item.tags ?? {};
    const name = tags['name:th'] || tags.name || tags.brand || tags.operator;
    if (
      !name ||
      !item.type ||
      item.id === undefined ||
      !validateCoords([longitude, latitude])
    ) {
      continue;
    }
    const distanceMeters = distanceFrom(userCoords, longitude, latitude);
    if (distanceMeters > radiusMeters) {
      continue;
    }
    places.push({
      id: item.type + '/' + item.id,
      name,
      displayName: name,
      category: tags.amenity || tags.shop || 'place',
      coordinates: [longitude, latitude],
      distanceMeters,
    });
  }
  return sortByDistance(dedupePlaces(places));
}

function buildOverpassQuery(
  userCoords: [number, number],
  radiusMeters: number,
): string {
  const [longitude, latitude] = userCoords;
  return (
    '[out:json][timeout:12];\n(\n  nwr(around:' +
    radiusMeters +
    ',' +
    latitude +
    ',' +
    longitude +
    ')[amenity~"^(cafe|restaurant|fast_food)$"];\n  nwr(around:' +
    radiusMeters +
    ',' +
    latitude +
    ',' +
    longitude +
    ')[shop="convenience"];\n);\nout center tags;'
  );
}

export function formatDistance(distanceMeters: number): string {
  if (distanceMeters < 1000) {
    return Math.round(distanceMeters) + ' ม.';
  }
  return (distanceMeters / 1000).toFixed(1) + ' กม.';
}

export function getNearbyPlaces(
  userCoords: [number, number],
  radiusMeters: number,
  signal?: AbortSignal,
): Promise<OsmPlace[]> {
  try {
    assertSearchArea(userCoords, radiusMeters);
  } catch (error) {
    return Promise.reject(error);
  }
  const key = areaKey(userCoords, radiusMeters);
  const cached = getCached(nearbyCache, key);
  if (cached !== undefined) {
    return resolvedWithAbort(cached, signal);
  }

  let entry = nearbyInFlight.get(key);
  if (entry?.controller.signal.aborted && !entry.settled) {
    nearbyInFlight.delete(key);
    entry = undefined;
  }
  if (!entry) {
    const controller = new AbortController();
    const promise = enqueue('overpass', async () => {
      const payload = await fetchJson<{elements?: OverpassElement[]}>(
        OSM_CONFIG.overpassUrl,
        {
          method: 'POST',
          headers: {
            ...HEADERS,
            'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8',
          },
          body: 'data=' + encodeURIComponent(buildOverpassQuery(userCoords, radiusMeters)),
        },
        'บริการร้านใกล้ตัว',
        controller.signal,
      );
      return setCached(
        nearbyCache,
        key,
        parseOverpassPlaces(payload, userCoords, radiusMeters),
      );
    });
    entry = {controller, consumers: 0, promise, settled: false};
    const createdEntry = entry;
    nearbyInFlight.set(key, createdEntry);
    promise.then(
      () => (createdEntry.settled = true),
      () => (createdEntry.settled = true),
    );
    promise
      .finally(() => {
        if (nearbyInFlight.get(key) === createdEntry) {
          nearbyInFlight.delete(key);
        }
      })
      .catch(() => undefined);
  }
  return consumeInFlight(entry, signal);
}

function viewboxFor(
  userCoords: [number, number],
  radiusMeters: number,
): string {
  const [longitude, latitude] = userCoords;
  const latitudeDelta = radiusMeters / 111_320;
  const longitudeScale = Math.max(Math.cos((latitude * Math.PI) / 180), 0.1);
  const longitudeDelta = radiusMeters / (111_320 * longitudeScale);
  return [
    longitude - longitudeDelta,
    latitude + latitudeDelta,
    longitude + longitudeDelta,
    latitude - latitudeDelta,
  ].join(',');
}

function rankPlaces(places: OsmPlace[], query: string): OsmPlace[] {
  const normalizedQuery = normalizeText(query);
  const score = (place: OsmPlace): number => {
    const name = normalizeText(place.name);
    if (name === normalizedQuery) {
      return 0;
    }
    if (name.startsWith(normalizedQuery)) {
      return 1;
    }
    if (name.includes(normalizedQuery)) {
      return 2;
    }
    return 3;
  };
  return [...places].sort(
    (a, b) =>
      score(a) - score(b) ||
      (a.distanceMeters ?? Infinity) - (b.distanceMeters ?? Infinity),
  );
}

function parseNominatimPlaces(
  payload: NominatimResult[],
  query: string,
  userCoords: [number, number],
  radiusMeters: number,
): OsmPlace[] {
  if (!Array.isArray(payload)) {
    throw new OsmServiceError(
      'invalid_response',
      'ผลค้นหาสถานที่ไม่ถูกต้อง โปรดลองใหม่',
      true,
    );
  }
  const places: OsmPlace[] = [];
  for (const item of payload) {
    const latitude = Number(item.lat);
    const longitude = Number(item.lon);
    if (!validateCoords([longitude, latitude])) {
      continue;
    }
    const distanceMeters = distanceFrom(userCoords, longitude, latitude);
    if (distanceMeters > radiusMeters) {
      continue;
    }
    const displayName = item.display_name?.trim();
    if (!displayName) {
      continue;
    }
    const name = item.name?.trim() || displayName.split(',')[0]?.trim() || 'สถานที่ที่พบ';
    const id =
      item.osm_type && item.osm_id !== undefined
        ? item.osm_type + '/' + item.osm_id
        : 'nominatim/' + (item.place_id ?? longitude + ',' + latitude);
    places.push({
      id,
      name,
      displayName,
      category: item.type || item.class || 'place',
      coordinates: [longitude, latitude],
      distanceMeters,
    });
  }
  return rankPlaces(dedupePlaces(places), query);
}

function cachedNearbyMatches(
  query: string,
  userCoords: [number, number],
  radiusMeters: number,
): OsmPlace[] {
  const inventory = getCached(nearbyCache, areaKey(userCoords, radiusMeters));
  if (!inventory) {
    return [];
  }
  const normalizedQuery = normalizeText(query);
  return rankPlaces(
    inventory.filter(place =>
      normalizeText(place.name + ' ' + place.displayName).includes(normalizedQuery),
    ),
    query,
  );
}

function wait(milliseconds: number): Promise<void> {
  if (milliseconds <= 0) {
    return Promise.resolve();
  }
  return new Promise(resolve => setTimeout(resolve, milliseconds));
}

export function searchPlaces(
  query: string,
  options: SearchPlacesOptions,
): Promise<OsmPlace[]> {
  const trimmed = query.trim();
  if (!trimmed) {
    return Promise.resolve([]);
  }
  try {
    assertSearchArea(options.userCoords, options.radiusMeters);
  } catch (error) {
    return Promise.reject(error);
  }

  const localMatches = cachedNearbyMatches(
    trimmed,
    options.userCoords,
    options.radiusMeters,
  );
  if (localMatches.length > 0) {
    return resolvedWithAbort(localMatches, options.signal);
  }

  const key =
    normalizeText(trimmed) + ':' + areaKey(options.userCoords, options.radiusMeters);
  const cached = getCached(searchCache, key);
  if (cached !== undefined) {
    return resolvedWithAbort(cached, options.signal);
  }

  let entry = searchInFlight.get(key);
  if (entry?.controller.signal.aborted && !entry.settled) {
    searchInFlight.delete(key);
    entry = undefined;
  }
  if (!entry) {
    const controller = new AbortController();
    const promise = enqueue('nominatim', async () => {
      if (controller.signal.aborted) {
        throw abortError();
      }
      const waitMs = Math.max(
        0,
        OSM_CONFIG.nominatimMinimumIntervalMs -
          (Date.now() - lastNominatimStartedAt),
      );
      await wait(waitMs);
      if (controller.signal.aborted) {
        throw abortError();
      }
      lastNominatimStartedAt = Date.now();
      const params = new URLSearchParams({
        format: 'jsonv2',
        q: trimmed,
        limit: '15',
        addressdetails: '1',
        countrycodes: 'th',
        viewbox: viewboxFor(options.userCoords, options.radiusMeters),
        bounded: '1',
      });
      const payload = await fetchJson<NominatimResult[]>(
        OSM_CONFIG.nominatimUrl + '/search?' + params.toString(),
        {method: 'GET', headers: HEADERS},
        'บริการค้นหาสถานที่',
        controller.signal,
      );
      return setCached(
        searchCache,
        key,
        parseNominatimPlaces(
          payload,
          trimmed,
          options.userCoords,
          options.radiusMeters,
        ),
      );
    });
    entry = {controller, consumers: 0, promise, settled: false};
    const createdEntry = entry;
    searchInFlight.set(key, createdEntry);
    promise.then(
      () => (createdEntry.settled = true),
      () => (createdEntry.settled = true),
    );
    promise
      .finally(() => {
        if (searchInFlight.get(key) === createdEntry) {
          searchInFlight.delete(key);
        }
      })
      .catch(() => undefined);
  }
  return consumeInFlight(entry, options.signal);
}

function reverseKey(coords: [number, number]): string {
  return coords[0].toFixed(6) + ',' + coords[1].toFixed(6);
}

function trimmedLabel(value: string | undefined): string | null {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

function parseReverseLocation(payload: NominatimReverseResult): string | null {
  const address = payload?.address;
  const candidates = [
    payload?.namedetails?.['name:th'],
    payload?.name,
    address?.park,
    address?.attraction,
    address?.amenity,
    address?.tourism,
    address?.building,
    address?.road,
    address?.neighbourhood,
    address?.suburb,
    address?.city,
    payload?.display_name?.split(',')[0],
  ];
  for (const candidate of candidates) {
    const label = trimmedLabel(candidate);
    if (label) {
      return label;
    }
  }
  return null;
}

export function reverseGeocodeLocation(
  coords: [number, number],
  signal?: AbortSignal,
): Promise<string | null> {
  if (!validateCoords(coords)) {
    return Promise.resolve(null);
  }
  const key = reverseKey(coords);
  const cached = getCached(reverseCache, key);
  if (cached !== undefined) {
    return resolvedWithAbort(cached, signal);
  }

  return enqueue('nominatim', async () => {
    if (signal?.aborted) {
      throw abortError();
    }
    const waitMs = Math.max(
      0,
      OSM_CONFIG.nominatimMinimumIntervalMs -
        (Date.now() - lastNominatimStartedAt),
    );
    await wait(waitMs);
    if (signal?.aborted) {
      throw abortError();
    }
    lastNominatimStartedAt = Date.now();
    const params = new URLSearchParams({
      format: 'jsonv2',
      lat: String(coords[1]),
      lon: String(coords[0]),
      zoom: '18',
      addressdetails: '1',
      namedetails: '1',
    });
    const payload = await fetchJson<NominatimReverseResult>(
      OSM_CONFIG.nominatimUrl + '/reverse?' + params.toString(),
      {method: 'GET', headers: HEADERS},
      'บริการระบุชื่อสถานที่',
      signal,
    );
    return setCached(reverseCache, key, parseReverseLocation(payload));
  });
}
function validRouteGeometry(value: unknown): value is Array<[number, number]> {
  return (
    Array.isArray(value) &&
    value.length >= 2 &&
    value.every(
      point =>
        Array.isArray(point) &&
        point.length >= 2 &&
        validateCoords([Number(point[0]), Number(point[1])]),
    )
  );
}

export function getWalkingRoute(
  fromLngLat: [number, number],
  toLngLat: [number, number],
  signal?: AbortSignal,
): Promise<RoutePreview | null> {
  if (!validateCoords(fromLngLat) || !validateCoords(toLngLat)) {
    return Promise.resolve(null);
  }
  const key = routeKey(fromLngLat, toLngLat);
  const cached = getCached(routeCache, key);
  if (cached !== undefined) {
    return resolvedWithAbort(cached, signal);
  }

  let entry = routeInFlight.get(key);
  if (entry?.controller.signal.aborted && !entry.settled) {
    routeInFlight.delete(key);
    entry = undefined;
  }
  if (!entry) {
    const controller = new AbortController();
    const promise = enqueue('route', async () => {
      if (controller.signal.aborted) {
        throw abortError();
      }
      const waitMs = Math.max(
        0,
        OSM_CONFIG.routeMinimumIntervalMs - (Date.now() - lastRouteStartedAt),
      );
      await wait(waitMs);
      if (controller.signal.aborted) {
        throw abortError();
      }
      lastRouteStartedAt = Date.now();
      const coordinates =
        fromLngLat[0] +
        ',' +
        fromLngLat[1] +
        ';' +
        toLngLat[0] +
        ',' +
        toLngLat[1];
      const payload = await fetchJson<{
        code?: string;
        routes?: Array<{
          distance?: number;
          duration?: number;
          geometry?: {coordinates?: unknown};
        }>;
      }>(
        OSM_CONFIG.footRoutingUrl +
          '/' +
          coordinates +
          '?overview=full&geometries=geojson&steps=false',
        {method: 'GET', headers: HEADERS},
        'บริการคำนวณเส้นทางเดิน',
        controller.signal,
      );
      if (payload.code === 'NoRoute') {
        return null;
      }
      const route = payload.code === 'Ok' ? payload.routes?.[0] : undefined;
      const geometry = route?.geometry?.coordinates;
      if (
        !route ||
        !validRouteGeometry(geometry) ||
        !Number.isFinite(route.distance) ||
        !Number.isFinite(route.duration) ||
        Number(route.distance) < 0 ||
        Number(route.duration) < 0
      ) {
        return null;
      }
      const preview: RoutePreview = {
        coordinates: geometry.map(point => [Number(point[0]), Number(point[1])]),
        distanceMeters: Math.round(Number(route.distance)),
        durationSeconds: Math.round(Number(route.duration)),
      };
      return setCached(routeCache, key, preview);
    });
    entry = {controller, consumers: 0, promise, settled: false};
    const createdEntry = entry;
    routeInFlight.set(key, createdEntry);
    promise.then(
      () => (createdEntry.settled = true),
      () => (createdEntry.settled = true),
    );
    promise
      .finally(() => {
        if (routeInFlight.get(key) === createdEntry) {
          routeInFlight.delete(key);
        }
      })
      .catch(() => undefined);
  }
  return consumeInFlight(entry, signal);
}

export function __resetOsmServiceStateForTests(): void {
  nearbyCache.clear();
  searchCache.clear();
  reverseCache.clear();
  routeCache.clear();
  nearbyInFlight.clear();
  searchInFlight.clear();
  routeInFlight.clear();
  overpassQueue = Promise.resolve();
  nominatimQueue = Promise.resolve();
  routeQueue = Promise.resolve();
  lastNominatimStartedAt = Number.NEGATIVE_INFINITY;
  lastRouteStartedAt = Number.NEGATIVE_INFINITY;
}
