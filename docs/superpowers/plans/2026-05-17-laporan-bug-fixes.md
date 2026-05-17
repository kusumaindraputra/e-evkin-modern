# Laporan Bug Fixes (L2, L4, L5, L12) + Dead Code Removal

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix submit validation (L2), fetch angkas from DB instead of payload (L4), fix chart to show correct data per field (L5), fix report endpoints to split realisasi_fisik vs realisasi_rp filters (L12), and remove dead code (POST /laporan, POST /laporan/bulk routes + service/controller methods).

**Architecture:** All changes are in the backend. No frontend changes needed. `laporan.service.ts` is the core — it handles L2 and L4. `dashboardService.ts` handles L5. `report.routes.ts` handles L12. Dead code spans routes + controller + service.

**Tech Stack:** Node.js + TypeScript, Sequelize ORM, PostgreSQL, Vitest (tests in `backend/src/__tests__/`)

---

## File Map

| File | Change |
|---|---|
| `backend/src/services/laporan.service.ts` | L2: add realisasi_rp null check in submit(); L4: pre-fetch AnggaranKas in bulkUpsert(); remove create() and bulkCreate() methods |
| `backend/src/controllers/laporan.controller.ts` | Remove create() and bulkCreate() static methods |
| `backend/src/routes/laporan.routes.ts` | Remove POST `/` and POST `/bulk` routes |
| `backend/src/services/dashboardService.ts` | L5: remove status filter on laporanData fetch; split JS filtering by metric |
| `backend/src/routes/report.routes.ts` | L12: remove status from whereClause; use CASE WHEN for realisasi_rp and add realisasi_fisik aggregation |
| `backend/src/__tests__/routes/laporan.test.ts` | Add tests for L2 (submit rejects null realisasi_rp) and L4 (verify angkas validated from DB) |

---

## Task 1: Remove dead routes POST /laporan and POST /laporan/bulk

**Files:**
- Modify: `backend/src/routes/laporan.routes.ts`

Verify first: these routes are confirmed unused by frontend (frontend only calls GET `/laporan` and POST `/laporan/bulk-upsert`).

- [ ] **Step 1: Verify no frontend or test references to these endpoints**

Run:
```bash
grep -rn "post.*'/laporan'\|axios\.post.*laporan['\"]" frontend/src --include="*.ts" --include="*.tsx"
grep -rn "post.*'/bulk'\b" backend/src/__tests__ --include="*.ts"
```

Expected: no matches for `POST /laporan` or `POST /laporan/bulk` (only bulk-upsert should appear).

- [ ] **Step 2: Remove dead routes**

Edit `backend/src/routes/laporan.routes.ts` — remove the two dead route lines:

```typescript
import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { checkEditPermission } from '../middleware/editPermission';
import { LaporanController } from '../controllers/laporan.controller';

const router = Router();

// Get all laporan with pagination
router.get('/', authenticate, LaporanController.findAll);

// Get laporan by ID
router.get('/:id', authenticate, LaporanController.findById);

// Bulk upsert laporan (optimized) — sole write path for puskesmas
router.post('/bulk-upsert', authenticate, checkEditPermission('laporan'), LaporanController.bulkUpsert);

// Update laporan
router.put('/:id', authenticate, checkEditPermission('laporan'), LaporanController.update);

// Delete laporan
router.delete('/:id', authenticate, checkEditPermission('laporan'), LaporanController.delete);

// Submit laporan
router.post('/submit', authenticate, checkEditPermission('laporan'), LaporanController.submit);

export default router;
```

- [ ] **Step 3: Compile to check for errors**

```bash
cd backend && npx tsc --noEmit 2>&1 | head -30
```

Expected: 0 errors (controller methods still exist, so no import errors yet).

- [ ] **Step 4: Commit**

```bash
rtk git add backend/src/routes/laporan.routes.ts
rtk git commit -m "refactor: remove unused POST /laporan and POST /laporan/bulk routes"
```

---

## Task 2: Remove dead controller methods (create, bulkCreate)

**Files:**
- Modify: `backend/src/controllers/laporan.controller.ts`

