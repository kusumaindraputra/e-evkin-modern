# Database Seeder Guide

## Main Seeder

### `npm run seed` (Recommended)
Uses: `src/seeders/seed.ts`
- ✅ **Primary seeder for development**
- Creates complete database with master data + sample laporan
- Data period: Januari - November 2025
- All laporan have status 'terkirim' for dashboard visibility

**Usage:**
```bash
cd backend
npm run seed
```

**What gets created:**
- 20 Satuan (units)
- 4 Sumber Anggaran (budget sources) 
- 3 Kegiatan (activities)
- 7 Sub Kegiatan (sub-activities)
- 1 Admin user
- 102 Puskesmas users
- ~140 Sample laporan records (Jan-Nov 2025)

**Default Login:**
- Admin: `dinkes` / `dinkes123`
- Puskesmas: `cibinong` / `bogorkab` (or any puskesmas name)

## Alternative Seeders

### `seed2025.ts`
- Production seeder with real 2025 data
- Uses actual data files from `data/` folder
- For production deployment

### `seedAll.ts` 
- Legacy seeder with historical data
- For data migration purposes

### `seedReference.ts`
- Only creates master data (no sample laporan)
- For testing or minimal setup

## File Cleanup Status

✅ **Cleaned up temporary files:**
- `add-missing-months.ts` (deleted)
- `check-data-periods.ts` (deleted) 
- `update-status.ts` (deleted)

✅ **Current seeder status:**
- Main seeder updated with Januari-November 2025 data
- Status set to 'terkirim' for dashboard compatibility
- Documentation updated and cleaned