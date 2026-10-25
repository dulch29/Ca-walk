# Claude Code Prompt: Hybrid Prototype Backend

คัดลอกข้อความในเอกสารนี้ไปให้ Claude Code จาก root ของโปรเจกต์ `D:\Project\Ca-walk`

## งาน

สร้าง logic หลังบ้านสำหรับ Hybrid Prototype ของ Ca-walk โดยสร้าง/แก้เฉพาะ 4 ไฟล์นี้:

- `src/services/mockData.ts`
- `src/services/locationUtils.ts`
- `src/services/motionTracker.ts`
- `src/context/AppContext.tsx`

ถ้า `src/services/` หรือ `src/context/` ยังไม่มี ให้สร้างโฟลเดอร์ได้

ห้ามแตะไฟล์หรือโฟลเดอร์อื่น โดยเฉพาะ:

- `src/screens/`
- `src/components/`
- `package.json` และ `package-lock.json`
- `android/`
- `Docs/`

ห้ามเพิ่ม dependency และยังไม่ต้องเชื่อม Firestore ให้ใช้ local state และ mock data ก่อน
ตรวจ `package.json` และ type definitions ที่ติดตั้งจริงก่อนเขียน โค้ดต้องเข้ากับ React Native
`0.88.0`, `react-native-sensors` `7.3.6` และ `react-native-geolocation-service` `5.3.1`

## 1. `src/services/mockData.ts`

สร้างและ export interfaces/types เหล่านี้:

```ts
export interface Coordinates {
  latitude: number;
  longitude: number;
}

export interface RunSession {
  sessionId: string;
  startTime: string;
  endTime: string;
  durationSeconds: number;
  steps: number;
  distanceKm: number;
  averagePace: string;
}

export interface MerchantMetrics {
  walkIns: number;
  redeemed: number;
  feeBaht: number;
}

export interface MerchantPromotion {
  title: string;
  description: string;
  requiredDistanceKm: number;
}

export interface Merchant {
  merchantId: string;
  merchantName: string;
  category: string;
  location: Coordinates;
  promotion: MerchantPromotion;
  metrics: MerchantMetrics;
}

export type CouponStatus = "unlocked" | "redeemed" | "expired";

export interface Coupon {
  couponId: string;
  merchantId: string;
  merchantName: string;
  dealTitle: string;
  requiredDistanceKm: number;
  status: CouponStatus;
  unlockedAt: string;
  expiresAt: string;
  oneTimeToken: string;
  redeemedAt?: string;
}

export interface MockUser {
  uid: string;
  displayName: string;
  totalSteps: number;
  totalDistanceKm: number;
  redeemableDistanceKm: number;
  runHistory: RunSession[];
}
```

สร้างและ export `MOCK_USER`, `MOCK_MERCHANTS`, `MOCK_COUPONS` โดยมีเงื่อนไข:

- `MOCK_USER.runHistory` มีประวัติจำลอง 3 รอบ
- ค่า steps/distance สอดคล้องกับ `steps * 0.75` เมตร
- ยอดเริ่มต้น `totalDistanceKm` และ `redeemableDistanceKm` รวมกันเป็น `3.0`
  เพื่อให้กด `addMockDistance(1.0)` แล้วแลกดีล 4.0 km ได้
- `totalSteps` ตรงกับผลรวม steps ในประวัติ
- `MOCK_MERCHANTS` มี 5 ร้านในย่านบรรทัดทอง-สามย่าน
- ร้านหลักใช้ `merchantId: "merchant_01"` และดีล “คูปองส่วนลด 50 บาท”
  ที่มี `requiredDistanceKm: 4.0`
- ทุกร้านมี `location`, `promotion`, `metrics`
- `MOCK_COUPONS` มีคูปองตัวอย่างอย่างน้อย 1 รายการ
- AppContext ต้อง clone constants ก่อนใช้ ห้าม mutate constants โดยตรง

## 2. `src/services/locationUtils.ts`

ใช้ `Coordinates` จาก `mockData.ts` ห้ามสร้าง type ซ้ำ

สร้างและ export constants:

```ts
export const STEP_LENGTH_METERS = 0.75;
export const MAX_LEGIT_SPEED_KMH = 18;
export const MERCHANT_GEOFENCE_METERS = 50;
```

สร้างและ export functions:

```ts
export function stepsToDistanceKm(steps: number): number;
export function distanceKmToSteps(distanceKm: number): number;
export function calculatePace(
  distanceKm: number,
  durationSeconds: number,
): string;
export function calculateSpeedKmh(
  distanceKm: number,
  durationSeconds: number,
): number;
export function isSpeedFraud(
  speedKmh: number,
  maxSpeedKmh?: number,
): boolean;
export function haversineDistanceMeters(
  from: Coordinates,
  to: Coordinates,
): number;
export function isWithinGeofence(
  userLocation: Coordinates,
  merchantLocation: Coordinates,
  radiusMeters?: number,
): boolean;
```