- [ ] **Step 1: Verify no remaining route references**

```bash
grep -n "LaporanController\.create\|LaporanController\.bulkCreate" backend/src/routes/laporan.routes.ts
```

Expected: 0 matches (confirmed removed in Task 1).

- [ ] **Step 2: Remove create() and bulkCreate() from controller**

Edit `backend/src/controllers/laporan.controller.ts` — delete the `create()` method (lines 63–87) and `bulkCreate()` method (lines 89–120). Keep all other methods intact.

The file after removal should have methods: `findAll`, `findById`, `bulkUpsert`, `update`, `delete`, `submit`.

- [ ] **Step 3: Compile**

```bash
cd backend && npx tsc --noEmit 2>&1 | head -30
```

Expected: 0 errors.

- [ ] **Step 4: Commit**

```bash
rtk git add backend/src/controllers/laporan.controller.ts
rtk git commit -m "refactor: remove dead create and bulkCreate controller methods"
```

---

## Task 3: Remove dead service methods (create, bulkCreate)

**Files:**
- Modify: `backend/src/services/laporan.service.ts`

- [ ] **Step 1: Verify no remaining controller references**

```bash
grep -n "LaporanService\.create\|LaporanService\.bulkCreate" backend/src/controllers/laporan.controller.ts
```

Expected: 0 matches.

- [ ] **Step 2: Remove create() and bulkCreate() from service**

Edit `backend/src/services/laporan.service.ts` — delete:
- `static async create(params: CreateLaporanParams)` — entire method (lines 128–173)
- `static async bulkCreate(laporanArray: any[], ...)` — entire method (lines 175–239)

Also remove `CreateLaporanParams` interface if only used by `create()` — but it's also used by `UpdateLaporanParams`, so keep it.

- [ ] **Step 3: Compile**

```bash
cd backend && npx tsc --noEmit 2>&1 | head -30
```

Expected: 0 errors.

- [ ] **Step 4: Run existing tests to make sure nothing broke**

```bash
cd backend && npm test 2>&1 | tail -20
```

Expected: same pass rate as before (dead code removal, no logic change).

- [ ] **Step 5: Commit**

```bash
rtk git add backend/src/services/laporan.service.ts
rtk git commit -m "refactor: remove dead create and bulkCreate service methods"
```

---

## Task 4: L2 — Add realisasi_rp null check in submit()

**Files:**
- Modify: `backend/src/services/laporan.service.ts`
- Modify: `backend/src/__tests__/routes/laporan.test.ts`

**Context:** `submit()` already validates `realisasi_k`. `realisasi_rp` is auto-filled from LRA upload so it should never be null when submitting — value 0 is valid, but null/undefined means LRA data is missing.

- [ ] **Step 1: Write the failing test**

Find the submit test block in `backend/src/__tests__/routes/laporan.test.ts` and add after the existing submit tests:

```typescript
it('should reject submit when any laporan has null realisasi_rp', async () => {
  // Create a laporan with realisasi_rp = null (LRA not uploaded yet)
  const laporanNullRp = await Laporan.create({
    user_id: puskesmasUser.id,
    id_sub_kegiatan: testLaporan.id_sub_kegiatan,
    id_sumber_anggaran: testLaporan.id_sumber_anggaran,
    id_kegiatan: testLaporan.id_kegiatan,
    id_satuan: testLaporan.id_satuan,
    tahun: 2025,
    bulan: 'November',
    target_k: 10,
    target_rp: 1000000,
    realisasi_k: 5,
    realisasi_rp: null,   // LRA not uploaded
    status: 'tersimpan',
  } as any);

  const res = await request(app)
    .post('/api/laporan/submit')
    .set('Authorization', `Bearer ${puskesmasToken}`)
    .send({ bulan: 'November', tahun: 2025 });

  expect(res.status).toBe(400);
  expect(res.body.message).toMatch(/realisasi anggaran/i);

  await laporanNullRp.destroy();
});

it('should allow submit when realisasi_rp is 0', async () => {
  const laporan0Rp = await Laporan.create({
    user_id: puskesmasUser.id,
    id_sub_kegiatan: testLaporan.id_sub_kegiatan,
    id_sumber_anggaran: testLaporan.id_sumber_anggaran,
    id_kegiatan: testLaporan.id_kegiatan,
    id_satuan: testLaporan.id_satuan,
    tahun: 2025,
    bulan: 'Desember',
    target_k: 10,
    target_rp: 1000000,
    realisasi_k: 0,
    realisasi_rp: 0,   // 0 is valid
    status: 'tersimpan',
  } as any);

  const res = await request(app)
    .post('/api/laporan/submit')
    .set('Authorization', `Bearer ${puskesmasToken}`)
    .send({ bulan: 'Desember', tahun: 2025 });

  // Should succeed (or fail for other reasons, not realisasi_rp)
  expect(res.status).not.toBe(400);
  // Also ensure it wasn't blocked by realisasi_rp validation
  if (res.status === 400) {
    expect(res.body.message).not.toMatch(/realisasi anggaran/i);
  }

  // Cleanup
  await Laporan.update({ status: 'tersimpan' }, { where: { user_id: puskesmasUser.id, bulan: 'Desember', tahun: 2025 } });
  await laporan0Rp.destroy();
});
```

