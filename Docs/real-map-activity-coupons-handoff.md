# Ca-Walk: แผนส่งต่องานแผนที่และบันทึกกิจกรรม

อัปเดต: 28 ตุลาคม 2026
เป้าหมาย MVP: ค้นหาสถานที่จริงบนแผนที่ OSM เลือกจุดหมาย ดูเส้นทางไปยังจุดหมายนั้น แล้วบันทึกการเดิน/วิ่งพร้อมรูปและ Story 4 หน้า

## ขอบเขตและการตัดสินใจ

- ทำ Android prototype ใน Bare React Native ต่อจากโครงสร้างเดิม; ไม่ทำ iOS ในรอบนี้
- ใช้ MapLibre กับแผนที่จาก OpenStreetMap (OSM) ต่อไป ไม่เปลี่ยนไปใช้ผู้ให้บริการที่คิดตามโควต้าฟรีหรือ API key แบบมี quota
- ผู้ใช้ค้นหาสถานที่จริง เลือกจุดหมาย แล้วกด **ไปกันเลย** เพื่อเปิดหน้า Record พร้อมจุดหมายและเส้นทางบนแผนที่
- แสดงเส้นทางบนแผนที่และความคืบหน้าจาก GPS เท่านั้น **ไม่มีคำแนะนำเลี้ยวตามทาง ไม่มี turn-by-turn และไม่มีเสียงนำทาง**
- ระหว่างบันทึก ผู้ใช้เริ่ม หยุดชั่วคราว ต่อ จบ และเปิดกล้องถ่ายรูประหว่างกิจกรรมได้
- หลังจบ สร้าง Story 4 หน้าโดยอิงตัวอย่างภาพที่แนบ ใช้สถิติ/รูปจากกิจกรรมจริง และใช้รูปแมวจาก `D:\Project\Ca-walk\Assests\Cat\Photo`
- คูปองและร้านค้าเดิมคงเป็น mock ในเครื่องสำหรับ prototype; ไม่ขยายระบบคูปองหรือเชื่อม Firebase เพิ่มในงาน MVP นี้ เว้นแต่จำเป็นเพื่อไม่ให้ flow เดิมเสีย
- ไม่รื้อ UI และ navigation เดิมเกินจำเป็น; ไม่ย้ายหรือเขียน service ที่มีอยู่ใหม่โดยไม่มีเหตุผล

## ข้อควรรู้เรื่อง OSM และบริการ

OSM เป็นชุดข้อมูลแผนที่ ไม่ได้หมายความว่า tile, geocoding หรือ routing server ทุกแห่งให้บริการฟรีแบบไม่จำกัด การค้นหาและคำนวณเส้นทางต้องเรียกบริการที่มีนโยบายรองรับการใช้งานนั้นแยกจากการโหลดแผนที่

- ใช้ OSM raster tile endpoint ที่เลือกเพียง endpoint เดียวและทำตามนโยบายของผู้ให้บริการ; อย่ากระจายโหลดไป `a.tile`/`b.tile` เพื่อหลบข้อจำกัด และอย่าอธิบายบริการสาธารณะว่า unlimited
- แสดง attribution `© OpenStreetMap contributors` บนแผนที่อย่างเห็นได้ชัด และตรวจการแสดงผล/การ cache ให้ตรงนโยบายของ endpoint ที่ใช้
- ค้นหาจากบริการ geocoding ที่ใช้ข้อมูล OSM โดยส่งคำขอเมื่อผู้ใช้กดค้นหา ไม่ทำ autocomplete หรือยิงคำขอซ้ำถี่ ๆ หากนโยบาย endpoint ไม่อนุญาต
- ขอเส้นทางเดินจากบริการ routing ที่ใช้ข้อมูล OSM แยกต่างหาก เส้นที่ได้เป็น route preview ไปยังจุดหมาย ไม่ใช่คำสั่งนำทางรายช่วง
- เก็บ URL ของ endpoint เป็น config ที่เปลี่ยนได้ ไม่ฝัง credential ลับในแอป
- สำหรับ prototype ให้ใช้ endpoint สาธารณะได้เฉพาะตามนโยบาย/ข้อจำกัดที่ประกาศไว้และยอมรับว่าอาจช้า/หยุดให้บริการ; ก่อนปล่อยให้ผู้ใช้จำนวนมาก ต้องเตรียม hosting ที่ยั่งยืน เช่น self-host OSM tiles, geocoding และ routing หรือเลือกผู้ให้บริการที่มีข้อตกลงชัดเจน

