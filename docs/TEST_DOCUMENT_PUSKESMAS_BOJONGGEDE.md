# DOKUMEN PENGUJIAN - PUSKESMAS BOJONGGEDE

**Aplikasi:** E-EVKIN Modern - Sistem Evaluasi Kinerja Puskesmas
**Role:** Puskesmas
**Nama Puskesmas:** Bojonggede
**Kredensial:** Username: `bojonggede` | Password: `bogorkab`
**Kecamatan:** Bojonggede | **Wilayah:** Parung | **ID BLUD:** BLUD
**Tanggal Dokumen:** 30 Maret 2026
**Tahun Anggaran:** 2026
**Total Pagu:** Rp 4.367.839.106 (16 sub kegiatan x sumber anggaran)
**Sumber Anggaran:** BLUD Puskesmas (Rp 3.738.528.000), DAK Non Fisik/BOK (Rp 446.774.000), APBD/PAD (Rp 182.537.106)

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

### TC-BJG-001: Login Puskesmas Bojonggede Berhasil

| Item | Detail |
|------|--------|
| **Prasyarat** | Aplikasi dapat diakses, belum login |
| **Langkah** | 1. Buka halaman login (`/login`)<br>2. Masukkan username: `bojonggede`<br>3. Masukkan password: `bogorkab`<br>4. Klik tombol **Login** |
| **Contoh Input** | Username: `bojonggede`, Password: `bogorkab` |
| **Output yang Diharapkan** | - Redirect ke `/puskesmas/dashboard`<br>- Sidebar menu puskesmas tampil: Dashboard, Laporan, Target, Cara Pengisian<br>- Header menampilkan: **"Puskesmas Bojonggede"**<br>- Data user: role = `puskesmas`, kecamatan = `Bojonggede`, wilayah = `Parung`, id_blud = `BLUD` |

### TC-BJG-002: Login Gagal - Password Salah

| Item | Detail |
|------|--------|
| **Prasyarat** | Belum login |
| **Langkah** | 1. Input username: `bojonggede`<br>2. Input password: `wrongpassword`<br>3. Klik Login |
| **Contoh Input** | Username: `bojonggede`, Password: `wrongpassword` |
| **Output yang Diharapkan** | - Tetap di halaman `/login`<br>- Notifikasi error: **"Username atau password salah"** |

### TC-BJG-003: Akses Halaman Admin sebagai Puskesmas

| Item | Detail |
|------|--------|
| **Prasyarat** | Login sebagai Puskesmas Bojonggede |
| **Langkah** | 1. Akses langsung URL `/dashboard` (halaman admin)<br>2. Akses langsung URL `/admin/master-data` |
| **Contoh Input** | URL: `http://localhost:5173/admin/master-data` |
| **Output yang Diharapkan** | - Redirect ke `/puskesmas/dashboard` atau halaman unauthorized<br>- Tidak bisa mengakses fitur admin<br>- Pesan: **"Anda tidak memiliki akses ke halaman ini"** |

### TC-BJG-004: Verifikasi Token (Refresh Halaman)

| Item | Detail |
|------|--------|
| **Prasyarat** | Sudah login sebagai Puskesmas Bojonggede |
| **Langkah** | 1. Tekan F5 (refresh browser) |
| **Contoh Input** | *(otomatis)* |
| **Output yang Diharapkan** | - Tetap login sebagai Puskesmas Bojonggede<br>- Dashboard puskesmas tampil kembali |

---

## 2. DASHBOARD PUSKESMAS

### TC-BJG-005: Tampilan Dashboard Puskesmas

| Item | Detail |
|------|--------|
| **Prasyarat** | Login sebagai Puskesmas Bojonggede |
| **Langkah** | 1. Klik menu **"Dashboard"** di sidebar |
| **Contoh Input** | Klik sidebar > Dashboard |
| **Output yang Diharapkan** | Halaman dashboard tampil dengan:<br>- **Filter:** Tahun, Bulan<br>- **Statistik Laporan Sendiri:**<br>  - Total Laporan: contoh `8`<br>  - Tersimpan (Draft): `3`<br>  - Terkirim: `5`<br>  - Terverifikasi: `0`<br>- **Grafik Budget:** Target vs Realisasi Anggaran Bojonggede<br>- Data yang tampil HANYA data milik Puskesmas Bojonggede<br>- **Catatan:** Bojonggede sebagai BLUD punya sumber anggaran BLUD Puskesmas (berbeda dari Cibinong yang JKN) |

