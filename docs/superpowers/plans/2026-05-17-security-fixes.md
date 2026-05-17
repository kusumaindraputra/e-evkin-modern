# Security & Quality Fixes Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix all 13 issues identified in the production readiness code review (critical security issues, logic bugs, TypeScript errors, auth weaknesses, and cleanup).

**Architecture:** Each task is independent and touches a narrow set of files. All fixes are conservative — no refactors or new features, just correctness and security. TypeScript errors are fixed at the source (type definitions) not suppressed.

**Tech Stack:** Node.js + Express + TypeScript + Sequelize (backend), React + TypeScript (frontend), express-rate-limit, winston logger

---

## Files Modified

| File | Tasks |
|------|-------|
| `.gitignore` | Task 1, Task 13 |
| `backend/src/services/laporan.service.ts` | Task 3, Task 5 |
| `backend/src/controllers/laporan.controller.ts` | Task 2, Task 4 |
| `backend/src/services/aiService.ts` | Task 6 |
| `backend/src/routes/admin.routes.ts` | Task 6 |
| `backend/src/app.ts` | Task 7 |
| `backend/src/routes/puskesmas.routes.ts` | Task 8 |
| `backend/src/routes/masterdata.routes.ts` | Task 9 |
| `backend/src/middleware/auth.ts` | Task 10 |
| `backend/src/routes/auth.routes.ts` | Task 11, Task 12 |
| `backend/src/routes/admin.routes.ts` | Task 12 |
| *(git tracking removal)* | Task 1, Task 13 |

---

## Task 1: Remove .env.production from git + tighten .gitignore

**Files:**
- Modify: `.gitignore`
- Shell: `git rm --cached backend/.env.production`

> **WARNING:** The production DB password and JWT secret are already in git history. After this task, you must manually rotate both credentials:
> - DB password in your hosting panel
> - JWT secret in `.env.production` (and redeploy)
> - Optionally rewrite history with `git filter-repo --path backend/.env.production --invert-paths`

- [ ] **Step 1: Update .gitignore to stop tracking .env.production**

In `.gitignore`, find this block:
```
# Keep example and template files
!.env.example
!.env.staging
!.env.production
```

Remove the `!.env.production` line. The result should be:
```
# Keep example and template files
!.env.example
!.env.staging
```

- [ ] **Step 2: Remove .env.production from git tracking (keep file on disk)**

```bash
git rm --cached backend/.env.production
```

Expected output: `rm 'backend/.env.production'`

- [ ] **Step 3: Verify the file is untracked**

```bash
git status
```

Expected: `backend/.env.production` appears under "Untracked files" (not staged).

- [ ] **Step 4: Commit**

```bash
git add .gitignore
git commit -m "security: stop tracking .env.production - credentials must not be in git"
```

---

## Task 2: Fix error message mismatch in laporan submit

**Files:**
- Modify: `backend/src/services/laporan.service.ts:401`

The controller at `laporan.controller.ts:164` checks `error.message.includes('Missing user_id')` but the service throws `'user_id is required'`. These don't match, so admin submitting without `user_id` gets a 500 instead of a 400.

- [ ] **Step 1: Fix the throw message in laporan.service.ts**

Find line ~401 in `backend/src/services/laporan.service.ts`:
```typescript
    if (!userId) {
      throw new Error('user_id is required');
    }
```

Change to:
```typescript
    if (!userId) {
      throw new Error('Missing user_id for admin submit');
    }
```

- [ ] **Step 2: Verify the controller catch clause still matches**

In `backend/src/controllers/laporan.controller.ts:164`, confirm this line exists:
```typescript
if (error.message.includes('sudah dikirim') || error.message.includes('Missing user_id') || error.message.includes('realisasi anggaran')) {
```

The string `'Missing user_id'` is a substring of `'Missing user_id for admin submit'` ✓ — no controller change needed.

- [ ] **Step 3: Commit**

```bash
git add backend/src/services/laporan.service.ts
git commit -m "fix(laporan): fix error message mismatch - admin submit without user_id now returns 400 not 500"
```

---

## Task 3: Fix TypeScript errors in laporan.service.ts

**Files:**
- Modify: `backend/src/services/laporan.service.ts:1,11-22,284`

Three errors to fix:
1. Unused `Transaction` import (TS6133)
2. `CreateLaporanParams.status?: any` should be the ENUM union (causes TS2322 and TS2345)
3. `status: 'tersimpan' as any` cast (TS2322) — removed by fixing #2

