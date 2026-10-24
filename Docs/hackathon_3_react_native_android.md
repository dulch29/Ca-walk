# แผนแม่บทพัฒนาโปรเจกต์ Hackathon 3 วัน (Master Plan)
**ชื่อโปรเจกต์:** Ca-Walk (Cat Walk-to-Discover & Sweat-for-Perks Companion)
**โจทย์การแข่งขัน:** Make Me Money (สร้างรายได้จริง + โบนัสธุรกิจการท่องเที่ยว)
**สถาปัตยกรรมหลัก:** Bare React Native CLI (Android Only) + Firebase Spark Plan (ใช้ Firestore/Auth; ไม่ใช้ Storage หรือ App Hosting)
**ยืนยันแพลตฟอร์ม:** เป้าหมายคือแอปมือถือ Android ที่พัฒนาด้วย React Native ไม่ใช่ Web App; หากสรุปแนวคิดฉบับเดิมระบุ Web App ให้ยึดข้อกำหนดนี้เป็นเป้าหมายการพัฒนาปัจจุบัน
**ไฟล์แมวที่มีอยู่แล้ว:** `../Assests/Cat/Animation/` (GIF) และ `../Assests/Cat/Photo/` (PNG เฟรมเดี่ยว)
**เอกสารคู่ขนาน (ต้องใช้คู่กัน):** `android-build-guide.md` (คู่มือตั้งค่าสภาพแวดล้อมและแก้ปัญหาการ Build Android)
**ขนาดทีม:** นักพัฒนา (Dev) 2–3 คน + นักออกแบบ (UX/UI) 1 คน

---

## 1. Baseline สภาพแวดล้อม Android (ยืนยันกับโปรเจกต์หลัง scaffold)

> 📌 **คำแนะนำสำคัญ:** ค่าตารางนี้เป็น baseline อ้างอิงจาก CatiX เท่านั้น ไม่ใช่ Source of Truth ของ Ca-walk ก่อนเริ่ม feature ให้ scaffold โปรเจกต์ Ca-walk แล้วตรวจ `package.json` และไฟล์ `android/`; ยึดเวอร์ชันที่ template สร้างและตรวจ compatibility ก่อนล็อก (ดู `android-build-guide.md` หัวข้อ 1–3)

### 1.1 เวอร์ชันตั้งต้นสำหรับ scaffold (ตรวจซ้ำหลังสร้างโปรเจกต์)

ตารางนี้เป็น baseline ที่อ้างจาก CatiX ไม่ใช่ผล build ของ Ca-walk เพราะ Ca-walk
ยังไม่มี `package.json` และโฟลเดอร์ `android/` หลังสร้างโปรเจกต์แล้วให้ตรวจเวอร์ชัน
จากไฟล์จริงของ Ca-walk และยึด Gradle wrapper/AGP ที่ React Native CLI สร้างมาเป็นหลัก
อย่าคัดลอกไฟล์ Android ของ CatiX ทั้งชุดหรือฝืนล็อกเวอร์ชันถ้าขัดกับ template ที่สร้างใหม่

| รายการ | ตัวอย่าง baseline จาก CatiX | ต้องยืนยันจาก Ca-walk หลัง scaffold |
| :--- | :--- | :--- |
| **React Native** | `0.81.4` | ตรวจเวอร์ชันใน `package.json` ของ Ca-walk |
| **React Native CLI** | `20.0.0` | ตรวจเวอร์ชันใน `package.json` ของ Ca-walk |
| **Node.js** | `>=20` (CatiX ใช้ `v24.14.0`) | ตรวจข้อกำหนด engine และ `node --version` |
| **Java / JDK** | `17` (Bytecode `17`) | ตรวจ AGP และ Java/Kotlin target ในโปรเจกต์จริง |
| **Android Gradle Plugin (AGP)** | `8.11.0` | ตรวจ Gradle configuration ของ Ca-walk |
| **Gradle Wrapper** | `8.14.3` | ตรวจ `android/gradle/wrapper/gradle-wrapper.properties` |
| **Kotlin Gradle Plugin** | `2.1.20` | ตรวจ `android/build.gradle` หรือ `.kts` |
| **`compileSdk` / `targetSdk`** | `36` | ติดตั้ง Platform ตาม `compileSdk` ของ Ca-walk |
| **`minSdk`** | `24` | ตรวจ `defaultConfig` และ requirements ของ libraries |
| **Android Build Tools** | `36.0.0` | ติดตั้ง version ที่ Gradle ของ Ca-walk ขอ |
| **Android NDK** | `27.1.12297006` | ติดตั้ง version ที่ native dependencies ขอ |
| **JS Engine & Architecture** | `Hermes` + เปิด `New Architecture` | ตรวจค่าที่ scaffold และ native packages รองรับ |

### 1.2 คำสั่งเตรียมเครื่อง Windows & ติดตั้ง SDK ให้ครบตั้งแต่ต้น (อ้างอิง `android-build-guide.md` ข้อ 2–3)
หลัง scaffold แล้ว ให้ปรับเวอร์ชันในคำสั่งให้ตรงกับ `android/build.gradle` ของ Ca-walk ก่อนรันใน PowerShell เพื่อติดตั้ง SDK และสร้าง `android/local.properties` (ห้าม commit ไฟล์นี้):

