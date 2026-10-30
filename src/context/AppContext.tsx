import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  MOCK_COUPONS,
  MOCK_MERCHANTS,
  MOCK_USER,
  type Coordinates,
  type Coupon,
  type Merchant,
  type MockUser,
  type RunSession,
} from '../services/mockData';
import {
  calculateAveragePaceSecondsPerKm,
  calculatePace,
  calculateSpeedKmh,
  distanceKmToSteps,
  haversineDistanceMeters,
  isWithinGeofence,
  MAX_LOCATION_AGE_MS,
  MERCHANT_GEOFENCE_METERS,
  stepsToDistanceKm,
} from '../services/locationUtils';
import {
  getCurrentTrackedLocation,
  requestLocationPermissions,
  startLocationWatch,
  startMotionTracking,
  type MotionTrackerHandle,
  type TrackedLocation,
} from '../services/motionTracker';
import { reverseGeocodeLocation } from '../services/osmLocationService';
import { OSM_CONFIG } from '../services/osmMapService';
import type { Sport } from '../types/activity';
import {
  getCurrentFirebaseUser,
} from '../services/firebase';
import { saveRunActivity } from '../services/firestoreService';

export type AppMode = 'user' | 'merchant';

export interface ActivityDestination {
  id: string;
  name: string;
  coordinates: [number, number]; // [lng, lat]
  distanceMeters?: number;
  routeCoordinates?: Array<[number, number]>;
}

export interface ActiveRunSession {
  sessionId: string;
  sport: Sport;
  startTime: string;
  steps: number;
  acceptedGpsDistanceMeters: number;
  distanceKm: number;
  gpsDistanceKm: number;
  lastAcceptedLocation?: TrackedLocation;
  currentPace: string;
  durationSeconds: number;
  status: 'recording' | 'paused';
  destination?: ActivityDestination;
  photos: string[];
  photoLocations: Record<string, string>;
  trackCoordinates: Array<[number, number]>;
  trackSegments: Array<Array<[number, number]>>;
}

export interface DistanceOperationSuccess<T> {
  ok: true;
  value: T;
}

export interface DistanceOperationFailure {
  ok: false;
  reason: string;
}

export type DistanceOperationResult<T> =
  | DistanceOperationSuccess<T>
  | DistanceOperationFailure;

export interface AppContextValue {
  user: MockUser;
  runHistory: RunSession[];
  activeSession: ActiveRunSession | null;
  merchants: Merchant[];
  coupons: Coupon[];
  mode: AppMode;
  currentLocation: Coordinates | null;
  locationFix: TrackedLocation | null;
  currentSpeedKmh: number;
  speedFraudActive: boolean;
  trackingError: string | null;
  selectedDestination: ActivityDestination | null;
  setSelectedDestination: (destination: ActivityDestination | null) => void;
  requestLocationPermission: () => Promise<boolean>;
  requestCurrentLocation: () => Promise<TrackedLocation>;
  startRunSession: (
    destination?: ActivityDestination,
    sport?: Sport,
  ) => Promise<void>;
  pauseRunSession: () => void;
  resumeRunSession: () => void;
  endRunSession: (reason?: 'manual' | 'arrived') => RunSession | null;
  addSessionPhoto: (
    photoUri: string,
    expectedSessionId?: string,
  ) => Promise<void>;
  exchangeDistanceForCoupon: (
    merchantId: string,
  ) => DistanceOperationResult<Coupon>;
  redeemMockCoupon: (couponId: string) => DistanceOperationResult<Coupon>;
  addMockDistance: (km: number) => boolean;
  toggleSpeedFraud: () => boolean;
  warpToMerchant: (merchantId: string) => boolean;
  setMode: (mode: AppMode) => void;
}

const cloneUser = (): MockUser => ({
  ...MOCK_USER,
  runHistory: MOCK_USER.runHistory.map((session) => ({ ...session })),
});

const cloneCoupons = (): Coupon[] => MOCK_COUPONS.map((coupon) => ({ ...coupon }));
const cloneMerchants = (): Merchant[] =>
  MOCK_MERCHANTS.map((merchant) => ({
    ...merchant,
    location: { ...merchant.location },
    promotion: { ...merchant.promotion },
    metrics: { ...merchant.metrics },
  }));

