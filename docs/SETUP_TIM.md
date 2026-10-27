# Panduan setup tim SmartWaterTank

Panduan ini untuk Fajri (Windows Intel) dan Refo (Windows ARM64). Mulai setelah masalah `runtime not ready` di HP selesai ditangani. Tujuannya agar setup mesin kedua anggota tim konsisten sebelum build.

## A. Persiapan bersama

### 1. Perangkat lunak

| Alat | Versi | Catatan |
| --- | --- | --- |
| Git | Terbaru | Aktifkan dukungan long path seperti langkah A.4. |
| Node.js | LTS 22 | `package.json` mensyaratkan Node `>=22.11.0`. Refo pilih installer ARM64. |
| JDK | 17 | Fajri: Temurin x64. Refo: Microsoft OpenJDK 17 untuk aarch64. |
| Android Studio | Terbaru | Digunakan untuk SDK Manager dan `adb`. |
| VS Code | Terbaru | Buka folder repo sebagai workspace. |

### 2. Android SDK

Di Android Studio, buka **More Actions → SDK Manager** lalu pasang:

- **SDK Platforms:** Android 36 dan Android 37. Repo memakai `compileSdkVersion 37` dan `targetSdkVersion 36`.
- **SDK Tools:** Android SDK Build-Tools 37.0.0 (versi yang ditetapkan repo), Android SDK Platform-Tools, NDK (Side by side) versi 27.1.12297006, dan CMake.
- `android/build.gradle` menetapkan versi NDK, tetapi tidak menetapkan versi CMake tertentu. Pilih versi CMake stabil yang tersedia di SDK Manager.

### 3. Environment variable

Di **Edit environment variables** pada Windows, atur:

- `ANDROID_HOME` = `C:\Users\<nama>\AppData\Local\Android\Sdk`
- `JAVA_HOME` = folder instalasi JDK 17
- Tambahkan `%ANDROID_HOME%\platform-tools` ke `Path`.

Tutup dan buka kembali terminal, lalu periksa:

```powershell
node -v
java -version
adb version
```

Repo mensyaratkan Node 22.11.0 atau lebih baru dan JDK 17.

### 4. Aktifkan dukungan long path

Di PowerShell **Run as Administrator**, jalankan:

```powershell
New-ItemProperty -Path "HKLM:\SYSTEM\CurrentControlSet\Control\FileSystem" -Name LongPathsEnabled -Value 1 -PropertyType DWORD -Force
git config --system core.longpaths true
```

Restart Windows setelah mengaktifkannya.

### 5. Clone ke path pendek dan pasang dependensi

```powershell
New-Item -ItemType Directory -Force C:\src
Set-Location C:\src
git clone <URL-repo-Anda> SmartWaterTank
Set-Location C:\src\SmartWaterTank
npm install
```

Jangan simpan repo di `Downloads` atau `AndroidStudioProjects`.

### 6. Konfigurasi Firebase

Pastikan `android/app/google-services.json` tersedia. Jika tidak ada, unduh dari **Firebase Console → Project settings → Android app** dan simpan di folder tersebut. File konfigurasi ini tidak boleh dibagikan di grup publik.

Pastikan akun Fajri dan Refo memiliki akses ke proyek Firebase `smart-water-tank-e49d6` agar dapat membaca data.

### 7. Periksa kesiapan mesin

Dari root repo, jalankan:

```powershell
.\scripts\setup-check.ps1
```

Skrip memeriksa versi Node dan Java, `ANDROID_HOME`, kedua pengaturan long path, serta keberadaan file konfigurasi Firebase. Semua pemeriksaan harus berstatus `[OK]` sebelum melanjutkan.

## B. Menjalankan web

Dari `C:\src\SmartWaterTank`:

```powershell
npm run web
```

Buka `http://localhost:8085` di browser. Port 8085 ditetapkan di `webpack.config.js`.

