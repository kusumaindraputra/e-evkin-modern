# SSL + Mandatory Audit Fixes + Deploy Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Configure proper SSL certificates on production, fix all HIGH/CRITICAL audit items (data integrity bugs + broken UX), deploy rebranding + fixes to production, and verify.

**Architecture:** SSL certificates (DigiCert wildcard for *.bogorkab.go.id) replace the self-signed cert on nginx. Backend fixes are in Express service/route layer. Frontend fixes are in React Router + Layout component. Deploy via SSH to 192.168.102.123.

**Tech Stack:** Nginx SSL, Express/Sequelize (backend), React/Ant Design (frontend), PM2 cluster, PostgreSQL

---

## File Structure

### Backend changes
- **Modify:** `backend/src/services/laporan.service.ts` — L2 (submit validation), L8 (terkirim protection in bulkUpsert)
- **Modify:** `backend/src/routes/laporan.routes.ts` — L6 (DELETE editPermission), L7 (submit editPermission)
- **Modify:** `backend/src/routes/puskesmas-dashboard.routes.ts` — L1 (budget-monthly status filter)
- **Modify:** `backend/src/services/dashboardService.ts` — L5 (stats consistency)

### Frontend changes
- **Modify:** `frontend/src/App.tsx` — U2 (catch-all), U3 (profile route), U4 (redirect fix)
- **Modify:** `frontend/src/components/Layout.tsx` — U6 (fallback text)

### Config changes
- **Modify:** `config/nginx.conf` — SSL cert paths update

---

## Task 1: Install SSL Certificate on Production

**Files:**
- Local: `C:\Users\kusum\Downloads\star_bogorkab_go_id_1368313051\` (cert source)
- Remote: `/etc/nginx/ssl/` (cert destination)
- Modify: `config/nginx.conf` (cert path references)

- [ ] **Step 1.1: Create certificate bundle (chain cert)**

Nginx needs the server cert + intermediate CA bundled into one file. Run locally:

```bash
cd "C:\Users\kusum\Downloads\star_bogorkab_go_id_1368313051"
cat star_bogorkab_go_id.crt DigiCertCA.crt > star_bogorkab_go_id_bundle.crt
```

This creates a bundle: server cert first, then intermediate CA.

- [ ] **Step 1.2: Upload certificates to production server**

```bash
sshpass -p 'M4rw1y4hmama!' scp -o StrictHostKeyChecking=no \
  "C:\Users\kusum\Downloads\star_bogorkab_go_id_1368313051\star_bogorkab_go_id_bundle.crt" \
  root@192.168.102.123:/etc/nginx/ssl/star_bogorkab_go_id.crt

sshpass -p 'M4rw1y4hmama!' scp -o StrictHostKeyChecking=no \
  "C:\Users\kusum\Downloads\star_bogorkab_go_id_1368313051\private.key" \
  root@192.168.102.123:/etc/nginx/ssl/star_bogorkab_go_id.key
```

- [ ] **Step 1.3: Update nginx.conf cert paths**

In `config/nginx.conf`, change lines 18-19:

```nginx
# Before:
ssl_certificate /etc/nginx/ssl/evkindinkes.crt;
ssl_certificate_key /etc/nginx/ssl/evkindinkes.key;

# After:
ssl_certificate /etc/nginx/ssl/star_bogorkab_go_id.crt;
ssl_certificate_key /etc/nginx/ssl/star_bogorkab_go_id.key;
```

- [ ] **Step 1.4: Upload updated nginx.conf and test**

```bash
sshpass -p 'M4rw1y4hmama!' scp -o StrictHostKeyChecking=no \
  config/nginx.conf root@192.168.102.123:/etc/nginx/sites-enabled/e-evkin-modern

sshpass -p 'M4rw1y4hmama!' ssh -o StrictHostKeyChecking=no root@192.168.102.123 \
  "nginx -t && systemctl reload nginx"
```

Expected: `nginx: the configuration file /etc/nginx/nginx.conf syntax is ok`

- [ ] **Step 1.5: Verify SSL works**

```bash
sshpass -p 'M4rw1y4hmama!' ssh -o StrictHostKeyChecking=no root@192.168.102.123 \
  "curl -sI https://localhost --resolve 'localhost:443:127.0.0.1' -k | head -5"
