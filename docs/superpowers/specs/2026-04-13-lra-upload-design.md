# LRA Upload — Realisasi Anggaran Otomatis

## Goal

Admin upload file LRA (Laporan Realisasi Anggaran) Excel setiap bulan. Sistem mengekstrak `realisasi_rp` per puskesmas/sub-kegiatan/sumber-anggaran, menyimpannya di tabel staging, lalu menyajikannya sebagai nilai read-only di form laporan puskesmas. Puskesmas hanya mengisi kinerja (`realisasi_k`), realisasi fisik, permasalahan, dan upaya.

## Background

File LRA berasal dari SiRDA/SIPD Kab. Bogor, format: `LRA SUB KEG DINKES DD BULAN YYYY.xlsx`. Sheet yang digunakan adalah **"SUB KEG"**. Kolom kunci:

| Col | Isi |
|-----|-----|
| 3 | Kode unit (puskesmas), e.g. `1.02.0.00.0.00.01.0010` |
| 4 | Kode sub kegiatan, e.g. `1.02.02.2.02.0001` |
| 5 | Kode rekening detail (kosong = baris summary sub keg) |
| 6 | Uraian |
| 12 | Realisasi JUMLAH (Operasi + Modal) |

Baris sub-kegiatan summary: col 4 terisi, col 5 kosong.
Baris detail: col 4 dan col 5 terisi — digunakan untuk split sumber anggaran via keyword uraian.

## Data Model

### Tabel `lra_upload_batch`

```
id           UUID PK
filename     VARCHAR(255)   -- nama file asli
bulan        VARCHAR(20)    -- 'Januari'–'Desember'
tahun        INTEGER
uploaded_by  UUID FK users
row_count    INTEGER        -- jumlah baris berhasil disimpan
created_at   TIMESTAMP
```

### Tabel `lra_realisasi`

```
id                 SERIAL PK
batch_id           UUID FK lra_upload_batch
user_id            UUID FK users
id_sub_kegiatan    INTEGER FK sub_kegiatan
id_sumber_anggaran INTEGER FK sumber_anggaran
bulan              VARCHAR(20)
tahun              INTEGER
realisasi_rp       BIGINT

INDEX (user_id, id_sub_kegiatan, id_sumber_anggaran, bulan, tahun)
INDEX (batch_id)
```

Tidak ada unique constraint — setiap upload membuat baris baru (append-only). Query terbaru pakai `JOIN lra_upload_batch ORDER BY created_at DESC LIMIT 1`.

## Parser (`lraParserService.ts`)

1. **Deteksi bulan/tahun** dari nama file via regex `/(Januari|Februari|Maret|April|Mei|Juni|Juli|Agustus|September|Oktober|November|Desember)\s+(\d{4})/i`. Jika tidak terdeteksi, wajib diisi manual oleh admin.

2. **Iterasi sheet SUB KEG**:
   - Baris sub-kegiatan summary (col 4 non-empty, col 5 empty): catat `kode_unit`, `kode_sub_kegiatan`, mulai akumulasi per sumber anggaran
   - Baris detail (col 5 non-empty): cek uraian untuk keyword sumber anggaran, tambahkan col 12 ke bucket sumber anggaran yang sesuai

3. **Keyword mapping sumber anggaran** (case-insensitive pada uraian):
   - Mengandung `"BLUD"` → nama sumber: "BLUD"
   - Mengandung `"BOK"` → nama sumber: "BOK"
   - Lainnya → cari `SumberAnggaran` di DB via nama; jika tidak cocok → masuk `unmatched`

4. **Entity matching**:
   - `kode_unit` (col 3) → `users.kode_puskesmas` (exact match)
   - `kode_sub_kegiatan` (col 4) → `sub_kegiatan.kode_sub` (exact match)
   - Tidak cocok → masuk daftar `unmatchedPuskesmas` / `unmatchedSubKegiatan`

5. **Return value**:
```ts
interface LraParseResult {
  bulan: string;
  tahun: number;
  bulanDetectedFromFilename: boolean;
  rows: Array<{
    userId: string;
    idSubKegiatan: number;
    idSumberAnggaran: number;
    realisasiRp: number;
  }>;
  unmatchedPuskesmas: string[];
  unmatchedSubKegiatan: string[];
  unmatchedSumber: string[];
}
```

## Backend Routes

### `POST /api/lra/upload` (admin only)

- **Step 1 (preview)**: Terima multipart `.xlsx` + optional `bulan`/`tahun` override. Parse file, return `LraParseResult` tanpa menyimpan ke DB. Response berisi preview (matched count, unmatched list).
- **Step 2 (confirm)**: `POST /api/lra/confirm` dengan parsed rows (atau re-parse + flag `confirm=true`). Simpan batch + insert `lra_realisasi`. Return ringkasan akhir.

### `GET /api/lra/batches` (admin only)

Return list semua `lra_upload_batch` ORDER BY `created_at DESC`.

### `GET /api/lra/realisasi` (internal)

Digunakan oleh laporan service untuk mengambil `realisasi_rp` terbaru per (user_id, sub_kegiatan, sumber_anggaran, bulan, tahun).

## Perubahan Laporan Service

Saat load data laporan untuk form bulk input puskesmas, join dengan `lra_realisasi` (latest batch):

```sql
SELECT lr.realisasi_rp
FROM lra_realisasi lr
JOIN lra_upload_batch b ON b.id = lr.batch_id
WHERE lr.user_id = :userId
  AND lr.id_sub_kegiatan = :idSubKegiatan
  AND lr.id_sumber_anggaran = :idSumberAnggaran
  AND lr.bulan = :bulan
  AND lr.tahun = :tahun
ORDER BY b.created_at DESC
LIMIT 1
```

Nilai ini dikirim ke frontend sebagai `realisasi_rp_lra` (terpisah dari `realisasi_rp` existing). Frontend menampilkannya sebagai field read-only dan menggunakannya sebagai nilai `realisasi_rp` saat submit.

Jika tidak ada data LRA → `realisasi_rp_lra = 0` dengan flag `lra_available: false`.

## Perubahan Frontend

### Halaman baru: `AdminLraUploadPage.tsx` (`/admin/lra-upload`)

**Form upload:**
- Drag & drop / file picker, accept `.xlsx`
- Tampil auto-detected bulan/tahun + input override
- Tombol "Preview" → panggil step 1 endpoint
- Tabel preview: matched rows, unmatched list
- Tombol "Simpan" / "Batal"

**Tabel history:**
- List `lra_upload_batch`: filename, bulan, tahun, row_count, uploaded_by, created_at

**Navigasi:** Tambah item "Upload LRA" di sidebar admin (di bawah "Upload Angkas").

### Perubahan `LaporanBulkInputPage.tsx`

- Field `realisasi_rp` berubah dari input number menjadi teks read-only
- Label tambahan kecil: "Dari LRA" (jika `lra_available: true`) atau "LRA belum diupload" (jika false)
- Nilai tetap dikirim saat submit (diambil dari `realisasi_rp_lra`)

## Error Handling

- File bukan `.xlsx` → tolak di multer
- Bulan/tahun tidak terdeteksi dari filename → frontend wajibkan input manual
- Unmatched rows → tidak error fatal, dilaporkan ke admin
- Upload ulang bulan yang sama → diizinkan, data lama tetap ada (history), laporan pakai batch terbaru

## Out of Scope

- Tidak ada fitur hapus batch
- Tidak ada rekonsiliasi otomatis jika `realisasi_rp` di laporan sudah diisi manual sebelumnya
- Tidak ada notifikasi ke puskesmas saat LRA diupload
