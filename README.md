# iMortifex Mini App (V5.3 Fortress Edition)

**iMortifex** adalah sebuah Telegram Mini Web App yang dioptimalkan sebagai *Storefront* layanan dan transaksi saldo digital. Dibangun menggunakan antarmuka Vanilla JavaScript tanpa menggunakan dependency eksternal berat, proyek ini siap di *deploy* dan dicolok langsung bersama Bot Telegram.

### ✨ Fitur Unggulan V5.3 (Fortress Edition)

1. **Modular Architecture:** Basis kode telah dipecah (Refactored) secara logis ke dalam `config.js`, `main.js`, `utils.js`, `admin.js`, dan `user.js` agar perawatannya jauh lebih sehat dan mudah diskalakan.
2. **Status Rekonsiliasi Dinamis:** Mendukung sistem pelacakan _Order_ tingkat lanjut (Pending, Process, Done, Failed) yang dipersenjatai dengan fungsionalitas unik **Refund** (pengembalian riwayat dan otomatisasi refund saldo `iCoin`) & **Repeat**.
3. **Interactive Admin System:** Semua otorisasi mulai dari pemrosesan status, *top-up saldo*, penyisipan anotasi/catatan kustom (_Custom Notes_), pengelolaan inventaris produk, hingga pengiriman *broadcasting/promo* di-handle langsung di dalam aplikasi melalui dashboard Admin (tanpa membuka DB secara manual).
4. **Kupon *New Member* Strict Check:** Restriksi pintar untuk kode voucher dengan flag tipe `newmember`, sehingga mencegah satu UID mengeksploitasi diskon berkali-kali.  
5. **PWA Native Ready:** Mendukung manifestasi *Progressive Web App* yang bisa dipasang lurus di *Menu Drawer / Home Screen* HP pengguna, yang dimeriahkan dengan dukungan *Client-side Native System Notifications*.
6. **Telegram Protocol Compliant:** Menggunakan Theming Parameters API *native* Telegram (mengikuti identitas Dark/Light Telegram Client pengguna) dan inisialisasi yang disyaratkan secara presisi.

### ⚙️ Konfigurasi Setup
Silakan lakukan modifikasi pada file penyokong: `js/config.js`
- Masukkan URL API (Google Apps Script) sistem milik Anda ke `GAS_URL`.
- Modifikasi variabel statis Telegram ID Anda pada susunan `ADMIN_IDS`.
- Tautkan sandi rahasia penyambung di `SECRET_TOKEN`. *(Catatan: Simpan skrip ini di Repositori Privat demi keamanan Token)*.

### 🛡️ Cara Penggunaan Lokal
Aplikasi ini berjalan mandiri di atas port HTTP. Untuk membuka proyek ini dalam skema uji coba tanpa disabotase *Auth Gate* dari Telegram, tambahkan parameter developer:
`http://localhost:8787/index.html?dev=1`

### 🏗 Dependensi Eksternal
- [Google Apps Script Database]
- [Vanilla CSS & Modular ES]
- [Google Fonts (Sora & Space Mono)]

---
*Created by the Google DeepMind Antigravity Division for iMortifex.*