- [ ] **Step 1: Remove unused Transaction import**

In `backend/src/services/laporan.service.ts`, line 1:
```typescript
import { Op } from 'sequelize';
```

The `Transaction` import is in `sequelize`. Check the full import line — if it's:
```typescript
import { Op, Transaction } from 'sequelize';
```

Change to:
```typescript
import { Op } from 'sequelize';
```

- [ ] **Step 2: Fix CreateLaporanParams status type**

Find the `CreateLaporanParams` interface (lines ~11-22):
```typescript
interface CreateLaporanParams {
  user_id: string;
  id_sub_kegiatan: number;
  id_sumber_anggaran: number;
  tahun: number;
  bulan: string;
  realisasi_k?: number;
  realisasi_rp?: number | null;
  angkas?: number;
  status?: any;
  [key: string]: any;
}
```

Change `status?: any` to the proper union:
```typescript
interface CreateLaporanParams {
  user_id: string;
  id_sub_kegiatan: number;
  id_sumber_anggaran: number;
  tahun: number;
  bulan: string;
  realisasi_k?: number;
  realisasi_rp?: number | null;
  angkas?: number;
  status?: 'menunggu' | 'terkirim' | 'diverifikasi' | 'ditolak' | 'tersimpan';
  [key: string]: any;
}
```

- [ ] **Step 3: Remove the `as any` cast on bulkUpsert laporanData**

Find line ~284 (inside `bulkUpsert`, building `laporanData`):
```typescript
            status: 'tersimpan' as any,
```

Change to:
```typescript
            status: 'tersimpan' as const,
```

- [ ] **Step 4: Run TypeScript compile check**

```bash
cd backend && npx tsc --noEmit 2>&1 | grep "laporan.service"
```

Expected: no errors for `laporan.service.ts`.

- [ ] **Step 5: Commit**

```bash
git add backend/src/services/laporan.service.ts
git commit -m "fix(types): fix CreateLaporanParams.status type - remove any cast, use ENUM union"
```

---

## Task 4: Fix TS7030 errors in laporan.controller.ts

**Files:**
- Modify: `backend/src/controllers/laporan.controller.ts`

TypeScript `noImplicitReturns` complains that not all code paths in the controller methods return a value. Fix by adding `return` before all `res.json()` and `res.status().json()` calls in the methods.

- [ ] **Step 1: Fix findAll method**

In `backend/src/controllers/laporan.controller.ts`, find `static async findAll`:
```typescript
    static async findAll(req: Request, res: Response): Promise<void> {
        try {
            const result = await LaporanService.findAll({ ... });
            res.json({
                data: result.rows,
                pagination: { ... }
            });
        } catch (error: any) {
            console.error('Error fetching laporan:', error);
            res.status(500).json({ success: false, error: 'Gagal mengambil data laporan' });
        }
    }
```

Change to add `return` before each `res.json` call:
```typescript
    static async findAll(req: Request, res: Response): Promise<void> {
        try {
            const result = await LaporanService.findAll({ ... });
            return void res.json({
                data: result.rows,
                pagination: { ... }
            });
        } catch (error: any) {
            console.error('Error fetching laporan:', error);
            return void res.status(500).json({ success: false, error: 'Gagal mengambil data laporan' });
        }
    }
```

- [ ] **Step 2: Fix findById method**

Find `static async findById` - add `return void` before `res.json(laporan)` in the try block, and before each `res.status(xxx).json(...)` in the catch block.

- [ ] **Step 3: Fix bulkUpsert method**

Find `static async bulkUpsert` - add `return void` before `res.status(200).json(...)` in the try block, and before `res.status(isValidation ? 400 : 500).json(...)` in the catch block.

- [ ] **Step 4: Fix update method**

Find `static async update` - add `return void` before `res.json(result)` in the try block, and before each `res.status(xxx).json(...)` in the catch block.

- [ ] **Step 5: Fix delete method**

Find `static async delete` - add `return void` before `res.json(...)` in the try block, and before each `res.status(xxx).json(...)` in the catch block.

- [ ] **Step 6: Fix submit method**

Find `static async submit` - add `return void` before `res.json(...)` in the try block, and before each `res.status(xxx).json(...)` in the catch block.

