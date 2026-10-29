# Map, Nearby Search & Activity Stability Implementation Plan

> **For agentic workers:** Use `superpowers:executing-plans` to implement task-by-task. Use `superpowers:subagent-driven-development` only if the user authorizes delegation. Steps use checkboxes for tracking.

**Goal:** ค้นหาร้านใกล้ตัวจริง เลือกเส้นทางเดิน บันทึกเดิน/วิ่งด้วยระยะและ pace ที่เชื่อถือได้ แล้วส่งข้อมูลกิจกรรมที่จบแล้วให้ Story

**Architecture:** ใช้ MapLibre + OpenStreetMap และต่อบริการเดิมใน `osmLocationService.ts` ให้ค้นหาใกล้ตัวและขอเส้นทาง pedestrian ที่ยืนยัน profile แล้ว ให้ `AppContext` เป็นเจ้าของ session/GPS/เวลาเพียงจุดเดียว และส่ง immutable summary ให้แผน Story โดยไม่ให้หน้าจอคำนวณสถิติคนละชุด

**Tech Stack:** Bare React Native 0.88, React 19.3, TypeScript, MapLibre RN 11.5, react-native-geolocation-service, react-native-sensors, React Navigation, Firebase ที่ติดตั้งอยู่, Jest

**Spec:** ข้อกำหนดในหัวข้อ “1. ขอบเขตที่ใช้คุย” ของไฟล์นี้; ข้อความล่าสุดของผู้ใช้มีสิทธิ์เหนือเอกสารเก่า `D:/Project/Ca-walk/Docs/real-map-activity-coupons-handoff.md`

**วันที่:** 2026-10-29 (Asia/Bangkok)

**สถานะ:** ร่างแผนสำหรับทบทวนกับผู้ใช้ ยังไม่ได้เริ่มแก้แอป

**ผู้รับผิดชอบ:** Developer A — Map / Search / Tracking / จุดเชื่อมไป Story

**คู่แผน:** [Story & Highlight](D:/Project/Ca-walk/Docs/superpowers/plans/2026-10-29-story-highlight.md)

## Global Constraints

- ใช้ MapLibre + OpenStreetMap เหมือนเดิม ไม่ย้ายไป Google Maps/Mapbox หรือบริการเชิงพาณิชย์ที่หมด free quota แล้วต้องจ่ายตามคำขอ
- ไม่มี turn-by-turn, คำสั่งเลี้ยว, เสียงนำทาง หรือ AI สนทนาออนไลน์
- ระยะทางกิจกรรมมาจาก GPS ที่ผ่านการตรวจ; ก้าวเป็นอีกสถิติหนึ่ง ไม่แปลงก้าวแล้วบวกทับระยะ GPS
- ใช้ข้อมูลจริง ไม่มีเส้นเดิน ตัวเลข pace ตำแหน่งผู้ใช้ หรือร้านใกล้ตัวจำลองใน flow ปกติ
- ไม่ขยายคูปอง/เหรียญ/backend ใหม่ และไม่รื้อโครงสร้างแอปนอกไฟล์ที่จำเป็น
- Android เป็นเป้าหมายรอบนี้; ไม่อ้างว่า iOS หรือบันทึกขณะล็อกจอผ่านแล้วหากยังไม่ได้ทดสอบจริง
- ใช้ Graphify ไล่ความเชื่อมโยงก่อนอ่านโค้ด, Superpowers วางลำดับงาน, Ponytail เลือกการแก้ที่เล็กที่สุดและครบงาน
- ไฟล์ asset ที่ผู้ใช้ลบ/เปลี่ยนชื่ออยู่แล้วต้องคงไว้ ห้าม restore ภาพเก่าหรือเปลี่ยนชื่อ asset โดยพลการ

---

## 1. ขอบเขตที่ใช้คุย

### Flow เป้าหมาย

`เปิด Map → ได้ตำแหน่งที่เชื่อถือได้ → แนะนำร้านใกล้ตัว → ค้นหา/เลือกร้าน → เห็นเส้นทางเดิน+ระยะ → ไปกันเลย → Record → เริ่ม → พัก/ต่อ/ถ่ายรูป → จบ หรือ ถึงแล้วกดจบและแชร์ → Summary → Story`

1. เปิด Map แล้วแนะนำร้านที่พบในรัศมี **1 กม.** ก่อน ไม่ต้องพิมพ์ค้นหา รัศมีนี้เป็นค่าเสนอสำหรับ MVP
2. ค้นหาชื่อร้าน/สาขา/สถานที่จริงในพื้นที่ใกล้ผู้ใช้ก่อน แสดงระยะโดยประมาณและเรียงใกล้ไปไกล
3. ไม่มีผลลัพธ์ให้เสนอปุ่ม “ขยายเป็น 3 กม.” แล้ว “ขยายเป็น 5 กม.” ไม่ขยายเป็น 30/60 กม. อัตโนมัติ
4. การพิมพ์ชื่อสถานที่ไกลโดยตั้งใจทำได้ผ่านการขยายพื้นที่/เลือกค้นหาพื้นที่อื่นอย่างชัดเจน ไม่ปะปนกับรายการ “ใกล้ฉัน”
5. รายการแนะนำเรียงด้วย **ระยะเส้นตรงจากพิกัด** พร้อมป้ายบอกชนิดระยะ; หลังเลือกร้านจึงคำนวณ **ระยะตามทางเดิน** ไม่ยิง routing ให้ทุกแถว
6. กด “ไปกันเลย” เปิด Record แบบพร้อมเริ่ม ยังไม่เริ่ม timer หรือสะสมระยะจนกด “เริ่ม”
7. บน Record ใช้ป้าย **Pace เฉลี่ย** ในรอบนี้ และใช้ค่าเฉลี่ยเดียวกับหน้าจบ ไม่เพิ่ม instantaneous pace ที่แกว่งง่ายโดยไม่จำเป็น
8. แมวอยู่ที่ตำแหน่ง GPS ที่ผ่านการตรวจและเคลื่อนไหวตามผู้ใช้จริง พักแล้วหยุดท่าเดิน ไม่มี animation วิ่งไปถึงร้านเอง
9. แมวใช้ข้อความสั้นที่กำหนดไว้ในแอป เช่น “แวะถ่ายรูปหน่อยมั้ย” “พักก่อนได้นะ” “ถึงแล้ว เก่งมาก!” ไม่เรียก LLM
10. ถึงจุดหมายแล้วแสดง “ถึงแล้ว” และ “จบและสร้างสตอรี่” ผู้ใช้ยืนยันก่อนปิดกิจกรรม ไม่มี auto-finish; ยังเลือกเดินต่อได้
11. เปิดกล้องในแอปและกลับ Record ต้องเป็น session เดิม ภาพผูกกับ session นั้นเท่านั้น
12. การแชร์เป็นหน้าที่แผน B; แผน A ส่ง summary ที่จบแล้วและเปิดหน้าจอให้เท่านั้น