- [ ] **Step 2: Run to confirm tests fail**

```bash
cd backend && npm test -- --testPathPattern="laporan.test" 2>&1 | grep -E "PASS|FAIL|✓|✗|●"
```

Expected: the new `null realisasi_rp` test fails (no such validation exists yet).

- [ ] **Step 3: Add realisasi_rp null check in submit()**

In `backend/src/services/laporan.service.ts`, find the `submit()` method. After the `incomplete` (realisasi_k check) block, add:

```typescript
const incompleteRp = pendingLaporan.filter(l => {
  const data = l.get({ plain: true }) as any;
  return data.realisasi_rp === null || data.realisasi_rp === undefined;
});

if (incompleteRp.length > 0) {
  throw new Error(`${incompleteRp.length} laporan belum memiliki data realisasi anggaran (Rp). Upload LRA terlebih dahulu sebelum mengirim.`);
}
```

Place this block immediately after:
```typescript
if (incomplete.length > 0) {
  throw new Error(`${incomplete.length} laporan belum memiliki data realisasi kinerja. Lengkapi data sebelum mengirim.`);
}
```

- [ ] **Step 4: Run tests to confirm they pass**

```bash
cd backend && npm test -- --testPathPattern="laporan.test" 2>&1 | grep -E "PASS|FAIL|✓|✗|●"
```

Expected: both new tests pass.

- [ ] **Step 5: Compile**

```bash
cd backend && npx tsc --noEmit 2>&1 | head -20
```

Expected: 0 errors.

- [ ] **Step 6: Commit**

```bash
rtk git add backend/src/services/laporan.service.ts backend/src/__tests__/routes/laporan.test.ts
rtk git commit -m "fix(submit): reject submit when realisasi_rp is null — L2 fix"
```

---

## Task 5: L4 — Fetch angkas from AnggaranKas DB in bulkUpsert

**Files:**
- Modify: `backend/src/services/laporan.service.ts`

**Context:** `bulkUpsert()` currently reads `data.angkas` from the request payload for validation. Puskesmas can manipulate this value. The correct source is `AnggaranKas` table (`nilai` field, summed per `user_id + id_sub_kegiatan + id_sumber_anggaran + bulan_num + tahun`). `AnggaranKas.bulan` is an integer (1–12); laporan uses string names ("Januari" etc.) — a mapping constant is needed.

- [ ] **Step 1: Add AnggaranKas import and BULAN_MAP to laporan.service.ts**

At the top of `backend/src/services/laporan.service.ts`, update the import line and add the constant:

```typescript
import { Op } from 'sequelize';
import { Laporan, User, SumberAnggaran, Satuan, SubKegiatan, Kegiatan, SubKegiatanTarget, AnggaranKas } from '../models';

const BULAN_MAP: Record<string, number> = {
  Januari: 1, Februari: 2, Maret: 3, April: 4,
  Mei: 5, Juni: 6, Juli: 7, Agustus: 8,
  September: 9, Oktober: 10, November: 11, Desember: 12,
};
```

