import {
  formatDistance,
  searchPlaces,
  getWalkingRoute,
} from '../src/services/osmLocationService';

describe('osmLocationService', () => {
  const originalFetch = globalThis.fetch;

  afterEach(() => {
    globalThis.fetch = originalFetch;
    jest.clearAllMocks();
  });

  describe('formatDistance', () => {
    it('formats distances under 1000m in meters', () => {
      expect(formatDistance(450)).toBe('450 ม.');
      expect(formatDistance(85.4)).toBe('85 ม.');
      expect(formatDistance(0)).toBe('0 ม.');
    });

    it('formats distances >= 1000m in kilometers', () => {
      expect(formatDistance(1000)).toBe('1.0 กม.');
      expect(formatDistance(2450)).toBe('2.5 กม.');
      expect(formatDistance(12800)).toBe('12.8 กม.');
    });
  });

  describe('searchPlaces', () => {
    it('returns empty array for empty or whitespace query without network call', async () => {
      const mockFetch = jest.fn();
      globalThis.fetch = mockFetch;

      const results = await searchPlaces('   ');
      expect(results).toEqual([]);
      expect(mockFetch).not.toHaveBeenCalled();
    });

    it('parses and validates valid Nominatim places', async () => {
      const mockData = [
        {
          place_id: 101,
          name: 'Siam Paragon',
          display_name: 'Siam Paragon, Rama I Road, Pathum Wan, Bangkok',
          lat: '13.7462',
          lon: '100.5347',
          type: 'mall',
        },
        {
          place_id: 102,
          display_name: 'Lumpini Park, Pathum Wan, Bangkok',
          lat: '13.7314',
          lon: '100.5417',
          type: 'park',
        },
      ];

      globalThis.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: async () => mockData,
      });

      const results = await searchPlaces('siam');
      expect(results).toHaveLength(2);
      expect(results[0]).toEqual({
        id: '101',
        name: 'Siam Paragon',
        displayName: 'Siam Paragon, Rama I Road, Pathum Wan, Bangkok',
        category: 'mall',
        coordinates: [100.5347, 13.7462],
      });
      expect(results[1].name).toBe('Lumpini Park');
      expect(results[1].coordinates).toEqual([100.5417, 13.7314]);
    });

    it('handles HTTP 429 rate limit gracefully with user-friendly error', async () => {
      globalThis.fetch = jest.fn().mockResolvedValue({
        ok: false,
        status: 429,
      });

      await expect(searchPlaces('bkk')).rejects.toThrow(
        'ระบบค้นหากำลังจำกัดคำขอ โปรดรอสักครู่แล้วลองใหม่',
      );
    });

    it('filters out invalid coordinate items', async () => {
      const mockData = [
        {
          place_id: 999,
          display_name: 'Corrupt Place',
          lat: 'not-a-number',
          lon: 'invalid',
        },
      ];

      globalThis.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: async () => mockData,
      });

      const results = await searchPlaces('invalid');
      expect(results).toEqual([]);
    });

    it('biases to user location and sorts nearest place first when userCoords is provided', async () => {
      const userCoords: [number, number] = [100.53, 13.74]; // Siam area

      // 3 branches returned in arbitrary order from OSM:
      // Branch 1: Rama 9 (~4 km away)
      // Branch 2: MBK (~200 m away)
      // Branch 3: Bang Na (~15 km away)
      const mockBranches = [
        {
          place_id: 1,
          name: 'KFC Rama 9',
          display_name: 'KFC, Rama IX Road, Huai Khwang, Bangkok',
          lat: '13.757',
          lon: '100.565',
        },
        {
          place_id: 2,
          name: 'KFC MBK Center',
          display_name: 'KFC, MBK Center, Pathum Wan, Bangkok',
          lat: '13.744',
          lon: '100.531',
        },
        {
          place_id: 3,
          name: 'KFC Bangna',
          display_name: 'KFC, Bang Na-Trat Road, Bang Na, Bangkok',
          lat: '13.668',
          lon: '100.635',
        },
      ];

      const mockFetch = jest.fn().mockResolvedValue({
        ok: true,
        json: async () => mockBranches,
      });
      globalThis.fetch = mockFetch;

      const results = await searchPlaces('KFC', { userCoords });

      // Verify URL included viewbox bias
      expect(mockFetch).toHaveBeenCalledTimes(1);
      const calledUrl = mockFetch.mock.calls[0][0];
      expect(calledUrl).toContain('viewbox=');

      // Verify all results have distanceMeters populated
      expect(results).toHaveLength(3);
      expect(results[0].distanceMeters).toBeDefined();
      expect(results[1].distanceMeters).toBeDefined();
      expect(results[2].distanceMeters).toBeDefined();

      // Verify sorted strictly closest first!
      expect(results[0].name).toBe('KFC MBK Center');
      expect(results[1].name).toBe('KFC Rama 9');
      expect(results[2].name).toBe('KFC Bangna');
      expect((results[0].distanceMeters ?? 0) < (results[1].distanceMeters ?? 0)).toBe(true);
      expect((results[1].distanceMeters ?? 0) < (results[2].distanceMeters ?? 0)).toBe(true);
    });

    it('filters out far-flung search results (e.g. 904 km or 2205 km) and retains only nearby places', async () => {
      const userCoords: [number, number] = [100.53, 13.74]; // Bangkok

      const mockData = [
        {
          place_id: 1,
          name: 'KFC Siam',
          display_name: 'KFC, Siam, Bangkok',
          lat: '13.744',
          lon: '100.531', // ~200 m
        },
        {
          place_id: 2,
          name: 'KFC Hat Yai',
          display_name: 'KFC, Hat Yai, Songkhla',
          lat: '7.008',
          lon: '100.476', // ~750-900 km away
        },
        {
          place_id: 3,
          name: 'KFC Beijing',
          display_name: 'KFC, Beijing, China',
          lat: '39.904',
          lon: '116.407', // ~2200 km away
        },
      ];

      globalThis.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: async () => mockData,
      });

      const results = await searchPlaces('KFC', { userCoords });

      // Only the nearby Bangkok place is retained! 904 km and 2205 km are filtered out!
      expect(results).toHaveLength(1);
      expect(results[0].name).toBe('KFC Siam');
      expect(results[0].distanceMeters).toBeLessThan(1000);
    });
  });

  describe('getWalkingRoute', () => {
    it('returns walking route coordinates, distance, and duration on success', async () => {
      const mockOsrm = {
        code: 'Ok',
        routes: [
          {
            distance: 1250.5,
            duration: 900.2,
            geometry: {
              coordinates: [
                [100.5315, 13.7445],
                [100.533, 13.7455],
                [100.5347, 13.7462],
              ],
            },
          },
        ],
      };

      globalThis.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: async () => mockOsrm,
      });

      const route = await getWalkingRoute(
        [100.5315, 13.7445],
        [100.5347, 13.7462],
      );

      expect(route).not.toBeNull();
      expect(route?.distanceMeters).toBe(1251);
      expect(route?.durationSeconds).toBe(900);
      expect(route?.coordinates).toHaveLength(3);
    });

    it('returns null gracefully when routing server returns non-ok or error', async () => {
      globalThis.fetch = jest.fn().mockResolvedValue({
        ok: false,
        status: 503,
      });

      const route = await getWalkingRoute([100, 13], [100.1, 13.1]);
      expect(route).toBeNull();
    });

    it('returns null gracefully on network failure/timeout without crashing', async () => {
      globalThis.fetch = jest.fn().mockRejectedValue(new Error('Network error'));

      const route = await getWalkingRoute([100, 13], [100.1, 13.1]);
      expect(route).toBeNull();
    });
  });
});