### ขอบเขตการใช้งานจริงที่ต้องแยกผลตรวจ

- รอบหลักต้องทำงานขณะเปิด Map/Record และเปิดกล้องภายในแอป
- ทดสอบสลับแอป/ล็อกจอแยกจาก foreground เสมอ ปัจจุบัน manifest ยังไม่มี foreground location service จึงห้ามสรุปว่ารองรับ background recording แล้ว
- หากต้องการปล่อยรุ่นที่วิ่งต่อขณะล็อกจอ ให้ถือความสามารถนี้เป็น release gate: ต้องมี foreground location service ตาม Android รุ่นเป้าหมายและผลทดสอบอุปกรณ์จริงก่อน ไม่แก้ด้วย timer JavaScript อย่างเดียว
- การเก็บรูป/track เพื่อเปิดใหม่หลัง kill แอปหรือ sync ข้ามเครื่องไม่อยู่ใน MVP นี้; ต้องบอกข้อจำกัดของไฟล์กล้องชั่วคราว ห้ามอ้างว่าเป็นคลังภาพถาวร

## 2. สิ่งที่ตรวจพบจริงก่อนวางแผน

| จุด | หลักฐานจากโค้ดปัจจุบัน | ผลต่อแผน |
| --- | --- | --- |
| ค้นหาไกล | `src/services/osmLocationService.ts`: รัศมี 30 กม., `bounded=0`, fallback 60 กม.; `MapScreen.tsx` กรอง/ขยายซ้ำ | แก้ที่ service และลบ policy ซ้ำบนหน้า Map |
| รายการใกล้ฉัน | `MapScreen.tsx`: ใช้ `STORE_MARKERS` 5 ร้าน hardcode, หมวด nearby และข้อความระยะตายตัว | แยก mock partner ออกจาก OSM suggestions; ไม่มีการรับประกันว่าร้านใน OSM ครบทุกแห่ง |
| ขอสิทธิ์แล้วค้นทันที | `handleSearchSubmit` อ่าน `currentLocation` จาก closure เดิมหลัง await | ต้องรอ location fix ที่ส่งกลับจริง/สด ไม่ถือว่า permission granted = มีพิกัดแล้ว |
| ระยะเสี่ยงบวกซ้ำ | `handleStep` เพิ่ม step baseline เข้า `distanceKm`; `handleLocation` บวก GPS segment ต่อจาก `current.distanceKm` ชุดเดียวกัน | แยกตัวสะสม GPS ออกจากจำนวนก้าว; นี่เป็นความเสี่ยงที่ยืนยันจากโค้ด แต่ยังไม่ใช่ผลพิสูจน์ว่าเป็นสาเหตุเดียวของ pace 1 บนเครื่องผู้ใช้ |
| เวลาและ pace | timer บวกทีละ 1 วินาที; `calculatePace` กับ `fmtPace` คืนทศนิยม `10.67` ไม่ใช่ `10:40` | ใช้ elapsed clock ไม่พึ่งจำนวน callback และ format จาก numeric seconds/km จุดเดียว |
| ค่าเฉลี่ยตอนจบ | `endRunSession` คำนวณ `durationSeconds / distanceKm` อยู่แล้ว | ไม่เฉลี่ยค่าของแต่ละช่วง; แก้คุณภาพระยะ/เวลาและการแสดงผล แทนการเพิ่มค่าเฉลี่ยปลอมอีกชุด |
| GPS | UI อัปเดตตำแหน่งก่อนกรอง accuracy; filter กระโดดบางตัวทำงานเฉพาะช่วง <5 วินาที; callback เวลาเก่ามีโอกาสเปลี่ยน anchor | validate fix ก่อนเผยตำแหน่งและสะสม track; เคส stale/out-of-order/gap ต้องมี test |
| เส้นทาง/ถึงแล้ว | `RecordScreen.tsx` เปลี่ยน state ภายใน `useMemo`, ตัดเส้นตาม waypoint และใช้ระยะ <25 ม. ทันที | เอา side effect ออกจาก render; รอบนี้แสดง planned route เต็มเส้น + actual track แยกกันก่อน ไม่ตัดเส้นข้ามถนนเอง |
| รูป/summary | `App.tsx` มี global `lastPhotoUri`; summary ไม่มี session id/เวลาเริ่มจบจริง/track | เอา fallback ภาพข้ามกิจกรรมออกและเพิ่ม snapshot ตามข้อ 3 |
| บันทึก backend | `firestoreService.ts::saveRunActivity` ใช้ `sport: 'walk'` เสมอ และยังไม่ได้บันทึก track/photos | ปรับ sport/เวลา/pace ที่จำเป็นกับ flow นี้ โดยไม่อ้างว่าซิงก์รูปและ route แล้ว |
| ภาพแมว | `catPhotos.ts` ยัง require ชื่อภาพเลขวงเล็บที่ผู้ใช้ลบไป | แผน B เป็นเจ้าของแก้ registry ก่อนรวมแอป; A ไม่แก้ซ้ำ |