function roundDistance(distanceKm: number): number {
  return Math.round(distanceKm * 1000) / 1000;
}

const MAX_LOCATION_ACCURACY_METERS = 25;
const MAX_LEGIT_SPEED_KMH = 30;
const GPS_GAP_MS = 15_000;

function monotonicNowMs(): number {
  const performanceApi = (
    globalThis as unknown as { performance?: { now?: () => number } }
  ).performance;
  const value = performanceApi?.now?.() ?? NaN;
  return typeof value === 'number' && Number.isFinite(value) ? value : Date.now();
}

function createSessionId(counter: number): string {
  return `run_${Date.now().toString(36)}_${counter.toString(36)}_${Math.random()
    .toString(36)
    .slice(2, 8)}`;
}

function isFreshLocationFix(location: TrackedLocation, now = Date.now()): boolean {
  return (
    Number.isFinite(location.latitude) &&
    location.latitude >= -90 &&
    location.latitude <= 90 &&
    Number.isFinite(location.longitude) &&
    location.longitude >= -180 &&
    location.longitude <= 180 &&
    location.accuracy !== null &&
    Number.isFinite(location.accuracy) &&
    location.accuracy >= 0 &&
    location.accuracy <= MAX_LOCATION_ACCURACY_METERS &&
    Number.isFinite(location.timestamp) &&
    location.timestamp <= now + 1_000 &&
    now - location.timestamp <= MAX_LOCATION_AGE_MS
  );
}

export const AppContext = createContext<AppContextValue | undefined>(undefined);