- [ ] **Step 7: Run TypeScript compile check**

```bash
cd backend && npx tsc --noEmit 2>&1 | grep "laporan.controller"
```

Expected: no TS7030 errors for `laporan.controller.ts`.

- [ ] **Step 8: Commit**

```bash
git add backend/src/controllers/laporan.controller.ts
git commit -m "fix(types): add return void to controller methods to satisfy noImplicitReturns"
```

---

## Task 5: Strip status from laporan update payload

**Files:**
- Modify: `backend/src/services/laporan.service.ts` (the `update` static method, around line 378)

A puskesmas can currently pass `{ status: 'terkirim' }` in the `PUT /api/laporan/:id` body and bypass the submit validation flow. Status changes must only happen through dedicated endpoints (submit, admin return).

- [ ] **Step 1: Strip status from data before calling laporan.update()**

Find the `update` static method in `backend/src/services/laporan.service.ts`. Near the bottom (around line 378), find:
```typescript
    await laporan.update(data);
    return laporan;
```

Change to:
```typescript
    const { status: _status, ...safeData } = data;
    await laporan.update(safeData);
    return laporan;
```

This silently strips `status` from the update — status transitions only happen through `submit()` (tersimpan→terkirim) and the admin return endpoint (terkirim→tersimpan).

- [ ] **Step 2: Verify TypeScript is happy with the destructure**

```bash
cd backend && npx tsc --noEmit 2>&1 | grep "laporan.service"
```

Expected: no new errors.

- [ ] **Step 3: Commit**

```bash
git add backend/src/services/laporan.service.ts
git commit -m "fix(laporan): strip status from update payload - prevent puskesmas from bypassing submit flow"
```

---

## Task 6: Add chat input length limit + aiService findAll guard

**Files:**
- Modify: `backend/src/routes/admin.routes.ts`
- Modify: `backend/src/services/aiService.ts`

Two gaps:
1. The POST `/api/admin/chat` endpoint in `admin.routes.ts`... wait — actually the chat endpoint is in `chat.routes.ts` (currently unregistered). `admin.routes.ts` does not have AI chat. The aiService is imported in `chat.routes.ts`. For this task, fix the aiService `aggregateLaporanData` row limit, and add length validation in `chat.routes.ts`. The Task 7 below registers `chat.routes.ts`.

- [ ] **Step 1: Add input length guard in chat.routes.ts**

In `backend/src/routes/chat.routes.ts`, find the POST `/chat` handler:
```typescript
    if (!question || question.trim().length === 0) {
      return res.status(400).json({ 
        error: 'Question is required',
        message: 'Silakan masukkan pertanyaan untuk AI'
      });
    }
```

Change to:
```typescript
    if (!question || question.trim().length === 0) {
      return res.status(400).json({ 
        error: 'Question is required',
        message: 'Silakan masukkan pertanyaan untuk AI'
      });
    }
    if (question.length > 2000) {
      return res.status(400).json({
        error: 'Question too long',
        message: 'Pertanyaan maksimal 2000 karakter'
      });
    }
```

- [ ] **Step 2: Add row LIMIT to aggregateLaporanData in aiService.ts**

In `backend/src/services/aiService.ts`, find the `aggregateLaporanData` function. Find the `Laporan.findAll` call (around line 84):
```typescript
    const laporan = await Laporan.findAll({
      where: {
        bulan: currentMonth,
        tahun: currentYear,
      },
      include: [
        ...
      ],
```

Add `limit: 1000` to cap the rows loaded:
```typescript
    const laporan = await Laporan.findAll({
      where: {
        bulan: currentMonth,
        tahun: currentYear,
      },
      limit: 1000,
      include: [
        ...
      ],
```

- [ ] **Step 3: Commit**

```bash
git add backend/src/routes/chat.routes.ts backend/src/services/aiService.ts
git commit -m "fix(chat): add 2000-char input limit and 1000-row AI data cap to prevent DoS"
```

---

## Task 7: Register chat.routes.ts in app.ts

**Files:**
- Modify: `backend/src/app.ts`

`chat.routes.ts` defines the AI chat endpoints (POST /chat, GET /suggested-questions, GET /context) but is never mounted in `app.ts`. The `ChatWidget.tsx` frontend component is broken as a result.

- [ ] **Step 1: Import and mount chat.routes.ts**

