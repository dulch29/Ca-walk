# Ca-walk Firebase Backend Design

## Goal

เพิ่มชั้น Firebase backend สำหรับ Android prototype โดยไม่แก้ `src/screens/`, `src/components/` หรือ `App.tsx` และยังคง mock fallback สำหรับ frontend เดิม

## Scope

- Firebase Auth helper สำหรับ Google Sign-In ที่รับ Web Client ID จาก caller
- Firestore service สำหรับ profile, run activity, user coupons และ public merchants
- Firestore rules ที่ให้ผู้ใช้เข้าถึงข้อมูลของตัวเอง และห้าม client แก้ยอด reward/coupon state
- AppContext persist เฉพาะ run activity เมื่อมี authenticated Firebase user
- ไม่เปิด Firebase Storage

## Data Contract

```text
users/{uid}
  displayName: string
  avatarUrl: string | null
  email: string | null
  createdAt: timestamp
  updatedAt: timestamp

users/{uid}/activities/{activityId}
  sport: "walk" | "run"
  steps: number
  distanceKm: number
  durationSeconds: number
  averagePace: string
  startedAt: timestamp
  endedAt: timestamp
  createdAt: timestamp

users/{uid}/coupons/{couponId}
  read-only from client; claims/redeems are trusted-server work

merchants/{merchantId}
  public read-only merchant/promotion document
```

The client may create an activity only once and cannot update/delete it. Totals,
redeemable distance, missions, coupon claims, and coupon redemption remain
server-owned. A Cloud Function or other trusted backend is required before
production reward issuance.

## Implementation Boundaries

- `src/services/firebase.ts` owns Firebase Auth and Google Sign-In only.
- `src/services/firestoreService.ts` owns typed Firestore reads/writes and date conversion.
- `firestore.rules` is the authorization boundary; it never trusts client totals.
- `src/context/AppContext.tsx` calls `saveRunActivity` as best-effort persistence;
  local state remains usable when signed out/offline.

## Official References

- React Native Firebase Auth: https://rnfirebase.io/auth/usage
- React Native Firebase Firestore: https://rnfirebase.io/firestore/usage
- Firestore rules conditions: https://firebase.google.com/docs/firestore/security/rules-conditions
- Firestore rules structure: https://firebase.google.com/docs/firestore/security/rules-structure