```powershell
# 1. ติดตั้งแพ็กเกจ SDK ที่จำเป็นผ่าน sdkmanager
$sdkmanager = "$env:ANDROID_HOME\cmdline-tools\latest\bin\sdkmanager.bat"
& $sdkmanager --licenses
& $sdkmanager "platform-tools" "platforms;android-36" "build-tools;36.0.0" "ndk;27.1.12297006"

# 2. สร้างไฟล์ android/local.properties อัตโนมัติ (สำหรับ Windows)
$sdk = ($env:LOCALAPPDATA + "\Android\Sdk").Replace("\", "\\")
"sdk.dir=$sdk" | Set-Content -Encoding ascii android\local.properties

# 3. ตรวจสอบว่า SDK ทุกตัวพร้อมใช้งาน (ผลลัพธ์ต้องเป็น True ทั้งหมด)
Test-Path "$env:ANDROID_HOME\platforms\android-36"
Test-Path "$env:ANDROID_HOME\build-tools\36.0.0"
Test-Path "$env:ANDROID_HOME\ndk\27.1.12297006"
```
*(หมายเหตุ: เนื่องจากโปรเจกต์มีการใช้ไลบรารีระดับ Native เช่น `react-native-vision-camera` และ `@maplibre/maplibre-react-native` หากระหว่าง Build ระบบแจ้งเตือนหา **CMake** ไม่พบ ให้ดูเลขเวอร์ชันที่ Error ระบุแล้วกดติดตั้งผ่าน Android Studio SDK Manager ทันที — อ้างอิง `android-build-guide.md` **ข้อ 1 และ ข้อ 5**)*

---

## 2. กฎเหล็กทางเทคนิคและจุดชี้เป็นชี้ตายบน Android (Critical Setup)

เนื่องจากเราใช้ **Bare React Native CLI (`@react-native-community/cli`)** บนระบบ **Android** โดยไม่พึ่งพา Expo เลย มีจุดตั้งค่าระดับ Native 4 จุดที่ต้องทำตั้งแต่วันแรกเพื่อไม่ให้ติดบั๊กหน้างาน:

### 2.1 ป้องกันบั๊กปี พ.ศ. เมื่อพบ error ที่เกี่ยวข้อง
> 📌 บนเครื่องที่ใช้ Thai locale เคยพบ `com.google.common.base.VerifyException` ที่ `mergeDebugJavaResource` / `MsDosDateTimeUtils.packDate` จากปี พ.ศ. ที่เกินช่วงของ ZIP metadata (ดู `android-build-guide.md` ข้อ 5 และ 7.2) ให้ใช้การตั้งค่านี้เมื่อพบอาการดังกล่าว ไม่ต้องคัดลอก Gradle config ของ CatiX ทั้งไฟล์

**วิธีแก้:** เพิ่มพารามิเตอร์บังคับ Locale เป็นภาษาอังกฤษ (`-Duser.language=en -Duser.country=US`) ใน `org.gradle.jvmargs` ของ `android/gradle.properties`:
```properties
org.gradle.jvmargs=-Xmx2048m -XX:MaxMetaspaceSize=512m -Duser.language=en -Duser.country=US
```

### 2.2 Firebase บน Spark โดยไม่ใช้ Storage

เลือก **Production mode** ตอนสร้าง Firestore database แล้วตั้ง Security Rules ให้ตรงกับ
Firebase Authentication ก่อนให้แอปอ่าน/เขียนข้อมูล โหมดนี้ปิดการเข้าถึงไว้โดยปริยาย
จึงต้อง deploy rules ที่อนุญาตเฉพาะผู้ใช้ที่ล็อกอินและข้อมูลของตนเอง; อย่าเปิด
`allow read, write: if true` และอย่าใช้ Test mode เป็นวิธีแก้ permission error.

สำหรับ Hackathon นี้เริ่มด้วย Firebase Spark ซึ่งมี free quota ตามข้อกำหนดของ Firebase
(ไม่ใช่การรับประกันว่าใช้งานทุกปริมาณได้ฟรี) และใช้ Firestore เก็บข้อมูลข้อความและสถานะ เช่น โปรไฟล์, จำนวนก้าว,
พิกัดร้าน, คูปอง และสถานะแลกสิทธิ์ **ไม่ติดตั้ง Firebase Storage และไม่ใช้ Firebase App
Hosting** ใช้ไฟล์แมวที่มีอยู่ใน `Assests/Cat/` ตามรายการในหัวข้อ 2.4 และ bundle เข้ากับแอป;
อย่าย้ายหรือเปลี่ยนชื่อไฟล์โดยไม่จำเป็น
ส่วนรูปที่ผู้ใช้ถ่ายเก็บเป็น local file ในมือถือและเปิด share sheet เมื่อผู้ใช้ต้องการแชร์
ไม่อัปโหลดรูปเข้า Firebase และไม่เก็บรูปเป็น Base64 ใน Firestore ข้อแลกเปลี่ยนคือรูปที่ถ่าย
จะไม่ sync หรือ restore ไปเครื่องอื่น

Firebase App Hosting ใช้ host เว็บแอปและต้องใช้แผน Blaze; แอป React Native ไม่ต้องใช้
App Hosting เพื่อเชื่อม Auth หรือ Firestore โดยตรงจาก Firebase SDK

### 2.3 การป้องกันบั๊ก `DEVELOPER_ERROR (Code 10)` ตอนทำ Google Login
1. รันคำสั่งดึงค่า `SHA-1` ของเครื่องที่ใช้ Build:
   ```powershell
   cd android
   .\gradlew.bat signingReport
   ```
2. คัดลอกค่า `SHA1` จากส่วน `Variant: debug` (และ `release` สำหรับวันจริง) ไปใส่ในหน้า **Project Settings > Your apps (Android)** บน Firebase Console
3. ดาวน์โหลดไฟล์ `google-services.json` ตัวใหม่ล่าสุดมาวางไว้ที่ `android/app/google-services.json`
4. ตั้งค่า Google Services Gradle plugin และ native Firebase config ตามคู่มือ `@react-native-firebase` ด้วย การวาง `google-services.json` อย่างเดียวไม่พอสำหรับเปิดใช้ native Firebase
5. ในโค้ด JavaScript ตอนตั้งค่า `GoogleSignin.configure({ webClientId: '...' })` **ต้องใช้ค่า Web Client ID (Type 3)** จากไฟล์ `google-services.json` เท่านั้น (ห้ามใช้ Android Client ID เด็ดขาด)

