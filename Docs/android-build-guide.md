# Android Build Guide สำหรับ React Native

เอกสารนี้เป็นคู่มืออ้างอิง Android สำหรับ Ca-walk โดยดึงตัวอย่างเวอร์ชันและปัญหาที่
เคยพบจากโปรเจกต์ CatiX มาใช้ เนื่องจาก Ca-walk ยังไม่มี `package.json` หรือโฟลเดอร์
`android/` ค่าด้านล่างยังไม่ใช่ค่าที่ตรวจยืนยันจาก build ของ Ca-walk เมื่อ scaffold
โปรเจกต์แล้วให้ยึดไฟล์จริงของ Ca-walk และตรวจความเข้ากันได้ก่อนติดตั้ง/เปลี่ยนเวอร์ชัน
เอกสารนี้ครอบคลุม Android เท่านั้น

## 1. Baseline สำหรับเตรียมเครื่อง (ยังไม่ใช่ Source of Truth ของ Ca-walk)

ค่าต่อไปนี้อ่านจาก CatiX และยืนยันด้วย Gradle configuration ของ CatiX เท่านั้น
ใช้เป็นจุดเริ่มต้นได้ แต่หลัง scaffold ให้ตรวจไฟล์ของ Ca-walk แทนการคัดลอกค่า/ไฟล์
native ทั้งชุด และอย่าเปลี่ยนเวอร์ชันโดยไม่ตรวจ compatibility ของ React Native ก่อน

| รายการ | ตัวอย่าง baseline จาก CatiX | หมายเหตุ |
|---|---:|---|
| React Native | `0.81.4` | ตรวจใน `package.json` ของ Ca-walk หลัง scaffold |
| React Native CLI | `20.0.0` | ตรวจใน `package.json` ของ Ca-walk หลัง scaffold |
| Node.js | `>=20` (เครื่อง CatiX ที่ตรวจพบ: `v24.14.0`) | ตรวจ `engines` และ `node --version` |
| Java / JDK | `17` | CatiX Gradle/Kotlin target |
| Android Gradle Plugin | `8.11.0` | ตรวจ Gradle configuration ของ Ca-walk |
| Gradle wrapper | `8.14.3` | ตรวจ `gradle-wrapper.properties` ของ Ca-walk |
| Kotlin Gradle plugin | `2.1.20` | ตรวจ Gradle files ของ Ca-walk |
| `compileSdk` / `targetSdk` | `36` | ตรวจ config ของ Ca-walk แล้วติดตั้ง Platform ที่ต้องการ |
| `minSdk` | `24` | ตรวจ `defaultConfig` และ native libraries |
| Android Build Tools | `36.0.0` | ติดตั้ง version ที่ Ca-walk/Gradle ต้องการ |
| Android NDK | `27.1.12297006` | ติดตั้ง version ที่ Ca-walk/native dependencies ต้องการ |
| Java/Kotlin bytecode | `17` | CatiX native module |
| JavaScript engine | Hermes | ตรวจ `gradle.properties` ของ Ca-walk |
| New Architecture | เปิด | ตรวจ template และ native packages ของ Ca-walk |

แพ็กเกจ SDK ที่ควรมีใน Android SDK Manager:

- Android SDK Platform `36` (`platforms;android-36`)
- Android SDK Build-Tools `36.0.0` (`build-tools;36.0.0`)
- NDK (Side by side) `27.1.12297006` (`ndk;27.1.12297006`)
- Android SDK Platform-Tools (`platform-tools`) สำหรับ `adb`
- Android SDK Command-line Tools (latest) ถ้าต้องการใช้ `sdkmanager`

`CMake` ไม่ได้ถูกกำหนดเป็นค่าหลักในโปรเจกต์ แต่ไลบรารี native เช่น Reanimated
อาจเรียกใช้ CMake ระหว่าง build ถ้า error ระบุ CMake version ให้ติดตั้ง version
ที่ error ระบุผ่าน SDK Manager ก่อน แล้วค่อย build ใหม่

## 2. ตั้งค่าเครื่อง Windows

เปิด PowerShell ใหม่ แล้วตรวจค่าเบื้องต้น:

```powershell
node --version
npm --version
java -version
```

ต้องได้ Node อย่างน้อย 20 และ Java 17 ถ้า `java -version` ขึ้น error เช่น
`could not open ... jvm.cfg` แปลว่า `JAVA_HOME` หรือ `PATH` ชี้ไป JDK ที่เสีย/ไม่มีอยู่
ให้เลือก JDK 17 ที่ติดตั้งจริงใน Android Studio ที่ `Settings > Build, Execution,
Deployment > Build Tools > Gradle > Gradle JDK` แล้วตรวจใหม่

