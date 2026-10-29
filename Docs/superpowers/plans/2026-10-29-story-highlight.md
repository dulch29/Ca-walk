# Story & Highlight Implementation Plan

> **For agentic workers:** Use `superpowers:executing-plans` to implement task-by-task. Use `superpowers:subagent-driven-development` only if the user authorizes delegation. Steps use checkboxes for tracking.

**Goal:** ทำ Story 4 หน้าให้ใกล้ภาพอ้างอิงใหม่ ใช้รูปกิจกรรมและสถิติจริง แมวชุดใหม่ ตัวอักษรเขียนด้วยโค้ด และแชร์ออกเป็นภาพแนวตั้งได้หลังจบกิจกรรม

**Architecture:** แยก Story canvas ออกจากปุ่มควบคุม รับ completed `RunSummary` จากแผน A แบบ read-only ทำ page components สี่หน้าใช้กรอบ 1080×1920 ร่วมกัน และ export เฉพาะ canvas ผ่าน view-shot/share ที่ติดตั้งอยู่ ไม่อ่าน GPS, active session หรือค้นหาสถานที่เพิ่มจากหน้าสตอรี่

**Tech Stack:** React Native 0.88, TypeScript, Image/Text, react-native-svg, react-native-view-shot 6.2, react-native-share 12.3, Jest, ฟอนต์ handwriting แบบ bundled

**Spec:** ข้อกำหนดในหัวข้อ “1. ผลลัพธ์และขอบเขต” ของไฟล์นี้และภาพอ้างอิงใน `D:/ProjectXY/Ca-walk/Assests/Images/ShareStory`; คำขอล่าสุดของผู้ใช้มีสิทธิ์เหนือภาพ/เอกสารตัวอย่าง

**วันที่:** 2026-10-29 (Asia/Bangkok)

**สถานะ:** ลงมือและตรวจ Story B1–B5 แล้ว (2026-10-30); native manual flow ผ่านบน Android emulator, arrival field test และงานเต็มแผน A ยังไม่ตรวจ — ดูข้อ 10

**ผู้รับผิดชอบ:** Developer B — Story / Highlight / Cat photo registry / Fonts / Export

**คู่แผน:** [Map, Search & Activity Stability](D:/ProjectXY/Ca-walk/Docs/superpowers/plans/2026-10-29-map-search-stability.md)

## Global Constraints

- ใช้ภาพอ้างอิงใหม่ใน `D:/ProjectXY/Ca-walk/Assests/Images/ShareStory` ไม่ใช้ layout เก่า Quest Completed ที่ผู้ใช้ไม่ชอบเป็นฐานภาพ
- `AssetN_HighlightM` คือ asset ลำดับ N ของหน้า M ไม่ใช่ชื่อหน้าใหม่; หน้า4ใช้ `Ref_HighlightLastPage.png`
- ข้อความ/ตัวเลขเป็น React Native Text หรือ SVG Text ที่เขียนจากโค้ด ไม่ใช้ screenshot อ้างอิงทั้งรูปเป็นหน้า Story
- ตัวแมวหลักใช้ภาพคมชุดใหม่จาก `D:/ProjectXY/Ca-walk/Assests/Cat/Photo` ตามคำขอล่าสุด แม้ภาพอ้างอิงจะเป็นแมวดำคนละสไตล์
- ไม่ใช้จำนวนก้าว/เวลา/สถานที่/สัดส่วนเทียบประวัติตัวอย่างเป็นข้อมูลของผู้ใช้
- ไม่มีคำขอ GPS, geocoding, routing, backend หรือ LLM เพิ่มในหน้าสตอรี่
- ใช้ view-shot/share/svg ที่มีแล้วก่อน ไม่เพิ่ม animation/story library หรือ dependency เพื่อทำ layout ธรรมดา
- Android เป็นเป้าหมายรอบนี้; share sheet ส่งออกไฟล์ได้ ไม่รับประกันว่าโพสต์ Instagram Stories อัตโนมัติหรือมีหน้าตาเหมือนกันทุกแอป
- คงไฟล์ภาพต้นฉบับและการเปลี่ยนชื่อของผู้ใช้ ไม่ restore ภาพเก่า ไม่แก้ภาพ reference เพื่อให้ผลตรวจดูผ่าน

---

## 1. ผลลัพธ์และขอบเขต

ผู้ใช้จบเดิน/วิ่งเอง หรือถึงจุดหมายแล้วเลือก “จบและสร้างสตอรี่” → เปิด Story สี่หน้า → ปัด/แตะเลือกหน้า → แชร์ภาพหน้านั้น → กลับดูหน้าอื่นหรือกลับ Home

**รอบนี้ทำ:** layout สี่หน้าตามตัวอย่าง, รูปจริงจากกิจกรรม, สถิติคงที่ของกิจกรรมที่จบแล้ว, แมวท่าที่เหมาะสม, no-photo state ที่ยังสวย, PNG 9:16 และ native share sheet

**ไม่เพิ่ม:** วิดีโอ, สตอรี่แบบเล่นอัตโนมัติ, เพลง, social feed, login/social integration ใหม่, เปรียบเทียบสถิติวันอังคารโดยไม่มีประวัติจริง, แผนที่ snapshot ใหม่, direct Instagram publishing หรือแก้ระบบคูปอง

**ค่าตั้งต้นที่เสนอ:** ใช้ภาพแรกที่โหลดได้ของกิจกรรมเป็น hero และภาพที่สองที่โหลดได้เป็น polaroid; ถ้ามีรูปเดียวใช้ภาพเดิมได้ ผู้ใช้ไม่ต้องจัดภาพใหม่หลายขั้นเพื่อแชร์ครั้งแรก

### มาตรฐานภาพ

