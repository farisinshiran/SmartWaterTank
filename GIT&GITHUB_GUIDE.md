# 🛠️ PART 1: Breakdown Langkah Git \& GitHub (Untuk Tim Awam)

Panduan ini dirancang khusus untuk anggota tim yang baru pertama kali menggunakan Git dan GitHub. Ikuti 5 langkah berurutan berikut ini dengan teliti.

### Langkah 1: Instalasi \& Pembuatan Akun (Hanya 1x di Awal)

1. **Download Git:** Buka situs [git-scm.com](https://git-scm.com) di laptop masing-masing, unduh versi Windows/Mac yang sesuai, lalu instal dengan klik *Next* sampai selesai.
2. **Daftar GitHub:** Buka [github.com](https://github.com) dan buat akun menggunakan email aktif (disarankan email kampus/kerja).
3. **Download VS Code:** Jika belum ada, unduh dan instal [://visualstudio.com](https://://visualstudio.com/) sebagai editor kode utama Anda.

### Langkah 2: Perkenalan Diri ke Laptop (Konfigurasi Global)

Buka aplikasi **Git Bash** (untuk Windows) atau **Terminal** (untuk Mac), lalu ketik dua perintah ini secara berurutan agar GitHub tahu siapa yang menulis kode:

```bash
git config --global user.name "Nama Lengkap Anda"
git config --global user.email "email\_anda@example.com"
```

### Langkah 3: Mengambil Proyek dari GitHub (Clone)

Setelah ketua tim memasukkan email Anda ke menu *Settings > Collaborators* di web GitHub dan Anda menerima undangannya, unduh proyek ke laptop Anda dengan cara:

1. Buka terminal di VS Code, lalu ketik perintah berikut:

```bash
   git clone https://github.comusername-ketua/SmartWaterTank.git
   ```

2. Buka folder hasil download tersebut menggunakan VS Code (`File > Open Folder`).

### Langkah 4: Membuat "Kamar Kerja" Sendiri (Branching)

**PANTANGAN:** Jangan pernah mengubah kode langsung di kamar utama (`main`). Setiap anggota tim wajib membuat kamar kerjanya sendiri agar kodenya tidak saling menimpa atau tabrakan:

```bash
# Membuat dan otomatis pindah ke kamar kerja baru sesuai tugas masing-masing
git checkout -b feature/nama-tugas-anda
```

### Langkah 5: Menyimpan \& Mengirim Kode (Commit \& Push)

Setelah selesai mengetik atau mengubah kode di VS Code, jalankan ritual 4 perintah ini untuk mengirim hasil kerja Anda ke awan GitHub:

```bash
# 1. Cek file apa saja yang telah Anda ubah yaa
git status

# 2. Bungkus semua file yang diubah untuk bersiap disimpan
git add .

# 3. Beri label penjelasan pada bungkusan tersebut (gunakan format prefix feat/fix)
git commit -m "feat: membuat tampilan halaman login"

# 4. Kirim bungkusan kode ke awan GitHub
git push origin feature/nama-tugas-anda
```

*Catatan: Setelah langkah push berhasil, buka halaman repositori proyek di web GitHub untuk mengeklik tombol hijau **"Create Pull Request"**.*

\---

# 📋 PART 2: Detail GitHub Issues Proyek (Untuk 3 Orang Tim)

Gunakan draf di bawah ini untuk membuat *Issues* baru langsung di menu **Issues** repositori GitHub proyek **SmartWaterTank** Anda.

### 👤 Anggota Tim 1: Developer IoT Hardware (Layer 1 \& 2)

* **Judul Issue:** `feat(hardware): Konfigurasi ESP32, Sensor XKC-Y25-V, dan Protokol MQTTS (opsional) `
* **Deskripsi Issue:**

```markdown
  ### Deskripsi Tugas
  Bertanggung jawab penuh pada Layer 1 (Perception) dan Layer 2 (Network) sesuai standar arsitektur 5-Layer IoT. Anda bertugas merakit hardware komponen dan menulis kode pemrograman mikrokontroler.

  ### Kriteria Selesai (Checklist):
  - \[ ] Membuat skrip C++ (.ino) di Arduino IDE atau VS Code PlatformIO untuk mikrokontroler ESP32.
  - \[ ] Mengimplementasikan logika \*Software Debouncing\* (validasi sinyal biner dari sensor wajib stabil selama 3 detik sebelum status tangki dianggap berubah).
  - \[ ] Mengonfigurasi koneksi Wi-Fi Kampus 2.4 GHz menggunakan library `WiFiClientSecure` atau sejenisnya.
  - \[ ] Menghubungkan ESP32 ke EMQX Broker melalui protokol MQTTS terenkripsi TLS 1.3 pada Port 8085.
  - \[ ] Memastikan payload data terkirim secara periodik (Report-by-Exception / Heartbeat) dalam format JSON terisolasi: `{"tankId": "toren-gedung-a-01", "sensor50Percent": bool, "sensor90Percent": bool, "pumpStatusRead": "string"}`.
  ```

### 👤 Anggota Tim 2: Backend \& Cloud Engineer (Layer 3)

* **Judul Issue:** `feat(backend): Setup Firebase Firestore \& Integrasi Data Webhook EMQX`
* **Deskripsi Issue:**

```markdown
  ### Deskripsi Tugas
  Bertanggung jawab pada Layer 3 (Processing/Middleware). Anda bertugas mengelola jembatan data dari broker MQTT ke Cloud Database serta merancang mesin pendeteksi bahaya otomatis (Anomaly Engine).

  ### Kriteria Selesai (Checklist):
  - \[ ] Membuat Proyek di Firebase Console dan mengaktifkan Cloud Firestore DB dalam \*Test Mode\*.
  - \[ ] Membuat struktur data awal berupa koleksi master data bernama `tanks` dan koleksi log riwayat bernama `telemetry\_logs`.
  - \[ ] Menghubungkan EMQX Data Integration ke Firebase menggunakan jalur Webhook HTTP POST JSON.
  - \[ ] Memastikan ID dokumen Firestore log menggunakan pola flat: `tankId\_epoch` (contoh: `toren-gedung-a-01\_1758300000`) demi mencegah tumpang tindih data histori dan memudahkan optimasi query.
  - \[ ] Menulis logika \*Anomaly Engine\*: Jika `sensor90Percent` bernilai `true` (penuh) namun `pumpStatusRead` masih `ON` selama lebih dari 10 detik, otomatis buat dokumen baru di koleksi `incidents` dengan status `ACTIVE` dan jenis `CRITICAL\_OVERFLOW`.
  ```

### 👤 Anggota Tim 3: Frontend UI/UX Developer (Layer 4)

* **Judul Issue:** `feat(frontend): Implementasi Unified Codebase React Native for Web \& Mobile App`
* **Deskripsi Issue:**

```markdown
  ### Deskripsi Tugas
  Bertanggung jawab pada Layer 4 (Application). Anda bertugas menyusun antarmuka aplikasi menggunakan sistem satu kode (Unified Codebase) yang aman dibuka di HP Infinix fisik (Mobile) maupun browser PC laptop (Web).

  ### Kriteria Selesai (Checklist):
  - \[ ] Memasang berkas `firebaseConfig.js` dan mengonfigurasi file jembatan `firebase.js` dengan teknik isolasi `require()` dinamis agar Webpack 5 tidak crash akibat dependensi native browser (`require is not defined`).
  - \[ ] Menghubungkan data Firestore menggunakan metode `onSnapshot` agar seluruh tampilan UI sinkron secara \*real-time\* tanpa perlu memuat ulang halaman.
  - \[ ] \*\*Sisi Web (Staf Sarpras):\*\* Membuat halaman dasbor grafik perkembangan histori air harian yang responsif saat monitor browser dilebarkan.
  - \[ ] \*\*Sisi Mobile (Pak Baban):\*\* Mengintegrasikan listener ke koleksi `incidents` berstatus `ACTIVE` dan menghubungkannya dengan pustaka \*\*Notifee\*\* untuk membunyikan alarm suara keras di HP Android.
  ```