- [ ] **Step 2: Pre-fetch AnggaranKas in bulkUpsert and build angkasMap**

In `bulkUpsert()`, after the block that builds `existingLaporanMap` (around line 303), add:

```typescript
// Pre-fetch AnggaranKas from DB to validate realisasi_rp (L4)
const angkasMap = new Map<string, number>();
const bulanNums = [...new Set(
  laporanArray.map((d: any) => BULAN_MAP[d.bulan]).filter(Boolean)
)];

if (subKegiatanIds.length > 0 && bulanNums.length > 0 && sumberAnggaranIds.length > 0) {
  const angkasRecords = await AnggaranKas.findAll({
    where: {
      user_id: userId,
      id_sub_kegiatan: { [Op.in]: subKegiatanIds },
      id_sumber_anggaran: { [Op.in]: sumberAnggaranIds },
      bulan: { [Op.in]: bulanNums },
      tahun: { [Op.in]: tahunValues },
    },
    attributes: ['user_id', 'id_sub_kegiatan', 'id_sumber_anggaran', 'bulan', 'tahun', 'nilai'],
    transaction,
  });

  // Sum nilai per unique (user_id, id_sub_kegiatan, id_sumber_anggaran, bulan, tahun)
  for (const rec of angkasRecords) {
    const key = `${rec.user_id}_${rec.id_sub_kegiatan}_${rec.id_sumber_anggaran}_${rec.bulan}_${rec.tahun}`;
    angkasMap.set(key, (angkasMap.get(key) || 0) + Number(rec.nilai));
  }
}
```

- [ ] **Step 3: Replace payload angkas check with DB lookup in the per-row loop**

In the `for (const data of laporanArray)` loop, replace:

```typescript
if (data.angkas > 0 && data.realisasi_rp !== undefined && data.realisasi_rp > data.angkas) {
  results.errors.push(`Sub kegiatan ${data.id_sub_kegiatan}: Realisasi anggaran (Rp ${data.realisasi_rp?.toLocaleString('id-ID')}) melebihi realisasi angkas (Rp ${data.angkas?.toLocaleString('id-ID')})`);
  results.skipped++;
  continue;
}
```

With:

```typescript
const bulanNum = BULAN_MAP[data.bulan];
const angkasKey = `${userId}_${data.id_sub_kegiatan}_${data.id_sumber_anggaran}_${bulanNum}_${data.tahun}`;
const angkasFromDB = angkasMap.get(angkasKey) ?? 0;

if (angkasFromDB > 0 && data.realisasi_rp !== undefined && data.realisasi_rp > angkasFromDB) {
  results.errors.push(`Sub kegiatan ${data.id_sub_kegiatan}: Realisasi anggaran (Rp ${data.realisasi_rp?.toLocaleString('id-ID')}) melebihi angkas (Rp ${angkasFromDB.toLocaleString('id-ID')})`);
  results.skipped++;
  continue;
}
```

Also update `laporanData` to save `angkas` from DB (not from payload):

```typescript
const laporanData = {
  ...data,
  user_id: userId,
  id_kegiatan: subKegiatan?.id_kegiatan || data.id_kegiatan || 0,
  id_satuan: data.id_satuan || target.id_satuan,
  angkas: angkasFromDB,   // from DB, not payload
  status: 'tersimpan' as any,
};
```

- [ ] **Step 4: Compile**

```bash
cd backend && npx tsc --noEmit 2>&1 | head -30
```

Expected: 0 errors. If `AnggaranKas` is not exported from `../models/index.ts`, add it there first.

- [ ] **Step 5: Run existing tests**

```bash
cd backend && npm test 2>&1 | tail -20
```

Expected: same or better pass rate — no regression.

- [ ] **Step 6: Commit**

```bash
rtk git add backend/src/services/laporan.service.ts
rtk git commit -m "fix(bulkUpsert): validate and save angkas from AnggaranKas DB, not payload — L4 fix"
```

---

