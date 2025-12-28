# E-EVKIN Modern - AI Coding Instructions

## Architecture Overview
Full-stack TypeScript monorepo for health center (Puskesmas) performance evaluation. Two user roles: **admin** (Dinkes) manages master data/reports, **puskesmas** users submit monthly performance reports.

### Project Structure
```
├── backend/         # Express + Sequelize + PostgreSQL
│   └── src/
│       ├── routes/  # API endpoints (authenticate middleware required)
│       ├── models/  # Sequelize models with associations in index.ts
│       └── middleware/  # auth.ts (JWT), authorize.ts (role guards)
├── frontend/        # React 18 + Vite + Ant Design + Zustand
│   └── src/
│       ├── pages/   # Admin* pages for admin, others for puskesmas
│       ├── store/   # Zustand (authStore.ts with persist)
│       └── hooks/   # useLaporanData.ts, useReferenceData.ts
```

## Developer Workflows

### Quick Start
```bash
npm install            # Install all workspaces
npm run dev            # Start both backend (5000) + frontend (5173)
cd backend && npm run seed  # First-time database setup
```

### Key Commands
- `npm run dev:backend` / `npm run dev:frontend` - Run separately
- `cd backend && npm test` - Jest tests
- `npm run build` - Build both for production

## Critical Patterns

### Backend Route Pattern
All protected routes use: `router.METHOD('/path', authenticate, [authorizeAdmin,] handler)`
```typescript
// Admin-only route example (users.routes.ts)
router.post('/puskesmas', authenticate, authorizeAdmin, async (req, res) => {...})

// Puskesmas security: always filter by req.user.id for puskesmas role
if (req.user?.role === 'puskesmas') {
  where.user_id = req.user.id;  // CRITICAL: prevents data leakage
}
```

### Frontend Route Guards (App.tsx)
- `<AdminRoute>` - Checks `user.role === 'admin'`
- `<PuskesmasRoute>` - Checks `user.role === 'puskesmas'`
- All routes wrapped in `<Layout>` component

### Sequelize Associations
Defined centrally in `backend/src/models/index.ts`. Key relationships:
- `User` hasMany `Laporan` (user_id) → Always include with alias `as: 'user'` or `as: 'verifier'`
- `Laporan` belongsTo `SubKegiatan` (id_sub_kegiatan) → Include with `{ model: SubKegiatan, as: 'subKegiatan' }`
- `Laporan` belongsTo `SumberAnggaran` (id_sumber_anggaran) → Include with `{ model: SumberAnggaran, as: 'sumberAnggaran' }`
- `SubKegiatan` belongsToMany `SumberAnggaran` through `SubKegiatanSumberAnggaran` → Use `as: 'sumberAnggaranList'`
- `SubKegiatanTarget` references `SubKegiatan` + `SumberAnggaran` pair → Query via `/target/assigned?tahun=YYYY` to get populated targets
- **Important**: Always use aliases in includes; omitting aliases breaks serialization

### API Configuration
Frontend auto-detects environment in `frontend/src/config/api.ts`:
- Production: `/e-evkin/api` (relative path)
- Development: `http://localhost:5000/api`

## Performance Patterns
- **Bulk operations**: Use `POST /api/laporan/bulk-upsert` for batch saves (see `laporan.routes.ts:265`)
- **Database pool**: 15 max connections configured in `backend/src/config/database.ts`
- **React optimization**: Use custom hooks (`useLaporanData`) to prevent re-renders

## Testing Conventions
- **Backend**: Jest framework (`npm test` in backend/). Test patterns use mocks for database models and JWT tokens.
- **Frontend**: Vitest with testing-library/react. Mock axios in tests; use `jest.mock('axios')`.
- **Seeding**: Tests that need DB state should call seed fixtures before test runs.
- **No extensive test coverage yet** - Focus on new features with unit tests for critical paths (auth, data validation, API endpoints)

## Domain Terminology (Indonesian → English)
- **Kegiatan** = Activity/Program (parent level)
- **Sub Kegiatan** = Sub-Activity/Task (child of Kegiatan, linked to Sumber Anggaran)
- **Satuan** = Unit of Measurement (Orang=Person, Kegiatan=Activity, Dokumen=Document, etc.)
- **Sumber Anggaran** = Funding Source (BLUD, DAK Non Fisik, APBD, JKN)
- **Laporan** = Report (monthly performance data submitted by puskesmas)
- **Puskesmas** = Community Health Center (local health facility)
- **Dinkes** = Health Department (admin role, oversees puskesmas)
- **Target K** = Physical Target (quantity/count)
- **Target Rp** = Budget Target (in Rupiah, yearly total from Excel)
- **Target Angkas** = Cumulative Monthly Budget (from PDF Anggaran Kas, sum Jan to selected month)
- **Realisasi K** = Physical Realization (actual count achieved)
- **Realisasi Rp** = Budget Realization (actual spending)
- **Realisasi Fisik** = Physical Achievement % (0-100%)
- **Angkas** = Anggaran Kas (monthly budget allocation from government)

## Key Models
- **SubKegiatanTarget** - Yearly budget targets (target_k, target_rp) uploaded via Excel
- **AnggaranKas** - Monthly cumulative budget from PDF, stored per user/sub_kegiatan/sumber_anggaran/month
  - Query: `/api/angkas/by-sub-kegiatan?tahun=YYYY&bulan=N` returns cumulative sum from Jan to month N
  - Upload: `/api/angkas/upload` with PDF file + id_sumber_anggaran

## Database Seeding
```bash
cd backend
npm run seed           # Main seed (satuan, sumber_anggaran, kegiatan, sub_kegiatan, users)
npx tsx src/seeders/seed2025.ts  # Year-specific targets
```
Default credentials: `dinkes/dinkes123` (admin), `cibinong/cibinong123` (puskesmas)

## Documentation
- `docs/guides/` - Feature implementation guides
- `docs/PERFORMANCE_OPTIMIZATION.md` - Query optimization details
- `docs/security/SECURITY.md` - JWT and security setup