- Design coordinate system **1080×1920, 9:16** ทั้งสี่หน้า จากขนาดไฟล์ reference ที่ตรวจแล้ว
- Mood: กระดาษครีม/เขียนมือ/ภาพถ่ายจริง/doodle ขาวดำ, พื้นที่หายใจชัด ไม่เปลี่ยนเป็น dashboard ตัวเลขหรือกล่องรางวัล
- พื้นครีมเสนอ `#F1EBDD`, ตัวอักษร `#171813`, เส้น doodle ขาว/ดำตามภาพ ไม่เติมสี UI หลายชุด
- ฟอนต์เสนอ **Caveat** สำหรับอังกฤษ/ตัวเลข และ system Thai fallback ที่อ่านได้ ตรวจ glyph บน Android จริง ไม่ปล่อยเป็นสี่เหลี่ยม ถ้าต้องเพิ่มฟอนต์ไทยให้ bundle พร้อม license
- Rounded corners/progress indicators ใน reference เป็นกรอบ preview/UI; export เป็นสี่เหลี่ยม 1080×1920 เต็ม ไม่เอามุมดำจาก screenshot ติดไปในไฟล์
- ข้อมูลที่ไม่มีให้ใช้คำกลางที่บอกความจริง เช่น “A little time outside.” แทนค่าจำลองหรือรูปสวน stock ที่ดูเหมือนผู้ใช้ไปจริง

## 2. สิ่งที่ตรวจพบจากของเดิม

- `src/screens/RecordStoryScreen.tsx` มีสี่หน้าและ share อยู่แล้ว แต่ layout ไม่ใช่ reference ล่าสุด; ยังใช้ `story_park.jpg` เป็น fallback และจับเวลาปัจจุบันตอนเปิดหน้า
- ตัว share จับภาพ canvas ตามขนาดจอโดยยังไม่ล็อก 9:16/1080×1920 และ catch รวม cancel/error จนผู้ใช้ไม่รู้ว่าส่งออกล้มเหลว
- `src/assets/catPhotos.ts` ยัง require `jump (2).png`, `walk (3).png` และชื่อเก่าที่ไม่มีแล้ว ต้องแก้ก่อนเปิดแอป build จริง แม้ Jest ที่ mock ภาพและ typecheckจะผ่าน
- `App.tsx` มี `lastPhotoUri` ของภาพก่อนหน้า แผน A เป็นเจ้าของลบเพื่อกันรูปข้าม session; B ห้ามใช้ fallback นี้
- ฟอนต์ `.ttf/.otf` ยังไม่พบในรายการ source ที่ตรวจ จึงต้อง bundle ฟอนต์ที่เลือกจริง ไม่ใส่ชื่อ fontFamily แล้วสมมติว่าเครื่องมี
- ใหม่ใน `Cat/Photo` เป็นแมว pixel art 512×512 มีพื้นที่โปร่งใสโดยรอบ ต่างจากแมวดำวาดมือใน reference จึงต้องวางตามขนาดตัวแมวจริง ไม่ขยายกรอบโปร่งใสจนแมวเล็กจิ๋ว

## 3. Asset inventory ที่ดูภาพจริงแล้ว

**Base:** `D:/ProjectXY/Ca-walk/Assests/Images/ShareStory/`

| หน้า | Reference | Asset ที่ให้มา / ขนาด | ใช้ในงานนี้ |
| --- | --- | --- | --- |
| 1 | `Ref_Highlight1.png` | `Asset1_Highlight1.png` 1080×394 = แผ่นกระดาษครีมเอียง; `Asset2_Highlight1.png` 65×65 = อุ้งเท้า | กระดาษ footer และ paw; หัวข้อ/คำบรรยายเขียน Text |
| 2 | `Ref_Highlight2.png` | `Asset1_Highlight2.png` 247×219 = ปลา/หัวใจ; `Asset2_Highlight2.png` 205×216 = เส้นเน้นสีดำ; `Asset3_Highlight2.png` 498×566 = แมวดำสะพายเป้ | ใช้ปลา/เส้นเน้น; แมวหลักแทนด้วยภาพ Photo ชุดใหม่ |
| 3 | `Ref_Highlight3.png` | `Asset1_Highlight3.png` 527×600 = แมวดำมีต้นอ่อน; `Asset2_Highlight3.png` 126×115 = เส้นเน้นสีขาว; `Asset3_Highlight3.png` 67×71 = ดาวขาว | ใช้เส้น/ดาว; แมวหลักแทนด้วย Photo; สร้างกรอบ polaroid/เทปด้วย View/SVG |
| 4 | `Ref_HighlightLastPage.png` | `Asset1_Highlight4.png` 759×483 = แมวดำนอน; `Asset2_Highlight4.png` 152×153 = paw; `Asset3_Highlight4.png` 121×122 = ดาว; `Asset4_Highlight4.png` 121×122 = sparkle | ใช้ paw/ดาว; แมวหลักใช้ `Photo/sleep.png`; กระดาษ/gradientสร้างด้วยพื้นสีหรือ overlay ที่มีอยู่ |

**แมวชุดใหม่:** `D:/ProjectXY/Ca-walk/Assests/Cat/Photo/`

| Key/หน้าใช้งาน | ไฟล์จริง | หมายเหตุ |
| --- | --- | --- |
| idle | `idle.png` | ท่ายืน/นิ่ง |
| sit / หน้า3 | `idke_site.png` | ชื่อสะกดจริงเป็น `idke_site` ห้ามแก้ path เป็น `idle_site` เอง |
| walk / หน้า2 | `walk.png` | ท่าเดิน; ไม่ใช้ภาพใน `blur/` |
| run | `run1.png`, `run2.png` | เลือกตามกิจกรรมวิ่งหรือใช้เฟรมเดียวในภาพนิ่ง |
| jump / หน้า1 | `jump1.png`, `jump2.png` | ท่าดีใจ/active; เลือกท่าที่เห็นใบหน้าชัด |
| sleep / หน้า4 | `sleep.png` | จบกิจกรรมแล้วพัก |
| lick / touch / threaten | `lick.png`, `touch.png`, `threaten.png` | มีไว้จริง ไม่จำเป็นต้องใช้ทุกท่าใน MVP |

**จุดต่างที่ตั้งใจ:** ทำองค์ประกอบให้เหมือน reference แต่ตัวแมวเป็น pixel art ใหม่ตามคำสั่งผู้ใช้ ถ้าอยากคงแมวดำใน reference ต้องให้ผู้ใช้เปลี่ยนข้อกำหนดก่อน ไม่ตัดสินใจสลับเอง