## Task 6: L5 — Fix chart to separate realisasi_fisik (terkirim only) from realisasi_rp (LRA data)

**Files:**
- Modify: `backend/src/services/dashboardService.ts`

**Context:** Chart currently queries laporan with `status IN ('terkirim', 'menunggu', 'diverifikasi')`. Both `realisasi_fisik` and `realisasi_rp` use this same filter. Correct behavior:
- `realisasi_fisik` → only from `status = 'terkirim'` laporan
- `realisasi_rp` → from all laporan where `realisasi_rp IS NOT NULL` (value from LRA upload, independent of submit status)
- `anggaran` (target_rp) and `angkas` already come from `SubKegiatanTarget` and `AnggaranKas` tables — no change needed.

- [ ] **Step 1: Remove status filter from laporanFilter**

In `getChartData()`, find:

```typescript
const laporanFilter: any = {
  tahun,
  status: { [Op.in]: ['terkirim', 'menunggu', 'diverifikasi'] }
};
```

Change to:

```typescript
const laporanFilter: any = { tahun };
```

- [ ] **Step 2: Split JS filtering per metric in rawData mapping**

Find the `rawData = months.map(...)` block. Replace the existing lines:

```typescript
const laporanForMonth = laporanData.filter((l: any) => l.bulan === monthName);
const realisasiRp = laporanForMonth.reduce((sum: number, l: any) => sum + (Number(l.realisasi_rp) || 0), 0);
const totalFisik = laporanForMonth.reduce((sum: number, l: any) => sum + (Number(l.realisasi_fisik) || 0), 0);
const countFisik = laporanForMonth.length;
const avgFisik = countFisik > 0 ? totalFisik / countFisik : 0;
```

With:

```typescript
const laporanForMonth = laporanData.filter((l: any) => l.bulan === monthName);

// realisasi_rp: from laporan with LRA data (not null), regardless of submit status
const realisasiRp = laporanForMonth
  .filter((l: any) => l.realisasi_rp != null)
  .reduce((sum: number, l: any) => sum + (Number(l.realisasi_rp) || 0), 0);

// realisasi_fisik: only from submitted (terkirim) laporan
const terkirimForMonth = laporanForMonth.filter((l: any) => l.status === 'terkirim');
const totalFisik = terkirimForMonth.reduce((sum: number, l: any) => sum + (Number(l.realisasi_fisik) || 0), 0);
const countFisik = terkirimForMonth.length;
const avgFisik = countFisik > 0 ? totalFisik / countFisik : 0;
```

- [ ] **Step 3: Ensure `status` and `realisasi_rp` are included in the Laporan findAll attributes**

Find the `Laporan.findAll({ where: laporanFilter, ... })` call inside `getChartData()`. Confirm it includes `status` and `realisasi_rp` in the selected attributes. If `attributes` is omitted (fetches all), no change needed. If it's explicitly listed, add `'status'` and `'realisasi_rp'`.

Run:
```bash
grep -n "attributes.*bulan\|attributes.*realisasi\|findAll.*laporanFilter" backend/src/services/dashboardService.ts | head -10
```

If `attributes` is not set (fetches all columns), skip to step 4.

- [ ] **Step 4: Compile**

```bash
cd backend && npx tsc --noEmit 2>&1 | head -20
```

Expected: 0 errors.

- [ ] **Step 5: Commit**

```bash
rtk git add backend/src/services/dashboardService.ts
rtk git commit -m "fix(chart): realisasi_fisik from terkirim only, realisasi_rp from LRA data — L5 fix"
```

---

## Task 7: L12 — Fix report endpoints to split realisasi_fisik vs realisasi_rp filters

**Files:**
- Modify: `backend/src/routes/report.routes.ts`

**Context:** Two admin report endpoints: `/by-sub-kegiatan` and `/by-sumber-anggaran`. Both currently accept an optional `status` query param that filters the entire dataset. Correct behavior:
- `total_realisasi_rp` → SUM only where `realisasi_rp IS NOT NULL` (has LRA data)
- `total_realisasi_fisik` → SUM only where `status = 'terkirim'` (new field, added to response)
- Remove the `status` query param entirely from both endpoints — it no longer applies
- All other fields (`target_k`, `target_rp`, `realisasi_k`, `angkas`) sum across all statuses