### 2.4 แอนิเมชันแมวกับภาพนิ่งในภาพถ่าย

แอนิเมชันแมวในหน้าจอแอปยังใช้ GIF ได้ โดยไฟล์ที่มีอยู่จริงใน `Assests/Cat/Animation/` คือ `IDLE.gif`, `IDLE_SITE.gif`, `jump.gif`, `Sleep.gif`, `touch.gif` และ `Walk.gif` (ตัวพิมพ์เล็ก/ใหญ่ตามนี้) สำหรับ React Native `0.81.4` baseline ของ
CatiX ใช้ Fresco `3.6.0`; ให้ตรวจ version catalog/dependency ของ React Native ที่
Ca-walk scaffold จริงก่อนเพิ่ม dependency และใช้ version ให้ตรงกัน:

```groovy
dependencies {
    implementation("com.facebook.fresco:animated-gif:3.6.0")
}
```

ภาพถ่ายหรือภาพที่บันทึก/แชร์ต้องใช้ PNG เฟรมเดี่ยว ไม่ใช้ GIF และไม่ capture เฟรมจาก GIF
ไฟล์ PNG ที่เตรียมไว้ใน `Assests/Cat/Photo/` มีขนาด `32×32` พิกเซล แบบ RGBA แยกเป็น
ชุดตามชื่อท่าดังนี้:

| ชื่อชุด PNG | ไฟล์ที่มี | ใช้เป็นตัวอย่างท่า |
| :--- | :--- | :--- |
| `ide` | `ide (1).png`–`ide (4).png` | idle (สะกด `ide` ตามชื่อไฟล์จริง) |
| `ide_site` | `ide_site (1).png`–`ide_site (4).png` | idle/site |
| `walk` | `walk (1).png`–`walk (8).png` | เดิน |
| `jump` | `jump (1).png`–`jump (7).png` | กระโดด |
| `sleep` | `sleep (1).png`–`sleep (4).png` | นอน |
| `touch` | `touch (1).png`–`touch (6).png` | ถูกแตะ/ลูบ |
| `clean` | `clean (1).png`–`clean (4).png` | ทำความสะอาด |
| `lick` | `lick (1).png`–`lick (4).png` | เลีย |
| `run` | `run (1).png`–`run (8).png` | วิ่ง |
| `threaten` | `threaten (1).png`–`threaten (8).png` | ท่าขู่ |

สำหรับรูปนิ่งให้เลือก PNG **ไฟล์เดียว** จากชุดท่าที่ตรงกับสถานะ แล้ววางซ้อนบนรูปถ่าย
หรือ composition ที่บันทึกไว้ PNG เหล่านี้เป็นภาพพิกเซลขนาดเล็ก ให้คงลักษณะ pixel art
ตอนขยายภาพ ห้ามใช้ชื่อสมมติอย่าง `happy.png`, `tired.png` หรือ `gift.png` เพราะไม่มีอยู่
ในโฟลเดอร์ปัจจุบัน; หากต้องเพิ่มท่าใหม่ ให้สร้าง/ยืนยัน asset ก่อนแล้วบันทึกชื่อจริงไว้ในเอกสาร

ใน React Native ให้ bundle asset ด้วย static `require(...)` ที่ระบุ path และชื่อไฟล์ตรงตามจริง
สำหรับแต่ละรายการ (รวมช่องว่าง วงเล็บ และตัวพิมพ์เล็ก/ใหญ่) อย่าสร้าง path แบบ dynamic จาก
ชื่อท่า เพราะ Metro ต้องมองเห็น asset ตอน bundle; ยังไม่ต้องย้าย asset ออกจาก `Assests/Cat/`
จนกว่าโครงสร้างแอปจริงจะถูก scaffold และมีการอัปเดต path ให้ตรงกัน

อย่าพึ่งพา `ViewShot` ครอบ `<Camera />` เพื่อจับ camera preview เพราะไม่รับประกันว่าจะ
capture ได้บนทุกอุปกรณ์/ชนิด preview วิธีที่ตั้งใจคือ capture ภาพนิ่งจากกล้องเป็น local
file ก่อน จากนั้น render ภาพนั้นเป็นพื้นหลังพร้อม PNG แมว/ข้อความใน React Native view
แล้วใช้ `ViewShot` จับเฉพาะ composition ที่ render เสร็จ บันทึก/แชร์ผลลัพธ์เป็น local file

---

## 3. รายการ Libraries ที่ใช้ & คำสั่ง Build มาตรฐาน (เริ่มต้นบน Spark)

### 3.1 การติดตั้ง Packages
รันคำสั่งติดตั้งชุดแพ็กเกจมาตรฐานที่รองรับ Bare React Native บน Android:

```bash
# 1. ระบบ Navigation สำหรับเปลี่ยนหน้าและสลับโหมด User / Merchant
npm install @react-navigation/native @react-navigation/native-stack @react-navigation/bottom-tabs
npm install react-native-screens react-native-safe-area-context

# 2. ระบบหลังบ้าน Firebase (Auth, Google Login, Firestore)
npm install @react-native-firebase/app @react-native-firebase/auth @react-native-firebase/firestore
npm install @react-native-google-signin/google-signin

# 3. ระบบแผนที่ฟรี (MapLibre + OpenStreetMap) และพิกัด GPS
npm install @maplibre/maplibre-react-native
npm install react-native-geolocation-service

# 4. เซนเซอร์นับก้าวในเครื่องและระบบสั่นตอนลูบแมว
npm install react-native-sensors
npm install react-native-haptic-feedback

# 5. กล้องถ่ายรูป, การซ้อนภาพนิ่งแมวในภาพถ่าย, การแชร์ลง IG และการสร้าง QR Code
npm install react-native-vision-camera
npm install react-native-view-shot
npm install react-native-share
npm install react-native-qrcode-svg react-native-svg
```
> 📌 **หมายเหตุสำหรับเพื่อนร่วมทีมที่ Clone โปรเจกต์ไปทำต่อ (อ้างอิง `android-build-guide.md` ข้อ 4):** ให้รันคำสั่ง `npm ci` จาก Root ของโปรเจกต์เสมอเพื่อให้ติดตั้ง Dependency ตรงตาม `package-lock.json` และให้ `patch-package` ทำงานครบถ้วน

### 3.2 คำสั่ง Build สำหรับพัฒนาและสำหรับขึ้นเวที (อ้างอิง `android-build-guide.md` ข้อ 4)

| สถานการณ์ใช้งาน | คำสั่งที่ต้องใช้ (PowerShell) | เหตุผล / ข้อดี |
| :--- | :--- | :--- |
| **เช็กอุปกรณ์มือถือที่เสียบสาย USB** | `npm run android -- --list-devices` | ตรวจว่า `adb` มองเห็นมือถือและเปิด USB Debugging แล้ว |
| **Build ทดสอบระหว่างวัน (เร็วพิเศษ)** | `cd android`<br>`.\gradlew.bat :app:assembleDebug -PreactNativeArchitectures=arm64-v8a --console=plain` | คอมไพล์เฉพาะสถาปัตยกรรม `arm64-v8a` ของมือถือจริง ช่วยลดเวลา Build ลงได้มากกว่าครึ่ง |
| **Build ขึ้นเวทีวันสุดท้าย (Release APK)** | `cd android`<br>`.\gradlew.bat :app:assembleRelease --console=plain` | ฝัง JS Bundle และ assets ใน APK; **ไม่ต้องเปิด Metro Server ตอนขึ้นเวที** |

### 3.3 สิทธิ์ที่ต้องประกาศใน `android/app/src/main/AndroidManifest.xml`
```xml
<uses-permission android:name="android.permission.INTERNET" />
<uses-permission android:name="android.permission.ACCESS_FINE_LOCATION" />
<uses-permission android:name="android.permission.ACCESS_COARSE_LOCATION" />
<uses-permission android:name="android.permission.ACTIVITY_RECOGNITION" />
<uses-permission android:name="android.permission.CAMERA" />
<uses-permission android:name="android.permission.VIBRATE" />
```

---

## 4. โครงสร้างโฟลเดอร์ (ออกแบบให้ทีม 2–3 คนทำพร้อมกันไม่เกิด Git Conflict)

แยกโฟลเดอร์ตามหน้าที่ชัดเจนเพื่อให้แต่ละคนแก้ไขไฟล์ของตัวเองได้โดยไม่ชนกัน:

```text
Assests/
└── Cat/
    ├── Animation/             # GIF แอนิเมชันแมวที่มีอยู่แล้ว
    └── Photo/                 # PNG เฟรมเดี่ยว 32×32 สำหรับภาพนิ่ง/ภาพถ่าย
src/
├── assets/
│   └── accessories/           # อาจเพิ่มภาพ PNG หมวก/ผ้าพันคอพื้นหลังใสสำหรับซ้อนทับตัวแมว
├── components/
│   ├── CatAvatar.tsx          # คอมโพเนนต์แสดง GIF แมวตามสถานะ + รับการจิ้ม/ลูบหัว + กล่องข้อความ
│   ├── DemoControlPanel.tsx   # แผงปุ่มลับสำหรับกดเพิ่มระยะทาง/จำลองเข้าหน้าร้านตอนขึ้นเวที
│   └── FilterTags.tsx         # ปุ่มเลือกสเปกร้าน (มีไวไฟ, ราคาประหยัด, ร้านลับ)
├── context/
│   └── AppContext.tsx         # เก็บ State กลาง (ก้าวเดิน, ระยะทาง, โหมด User/Merchant, สถานะกันโกง)
├── screens/
│   ├── LoginScreen.tsx        # หน้าเข้าสู่ระบบด้วย Google Sign-In
│   ├── HomeCatScreen.tsx      # หน้าเลี้ยงแมว + เลือกโหมดภารกิจ (เดินชิล / สะสมระยะ) + ตู้เสื้อผ้าแมว
│   ├── MapQuestScreen.tsx     # หน้าแผนที่นำทาง OSM + นับก้าว/เพซ + ปุ่มกด Demo Trigger
│   ├── CatCameraScreen.tsx    # หน้ากล้องถ่ายรูปซ้อนรูปแมวแบบ static + แชร์ลง IG Story
│   ├── CatPocketScreen.tsx    # หน้ากระเป๋าคูปอง (นับถอยหลัง 24-72 ชม.) + เปิด One-Time QR
│   └── MerchantScreen.tsx     # หน้า Dashboard ฝั่งร้านค้า (อยู่ในแอปเดียวกัน สลับโหมดได้ทันที)
├── services/
│   ├── firebase.ts            # ฟังก์ชันเชื่อมต่อ Auth และดึง/อัปเดต Firestore
│   └── locationUtils.ts       # ฟังก์ชันคำนวณระยะห่าง Geofence (Haversine) และคำนวณ Pace
└── App.tsx                    # ตัวจัดการ Navigation หลัก
```

