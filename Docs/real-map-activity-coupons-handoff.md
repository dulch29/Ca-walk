# Ca-Walk — handoff แผน Map, Activity และ Story

อัปเดต: 30 ตุลาคม 2026
สถานะ: Developer A ทำ Map/Search/Activity ตามแผน A แล้วและผ่าน tests, Android release build และ foreground smoke test บน emulator; งาน Story/Highlight ของ Developer B คงเดิม

## ขอบเขตล่าสุด

ทำ MVP Android ต่อจากแอปเดิม: ค้นหาร้านใกล้ตัวจากข้อมูลจริง, เลือกปลายทางแล้วดูเส้นทางและระยะ, กด **ไปกันเลย** เพื่อเปิด Record, เริ่ม/พัก/ต่อ/จบ, ดูระยะ GPS และ pace เฉลี่ย, ถ่ายรูประหว่างกิจกรรม และแชร์ Story 4 หน้าเมื่อจบหรือยืนยันว่าถึงปลายทาง

- ใช้ MapLibre + OpenStreetMap เหมือนเดิม ไม่ย้ายไป commercial free-quota provider
- แสดงเส้นทางและความคืบหน้าได้ แต่ **ไม่มีคำแนะนำเลี้ยวทีละช่วง, turn-by-turn หรือเสียงนำทาง**
- คูปอง/ร้านค้าเดิมยัง mock; ไม่ขยาย coupon/backend ในสองแผนนี้
- ไม่ใช้ข้อมูลตัวอย่างแทน GPS, ร้านใกล้จริง, ระยะ, pace, เวลาจบ หรือภาพของ session ปัจจุบัน

## แผนแยกงาน

1. [Map, Search & Activity Stability](D:/Project/Ca-walk/Docs/superpowers/plans/2026-10-29-map-search-stability.md) — Developer A: Map/Search, GPS/pace, Record, session/camera lifecycle, navigation และ contract ร่วม
2. [Story & Highlight](D:/Project/Ca-walk/Docs/superpowers/plans/2026-10-29-story-highlight.md) — Developer B: Story 4 หน้า, cat registry, font, export/share และภาพอ้างอิง

A สร้าง `RunSummary` และ pace helpers ก่อน; B ทำ UI ด้วย test fixture ระหว่างรอได้ แต่ไม่สร้าง contract ซ้ำหรือแก้ state/navigation ของ A. รายการไฟล์และลำดับ integration อยู่ในแผนแต่ละไฟล์

## สถานะ Developer A — Map/Search/Activity

- เพิ่ม contract กลาง `RunSummary`, pace numeric และ formatter `m:ss /km`; Summary และ payload ส่งต่อ Story ใช้ snapshot เดียวกัน
- Map รอตำแหน่ง GPS จริงที่ผ่าน validation, แนะนำร้านจาก Overpass ในรัศมี 1 กม. และให้ผู้ใช้ขยาย 3/5 กม. เอง; ไม่มี fallback อัตโนมัติไกลกว่านั้น
- ค้นหาผ่าน Nominatim เมื่อ submit เท่านั้น พร้อม cache, throttle, cancellation, timeout, retry state และป้องกัน response เก่าทับรายการล่าสุด
- หลังเลือกสถานที่ ขอเส้นทางเดินจาก `routing.openstreetmap.de/routed-foot`; แสดง planned route แยกจาก actual GPS track และคง attribution OSM
- Activity เริ่มนับหลังผู้ใช้กดเริ่ม, ใช้ elapsed clock ไม่รวม pause, ระยะมาจาก accepted GPS เท่านั้น, steps แยก, และตัด segment เมื่อ pause/resume หรือ GPS gap
- accepted GPS fix หมดอายุเมื่อไม่มี callback ใหม่เกิน 10 วินาที; Map ล้างตำแหน่ง/marker และออกจาก ready state, การยืนยัน arrived ใช้เกณฑ์อายุเดียวกัน และ jitter ต่ำกว่า deadband จะเลื่อน anchor โดยไม่สะสมระยะเก่า
- Arrival dwell นับเฉพาะ accepted fix ที่มี timestamp ใหม่อย่างน้อย 3 จุด/8 วินาที และตรวจ fix ล่าสุดซ้ำตอนผู้ใช้ยืนยัน; ออกเกิน 60 ม.แล้วต้อง dwell ใหม่ โดย modal แสดงครั้งเดียวต่อ session
- กล้องใช้กล้องหลังจริงและ native pinch-to-zoom; ตอนถ่ายส่ง `enableShutterSound=false` เพื่อตัดเสียงที่แอปควบคุมได้, ผูก `sessionId` เพื่อกันรูปจาก session เก่าเข้า session ใหม่ และกันทั้งปุ่มย้อนกลับบนจอกับ Android Back ระหว่างบันทึก metadata, finish ทำได้ครั้งเดียว, completion reason รองรับ `manual`/`arrived`, และ snapshot copy photos/track/segments ก่อนส่งต่อ
- ตอนกดชัตเตอร์เก็บ URI รูปเข้า session ทันที แล้ว snapshot accepted GPS fix ของ session นั้นเพื่อ reverse geocode ผ่าน Nominatim เดิมแบบฟรี; เก็บชื่อเป็น `photoLocations[photoUri]` ให้ Story ใช้ตำแหน่งของรูปที่แสดงจริง, cancel lookup ที่ยังค้างเมื่อ session จบ และ network/geocoder fail แล้วยังเก็บรูปพร้อมใช้ข้อความ fallback
- Firestore บันทึก metadata กิจกรรมที่จำเป็น ได้แก่ sport, เวลาเริ่ม/จบ, active seconds, km, steps, numeric pace, distance source, completion reason และ destination name; ยังไม่อ้างว่าไฟล์รูปหรือ track ถูกเก็บถาวรบน cloud

