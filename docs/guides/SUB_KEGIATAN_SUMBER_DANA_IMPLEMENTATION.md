# Implementasi Many-to-Many: Sub Kegiatan - Sumber Dana

## 📋 Overview

Implementasi relasi many-to-many antara `SubKegiatan` dan `SumberAnggaran` untuk menangani kasus dimana 1 sub kegiatan bisa memiliki multiple sumber dana (misal: APBN + APBD + BOK).

## 🎯 Problem Statement

**Sebelum:**
- 1 Laporan hanya bisa 1 sumber dana
- Tidak ada validasi apakah sumber dana valid untuk sub kegiatan tertentu
- Puskesmas bisa memilih sumber dana apapun tanpa batasan

**Setelah:**
- Admin mengatur sumber dana yang valid untuk setiap sub kegiatan
- Puskesmas hanya bisa memilih dari sumber dana yang telah di-assign
- Validasi otomatis saat create/update laporan
- 1 sub kegiatan bisa memiliki multiple sumber dana

## 📊 Database Schema

### Tabel Baru: `sub_kegiatan_sumber_dana`

```sql
CREATE TABLE sub_kegiatan_sumber_dana (
  id SERIAL PRIMARY KEY,
  id_sub_kegiatan INTEGER NOT NULL REFERENCES sub_kegiatan(id_sub_kegiatan) ON DELETE CASCADE,
  id_sumber_anggaran INTEGER NOT NULL REFERENCES sumber_anggaran(id_sumber) ON DELETE CASCADE,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
  UNIQUE(id_sub_kegiatan, id_sumber_anggaran)
);

CREATE INDEX idx_sub_kegiatan ON sub_kegiatan_sumber_dana(id_sub_kegiatan);
CREATE INDEX idx_sumber_anggaran ON sub_kegiatan_sumber_dana(id_sumber_anggaran);
```

### Relasi

```
SubKegiatan ←→ SubKegiatanSumberDana ←→ SumberAnggaran
    (1)              (many-to-many)              (1)
```

## 🔧 Backend Changes

### 1. Models

**File Baru:** `backend/src/models/SubKegiatanSumberDana.ts`
- Junction table model dengan Sequelize
- Unique constraint pada kombinasi `id_sub_kegiatan` + `id_sumber_anggaran`
- Field `is_active` untuk soft enable/disable

**Update:** `backend/src/models/index.ts`
- Setup `belongsToMany` relation antara SubKegiatan dan SumberAnggaran
- Direct associations untuk junction table

### 2. Migration

**File:** `backend/src/migrations/create_sub_kegiatan_sumber_dana.ts`
- Create table dengan indexes
- Migrate existing data dari tabel `laporan` (distinct pairs)
- Revertible dengan down() function

**Run:**
```bash
cd backend
npx tsx src/migrations/create_sub_kegiatan_sumber_dana.ts
```

### 3. API Routes

**File Baru:** `backend/src/routes/sub-kegiatan-sumber-dana.routes.ts`

| Endpoint | Method | Access | Description |
|----------|--------|--------|-------------|
| `/api/sub-kegiatan-sumber-dana` | GET | Admin | Get all mappings (dengan filter) |
| `/api/sub-kegiatan-sumber-dana/by-sub-kegiatan/:id` | GET | Auth | Get sumber dana untuk sub kegiatan tertentu |
| `/api/sub-kegiatan-sumber-dana` | POST | Admin | Add sumber dana ke sub kegiatan |
| `/api/sub-kegiatan-sumber-dana/bulk` | POST | Admin | Bulk assign (replace existing) |
| `/api/sub-kegiatan-sumber-dana/:id` | PUT | Admin | Update is_active status |
| `/api/sub-kegiatan-sumber-dana/:id` | DELETE | Admin | Delete mapping |

### 4. Validation

**Update:** `backend/src/routes/laporan.routes.ts`

**POST /api/laporan (Create):**
```typescript
// Validasi: Cek apakah sumber anggaran valid untuk sub kegiatan
const isValid = await SubKegiatanSumberDana.findOne({
  where: {
    id_sub_kegiatan,
    id_sumber_anggaran,
    is_active: true,
  },
});

if (!isValid) {
  return res.status(400).json({
    error: 'Sumber anggaran tidak valid untuk sub kegiatan ini'
  });
}
```

