# Solusi Masalah Duplikasi Angkas per Sumber Anggaran

## Status: ✅ RESOLVED

**Migration dilakukan pada**: 4 Januari 2026  
**Records dihapus**: 37,263 duplicate records  
**Records tersisa**: 20,652 (unik per user + sub_kegiatan + tahun + bulan)

---

## Masalah yang Ditemukan

Untuk **Puskesmas Babakan Madang** dengan sub kegiatan **1.02.02.2.02.0033 (Operasional Pelayanan Puskesmas)**:

### Data Saat Ini:
- **4 Sumber Anggaran** terhubung: JKN, DAK Non Fisik, BLUD, PAD
- **2 Targets** untuk 2025: DAK Non Fisik (Rp 116.070.000) dan PAD (Rp 213.042.070)
- **48 Angkas records** - seharusnya hanya 12!

### Root Cause:
PDF Angkas **TIDAK** memiliki breakdown per sumber anggaran. Parser menyimpan nilai yang sama untuk **setiap sumber anggaran** yang ada di `sub_kegiatan_sumber_dana`.

Contoh Januari:
```
PAD:  Rp 24,199,655 × 4 = diulang 4x untuk 4 sumber anggaran
```

## Rekomendasi Solusi

### **OPSI A: Simpan Angkas Sekali per Kode Rekening (DIREKOMENDASIKAN)**

**Konsep:**
- Hapus kolom `id_sumber_anggaran` dari tabel `anggaran_kas`
- Atau gunakan nilai default/null untuk sumber anggaran
- Saat menampilkan di Laporan, gunakan nilai angkas yang sama untuk semua sumber anggaran

**Keuntungan:**
- Representasi akurat dari data PDF
- Tidak ada duplikasi data
- Query lebih efisien

**Implementasi:**
```sql
-- Remove id_sumber_anggaran constraint from anggaran_kas
ALTER TABLE anggaran_kas ALTER COLUMN id_sumber_anggaran DROP NOT NULL;

-- Update existing data to remove duplicates, keeping first entry
DELETE FROM anggaran_kas a
USING (
  SELECT MIN(id) as keep_id, user_id, id_sub_kegiatan, tahun, bulan
  FROM anggaran_kas 
  WHERE id_sub_kegiatan IS NOT NULL
  GROUP BY user_id, id_sub_kegiatan, tahun, bulan
) b
WHERE a.user_id = b.user_id 
  AND a.id_sub_kegiatan = b.id_sub_kegiatan
  AND a.tahun = b.tahun
  AND a.bulan = b.bulan
  AND a.id != b.keep_id;

-- Set id_sumber_anggaran to NULL for all records
UPDATE anggaran_kas SET id_sumber_anggaran = NULL WHERE id_sub_kegiatan IS NOT NULL;
```

### **OPSI B: Split Proporsional Berdasarkan Target Rp**

**Konsep:**
- Jika Target DAK = 35%, PAD = 65%, split angkas sesuai proporsi
- Membutuhkan data target untuk di-upload terlebih dahulu

**Keuntungan:**
- Memungkinkan tracking per sumber anggaran
- Lebih granular untuk reporting

**Kekurangan:**
- Tidak akurat (asumsi split sama dengan target)
- Kompleks implementasinya
- Perlu re-calculate jika target berubah

### **OPSI C: Flag "Shared" Angkas**

**Konsep:**
- Tambah kolom `is_shared: boolean` di tabel `anggaran_kas`
- UI menampilkan warning bahwa angkas di-share
- Saat kalkulasi, bagi dengan jumlah sumber anggaran

**Implementasi:**
```sql
ALTER TABLE anggaran_kas ADD COLUMN is_shared BOOLEAN DEFAULT FALSE;
```

### **OPSI D: Gunakan Satu Sumber Anggaran Default**

**Konsep:**
- Upload angkas hanya ke satu sumber anggaran "primary"
- Sumber anggaran lain tidak punya angkas (N/A)

**Kekurangan:**
- Tidak sesuai workflow pengguna yang ingin lihat angkas per sumber

---

## ✅ Solusi yang Diimplementasikan

### Perubahan yang Dilakukan:

#### 1. Migration Script (`fix_angkas_duplicates.ts`)
- Menghapus 37,263 duplicate records
- Menyisakan 1 record per kombinasi (user_id + sub_kegiatan + tahun + bulan)
- Set `id_sumber_anggaran = 1` (BLUD) sebagai default

#### 2. Update Route Handler (`angkas.routes.ts`)
```typescript
// Check existing WITHOUT id_sumber_anggaran filter
const existingRecord = await AnggaranKas.findOne({
  where: {
    user_id: userId,
    kode_rekening: row.kodeRekening,
    tahun,
    bulan,
    // id_sumber_anggaran: REMOVED - PDF doesn't have this granularity
  },
});
```

#### 3. API `/api/angkas/by-sub-kegiatan` 
Sudah mengelompokkan berdasarkan `id_sub_kegiatan` saja (tidak per sumber anggaran).
Angkas yang sama ditampilkan untuk SEMUA sumber anggaran dalam satu sub kegiatan.

### Hasil:
- **Sebelum**: 57,915 records (banyak duplikasi)
- **Sesudah**: 20,652 records (unik)
- Babakan Madang sub kegiatan 1.02.02.2.02.0033: 
  - **Sebelum**: 48 records
  - **Sesudah**: 12 records (1 per bulan) ✅

---

## Behavior Setelah Fix

### Saat Upload PDF Angkas:
1. Parser membaca PDF dan extract nilai per kode_rekening per bulan
2. Check apakah record sudah ada untuk kombinasi (user + kode_rekening + tahun + bulan)
3. Jika sudah ada dengan nilai sama → skip
4. Jika sudah ada dengan nilai beda → insert new (history)
5. Jika belum ada → insert new
6. **TIDAK** menyimpan duplikasi untuk setiap sumber anggaran

### Saat Menampilkan Angkas di Laporan:
1. Query angkas berdasarkan `id_sub_kegiatan` + `tahun` + `bulan`
2. **TIDAK** filter berdasarkan `id_sumber_anggaran`
3. Nilai angkas yang sama ditampilkan untuk semua sumber anggaran dalam sub kegiatan tersebut

### Implikasi untuk User:
- Nilai angkas konsisten untuk semua sumber anggaran dalam sub kegiatan yang sama
- Tidak ada lagi angkas yang "double counted"
- Laporan lebih akurat karena menggunakan sumber data yang benar (PDF)

---

## Data Cleanup Script (Jika Perlu Manual)

```sql
-- Count duplicates before cleanup
SELECT COUNT(*) as total,
       COUNT(DISTINCT (user_id, id_sub_kegiatan, tahun, bulan)) as unique_combinations
FROM anggaran_kas
WHERE id_sub_kegiatan IS NOT NULL;

-- Remove duplicates, keep first entry
WITH duplicates AS (
  SELECT id,
         ROW_NUMBER() OVER (
           PARTITION BY user_id, id_sub_kegiatan, tahun, bulan 
           ORDER BY id
         ) as rn
  FROM anggaran_kas
  WHERE id_sub_kegiatan IS NOT NULL
)
DELETE FROM anggaran_kas
WHERE id IN (SELECT id FROM duplicates WHERE rn > 1);

-- Verify cleanup
SELECT COUNT(*) as remaining FROM anggaran_kas WHERE id_sub_kegiatan IS NOT NULL;
```