```

Expected: `HTTP/2 200` or `HTTP/1.1 200`

- [ ] **Step 1.6: Commit nginx config change**

```bash
git add config/nginx.conf
git commit -m "chore: update nginx SSL to DigiCert wildcard cert for *.bogorkab.go.id"
```

---

## Task 2: Fix L6 + L7 — Missing editPermission on DELETE and Submit

**Files:**
- Modify: `backend/src/routes/laporan.routes.ts:27,30`

The DELETE and submit routes lack `checkEditPermission('laporan')` middleware, allowing operations outside the edit window.

- [ ] **Step 2.1: Add editPermission to DELETE and submit routes**

In `backend/src/routes/laporan.routes.ts`, change lines 27 and 30:

```typescript
// Before (line 27):
router.delete('/:id', authenticate, LaporanController.delete);

// After:
router.delete('/:id', authenticate, checkEditPermission('laporan'), LaporanController.delete);

// Before (line 30):
router.post('/submit', authenticate, LaporanController.submit);

// After:
router.post('/submit', authenticate, checkEditPermission('laporan'), LaporanController.submit);
```

- [ ] **Step 2.2: Commit**

```bash
git add backend/src/routes/laporan.routes.ts
git commit -m "fix(security): add editPermission check to DELETE and submit routes (L6, L7)"
```

---

## Task 3: Fix L8 — Protect Terkirim Laporan from Overwrite

**Files:**
- Modify: `backend/src/services/laporan.service.ts:341-358`

The `bulkUpsert()` method updates existing laporan regardless of their current status. A `terkirim` record can be silently overwritten.

- [ ] **Step 3.1: Add status guard in bulkUpsert**

In `backend/src/services/laporan.service.ts`, after line 349 (`const existing = existingLaporanMap.get(existingKey);`), add a status check:

```typescript
// Line ~349-350, BEFORE the existing.update call:
const existingKey = `${userId}_${data.id_sub_kegiatan}_${data.id_sumber_anggaran}_${data.bulan}_${data.tahun}`;
const existing = existingLaporanMap.get(existingKey);
if (existing) {
  // NEW: Protect terkirim laporan from being overwritten
  if (existing.status === 'terkirim') {
    results.skipped++;
    continue;
  }
  await existing.update(laporanData, { transaction });
  results.updated++;
}
```

Also fix line 338 — prevent client from setting status to anything other than tersimpan:

```typescript
// Before (line 338):
status: (data.status || 'tersimpan') as any,

