# E-EVKIN Modern

Aplikasi modern berbasis web untuk Sistem Evaluasi Kinerja Puskesmas Dinas Kesehatan Kabupaten Bogor.

## 🚀 Tech Stack

### Backend
- **Node.js 18+** with TypeScript 5.3
- **Express.js** - Web framework
- **PostgreSQL** - Database
- **Sequelize ORM** - Database ORM
- **JWT** - Authentication
- **Security**: Helmet, CORS, Rate Limiting, Bcrypt

### Frontend
- **React 18** with TypeScript 5.3
- **Vite 5** - Build tool
- **Ant Design 5** - UI Library
- **React Router v6** - Routing
- **Zustand** - State Management
- **Axios** - HTTP Client
- **Recharts** - Data Visualization

## 📋 Prerequisites

- Node.js 18 atau lebih tinggi
- PostgreSQL 14 atau lebih tinggi
- npm (included with Node.js)

## 🛠️ Installation

### 1. Clone dan Install Dependencies
```bash
git clone <repository-url>
cd e-evkin-modern
npm install
```

### 2. Setup Backend Environment
```bash
cd backend
cp .env.example .env
```

Edit file `.env`:
```env
DB_HOST=localhost
DB_PORT=5432
DB_NAME=e_evkin_modern
DB_USER=postgres
DB_PASSWORD=your_password

JWT_SECRET=your_secure_random_string_here
CORS_ORIGIN=http://localhost:5173
```

### 3. Setup Database
```bash
# Buat database PostgreSQL
createdb e_evkin_modern

# Import data (jika ada)
# psql -U postgres e_evkin_modern < database_dump.sql
```

### 4. Start Development
```bash
# Dari root directory - jalankan backend dan frontend
npm run dev

# Atau jalankan terpisah:
npm run dev:backend   # Backend: http://localhost:5000
npm run dev:frontend  # Frontend: http://localhost:5173
```

## 📁 Struktur Project

```
e-evkin-modern/
├── docs/                   # 📚 Documentation
│   ├── deployment/         # Deployment guides
│   ├── guides/             # User guides
│   ├── security/           # Security documentation
│   └── README.md           # Documentation index
│
├── config/                 # ⚙️ Configuration Files
│   ├── ecosystem.config.js # PM2 configuration
│   ├── nginx.conf          # Nginx configuration
│   └── README.md           # Configuration guide
│
├── scripts/                # 🔧 Utility Scripts
│   ├── backup.sh           # Backup script
│   ├── optimize-server.sh  # Server optimization
│   ├── health-check.sh     # Health monitoring
│   ├── generate-jwt-secret.sh
│   ├── make-executable.sh  # Set script permissions
│   └── README.md           # Scripts documentation
│
├── backend/
│   ├── src/
│   │   ├── config/         # Database & app config
│   │   ├── models/         # Sequelize models
│   │   ├── routes/         # API routes
│   │   │   ├── auth.routes.ts
│   │   │   ├── admin.routes.ts
│   │   │   ├── puskesmas.routes.ts
│   │   │   ├── laporan.routes.ts
│   │   │   ├── kegiatan.routes.ts
│   │   │   ├── masterdata.routes.ts
│   │   │   ├── users.routes.ts
│   │   │   └── report.routes.ts
│   │   ├── middleware/     # Auth, error handler
│   │   ├── app.ts
│   │   └── server.ts
│   └── package.json
│
├── frontend/
│   ├── src/
│   │   ├── components/     # Layout component
│   │   ├── pages/          # Page components
│   │   │   ├── LoginPage.tsx
│   │   │   ├── DashboardPage.tsx
│   │   │   ├── LaporanBulkInputPage.tsx
│   │   │   ├── CaraPengisianPage.tsx
│   │   │   ├── AdminMasterDataPage.tsx
│   │   │   ├── AdminPuskesmasPage.tsx
│   │   │   ├── AdminPuskesmasConfigPage.tsx
│   │   │   ├── AdminLaporanSubKegiatanPage.tsx
│   │   │   └── AdminLaporanSumberAnggaranPage.tsx
│   │   ├── store/          # Zustand state
│   │   ├── App.tsx
│   │   └── main.tsx
│   └── package.json
│
├── deploy.sh               # 🚀 Main deployment script
├── QUICK_START.md          # Quick start guide
├── README.md               # Project documentation
└── package.json            # Root package configuration
```

