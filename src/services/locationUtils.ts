import type { Coordinates } from './mockData';

export const STEP_LENGTH_METERS = 0.75;
export const MAX_LEGIT_SPEED_KMH = 30; // Pace 2 min/km (~30 km/h) - Human sprint limit for anti-cheat
export const MERCHANT_GEOFENCE_METERS = 50;

const EARTH_RADIUS_METERS = 6371000;

// Negative, NaN and Infinity inputs collapse to 0 so no caller ever sees NaN/Infinity.
function nonNegative(value: number): number {
  return Number.isFinite(value) && value > 0 ? value : 0;
}

function isValidCoordinates(point: Coordinates | null | undefined): boolean {
  return (
    !!point &&
    Number.isFinite(point.latitude) &&
    Number.isFinite(point.longitude) &&
    Math.abs(point.latitude) <= 90 &&
    Math.abs(point.longitude) <= 180
  );
}

export function stepsToDistanceKm(steps: number): number {
  return (nonNegative(steps) * STEP_LENGTH_METERS) / 1000;
}

export function distanceKmToSteps(distanceKm: number): number {
  return Math.round((nonNegative(distanceKm) * 1000) / STEP_LENGTH_METERS);
}

export function calculatePace(
  distanceKm: number,
  durationSeconds: number,
): string {
  const distance = nonNegative(distanceKm);
  const duration = nonNegative(durationSeconds);
  if (distance <= 0.005 || duration <= 0) {
    return '-- /km';
  }
  const minPerKm = duration / 60 / distance;
  if (!Number.isFinite(minPerKm) || minPerKm <= 0 || minPerKm > 60) {
    return '-- /km';
  }
  return `${minPerKm.toFixed(2)} /km`;
}

export function calculateSpeedKmh(
  distanceKm: number,
  durationSeconds: number,
): number {
  const distance = nonNegative(distanceKm);
  const duration = nonNegative(durationSeconds);
  if (distance === 0 || duration === 0) {
    return 0;
  }
  const speed = distance / (duration / 3600);
  return Number.isFinite(speed) ? speed : 0;
}

export function isSpeedFraud(
  speedKmh: number,
  maxSpeedKmh: number = MAX_LEGIT_SPEED_KMH,
): boolean {
  const limit =
    Number.isFinite(maxSpeedKmh) && maxSpeedKmh > 0
      ? maxSpeedKmh
      : MAX_LEGIT_SPEED_KMH;
  return Number.isFinite(speedKmh) && speedKmh > limit;
}

export function haversineDistanceMeters(
  from: Coordinates,
  to: Coordinates,
): number {
  if (!isValidCoordinates(from) || !isValidCoordinates(to)) {
    return 0;
  }
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(to.latitude - from.latitude);
  const dLon = toRad(to.longitude - from.longitude);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(from.latitude)) *
      Math.cos(toRad(to.latitude)) *
      Math.sin(dLon / 2) ** 2;
  const meters =
    2 * EARTH_RADIUS_METERS * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Number.isFinite(meters) ? meters : 0;
}

export function isWithinGeofence(
  userLocation: Coordinates,
  merchantLocation: Coordinates,
  radiusMeters: number = MERCHANT_GEOFENCE_METERS,
): boolean {
  if (!isValidCoordinates(userLocation) || !isValidCoordinates(merchantLocation)) {
    return false;
  }
  const radius =
    Number.isFinite(radiusMeters) && radiusMeters > 0
      ? radiusMeters
      : MERCHANT_GEOFENCE_METERS;
  return haversineDistanceMeters(userLocation, merchantLocation) <= radius;
}

export function formatPaceSeconds(value: number | null): string {
  if (value === null || !Number.isFinite(value) || value <= 0) {
    return '--';
  }
  const seconds = Math.round(value);
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`;
}
