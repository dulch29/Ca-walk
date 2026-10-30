import {
  collection,
  doc,
  FieldValue,
  getDoc,
  getDocs,
  getFirestore,
  limit,
  orderBy,
  query,
  setDoc,
} from '@react-native-firebase/firestore';
import type { Coupon, Merchant, RunSession } from './mockData';
import { getCurrentFirebaseUser } from './firebase';
import {
  calculateAveragePaceSecondsPerKm,
  calculatePace,
} from './locationUtils';

export interface FirestoreUserProfile {
  uid: string;
  displayName: string;
  avatarUrl: string | null;
  email: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface UserProfileInput {
  displayName: string;
  avatarUrl?: string | null;
  email?: string | null;
}

export type FirestoreCoupon = Coupon;
export type FirestoreMerchant = Merchant;

type FirestoreRecord = Record<string, unknown>;

const DEFAULT_PAGE_SIZE = 20;
const MAX_PAGE_SIZE = 100;
const SAFE_DOCUMENT_ID = /^[A-Za-z0-9][A-Za-z0-9_.-]{0,127}$/;

function asRecord(value: unknown): FirestoreRecord | null {
  return typeof value === 'object' && value !== null
    ? (value as FirestoreRecord)
    : null;
}

function timestampToIso(value: unknown): string | null {
  let date: Date | null = null;
  if (value instanceof Date) {
    date = value;
  } else if (typeof value === 'string') {
    const parsed = new Date(value);
    date = Number.isNaN(parsed.getTime()) ? null : parsed;
  } else {
    const record = asRecord(value);
    if (record && typeof record.toDate === 'function') {
      try {
        const parsed: unknown = record.toDate();
        date = parsed instanceof Date ? parsed : null;
      } catch {
        date = null;
      }
    } else if (record && typeof record.toMillis === 'function') {
      try {
        const millis: unknown = record.toMillis();
        date = typeof millis === 'number' ? new Date(millis) : null;
      } catch {
        date = null;
      }
    } else if (
      record &&
      typeof record.seconds === 'number' &&
      typeof record.nanoseconds === 'number'
    ) {
      date = new Date(record.seconds * 1000 + record.nanoseconds / 1e6);
    }
  }
  return date && Number.isFinite(date.getTime()) ? date.toISOString() : null;
}

function finiteNumber(value: unknown): number | null {
  return typeof value === 'number' && Number.isFinite(value) ? value : null;
}

function nonNegativeInteger(value: unknown): number | null {
  const number = finiteNumber(value);
  return number !== null && Number.isInteger(number) && number >= 0
    ? number
    : null;
}

function pageSize(value: number | undefined): number {
  if (value === undefined || !Number.isFinite(value)) {
    return DEFAULT_PAGE_SIZE;
  }
  return Math.min(MAX_PAGE_SIZE, Math.max(1, Math.floor(value)));
}

function requireOwner(uid: string): void {
  const user = getCurrentFirebaseUser();
  if (!SAFE_DOCUMENT_ID.test(uid) || !user || user.uid !== uid) {
    throw new Error('Firebase authentication required for this user');
  }
}

function mapUserProfile(
  uid: string,
  data: FirestoreRecord | undefined,
): FirestoreUserProfile | null {
  if (!data || typeof data.displayName !== 'string') {
    return null;
  }
  const createdAt = timestampToIso(data.createdAt);
  const updatedAt = timestampToIso(data.updatedAt);
  if (!createdAt || !updatedAt) {
    return null;
  }
  return {
    uid,
    displayName: data.displayName,
    avatarUrl: typeof data.avatarUrl === 'string' ? data.avatarUrl : null,
    email: typeof data.email === 'string' ? data.email : null,
    createdAt,
    updatedAt,
  };
}

function mapRunActivity(
  id: string,
  data: FirestoreRecord | undefined,
): RunSession | null {
  if (!data) {
    return null;
  }
  const steps = nonNegativeInteger(data.steps);
  const durationSeconds = nonNegativeInteger(data.durationSeconds);
  const distanceKm = finiteNumber(data.distanceKm);
  const startTime = timestampToIso(data.startedAt);
  const endTime = timestampToIso(data.endedAt);
  if (
    steps === null ||
    durationSeconds === null ||
    distanceKm === null ||
    distanceKm < 0 ||
    !startTime ||
    !endTime ||
    typeof data.averagePace !== 'string'
  ) {
    return null;
  }
  return {
    sessionId: id,
    startTime,
    endTime,
    durationSeconds,
    steps,
    distanceKm,
    averagePace: data.averagePace,
    ...(data.sport === 'walk' || data.sport === 'run'
      ? { sport: data.sport }
      : {}),
    averagePaceSecondsPerKm:
      data.averagePaceSecondsPerKm === null
        ? null
        : finiteNumber(data.averagePaceSecondsPerKm) ??
          calculateAveragePaceSecondsPerKm(distanceKm, durationSeconds),
    ...(data.distanceSource === 'gps' || data.distanceSource === 'unavailable'
      ? { distanceSource: data.distanceSource }
      : {}),
    ...(data.completionReason === 'manual' || data.completionReason === 'arrived'
      ? { completionReason: data.completionReason }
      : {}),
    ...(typeof data.destinationName === 'string'
      ? { destinationName: data.destinationName }
      : {}),
  };
}

function mapCoupon(id: string, data: FirestoreRecord | undefined): Coupon | null {
  if (!data) {
    return null;
  }
  const requiredDistanceKm = finiteNumber(data.requiredDistanceKm);
  const unlockedAt = timestampToIso(data.unlockedAt);
  const expiresAt = timestampToIso(data.expiresAt);
  const redeemedAt = data.redeemedAt
    ? timestampToIso(data.redeemedAt)
    : undefined;
  if (
    typeof data.merchantId !== 'string' ||
    typeof data.merchantName !== 'string' ||
    typeof data.dealTitle !== 'string' ||
    typeof data.oneTimeToken !== 'string' ||
    !['unlocked', 'redeemed', 'expired'].includes(String(data.status)) ||
    requiredDistanceKm === null ||
    requiredDistanceKm < 0 ||
    !unlockedAt ||
    !expiresAt ||
    (data.redeemedAt !== undefined && !redeemedAt)
  ) {
    return null;
  }
  return {
    couponId: id,
    merchantId: data.merchantId,
    merchantName: data.merchantName,
    dealTitle: data.dealTitle,
    requiredDistanceKm,
    status: data.status as Coupon['status'],
    unlockedAt,
    expiresAt,
    oneTimeToken: data.oneTimeToken,
    ...(redeemedAt ? { redeemedAt } : {}),
  };
}

function mapMerchant(
  id: string,
  data: FirestoreRecord | undefined,
): Merchant | null {
  if (!data) {
    return null;
  }
  const location = asRecord(data.location);
  const promotion = asRecord(data.promotion);
  const metrics = asRecord(data.metrics);
  const latitude = finiteNumber(location?.latitude);
  const longitude = finiteNumber(location?.longitude);
  const requiredDistanceKm = finiteNumber(promotion?.requiredDistanceKm);
  const walkIns = nonNegativeInteger(metrics?.walkIns);
  const redeemed = nonNegativeInteger(metrics?.redeemed);
  const feeBaht = nonNegativeInteger(metrics?.feeBaht);
  if (
    typeof data.merchantName !== 'string' ||
    typeof data.category !== 'string' ||
    typeof promotion?.title !== 'string' ||
    typeof promotion.description !== 'string' ||
    latitude === null ||
    Math.abs(latitude) > 90 ||
    longitude === null ||
    Math.abs(longitude) > 180 ||
    requiredDistanceKm === null ||
    requiredDistanceKm < 0 ||
    walkIns === null ||
    redeemed === null ||
    feeBaht === null
  ) {
    return null;
  }
  return {
    merchantId: id,
    merchantName: data.merchantName,
    category: data.category,
    location: { latitude, longitude },
    promotion: {
      title: promotion.title,
      description: promotion.description,
      requiredDistanceKm,
    },
    metrics: { walkIns, redeemed, feeBaht },
  };
}

export async function getUserProfile(
  uid: string,
): Promise<FirestoreUserProfile | null> {
  requireOwner(uid);
  const snapshot = await getDoc(doc(getFirestore(), 'users', uid));
  return snapshot.exists()
    ? mapUserProfile(uid, asRecord(snapshot.data()) ?? undefined)
    : null;
}

export async function upsertUserProfile(
  uid: string,
  profile: UserProfileInput,
): Promise<void> {
  requireOwner(uid);
  const displayName = profile.displayName.trim();
  if (!displayName || displayName.length > 120) {
    throw new Error('Display name must contain 1 to 120 characters');
  }
  if (
    profile.avatarUrl != null &&
    (typeof profile.avatarUrl !== 'string' || profile.avatarUrl.length > 2048)
  ) {
    throw new Error('Avatar URL must be a string of at most 2048 characters');
  }
  if (
    profile.email != null &&
    (typeof profile.email !== 'string' || profile.email.length > 254)
  ) {
    throw new Error('Email must be a string of at most 254 characters');
  }

  const userRef = doc(getFirestore(), 'users', uid);
  const snapshot = await getDoc(userRef);
  const payload: FirestoreRecord = {
    displayName,
    updatedAt: FieldValue.serverTimestamp(),
  };
  if (profile.avatarUrl !== undefined) {
    payload.avatarUrl = profile.avatarUrl;
  }
  if (profile.email !== undefined) {
    payload.email = profile.email;
  }
  if (!snapshot.exists()) {
    payload.avatarUrl ??= null;
    payload.email ??= null;
    payload.createdAt = FieldValue.serverTimestamp();
  }
  await setDoc(userRef, payload, { merge: true });
}

export async function saveRunActivity(
  uid: string,
  session: RunSession,
): Promise<string> {
  requireOwner(uid);
  if (!SAFE_DOCUMENT_ID.test(session.sessionId)) {
    throw new Error('Run activity sessionId must be a safe Firestore document ID');
  }
  const startedAt = new Date(session.startTime);
  const endedAt = new Date(session.endTime);
  if (
    !Number.isInteger(session.steps) ||
    session.steps < 0 ||
    !Number.isInteger(session.durationSeconds) ||
    session.durationSeconds < 0 ||
    !Number.isFinite(session.distanceKm) ||
    session.distanceKm < 0 ||
    !Number.isFinite(startedAt.getTime()) ||
    !Number.isFinite(endedAt.getTime()) ||
    endedAt.getTime() < startedAt.getTime() ||
    typeof session.averagePace !== 'string'
  ) {
    throw new Error('Run activity contains invalid data');
  }
  const activityRef = doc(
    getFirestore(),
    'users',
    uid,
    'activities',
    session.sessionId,
  );
  const averagePaceSecondsPerKm =
    session.averagePaceSecondsPerKm ??
    calculateAveragePaceSecondsPerKm(
      session.distanceKm,
      session.durationSeconds,
    );
  const payload: FirestoreRecord = {
    sessionId: session.sessionId,
    sport: session.sport ?? 'walk',
    steps: session.steps,
    distanceKm: session.distanceKm,
    durationSeconds: session.durationSeconds,
    averagePace:
      session.averagePace ||
      calculatePace(session.distanceKm, session.durationSeconds),
    averagePaceSecondsPerKm,
    distanceSource:
      session.distanceSource ??
      (session.distanceKm > 0 ? 'gps' : 'unavailable'),
    startedAt,
    endedAt,
    createdAt: FieldValue.serverTimestamp(),
  };
  if (session.completionReason) {
    payload.completionReason = session.completionReason;
  }
  if (session.destinationName) {
    payload.destinationName = session.destinationName;
  }
  await setDoc(activityRef, payload);
  return activityRef.id || session.sessionId;
}

export async function listRunActivities(
  uid: string,
  requestedPageSize?: number,
): Promise<RunSession[]> {
  requireOwner(uid);
  const activities = collection(getFirestore(), 'users', uid, 'activities');
  const results = await getDocs(
    query(activities, orderBy('endedAt', 'desc'), limit(pageSize(requestedPageSize))),
  );
  return results.docs.flatMap((snapshot) => {
    const activity = mapRunActivity(
      snapshot.id,
      asRecord(snapshot.data()) ?? undefined,
    );
    return activity ? [activity] : [];
  });
}

export async function listUserCoupons(
  uid: string,
  requestedPageSize?: number,
): Promise<FirestoreCoupon[]> {
  requireOwner(uid);
  const coupons = collection(getFirestore(), 'users', uid, 'coupons');
  const results = await getDocs(
    query(coupons, orderBy('unlockedAt', 'desc'), limit(pageSize(requestedPageSize))),
  );
  return results.docs.flatMap((snapshot) => {
    const coupon = mapCoupon(snapshot.id, asRecord(snapshot.data()) ?? undefined);
    return coupon ? [coupon] : [];
  });
}

export async function listMerchants(
  requestedPageSize?: number,
): Promise<FirestoreMerchant[]> {
  const merchants = collection(getFirestore(), 'merchants');
  const results = await getDocs(query(merchants, limit(pageSize(requestedPageSize))));
  return results.docs.flatMap((snapshot) => {
    const merchant = mapMerchant(
      snapshot.id,
      asRecord(snapshot.data()) ?? undefined,
    );
    return merchant ? [merchant] : [];
  });
}

// Kept private to the app; exported only so pure mapper tests can avoid a native Firestore runtime.
export const __testing = { mapRunActivity, mapCoupon, mapMerchant, mapUserProfile };
