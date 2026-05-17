# LRA Upload — Realisasi Anggaran Otomatis Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Admin upload file LRA Excel bulanan → sistem ekstrak realisasi_rp per puskesmas/sub-kegiatan/sumber-anggaran → form laporan puskesmas otomatis menampilkan realisasi_rp sebagai read-only.

**Architecture:** New `lra_upload_batch` + `lra_realisasi` tables (staging, append-only). Parser reads SUB KEG sheet, splits realisasi by sumber_anggaran via keyword matching on uraian. Backend exposes preview + confirm routes. Frontend: new upload page for admin, read-only realisasi_rp field in laporan form.

**Tech Stack:** Node.js + Express + TypeScript + Sequelize + xlsx (already installed) + React + Ant Design v5

---

## Files Created / Modified

**Backend — new:**
- `backend/src/models/LraUploadBatch.ts` — model for upload batches
- `backend/src/models/LraRealisasi.ts` — model for realisasi rows
- `backend/src/services/lraParserService.ts` — Excel parser + DB matching
- `backend/src/routes/lra.routes.ts` — upload/preview/confirm/batches routes
- `backend/src/migrations/create_lra_tables.ts` — DB migration

**Backend — modified:**
- `backend/src/models/index.ts` — add associations for new models
- `backend/src/app.ts` — register lra routes
- `backend/src/services/laporan.service.ts` — enrich rows with lra realisasi_rp

**Frontend — new:**
- `frontend/src/pages/AdminLraUploadPage.tsx` — upload page

**Frontend — modified:**
- `frontend/src/App.tsx` — add `/admin/lra-upload` route
- `frontend/src/config/navConfig.tsx` — add sidebar nav item
- `frontend/src/pages/LaporanBulkInputPage.tsx` — make realisasi_rp read-only

---

## Task 1: DB Migration — create lra_upload_batch and lra_realisasi

**Files:**
- Create: `backend/src/migrations/create_lra_tables.ts`

- [ ] **Step 1: Create migration file**

```typescript
// backend/src/migrations/create_lra_tables.ts
import { QueryInterface, DataTypes } from 'sequelize';

export default {
  up: async (queryInterface: QueryInterface): Promise<void> => {
    await queryInterface.createTable('lra_upload_batch', {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      filename: {
        type: DataTypes.STRING(255),
        allowNull: false,
      },
      bulan: {
        type: DataTypes.STRING(20),
        allowNull: false,
      },
      tahun: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      uploaded_by: {
        type: DataTypes.UUID,
        allowNull: false,
        references: { model: 'users', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      row_count: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
      },
      created_at: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
      },
      updated_at: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
      },
    });

    await queryInterface.createTable('lra_realisasi', {
      id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
      batch_id: {
        type: DataTypes.UUID,
        allowNull: false,
        references: { model: 'lra_upload_batch', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      user_id: {
        type: DataTypes.UUID,
        allowNull: false,
        references: { model: 'users', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      id_sub_kegiatan: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: { model: 'sub_kegiatan', key: 'id_sub_kegiatan' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      id_sumber_anggaran: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: { model: 'sumber_anggaran', key: 'id_sumber' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      bulan: {
        type: DataTypes.STRING(20),
        allowNull: false,
      },
      tahun: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      realisasi_rp: {
        type: DataTypes.BIGINT,
        allowNull: false,
        defaultValue: 0,
      },
      created_at: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
      },
      updated_at: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
      },
    });

    await queryInterface.addIndex('lra_realisasi', {
      fields: ['user_id', 'id_sub_kegiatan', 'id_sumber_anggaran', 'bulan', 'tahun'],
      name: 'lra_realisasi_lookup',
    });

    await queryInterface.addIndex('lra_realisasi', {
      fields: ['batch_id'],
      name: 'lra_realisasi_batch',
    });
  },

  down: async (queryInterface: QueryInterface): Promise<void> => {
    await queryInterface.dropTable('lra_realisasi');
    await queryInterface.dropTable('lra_upload_batch');
  },
};
```

- [ ] **Step 2: Run migration**

```bash
cd backend && npx ts-node -e "
const { Sequelize } = require('sequelize');
require('dotenv').config();
const migration = require('./src/migrations/create_lra_tables').default;
const { sequelize } = require('./src/config/database');
migration.up(sequelize.getQueryInterface()).then(() => { console.log('Migration OK'); process.exit(0); }).catch(e => { console.error(e); process.exit(1); });
"
```

Expected output: `Migration OK`

- [ ] **Step 3: Commit**

```bash
rtk git add backend/src/migrations/create_lra_tables.ts
rtk git commit -m "feat(lra): add migration for lra_upload_batch and lra_realisasi tables"
```

---

## Task 2: Sequelize Models

**Files:**
- Create: `backend/src/models/LraUploadBatch.ts`
- Create: `backend/src/models/LraRealisasi.ts`
- Modify: `backend/src/models/index.ts`

- [ ] **Step 1: Create LraUploadBatch model**