## 4. สัญญาข้อมูลร่วม — ห้ามเปลี่ยนคนเดียว

A เป็นเจ้าของ `src/types/activity.ts` และ pace helpers; B รอ commit สัญญานี้ หรือใช้ fixture ใน test/design ระหว่างรอ โดยไม่สร้าง type อีกชื่อแข่ง

```ts
export type Sport = 'walk' | 'run';
export type LngLat = [number, number];

export interface RunSummary {
  sessionId: string;
  sport: Sport;
  startTime: string;
  endTime: string;
  seconds: number; // เวลาที่ session อยู่ใน recording state; ไม่รวม pause และไม่ใช่ moving-time detection
  km: number; // accepted GPS distance
  steps: number;
  averagePaceSecondsPerKm: number | null;
  distanceSource: 'gps' | 'unavailable';
  completionReason: 'manual' | 'arrived';
  destinationName?: string;
  photos: string[];
  trackCoordinates: LngLat[];
  trackSegments?: LngLat[][]; // แยกช่วงเมื่อ pause หรือ GPS gap เพื่อไม่ลากเส้นข้ามช่วง
}
```

B ใช้ `formatPaceSeconds(value: number | null): string` จาก `src/services/locationUtils.ts` คืน `m:ss` หรือ `--` แล้วเติม `/km` ที่ UI ห้ามหารสูตรใหม่/parse decimal pace เอง

- `startTime/endTime` เป็น ISO8601 จริงจากกิจกรรม; แสดงตาม localeของเครื่องด้วย timestamp เดิม ไม่ `new Date()` แบบไม่มี inputเมื่อเปิดหน้า
- `seconds` เป็นเวลาที่อยู่ใน recording state รวมช่วงหยุดนิ่งที่ผู้ใช้ยังไม่ได้กด pause แต่ไม่รวมช่วง paused; ไม่ใช่ moving-time detection และไม่ใช้ `endTime-startTime` คิดเวลาใหม่
- `averagePaceSecondsPerKm=seconds/km`, กรณี distance <=0.005 กม./เวลาไม่ถูกต้องเป็น null; 5 กม./1,800วินาทีแสดง `6:00 /km`
- `completionReason='arrived'` เท่านั้นที่ใช้ข้อความยืนยันถึงร้าน; มี destinationName อย่างเดียวไม่ยืนยันว่าไปถึง
- ใช้ภาพจาก `summary.photos` เท่านั้น; prop `photoUri?: string` คงไว้ชั่วคราวเพื่อให้ App เก่าคอมไพล์ได้ แต่ไม่ใช้เป็นข้อมูลข้าม session A ลบ prop เก่าเมื่อ integration
- Story ไม่เปลี่ยน summary/ประวัติ/ระยะสะสม ไม่สั่งจบกิจกรรมซ้ำ และไม่อัปโหลดรูปอัตโนมัติ

Fixture สำหรับพัฒนาและ tests เท่านั้น ห้ามเป็น runtime fallback:

```ts
const storyFixture: RunSummary = {
  sessionId: 'story-fixture-only', sport: 'run',
  startTime: '2026-10-29T00:00:00.000Z',
  endTime: '2026-10-29T00:35:00.000Z',
  seconds: 1800, km: 5, steps: 4200,
  averagePaceSecondsPerKm: 360, distanceSource: 'gps',
  completionReason: 'manual', photos: [], trackCoordinates: [],
};
```

## 5. เจ้าของไฟล์และวิธีทำขนาน

| B แก้ได้ | หน้าที่ |
| --- | --- |
| `src/screens/RecordStoryScreen.tsx` | pager, loading/export state, share/close; คง Propsหลัก summary/onClose |
| `src/screens/RecordStoryScreen.styles.ts` | Story shell/controlsเท่านั้น |
| `src/components/story/StoryCanvas.tsx` ใหม่ | พื้นที่9:16ร่วม เลือกหนึ่งในสี่หน้า ไม่รวมปุ่มควบคุม |
| `src/components/story/OutsideStoryPage.tsx` ใหม่ | หน้า1 photo + headline + torn footer |
| `src/components/story/StepsStoryPage.tsx` ใหม่ | หน้า2 steps + cat + encouragement |
| `src/components/story/MomentStoryPage.tsx` ใหม่ | หน้า3 photo + polaroid +เวลา/จุดหมายที่ไม่กล่าวอ้างเกินจริง |
| `src/components/story/RestStoryPage.tsx` ใหม่ | หน้า4 จบเรื่อง/แมวนอน |
| `src/components/story/storyModel.ts` ใหม่ | pure helpersสำหรับข้อความ, format time/distance, เลือกรูป; ไม่มี network |
| `src/assets/storyAssets.ts` ใหม่ | static require ของกระดาษ/doodlesที่ใช้จริง |
| `src/assets/catPhotos.ts` | แก้ชื่อไฟล์แมวใหม่ รักษาkeyที่ยังมีcaller |
| native font assets/config | `react-native.config.js` และโฟลเดอร์ฟอนต์Android; ไม่แก้ manifest trackingของA |
| `__tests__/storyModel.test.ts`, `RecordStoryScreen.test.tsx` ใหม่ | ข้อความ/data mapping/no-photo/share |

**B ห้ามแก้ซ้ำกับ A:** `App.tsx`, `AppContext.tsx`, `RecordScreen.tsx`, `RecordSummaryScreen.tsx`, `locationUtils.ts`, `osm*Service.ts`, `mockData.ts`, `firestoreService.ts`, `src/types/activity.ts` ถ้าขาดfieldให้ตกลงcontractกับAก่อน

ลำดับส่ง: **A ส่ง contract+pace helper → B ส่ง cat registryแก้ชื่อก่อน → B ทำpagesด้วยfixture → A รวมnavigation → ตรวจทั้งสองแผนด้วยกิจกรรมจริง** ห้ามทั้งสองคนแก้ `package.json`/lockfileพร้อมกัน งานนี้ใช้dependencyเดิมได้ ไม่ควรแก้สองไฟล์นี้