## ข้อตกลงข้อมูลร่วม

`RunSummary` ส่ง snapshot ที่จบแล้วชุดเดียวให้หน้า Summary/Story: `sessionId`, `sport`, `startTime`, `endTime`, `seconds`, `km`, `steps`, `averagePaceSecondsPerKm`, `distanceSource`, `completionReason`, `destinationName?`, `photos`, `photoLocations?`, `trackCoordinates` และ `trackSegments?`.

- `photoLocations?` เป็น map จาก URI ของรูปไปชื่อสถานที่ ณ accepted GPS fix ตอนถ่าย; optional เพื่ออ่าน summary เก่าได้ และ snapshot ใหม่ clone object แยกจาก session
- `seconds` คือเวลาที่อยู่ใน recording state ไม่รวมช่วง pause; ไม่ใช่ moving-time detection
- pace เฉลี่ย = `seconds / km`; ระยะไม่พอหรือเวลาไม่ถูกต้องแสดง `--`; รูปแบบ `m:ss /km` เช่น 5 กม.ใน 30 นาที = `6:00 /km`
- GPS เป็นแหล่งระยะ; steps เป็นสถิติแยก ไม่บวกซ้ำ
- `completionReason='arrived'` เท่านั้นที่ยืนยันว่าถึงร้าน; การกดจบเองเป็น `manual`
- `trackSegments` ใช้แยกช่วง pause/GPS gap ไม่วาดเส้นลัดเชื่อมช่วงที่ไม่มีข้อมูล

## Map/Search — แนวทางตั้งต้น

- แนะนำร้าน/คาเฟ่/ร้านสะดวกซื้อใกล้ผู้ใช้ก่อน โดยเริ่มรัศมี 1 กม.; ให้ขยาย 3 กม. แล้ว 5 กม. ตามการกดของผู้ใช้ ไม่มี fallback อัตโนมัติไปหลายสิบกิโลเมตร
- จัดอันดับตามระยะเส้นตรงและระบุชัดว่าเป็นการจัดอันดับจากรายการ OSM ที่ค้นพบ; หลังเลือกจุดหมายค่อยขอ pedestrian route เพื่อแสดงระยะเส้นทางจริง
- ใช้ Overpass สำหรับ nearby inventory และ Nominatim สำหรับคำค้นที่ต้อง geocode; กดค้นหาเท่านั้น ไม่มี autocomplete บน public endpoint
- routing ใช้ foot-profile endpoint ที่ตรวจ config แล้ว; foreground smoke บน emulator ขอเส้นทางเดินในกรุงเทพฯ สำเร็จ (ตัวอย่างพระบรมมหาราชวัง 2.23 กม.) แต่ความปลอดภัย/ความเหมาะสมของเส้นทางยังต้องตรวจภาคสนาม
- public OSM services มี policy/ข้อจำกัดและไม่มี SLA; ต้องมี cache, timeout, throttle, attribution และแผน self-host/proxy หากเปิดหลายผู้ใช้ ห้ามทำ endpoint rotation หรือ bulk prefetch เพื่อเลี่ยงข้อจำกัด

## Story/Highlight — แนวทางตั้งต้น

- อ้างอิงสี่ภาพใน `D:/Project/Ca-walk/Assests/Images/ShareStory`: `Ref_Highlight1.png`, `Ref_Highlight2.png`, `Ref_Highlight3.png`, `Ref_HighlightLastPage.png`
- map asset ตามชื่อ `AssetN_HighlightM`; ใช้ภาพแมว pixel-art ชุดใหม่ใน `D:/Project/Ca-walk/Assests/Cat/Photo` ไม่ใช้ภาพแมวดำใน reference เป็นตัวละครหลัก
- ทำ canvas 1080×1920 (9:16); หัวข้อ/สถิติเป็น text ในโค้ดและใช้ฟอนต์ handwriting ที่ bundle; export เฉพาะหน้าที่เลือกเป็น PNG
- อนุญาต share sheet ของระบบ; ไม่รับประกันการโพสต์เข้า Instagram Story อัตโนมัติ
- หน้าครบ 4 หน้าแม้ไม่มีรูป; ห้ามแทนภาพกิจกรรมด้วย stock photo หรือข้อมูลตัวอย่าง