Rules:

- `stepsToDistanceKm`: `steps * 0.75 / 1000`
- `distanceKmToSteps`: คืนค่า integer ที่ปัดใกล้ที่สุด
- input ที่ติดลบ, ไม่ finite หรือผิดรูปแบบต้องไม่ปล่อย `NaN`/`Infinity`
- pace format เป็น `M'SS" /km` เช่น `6'30" /km`
- distance หรือ duration เป็น 0 ให้คืน `"-- /km"`
- speed เป็น km/h
- fraud ใช้ strict condition `speed > 18`
- Haversine คืนระยะเป็นเมตร
- geofence default radius = 50 เมตร

## 3. `src/services/motionTracker.ts`

ใช้ `PermissionsAndroid` ขอ permission Android เหล่านี้ก่อนเริ่มติดตาม:

- `ACCESS_FINE_LOCATION`
- `ACCESS_COARSE_LOCATION`
- `ACTIVITY_RECOGNITION`

สร้าง interfaces:

```ts
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
```

สร้างและ export:

```ts
export async function requestMotionPermissions(): Promise<boolean>;
export async function startMotionTracking(
  options: MotionTrackerOptions,
): Promise<MotionTrackerHandle>;
```

Implementation rules:

- ขอ permission ก่อนเริ่ม sensor/GPS
- permission ไม่ผ่าน: `requestMotionPermissions` คืน `false`; `startMotionTracking`
  reject ด้วย Error ที่อ่านรู้เรื่อง
- ใช้ `accelerometer` จาก `react-native-sensors`
- เนื่องจาก accelerometer ไม่มี step count ให้ทำ deterministic peak/threshold detector
  ด้วย magnitude `sqrt(x*x + y*y + z*z)` และ minimum step interval เพื่อกันนับซ้ำ
- เรียก `onStep()` หนึ่งครั้งต่อหนึ่งก้าวที่ตรวจพบ
- ใช้ `watchPosition` จาก `react-native-geolocation-service`
- GPS options: `enableHighAccuracy: true`, `distanceFilter: 1`, `interval: 1000`,
  `fastestInterval: 500`
- `TrackedLocation.speedKmh` ใช้ `coords.speed` เมื่อเป็น finite และไม่ติดลบ;
  ถ้าไม่มีค่าให้ส่ง `null`; AppContext คำนวณจากตำแหน่งก่อนหน้าได้
- `stop()` unsubscribe accelerometer และ `clearWatch`
- เรียก `stop()` ซ้ำได้โดยไม่ crash
- ไม่ทำ background service และไม่แก้ AndroidManifest เพราะ permission มีอยู่แล้ว

## 4. `src/context/AppContext.tsx`

ใช้ React hooks: `createContext`, `useContext`, `useState`, `useEffect`, `useMemo`,
`useCallback`, `useRef`

สร้าง types:

```ts
export type AppMode = "user" | "merchant";

export interface ActiveRunSession {
  sessionId: string;
  startTime: string;
  steps: number;
  distanceKm: number;
  currentPace: string;
  durationSeconds: number;
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
```

สร้างและ export `AppContextValue` ให้มีอย่างน้อย:

```ts
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

  startRunSession: () => Promise<void>;
  endRunSession: () => RunSession | null;
  exchangeDistanceForCoupon: (
    merchantId: string,
  ) => DistanceOperationResult<Coupon>;
  redeemMockCoupon: (couponId: string) => DistanceOperationResult<Coupon>;
  addMockDistance: (km: number) => boolean;
  toggleSpeedFraud: () => boolean;
  warpToMerchant: (merchantId: string) => boolean;
  setMode: (mode: AppMode) => void;
}
```

Export:

```ts
export const AppContext: React.Context<AppContextValue | undefined>;
export function AppProvider(
  props: React.PropsWithChildren,
): React.JSX.Element;
export function useAppContext(): AppContextValue;
```

### State และ initialization

- clone `MOCK_USER`, `MOCK_MERCHANTS`, `MOCK_COUPONS`
- `runHistory` ต้อง sync กับ `user.runHistory`
- `activeSession = null`, `mode = "user"`, `currentLocation = null`
- `currentSpeedKmh = 0`, `speedFraudActive = false`, `trackingError = null`

### `startRunSession`

- active session มีอยู่แล้ว: ไม่สร้างซ้ำ
- ขอ permission และเรียก `startMotionTracking`
- สร้าง `sessionId` ใหม่; ใช้ deterministic counter/UUID ที่มีอยู่แล้ว ห้ามใช้
  `Math.random()` กับ business logic
- เก็บ `startTime` เป็น ISO string
- reset error, speed และ internal refs
- timer ทุก 1 วินาทีอัปเดต `durationSeconds` และ `currentPace`
- permission/tracker ล้มเหลว: clear active session แล้ว throw Error ต่อ
- ใช้ refs เพื่อให้ sensor callback ไม่เจอ stale state