```typescript
// backend/src/models/LraUploadBatch.ts
import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';

interface LraUploadBatchAttributes {
  id: string;
  filename: string;
  bulan: string;
  tahun: number;
  uploaded_by: string;
  row_count: number;
  created_at?: Date;
  updated_at?: Date;
}

interface LraUploadBatchCreationAttributes
  extends Optional<LraUploadBatchAttributes, 'id' | 'row_count' | 'created_at' | 'updated_at'> {}

class LraUploadBatch
  extends Model<LraUploadBatchAttributes, LraUploadBatchCreationAttributes>
  implements LraUploadBatchAttributes {
  declare id: string;
  declare filename: string;
  declare bulan: string;
  declare tahun: number;
  declare uploaded_by: string;
  declare row_count: number;
  declare readonly created_at: Date;
  declare readonly updated_at: Date;
}

LraUploadBatch.init(
  {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    filename: { type: DataTypes.STRING(255), allowNull: false },
    bulan: { type: DataTypes.STRING(20), allowNull: false },
    tahun: { type: DataTypes.INTEGER, allowNull: false },
    uploaded_by: {
      type: DataTypes.UUID,
      allowNull: false,
      references: { model: 'users', key: 'id' },
    },
    row_count: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
  },
  {
    sequelize,
    tableName: 'lra_upload_batch',
    underscored: true,
    timestamps: true,
  }
);

export default LraUploadBatch;
```

- [ ] **Step 2: Create LraRealisasi model**

```typescript
// backend/src/models/LraRealisasi.ts
import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';

interface LraRealisasiAttributes {
  id: number;
  batch_id: string;
  user_id: string;
  id_sub_kegiatan: number;
  id_sumber_anggaran: number;
  bulan: string;
  tahun: number;
  realisasi_rp: number;
  created_at?: Date;
  updated_at?: Date;
}

interface LraRealisasiCreationAttributes
  extends Optional<LraRealisasiAttributes, 'id' | 'created_at' | 'updated_at'> {}

class LraRealisasi
  extends Model<LraRealisasiAttributes, LraRealisasiCreationAttributes>
  implements LraRealisasiAttributes {
  declare id: number;
  declare batch_id: string;
  declare user_id: string;
  declare id_sub_kegiatan: number;
  declare id_sumber_anggaran: number;
  declare bulan: string;
  declare tahun: number;
  declare realisasi_rp: number;
  declare readonly created_at: Date;
  declare readonly updated_at: Date;
}

LraRealisasi.init(
  {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    batch_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: { model: 'lra_upload_batch', key: 'id' },
    },
    user_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: { model: 'users', key: 'id' },
    },
    id_sub_kegiatan: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: { model: 'sub_kegiatan', key: 'id_sub_kegiatan' },
    },
    id_sumber_anggaran: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: { model: 'sumber_anggaran', key: 'id_sumber' },
    },
    bulan: { type: DataTypes.STRING(20), allowNull: false },
    tahun: { type: DataTypes.INTEGER, allowNull: false },
    realisasi_rp: { type: DataTypes.BIGINT, allowNull: false, defaultValue: 0 },
  },
  {
    sequelize,
    tableName: 'lra_realisasi',
    underscored: true,
    timestamps: true,
  }
);

export default LraRealisasi;
```

- [ ] **Step 3: Add to models/index.ts**

Add imports after existing imports:
```typescript
import LraUploadBatch from './LraUploadBatch';
import LraRealisasi from './LraRealisasi';
```

Add associations before the `export` at the bottom:
```typescript
// LraUploadBatch associations
LraUploadBatch.hasMany(LraRealisasi, { foreignKey: 'batch_id', as: 'rows' });
LraRealisasi.belongsTo(LraUploadBatch, { foreignKey: 'batch_id', as: 'batch' });

LraUploadBatch.belongsTo(User, { foreignKey: 'uploaded_by', as: 'uploader' });
User.hasMany(LraUploadBatch, { foreignKey: 'uploaded_by', as: 'lraBatches' });

LraRealisasi.belongsTo(User, { foreignKey: 'user_id', as: 'puskesmas' });
LraRealisasi.belongsTo(SubKegiatan, { foreignKey: 'id_sub_kegiatan', as: 'subKegiatan' });
LraRealisasi.belongsTo(SumberAnggaran, { foreignKey: 'id_sumber_anggaran', as: 'sumberAnggaran' });
```

Add `LraUploadBatch` and `LraRealisasi` to the `export { ... }` at the bottom.

- [ ] **Step 4: Verify TypeScript compiles**

```bash
cd D:/proj/e-evkin-modern/backend && rtk tsc --noEmit
```

Expected: `TypeScript compilation completed`

- [ ] **Step 5: Commit**

```bash
rtk git add backend/src/models/LraUploadBatch.ts backend/src/models/LraRealisasi.ts backend/src/models/index.ts
rtk git commit -m "feat(lra): add LraUploadBatch and LraRealisasi models"
```

---

## Task 3: LRA Parser Service

**Files:**
- Create: `backend/src/services/lraParserService.ts`

This service parses the Excel file in-memory and matches entity codes to DB IDs.

- [ ] **Step 1: Create lraParserService.ts**

