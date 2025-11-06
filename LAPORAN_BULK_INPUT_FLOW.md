# Laporan Bulk Input Flow - Documentation

## Overview
Sistem input laporan kinerja telah diubah dari **modal-based single entry** menjadi **table-based bulk input** untuk meningkatkan efisiensi pengisian data.

## Flow Baru (Bulk Input)

### 1. Akses Halaman
- **Route**: `/laporan`
- **Role**: Puskesmas only
- **Komponen**: `LaporanBulkInputPage.tsx`

### 2. Pilih Periode
Puskesmas memilih periode laporan:
- **Bulan**: Dropdown Januari - Desember
- **Tahun**: Dropdown tahun (5 tahun terakhir)

### 3. Load Data
Setelah memilih bulan dan tahun, sistem otomatis:
1. Load semua **sub kegiatan yang dikonfigurasi** untuk puskesmas tersebut
   - Endpoint: `GET /api/puskesmas-config/puskesmas/:userId/sub-kegiatan`
2. Load **laporan yang sudah ada** untuk periode tersebut
   - Endpoint: `GET /api/laporan?bulan=...&tahun=...`
3. **Merge data**: 
   - Jika laporan sudah ada → populate form fields
   - Jika belum ada → show empty fields

### 4. Input Data dalam Table
Semua sub kegiatan ditampilkan dalam table dengan kolom:
- **Fixed Left**: No, Kode, Kegiatan Parent, Sub Kegiatan, Indikator
- **Editable**: 
  - Sumber Anggaran (dropdown)
  - Satuan (dropdown)
  - Target (K) (number input)
  - Target Angkas (Rp) (number input)
  - Target Pagu (Rp) (number input)
  - Realisasi (K) (number input)
  - Realisasi (Rp) (number input)
  - Permasalahan (textarea)
  - Upaya (textarea)
- **Fixed Right**: Status

### 5. Simpan Laporan
**Tombol "Simpan Laporan"**:
- Validasi: Minimal sumber_anggaran dan satuan harus diisi
- Logic:
  - Jika `laporan_id` ada → **UPDATE** existing laporan
  - Jika `laporan_id` tidak ada → **CREATE** new laporan
- Endpoint: 
  - `PUT /api/laporan/:id` (update)
  - `POST /api/laporan` (create)
- Bulk operation: Promise.all untuk semua row yang valid
- Status tetap: **"menunggu"**

### 6. Kirim Laporan
**Tombol "Kirim Laporan [Bulan] [Tahun]"**:
- Disabled jika ada unsaved changes
- Confirmation: Popconfirm "Laporan yang sudah dikirim tidak dapat diubah..."
- Endpoint: `POST /api/laporan/submit`
- Body: `{ bulan, tahun }`
- Status berubah: **"menunggu" → "terkirim"**

### 7. Edit Mode
- **Status "menunggu"**: Semua field **editable**
- **Status "terkirim"** atau **"diverifikasi"**: Semua field **disabled** (read-only)
- **Status "ditolak"**: Field kembali **editable**

## Technical Implementation

### Frontend Component
```tsx
// LaporanBulkInputPage.tsx

interface LaporanRow {
  id_sub_kegiatan: number;
  kode_sub: string;
  kegiatan: string;
  indikator_kinerja: string;
  
  // Form fields
  id_sumber_anggaran?: number;
  id_satuan?: number;
  target_k?: number;
  angkas?: number;
  target_rp?: number;
  realisasi_k?: number;
  realisasi_rp?: number;
  permasalahan?: string;
  upaya?: string;
  
  // Existing data
  laporan_id?: string;
  status?: string;
}
```

### Data Flow
1. **Load Assignments**:
   ```typescript
   GET /api/puskesmas-config/puskesmas/${userId}/sub-kegiatan
   // Returns: { assignments: [{ subKegiatan: {...}, ... }] }
   ```

2. **Load Existing Laporan**:
   ```typescript
   GET /api/laporan?bulan=${bulan}&tahun=${tahun}
   // Returns: { data: [...laporan] }
   ```

3. **Merge Logic**:
   ```typescript
   const mappedRows = assignments.map((assignment) => {
     const existing = existingLaporan.find(
       (l) => l.id_sub_kegiatan === assignment.subKegiatan.id_sub_kegiatan
     );
     
     return {
       ...assignment.subKegiatan,
       laporan_id: existing?.id,
       status: existing?.status,
       id_sumber_anggaran: existing?.id_sumber_anggaran,
       // ... populate other fields from existing
     };
   });
   ```