## สถานะจริงจาก source

| ส่วน | มีแล้ว | งานที่ยังขาด |
| --- | --- | --- |
| Android/app shell | Android project, permission location/activity recognition, navigation และ `AppProvider` ถูก mount แล้วใน `App.tsx` | ทดสอบ permission และ lifecycle บนอุปกรณ์จริง |
| แผนที่ | `MapScreen.tsx` และ `RecordScreen.tsx` ใช้ MapLibre และ OSM raster tiles แล้ว | ตรวจ endpoint และ attribution ที่มองเห็นได้; ปัจจุบันค้นหาได้เฉพาะร้าน hardcode 5 แห่ง และยังไม่มี search/geocoding สถานที่จริง |
| จุดหมาย/เส้นทาง | มีหมุดและ polyline บนแผนที่ | ยังไม่มี route service จริงและยังไม่ส่งจุดหมายที่เลือกไป Record; Record เริ่มด้วยพิกัด/เส้นตัวอย่าง |
| GPS/ก้าว | `AppContext.tsx` และ `motionTracker.ts` มี location watch, permission, accelerometer step detector และ session logic | ต้องยืนยันข้อมูล sensor/ระยะจริงใน UI, filter จุด GPS, lifecycle/background และพฤติกรรม pause/resume |
| Record | มีหน้าจอเลือกกิจกรรม, ปุ่มควบคุม, แผนที่, สรุป และกล้องแยกหน้าจอ | pause/resume เปลี่ยน phase ของ UI แต่ยังไม่หยุด/ต่อ tracker และ timer ใน context; ยังมีค่า stat fallback และ action ระยะ mock |
| ภาพกิจกรรม | `RecordCameraScreen.tsx` ถ่ายภาพด้วยกล้อง และส่ง URI ชั่วคราวกลับผ่านตัวแปรใน `App.tsx` | ผูกภาพกับ session ให้ครบและจัดการหลายภาพ/อายุไฟล์ให้เหมาะสม |
| Story | `RecordStoryScreen.tsx` มี 4 หน้า, capture เป็น PNG และเปิด share sheet ได้ | ข้อความ/ตัวเลข/ชื่อสถานที่บางส่วนยัง hardcode; รูปแมวเป็น `CatAvatar`; ต้องใช้รูปจาก `Assests/Cat/Photo` และรูปกิจกรรมจริง |
| คูปอง | มี mock services/context และหน้าจอ wallet/coupon/store | อย่าขยายขอบเขตในรอบแผนที่/กิจกรรม; คง behavior เดิมและกันไม่ให้เชื่อม flow ใหม่แล้วเกิด regression |

## ลำดับการทำงาน

### 1. ทำแผนที่ OSM ให้โปร่งใสและมีสถานะผิดพลาด

**ไฟล์หลัก:** `src/screens/MapScreen.tsx`, `src/screens/RecordScreen.tsx`, config/service สำหรับ URL ของ map

- ตรวจ tile endpoint ปัจจุบันและเลือก endpoint OSM ที่อนุญาตการใช้งาน prototype; เอารายการ host สำรองที่ใช้หลบข้อจำกัดออก
- แสดง OSM attribution บนทุกหน้าที่มีแผนที่ ไม่ซ่อน attribution ไว้เฉพาะใน style metadata
- เพิ่ม loading/error/offline state ที่เข้าใจได้ และไม่ทำให้ marker/route ถูกเข้าใจว่าเป็นข้อมูลจริงเมื่อยังโหลดไม่สำเร็จ
- อย่าแสดงตำแหน่งกรุงเทพฯ หรือพิกัดตัวอย่างเป็นตำแหน่งผู้ใช้จริงเมื่อ GPS ยังไม่มี fix

**รับงานเมื่อ:** Android แสดง tile OSM, attribution อ่านได้, endpoint error แสดงสถานะ, และไม่มี fallback พิกัดปลอมที่สื่อว่าเป็น GPS จริง

### 2. ค้นหาสถานที่จริงและเลือกจุดหมาย