### TC-BJG-006: Filter Dashboard per Tahun dan Bulan

| Item | Detail |
|------|--------|
| **Prasyarat** | Di halaman Dashboard Puskesmas |
| **Langkah** | 1. Pilih Tahun: `2025`<br>2. Pilih Bulan: `Januari` |
| **Contoh Input** | Tahun: `2025`, Bulan: `Januari` |
| **Output yang Diharapkan** | - Statistik menampilkan data Januari 2025 saja<br>- Contoh:<br>  - Total Laporan: `5`<br>  - Terkirim: `5`<br>  - Tersimpan: `0` |

### TC-BJG-007: Grafik Budget YTD Puskesmas

| Item | Detail |
|------|--------|
| **Prasyarat** | Di halaman Dashboard Puskesmas |
| **Langkah** | 1. Pilih Tahun: `2025`<br>2. Lihat grafik YTD |
| **Contoh Input** | Tahun: `2025` |
| **Output yang Diharapkan** | - Grafik menampilkan akumulasi bulanan data Bojonggede<br>- Total Target Anggaran: **Rp 4.367.839.106**<br>- Contoh:<br>  - Jan: Target Rp 4.367.839.106 / Realisasi Rp (sesuai laporan)<br>  - Feb: akumulasi YTD<br>  - ... |

### TC-BJG-008: Budget Monthly Breakdown

| Item | Detail |
|------|--------|
| **Prasyarat** | Di halaman Dashboard Puskesmas |
| **Langkah** | 1. Pilih Tahun: `2025`, Bulan: `Januari`<br>2. Lihat breakdown per sub kegiatan |
| **Contoh Input** | Tahun: `2025`, Bulan: `Januari` |
| **Output yang Diharapkan** | Tabel breakdown per sub kegiatan (Bojonggede, data real):<br>- Pelayanan dan Penunjang Pelayanan BLUD \| BLUD \| Target: **Rp 3.738.528.000**<br>- Operasional Pelayanan Puskesmas \| BOK \| Target: **Rp 85.094.000**<br>- Operasional Pelayanan Puskesmas \| PAD \| Target: **Rp 182.537.106**<br>- Pengelolaan Pelayanan Kesehatan Gizi Masyarakat \| BOK \| Target: **Rp 97.130.000**<br>- Pelayanan Kesehatan Penyakit Menular dan Tidak Menular \| BOK \| Target: **Rp 54.000.000**<br>- ... (total 16 baris) |

### TC-BJG-009: Chart Data dengan Filter Sub Kegiatan

| Item | Detail |
|------|--------|
| **Prasyarat** | Di halaman Dashboard Puskesmas |
| **Langkah** | 1. Pilih Tahun: `2025`<br>2. Filter Sub Kegiatan: `Pelayanan dan Penunjang Pelayanan BLUD` |
| **Contoh Input** | Tahun: `2025`, Sub Kegiatan: `Pelayanan dan Penunjang Pelayanan BLUD` |
| **Output yang Diharapkan** | - Grafik hanya menampilkan data sub kegiatan BLUD<br>- Data spesifik untuk Bojonggede saja |

---

## 3. MANAJEMEN TARGET

### TC-BJG-010: Lihat Target yang Di-assign

| Item | Detail |
|------|--------|
| **Prasyarat** | Login sebagai Bojonggede |
| **Langkah** | 1. Klik menu **"Target"** di sidebar |
| **Contoh Input** | Klik sidebar > Target |
| **Output yang Diharapkan** | Tabel target yang di-assign ke Bojonggede (16 baris, data real):<br>- **Sub Kegiatan** \| **Sumber Anggaran** \| **Target Rp (Pagu)**<br>- Pelayanan dan Penunjang Pelayanan BLUD \| BLUD Puskesmas \| `Rp 3.738.528.000`<br>- Pengelolaan Pelayanan Kesehatan Ibu Hamil \| DAK Non Fisik (BOK) \| `Rp 27.260.000`<br>- Pengelolaan Pelayanan Kesehatan Gizi Masyarakat \| DAK Non Fisik (BOK) \| `Rp 97.130.000`<br>- Operasional Pelayanan Puskesmas \| DAK Non Fisik (BOK) \| `Rp 85.094.000`<br>- Operasional Pelayanan Puskesmas \| APBD (PAD) \| `Rp 182.537.106`<br>- Pelayanan Kesehatan Penyakit Menular \| DAK Non Fisik (BOK) \| `Rp 54.000.000`<br>- Pengelolaan Surveilans Kesehatan \| DAK Non Fisik (BOK) \| `Rp 31.458.000`<br>- ... *(total 16 sub kegiatan x sumber, total pagu Rp 4.367.839.106)* |

