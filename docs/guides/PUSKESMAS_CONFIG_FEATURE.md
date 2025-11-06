# Fitur Konfigurasi Sub Kegiatan Per Puskesmas

## Overview
Fitur ini memungkinkan admin untuk mengkonfigurasi sub kegiatan mana saja yang tersedia untuk setiap puskesmas. Sebelumnya, semua puskesmas dapat mengakses semua sub kegiatan. Dengan fitur ini, admin dapat membatasi dan menyesuaikan sub kegiatan berdasarkan kebutuhan masing-masing puskesmas.

## Use Case
**Contoh:** 
- Puskesmas Bojong Gede hanya menangani sub kegiatan A, B, dan C
- Puskesmas Cimandala hanya menangani sub kegiatan B, C, dan D
- Admin dapat mengatur konfigurasi ini melalui halaman khusus

## Implementasi

### 1. Database Model

#### Model: `PuskesmasSubKegiatan`
**File:** `backend/src/models/PuskesmasSubKegiatan.ts`

**Purpose:** Junction table untuk many-to-many relationship antara User (puskesmas) dan SubKegiatan

**Schema:**
```typescript
{
  id: number (Primary Key, Auto Increment)
  user_id: number (Foreign Key -> users.id, CASCADE ON DELETE)
  id_sub_kegiatan: number (Foreign Key -> sub_kegiatan.id_sub_kegiatan, CASCADE ON DELETE)
  created_at: Date
  updated_at: Date
}
```

**Unique Constraint:** Composite unique index pada `(user_id, id_sub_kegiatan)`

**Associations:**
- `belongsTo User as 'puskesmas'`
- `belongsTo SubKegiatan as 'subKegiatan'`
- `User.belongsToMany SubKegiatan through PuskesmasSubKegiatan as 'assignedSubKegiatan'`
- `SubKegiatan.belongsToMany User through PuskesmasSubKegiatan as 'assignedPuskesmas'`

### 2. Backend API

#### Routes: `puskesmas-config.routes.ts`
**File:** `backend/src/routes/puskesmas-config.routes.ts`

**Base URL:** `/api/puskesmas-config`

**Endpoints:**

1. **GET /puskesmas/:userId/sub-kegiatan**
   - **Purpose:** Get daftar sub kegiatan yang sudah diassign ke puskesmas tertentu
   - **Auth:** Admin only
   - **Response:**
     ```json
     {
       "puskesmas": {
         "id": 2,
         "nama": "Puskesmas Bojong Gede",
         "kode_puskesmas": "PKM001"
       },
       "assignments": [
         {
           "id": 1,
           "user_id": 2,
           "id_sub_kegiatan": 5,
           "subKegiatan": {
             "id_sub_kegiatan": 5,
             "kode_sub": "1.01.01",
             "kegiatan": "Sub Kegiatan A",
             "indikator_kinerja": "...",
             "kegiatanParent": {
               "id_kegiatan": 1,
               "kode": "1.01",
               "kegiatan": "Kegiatan Utama"
             }
           }
         }
       ]
     }
     ```

2. **POST /puskesmas/:userId/sub-kegiatan**
   - **Purpose:** Bulk assign/replace sub kegiatan untuk puskesmas
   - **Auth:** Admin only
   - **Body:**
     ```json
     {
       "subKegiatanIds": [1, 2, 3, 5, 8]
     }
     ```
   - **Logic:** 
     - Hapus semua assignment lama dengan `destroy({ where: { user_id } })`
     - Buat assignment baru dengan `bulkCreate()`
   - **Response:** Success message + total assigned

3. **DELETE /puskesmas/:userId/sub-kegiatan/:subKegiatanId**
   - **Purpose:** Remove single assignment
   - **Auth:** Admin only
   - **Response:** Success message

4. **GET /puskesmas-overview**
   - **Purpose:** Get semua puskesmas dengan jumlah sub kegiatan yang diassign
   - **Auth:** Admin only
   - **Response:**
     ```json
     [
       {
         "id": 2,
         "nama": "Admin PKM Bojong Gede",
         "nama_puskesmas": "Puskesmas Bojong Gede",
         "kecamatan": "Bojong Gede",
         "kode_puskesmas": "PKM001",
         "jumlah_sub_kegiatan": 5
       }
     ]
     ```

**Middleware:** Semua routes menggunakan `authenticate` + `authorizeAdmin`

### 3. Frontend Admin UI

#### Page: `AdminPuskesmasConfigPage`
**File:** `frontend/src/pages/AdminPuskesmasConfigPage.tsx`

**Route:** `/admin/puskesmas-config`

**Features:**
1. **Table View**
   - Menampilkan semua puskesmas
   - Kolom: No, Kode, Nama Puskesmas, Kecamatan, Jumlah Sub Kegiatan, Aksi
   - Tag hijau untuk puskesmas yang sudah dikonfigurasi
   - Button "Konfigurasi" untuk setiap puskesmas

2. **Configuration Modal**
   - Ant Design Transfer component untuk multi-select
   - Dua kolom: "Semua Sub Kegiatan" dan "Sub Kegiatan Terpilih"
   - Search functionality di kedua kolom
   - Menampilkan nama sub kegiatan + parent kegiatan
   - Double-click atau arrow button untuk pindah item
   - Counter total terpilih

3. **Operations**
   - Load overview dengan `/puskesmas-overview`
   - Load assignments dengan `/puskesmas/:userId/sub-kegiatan`
   - Save dengan bulk POST ke `/puskesmas/:userId/sub-kegiatan`
   - Refresh button untuk reload data