**ไฟล์หลัก:** `src/screens/MapScreen.tsx`, service ใหม่/ที่มีอยู่สำหรับ OSM geocoding, navigation params ใน `App.tsx`

- เพิ่มช่องค้นหาที่ส่ง query เมื่อผู้ใช้กดค้นหา; แสดง loading, ผลลัพธ์, ไม่มีผลลัพธ์, network error และลองใหม่
- ค้นหาสถานที่จาก geocoding endpoint ที่ใช้ OSM; ระบุพิกัด `[longitude, latitude]` ให้ชัดและตรวจข้อมูลตอบกลับก่อนวาง marker
- ให้เลือกผลลัพธ์หนึ่งรายการและเห็นชื่อ/ตำแหน่งที่เลือกบนแผนที่; ร้าน mock เดิมอาจคงไว้เป็น overlay แยก แต่ห้ามปะปนกับผลค้นหาจริง
- กำหนดการเรียกแบบกดค้นหาและจัดการการกดซ้ำ/คำขอเก่ากลับมาทีหลัง โดยเคารพ usage policy ของ endpoint

**รับงานเมื่อ:** ค้นหาชื่อสถานที่จริงได้บนเครื่อง, เลือกผลลัพธ์ได้, marker อยู่ตรงพิกัดที่ตอบกลับ และทุกสถานะ error/ว่างทำงานโดยไม่ crash

### 3. Route preview และปุ่ม “ไปกันเลย”

**ไฟล์หลัก:** `src/screens/MapScreen.tsx`, route service, `App.tsx`, `src/screens/RecordScreen.tsx`

- เมื่อเลือกจุดหมาย ให้คำนวณเส้นทางเดินจากตำแหน่งปัจจุบันไปยังจุดหมายด้วย OSM-based routing endpoint และแสดงเส้นทาง/ระยะทางบนแผนที่
- เมื่อ GPS ยังไม่มีตำแหน่ง ให้ขอ permission/รอ fix หรือแจ้งให้ผู้ใช้ทราบ; อย่าคำนวณ route จากพิกัดตัวอย่าง
- ปุ่ม **ไปกันเลย** ส่ง destination ที่มี id/ชื่อ/พิกัด และ route geometry/ระยะตามความจำเป็น ไปหน้า Record ผ่าน navigation params
- หน้า Record แสดง destination และเส้น route preview ที่เลือก พร้อมแยกจาก actual GPS track ที่บันทึกระหว่างกิจกรรม
- route ไม่ต้องเปลี่ยนตามตำแหน่งระหว่างทางใน MVP; แสดงความคืบหน้าจากตำแหน่งล่าสุด/จุดหมายได้ แต่ไม่บอกเลี้ยว ไม่สร้างรายการขั้นตอนนำทาง และไม่เล่นเสียง
- ถ้า route service ใช้ไม่ได้ ให้แจ้งชัดเจนและยังอนุญาตเริ่มบันทึกกิจกรรมได้โดยไม่มี route preview; ห้ามแสดงเส้นปลอม

**รับงานเมื่อ:** เลือกสถานที่แล้วเห็นเส้นทางเดินและระยะที่มาจาก service; กด “ไปกันเลย” แล้ว Record ได้ destination เดิม; ไม่มี UI หรือเสียงคำสั่งเลี้ยว

### 4. บันทึกการเดิน/วิ่งจาก GPS และ sensor จริง

**ไฟล์หลัก:** `src/screens/RecordScreen.tsx`, `src/context/AppContext.tsx`, `src/services/motionTracker.ts`, `src/services/locationUtils.ts`, `src/screens/RecordSummaryScreen.tsx`