## 🎯 Fitur Aplikasi

### Untuk Admin (Dinkes)
- ✅ **Dashboard** - Statistik dan grafik realisasi anggaran
- ✅ **Master Data** - Kelola Satuan, Sumber Anggaran, Kegiatan, Sub Kegiatan
- ✅ **Daftar Puskesmas** - Kelola user puskesmas
- ✅ **Konfigurasi Sub Kegiatan** - Assign sub kegiatan ke puskesmas
- ✅ **Laporan Per Sub Kegiatan** - Agregat laporan by sub kegiatan
  - 📊 Detail drill-down dengan filter puskesmas
  - 💾 Download Excel data sesuai filter aktif
- ✅ **Laporan Per Sumber Anggaran** - Agregat laporan by sumber dana
  - 📊 Detail drill-down dengan filter puskesmas
  - 💾 Download Excel data sesuai filter aktif

### Untuk Puskesmas
- ✅ **Laporan Kinerja** - Input laporan dengan tabel bulk input
  - 📝 Kolom Realisasi Fisik (%) dengan validasi max 100%
  - 📊 Sorting pada semua kolom
  - 🎯 Filter by bulan dan tahun
  - 💾 Download Excel laporan
- ✅ **Cara Pengisian** - Panduan lengkap pengisian laporan
- ✅ **Status Laporan** - Tersimpan (draft) dan Terkirim (submitted)

### UI/UX Improvements
- ✅ **Sticky Table Headers** - Header tetap terlihat saat scroll
- ✅ **Column Sorting** - Sort semua kolom tabel (ascending/descending)
- ✅ **Responsive Filters** - Filter bulan, tahun, dan puskesmas
- ✅ **Smart Placeholders** - "Semua Bulan", "Semua Puskesmas" placeholders
- ✅ **Percentage Columns** - % K dan % Rp untuk analisis capaian

## ✨ Recent Updates (v2.1.0)

### Features Added
- **Realisasi Fisik Field** - Kolom input persentase fisik (0-100%) di laporan puskesmas
- **Excel Export Detail** - Download data detail laporan sesuai filter yang aktif
- **Smart Filtering** - Filter puskesmas di modal detail dengan dropdown
- **Column Organization** - Persentase K dan Rp ditempatkan setelah nilai realisasi-nya
- **Sticky Headers** - Table headers tetap terlihat saat scroll vertical
- **Full Sorting** - Semua kolom di tabel dapat di-sort (ascending/descending)
- **Enhanced Placeholders** - "Semua Bulan" dan "Semua Puskesmas" untuk UX lebih intuitif

### Technical Improvements
- TypeScript strict mode compliance
- Proper type annotations on all sorter functions
- Safe handling for division by zero in percentage calculations
- Responsive design for all filter and table components

## 📝 Available Scripts

### Root Level
```bash
npm run dev          # Start backend & frontend
npm run build        # Build production
npm run dev:backend  # Start backend only
npm run dev:frontend # Start frontend only
```

### Backend (cd backend)
```bash
npm run dev          # Development dengan hot reload
npm run build        # Build TypeScript
npm run start        # Start production
npm test             # Run tests
```

### Frontend (cd frontend)
```bash
npm run dev          # Vite dev server
npm run build        # Build production
npm run preview      # Preview build
```

## 🔐 Default Credentials

**Admin Dinkes:**
- Username: `dinkes`
- Password: `dinkes123`

**Puskesmas (contoh):**
- Username: `cibinong`
- Password: `cibinong123`

⚠️ **Ganti password setelah first login!**

## 📦 Deployment

Lihat dokumentasi lengkap di folder **`docs/`**:

### 🚀 Quick Start
- **`QUICK_START.md`** - Panduan memulai cepat (5 menit)
- **`docs/deployment/DEPLOYMENT_QUICK_GUIDE.md`** - Deployment cepat