ตัวอย่างการตั้งค่าเฉพาะ PowerShell หน้าต่างปัจจุบัน:

```powershell
$env:ANDROID_HOME = "$env:LOCALAPPDATA\Android\Sdk"
$env:ANDROID_SDK_ROOT = $env:ANDROID_HOME
$env:JAVA_HOME = "C:\Path\To\A\Valid\JDK-17"
$env:Path = "$env:JAVA_HOME\bin;$env:ANDROID_HOME\platform-tools;$env:ANDROID_HOME\emulator;$env:Path"
```

อย่าคัดลอก path ของผู้ใช้คนอื่นแบบตรง ๆ ตัวอย่าง path ของเครื่องที่ตรวจโปรเจกต์นี้คือ
`C:\Users\usEr\AppData\Local\Android\Sdk` และ JDK 17 ที่ Gradle เคยดาวน์โหลดไว้
อยู่ใต้ `C:\Users\usEr\.gradle\jdks\...` แต่เครื่องอื่นอาจใช้ path ต่างกัน

### ติดตั้ง SDK ด้วย `sdkmanager`

ถ้า Android Studio ติดตั้ง Command-line Tools แล้ว:

```powershell
$sdkmanager = "$env:ANDROID_HOME\cmdline-tools\latest\bin\sdkmanager.bat"
& $sdkmanager --licenses
& $sdkmanager "platform-tools" "platforms;android-36" "build-tools;36.0.0" "ndk;27.1.12297006"
```

ถ้าหา `sdkmanager.bat` ไม่เจอ ให้เปิด Android Studio > SDK Manager > SDK Tools
แล้วติดตั้ง **Android SDK Command-line Tools (latest)** ก่อน อย่าติดตั้งเฉพาะ
Android Studio แล้วคาดว่า Gradle จะดาวน์โหลด SDK ทุกตัวให้เอง

## 3. `local.properties` และตำแหน่ง SDK

Gradle ต้องรู้ตำแหน่ง Android SDK ผ่าน `android/local.properties` หรือ environment
variable โดยไฟล์นี้เป็นข้อมูลเฉพาะเครื่องและถูก ignore ไว้แล้ว ห้าม commit ไฟล์นี้

ใน Android Studio ให้เปิดโฟลเดอร์ `android/` แล้ว Sync Project เพื่อให้ IDE สร้างไฟล์
ให้อัตโนมัติ หรือสร้างบน Windows ด้วย PowerShell:

```powershell
$sdk = ($env:LOCALAPPDATA + "\Android\Sdk").Replace("\", "\\")
"sdk.dir=$sdk" | Set-Content -Encoding ascii android\local.properties
```

ตรวจว่าค่าถูกต้อง:

```powershell
Get-Content android\local.properties
Test-Path "$env:ANDROID_HOME\platforms\android-36"
Test-Path "$env:ANDROID_HOME\build-tools\36.0.0"
Test-Path "$env:ANDROID_HOME\ndk\27.1.12297006"
```

สำหรับ macOS/Linux ใช้รูปแบบ path ของระบบนั้น เช่น `sdk.dir=/Users/<user>/Library/Android/sdk`
หรือ `sdk.dir=/home/<user>/Android/Sdk` ไม่ใช้ backslash แบบ Windows

## 4. คำสั่งติดตั้งและ build (หลัง scaffold โปรเจกต์แล้ว)

รันจาก root ของโปรเจกต์:

```powershell
npm ci
```

คำสั่งนี้ติดตั้ง dependency ตาม lockfile และ `postinstall` จะเรียก `patch-package`
ถ้าโปรเจกต์มีโฟลเดอร์ `patches/` ต้องตรวจว่า patch ถูก apply สำเร็จด้วย

### Build debug และติดตั้งลงเครื่อง

เปิด Developer options + USB debugging บนมือถือ หรือเปิด Emulator จาก Android Studio
จากนั้น:

```powershell
npm run android -- --list-devices
```

ถ้าต้องการ build อย่างเดียวโดยไม่ติดตั้ง:

```powershell
cd android
.\gradlew.bat :app:assembleDebug --console=plain
```

ถ้า build debug แล้วต้องการลดเวลาบนมือถือ arm64 ให้ใช้:

```powershell
.\gradlew.bat :app:assembleDebug -PreactNativeArchitectures=arm64-v8a --console=plain
```

### Build release APK

```powershell
cd android
.\gradlew.bat :app:assembleRelease --console=plain
```