Graphify พบเส้นเชื่อมแบบไม่สนทิศทาง: `calculatePace() ← AppContext.tsx ← App.tsx → RecordStoryScreen()`; ตรวจ source จริงซ้ำแล้ว เพราะกราฟไม่ใช่หลักฐาน runtime

**Baseline ที่รันแล้ว:** `npm test -- --runInBand __tests__/locationUtils.test.ts __tests__/osmLocationService.test.ts __tests__/activityTracking.test.tsx` ผ่าน **3 suites / 29 tests**; `npx tsc --noEmit` ผ่าน การผ่านนี้ยังไม่พิสูจน์อาการบนโทรศัพท์ และ tests เก่ายังยืนยัน decimal pace อยู่

## 3. สัญญาข้อมูลร่วม — A สร้างก่อน B เริ่มต่อของจริง

**ไฟล์ใหม่ที่ A เป็นเจ้าของ:** `src/types/activity.ts`

```ts
export type Sport = 'walk' | 'run';
export type LngLat = [number, number];

export interface RunSummary {
  sessionId: string;
  sport: Sport;
  startTime: string; // ISO 8601 จริง ไม่คำนวณย้อนหลังจากเวลาที่เปิด Story
  endTime: string; // ISO 8601 จริง
  seconds: number; // เวลาที่ session อยู่ใน recording state; ไม่รวม pause และไม่ใช่ moving-time detection
  km: number; // accepted GPS distance หน่วยกิโลเมตร
  steps: number; // จำนวนก้าว ไม่ใช่ค่าคำนวณย้อนจากระยะ
  averagePaceSecondsPerKm: number | null;
  distanceSource: 'gps' | 'unavailable';
  completionReason: 'manual' | 'arrived';
  destinationName?: string;
  photos: string[]; // file:// URI ของกิจกรรมนี้ เรียงตามที่ถ่าย
  trackCoordinates: LngLat[]; // flat list ของ GPS fixes ที่ใช้คำนวณจริง
  trackSegments?: LngLat[][]; // แยกช่วงเมื่อ pause หรือ GPS gap เพื่อไม่ลากเส้นข้ามช่วง
}
```

- คง `sport/seconds/km/steps` เดิมไว้ ลดการเปลี่ยน callers; `RecordScreen` re-export type ชั่วคราวได้เพื่อไม่ให้ imports เก่าพัง
- `RunSession` เดิมใน `mockData.ts` ยังเป็น storage model; เพิ่ม field ที่จำเป็นแบบ backward compatible กับประวัติเก่า ไม่สร้างข้อมูลเวลาหรือ sport ใหม่ย้อนหลังให้ record เก่า
- ใช้ `calculateAveragePaceSecondsPerKm(distanceKm, activeSeconds): number | null` และ `formatPaceSeconds(value: number | null): string` จาก `src/services/locationUtils.ts` โดย `formatPaceSeconds` คืน `m:ss` หรือ `--` ไม่รวมหน่วย
- ห้าม parse `averagePace` string เก่าเป็นแหล่งคำนวณใหม่; numeric pace คำนวณจาก seconds/km ของ session เมื่อมีข้อมูลครบ
- A และ B ใช้ snapshot นี้เหมือนกัน ไม่มีอีกชุดชื่อ `duration`/`distance` ที่หน่วยต่างกัน
- `RecordStoryScreen` คง prop `photoUri?: string` ได้ชั่วคราวให้ App เก่าคอมไพล์ แต่ข้อมูลภาพจริงอ่าน `summary.photos` เท่านั้น A เอา prop เก่าออกตอน integration
- snapshot เป็นข้อมูลที่คัดลอกแล้ว ไม่มี ref ของ active session และห้ามเปลี่ยนเมื่อผู้ใช้เริ่มกิจกรรมใหม่

**สูตรที่ตกลง:** `averagePaceSecondsPerKm = seconds / km`; distance <= 0.005 กม. หรือ seconds <= 0 ให้ `null`; format round วินาทีครั้งเดียวแล้วแบ่งนาที/วินาที เช่น 640 วินาที / 1 กม. = `10:40 /km`, 1,800 วินาที / 5 กม. = `6:00 /km` ไม่มีค่า `1:00` ที่ใส่เพื่อแทนข้อมูลไม่พร้อม

## 4. เจ้าของไฟล์และจุดส่งงาน

| Owner | ไฟล์ที่แก้ |
| --- | --- |
| A เท่านั้น | `App.tsx`, `src/types/activity.ts`, `src/context/AppContext.tsx`, `src/services/locationUtils.ts`, `motionTracker.ts`, `osmMapService.ts`, `osmLocationService.ts`, `mockData.ts`, `firestoreService.ts` |
| A เท่านั้น | `src/screens/MapScreen.tsx`, `RecordScreen.tsx`, `RecordScreen.styles.ts`, `RecordSummaryScreen.tsx`, `RecordCameraScreen.tsx` และ tests ของ map/activity/firestore |
| B เท่านั้น | `RecordStoryScreen.tsx`, `RecordStoryScreen.styles.ts`, โฟลเดอร์ใหม่ `src/components/story/`, `src/assets/storyAssets.ts`, `catPhotos.ts`, font/config สำหรับ Story และ tests ของ Story |

ลำดับรวมงาน: **A ส่ง contract + pace helpers → B ส่ง cat registry ที่ใช้ชื่อใหม่ → พัฒนาสองฝั่งแยกกัน → A รวม navigation กับ summary → ทดสอบ flow จริงร่วมกัน** B ทำภาพ/renderer ด้วย fixture ได้ระหว่างรอ tracking โดยไม่แก้ `AppContext` หรือสร้าง contract แข่ง

## 5. แผนลงมือทีละงาน

ทุกงานทำ test ที่แสดงอาการก่อน → รันให้เห็น failure → แก้เฉพาะจุด → รันซ้ำให้ผ่าน → review diff และทำ commit เฉพาะไฟล์งานนั้นเมื่ออยู่ใน workflow พัฒนา ไม่รวม asset ที่ผู้ใช้แก้ค้างไว้