---

## 5. โครงสร้างฐานข้อมูล Firebase Firestore (Database Schema)

ใช้โครงสร้าง Collection 3 ก้อนที่เรียบง่ายและอัปเดตแบบ Real-time ได้ทันที:

### 5.1 Collection: `users` (ข้อมูลผู้ใช้และสถิติ)
```json
{
  "uid": "google_uid_123",
  "displayName": "Nong Meow Explorer",
  "totalSteps": 6420,
  "weeklyDistanceKm": 4.8,
  "catPoints": 150,
  "equippedAccessory": "hat_explorer",
  "visitedMerchants": ["merchant_01", "merchant_02"],
  "preferredTags": ["wifi", "budget", "local_gem"]
}
```

### 5.2 Collection: `merchants` (ข้อมูลร้านค้าและแคมเปญในย่านท่องเที่ยว)
```json
{
  "merchantId": "merchant_01",
  "name": "Bantadthong Old Town Cafe",
  "district": "ย่านบรรทัดทอง - สามย่าน",
  "tags": ["wifi", "budget", "local_gem"],
  "storyTelling": "คาเฟ่ตึกแถวโบราณอายุ 80 ปี รีโนเวทใหม่ มีปลั๊กไฟทุกโต๊ะ",
  "lat": 13.7442,
  "lng": 100.5231,
  "questType": "casual_walk",
  "requiredDistanceKm": 0.5,
  "dealTitle": "ซื้อ 1 แถม 1 (ช่วง Off-peak 14:00-17:00) หรือ ฟรีท็อปปิ้ง",
  "subscriptionPlan": "1,000 บาท/เดือน (Fee 8 บาท/คูปอง)",
  "metrics": {
    "catWalkInCount": 142,
    "redeemedCount": 89,
    "newCustomerCount": 71
  }
}
```

### 5.3 Collection: `coupons` (กระเป๋าคูปอง Cat Pocket & One-Time QR)
```json
{
  "couponId": "cp_998877",
  "uid": "google_uid_123",
  "merchantId": "merchant_01",
  "merchantName": "Bantadthong Old Town Cafe",
  "dealTitle": "ฟรีท็อปปิ้ง หรือ ลด 20 บาทเมื่อซื้อครบ 80 บาท",
   "status": "unlocked",
  "unlockedAt": "2026-10-24T10:00:00Z",
  "expiresAt": "2026-10-27T10:00:00Z",
  "oneTimeToken": "QR_TOKEN_8899_XYZ"
}
```

---

## 6. เจาะลึกลอจิกสำคัญ & ระบบปุ่มลับสำหรับขึ้นเวที (Stage Demo Triggers)

เพื่อป้องกันความเสี่ยงตอนยืนพรีเซนต์อยู่กับที่บนเวที ให้สร้างคอมโพเนนต์ `<DemoControlPanel />` ซ่อนไว้ที่มุมบนของหน้าแผนที่ (เปิด/ปิดได้ด้วยการแตะที่ไอคอนอุ้งเท้าแมวมุมจอ) โดยมีปุ่มจำลองสถานการณ์ครบทุกฟีเจอร์:

### 6.1 ลอจิกปุ่มกดรัวเพิ่มระยะทางและก้าวเดิน (Rapid Tap Booster)
* **การทำงานปกติ:** อ่านค่าจากเซนเซอร์เครื่องและคำนวณระยะทางจริงจากพิกัด GPS โดยแปลงก้าวเดินเป็นระยะทางด้วยสมการ:
  $$\text{Distance (m)} = \text{Steps} \times 0.75$$
* **การทำงานตอนกดปุ่ม Demo บนเวที:** ทุกครั้งที่กดปุ่ม **`[+ เร่งฝีเท้าแมว]`** รัวๆ ระบบจะบวกค่าเพิ่มทันทีครั้งละ $+250\text{ ก้าว}$ (หรือ $+0.2\text{ กม.}$) พร้อมขยับตำแหน่งหมุดแมวบนแผนที่เข้าใกล้หมุดร้านค้าทีละขั้น เมื่อกดรัวๆ ครบระยะเป้าหมาย (เช่น $0.5\text{ กม.}$ หรือ $4.0\text{ กม.}$) ให้แสดง `Assests/Cat/Animation/jump.gif` เป็นแอนิเมชันตอบสนอง และใช้ `Assests/Cat/Photo/jump (1).png` เมื่อต้องทำภาพนิ่งสำหรับภาพถ่าย/การบันทึก

### 6.2 ลอจิกกันโกงความเร็ว (Cat Speed Warning)
* คำนวณความเร็วหรือเพซจากการเปลี่ยนแปลงระยะทางเทียบกับเวลา:
  $$\text{Speed (km/h)} = \frac{\Delta \text{Distance (km)}}{\Delta \text{Time (hours)}}$$
* หาก $\text{Speed} > 18\text{ km/h}$ (เร็วเกินคนวิ่งปกติ เช่น แอบขี่มอเตอร์ไซค์เปิดแอป) หรือเมื่อกดปุ่มจำลอง **`[จำลองขี่รถ (Speed Fraud)]`** บนเวที:
  1. ระบบจะหยุดบวกระยะทางทันที
  2. แสดงคำเตือนการโกงและใช้ `Assests/Cat/Animation/IDLE_SITE.gif` ระหว่างหยุดนับ; หากบันทึกภาพนิ่งให้เลือก `Assests/Cat/Photo/sleep (1).png` เป็นท่าที่ใกล้เคียงที่สุด ปัจจุบันยังไม่มี GIF ท่าเหนื่อยโดยเฉพาะ
  3. ขึ้นกล่องข้อความเตือนสีแดง: *"เหมียววิ่งตามรถไม่ทันแล้ว! ระบบหยุดนับระยะทางชั่วคราวเพื่อความยุติธรรมนะเหมียว"*