export function AppProvider(
  props: React.PropsWithChildren,
): React.JSX.Element {
  const [user, setUser] = useState<MockUser>(cloneUser);
  const [runHistory, setRunHistory] = useState<RunSession[]>(() =>
    cloneUser().runHistory,
  );
  const [activeSession, setActiveSession] = useState<ActiveRunSession | null>(
    null,
  );
  const [merchants, setMerchants] = useState<Merchant[]>(cloneMerchants);
  const [coupons, setCoupons] = useState<Coupon[]>(cloneCoupons);
  const [mode, setMode] = useState<AppMode>('user');
  const [currentLocation, setCurrentLocation] = useState<Coordinates | null>(
    null,
  );
  const [locationFix, setLocationFix] = useState<TrackedLocation | null>(null);
  const [currentSpeedKmh, setCurrentSpeedKmh] = useState(0);
  const [speedFraudActive, setSpeedFraudActive] = useState(false);
  const [trackingError, setTrackingError] = useState<string | null>(null);
  const [selectedDestination, setSelectedDestination] =
    useState<ActivityDestination | null>(null);

  const userRef = useRef(user);
  const runHistoryRef = useRef(runHistory);
  const activeSessionRef = useRef<ActiveRunSession | null>(null);
  const merchantsRef = useRef(merchants);
  const couponsRef = useRef(coupons);
  const currentLocationRef = useRef<Coordinates | null>(null);
  const locationFixRef = useRef<TrackedLocation | null>(null);
  const selectedDestinationRef = useRef<ActivityDestination | null>(null);
  const trackerRef = useRef<MotionTrackerHandle | null>(null);
  const passiveTrackerRef = useRef<MotionTrackerHandle | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const locationStaleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const previousLocationRef = useRef<TrackedLocation | null>(null);
  const accumulatedActiveMsRef = useRef(0);
  const recordingStartedAtMsRef = useRef<number | null>(null);
  const sessionCounterRef = useRef(0);
  const couponCounterRef = useRef(0);
  const fraudRef = useRef(false);
  const sustainedFastCountRef = useRef(0);
  const photoLocationControllersRef = useRef(new Set<AbortController>());

  useEffect(() => {
    selectedDestinationRef.current = selectedDestination;
  }, [selectedDestination]);

  const updateUser = useCallback(
    (updater: (previous: MockUser) => MockUser) => {
      const next = updater(userRef.current);
      userRef.current = next;
      setUser(next);
    },
    [],
  );

  const updateActiveSession = useCallback(
    (
      updater: (
        previous: ActiveRunSession | null,
      ) => ActiveRunSession | null,
    ) => {
      const next = updater(activeSessionRef.current);
      activeSessionRef.current = next;
      setActiveSession(next);
    },
    [],
  );

  const getActiveDurationSeconds = useCallback((): number => {
    const runningSince = recordingStartedAtMsRef.current;
    const runningMs =
      runningSince === null ? 0 : Math.max(0, monotonicNowMs() - runningSince);
    return Math.floor((accumulatedActiveMsRef.current + runningMs) / 1000);
  }, []);

  const refreshActiveDuration = useCallback(() => {
    const durationSeconds = getActiveDurationSeconds();
    updateActiveSession(session => {
      if (!session || session.status !== 'recording') {
        return session;
      }
      return {
        ...session,
        durationSeconds,
        currentPace: calculatePace(session.distanceKm, durationSeconds),
      };
    });
  }, [getActiveDurationSeconds, updateActiveSession]);

  const startDurationTimer = useCallback(() => {
    if (timerRef.current !== null) {
      clearInterval(timerRef.current);
    }
    timerRef.current = setInterval(refreshActiveDuration, 1000);
  }, [refreshActiveDuration]);

  const commitActiveElapsed = useCallback((): number => {
    const runningSince = recordingStartedAtMsRef.current;
    if (runningSince !== null) {
      accumulatedActiveMsRef.current += Math.max(
        0,
        monotonicNowMs() - runningSince,
      );
      recordingStartedAtMsRef.current = null;
    }
    return Math.floor(accumulatedActiveMsRef.current / 1000);
  }, []);

  const handleStep = useCallback(() => {
    updateActiveSession((previous) => {
      if (!previous || previous.status !== 'recording') {
        return previous;
      }
      const nextSteps = previous.steps + 1;
      return {
        ...previous,
        steps: nextSteps,
      };
    });
  }, [updateActiveSession]);

  const scheduleLocationExpiry = useCallback((location: TrackedLocation) => {
    if (locationStaleTimerRef.current !== null) {
      clearTimeout(locationStaleTimerRef.current);
    }

    const expireIfCurrent = () => {
      const current = locationFixRef.current;
      if (!current || current.timestamp !== location.timestamp) {
        return;
      }
      const remainingMs = MAX_LOCATION_AGE_MS - (Date.now() - current.timestamp);
      if (remainingMs >= 0) {
        locationStaleTimerRef.current = setTimeout(expireIfCurrent, remainingMs + 1);
        return;
      }

      locationStaleTimerRef.current = null;
      locationFixRef.current = null;
      currentLocationRef.current = null;
      previousLocationRef.current = null;
      setLocationFix(null);
      setCurrentLocation(null);
      setCurrentSpeedKmh(0);
      setTrackingError('สัญญาณ GPS ขาดหาย กรุณารอตำแหน่งใหม่หรือลองอีกครั้ง');
    };

    const remainingMs = MAX_LOCATION_AGE_MS - (Date.now() - location.timestamp);
    locationStaleTimerRef.current = setTimeout(
      expireIfCurrent,
      Math.max(1, remainingMs + 1),
    );
  }, []);

  const handleLocation = useCallback(
    (location: TrackedLocation) => {
      if (!isFreshLocationFix(location)) {
        if (
          location.accuracy === null ||
          (Number.isFinite(location.accuracy) &&
            location.accuracy > MAX_LOCATION_ACCURACY_METERS)
        ) {
          setTrackingError('สัญญาณ GPS ยังไม่แม่นยำ กรุณารอในที่โล่ง');
        }
        return;
      }

      const published = locationFixRef.current;
      if (published && location.timestamp <= published.timestamp) {
        return;
      }

      const session = activeSessionRef.current;
      const previous = previousLocationRef.current;
      let segmentDistanceMeters = 0;
      let segmentSpeedKmh = location.speedKmh ?? 0;
      let startsNewSegment = false;

      if (session?.status === 'recording') {
        if (!previous) {
          startsNewSegment = true;
        } else {
          const elapsedMs = location.timestamp - previous.timestamp;
          if (elapsedMs > GPS_GAP_MS) {
            startsNewSegment = true;
          } else {
            const elapsedSeconds = elapsedMs / 1000;
            segmentDistanceMeters = haversineDistanceMeters(previous, location);
            const calculatedSpeedKmh = calculateSpeedKmh(
              segmentDistanceMeters / 1000,
              elapsedSeconds,
            );
            segmentSpeedKmh = calculatedSpeedKmh;

            if (
              !Number.isFinite(calculatedSpeedKmh) ||
              calculatedSpeedKmh > MAX_LEGIT_SPEED_KMH
            ) {
              sustainedFastCountRef.current += 1;
              setSpeedFraudActive(sustainedFastCountRef.current >= 3);
              return;
            }

            sustainedFastCountRef.current = 0;
            setSpeedFraudActive(false);
            const deadbandMeters = Math.max(
              2.5,
              Math.min(
                8,
                ((previous.accuracy ?? MAX_LOCATION_ACCURACY_METERS) +
                  (location.accuracy ?? MAX_LOCATION_ACCURACY_METERS)) *
                  0.25,
              ),
            );
            if (segmentDistanceMeters < deadbandMeters) {
              segmentDistanceMeters = 0;
            }
          }
        }

        if (startsNewSegment || segmentDistanceMeters > 0) {
          previousLocationRef.current = location;
          const coord: [number, number] = [location.longitude, location.latitude];
          updateActiveSession(current => {
            if (!current || current.status !== 'recording') {
              return current;
            }
            const acceptedGpsDistanceMeters =
              current.acceptedGpsDistanceMeters + segmentDistanceMeters;
            const distanceKm = acceptedGpsDistanceMeters / 1000;
            const trackSegments = current.trackSegments.map(segment => [...segment]);
            if (startsNewSegment || trackSegments.length === 0) {
              trackSegments.push([coord]);
            } else {
              trackSegments[trackSegments.length - 1].push(coord);
            }
            return {
              ...current,
              acceptedGpsDistanceMeters,
              distanceKm,
              gpsDistanceKm: distanceKm,
              lastAcceptedLocation: location,
              trackCoordinates: [...current.trackCoordinates, coord],
              trackSegments,
              currentPace: calculatePace(distanceKm, current.durationSeconds),
            };
          });
        } else {
          previousLocationRef.current = location;
          updateActiveSession(current =>
            current?.status === 'recording'
              ? { ...current, lastAcceptedLocation: location }
              : current,
          );
        }
      } else {
        previousLocationRef.current = null;
      }

      locationFixRef.current = location;
      setLocationFix(location);
      currentLocationRef.current = location;
      setCurrentLocation({
        latitude: location.latitude,
        longitude: location.longitude,
      });
      setCurrentSpeedKmh(Number.isFinite(segmentSpeedKmh) ? segmentSpeedKmh : 0);
      setTrackingError(null);
      scheduleLocationExpiry(location);
    },
    [scheduleLocationExpiry, updateActiveSession],
  );

  const handleTrackingError = useCallback((error: Error) => {
    setTrackingError(error.message);
  }, []);

  const stopTracking = useCallback(() => {
    trackerRef.current?.stop();
    trackerRef.current = null;
    if (passiveTrackerRef.current) {
      passiveTrackerRef.current.stop();
      passiveTrackerRef.current = null;
    }
    if (timerRef.current !== null) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const cancelPendingPhotoLocations = useCallback(() => {
    photoLocationControllersRef.current.forEach(controller => controller.abort());
    photoLocationControllersRef.current.clear();
  }, []);

  const requestLocationPermission = useCallback(async (): Promise<boolean> => {
    try {
      const granted = await requestLocationPermissions();
      if (granted && !passiveTrackerRef.current && !trackerRef.current) {
        try {
          const handle = await startLocationWatch(
            handleLocation,
            (err) => {
              setTrackingError(err.message);
            },
          );
          passiveTrackerRef.current = handle;
        } catch {
          // Non-blocking location acquisition
        }
      }
      return granted;
    } catch {
      return false;
    }
  }, [handleLocation]);

  const requestCurrentLocation = useCallback(async (): Promise<TrackedLocation> => {
    const existing = locationFixRef.current;
    if (existing && isFreshLocationFix(existing)) {
      return existing;
    }

    const location = await getCurrentTrackedLocation();
    if (!isFreshLocationFix(location)) {
      throw new Error('ยังไม่ได้ตำแหน่ง GPS ที่แม่นยำ กรุณาลองใหม่ในที่โล่ง');
    }
    const previousFix = locationFixRef.current;
    if (previousFix && location.timestamp <= previousFix.timestamp) {
      throw new Error('ตำแหน่ง GPS ยังไม่อัปเดต กรุณาลองใหม่');
    }
    handleLocation(location);
    if (locationFixRef.current?.timestamp !== location.timestamp) {
      throw new Error('ตำแหน่ง GPS ไม่ผ่านการตรวจสอบ กรุณาลองใหม่ในที่โล่ง');
    }
    return location;
  }, [handleLocation]);

  const startRunSession = useCallback(
    async (destination?: ActivityDestination, sport: Sport = 'walk') => {
      if (activeSessionRef.current) {
        return;
      }

      if (passiveTrackerRef.current) {
        passiveTrackerRef.current.stop();
        passiveTrackerRef.current = null;
      }

      const chosenDestination =
        destination ?? selectedDestinationRef.current ?? undefined;
      sessionCounterRef.current += 1;
      const startTime = new Date().toISOString();
      const nextSession: ActiveRunSession = {
        sessionId: createSessionId(sessionCounterRef.current),
        sport,
        startTime,
        steps: 0,
        acceptedGpsDistanceMeters: 0,
        distanceKm: 0,
        gpsDistanceKm: 0,
        currentPace: '-- /km',
        durationSeconds: 0,
        status: 'recording',
        destination: chosenDestination,
        photos: [],
        photoLocations: {},
        trackCoordinates: [],
        trackSegments: [],
      };
      accumulatedActiveMsRef.current = 0;
      recordingStartedAtMsRef.current = monotonicNowMs();
      previousLocationRef.current = null;
      fraudRef.current = false;
      sustainedFastCountRef.current = 0;
      setSpeedFraudActive(false);
      setCurrentSpeedKmh(0);
      setTrackingError(null);
      activeSessionRef.current = nextSession;
      setActiveSession(nextSession);

      try {
        const tracker = await startMotionTracking({
          onStep: handleStep,
          onLocation: handleLocation,
          onError: handleTrackingError,
        });
        if (activeSessionRef.current?.sessionId !== nextSession.sessionId) {
          tracker.stop();
          return;
        }
        trackerRef.current = tracker;
      } catch (error) {
        if (activeSessionRef.current?.sessionId !== nextSession.sessionId) {
          return;
        }
        activeSessionRef.current = null;
        setActiveSession(null);
        accumulatedActiveMsRef.current = 0;
        recordingStartedAtMsRef.current = null;
        stopTracking();
        const message =
          error instanceof Error ? error.message : 'เริ่มการเดินไม่สำเร็จ';
        setTrackingError(message);
        throw error instanceof Error ? error : new Error(message);
      }

      startDurationTimer();
    },
    [
      handleLocation,
      handleStep,
      handleTrackingError,
      startDurationTimer,
      stopTracking,
    ],
  );

  const pauseRunSession = useCallback(() => {
    const current = activeSessionRef.current;
    if (!current || current.status !== 'recording') {
      return;
    }
    if (timerRef.current !== null) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    const durationSeconds = commitActiveElapsed();
    previousLocationRef.current = null;
    updateActiveSession((session) => {
      if (!session) {
        return null;
      }
      return {
        ...session,
        status: 'paused',
        durationSeconds,
        currentPace: calculatePace(session.distanceKm, durationSeconds),
      };
    });
  }, [commitActiveElapsed, updateActiveSession]);

  const resumeRunSession = useCallback(() => {
    const current = activeSessionRef.current;
    if (!current || current.status !== 'paused') {
      return;
    }
    previousLocationRef.current = null;
    recordingStartedAtMsRef.current = monotonicNowMs();
    updateActiveSession((session) => {
      if (!session) {
        return null;
      }
      return { ...session, status: 'recording' };
    });

    startDurationTimer();
  }, [startDurationTimer, updateActiveSession]);

  const addSessionPhoto = useCallback(
    async (photoUri: string, expectedSessionId?: string): Promise<void> => {
      const session = activeSessionRef.current;
      if (
        !session ||
        (expectedSessionId !== undefined &&
          session.sessionId !== expectedSessionId)
      ) {
        return;
      }

      const sessionId = session.sessionId;
      const location = locationFixRef.current;
      updateActiveSession(previous => {
        if (!previous || previous.sessionId !== sessionId) {
          return previous;
        }
        return { ...previous, photos: [...previous.photos, photoUri] };
      });

      if (!location || !isFreshLocationFix(location)) {
        return;
      }

      const controller = new AbortController();
      photoLocationControllersRef.current.add(controller);
      let removeAbortListener = () => {};
      const aborted = new Promise<null>(resolve => {
        const onAbort = () => resolve(null);
        controller.signal.addEventListener('abort', onAbort, { once: true });
        removeAbortListener = () =>
          controller.signal.removeEventListener('abort', onAbort);
      });
      const timeout = setTimeout(
        () => controller.abort(),
        OSM_CONFIG.requestTimeoutMs,
      );
      let locationName: string | null = null;
      try {
        locationName = await Promise.race([
          reverseGeocodeLocation(
            [location.longitude, location.latitude],
            controller.signal,
          ),
          aborted,
        ]);
      } catch {
        // Photo remains available when the public geocoder is offline or rate-limited.
      } finally {
        clearTimeout(timeout);
        removeAbortListener();
        photoLocationControllersRef.current.delete(controller);
      }

      if (!locationName) {
        return;
      }
      updateActiveSession(previous => {
        if (!previous || previous.sessionId !== sessionId) {
          return previous;
        }
        return {
          ...previous,
          photoLocations: { ...previous.photoLocations, [photoUri]: locationName },
        };
      });
    },
    [updateActiveSession],
  );

  const endRunSession = useCallback((reason: 'manual' | 'arrived' = 'manual'): RunSession | null => {
    const current = activeSessionRef.current;
    if (!current) {
      return null;
    }

    const durationSeconds = commitActiveElapsed();
    stopTracking();
    cancelPendingPhotoLocations();
    const endTime = new Date().toISOString();
    const distanceKm = roundDistance(current.distanceKm);
    const completed: RunSession = {
      sessionId: current.sessionId,
      sport: current.sport,
      startTime: current.startTime,
      endTime,
      durationSeconds,
      steps: current.steps,
      distanceKm,
      gpsDistanceKm: current.gpsDistanceKm,
      averagePace: calculatePace(distanceKm, durationSeconds),
      averagePaceSecondsPerKm: calculateAveragePaceSecondsPerKm(
        distanceKm,
        durationSeconds,
      ),
      distanceSource: distanceKm > 0 ? 'gps' : 'unavailable',
      completionReason: reason,
      destinationName: current.destination?.name,
      photos: [...current.photos],
      photoLocations: { ...current.photoLocations },
      trackCoordinates: current.trackCoordinates.map(
        ([lng, lat]): [number, number] => [lng, lat],
      ),
      trackSegments: current.trackSegments.map(segment =>
        segment.map(([lng, lat]): [number, number] => [lng, lat]),
      ),
    };
    const newRunHistory = [...runHistoryRef.current, completed];
    runHistoryRef.current = newRunHistory;
    setRunHistory(newRunHistory);

    updateUser((previous) => ({
      ...previous,
      totalSteps: previous.totalSteps + current.steps,
      totalDistanceKm: roundDistance(
        previous.totalDistanceKm + distanceKm,
      ),
      redeemableDistanceKm: roundDistance(
        previous.redeemableDistanceKm + distanceKm,
      ),
      runHistory: newRunHistory,
    }));

    let authenticatedUser: ReturnType<typeof getCurrentFirebaseUser> = null;
    try {
      authenticatedUser = getCurrentFirebaseUser();
    } catch {
      // Firebase config is optional for the local Android prototype.
      authenticatedUser = null;
    }
    if (authenticatedUser) {
      saveRunActivity(authenticatedUser.uid, completed).catch((error: unknown) => {
        const message =
          error instanceof Error ? error.message : 'บันทึกประวัติการเดินไม่สำเร็จ';
        setTrackingError(`บันทึกประวัติการเดินไม่สำเร็จ: ${message}`);
      });
    }

    activeSessionRef.current = null;
    setActiveSession(null);
    previousLocationRef.current = null;
    accumulatedActiveMsRef.current = 0;
    recordingStartedAtMsRef.current = null;
    setCurrentSpeedKmh(0);
    setSelectedDestination(null);
    return completed;
  }, [cancelPendingPhotoLocations, commitActiveElapsed, stopTracking, updateUser]);

  const exchangeDistanceForCoupon = useCallback(
    (merchantId: string): DistanceOperationResult<Coupon> => {
      const merchant = merchantsRef.current.find(
        (candidate) => candidate.merchantId === merchantId,
      );
      if (!merchant) {
        return { ok: false, reason: 'ไม่พบร้านค้านี้' };
      }
      const requiredDistanceKm = merchant.promotion.requiredDistanceKm;
      if (userRef.current.redeemableDistanceKm < requiredDistanceKm) {
        return { ok: false, reason: 'ระยะทางสะสมสำหรับแลกคูปองไม่เพียงพอ' };
      }

      couponCounterRef.current += 1;
      const unlockedAt = new Date();
      const coupon: Coupon = {
        couponId: `coupon_live_${String(couponCounterRef.current).padStart(4, '0')}`,
        merchantId: merchant.merchantId,
        merchantName: merchant.merchantName,
        dealTitle: merchant.promotion.title,
        requiredDistanceKm,
        status: 'unlocked',
        unlockedAt: unlockedAt.toISOString(),
        expiresAt: new Date(
          unlockedAt.getTime() + 72 * 60 * 60 * 1000,
        ).toISOString(),
        oneTimeToken: `CW-LIVE-${String(couponCounterRef.current).padStart(6, '0')}`,
      };
      const nextCoupons = [...couponsRef.current, coupon];
      couponsRef.current = nextCoupons;
      setCoupons(nextCoupons);
      updateUser((previous) => ({
        ...previous,
        redeemableDistanceKm: roundDistance(
          previous.redeemableDistanceKm - requiredDistanceKm,
        ),
      }));
      return { ok: true, value: coupon };
    },
    [updateUser],
  );

  const redeemMockCoupon = useCallback(
    (couponId: string): DistanceOperationResult<Coupon> => {
      const coupon = couponsRef.current.find(
        (candidate) => candidate.couponId === couponId,
      );
      if (!coupon) {
        return { ok: false, reason: 'ไม่พบคูปองนี้' };
      }
      if (coupon.status !== 'unlocked') {
        return { ok: false, reason: 'คูปองนี้ถูกใช้ไปแล้วหรือหมดอายุ' };
      }
      const merchant = merchantsRef.current.find(
        (candidate) => candidate.merchantId === coupon.merchantId,
      );
      if (!merchant) {
        return { ok: false, reason: 'ไม่พบร้านค้าของคูปองนี้' };
      }
      const location = currentLocationRef.current;
      if (!location) {
        return { ok: false, reason: 'ต้องอยู่ใกล้ร้านก่อนใช้คูปอง' };
      }
      if (
        !isWithinGeofence(
          location,
          merchant.location,
          MERCHANT_GEOFENCE_METERS,
        )
      ) {
        return { ok: false, reason: 'อยู่นอกระยะ 50 เมตรจากร้านค้า' };
      }

      const redeemedCoupon: Coupon = {
        ...coupon,
        status: 'redeemed',
        redeemedAt: new Date().toISOString(),
      };
      const nextCoupons = couponsRef.current.map((candidate) =>
        candidate.couponId === couponId ? redeemedCoupon : candidate,
      );
      couponsRef.current = nextCoupons;
      setCoupons(nextCoupons);
      const nextMerchants = merchantsRef.current.map((candidate) =>
        candidate.merchantId === merchant.merchantId
          ? {
              ...candidate,
              metrics: {
                walkIns: candidate.metrics.walkIns + 1,
                redeemed: candidate.metrics.redeemed + 1,
                feeBaht: candidate.metrics.feeBaht + 8,
              },
            }
          : candidate,
      );
      merchantsRef.current = nextMerchants;
      setMerchants(nextMerchants);
      return { ok: true, value: redeemedCoupon };
    },
    [],
  );

  const addMockDistance = useCallback(
    (km: number): boolean => {
      if (
        !Number.isFinite(km) ||
        km <= 0 ||
        !activeSessionRef.current ||
        fraudRef.current
      ) {
        return false;
      }
      const steps = distanceKmToSteps(km);
      const actualDistanceKm = stepsToDistanceKm(steps);
      if (steps <= 0 || actualDistanceKm <= 0) {
        return false;
      }
      // Prototype-only balance helper. Never blend simulated progress into a
      // live activity: RunSession distance is accepted GPS distance only.
      updateUser((previous) => ({
        ...previous,
        totalSteps: previous.totalSteps + steps,
        totalDistanceKm: roundDistance(
          previous.totalDistanceKm + actualDistanceKm,
        ),
        redeemableDistanceKm: roundDistance(
          previous.redeemableDistanceKm + actualDistanceKm,
        ),
      }));
      return true;
    },
    [updateUser],
  );

  const toggleSpeedFraud = useCallback((): boolean => {
    const next = !fraudRef.current;
    fraudRef.current = next;
    setSpeedFraudActive(next);
    setCurrentSpeedKmh(next ? 19 : 0);
    if (!next) {
      previousLocationRef.current = null;
    }
    return next;
  }, []);

  const warpToMerchant = useCallback((merchantId: string): boolean => {
    const merchant = merchantsRef.current.find(
      (candidate) => candidate.merchantId === merchantId,
    );
    if (!merchant) {
      return false;
    }
    const warpedLocation = {
      latitude: merchant.location.latitude + 12 / 111111,
      longitude: merchant.location.longitude,
    };
    currentLocationRef.current = warpedLocation;
    setCurrentLocation(warpedLocation);
    return true;
  }, []);

  useEffect(() => {
    userRef.current = user;
  }, [user]);

  useEffect(() => {
    runHistoryRef.current = runHistory;
  }, [runHistory]);

  useEffect(() => {
    merchantsRef.current = merchants;
  }, [merchants]);

  useEffect(() => {
    couponsRef.current = coupons;
  }, [coupons]);

  useEffect(
    () => () => {
      stopTracking();
      cancelPendingPhotoLocations();
      if (locationStaleTimerRef.current !== null) {
        clearTimeout(locationStaleTimerRef.current);
        locationStaleTimerRef.current = null;
      }
      activeSessionRef.current = null;
    },
    [cancelPendingPhotoLocations, stopTracking],
  );

  const value = useMemo<AppContextValue>(
    () => ({
      user,
      runHistory,
      activeSession,
      merchants,
      coupons,
      mode,
      currentLocation,
      locationFix,
      currentSpeedKmh,
      speedFraudActive,
      trackingError,
      selectedDestination,
      setSelectedDestination,
      requestLocationPermission,
      requestCurrentLocation,
      startRunSession,
      pauseRunSession,
      resumeRunSession,
      endRunSession,
      addSessionPhoto,
      exchangeDistanceForCoupon,
      redeemMockCoupon,
      addMockDistance,
      toggleSpeedFraud,
      warpToMerchant,
      setMode,
    }),
    [
      user,
      runHistory,
      activeSession,
      merchants,
      coupons,
      mode,
      currentLocation,
      locationFix,
      currentSpeedKmh,
      speedFraudActive,
      trackingError,
      selectedDestination,
      setSelectedDestination,
      requestLocationPermission,
      requestCurrentLocation,
      startRunSession,
      pauseRunSession,
      resumeRunSession,
      endRunSession,
      addSessionPhoto,
      exchangeDistanceForCoupon,
      redeemMockCoupon,
      addMockDistance,
      toggleSpeedFraud,
      warpToMerchant,
    ],
  );

  return <AppContext.Provider value={value}>{props.children}</AppContext.Provider>;
}

export function useAppContext(): AppContextValue {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useAppContext ต้องถูกเรียกภายใน AppProvider');
  }
  return context;
}