### Task A1 — ล็อก contract และ pace จากข้อมูลจริง

**Files:** Create `src/types/activity.ts`; modify `locationUtils.ts`, `RecordScreen.tsx`, `RecordSummaryScreen.tsx`, `mockData.ts`; test `__tests__/locationUtils.test.ts`

**Consumes:** ตัวเลข km/active seconds เดิม

**Produces:** `RunSummary`, `calculateAveragePaceSecondsPerKm`, `formatPaceSeconds` ตามข้อ 3

- [ ] เพิ่ม test สำหรับ 5 กม./1,800 วินาที = 360 seconds/km, 1 กม./640 วินาที = `10:40`, 359.6 seconds/km = `6:00`, 0/ค่าลบ/NaN/Infinity = null/`--`
- [ ] รัน `npm test -- --runInBand __tests__/locationUtils.test.ts` ให้ fail เพราะ helper ใหม่ยังไม่มี และแทน expectations decimal เดิมอย่างตั้งใจ
- [ ] สร้าง type และ helper ตามโค้ดเริ่มต้นด้านล่าง ให้ `calculatePace` เดิม delegate เพื่อรักษา callers ไม่เหลือสูตรหลายชุด
- [ ] ให้ Record ใช้ป้าย “Pace เฉลี่ย”; ระหว่างรอข้อมูล 30 วินาทีแรกหรือระยะ <30 เมตร แสดง `-- /km` ไม่ clamp ตัวเลขให้ดูเป็นมนุษย์; final summary ใช้สูตรจริงตาม guard ข้อ 3
- [ ] เปลี่ยน Summary ให้ใช้ startTime/endTime จาก snapshot ไม่ใช้ `new Date()` ตอนเปิดหน้า และระบุ “เฉลี่ย” ที่ pace
- [ ] รัน test เดิมและ typecheck; ส่ง contract commit ให้ B ก่อนงานอื่น

```ts
export function calculateAveragePaceSecondsPerKm(
  distanceKm: number, activeSeconds: number,
): number | null {
  if (!Number.isFinite(distanceKm) || !Number.isFinite(activeSeconds)
      || distanceKm <= 0.005 || activeSeconds <= 0) return null;
  return activeSeconds / distanceKm;
}
export function formatPaceSeconds(value: number | null): string {
  if (value === null || !Number.isFinite(value) || value <= 0) return '--';
  const total = Math.round(value);
  return `${Math.floor(total / 60)}:${String(total % 60).padStart(2, '0')}`;
}
```

```ts
expect(calculateAveragePaceSecondsPerKm(5, 1800)).toBe(360);
expect(formatPaceSeconds(calculateAveragePaceSecondsPerKm(1, 640))).toBe('10:40');
expect(formatPaceSeconds(359.6)).toBe('6:00');
expect(formatPaceSeconds(calculateAveragePaceSecondsPerKm(0, 100))).toBe('--');
```

### Task A2 — แก้ตัวสะสมระยะและ GPS ที่ราก

**Files:** `AppContext.tsx`, `motionTracker.ts`, `locationUtils.ts`; tests `__tests__/activityTracking.test.tsx`

**Consumes:** `TrackedLocation` (lat/lng, accuracy เมตร, timestamp ms, speed km/h) และ onStep

**Produces:** `locationFix: TrackedLocation | null`, `requestCurrentLocation(): Promise<TrackedLocation>`, accepted GPS distance, track และ last accepted fix สำหรับ UI/arrival

`requestCurrentLocation()` resolve เป็น fresh validated fix หรือ reject; permission ที่อนุญาตอย่างเดียวไม่ถือว่ามีพิกัด และห้ามคืน stale closure

- [ ] เพิ่ม regression test: onStep จำนวนมากแล้วรับ GPS segment ระยะเดิม ต้องไม่เพิ่มระยะก้าวซ้ำเข้า GPS; ยืนอยู่กับที่ไม่สะสมจากการเขย่าเครื่อง
- [ ] เพิ่มเคส accuracy >25 ม., พิกัดนอกช่วง, NaN, accuracy null, timestamp เก่า/เท่ากัน, จุดกระโดดทั้ง dt <5 และ >=5 วินาที, และ gap >15 วินาที
- [ ] รัน `npm test -- --runInBand __tests__/activityTracking.test.tsx` ให้ regression ใหม่ fail บน code เก่า
- [ ] แยก `acceptedGpsDistanceMeters` ออกจาก steps; เก็บ full precision ระหว่างสะสมและค่อย format ใน UI; ไม่ปัดทุก segment และไม่ใช้ step distance เป็นฐาน GPS
- [ ] validate ก่อนเปลี่ยนตำแหน่งที่ UI ใช้: พิกัดถูกช่วง, timestamp ใหม่กว่าเดิม, fix อายุไม่เกิน 10 วินาที, accuracy มีค่าและ <=25 ม.; fix ที่ไม่ผ่านยังใช้แจ้งสถานะ GPS อ่อน แต่ไม่เพิ่มระยะ/arrival
- [ ] ใช้ segment speed ที่คำนวณจากพิกัดตรวจ jump ด้วย ไม่เชื่อ native speed ต่ำเพียงอย่างเดียว; คงเกณฑ์เดิม `MAX_LEGIT_SPEED_KMH=30` ไว้ก่อน ไม่เปลี่ยนเป็น 18 หรือกด pace ต่ำสุดโดยไม่มีข้อมูล
- [ ] segment เกินเกณฑ์ถูกตัดทันทีทุก dt; banner “เร็วผิดปกติ” ค่อยใช้ sustained 3 updates ไม่ปล่อยสอง segment แรกให้เพิ่มระยะรอ banner
- [ ] gap >15 วินาทีหรือกลับจาก pause ใช้ fix ใหม่ตั้ง anchor ไม่ลากเส้น/นับระยะข้ามช่วงขาดสัญญาณ; actual track แยกช่วงด้วย geometry segments เมื่อจำเป็น ไม่ต่อ shortcut ปลอม
- [ ] ใช้ deadband ขั้นต้น `Math.max(2.5, Math.min(8, (previous.accuracy + current.accuracy) * 0.25))` เมตร สำหรับคู่ accuracy ที่ผ่าน validation; ทดสอบด้วย recorded traces: อยู่กับที่, เดิน, วิ่ง, กลับตัว ต้องไม่กดทางโค้งจนหาย และทดสอบภาคสนามก่อนล็อกค่า
- [ ] แชร์ accepted fix เดียวกันให้ Map, แมว และ arrival; cleanup watcher เดียวต่อหน้าที่ และหยุดครบตอน finish/unmount
- [ ] รัน lifecycle tests ซ้ำ; เพิ่มเกณฑ์ภาคสนามระยะ 500–1,000 ม. ที่ทราบระยะ และจด GPS/ค่าที่วัด ไม่ตั้งเลขผลลัพธ์ที่ไม่ได้วัดจริง

