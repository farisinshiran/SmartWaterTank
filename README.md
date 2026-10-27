This is a new [**React Native**](https://reactnative.dev) project, bootstrapped using [`@react-native-community/cli`](https://github.com/react-native-community/cli).

# Getting Started

> **Note**: Make sure you have completed the [Set Up Your Environment](https://reactnative.dev/docs/set-up-your-environment) guide before proceeding.

## Step 1: Start Metro

First, you will need to run **Metro**, the JavaScript build tool for React Native.

To start the Metro dev server, run the following command from the root of your React Native project:

```sh
# Using npm
npm start

# OR using Yarn
yarn start
```

## Step 2: Build and run your app

With Metro running, open a new terminal window/pane from the root of your React Native project, and use one of the following commands to build and run your Android or iOS app:

### Android

```sh
# Using npm
npm run android

# OR using Yarn
yarn android
```

### Membuat APK Android mandiri (tanpa Metro/USB debugger)

APK `release` menyertakan bundle JavaScript, sehingga setelah terpasang aplikasi
bisa dibuka langsung tanpa menjalankan Metro dan tanpa menghubungkan ponsel ke
debugger. Ponsel tetap memerlukan koneksi internet untuk mengambil data Firebase.

Di Windows, dari folder utama proyek:

```powershell
npm run android:apk:release
```

File APK hasil build:
`android\app\build\outputs\apk\release\app-release.apk`.
Salin/kirim file itu ke ponsel (misalnya lewat unduhan cloud), buka APK dari
ponsel, izinkan aplikasi Files/browser memasang aplikasi jika Android meminta,
lalu pilih **Install**. Pengaturan izin biasanya ada di **Settings → Apps →
Special app access → Install unknown apps**. Langkah ini hanya mengizinkan
pemasangan APK; USB debugging tidak perlu diaktifkan.

Build lokal tanpa konfigurasi signing memakai debug key proyek, cocok untuk
pengujian dan instalasi manual. Untuk membagikan APK sebagai rilis yang akan
diperbarui, buat key privat sekali dan simpan baik-baik:

```powershell
keytool -genkeypair -v -storetype PKCS12 `
  -keystore android\app\release.keystore `
  -alias smartwatertank -keyalg RSA -keysize 2048 -validity 10000
```

Buat `android\keystore.properties` (file ini diabaikan Git) dengan isi berikut
menggunakan path relatif terhadap folder `android`:

```properties
storeFile=app/release.keystore
storePassword=PASSWORD_KEYSTORE
keyAlias=smartwatertank
keyPassword=PASSWORD_KEY
```

Ganti kedua nilai password dengan yang dibuat saat menjalankan `keytool`, lalu
build ulang dengan `npm run android:apk:release`. Jangan commit atau membagikan
file keystore maupun password. Semua APK pembaruan harus memakai key yang sama
dan `versionCode` yang lebih tinggi; tanpa key lama, Android tidak dapat
memasang pembaruan di atas aplikasi yang sudah terpasang (perlu uninstall dulu,
yang menghapus data aplikasi). Jangan bagikan APK yang ditandatangani debug key
sebagai rilis publik.

### iOS

For iOS, remember to install CocoaPods dependencies (this only needs to be run on first clone or after updating native deps).

The first time you create a new project, run the Ruby bundler to install CocoaPods itself:

```sh
bundle install
```

Then, and every time you update your native dependencies, run:

```sh
bundle exec pod install
```

For more information, please visit [CocoaPods Getting Started guide](https://guides.cocoapods.org/using/getting-started.html).

```sh
# Using npm
npm run ios

# OR using Yarn
yarn ios
```

If everything is set up correctly, you should see your new app running in the Android Emulator, iOS Simulator, or your connected device.

This is one way to run your app — you can also build it directly from Android Studio or Xcode.

## Step 3: Modify your app

Now that you have successfully run the app, let's make changes!

Open `App.tsx` in your text editor of choice and make some changes. When you save, your app will automatically update and reflect these changes — this is powered by [Fast Refresh](https://reactnative.dev/docs/fast-refresh).

When you want to forcefully reload, for example to reset the state of your app, you can perform a full reload:

- **Android**: Press the <kbd>R</kbd> key twice or select **"Reload"** from the **Dev Menu**, accessed via <kbd>Ctrl</kbd> + <kbd>M</kbd> (Windows/Linux) or <kbd>Cmd ⌘</kbd> + <kbd>M</kbd> (macOS).
- **iOS**: Press <kbd>R</kbd> in iOS Simulator.

## 🌐 Integrasi React Native for Web (Manual Setup)

Project ini telah diintegrasikan dengan **React Native for Web** secara manual untuk mendukung platform browser (Web-based) menggunakan **Webpack 5** dan disesuaikan dengan arsitektur **React 19 / React Native 0.87+**.

### 🛠️ Fitur & Konfigurasi yang Diterapkan
1. **Entry Point Terpisah:** Menggunakan `index.web.js` khusus untuk inisialisasi rendering Web berbasis `createRoot` (React 19).
2. **Bundler Webpack 5:** Konfigurasi `webpack.config.js` dengan fitur *aliasing* (`react-native` ke `react-native-web`) serta isolasi ketat paket agar terhindar dari error *CommonJS* (`require is not defined`).
3. **Babel Smart Sync:** Modifikasi `babel.config.js` menggunakan flag `disableImportExportTransform` untuk menonaktifkan konversi modul server ketika aplikasi di-build untuk lingkungan web.
4. **Sinkronisasi Versi:** Memastikan `react` dan `react-dom` terkunci pada versi yang sama (`19.2.3`) guna menghindari kendala *Version Mismatch*.

### 🚀 Cara Menjalankan di Lingkungan Web

Pastikan dependensi web telah terpasang, kemudian jalankan perintah berikut:

```bash
# Menjalankan server development web (Port: 8085)
npm run web

# Membuat build produksi untuk deployment web
npm run build:web
```

Aplikasi web dapat diakses melalui browser di alamat [http://localhost:8085](http://localhost:8085).

## Firebase Firestore

Aplikasi memakai database Firestore Standard `(default)` pada project
`smart-water-tank-e49d6`. ESP32 menulis koleksi `telemetry_logs` dengan field
`tankId`, `sensor20Percent`, `sensor90Percent`, `pumpStatusRead`, dan
`createdAt` (Firestore Timestamp). `sensor20Percent=true` menampilkan level 20%;
`sensor90Percent=true` menampilkan level 90%. Riwayat lama `sensor50Percent`
tetap dibaca sebagai data historis selama migrasi, tetapi Rules baru hanya
menerima field `sensor20Percent`.

### Alarm dan penerima

- `sensor20Percent=false` dan `sensor90Percent=false` selama 2 menit: Peringatan
  level di bawah 20%.
- `sensor90Percent=true`: Kritis potensi meluap.
- Tidak ada telemetry baru selama 5 menit: Kritis sensor terputus (pengelola).
- Semua anggota aktif pada `tank_members/{tankId}/members/{uid}` menerima
  peringatan level rendah dan potensi meluap pada in-app serta semua perangkat
  push yang telah mengaktifkan izin. Sensor terputus hanya dikirim kepada anggota
  dengan `isManager=true`.
- Peringatan Kritis diulang tiap 15 menit per anggota sampai anggota tersebut
  mengakui notifikasi. Saat kondisi pulih, statusnya diselesaikan otomatis.
- Alarm tetap dievaluasi dan dicatat saat dinonaktifkan; tidak ada push sampai
  alarm diaktifkan kembali. Aktivasi ulang mengirim satu notifikasi untuk
  kondisi aktif.
- Tes notifikasi hanya dikirim ke akun yang meminta tes dan seluruh perangkat
  push aktif milik akun tersebut.
- Saat aplikasi Android ditutup biasa, payload notifikasi FCM dapat ditampilkan
  oleh sistem operasi tanpa proses aplikasi berjalan. Android Force stop dapat
  menahan pesan sampai aplikasi dibuka kembali. Web Push berjalan melalui
  service worker dengan izin browser dan HTTPS.
- Jika perangkat penerima kehilangan koneksi data, push tidak dapat tampil saat
  perangkat offline; FCM dapat menunda pengantaran sampai perangkat tersambung
  lagi. Notifikasi tetap tersimpan di Firestore dan akan muncul di aplikasi
  setelah koneksi pulih. Waktu pengantaran push tidak dijamin.

### Status provisioning Firebase

Hosting Web, Firestore Rules, dan Firestore indexes sudah dideploy ke project
`smart-water-tank-e49d6`. Dokumen `alarm_settings`, dokumen keanggotaan, dan
Cloud Functions belum diprovision/dideploy. Cloud Functions ditahan karena
project masih menggunakan paket Spark.

1. Aktifkan provider Email/Password melalui Firebase Console → Authentication
   → Sign-in method. Provider Auth tidak dideploy oleh `firebase.json`.

2. Buat dokumen alarm awal dan keanggotaan menggunakan Admin SDK. Skrip
   `functions/scripts/provision-initial.js` hanya membuat dokumen baru dan
   berhenti jika dokumen alarm sudah ada atau keanggotaan memiliki nilai berbeda;
   skrip tidak menimpa dokumen yang ada. Jalankan di lingkungan tepercaya yang
   memiliki Application Default Credentials dengan izin Firebase Authentication
   dan Firestore Admin. Jangan menyimpan service-account key di repository.

   Untuk memeriksa rencana tanpa menulis data:

   ```sh
   npm --prefix functions run provision:initial -- --dry-run \
     --member <ANGGOTA_UID> --member <MANAGER_UID> --manager <MANAGER_UID>
   ```

   Setelah UID anggota diverifikasi di Firebase Authentication, jalankan dengan
   UID yang sebenarnya:

   ```sh
   npm --prefix functions ci
   npm --prefix functions run provision:initial -- \
     --member <ANGGOTA_UID> --member <MANAGER_UID> --manager <MANAGER_UID>
   ```

   Tambahkan pasangan `--member <UID>` untuk setiap anggota. Tandai manager
   dengan `--manager <UID>`; UID manager juga harus muncul sebagai anggota.
   Manager menerima alarm sensor offline; semua anggota aktif menerima
   peringatan 20% dan 90%. Akun baru tidak dapat membaca data atau menerima
   alarm sebelum ditambahkan sebagai anggota.

3. Untuk Web Push, ambil public VAPID key dari Firebase Console → Project
   Settings → Cloud Messaging → Web Push certificates dan isi
   `WEB_PUSH_VAPID_KEY` di `src/config/firebase.web.ts`. Hosting harus memakai
   HTTPS. Tambahkan `smart-water-tank-e49d6.web.app` (dan domain custom jika
   dipakai) pada Firebase Console → Authentication → Settings → Authorized
   domains. Jangan menaruh private key di aplikasi.

4. Firestore Rules dan indexes sudah dideploy. Setelah project beralih ke Blaze
   dan backend server-side alarm siap, deploy Cloud Functions:

   ```sh
   firebase deploy --only functions --project smart-water-tank-e49d6
   ```

   Cloud Functions memakai region `asia-southeast1`; scheduler memeriksa sensor
   dan pengulangan alarm tiap menit. Scheduled Functions/Cloud Scheduler
   memerlukan project Firebase dengan billing Blaze. Project Spark tidak dapat
   men-deploy Cloud Functions ini. Blaze adalah pay-as-you-go; pantau pemakaian
   dan biaya project.

5. Bangun ulang Web agar `firebase-messaging-sw.js` tersalin ke `dist`:

   ```sh
   npm run build:web
   ```

   Android perlu `POST_NOTIFICATIONS` pada Android 13+ dan izin notifikasi
   pengguna. iOS perlu konfigurasi APNs/Push Notifications di Firebase Console,
   Apple Developer dan Xcode, lalu `pod install` setelah dependency native
   berubah.

Firestore Rules dan indexes berada di `firestore.rules` dan
`firestore.indexes.json`. Rules bersifat prototype dan perlu diuji serta
ditinjau sebelum produksi. Aturan tulis telemetry mempertahankan syarat
autentikasi perangkat yang ada karena identitas penulis ESP32 belum
terverifikasi; dengan Auth email/password baru, aturan tersebut belum
membedakan akun manusia dari perangkat. Jangan publikasikan kredensial perangkat.


## Congratulations! :tada:

You've successfully run and modified your React Native App. :partying_face:

### Now what?

- If you want to add this new React Native code to an existing application, check out the [Integration guide](https://reactnative.dev/docs/integration-with-existing-apps).
- If you're curious to learn more about React Native, check out the [docs](https://reactnative.dev/docs/getting-started).

# Troubleshooting

If you're having issues getting the above steps to work, see the [Troubleshooting](https://reactnative.dev/docs/troubleshooting) page.

# Learn More

To learn more about React Native, take a look at the following resources:

- [React Native Website](https://reactnative.dev) - learn more about React Native.
- [Getting Started](https://reactnative.dev/docs/environment-setup) - an **overview** of React Native and how setup your environment.
- [Learn the Basics](https://reactnative.dev/docs/getting-started) - a **guided tour** of the React Native **basics**.
- [Blog](https://reactnative.dev/blog) - read the latest official React Native **Blog** posts.
- [`@facebook/react-native`](https://github.com/facebook/react-native) - the Open Source; GitHub **repository** for React Native.
