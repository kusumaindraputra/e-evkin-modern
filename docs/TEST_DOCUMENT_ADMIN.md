# DOKUMEN PENGUJIAN - ADMIN (DINKES)

**Aplikasi:** E-EVKIN Modern - Sistem Evaluasi Kinerja Puskesmas
**Role:** Admin (Dinas Kesehatan Kabupaten Bogor)
**Kredensial:** Username: `dinkes` | Password: `dinkes`
**Tanggal Dokumen:** 30 Maret 2026
**Tahun Anggaran:** 2026
**Data Referensi:** Bojonggede total pagu Rp 4.367.839.106 (16 sub keg) | Cibinong total pagu Rp 2.641.939.962 (16 sub keg)
**Total Puskesmas:** 106

---

## DAFTAR ISI

1. [Login & Autentikasi](#1-login--autentikasi)
2. [Dashboard Admin](#2-dashboard-admin)
3. [Manajemen Pengguna Puskesmas](#3-manajemen-pengguna-puskesmas)
4. [Master Data - Satuan](#4-master-data---satuan)
5. [Master Data - Sumber Anggaran](#5-master-data---sumber-anggaran)
6. [Master Data - Kegiatan](#6-master-data---kegiatan)
7. [Master Data - Sub Kegiatan](#7-master-data---sub-kegiatan)
8. [Konfigurasi Puskesmas - Assign Sub Kegiatan](#8-konfigurasi-puskesmas---assign-sub-kegiatan)
9. [Konfigurasi Puskesmas - Izin Edit](#9-konfigurasi-puskesmas---izin-edit)
10. [Verifikasi Laporan](#10-verifikasi-laporan)
11. [Manajemen Target (Admin)](#11-manajemen-target-admin)
12. [Upload Target dari Excel](#12-upload-target-dari-excel)
13. [Export Laporan](#13-export-laporan)
14. [AI Chat Assistant](#14-ai-chat-assistant)
15. [Laporan Agregat (Report)](#15-laporan-agregat-report)
16. [Health Check & Monitoring](#16-health-check--monitoring)
17. [Logout](#17-logout)

---

## 1. LOGIN & AUTENTIKASI

### TC-ADM-001: Login Admin Berhasil

| Item | Detail |
|------|--------|
| **Prasyarat** | Aplikasi dapat diakses, belum login |
| **Langkah** | 1. Buka halaman login (`/login`)<br>2. Masukkan username: `dinkes`<br>3. Masukkan password: `dinkes`<br>4. Klik tombol **Login** |
| **Contoh Input** | Username: `dinkes`, Password: `dinkes` |
| **Output yang Diharapkan** | - Redirect ke `/dashboard`<br>- Sidebar menu admin tampil: Dashboard, Master Data, Puskesmas, Konfigurasi, Laporan, Target Upload, Target Edit<br>- Header menampilkan nama: **"Dinas Kesehatan"**<br>- Token JWT tersimpan di localStorage |

### TC-ADM-002: Login Gagal - Password Salah

| Item | Detail |
|------|--------|
| **Prasyarat** | Belum login |
| **Langkah** | 1. Input username: `dinkes`<br>2. Input password: `salah123`<br>3. Klik Login |
| **Contoh Input** | Username: `dinkes`, Password: `salah123` |
| **Output yang Diharapkan** | - Tetap di halaman `/login`<br>- Notifikasi error: **"Username atau password salah"**<br>- Field password dikosongkan |

### TC-ADM-003: Login Gagal - Field Kosong

| Item | Detail |
|------|--------|
| **Prasyarat** | Belum login |
| **Langkah** | 1. Biarkan username dan password kosong<br>2. Klik Login |
| **Contoh Input** | Username: *(kosong)*, Password: *(kosong)* |
| **Output yang Diharapkan** | - Validasi form: **"Username wajib diisi"** dan **"Password wajib diisi"**<br>- Tidak ada request ke server |

### TC-ADM-004: Verifikasi Token (Refresh Halaman)

| Item | Detail |
|------|--------|
| **Prasyarat** | Sudah login sebagai admin |
| **Langkah** | 1. Tekan F5 (refresh browser)<br>2. Tunggu halaman reload |
| **Contoh Input** | *(tidak ada input manual, token JWT otomatis dikirim)* |
| **Output yang Diharapkan** | - User tetap login, tidak kembali ke halaman login<br>- Dashboard admin tampil kembali<br>- Data user ter-load: role = `admin`, nama = "Dinas Kesehatan" |

### TC-ADM-005: Akses Halaman Tanpa Login

| Item | Detail |
|------|--------|
| **Prasyarat** | Belum login / token sudah expired |
| **Langkah** | 1. Buka langsung URL `/dashboard` di browser |
| **Contoh Input** | URL: `http://localhost:5173/dashboard` |
| **Output yang Diharapkan** | - Redirect otomatis ke `/login`<br>- Pesan: **"Silakan login terlebih dahulu"** |

---

## 2. DASHBOARD ADMIN

### TC-ADM-006: Tampilan Awal Dashboard

| Item | Detail |
|------|--------|
| **Prasyarat** | Login sebagai admin |
| **Langkah** | 1. Klik menu **"Dashboard"** di sidebar |
| **Contoh Input** | Klik sidebar > Dashboard |
| **Output yang Diharapkan** | Halaman menampilkan:<br>- **Filter:** Dropdown Tahun (default: tahun berjalan), Dropdown Bulan<br>- **Kartu Statistik:**<br>  - Total Laporan: contoh `256`<br>  - Terkirim: contoh `180`<br>  - Pending: contoh `50`<br>  - Terverifikasi: contoh `26`<br>- **Grafik:** Chart Target vs Realisasi Anggaran<br>- **Top/Bottom 10** penyerapan anggaran<br>- **Status Pelaporan** per puskesmas |

### TC-ADM-007: Filter Dashboard per Tahun dan Bulan

| Item | Detail |
|------|--------|
| **Prasyarat** | Di halaman Dashboard |
| **Langkah** | 1. Pilih Tahun: `2025`<br>2. Pilih Bulan: `Januari` |
| **Contoh Input** | Tahun: `2025`, Bulan: `Januari` |
| **Output yang Diharapkan** | - Semua data di-refresh sesuai filter<br>- Kartu statistik menampilkan data Januari 2025 saja<br>- Grafik menampilkan data Januari 2025<br>- Top 10 contoh:<br>  1. Puskesmas Ciawi - Penyerapan: **85.5%**<br>  2. Puskesmas Cibinong - Penyerapan: **78.2%**<br>  3. ... dst<br>- Bottom 10 contoh:<br>  1. Puskesmas Curug - Penyerapan: **12.3%**<br>  2. ... dst |

### TC-ADM-008: Grafik Budget Year-to-Date

| Item | Detail |
|------|--------|
| **Prasyarat** | Di halaman Dashboard |
| **Langkah** | 1. Pilih Tahun: `2025`<br>2. Lihat grafik YTD |
| **Contoh Input** | Tahun: `2025` |
| **Output yang Diharapkan** | - Grafik bar + line chart dengan dual Y-axis<br>- **Y-axis kiri:** Target Anggaran (Rp) - contoh skala 0 - 50M<br>- **Y-axis kanan:** Realisasi Fisik (%) - skala 0% - 100%<br>- **X-axis:** Januari, Februari, Maret, ... (bulan yang sudah ada data)<br>- 100% Realisasi Fisik sejajar dengan nilai Target Anggaran tertinggi<br>- Contoh data bar: Jan: Rp 2.5M target / Rp 1.8M realisasi |

### TC-ADM-009: Chart Data dengan Filter Sumber Anggaran

| Item | Detail |
|------|--------|
| **Prasyarat** | Di halaman Dashboard |
| **Langkah** | 1. Pilih Tahun: `2025`<br>2. Filter Sumber Anggaran: `BLUD Puskesmas` |
| **Contoh Input** | Tahun: `2025`, Sumber Anggaran: `BLUD Puskesmas` |
| **Output yang Diharapkan** | - Grafik hanya menampilkan data sumber anggaran BLUD Puskesmas<br>- Nilai target dan realisasi berkurang (subset dari total)<br>- Contoh: Jan: Rp 1.2M target / Rp 900K realisasi (hanya BLUD) |

### TC-ADM-010: Detail Status Pelaporan Puskesmas

| Item | Detail |
|------|--------|
| **Prasyarat** | Di halaman Dashboard, Tahun: 2025, Bulan: Januari |
| **Langkah** | 1. Scroll ke bagian status pelaporan |
| **Contoh Input** | *(otomatis berdasarkan filter aktif)* |
| **Output yang Diharapkan** | - **Sudah Mengirim:** daftar nama puskesmas contoh: Cibinong, Bojonggede, Ciawi, Parung<br>- **Belum Mengirim:** daftar nama puskesmas contoh: Curug, Bagoang, dll<br>- Total: 106 puskesmas |

---

## 3. MANAJEMEN PENGGUNA PUSKESMAS

### TC-ADM-011: Lihat Daftar Puskesmas

| Item | Detail |
|------|--------|
| **Prasyarat** | Login sebagai admin |
| **Langkah** | 1. Klik menu **"Puskesmas"** di sidebar |
| **Contoh Input** | Klik sidebar > Puskesmas |
| **Output yang Diharapkan** | Tabel dengan kolom dan contoh data:<br>- **No** \| **Nama** \| **Username** \| **Kecamatan** \| **Wilayah** \| **ID BLUD** \| **Aksi**<br>- 1 \| Bojonggede \| bojonggede \| Bojonggede \| Parung \| BLUD \| [Edit] [Hapus]<br>- 2 \| Bagoang \| bagoang \| Jasinga \| Jasinga \| JKN \| [Edit] [Hapus]<br>- 3 \| Cibinong \| cibinong \| Cibinong \| Cibinong \| JKN \| [Edit] [Hapus]<br>- Total: 102 puskesmas |

### TC-ADM-012: Tambah Puskesmas Baru

| Item | Detail |
|------|--------|
| **Prasyarat** | Di halaman Puskesmas |
| **Langkah** | 1. Klik **"Tambah Puskesmas"**<br>2. Isi form<br>3. Klik **Simpan** |
| **Contoh Input** | - Nama: `Puskesmas Test Baru`<br>- Username: `testbaru`<br>- Password: `testbaru123`<br>- Kecamatan: `Dramaga`<br>- Wilayah: `Cibinong`<br>- ID BLUD: `JKN` |
| **Output yang Diharapkan** | - Notifikasi sukses: **"Puskesmas berhasil ditambahkan"**<br>- Data baru muncul di tabel:<br>  103 \| Puskesmas Test Baru \| testbaru \| Dramaga \| Cibinong \| JKN<br>- Total puskesmas bertambah menjadi 103 |

### TC-ADM-013: Edit Puskesmas

| Item | Detail |
|------|--------|
| **Prasyarat** | Ada data puskesmas "Puskesmas Test Baru" |
| **Langkah** | 1. Klik **[Edit]** pada "Puskesmas Test Baru"<br>2. Ubah kecamatan<br>3. Klik **Simpan** |
| **Contoh Input** | Kecamatan diubah dari `Dramaga` menjadi `Bogor Barat` |
| **Output yang Diharapkan** | - Notifikasi sukses: **"Data puskesmas berhasil diperbarui"**<br>- Tabel ter-update: Kecamatan berubah menjadi **"Bogor Barat"** |

### TC-ADM-014: Hapus Puskesmas

| Item | Detail |
|------|--------|
| **Prasyarat** | Ada data puskesmas "Puskesmas Test Baru" |
| **Langkah** | 1. Klik **[Hapus]** pada "Puskesmas Test Baru"<br>2. Klik **OK** pada dialog konfirmasi |
| **Contoh Input** | Konfirmasi: OK |
| **Output yang Diharapkan** | - Dialog konfirmasi: **"Apakah Anda yakin ingin menghapus puskesmas ini?"**<br>- Setelah OK: Notifikasi **"Puskesmas berhasil dihapus"**<br>- Baris "Puskesmas Test Baru" hilang dari tabel<br>- Total kembali 102 |

### TC-ADM-015: Tambah Puskesmas - Username Duplikat

| Item | Detail |
|------|--------|
| **Prasyarat** | Di halaman Puskesmas |
| **Langkah** | 1. Klik **"Tambah Puskesmas"**<br>2. Isi form dengan username yang sudah ada<br>3. Klik **Simpan** |
| **Contoh Input** | - Nama: `Test Duplikat`<br>- Username: `cibinong` *(sudah ada)*<br>- Password: `test123`<br>- Kecamatan: `Test`<br>- Wilayah: `Test` |
| **Output yang Diharapkan** | - Gagal menyimpan<br>- Notifikasi error: **"Username sudah digunakan"**<br>- Data tidak masuk ke tabel |

---

## 4. MASTER DATA - SATUAN

### TC-ADM-016: Lihat Daftar Satuan

| Item | Detail |
|------|--------|
| **Prasyarat** | Login sebagai admin |
| **Langkah** | 1. Klik menu **"Master Data"**<br>2. Pilih tab **"Satuan"** |
| **Contoh Input** | Klik tab Satuan |
| **Output yang Diharapkan** | Tabel satuan:<br>- 1 \| Orang<br>- 2 \| Dokumen<br>- 3 \| unit kerja<br>- 7 \| Laporan<br>- 8 \| Kegiatan |

### TC-ADM-017: Tambah Satuan Baru

| Item | Detail |
|------|--------|
| **Prasyarat** | Di halaman Master Data > Satuan |
| **Langkah** | 1. Klik **"Tambah Satuan"**<br>2. Isi nama satuan<br>3. Klik **Simpan** |
| **Contoh Input** | Nama satuan: `Paket` |
| **Output yang Diharapkan** | - Notifikasi: **"Satuan berhasil ditambahkan"**<br>- Baris baru di tabel: `Paket`<br>- Satuan "Paket" tersedia di dropdown saat input laporan |

### TC-ADM-018: Edit Satuan

| Item | Detail |
|------|--------|
| **Prasyarat** | Satuan "Paket" sudah ada |
| **Langkah** | 1. Klik **[Edit]** pada "Paket"<br>2. Ubah nama<br>3. Klik **Simpan** |
| **Contoh Input** | Nama diubah dari `Paket` menjadi `Paket Kegiatan` |
| **Output yang Diharapkan** | - Notifikasi: **"Satuan berhasil diperbarui"**<br>- Tabel menampilkan **"Paket Kegiatan"** |

### TC-ADM-019: Hapus Satuan

| Item | Detail |
|------|--------|
| **Prasyarat** | Satuan "Paket Kegiatan" tidak dipakai di laporan manapun |
| **Langkah** | 1. Klik **[Hapus]** pada "Paket Kegiatan"<br>2. Konfirmasi |
| **Contoh Input** | Konfirmasi: OK |
| **Output yang Diharapkan** | - Notifikasi: **"Satuan berhasil dihapus"**<br>- "Paket Kegiatan" hilang dari tabel |

---

## 5. MASTER DATA - SUMBER ANGGARAN

### TC-ADM-020: Lihat Daftar Sumber Anggaran

| Item | Detail |
|------|--------|
| **Prasyarat** | Login sebagai admin |
| **Langkah** | 1. Klik menu **"Master Data"**<br>2. Pilih tab **"Sumber Anggaran"** |
| **Contoh Input** | Klik tab Sumber Anggaran |
| **Output yang Diharapkan** | Tabel sumber anggaran:<br>- 1 \| BLUD Puskesmas<br>- 2 \| DAK Non Fisik<br>- 3 \| APBD<br>- 4 \| JKN (Dana Kapitasi) |

### TC-ADM-021: Tambah Sumber Anggaran

| Item | Detail |
|------|--------|
| **Prasyarat** | Di halaman Master Data > Sumber Anggaran |
| **Langkah** | 1. Klik **"Tambah Sumber Anggaran"**<br>2. Isi nama<br>3. Klik **Simpan** |
| **Contoh Input** | Nama: `BOK Tambahan` |
| **Output yang Diharapkan** | - Notifikasi: **"Sumber anggaran berhasil ditambahkan"**<br>- Baris baru: `BOK Tambahan` tampil di tabel |

### TC-ADM-022: Edit Sumber Anggaran

| Item | Detail |
|------|--------|
| **Prasyarat** | "BOK Tambahan" sudah ada |
| **Langkah** | 1. Klik **[Edit]** pada "BOK Tambahan"<br>2. Ubah nama<br>3. Simpan |
| **Contoh Input** | Nama diubah dari `BOK Tambahan` menjadi `BOK Puskesmas` |
| **Output yang Diharapkan** | - Notifikasi: **"Sumber anggaran berhasil diperbarui"**<br>- Tabel menampilkan **"BOK Puskesmas"** |

### TC-ADM-023: Hapus Sumber Anggaran

| Item | Detail |
|------|--------|
| **Prasyarat** | "BOK Puskesmas" tidak dipakai di laporan manapun |
| **Langkah** | 1. Klik **[Hapus]** pada "BOK Puskesmas"<br>2. Konfirmasi |
| **Contoh Input** | Konfirmasi: OK |
| **Output yang Diharapkan** | - Notifikasi: **"Sumber anggaran berhasil dihapus"** |

---

## 6. MASTER DATA - KEGIATAN

### TC-ADM-024: Lihat Daftar Kegiatan

| Item | Detail |
|------|--------|
| **Prasyarat** | Login sebagai admin |
| **Langkah** | 1. Klik menu **"Master Data"**<br>2. Pilih tab **"Kegiatan"** |
| **Contoh Input** | Klik tab Kegiatan |
| **Output yang Diharapkan** | Tabel kegiatan:<br>- `1.02.01.2.10` \| Peningkatan Pelayanan BLUD<br>- `1.02.02.2.02` \| Penyediaan Layanan Kesehatan untuk UKM dan UKP Rujukan Tingkat Daerah Kabupaten/Kota<br>- `1.02.03.2.02` \| Perencanaan Kebutuhan dan Pendayagunaan Sumberdaya Manusia Kesehatan...<br>- `1.02.05.2.03` \| Pengembangan dan Pelaksanaan UKBM...<br>- `1.02.02.2.03` \| Penyelenggaraan Sistem Informasi Kesehatan Secara Terintegrasi |

### TC-ADM-025: Tambah Kegiatan Baru

| Item | Detail |
|------|--------|
| **Prasyarat** | Di halaman Master Data > Kegiatan |
| **Langkah** | 1. Klik **"Tambah Kegiatan"**<br>2. Isi form<br>3. Klik **Simpan** |
| **Contoh Input** | - Kode: `1.02.06.2.01`<br>- Nama Kegiatan: `Kegiatan Pengujian Sistem` |
| **Output yang Diharapkan** | - Notifikasi: **"Kegiatan berhasil ditambahkan"**<br>- Baris baru: `1.02.06.2.01` \| Kegiatan Pengujian Sistem |

### TC-ADM-026: Hapus Kegiatan yang Memiliki Sub Kegiatan

| Item | Detail |
|------|--------|
| **Prasyarat** | Kegiatan "Penyediaan Layanan Kesehatan..." memiliki banyak sub kegiatan |
| **Langkah** | 1. Klik **[Hapus]** pada kegiatan `1.02.02.2.02`<br>2. Konfirmasi |
| **Contoh Input** | Konfirmasi: OK |
| **Output yang Diharapkan** | - Gagal menghapus<br>- Notifikasi error: **"Tidak dapat menghapus kegiatan yang masih memiliki sub kegiatan"**<br>- Data kegiatan tetap ada |

### TC-ADM-027: Hapus Kegiatan Tanpa Sub Kegiatan

| Item | Detail |
|------|--------|
| **Prasyarat** | "Kegiatan Pengujian Sistem" tidak punya sub kegiatan |
| **Langkah** | 1. Klik **[Hapus]** pada "Kegiatan Pengujian Sistem"<br>2. Konfirmasi |
| **Contoh Input** | Konfirmasi: OK |
| **Output yang Diharapkan** | - Notifikasi: **"Kegiatan berhasil dihapus"**<br>- Baris hilang dari tabel |

---

## 7. MASTER DATA - SUB KEGIATAN

### TC-ADM-028: Lihat Daftar Sub Kegiatan

| Item | Detail |
|------|--------|
| **Prasyarat** | Login sebagai admin |
| **Langkah** | 1. Klik menu **"Master Data"**<br>2. Pilih tab **"Sub Kegiatan"** |
| **Contoh Input** | Klik tab Sub Kegiatan |
| **Output yang Diharapkan** | Tabel sub kegiatan (contoh):<br>- `1.02.01.2.10.0001` \| Pelayanan dan Penunjang Pelayanan BLUD \| Jumlah BLUD yang menyediakan pelayanan... \| Peningkatan Pelayanan BLUD<br>- `1.02.02.2.02.0001` \| Pengelolaan Pelayanan Kesehatan Ibu Hamil \| Jumlah ibu hamil... \| Penyediaan Layanan Kesehatan...<br>- `1.02.02.2.02.0033` \| Operasional Pelayanan Puskesmas \| Jumlah laporan operasional... |

### TC-ADM-029: Tambah Sub Kegiatan

| Item | Detail |
|------|--------|
| **Prasyarat** | Di halaman Master Data > Sub Kegiatan |
| **Langkah** | 1. Klik **"Tambah Sub Kegiatan"**<br>2. Isi form<br>3. Klik **Simpan** |
| **Contoh Input** | - Kegiatan Induk: `Peningkatan Pelayanan BLUD`<br>- Kode Sub: `1.02.01.2.10.0099`<br>- Nama: `Sub Kegiatan Test`<br>- Indikator Kinerja: `Jumlah dokumen pengujian yang dihasilkan` |
| **Output yang Diharapkan** | - Notifikasi: **"Sub kegiatan berhasil ditambahkan"**<br>- Baris baru tampil di tabel:<br>  `1.02.01.2.10.0099` \| Sub Kegiatan Test \| Jumlah dokumen pengujian... \| Peningkatan Pelayanan BLUD |

### TC-ADM-030: Edit Sub Kegiatan

| Item | Detail |
|------|--------|
| **Prasyarat** | "Sub Kegiatan Test" sudah ada |
| **Langkah** | 1. Klik **[Edit]** pada "Sub Kegiatan Test"<br>2. Ubah indikator kinerja<br>3. Simpan |
| **Contoh Input** | Indikator Kinerja diubah menjadi: `Jumlah laporan pengujian sistem yang divalidasi` |
| **Output yang Diharapkan** | - Notifikasi: **"Sub kegiatan berhasil diperbarui"**<br>- Indikator kinerja berubah di tabel |

### TC-ADM-031: Hapus Sub Kegiatan

| Item | Detail |
|------|--------|
| **Prasyarat** | "Sub Kegiatan Test" tidak terkait laporan manapun |
| **Langkah** | 1. Klik **[Hapus]**<br>2. Konfirmasi |
| **Contoh Input** | Konfirmasi: OK |
| **Output yang Diharapkan** | - Notifikasi: **"Sub kegiatan berhasil dihapus"** |

---

## 8. KONFIGURASI PUSKESMAS - ASSIGN SUB KEGIATAN

### TC-ADM-032: Lihat Overview Assignment Puskesmas

| Item | Detail |
|------|--------|
| **Prasyarat** | Login sebagai admin |
| **Langkah** | 1. Klik menu **"Konfigurasi"** di sidebar |
| **Contoh Input** | Klik sidebar > Konfigurasi |
| **Output yang Diharapkan** | Tabel overview:<br>- Bojonggede \| 16 sub kegiatan assigned<br>- Cibinong \| 16 sub kegiatan assigned<br>- Ciawi \| ... sub kegiatan assigned<br>- ... (semua 106 puskesmas) |

### TC-ADM-033: Assign Sub Kegiatan ke Puskesmas

| Item | Detail |
|------|--------|
| **Prasyarat** | Di halaman Konfigurasi |
| **Langkah** | 1. Klik pada puskesmas **"Cibinong"**<br>2. Centang sub kegiatan yang akan di-assign<br>3. Klik **Simpan** |
| **Contoh Input** | Sub kegiatan yang dicentang:<br>- [x] Pelayanan dan Penunjang Pelayanan BLUD<br>- [x] Pengelolaan Pelayanan Kesehatan Ibu Hamil<br>- [x] Pengelolaan Pelayanan Kesehatan Ibu Bersalin<br>- [x] Operasional Pelayanan Puskesmas |
| **Output yang Diharapkan** | - Notifikasi: **"Sub kegiatan berhasil di-assign"**<br>- Overview Cibinong berubah: **4 sub kegiatan assigned**<br>- Puskesmas Cibinong sekarang bisa input laporan untuk 4 sub kegiatan tersebut |

### TC-ADM-034: Hapus Satu Assignment Sub Kegiatan

| Item | Detail |
|------|--------|
| **Prasyarat** | Cibinong sudah punya assignment |
| **Langkah** | 1. Klik puskesmas **"Cibinong"**<br>2. Hapus centang pada "Pelayanan dan Penunjang Pelayanan BLUD"<br>3. Simpan |
| **Contoh Input** | Hapus centang: Pelayanan dan Penunjang Pelayanan BLUD |
| **Output yang Diharapkan** | - Assignment berkurang: **3 sub kegiatan assigned**<br>- Sub kegiatan tersebut tidak lagi muncul saat Cibinong input laporan |

---

## 9. KONFIGURASI PUSKESMAS - IZIN EDIT

### TC-ADM-035: Buka Izin Edit Laporan (Global, Semua Puskesmas)

| Item | Detail |
|------|--------|
| **Prasyarat** | Login sebagai admin |
| **Langkah** | 1. Buka pengaturan izin edit<br>2. Isi form<br>3. Simpan |
| **Contoh Input** | - Scope: `laporan`<br>- Tahun: `2025`<br>- Bulan: `Januari`<br>- User: *(kosong = semua puskesmas)*<br>- Enabled: `Ya` |
| **Output yang Diharapkan** | - Notifikasi: **"Izin edit berhasil disimpan"**<br>- Status: Semua puskesmas bisa input/edit laporan Januari 2025<br>- Saat puskesmas cek status: `{ "canEdit": true, "scope": "laporan" }` |

### TC-ADM-036: Buka Izin Edit dengan Time Window

| Item | Detail |
|------|--------|
| **Prasyarat** | Login sebagai admin |
| **Langkah** | 1. Isi form izin edit dengan waktu mulai dan selesai<br>2. Simpan |
| **Contoh Input** | - Scope: `laporan`<br>- Tahun: `2025`<br>- Bulan: `Februari`<br>- Start: `2025-03-01 08:00`<br>- End: `2025-03-15 17:00`<br>- Enabled: `Ya` |
| **Output yang Diharapkan** | - Izin edit hanya aktif 1-15 Maret 2025 jam 08:00-17:00<br>- Sebelum 1 Maret: puskesmas tidak bisa edit → pesan: **"Belum memasuki waktu pengisian"**<br>- Setelah 15 Maret: puskesmas tidak bisa edit → pesan: **"Waktu pengisian sudah berakhir"** |

### TC-ADM-037: Buka Izin Edit Target Kinerja

| Item | Detail |
|------|--------|
| **Prasyarat** | Login sebagai admin |
| **Langkah** | 1. Isi form izin edit<br>2. Simpan |
| **Contoh Input** | - Scope: `target_kinerja`<br>- Tahun: `2025`<br>- Enabled: `Ya` |
| **Output yang Diharapkan** | - Semua puskesmas bisa mengedit target kinerja tahun 2025 |

### TC-ADM-038: Buka Izin Edit Target Rp (Pagu Anggaran)

| Item | Detail |
|------|--------|
| **Prasyarat** | Login sebagai admin |
| **Langkah** | 1. Isi form<br>2. Simpan |
| **Contoh Input** | - Scope: `target_rp`<br>- Tahun: `2025`<br>- Enabled: `Ya` |
| **Output yang Diharapkan** | - Semua puskesmas bisa mengedit target Rp (pagu anggaran) 2025 |

### TC-ADM-039: Buka Izin Edit Angkas

| Item | Detail |
|------|--------|
| **Prasyarat** | Login sebagai admin |
| **Langkah** | 1. Isi form<br>2. Simpan |
| **Contoh Input** | - Scope: `angkas`<br>- Tahun: `2025`<br>- Enabled: `Ya` |
| **Output yang Diharapkan** | - Semua puskesmas bisa mengedit angkas 2025 |

### TC-ADM-040: Tutup Izin Edit Laporan

| Item | Detail |
|------|--------|
| **Prasyarat** | Izin edit laporan sedang aktif |
| **Langkah** | 1. Ubah setting izin edit<br>2. Simpan |
| **Contoh Input** | - Scope: `laporan`<br>- Tahun: `2025`<br>- Bulan: `Januari`<br>- Enabled: `Tidak` |
| **Output yang Diharapkan** | - Notifikasi: **"Izin edit berhasil diperbarui"**<br>- Saat puskesmas mencoba input laporan Januari 2025: **"Anda tidak diizinkan untuk mengedit laporan saat ini"** |

### TC-ADM-041: Izin Edit per Puskesmas Tertentu

| Item | Detail |
|------|--------|
| **Prasyarat** | Login sebagai admin |
| **Langkah** | 1. Isi form izin edit untuk puskesmas tertentu<br>2. Simpan |
| **Contoh Input** | - Scope: `laporan`<br>- User: `Cibinong`<br>- Tahun: `2025`<br>- Bulan: `Maret`<br>- Enabled: `Ya` |
| **Output yang Diharapkan** | - Hanya Puskesmas Cibinong yang bisa edit laporan Maret 2025<br>- Puskesmas Bojonggede mencoba input → **"Anda tidak diizinkan untuk mengedit laporan saat ini"** |

---

## 10. VERIFIKASI LAPORAN

### TC-ADM-042: Lihat Daftar Laporan Terkirim

| Item | Detail |
|------|--------|
| **Prasyarat** | Login sebagai admin, ada laporan berstatus "terkirim" |
| **Langkah** | 1. Klik menu **"Laporan"** di sidebar |
| **Contoh Input** | Klik sidebar > Laporan |
| **Output yang Diharapkan** | Tabel laporan grouped per puskesmas:<br>- Cibinong \| Januari 2026 \| Status: **Terkirim** \| 16 sub kegiatan<br>- Bojonggede \| Januari 2026 \| Status: **Terkirim** \| 16 sub kegiatan<br>- Pagination: Page 1 of 10 \| 10 items per page |

### TC-ADM-043: Filter Laporan per Puskesmas dan Periode

| Item | Detail |
|------|--------|
| **Prasyarat** | Di halaman Laporan admin |
| **Langkah** | 1. Set filter<br>2. Klik filter/cari |
| **Contoh Input** | - Puskesmas: `Cibinong`<br>- Tahun: `2025`<br>- Bulan: `Januari` |
| **Output yang Diharapkan** | - Hanya laporan Cibinong Januari 2025 yang tampil<br>- Total item berkurang sesuai filter |

### TC-ADM-044: Lihat Detail Laporan Puskesmas

| Item | Detail |
|------|--------|
| **Prasyarat** | Di halaman Laporan admin, ada data |
| **Langkah** | 1. Klik pada baris Cibinong Januari 2025 |
| **Contoh Input** | Klik baris: Cibinong \| Januari 2025 |
| **Output yang Diharapkan** | Detail laporan dalam bentuk tabel:<br><br>**Sub Kegiatan: Operasional Pelayanan Puskesmas**<br>- Sumber Anggaran: JKN (Dana Kapitasi)<br>- Satuan: Laporan<br>- Target Kinerja: `12`<br>- Target Rp: `Rp 500.000.000`<br>- Angkas: `Rp 450.000.000`<br>- Realisasi Kinerja: `8`<br>- Realisasi Rp: `Rp 320.000.000`<br>- Realisasi Fisik: `65%`<br>- Permasalahan: "Sebagian kegiatan belum terlaksana karena keterbatasan SDM"<br>- Upaya: "Akan dijadwalkan ulang di bulan berikutnya"<br>- Status: **Terkirim** |

### TC-ADM-045: Kembalikan (Return) Laporan ke Puskesmas

| Item | Detail |
|------|--------|
| **Prasyarat** | Ada laporan berstatus "terkirim" |
| **Langkah** | 1. Buka detail laporan<br>2. Klik **"Kembalikan"**<br>3. Isi catatan<br>4. Konfirmasi |
| **Contoh Input** | Catatan: `Data realisasi Rp tidak sesuai dengan bukti pengeluaran. Mohon dilengkapi dokumen pendukung.` |
| **Output yang Diharapkan** | - Status laporan berubah dari **"Terkirim"** → **"Tersimpan"**<br>- Catatan admin tersimpan dan tampil di sisi puskesmas<br>- Puskesmas Cibinong bisa melihat catatan dan mengedit ulang laporan<br>- Notifikasi: **"Laporan berhasil dikembalikan"** |

### TC-ADM-046: Bulk Return Laporan

| Item | Detail |
|------|--------|
| **Prasyarat** | Ada beberapa laporan terkirim dari satu puskesmas dalam satu periode |
| **Langkah** | 1. Pilih puskesmas dan periode<br>2. Klik **"Kembalikan Semua"**<br>3. Konfirmasi |
| **Contoh Input** | Puskesmas: Bojonggede, Bulan: Januari, Tahun: 2025 |
| **Output yang Diharapkan** | - Semua laporan Bojonggede Januari 2025 berubah status → **"Tersimpan"**<br>- Notifikasi: **"8 laporan berhasil dikembalikan"** |

---

## 11. MANAJEMEN TARGET (ADMIN)

### TC-ADM-047: Lihat Semua Target

| Item | Detail |
|------|--------|
| **Prasyarat** | Login sebagai admin |
| **Langkah** | 1. Klik menu **"Target Edit"** di sidebar |
| **Contoh Input** | Klik sidebar > Target Edit |
| **Output yang Diharapkan** | Tabel target dari semua puskesmas:<br>- Bojonggede \| Pelayanan dan Penunjang Pelayanan BLUD \| BLUD Puskesmas \| Target Rp: `Rp 3.738.528.000`<br>- Cibinong \| Pelayanan dan Penunjang Pelayanan BLUD \| BLUD Puskesmas \| Target Rp: `Rp 2.135.455.000`<br>- Bojonggede \| Operasional Pelayanan Puskesmas \| APBD (PAD) \| Target Rp: `Rp 182.537.106`<br>- Cibinong \| Operasional Pelayanan Puskesmas \| APBD (PAD) \| Target Rp: `Rp 181.390.962`<br>- ... |

### TC-ADM-048: Edit Target Kinerja Puskesmas

| Item | Detail |
|------|--------|
| **Prasyarat** | Di halaman Target Edit |
| **Langkah** | 1. Klik **[Edit]** pada target Bojonggede<br>2. Ubah target kinerja<br>3. Simpan |
| **Contoh Input** | Target Kinerja diubah dari `12` menjadi `15` |
| **Output yang Diharapkan** | - Notifikasi: **"Target berhasil diperbarui"**<br>- Kolom Target K berubah: `15`<br>- Riwayat perubahan tercatat (versi baru dibuat) |

### TC-ADM-049: Buat Target Baru untuk Puskesmas

| Item | Detail |
|------|--------|
| **Prasyarat** | Di halaman Target Edit |
| **Langkah** | 1. Klik **"Tambah Target"**<br>2. Isi form<br>3. Simpan |
| **Contoh Input** | - Puskesmas: `Cibinong`<br>- Sub Kegiatan: `Operasional Pelayanan Puskesmas`<br>- Sumber Anggaran: `DAK Non Fisik (BOK)`<br>- Satuan: `Laporan`<br>- Target Kinerja: `12`<br>- Target Rp: `77276000`<br>- Tahun: `2026` |
| **Output yang Diharapkan** | - Notifikasi: **"Target berhasil dibuat"**<br>- Baris baru di tabel:<br>  Cibinong \| Operasional Pelayanan Puskesmas \| BOK \| Laporan \| 12 \| Rp 77.276.000 |

### TC-ADM-050: Lihat Riwayat Perubahan Target

| Item | Detail |
|------|--------|
| **Prasyarat** | Ada target yang pernah diubah |
| **Langkah** | 1. Buka riwayat target |
| **Contoh Input** | Filter: Puskesmas = Bojonggede |
| **Output yang Diharapkan** | Riwayat perubahan:<br>- **Versi 2** (27/03/2026 10:30): Target K: 15, dibuat oleh: dinkes, catatan: "Penyesuaian target semester 2"<br>- **Versi 1** (01/01/2025 08:00): Target K: 12, dibuat oleh: bojonggede, catatan: "Target awal" |

---

## 12. UPLOAD TARGET DARI EXCEL

### TC-ADM-051: Upload File Excel Target Berhasil

| Item | Detail |
|------|--------|
| **Prasyarat** | Login sebagai admin, file Excel sesuai format |
| **Langkah** | 1. Klik menu **"Target Upload"**<br>2. Klik **"Pilih File"** / drag & drop<br>3. Tunggu proses |
| **Contoh Input** | File: `target_2025.xlsx` (berisi data target 10 puskesmas) |
| **Output yang Diharapkan** | - Progress bar upload tampil<br>- Laporan hasil upload:<br>  - **Berhasil:** 45 target<br>  - **Gagal:** 2 target<br>  - **Detail error:**<br>    - Baris 23: Puskesmas "Abc" tidak ditemukan<br>    - Baris 47: Kode sub kegiatan tidak valid<br>- Data yang berhasil masuk ke database |

### TC-ADM-052: Upload File Non-Excel

| Item | Detail |
|------|--------|
| **Prasyarat** | Login sebagai admin |
| **Langkah** | 1. Upload file PDF |
| **Contoh Input** | File: `dokumen.pdf` |
| **Output yang Diharapkan** | - Upload ditolak<br>- Pesan error: **"Format file tidak didukung. Gunakan file Excel (.xlsx)"** |

---

## 13. EXPORT LAPORAN

### TC-ADM-053: Export Semua Laporan ke Excel

| Item | Detail |
|------|--------|
| **Prasyarat** | Login sebagai admin, ada data laporan |
| **Langkah** | 1. Di halaman Laporan, klik **"Export"**<br>2. Pilih filter tahun |
| **Contoh Input** | Tahun: `2025` |
| **Output yang Diharapkan** | File Excel terdownload: `laporan_2025.xlsx`<br>- **Sheet 1 "Summary":** Ringkasan semua puskesmas, total target, total realisasi, % penyerapan<br>- **Sheet 2 "Cibinong":** Data laporan lengkap Cibinong<br>- **Sheet 3 "Bojonggede":** Data laporan lengkap Bojonggede<br>- **Format:** Header merged, border, Rp number format, % format<br>- **Kolom per sheet:** Sub Kegiatan, Sumber Anggaran, Satuan, Target K, Target Rp, Realisasi K, Realisasi Rp, Realisasi Fisik (%), Permasalahan, Upaya |

### TC-ADM-054: Export Laporan dengan Filter

| Item | Detail |
|------|--------|
| **Prasyarat** | Login sebagai admin |
| **Langkah** | 1. Set filter<br>2. Klik **"Export"** |
| **Contoh Input** | Puskesmas: `Cibinong`, Tahun: `2025`, Bulan: `Januari` |
| **Output yang Diharapkan** | File Excel terdownload, hanya berisi data Cibinong Januari 2025 |

---

## 14. AI CHAT ASSISTANT

### TC-ADM-055: Buka AI Chat Widget

| Item | Detail |
|------|--------|
| **Prasyarat** | Login sebagai admin |
| **Langkah** | 1. Klik ikon chat di pojok kanan bawah |
| **Contoh Input** | Klik ikon chat |
| **Output yang Diharapkan** | - Window chat terbuka<br>- Suggested questions tampil, contoh:<br>  - "Puskesmas mana yang penyerapan anggarannya tertinggi?"<br>  - "Berapa total realisasi anggaran bulan ini?"<br>  - "Sub kegiatan mana yang belum ada laporannya?" |

### TC-ADM-056: Tanya AI Chat

| Item | Detail |
|------|--------|
| **Prasyarat** | Chat widget terbuka |
| **Langkah** | 1. Ketik pertanyaan<br>2. Klik kirim |
| **Contoh Input** | "Puskesmas mana yang penyerapan anggarannya paling rendah bulan Januari 2025?" |
| **Output yang Diharapkan** | AI menjawab berdasarkan data, contoh:<br>*"Berdasarkan data laporan Januari 2025, 5 puskesmas dengan penyerapan anggaran terendah adalah:*<br>*1. Puskesmas Curug - 5.2% (Rp 26.000.000 dari Rp 500.000.000)*<br>*2. Puskesmas Bagoang - 8.7% (Rp 43.500.000 dari Rp 500.000.000)*<br>*3. ..."* |

---

## 15. LAPORAN AGREGAT (REPORT)

### TC-ADM-057: Report by Sub Kegiatan

| Item | Detail |
|------|--------|
| **Prasyarat** | Login sebagai admin, ada data laporan |
| **Langkah** | 1. Akses report by sub kegiatan<br>2. Set filter |
| **Contoh Input** | - Tahun: `2025`<br>- Bulan: `Januari`<br>- Sub Kegiatan: `Operasional Pelayanan Puskesmas` |
| **Output yang Diharapkan** | Tabel agregat:<br>- **Sub Kegiatan:** Operasional Pelayanan Puskesmas<br>- **Total Target Rp:** Rp 15.500.000.000 (dari 45 puskesmas)<br>- **Total Realisasi Rp:** Rp 8.200.000.000<br>- **% Penyerapan:** 52.9%<br>- **Total Target K:** 540<br>- **Total Realisasi K:** 320 |

### TC-ADM-058: Report by Sumber Anggaran

| Item | Detail |
|------|--------|
| **Prasyarat** | Login sebagai admin, ada data laporan |
| **Langkah** | 1. Akses report by sumber anggaran<br>2. Set filter |
| **Contoh Input** | - Tahun: `2025`<br>- Bulan: `Januari`<br>- Sumber Anggaran: `BLUD Puskesmas` |
| **Output yang Diharapkan** | Tabel agregat:<br>- **Sumber Anggaran:** BLUD Puskesmas<br>- **Total Target Rp:** Rp 45.000.000.000<br>- **Total Realisasi Rp:** Rp 22.500.000.000<br>- **% Penyerapan:** 50.0% |

---

## 16. HEALTH CHECK & MONITORING

### TC-ADM-059: Health Check Basic

| Item | Detail |
|------|--------|
| **Prasyarat** | Server backend berjalan |
| **Langkah** | 1. Akses endpoint health check |
| **Contoh Input** | `GET /health` |
| **Output yang Diharapkan** | ```json<br>{<br>  "status": "ok",<br>  "timestamp": "2026-03-27T10:00:00.000Z"<br>}<br>```<br>HTTP Status: **200 OK** |

### TC-ADM-060: Health Check Detail

| Item | Detail |
|------|--------|
| **Prasyarat** | Akses dari localhost |
| **Langkah** | 1. Akses endpoint health check dengan parameter detail |
| **Contoh Input** | `GET /health?detail=true` |
| **Output yang Diharapkan** | ```json<br>{<br>  "status": "ok",<br>  "timestamp": "2026-03-27T10:00:00.000Z",<br>  "uptime": 86400,<br>  "memory": { "heapUsed": 45000000, "rss": 80000000 },<br>  "dbPool": { "total": 15, "idle": 12, "active": 3 },<br>  "cache": { "hits": 1500, "misses": 200 }<br>}<br>```<br>HTTP Status: **200 OK** |

---

## 17. LOGOUT

### TC-ADM-061: Logout Admin

| Item | Detail |
|------|--------|
| **Prasyarat** | Login sebagai admin |
| **Langkah** | 1. Klik tombol **Logout** di header/sidebar |
| **Contoh Input** | Klik tombol Logout |
| **Output yang Diharapkan** | - Token JWT dihapus dari localStorage<br>- Redirect ke halaman `/login`<br>- Akses `/dashboard` → redirect kembali ke `/login`<br>- Pesan: **"Anda telah logout"** |

---

## RINGKASAN TEST CASE

| Modul | Jumlah TC | ID |
|-------|-----------|-----|
| Login & Autentikasi | 5 | TC-ADM-001 s/d TC-ADM-005 |
| Dashboard Admin | 5 | TC-ADM-006 s/d TC-ADM-010 |
| Manajemen Puskesmas | 5 | TC-ADM-011 s/d TC-ADM-015 |
| Master Data - Satuan | 4 | TC-ADM-016 s/d TC-ADM-019 |
| Master Data - Sumber Anggaran | 4 | TC-ADM-020 s/d TC-ADM-023 |
| Master Data - Kegiatan | 4 | TC-ADM-024 s/d TC-ADM-027 |
| Master Data - Sub Kegiatan | 4 | TC-ADM-028 s/d TC-ADM-031 |
| Konfigurasi - Assign Sub Kegiatan | 3 | TC-ADM-032 s/d TC-ADM-034 |
| Konfigurasi - Izin Edit | 7 | TC-ADM-035 s/d TC-ADM-041 |
| Verifikasi Laporan | 5 | TC-ADM-042 s/d TC-ADM-046 |
| Manajemen Target | 4 | TC-ADM-047 s/d TC-ADM-050 |
| Upload Target Excel | 2 | TC-ADM-051 s/d TC-ADM-052 |
| Export Laporan | 2 | TC-ADM-053 s/d TC-ADM-054 |
| AI Chat | 2 | TC-ADM-055 s/d TC-ADM-056 |
| Laporan Agregat | 2 | TC-ADM-057 s/d TC-ADM-058 |
| Health Check | 2 | TC-ADM-059 s/d TC-ADM-060 |
| Logout | 1 | TC-ADM-061 |
| **TOTAL** | **61** | |
