# One-time Android scaffold for the PromptKing admin app.
#
# lib/ and pubspec.yaml are written; android/ is not, because a hand-written
# Gradle scaffold pins plugin and AGP versions that only match one Flutter
# release and breaks on the next. `flutter create` generates that folder
# against whatever Flutter you actually installed, and this script then fixes
# the two things it gets wrong for an app like this one.
#
# Run from the mobile/ folder:
#   powershell -ExecutionPolicy Bypass -File tool\setup.ps1

$ErrorActionPreference = 'Stop'

$root = Split-Path -Parent $PSScriptRoot
Set-Location $root

Write-Host "==> Checking Flutter" -ForegroundColor Cyan
$flutter = Get-Command flutter -ErrorAction SilentlyContinue
if (-not $flutter) {
    Write-Host "Flutter is not on PATH." -ForegroundColor Red
    Write-Host "Install it from https://docs.flutter.dev/get-started/install/windows, then run this again."
    exit 1
}
flutter --version

Write-Host "`n==> Generating the android/ folder" -ForegroundColor Cyan
# Existing files are left alone: lib/main.dart and pubspec.yaml survive this.
flutter create --platforms=android --project-name promptking_admin --org in.promptking .

$manifest = Join-Path $root 'android\app\src\main\AndroidManifest.xml'
if (-not (Test-Path $manifest)) {
    Write-Host "Expected $manifest to exist after flutter create." -ForegroundColor Red
    exit 1
}

Write-Host "`n==> Patching the release manifest" -ForegroundColor Cyan
$xml = Get-Content $manifest -Raw

# Flutter puts INTERNET only in the debug and profile manifests. Without it in
# the main one, a release APK installs fine and then fails every request with
# an unhelpful SocketException.
if ($xml -notmatch 'android\.permission\.INTERNET') {
    $xml = $xml -replace '(<manifest[^>]*>)', "`$1`n    <uses-permission android:name=`"android.permission.INTERNET`"/>"
    Write-Host "  added INTERNET permission"
} else {
    Write-Host "  INTERNET permission already present"
}

# The launcher name flutter create derives from the project name is
# "promptking_admin".
if ($xml -match 'android:label="[^"]*"') {
    $xml = $xml -replace 'android:label="[^"]*"', 'android:label="PromptKing Admin"'
    Write-Host "  set the app label"
}

Set-Content -Path $manifest -Value $xml -Encoding utf8

Write-Host "`n==> Patching gradle.properties" -ForegroundColor Cyan

$gradleProps = Join-Path $root 'android\gradle.properties'
$props = Get-Content $gradleProps -Raw

# Kotlin's incremental compiler memory-maps .tab files under build/ and on some
# Windows setups cannot close them again — :image_picker_android:compileDebugKotlin
# then dies with "Could not close incremental caches" before producing anything,
# and a clean does not help because the caches are recreated each run. Turning
# incremental compilation off avoids that code path entirely. Rebuilds are
# slower; they also finish.
if ($props -notmatch 'kotlin\.incremental') {
    Add-Content -Path $gradleProps -Value "`n# Kotlin's incremental caches cannot be closed on some Windows setups.`nkotlin.incremental=false" -Encoding utf8
    Write-Host "  disabled Kotlin incremental compilation"
} else {
    Write-Host "  kotlin.incremental already set"
}

Write-Host "`n==> Fetching packages" -ForegroundColor Cyan
flutter pub get

Write-Host "`nDone." -ForegroundColor Green
Write-Host "  Run on a connected phone:   flutter run"
Write-Host "  Build an installable APK:   flutter build apk --release"
Write-Host "  The APK lands in:           build\app\outputs\flutter-apk\app-release.apk"