ไฟล์ผลลัพธ์คือ:

```text
android/app/build/outputs/apk/release/app-release.apk
```

การ build release ของ React Native ปกติจะ bundle JavaScript/assets ใน APK แล้ว
จึงไม่ต้องเปิด Metro เมื่อใช้งาน APK ที่ build สำเร็จ ตรวจว่าคำสั่งและ output path
ตรงกับ Android project ของ Ca-walk หลัง scaffold แล้ว

## 5. ปัญหา Gradle/SDK ที่พบบ่อย

| Error หรืออาการ | สาเหตุที่เป็นไปได้ | วิธีแก้ |
|---|---|---|
| `SDK location not found` | ไม่มี `android/local.properties` หรือ path ผิด | ตั้ง `ANDROID_HOME`/`ANDROID_SDK_ROOT` และสร้าง `local.properties` ตามข้อ 3 |
| `Failed to find target with hash string 'android-36'` | ยังไม่มี Platform 36 | ติดตั้ง `platforms;android-36`; อย่าลด `compileSdk` แบบสุ่ม |
| `Installed Build Tools revision 36.0.0 is corrupted` หรือหา Build Tools ไม่พบ | Build Tools ไม่ครบหรือ installation เสีย | ติดตั้ง `build-tools;36.0.0` ใหม่จาก SDK Manager แล้ว retry |
| `NDK ... 27.1.12297006 not found` | NDK version ไม่ตรงกับ `android/build.gradle` | ติดตั้ง `ndk;27.1.12297006`; อย่าเลือก `latest` แทนแบบเดาสุ่ม |
| `CMake ... not found` ระหว่าง `externalNativeBuild` | native dependency ต้องใช้ CMake | อ่าน version จาก error แล้วติดตั้งผ่าน SDK Manager; ลบ `android/app/.cxx` เฉพาะถ้าเป็น cache เก่า |
| `Unsupported class file major version`, `invalid source release` หรือ AGP บอก Java ไม่รองรับ | ใช้ JDK ผิด version | ตั้ง Gradle JDK และ `JAVA_HOME` เป็น JDK 17 แล้วเปิด terminal/Android Studio ใหม่ |
| `JAVA_HOME is set to an invalid directory` หรือ `jvm.cfg` เปิดไม่ได้ | `JAVA_HOME` ชี้ path ที่ไม่มี JDK จริง | แก้เป็นโฟลเดอร์ JDK 17 ที่มี `bin/java.exe`; อย่าชี้ไปไฟล์ `java.exe` หรือโฟลเดอร์ Android Studio ที่ไม่มี JDK |
| `Could not find node`, `npx`, autolinking fail จาก Android Studio | IDE ไม่มี Node อยู่ใน PATH | ทดสอบ build จาก terminal ที่ `node --version` ใช้ได้ หรือเพิ่ม Node ใน PATH ของ IDE; ถ้าจะแก้ `settings.gradle` ให้ใช้ absolute path ของ `node.exe` บน Windows |
| `com.google.common.base.VerifyException` ที่ `mergeDebugJavaResource` / `MsDosDateTimeUtils.packDate` | locale ไทยใช้ปี พ.ศ. 2569 ซึ่งเกินช่วงวันที่ของ APK zip metadata | คงค่านี้ไว้ใน `android/gradle.properties`: `-Duser.language=en -Duser.country=US` แล้วหยุด Gradle daemon/retry |
| `Could not connect to development server` / หน้าจอ `Connecting to the development server` | เป็น debug APK ที่ไม่มี Metro หรือมือถือเชื่อม Metro ไม่ได้ | เปิด `npm start` และตรวจ USB/Wi-Fi; release APK ไม่ต้องใช้ Metro |
| `adb` ไม่รู้จักคำสั่ง | `platform-tools` ไม่อยู่ใน PATH | เพิ่ม `$env:ANDROID_HOME\platform-tools` ใน PATH หรือเรียก `& "$env:ANDROID_HOME\platform-tools\adb.exe" devices -l` |
| `unauthorized` ใน `adb devices` | มือถือยังไม่อนุญาต USB debugging | ปลดล็อกมือถือ ยอมรับ RSA prompt แล้วรัน `adb devices` ใหม่ |
| `Could not resolve ...` หรือ offline dependency หาย | ใช้ `--offline` ก่อน cache dependency ครบ | เอา `--offline` ออกและ build แบบ online ครั้งแรก; ใช้ offline หลัง build สำเร็จอย่างน้อยหนึ่งครั้ง |
| `SDK XML version ...` warning | Command-line Tools เก่ากว่า SDK XML | อัปเดต Command-line Tools ได้ แต่ warning นี้ไม่ใช่ build error ถ้า Gradle จบด้วย `BUILD SUCCESSFUL` |
| `Gradle deprecated features` หรือ `NO_COLOR/FORCE_COLOR` warning | warning จาก Gradle/Metro/plugin | ไม่ต้องแก้ native config เพียงเพราะ warning; สนใจบรรทัด `FAILURE` และ task ที่ล้มจริง |