**UI Components:**
- `Table` - List puskesmas
- `Modal` - Configuration dialog
- `Transfer` - Multi-select sub kegiatan
- `Tag` - Status indicator
- `Button` - Actions

### 4. Frontend Form Filtering

#### Component: `LaporanForm`
**File:** `frontend/src/components/LaporanForm.tsx`

**Changes:**
- Modified reference data loading untuk fetch only assigned sub kegiatan
- Ambil user ID dari localStorage
- Call `/api/puskesmas-config/puskesmas/:userId/sub-kegiatan` instead of `/api/reference/sub-kegiatan`
- Transform assignment data ke format reference: `{ value, label, id_kegiatan, indikator_kinerja }`
- Puskesmas hanya akan melihat sub kegiatan yang sudah diassign di dropdown

**Effect:** 
- Puskesmas tidak bisa membuat laporan untuk sub kegiatan yang tidak diassign
- Admin tetap bisa melihat semua sub kegiatan (tidak ada filtering untuk admin)

### 5. Menu & Navigation

#### Files Modified:
1. **App.tsx**
   - Added import: `AdminPuskesmasConfigPage`
   - Added route: `/admin/puskesmas-config` dengan `AdminRoute` wrapper

2. **Layout.tsx**
   - Added icon: `AppstoreOutlined`
   - Added menu item: "Konfigurasi Sub Kegiatan" dengan route `/admin/puskesmas-config`
   - Positioned below "Daftar Puskesmas" menu

## Workflow

### Admin Workflow:
1. Login sebagai admin
2. Navigate ke menu "Konfigurasi Sub Kegiatan"
3. Lihat daftar semua puskesmas dengan jumlah assignment
4. Klik "Konfigurasi" pada puskesmas yang ingin diatur
5. Modal terbuka dengan Transfer component
6. Pilih/hapus sub kegiatan dengan drag, double-click, atau arrow button
7. Klik "Simpan"
8. System bulk replace semua assignment untuk puskesmas tersebut

### Puskesmas Workflow:
1. Login sebagai puskesmas
2. Navigate ke "Laporan Kinerja"
3. Klik "Tambah Laporan"
4. Dropdown sub kegiatan hanya menampilkan yang sudah diassign
5. Tidak bisa memilih sub kegiatan lain

## Security

- **Authentication:** Semua endpoints require valid JWT token
- **Authorization:** 
  - Hanya admin yang bisa akses `/api/puskesmas-config/*`
  - Middleware: `authenticate` + `authorizeAdmin`
- **Data Validation:** 
  - User ID validation (must be puskesmas role)
  - Sub kegiatan ID validation (must exist in master data)
- **Foreign Key Constraints:** CASCADE ON DELETE untuk referential integrity

## Edge Cases

1. **Puskesmas belum dikonfigurasi:** Dropdown sub kegiatan kosong di form
2. **Semua assignment dihapus:** POST dengan `subKegiatanIds: []` akan clear semua
3. **Sub kegiatan di-delete:** CASCADE delete akan hapus assignment otomatis
4. **Puskesmas di-delete:** CASCADE delete akan hapus semua assignment
5. **Duplicate assignment:** Unique constraint prevents duplicate

## Testing Checklist

- [ ] Admin dapat view semua puskesmas
- [ ] Admin dapat assign sub kegiatan ke puskesmas
- [ ] Admin dapat unassign sub kegiatan
- [ ] Admin dapat bulk replace semua assignment
- [ ] Puskesmas hanya melihat assigned sub kegiatan di form
- [ ] Puskesmas tidak bisa input laporan untuk unassigned sub kegiatan
- [ ] Delete puskesmas cascade delete assignments
- [ ] Delete sub kegiatan cascade delete assignments
- [ ] Unique constraint prevents duplicate assignments
- [ ] Search functionality di Transfer component
- [ ] Refresh button works
- [ ] Counter shows correct total

## Files Created/Modified

### Backend (Created)
- `backend/src/models/PuskesmasSubKegiatan.ts` (93 lines)
- `backend/src/routes/puskesmas-config.routes.ts` (185 lines)

### Backend (Modified)
- `backend/src/models/index.ts` - Added export
- `backend/src/app.ts` - Registered routes

### Frontend (Created)
- `frontend/src/pages/AdminPuskesmasConfigPage.tsx` (296 lines)

### Frontend (Modified)
- `frontend/src/components/LaporanForm.tsx` - Filtering logic
- `frontend/src/App.tsx` - Route registration
- `frontend/src/components/Layout.tsx` - Menu item

### Documentation
- `PUSKESMAS_CONFIG_FEATURE.md` (this file)

## Total Impact
- **Backend:** ~280 lines production code
- **Frontend:** ~350 lines production code
- **Total:** ~630 lines new/modified code
- **Database:** 1 new table, 2 foreign keys, 1 unique constraint
- **API:** 4 new endpoints
- **UI:** 1 new admin page

## Next Steps (Optional Enhancements)

1. **Bulk Configuration:** Assign same sub kegiatan to multiple puskesmas at once
2. **Templates:** Save/load configuration templates
3. **History:** Track configuration changes with audit log
4. **Notifications:** Notify puskesmas when configuration changes
5. **Import/Export:** Bulk import assignments from Excel
6. **Analytics:** Dashboard showing which sub kegiatan assigned to how many puskesmas
7. **Validation:** Warn if puskesmas has no assignments
8. **Copy Config:** Copy configuration from one puskesmas to another