```typescript
// backend/src/services/lraParserService.ts
import * as XLSX from 'xlsx';
import { User, SubKegiatan, SumberAnggaran } from '../models';

const BULAN_NAMES = [
  'Januari','Februari','Maret','April','Mei','Juni',
  'Juli','Agustus','September','Oktober','November','Desember',
];

export interface LraRow {
  userId: string;
  idSubKegiatan: number;
  idSumberAnggaran: number;
  bulan: string;
  tahun: number;
  realisasiRp: number;
}

export interface LraParseResult {
  bulan: string;
  tahun: number;
  bulanDetectedFromFilename: boolean;
  rows: LraRow[];
  unmatchedPuskesmas: string[];   // kode_unit not found in users
  unmatchedSubKegiatan: string[]; // kode_sub not found in sub_kegiatan
  unmatchedSumber: string[];      // uraian keyword not matched to sumber_anggaran
}

/** Extract bulan/tahun from filename like "LRA SUB KEG DINKES 31 JANUARI 2026.xlsx" */
export function detectBulanTahunFromFilename(filename: string): { bulan: string | null; tahun: number | null } {
  const pattern = /(Januari|Februari|Maret|April|Mei|Juni|Juli|Agustus|September|Oktober|November|Desember)\s+(\d{4})/i;
  const match = filename.match(pattern);
  if (!match) return { bulan: null, tahun: null };
  const bulan = BULAN_NAMES.find(b => b.toLowerCase() === match[1].toLowerCase()) || null;
  return { bulan, tahun: parseInt(match[2]) };
}

/** Map uraian text to sumber anggaran name keyword */
function detectSumberKeyword(uraian: string): string | null {
  const u = uraian.toUpperCase();
  if (u.includes('BLUD')) return 'BLUD';
  if (u.includes('BOK')) return 'BOK';
  if (u.includes('JKN') || u.includes('KAPITASI')) return 'JKN';
  if (u.includes('DAK')) return 'DAK';
  if (u.includes('DAU')) return 'DAU';
  return null;
}

export async function parseLraExcel(
  buffer: Buffer,
  filename: string,
  bulanOverride?: string,
  tahunOverride?: number
): Promise<LraParseResult> {
  // Detect bulan/tahun
  const detected = detectBulanTahunFromFilename(filename);
  const bulan = bulanOverride || detected.bulan || '';
  const tahun = tahunOverride || detected.tahun || 0;
  const bulanDetectedFromFilename = !bulanOverride && !!detected.bulan;

  // Parse Excel
  const workbook = XLSX.read(buffer, { type: 'buffer' });
  const sheet = workbook.Sheets['SUB KEG'];
  if (!sheet) throw new Error('Sheet "SUB KEG" tidak ditemukan dalam file LRA');
  const rawData: any[][] = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' });

  // Load lookup tables from DB
  const [allUsers, allSubKegiatan, allSumber] = await Promise.all([
    User.findAll({ where: { role: 'puskesmas' }, attributes: ['id', 'kode_puskesmas'] }),
    SubKegiatan.findAll({ attributes: ['id_sub_kegiatan', 'kode_sub'] }),
    SumberAnggaran.findAll({ attributes: ['id_sumber', 'sumber'] }),
  ]);

  const userByKode = new Map<string, string>(); // kode_puskesmas -> user_id
  allUsers.forEach(u => { if (u.kode_puskesmas) userByKode.set(u.kode_puskesmas, u.id); });

  const subKegByKode = new Map<string, number>(); // kode_sub -> id_sub_kegiatan
  allSubKegiatan.forEach(sk => subKegByKode.set(sk.kode_sub, sk.id_sub_kegiatan));

  const sumberByKeyword = new Map<string, number>(); // keyword -> id_sumber
  allSumber.forEach(s => {
    const upper = s.sumber.toUpperCase();
    if (upper.includes('BLUD')) sumberByKeyword.set('BLUD', s.id_sumber);
    if (upper.includes('BOK')) sumberByKeyword.set('BOK', s.id_sumber);
    if (upper.includes('JKN') || upper.includes('KAPITASI')) sumberByKeyword.set('JKN', s.id_sumber);
    if (upper.includes('DAK')) sumberByKeyword.set('DAK', s.id_sumber);
    if (upper.includes('DAU')) sumberByKeyword.set('DAU', s.id_sumber);
  });

  const rows: LraRow[] = [];
  const unmatchedPuskesmas = new Set<string>();
  const unmatchedSubKegiatan = new Set<string>();
  const unmatchedSumber = new Set<string>();

  // State machine: track current puskesmas + sub-kegiatan
  let currentKodeUnit: string = '';
  let currentKodeSub: string = '';
  // Accumulate realisasi per sumber keyword for current sub-kegiatan
  let currentSumberBuckets = new Map<string, number>(); // keyword -> realisasi_rp

  const flushSubKegiatan = () => {
    if (!currentKodeUnit || !currentKodeSub || currentSumberBuckets.size === 0) return;

    const userId = userByKode.get(currentKodeUnit);
    if (!userId) { unmatchedPuskesmas.add(currentKodeUnit); return; }

    const idSubKegiatan = subKegByKode.get(currentKodeSub);
    if (!idSubKegiatan) { unmatchedSubKegiatan.add(currentKodeSub); return; }

    currentSumberBuckets.forEach((realisasiRp, keyword) => {
      if (realisasiRp === 0) return;
      const idSumberAnggaran = sumberByKeyword.get(keyword);
      if (!idSumberAnggaran) { unmatchedSumber.add(keyword); return; }
      rows.push({ userId, idSubKegiatan, idSumberAnggaran, bulan, tahun, realisasiRp });
    });
  };

  // Skip header rows (first 8 rows are headers)
  for (let i = 8; i < rawData.length; i++) {
    const row = rawData[i];
    const kodeUnit = String(row[3] || '').trim();
    const kodeSub = String(row[4] || '').trim();
    const kodeRekening = String(row[5] || '').trim();
    const uraian = String(row[6] || '').trim();
    const realisasiJumlah = Number(row[12]) || 0;

    // Unit header row: col 4 empty, col 3 has puskesmas unit code
    if (kodeUnit && !kodeSub && kodeUnit.match(/^1\.02\.0\.00\.0\.00\.01\.\d+$/) && kodeUnit !== '1.02.0.00.0.00.01.0000') {
      flushSubKegiatan();
      currentKodeUnit = kodeUnit;
      currentKodeSub = '';
      currentSumberBuckets = new Map();
      continue;
    }

    // Sub-kegiatan summary row: col 4 has sub keg code, col 5 empty
    if (kodeSub && kodeSub.match(/^1\.\d+\.\d+\.\d+\.\d+\.\d+$/) && !kodeRekening) {
      flushSubKegiatan();
      currentKodeSub = kodeSub;
      currentSumberBuckets = new Map();
      continue;
    }

    // Detail row: col 5 has kode rekening → accumulate into sumber bucket
    if (currentKodeSub && kodeRekening && realisasiJumlah > 0) {
      const keyword = detectSumberKeyword(uraian);
      if (keyword) {
        currentSumberBuckets.set(keyword, (currentSumberBuckets.get(keyword) || 0) + realisasiJumlah);
      } else {
        unmatchedSumber.add(uraian.substring(0, 60));
      }
    }
  }

  // Flush last sub-kegiatan
  flushSubKegiatan();

  return {
    bulan,
    tahun,
    bulanDetectedFromFilename,
    rows,
    unmatchedPuskesmas: [...unmatchedPuskesmas],
    unmatchedSubKegiatan: [...unmatchedSubKegiatan],
    unmatchedSumber: [...unmatchedSumber],
  };
}
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
cd D:/proj/e-evkin-modern/backend && rtk tsc --noEmit
```