In `backend/src/app.ts`, find the existing imports section (around lines 13-29). After the `import adminRoutes` line:
```typescript
import adminRoutes from './routes/admin.routes';
```

Add:
```typescript
import chatRoutes from './routes/chat.routes';
```

- [ ] **Step 2: Mount at /api/admin**

Find the route setup section. After:
```typescript
app.use('/api/admin', adminRoutes);
```

Add:
```typescript
app.use('/api/admin', chatRoutes);
```

This makes the endpoints available at:
- POST `/api/admin/chat`
- GET `/api/admin/suggested-questions`
- GET `/api/admin/context`

- [ ] **Step 3: Compile check**

```bash
cd backend && npx tsc --noEmit 2>&1 | grep "app.ts"
```

Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add backend/src/app.ts
git commit -m "fix(chat): register chat.routes.ts - AI chat endpoints were unreachable"
```

---

## Task 8: Fix puskesmas.routes.ts stub

**Files:**
- Modify: `backend/src/routes/puskesmas.routes.ts`

The route currently returns `{ message: 'Puskesmas list endpoint' }`. The real puskesmas user list is served at `GET /api/users/puskesmas`. Fix to return a proper redirect or the actual data by importing the User model.

- [ ] **Step 1: Implement GET / to return actual puskesmas users**

Replace the entire content of `backend/src/routes/puskesmas.routes.ts` with:

```typescript
import { Router } from 'express';
import User from '../models/User';
import { authenticate } from '../middleware/auth';
import { authorizeAdmin } from '../middleware/authorize';

const router = Router();

router.get('/', authenticate, authorizeAdmin, async (req, res, next) => {
  try {
    const puskesmas = await User.findAll({
      where: { role: 'puskesmas' },
      attributes: ['id', 'username', 'nama', 'nama_puskesmas', 'kecamatan', 'wilayah'],
      order: [['nama_puskesmas', 'ASC']],
    });
    return res.json(puskesmas);
  } catch (error) {
    return next(error);
  }
});