### TC-BJG-011: Input Target Baru

| Item | Detail |
|------|--------|
| **Prasyarat** | Izin edit `target_kinerja` dan `target_rp` aktif |
| **Langkah** | 1. Tambah target baru<br>2. Isi data<br>3. Simpan |
| **Contoh Input** | - Sub Kegiatan: `Bimbingan Teknis dan Supervisi Pengembangan UKBM`<br>- Sumber Anggaran: `BLUD Puskesmas`<br>- Satuan: `Orang`<br>- Target Kinerja: `50`<br>- Target Rp: `75.000.000`<br>- Tahun: `2025` |
| **Output yang Diharapkan** | - Notifikasi: **"Target berhasil disimpan"**<br>- Baris baru muncul:<br>  Bimbingan Teknis UKBM \| BLUD Puskesmas \| Orang \| 50 \| Rp 75.000.000 |

### TC-BJG-012: Edit Target Kinerja

| Item | Detail |
|------|--------|
| **Prasyarat** | Izin edit `target_kinerja` aktif |
| **Langkah** | 1. Klik edit pada "Operasional Pelayanan Puskesmas"<br>2. Ubah Target K<br>3. Simpan |
| **Contoh Input** | Target K diubah dari `12` menjadi `12` *(tetap, karena sudah sesuai)*<br>Atau diubah menjadi `14` |
| **Output yang Diharapkan** | - Jika ada perubahan: **"Target berhasil diperbarui"**<br>- Target K berubah: `14`<br>- Target Rp tetap: `Rp 1.987.352.268` |

### TC-BJG-013: Bulk Input Target

| Item | Detail |
|------|--------|
| **Prasyarat** | Izin edit target aktif |
| **Langkah** | 1. Isi/edit beberapa target sekaligus<br>2. Klik **"Simpan Semua"** |
| **Contoh Input** | - Baris 1 (Pelayanan BLUD): Target K = `1`, Target Rp = `1.600.000.000`<br>- Baris 2 (Operasional): Target K = `14`, Target Rp = `2.000.000.000`<br>- Baris 3 (Ibu Hamil): Target K = `650`, Target Rp = `320.000.000` |
| **Output yang Diharapkan** | - Notifikasi: **"3 target berhasil disimpan"**<br>- Semua baris ter-update sesuai input |

### TC-BJG-014: Lihat Riwayat Target

| Item | Detail |
|------|--------|
| **Prasyarat** | Target sudah pernah diubah |
| **Langkah** | 1. Klik icon riwayat pada "Operasional Pelayanan Puskesmas" |
| **Contoh Input** | Klik icon riwayat |
| **Output yang Diharapkan** | Riwayat:<br>- **Versi 3** (27/03/2026): Target K: 14, Target Rp: 2.000.000.000, oleh: bojonggede<br>- **Versi 2** (15/02/2025): Target K: 12, Target Rp: 1.987.352.268, oleh: dinkes<br>- **Versi 1** (01/01/2025): Target K: 12, Target Rp: 1.963.807.634, oleh: bojonggede |

### TC-BJG-015: Input Target Saat Izin Edit Tidak Aktif

| Item | Detail |
|------|--------|
| **Prasyarat** | Izin edit `target_kinerja` TIDAK aktif |
| **Langkah** | 1. Coba ubah target kinerja<br>2. Simpan |
| **Contoh Input** | Target K diubah menjadi `20` |
| **Output yang Diharapkan** | - Gagal menyimpan<br>- Pesan: **"Anda tidak diizinkan untuk mengedit target saat ini"** |

### TC-BJG-016: Hapus Target (Soft Delete)