Expected: `TypeScript compilation completed`

- [ ] **Step 3: Commit**

```bash
rtk git add backend/src/services/lraParserService.ts
rtk git commit -m "feat(lra): add LRA Excel parser service"
```

---

## Task 4: Backend Routes

**Files:**
- Create: `backend/src/routes/lra.routes.ts`
- Modify: `backend/src/app.ts`

- [ ] **Step 1: Create lra.routes.ts**

```typescript
// backend/src/routes/lra.routes.ts
import { Router, Request, Response } from 'express';
import multer from 'multer';
import { authenticate } from '../middleware/auth';
import { authorizeAdmin } from '../middleware/authorize';
import { parseLraExcel, detectBulanTahunFromFilename } from '../services/lraParserService';
import { LraUploadBatch, LraRealisasi, User } from '../models';

const router = Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 20 * 1024 * 1024 }, // 20MB
  fileFilter: (_req, file, cb) => {
    if (file.mimetype === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
        file.originalname.endsWith('.xlsx')) {
      cb(null, true);
    } else {
      cb(new Error('Hanya file .xlsx yang diizinkan'));
    }
  },
});

/**
 * POST /api/lra/preview
 * Parse LRA file and return preview without saving to DB
 */
router.post('/preview', authenticate, authorizeAdmin, upload.single('file'), async (req: Request, res: Response): Promise<void> => {
  if (!req.file) {
    res.status(400).json({ error: 'File tidak ditemukan' });
    return;
  }

  const bulanOverride = req.body.bulan || undefined;
  const tahunOverride = req.body.tahun ? parseInt(req.body.tahun) : undefined;

  const result = await parseLraExcel(req.file.buffer, req.file.originalname, bulanOverride, tahunOverride);

  if (!result.bulan || !result.tahun) {
    res.status(400).json({
      error: 'Bulan/tahun tidak terdeteksi dari nama file. Silakan isi manual.',
      bulanDetectedFromFilename: false,
    });
    return;
  }

  res.json({
    bulan: result.bulan,
    tahun: result.tahun,
    bulanDetectedFromFilename: result.bulanDetectedFromFilename,
    matchedCount: result.rows.length,
    unmatchedPuskesmas: result.unmatchedPuskesmas,
    unmatchedSubKegiatan: result.unmatchedSubKegiatan,
    unmatchedSumber: result.unmatchedSumber,
  });
});

/**
 * POST /api/lra/confirm
 * Re-parse and save to DB
 */
router.post('/confirm', authenticate, authorizeAdmin, upload.single('file'), async (req: Request, res: Response): Promise<void> => {
  if (!req.file) {
    res.status(400).json({ error: 'File tidak ditemukan' });
    return;
  }

  const bulanOverride = req.body.bulan || undefined;
  const tahunOverride = req.body.tahun ? parseInt(req.body.tahun) : undefined;

  const result = await parseLraExcel(req.file.buffer, req.file.originalname, bulanOverride, tahunOverride);

  if (!result.bulan || !result.tahun) {
    res.status(400).json({ error: 'Bulan/tahun wajib diisi' });
    return;
  }

  if (result.rows.length === 0) {
    res.status(400).json({ error: 'Tidak ada data yang berhasil diparse dari file ini' });
    return;
  }

  const adminId = req.user!.id;

  // Create batch
  const batch = await LraUploadBatch.create({
    filename: req.file.originalname,
    bulan: result.bulan,
    tahun: result.tahun,
    uploaded_by: adminId,
    row_count: result.rows.length,
  });

  // Insert all rows
  await LraRealisasi.bulkCreate(
    result.rows.map(r => ({
      batch_id: batch.id,
      user_id: r.userId,
      id_sub_kegiatan: r.idSubKegiatan,
      id_sumber_anggaran: r.idSumberAnggaran,
      bulan: r.bulan,
      tahun: r.tahun,
      realisasi_rp: r.realisasiRp,
    })),
    { validate: true }
  );

  res.json({
    success: true,
    batchId: batch.id,
    rowCount: result.rows.length,
    bulan: result.bulan,
    tahun: result.tahun,
    unmatchedPuskesmas: result.unmatchedPuskesmas,
    unmatchedSubKegiatan: result.unmatchedSubKegiatan,
    unmatchedSumber: result.unmatchedSumber,
  });
});

/**
 * GET /api/lra/batches
 * List all upload batches
 */
router.get('/batches', authenticate, authorizeAdmin, async (_req: Request, res: Response): Promise<void> => {
  const batches = await LraUploadBatch.findAll({
    include: [{ model: User, as: 'uploader', attributes: ['nama'] }],
    order: [['created_at', 'DESC']],
  });
  res.json(batches);
});

export default router;
```