Jika dashboard kosong atau error, periksa nama koleksi `telemetry_logs`, indeks komposit Firestore (gunakan tautan pembuatan indeks di pesan error), rules yang mengizinkan pembacaan, dan apakah ESP32 sudah mengirim data.

## C. Menjalankan Android

Gunakan HP Android asli untuk Fajri dan Refo. Ini jalur yang disarankan untuk pengujian di lapangan.

1. Di HP, buka **Settings → About phone**, ketuk **Build number** tujuh kali, lalu aktifkan **Developer options → USB debugging**.
2. Sambungkan HP dengan kabel USB dan izinkan debugging pada dialog di HP.
3. Di terminal, jalankan `adb devices`. HP harus muncul dengan status `device`.
4. Buka terminal pertama di root repo dan biarkan Metro berjalan:

   ```powershell
   npx react-native start --reset-cache
   ```

5. Buka terminal kedua di root repo, lalu jalankan:

   ```powershell
   adb reverse tcp:8081 tcp:8081
   npx react-native run-android
   ```

Build pertama dapat memerlukan 6–10 menit; build berikutnya biasanya lebih cepat. Setelah aplikasi terbuka, perubahan JavaScript/TypeScript dimuat ulang melalui Metro tanpa build native ulang.

## D. Khusus Fajri (Lenovo, Windows Intel)

- Ikuti langkah A sampai C.
- Emulator tidak wajib. Jika ingin menggunakannya, buat perangkat di Device Manager dengan system image **x86_64**, bukan x86 32-bit. Aktifkan virtualisasi di BIOS dan fitur Windows **Windows Hypervisor Platform**.
- `android/gradle.properties` saat ini sudah mencakup `arm64-v8a` untuk HP dan `x86_64` untuk emulator. Tidak perlu mengubah `reactNativeArchitectures` untuk kedua target tersebut.

## E. Khusus Refo (Windows ARM64)

Kompatibilitas Android Emulator resmi pada host Windows ARM64 belum dipastikan di panduan ini dan dapat berubah. Periksa dokumentasi Android Studio sebelum mengandalkan emulator. Rencana yang disarankan adalah menggunakan HP asli.

1. Gunakan Windows 11. Tool NDK dan CMake x64 dapat berjalan melalui emulasi x64 di Windows 11 ARM64.
2. Pasang Node.js ARM64 dan Microsoft OpenJDK 17 untuk aarch64.
3. Ikuti langkah A sampai C dengan HP Android asli.
4. Jika build native (`run-android`) gagal pada NDK atau CMake, gunakan jalur cadangan berikut:

   - Fajri membuat APK debug dari repo:

     ```powershell
     Set-Location C:\src\SmartWaterTank\android
     .\gradlew.bat app:assembleDebug
     ```

     APK berada di `android\app\build\outputs\apk\debug\app-debug.apk`.
   - Refo menyalin APK ke laptopnya, lalu memasangnya dengan `adb install -r app-debug.apk`.
   - Di laptop Refo, jalankan `npx react-native start` dari root repo, lalu pada terminal lain jalankan `adb reverse tcp:8081 tcp:8081`.
   - Perubahan JavaScript/TypeScript dapat dimuat dari Metro Refo. Build native perlu diulang jika ada perubahan paket native, misalnya menambah Notifee; build tersebut dapat dilakukan oleh Fajri.

## F. Membuat bundle dan artifact Android

Jalankan perintah dari root repo, kecuali jika ada `Set-Location android` di contoh. `reactNativeArchitectures` menentukan ABI Android yang dimasukkan ke hasil build, bukan arsitektur CPU laptop.

### 1. APK debug untuk pengujian

APK debug terhubung ke Metro dan bukan paket mandiri. Jalankan Metro di terminal terpisah sebelum membuka aplikasi.

- **Fajri (Windows Intel):** sertakan ABI HP Android 64-bit dan emulator x64:

  ```powershell
  Set-Location C:\src\SmartWaterTank\android
  .\gradlew.bat app:assembleDebug -PreactNativeArchitectures=arm64-v8a,x86_64
  ```

