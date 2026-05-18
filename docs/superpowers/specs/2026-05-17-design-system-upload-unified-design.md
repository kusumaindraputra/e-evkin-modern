# Design System v1.1 + Unified Upload Page

**Date:** 2026-05-17  
**Status:** Approved  
**Source:** `design system/Handover.html`, `design system/Design System.html`, `design system/Upload Data.html`

---

## Overview

Implement the e-evkin Design System v1.1 token naming convention across the entire codebase, build a reusable `DropZone` component system, and consolidate three separate upload pages into a single unified `/admin/upload` page.

**Approach:** Top-down — token rename first, then components, then page, then cleanup.

---

## Phase 1 — CSS Token Rename

Rename all existing CSS custom properties to the new v1.1 naming convention. Update every file that references the old token names.

### Token Mapping

| New Token | Old Token | Light Value | Dark Value |
|---|---|---|---|
| `--c-prim` | `--color-primary` | #0E6BA8 | #3D8DC5 |
| `--c-prim-l` | `--color-primary-light` | #3D8DC5 | #4F90BF |
| `--c-prim-d` | *(new)* | #094D7A | #094D7A |
| `--c-accent` | `--color-accent` | #0891B2 | #06B6D4 |
| `--c-success` | `--color-success` | #2E8B57 | #34A368 |
| `--c-warn` | `--color-warning` | #E8961E | #F59E0B |
| `--c-err` | `--color-error` | #CF1322 | #F5222D |
| `--c-bg` | `--bg-layout` | #F9FAFB | #0D1421 |
| `--c-surf` | `--bg-card` | #FFFFFF | #162030 |
| `--c-border` | `--border-color` | #E5E7EB | #253447 |
| `--c-hover` | `--bg-hover` | #EFF6FF | rgba(79,144,191,.12) |
| `--c-txt` | `--text-primary` | #111827 | #E5EAF0 |
| `--c-txt-2` | `--text-secondary` | #6B7280 | #8899AA |
| `--r-sm` | `--radius-sm` | 4px | — |
| `--r` | `--radius` | 6px | — |
| `--r-lg` | `--radius-lg` | 8px | — |
| `--s-sm` | `--shadow-sm` | *(same value)* | — |
| `--s-md` | `--shadow-md` | *(same value)* | — |
| `--s-lg` | `--shadow-lg` | *(same value)* | — |
| `--sider` | *(new)* | #094D7A | #0A1628 |

### Files to Update

- `frontend/src/index.css` — define all new tokens, both light and `[data-theme="dark"]` variants
- `frontend/src/theme.ts` — update brand color references
- All `.tsx` and `.css` files under `frontend/src/` that use old token names (grep-based scan)

### Validation

Run `rtk tsc` after rename. Verify dark mode still works by toggling theme in browser.

---

## Phase 2 — New Components

### `useDropZone.ts`

**Location:** `frontend/src/hooks/useDropZone.ts`

State machine hook for drag-and-drop file selection.

**States:** `idle | over | file | busy | ok | fail`

**Transitions:**
```
idle  → over   : dragenter / dragover
over  → idle   : dragleave
over  → file   : drop (valid file)
idle  → file   : click + select file
file  → idle   : click ✕ (remove)
file  → busy   : upload called from parent
busy  → ok     : upload succeeded
busy  → fail   : upload failed
ok    → idle   : click "Upload lagi"
fail  → file   : click "Coba lagi"
```

**Props:** `accept: string`, `maxSize?: number` (default 20 MB)

**Returns:**
```ts
{
  state: DropZoneState;
  file: File | null;
  progress: number;          // 0–100, relevant only when state === 'busy'
  handlers: {
    onDragEnter: DragEventHandler;
    onDragLeave: DragEventHandler;
    onDragOver: DragEventHandler;
    onDrop: DragEventHandler;
    onFileChange: ChangeEventHandler<HTMLInputElement>;
    onRemove: () => void;
  };
  reset: () => void;
  setProgress: (n: number) => void;
  setFail: (msg: string) => void;
  setOk: () => void;
}
```

---

### `DropZone.tsx`

**Location:** `frontend/src/components/DropZone.tsx`  
**Styles:** `frontend/src/components/DropZone.css`

Pure presentational component — renders the correct visual for each state.

**Props:**
```ts
interface DropZoneProps {
  accept: string;
  state: DropZoneState;
  file: File | null;
  progress: number;
  onFile: (file: File) => void;
  onRemove: () => void;
  errorMsg?: string;
}
```

**Visual per state:**

| State | Border | Background | Content |
|---|---|---|---|
| idle | dashed `--c-border` | `--c-bg` | upload icon + teks instruksi |
| over | solid `--c-prim` | `--c-hover` | scale 1.003, highlight |
| file | solid 1.5px `--c-prim` | `--c-surf` | `<FileItem>` dengan nama + remove |
| busy | solid `--c-prim` | `--c-surf` | gradient progress bar, pointer-events none |
| ok | solid `--c-success` | #F0FDF4 | ikon centang + tombol "Upload lagi" |
| fail | solid `--c-err` | #FFF1F0 | pesan error + tombol "Coba lagi" |

---

### `FileItem.tsx`

**Location:** `frontend/src/components/FileItem.tsx`

Displays a selected file with extension badge, filename, and remove button.

**Props:** `file: File`, `onRemove: () => void`

Extension badge:
- `.xlsx` → badge hijau, label "XLSX"
- `.pdf` → badge merah, label "PDF"
- other → badge abu-abu, label uppercase extension