- [ ] **Step 2: Register route in app.ts**

In `backend/src/app.ts`, add import after existing imports:
```typescript
import lraRoutes from './routes/lra.routes';
```

Add route registration (after line `app.use('/api/angkas', angkasRoutes);`):
```typescript
app.use('/api/lra', lraRoutes);
```

- [ ] **Step 3: Verify TypeScript compiles**

```bash
cd D:/proj/e-evkin-modern/backend && rtk tsc --noEmit
```

Expected: `TypeScript compilation completed`

- [ ] **Step 4: Commit**

```bash
rtk git add backend/src/routes/lra.routes.ts backend/src/app.ts
rtk git commit -m "feat(lra): add LRA upload/preview/confirm routes"
```

---

## Task 5: Enrich Laporan Data with LRA Realisasi

**Files:**
- Modify: `backend/src/services/laporan.service.ts`

The `getForPuskesmas` or similar method that loads data for the bulk input form needs to include `realisasi_rp_lra` from the latest LRA batch.

- [ ] **Step 1: Find where laporan rows are loaded for the puskesmas form**

Look for the method/query in `laporan.service.ts` that returns laporan for a specific `user_id + bulan + tahun`. This is what `LaporanBulkInputPage` calls. Identify the return shape.

- [ ] **Step 2: Add LRA lookup helper function**

At the top of `laporan.service.ts`, add import:
```typescript
import { LraRealisasi, LraUploadBatch } from '../models';
```

Add helper function before the class definition:
```typescript
/**
 * Get latest LRA realisasi_rp for a set of (user_id, id_sub_kegiatan, id_sumber_anggaran, bulan, tahun)
 * Returns a Map keyed by "userId_subKegId_sumberAngId"
 */
async function getLraRealisasiMap(
  userId: string,
  bulan: string,
  tahun: number
): Promise<Map<string, number>> {
  const rows = await LraRealisasi.findAll({
    where: { user_id: userId, bulan, tahun },
    include: [{
      model: LraUploadBatch,
      as: 'batch',
      attributes: ['created_at'],
    }],
    order: [[{ model: LraUploadBatch, as: 'batch' }, 'created_at', 'DESC']],
  });

  const map = new Map<string, number>();
  for (const row of rows) {
    const key = `${row.id_sub_kegiatan}_${row.id_sumber_anggaran}`;
    if (!map.has(key)) {
      // First result is latest (ordered by batch created_at DESC)
      map.set(key, Number(row.realisasi_rp));
    }
  }
  return map;
}
```

- [ ] **Step 3: Inject realisasi_rp_lra into LaporanService.findAll**

`LaporanService.findAll` is at `backend/src/services/laporan.service.ts:36`. It returns `Laporan.findAndCountAll(...)` at line 53–85. Wrap it to enrich rows:

```typescript
// Replace the return statement at line 53:
const result = await Laporan.findAndCountAll({
  where,
  limit,
  offset,
  include: [ /* existing includes unchanged */ ],
  order: [['created_at', 'DESC']]
});

// Enrich with LRA realisasi if querying for a specific puskesmas + bulan + tahun
if (user_id && bulan && tahun) {
  const lraMap = await getLraRealisasiMap(user_id, bulan, tahun);
  const enrichedRows = result.rows.map(lap => {
    const key = `${lap.id_sub_kegiatan}_${lap.id_sumber_anggaran}`;
    const lraRp = lraMap.get(key);
    const json = lap.toJSON() as any;
    json.realisasi_rp_lra = lraRp ?? 0;
    json.lra_available = lraRp !== undefined;
    return json;
  });
  return { count: result.count, rows: enrichedRows };
}

return result;
```

Add import at top of laporan.service.ts:
```typescript
import { getLraRealisasiMap } from './lraParserService';
import { LraRealisasi, LraUploadBatch } from '../models';
```

Also add `LraRealisasi` and `LraUploadBatch` to `backend/src/models/index.ts` exports if not already there.

- [ ] **Step 5: Also expose LRA data for rows not yet in laporan**

The frontend also fetches sub-kegiatan targets to build rows that don't have laporan yet. These rows also need `realisasi_rp_lra`. The `LaporanBulkInputPage` calls `GET /api/puskesmas/sub-kegiatan` and target endpoints.

The LRA data is passed as part of the laporan response. For rows without existing laporan, the frontend already initializes `realisasi_rp: undefined`. We need a separate endpoint or to include LRA data in the sub-kegiatan/target response.

Simplest approach: add `GET /api/lra/realisasi?bulan=X&tahun=Y` endpoint that returns a map of `{id_sub_kegiatan}_{id_sumber_anggaran}` → realisasi_rp for the authenticated puskesmas user. The frontend fetches this alongside targets.