- [ ] **Step 1: Update `/by-sub-kegiatan` endpoint**

In `report.routes.ts`, find the `/by-sub-kegiatan` handler. 

Remove from destructuring:
```typescript
const { bulan, tahun, id_sub_kegiatan, status, page, limit: limitParam } = req.query;
```
→ 
```typescript
const { bulan, tahun, id_sub_kegiatan, page, limit: limitParam } = req.query;
```

Remove:
```typescript
if (status) whereClause.status = status;
```

Replace in `attributes` array:
```typescript
[sequelize.fn('SUM', sequelize.col('realisasi_k')), 'total_realisasi_k'],
[sequelize.fn('SUM', sequelize.col('realisasi_rp')), 'total_realisasi_rp'],
[sequelize.fn('SUM', sequelize.col('angkas')), 'total_angkas'],
```
→
```typescript
[sequelize.fn('SUM', sequelize.col('realisasi_k')), 'total_realisasi_k'],
[sequelize.literal(`SUM(CASE WHEN "Laporan"."realisasi_rp" IS NOT NULL THEN "Laporan"."realisasi_rp" ELSE 0 END)`), 'total_realisasi_rp'],
[sequelize.fn('SUM', sequelize.col('angkas')), 'total_angkas'],
[sequelize.literal(`SUM(CASE WHEN "Laporan"."status" = 'terkirim' THEN COALESCE("Laporan"."realisasi_fisik", 0) ELSE 0 END)`), 'total_realisasi_fisik'],
```

In the `result` mapping, add `total_realisasi_fisik` to the returned object:
```typescript
total_angkas: Number(item.getDataValue('total_angkas')) || 0,
total_realisasi_fisik: Math.round((Number(item.getDataValue('total_realisasi_fisik')) || 0) * 100) / 100,
```

- [ ] **Step 2: Update `/by-sumber-anggaran` endpoint**

Apply identical changes to the `/by-sumber-anggaran` handler:
- Remove `status` from destructuring and whereClause
- Replace `SUM(realisasi_rp)` with CASE WHEN literal
- Add `total_realisasi_fisik` CASE WHEN literal
- Add `total_realisasi_fisik` to result mapping

- [ ] **Step 3: Compile**

```bash
cd backend && npx tsc --noEmit 2>&1 | head -30
```

Expected: 0 errors. Note: PostgreSQL CASE WHEN inside Sequelize `literal()` uses double-quoted table names — if using a different DB or alias, adjust accordingly.

- [ ] **Step 4: Run all tests**

```bash
cd backend && npm test 2>&1 | tail -20
```

Expected: same or better pass rate.

- [ ] **Step 5: Commit**

```bash
rtk git add backend/src/routes/report.routes.ts
rtk git commit -m "fix(report): split realisasi_rp (LRA data) and realisasi_fisik (terkirim only) aggregation — L12 fix"
```

---

## Task 8: Final verification

- [ ] **Step 1: Full TypeScript compile**

```bash
cd backend && npx tsc --noEmit 2>&1
```

Expected: 0 errors.

- [ ] **Step 2: Run full test suite**

```bash
cd backend && npm test 2>&1 | tail -30
```

Expected: same or higher pass rate than before (was 100/111 per docs).

- [ ] **Step 3: Build production bundle**

```bash
cd backend && npm run build 2>&1 | tail -20
```

Expected: build succeeds with no errors.

- [ ] **Step 4: Verify dead code is gone**

```bash
grep -n "LaporanService\.create\|LaporanService\.bulkCreate\|LaporanController\.create\|LaporanController\.bulkCreate" backend/src/routes/ backend/src/controllers/ backend/src/services/ -r
```

Expected: 0 matches.

- [ ] **Step 5: Final commit if any loose files**

```bash
rtk git status
```

All changes should already be committed. If anything remains:

```bash
rtk git add -A
rtk git commit -m "chore: final cleanup after L2/L4/L5/L12 fixes"
```
