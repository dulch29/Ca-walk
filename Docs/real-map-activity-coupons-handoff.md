# Ca-Walk: สถานะและแผนส่งต่องาน

อัปเดต: 25 ตุลาคม 2026  
เป้าหมาย: ทำ Android prototype ให้แสดงแผนที่จริง บันทึกก้าวและระยะทางจากเครื่อง และแลก/ใช้คูปองจำลองได้ในแอป

## ขอบเขต

- Bare React Native สำหรับ Android; ไม่ใช้ Expo และไม่รวมงาน iOS
- คูปอง/ร้านค้าเป็นข้อมูล mock ในเครื่องก่อน ไม่ต้องพึ่งคูปองจริงหรือ Firebase Storage
- รักษา UI ที่เพื่อนทำไว้ แก้หน้าจอเฉพาะจุดที่ต้องต่อกับข้อมูลจริง อย่ารื้อดีไซน์หรือ navigation โดยไม่จำเป็น
- Firebase Auth/Firestore มีอยู่ใน dependency และ service บางส่วนแล้ว แต่การเชื่อมข้อมูลรอบนี้ไม่ใช่เงื่อนไขให้คูปอง mock ใช้งานได้

## สถานะปัจจุบันที่ตรวจจาก source

| ส่วน | สถานะจริง | สิ่งที่ยังขาด |
| --- | --- | --- |
| Android native | มี Android project, permission `ACCESS_FINE_LOCATION`, `ACCESS_COARSE_LOCATION`, `ACTIVITY_RECOGNITION`; เปิด New Architecture | ต้องติดตั้ง/เปิดแอปบน Android device จริงและยืนยัน permission/runtime behavior |
| Map SDK | `@maplibre/maplibre-react-native` `^11.5.0` อยู่ใน `package.json` และเคยปรากฏใน Android build output | ยังไม่ถูกใช้ใน `MapScreen`; ปัจจุบันเป็นพื้นหลังถนนวาดเองและหมุดจาก `x/y` |
| ตำแหน่ง | `src/services/motionTracker.ts` ขอ permission และเรียก `react-native-geolocation-service.watchPosition` | ยังไม่มีหน้าจอแสดงตำแหน่ง GPS ที่ใช้งานจริง; ต้องทดสอบ accuracy, denial, GPS ปิด และตำแหน่งจำลอง |
| ก้าว | มี accelerometer step detector ใน `motionTracker.ts` | threshold ปัจจุบันเป็น heuristic; ยังไม่ผ่านการทดสอบ/ปรับเทียบกับการเดินจริง และหน้า Record ไม่ได้ใช้ |
| ระยะ/เพซ/ความเร็ว | `src/services/locationUtils.ts` มีแปลงก้าว/ระยะ, pace, speed, fraud threshold 18 km/h และ Haversine/geofence 50 m | ต้องกำหนดให้ชัดว่า distance จริงหลักมาจาก GPS track; อย่าบวก GPS distance กับ step-derived distance ซ้ำ |
| Run session | `src/context/AppContext.tsx` มี `startRunSession`, `endRunSession`, active session, history, speed check และบันทึก Firestore เมื่อมี Firebase user | `App.tsx` ยังไม่ห่อด้วย `AppProvider`; screens ไม่ได้อ่าน context จึงยังไม่เกิด flow ในแอป |
| ร้านค้า/คูปอง mock | `src/services/mockData.ts` มี `MOCK_USER`, ร้าน 5 ร้าน, ดีลระยะทาง, `MOCK_COUPONS`; context มีแลกคูปอง, redeem และ metrics | หน้าจอหลักยัง import `src/data/mock.ts` ซึ่งเป็นข้อมูลอีกชุด; ปุ่ม/ยอดคงเหลือจึงไม่เปลี่ยนตาม context |
| Record UI | `src/screens/RecordScreen.tsx` คำนวณ km/steps จากเวลาและค่าความเร็วจำลอง; มี pause/resume และ summary | ต้องให้ปุ่มเริ่ม/จบ/พักเรียก session จริง และแสดงค่าจาก `activeSession` |
| Coupon/Wallet/Store UI | `DistanceWalletScreen`, `MyCouponsScreen`, `StoreDetailScreen`, `MapScreen` import static mock data | ต้องเชื่อมข้อมูลร้านและคูปองกับ AppContext ให้แลกแล้วเห็นคูปอง และใช้แล้วเปลี่ยนสถานะจริงใน runtime |

