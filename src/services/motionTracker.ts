import { PermissionsAndroid, Platform } from 'react-native';
import {
  accelerometer,
  setUpdateIntervalForType,
  SensorTypes,
} from 'react-native-sensors';
import * as GeolocationModule from 'react-native-geolocation-service';
import type { Coordinates } from './mockData';

export interface TrackedLocation extends Coordinates {
  accuracy: number | null;
  timestamp: number;
  speedKmh: number | null;
}

export interface MotionTrackerOptions {
  onStep: () => void;
  onLocation: (location: TrackedLocation) => void;
  onError?: (error: Error) => void;
}

export interface MotionTrackerHandle {
  stop: () => void;
}

type GeolocationApi = Pick<
  typeof GeolocationModule,
  'watchPosition' | 'clearWatch'
>;

// The package typings declare named exports, but js/index.js only exports a default object.
const Geolocation: GeolocationApi =
  (GeolocationModule as unknown as { default?: GeolocationApi }).default ??
  GeolocationModule;

const ACCELEROMETER_INTERVAL_MS = 50;
// Android reports m/s^2 (gravity ~9.81). A step peak rises above HIGH; the detector re-arms below LOW.
const STEP_PEAK_HIGH = 11.5;
const STEP_PEAK_LOW = 10.5;
const MIN_STEP_INTERVAL_MS = 300;
// ACTIVITY_RECOGNITION is a runtime permission only from Android 10 (API 29).
const ACTIVITY_RECOGNITION_MIN_API = 29;

function toError(value: unknown, fallback: string): Error {
  if (value instanceof Error) {
    return value;
  }
  if (
    typeof value === 'object' &&
    value !== null &&
    'message' in value &&
    typeof value.message === 'string'
  ) {
    return new Error(value.message);
  }
  return new Error(fallback);
}

export async function requestMotionPermissions(): Promise<boolean> {
  if (Platform.OS !== 'android') {
    return true;
  }
  const { ACCESS_FINE_LOCATION, ACCESS_COARSE_LOCATION, ACTIVITY_RECOGNITION } =
    PermissionsAndroid.PERMISSIONS;
  const needsActivity = Number(Platform.Version) >= ACTIVITY_RECOGNITION_MIN_API;
  const permissions = needsActivity
    ? [ACCESS_FINE_LOCATION, ACCESS_COARSE_LOCATION, ACTIVITY_RECOGNITION]
    : [ACCESS_FINE_LOCATION, ACCESS_COARSE_LOCATION];
  try {
    const results = await PermissionsAndroid.requestMultiple(permissions);
    const granted = PermissionsAndroid.RESULTS.GRANTED;
    return (
      results[ACCESS_FINE_LOCATION] === granted &&
      (!needsActivity || results[ACTIVITY_RECOGNITION] === granted)
    );
  } catch {
    return false;
  }
}

export async function startMotionTracking(
  options: MotionTrackerOptions,
): Promise<MotionTrackerHandle> {
  const { onStep, onLocation, onError } = options;

  const granted = await requestMotionPermissions();
  if (!granted) {
    throw new Error(
      'ต้องอนุญาตสิทธิ์ตำแหน่ง (Location) และการเคลื่อนไหว (Physical activity) ก่อนเริ่มเดิน',
    );
  }

  setUpdateIntervalForType(SensorTypes.accelerometer, ACCELEROMETER_INTERVAL_MS);

  let armed = true;
  let lastStepAt = 0;
  const subscription = accelerometer.subscribe({
    next: ({ x, y, z, timestamp }) => {
      const magnitude = Math.sqrt(x * x + y * y + z * z);
      if (!Number.isFinite(magnitude)) {
        return;
      }
      if (armed && magnitude > STEP_PEAK_HIGH) {
        armed = false;
        const now = Number.isFinite(timestamp) ? timestamp : Date.now();
        if (now - lastStepAt >= MIN_STEP_INTERVAL_MS) {
          lastStepAt = now;
          onStep();
        }
      } else if (!armed && magnitude < STEP_PEAK_LOW) {
        armed = true;
      }
    },
    error: (error: unknown) => {
      onError?.(toError(error, 'อ่านค่า accelerometer ไม่สำเร็จ'));
    },
  });

  let watchId: number;
  try {
    watchId = Geolocation.watchPosition(
      ({ coords, timestamp }) => {
        const speed = coords.speed;
        onLocation({
          latitude: coords.latitude,
          longitude: coords.longitude,
          accuracy: Number.isFinite(coords.accuracy) ? coords.accuracy : null,
          timestamp,
          speedKmh:
            speed !== null && Number.isFinite(speed) && speed >= 0
              ? speed * 3.6
              : null,
        });
      },
      (error) => {
        onError?.(new Error(error.message || 'อ่านตำแหน่ง GPS ไม่สำเร็จ'));
      },
      {
        accuracy: { android: 'high' },
        enableHighAccuracy: true,
        distanceFilter: 1,
        interval: 1000,
        fastestInterval: 500,
        showLocationDialog: true,
      },
    );
  } catch (error) {
    subscription.unsubscribe();
    throw toError(error, 'เริ่มติดตาม GPS ไม่สำเร็จ');
  }

  let stopped = false;
  return {
    stop: () => {
      if (stopped) {
        return;
      }
      stopped = true;
      subscription.unsubscribe();
      Geolocation.clearWatch(watchId);
    },
  };
}