4. **Save Logic**:
   ```typescript
   const promises = rows
     .filter(row => row.id_sumber_anggaran && row.id_satuan)
     .map(row => {
       const payload = { ...row, bulan, tahun };
       
       if (row.laporan_id) {
         return axios.put(`/api/laporan/${row.laporan_id}`, payload);
       } else {
         return axios.post('/api/laporan', payload);
       }
     });
   
   await Promise.all(promises);
   ```

### Backend Requirements
✅ **Existing endpoints work as-is**:
- `GET /api/puskesmas-config/puskesmas/:userId/sub-kegiatan` - untuk load assignments
- `GET /api/laporan` - untuk load existing data (dengan filter bulan & tahun)
- `POST /api/laporan` - untuk create new laporan
- `PUT /api/laporan/:id` - untuk update existing laporan
- `POST /api/laporan/submit` - untuk change status ke "terkirim"

## Migration dari Flow Lama

### Flow Lama (Deprecated - `/laporan-old`)
- Modal form untuk input satu per satu
- Pilih sub kegiatan dari dropdown
- Fill form → Save → Close modal
- Ulangi untuk setiap sub kegiatan
- **Masalah**: Inefficient untuk 10-50 sub kegiatan

### Flow Baru (Active - `/laporan`)
- Pilih periode → Load semua sub kegiatan sekaligus
- Edit inline dalam table
- Save semua sekaligus (bulk operation)
- **Keuntungan**: 
  - Faster input process
  - Better visibility (lihat semua data sekaligus)
  - Copy-paste friendly
  - Validation sebelum submit

## UI/UX Features

### 1. Filter Sticky
Filter bulan & tahun tetap visible di atas table

### 2. Fixed Columns
- Left: No, Kode, Kegiatan (untuk context)
- Right: Status (untuk visibility)
- Scroll horizontal untuk editable fields

### 3. Number Formatting
- Input: Formatted dengan thousand separator (1.000.000)
- Parser: Remove separator untuk save ke database

### 4. Status Visual
- **Belum Disimpan**: Default tag (grey)
- **Menunggu**: Warning tag (orange) - editable
- **Terkirim**: Processing tag (blue) - read-only
- **Diverifikasi**: Success tag (green) - read-only
- **Ditolak**: Error tag (red) - editable

### 5. Validation
- Minimal: sumber_anggaran + satuan harus diisi
- Warning jika belum save sebelum submit
- Disable submit jika ada unsaved changes

## Testing Checklist

- [x] Load page dengan bulan & tahun
- [x] Data sub kegiatan muncul sesuai konfigurasi
- [x] Existing laporan ter-populate dengan benar
- [x] Input number dengan thousand separator
- [x] Save laporan baru (create)
- [x] Save laporan existing (update)
- [x] Bulk save multiple rows
- [x] Submit laporan (status change)
- [x] Disable fields ketika status "terkirim"
- [x] Refresh button work correctly

## Performance Considerations

### 1. Data Volume
- Typical: 10-50 sub kegiatan per puskesmas
- Table with ~15 columns
- Max rows in single render: ~50

### 2. API Calls
- Initial load: 2 parallel calls (assignments + existing laporan)
- Save: Promise.all untuk bulk operation (1-50 requests)
- Refresh: Re-fetch kedua endpoints

### 3. Optimization Opportunities (Future)
- Batch save endpoint: `POST /api/laporan/bulk` accept array
- Pagination untuk puskesmas dengan banyak sub kegiatan (>50)
- Virtual scrolling untuk large dataset (>100 rows)
- Debounce input fields untuk better performance

## Known Limitations

1. **No auto-save**: User harus click "Simpan" manually
2. **No validation summary**: Error per field, tidak ada global error list
3. **Large batch**: Jika >50 sub kegiatan, performance bisa lambat
4. **Network error**: Jika salah satu save gagal, perlu handle partial success

## Future Enhancements

1. **Auto-save draft**: Save to localStorage sebelum submit
2. **Bulk import**: Import dari Excel template
3. **Field calculator**: Auto-calculate persentase realisasi
4. **Duplicate last month**: Copy data dari bulan sebelumnya
5. **Quick fill**: Fill sumber_anggaran & satuan untuk semua rows sekaligus
6. **Filter by kegiatan parent**: Group by kegiatan parent untuk easier navigation

## Rollback Plan

Jika ada masalah dengan flow baru:
1. Route `/laporan-old` masih available dengan flow lama
2. Ganti route di `App.tsx`: `/laporan` → `LaporanPage` (old)
3. Restore menu di `Layout.tsx`
4. No database changes needed (API sama)
