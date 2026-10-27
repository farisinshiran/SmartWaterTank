# SmartWaterTank — Demo Guide

Panduan lengkap untuk mendemonstrasikan sistem SmartWaterTank tanpa hardware ESP32.

---

## 📋 Daftar Isi

1. [Persiapan](#persiapan)
2. [Menjalankan Aplikasi](#menjalankan-aplikasi)
3. [Setup Data Demo](#setup-data-demo)
4. [Panel Demo](#panel-demo)
5. [Fitur & Status](#fitur--status)
6. [Arsitektur Sistem](#arsitektur-sistem)
7. [Troubleshooting](#troubleshooting)

---

## 1. Persiapan

### Kebutuhan

- Node.js 18+
- npm atau yarn
- Akun Firebase project `smart-water-tank-e49d6` (akses Editor+)
- (Opsional) Android Studio / emulator untuk build Android

### Service Account

Download private key Firebase Admin SDK:

1. Buka [Firebase Console](https://console.firebase.google.com/project/smart-water-tank-e49d6)
2. **Project Settings → Service Accounts → Generate new private key**
3. Simpan sebagai `scripts/service-account.json`

> ⚠️ **Jangan commit** `service-account.json` ke Git. File ini sudah ada di `.gitignore`.

### Instalasi Dependensi

```bash
cd SmartWaterTank
npm install
```

---

## 2. Menjalankan Aplikasi

### Web (Rekomendasi untuk demo)

```bash
npm run web
# Dev server berjalan di http://localhost:8085
```

### Android

```bash
npm run android
# Atau: cd android && ./gradlew assembleDebug && adb install app/build/outputs/apk/debug/app-debug.apk
```

### iOS

```bash
npm run ios
```

---

## 3. Setup Data Demo

### Jalankan Seed Script

```bash
GOOGLE_APPLICATION_CREDENTIALS=./scripts/service-account.json \
  node scripts/seed-firestore.js
```

**Atau** menggunakan environment variable:

```bash
# Windows (PowerShell)
$env:GOOGLE_APPLICATION_CREDENTIALS="./scripts/service-account.json"
node scripts/seed-firestore.js

# Windows (CMD)
set GOOGLE_APPLICATION_CREDENTIALS=scripts\service-account.json
node scripts/seed-firestore.js
```

### Apa yang di-seed:

| Collection | Data |
|---|---|
| `telemetry_logs` | 30 entri riwayat sensor (4 jam terakhir, interval 8 menit) |
| `alarm_settings/{tankId}` | Alarm enabled = true |
| `tank_members/{tankId}/members/{uid}` | Demo user membership (active: true) |
| `user_notifications/{uid}/items` | 3 notifikasi contoh (LOW_LEVEL, OVERFLOW, SENSOR_OFFLINE) |
| `tanks/{tankId}/sensors/latest` | Snapshot sensor terakhir (sensor20=ON, pump=OFF) |

### UID Demo

Seed script menggunakan UID placeholder: `demo-user-uid-001`

Jika Anda sign up dengan email baru, UID-nya akan berbeda. Untuk mengakses tank, perlu dilakukan salah satu:

**Opsi A**: Update `DEMO_UID` di seed script ke UID Anda:

```javascript
// scripts/seed-firestore.js baris ~23
const DEMO_UID = 'YOUR-ACTUAL-UID-HERE';
```

**Opsi B**: Cek UID Anda di console browser/React Native DevTools, lalu jalankan:

```bash
# Gunakan UID Anda di sini
firebase firestore:update tank_members/toren-gedung-a-01/members/YOUR_UID \
  --data '{"active": true, "isManager": true}'
```

---

## 4. Panel Demo

Tekan tombol **🎮 DEMO** di pojok kanan bawah layar untuk membuka panel demo.

### Tab Skenario

Terdapat 6 skenario sensor yang bisa disimulasikan:

| Skenario | sensor20 | sensor90 | pump | Warna |
|---|---|---|---|---|
| 🚰 Toren Kosong | OFF | OFF | OFF | Merah |
| 💧 Sedang Mengisi | ON | OFF | OFF | Biru |
| ⚡ Pompa Menyala | ON | OFF | ON | Orange |
| 🔵 Toren Penuh | ON | ON | OFF | Hijau |
| 🚨 OVERFLOW! | ON | ON | ON | Merah gelap |
| 📉 Toren Mengalir | OFF | ON | OFF | Ungu |

Klik tombol skenario → data telemetry dikirim ke Firestore → Dashboard update real-time.

**"📊 Generate 5 Data Riwayat Acak"** — mengirim 5 data berurutan dengan interval singkat untuk melihat animasi chart di tab Riwayat.

### Tab Arsitektur

Diagram interaktif arsitektur sistem:

- Klik node untuk melihat penjelasan detail
- Telusuri alur nilai sensor 90% langkah-demi-langkah (6 langkah dari ESP32 ke NotificationCenter)

### Tab Status

Status implementasi semua fitur:

- ✅ **Berfungsi** — berjalan normal
- ⚠️ **Parsial** — berjalan tapi dengan keterbatasan
- ❌ **Belum Tersedia** — belum diimplementasi

---

## 5. Fitur & Status

### ✅ Berfungsi

| Fitur | Keterangan |
|---|---|
| **Dashboard** | Metrik sensor, visualisasi tank, status pompa update real-time |
| **Riwayat** | Chart level air dari 30 data telemetry terbaru di Firestore |
| **Notifikasi (dalam-app)** | Alarm toggle, tombol aktifkan push, daftar 5 notifikasi terbaru |
| **Autentikasi** | Firebase Auth dengan email/password |

### ⚠️ Parsial

| Fitur | Keterangan | Penyebab |
|---|---|---|
| **Push Notification** | Alarm toggle & notifikasi dalam-app berfungsi, tapi push memerlukan build langsung | FCM push memerlukan APK langsung (bukan Expo Dev) + perangkat fisik. Simulator tidak menerima push |
| **Keanggotaan Toren** | Membership perlu didaftarkan manual | UID dari Firebase Auth tidak cocok dengan UID demo di seed script |
| **Incident Management** | Cloud Functions membuat incident otomatis, screen menampilkan | Tombol "Akui" perlu write permission dari client |
| **Monitor Screen** | Screen alternatif tersedia | Data source berbeda (RTDB vs Firestore) perlu disinkronkan |

### ❌ Belum Tersedia

| Fitur | Keterangan | Penyebab |
|---|---|---|
| **AI Chat Assistant** | Screen Chat ada tapi koneksi gagal | Olagon API key belum diset di environment |

---

## 6. Arsitektur Sistem

```
┌──────────────┐     HTTP PUT      ┌────────────────────┐
│    ESP32     │ ────────────────→ │  Firebase RTDB     │
│ XKC-Y25-V    │                   │ tanks/{tankId}/    │
│ (IoT Device) │                   │ sensors/latest     │
└──────────────┘                   └────────┬───────────┘
                                           │ onValue
                                           ▼ (subscribe)
┌──────────────┐                   ┌────────────────────┐
│ React Native │ ←─────────────── │   useTankMonitor    │
│   App         │   WaterLevel     │   useTelemetry      │
│               │   Hook           │   (hooks)           │
└──────┬───────┘                   └────────┬───────────┘
       │                                     │
       │                                     │ onSnapshot
       │                                     ▼ (subscribe)
       │                            ┌────────────────────┐
       │                            │  Cloud Firestore   │
       │                            │ telemetry_logs/     │
       │                            └────────┬───────────┘
       │                                     │ onWrite
       │                                     ▼ (trigger)
       │                            ┌────────────────────┐
       │                            │  Cloud Functions   │
       │                            │  (incident gen)    │
       │                            └────────┬───────────┘
       │                                     │ FCM Push
       ▼                                     ▼
┌────────────────────┐            ┌────────────────────┐
│  NotificationCenter│ ←───────── │   Mobile Device    │
│  (dalam-app alerts)│            │   (push token)     │
└────────────────────┘            └────────────────────┘
```

### Alur Data Lengkap (sensor 90% aktif)

```
1. ESP32 mendeteksi air触碰 sensor kapasitif
   → sensor90Percent = true

2. Firebase RTDB menerima PUT
   /tanks/toren-gedung-a-01/sensors/latest
   → listener langsung memicu

3. useTankMonitor hook menerima update
   → waterLevel dihitung → 'FULL'

4. DashboardApp TankCard animasi fill ke 90%
   → MetricCard menampilkan '90%'

5. Cloud Functions onWrite trigger
   → incident OVERFLOW dibuat
   → FCM push dikirim ke perangkat

6. NotificationCenter menerima push
   → menampilkan 'Peringatan potensi meluap'
```

---

## 7. Troubleshooting

### App menampilkan layar kosong setelah login

**Penyebab**: UID Anda belum ada di `tank_members/{tankId}/members/{uid}`.

**Solusi**:
1. Buka DevTools/console, cari nilai `uid` dari user object
2. Jalankan perintah Firestore update atau seed ulang dengan UID Anda

### Dashboard tidak update setelah klik skenario demo

**Penyebab**: Hook `useTelemetry` membaca dari Firestore dengan `onSnapshot`. Ada jeda ~1-2 detik.

**Solusi**: Tunggu 2-3 detik. Jika tidak ada update, cek console untuk error Firestore permission.

### Seed script gagal dengan "Permission denied"

**Penyebab**: Service account tidak memiliki akses Editor ke project.

**Solusi**:
1. Pastikan service account dari project `smart-water-tank-e49d6`
2. Cek IAM role → Service Account → Editor atau Owner

### Push notification tidak muncul

**Penyebab normal**: FCM tidak mengirim ke emulator/simulator.

**Solusi untuk demo**: Gunakan notifikasi dalam-app (NotificationCenter) sebagai gantinya. Push notification berfungsi di perangkat fisik dengan build APK langsung.

### Web build error

**Error**: `require is not defined`

**Solusi**: Pastikan `babel.config.js` memiliki `disableImportExportTransform: true` untuk web dan `webpack.config.js` menggunakan alias `react-native-web`. Jangan ubah konfigurasi ini.

---

## 📁 Struktur File Demo

```
SmartWaterTank/
├── scripts/
│   └── seed-firestore.js       # Seed data ke Firestore
├── src/
│   └── view/components/
│       └── DemoControlPanel.tsx # Panel demo (floating UI)
├── DEMO_GUIDE.md               # Dokumen ini
└── App.tsx                     # Entry point (imports DemoControlPanel)
```