## 6. แบบของสี่หน้า

พิกัด/ขนาดด้านล่างเป็นสัดส่วนเสนอให้เทียบภาพจริง ไม่ใช่ให้บังคับ stretch ภาพให้เต็มกรอบทุกอัน ใช้ `contain` กับแมว/doodles, `cover` กับภาพกิจกรรม

### หน้า1 — You went outside.

- ภาพกิจกรรมเต็มพื้นหลังแบบ cover; gradient/overlayบาง ๆ เฉพาะจุดเพื่อให้ตัวหนังสืออ่านได้
- หัวข้อสีขาวลายมือกลางบน ราว y=0.18–0.33H แบ่งสองบรรทัด “You went / outside.” พร้อม sun doodleเขียน SVG
- แมว `jump1.png` หรือ `idle.png` โผล่มุมขวาล่าง เหนือกระดาษ; ใช้ขนาดตัวแมวจริง ไม่ขยายพื้นที่โปร่งใส
- `Asset1_Highlight1` เป็น footerฉีกเอียงประมาณล่าง20% และ `Asset2_Highlight1` เป็นpaw
- Caption เป็น Text “Fresh air hits different.” หรือข้อความกลางตามมี/ไม่มีภาพ ไม่ใช้ข้อความติดใน screenshot
- **ไม่มีรูป:** พื้นครีม+doodle+แมว หัวข้อเปลี่ยนสีดำ; ยังดูจบหนึ่งหน้า ไม่ใช้ stock park แทนรูปผู้ใช้

### หน้า2 — You walked / You ran

- พื้นครีม ชิดซ้ายส่วนบน: “You walked” หรือ “You ran”, จำนวนก้าวจริงตัวใหญ่, “steps.”
- `Asset2_Highlight2` เส้นเน้นข้างตัวเลข, `Asset1_Highlight2` ปลาอยู่พื้นที่ว่าง
- แมว `walk.png` หรือ `run1.png` ราวครึ่งล่างค่อนไปกลาง; speech bubble “Not bad!” สร้างด้วยView/SVG
- กล่องกระดาษเอียงเล็กน้อยด้านล่าง ใช้ข้อความจริง `5.00 km · 30:00 active · 6:00 /km average` ตามค่ากิจกรรม ไม่คัดลอก 2.4x your usual Tuesdaysจากตัวอย่าง
- ถ้าไม่มีGPS distance ให้โชว์ก้าว/เวลาที่มี และ “GPS distance unavailable” ไม่แทนด้วยระยะประมาณจากก้าว
- **ไม่มีประวัติ:** ใช้ “Every step counts.” ไม่สร้างค่าเฉลี่ย/เปอร์เซ็นต์เปรียบเทียบที่ยังไม่มีข้อมูล

### หน้า3 — A moment from your walk/run

- มีรูป: ใช้ภาพที่สองถ้ามีหรือภาพแรกซ้ำเป็นbackground; วางpolaroidขาวเอียงประมาณ−8°ที่กลาง, ภาพอยู่ในกรอบจริงและเทปโปร่งใสที่ขอบบน
- หัวข้อขาวเขียนมือแถวบน; ใช้ “Here’s where you went.” เมื่อยืนยันถึงจุดหมาย หรือ “A moment from your run.”/“A moment from your walk.” เมื่อไม่ได้ยืนยันถึง
- `Asset2_Highlight3` เส้นเน้นสีขาวและ `Asset3_Highlight3` ดาว; location/time iconsเขียนSVG ไม่ใช้emojiแทนในองค์ประกอบหลัก
- แมว `idke_site.png` อยู่ขวาล่าง ราว0.35–0.42W โดยปรับจากขนาดตัวแมวหลังตัดพื้นที่โปร่งใส
- footerซ้ายแสดง **เวลาจบกิจกรรม** จาก endTime ติดlabelที่ไม่ทำให้เข้าใจว่าเป็นเวลาGPSภาพ; ไม่มีmetadataเวลาถ่ายในcontractจึงห้ามเดา
- ถึงร้านแล้วแสดงdestinationName; ยังไม่ถึงแสดง “จุดหมาย: …” ไม่เขียนว่าภาพนี้ถ่ายที่ร้าน; ไม่มีdestinationใช้ “Your own route” ไม่เติมLumpini Park
- **ไม่มีรูป:** polaroidพื้นครีม+ข้อความเวลา/ชื่อจุดหมายตามข้อเท็จจริง+แมว; ไม่มีหมุด/ภาพปลอม

### หน้า4 — So that’s where you were.

- พื้นครีม, headlineสีดำขนาดใหญ่เอียงนิด ๆ ในครึ่งบน, paw/ดาวเว้นว่างแบบreference
- ภาพกิจกรรมถ้ามีเป็นbandจางด้านล่างกลาง ไม่สร้างภาพskylineกรุงเทพฯถ้าไม่มีรูปจากผู้ใช้; no-photoใช้พื้นครีมต่อเนื่อง
- แมว `sleep.png` นอนบนขอบกระดาษราวy=0.58–0.73H พร้อมdoodlesจาก Highlight4
- **ใน preview:** ปุ่มดำ “Share this story” และ “Back to Home” จัดตามreference แต่อยู่บนcontrols layer นอกviewที่capture
- **ใน PNG:** ไม่มีปุ่มกด/close/progress indicators/Back to Home; คงภาพแมว+captionส่งท้าย “A little time outside.” ให้พื้นที่ด้านล่างยังสมดุล
- หน้า1–3มีปุ่มแชร์ของshellด้วย ผู้ใช้ไม่ต้องปัดถึงหน้า4เพื่อแชร์รูปที่ชอบ

## 7. แผนลงมือทีละงาน

ทำแต่ละงานแบบ testที่แสดงข้อกำหนด → รันให้fail → เปลี่ยนให้น้อยที่สุด → รันให้pass → reviewdiff/commitเฉพาะงานตัวเอง ไม่รวมassetเปลี่ยนชื่อที่ผู้ใช้ทำค้างไว้โดยไม่ตั้งใจ