## ข้อสรุปทางเทคนิคสำหรับ prototype

1. ใช้ MapLibre ที่ติดตั้งอยู่แล้ว แสดงแผนที่ tile จริง, ตำแหน่งผู้ใช้ และหมุดร้านจาก latitude/longitude ใน `MOCK_MERCHANTS`; ไม่ใช้ `x/y` สำหรับตำแหน่งจริง
2. ใช้ GPS segment ที่ผ่าน validation เป็นแหล่งคำนวณระยะทางหลัก ส่วน accelerometer นับก้าวแยกต่างหาก ระยะจากก้าวเป็นข้อมูลประมาณการ/ตรวจความสมเหตุสมผลเท่านั้น
3. เมื่อความเร็ว segment เกิน 18 km/h ให้ระงับการเพิ่มระยะทางของ segment นั้นและแจ้งเตือน ไม่ควรลบระยะที่บันทึกก่อนหน้า
4. เก็บ session, ยอดระยะสะสม/แลกได้, ร้าน และคูปองใน AppContext สำหรับการสาธิตใน process ปัจจุบันก่อน ระบุชัดว่าข้อมูล mock อาจหายเมื่อปิดแอป เว้นแต่เพิ่ม persistence ในขอบเขตแยก
5. การแลกคูปองหัก `redeemableDistanceKm` แต่ไม่ลด `totalDistanceKm`; การกดใช้คูปองเปลี่ยนสถานะเป็นใช้แล้วและอัปเดต metrics mock
6. MapLibre ต้องมี style/tile URL ที่ใช้งานได้และ network access; ตรวจเงื่อนไขผู้ให้บริการ tile/token ก่อนเลือก URL อย่าฝัง secret token ลง Git

## แผนลงมือทำตามลำดับ

### 1. Mount state และยืนยันสัญญาข้อมูล

**ไฟล์หลัก:** `App.tsx`, `src/context/AppContext.tsx`, `src/services/mockData.ts`, `src/data/mock.ts`

- ครอบ navigation ด้วย `AppProvider` ในตำแหน่งที่ทุก screen ใช้ context ได้ โดยไม่เปลี่ยน flow navigation
- ตรวจว่าร้านใน UI ใช้ `merchantId` เดียวกับข้อมูลใน context; ทำ adapter ระหว่าง `Store` เดิมกับ `Merchant` ถ้าจำเป็น อย่ากระจายการแปลงซ้ำหลาย screen
- กำหนด behavior ของ state ตอนแอปเริ่มใหม่ให้ชัด: prototype ใน memory หรือเพิ่ม AsyncStorage หาก dependency มีอยู่แล้ว; อย่าเพิ่ม Firebase requirement เพื่อให้ flow mock ผ่าน
- ตรวจว่า session/coupon operation ป้องกันกดซ้ำ, ค่าติดลบ/NaN, แลกไม่พอ, คูปองที่ใช้แล้ว และ session ที่ยังไม่จบ

**รับงานเมื่อ:** แอป render ภายใต้ provider ได้, TypeScript ผ่าน และ state ใน context เป็น source of truth สำหรับ flow ที่กำลังเชื่อม

### 2. ต่อ MapLibre กับร้านและตำแหน่งปัจจุบัน

**ไฟล์หลัก:** `src/screens/MapScreen.tsx`, `src/services/motionTracker.ts` หรือ service location แยกถ้าจำเป็น, `android/app/src/main/AndroidManifest.xml`