### 6.3 ลอจิกเช็กพิกัดหน้าร้าน 50 เมตร (Geofence Unlock)
* ใช้สูตร Haversine คำนวณระยะห่างระหว่างพิกัดผู้ใช้ $(\phi_1, \lambda_1)$ กับพิกัดร้านค้า $(\phi_2, \lambda_2)$:
  $$d = 2r \arcsin\left(\sqrt{\sin^2\left(\frac{\Delta\phi}{2}\right) + \cos(\phi_1)\cos(\phi_2)\sin^2\left(\frac{\Delta\lambda}{2}\right)}\right)$$
* ในหน้า **Cat Pocket (กระเป๋าคูปอง)** ปุ่ม **"สแกนรับสิทธิ์หน้าร้าน (Show One-Time QR)"** จะถูกล็อกเป็นสีเทาหาก $d > 50\text{ เมตร}$
* เมื่อกดปุ่มจำลอง **`[วาร์ปเข้าหน้าร้าน (<50m)]`** ระบบจะเซ็ตค่าพิกัดจำลองให้อยู่ห่างจากร้าน $12\text{ เมตร}$ ปุ่มเปิด QR Code จะปลดล็อกเป็นสีส้มสดใส กดแล้วแสดง QR Code ที่มีเวลานับถอยหลัง $300\text{ วินาที}$

### 6.4 ลอจิกสลับโหมดเป็นร้านค้าในแอปเดียว (In-App Merchant Mode)
* ที่หน้าโปรไฟล์หรือมุมขวาบนของแอป มีสวิตช์ **"สลับเป็นโหมดร้านค้า (B2B Merchant View)"**
* เมื่อกดสลับปุ๊บ หน้าจอจะเปลี่ยนเป็น Dashboard ของร้าน *Bantadthong Old Town Cafe* ทันที
* มีปุ่ม **"จำลองการสแกนคูปองลูกค้า (Verify & Redeem QR)"** พอกดปุ๊บ:
  1. สถานะคูปองใน Firestore เปลี่ยนเป็น `redeemed` (ใช้ซ้ำไม่ได้อีก)
  2. ตัวเลขบนหน้าจอร้านค้าดีดขึ้นแบบ Real-time ทันที: **จำนวนคนเดินมาถึงร้าน $+1$**, **คูปองที่ใช้แล้ว $+1$**, **สัดส่วนลูกค้าใหม่ $78\%$** และแสดงค่าธรรมเนียมที่แอปได้รับ $+8\text{ บาท}$ โชว์โมเดล **Make Me Money** ให้กรรมการเห็นจะๆ คาตา!

---

## 7. แผนแบ่งงานทีม 3–4 คน และตารางเวลา 3 วัน (ซิงค์จุดตรวจสอบกับ `android-build-guide.md`)

### การแบ่งบทบาทในทีม (ไม่ให้โค้ดชนกัน)
* **Dev 1 (สาย Native, Map & Sensors):** รับผิดชอบการตั้งค่า Environment Android ตาม `android-build-guide.md`, ตั้งค่า MapLibre + OSM, เซนเซอร์นับก้าว, คำนวณระยะทาง Geofence และแผงปุ่มลับ `DemoControlPanel`
* **Dev 2 (สาย Firebase, Auth & Business Flow):** รับผิดชอบ Google Login, โครงสร้าง Firestore, หน้ากระเป๋าคูปอง `CatPocketScreen`, ระบบ One-Time QR และหน้าจอร้านค้า `MerchantScreen`
* **Dev 3 + UX/UI (สาย Cat Interaction, Camera & UI):** รับผิดชอบ GIF แมวสำหรับแอนิเมชันพร้อม PNG static คู่กันสำหรับภาพถ่าย, หน้าหลักเลี้ยงแมว `HomeCatScreen` (จิ้มแล้วสั่น, กล่องข้อความแมวไกด์เล่าเรื่องย่านท่องเที่ยว, ตู้เสื้อผ้าแมว), และหน้ากล้อง `CatCameraScreen` (composite รูปนิ่งแมว + ทดสอบ capture + แชร์ลง IG)

---

### ตารางปฏิบัติการรายวัน (3-Day Timeline)

#### วันที่ 1: วางฐานราก Native Android + Google Login + แผนที่ & ตัวแมว
* **ช่วงเช้า (09:00 – 12:00) — ขั้นตอนตั้งค่าเครื่องและ Pre-flight Build:**
  * 📌 **บังคับอ่าน `android-build-guide.md` ข้อ 1, 2, 3 และ 7 ก่อนเริ่ม:**
    1. **Dev 1 & Dev 2:** ตรวจเวอร์ชัน `node --version` ($\ge 20$), `java -version` (JDK `17`), ตั้งค่า `local.properties` และตรวจสอบว่ามี `platforms;android-36`, `build-tools;36.0.0`, และ `ndk;27.1.12297006` ครบถ้วน
    2. ตรวจสอบไฟล์ `android/gradle.properties` ว่ามี `-Duser.language=en -Duser.country=US` เพื่อป้องกันบั๊กปี พ.ศ. 2569
    3. ตั้งค่า Firebase Auth/Firestore และ deploy Security Rules สำหรับ Production mode; เพิ่ม Fresco `animated-gif` version ที่ตรงกับ React Native ของ Ca-walk และสั่งทดสอบ Gradle configuration ด้วย `.\gradlew.bat :app:assembleDebug --dry-run` ก่อนรันลงมือถือจริง
  * **UX/UI & Dev 3:** เตรียม GIF แมว 6 ไฟล์ที่มีอยู่ใน `Assests/Cat/Animation/` และเลือก PNG เฟรมเดี่ยวจาก `Assests/Cat/Photo/` ให้ตรงกับสถานะสำหรับภาพถ่าย/การบันทึก พร้อมไอเทมแต่งตัวแมว 2–3 ชิ้น