- **Refo (Windows ARM64):** untuk pengujian pada HP Android ARM64, build ABI tersebut saja agar build native tidak mengerjakan target emulator yang tidak dipakai:

  ```powershell
  Set-Location C:\src\SmartWaterTank\android
  .\gradlew.bat app:assembleDebug -PreactNativeArchitectures=arm64-v8a
  ```

APK dibuat di `android\app\build\outputs\apk\debug\app-debug.apk`. Dari root repo, pasang pada HP dengan:

```powershell
adb install -r .\android\app\build\outputs\apk\debug\app-debug.apk
```

Jika build native gagal di Windows ARM64, gunakan APK yang dibuat Fajri seperti langkah E; Metro tetap dijalankan dari laptop yang terhubung ke HP.

### 2. AAB release

AAB release menyertakan JavaScript bundle dan tidak memerlukan Metro saat aplikasi berjalan. Untuk menghasilkan AAB yang mencakup ABI yang dikonfigurasi repo, disarankan build dari laptop Fajri (Windows Intel):

```powershell
Set-Location C:\src\SmartWaterTank\android
.\gradlew.bat app:bundleRelease
```

File dibuat di `android\app\build\outputs\bundle\release\app-release.aab`. Untuk menguji AAB pada perangkat, gunakan bundletool atau Google Play internal testing; AAB bukan file yang dapat dipasang langsung dengan `adb install`.

Refo dapat mencoba build AAB yang hanya menargetkan HP ARM64:

```powershell
Set-Location C:\src\SmartWaterTank\android
.\gradlew.bat app:bundleRelease -PreactNativeArchitectures=arm64-v8a
```

AAB tersebut tidak mencakup ABI lain. Jika NDK/CMake gagal pada host ARM64, lakukan release build di laptop Fajri.

**Penting:** konfigurasi `release` di `android/app/build.gradle` saat ini masih menandatangani dengan debug keystore. Hasilnya hanya untuk pengujian internal; sebelum distribusi ke Play Store, tim harus mengonfigurasi keystore dan signing release yang resmi.

### 3. Membuat JavaScript bundle secara terpisah

Bundle JavaScript tidak bergantung pada arsitektur laptop. Perintah ini menghasilkan bundle produksi untuk pemeriksaan atau kebutuhan pengembangan; bundle saja bukan APK/AAB dan tidak dapat dipasang di HP.

```powershell
New-Item -ItemType Directory -Force android\app\build\outputs\bundle\assets
npx react-native bundle --platform android --dev false --entry-file index.js --bundle-output android\app\build\outputs\bundle\index.android.bundle --assets-dest android\app\build\outputs\bundle\assets
```

Untuk APK/AAB release, cukup jalankan task Gradle di atas karena React Native Gradle Plugin membuat dan memasukkan JavaScript bundle secara otomatis.

## G. Masalah umum

| Gejala | Solusi |
| --- | --- |
| `Filename longer than 260 characters` | Pastikan langkah A.4 sudah dilakukan, Windows sudah direstart, dan repo berada di `C:\src`. |
| `adb devices` kosong atau berstatus `unauthorized` | Cabut dan sambungkan kembali USB, izinkan dialog debugging di HP, lalu coba `adb kill-server` dan `adb start-server`. |
| `Another process is running on port 8081` | Tutup Metro yang lama. Jika perlu, periksa proses dengan `Get-Process node`; hentikan hanya proses Node yang dipastikan milik Metro yang macet, lalu jalankan Metro kembali. |
| `Configuring project ... without an existing directory` | Hapus hanya direktori build cache berikut, lalu build ulang: `android\build`, `android\.gradle`, `android\app\build`, dan `android\app\.cxx`. |
| Layar merah setelah aplikasi terbuka | Baca error di terminal Metro, bukan hanya di HP, lalu kirimkan error tersebut ke tim. |
| Dashboard kosong | Periksa nama koleksi, indeks Firestore, rules, akses ke proyek Firebase, dan apakah ESP32 sudah mengirim data. |