### Task B1 — Registry, ฟอนต์ และข้อมูลสำหรับวางหน้า

**Files:** `catPhotos.ts`, new `storyAssets.ts`, new `storyModel.ts`, native font assets/config; new `__tests__/storyModel.test.ts`

**Consumes:** shared `RunSummary` และไฟล์assetตามinventory

**Produces:** static asset registry และ `getStoryHeading(page: 0 | 1 | 2 | 3, summary: RunSummary): string`, `getStoryPhoto(summary: RunSummary, page: 0 | 1 | 2 | 3): string | null` ใน `storyModel.ts`

- [x] เพิ่มtest headingเดิน/วิ่ง, manual/arrived, steps0, no-photo, รูปเดียว/หลายรูป, averagepace null และเวลาจากendTimeที่คงที่
- [ ] รัน `npm test -- --runInBand __tests__/storyModel.test.ts` ให้failก่อนเพิ่มhelpers
- [x] แก้registryให้requireไฟล์ที่มีจริง เช่น `jump1.png`, `walk.png`, `lick.png`, `sleep.png`, `run1.png`; เพิ่มsit→`idke_site.png` รักษาlegacy keysที่ยังมีcallerจนintegrationครบ
- [x] เก็บpaper/doodlesตามหน้าใน `storyAssets.ts`; ภาพแมวดำในassetชุดHighlightไม่ใช่แมวหลัก ไม่ต้องbundleของที่ไม่ได้ใช้
- [x] ใช้Caveatที่bundleจริง พร้อมSIL Open Font License; ตรวจชื่อfontภายในและAndroid family nameหลังcopy/link ไม่โหลดfontจากnetworkขณะเปิดStory
- [x] วัดalpha/content boundsของcatใหม่เพื่อจัดขนาดแมวที่มองเห็น หากต้องtrimให้สร้างสำเนาหรือใช้croppedviewport ห้ามแก้ต้นฉบับและห้ามstretchเบลอจนเสียpixelart
- [ ] ส่งcatregistrycommitให้Aก่อนเพื่อปลดปัญหาMetroหาไฟล์เก่าไม่เจอ
- [x] รันtest/tsc และตรวจทุกrequireกับfilesystemจริง เพราะJestmockภาพไม่จับmissingasset

```ts
expect(getStoryHeading(1, { ...storyFixture, sport: 'walk' })).toBe('You walked');
expect(getStoryHeading(1, storyFixture)).toBe('You ran');
expect(getStoryPhoto(storyFixture, 0)).toBeNull();
expect(getStoryPhoto({ ...storyFixture, photos: ['file:///a.jpg'] }, 2))
  .toBe('file:///a.jpg');
// page index ใช้ 0..3 ในhelpers/pagerทุกจุด
```

### Task B2 — Canvasร่วมและหน้า1–2

**Files:** new `StoryCanvas.tsx`, `OutsideStoryPage.tsx`, `StepsStoryPage.tsx`; new `__tests__/RecordStoryScreen.test.tsx`

**Consumes:** `RunSummary`, assets, helpersจากB1, `formatPaceSeconds`จากA

**Produces:** `<StoryCanvas page={0 | 1 | 2 | 3} summary={summary} />` ที่ไม่รวมcontrols และมีrefสำหรับcapture

- [x] เพิ่มrenderer tests: หน้า2อ่านstepsจากfixture, แสดง“You ran”, `6:00 /km`, ไม่พบmock“2.4x”; หน้า1no-photoไม่มี`story_park.jpg`
- [ ] รัน `npm test -- --runInBand __tests__/RecordStoryScreen.test.tsx` ให้failก่อนทำpages
- [x] ทำcanvas9:16โดยdesignพิกัด1080×1920 แล้วscaleตามpreviewพื้นที่จริง ไม่ใช้ความสูงหน้าจอเป็นขนาดเนื้อหา
- [x] ทำหน้า1–2ตามข้อ6 ใช้Textจริงที่ปรับfontSizeตามพื้นที่และmax2บรรทัดสำหรับcaption ไม่cropตัวเลขก้าวเมื่อ7หลัก
- [x] ปรับเลข/ข้อความให้รองรับfontScaleตัวใหญ่ในcontrols; artworkใช้ขนาดออกแบบคงที่สำหรับexportและทดสอบไม่ให้accessibilityfontScaleทำlayoutพัง
- [x] เลือกรูปจากsummaryและรอonLoad; ถ้ารูปโหลดพังแสดงno-photodesignแทน มีปุ่มลองรูปใหม่/ลองอีกครั้งในshell ไม่หายเงียบ
- [x] เปิดpreview1080×1920เทียบreferenceด้านข้าง ตรวจhierarchy/สี/ระยะหายใจ/ขนาดแมวจริง ไม่รับงานจากJestsnapshotอย่างเดียว

### Task B3 — หน้า3–4 และfallbackครบสี่หน้า

**Files:** new `MomentStoryPage.tsx`, `RestStoryPage.tsx`, `StoryCanvas.tsx`, `storyModel.ts`; tests `storyModel.test.ts`, `RecordStoryScreen.test.tsx`

**Consumes:** completedsummary, completionReason, ภาพ0/1/2รูป และassetsHighlight3/4

**Produces:** สี่หน้าครบพร้อมcaptionตามข้อมูลจริง ไม่มีการอ้างถึงสถานที่/เวลาที่ไม่รู้

- [x] เพิ่มtest manualfinishที่มีdestinationNameต้องไม่บอกว่าถึงร้าน; arrivedใช้ข้อความถึงได้; endTimeเดิมเปิดสองครั้งได้เวลาเดิม
- [x] เพิ่มtest no-photoครบ4หน้า, รูปเดียวไม่ทำหน้า3ว่าง, กิจกรรม0เมตร/0ก้าวไม่crashหรือสร้างเลขปลอม
- [ ] รันtestsให้failแล้วทำหน้า3ตามpolaroid/photo/doodles/แมวนั่ง และหน้า4ตามcream/sleepcat/พื้นที่ปุ่มตามreference
- [x] page4ออกแบบcanvasจบเรื่องให้สมดุลโดยไม่มีปุ่ม; previewค่อยoverlayปุ่มในshellนอกcapturetarget
- [x] ไม่มีภาพผู้ใช้ให้ใช้cream/no-photoframe ไม่ใช้referenceเต็มรูปหรือภาพตึก/สวนstockมาอ้างว่าเป็นกิจกรรมนี้
- [x] รองรับชื่อร้านไทยยาวโดยmax2บรรทัด/ตัดท้ายอย่างชัดเจน ไม่ยืดจนทับแมวหรือหลุดsafearea
- [x] ตรวจภาพครบทั้งportraitจอเล็ก/จอสูง, no-photo, รูปสว่าง/มืด, ยาวมากและภาษาไทย