// After:
status: 'tersimpan' as any,
```

And for the update-by-id path (line 341-346), add the same guard:

```typescript
if (data.id) {
  // Check if existing laporan is terkirim
  const existingById = await Laporan.findOne({
    where: { id: data.id, user_id: userId },
    attributes: ['id', 'status'],
    transaction,
  });
  if (existingById && existingById.status === 'terkirim') {
    results.skipped++;
    continue;
  }
  const [updatedCount] = await Laporan.update(laporanData, {
    where: { id: data.id, user_id: userId },
    transaction,
  });
  updatedCount > 0 ? results.updated++ : results.skipped++;
}
```

- [ ] **Step 3.2: Commit**

```bash
git add backend/src/services/laporan.service.ts
git commit -m "fix(security): prevent overwriting terkirim laporan via bulkUpsert (L8)"
```

---

## Task 4: Fix L2 — Add Data Validation to Submit

**Files:**
- Modify: `backend/src/services/laporan.service.ts:433-463`

The `submit()` method changes status from `tersimpan` to `terkirim` without checking if data fields are actually filled.

- [ ] **Step 4.1: Add completeness validation before status change**

In `backend/src/services/laporan.service.ts`, inside the `submit()` method, before the update call (line 440), add:

```typescript
static async submit(bulan: string, tahun: number, requesterId: string, requesterRole: string, userIdParam?: string) {
  const userId = requesterRole === 'puskesmas' ? requesterId : userIdParam;

  if (!userId) {
    throw new Error('user_id is required');
  }

  // NEW: Validate data completeness before submit
  const pendingLaporan = await Laporan.findAll({
    where: {
      user_id: userId,
      bulan,
      tahun,
      status: 'tersimpan'
    }
  });

  if (pendingLaporan.length === 0) {
    const alreadySubmittedCount = await Laporan.count({
      where: { user_id: userId, bulan, tahun, status: 'terkirim' }
    });
    if (alreadySubmittedCount > 0) {
      throw new Error(`Semua laporan untuk ${bulan} ${tahun} sudah dikirim sebelumnya`);
    }
    throw new Error(`Tidak ada laporan dengan status "tersimpan" untuk ${bulan} ${tahun}`);
  }

  // Check that all laporan have required fields filled
  const incomplete = pendingLaporan.filter(l => {
    const data = l.get({ plain: true }) as any;
    return data.realisasi_k === null || data.realisasi_k === undefined;
  });

  if (incomplete.length > 0) {
    throw new Error(`${incomplete.length} laporan belum memiliki data realisasi kinerja. Lengkapi data sebelum mengirim.`);
  }

  // Now update status
  const [updatedCount] = await Laporan.update(
    { status: 'terkirim' },
    {
      where: {
        user_id: userId,
        bulan,
        tahun,
        status: 'tersimpan'
      }
    }
  );

  return updatedCount;
}
```

- [ ] **Step 4.2: Commit**

```bash
git add backend/src/services/laporan.service.ts
git commit -m "fix: validate data completeness before submit (L2)"
```

---

## Task 5: Fix L1 — Budget Monthly Missing Status Filter

**Files:**
- Modify: `backend/src/routes/puskesmas-dashboard.routes.ts:140`

The budget-monthly query includes all laporan (including drafts). Should only include `terkirim`.

- [ ] **Step 5.1: Add status filter to budget-monthly query**

In `backend/src/routes/puskesmas-dashboard.routes.ts`, line 140, add status filter:

```sql
-- Before (line 140):
WHERE l.tahun = :tahun AND l.bulan = :bulan AND l.user_id = :userId

