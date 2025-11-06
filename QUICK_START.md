# Quick Start Guide - E-EVKIN Modern

## ✅ Prerequisites

- Node.js 18+ terinstall
- PostgreSQL 14+ terinstall dan running
- Git terinstall

## 🚀 Quick Setup (5 Menit)

### 1. Clone & Install
```bash
git clone <repository-url>
cd e-evkin-modern
npm install
```

### 2. Configure Backend
```bash
cd backend
cp .env.example .env
```

Edit `.env`:
```env
DB_HOST=localhost
DB_PORT=5432
DB_NAME=e_evkin_modern
DB_USER=postgres
DB_PASSWORD=your_password

JWT_SECRET=your_secure_random_string
CORS_ORIGIN=http://localhost:5173
```

### 3. Setup Database
```bash
# Buat database
createdb e_evkin_modern

# Atau via psql:
psql -U postgres
CREATE DATABASE e_evkin_modern;
\q
```

### 4. Start Application
```bash
# Dari root directory
cd d:\proj\e-evkin-modern
npm run dev
```

Aplikasi akan berjalan di:
- **Backend API**: http://localhost:5000
- **Frontend**: http://localhost:5173

### 5. Login
Buka browser: http://localhost:5173

**Admin Default:**
- Username: `dinkes`
- Password: `dinkes123`

**Puskesmas Default:**
- Username: `cibinong`
- Password: `cibinong123`

## 📋 Status Implementasi

### ✅ Sudah Selesai (100%)

**Backend:**
- ✅ Authentication & Authorization (JWT + Role-based)
- ✅ User Management (Admin & Puskesmas)
- ✅ Master Data CRUD (Satuan, Sumber Anggaran, Kegiatan, Sub Kegiatan)
- ✅ Puskesmas Management
- ✅ Sub Kegiatan Configuration per Puskesmas
- ✅ Bulk Laporan Input API
- ✅ Dashboard Statistics API
- ✅ Reporting API (Per Sub Kegiatan, Per Sumber Anggaran)
- ✅ Excel Export
- ✅ Security (Rate limiting, CORS, Helmet)
- ✅ Error handling

**Frontend:**
- ✅ Login page dengan validasi
- ✅ Dashboard Admin (Charts + Statistics dengan filter)
- ✅ Dashboard redirect untuk Puskesmas
- ✅ Master Data Management page
- ✅ Puskesmas Management page
- ✅ Sub Kegiatan Configuration page
- ✅ Bulk Laporan Input page (tabel editable)
- ✅ Cara Pengisian page (User guide)
- ✅ Report pages dengan Excel export
- ✅ Responsive layout
- ✅ Role-based menu
- ✅ Protected routes

**Database:**
- ✅ All models defined dengan relations
- ✅ Sample data seeded

## 🎯 Fitur yang Tersedia

### Menu Admin
1. **Dashboard** - Statistik dan grafik dengan filter bulan/tahun
2. **Laporan Per Sub Kegiatan** - Export Excel aggregated data
3. **Laporan Per Sumber Anggaran** - Export Excel per sumber dana
4. **Daftar Puskesmas** - CRUD user puskesmas
5. **Konfigurasi Sub Kegiatan** - Assign sub kegiatan ke puskesmas
6. **Master Data** - CRUD Satuan, Sumber Anggaran, Kegiatan, Sub Kegiatan

### Menu Puskesmas
1. **Laporan Kinerja** - Bulk input dengan tabel editable
2. **Cara Pengisian** - Panduan lengkap pengisian laporan

### Fitur Laporan
- ✅ Bulk input (isi banyak baris sekaligus)
- ✅ Auto-format angka dengan thousand separator
- ✅ Dropdown sumber anggaran & satuan
- ✅ Status: Tersimpan (draft) / Terkirim (submitted)
- ✅ Tersimpan bisa diedit, Terkirim read-only
- ✅ Validation pada semua field

## 🛠️ Development Commands

```bash
# Start development (backend + frontend)
npm run dev

# Build production
npm run build

# Start backend only
npm run dev:backend

# Start frontend only
npm run dev:frontend

# Run tests
npm test
```

## 🔧 Common Issues

### Port 5000 sudah digunakan
```bash
# Cari process yang menggunakan port 5000
netstat -ano | findstr :5000

# Kill process
taskkill /F /PID <PID>
```

### Database connection error
- Cek PostgreSQL running: `pg_isready`
- Cek credentials di `.env`
- Cek database exist: `psql -U postgres -l`

### Frontend tidak connect ke backend
- Cek backend running di port 5000
- Cek CORS_ORIGIN di `.env` backend
- Cek Network tab di browser untuk error details

## 📊 Database Schema

**Tables:**
- `users` - Admin dan Puskesmas users
- `kegiatan` - Master kegiatan (40 rows)
- `sub_kegiatan` - Master sub kegiatan (800+ rows)
- `satuan` - Master satuan (20+ rows)
- `sumber_anggaran` - Master sumber anggaran (4 rows)
- `laporan` - Data laporan kinerja (4200+ rows sample)
- `puskesmas_sub_kegiatan` - Mapping config

## 🚢 Production Ready

Aplikasi sudah siap untuk deployment:
- ✅ Production build sukses
- ✅ Environment configs tersedia
- ✅ PM2 ecosystem config
- ✅ Nginx config
- ✅ Deployment scripts
- ✅ Complete documentation

Lihat: `DEPLOYMENT.md` untuk panduan deployment lengkap.

## 📚 Documentation

- `README.md` - Overview & installation
- `DEPLOYMENT.md` - Deployment guide
- `DEPLOYMENT_READY.md` - Deployment summary
- `PRE_DEPLOYMENT_CHECKLIST.md` - Deployment checklist

## 🎉 Next Steps

1. **Test semua fitur** - Login sebagai admin dan puskesmas
2. **Customize** - Sesuaikan dengan kebutuhan spesifik
3. **Deploy** - Ikuti `DEPLOYMENT.md` untuk production
4. **Monitor** - Setup monitoring dan logging

---

**Status: ✅ Production Ready**  
**Version: 1.0.0**  
**Last Updated: November 6, 2025**