Add to `lra.routes.ts`:
```typescript
/**
 * GET /api/lra/realisasi?bulan=Januari&tahun=2026
 * Get latest LRA realisasi map for the current puskesmas user
 */
router.get('/realisasi', authenticate, async (req: Request, res: Response): Promise<void> => {
  const { bulan, tahun } = req.query as { bulan: string; tahun: string };
  if (!bulan || !tahun) {
    res.status(400).json({ error: 'bulan dan tahun wajib diisi' });
    return;
  }

  const userId = req.user!.id;
  const lraMap = await getLraRealisasiMap(userId, bulan, parseInt(tahun));

  // Convert map to object for JSON response
  const result: Record<string, number> = {};
  lraMap.forEach((v, k) => { result[k] = v; });

  res.json({ realisasi: result, available: lraMap.size > 0 });
});
```

Export `getLraRealisasiMap` from `lraParserService.ts` or define it in a shared location (e.g., inline in lra.routes.ts and also import into laporan.service.ts).

Better: move `getLraRealisasiMap` to `lraParserService.ts` and export it. Import it in both `lra.routes.ts` and `laporan.service.ts`.

- [ ] **Step 6: Verify TypeScript compiles**

```bash
cd D:/proj/e-evkin-modern/backend && rtk tsc --noEmit
```

Expected: `TypeScript compilation completed`

- [ ] **Step 7: Commit**

```bash
rtk git add backend/src/services/laporan.service.ts backend/src/routes/lra.routes.ts backend/src/services/lraParserService.ts
rtk git commit -m "feat(lra): enrich laporan response with LRA realisasi_rp_lra"
```

---

## Task 6: Frontend — LaporanBulkInputPage Changes

**Files:**
- Modify: `frontend/src/pages/LaporanBulkInputPage.tsx`

- [ ] **Step 1: Add realisasi_rp_lra to LaporanRowData interface**

Find the `LaporanRowData` interface (~line 30). Add two fields:
```typescript
realisasi_rp_lra?: number;
lra_available?: boolean;
```

- [ ] **Step 2: Fetch LRA realisasi map after loading data**

In `loadData` callback, after building `mappedRows`, call the LRA endpoint:
```typescript
// After building mappedRows, fetch LRA realisasi:
let lraMap: Record<string, number> = {};
try {
  const lraRes = await axios.get(
    `${API_BASE_URL}/lra/realisasi?bulan=${filterBulan}&tahun=${filterTahun}`,
    { headers: { Authorization: `Bearer ${token}` } }
  );
  if (lraRes.data.available) {
    lraMap = lraRes.data.realisasi;
  }
} catch {
  // LRA not available — silently ignore
}

// Attach to each row:
const finalRows = mappedRows.map(row => {
  const key = `${row.id_sub_kegiatan}_${row.id_sumber_anggaran}`;
  return {
    ...row,
    realisasi_rp_lra: lraMap[key] ?? 0,
    lra_available: key in lraMap,
    // Pre-populate realisasi_rp from LRA if not already set from existing laporan:
    realisasi_rp: row.realisasi_rp !== undefined
      ? row.realisasi_rp
      : (lraMap[key] ?? undefined),
  };
});
setRows(finalRows);
```

(Remove the existing `setRows(mappedRows)` call.)

- [ ] **Step 3: Make realisasi_rp column read-only**

Find where the `realisasi_rp` input is rendered in the table columns definition. It currently renders as an `InputNumber`. Change it to display-only:

```tsx
// Replace the realisasi_rp InputNumber cell with:
{
  title: 'Realisasi Rp',
  dataIndex: 'realisasi_rp',
  render: (val: number, record: LaporanRowData) => (
    <div>
      <span style={{ fontWeight: 500 }}>
        {val != null ? Number(val).toLocaleString('id-ID') : '-'}
      </span>
      {record.lra_available ? (
        <div style={{ fontSize: 11, color: 'var(--color-success)', marginTop: 2 }}>
          Dari LRA
        </div>
      ) : (
        <div style={{ fontSize: 11, color: 'var(--color-text-secondary)', marginTop: 2 }}>
          LRA belum diupload
        </div>
      )}
    </div>
  ),
}
```

- [ ] **Step 4: Use realisasi_rp_lra when building laporanArray for submit**

In `handleSave` (the save callback, ~line 358), where `laporanArray` is built:
```typescript
realisasi_rp: row.realisasi_rp_lra ?? row.realisasi_rp ?? 0,
```

- [ ] **Step 5: Verify TypeScript compiles**

```bash
cd D:/proj/e-evkin-modern/frontend && rtk tsc --noEmit
```

Expected: `TypeScript compilation completed`

- [ ] **Step 6: Commit**

```bash
rtk git add frontend/src/pages/LaporanBulkInputPage.tsx
rtk git commit -m "feat(lra): make realisasi_rp read-only, pre-populate from LRA"
```

---

## Task 7: Frontend — AdminLraUploadPage

**Files:**
- Create: `frontend/src/pages/AdminLraUploadPage.tsx`

- [ ] **Step 1: Create AdminLraUploadPage.tsx**

