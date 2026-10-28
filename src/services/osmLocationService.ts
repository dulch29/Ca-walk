/**
 * OSM Location Service: Nominatim Geocoding and OSRM Walking Route Preview
 *
 * Adheres strictly to OSM / Nominatim Usage Policy:
 * - Clear custom User-Agent identifying the application
 * - Requests triggered strictly on user submit (no keystroke autocomplete spam)
 * - Rate limiting / error handling with graceful fallback
 */

import { OSM_CONFIG } from './osmMapService';
import { haversineDistanceMeters } from './locationUtils';

export interface OsmPlace {
  id: string;
  name: string;
  displayName: string;
  category: string;
  coordinates: [number, number]; // [longitude, latitude]
  distanceMeters?: number;
}

export interface RoutePreview {
  coordinates: Array<[number, number]>; // [longitude, latitude]
  distanceMeters: number;
  durationSeconds: number;
}

const NOMINATIM_BASE = 'https://nominatim.openstreetmap.org';
const OSRM_BASE = 'https://router.project-osrm.org';

const HEADERS = {
  'User-Agent': OSM_CONFIG.userAgent,
  'Accept-Language': 'th,en;q=0.8',
};

export const MAX_SEARCH_RADIUS_METERS = 30000; // 30 km radius (local city/neighborhood proximity)

export interface SearchPlacesOptions {
  userCoords?: [number, number]; // [longitude, latitude]
  signal?: AbortSignal;
}

/**
 * Format distance in meters to friendly Thai string (ม. or กม.)
 */
export function formatDistance(distanceMeters: number): string {
  if (distanceMeters < 1000) {
    return `${Math.round(distanceMeters)} ม.`;
  }
  return `${(distanceMeters / 1000).toFixed(1)} กม.`;
}

/**
 * Search real places using OSM Nominatim geocoding
 * Only called on search submit/button press
 * If userCoords is provided, results are biased toward user area and sorted by distance (closest first).
 */
export async function searchPlaces(
  query: string,
  optionsOrSignal?: SearchPlacesOptions | AbortSignal,
): Promise<OsmPlace[]> {
  const trimmed = query.trim();
  if (!trimmed) {
    return [];
  }

  const options: SearchPlacesOptions =
    optionsOrSignal && 'signal' in optionsOrSignal
      ? optionsOrSignal
      : optionsOrSignal instanceof AbortSignal
      ? { signal: optionsOrSignal }
      : optionsOrSignal ?? {};

  const { userCoords, signal } = options;

  let url = `${NOMINATIM_BASE}/search?format=json&q=${encodeURIComponent(
    trimmed,
  )}&limit=15&addressdetails=1&countrycodes=th`;

  // Bias search to user's bounding box (~30km radius) when user location is known
  if (userCoords) {
    const [lon, lat] = userCoords;
    const delta = 0.3; // ~30 km
    const viewbox = `${lon - delta},${lat + delta},${lon + delta},${lat - delta}`;
    url += `&viewbox=${viewbox}&bounded=0`;
  }

  const response = await fetch(url, {
    method: 'GET',
    headers: HEADERS,
    signal,
  });

  if (!response.ok) {
    if (response.status === 429) {
      throw new Error('ระบบค้นหากำลังจำกัดคำขอ โปรดรอสักครู่แล้วลองใหม่');
    }
    throw new Error(`ค้นหาสถานที่ล้มเหลว (${response.status})`);
  }

  const data = (await response.json()) as Array<{
    place_id: number | string;
    display_name: string;
    name?: string;
    lat: string;
    lon: string;
    type?: string;
    class?: string;
  }>;

  if (!Array.isArray(data)) {
    return [];
  }

  const places: OsmPlace[] = [];
  for (const item of data) {
    const lat = parseFloat(item.lat);
    const lon = parseFloat(item.lon);
    if (
      Number.isFinite(lat) &&
      Number.isFinite(lon) &&
      Math.abs(lat) <= 90 &&
      Math.abs(lon) <= 180
    ) {
      const mainName =
        item.name ||
        item.display_name.split(',')[0]?.trim() ||
        'สถานที่ที่พบ';

      let distanceMeters: number | undefined;
      if (userCoords) {
        distanceMeters = Math.round(
          haversineDistanceMeters(
            { latitude: userCoords[1], longitude: userCoords[0] },
            { latitude: lat, longitude: lon },
          ),
        );
      }

      places.push({
        id: String(item.place_id),
        name: mainName,
        displayName: item.display_name,
        category: item.type || item.class || 'place',
        coordinates: [lon, lat],
        distanceMeters,
      });
    }
  }

  // Filter and sort places with closest first when user coordinates are available
  // Eliminates far-away results (such as 904 km or 2205 km)
  if (userCoords) {
    const nearby = places.filter(
      (p) =>
        p.distanceMeters !== undefined &&
        p.distanceMeters <= MAX_SEARCH_RADIUS_METERS,
    );
    const filtered =
      nearby.length > 0
        ? nearby
        : places.filter(
            (p) => p.distanceMeters !== undefined && p.distanceMeters <= 60000,
          );

    filtered.sort(
      (a, b) => (a.distanceMeters ?? Infinity) - (b.distanceMeters ?? Infinity),
    );
    return filtered;
  }

  return places;
}

/**
 * Fetch walking route preview between two coordinates using OSRM
 */
export async function getWalkingRoute(
  fromLngLat: [number, number],
  toLngLat: [number, number],
  signal?: AbortSignal,
): Promise<RoutePreview | null> {
  const [fromLon, fromLat] = fromLngLat;
  const [toLon, toLat] = toLngLat;

  if (
    !Number.isFinite(fromLon) ||
    !Number.isFinite(fromLat) ||
    !Number.isFinite(toLon) ||
    !Number.isFinite(toLat)
  ) {
    return null;
  }

  const coords = `${fromLon},${fromLat};${toLon},${toLat}`;
  const url = `${OSRM_BASE}/route/v1/walking/${coords}?overview=full&geometries=geojson`;

  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: HEADERS,
      signal,
    });

    if (!response.ok) {
      return null;
    }

    const json = await response.json();
    if (json.code !== 'Ok' || !json.routes || json.routes.length === 0) {
      return null;
    }

    const route = json.routes[0];
    const coordinates = (route.geometry?.coordinates ?? []) as Array<[number, number]>;
    const distanceMeters = Math.round(route.distance ?? 0);
    const durationSeconds = Math.round(route.duration ?? 0);

    return {
      coordinates,
      distanceMeters,
      durationSeconds,
    };
  } catch {
    // If routing server is unreachable or aborted, return null so user can still proceed
    return null;
  }
}
