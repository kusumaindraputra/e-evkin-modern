# Angkas Multi-Sumber Fix

## Problems

### 1. Warning not showing (frontend bug)
In `LaporanBulkInputPage.tsx` line 247, when multi-sumber sub kegiatan has no manual angkas:
- `angkasFullMap.get(key)` returns `undefined`
- Fallback `|| 0` converts it to `0`
- Warning condition `row.angkas == null` never matches because `0 != null`

### 2. PDF upload assigns to wrong sumber (backend bug)
When angkas PDF is uploaded for a multi-sumber sub kegiatan, the full value gets assigned to one sumber anggaran only. This causes one sumber to exceed its budget while others get 0.

## Fixes

### Fix 1: Frontend — distinguish null vs 0
In `LaporanBulkInputPage.tsx`:
- Change `angkasFullMap.get(angkasKey) || 0` to `angkasFullMap.get(angkasKey) ?? null`
- This preserves `null` when no manual angkas exists, vs `0` when explicitly set to 0
- Warning in LaporanInputCard already checks `row.angkas == null` — will now work correctly

### Fix 2: Backend — skip multi-sumber on PDF upload
In the angkas upload/parse route:
- When matching PDF angkas to sub kegiatan, check if sub kegiatan has >1 sumber anggaran
- If multi-sumber: skip assignment, do not create AnggaranKas records
- Log skipped items so admin knows which sub kegiatan need manual input

## Files affected
1. `frontend/src/pages/LaporanBulkInputPage.tsx` — change fallback from `|| 0` to `?? null`
2. `backend/src/routes/angkas.routes.ts` — skip multi-sumber sub kegiatan during PDF upload