```tsx
// frontend/src/pages/AdminLraUploadPage.tsx
import React, { useState, useEffect, useCallback } from 'react';
import {
  Card, Typography, Upload, Button, Form, Select, InputNumber,
  Table, Alert, Space, Tag, Divider, message, Spin,
} from 'antd';
import { UploadOutlined, InboxOutlined } from '@ant-design/icons';
import type { UploadFile } from 'antd/es/upload/interface';
import axios from 'axios';
import API_BASE_URL from '../config/api';
import { useAuthStore } from '../store/authStore';
import { formatCurrencyWithPrefix } from '../utils/formatters';

const { Title, Text } = Typography;
const { Dragger } = Upload;

const BULAN_OPTIONS = [
  'Januari','Februari','Maret','April','Mei','Juni',
  'Juli','Agustus','September','Oktober','November','Desember',
].map(b => ({ value: b, label: b }));

interface PreviewResult {
  bulan: string;
  tahun: number;
  bulanDetectedFromFilename: boolean;
  matchedCount: number;
  unmatchedPuskesmas: string[];
  unmatchedSubKegiatan: string[];
  unmatchedSumber: string[];
}

interface BatchRecord {
  id: string;
  filename: string;
  bulan: string;
  tahun: number;
  row_count: number;
  created_at: string;
  uploader?: { nama: string };
}

const AdminLraUploadPage: React.FC = () => {
  const token = useAuthStore(s => s.token);
  const [fileList, setFileList] = useState<UploadFile[]>([]);
  const [bulan, setBulan] = useState<string | undefined>();
  const [tahun, setTahun] = useState<number | undefined>();
  const [preview, setPreview] = useState<PreviewResult | null>(null);
  const [previewing, setPreviewing] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [batches, setBatches] = useState<BatchRecord[]>([]);
  const [loadingBatches, setLoadingBatches] = useState(false);

  const config = { headers: { Authorization: `Bearer ${token}` } };

  const loadBatches = useCallback(async () => {
    setLoadingBatches(true);
    try {
      const res = await axios.get(`${API_BASE_URL}/lra/batches`, config);
      setBatches(res.data);
    } catch {
      // ignore
    } finally {
      setLoadingBatches(false);
    }
  }, [token]);

  useEffect(() => { loadBatches(); }, [loadBatches]);

  const buildFormData = () => {
    const fd = new FormData();
    fd.append('file', fileList[0].originFileObj as File);
    if (bulan) fd.append('bulan', bulan);
    if (tahun) fd.append('tahun', String(tahun));
    return fd;
  };

  const handlePreview = async () => {
    if (!fileList[0]) { message.warning('Pilih file terlebih dahulu'); return; }
    setPreviewing(true);
    setPreview(null);
    try {
      const res = await axios.post(`${API_BASE_URL}/lra/preview`, buildFormData(), config);
      setPreview(res.data);
      if (!bulan) setBulan(res.data.bulan);
      if (!tahun) setTahun(res.data.tahun);
    } catch (e: any) {
      message.error(e.response?.data?.error || 'Gagal preview file');
    } finally {
      setPreviewing(false);
    }
  };

  const handleConfirm = async () => {
    if (!fileList[0] || !preview) return;
    setConfirming(true);
    try {
      const res = await axios.post(`${API_BASE_URL}/lra/confirm`, buildFormData(), config);
      message.success(`Berhasil menyimpan ${res.data.rowCount} baris data LRA`);
      setFileList([]);
      setPreview(null);
      setBulan(undefined);
      setTahun(undefined);
      loadBatches();
    } catch (e: any) {
      message.error(e.response?.data?.error || 'Gagal menyimpan data LRA');
    } finally {
      setConfirming(false);
    }
  };

  const batchColumns = [
    { title: 'File', dataIndex: 'filename', ellipsis: true },
    { title: 'Bulan', dataIndex: 'bulan', width: 100 },
    { title: 'Tahun', dataIndex: 'tahun', width: 80 },
    { title: 'Baris', dataIndex: 'row_count', width: 80 },
    { title: 'Diupload oleh', dataIndex: ['uploader', 'nama'], width: 150 },
    {
      title: 'Tanggal',
      dataIndex: 'created_at',
      width: 160,
      render: (v: string) => new Date(v).toLocaleString('id-ID'),
    },
  ];

  return (
    <div style={{ maxWidth: 900, margin: '0 auto', padding: '24px 16px' }}>
      <Title level={3}>Upload LRA Realisasi Anggaran</Title>
      <Text type="secondary">
        Upload file LRA Excel bulanan dari SiRDA/SIPD. Realisasi anggaran akan otomatis terisi di form laporan puskesmas.
      </Text>

      <Card style={{ marginTop: 24 }}>
        <Dragger
          accept=".xlsx"
          fileList={fileList}
          beforeUpload={file => { setFileList([file]); setPreview(null); return false; }}
          onRemove={() => { setFileList([]); setPreview(null); }}
          maxCount={1}
        >
          <p className="ant-upload-drag-icon"><InboxOutlined /></p>
          <p className="ant-upload-text">Klik atau drag file .xlsx ke sini</p>
          <p className="ant-upload-hint">Format: LRA SUB KEG DINKES DD BULAN YYYY.xlsx</p>
        </Dragger>

        <Space style={{ marginTop: 16 }} wrap>
          <Select
            placeholder="Bulan (opsional — auto-detect dari nama file)"
            value={bulan}
            onChange={setBulan}
            options={BULAN_OPTIONS}
            style={{ width: 260 }}
            allowClear
          />
          <InputNumber
            placeholder="Tahun"
            value={tahun}
            onChange={v => setTahun(v ?? undefined)}
            style={{ width: 100 }}
            min={2020}
            max={2099}
          />
          <Button
            type="default"
            icon={<UploadOutlined />}
            onClick={handlePreview}
            loading={previewing}
            disabled={!fileList[0]}
          >
            Preview
          </Button>
        </Space>

        {preview && (
          <>
            <Divider />
            <Alert
              type="info"
              message={`Bulan: ${preview.bulan} ${preview.tahun}${preview.bulanDetectedFromFilename ? ' (terdeteksi dari nama file)' : ''}`}
              description={`${preview.matchedCount} baris berhasil dicocokkan`}
              showIcon
              style={{ marginBottom: 12 }}
            />
            {preview.unmatchedPuskesmas.length > 0 && (
              <Alert
                type="warning"
                message={`${preview.unmatchedPuskesmas.length} kode puskesmas tidak dikenali`}
                description={preview.unmatchedPuskesmas.join(', ')}
                showIcon
                style={{ marginBottom: 8 }}
              />
            )}
            {preview.unmatchedSubKegiatan.length > 0 && (
              <Alert
                type="warning"
                message={`${preview.unmatchedSubKegiatan.length} kode sub kegiatan tidak dikenali`}
                description={preview.unmatchedSubKegiatan.join(', ')}
                showIcon
                style={{ marginBottom: 8 }}
              />
            )}
            <Space style={{ marginTop: 16 }}>
              <Button type="primary" onClick={handleConfirm} loading={confirming}>
                Simpan ke Database
              </Button>
              <Button onClick={() => setPreview(null)}>Batal</Button>
            </Space>
          </>
        )}
      </Card>

      <Card style={{ marginTop: 24 }} title="Riwayat Upload">
        <Table
          dataSource={batches}
          columns={batchColumns}
          rowKey="id"
          loading={loadingBatches}
          size="small"
          pagination={{ pageSize: 10 }}
        />
      </Card>
    </div>
  );
};

export default AdminLraUploadPage;
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
cd D:/proj/e-evkin-modern/frontend && rtk tsc --noEmit
```

