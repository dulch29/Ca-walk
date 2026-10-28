param(
    [string]$DeviceId
)

$ErrorActionPreference = 'Stop'
$projectRoot = (Resolve-Path (Join-Path $PSScriptRoot '..')).Path
$androidDir = Join-Path $projectRoot 'android'
$apkPath = Join-Path $androidDir 'app\build\outputs\apk\release\app-release.apk'

$sdkCandidates = @(
    $env:ANDROID_HOME,
    $env:ANDROID_SDK_ROOT,
    (Join-Path $env:LOCALAPPDATA 'Android\Sdk')
) | Where-Object { $_ } | Select-Object -Unique

$adb = $null
foreach ($sdk in $sdkCandidates) {
    $candidate = Join-Path $sdk 'platform-tools\adb.exe'
    if (Test-Path $candidate) {
        $adb = $candidate
        break
    }
}

if (-not $adb) {
    $adbCommand = Get-Command adb -ErrorAction SilentlyContinue
    if ($adbCommand) {
        $adb = $adbCommand.Source
    }
}

if (-not $adb) {
    throw 'Could not find adb.exe. Install Android SDK Platform-Tools or set ANDROID_HOME.'
}

$deviceLines = & $adb devices
if ($LASTEXITCODE -ne 0) {
    throw 'Could not query Android devices with adb.'
}

$devices = @(
    $deviceLines | ForEach-Object {
        if ($_ -match '^\s*(\S+)\s+(device|unauthorized|offline)\b') {
            [pscustomobject]@{ Id = $Matches[1]; State = $Matches[2] }
        }
    }
)

$readyDevices = @($devices | Where-Object State -eq 'device')
if ($readyDevices.Count -eq 0) {
    if ($devices | Where-Object State -eq 'unauthorized') {
        throw 'The phone is unauthorized. Unlock it and accept the USB debugging prompt, then run this script again.'
    }
    throw 'No authorized Android device found. Connect and unlock the phone, enable USB debugging, then run this script again.'
}

if ($DeviceId) {
    if (-not ($readyDevices | Where-Object Id -eq $DeviceId)) {
        throw "Device '$DeviceId' is not connected and authorized."
    }
} elseif ($readyDevices.Count -eq 1) {
    $DeviceId = $readyDevices[0].Id
} else {
    Write-Host 'Choose the device to install CaWalk on:'
    for ($i = 0; $i -lt $readyDevices.Count; $i++) {
        Write-Host "[$($i + 1)] $($readyDevices[$i].Id)"
    }
    $choice = Read-Host 'Device number'
    $index = 0
    if (-not [int]::TryParse($choice, [ref]$index) -or $index -lt 1 -or $index -gt $readyDevices.Count) {
        throw 'Invalid device selection.'
    }
    $DeviceId = $readyDevices[$index - 1].Id
}

$gradle = Join-Path $androidDir 'gradlew.bat'
if (-not (Test-Path $gradle)) {
    throw "Gradle wrapper not found: $gradle"
}

Write-Host "Building the release APK for device $DeviceId..."
Push-Location $androidDir
try {
    & $gradle :app:assembleRelease --console=plain
    if ($LASTEXITCODE -ne 0) {
        throw 'Release build failed. Review the Gradle output above.'
    }
} finally {
    Pop-Location
}

if (-not (Test-Path $apkPath)) {
    throw "Build finished without the expected APK: $apkPath"
}

Write-Host 'Installing the release APK...'
& $adb -s $DeviceId install -r $apkPath
if ($LASTEXITCODE -ne 0) {
    throw 'APK installation failed. Review the adb output above.'
}

Write-Host 'Launching CaWalk...'
& $adb -s $DeviceId shell monkey -p cawalk.app 1
if ($LASTEXITCODE -ne 0) {
    throw 'The APK installed, but Android could not launch CaWalk automatically.'
}

Write-Host "Done. APK: $apkPath"