- ให้ start เริ่ม session เดียวและเริ่ม timer/GPS/step tracking; pause หยุดนับเวลาและหยุด/ละเว้น sensor/GPS สำหรับ session โดยรักษาค่าก่อนพัก; resume ต่อ session เดิม; finish ปิด session ครั้งเดียว
- แสดงเวลา active (ไม่รวมเวลาพัก), steps จาก accelerometer, distance จาก GPS track ที่ผ่าน validation และ pace ที่คำนวณจากข้อมูล session; เอาค่า fallback จำลองและ `addMockDistance` ออกจาก path ปกติของ Record
- วาด actual track จาก GPS fixes ที่ใช้คำนวณจริง และแสดง route preview ไปจุดหมายเป็นคนละ geometry/style; อย่าต่อเส้นตัวอย่างเข้ากับ track
- ใช้ accuracy/time/distance checks เพื่อลด GPS jump และกัน segment ความเร็วเกินเกณฑ์เดิม 18 km/h ออกจากระยะที่นำไปคำนวณรางวัล; ก้าวเป็นตัวชี้วัดแยก ไม่บวกระยะก้าวซ้ำกับ GPS
- จัดการ permission denied, GPS ปิด/ไม่มี fix, sensor error, app background/กลับ foreground, กดซ้ำ และจบขณะเริ่ม tracker
- สรุปหลังจบต้องสะท้อน session เดียวกับหน้าบันทึก และไม่เพิ่มระยะสะสมซ้ำเมื่อจบซ้ำ

**รับงานเมื่อ:** บนอุปกรณ์ Android เดินจริงแล้ว GPS track/ระยะและ steps เปลี่ยน; พักแล้วเวลาและระยะไม่เพิ่ม ต่อแล้วใช้ session เดิม จบแล้ว summary ตรงกัน; ปิด GPS/ไม่อนุญาต permission แล้วแอปไม่ crash และไม่สร้างข้อมูลจริงปลอม

### 5. ถ่ายภาพระหว่างกิจกรรมและทำ Story 4 หน้า

**ไฟล์หลัก:** `App.tsx`, `src/screens/RecordCameraScreen.tsx`, `src/screens/RecordStoryScreen.tsx`, `src/screens/RecordStoryScreen.styles.ts`, assets ใน `Assests/Cat/Photo`

- เปิดกล้องจากหน้า Record โดยไม่ทิ้งสถานะ session; หลังถ่ายกลับมาที่ Record และผูก URI กับ activity ที่กำลังบันทึก
- รองรับการถ่ายมากกว่าหนึ่งภาพ หรือกำหนดภาพหลักหนึ่งภาพสำหรับ MVP ให้ตรงกับ UX; URI ต้องยังอ่านได้ตอนสร้าง/แชร์ Story ไม่ใช่อาศัย temporary file ที่หายก่อน
- ทำ Story 4 หน้าโดยใช้ภาพแนบ `Ref_Highlight1.png`, `Ref_Highlight2.png`, `Ref_Highlight3.png`, `Ref_HighlightLastPage.png` เป็นแนวทางจัดองค์ประกอบเท่านั้น ไม่คัดลอกข้อความหรือตัวเลขตัวอย่าง
- แสดงข้อมูลจริงของ session เช่น ระยะ, เวลา, steps, pace และปลายทางที่เลือก; เมื่อข้อมูลไม่มี ให้แสดงสถานะไม่มีข้อมูลแทนการใส่ตัวเลข/สถานที่สมมติ
- แทน `CatAvatar` ใน Story ด้วยรูปแมวจาก `D:\Project\Ca-walk\Assests\Cat\Photo`; เลือกภาพที่เหมาะกับหน้าและจัดวางไม่บังสถิติ/ภาพถ่าย
- แชร์ภาพแต่ละหน้า หรือแชร์หน้า/ภาพที่ผู้ใช้เลือกผ่าน native share sheet; แสดงความล้มเหลวโดยไม่ทำให้กิจกรรมหรือภาพสูญหาย

**รับงานเมื่อ:** บันทึกเสร็จแล้ว Story ครบ 4 หน้า, ข้อมูลทุกหน้ามาจาก activity จริง, รูปที่ถ่ายเปิดแสดงได้, มีรูปแมวจากโฟลเดอร์ที่กำหนด และแชร์ภาพออกจากแอปได้

### 6. คงคูปอง mock และตรวจ regression

**ไฟล์หลัก:** `src/context/AppContext.tsx`, `src/screens/DistanceWalletScreen.tsx`, `src/screens/MyCouponsScreen.tsx`, `src/screens/StoreDetailScreen.tsx`

- ไม่เพิ่ม backend, payment หรือระบบคูปองจริงใน MVP นี้
- ตรวจว่า flow map/record/story ไม่เปลี่ยน state ของ wallet/coupon โดยไม่ตั้งใจ; ถ้าคูปองยังไม่เชื่อมกับ session จริง ให้คงป้าย/พฤติกรรม mock ตามเดิมและบันทึกไว้ชัดเจน