**PUT /api/laporan/:id (Update):**
- Sama seperti create, validasi jika `id_sumber_anggaran` di-update

### 5. Seeder

**File Baru:** `backend/src/seeders/seedSubKegiatanSumberDana.ts`
- Assign **semua** sumber dana ke **semua** sub kegiatan (default behavior)
- Admin dapat customize via UI

**Run:**
```bash
cd backend
npx tsx src/seeders/seedSubKegiatanSumberDana.ts
```

## 🎨 Frontend Changes

### 1. Admin UI - Manage Sumber Dana

**File Baru:** `frontend/src/components/SubKegiatanSumberDanaModal.tsx`
- Modal dengan **Transfer component** (Ant Design)
- Pilih sumber dana yang valid untuk sub kegiatan
- Bulk update via `/api/sub-kegiatan-sumber-dana/bulk`

**Update:** `frontend/src/pages/AdminKegiatanPage.tsx`
- Tambah button "Sumber Dana" di setiap row sub kegiatan
- Icon: `<SettingOutlined />`
- Open modal untuk manage sumber dana

**Flow:**
1. Admin buka halaman **Kegiatan > Tab Sub Kegiatan**
2. Klik button **"Sumber Dana"** pada sub kegiatan
3. Modal terbuka dengan Transfer component
4. **Kiri:** Semua sumber dana yang tersedia
5. **Kanan:** Sumber dana yang sudah di-assign
6. Pindahkan sumber dana menggunakan arrow buttons
7. Klik **Simpan** → API call `/bulk` → Update database

### 2. Puskesmas UI - Filtered Dropdown

**Update:** `frontend/src/components/LaporanForm.tsx`

**Behavior:**
1. User pilih **Sub Kegiatan**
2. Trigger `handleSubKegiatanChange()`
3. API call: `GET /api/sub-kegiatan-sumber-dana/by-sub-kegiatan/:id`
4. Set `filteredSumberDana` state
5. Dropdown **Sumber Anggaran** di-populate dengan data yang ter-filter
6. Jika tidak ada sumber dana → disabled + warning message

**State Management:**
```typescript
const [filteredSumberDana, setFilteredSumberDana] = useState([]);

// On sub kegiatan change
const response = await axios.get(
  `/api/sub-kegiatan-sumber-dana/by-sub-kegiatan/${value}`
);
const sumberDanaList = response.data.data.map(item => ({
  value: item.sumberAnggaran.id_sumber,
  label: item.sumberAnggaran.sumber,
}));
setFilteredSumberDana(sumberDanaList);
```

**Select Component:**
```tsx
<Select
  disabled={filteredSumberDana.length === 0}
  options={filteredSumberDana.length > 0 
    ? filteredSumberDana 
    : referenceData.sumberAnggaran}
/>
```

## 🚀 Deployment Steps

### 1. Run Migration
```bash
cd backend
npx tsx src/migrations/create_sub_kegiatan_sumber_dana.ts
```

**Result:**
- ✅ Table `sub_kegiatan_sumber_dana` created
- ✅ Existing laporan data migrated (distinct pairs)

### 2. Run Seeder (Optional)
```bash
npx tsx src/seeders/seedSubKegiatanSumberDana.ts
```

**Result:**
- ✅ All sumber dana assigned to all sub kegiatan (default)

### 3. Restart Backend
```bash
npm run dev
```

### 4. Test Admin Panel
1. Login as admin
2. Go to **Kegiatan > Sub Kegiatan tab**
3. Click **"Sumber Dana"** button
4. Customize sumber dana assignments

### 5. Test Puskesmas
1. Login as puskesmas
2. Create new laporan
3. Pilih sub kegiatan → dropdown sumber dana ter-filter
4. Verify hanya sumber dana yang di-assign yang muncul

## 📝 Usage Examples

### Admin: Assign Sumber Dana

```typescript
// Scenario: Sub Kegiatan "Imunisasi Dasar" hanya boleh menggunakan BOK dan APBN

POST /api/sub-kegiatan-sumber-dana/bulk
{
  "id_sub_kegiatan": 5,
  "sumber_anggaran_ids": [1, 3]  // 1 = BOK, 3 = APBN
}

// Response:
{
  "success": true,
  "message": "Berhasil mengatur 2 sumber dana untuk sub kegiatan",
  "data": [...]
}
```

