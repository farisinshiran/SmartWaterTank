# 🛠️ Panduan Troubleshooting & Perintah Mandat (React Native + Web)

Dokumen ini merangkum kendala-kendala umum yang sering terjadi selama proses pengembangan aplikasi ini beserta perintah terminal (`bash`) untuk menyelesaikannya secara instan.

---

## 1. Masalah Koneksi: Aplikasi di HP Tidak Mau Terhubung ke Server (Error: "Unable to load script")

### 🔴 Gejala
Layar HP berwarna merah dengan pesan *“Unable to load script. Make sure you're running Metro...”*.

### 💡 Penyebab
HP (terutama perangkat fisik melalui USB) tidak dapat menemukan jalur port ke server Metro Bundler yang berjalan di komputer Anda.

### 🛠️ Solusi & Perintah Bash
Jalankan perintah ini di terminal komputer Anda untuk menjembatani koneksi port jaringan, lalu tekan **RELOAD (R, R)** pada HP:

```bash
# Melakukan reverse port dari HP ke Komputer (Default Port: 8081)
adb reverse tcp:8081 tcp:8081
```

---

## 2. Masalah Cache / Modul Rusak (Error 500: "Cannot read properties of undefined reading 'get'")

### 🔴 Gejala
Layar HP merah dengan kode *“The development server returned response error code: 500”* dan log error menunjuk ke folder `metro\src\node-haste\DependencyGraph.js`.

### 💡 Penyebab
Cache dari Metro Bundler atau folder `node_modules` mengalami tumpang tindih (*corrupt*), sering terjadi setelah melakukan perpindahan branch Git atau ketidakcocokan versi Node.js.

### 🛠️ Solusi & Perintah Bash
Lakukan pembersihan cache secara menyeluruh (pilih skrip sesuai package manager yang disepakati):

**Opsi A: Reset Cache Metro Saja (Coba ini dulu)**
```bash
# Memulai server Metro dengan membersihkan cache lama
npx react-native start --reset-cache
# atau jika menggunakan yarn:
yarn start --reset-cache
```

**Opsi B: Hard Reset / Pembersihan Total (Jika Opsi A Gagal)**
Jika error tetap membandel, jalankan rangkaian perintah ini di terminal root proyek Anda untuk membersihkan build Android dan menginstal ulang semua library:
```bash
# 1. Hapus folder modul dan file lock lama
rm -rf node_modules package-lock.json yarn.lock

# 2. Bersihkan cache internal npm
npm cache clean --force

# 3. Install ulang seluruh dependensi proyek
npm install

# 4. Masuk ke folder android dan bersihkan sisa build gradle lama
cd android && ./gradlew clean && cd ..

# 5. Jalankan kembali proyek dengan kondisi bersih
npx react-native start --reset-cache
```

---

## 3. Masalah Git: Terdeteksi "0 files changed" Saat Ingin Merge ke `main`

### 🔴 Gejala
Halaman Pull Request di GitHub menunjukkan status *“Able to merge”* namun tertulis *“Showing 0 changed files”*.

### 💡 Penyebab
Arah perbandingan (*comparison direction*) di GitHub terbalik, di mana branch tujuan (*base*) diatur ke branch fitur Anda sendiri sedangkan branch sumber (*compare*) diatur ke `main`.

### 🛠️ Solusi
Masalah ini diselesaikan langsung pada antarmuka (UI) GitHub tanpa perintah bash:
1. Masuk ke halaman **Compare changes** atau **Pull Request**.
2. Pastikan susunan dropdown arah panah adalah: `base: main` ← `compare: feature/react-native-web`.

---

## 🗂️ Rangkuman Fungsi Perintah Utama (Cheat Sheet)

| Perintah Terminal (`bash`) | Fungsi Utama | Kapan Harus Digunakan? |
| :--- | :--- | :--- |
| `adb reverse tcp:8081 tcp:8081` | Menyambungkan jembatan data port 8081 komputer ke HP Android fisik lewat kabel data. | Setiap kali HP tidak bisa *load script* / kehilangan koneksi ke komputer. |
| `npx react-native start --reset-cache` | Menjalankan server Metro pembaca kode sambil membuang berkas sampah/cache lama. | Ketika kode baru di komputer tidak berubah di HP atau terjadi Error 500. |
| `cd android && ./gradlew clean && cd ..` | Menghapus seluruh riwayat kompilasi instan (*build artifacts*) di sisi Android asli. | Saat terjadi error kompilasi kode Java/Kotlin di Android Studio setelah memperbarui library. |
| `rm -rf node_modules && npm install` | Menghapus total seluruh library pihak ketiga dan mengunduh ulangnya dari awal. | Solusi terakhir jika terjadi kerusakan struktur folder dependensi tim. |
