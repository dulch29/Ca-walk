# Firebase Backend Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add authenticated Firebase/Firestore persistence while preserving the existing frontend mock data and hands-off boundaries.

**Architecture:** Keep Firebase Auth and Firestore behind two services. AppContext remains the local source used by the prototype and persists completed run activities only when a Firebase user is present. Firestore rules deny client-owned reward mutations.

**Tech Stack:** React Native 0.88.0, TypeScript 6, `@react-native-firebase/app/auth/firestore` 27.1.0, `@react-native-google-signin/google-signin` 16.1.5, Jest.

**Spec:** `docs/superpowers/specs/2026-10-25-firebase-backend-design.md`

## Global Constraints

- Do not modify `src/screens/`, `src/components/`, or `App.tsx`.
- Do not add Firebase Storage.
- Never hardcode a Google Web Client ID or Firebase secret.
- Client cannot write totals, redeemable balance, coins, mission rewards, or coupon status.
- Preserve mock fallback when Firebase auth is absent or persistence fails.

---

### Task 1: Firebase Auth service

**Files:**
- Create: `src/services/firebase.ts`
- Test: `__tests__/firebaseService.test.ts`

**Interfaces:**
- `getFirebaseAuth(): Auth`
- `getCurrentFirebaseUser(): User | null`
- `subscribeToAuthState(listener: (user: User | null) => void): () => void`
- `signInWithGoogle(webClientId: string): Promise<UserCredential>`
- `signOutFirebase(): Promise<void>`

- [ ] Write tests for rejecting an empty Web Client ID and for mapping a successful Google credential.
- [ ] Mock only native Google Sign-In and Firebase Auth at the boundary.
- [ ] Implement validation, Play Services check, Google ID token credential, auth sign-in, and sign-out.
- [ ] Run `npx jest --runInBand __tests__/firebaseService.test.ts`.

### Task 2: Typed Firestore service

**Files:**
- Create: `src/services/firestoreService.ts`
- Test: `__tests__/firestoreService.test.ts`

**Interfaces:**
- `getUserProfile(uid: string): Promise<FirestoreUserProfile | null>`
- `upsertUserProfile(uid: string, profile: UserProfileInput): Promise<void>`
- `saveRunActivity(uid: string, session: RunSession): Promise<string>`
- `listRunActivities(uid: string, pageSize?: number): Promise<RunSession[]>`
- `listUserCoupons(uid: string, pageSize?: number): Promise<FirestoreCoupon[]>`
- `listMerchants(pageSize?: number): Promise<FirestoreMerchant[]>`

- [ ] Write mapper tests for Firestore timestamps and invalid numeric data.
- [ ] Implement authenticated-owner checks, server timestamps, bounded page sizes, and read mapping.
- [ ] Do not expose helpers that write totals or coupon status.
- [ ] Run focused Jest tests and `npx tsc --noEmit`.

### Task 3: Firestore authorization rules

**Files:**
- Create: `firestore.rules`
- Create: `firebase.json`

- [ ] Allow signed-in users to read their own profile/activity/coupon subcollections.
- [ ] Allow profile create/update only for allowlisted profile fields and server timestamps.
- [ ] Allow activity create only for the owner with immutable validated run fields.
- [ ] Deny client writes to coupons, missions, totals, and merchants.
- [ ] Run Firebase Rules emulator validation when Firebase CLI is available; otherwise run structural review.

### Task 4: AppContext persistence hook

**Files:**
- Modify: `src/context/AppContext.tsx`
- Test: `__tests__/AppContext.firebase.test.tsx`

- [ ] Write a test proving completed sessions call persistence only when an auth user exists.
- [ ] Persist the completed activity after local state is finalized; swallow persistence errors into `trackingError` without losing local data.
- [ ] Keep all screen/component imports unchanged.
- [ ] Run focused test, full Jest, lint, and TypeScript checks.

### Task 5: Final verification

- [ ] Run `npx tsc --noEmit`.
- [ ] Run `npm run lint`.
- [ ] Run `npm test -- --runInBand`.
- [ ] Confirm `git diff -- src/screens src/components App.tsx` is empty.
- [ ] Confirm no Firebase secret or Web Client ID was added to tracked source.