export default router;
```

- [ ] **Step 2: Compile check**

```bash
cd backend && npx tsc --noEmit 2>&1 | grep "puskesmas.routes"
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add backend/src/routes/puskesmas.routes.ts
git commit -m "fix(puskesmas): implement GET /api/puskesmas - was returning placeholder stub"
```

---

## Task 9: Replace inline role checks with authorizeAdmin in masterdata.routes.ts

**Files:**
- Modify: `backend/src/routes/masterdata.routes.ts`

12 write routes (POST/PUT/DELETE for satuan, sumber anggaran, kegiatan, sub_kegiatan) check `req.user?.role !== 'admin'` inline instead of using the `authorizeAdmin` middleware. This is inconsistent with the rest of the codebase and harder to audit.

- [ ] **Step 1: Add authorizeAdmin import**

In `backend/src/routes/masterdata.routes.ts`, find the imports section (around line 6):
```typescript
import { authenticate } from '../middleware/auth';
```

Add the authorizeAdmin import:
```typescript
import { authenticate } from '../middleware/auth';
import { authorizeAdmin } from '../middleware/authorize';
```

- [ ] **Step 2: Replace all POST/PUT/DELETE route handlers — satuan**

For `POST /satuan` (around line 40):

Before (the entire try block body starts with an inline role check):
```typescript
router.post('/satuan', authenticate, async (req, res, next) => {
  try {
    // Check admin role
    if (req.user?.role !== 'admin') {
      return res.status(403).json({ message: 'Akses ditolak. Hanya admin yang dapat menambah satuan' });
    }
    const { satuannya } = req.body;
    ...
```

After (move the role check to middleware, remove inline check):
```typescript
router.post('/satuan', authenticate, authorizeAdmin, async (req, res, next) => {
  try {
    const { satuannya } = req.body;
    ...
```

Repeat the same pattern for:
- `PUT /satuan/:id` (around line 61) — remove inline role check, add `authorizeAdmin` to middleware chain
- `DELETE /satuan/:id` (around line 86) — same
- `POST /sumber-anggaran` (around line 135) — same
- `PUT /sumber-anggaran/:id` (around line 154) — same
- `DELETE /sumber-anggaran/:id` (around line 178) — same
- `POST /kegiatan` (around line 245) — same
- `PUT /kegiatan/:id` (around line 270) — same
- `DELETE /kegiatan/:id` (around line 297) — same
- `POST /sub-kegiatan` (around line 377) — same
- `PUT /sub-kegiatan/:id` (around line 411) — same
- `DELETE /sub-kegiatan/:id` (around line 447) — same

Pattern for each: change `authenticate, async` to `authenticate, authorizeAdmin, async` and delete the `if (req.user?.role !== 'admin')` block at the top of the try body.

- [ ] **Step 3: Compile check**

```bash
cd backend && npx tsc --noEmit 2>&1 | grep "masterdata"
```

Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add backend/src/routes/masterdata.routes.ts
git commit -m "refactor(masterdata): replace 12 inline admin role checks with authorizeAdmin middleware"
```

---

## Task 10: Add DB existence check to JWT authenticate middleware

**Files:**
- Modify: `backend/src/middleware/auth.ts`

Currently `authenticate` only verifies the JWT signature — it never checks if the user still exists in the DB. A deleted or disabled user can use their JWT (7-day window) indefinitely. Add a lightweight `User.findByPk` to confirm the account exists.

- [ ] **Step 1: Update auth.ts to check DB**

Replace the entire content of `backend/src/middleware/auth.ts` with:

```typescript
import { Request, Response, NextFunction } from 'express';
import * as jwt from 'jsonwebtoken';
import { config } from '../config';
import User from '../models/User';

export const authenticate = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');

    if (!token) {
      res.status(401).json({ message: 'No token provided' });
      return;
    }

    const decoded = jwt.verify(token, config.jwt.secret) as any;

    const user = await User.findByPk(decoded.id, {
      attributes: ['id', 'username', 'role'],
    });

    if (!user) {
      res.status(401).json({ message: 'Akun tidak ditemukan atau sudah dihapus' });
      return;
    }

    (req as any).user = { id: user.id, username: user.username, role: user.role };
    next();
  } catch (error: any) {
    res.status(401).json({ message: 'Token tidak valid atau sudah kadaluarsa' });
  }
};
```

- [ ] **Step 2: Compile check**

```bash
cd backend && npx tsc --noEmit 2>&1 | grep "middleware/auth"
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add backend/src/middleware/auth.ts
git commit -m "fix(auth): verify user still exists in DB on every authenticated request"
```

---

## Task 11: Add per-route rate limiter for login endpoint

**Files:**
- Modify: `backend/src/routes/auth.routes.ts`
- Modify: `backend/src/middleware/rateLimiter.ts`

The global rate limiter allows 100 req/15min across all endpoints. The login endpoint needs its own tighter limit (10 attempts/15min per IP) to prevent brute-force attacks.

- [ ] **Step 1: Export a loginRateLimiter from rateLimiter.ts**

In `backend/src/middleware/rateLimiter.ts`, the current content is:
```typescript
import rateLimit from 'express-rate-limit';
import { config } from '../config';

export const rateLimiter = rateLimit({
  windowMs: config.rateLimit.windowMs,
  max: config.env === 'development' ? 1000 : config.rateLimit.maxRequests,
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});
```

Add a login-specific limiter:
```typescript
import rateLimit from 'express-rate-limit';
import { config } from '../config';

export const rateLimiter = rateLimit({
  windowMs: config.rateLimit.windowMs,
  max: config.env === 'development' ? 1000 : config.rateLimit.maxRequests,
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});

export const loginRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: config.env === 'development' ? 1000 : 10,
  message: 'Terlalu banyak percobaan login. Coba lagi dalam 15 menit.',
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => req.ip ?? 'unknown',
});
```

- [ ] **Step 2: Apply loginRateLimiter to the login route**

In `backend/src/routes/auth.routes.ts`, add the import:
```typescript
import { loginRateLimiter } from '../middleware/rateLimiter';
```

Find the login route:
```typescript
router.post('/login', async (req: Request, res: Response) => {
```

Change to:
```typescript
router.post('/login', loginRateLimiter, async (req: Request, res: Response) => {
```

- [ ] **Step 3: Compile check**

```bash
cd backend && npx tsc --noEmit 2>&1 | grep -E "auth.routes|rateLimiter"
```

Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add backend/src/middleware/rateLimiter.ts backend/src/routes/auth.routes.ts
git commit -m "fix(auth): add per-route rate limiter for login endpoint (10 attempts/15min)"
```

---

## Task 12: Replace console.error with logger in key route files

**Files:**
- Modify: `backend/src/routes/auth.routes.ts`
- Modify: `backend/src/routes/admin.routes.ts`
- Modify: `backend/src/routes/chat.routes.ts`

The `logger` utility (winston) exists at `backend/src/utils/logger.ts` but `console.error` is used instead. Fix the highest-traffic files first.

- [ ] **Step 1: Fix auth.routes.ts**

In `backend/src/routes/auth.routes.ts`, add logger import after existing imports:
```typescript
import { logger } from '../utils/logger';
```

Then replace:
- `console.error('Login error:', error)` → `logger.error('Login error:', error)`
- `console.error('Auth verification error:', error)` → `logger.error('Auth verification error:', error)`
- `console.error('Logout error:', error)` → `logger.error('Logout error:', error)`

- [ ] **Step 2: Fix admin.routes.ts**

In `backend/src/routes/admin.routes.ts`, add logger import:
```typescript
import { logger } from '../utils/logger';
```

Replace all `console.error('...')` calls with `logger.error('...')`. There are about 10 instances (one per route handler catch block).

- [ ] **Step 3: Fix chat.routes.ts**

In `backend/src/routes/chat.routes.ts`, add logger import:
```typescript
import { logger } from '../utils/logger';
```

Replace:
- `console.error('Error in chat endpoint:', error)` → `logger.error('Error in chat endpoint:', error)`
- `console.error('Error getting suggested questions:', error)` → `logger.error('Error getting suggested questions:', error)`
- `console.error('Error getting context:', error)` → `logger.error('Error getting context:', error)`

- [ ] **Step 4: Compile check**

```bash
cd backend && npx tsc --noEmit 2>&1 | grep -E "auth.routes|admin.routes|chat.routes"
```

Expected: no errors.

- [ ] **Step 5: Commit**

```bash
git add backend/src/routes/auth.routes.ts backend/src/routes/admin.routes.ts backend/src/routes/chat.routes.ts
git commit -m "fix(logging): replace console.error with winston logger in auth, admin, chat routes"
```

---

## Task 13: Remove debug/test artifacts from git tracking

**Files:**
- Modify: `.gitignore`
- Shell: `git rm --cached` for each artifact file

Debug output files, E2E screenshots, test scripts, and a `.ps1` verification script are tracked in git. Remove them from tracking while keeping them on disk.

- [ ] **Step 1: Run git rm --cached for all artifact files**

```bash
git rm --cached \
  check_db.js \
  debug_angkas.js \
  laporan_test_result.txt \
  "log npm run dev.txt" \
  replace_brand.js \
  seed_kegiatan.js \
  test_admin_upload_modal.png \
  test_puskesmas_dashboard.png \
  verify_build.ps1 \
  backend/debug_output.txt \
  backend/e2e_01_initial.png \
  backend/e2e_02_data_loaded.png \
  backend/e2e_03_after_input.png \
  backend/e2e_04_after_save.png \
  backend/e2e_05_mobile.png \
  backend/test_laporan_cards_prod.png \
  backend/test_output.txt \
  backend/test-api.js \
  backend/test-results.txt \
  backend/tsc_errors.txt
```

Expected: each line prints `rm 'filename'`.

- [ ] **Step 2: Add patterns to .gitignore to prevent re-tracking**

In `.gitignore`, add a new section at the bottom:
```
# Debug and test artifacts (not tracked)
check_db.js
debug_angkas.js
laporan_test_result.txt
replace_brand.js
seed_kegiatan.js
verify_build.ps1
backend/debug_output.txt
backend/test_output.txt
backend/test-results.txt
backend/test-api.js
backend/tsc_errors.txt
# Screenshots
*.png
!logo.png
```

> Note: `logo.png` is kept because it's the app logo asset. All other `.png` files at root and in backend are debug screenshots.

- [ ] **Step 3: Verify status looks correct**

```bash
git status
```

Expected: the listed files appear as "deleted" (staged for removal from tracking), and `.gitignore` shows as modified.

- [ ] **Step 4: Commit**

```bash
git add .gitignore
git commit -m "chore: remove debug/test artifacts from git tracking, update .gitignore"
```

---

## Final: Full TypeScript clean compile check

After all tasks are done, run a full TypeScript check across both service and controller files:

```bash
cd backend && npx tsc --noEmit 2>&1
```

Expected: zero errors (or only pre-existing errors unrelated to the files modified in this plan).