- แทน placeholder map ด้วย MapLibre component ตาม API ของเวอร์ชันที่ติดตั้ง
- ใช้ style URL/tile provider ที่ได้รับอนุญาตและทดสอบว่าโหลดได้; แสดง loading/error state เมื่อ offline หรือ tile ใช้ไม่ได้
- วางกล้องเริ่มต้นบริเวณบรรทัดทอง-สามย่าน; แสดง user location เมื่อได้รับ permission และ marker ร้านจากพิกัดจริง
- ขอ permission ตอนผู้ใช้เริ่มใช้ตำแหน่ง ไม่ขอซ้ำโดยไม่จำเป็น; กรณีปฏิเสธหรือปิด GPS ต้องไม่ crash และมีทางกลับ/ลองใหม่
- แสดงสถานะ accuracy/ตำแหน่งไม่พร้อม และไม่แสร้งแสดงตำแหน่งจริงหากยังไม่มี fix

**รับงานเมื่อ:** เปิดแผนที่ tile จริงบน Android, เห็นหมุดจากพิกัดร้าน, ตำแหน่งผู้ใช้ขยับตามเครื่อง และกรณี permission/network error ไม่ทำให้หน้าจอพัง

### 3. ต่อ Record UI เข้ากับ sensor/GPS sessions

**ไฟล์หลัก:** `src/screens/RecordScreen.tsx`, `src/context/AppContext.tsx`, `src/services/motionTracker.ts`, `src/services/locationUtils.ts`, `src/screens/RecordSummaryScreen.tsx`

- ให้ start เรียก `startRunSession`; pause ต้องหยุด/พัก timer และ tracking โดยรักษาค่า session; resume ต้องกลับมาต่อ session เดิม; finish เรียก `endRunSession`
- แสดง `activeSession.steps`, `distanceKm`, `currentPace`, `durationSeconds`; เอาการคำนวณจาก `SPEED` และ `STEP_M` แบบจำลองออกจาก path ที่ใช้บันทึกจริง
- ใช้ GPS distance ระหว่าง fix ที่ accuracy ผ่านเกณฑ์ และกรอง jump/ความเร็วเกิน 18 km/h; ระบุ threshold accuracy/minimum segment ในโค้ดและปรับได้
- accelerometer นับก้าวต่อ session; ตรวจ detector กับการเดินจริงหลายจังหวะ/ถือเครื่องหลายแบบและบันทึกข้อจำกัดว่าเป็น prototype
- จัดการ permission denial, GPS unavailable, sensor error, app background/กลับ foreground และการกดจบระหว่างรอ permission
- summary/history ต้องตรงกับ session ที่เพิ่งจบ; ห้ามเพิ่มยอดรวม/ระยะแลกได้ซ้ำเมื่อกดจบซ้ำ

**รับงานเมื่อ:** เดินจริง 5-10 นาทีแล้ว steps เพิ่ม, GPS route/distance เพิ่มอย่างสมเหตุสมผล, pace/duration สอดคล้อง, segment ที่เกิน 18 km/h ไม่ให้รางวัลระยะ และจบ session แล้ว summary/history/ยอดสะสมอัปเดตครั้งเดียว

### 4. ต่อร้านค้า, wallet และคูปอง mock แบบ end-to-end

**ไฟล์หลัก:** `src/screens/DistanceWalletScreen.tsx`, `src/screens/StoreDetailScreen.tsx`, `src/screens/MyCouponsScreen.tsx`, `src/screens/MapScreen.tsx`, `src/context/AppContext.tsx`

