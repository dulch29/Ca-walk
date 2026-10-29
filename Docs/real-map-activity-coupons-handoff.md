# Ca-Walk — handoff แผน Map, Activity และ Story

อัปเดต: 29 ตุลาคม 2026
สถานะ: เอกสารแผนสำหรับทบทวนก่อนเริ่มพัฒนา; ยังไม่ได้แก้ระบบในรอบจัดทำแผน

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

## ข้อตกลงข้อมูลร่วม

`RunSummary` ส่ง snapshot ที่จบแล้วชุดเดียวให้หน้า Summary/Story: `sessionId`, `sport`, `startTime`, `endTime`, `seconds`, `km`, `steps`, `averagePaceSecondsPerKm`, `distanceSource`, `completionReason`, `destinationName?`, `photos`, `trackCoordinates` และ `trackSegments?`.

- `seconds` คือเวลาที่อยู่ใน recording state ไม่รวมช่วง pause; ไม่ใช่ moving-time detection
- pace เฉลี่ย = `seconds / km`; ระยะไม่พอหรือเวลาไม่ถูกต้องแสดง `--`; รูปแบบ `m:ss /km` เช่น 5 กม.ใน 30 นาที = `6:00 /km`
- GPS เป็นแหล่งระยะ; steps เป็นสถิติแยก ไม่บวกซ้ำ
- `completionReason='arrived'` เท่านั้นที่ยืนยันว่าถึงร้าน; การกดจบเองเป็น `manual`
- `trackSegments` ใช้แยกช่วง pause/GPS gap ไม่วาดเส้นลัดเชื่อมช่วงที่ไม่มีข้อมูล

## Map/Search — แนวทางตั้งต้น

- แนะนำร้าน/คาเฟ่/ร้านสะดวกซื้อใกล้ผู้ใช้ก่อน โดยเริ่มรัศมี 1 กม.; ให้ขยาย 3 กม. แล้ว 5 กม. ตามการกดของผู้ใช้ ไม่มี fallback อัตโนมัติไปหลายสิบกิโลเมตร
- จัดอันดับตามระยะเส้นตรงและระบุชัดว่าเป็นการจัดอันดับจากรายการ OSM ที่ค้นพบ; หลังเลือกจุดหมายค่อยขอ pedestrian route เพื่อแสดงระยะเส้นทางจริง
- ใช้ Overpass สำหรับ nearby inventory และ Nominatim สำหรับคำค้นที่ต้อง geocode; กดค้นหาเท่านั้น ไม่มี autocomplete บน public endpoint
- routing prototype ใช้ foot-profile endpoint ที่ตรวจ config แล้ว แต่ทดสอบเพียงตัวอย่างสาธารณะใน Berlin; เส้นทางไทยและความปลอดภัยยังต้องตรวจจริง
- public OSM services มี policy/ข้อจำกัดและไม่มี SLA; ต้องมี cache, timeout, throttle, attribution และแผน self-host/proxy หากเปิดหลายผู้ใช้ ห้ามทำ endpoint rotation หรือ bulk prefetch เพื่อเลี่ยงข้อจำกัด

## Story/Highlight — แนวทางตั้งต้น

- อ้างอิงสี่ภาพใน `D:/Project/Ca-walk/Assests/Images/ShareStory`: `Ref_Highlight1.png`, `Ref_Highlight2.png`, `Ref_Highlight3.png`, `Ref_HighlightLastPage.png`
- map asset ตามชื่อ `AssetN_HighlightM`; ใช้ภาพแมว pixel-art ชุดใหม่ใน `D:/Project/Ca-walk/Assests/Cat/Photo` ไม่ใช้ภาพแมวดำใน reference เป็นตัวละครหลัก
- ทำ canvas 1080×1920 (9:16); หัวข้อ/สถิติเป็น text ในโค้ดและใช้ฟอนต์ handwriting ที่ bundle; export เฉพาะหน้าที่เลือกเป็น PNG
- อนุญาต share sheet ของระบบ; ไม่รับประกันการโพสต์เข้า Instagram Story อัตโนมัติ
- หน้าครบ 4 หน้าแม้ไม่มีรูป; ห้ามแทนภาพกิจกรรมด้วย stock photo หรือข้อมูลตัวอย่าง

## ข้อจำกัดที่ต้องรายงานตรงไปตรงมา

- แอปและแผนที่เป็นเป้าหมาย Android; การบันทึกขณะล็อกจอ/background ยังไม่ถือว่ารองรับจนผ่านการทดสอบอุปกรณ์และ service ที่จำเป็น
- รูปจากกล้องเป็น temporary file ใน MVP; ไม่สัญญาว่าเก็บถาวรหลังปิดแอปหรือ sync cloud
- OSM data ไม่รับประกันร้านครบ/ข้อมูลล่าสุดทุกแห่ง; public tiles, search, routing และ Overpass ไม่ใช่บริการ unlimited
- การถึงปลายทางต้องมี GPS fix ที่ผ่าน validation และยืนยันจากผู้ใช้; ระบบไม่ auto-finish

## ตรวจเดิมก่อนเริ่มทำ

ก่อนจัดทำแผน รัน `npm test -- --runInBand __tests__/locationUtils.test.ts __tests__/osmLocationService.test.ts __tests__/activityTracking.test.tsx` ผ่าน 3 suites / 29 tests และ `npx tsc --noEmit` ผ่าน. นี่เป็น baseline ของ code เดิม ไม่ใช่หลักฐานว่าอาการที่รายงานหายหรือ flow ผ่านบนเครื่องจริง. รอบนี้สร้าง/ปรับเฉพาะเอกสารแผน; ยังไม่ได้แก้ source, build APK หรือทดสอบ GPS/camera/share บนอุปกรณ์.