Expected: `TypeScript compilation completed`

- [ ] **Step 3: Commit**

```bash
rtk git add frontend/src/pages/AdminLraUploadPage.tsx
rtk git commit -m "feat(lra): add AdminLraUploadPage"
```

---

## Task 8: Wire Up Route and Navigation

**Files:**
- Modify: `frontend/src/App.tsx`
- Modify: `frontend/src/config/navConfig.tsx`

- [ ] **Step 1: Add route to App.tsx**

Add lazy import after existing admin page imports:
```typescript
const AdminLraUploadPage = lazy(() => import('./pages/AdminLraUploadPage'));
```

Add route inside admin routes section (after the `/admin/target-edit` route):
```tsx
<Route
  path="/admin/lra-upload"
  element={
    <AdminRoute>
      <PageWrapper component={AdminLraUploadPage} />
    </AdminRoute>
  }
/>
```

- [ ] **Step 2: Add nav item to navConfig.tsx**

Add after the `Upload Target & Angkas` nav item:
```typescript
{
  key: '/admin/lra-upload',
  icon: <UploadOutlined />,
  label: 'Upload LRA',
  roles: ['admin'],
},
```

- [ ] **Step 3: Verify TypeScript compiles**

```bash
cd D:/proj/e-evkin-modern/frontend && rtk tsc --noEmit
```

Expected: `TypeScript compilation completed`

- [ ] **Step 4: Commit**

```bash
rtk git add frontend/src/App.tsx frontend/src/config/navConfig.tsx
rtk git commit -m "feat(lra): add LRA upload route and sidebar nav"
```

---

## Task 9: Build and Deploy

- [ ] **Step 1: Run migration on production**

```bash
sshpass -p 'M4rw1y4hmama!' ssh -o StrictHostKeyChecking=no root@192.168.102.123 "cd /root/e-evkin-modern/backend && npx ts-node -e \"
const migration = require('./src/migrations/create_lra_tables').default;
const { sequelize } = require('./dist/config/database');
migration.up(sequelize.getQueryInterface()).then(() => { console.log('Migration OK'); process.exit(0); }).catch(e => { console.error(e.message); process.exit(1); });
\""
```

Expected: `Migration OK`

- [ ] **Step 2: Build frontend**

```bash
cd D:/proj/e-evkin-modern/frontend && npm run build 2>&1 | tail -5
```

Expected: `✓ built in XX.XXs`

- [ ] **Step 3: Build backend**

```bash
cd D:/proj/e-evkin-modern/backend && npm run build 2>&1 | tail -3
```

Expected: no output (tsc exits 0)

- [ ] **Step 4: Push to git**

```bash
cd D:/proj/e-evkin-modern && rtk git push origin rebranding
```

- [ ] **Step 5: Deploy to production**

```bash
sshpass -p 'M4rw1y4hmama!' ssh -o StrictHostKeyChecking=no root@192.168.102.123 "
cd /root/e-evkin-modern && git pull origin rebranding &&
cd backend && npm install && npx tsc && pm2 restart e-evkin-backend &&
cd ../frontend && npm install && npx vite build &&
rm -rf /www/wwwroot/e-evkin-modern/frontend/dist &&
cp -r dist /www/wwwroot/e-evkin-modern/frontend/dist &&
echo 'DEPLOY OK'
"
```

Expected: `DEPLOY OK`

- [ ] **Step 6: Smoke test**

- Login sebagai admin → sidebar muncul "Upload LRA"
- Buka `/admin/lra-upload` → halaman muncul tanpa error
- Upload file LRA → preview muncul dengan jumlah baris matched
- Klik Simpan → riwayat upload muncul di tabel
- Login sebagai puskesmas → buka form laporan bulan yang diupload → kolom Realisasi Rp terisi dan bertuliskan "Dari LRA"
