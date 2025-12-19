# Fitur Target Sub Kegiatan - Dokumentasi Implementasi

## Overview
Fitur baru untuk memisahkan input Target (K) dan Target (Rp) dari form laporan puskesmas ke halaman khusus dengan historical tracking.

## Perubahan Arsitektur

### Sebelum
- Target K dan Target Rp diinput langsung di form laporan
- Tidak ada tracking perubahan target
- Target bisa berbeda-beda setiap laporan

### Sesudah
- Target K dan Target Rp dikelola di halaman terpisah `/target`
- Historical tracking untuk setiap perubahan target
- Target otomatis ditampilkan sebagai label readonly di form laporan
- Konsistensi target per periode (bulan/tahun)

## Komponen yang Dibuat

### Backend

#### 1. Model: `SubKegiatanTarget.ts`
**Path:** `backend/src/models/SubKegiatanTarget.ts`

**Schema:**
```typescript
interface SubKegiatanTargetAttributes {
  id: number;
  user_id: string;           // UUID puskesmas
  id_sub_kegiatan: number;   // FK ke sub_kegiatan
  target_k: number;          // Target kuantitas
  target_rp: number;         // Target rupiah
  bulan: string;             // Periode bulan
  tahun: number;             // Periode tahun
  created_by: string;        // User yang membuat/update
  created_at: Date;
  updated_at: Date;
}
```

**Indexes:**
- Composite index: `(user_id, id_sub_kegiatan, bulan, tahun)` untuk lookup cepat
- Single indexes: `user_id`, `id_sub_kegiatan`, `created_at`

#### 2. Routes: `target.routes.ts`
**Path:** `backend/src/routes/target.routes.ts`

**Endpoints:**

| Method | Path | Deskripsi | Auth |
|--------|------|-----------|------|
| GET | `/api/target/` | Get all targets untuk puskesmas | Puskesmas |
| GET | `/api/target/history/:id_sub_kegiatan` | Get history perubahan target | Puskesmas |
| GET | `/api/target/latest/:id_sub_kegiatan` | Get target terbaru untuk periode | Puskesmas |
| GET | `/api/target/assigned` | Get sub kegiatan assigned dengan target | Puskesmas |
| POST | `/api/target/` | Create/update single target | Puskesmas |
| POST | `/api/target/bulk` | Create/update multiple targets | Puskesmas |
| DELETE | `/api/target/:id` | Soft delete target (set ke 0) | Puskesmas |

**Query Parameters:**
- `bulan`: Filter by bulan
- `tahun`: Filter by tahun
- `id_sub_kegiatan`: Filter by sub kegiatan

#### 3. Migration: `create_sub_kegiatan_target.ts`
**Path:** `backend/src/migrations/create_sub_kegiatan_target.ts`

**Cara Menjalankan:**
```bash
cd backend
npx tsx src/migrations/create_sub_kegiatan_target.ts
```

Atau buat script di `package.json`:
```json
"scripts": {
  "migrate:target": "tsx src/migrations/create_sub_kegiatan_target.ts"
}
```

### Frontend

#### 1. Page: `TargetPuskesmasPage.tsx`
**Path:** `frontend/src/pages/TargetPuskesmasPage.tsx`

**Fitur:**
- Tabel editable untuk input target K dan Rp
- Filter berdasarkan bulan dan tahun
- Bulk edit dan bulk save
- View history perubahan target per sub kegiatan
- Status indicator (belum diset / sudah diset / pernah diupdate)

**Components:**
- Table dengan inline editing
- History modal dengan timeline
- Period selector (bulan/tahun)

#### 2. Updated Component: `LaporanForm.tsx`
**Path:** `frontend/src/components/LaporanForm.tsx`

**Perubahan:**
- Target K dan Target Rp berubah dari input field menjadi readonly label
- Auto-fetch target dari API saat memilih sub kegiatan dan periode
- Display alert jika target belum diset
- Link suggestion ke halaman Target Sub Kegiatan

#### 3. Updated Component: `Layout.tsx`
**Path:** `frontend/src/components/Layout.tsx`

**Perubahan:**
- Tambah menu item "Target Sub Kegiatan" untuk puskesmas role
- Icon: `AimOutlined`
- Position: Sebelum "Laporan Kinerja"

#### 4. Updated Component: `App.tsx`
**Path:** `frontend/src/App.tsx`