* **ช่วงบ่าย (13:00 – 18:00):**
  * **Dev 1:** ขึ้นหน้า `MapQuestScreen` ดึงแผนที่ฟรี OpenStreetMap ผ่าน MapLibre และปักหมุดร้านค้าจำลอง 5 ร้านในย่านท่องเที่ยว (หากติดปัญหา Native Build/CMake ให้ดูวิธีแก้ใน `android-build-guide.md` **ข้อ 5**)
  * **Dev 2:** ทำหน้า `LoginScreen` (Google Sign-In) และเขียนฟังก์ชัน Seed ข้อมูลร้านค้าลง Firestore
  * **Dev 3:** ทำหน้า `HomeCatScreen` แสดง GIF แมวตามสถานะ ใส่ระบบจิ้มตัวแมวแล้วเครื่องสั่น (`react-native-haptic-feedback`) และทำปุ่มเลือกสเปกร้าน (`FilterTags`)
* **ช่วงค่ำ (19:00 – 22:00):**
  * รวมโค้ดเข้า Branch `main` รอบแรก รัน `npm ci` แล้วทดสอบ Build ลงเครื่องด้วยคำสั่งเร่งความเร็ว `-PreactNativeArchitectures=arm64-v8a` (ตาม `android-build-guide.md` **ข้อ 4**)

#### วันที่ 2: ระบบนับก้าว + กล้องถ่ายรูปติดแมว + คูปอง QR & กันโกง
* **ช่วงเช้า (09:00 – 12:00):**
  * **Dev 1:** เชื่อมระบบนับก้าวและพิกัด GPS เข้ากับหน้าแผนที่ พร้อมสร้างแผงปุ่มลับ `DemoControlPanel` (ปุ่มกดรัวเพิ่มก้าวเดิน, ปุ่มจำลองขี่รถเร็วเกิน, ปุ่มวาร์ปเข้าหน้าร้าน)
  * **Dev 2:** ทำหน้า `CatPocketScreen` แสดงรายการคูปองที่มีเวลานับถอยหลัง 72 ชั่วโมง และล็อกปุ่มเปิด QR Code ตามระยะ Geofence 50 เมตร
  * **Dev 3:** ขึ้นหน้า `CatCameraScreen` ด้วย `react-native-vision-camera` และเตรียม overlay เป็น PNG static (ไม่ใช้ GIF ในภาพที่บันทึก) + ป้ายชื่อร้าน + ตัวเลขก้าวเดิน แล้วทดสอบ capture บนอุปกรณ์จริง
* **ช่วงบ่าย (13:00 – 18:00):**
  * **Dev 1:** เชื่อมสถานะอารมณ์แมวเข้ากับจำนวนก้าวเดิน และใช้ `Assests/Cat/Animation/jump.gif` เป็นแอนิเมชันตอบสนองเมื่อเดินถึงเป้าหมาย โดยแสดงซองคูปองเป็น UI แยกจาก asset แมว
  * **Dev 2:** ทำหน้าแสดง `One-Time Dynamic QR` และเริ่มขึ้นโครงหน้า `MerchantScreen` (Dashboard ฝั่งร้านค้า)
  * **Dev 3:** capture ภาพนิ่งจากกล้อง แล้ว render เป็นพื้นหลังพร้อม PNG static ของแมว/ข้อความ; ใช้ `react-native-view-shot` จับ composition ที่ render เสร็จ ตรวจผลบนมือถือจริง และเชื่อม `react-native-share` เพื่อแชร์ภาพพร้อมแจกแต้มโบนัสแมว
* **ช่วงค่ำ (19:00 – 22:00):**
  * รวมโค้ดรอบที่สอง ทดสอบการกดปุ่ม Demo เพิ่มระยะทาง $\rightarrow$ แมวคาบคูปอง $\rightarrow$ ถ่ายรูปติดแมว $\rightarrow$ เปิด QR Code

#### วันที่ 3: หน้าจอทำเงิน B2B + Build Release APK + ซ้อมขึ้นเวที
* **ช่วงเช้า (09:00 – 12:00):**
  * **Dev 2:** เก็บงานหน้า `MerchantScreen` ให้สมบูรณ์ (โชว์ยอดคนเดินมาหน้าร้าน, ยอดใช้คูปอง, สัดส่วนลูกค้าใหม่ $78\%$, ปุ่มตั้งแคมเปญ Booster และรายได้ค่าธรรมเนียมแบบ Real-time)
  * **Dev 1 & Dev 3:** เติมข้อความ **"แมวไกด์ท้องถิ่น"** ในกล่องคำพูดระหว่างเดิน (เล่าประวัติย่าน/ร้านลับเพื่อเอาคะแนนโบนัสการท่องเที่ยว) และปรับแต่ง UI ให้สวยงามลื่นไหล
* **ช่วงบ่าย (13:00 – 16:00) — ขั้นตอนสร้างไฟล์ APK ขึ้นเวที:**
  * **หยุดเพิ่มฟีเจอร์ใหม่ (Code Freeze)**
  * 📌 **บังคับอ่าน `android-build-guide.md` ข้อ 4 (การ Build Release APK):**
    1. รันคำสั่ง `cd android && .\gradlew.bat :app:assembleRelease --console=plain`
    2. นำไฟล์ `android/app/build/outputs/apk/release/app-release.apk` ติดตั้งลงมือถือ Android เครื่องหลักและเครื่องสำรองอีก 1 เครื่อง (ไฟล์ Release APK นี้ฝังโค้ด JavaScript และ assets ที่ bundle ไว้ในตัวแล้ว จึงนำไปกดโชว์บนเวทีได้โดยไม่ต้องเปิด Metro Server)
  * ซ้อมกดแอปคู่กับสไลด์ 6 หน้าให้จบภายในเวลาที่กำหนด

