# 📊 DATABASE SCHEMA - E-EVKIN MODERN

**Dokumentasi Lengkap Struktur Data & Relasi Aplikasi**

---

## 📑 Daftar Isi
1. [Tabel Users](#1-users)
2. [Tabel Kegiatan](#2-kegiatan)
3. [Tabel Sub Kegiatan](#3-sub_kegiatan)
4. [Tabel Satuan](#4-satuan)
5. [Tabel Sumber Anggaran](#5-sumber_anggaran)
6. [Tabel Laporan](#6-laporan)
7. [Tabel Puskesmas Sub Kegiatan](#7-puskesmas_sub_kegiatan)
8. [Tabel Sub Kegiatan Sumber Dana](#8-sub_kegiatan_sumber_dana)
9. [Tabel Sub Kegiatan Target](#9-sub_kegiatan_target)
10. [Diagram ER](#diagram-entity-relationship)
11. [Ringkasan Relasi](#ringkasan-relasi)

---

## 1. USERS
**Tabel:** `users`  
**Deskripsi:** Menyimpan informasi pengguna sistem (Admin & Puskesmas)

### Field Schema

| Field | Type | Constraint | Keterangan |
|-------|------|-----------|-----------|
| `id` | UUID | PK, UUIDV4 | Primary Key identitas unik pengguna |
| `username` | VARCHAR(100) | UNIQUE, NOT NULL | Username login, harus unik |
| `password` | VARCHAR(255) | NOT NULL | Password ter-hash menggunakan bcrypt |
| `nama` | VARCHAR(200) | NOT NULL | Nama lengkap pengguna |
| `role` | ENUM('puskesmas', 'admin') | NOT NULL | Role pengguna: puskesmas atau admin |
| `kode_puskesmas` | VARCHAR(50) | NULLABLE | Kode identitas puskesmas |
| `nama_puskesmas` | VARCHAR(200) | NULLABLE | Nama lengkap puskesmas |
| `id_blud` | VARCHAR(50) | NULLABLE | ID BLUD (Badan Layanan Umum Daerah) |
| `kecamatan` | VARCHAR(100) | NULLABLE | Nama kecamatan tempat puskesmas |
| `wilayah` | VARCHAR(100) | NULLABLE | Nama wilayah/kabupaten |
| `created_at` | TIMESTAMP | | Waktu penciptaan record |
| `updated_at` | TIMESTAMP | | Waktu update terakhir record |

### Relasi Outgoing
- ↔ **Laporan** (1:N) - User adalah pembuat laporan
- ↔ **Laporan** (1:N) - User adalah verifier/admin yang memverifikasi
- ↔ **PuskesmasSubKegiatan** (1:N) - User assigned ke multiple sub-kegiatan
- ↔ **SubKegiatanTarget** (1:N) - User memiliki multiple target

---

## 2. KEGIATAN
**Tabel:** `kegiatan`  
**Deskripsi:** Master data kegiatan utama dalam program kesehatan

### Field Schema

| Field | Type | Constraint | Keterangan |
|-------|------|-----------|-----------|
| `id_kegiatan` | INTEGER | PK, AUTO_INCREMENT | Primary Key kegiatan |
| `id_uraian` | INTEGER | NOT NULL | ID uraian kegiatan |
| `kode` | VARCHAR(20) | NOT NULL | Kode kegiatan untuk identifikasi |
| `kegiatan` | VARCHAR(200) | NOT NULL | Nama lengkap kegiatan |
| `createdAt` | TIMESTAMP | | Waktu penciptaan record |
| `updatedAt` | TIMESTAMP | | Waktu update terakhir record |

### Relasi Outgoing
- → **SubKegiatan** (1:N) - Satu kegiatan memiliki banyak sub-kegiatan

---

## 3. SUB_KEGIATAN
**Tabel:** `sub_kegiatan`  
**Deskripsi:** Detail sub-kegiatan yang merupakan breakdown dari kegiatan utama

### Field Schema

| Field | Type | Constraint | Keterangan |
|-------|------|-----------|-----------|
| `id_sub_kegiatan` | INTEGER | PK, AUTO_INCREMENT | Primary Key sub-kegiatan |
| `id_kegiatan` | INTEGER | FK → kegiatan, NOT NULL | Foreign Key ke Kegiatan parent |
| `kode_sub` | VARCHAR(200) | NOT NULL | Kode sub-kegiatan |
| `kegiatan` | VARCHAR(200) | NOT NULL | Nama sub-kegiatan |
| `indikator_kinerja` | TEXT | NOT NULL | Indikator kinerja yang akan diukur |
| `createdAt` | TIMESTAMP | | Waktu penciptaan record |
| `updatedAt` | TIMESTAMP | | Waktu update terakhir record |

### Relasi
- **Parent:** ← **Kegiatan** (N:1) - Belongs to Kegiatan
- **Children:** → **Laporan** (1:N) - Memiliki banyak laporan
- **M:M:** ↔ **SumberAnggaran** (M:N via SubKegiatanSumberDana)
- **M:M:** ↔ **User** (M:N via PuskesmasSubKegiatan)

---

## 4. SATUAN
**Tabel:** `satuan`  
**Deskripsi:** Master data satuan pengukuran untuk realisasi

### Field Schema

| Field | Type | Constraint | Keterangan |
|-------|------|-----------|-----------|
| `id_satuan` | INTEGER | PK, AUTO_INCREMENT | Primary Key satuan |
| `satuannya` | VARCHAR(200) | NOT NULL | Nama satuan (unit, buah, orang, dll) |
| `createdAt` | TIMESTAMP | | Waktu penciptaan record |
| `updatedAt` | TIMESTAMP | | Waktu update terakhir record |

### Relasi Outgoing
- → **Laporan** (1:N) - Satuan digunakan dalam banyak laporan

---

## 5. SUMBER_ANGGARAN
**Tabel:** `sumber_anggaran`  
**Deskripsi:** Master data sumber dana/anggaran

### Field Schema

| Field | Type | Constraint | Keterangan |
|-------|------|-----------|-----------|
| `id_sumber` | INTEGER | PK, AUTO_INCREMENT | Primary Key sumber anggaran |
| `sumber` | VARCHAR(200) | NOT NULL | Nama sumber anggaran (Pusat, Daerah, dll) |
| `createdAt` | TIMESTAMP | | Waktu penciptaan record |
| `updatedAt` | TIMESTAMP | | Waktu update terakhir record |

### Relasi Outgoing
- → **Laporan** (1:N) - Sumber anggaran terkait banyak laporan
- → **SubKegiatanSumberDana** (1:N) - Digunakan dalam banyak mapping sub-kegiatan

---

## 6. LAPORAN
**Tabel:** `laporan`  
**Deskripsi:** Laporan kinerja bulanan puskesmas dengan data realisasi dan target

### Field Schema

| Field | Type | Constraint | Keterangan |
|-------|------|-----------|-----------|
| `id` | UUID | PK, UUIDV4 | Primary Key laporan unik |
| `user_id` | UUID | FK → users, NOT NULL | User/Puskesmas pembuat laporan |
| `id_kegiatan` | INTEGER | NOT NULL | ID Kegiatan yang dilaporkan |
| `id_sub_kegiatan` | INTEGER | FK → sub_kegiatan, NOT NULL | ID Sub-Kegiatan yang dilaporkan |
| `id_sumber_anggaran` | INTEGER | FK → sumber_anggaran, NOT NULL | Sumber anggaran untuk kegiatan |
| `id_satuan` | INTEGER | FK → satuan, NOT NULL | Satuan pengukuran realisasi |
| `target_k` | INTEGER | NOT NULL | Target kuantitas (jumlah) |
| `angkas` | BIGINT | NOT NULL | Angka keterangan/satuan harga |
| `target_rp` | BIGINT | NOT NULL | Target dalam rupiah (target_k × angkas) |
| `realisasi_k` | INTEGER | NOT NULL | Realisasi kuantitas (yang tercapai) |
| `realisasi_rp` | BIGINT | NOT NULL | Realisasi dalam rupiah (realisasi_k × angkas) |
| `realisasi_fisik` | DECIMAL(5,2) | NOT NULL, DEFAULT 0 | Persentase realisasi fisik (0-100%) |
| `permasalahan` | TEXT | NOT NULL | Deskripsi permasalahan yang dihadapi |
| `upaya` | TEXT | NOT NULL | Upaya/solusi yang dilakukan |
| `bulan` | VARCHAR(20) | NOT NULL | Bulan laporan (Januari-Desember) |
| `tahun` | INTEGER | NOT NULL | Tahun laporan |
| `status` | ENUM('menunggu', 'terkirim', 'diverifikasi', 'ditolak', 'tersimpan') | | Status perjalanan dokumen |
| `catatan` | TEXT | NULLABLE | Catatan dari admin saat verifikasi |
| `verified_by` | UUID | FK → users (self-reference), NULLABLE | Admin yang memverifikasi laporan |
| `verified_at` | TIMESTAMP | NULLABLE | Waktu verifikasi laporan |
| `created_at` | TIMESTAMP | | Waktu penciptaan laporan |
| `updated_at` | TIMESTAMP | | Waktu update terakhir |

### Status Values
- `menunggu` - Laporan baru, belum diverifikasi
- `terkirim` - Laporan telah dikirim puskesmas
- `diverifikasi` - Laporan disetujui admin
- `ditolak` - Laporan ditolak admin
- `tersimpan` - Laporan draft/tersimpan

### Relasi
- **Parent:** ← **User** (N:1) - Belongs to User pembuat
- **Parent:** ← **User** (N:1) - Belongs to User verifier (verified_by)
- **Parent:** ← **SubKegiatan** (N:1) - Belongs to SubKegiatan
- **Parent:** ← **SumberAnggaran** (N:1) - Belongs to SumberAnggaran
- **Parent:** ← **Satuan** (N:1) - Belongs to Satuan

---

## 7. PUSKESMAS_SUB_KEGIATAN
**Tabel:** `puskesmas_sub_kegiatan`  
**Deskripsi:** Junction table untuk relasi Many-to-Many antara User (Puskesmas) dan SubKegiatan

### Field Schema

| Field | Type | Constraint | Keterangan |
|-------|------|-----------|-----------|
| `id` | INTEGER | PK, AUTO_INCREMENT | Primary Key junction table |
| `user_id` | UUID | FK → users, NOT NULL | ID Puskesmas |
| `id_sub_kegiatan` | INTEGER | FK → sub_kegiatan, NOT NULL | ID Sub-Kegiatan yang ditugaskan |
| `created_at` | TIMESTAMP | | Waktu penugasan |
| `updated_at` | TIMESTAMP | | Waktu update terakhir |

### Constraints
- **UNIQUE:** `(user_id, id_sub_kegiatan)` - Setiap puskesmas hanya ditugaskan 1x per sub-kegiatan
- **CASCADE:** DELETE dan UPDATE otomatis saat user/sub-kegiatan dihapus

### Relasi (Many-to-Many)
- **User** ↔ **SubKegiatan** melalui tabel ini
  - `User.belongsToMany(SubKegiatan, as: 'assignedSubKegiatan')`
  - `SubKegiatan.belongsToMany(User, as: 'assignedPuskesmas')`

---

## 8. SUB_KEGIATAN_SUMBER_DANA
**Tabel:** `sub_kegiatan_sumber_dana`  
**Deskripsi:** Junction table untuk relasi Many-to-Many antara SubKegiatan dan SumberAnggaran

### Field Schema

| Field | Type | Constraint | Keterangan |
|-------|------|-----------|-----------|
| `id` | INTEGER | PK, AUTO_INCREMENT | Primary Key junction table |
| `id_sub_kegiatan` | INTEGER | FK → sub_kegiatan, CASCADE | ID Sub-Kegiatan |
| `id_sumber_anggaran` | INTEGER | FK → sumber_anggaran, CASCADE | ID Sumber Anggaran |
| `is_active` | BOOLEAN | NOT NULL, DEFAULT true | Status aktivasi mapping |
| `createdAt` | TIMESTAMP | | Waktu pembuatan mapping |
| `updatedAt` | TIMESTAMP | | Waktu update terakhir |

### Constraints
- **UNIQUE:** `(id_sub_kegiatan, id_sumber_anggaran)` - Kombinasi unik per mapping
- **CASCADE:** DELETE dan UPDATE otomatis saat sub-kegiatan/sumber-anggaran dihapus

### Indexes
- `(id_sub_kegiatan)` - Untuk query by sub-kegiatan
- `(id_sumber_anggaran)` - Untuk query by sumber-anggaran

### Relasi (Many-to-Many)
- **SubKegiatan** ↔ **SumberAnggaran** melalui tabel ini
  - `SubKegiatan.belongsToMany(SumberAnggaran, as: 'sumberAnggaranList')`
  - `SumberAnggaran.belongsToMany(SubKegiatan, as: 'subKegiatanList')`

---

## 9. SUB_KEGIATAN_TARGET
**Tabel:** `sub_kegiatan_target`  
**Deskripsi:** Menyimpan target tahunan/bulanan per puskesmas untuk setiap sub-kegiatan dan sumber dana

### Field Schema

| Field | Type | Constraint | Keterangan |
|-------|------|-----------|-----------|
| `id` | INTEGER | PK, AUTO_INCREMENT | Primary Key target |
| `user_id` | UUID | FK → users, CASCADE | ID Puskesmas pemilik target |
| `id_sub_kegiatan` | INTEGER | FK → sub_kegiatan, CASCADE | ID Sub-Kegiatan target |
| `id_sumber_anggaran` | INTEGER | FK → sumber_anggaran, CASCADE | ID Sumber Anggaran target |
| `target_k` | INTEGER | NOT NULL, DEFAULT 0 | Target kuantitas |
| `target_rp` | BIGINT | NOT NULL, DEFAULT 0 | Target dalam Rupiah |
| `bulan` | VARCHAR(20) | NULLABLE | Bulan target (null jika tahunan) |
| `tahun` | INTEGER | NOT NULL | Tahun target |
| `created_by` | UUID | FK → users, NOT NULL | User yang membuat/mengupdate target |
| `created_at` | TIMESTAMP | | Waktu penciptaan target |
| `updated_at` | TIMESTAMP | | Waktu update terakhir |

### Deskripsi Field
- **bulan:** Jika NULL = target tahunan, Jika ada value = target bulanan
- **target_k:** Jumlah target yang ingin dicapai dalam unit satuan
- **target_rp:** Budget/anggaran yang dialokasikan untuk mencapai target
- **created_by:** User admin/supervisor yang membuat atau mengupdate target ini

### Relasi
- **Parent:** ← **User** (N:1, user_id) - Belongs to Puskesmas
- **Parent:** ← **SubKegiatan** (N:1) - Belongs to SubKegiatan
- **Parent:** ← **SumberAnggaran** (N:1) - Belongs to SumberAnggaran
- **Parent:** ← **User** (N:1, created_by) - Belongs to User yang membuat

---

## 🔗 DIAGRAM ENTITY-RELATIONSHIP

```
┌──────────────────────────────────────────────────────────────────────────┐
│                                  USERS                                    │
│  ┌──────────────────────────────────────────────────────────────────────┐ │
│  │ ★ id (UUID, PK)                                                      │ │
│  │   username (UNIQUE), password, nama, role (enum)                     │ │
│  │   kode_puskesmas, nama_puskesmas, id_blud, kecamatan, wilayah        │ │
│  │   created_at, updated_at                                             │ │
│  └──────────────────────────────────────────────────────────────────────┘ │
└─────────┬──────────────────────────────┬────────────────────┬─────────────┘
          │                              │                    │
          │ (1:N)                        │ (M:N via junction) │ (1:N)
          │ user_id                      │                    │ created_by
          │                              │                    │
          ▼                              ▼                    ▼
┌──────────────────────────┐   ┌───────────────────────┐  ┌──────────────────┐
│      LAPORAN             │   │PUSKESMAS_SUB_         │  │SUB_KEGIATAN_     │
│  ┌──────────────────────┐│   │KEGIATAN (Junction)    │  │TARGET            │
│  │★ id (UUID, PK)       ││   │  ┌────────────────────┤  │  ┌──────────────┐ │
│  │★ user_id (FK Users)  ││   │  │★ id                │  │  │★ id          │ │
│  │★ id_sub_kegiatan (FK)├┼───┼─►│★ user_id (FK)      │  │  │★ user_id (FK)│ │
│  │★ id_sumber_anggaran..│◄┐  │★ id_sub_kegiatan ────┼─►│  │★ id_sub.. (FK)│
│  │★ id_satuan (FK)      │ │  │                      │  │  │★ id_sumber..(FK)
│  │  target_k, angkas    │ │  │  created_at, updated │  │  │  target_k      │
│  │  target_rp, realisasi│ │  │                      │  │  │  target_rp     │
│  │  realisasi_k, rp     │ │  └─────────┬────────────┤  │  │  bulan, tahun  │
│  │  realisasi_fisik     │ │            │            │  │  │  created_by    │
│  │  permasalahan, upaya │ │            ▼            │  │  └──────────────┘ │
│  │  bulan, tahun        │ │    ┌────────────────────┐  └──────────────────┘
│  │  status, catatan     │ │    │  SUB_KEGIATAN      │
│  │  verified_by, at     │ │    │  ┌────────────────┐│
│  │  created_at, updated │ │    │  │★ id_sub_kegiatan││
│  └──────────────────────┘│    │  │★ id_kegiatan ──┐│
└──────────────────────────┘    │  │  kode_sub       ││
          ▲                       │  │  kegiatan       ││
          │                       │  │  indikator..    ││
          │ (1:N)                 │  │  createdAt,     ││
          │ id_satuan             │  │  updatedAt      ││
          │                       │  └────────┬────────┘│
    ┌─────┴────────┐              │           │        │
    │              │              │           │        │
    │        ┌─────┴──────┐       │           ▼        │
    │        │            │       │    ┌──────────────┐│
    │        ▼            ▼       │    │ KEGIATAN     ││
  ┌─┴────────────┐  ┌───────────┐│    │ ┌──────────┐ ││
  │   SATUAN     │  │SUB_KEGIATAN│    │ │★ id_kegiatan││
  │  ┌────────┐  │  │SUMBER_DANA ├────┼─┤  id_uraian  ││
  │  │★ id    │  │  │ (Junction) │    │ │  kode       ││
  │  │★ satuan│  │  │ ┌────────┐ │    │ │  kegiatan   ││
  │  └────────┘  │  │ │★ id    │ │    │ │  createdAt  ││
  └──────────────┘  │ │★ id_sub──┼─┐  │ │  updatedAt  ││
                    │ │★ id_sumber┤ │  │ └──────────┘ ││
                    │ │  is_active│ │  └──────────────┘│
                    │ │           │ │                 │
                    │ └─────────┬─┘ │                 │
                    └───────────┼───┘                 │
                                │                     │
                        ┌───────┴──────────┐          │
                        │                  │          │
                        ▼                  ▼          │
                  ┌──────────────┐  ┌──────────────┐ │
                  │SUMBER_ANGGARAN   LAPORAN (relasi)─┘
                  │┌──────────────┐ │
                  ││★ id_sumber   │ │
                  ││  sumber      │ │
                  ││  createdAt   │ │
                  ││  updatedAt   │ │
                  │└──────────────┘ │
                  └──────────────────┘
```

---

## 📊 RINGKASAN RELASI

### One-to-Many (1:N) Relationships

| Dari | Ke | Field | Deskripsi |
|------|-----|-------|-----------|
| **User** | **Laporan** | user_id | User membuat laporan |
| **User** | **Laporan** | verified_by | User memverifikasi laporan |
| **User** | **SubKegiatanTarget** | user_id | User memiliki target |
| **User** | **SubKegiatanTarget** | created_by | User membuat target |
| **Kegiatan** | **SubKegiatan** | id_kegiatan | Kegiatan punya sub-kegiatan |
| **SubKegiatan** | **Laporan** | id_sub_kegiatan | Sub-kegiatan punya laporan |
| **SumberAnggaran** | **Laporan** | id_sumber_anggaran | Sumber anggaran dalam laporan |
| **SumberAnggaran** | **SubKegiatanTarget** | id_sumber_anggaran | Sumber anggaran dalam target |
| **Satuan** | **Laporan** | id_satuan | Satuan dalam laporan |

### Many-to-Many (M:N) Relationships

| Tabel 1 | Tabel 2 | Junction Table | Deskripsi |
|---------|---------|----------------|-----------|
| **User** | **SubKegiatan** | **PuskesmasSubKegiatan** | Puskesmas ditugaskan ke sub-kegiatan |
| **SubKegiatan** | **SumberAnggaran** | **SubKegiatanSumberDana** | Sub-kegiatan menggunakan sumber anggaran |

### Relasi Self-Reference

| Tabel | Field | Referensi | Deskripsi |
|-------|-------|-----------|-----------|
| **Laporan** | verified_by | users.id | Admin yang memverifikasi laporan yang dibuat user lain |

---

## 🔑 PRIMARY KEYS SUMMARY

| Tabel | PK | Type | Tipe |
|-------|-----|------|------|
| users | id | UUID | Generated (UUIDV4) |
| kegiatan | id_kegiatan | INTEGER | Auto Increment |
| sub_kegiatan | id_sub_kegiatan | INTEGER | Auto Increment |
| satuan | id_satuan | INTEGER | Auto Increment |
| sumber_anggaran | id_sumber | INTEGER | Auto Increment |
| laporan | id | UUID | Generated (UUIDV4) |
| puskesmas_sub_kegiatan | id | INTEGER | Auto Increment |
| sub_kegiatan_sumber_dana | id | INTEGER | Auto Increment |
| sub_kegiatan_target | id | INTEGER | Auto Increment |

---

## 🏗️ FOREIGN KEYS SUMMARY

| Tabel | Field | Referensi | Cascade |
|-------|-------|-----------|---------|
| sub_kegiatan | id_kegiatan | kegiatan(id_kegiatan) | No |
| laporan | user_id | users(id) | No |
| laporan | verified_by | users(id) | No |
| laporan | id_sub_kegiatan | sub_kegiatan(id_sub_kegiatan) | No |
| laporan | id_sumber_anggaran | sumber_anggaran(id_sumber) | No |
| laporan | id_satuan | satuan(id_satuan) | No |
| puskesmas_sub_kegiatan | user_id | users(id) | CASCADE |
| puskesmas_sub_kegiatan | id_sub_kegiatan | sub_kegiatan(id_sub_kegiatan) | CASCADE |
| sub_kegiatan_sumber_dana | id_sub_kegiatan | sub_kegiatan(id_sub_kegiatan) | CASCADE |
| sub_kegiatan_sumber_dana | id_sumber_anggaran | sumber_anggaran(id_sumber) | CASCADE |
| sub_kegiatan_target | user_id | users(id) | CASCADE |
| sub_kegiatan_target | id_sub_kegiatan | sub_kegiatan(id_sub_kegiatan) | CASCADE |
| sub_kegiatan_target | id_sumber_anggaran | sumber_anggaran(id_sumber) | CASCADE |
| sub_kegiatan_target | created_by | users(id) | No |

---

## 🔐 UNIQUE CONSTRAINTS

| Tabel | Columns | Keterangan |
|-------|---------|-----------|
| users | username | Username harus unik |
| puskesmas_sub_kegiatan | (user_id, id_sub_kegiatan) | Setiap puskesmas 1x per sub-kegiatan |
| sub_kegiatan_sumber_dana | (id_sub_kegiatan, id_sumber_anggaran) | Setiap kombinasi sub-kegiatan & sumber dana unik |

---

## 📈 INDEXES

| Tabel | Columns | Type | Tujuan |
|-------|---------|------|--------|
| puskesmas_sub_kegiatan | (user_id, id_sub_kegiatan) | UNIQUE | Query dan enforce unique constraint |
| sub_kegiatan_sumber_dana | (id_sub_kegiatan, id_sumber_anggaran) | UNIQUE | Query dan enforce unique constraint |
| sub_kegiatan_sumber_dana | (id_sub_kegiatan) | Normal | Query by sub-kegiatan |
| sub_kegiatan_sumber_dana | (id_sumber_anggaran) | Normal | Query by sumber-anggaran |

---

## 💡 CATATAN PENTING

### Cascade Delete
- **puskesmas_sub_kegiatan:** Jika user/sub-kegiatan dihapus, assignment otomatis terhapus
- **sub_kegiatan_sumber_dana:** Jika sub-kegiatan/sumber-anggaran dihapus, mapping otomatis terhapus
- **sub_kegiatan_target:** Jika user/sub-kegiatan/sumber-anggaran dihapus, target otomatis terhapus

### Realisasi Fisik
- Field `realisasi_fisik` di tabel `laporan` adalah persentase (0-100)
- Biasanya dihitung dari: `(realisasi_k / target_k) * 100`

### Status Laporan
Laporan memiliki workflow status:
1. `tersimpan` → `terkirim` → `diverifikasi` ✓
2. `diverifikasi` ← `ditolak` ← `terkirim`

### Target vs Realisasi
- **SubKegiatanTarget:** Target awal yang ditetapkan di awal tahun/bulan
- **Laporan:** Laporan realisasi (target ditarik dari master data laporan)

---

## 🔗 REFERENSI MODEL SEQUELIZE

Semua model menggunakan Sequelize ORM dengan definisi di folder `backend/src/models/`:
- `User.ts` - Model User
- `Kegiatan.ts` - Model Kegiatan
- `SubKegiatan.ts` - Model SubKegiatan
- `Satuan.ts` - Model Satuan
- `SumberAnggaran.ts` - Model SumberAnggaran
- `Laporan.ts` - Model Laporan
- `PuskesmasSubKegiatan.ts` - Model PuskesmasSubKegiatan
- `SubKegiatanSumberAnggaran.ts` - Model SubKegiatanSumberAnggaran
- `SubKegiatanTarget.ts` - Model SubKegiatanTarget
- `index.ts` - Definisi relasi lengkap

---

**Terakhir diperbarui:** December 2025  
**Platform:** Node.js + Express + TypeScript + PostgreSQL + Sequelize ORM