**Perubahan:**
- Tambah route `/target` dengan protection `PuskesmasRoute`
- Import `TargetPuskesmasPage`

## Flow Penggunaan

### 1. Set Target (Puskesmas)
```
Puskesmas Login
  ↓
Menu "Target Sub Kegiatan"
  ↓
Pilih Bulan & Tahun
  ↓
Klik "Edit Target"
  ↓
Input Target K dan Target Rp untuk setiap sub kegiatan
  ↓
Klik "Simpan"
  ↓
Target tersimpan dengan history
```

### 2. Input Laporan (Puskesmas)
```
Puskesmas Login
  ↓
Menu "Laporan Kinerja"
  ↓
Pilih Sub Kegiatan
  ↓
Pilih Bulan & Tahun
  ↓
Target K dan Target Rp otomatis muncul (readonly)
  ↓
Input Realisasi K, Realisasi Rp, dll
  ↓
Simpan Laporan
```

### 3. View History (Puskesmas)
```
Menu "Target Sub Kegiatan"
  ↓
Pilih Bulan & Tahun
  ↓
Klik icon History pada sub kegiatan
  ↓
Modal menampilkan timeline perubahan:
  - Timestamp perubahan
  - User yang mengubah
  - Nilai target lama dan baru
```

## Historical Tracking

### Cara Kerja
- Setiap kali target diupdate, record BARU dibuat (tidak mengupdate record lama)
- Query latest target menggunakan `ORDER BY created_at DESC LIMIT 1`
- Soft delete dilakukan dengan membuat record baru dengan nilai `target_k = 0` dan `target_rp = 0`

### Data Structure Example
```
id | user_id | id_sub_kegiatan | target_k | target_rp | bulan   | tahun | created_at
---|---------|-----------------|----------|-----------|---------|-------|------------
1  | uuid-1  | 5               | 100      | 1000000   | Januari | 2025  | 2025-01-01
2  | uuid-1  | 5               | 120      | 1200000   | Januari | 2025  | 2025-01-05
3  | uuid-1  | 5               | 150      | 1500000   | Januari | 2025  | 2025-01-10
```

Query latest target akan mengambil record #3.

## API Usage Examples

### 1. Get Latest Target
```bash
GET /api/target/latest/5?bulan=Januari&tahun=2025
Authorization: Bearer <token>
```

Response:
```json
{
  "success": true,
  "data": {
    "id": 3,
    "user_id": "uuid-1",
    "id_sub_kegiatan": 5,
    "target_k": 150,
    "target_rp": 1500000,
    "bulan": "Januari",
    "tahun": 2025,
    "created_at": "2025-01-10T10:00:00Z"
  }
}
```

### 2. Get History
```bash
GET /api/target/history/5?bulan=Januari&tahun=2025
Authorization: Bearer <token>
```

Response:
```json
{
  "success": true,
  "data": [
    {
      "id": 3,
      "target_k": 150,
      "target_rp": 1500000,
      "created_at": "2025-01-10T10:00:00Z",
      "creator": {
        "username": "admin_puskesmas",
        "email": "admin@puskesmas.com"
      }
    },
    {
      "id": 2,
      "target_k": 120,
      "target_rp": 1200000,
      "created_at": "2025-01-05T10:00:00Z",
      "creator": {
        "username": "admin_puskesmas",
        "email": "admin@puskesmas.com"
      }
    }
  ]
}
```

### 3. Bulk Create Targets
```bash
POST /api/target/bulk
Authorization: Bearer <token>
Content-Type: application/json

{
  "bulan": "Januari",
  "tahun": 2025,
  "targets": [
    {
      "id_sub_kegiatan": 5,
      "target_k": 150,
      "target_rp": 1500000
    },
    {
      "id_sub_kegiatan": 6,
      "target_k": 200,
      "target_rp": 2000000
    }
  ]
}
```

## Security & Validation

### Authorization
- Semua endpoint target hanya bisa diakses oleh user dengan role `puskesmas`
- User hanya bisa CRUD target untuk sub kegiatan yang di-assign ke mereka
- Validasi dilakukan di backend dengan check `PuskesmasSubKegiatan`

### Validation Rules
- `target_k`: Integer, min 0
- `target_rp`: BigInt, min 0
- `bulan`: Enum (Januari - Desember)
- `tahun`: Integer
- `id_sub_kegiatan`: Harus sudah di-assign ke puskesmas

## Testing Checklist