### Task B4 — Pager และPNGที่แชร์ใช้ได้จริง

**Files:** `RecordStoryScreen.tsx`, `RecordStoryScreen.styles.ts`, `StoryCanvas.tsx`; tests `RecordStoryScreen.test.tsx`

**Consumes:** canvasที่mountedและโหลดimage/fontครบ, page index0..3

**Produces:** PNG1080×1920ของหน้าที่เลือก, share/cancel/errorstateที่ไม่ทำข้อมูลกิจกรรมหาย

- [x] Mock `captureRef`/`Share.open` ในtest: เลือกหน้า3แล้วcaptureหน้า3, doubletapขณะbusyเรียกshareครั้งเดียว, cancelไม่แสดงfailure, exporterrorมีข้อความลองใหม่
- [ ] รัน `npm test -- --runInBand __tests__/RecordStoryScreen.test.tsx` ให้failก่อนแก้shareflow
- [x] ให้refชี้canvasแต่ละหน้าที่mountจริง `collapsable={false}`; ทุกimageที่ใช้ในหน้านั้นต้องโหลดสำเร็จหรือเข้าสู่fallbackก่อนenableShare ไม่จับภาพviewที่opacity0/ไม่มีlayout
- [x] ล็อกPNG1080×1920จากcaptureRef ไม่รวมปุ่ม/progressbar/statusbar และตรวจขนาดไฟล์ที่ส่งออกจริงหลังcapture ไม่ถือว่าใส่optionsแล้วผ่านอัตโนมัติ
- [x] ใช้busylockกันกดซ้ำทั้งexport/share; เก็บpage indexตอนกด ไม่ให้ปัดระหว่างรอแล้วแชร์ผิดหน้า
- [x] ส่งimage/png+fileURIผ่านnativeShare.open; ทดสอบtargetแอปที่ติดตั้งจริง การยกเลิกเป็นneutralไม่ใช่error/สำเร็จเท็จ และแชร์errorมีปุ่มretryโดยไม่ต้องจบกิจกรรมใหม่
- [x] จำกัดการcleanupเฉพาะไฟล์PNGชั่วคราวที่Storyสร้าง ไม่ลบภาพต้นฉบับของกิจกรรม; ห้ามลบexportfileก่อนแอปผู้รับอ่านเสร็จ ถ้ายังไม่มีfileAPIใช้platformtemporarycacheก่อน ไม่เพิ่มlibraryเพื่อล้างไฟล์ทันที
- [x] accessiblelabelsสำหรับแชร์/หน้า1–4/ปิด/กลับHome และdisabledstateชัดเจน
- [x] `onClose`คงความหมายปิด Story; เพิ่ม `onHome?: () => void` แยกจาก `onClose` และให้ A wire ไป Main/Home จริง; ปุ่ม Back to Home ต้องกลับหน้า Home ไม่เพียง goBack ไป Summary

โค้ดเริ่มต้นของcapture (ต้องประกอบกับreadiness/busy/errorที่testกำหนด ไม่เรียกก่อนimageพร้อม):

```ts
const uri = await captureRef(canvasRef, {
  format: 'png', quality: 1, width: 1080, height: 1920, result: 'tmpfile',
});
await Share.open({
  url: uri, type: 'image/png', title: 'Ca-Walk Story', failOnCancel: false,
});
```

### Task B5 — รวมกับAและตรวจภาพส่งออก

**Files:** ไฟล์Story/testsของBเท่านั้น; Aแก้`App.tsx`/navigationเอง

**Consumes:** Aส่งcompletedsummaryจากกิจกรรมจริง, catregistry/fontพร้อมbundle

**Produces:** สี่หน้าในแอปและPNGที่ตรงกับpreviewในส่วนartwork

- [x] ส่งAรายการpropsที่ต้องwire: `summary`, `onClose`, `onHome?`; ปิดการfallbackphotoUriเก่าและตรวจว่าไม่มีlastPhotoUriหลุดเข้าB
- [ ] ทดสอบwalk/run, manual/arrived, มีรูป/ไม่มีรูป, pauseก่อนจบ และเปิดStoryซ้ำสถิติไม่เปลี่ยน
- [x] ถ่ายscreenpreviewและexportPNGทุกหน้า เทียบRef_Highlight1/2/3/LastPageครบ ตรวจฟอนต์รูปทรงใกล้แบบ, แมวคม, cropไม่ตัดข้อความ, ปุ่มไม่ติดในPNG
- [x] เปิดไฟล์ที่แชร์ผ่านแอปผู้รับอย่างน้อยหนึ่งแอปจริง ไม่สรุปว่าผ่านเพียงShare.openไม่throw
- [x] ตรวจภาพกิจกรรมAไม่ปรากฏในBเมื่อBไม่มีภาพ; ปิดshareแล้วยังปัดStoryต่อได้
- [x] รันfulltests/typecheck/lintและAndroidbuildหลังรวมกับA รายงานเฉพาะผลที่เกิดจริง ไม่มีผลบนโทรศัพท์ให้ระบุว่ายังไม่ตรวจอุปกรณ์

## 8. เกณฑ์รับงาน