ตัวอย่าง regression ที่เพิ่มใน harness เดิม (พิกัดนี้เป็น test fixture ไม่ใช่ตำแหน่งผู้ใช้):

```ts
// หลัง start session และตั้ง timestamp ใหม่ตาม fake clock ของ test
const t = Date.now();
ReactTestRenderer.act(() => {
  for (let i = 0; i < 100; i++) mockOnStep?.();
});
expect(ctx.activeSession?.distanceKm).toBe(0);
ReactTestRenderer.act(() => {
  mockOnLocation?.({ latitude: 13.74, longitude: 100.53,
    accuracy: 5, timestamp: t, speedKmh: 0 });
  jest.advanceTimersByTime(10000);
  mockOnLocation?.({ latitude: 13.7401, longitude: 100.53,
    accuracy: 5, timestamp: t + 10000, speedKmh: 4 });
});
expect(ctx.activeSession!.distanceKm).toBeGreaterThan(0.010);
expect(ctx.activeSession!.distanceKm).toBeLessThan(0.013);
```

### Task A3 — ค้นหาใกล้จริงและแนะนำก่อนพิมพ์

**Files:** `osmLocationService.ts`, `osmMapService.ts` (config), `MapScreen.tsx`, `AppContext.tsx`; tests `__tests__/osmLocationService.test.ts`, new `__tests__/MapScreen.test.tsx`

**Consumes:** fresh user coordinates + selected radius; fetch responses จาก OSM services

**Produces:** `getNearbyPlaces(userCoords, radiusMeters, signal?): Promise<OsmPlace[]>`; `searchPlaces(query, {userCoords, radiusMeters, signal})` ยังคงคืน `OsmPlace[]`

- [ ] เพิ่ม service tests: response ไม่เรียง → เรียงใกล้ก่อน; result นอกรัศมีถูกตัด; ไม่มี result → empty ไม่ fallback 60 กม.; invalid coordinates ไม่เข้า list; abort ไม่แสดง error ปลอม
- [ ] เพิ่ม UI test: ไม่มี GPS → “กำลังหาตำแหน่ง”; permission denied → ขอเปิดตำแหน่ง/ลองใหม่; ไม่ใช้พิกัดกรุงเทพฯ มาจัดอันดับแทนผู้ใช้
- [ ] ก่อนค้นหา/หลัง permission ให้ `await requestCurrentLocation()` เมื่อยังไม่มี fresh fix แล้วใช้พิกัดที่ Promise คืนมา ไม่อ่าน `currentLocation` จาก closure เดิม
- [ ] รัน `npm test -- --runInBand __tests__/osmLocationService.test.ts __tests__/MapScreen.test.tsx` ให้ fail ก่อน implementation
- [ ] เพิ่ม nearby query ด้วย **OSM Overpass** แบบ bounded ตาม category ร้านอาหาร/คาเฟ่/ร้านสะดวกซื้อ ใช้ `nwr` เพื่อรวม node/way/relation และ `out center tags` แปลง center ให้ครบ ห้ามใช้ Nominatim เป็นรายการร้านทั้งหมด
- [ ] เริ่ม 1,000 ม., ปุ่มขยาย 3,000/5,000 ม.; โหลดครั้งแรกหลัง fresh fix เมื่อเปิด Map ตาม action ผู้ใช้, refresh เมื่อผู้ใช้กด/ย้ายพื้นที่สำคัญ ไม่ยิงทุก GPS tick
- [ ] ทำ cache รายพื้นที่/หมวด/รัศมี 10 นาทีและ reuse คำขอ in-flight; timeout 12 วินาที, one active request ต่อบริการ, รับ 429/503 เป็นข้อความ retry ไม่วนรัว ไม่สลับ host เพื่อหลบ rate limit
- [ ] เมื่อกดค้นหา ใช้ nearby inventory match ชื่อ/แบรนด์/สาขาก่อน; ใช้ Nominatim สำหรับชื่อสถานที่ที่ inventory ไม่มีด้วย viewbox ที่คำนวณจากรัศมี, `bounded=1` แล้วกรองระยะวงกลมซ้ำ
- [ ] sort หลังรวม/normalize รายการ; dedupe ด้วย OSM type+id เป็นหลัก และชื่อ+พิกัดใกล้มากเป็นกรณีซ้ำ node/area ไม่ลบสาขาคนละแห่ง
- [ ] public Nominatim ค้นหาเมื่อ submit เท่านั้น มี request queue/cache ไม่เกินนโยบาย 1 request/sec; ห้าม autocomplete ผ่าน public endpoint และอย่าเสียบ query ผู้ใช้เข้า Overpass QL ตรง ๆ
- [ ] เพิ่ม AbortController + request id ให้ search และ route แต่ละชุด; response เก่าหลัง query/สถานที่เปลี่ยนต้องถูกละทิ้งแม้ abort ไม่ทัน
- [ ] แยก `STORE_MARKERS` mock ออกจากคำว่าแนะนำจริง; ถ้ายังแสดงร้านตัวอย่าง/คูปองให้ติดป้ายและอย่าแสดงระยะ/rating mock ใน search จริง
- [ ] แสดง loading/empty/offline/error พร้อมปุ่มลองใหม่; ป้าย “ใกล้ที่สุดจากร้านที่พบใน OSM” ไม่อ้างว่าค้นพบครบทุกสาขา
- [ ] รัน tests และเช็กชื่อร้านไทย/อังกฤษกับพื้นที่จริงอย่างน้อยสองพื้นที่ โดยไม่บันทึกพิกัดบ้านผู้ใช้ลงเอกสาร

