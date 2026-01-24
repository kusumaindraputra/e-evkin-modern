# Seeder Scripts Documentation

This directory contains various seeder scripts for initializing and testing the e-evkin database.

## Quick Reference

| Script | Purpose | Command |
|--------|---------|---------|
| `seedMasterData.ts` | Initialize master data (users, kegiatan, satuan, etc.) | `npx tsx src/seeders/seedMasterData.ts` |
| `seed2025Dashboard.ts` | Generate 2025 test data for dashboard | `npx tsx src/seeders/seed2025Dashboard.ts` |
| `seed2026Dashboard.ts` | Generate 2026 test data | `npx tsx src/seeders/seed2026Dashboard.ts` |
| `clearData.ts` | Clear all seeded data | `npx tsx src/seeders/clearData.ts` |

## Production Seeders

### `seedMasterData.ts`
Primary seeder for initializing the database with:
- Admin user (dinkes/dinkes123)
- 102 Puskesmas users
- Kegiatan and SubKegiatan reference data
- Satuan and SumberAnggaran reference data

### `seedAll.ts`
Runs all production seeders in order. Use this for initial database setup.

## Dashboard Test Data Seeders

### `seed2025Dashboard.ts`
Generates comprehensive test data for 2025:
- Multiple Puskesmas with varied data
- SubKegiatanTarget with budget changes at Mar/Jul/Oct
- AnggaranKas (monthly allocations)
- Laporan (monthly realizations with MONTHLY values)
- Enforces hierarchy: Anggaran >= Angkas >= Physical >= Financial

**Commands:**
```bash
# Cleanup existing 2025 data
npx tsx src/seeders/seed2025Dashboard.ts cleanup

# Seed new 2025 data  
npx tsx src/seeders/seed2025Dashboard.ts
```

### `seed2026Dashboard.ts`
Similar to 2025 seeder but for 2026 fiscal year.

## Debug/Utility Scripts

| Script | Purpose |
|--------|---------|
| `checkData.ts` | Quick data verification |
| `debugOnePuskesmas.ts` | Debug data for single puskesmas |
| `debugPdfMatching.ts` | Debug PDF template matching |
| `analyzeAngkasProblem.ts` | Analyze angkas data issues |

## Test Scripts

| Script | Purpose |
|--------|---------|
| `e2e-test.ts` | End-to-end workflow test |
| `comprehensive-e2e-test.ts` | Full E2E test suite |
| `testUpload.ts` | Test file upload functionality |

## Important Notes

1. **MONTHLY vs CUMULATIVE**: Laporan stores MONTHLY `realisasi_rp` values. The dashboard endpoint accumulates these for display.

2. **Backdated Timestamps**: Dashboard seeders backdate `created_at` to ensure data appears in historical views.

3. **Running in Docker**: When running in Docker, connect to the container first:
   ```bash
   docker exec -it e-evkin-backend sh
   npx tsx src/seeders/seedMasterData.ts
   ```