## 6. ลำดับล้าง cache เมื่อแก้ environment แล้ว

อย่า clean เป็นขั้นตอนแรกทุกครั้ง เพราะจะทำให้ build ช้าหลายสิบนาที ให้ทำหลังจาก
แก้ JDK/SDK/NDK, เปลี่ยน architecture หรือมี error ที่ชี้ไป cache เก่าเท่านั้น:

```powershell
cd android
.\gradlew.bat --stop
.\gradlew.bat clean --console=plain
Remove-Item -Recurse -Force .gradle, app\.cxx -ErrorAction SilentlyContinue
.\gradlew.bat :app:assembleDebug --console=plain
```

ถ้า clean เองล้มเพราะ environment ไม่ถูกต้อง ให้แก้ SDK/JDK/Node ตามตารางก่อน
แล้วค่อยรัน clean อีกครั้ง ไม่ต้องลบ `node_modules` หรือ Gradle user cache โดยไม่มีหลักฐาน

## 7. จุดที่ AI ควรตรวจในโปรเจกต์ Android จริง

1. อ่าน `android/build.gradle`/`build.gradle.kts`, `gradle-wrapper.properties` และ
   `gradle.properties` ของ Ca-walk ก่อนเลือกค่า SDK/NDK/Build Tools; ถ้า build ระบุ
   version ขาด ให้ติดตั้งค่าที่โปรเจกต์ร้องขอ แทนแก้ Gradle ให้ตรงกับ SDK ที่บังเอิญมี
2. ถ้าเจอ `VerifyException` ที่ `mergeDebugJavaResource` พร้อม
   `MsDosDateTimeUtils.packDate` บน locale ไทย ให้ตรวจ locale override นี้:

   ```properties
   org.gradle.jvmargs=-Xmx2048m -XX:MaxMetaspaceSize=512m -Duser.language=en -Duser.country=US
   ```

3. ถ้า Android Studio หา Node ไม่พบ ให้ตรวจ `PATH` ของ IDE และ Node ที่ติดตั้งจริง
   ก่อนแก้ `settings.gradle`; อย่าคัดลอก resolver ของ CatiX โดยไม่ตรวจ OS/path
4. `-PreactNativeArchitectures=arm64-v8a` เป็น optimization สำหรับมือถือ arm64 เท่านั้น
   ไม่ใช่วิธีแก้ dependency/native compilation error และใช้ไม่ได้กับ emulator x86
5. ถ้า task ล้มใน native module ให้ตรวจ module และ version ที่ error กล่าวถึง
   (เช่น CMake/NDK/Kotlin) ในโปรเจกต์จริง ไม่สมมติว่า Ca-walk มี CatiX `:widget`

## 8. Checklist ก่อนส่งให้ AI แก้ error

ให้ส่งข้อมูลเหล่านี้พร้อม error เสมอ จะช่วยไม่ให้ AI เดา version ผิด:

```powershell
node --version
npm --version
java -version
cd android
.\gradlew.bat --version
Get-Content gradle.properties
Get-Content local.properties
```

และรัน task ที่ล้มด้วย output แบบเต็ม:

```powershell
.\gradlew.bat :app:assembleDebug --stacktrace --info --console=plain
```

ให้ AI แยกก่อนว่าเป็น **configuration error**, **dependency/download error**,
**native toolchain error**, **APK install/CLI path error** หรือเพียง **warning**
แล้วแก้ที่ต้นเหตุจากตารางด้านบน ไม่ควรอัปเกรด AGP/Gradle/SDK หรือสุ่มลบ cache
เพื่อกลบ error

## 9. หลักฐานอ้างอิงจาก CatiX เท่านั้น

ใน CatiX คำสั่ง `:app:assembleDebug --dry-run` ผ่านและรายงาน `BUILD SUCCESSFUL`
โดยพบ AGP `8.11.0` และ Gradle `8.14.3` นี่เป็นเพียงหลักฐาน configuration/task graph
ของ CatiX ไม่ใช่ผล build ของ Ca-walk และ dry-run ไม่ได้คอมไพล์หรือทดสอบ APK

