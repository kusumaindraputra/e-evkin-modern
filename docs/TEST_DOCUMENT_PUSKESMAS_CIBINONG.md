# DOKUMEN PENGUJIAN - PUSKESMAS CIBINONG

**Aplikasi:** E-EVKIN Modern - Sistem Evaluasi Kinerja Puskesmas
**Role:** Puskesmas
**Nama Puskesmas:** Cibinong
**Kredensial:** Username: `cibinong` | Password: `bogorkab`
**Kecamatan:** Cibinong | **Wilayah:** Cibinong | **ID BLUD:** JKN
**Tanggal Dokumen:** 30 Maret 2026
**Tahun Anggaran:** 2026
**Total Pagu:** Rp 2.641.939.962 (16 sub kegiatan x sumber anggaran)
**Sumber Anggaran:** BLUD Puskesmas (Rp 2.135.455.000), DAK Non Fisik/BOK (Rp 325.093.500), APBD/PAD (Rp 181.390.962)

---

## DAFTAR ISI

1. [Login & Autentikasi](#1-login--autentikasi)
2. [Dashboard Puskesmas](#2-dashboard-puskesmas)
3. [Manajemen Target](#3-manajemen-target)
4. [Manajemen Angkas](#4-manajemen-angkas)
5. [Input Laporan (Bulk)](#5-input-laporan-bulk)
6. [Submit Laporan](#6-submit-laporan)
7. [Cek Izin Edit](#7-cek-izin-edit)
8. [Export Laporan](#8-export-laporan)
9. [Cara Pengisian](#9-cara-pengisian)
10. [Logout](#10-logout)

---

## 1. LOGIN & AUTENTIKASI

### TC-CBN-001: Login Puskesmas Cibinong Berhasil

| Item | Detail |
|------|--------|
| **Prasyarat** | Aplikasi dapat diakses, belum login |
| **Langkah** | 1. Buka halaman login (`/login`)<br>2. Masukkan username: `cibinong`<br>3. Masukkan password: `bogorkab`<br>4. Klik tombol **Login** |
| **Contoh Input** | Username: `cibinong`, Password: `bogorkab` |
| **Output yang Diharapkan** | - Redirect ke `/puskesmas/dashboard`<br>- Sidebar menu puskesmas tampil: Dashboard, Laporan, Target, Cara Pengisian<br>- Header menampilkan: **"Puskesmas Cibinong"**<br>- Data user: role = `puskesmas`, kecamatan = `Cibinong`, wilayah = `Cibinong`, id_blud = `JKN` |

### TC-CBN-002: Login Gagal - Password Salah

| Item | Detail |
|------|--------|
| **Prasyarat** | Belum login |
| **Langkah** | 1. Input username: `cibinong`<br>2. Input password: `password123`<br>3. Klik Login |
| **Contoh Input** | Username: `cibinong`, Password: `password123` |
| **Output yang Diharapkan** | - Tetap di halaman `/login`<br>- Notifikasi error: **"Username atau password salah"** |

### TC-CBN-003: Akses Halaman Admin sebagai Puskesmas

| Item | Detail |
|------|--------|
| **Prasyarat** | Login sebagai Puskesmas Cibinong |
| **Langkah** | 1. Akses langsung URL `/dashboard` (halaman admin) |
| **Contoh Input** | URL: `http://localhost:5173/dashboard` |
| **Output yang Diharapkan** | - Redirect ke `/puskesmas/dashboard` atau halaman 403/unauthorized<br>- Tidak bisa mengakses fitur admin |

### TC-CBN-004: Verifikasi Token (Refresh Halaman)

| Item | Detail |
|------|--------|
| **Prasyarat** | Sudah login sebagai Puskesmas Cibinong |
| **Langkah** | 1. Tekan F5 (refresh browser) |
| **Contoh Input** | *(otomatis)* |
| **Output yang Diharapkan** | - Tetap login sebagai Puskesmas Cibinong<br>- Dashboard puskesmas tampil kembali |

---

## 2. DASHBOARD PUSKESMAS

### TC-CBN-005: Tampilan Dashboard Puskesmas

| Item | Detail |
|------|--------|
| **Prasyarat** | Login sebagai Puskesmas Cibinong |
| **Langkah** | 1. Klik menu **"Dashboard"** di sidebar |
| **Contoh Input** | Klik sidebar > Dashboard |
| **Output yang Diharapkan** | Halaman dashboard tampil dengan:<br>- **Filter:** Tahun (default: tahun berjalan), Bulan<br>- **Statistik Laporan Sendiri:**<br>  - Total Laporan: contoh `5`<br>  - Tersimpan (Draft): `2`<br>  - Terkirim: `3`<br>  - Terverifikasi: `0`<br>- **Grafik Budget:** Target vs Realisasi Anggaran milik Cibinong sendiri<br>- Data yang tampil HANYA data milik Puskesmas Cibinong |

### TC-CBN-006: Filter Dashboard per Tahun dan Bulan

| Item | Detail |
|------|--------|
| **Prasyarat** | Di halaman Dashboard Puskesmas |
| **Langkah** | 1. Pilih Tahun: `2025`<br>2. Pilih Bulan: `Januari` |
| **Contoh Input** | Tahun: `2025`, Bulan: `Januari` |
| **Output yang Diharapkan** | - Statistik menampilkan data Januari 2025 saja<br>- Contoh:<br>  - Total Laporan: `3`<br>  - Terkirim: `3`<br>  - Tersimpan: `0` |

### TC-CBN-007: Grafik Budget YTD Puskesmas

| Item | Detail |
|------|--------|
| **Prasyarat** | Di halaman Dashboard Puskesmas |
| **Langkah** | 1. Pilih Tahun: `2025`<br>2. Lihat grafik YTD |
| **Contoh Input** | Tahun: `2025` |
| **Output yang Diharapkan** | - Grafik menampilkan akumulasi bulanan data Cibinong<br>- Total Target Anggaran: **Rp 2.641.939.962**<br>- Contoh:<br>  - Jan: Target Rp 2.641.939.962 / Realisasi Rp (sesuai laporan)<br>  - Feb: akumulasi YTD<br>  - ... |

### TC-CBN-008: Budget Monthly Breakdown

| Item | Detail |
|------|--------|
| **Prasyarat** | Di halaman Dashboard Puskesmas |
| **Langkah** | 1. Pilih Tahun: `2025`, Bulan: `Januari`<br>2. Lihat breakdown per sub kegiatan |
| **Contoh Input** | Tahun: `2025`, Bulan: `Januari` |
| **Output yang Diharapkan** | Tabel breakdown per sub kegiatan (Cibinong, data real):<br>- Pelayanan dan Penunjang Pelayanan BLUD \| BLUD \| Target: **Rp 2.135.455.000**<br>- Pengelolaan Pelayanan Kesehatan Gizi Masyarakat \| BOK \| Target: **Rp 94.490.000**<br>- Operasional Pelayanan Puskesmas \| PAD \| Target: **Rp 181.390.962**<br>- Operasional Pelayanan Puskesmas \| BOK \| Target: **Rp 77.276.000**<br>- Pelayanan Kesehatan Penyakit Menular \| BOK \| Target: **Rp 49.505.000**<br>- ... (total 16 baris) |

---

## 3. MANAJEMEN TARGET

### TC-CBN-009: Lihat Target yang Di-assign

| Item | Detail |
|------|--------|
| **Prasyarat** | Login sebagai Puskesmas Cibinong, izin edit target aktif |
| **Langkah** | 1. Klik menu **"Target"** di sidebar |
| **Contoh Input** | Klik sidebar > Target |
| **Output yang Diharapkan** | Tabel target yang di-assign ke Cibinong (16 baris, data real):<br>- **Sub Kegiatan** \| **Sumber Anggaran** \| **Target Rp (Pagu)**<br>- Pelayanan dan Penunjang Pelayanan BLUD \| BLUD Puskesmas \| `Rp 2.135.455.000`<br>- Pengelolaan Pelayanan Kesehatan Ibu Hamil \| DAK Non Fisik (BOK) \| `Rp 19.552.000`<br>- Pengelolaan Pelayanan Kesehatan Gizi Masyarakat \| DAK Non Fisik (BOK) \| `Rp 94.490.000`<br>- Operasional Pelayanan Puskesmas \| DAK Non Fisik (BOK) \| `Rp 77.276.000`<br>- Operasional Pelayanan Puskesmas \| APBD (PAD) \| `Rp 181.390.962`<br>- Pelayanan Kesehatan Penyakit Menular \| DAK Non Fisik (BOK) \| `Rp 49.505.000`<br>- ... *(total 16 sub kegiatan x sumber, total pagu Rp 2.641.939.962)* |

### TC-CBN-010: Input Target Baru

| Item | Detail |
|------|--------|
| **Prasyarat** | Izin edit `target_kinerja` dan `target_rp` aktif |
| **Langkah** | 1. Klik **"Tambah Target"** atau edit cell<br>2. Isi data target<br>3. Simpan |
| **Contoh Input** | - Sub Kegiatan: `Pengelolaan Surveilans Kesehatan`<br>- Sumber Anggaran: `JKN (Dana Kapitasi)`<br>- Satuan: `Dokumen`<br>- Target Kinerja: `4`<br>- Target Rp: `120.000.000`<br>- Tahun: `2025` |
| **Output yang Diharapkan** | - Notifikasi: **"Target berhasil disimpan"**<br>- Baris baru muncul di tabel:<br>  Pengelolaan Surveilans Kesehatan \| JKN \| Dokumen \| 4 \| Rp 120.000.000 |

### TC-CBN-011: Edit Target Kinerja

| Item | Detail |
|------|--------|
| **Prasyarat** | Izin edit `target_kinerja` aktif |
| **Langkah** | 1. Klik edit pada target "Operasional Pelayanan Puskesmas"<br>2. Ubah Target K<br>3. Simpan |
| **Contoh Input** | Target K diubah dari `12` menjadi `14` |
| **Output yang Diharapkan** | - Notifikasi: **"Target berhasil diperbarui"**<br>- Target K berubah: `14`<br>- Target Rp tetap: `Rp 500.000.000` (tidak berubah) |

### TC-CBN-012: Bulk Input Target

| Item | Detail |
|------|--------|
| **Prasyarat** | Izin edit target aktif |
| **Langkah** | 1. Isi beberapa target sekaligus di tabel<br>2. Klik **"Simpan Semua"** |
| **Contoh Input** | Beberapa baris target diisi sekaligus:<br>- Baris 1: Target K = `14`, Target Rp = `500.000.000`<br>- Baris 2: Target K = `520`, Target Rp = `260.000.000`<br>- Baris 3: Target K = `310`, Target Rp = `210.000.000` |
| **Output yang Diharapkan** | - Notifikasi: **"3 target berhasil disimpan"**<br>- Semua baris ter-update |

### TC-CBN-013: Lihat Riwayat Target

| Item | Detail |
|------|--------|
| **Prasyarat** | Target sudah pernah diubah |
| **Langkah** | 1. Klik icon riwayat pada sub kegiatan "Operasional Pelayanan Puskesmas" |
| **Contoh Input** | Klik icon riwayat |
| **Output yang Diharapkan** | Riwayat perubahan target:<br>- **Versi 2** (27/03/2026): Target K: `14`, oleh: cibinong<br>- **Versi 1** (01/01/2025): Target K: `12`, oleh: cibinong |

### TC-CBN-014: Input Target Saat Izin Edit Tidak Aktif

| Item | Detail |
|------|--------|
| **Prasyarat** | Izin edit `target_kinerja` TIDAK aktif |
| **Langkah** | 1. Coba ubah target kinerja<br>2. Simpan |
| **Contoh Input** | Target K diubah menjadi `20` |
| **Output yang Diharapkan** | - Gagal menyimpan<br>- Pesan: **"Anda tidak diizinkan untuk mengedit target saat ini"**<br>- Data tidak berubah |

---

## 4. MANAJEMEN ANGKAS

### TC-CBN-015: Lihat Angkas (Anggaran Kas)

| Item | Detail |
|------|--------|
| **Prasyarat** | Login sebagai Cibinong, di halaman Target |
| **Langkah** | 1. Lihat bagian Angkas di halaman Target |
| **Contoh Input** | *(otomatis tampil di halaman Target)* |
| **Output yang Diharapkan** | Tabel angkas per sub kegiatan (sesuai upload PDF angkas):<br>- Pelayanan dan Penunjang Pelayanan BLUD \| BLUD \| Angkas: `sesuai upload PDF`<br>- Operasional Pelayanan Puskesmas \| BOK \| Angkas: `sesuai upload PDF`<br>- Operasional Pelayanan Puskesmas \| PAD \| Angkas: `sesuai upload PDF`<br>- Pengelolaan Pelayanan Kesehatan Gizi Masyarakat \| BOK \| Angkas: `sesuai upload PDF` |

### TC-CBN-016: Input Angkas

| Item | Detail |
|------|--------|
| **Prasyarat** | Izin edit `angkas` aktif |
| **Langkah** | 1. Edit angkas untuk sub kegiatan tertentu<br>2. Simpan |
| **Contoh Input** | - Sub Kegiatan: `Operasional Pelayanan Puskesmas`<br>- Angkas: `480.000.000` |
| **Output yang Diharapkan** | - Notifikasi: **"Angkas berhasil disimpan"**<br>- Angkas berubah: `Rp 480.000.000` |

### TC-CBN-017: Bulk Input Angkas

| Item | Detail |
|------|--------|
| **Prasyarat** | Izin edit angkas aktif |
| **Langkah** | 1. Isi beberapa angkas sekaligus<br>2. Simpan |
| **Contoh Input** | - Baris 1: Angkas = `480.000.000`<br>- Baris 2: Angkas = `240.000.000`<br>- Baris 3: Angkas = `190.000.000` |
| **Output yang Diharapkan** | - Notifikasi: **"3 angkas berhasil disimpan"** |

---

## 5. INPUT LAPORAN (BULK)

### TC-CBN-018: Buka Halaman Laporan Bulk Input

| Item | Detail |
|------|--------|
| **Prasyarat** | Login sebagai Cibinong, izin edit laporan aktif |
| **Langkah** | 1. Klik menu **"Laporan"** di sidebar |
| **Contoh Input** | Klik sidebar > Laporan |
| **Output yang Diharapkan** | Halaman bulk input tampil:<br>- **Filter:** Tahun (dropdown), Bulan (dropdown)<br>- **Tabel input** dengan baris = sub kegiatan yang di-assign<br>- **Kolom:** Sub Kegiatan, Sumber Anggaran, Satuan, Target K, Target Rp, Angkas, Realisasi K, Realisasi Rp, Realisasi Fisik (%), Permasalahan, Upaya<br>- Sticky header saat scroll<br>- Kolom Target K, Target Rp, Angkas terisi otomatis dari data target |

### TC-CBN-019: Input Laporan Bulanan - Satu Baris

| Item | Detail |
|------|--------|
| **Prasyarat** | Di halaman Laporan, Tahun: 2025, Bulan: Januari |
| **Langkah** | 1. Pilih Tahun: `2025`, Bulan: `Januari`<br>2. Isi data realisasi pada baris "Operasional Pelayanan Puskesmas"<br>3. Klik **Simpan** |
| **Contoh Input** | Baris: Operasional Pelayanan Puskesmas / JKN (Dana Kapitasi)<br>- Realisasi K: `8`<br>- Realisasi Rp: `320.000.000`<br>- Realisasi Fisik: `65`<br>- Permasalahan: `Sebagian kegiatan belum terlaksana karena keterbatasan SDM`<br>- Upaya: `Akan dijadwalkan ulang di bulan berikutnya` |
| **Output yang Diharapkan** | - Notifikasi: **"Laporan berhasil disimpan"**<br>- Status baris berubah menjadi **"Tersimpan"** (draft)<br>- Data tersimpan:<br>  - Target K: `14` (dari target)<br>  - Target Rp: `Rp 500.000.000` (dari target)<br>  - Angkas: `Rp 480.000.000` (dari angkas)<br>  - Realisasi K: `8`<br>  - Realisasi Rp: `Rp 320.000.000`<br>  - Realisasi Fisik: `65%`<br>  - Permasalahan & Upaya tersimpan |

### TC-CBN-020: Bulk Input Laporan - Semua Baris

| Item | Detail |
|------|--------|
| **Prasyarat** | Di halaman Laporan, Tahun: 2025, Bulan: Januari |
| **Langkah** | 1. Isi semua baris sub kegiatan<br>2. Klik **"Simpan Semua"** |
| **Contoh Input** | **Baris 1:** Operasional Pelayanan Puskesmas<br>- Realisasi K: `8`, Realisasi Rp: `320.000.000`, Realisasi Fisik: `65`<br>- Permasalahan: `Sebagian kegiatan belum terlaksana`<br>- Upaya: `Dijadwalkan ulang`<br><br>**Baris 2:** Pengelolaan Pelayanan Ibu Hamil<br>- Realisasi K: `380`, Realisasi Rp: `180.000.000`, Realisasi Fisik: `72`<br>- Permasalahan: `Target belum tercapai, bumil di wilayah terpencil sulit dijangkau`<br>- Upaya: `Kerjasama dengan kader posyandu untuk menjangkau bumil`<br><br>**Baris 3:** Pengelolaan Pelayanan Ibu Bersalin<br>- Realisasi K: `250`, Realisasi Rp: `150.000.000`, Realisasi Fisik: `75`<br>- Permasalahan: `-`<br>- Upaya: `Melanjutkan program yang sudah berjalan` |
| **Output yang Diharapkan** | - Notifikasi: **"3 laporan berhasil disimpan"**<br>- Semua baris berstatus **"Tersimpan"** (draft)<br>- Data terlihat lengkap di tabel |

### TC-CBN-021: Edit Laporan yang Sudah Tersimpan

| Item | Detail |
|------|--------|
| **Prasyarat** | Ada laporan berstatus "Tersimpan" |
| **Langkah** | 1. Edit data realisasi pada baris yang sudah tersimpan<br>2. Simpan |
| **Contoh Input** | Baris: Operasional Pelayanan Puskesmas<br>- Realisasi Rp diubah dari `320.000.000` menjadi `350.000.000`<br>- Realisasi Fisik diubah dari `65` menjadi `70` |
| **Output yang Diharapkan** | - Notifikasi: **"Laporan berhasil diperbarui"**<br>- Data ter-update: Realisasi Rp = `Rp 350.000.000`, Realisasi Fisik = `70%` |

### TC-CBN-022: Input Laporan dengan Realisasi Fisik > 100%

| Item | Detail |
|------|--------|
| **Prasyarat** | Di halaman input laporan |
| **Langkah** | 1. Isi Realisasi Fisik dengan nilai lebih dari 100<br>2. Simpan |
| **Contoh Input** | Realisasi Fisik: `150` |
| **Output yang Diharapkan** | - Validasi gagal<br>- Pesan error: **"Realisasi fisik tidak boleh lebih dari 100%"**<br>- Data tidak tersimpan |

### TC-CBN-023: Input Laporan Saat Izin Edit Tidak Aktif

| Item | Detail |
|------|--------|
| **Prasyarat** | Izin edit `laporan` TIDAK aktif untuk Cibinong |
| **Langkah** | 1. Coba isi data realisasi<br>2. Simpan |
| **Contoh Input** | Realisasi K: `10`, Realisasi Rp: `400.000.000` |
| **Output yang Diharapkan** | - Gagal menyimpan<br>- Pesan: **"Anda tidak diizinkan untuk mengedit laporan saat ini"**<br>- Form dalam mode read-only atau tombol simpan disabled |

---

## 6. SUBMIT LAPORAN

### TC-CBN-024: Submit Laporan ke Admin

| Item | Detail |
|------|--------|
| **Prasyarat** | Ada laporan berstatus "Tersimpan" untuk Januari 2025 |
| **Langkah** | 1. Pastikan semua baris sudah terisi<br>2. Klik tombol **"Kirim"** / **"Submit"**<br>3. Konfirmasi |
| **Contoh Input** | Klik "Kirim" untuk laporan Januari 2025 |
| **Output yang Diharapkan** | - Dialog konfirmasi: **"Apakah Anda yakin ingin mengirim laporan bulan Januari 2025?"**<br>- Setelah OK: Notifikasi **"Laporan berhasil dikirim"**<br>- Status semua baris berubah: **"Tersimpan"** → **"Terkirim"**<br>- Laporan tidak bisa diedit lagi (read-only)<br>- Laporan muncul di sisi admin untuk verifikasi |

### TC-CBN-025: Edit Laporan yang Sudah Terkirim

| Item | Detail |
|------|--------|
| **Prasyarat** | Laporan berstatus "Terkirim" |
| **Langkah** | 1. Coba edit data realisasi pada laporan yang sudah dikirim |
| **Contoh Input** | Coba ubah Realisasi Rp |
| **Output yang Diharapkan** | - Tidak bisa mengedit<br>- Form dalam mode read-only<br>- Pesan: **"Laporan sudah dikirim, tidak dapat diedit"** |

### TC-CBN-026: Edit Laporan yang Dikembalikan Admin

| Item | Detail |
|------|--------|
| **Prasyarat** | Laporan dikembalikan oleh admin (status kembali "Tersimpan") |
| **Langkah** | 1. Buka laporan yang dikembalikan<br>2. Lihat catatan admin<br>3. Edit data sesuai catatan<br>4. Simpan |
| **Contoh Input** | Catatan admin terlihat: *"Data realisasi Rp tidak sesuai, mohon perbaiki"*<br>Perbaikan: Realisasi Rp diubah dari `320.000.000` menjadi `315.000.000` |
| **Output yang Diharapkan** | - Catatan admin tampil di halaman laporan<br>- Bisa mengedit data kembali<br>- Setelah simpan: **"Laporan berhasil diperbarui"**<br>- Bisa mengirim ulang ke admin |

---

## 7. CEK IZIN EDIT

### TC-CBN-027: Cek Status Izin Edit Laporan

| Item | Detail |
|------|--------|
| **Prasyarat** | Login sebagai Cibinong |
| **Langkah** | 1. Buka halaman Laporan<br>2. Perhatikan status izin edit |
| **Contoh Input** | *(otomatis dicek saat buka halaman)* |
| **Output yang Diharapkan** | Jika izin aktif:<br>- Form input aktif (bisa diisi)<br>- Tombol Simpan dan Kirim tersedia<br><br>Jika izin tidak aktif:<br>- Form read-only<br>- Pesan: **"Pengisian laporan belum dibuka oleh admin"**<br>- Tombol Simpan dan Kirim disabled |

### TC-CBN-028: Cek Izin Edit dengan Time Window

| Item | Detail |
|------|--------|
| **Prasyarat** | Admin sudah set time window (misal: 1-15 Maret 2025) |
| **Langkah** | 1. Akses halaman Laporan pada tanggal 16 Maret 2025 (setelah window) |
| **Contoh Input** | *(akses setelah waktu berakhir)* |
| **Output yang Diharapkan** | - Form read-only<br>- Pesan: **"Waktu pengisian sudah berakhir"** |

---

## 8. EXPORT LAPORAN

### TC-CBN-029: Export Laporan Sendiri ke Excel

| Item | Detail |
|------|--------|
| **Prasyarat** | Login sebagai Cibinong, ada data laporan |
| **Langkah** | 1. Klik tombol **"Export"**<br>2. Pilih filter |
| **Contoh Input** | Tahun: `2025` |
| **Output yang Diharapkan** | File Excel terdownload: `laporan_cibinong_2025.xlsx`<br>Isi file:<br>- **Header:** Laporan Puskesmas Cibinong - Tahun 2025<br>- **Tabel:**<br><br>\| Sub Kegiatan \| Sumber \| Satuan \| Target K \| Target Rp \| Realisasi K \| Realisasi Rp \| Realisasi Fisik \| Permasalahan \| Upaya \|<br>\|---|---|---|---|---|---|---|---|---|---\|<br>\| Operasional Pelayanan Puskesmas \| JKN \| Laporan \| 14 \| 500.000.000 \| 8 \| 350.000.000 \| 70% \| Sebagian kegiatan... \| Dijadwalkan ulang \|<br>\| Pelayanan Ibu Hamil \| JKN \| Orang \| 520 \| 260.000.000 \| 380 \| 180.000.000 \| 72% \| Target belum... \| Kerjasama kader... \|<br>\| Pelayanan Ibu Bersalin \| JKN \| Orang \| 310 \| 210.000.000 \| 250 \| 150.000.000 \| 75% \| - \| Melanjutkan... \|<br><br>- **Format:** Number format Rp, %, border, header styling |

### TC-CBN-030: Export Laporan per Bulan

| Item | Detail |
|------|--------|
| **Prasyarat** | Ada data laporan Januari 2025 |
| **Langkah** | 1. Filter: Tahun 2025, Bulan Januari<br>2. Klik Export |
| **Contoh Input** | Tahun: `2025`, Bulan: `Januari` |
| **Output yang Diharapkan** | File Excel hanya berisi data Januari 2025 milik Cibinong |

---

## 9. CARA PENGISIAN

### TC-CBN-031: Buka Halaman Cara Pengisian

| Item | Detail |
|------|--------|
| **Prasyarat** | Login sebagai Cibinong |
| **Langkah** | 1. Klik menu **"Cara Pengisian"** di sidebar |
| **Contoh Input** | Klik sidebar > Cara Pengisian |
| **Output yang Diharapkan** | - Halaman panduan/instruksi tampil<br>- Berisi panduan cara mengisi laporan, target, dan angkas<br>- Lengkap dengan screenshot atau penjelasan langkah demi langkah |

---

## 10. LOGOUT

### TC-CBN-032: Logout Puskesmas Cibinong

| Item | Detail |
|------|--------|
| **Prasyarat** | Login sebagai Cibinong |
| **Langkah** | 1. Klik tombol **Logout** |
| **Contoh Input** | Klik tombol Logout |
| **Output yang Diharapkan** | - Token JWT dihapus<br>- Redirect ke `/login`<br>- Akses `/puskesmas/dashboard` → redirect ke `/login` |

---

## RINGKASAN TEST CASE

| Modul | Jumlah TC | ID |
|-------|-----------|-----|
| Login & Autentikasi | 4 | TC-CBN-001 s/d TC-CBN-004 |
| Dashboard Puskesmas | 4 | TC-CBN-005 s/d TC-CBN-008 |
| Manajemen Target | 6 | TC-CBN-009 s/d TC-CBN-014 |
| Manajemen Angkas | 3 | TC-CBN-015 s/d TC-CBN-017 |
| Input Laporan (Bulk) | 6 | TC-CBN-018 s/d TC-CBN-023 |
| Submit Laporan | 3 | TC-CBN-024 s/d TC-CBN-026 |
| Cek Izin Edit | 2 | TC-CBN-027 s/d TC-CBN-028 |
| Export Laporan | 2 | TC-CBN-029 s/d TC-CBN-030 |
| Cara Pengisian | 1 | TC-CBN-031 |
| Logout | 1 | TC-CBN-032 |
| **TOTAL** | **32** | |