### Backend
- [ ] Model SubKegiatanTarget dibuat dengan benar
- [ ] Migration berjalan tanpa error
- [ ] Route target ter-register di app.ts
- [ ] GET /api/target/assigned mengembalikan data yang benar
- [ ] GET /api/target/latest/:id mengembalikan target terbaru
- [ ] GET /api/target/history/:id mengembalikan history lengkap
- [ ] POST /api/target/ membuat record baru
- [ ] POST /api/target/bulk membuat multiple records
- [ ] Authorization check berfungsi (hanya assigned sub kegiatan)

### Frontend
- [ ] Page TargetPuskesmasPage render dengan benar
- [ ] Menu "Target Sub Kegiatan" muncul di sidebar
- [ ] Filter bulan/tahun berfungsi
- [ ] Edit mode toggle berfungsi
- [ ] Bulk save target berhasil
- [ ] History modal tampil dengan benar
- [ ] LaporanForm menampilkan target sebagai readonly
- [ ] LaporanForm fetch target saat pilih periode
- [ ] Alert muncul jika target belum diset

### Integration
- [ ] Target yang diset di halaman Target muncul di form Laporan
- [ ] Perubahan periode di form Laporan fetch target yang benar
- [ ] History tracking berfungsi dengan baik
- [ ] Tidak ada error console di browser
- [ ] Tidak ada error di backend logs

## Deployment Steps

1. **Database Migration**
   ```bash
   cd backend
   npm run migrate:target
   # atau
   npx tsx src/migrations/create_sub_kegiatan_target.ts
   ```

2. **Backend Deployment**
   ```bash
   cd backend
   npm run build
   npm start
   # atau dengan PM2
   pm2 restart e-evkin-backend
   ```

3. **Frontend Deployment**
   ```bash
   cd frontend
   npm run build
   # Copy dist/ ke web server
   ```

4. **Verification**
   - Login sebagai puskesmas
   - Cek menu "Target Sub Kegiatan" muncul
   - Set beberapa target
   - Buka form laporan, pastikan target muncul
   - Cek history tracking berfungsi

## Troubleshooting

### Target tidak muncul di form laporan
- Pastikan target sudah diset di halaman Target Sub Kegiatan
- Pastikan bulan dan tahun sama antara target dan form laporan
- Check browser console untuk error API
- Verify API endpoint `/api/target/latest/:id` mengembalikan data

### History tidak tampil
- Pastikan minimal 2 record target untuk sub kegiatan tersebut
- Check API endpoint `/api/target/history/:id`
- Verify parameter bulan dan tahun dikirim dengan benar

### Bulk save gagal
- Check semua sub kegiatan sudah di-assign ke puskesmas
- Verify request payload format benar
- Check backend logs untuk error detail

## Future Enhancements

1. **Auto-copy target dari periode sebelumnya**
   - Button "Copy dari bulan lalu"
   - Menghemat waktu input

2. **Export target ke Excel**
   - Export data target per periode
   - Format standar untuk reporting

3. **Notifikasi target belum diset**
   - Alert di dashboard jika ada periode yang belum diset target
   - Email reminder

4. **Approval flow untuk perubahan target**
   - Target besar perlu approval admin
   - History approval

5. **Visualisasi trend target**
   - Chart perbandingan target antar periode
   - Trend analysis

## File Changes Summary

### New Files (4)
1. `backend/src/models/SubKegiatanTarget.ts` - Model
2. `backend/src/routes/target.routes.ts` - Routes
3. `backend/src/migrations/create_sub_kegiatan_target.ts` - Migration
4. `frontend/src/pages/TargetPuskesmasPage.tsx` - Page

### Modified Files (4)
1. `backend/src/models/index.ts` - Export SubKegiatanTarget
2. `backend/src/app.ts` - Register target routes
3. `frontend/src/components/Layout.tsx` - Add menu item
4. `frontend/src/components/LaporanForm.tsx` - Display target as readonly
5. `frontend/src/App.tsx` - Add /target route

### Total Lines
- Backend: ~500 lines
- Frontend: ~700 lines
- **Total: ~1,200 lines** of production code

## Contact & Support

Untuk pertanyaan atau issue terkait fitur ini:
- Check dokumentasi ini terlebih dahulu
- Review code comments di file terkait
- Test dengan data sample
- Hubungi development team jika masih ada masalah

---
**Last Updated:** December 12, 2025
**Version:** 1.0.0
**Status:** ✅ Completed
