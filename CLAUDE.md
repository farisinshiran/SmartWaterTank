# SmartWaterTank — MayoohGuard IoT Solutions

## Stack
- React Native 0.87+ (Android, iOS) + React 19
- React Native for Web via Webpack 5 (entry point terpisah: index.js untuk native, index.web.js untuk web)
- Backend: Firebase
- Hardware terkait (repo terpisah): ESP32 + sensor XKC-Y25-V, firmware dikembangkan di VSCode+PlatformIO

## Tujuan aplikasi
Dashboard monitoring level air toren secara real-timeandroid/app/google-services.json, menerima data dari sensor XKC-Y25-V via ESP32, ditampilkan di aplikasi mobile (Android/iOS) dan web dari satu codebase yang sama.

## Hal yang perlu diperhatikan agent saat mengedit
- `webpack.config.js` punya aliasing `react-native` → `react-native-web` dan isolasi paket ketat untuk hindari error `require is not defined` (CommonJS). Jangan ubah alias ini tanpa alasan kuat.
- `babel.config.js` memakai flag `disableImportExportTransform` khusus untuk build web — jangan hapus kecuali memang mengubah strategi build.
- `react` dan `react-dom` harus tetap versi sama persis (saat ini 19.2.3) untuk menghindari Version Mismatch.
- Struktur folder native (`android/`, `ios/`) jarang perlu disentuh untuk perubahan fitur biasa.

## Perintah penting
- `npm run web` — dev server web, port 8085
- `npm run build:web` — build produksi web
- `npm run android` / `npm run ios` — jalankan di emulator/device