## ข้อจำกัดที่ต้องรายงานตรงไปตรงมา

- แอปและแผนที่เป็นเป้าหมาย Android; การบันทึกขณะล็อกจอ/background ยังไม่ถือว่ารองรับจนผ่านการทดสอบอุปกรณ์และ service ที่จำเป็น
- รูปจากกล้องเป็น temporary file ใน MVP; ไม่สัญญาว่าเก็บถาวรหลังปิดแอปหรือ sync cloud และ Android/ข้อกำหนดภูมิภาคบางเครื่องอาจบังคับเสียงชัตเตอร์แม้แอปขอปิดเสียงแล้ว
- ชื่อสถานที่ตอนถ่ายต้องใช้อินเทอร์เน็ตและ public Nominatim; ถ้าหาไม่ได้ Story แสดงข้อความ fallback โดยไม่เปลี่ยนเป็นชื่อจุดหมาย
- OSM data ไม่รับประกันร้านครบ/ข้อมูลล่าสุดทุกแห่ง; public tiles, search, routing และ Overpass ไม่ใช่บริการ unlimited
- การถึงปลายทางต้องมี GPS fix ที่ผ่าน validation และยืนยันจากผู้ใช้; ระบบไม่ auto-finish

## ผลตรวจ Developer A

- `npm test -- --runInBand` ผ่าน 13 suites / 119 tests; ไม่มี test fail
- targeted Jest ฝั่ง Map/Search/Activity/Camera และ boundary ของ Story ครอบคลุม GPS validation/jitter/jump/gap, elapsed timer, pause/resume, pace, arrived/manual completion, session photo isolation, reverse geocode ของรูป, native camera zoom/shutter-sound option/permission/error recovery, finish idempotency, OSM cache/cancellation/timeout/rate limit และ Map UI stale-response behavior; ทั้งหมดรวมอยู่ใน full suite ด้านบน
- `npx tsc --noEmit` ผ่าน
- `npm run lint` ผ่านโดยไม่มี error; มี warning เดิม 1 จุดใน `scripts/apply-android-patches.js`
- `android\gradlew.bat assembleDebug` ผ่าน (615 tasks, BUILD SUCCESSFUL)
- `android\gradlew.bat :app:assembleRelease --console=plain` ผ่าน (742 tasks, BUILD SUCCESSFUL); APK อยู่ที่ `android/app/build/outputs/apk/release/app-release.apk`
- ติดตั้ง debug APK และทำ foreground smoke บน Pixel 10 Pro XL emulator/Android 17: Map รอ GPS จริง, tiles/OSM attribution แสดง, Nominatim ค้นหาได้, routed-foot สร้างเส้นทางกรุงเทพฯ ได้, “ไปกันเลย” เปิด Record แบบพร้อมเริ่ม, start/pause/resume ไม่เชื่อมระยะข้ามช่วง, camera กลับ session เดิม และ manual finish เปิด Summary ด้วย snapshot ที่จบแล้ว
- ติดตั้ง release APK บน Pixel 10 Pro XL emulator สำเร็จ; เปิดกล้องหลังได้, preview ไม่ crash, ถ่ายรูปแล้วกลับ session เดิม และ logcat ไม่พบ VisionCamera fatal; pinch-to-zoom กับเสียงชัตเตอร์ยังต้องยืนยันบนอุปกรณ์จริง
- รอบ smoke นี้ Overpass ตอบ HTTP 502; UI แยก network error และมี retry โดยไม่ crash แต่ยังไม่ได้ยืนยัน nearby inventory จาก response จริงในรอบดังกล่าว
- arrival smoke ด้วย GPS จำลอง accuracy 5 ม.: อยู่ใน geofence ต่อเนื่องมากกว่า 8 วินาทีและอย่างน้อย 3 fixes จึงขึ้น “ถึงจุดหมายแล้ว”; เลือกเดินต่อแล้ว session ยังบันทึกต่อ ไม่ auto-finish และปุ่มจบแบบ arrived แสดงเมื่อ fix ยังสด/อยู่ใน 25 ม. ส่วน payload boundary `completionReason='arrived'` ตรวจด้วย test โดยไม่เปิดหรือแก้ Story UI
- ยังไม่ได้ทดสอบ GPS ภาคสนาม, การสลับแอป, foreground service, background recording หรือ lock-screen บนอุปกรณ์จริง จึงไม่ถือว่ารองรับพฤติกรรมเหล่านี้