- ใช้ข้อมูลร้าน/คูปอง/ยอดระยะจาก context; คงหน้าตาและ navigation เดิม
- เพิ่ม action แลกดีลของร้านที่เลือก เรียก `exchangeDistanceForCoupon(merchantId)` และแสดงผลสำเร็จ/ระยะไม่พอ
- คูปองที่แลกต้องปรากฏใน My Coupons; ปุ่มใช้คูปองเรียก `redeemMockCoupon(couponId)` และเปลี่ยนเป็น used พร้อม metrics ร้านเพิ่มตาม logic ที่มี
- ตรวจ geofence ก่อนเปิด action QR/ใช้หน้าร้านตาม UX เดิม; ถ้ายังไม่มี QR จริงให้แสดง mock code/token และติดป้ายว่าเป็น prototype
- ระบุให้ชัดว่าการแลก/ใช้เป็น client-side mock ไม่ใช่ระบบป้องกันโกงหรือการชำระเงินจริง

**รับงานเมื่อ:** เริ่มที่ระยะไม่พอแล้วแลกไม่ได้; เพิ่มระยะจนพอแล้วแลกได้ 1 ครั้ง, balance ลดถูกต้อง, คูปองเข้ากระเป๋า, ใช้แล้วใช้ซ้ำไม่ได้ และ metrics ร้านเปลี่ยนทันที

### 5. Android verification และส่งมอบ

**ไฟล์/คำสั่ง:** ใช้ Android project ใน `D:\Project\Ca-walk\android`

- รัน `npm test -- --runInBand` และ `npm run lint` (แก้เฉพาะ failure ที่เกี่ยวกับงานนี้)
- รัน `npx tsc --noEmit` หาก tsconfig รองรับ และตรวจผลจริงก่อนรายงาน
- จาก `android`: `.\gradlew.bat assembleDebug`
- ติดตั้งบน Android device จริง: `.\gradlew.bat installDebug`; ทดสอบ permission, GPS, map tiles และ flow กิจกรรม/คูปองบนเครื่อง ไม่ถือว่า build ผ่านเท่ากับ hardware behavior ผ่าน
- บันทึก device/API level, ผล build, test, permission ที่อนุญาต, ข้อจำกัด tile/token และ known issues

## Acceptance checklist สำหรับเพื่อน

- [ ] Map เป็น tile map จริง ไม่ใช่พื้นหลังวาดเอง; marker ร้านใช้ latitude/longitude
- [ ] ตำแหน่งเครื่องแสดงเมื่อ permission/GPS พร้อม และมี fallback ที่ซื่อสัตย์เมื่อไม่พร้อม
- [ ] ก้าวมาจาก accelerometer และระยะมาจาก GPS track ที่กรองแล้ว ไม่มีการนับระยะซ้ำจาก step estimate
- [ ] เริ่ม/พัก/ต่อ/จบ run ได้; pace, duration, steps, distance และ summary ตรงกัน
- [ ] ความเร็วมากกว่า 18 km/h ไม่สร้างระยะที่นำไปแลกรางวัลได้
- [ ] ระยะสะสมไม่ลดเมื่อแลก; ระยะแลกได้ลดตามดีล
- [ ] แลกแล้วได้ mock coupon ในกระเป๋า; ใช้ได้ครั้งเดียวและ metrics ร้านอัปเดต
- [ ] permission denied, GPS off, map offline และการแลกไม่พอไม่ทำให้แอป crash
- [ ] Android debug APK build ผ่านและทดสอบบนอุปกรณ์จริงอย่างน้อยหนึ่งเครื่อง

## จุดเริ่มสำหรับผู้รับงาน

อ่านตามลำดับ: `HANDS-OFF.md` → เอกสารนี้ → `App.tsx` → `src/context/AppContext.tsx` → `src/services/motionTracker.ts` / `locationUtils.ts` → หน้าจอ Record/Map/Wallet/Coupons

อย่าเริ่มด้วยการเขียน tracker หรือระบบคูปองใหม่ทั้งหมด: implementation ฝั่ง service/context มีอยู่แล้ว จุดติดหลักคือยังไม่ mount provider และยังไม่ได้ต่อ screens เข้ากับ state จริง; MapLibre มี dependency แล้วแต่ Map screen ยังเป็น placeholder.