### 📖 Deployment Guides
- **`docs/deployment/DEPLOYMENT.md`** - Panduan deployment lengkap
- **`docs/deployment/DEPLOYMENT_UBUNTU_AAPANEL.md`** - Khusus Ubuntu 24 + aaPanel
- **`docs/deployment/DEPLOYMENT_READY.md`** - Status dan summary
- **`docs/deployment/PRE_DEPLOYMENT_CHECKLIST.md`** - Checklist sebelum deploy

### 🔧 Setup Guides
- **`docs/guides/DATABASE_SEED.md`** - Database seeding
- **`docs/security/SECURITY.md`** - Security setup
- **`docs/guides/TROUBLESHOOTING.md`** - Troubleshooting

Quick deploy:
```bash
# Build production
npm run build

# Seed database (first time only!)
cd backend && npm run seed

# Deploy to server
./deploy.sh --production

# Or use npm scripts
npm run deploy:production
```

## 🗂️ Project Organization

### **📚 `docs/`** - Documentation
- **`deployment/`** - All deployment guides and checklists
- **`guides/`** - User guides, database seeding, troubleshooting
- **`security/`** - Security setup and JWT configuration

### **⚙️ `config/`** - Configuration Files  
- **`ecosystem.config.js`** - PM2 process management (optimized for 2GB RAM)
- **`nginx.conf`** - Nginx web server configuration (aaPanel compatible)

### **🔧 `scripts/`** - Utility Scripts
- **`optimize-server.sh`** - Server optimization for Ubuntu + aaPanel
- **`backup.sh`** - Application backup utility
- **`health-check.sh`** - Health monitoring
- **`generate-jwt-secret.sh`** - JWT secret generator
- **`make-executable.sh`** - Set script permissions

## 🧪 Testing

```bash
# Run all tests
npm test

# Backend tests
npm test --workspace=backend

# Frontend tests  
npm test --workspace=frontend
```

## 📊 Database Schema

- **users** - Admin dan Puskesmas users
- **kegiatan** - Master kegiatan
- **sub_kegiatan** - Master sub kegiatan
- **satuan** - Master satuan
- **sumber_anggaran** - Master sumber anggaran
- **laporan** - Laporan kinerja puskesmas
- **puskesmas_sub_kegiatan** - Mapping puskesmas ke sub kegiatan

## ⚡ Performance Optimizations

✅ **Latest Updates (Dec 27, 2025)**:
- **Database**: Connection pool 3x capacity (5→15 connections)
- **Indexes**: 8 new performance indexes for faster queries (70-90% improvement)
- **API**: Bulk-upsert endpoint reduces 50 API calls to 1 (80-90% faster)
- **Frontend**: Custom hooks + React.memo for targeted re-renders (50-70% less)

**Result**: Bulk save now ~10x faster (5-10s → <1s)

📖 See detailed report: [`docs/PERFORMANCE_OPTIMIZATION.md`](docs/PERFORMANCE_OPTIMIZATION.md)  
🧪 Testing guide: [`docs/OPTIMIZATION_TESTING_GUIDE.md`](docs/OPTIMIZATION_TESTING_GUIDE.md)

## 🔄 Migration dari PHP Version

Ini adalah rewrite lengkap dari aplikasi E-EVKIN PHP lama dengan:
- ✅ Modern tech stack (React + TypeScript)
- ✅ Better security practices
- ✅ Improved UX dengan Ant Design
- ✅ Better performance & optimizations
- ✅ Type safety dengan TypeScript
- ✅ Responsive mobile-friendly UI
- ✅ Bulk input untuk efisiensi
- ✅ Real-time validation

## 📄 License

Open Source - Free to use

## 🤝 Support

Untuk bantuan atau pertanyaan:
- Buka issue di GitHub
- Hubungi tim development  
- Lihat dokumentasi lengkap di **`docs/`** folder
- Quick troubleshooting: **`docs/guides/TROUBLESHOOTING.md`**

---

**Built with ❤️ for Dinas Kesehatan Kabupaten Bogor**  
*100% Open Source Technologies*
