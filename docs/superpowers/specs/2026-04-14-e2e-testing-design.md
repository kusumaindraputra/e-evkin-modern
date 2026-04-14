# E2E Testing — Design Spec
**Date:** 2026-04-14  
**Branch:** rebranding  
**Scope:** Full regression E2E tests (API + browser) targeting production

---

## Overview

Add an `e2e/` workspace at the project root containing:
- **API tests** using Playwright's `request` fixture (no browser, fast)
- **Browser tests** using Playwright's `page` fixture (headless Chromium)

Both suites run against the production server at `https://192.168.102.123` with the production database. No test database isolation — prod DB is acceptable because test data (LRA batches) is non-destructive and visible in the admin history UI.

---

## Structure

```
e-evkin-modern/
└── e2e/
    ├── package.json              # @playwright/test, dotenv
    ├── playwright.config.ts      # baseURL, ignoreHTTPSErrors, timeouts
    ├── .env.test.example         # documented env vars (not committed)
    ├── fixtures/
    │   ├── auth.fixture.ts       # storageState-based login fixtures
    │   └── files/
    │       └── lra_sample_maret.xlsx   # test file for LRA upload
    ├── tests/
    │   ├── api/
    │   │   ├── auth.api.test.ts
    │   │   ├── laporan.api.test.ts
    │   │   └── lra.api.test.ts
    │   └── browser/
    │       ├── login.test.ts
    │       ├── laporan-bulk-input.test.ts
    │       ├── lra-upload.test.ts
    │       ├── puskesmas-dashboard.test.ts
    │       └── admin-target.test.ts
    └── helpers/
        └── test-data.ts          # shared constants (bulan, tahun, URLs)
```

---

## Playwright Configuration

**File:** `e2e/playwright.config.ts`

```ts
baseURL: process.env.TEST_BASE_URL ?? 'https://192.168.102.123'
ignoreHTTPSErrors: true   // self-signed SSL cert on prod
timeout: 30_000           // 30s per test (prod latency tolerance)
retries: 1                // 1 retry on CI for flaky network
screenshot: 'only-on-failure'
video: 'retain-on-failure'
// Two projects: "api" (workers:2, no browser) and "browser" (workers:1, chromium)
```

---

## Environment Variables

**File:** `e2e/.env.test` (gitignored) — see `.env.test.example`

```
TEST_BASE_URL=https://192.168.102.123
TEST_ADMIN_USERNAME=dinkes
TEST_ADMIN_PASSWORD=dinkes123
TEST_PUSK_USERNAME=leuwiliang
TEST_PUSK_PASSWORD=                   # retrieve from prod DB (bcrypt hash stored, reset via admin if needed)
```

---

## Auth Fixture

`fixtures/auth.fixture.ts` extends Playwright's base `test` with two fixtures:

- `adminPage` — page pre-authenticated as admin (`dinkes`)
- `puskesmasPage` — page pre-authenticated as target puskesmas (`leuwiliang`)

Uses `storageState` (saved to `e2e/.auth/`, gitignored) so login happens once per test file, not per test.

---

## API Test Coverage

### `auth.api.test.ts`
- POST `/api/auth/login` valid credentials → 200 + token
- POST `/api/auth/login` wrong password → 401 `{"error":"Invalid credentials"}`
- GET `/api/laporan` without token → 401

### `laporan.api.test.ts`
- GET `/api/laporan?bulan=Maret&tahun=2026` as puskesmas → array of laporan rows
- GET `/api/laporan?bulan=Maret&tahun=2026&user_id=<leuwiliang_id>` as admin → same rows
- Verify at least one row has `realisasi_rp_lra` field present (even if 0)
- Verify rows with matching LRA data have non-zero `realisasi_rp_lra`

### `lra.api.test.ts`
- POST `/api/lra/preview` with `lra_sample_maret.xlsx` + `bulan=Maret&tahun=2026` → `matchedCount >= 100`
- POST `/api/lra/confirm` with same file → `success: true`, `rowCount >= 100`
- GET `/api/lra/batches` → array includes at least one entry for Maret 2026
- POST `/api/lra/preview` without file → 400 error
- POST `/api/lra/preview` without `bulan`/`tahun` and undetectable filename → 400 error

---

## Browser Test Coverage

### `login.test.ts`
- Admin login → redirected away from `/login`, dashboard visible
- Puskesmas login → puskesmas dashboard visible
- Logout → back at `/login`
- Wrong credentials → error message shown

### `lra-upload.test.ts`
- Login as admin → navigate to `/admin/lra-upload`
- Upload `lra_sample_maret.xlsx` with bulan=Maret tahun=2026
- Preview table appears showing matched rows count
- Click Konfirmasi button
- Success notification visible
- History section shows new batch entry

### `laporan-bulk-input.test.ts`
- Login as puskesmas (leuwiliang) → navigate to laporan input for Maret 2026
- Page loads without error
- At least one `realisasi_rp` field is visible and marked read-only (has LRA data)
- Form can be submitted (or at minimum: form renders without JS errors)

### `puskesmas-dashboard.test.ts`
- Login as puskesmas → dashboard loads
- Chart elements visible (canvas or SVG present)
- Target and realisasi summary numbers visible (non-empty)

### `admin-target.test.ts`
- Login as admin → navigate to target/master data page
- Table loads with rows
- Filter/search by puskesmas name → result updates

---

## Explicitly Out of Scope
- Export Excel/PDF flows (binary download assertion is fragile in browsers)
- Edit permission per-bulan logic (covered by existing backend unit tests)
- Performance / load testing
- Mobile viewport testing (covered in existing mobile-first implementation)

---

## NPM Commands (root `package.json`)

```bash
npm run test:e2e            # all tests (API + browser)
npm run test:e2e:api        # API tests only (~10s)
npm run test:e2e:browser    # browser tests only (headless)
npm run test:e2e:ui         # Playwright UI mode for debugging
```

Workspace script in `e2e/package.json`:
```json
{
  "test": "playwright test",
  "test:api": "playwright test tests/api",
  "test:browser": "playwright test tests/browser",
  "test:ui": "playwright test --ui"
}
```

---

## Data Cleanup Policy

Tests do **not** clean up after themselves. LRA confirm tests insert new batch rows on each run. This is acceptable because:
1. LRA batch data is non-destructive (only affects `realisasi_rp_lra` enrichment for the specific bulan/tahun)
2. Duplicate uploads for the same bulan/tahun are visible in admin history
3. The admin UI already supports viewing upload history

---

## Implementation Notes

- `lra_sample_maret.xlsx` — copy of the March 2026 LRA file used in manual testing
- `leuwiliang` puskesmas is used for browser tests because it has both laporan records AND LRA data for Maret 2026 (verified during manual testing)
- Password for `leuwiliang` needs to be set (or reset) in prod DB before tests can run — hash is stored, plaintext unknown
- `e2e/.auth/` directory must be added to `.gitignore`
- `leuwiliang` user ID in prod: `d9164087-0ee2-4cc7-8982-9e5d30a7958d` — store in `helpers/test-data.ts`