Overpass query เริ่มต้น (radius/lat/lon ต้องผ่าน finite/range/allowlist validation):

```overpass
[out:json][timeout:12];
(
  nwr(around:1000,13.74,100.53)[amenity~"^(cafe|restaurant|fast_food)$"];
  nwr(around:1000,13.74,100.53)[shop="convenience"];
);
out center tags;
```

### Task A4 — pedestrian route และ Map ที่ไม่กระตุก

**Files:** `osmLocationService.ts`, `osmMapService.ts`, `MapScreen.tsx`, `RecordScreen.tsx`; tests `osmLocationService.test.ts`, `osmMapService.test.ts`, `MapScreen.test.tsx`

**Consumes:** place ที่เลือก, accepted current fix

**Produces:** `RoutePreview` เดิม: coordinates `[lng,lat][]`, distanceMeters, durationSeconds ของ pedestrian route

- [ ] เพิ่ม test สลับร้าน A→B อย่างรวดเร็วแล้ว A ตอบช้ากว่า: เส้นต้องเป็น B; malformed geometry/<2 จุด/NaN/NoRoute/timeout ไม่วาดเส้น
- [ ] ทดสอบว่า endpoint มาจาก config ของ **foot graph** ไม่ใช่ตรวจเพียง path มีคำ `walking`
- [ ] รัน tests ให้ fail ก่อนแก้ service; public OSRM profile ถูกกำหนดตอนเตรียมข้อมูล เปลี่ยนคำใน URL อย่างเดียวไม่ยืนยันว่าได้เส้นเดิน
- [ ] prototype เสนอ config `https://routing.openstreetmap.de/routed-foot/route/v1/foot` ซึ่งประกาศ foot backend จริง; เปิดได้เฉพาะการทดลองที่ตรง policy และตรวจการรองรับพื้นที่ไทยกับเส้นทางเดินจริงก่อนรับงาน
- [ ] route requested หลังเลือกสถานที่เท่านั้น; timeout 12 วินาที, cancel stale request, retry ด้วยปุ่ม, cache from/to ที่ใกล้กัน; ไม่คำนวณใหม่ทุก location tick
- [ ] fit bounds ให้เห็น user + route + destination ครั้งแรก; user ลากแผนที่แล้วหยุด auto-follow จนกด recenter ไม่ flyTo แย่งกล้องทุกวินาที
- [ ] Record แสดง planned route เต็มเส้นเป็นเส้นประ และ accepted track เป็นเส้นทึบคนละสี ไม่ตัด waypoint หรือเชื่อมผู้ใช้ไปเส้นทางด้วยเส้นตรงที่ดูเหมือนเดินได้
- [ ] เอา setState ออกจาก `useMemo`; เปลี่ยน destination/session ต้อง reset arrival state ไม่ค้างจากรอบก่อน
- [ ] route เสีย: คงหมุด+ชื่อร้าน แจ้ง “คำนวณเส้นทางไม่ได้ ลองใหม่” เริ่มบันทึกแบบไม่มี route ได้โดยยืนยัน ไม่สร้างเส้นปลอมและไม่แสดง ETA ปลอม
- [ ] ETA เป็น “เวลาเดินโดยประมาณ” จาก routing ไม่ใช้แทนเวลาที่ผู้ใช้วิ่งจริง; ระยะถึงร้านแบบเส้นตรงต้องมีป้ายเส้นตรง
- [ ] คง source/style MapLibre ไม่สร้างใหม่ทุก render, แยก tile failure จาก GPS failure และเพิ่ม retry/reload ที่กดแล้วกลับใช้งานได้
- [ ] attribution `© OpenStreetMap contributors` ต้องมองเห็นและกดอ่านสิทธิ์ได้ทั้ง Map และ Record แม้ native attribution ถูกปิด; ตรวจ User-Agent/cache ของ native tile request จริง ไม่ถือว่า header ใน geocoder ครอบคลุม tile

### Task A5 — เวลา, Pause/Resume, ถึงแล้ว และแมว

**Files:** `AppContext.tsx`, `RecordScreen.tsx`, `RecordScreen.styles.ts`, `RecordCameraScreen.tsx`, `motionTracker.ts`; tests `activityTracking.test.tsx`, new `__tests__/RecordScreen.test.tsx`

**Consumes:** accepted fixes, session status, chosen sport/destination

ใช้ signature ที่เข้ากันได้: `startRunSession(destination?: ActivityDestination, sport?: Sport): Promise<void>`; default เป็น `walk` และ Record ส่ง sport ที่ผู้ใช้เลือก

**Produces:** session ที่หยุด/ต่อ/จบครั้งเดียว, arrived UI และคำชวนถ่ายภาพ

ใช้ `endRunSession(reason?: 'manual' | 'arrived'): RunSession | null`; default เป็น `manual` และบันทึก reason ก่อนสร้าง snapshot

