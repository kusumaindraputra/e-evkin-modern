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
├── DEPLOYMENT.md           # Panduan deployment
├── DEPLOYMENT_READY.md     # Summary deployment
├── PRE_DEPLOYMENT_CHECKLIST.md
└── package.json
```

## 🎯 Fitur Aplikasi

### Untuk Admin (Dinkes)
- ✅ **Dashboard** - Statistik dan grafik realisasi anggaran
- ✅ **Master Data** - Kelola Satuan, Sumber Anggaran, Kegiatan, Sub Kegiatan
- ✅ **Daftar Puskesmas** - Kelola user puskesmas
- ✅ **Konfigurasi Sub Kegiatan** - Assign sub kegiatan ke puskesmas
- ✅ **Laporan Per Sub Kegiatan** - Export Excel laporan agregat
- ✅ **Laporan Per Sumber Anggaran** - Export Excel per sumber dana

### Untuk Puskesmas
- ✅ **Laporan Kinerja** - Input laporan dengan tabel bulk input
- ✅ **Cara Pengisian** - Panduan lengkap pengisian laporan
- ✅ **Status Laporan** - Tersimpan (draft) dan Terkirim (submitted)

### Keamanan
- ✅ JWT Authentication dengan refresh token
- ✅ Role-based access control (Admin, Puskesmas)
- ✅ Rate limiting (100 requests/15 minutes)
- ✅ CORS protection
- ✅ Helmet security headers
- ✅ Password hashing dengan bcrypt
- ✅ Input validation

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

## � Deployment

Lihat dokumentasi lengkap:
- **`DEPLOYMENT.md`** - Panduan deployment step-by-step
- **`DEPLOYMENT_READY.md`** - Summary & quick reference
- **`PRE_DEPLOYMENT_CHECKLIST.md`** - Checklist sebelum deploy

Quick deploy:
```bash
# Build production
npm run build

# Copy files to server
# Configure .env
# Start with PM2
pm2 start ecosystem.config.js
```

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

## 🔄 Migration dari PHP Version

Ini adalah rewrite lengkap dari aplikasi E-EVKIN PHP lama dengan:
- ✅ Modern tech stack (React + TypeScript)
- ✅ Better security practices
- ✅ Improved UX dengan Ant Design
- ✅ Better performance
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
- Lihat dokumentasi di folder `docs/`

---

**Built with ❤️ for Dinas Kesehatan Kabupaten Bogor**  
*100% Open Source Technologies*