| Item | Detail |
|------|--------|
| **Prasyarat** | Ada target yang ingin dihapus, izin edit aktif |
| **Langkah** | 1. Klik hapus pada target "Bimbingan Teknis UKBM"<br>2. Konfirmasi |
| **Contoh Input** | Konfirmasi: OK |
| **Output yang Diharapkan** | - Notifikasi: **"Target berhasil dihapus"**<br>- Target berubah menjadi 0 (soft delete - buat record baru dengan value 0)<br>- Baris tidak tampil lagi di tabel aktif |

---

## 4. MANAJEMEN ANGKAS

### TC-BJG-017: Lihat Angkas (Anggaran Kas)

| Item | Detail |
|------|--------|
| **Prasyarat** | Login sebagai Bojonggede, di halaman Target |
| **Langkah** | 1. Lihat bagian Angkas |
| **Contoh Input** | *(otomatis tampil)* |
| **Output yang Diharapkan** | Tabel angkas per sub kegiatan (contoh, sesuai PDF angkas):<br>- Pelayanan dan Penunjang Pelayanan BLUD \| BLUD \| Angkas: `sesuai upload PDF`<br>- Operasional Pelayanan Puskesmas \| BOK \| Angkas: `sesuai upload PDF`<br>- Operasional Pelayanan Puskesmas \| PAD \| Angkas: `sesuai upload PDF`<br>- Pengelolaan Pelayanan Kesehatan Gizi Masyarakat \| BOK \| Angkas: `sesuai upload PDF` |

### TC-BJG-018: Input Angkas

| Item | Detail |
|------|--------|
| **Prasyarat** | Izin edit `angkas` aktif |
| **Langkah** | 1. Edit angkas untuk sub kegiatan<br>2. Simpan |
| **Contoh Input** | - Sub Kegiatan: `Pelayanan dan Penunjang Pelayanan BLUD`<br>- Angkas: `1.500.000.000` |
| **Output yang Diharapkan** | - Notifikasi: **"Angkas berhasil disimpan"**<br>- Angkas berubah: `Rp 1.500.000.000` |

### TC-BJG-019: Bulk Input Angkas

| Item | Detail |
|------|--------|
| **Prasyarat** | Izin edit angkas aktif |
| **Langkah** | 1. Isi beberapa angkas sekaligus<br>2. Simpan |
| **Contoh Input** | - Baris 1 (Pelayanan BLUD): Angkas = `1.500.000.000`<br>- Baris 2 (Operasional): Angkas = `1.900.000.000`<br>- Baris 3 (Ibu Hamil): Angkas = `300.000.000`<br>- Baris 4 (Ibu Bersalin): Angkas = `240.000.000` |
| **Output yang Diharapkan** | - Notifikasi: **"4 angkas berhasil disimpan"** |

### TC-BJG-020: Input Angkas Saat Izin Tidak Aktif

| Item | Detail |
|------|--------|
| **Prasyarat** | Izin edit `angkas` TIDAK aktif |
| **Langkah** | 1. Coba edit angkas<br>2. Simpan |
| **Contoh Input** | Angkas: `2.000.000.000` |
| **Output yang Diharapkan** | - Gagal menyimpan<br>- Pesan: **"Anda tidak diizinkan untuk mengedit angkas saat ini"** |

---

## 5. INPUT LAPORAN (BULK)

### TC-BJG-021: Buka Halaman Laporan Bulk Input

| Item | Detail |
|------|--------|
| **Prasyarat** | Login sebagai Bojonggede, izin edit laporan aktif |
| **Langkah** | 1. Klik menu **"Laporan"** di sidebar |
| **Contoh Input** | Klik sidebar > Laporan |
| **Output yang Diharapkan** | Halaman bulk input tampil:<br>- **Filter:** Tahun, Bulan<br>- **Tabel input** dengan baris sesuai sub kegiatan yang di-assign ke Bojonggede<br>- **Kolom:** Sub Kegiatan, Sumber Anggaran, Satuan, Target K, Target Rp, Angkas, Realisasi K, Realisasi Rp, Realisasi Fisik (%), Permasalahan, Upaya<br>- Kolom Target otomatis terisi dari data target<br>- **Catatan:** Bojonggede punya lebih banyak sub kegiatan dibanding Cibinong karena sebagai BLUD |

### TC-BJG-022: Input Laporan Bulanan - Satu Baris