- [ ] เพิ่ม tests กดเริ่มซ้ำ/จบซ้ำ/จบระหว่าง await tracker, pause 60 วินาทีแล้ว resume, ข้ามหน้า Camera แล้วกลับ, timer callback ล่าช้าไม่ทำ active duration หาย
- [ ] นับ active elapsed จาก clock กับช่วง pause ไม่ใช่จำนวน setInterval callbacks; interval มีหน้าที่ refresh UI เท่านั้น ป้องกันเวลาระบบย้อนด้วย monotonic elapsed source ที่รองรับจริงใน runtime
- [ ] steps/GPS ระหว่าง pause ไม่เพิ่มสถิติ; anchor ก่อน pause ไม่เชื่อมกับหลัง resume และแมวเปลี่ยนเป็นท่าพัก
- [ ] arrival เสนอรัศมี 40 ม. จาก fresh accepted fix accuracy <=20 ม. อยู่ในรัศมีต่อเนื่อง >=8 วินาทีและมีอย่างน้อย 3 fixes; ออกเกิน60 ม.ก่อนผ่านเงื่อนไขให้ reset การรอ ต้องเป็น recording session ของ destination นี้
- [ ] คำนวณ arrival นอก render; fix ผิด/เก่า/ไม่มี accuracy ไม่ยืนยันถึงร้านและไม่เด้ง modal ซ้ำ เมื่อถึงแล้วแสดง CTA ครั้งเดียวต่อ session
- [ ] “จบและสร้างสตอรี่” ใช้ end flow เดียวกับ “จบ” และตั้ง `completionReason='arrived'`; ถ้ากดจบเองใช้ `'manual'` ไม่ปิดเองเพียงเพราะเข้า geofence
- [ ] cat marker ผูก accepted GPS; เลือกท่าเดิน/วิ่ง/พักจาก sport+status จริง ใช้ `CatAvatar` เดิมสำหรับ animation ได้ ไม่ย้ายโค้ด Story เข้ามา
- [ ] คำชวนถ่ายรูปครั้งแรกหลังเริ่มอย่างน้อย 3 นาที, ไม่เกินครั้งละ5นาที, สูงสุด2ครั้งต่อ session; arrival มี priority สูงกว่า ไม่แสดงระหว่าง pause/เปิดกล้อง/permission error และปิดได้
- [ ] แตะคำชวนเปิด camera เดิม; ปฏิเสธแล้วไม่เด้งซ้ำทันที ไม่ auto-share/auto-upload
- [ ] ปิด tracker และ interval ครบตอนจบ; session id ต้องไม่ซ้ำข้ามเปิดแอปจนเขียนทับประวัติเดิม
- [ ] ทดสอบสลับแอปและล็อกจอบนอุปกรณ์จริง แยกผลจาก unit test; ถ้าเก็บต่อไม่ได้ให้ระบุข้อจำกัดหรือเพิ่ม foreground service ในงาน A โดยไม่อ้างว่าพร้อมใช้งานในฉากนั้น

### Task A6 — ภาพประจำกิจกรรมและเชื่อมเข้า Story

**Files:** `App.tsx`, `AppContext.tsx`, `RecordScreen.tsx`, `RecordSummaryScreen.tsx`, `mockData.ts`, `firestoreService.ts`, `RecordCameraScreen.tsx` เฉพาะกรณีต้องแก้ lifecycle; tests `activityTracking.test.tsx`, `firestoreService.test.ts`, `App.test.tsx`

**Consumes:** contract ข้อ 3 และ Story screen ของ B

**Produces:** completed `RunSummary` ที่ serializable และผูกภาพถูก session

- [ ] เพิ่ม integration test: ถ่ายภาพกิจกรรม A → จบ → เริ่ม B โดยไม่ถ่าย ต้องไม่เห็นรูป A ใน Story B; จบแล้วค่าคงที่แม้ clock เปลี่ยน
- [ ] ลบ global `lastPhotoUri` และ fallback ภาพเก่าออกจาก route; snapshot ถ่ายสำเนา photos/track/destination/เวลา/sport ตอน finish เท่านั้น
- [ ] navigation เปิด Summary แล้ว Story ด้วย snapshot เดียว; ไม่ส่ง activeSession ref และไม่คำนวณเวลาใหม่เมื่อเปิดหน้าซ้ำ
- [ ] หน้า Camera ไม่หยุด session เองและไม่สร้าง session ใหม่; ถ่ายได้หลายรูป ผูก URI เมื่อถ่ายสำเร็จเท่านั้น ยกเลิกแล้วสถิติยังอยู่
- [ ] URI กล้องชั่วคราวต้องอ่านได้จน preview/export/share รอบปัจจุบันจบ; ถ้ารูปหายใช้ no-photo design ของ B พร้อมข้อความ ไม่ fallback ภาพกิจกรรมอื่น
- [ ] ปรับ persistence sport จาก session จริงแทน `walk` ตายตัว; session/storage model รับ sport แบบ backward-compatible; serialize numeric pace/เวลาแบบ compatible กับ record เก่า และอย่าบอกว่ารูป/routeถูกเก็บ Firestore ถ้ายังไม่ได้บันทึก
- [ ] อย่า parse pace string ทศนิยมเก่าไปแสดงเป็นนาที:วินาทีตรง ๆ; คำนวณใหม่จาก distance/time เมื่ออ่านประวัติที่ครบ
- [ ] ทดสอบ finish ซ้ำไม่เพิ่มประวัติ/ระยะสะสมซ้ำ และแผนที่/คูปอง mock เดิมไม่ regression
- [ ] รับ contract ของ B แล้วรัน flow Map→Record→Camera→Summary→Story ครบทั้ง manual finish และ arrived finish

## 6. เกณฑ์รับงานและการตรวจจริง