| เรื่อง | ผ่านเมื่อ |
| --- | --- |
| หน้าตา | สี่หน้าใช้compositionจากreferenceใหม่ ไม่เหลือlayoutQuestCompletedเก่าเป็นหลัก |
| แมว | เป็นภาพจากPhotoใหม่ตามท่าที่ระบุ ไม่อ้างชื่อไฟล์เก่าหรือใช้blur; การใช้pixelartต่างจากrefเป็นการทำตามคำสั่งล่าสุด |
| Text | หัวข้อ/caption/ตัวเลขเป็นโค้ด ใช้fontจริงที่bundle; ไม่มีข้อความจากscreenshotทั้งรูป |
| สถิติ | 5กม./30นาทีแสดง6:00/km; steps/sport/เวลา/ชื่อร้านจากsnapshotเดียวกับSummary |
| ไม่มีข้อมูล | ไม่มีรูป/ไม่มีGPS/ไม่มีจุดหมาย/ไม่มีประวัติก็ยังมี4หน้า ไม่เติม2.4x/สวน/เวลา/ภาพของกิจกรรมก่อน |
| ความหมายสถานที่ | เลือกร้านแต่ยังไม่ถึงไม่บอกว่าถึง; เวลาแสดงเป็นเวลาจบกิจกรรมไม่อ้างเป็นเวลาถ่าย |
| Export | PNG1080×1920, artworkครบ, ไม่มีปุ่มหรือstatusbar, ไม่blankก่อนรูปโหลด |
| Share | แชร์หน้าที่เลือก, กดซ้ำไม่ได้, cancelไม่เป็นerror, export/shareerrorลองใหม่ได้ |
| กลับHome | ปุ่มBack to HomeกลับHomeจริงผ่านcallbackจากA และไม่ทำendRunSessionซ้ำ |
| การแบ่งงาน | มีข้อยกเว้น integration bridge ในข้อ 10; contractชื่อและหน่วยตรงแผน แต่ไม่ถือว่างานเต็ม A เสร็จ |

คำสั่งตรวจตอนลงมือพัฒนา:

```powershell
npm test -- --runInBand __tests__/storyModel.test.ts __tests__/RecordStoryScreen.test.tsx
npx tsc --noEmit
npm run lint
# หลังรวมกับ A
npm test -- --runInBand
Push-Location android
.\gradlew.bat assembleDebug
Pop-Location
```

## 9. Definition of Done ของแผน B

- [x] แก้catregistryและรวม bridge ใน branch เดียวก่อนเปิด build จริง (ไม่มี worker A แยกในรอบนี้)
- [x] ทั้งสี่หน้าผ่านvisualreviewเทียบreferenceครบ รวมno-photo
- [x] หน้าตาใกล้ภาพอ้างอิง แต่ใช้Photo catsใหม่ตามคำสั่งล่าสุด
- [x] Text/fontเป็นโค้ดและbundleจริง ไม่มีภาพreferenceเต็มหน้าเป็นruntimeasset
- [x] stats/เวลา/ภาพไม่ข้ามsessionและไม่มีตัวเลขเปรียบเทียบที่ไม่มีข้อมูล
- [x] PNGตรง9:16และแชร์เปิดในแอปผู้รับได้จริง
- [x] wire navigation manual/arrived ผ่าน integration bridge และ unit tests; native ตรวจ manual เท่านั้น
- [x] บันทึกผลทดสอบอุปกรณ์และข้อจำกัด ไม่อ้างว่าทดสอบAndroid/Instagramแล้วถ้ายังไม่ได้ลอง