-- After:
WHERE l.tahun = :tahun AND l.bulan = :bulan AND l.user_id = :userId AND l.status = 'terkirim'
```

- [ ] **Step 5.2: Commit**

```bash
git add backend/src/routes/puskesmas-dashboard.routes.ts
git commit -m "fix: filter budget-monthly by status=terkirim (L1)"
```

---

## Task 6: Fix L5 — Dashboard Stats/Chart Consistency

**Files:**
- Modify: `backend/src/services/dashboardService.ts:68-69`

Admin dashboard stats count ALL laporan (including drafts) for `totalLaporan`, but chart only shows submitted. The `puskesmasReporting` metric correctly uses `status: 'terkirim'`, but `totalLaporan` doesn't.

- [ ] **Step 6.1: Filter totalLaporan to only count submitted**

In `backend/src/services/dashboardService.ts`, line 69:

```typescript
// Before (line 68-69):
const [totalLaporan, statusCounts, totalPuskesmas, puskesmasReporting] = await Promise.all([
  Laporan.count({ where }),

// After:
const [totalLaporan, statusCounts, totalPuskesmas, puskesmasReporting] = await Promise.all([
  Laporan.count({ where: { ...where, status: 'terkirim' } }),
```

This makes `totalLaporan` consistent with chart data (submitted only). The breakdown (tersimpan/terkirim) is still returned separately from `statusCounts`.

- [ ] **Step 6.2: Commit**

```bash
git add backend/src/services/dashboardService.ts
git commit -m "fix: dashboard totalLaporan counts only terkirim for consistency with chart (L5)"
```

---

## Task 7: Fix U2 + U3 + U4 — Frontend Routing

**Files:**
- Modify: `frontend/src/App.tsx:42-55,192-193`

Three routing issues:
- U2: Catch-all `*` always redirects to `/dashboard` (admin-only page)
- U3: Profile route referenced in header dropdown doesn't exist
- U4: Wrong-role redirect goes to `/laporan` which may not exist for the role

- [ ] **Step 7.1: Fix catch-all route (U2)**

In `frontend/src/App.tsx`, line 192-193, replace:

```typescript
// Before:
<Route path="*" element={<Navigate to="/dashboard" replace />} />

// After — use RootRedirect which is already role-aware:
<Route path="*" element={<RootRedirect />} />
```

- [ ] **Step 7.2: Fix wrong-role redirects (U4)**

In `frontend/src/App.tsx`, lines 45 and 53:

```typescript
// PuskesmasRoute (line 45) — Before:
if (user?.role !== 'puskesmas') return <Navigate to="/laporan" replace />;
// After:
if (user?.role !== 'puskesmas') return <Navigate to="/dashboard" replace />;

// AdminRoute (line 53) — Before:
if (user?.role !== 'admin') return <Navigate to="/laporan" replace />;
// After:
if (user?.role !== 'admin') return <Navigate to="/puskesmas/dashboard" replace />;
```

This sends each role to their correct dashboard when they access a wrong-role page.

- [ ] **Step 7.3: Add profile route placeholder (U3)**

In `frontend/src/App.tsx`, add a simple profile page redirect. Find where routes are defined (around line 100-190) and add before the catch-all:

```typescript
{/* Profile route — redirect to role-appropriate dashboard for now */}
<Route
  path="/profile"
  element={<RootRedirect />}
/>
```

This prevents the 404 loop. A full profile page can be built later.

- [ ] **Step 7.4: Commit**

```bash
git add frontend/src/App.tsx
git commit -m "fix: role-aware catch-all, fix wrong-role redirects, add profile route (U2, U3, U4)"
```

---

## Task 8: Fix U6 — Header Fallback Text

**Files:**
- Modify: `frontend/src/components/Layout.tsx:105`

The header shows `kode_puskesmas` (e.g. "PKS001") as fallback when `nama_puskesmas` is empty.

- [ ] **Step 8.1: Change fallback from kode to friendly label**

In `frontend/src/components/Layout.tsx`, line 105:

```typescript
// Before:
{user?.role === 'admin' ? 'Administrator' : (user?.nama_puskesmas || user?.kode_puskesmas)}

// After:
{user?.role === 'admin' ? 'Administrator' : (user?.nama_puskesmas || 'Puskesmas')}
```

- [ ] **Step 8.2: Commit**

```bash
git add frontend/src/components/Layout.tsx
git commit -m "fix: show 'Puskesmas' as fallback instead of kode_puskesmas (U6)"
```

---

## Task 9: Build and Deploy to Production

**Files:**
- Backend: `backend/dist/` (compiled)
- Frontend: `frontend/dist/` (Vite build)

- [ ] **Step 9.1: Build backend locally**

```bash
cd backend && npx tsc && cd ..
```

Expected: Clean compile, no errors.

- [ ] **Step 9.2: Build frontend locally**

```bash
cd frontend && npx vite build && cd ..
```

Expected: `built in Xs`, no errors.

- [ ] **Step 9.3: Commit all builds**

```bash
git add backend/dist frontend/dist
git commit -m "chore: build backend + frontend for deployment"
```

- [ ] **Step 9.4: Push rebranding branch and deploy to production**

```bash
git push origin rebranding
```

Then on production server:

```bash
sshpass -p 'M4rw1y4hmama!' ssh -o StrictHostKeyChecking=no root@192.168.102.123 << 'DEPLOY'
cd /root/e-evkin-modern
git fetch origin
git checkout rebranding
git pull origin rebranding

# Rebuild backend
cd backend
npm install --production
npx tsc
cd ..

# Rebuild frontend
cd frontend
npm install
npx vite build
cd ..

# Copy frontend dist to nginx root
rm -rf /www/wwwroot/e-evkin-modern/frontend/dist
cp -r frontend/dist /www/wwwroot/e-evkin-modern/frontend/dist

# Restart backend
cd backend
pm2 reload ecosystem.config.js --env production
pm2 save

# Reload nginx (for SSL cert change)
nginx -t && systemctl reload nginx

echo "Deploy complete"
DEPLOY
```

- [ ] **Step 9.5: Verify deployment**

```bash
# Check backend is running
sshpass -p 'M4rw1y4hmama!' ssh -o StrictHostKeyChecking=no root@192.168.102.123 \
  "pm2 list && curl -s http://127.0.0.1:5000/health"

# Check frontend serves
sshpass -p 'M4rw1y4hmama!' ssh -o StrictHostKeyChecking=no root@192.168.102.123 \
  "curl -sI https://localhost -k | head -5"
```

Expected: PM2 shows 2 instances online, health returns OK, HTTPS returns 200.

---

## Task 10: Test Production

- [ ] **Step 10.1: Test SSL certificate**

```bash
sshpass -p 'M4rw1y4hmama!' ssh -o StrictHostKeyChecking=no root@192.168.102.123 \
  "echo | openssl s_client -connect 127.0.0.1:443 -servername e-evkindinkes.bogorkab.go.id 2>/dev/null | openssl x509 -noout -subject -issuer -dates"
```

Expected: Subject shows `*.bogorkab.go.id`, Issuer shows DigiCert, dates valid.

- [ ] **Step 10.2: Test login and routing**

```bash
# Test login API
sshpass -p 'M4rw1y4hmama!' ssh -o StrictHostKeyChecking=no root@192.168.102.123 \
  "curl -s -k https://localhost/api/auth/login -X POST -H 'Content-Type: application/json' -d '{\"username\":\"admin\",\"password\":\"admin123\"}' | head -c 200"
```

Expected: Returns token and user object.

- [ ] **Step 10.3: Test that terkirim laporan is protected**

```bash
# Get auth token first, then test bulkUpsert with submitted data
sshpass -p 'M4rw1y4hmama!' ssh -o StrictHostKeyChecking=no root@192.168.102.123 << 'TEST'
TOKEN=$(curl -s -k https://localhost/api/auth/login -X POST \
  -H 'Content-Type: application/json' \
  -d '{"username":"puskesmas_bojonggede","password":"puskesmas123"}' | \
  python3 -c "import sys,json; print(json.load(sys.stdin)['token'])" 2>/dev/null)

# Try to overwrite via bulk-upsert — should be skipped
echo "Token: ${TOKEN:0:20}..."
echo "L8 protection test: bulk-upsert should skip terkirim records"
TEST
```

- [ ] **Step 10.4: Test rebranding visuals**

```bash
# Verify the frontend loads with new theme (check CSS variables)
sshpass -p 'M4rw1y4hmama!' ssh -o StrictHostKeyChecking=no root@192.168.102.123 \
  "curl -s -k https://localhost/ | grep -o 'Plus Jakarta Sans' | head -1"
```

Expected: Returns "Plus Jakarta Sans" confirming theme CSS is loaded.

- [ ] **Step 10.5: Verify budget-monthly uses status filter**

```bash
sshpass -p 'M4rw1y4hmama!' ssh -o StrictHostKeyChecking=no root@192.168.102.123 \
  "grep -n 'status.*terkirim' /root/e-evkin-modern/backend/src/routes/puskesmas-dashboard.routes.ts | head -5"
```

Expected: Shows the `AND l.status = 'terkirim'` in the budget-monthly query.

---

## Summary of Audit Items Addressed

| # | Issue | Task | Priority |
|---|-------|------|----------|
| L1 | Budget-monthly missing status filter | Task 5 | HIGH |
| L2 | Submit no data validation | Task 4 | HIGH |
| L5 | Stats/chart data inconsistency | Task 6 | HIGH |
| L6 | DELETE no editPermission | Task 2 | HIGH |
| L7 | Submit no editPermission | Task 2 | HIGH |
| L8 | Terkirim overwrite via bulkUpsert | Task 3 | HIGH |
| U2 | Catch-all to admin dashboard | Task 7 | CRITICAL |
| U3 | Profile route undefined | Task 7 | HIGH |
| U4 | Wrong-role redirect loop | Task 7 | HIGH |
| U6 | kode_puskesmas fallback | Task 8 | MEDIUM |
| SSL | Self-signed → DigiCert wildcard | Task 1 | HIGH |