### Puskesmas: Get Valid Sumber Dana

```typescript
// Get sumber dana untuk sub kegiatan ID 5
GET /api/sub-kegiatan-sumber-dana/by-sub-kegiatan/5

// Response:
{
  "success": true,
  "data": [
    {
      "id": 1,
      "id_sub_kegiatan": 5,
      "id_sumber_anggaran": 1,
      "is_active": true,
      "sumberAnggaran": {
        "id_sumber": 1,
        "sumber": "BOK"
      }
    },
    {
      "id": 2,
      "id_sub_kegiatan": 5,
      "id_sumber_anggaran": 3,
      "is_active": true,
      "sumberAnggaran": {
        "id_sumber": 3,
        "sumber": "APBN"
      }
    }
  ]
}
```

### Validation Error

```typescript
// Puskesmas coba submit laporan dengan sumber dana yang tidak valid
POST /api/laporan
{
  "id_sub_kegiatan": 5,
  "id_sumber_anggaran": 2,  // APBD - not assigned!
  ...
}

// Response:
{
  "error": "Invalid sumber anggaran",
  "message": "Sumber anggaran tidak valid untuk sub kegiatan ini. Hubungi admin untuk mengatur sumber dana yang tersedia."
}
```

## ✅ Testing Checklist

- [ ] Migration runs successfully
- [ ] Seeder populates junction table
- [ ] Admin can view all mappings
- [ ] Admin can assign sumber dana via Transfer modal
- [ ] Admin can bulk update sumber dana
- [ ] Puskesmas dropdown shows only valid sumber dana
- [ ] Puskesmas cannot select invalid sumber dana
- [ ] Create laporan validates sumber dana
- [ ] Update laporan validates sumber dana
- [ ] Error messages are clear and helpful

## 🔍 Troubleshooting

### Issue: Dropdown sumber dana kosong

**Check:**
1. Apakah admin sudah assign sumber dana untuk sub kegiatan tersebut?
2. Check API response: `GET /api/sub-kegiatan-sumber-dana/by-sub-kegiatan/:id`
3. Pastikan `is_active = true`

**Fix:**
```bash
# Seed default assignments
npx tsx src/seeders/seedSubKegiatanSumberDana.ts
```

### Issue: Validation error saat create laporan

**Check:**
1. Apakah sumber dana ter-assign untuk sub kegiatan tersebut?
2. Query database:
```sql
SELECT * FROM sub_kegiatan_sumber_dana 
WHERE id_sub_kegiatan = X AND id_sumber_anggaran = Y;
```

**Fix:**
Admin harus assign sumber dana via Admin Panel.

## 📚 Files Changed/Created

### Backend (8 files)
1. ✅ `backend/src/models/SubKegiatanSumberDana.ts` (NEW)
2. ✅ `backend/src/models/index.ts` (UPDATED - relasi)
3. ✅ `backend/src/routes/sub-kegiatan-sumber-dana.routes.ts` (NEW)
4. ✅ `backend/src/app.ts` (UPDATED - register route)
5. ✅ `backend/src/routes/laporan.routes.ts` (UPDATED - validation)
6. ✅ `backend/src/migrations/create_sub_kegiatan_sumber_dana.ts` (NEW)
7. ✅ `backend/src/seeders/seedSubKegiatanSumberDana.ts` (NEW)

### Frontend (3 files)
1. ✅ `frontend/src/components/SubKegiatanSumberDanaModal.tsx` (NEW)
2. ✅ `frontend/src/pages/AdminKegiatanPage.tsx` (UPDATED - button & modal)
3. ✅ `frontend/src/components/LaporanForm.tsx` (UPDATED - filtered dropdown)

### Total: 11 files (4 new, 7 updated)

## 🎉 Benefits

1. **Data Integrity**: Sumber dana hanya yang valid
2. **Flexibility**: Admin kontrol penuh atas assignment
3. **User Experience**: Puskesmas tidak bingung dengan pilihan yang tidak relevan
4. **Audit Trail**: Track kapan sumber dana di-assign
5. **Scalability**: Mudah tambah sumber dana baru tanpa ubah kode

## 📖 References

- Sequelize Many-to-Many: https://sequelize.org/docs/v6/core-concepts/assocs/#many-to-many-relationships
- Ant Design Transfer: https://ant.design/components/transfer