---

## 8. แนวทางแก้ปัญหาด่วนเมื่อ Build ไม่ผ่าน (ซิงค์กับ `android-build-guide.md` ข้อ 5, 6 และ 8)

หากเกิดปัญหาในการ Build ระหว่างแข่ง **ห้ามสุ่มแก้เลขเวอร์ชัน Gradle/SDK และห้ามสั่ง Clean เป็นอันดับแรกทุกครั้ง** เพราะจะทำให้เสียเวลาคอมไพล์ใหม่หลายสิบนาที ให้ทำตามลำดับดังนี้:

1. **เปิดตารางเทียบอาการใน `android-build-guide.md` ข้อ 5 ทันที:**
   * ถ้าขึ้น `SDK location not found` $\rightarrow$ เช็กไฟล์ `android/local.properties`
   * ถ้าขึ้น `Unsupported class file major version` หรือ `jvm.cfg` $\rightarrow$ เช็กว่า `JAVA_HOME` ชี้ไปที่ **JDK 17** จริงหรือไม่
   * ถ้าขึ้น `Could not find node` ใน Android Studio $\rightarrow$ สั่ง Build ผ่าน PowerShell ที่รัน `node --version` ผ่านแทน
2. **การล้าง Cache อย่างถูกวิธี (ทำเฉพาะหลังแก้ JDK/SDK/NDK แล้วเท่านั้น — อ้างอิงข้อ 6):**
   ```powershell
   cd android
   .\gradlew.bat --stop
   .\gradlew.bat clean --console=plain
   Remove-Item -Recurse -Force .gradle, app\.cxx -ErrorAction SilentlyContinue
   .\gradlew.bat :app:assembleDebug --console=plain
   ```
3. **Checklist ข้อมูลที่ต้องก๊อปปี้ส่งให้ AI ช่วยดูเมื่อเกิด Error (อ้างอิงข้อ 8):**
   รันคำสั่งด้านล่างแล้วคัดลอกผลลัพธ์พร้อมข้อความ Error จาก `.\gradlew.bat :app:assembleDebug --stacktrace --info --console=plain` ส่งให้ AI เพื่อวิเคราะห์หาต้นตออย่างแม่นยำ:
   ```powershell
   node --version; npm --version; java -version
   cd android; .\gradlew.bat --version
   Get-Content gradle.properties; Get-Content local.properties
   ```

---

## 9. สคริปต์ลำดับการกดโชว์กรรมการบนเวที (Live Demo Flow 2–3 นาที)

1. **เปิดแอป & คัดกรองร้าน (30 วินาที):**
   * โชว์หน้าโฮม จิ้มลูบหัวแมวให้ดู GIF แอนิเมชันและการโต้ตอบ
   * กดเลือก Tag **"มีไวไฟ + ราคาประหยัด + ร้านลับ"** แล้วเลือกภารกิจเดินสำรวจย่านบรรทัดทอง
2. **เดินนำทาง & โชว์ระบบกันโกง (45 วินาที):**
   * เข้าหน้าแผนที่ โชว์กล่องข้อความที่แมวเล่าเกร็ดความรู้การท่องเที่ยวของย่านนั้น
   * **โชว์หมัดเด็ด Anti-Fraud:** กดปุ่มจำลองขี่รถ $\rightarrow$ แสดงคำเตือน ใช้ `Assests/Cat/Animation/IDLE_SITE.gif` และหยุดนับระยะทางทันที
   * กดกลับมาโหมดเดินปกติ แล้วกดปุ่มเร่งฝีเท้าแมวรัวๆ จนครบระยะ $\rightarrow$ ใช้ `Assests/Cat/Animation/jump.gif` พร้อมแสดงซองคูปองเป็น UI แยก
3. **ถ่ายรูปติดแมวแชร์ลงโซเชียล (30 วินาที):**
   * แมวทักว่า *"ถึงหน้าร้านแล้ว ถ่ายรูปกันเหมียว!"* กดเปิดกล้องในแอป
   * แสดง GIF บนหน้าจอ preview ได้ แต่เมื่อถ่าย/บันทึกให้ composite ภาพ PNG static ของแมวแทน GIF พร้อมสถิติและชื่อร้าน แล้วตรวจภาพผลลัพธ์ก่อนแชร์เพื่อรับแต้มแต่งตัวแมว
4. **ปลดล็อกคูปอง Geofence & ปิดจบด้วยหน้าจอทำเงิน B2B (45 วินาที):**
   * เปิดกระเป๋าคูปอง โชว์ให้เห็นว่าคูปองเก็บไว้ใช้ได้ 72 ชั่วโมง (ไม่ต้องเข้าคาเฟ่ตอนเหงื่อท่วม)
   * กดจำลองเข้าเขต 50 เมตรหน้าร้าน $\rightarrow$ ปุ่ม QR Code ปลดล็อก
   * กดสลับโหมดเป็น **Merchant View (ฝั่งร้านค้า)** แล้วกดรับสิทธิ์คูปอง $\rightarrow$ กราฟยอดลูกค้าใหม่และรายได้ค่าธรรมเนียมดีดขึ้นแบบ Real-time ปิดจบการนำเสนออย่างสมบูรณ์แบบ!