| Item | Detail |
|------|--------|
| **Prasyarat** | Di halaman Laporan, Tahun: 2025, Bulan: Agustus |
| **Langkah** | 1. Pilih Tahun: `2025`, Bulan: `Agustus`<br>2. Isi data realisasi pada baris "Operasional Pelayanan Puskesmas"<br>3. Klik **Simpan** |
| **Contoh Input** | Baris: Operasional Pelayanan Puskesmas / BLUD Puskesmas<br>- Realisasi K: `8`<br>- Realisasi Rp: `715.231.756`<br>- Realisasi Fisik: `36`<br>- Permasalahan: `Sebagian Kegiatan Belum terlaksana`<br>- Upaya: `Akan dijadwalkan kembali` |
| **Output yang Diharapkan** | - Notifikasi: **"Laporan berhasil disimpan"**<br>- Status: **"Tersimpan"** (draft)<br>- Data tersimpan:<br>  - Target K: `14` (dari target)<br>  - Target Rp: `Rp 2.000.000.000` (dari target)<br>  - Angkas: `Rp 1.900.000.000` (dari angkas)<br>  - Realisasi K: `8`<br>  - Realisasi Rp: `Rp 715.231.756`<br>  - Realisasi Fisik: `36%`<br>  - Permasalahan & Upaya tersimpan |

### TC-BJG-023: Bulk Input Laporan - Semua Baris

| Item | Detail |
|------|--------|
| **Prasyarat** | Di halaman Laporan, Tahun: 2025, Bulan: Januari |
| **Langkah** | 1. Isi semua baris sub kegiatan<br>2. Klik **"Simpan Semua"** |
| **Contoh Input** | **Baris 1:** Pelayanan dan Penunjang Pelayanan BLUD / BLUD Puskesmas<br>- Realisasi K: `1`, Realisasi Rp: `500.000.000`, Realisasi Fisik: `33`<br>- Permasalahan: `Realisasi belanja masih rendah karena proses pengadaan belum selesai`<br>- Upaya: `Mempercepat proses pengadaan barang dan jasa`<br><br>**Baris 2:** Operasional Pelayanan Puskesmas / BLUD Puskesmas<br>- Realisasi K: `8`, Realisasi Rp: `715.231.756`, Realisasi Fisik: `36`<br>- Permasalahan: `Sebagian kegiatan belum terlaksana`<br>- Upaya: `Akan dijadwalkan kembali`<br><br>**Baris 3:** Pengelolaan Pelayanan Ibu Hamil / BLUD Puskesmas<br>- Realisasi K: `420`, Realisasi Rp: `180.000.000`, Realisasi Fisik: `60`<br>- Permasalahan: `Cakupan K4 masih rendah di beberapa desa`<br>- Upaya: `Intensifikasi kunjungan rumah oleh bidan desa`<br><br>**Baris 4:** Pengelolaan Pelayanan Ibu Bersalin / BLUD Puskesmas<br>- Realisasi K: `300`, Realisasi Rp: `170.000.000`, Realisasi Fisik: `68`<br>- Permasalahan: `Masih ada persalinan di dukun`<br>- Upaya: `Sosialisasi persalinan di faskes dan kemitraan bidan-dukun`<br><br>**Baris 5:** Pengelolaan Surveilans Kesehatan / DAK Non Fisik<br>- Realisasi K: `3`, Realisasi Rp: `100.000.000`, Realisasi Fisik: `67`<br>- Permasalahan: `Keterlambatan pencairan dana DAK`<br>- Upaya: `Koordinasi dengan bagian keuangan daerah` |
| **Output yang Diharapkan** | - Notifikasi: **"5 laporan berhasil disimpan"**<br>- Semua baris berstatus **"Tersimpan"** (draft)<br>- Setiap baris menampilkan data yang telah diisi |

### TC-BJG-024: Edit Laporan yang Sudah Tersimpan

| Item | Detail |
|------|--------|
| **Prasyarat** | Ada laporan Januari 2025 berstatus "Tersimpan" |
| **Langkah** | 1. Edit data realisasi<br>2. Simpan |
| **Contoh Input** | Baris: Operasional Pelayanan Puskesmas<br>- Realisasi Rp diubah dari `715.231.756` menjadi `750.000.000`<br>- Realisasi Fisik diubah dari `36` menjadi `38`<br>- Permasalahan diubah: `Sebagian kegiatan belum terlaksana, kendala cuaca` |
| **Output yang Diharapkan** | - Notifikasi: **"Laporan berhasil diperbarui"**<br>- Data ter-update sesuai perubahan |

