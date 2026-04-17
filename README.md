<div align="center">
  <img src="images/logo-dark.jpeg" alt="iMortifex Logo" width="90" style="border-radius:16px"/>
  <h1>iMortifex</h1>
  <p><strong>another dimension</strong></p>
  <p>Telegram Mini App untuk layanan iPhone — iCloud Unlock, Bypass MDM, IMEI Activation & lebih banyak lagi.</p>

  ![Version](https://img.shields.io/badge/version-2.1-gold)
  ![Platform](https://img.shields.io/badge/platform-Telegram%20Mini%20App-blue)
  ![License](https://img.shields.io/badge/license-Private-red)
</div>

---

## 📱 Tentang iMortifex

**iMortifex** adalah Telegram Mini App yang memudahkan pengguna memesan berbagai layanan iPhone secara cepat dan aman langsung dari dalam Telegram. Transaksi menggunakan sistem **iCoin** (1 iCoin = Rp 1.000) dengan metode pembayaran via QRIS.

### ✨ Fitur Utama

| Fitur | Keterangan |
|-------|-----------|
| 💎 **Wallet iCoin** | Saldo digital dengan tampilan real-time |
| 🛍️ **Katalog Layanan** | Produk iPhone dengan status aktif/nonaktif |
| 📋 **Riwayat Order** | Lacak semua order dengan filter status |
| 💳 **Top Up** | QRIS, BCA, Mandiri |
| 🎟️ **Voucher Diskon** | Kode promo dengan berbagai tipe |
| ⚙️ **Admin Panel** | Dashboard lengkap untuk manajemen |
| 🌙 **Dark / Light Mode** | Toggle tema dengan animasi halus |

---

## 🛠️ Layanan yang Tersedia

- ☁️ **iCloud Unlock Resmi** — Unlock iCloud activation lock secara resmi
- 🔓 **Bypass MDM Permanen** — Hapus profil MDM dari iPhone
- 🌍 **Ganti Region iPhone** — Ubah region dari luar negeri ke Indonesia
- 📱 **Aktivasi iPhone Second** — Aktivasi iPhone yang terkunci akun iCloud pemilik lama
- 📊 **Cek Status Blacklist IMEI** — Cek blacklist jaringan operator
- 🔓 **Unlock Carrier AT&T** — Unlock network lock AT&T USA
- ⏱️ **IMEI 3 Bulan** — Aktivasi IMEI (Instant & Slow)

---

## 🏗️ Tech Stack

```
Frontend    : HTML5 + Vanilla CSS + Vanilla JavaScript
Platform    : Telegram WebApp (Mini App)
Backend     : Google Apps Script (GAS) + Google Sheets
Fonts       : Sora + Space Mono (Google Fonts)
Payment     : QRIS (GPN)
```

---

## 📁 Struktur Project

```
Proj-iMortifex/
├── index.html          # Halaman utama (semua halaman dalam satu file)
├── css/
│   └── style.css       # Styling lengkap (dark + light theme)
├── js/
│   └── app.js          # Logic utama (API calls, UI, admin panel)
└── images/
    ├── logo-dark.jpeg  # Logo untuk dark mode
    ├── logo-light.jpeg # Logo untuk light mode
    └── qris.jpeg       # Gambar QRIS pembayaran
```

---

## 🚀 Setup & Development

### Prasyarat
- Python / Node.js / any HTTP server (untuk dev local)
- Akun Telegram dengan akses ke bot `@iMortifex_bot`
- Google Apps Script sebagai backend

### Menjalankan Secara Lokal (Dev Mode)

```bash
# 1. Clone repository
git clone https://github.com/adrilhutama/iMortifexBOT.git
cd iMortifexBOT

# 2. Jalankan local server
python -m http.server 8787

# 3. Buka di browser dengan dev mode bypass
# http://localhost:8787/index.html?dev=1
```

> **⚠️ Catatan:** Parameter `?dev=1` hanya aktif di `localhost`. Di production, app hanya bisa dibuka dari Telegram WebApp.

### Konfigurasi (`js/app.js`)

```javascript
const GAS_URL      = "https://script.google.com/..."; // URL Google Apps Script
const SECRET_TOKEN = "...";                            // Token autentikasi GAS
const ADMIN_IDS    = ["794732662"];                    // Telegram ID admin
const COIN_RATE    = 1000;                             // 1 iCoin = Rp 1.000
```

---

## 🔐 Keamanan

- ✅ **Telegram Gate** — App hanya bisa diakses dari Telegram WebApp
- ✅ **Admin Verification** — Cek admin ID dilakukan di frontend dan **wajib** di GAS backend
- ✅ **Secret Token** — Setiap request ke GAS membutuhkan `SECRET_TOKEN`
- ⚠️ **Pastikan GAS backend** memverifikasi `user_id` untuk semua action `admin_*`

---

## 📲 Cara Menggunakan

1. **Buka** bot `@iMortifex_bot` di Telegram
2. **Daftar** akun & dapatkan saldo iCoin via Top Up
3. **Pilih layanan** dari katalog yang tersedia
4. **Masukkan IMEI** perangkat (dial `*#06#`)
5. **Konfirmasi order** dan tunggu proses dari tim kami

---

## 💳 Cara Top Up iCoin

1. Buka menu **Top Up iCoin**
2. Pilih nominal (min. Rp 10.000)
3. Pilih metode: **QRIS** (semua e-wallet & m-banking)
4. Transfer sesuai nominal
5. Kirim bukti transfer ke admin via Telegram
6. Saldo akan diproses **max 15 menit**

---

## 👨‍💼 Admin Panel

Admin Panel tersedia khusus untuk akun dengan ID Telegram yang terdaftar di `ADMIN_IDS`. Fitur:

- 📊 **Dashboard** — Statistik revenue, user, order
- 💳 **Manajemen Top Up** — Approve/reject request top up
- 📦 **Kelola Order** — Update status order (Pending/Process/Done/Failed)
- 🔧 **Kelola Produk** — Toggle aktif/nonaktif layanan
- 👥 **Manajemen User** — Lihat & adjust saldo user
- 🎟️ **Voucher** — Buat & kelola voucher diskon
- ⚙️ **Settings** — Toggle promo, fake activity, pesan promo

---

## 📞 Kontak

| Channel | Info |
|---------|------|
| 🤖 Bot Telegram | [@iMortifex_bot](https://t.me/iMortifex_bot) |
| 👤 Admin | [@Caz0rla](https://t.me/Caz0rla) |
| ⏰ Jam Operasional | 08.00 – 22.00 WIB |

---

## 📄 Lisensi

Project ini bersifat **private** dan hanya untuk keperluan internal iMortifex. Dilarang mendistribusikan atau memodifikasi tanpa izin.

---

<div align="center">
  <sub>iMortifex · another dimension · v2.1</sub>
</div>