### Real sensor flow

- accelerometer `onStep` เพิ่ม steps ใน active session
- GPS เป็นแหล่งหลักของ distance
- คำนวณ segment distance ด้วย Haversine ระหว่าง GPS จุดก่อนหน้า/ปัจจุบัน
- คำนวณ segment speed จาก distance/time
- ถ้า segment speed `> 18 km/h`: ตั้ง `speedFraudActive = true`, อัปเดต speed,
  ไม่เพิ่ม segment นี้เข้า distance และไม่ให้เข้า total/redeemable
- เมื่อ fraud active ให้หยุดรับ distance reward จนกว่าจะ toggle กลับ
- ห้ามบวก GPS distance กับ `stepsToDistanceKm` ซ้ำกัน
- `stepsToDistanceKm` ใช้กับ mock booster เท่านั้น
- อัปเดต `currentLocation` ทุก GPS callback

### `endRunSession`

- ไม่มี active session: คืน `null`
- stop tracker และ clear timer
- คำนวณ `endTime`, `durationSeconds`, `averagePace`
- สร้าง `RunSession` แล้ว append เข้า `runHistory` และ `user.runHistory`
- เพิ่ม `totalSteps`, `totalDistanceKm`, `redeemableDistanceKm` เฉพาะยอดที่ยังไม่ commit
- mock distance ที่เพิ่มทันทีต้องไม่ถูกบวกซ้ำตอนจบ ใช้ refs เช่น
  `committedMockSteps` และ `committedMockDistanceKm`
- ปัด distance ไม่เกิน 3 ตำแหน่ง
- reset active session และ internal refs
- คืน `RunSession` ที่บันทึก

### `exchangeDistanceForCoupon`

- หา merchant จาก `merchantId`
- ตรวจ `redeemableDistanceKm >= merchant.promotion.requiredDistanceKm`
- merchant ไม่พบหรือระยะไม่พอ: คืน `{ ok: false, reason }`
- ถ้าพอ: หักเฉพาะ `redeemableDistanceKm`; ห้ามลด `totalDistanceKm`
- สร้าง coupon ใหม่ status `"unlocked"`, `unlockedAt` เป็น ISO string,
  `expiresAt` หลัง 72 ชั่วโมง และ one-time token ที่ไม่ซ้ำใน wallet
- เพิ่ม coupon เข้า wallet แล้วคืน `{ ok: true, value: coupon }`
- ห้ามสร้าง coupon เมื่อเงื่อนไขไม่ผ่าน

### `redeemMockCoupon`

- coupon ต้องมี status `"unlocked"`
- ต้องมี `currentLocation` และอยู่ใน geofence ร้าน <= 50 เมตร
- ไม่ผ่าน: คืน failure พร้อม reason
- ผ่าน: เปลี่ยน status เป็น `"redeemed"`, ตั้ง `redeemedAt`
- เพิ่ม merchant metrics: `walkIns += 1`, `redeemed += 1`, `feeBaht += 8`
- coupon ใช้ซ้ำไม่ได้

### `addMockDistance`

- รับเฉพาะ finite number ที่มากกว่า 0
- ไม่มี active session หรือ fraud active: คืน `false`
- แปลง km เป็น steps ด้วย `distanceKmToSteps`
- เพิ่ม steps/distance เข้า active session และยอดสะสมทันที
- อัปเดต `totalSteps`, `totalDistanceKm`, `redeemableDistanceKm`
- เก็บ committed mock values กัน end session บวกซ้ำ
- สำเร็จคืน `true`

### Stage demo

- `toggleSpeedFraud()` สลับ state และคืน state ใหม่
- `warpToMerchant(merchantId)` ตั้ง current location ให้อยู่ห่างร้านประมาณ 12 เมตร
  แล้วคืน `true`; merchant ไม่พบคืน `false`
- Haversine ต้องตรวจได้จริงว่าอยู่ใน geofence
- ใช้ immutable state updates ทุกจุด

### Context quality

- `useAppContext()` ต้อง throw Error ถ้าเรียกนอก `AppProvider`
- cleanup timer/tracker ใน `useEffect`
- ห้ามมี `any`
- normal failure คืน typed result; throw เฉพาะ permission/start tracker failure
- ห้ามแก้ UI เพราะเพื่อนกำลังทำอยู่

## Verification

รันจาก root:

```powershell
npx tsc --noEmit
npm run lint
```

ถ้า error ให้แก้เฉพาะ 4 ไฟล์ที่ได้รับอนุญาต ห้ามแก้ package หรือไฟล์อื่นเพื่อกลบ error

รายงานท้ายงาน:

1. ไฟล์ที่สร้าง/แก้
2. public types/functions ที่ export
3. ผล `npx tsc --noEmit`
4. ผล `npm run lint`
5. ข้อจำกัดที่ยังต้องทดสอบบน Android เครื่องจริง โดยเฉพาะ accelerometer step detection,
   GPS และ permission flow