### TC-BJG-025: Input Laporan dengan Realisasi Fisik Negatif

| Item | Detail |
|------|--------|
| **Prasyarat** | Di halaman input laporan |
| **Langkah** | 1. Isi Realisasi Fisik dengan nilai negatif<br>2. Simpan |
| **Contoh Input** | Realisasi Fisik: `-5` |
| **Output yang Diharapkan** | - Validasi gagal<br>- Pesan error: **"Realisasi fisik tidak boleh kurang dari 0"**<br>- Data tidak tersimpan |

### TC-BJG-026: Input Laporan Saat Izin Edit Tidak Aktif

| Item | Detail |
|------|--------|
| **Prasyarat** | Izin edit `laporan` TIDAK aktif |
| **Langkah** | 1. Coba isi data realisasi<br>2. Simpan |
| **Contoh Input** | Realisasi K: `10`, Realisasi Rp: `800.000.000` |
| **Output yang Diharapkan** | - Gagal menyimpan<br>- Pesan: **"Anda tidak diizinkan untuk mengedit laporan saat ini"**<br>- Form read-only atau tombol simpan disabled |

### TC-BJG-027: Input Laporan Bulan Berbeda

| Item | Detail |
|------|--------|
| **Prasyarat** | Izin edit aktif untuk Februari 2025 |
| **Langkah** | 1. Ganti bulan ke `Februari`<br>2. Isi data realisasi<br>3. Simpan |
| **Contoh Input** | Bulan: `Februari`<br>Baris: Operasional Pelayanan Puskesmas<br>- Realisasi K: `10`<br>- Realisasi Rp: `850.000.000`<br>- Realisasi Fisik: `43` |
| **Output yang Diharapkan** | - Data tersimpan sebagai laporan Februari 2025 (terpisah dari Januari)<br>- Notifikasi: **"Laporan berhasil disimpan"**<br>- Data Januari tetap tidak berubah |

---

## 6. SUBMIT LAPORAN

### TC-BJG-028: Submit Laporan ke Admin

| Item | Detail |
|------|--------|
| **Prasyarat** | Ada laporan Januari 2025 berstatus "Tersimpan" (5 baris terisi) |
| **Langkah** | 1. Pastikan semua baris sudah terisi<br>2. Klik tombol **"Kirim"**<br>3. Konfirmasi |
| **Contoh Input** | Klik "Kirim" untuk laporan Januari 2025 |
| **Output yang Diharapkan** | - Dialog konfirmasi: **"Apakah Anda yakin ingin mengirim laporan bulan Januari 2025? Setelah dikirim, laporan tidak dapat diedit."**<br>- Setelah OK: Notifikasi **"Laporan berhasil dikirim"**<br>- Status semua baris berubah: **"Tersimpan"** → **"Terkirim"**<br>- Laporan menjadi read-only<br>- Di sisi admin: laporan Bojonggede Januari 2025 muncul untuk verifikasi |

### TC-BJG-029: Edit Laporan yang Sudah Terkirim

| Item | Detail |
|------|--------|
| **Prasyarat** | Laporan berstatus "Terkirim" |
| **Langkah** | 1. Coba edit data realisasi |
| **Contoh Input** | Coba ubah Realisasi Rp |
| **Output yang Diharapkan** | - Tidak bisa mengedit<br>- Form read-only<br>- Pesan: **"Laporan sudah dikirim, tidak dapat diedit"** |

### TC-BJG-030: Edit Laporan yang Dikembalikan Admin

| Item | Detail |
|------|--------|
| **Prasyarat** | Admin sudah mengembalikan laporan Januari 2025 dengan catatan |
| **Langkah** | 1. Buka laporan Januari 2025<br>2. Lihat catatan admin<br>3. Perbaiki data<br>4. Simpan<br>5. Kirim ulang |
| **Contoh Input** | Catatan admin terlihat: *"Realisasi Rp Pelayanan BLUD tidak sesuai bukti. Realisasi fisik Surveilans perlu diperbaiki."*<br><br>Perbaikan:<br>- Baris 1 (Pelayanan BLUD): Realisasi Rp diubah dari `500.000.000` menjadi `485.000.000`<br>- Baris 5 (Surveilans): Realisasi Fisik diubah dari `67` menjadi `60` |
| **Output yang Diharapkan** | - Catatan admin tampil jelas di halaman laporan<br>- Bisa mengedit data (status kembali "Tersimpan")<br>- Setelah simpan: **"Laporan berhasil diperbarui"**<br>- Setelah kirim ulang: status kembali **"Terkirim"** |