**แหล่งฟอนต์ที่ตรวจlicense:** [Caveat / SIL Open Font License 1.1](https://github.com/google/fonts/blob/main/ofl/caveat/OFL.txt) — เก็บlicenseไปกับฟอนต์ที่bundleด้วย

**ข้อจำกัดที่ตกลงในMVP:** ภาพกล้องเดิมเป็นtemporaryfile รับประกันการอ่าน/แชร์ในflowกิจกรรมปัจจุบันและมีfallbackเมื่อหาย ไม่อ้างว่าเก็บรูปถาวรหลังkillแอป; การเก็บภาพย้อนหลังหรือcloudsyncเป็นงานแยกจากสองแผนนี้

## 10. ผลลงมือและหลักฐาน — 2026-10-30

### สิ่งที่ส่ง

- Story 4 หน้าเป็น native Text/View/SVG บน canvas 1080×1920 แยกจากปุ่ม; ภาพเฉพาะ completed session, ไม่มี stock/รูปข้าม session
- Cat registry ใช้ชื่อไฟล์ใหม่จริง; crop ด้วย viewport จาก alpha bounds โดยไม่แก้ต้นฉบับ ใช้ Caveat Regular ที่ bundle พร้อม OFL
- Snapshot เวลา/สถิติคงที่, pace 5 km / 1,800 s = 6:00 /km, GPS ที่ไม่มีก็ไม่ใช้ระยะประมาณก้าวแทน
- Share รอ layout+images, capture เฉพาะหน้าที่เลือก ตรวจขนาด PNG ก่อนเปิด native sheet, กันกดซ้ำ/ปัดระหว่างแชร์, ยกเลิกไม่เป็น error, ลองใหม่ได้
- Back to Home reset ไป Main/Home จริง; close กลับ Summary; ไม่จบกิจกรรมซ้ำ
- Native visual review พบ text auto-width ตัด “Not bad!” และ no-photo caption หลังเปลี่ยน session จึงกำหนดความกว้างข้อความแล้วตรวจซ้ำ; เพิ่ม SVG shade สำหรับภาพสว่าง และแก้ drag ที่ไม่มี momentum ไม่ให้ปุ่มแชร์ค้าง disabled (มี RED/GREEN regression test)

### ข้อยกเว้นขอบเขต A/B

ใน checkout นี้ยังไม่มี completed contract/pace/navigation จาก developer A จึงเพิ่ม bridge ขั้นต่ำเพื่อให้ใช้งาน Story ได้จริง โดยไม่ทำ map/search plan ทั้งฉบับ:

- `src/types/activity.ts`, `src/services/locationUtils.ts`: shared RunSummary และ formatPaceSeconds ตามสัญญา ไม่สร้าง competing type
- `src/services/completedActivity.ts`: สร้าง snapshot จาก session ที่จบ, clone photos/coordinates, แยก manual/arrived; arrived ต้องมี accepted fix อายุไม่เกิน 15 s, accuracy ≤25 m, ระยะจาก destination ≤25 m และไม่ติด speed-fraud flag
- `src/context/AppContext.tsx`, `src/services/mockData.ts`: เก็บ GPS-only total แยกจาก distance เดิม, fixed completion timestamps และ cloned arrays
- `src/screens/RecordScreen.tsx`, `RecordSummaryScreen.tsx`, `App.tsx`: producer/summary/navigation integration; ลบ lastPhotoUri และ prop เก่าเพื่อกันภาพข้ามกิจกรรม
- `src/screens/ProfileEditScreen.tsx`: เปลี่ยน require ชื่อแมวเก่าที่ไม่มีไฟล์ให้ใช้ registry ร่วม เพื่อให้ Metro เปิดแอปได้

ระบบสะสมระยะ wallet/history และ live tracking ยังใช้ fused-distance/acceptance algorithm เดิม ไม่อ้างว่าปรับ tracking/search/route stability ครบแผน A; Story และ Summary ใช้ GPS-only snapshot ที่เพิ่มแยกไว้

### ผลตรวจล่าสุด

| การตรวจ | ผลจริง |
| --- | --- |
| `npm test -- --runInBand` | 11 suites / 70 tests ผ่านทั้งหมด |
| `npx tsc --noEmit` | ผ่าน exit 0 |
| `npm run lint` | exit 0, 0 errors; baseline warning 1 จุด `scripts/apply-android-patches.js:57` (`no-regex-spaces`) |
| `android/gradlew.bat assembleDebug` | BUILD SUCCESSFUL; รอบสุดท้าย 1m 2s / 614 tasks |
| Local static asset requires | scan ไม่พบ path ที่หาย และ Metro bundle เปิดแอปจริงได้ |
| Native manual activity | start → camera photo → pause → finish → Summary → Story ผ่านบน emulator; close กลับ Summary เวลาเดิม; Back to Home กลับ Home จริง |
| Native export | ดึง PNG จริงจาก app cache ครบ 4 หน้า; ทุกไฟล์ 1080×1920, ไม่มี share/close/progress/status bar ติดใน artwork |
| Native receiver | Android Print Spooler รับ shared PNG และแสดงภาพได้จริง; ไม่ได้สั่งพิมพ์หรือโพสต์ไป social |
| Native cancellation | ยกเลิก sheet แล้วเลือก/แชร์หน้าถัดไปได้ ไม่ขึ้น error |
| Final production smoke | Android 17 / API 37 emulator: จบกิจกรรมใหม่โดยไม่เปิดกล้องหลังทดสอบกิจกรรมที่มีภาพ → Story ไม่มีภาพเก่าหน้า 1/3 → export PNG 1080×1920 → ยกเลิก native share → ปัดจริงไปหน้า 2 และปุ่มแชร์กลับมา enabled, ไม่ขึ้น error → กลับ Home ผ่าน |
| Native edge cases | temporary test-only harness: no-photo 4 หน้า, run 4,200 steps / 5 km / 30:00 / 6:00, 1,234,567 steps, long Thai 2 lines, manual/arrived captions, bright/dark session-camera photo |
| Small screen / accessibility | emulator resize 840×1600 + font_scale 1.5: หน้า 2–3 ชื่อไทยยาว และ no-photo หน้า 1/4; PNG ยัง 1080×1920, ปุ่มไม่ทับ artwork |

Native harness, generated stress-test photos และ temporary entry import ถูกลบ/คืนแล้ว; `index.js` เป็น production entry เดิม และคืน emulator size/font scale แล้ว ไม่ส่ง fixture เป็น runtime fallback

ไฟล์หลักฐานอยู่ที่ `C:/Users/USER/.codex/visualizations/2026/10/29/01a18890-fd8d-7750-8793-a025678870e5/`:
- `story-preview-1.png` … `story-preview-4.png`: preview จาก completed activity จริงใน emulator
- `story-export-1.png` … `story-export-4.png`: export จริงก่อนปรับ shade ครั้งสุดท้าย
- `native-*.png`: native edge-case exports/preview; Bright/Dark หน้า 1/3 ตรวจซ้ำหลังปรับ shade แล้ว
- `story-android-print-receiver.png`: หลักฐานแอปผู้รับเปิดภาพได้
- `story-small-screen-contact.png`: จอเล็ก+font scale 150%
- `story-final-no-photo-1-preview.png`, `story-final-no-photo-1-export.png`, `story-final-no-photo-3-preview.png`, `story-final-no-photo-share.png`, `story-final-after-cancel-swipe.png`: รอบสุดท้ายผ่าน production entry หลังคืน harness แล้ว

### สิ่งที่ยังไม่รับรอง

- ยังไม่ทดสอบเดิน/วิ่งและ arrived finish ด้วย GPS บนอุปกรณ์จริง; arrival guard/navigation มี unit tests และ arrived caption มี native fixture coverage เท่านั้น
- ไม่ทดสอบ iOS, release-signed APK, Instagram หรือแอป social อื่น; receiver ที่ตรวจคือ Android Print Spooler
- ไม่ทำ full map/search/stability plan A และไม่แก้ wallet/history fused-distance เดิม
- รูปกล้องและไฟล์ export เป็น platform temporary cache ตาม MVP; ไม่รับประกันการอ่านรูปย้อนหลังหลังระบบล้าง cache/kill app
- ช่อง RED-before-original-implementation ที่ยังว่างเป็นประวัติกระบวนการที่ไม่ยืนยันจาก log รอบสุดท้าย ไม่ใช่ tests ที่ยังไม่ผ่าน; รอบสุดท้ายทุก test ผ่าน
- ไม่มี developer A แยกสำหรับส่ง cat-registry commit; ยังไม่ commit/merge/push branch และไม่รวม asset/reference ที่ผู้ใช้แก้ค้างไว้
- Metro เดิม port 8081 เกิด stale DependencyGraph error จึงใช้ Metro แยก port 8082 พร้อม reset-cache และตั้ง emulator debug host เป็น 10.0.2.2:8082 โดยไม่ kill process เดิม