**รับงานเมื่อ:** ฟีเจอร์ใหม่ไม่ทำให้แอปเปิดไม่ได้หรือทำให้ coupon mock ที่มีอยู่พัง; ไม่กล่าวอ้างว่าคูปองเป็นการแลกจริง

### 7. ตรวจบน Android และบันทึกผลส่งต่อ

- รัน test/lint/typecheck/build ตาม scripts ที่มีใน `package.json` และ Android Gradle project; รายงานเฉพาะคำสั่งที่รันจริงและผลจริง
- ติดตั้งบน Android device จริงอย่างน้อยหนึ่งเครื่องและตรวจ permission, GPS, OSM tiles, search, route preview, ไปกันเลย, start/pause/resume/finish, camera และ share sheet
- ทดสอบ network หาย, endpoint ปฏิเสธ/จำกัดคำขอ, permission denied, GPS ปิด และ location accuracy ต่ำ
- บันทึก device/API level, endpoint ที่ใช้, ข้อจำกัด/นโยบายที่ตรวจแล้ว, test/build result และ known issues

## Acceptance checklist

- [ ] MapLibre ใช้ OSM tiles พร้อม attribution ที่อ่านได้ และไม่มีการกระจายคำขอไปหลาย host เพื่อหลบข้อจำกัด
- [ ] ค้นหาสถานที่จริงได้จาก geocoding endpoint; ไม่มีผลลัพธ์/error/network state แสดงถูกต้อง
- [ ] เลือกจุดหมายแล้วเห็น route preview และระยะจาก routing endpoint
- [ ] “ไปกันเลย” เปิด Record พร้อมจุดหมายที่เลือกและ route preview
- [ ] ไม่มีคำแนะนำเลี้ยวทีละช่วง ไม่มี turn-by-turn และไม่มีเสียงนำทาง
- [ ] GPS track ที่บันทึกจริงแยกจากเส้น route preview; ไม่มีพิกัดหรือค่าสถิติปลอมในสถานะ GPS/session ว่าง
- [ ] เริ่ม/หยุดชั่วคราว/ต่อ/จบทำงานกับ tracker และ timer จริง; เวลาพักไม่นับรวม
- [ ] Steps มาจาก accelerometer; ระยะกิจกรรมมาจาก GPS ที่กรองแล้ว ไม่บวกระยะ step ซ้ำ
- [ ] เปิดกล้องถ่ายระหว่าง session กลับมาบันทึกต่อได้ และรูปยังอยู่ตอนสร้าง Story
- [ ] Story มี 4 หน้า ใช้สถิติจริง รูปแมวจาก `Assests/Cat/Photo` และแชร์ได้
- [ ] network/permission/GPS/service failure ไม่ทำให้แอป crash และไม่แสดงข้อมูลจริงปลอม
- [ ] coupon mock เดิมยังใช้งานตามเดิมโดยไม่มีการอ้างว่าเป็นระบบคูปองจริง
- [ ] Android debug build ผ่านและ flow หลักได้รับการตรวจบนอุปกรณ์จริงอย่างน้อยหนึ่งเครื่อง

## จุดเริ่มสำหรับผู้รับงาน

อ่าน `HANDS-OFF.md` แล้วอ่านเอกสารนี้ จากนั้นตรวจ `App.tsx`, `src/context/AppContext.tsx`, `src/services/motionTracker.ts`, `src/services/locationUtils.ts`, `src/screens/MapScreen.tsx`, `src/screens/RecordScreen.tsx`, `src/screens/RecordCameraScreen.tsx` และ `src/screens/RecordStoryScreen.tsx` ตามลำดับ

อย่าเริ่มเขียน MapLibre, camera, Story หรือ session ใหม่ทั้งหมด เพราะโครงเหล่านี้มีอยู่แล้ว จุดที่ยังขาดคือค้นหาสถานที่และ route จริง, ส่ง destination ข้ามหน้า, ทำให้ pause/resume ควบคุม tracker/timer จริง, เอาข้อมูลตัวอย่างออกจาก flow บันทึก และใช้ภาพแมว/สถิติจริงใน Story