### TC-BJG-031: Submit Laporan Tidak Lengkap

| Item | Detail |
|------|--------|
| **Prasyarat** | Hanya 3 dari 5 baris yang terisi |
| **Langkah** | 1. Isi hanya sebagian baris<br>2. Klik **"Kirim"** |
| **Contoh Input** | Hanya 3 baris terisi, 2 baris kosong |
| **Output yang Diharapkan** | - Peringatan: **"Masih ada 2 sub kegiatan yang belum diisi. Apakah Anda yakin ingin mengirim?"**<br>- Jika tetap kirim: hanya laporan yang terisi yang dikirim<br>- ATAU: Semua baris wajib diisi sebelum kirim (tergantung implementasi) |

---

## 7. CEK IZIN EDIT

### TC-BJG-032: Cek Status Izin Edit Laporan - Aktif

| Item | Detail |
|------|--------|
| **Prasyarat** | Admin sudah membuka izin edit laporan |
| **Langkah** | 1. Buka halaman Laporan |
| **Contoh Input** | *(otomatis dicek)* |
| **Output yang Diharapkan** | - Form input aktif (bisa diisi)<br>- Tombol Simpan dan Kirim tersedia<br>- Indikator status: **"Pengisian laporan terbuka"** |

### TC-BJG-033: Cek Status Izin Edit Laporan - Tidak Aktif

| Item | Detail |
|------|--------|
| **Prasyarat** | Admin belum/sudah menutup izin edit |
| **Langkah** | 1. Buka halaman Laporan |
| **Contoh Input** | *(otomatis dicek)* |
| **Output yang Diharapkan** | - Form read-only<br>- Pesan: **"Pengisian laporan belum dibuka oleh admin"**<br>- Tombol Simpan dan Kirim disabled<br>- Data yang sudah ada tetap bisa dilihat (read-only) |

### TC-BJG-034: Izin Edit Hanya untuk Puskesmas Lain

| Item | Detail |
|------|--------|
| **Prasyarat** | Admin membuka izin edit hanya untuk Cibinong (bukan Bojonggede) |
| **Langkah** | 1. Buka halaman Laporan sebagai Bojonggede |
| **Contoh Input** | *(otomatis dicek)* |
| **Output yang Diharapkan** | - Form read-only<br>- Pesan: **"Anda tidak diizinkan untuk mengedit laporan saat ini"**<br>- Bojonggede tidak bisa input meskipun Cibinong bisa |

---

## 8. EXPORT LAPORAN

### TC-BJG-035: Export Laporan Sendiri ke Excel

| Item | Detail |
|------|--------|
| **Prasyarat** | Login sebagai Bojonggede, ada data laporan |
| **Langkah** | 1. Klik tombol **"Export"**<br>2. Pilih filter |
| **Contoh Input** | Tahun: `2025` |
| **Output yang Diharapkan** | File Excel terdownload: `laporan_bojonggede_2025.xlsx`<br>Isi file:<br>- **Header:** Laporan Puskesmas Bojonggede - Tahun 2025<br>- **Tabel:**<br><br>\| Sub Kegiatan \| Sumber \| Satuan \| Target K \| Target Rp \| Realisasi K \| Realisasi Rp \| Realisasi Fisik \| Permasalahan \| Upaya \|<br>\|---|---|---|---|---|---|---|---|---|---\|<br>\| Pelayanan BLUD \| BLUD Puskesmas \| unit kerja \| 1 \| 1.600.000.000 \| 1 \| 485.000.000 \| 33% \| Realisasi belanja... \| Mempercepat... \|<br>\| Operasional Puskesmas \| BLUD Puskesmas \| Laporan \| 14 \| 2.000.000.000 \| 8 \| 750.000.000 \| 38% \| Sebagian kegiatan... \| Dijadwalkan... \|<br>\| Pelayanan Ibu Hamil \| BLUD Puskesmas \| Orang \| 650 \| 320.000.000 \| 420 \| 180.000.000 \| 60% \| Cakupan K4... \| Intensifikasi... \|<br>\| Pelayanan Ibu Bersalin \| BLUD Puskesmas \| Orang \| 400 \| 250.000.000 \| 300 \| 170.000.000 \| 68% \| Masih ada... \| Sosialisasi... \|<br>\| Surveilans Kesehatan \| DAK Non Fisik \| Dokumen \| 4 \| 150.000.000 \| 3 \| 100.000.000 \| 60% \| Keterlambatan... \| Koordinasi... \|<br><br>- **Summary:** Total Target Rp: Rp 4.320.000.000, Total Realisasi: Rp 1.685.000.000 (39.0%)<br>- **Format:** Currency Rp, %, border, header styling |