---

### `UploadSectionCard.tsx`

**Location:** `frontend/src/components/UploadSectionCard.tsx`

Accordion container for each upload section.

**Props:**
```ts
interface UploadSectionCardProps {
  number: number;           // circular number in header
  title: string;
  badge?: ReactNode;        // file type badge (e.g. "XLSX" or "PDF")
  statusChip?: ReactNode;   // upload status indicator
  defaultOpen?: boolean;
  children: ReactNode;
}
```

Header: circular number + title + badge + chevron toggle  
Body: collapsible, contains form fields + DropZone

---

## Phase 3 — UploadDataPage

**Location:** `frontend/src/pages/UploadDataPage.tsx`  
**Route:** `/admin/upload`  
**Role:** Admin Dinkes only

### Page Structure

```
Breadcrumb: Admin › Data Anggaran › Upload Data
Page Header: "Upload Data" (22px/800) + deskripsi singkat (max-width 600px)

StatusBar
  ├── Year selector: <Select> 2024–2026, stored as `tahun` state
  └── 3 status chips: Target ✓/✗, Angkas ✓/✗, LRA ✓/✗

UploadSectionCard #1 — Upload Target Anggaran [defaultOpen=true]
  Left (5fr): Form
    - catatan* (Textarea, required)
    - bulan_penetapan (Select bulan)
    - tanggal_penetapan (DatePicker)
  Right (7fr): DropZone accept=".xlsx"
  After upload: result chips — inserted / updated / skipped / failed

UploadSectionCard #2 — Upload Angkas PDF [defaultOpen=false]
  Left (5fr): Form
    - tahun (Input, read-only, dari StatusBar)
  Right (7fr): DropZone accept=".pdf" maxSize=20MB
  After upload: result summary + Alert warning jika ada unmatched puskesmas

UploadSectionCard #3 — Upload LRA [defaultOpen=false]
  DropZone accept=".xlsx"
  Preview panel (muncul setelah POST /lra/preview):
    - bulan/tahun terdeteksi dari filename
    - matchedCount / unmatchedPuskesmas / unmatchedSubKegiatan counts
    - Tombol: "Batalkan" | "Konfirmasi Upload"
  After confirm: rowCount result

RiwayatTable
  Kolom: Tanggal, Jenis (tag berwarna), Tahun, User, Status, Keterangan
  Source: merge /target/history + /angkas/history + /lra/batches, sort desc, max 10 rows
  Tag colors: LRA=#0E6BA8, Target=#7C3AED, Angkas=#D97706
```

### State Management

- `tahun`: shared at `UploadDataPage` level, passed as prop to each section
- Per-section state: managed locally with `useDropZone` hook + section-specific form state
- No Zustand — React hooks only

### Responsive

Grid `5fr / 7fr` collapses to single column at `<900px`.

### Validation

- Section Target: upload button disabled until `catatan` field is non-empty
- File type validation handled by `useDropZone` (accept prop + MIME check on drop)

### API Contracts

**Target Anggaran:**
- `POST /api/target/upload` — `FormData(file, catatan, bulan_penetapan, tanggal_penetapan)` → `{ success, inserted, updated, skipped, failed, errors[] }`

**Angkas:**
- `POST /api/angkas/upload` — `FormData(file, tahun)` → `{ result: { success, inserted, updated, skipped, failed, unmatchedPuskesmas[] } }`

**LRA:**
- `POST /api/lra/preview` — `FormData(file, bulan?, tahun?)` → `{ bulan, tahun, bulanDetectedFromFilename, matchedCount, unmatchedPuskesmas[], unmatchedSubKegiatan[] }`
- `POST /api/lra/confirm` — `FormData(file, bulan, tahun)` → `{ rowCount }`

**History:**
- `GET /api/target/history`
- `GET /api/angkas/history`
- `GET /api/lra/batches`

---

## Phase 4 — Cleanup

### navConfig.tsx

Replace two menu items with one:

```ts
// Remove:
{ key: '/admin/target-upload', label: 'Upload Target & Angkas', ... }
{ key: '/admin/lra-upload',    label: 'Upload LRA', ... }

// Add:
{ key: '/admin/upload', label: 'Upload Data', icon: UploadOutlined, roles: ['admin'] }
```

### App.tsx

Add redirect routes before the `/admin/upload` route:

```tsx
<Route path="/admin/target-upload" element={<Navigate replace to="/admin/upload" />} />
<Route path="/admin/lra-upload"    element={<Navigate replace to="/admin/upload" />} />
<Route path="/admin/upload"        element={<UploadDataPage />} />
```

### Files Deleted

- `frontend/src/pages/AdminTargetUploadPage.tsx`
- `frontend/src/pages/AdminLraUploadPage.tsx`

`AdminTargetEditPage.tsx` is **not** removed — it handles editing existing target entries, not uploading.

---

## Out of Scope

- Unmatched Angkas tab (`/admin/angkas-unmatched`) — remains in `AdminTargetEditPage` for now
- E2E tests — separate task
- Backend changes — all API contracts already exist

---

## Estimated Effort

| Phase | Effort |
|---|---|
| Phase 1: Token rename | ~2–3 hours |
| Phase 2: Components | ~3–4 hours |
| Phase 3: UploadDataPage | ~4–5 hours |
| Phase 4: Cleanup | ~1 hour |
| **Total** | **~1.5 days** |
