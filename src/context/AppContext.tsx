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
  calculatePace,
  calculateSpeedKmh,
  distanceKmToSteps,
  haversineDistanceMeters,
  isSpeedFraud,
  isWithinGeofence,
  MERCHANT_GEOFENCE_METERS,
  stepsToDistanceKm,
} from '../services/locationUtils';
import {
  requestLocationPermissions,
  startLocationWatch,
  startMotionTracking,
  type MotionTrackerHandle,
  type TrackedLocation,
} from '../services/motionTracker';
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
  startTime: string;
  steps: number;
  distanceKm: number;
  gpsDistanceKm: number;
  lastAcceptedLocation?: TrackedLocation;
  currentPace: string;
  durationSeconds: number;
  status: 'recording' | 'paused';
  destination?: ActivityDestination;
  photos: string[];
  trackCoordinates: Array<[number, number]>;
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
  currentSpeedKmh: number;
  speedFraudActive: boolean;
  trackingError: string | null;
  selectedDestination: ActivityDestination | null;
  setSelectedDestination: (destination: ActivityDestination | null) => void;
  requestLocationPermission: () => Promise<boolean>;
  startRunSession: (destination?: ActivityDestination) => Promise<void>;
  pauseRunSession: () => void;
  resumeRunSession: () => void;
  endRunSession: () => RunSession | null;
  addSessionPhoto: (photoUri: string) => void;
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
  const selectedDestinationRef = useRef<ActivityDestination | null>(null);
  const trackerRef = useRef<MotionTrackerHandle | null>(null);
  const passiveTrackerRef = useRef<MotionTrackerHandle | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const previousLocationRef = useRef<TrackedLocation | null>(null);
  const committedMockStepsRef = useRef(0);
  const committedMockDistanceRef = useRef(0);
  const sessionCounterRef = useRef(0);
  const couponCounterRef = useRef(0);
  const fraudRef = useRef(false);
  const sustainedFastCountRef = useRef(0);

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

  const handleStep = useCallback(() => {
    updateActiveSession((previous) => {
      if (!previous || previous.status !== 'recording') {
        return previous;
      }
      const nextSteps = previous.steps + 1;
      const stepDistanceKm = stepsToDistanceKm(nextSteps);
      // Accelerometer step fusion: ensure distance doesn't stall if GPS is weak
      const fusedDistanceKm = Math.max(
        previous.distanceKm,
        roundDistance(stepDistanceKm * 0.95),
      );
      return {
        ...previous,
        steps: nextSteps,
        distanceKm: fusedDistanceKm,
        currentPace: calculatePace(fusedDistanceKm, previous.durationSeconds),
      };
    });
  }, [updateActiveSession]);

  const handleLocation = useCallback(
    (location: TrackedLocation) => {
      currentLocationRef.current = location;
      setCurrentLocation({
        latitude: location.latitude,
        longitude: location.longitude,
      });

      const session = activeSessionRef.current;
      if (!session || session.status !== 'recording') {
        return;
      }

      // Filter out fixes with poor accuracy (> 25m) to prevent GPS jumps through houses
      if (location.accuracy !== null && location.accuracy > 25) {
        return;
      }

      const previous = previousLocationRef.current;
      let segmentDistanceKm = 0;
      let segmentSpeedKmh = location.speedKmh ?? 0;

      if (previous && location.timestamp > previous.timestamp) {
        const elapsedSeconds = Math.max(
          0.1,
          (location.timestamp - previous.timestamp) / 1000,
        );
        const segmentDistanceMeters = haversineDistanceMeters(previous, location);

        // Anti-glitch: a human walker/runner cannot jump > 6.0 m/s (~21.6 km/h) in small intervals (< 5s)
        // If distance jumped > 6.0 m/s * elapsedSeconds, it's a GPS multipath glitch jumping across a building
        const maxRealisticJumpMeters = Math.max(12, elapsedSeconds * 6.0);
        if (segmentDistanceMeters > maxRealisticJumpMeters && elapsedSeconds < 5) {
          // Drop this single outlier glitch, do NOT advance previous to this jump
          return;
        }

        // Deadband filter: ignore micro-movements < 2.5 meters to prevent stationary jitter/drift
        if (segmentDistanceMeters < 2.5) {
          if (!isSpeedFraud(location.speedKmh ?? 0)) {
            updateActiveSession(current =>
              current ? { ...current, lastAcceptedLocation: location } : current,
            );
          }
          return;
        }

        segmentDistanceKm = segmentDistanceMeters / 1000;
        const calculatedSpeed = calculateSpeedKmh(
          segmentDistanceKm,
          elapsedSeconds,
        );
        segmentSpeedKmh =
          location.speedKmh !== null && location.speedKmh > 0
            ? location.speedKmh
            : calculatedSpeed;
      }

      // Accept this valid location update
      previousLocationRef.current = location;
      setCurrentSpeedKmh(Number.isFinite(segmentSpeedKmh) ? segmentSpeedKmh : 0);

      // Check speed fraud (faster than Pace 2 / 30 km/h):
      // Require sustained vehicle speed (at least 3 consecutive updates) to prevent false alerts while walking
      const isTooFast = isSpeedFraud(segmentSpeedKmh);
      if (isTooFast) {
        sustainedFastCountRef.current += 1;
      } else {
        sustainedFastCountRef.current = 0;
      }

      const isSustainedVehicleSpeed = sustainedFastCountRef.current >= 3;
      setSpeedFraudActive(isSustainedVehicleSpeed);
      if (isSustainedVehicleSpeed) {
        // Discard distance accumulation while traveling in a vehicle
        return;
      }

      updateActiveSession((current) => {
        if (!current || current.status !== 'recording') {
          return current;
        }
        const coord: [number, number] = [location.longitude, location.latitude];
        if (current.trackCoordinates.length === 0) {
          return {
            ...current,
            trackCoordinates: [coord],
            lastAcceptedLocation: location,
          };
        }
        if (segmentDistanceKm <= 0) {
          return { ...current, lastAcceptedLocation: location };
        }

        const nextGpsDist = roundDistance(current.distanceKm + segmentDistanceKm);
        const stepDist = stepsToDistanceKm(current.steps);
        // Fuse GPS distance with step distance baseline
        const distanceKm = Math.max(nextGpsDist, roundDistance(stepDist * 0.95));

        const last = current.trackCoordinates[current.trackCoordinates.length - 1];
        const newTrack =
          !last || last[0] !== coord[0] || last[1] !== coord[1]
            ? [...current.trackCoordinates, coord]
            : current.trackCoordinates;

        return {
          ...current,
          distanceKm,
          gpsDistanceKm: current.gpsDistanceKm + segmentDistanceKm,
          lastAcceptedLocation: location,
          trackCoordinates: newTrack,
          currentPace: calculatePace(distanceKm, current.durationSeconds),
        };
      });
    },
    [updateActiveSession],
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

  const requestLocationPermission = useCallback(async (): Promise<boolean> => {
    try {
      const granted = await requestLocationPermissions();
      if (granted && !passiveTrackerRef.current && !trackerRef.current) {
        try {
          const handle = await startLocationWatch(
            (loc) => {
              currentLocationRef.current = loc;
              setCurrentLocation({
                latitude: loc.latitude,
                longitude: loc.longitude,
              });
            },
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
  }, []);

  const startRunSession = useCallback(
    async (destination?: ActivityDestination) => {
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
        sessionId: `run_live_${String(sessionCounterRef.current).padStart(4, '0')}`,
        startTime,
        steps: 0,
        distanceKm: 0,
        gpsDistanceKm: 0,
        currentPace: '-- /km',
        durationSeconds: 0,
        status: 'recording',
        destination: chosenDestination,
        photos: [],
        trackCoordinates: [],
      };
      committedMockStepsRef.current = 0;
      committedMockDistanceRef.current = 0;
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
        stopTracking();
        const message =
          error instanceof Error ? error.message : 'เริ่มการเดินไม่สำเร็จ';
        setTrackingError(message);
        throw error instanceof Error ? error : new Error(message);
      }

      if (timerRef.current !== null) {
        clearInterval(timerRef.current);
      }
      timerRef.current = setInterval(() => {
        updateActiveSession((session) => {
          if (!session || session.status !== 'recording') {
            return session;
          }
          const durationSeconds = session.durationSeconds + 1;
          return {
            ...session,
            durationSeconds,
            currentPace: calculatePace(session.distanceKm, durationSeconds),
          };
        });
      }, 1000);
    },
    [
      handleLocation,
      handleStep,
      handleTrackingError,
      stopTracking,
      updateActiveSession,
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
    previousLocationRef.current = null;
    updateActiveSession((session) => {
      if (!session) {
        return null;
      }
      return { ...session, status: 'paused' };
    });
  }, [updateActiveSession]);

  const resumeRunSession = useCallback(() => {
    const current = activeSessionRef.current;
    if (!current || current.status !== 'paused') {
      return;
    }
    previousLocationRef.current = null;
    updateActiveSession((session) => {
      if (!session) {
        return null;
      }
      return { ...session, status: 'recording' };
    });

    if (timerRef.current !== null) {
      clearInterval(timerRef.current);
    }
    timerRef.current = setInterval(() => {
      updateActiveSession((session) => {
        if (!session || session.status !== 'recording') {
          return session;
        }
        const durationSeconds = session.durationSeconds + 1;
        return {
          ...session,
          durationSeconds,
          currentPace: calculatePace(session.distanceKm, durationSeconds),
        };
      });
    }, 1000);
  }, [updateActiveSession]);

  const addSessionPhoto = useCallback(
    (photoUri: string) => {
      updateActiveSession((previous) => {
        if (!previous) {
          return previous;
        }
        return {
          ...previous,
          photos: [...previous.photos, photoUri],
        };
      });
    },
    [updateActiveSession],
  );

  const endRunSession = useCallback((): RunSession | null => {
    const current = activeSessionRef.current;
    if (!current) {
      return null;
    }

    stopTracking();
    const endTime = new Date().toISOString();
    const durationSeconds = current.durationSeconds;
    const distanceKm = roundDistance(current.distanceKm);
    const completed: RunSession = {
      sessionId: current.sessionId,
      startTime: current.startTime,
      endTime,
      durationSeconds,
      steps: current.steps,
      distanceKm,
      gpsDistanceKm: current.gpsDistanceKm,
      averagePace: calculatePace(distanceKm, durationSeconds),
      destinationName: current.destination?.name,
      photos: [...current.photos],
      trackCoordinates: current.trackCoordinates.map(([lng, lat]) => [lng, lat]),
    };
    const newRunHistory = [...runHistoryRef.current, completed];
    runHistoryRef.current = newRunHistory;
    setRunHistory(newRunHistory);

    const uncommittedSteps = Math.max(
      0,
      current.steps - committedMockStepsRef.current,
    );
    const uncommittedDistance = Math.max(
      0,
      distanceKm - committedMockDistanceRef.current,
    );
    updateUser((previous) => ({
      ...previous,
      totalSteps: previous.totalSteps + uncommittedSteps,
      totalDistanceKm: roundDistance(
        previous.totalDistanceKm + uncommittedDistance,
      ),
      redeemableDistanceKm: roundDistance(
        previous.redeemableDistanceKm + uncommittedDistance,
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
    committedMockStepsRef.current = 0;
    committedMockDistanceRef.current = 0;
    setCurrentSpeedKmh(0);
    setSelectedDestination(null);
    return completed;
  }, [stopTracking, updateUser]);

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
      committedMockStepsRef.current += steps;
      committedMockDistanceRef.current = roundDistance(
        committedMockDistanceRef.current + actualDistanceKm,
      );
      updateActiveSession((previous) => {
        if (!previous) {
          return previous;
        }
        const distanceKm = roundDistance(previous.distanceKm + actualDistanceKm);
        return {
          ...previous,
          steps: previous.steps + steps,
          distanceKm,
          currentPace: calculatePace(distanceKm, previous.durationSeconds),
        };
      });
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
    [updateActiveSession, updateUser],
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
      activeSessionRef.current = null;
    },
    [stopTracking],
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
      currentSpeedKmh,
      speedFraudActive,
      trackingError,
      selectedDestination,
      setSelectedDestination,
      requestLocationPermission,
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
      currentSpeedKmh,
      speedFraudActive,
      trackingError,
      selectedDestination,
      setSelectedDestination,
      requestLocationPermission,
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