### TC-BJG-036: Export Hanya Data yang Sudah Dikirim

| Item | Detail |
|------|--------|
| **Prasyarat** | Ada data laporan yang sudah dikirim |
| **Langkah** | 1. Filter: Tahun 2025, Bulan Januari<br>2. Klik Export |
| **Contoh Input** | Tahun: `2025`, Bulan: `Januari` |
| **Output yang Diharapkan** | File Excel hanya berisi data Januari 2025 milik Bojonggede |

---

## 9. CARA PENGISIAN

### TC-BJG-037: Buka Halaman Cara Pengisian

| Item | Detail |
|------|--------|
| **Prasyarat** | Login sebagai Bojonggede |
| **Langkah** | 1. Klik menu **"Cara Pengisian"** di sidebar |
| **Contoh Input** | Klik sidebar > Cara Pengisian |
| **Output yang Diharapkan** | - Halaman panduan/instruksi tampil<br>- Berisi panduan cara mengisi:<br>  1. Cara login<br>  2. Cara input target kinerja dan target Rp<br>  3. Cara input angkas<br>  4. Cara input laporan bulanan<br>  5. Cara submit laporan<br>  6. Cara melihat dashboard<br>  7. Cara export data ke Excel |

---

## 10. LOGOUT

### TC-BJG-038: Logout Puskesmas Bojonggede

| Item | Detail |
|------|--------|
| **Prasyarat** | Login sebagai Bojonggede |
| **Langkah** | 1. Klik tombol **Logout** |
| **Contoh Input** | Klik tombol Logout |
| **Output yang Diharapkan** | - Token JWT dihapus<br>- Redirect ke `/login`<br>- Akses `/puskesmas/dashboard` → redirect ke `/login` |

---

## RINGKASAN TEST CASE

| Modul | Jumlah TC | ID |
|-------|-----------|-----|
| Login & Autentikasi | 4 | TC-BJG-001 s/d TC-BJG-004 |
| Dashboard Puskesmas | 5 | TC-BJG-005 s/d TC-BJG-009 |
| Manajemen Target | 7 | TC-BJG-010 s/d TC-BJG-016 |
| Manajemen Angkas | 4 | TC-BJG-017 s/d TC-BJG-020 |
| Input Laporan (Bulk) | 7 | TC-BJG-021 s/d TC-BJG-027 |
| Submit Laporan | 4 | TC-BJG-028 s/d TC-BJG-031 |
| Cek Izin Edit | 3 | TC-BJG-032 s/d TC-BJG-034 |
| Export Laporan | 2 | TC-BJG-035 s/d TC-BJG-036 |
| Cara Pengisian | 1 | TC-BJG-037 |
| Logout | 1 | TC-BJG-038 |
| **TOTAL** | **38** | |

---

## PERBEDAAN UTAMA DENGAN PUSKESMAS CIBINONG

| Aspek | Bojonggede | Cibinong |
|-------|-----------|----------|
| **ID BLUD** | BLUD | JKN |
| **Wilayah** | Parung | Cibinong |
| **Kecamatan** | Bojonggede | Cibinong |
| **Sumber Anggaran Utama** | BLUD Puskesmas (Rp 3,74M) | BLUD Puskesmas (Rp 2,14M) |
| **Jumlah Sub Keg x Sumber** | 16 baris | 16 baris |
| **Total Pagu** | **Rp 4.367.839.106** | **Rp 2.641.939.962** |
| **Sumber Dana** | BLUD + BOK + PAD | BLUD + BOK + PAD |
| **BOK Total** | Rp 446.774.000 | Rp 305.093.500 |
| **PAD** | Rp 182.537.106 | Rp 181.390.962 |