| เคส | ผ่านเมื่อ |
| --- | --- |
| อยู่กับที่ 2 นาที | ไม่มีระยะสะสมต่อเนื่อง/paceเร็วจาก jitter; ค่าที่แกว่งต้องถูกบันทึกเพื่อปรับ filter |
| เดิน/วิ่งทางทราบระยะ 500–1,000 ม. | ระยะอยู่ในช่วงคลาดเคลื่อนเป้าหมาย ±10% ในที่โล่ง; จดข้อมูลจริงและปรับจากหลักฐานก่อนอ้างความแม่น |
| Average pace | 5 กม./30 นาทีแสดง `6:00 /km` ทั้ง Record/Summary/Story, ไม่เฉลี่ย pace ย่อยและไม่รวม pause |
| GPS หลุด/จุดกระโดด | แจ้งสัญญาณอ่อน, ไม่ teleport แมว, ไม่เพิ่มเส้นเชื่อมข้ามช่วงที่ไม่มีข้อมูล |
| Search | เปิดมาเห็นร้านที่พบใกล้ตัวก่อน, 1 กม.ไม่ปนร้านไกล30กม.; empty มีปุ่มขยาย3/5กม. |
| เลือกร้านเร็วสองร้าน | หมุด/เส้น/CTAเป็นร้านล่าสุดเดียวกันเสมอ |
| Route | ตรวจ foot backend จริงและทดสอบทางเดินที่เส้นรถต่างจากเส้นเดิน; ไม่มีคำสั่งเลี้ยว |
| ถึงร้าน | ต้องผ่าน accuracy+dwell; ผู้ใช้ยืนยันจบก่อนแชร์ ไม่เด้งซ้ำ |
| Camera | กลับสู่ session เดิม, ภาพไม่ข้าม session และมี no-photo path |
| Network/permission | denied/offline/429/timeout/retry ไม่ crash และไม่สร้างข้อมูลปลอม |
| Background | รายงานรุ่นเครื่อง/Android และผลสลับแอป/ล็อกจอจริง แยกจาก foreground; ไม่มีผลทดสอบ = ยังไม่ผ่านฉากนั้น |

คำสั่งตรวจเมื่อพัฒนาเสร็จ:

```powershell
npm test -- --runInBand
npx tsc --noEmit
npm run lint
Push-Location android
.\gradlew.bat assembleDebug
Pop-Location
```

บันทึกผลตามที่รันจริง รวม known failures เดิม ไม่อ้างผ่านจากการดูโค้ดหรือ mock tests อย่างเดียว

## 7. OSM services: ข้อเท็จจริงและข้อจำกัด

OSM เป็นข้อมูลเปิด แต่ public tile/geocoding/routing/Overpass มีข้อจำกัดโหลดและอาจหยุดตอบ จึงรับประกัน “ใช้ฟรีไม่จำกัดตลอดไป” ไม่ได้ แผนนี้ไม่เปลี่ยนไปบริการ commercial free quota แต่ต้องมี timeout/cache/queue และ endpoint config ที่เปลี่ยนได้

- ทดสอบคนเดียว: ใช้ public services ตาม policy ปัจจุบัน มี attribution, cache และคำขอที่ถูกจำกัด
- หลายผู้ใช้/ปล่อยจริง: ต้องควบคุม **ยอดคำขอรวมของแอป** ผ่าน proxy/cache หรือใช้ self-host ของข้อมูล OSM; throttle 1/sec ต่อโทรศัพท์ไม่เท่ากับ 1/sec รวม การ host มีค่าเครื่อง/ดูแลข้อมูล ไม่ใช่ค่า API quota ที่ฟรีตลอดไป
- prototype ใช้ public foot demo เฉพาะกรณีตรง reasonable non-commercial policy; ก่อนเปิดเชิงพาณิชย์ต้องย้าย endpoint ที่อนุญาต เช่น self-host OSRM ที่เตรียม graph ด้วย foot profile และบริการค้นหา OSM ของตน
- อย่าทำ bulk download/offline tile prefetch หรือ rotate endpoint เพื่อหลบข้อจำกัดในงานนี้
- Overpass อาจมีชื่อร้านไม่ครบ/ข้อมูลเก่า; “ใกล้ที่สุด” หมายถึงในรายการที่พบและรัศมีที่แสดง ไม่ใช่รับประกันทั้งโลก

เอกสารหลักที่ตรวจวันที่ 2026-10-29:

- [Nominatim Search: viewbox/bounded](https://nominatim.org/release-docs/latest/api/Search/)
- [Public Nominatim policy](https://operations.osmfoundation.org/policies/nominatim/)
- [OSM tile policy](https://operations.osmfoundation.org/policies/tiles/)
- [OSRM HTTP API: profile เตรียมจาก Lua](https://github.com/Project-OSRM/osrm-backend/blob/master/docs/http.md)
- [OSRM demo policy/profiles](https://github.com/Project-OSRM/osrm-backend/wiki/Demo-server)
- [Foot backend config](https://routing.openstreetmap.de/)
- [Overpass resource limits](https://dev.overpass-api.de/overpass-doc/en/preface/commons.html)
- [Overpass QL: around / out center](https://wiki.openstreetmap.org/wiki/Overpass_API/Overpass_QL)

ตรวจ foot demo ด้วยพิกัดตัวอย่างสาธารณะใน Berlin ได้ `code=Ok` หนึ่งคำขอ; ยังไม่ได้ทดสอบ routing ไทยหรือความถูกต้องของเส้นทางภาคสนาม และไม่ใช่หลักฐานว่า production capacity ผ่านแล้ว

## 8. Definition of Done ของแผน A

- [ ] Contract และ pace helpers ส่งถึง B แล้ว ชื่อ/หน่วยตรงกัน
- [ ] Map/Search/Record ใช้พิกัดและระยะจริง ไม่มี automatic 30/60 กม. fallback
- [ ] GPS/เวลา/pace ไม่บวกซ้ำ, pause/resume/finish/arrivalผ่าน regression tests
- [ ] เส้นทางเดินผ่านการตรวจ profile; ไม่มี turn-by-turn/เสียง
- [ ] manual finish และ arrived finish เปิด Story ของ B ด้วย snapshot ถูก session
- [ ] ทดสอบ Android foreground+camera จริง และรายงาน background แยก
- [ ] ไม่แก้ไฟล์ของ B ซ้ำ ไม่แตะไฟล์ asset ของผู้ใช้ที่แก้ค้างไว้
- [ ] จดผลตรวจและข้อจำกัดจริงไว้ใน handoff เมื่อเริ่มพัฒนา ไม่ใส่ผลที่ยังไม่เกิดขึ้น