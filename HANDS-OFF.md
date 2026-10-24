# Ca-walk Backend Handoff

## Current Frontend State

The frontend is complete as a navigation and UI prototype. It currently reads static data from:

- `src/data/mock.ts`: wallet, quests, coupons, stores, and store coupons
- `src/data/meMock.ts`: profile, activities, and coupon history

Replace these imports with repository/service calls incrementally. Keep the existing TypeScript shapes stable while the backend is being connected.

## Backend Responsibilities

1. Authentication and user profiles
2. Walking/running activity recording
3. Distance, step, calorie, and coin totals
4. Daily, weekly, and special missions
5. Coupon issuance, locking, redemption, and expiry
6. Store listings, store details, and store coupons
7. User profile editing and avatar persistence
8. Secure authorization and server-side reward validation

## Suggested Data Model

### `users/{userId}`

```text
displayName
avatarUrl
email
totalKm
totalSteps
coins
createdAt
updatedAt
```

### `users/{userId}/activities/{activityId}`

```text
sport: walk | run
distanceKm
steps
calories
paceSecondsPerKm
durationSeconds
startedAt
endedAt
route: optional encoded/polyline data
createdAt
```

### `missions/{missionId}`

```text
kind: daily | weekly | special
title
icon
goal
unit
rewardCoins
startsAt
endsAt
active
```

### `users/{userId}/missionProgress/{missionId}`

```text
progress
completedAt: optional
claimedAt: optional
```

### `stores/{storeId}`

```text
name
latitude
longitude
rating
reviewCount
tags
openingHours
address
active
```

### `coupons/{couponId}` and `users/{userId}/coupons/{couponId}`

Store the offer definition separately from the user claim. Coupon status must be validated on the server:

```text
title
storeId
description
expiresAt
unlockKm
status: locked | usable | used | expired
claimedAt
usedAt
redemptionCode
```

## Frontend Integration Map

| Frontend screen | Backend operation |
| --- | --- |
| `LoginScreen` | Google Sign-In/Firebase Auth; create or load user profile |
| `HomeScreen` | Load wallet summary, active missions, nearby stores, and usable coupons |
| `RecordScreen` | Create activity; calculate totals and reward through a trusted backend path |
| `DistanceWalletScreen` | Read wallet balance and coin transaction history |
| `MissionsScreen` | Read active missions and user progress; claim completed rewards |
| `MapScreen` | Query active stores near the user's location |
| `StoreDetailScreen` | Load store details and available store coupons |
| `MyCouponsScreen` | Load user coupons and redeem one coupon |
| `ProfileEditScreen` | Update display name and avatar URL |
| `ActivityHistoryScreen` | Paginated activity history, filtered by month/date |
| `ActivityDetailScreen` | Load one activity and its route/statistics |
| `CouponHistoryScreen` | Load used and expired coupon history |

## Integration Rules

- Do not trust client-provided coin totals, distance rewards, coupon status, or mission completion.
- Use server timestamps rather than formatted display strings.
- Return numeric values as numbers; format dates, distance, and pace in the frontend.
- Add pagination to activities, coupon history, and store queries.
- Handle loading, empty, error, and offline states without removing the mock fallback prematurely.
- Keep Firebase configuration out of Git. Add `android/app/google-services.json` locally and configure iOS separately.
- Add Firestore security rules before enabling production data.

## Recommended Implementation Order

1. Firebase project, Android/iOS configuration, and authentication
2. User profile read/update
3. Activity creation and activity history
4. Wallet totals and coin ledger
5. Missions and reward claiming
6. Stores and location queries
7. Coupon claims and redemption
8. Security rules, validation, and error handling

## Definition Of Done

- A new user can sign in and receives a profile document.
- A recorded activity persists and appears in history after app restart.
- Wallet totals are derived from persisted activities and ledger entries.
- Mission progress and rewards are idempotent and server-validated.
- Coupons cannot be redeemed twice, after expiry, or without authorization.
- Store queries work with real coordinates and reasonable pagination.
- Firestore rules deny access to another user's private data.
- Frontend mock imports are replaced one feature at a time, with tests for each backend operation.

## Useful Files

- `App.tsx` - navigation and route parameters
- `src/data/mock.ts` - primary data shape reference
- `src/data/meMock.ts` - profile/history data shape reference
- `src/screens/LoginScreen.tsx` - auth integration point
- `src/screens/RecordScreen.tsx` - activity payload integration point
- `src/screens/ProfileEditScreen.tsx` - profile update integration point
- `android/app/build.gradle` - Android Firebase plugin setup
