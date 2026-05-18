# Design System v1.1 + Unified Upload Page Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rename all CSS tokens to the v1.1 naming convention, build a reusable DropZone component system, and consolidate three separate upload pages into a single unified `/admin/upload` page.

**Architecture:** Top-down — token rename first (foundation), then reusable components, then the unified page that uses them, then nav cleanup and deletion of old pages. Each phase is independently testable and committable.

**Tech Stack:** React 18 + Vite 5 + Ant Design 5 + Zustand + TypeScript 5 + Vitest

**Spec:** `docs/superpowers/specs/2026-05-17-design-system-upload-unified-design.md`

---

## File Map

### Phase 1 — Token Rename
| File | Action |
|------|--------|
| `frontend/src/index.css` | Rename token definitions in `:root` and `[data-theme="dark"]` |
| `frontend/src/theme.ts` | Replace old token references |
| `frontend/src/components/Layout.tsx` | Replace old token references |
| `frontend/src/components/Layout.css` | Replace old token references |
| `frontend/src/components/ChatWidget.tsx` | Replace old token references |
| `frontend/src/components/ChatWidget.css` | Replace old token references |
| `frontend/src/components/LaporanInputCard.tsx` | Replace old token references |
| `frontend/src/components/LaporanGroupCard.tsx` | Replace old token references |
| `frontend/src/components/LaporanDetail.tsx` | Replace old token references |
| `frontend/src/components/LaporanBulkInput.css` | Replace old token references |
| `frontend/src/components/EvkinEmpty.css` | Replace old token references |
| `frontend/src/pages/AdminTargetUploadPage.tsx` | Replace old token references |
| `frontend/src/pages/AdminTargetEditPage.tsx` | Replace old token references |
| `frontend/src/pages/AdminLaporanPage.tsx` | Replace old token references |
| `frontend/src/pages/DashboardPage.tsx` | Replace old token references |
| `frontend/src/pages/LoginPage.tsx` | Replace old token references |
| `frontend/src/pages/PuskesmasDashboardPage.tsx` | Replace old token references |
| `frontend/src/pages/PuskesmasAngkasPage.tsx` | Replace old token references |
| `frontend/src/pages/PuskesmasTargetKinerjaPage.tsx` | Replace old token references |

### Phase 2 — New Components
| File | Action |
|------|--------|
| `frontend/src/hooks/useDropZone.ts` | Create |
| `frontend/src/hooks/useDropZone.test.ts` | Create |
| `frontend/src/components/DropZone.tsx` | Create (includes `FileItem` as named export) |
| `frontend/src/components/DropZone.css` | Create |
| `frontend/src/components/UploadSectionCard.tsx` | Create |
| `frontend/src/components/UploadSectionCard.css` | Create |

### Phase 3 — Unified Page
| File | Action |
|------|--------|
| `frontend/src/pages/UploadDataPage.tsx` | Create |

### Phase 4 — Cleanup
| File | Action |
|------|--------|
| `frontend/src/config/navConfig.tsx` | Replace 2 menu items with 1 |
| `frontend/src/App.tsx` | Add UploadDataPage route + 2 redirect routes, remove old lazy imports |
| `frontend/src/pages/AdminTargetUploadPage.tsx` | Delete |
| `frontend/src/pages/AdminLraUploadPage.tsx` | Delete |

---

## Token Rename Reference

| Old Name | New Name |
|---|---|
| `--color-primary-light` | `--c-prim-l` |
| `--color-primary-dark` | `--c-prim-d` |
| `--color-primary` | `--c-prim` |
| `--color-warning` | `--c-warn` |
| `--color-error` | `--c-err` |
| `--text-primary` | `--c-txt` |
| `--text-secondary` | `--c-txt-2` |
| `--text-tertiary` | `--c-txt-3` |
| `--border-color` | `--c-border` |
| `--border-light` | `--c-border-l` |
| `--bg-layout` | `--c-bg` |
| `--bg-card` | `--c-surf` |
| `--bg-subtle` | `--c-subtle` |
| `--radius-sm` | `--r-sm` |
| `--radius-lg` | `--r-lg` |
| `--radius` | `--r` |
| `--shadow-sm` | `--s-sm` |
| `--shadow-md` | `--s-md` |
| `--shadow-lg` | `--s-lg` |
| `--bg-hover` | `--c-hover` |

Tokens that do **not** change: `--color-accent`, `--color-success`, `--bg-selected`, `--bg-selected-hover`, `--bg-success-subtle`, `--bg-warning-subtle`, `--bg-error-subtle`, `--bg-info-subtle`, `--border-success`, `--border-info`, `--gradient-*`, `--shadow-action-bar`, `--transition*`, `--text-2xs` through `--text-xl`, `--separator*`, `--code-bg`, `--breakpoint-mobile`.

---

## Task 1: Update Token Definitions in index.css

**Files:**
- Modify: `frontend/src/index.css`

- [ ] **Step 1: Replace :root block color and surface tokens**

In `frontend/src/index.css`, replace the `:root` block (lines 4–84) with:

```css
:root {
  font-family: 'Plus Jakarta Sans', 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  line-height: 1.5714;
  font-weight: 400;

  color-scheme: light;

  font-synthesis: none;
  text-rendering: optimizeLegibility;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;

  /* ── Brand colors ─────────────────────────────────── */
  --c-prim:    #0E6BA8;
  --c-prim-l:  #3D8DC5;
  --c-prim-d:  #094D7A;
  --c-accent:  #0891B2;
  --c-success: #2E8B57;
  --c-warn:    #E8961E;
  --c-err:     #CF1322;
  --sider:     #094D7A;

  /* ── Text ─────────────────────────────────────────── */
  --c-txt:   #1F2937;
  --c-txt-2: #6B7280;
  --c-txt-3: #9CA3AF;

  /* ── Surfaces & borders ───────────────────────────── */
  --c-bg:       #F9FAFB;
  --c-surf:     #FFFFFF;
  --c-border:   #E5E7EB;
  --c-border-l: #F3F4F6;
  --c-hover:    #EFF6FF;

  /* ── Semantic surfaces ────────────────────────────── */
  --c-subtle:          #F8FAFC;
  --bg-selected:       #DBEAFE;
  --bg-selected-hover: #BFDBFE;
  --bg-success-subtle: #F0FDF4;
  --bg-warning-subtle: #FFF3CD;
  --bg-error-subtle:   #FFF1F0;
  --bg-info-subtle:    #EFF6FF;

  /* ── Semantic borders ─────────────────────────────── */
  --border-success:      #86EFAC;
  --border-success-dark: #BBF7D0;
  --border-info:         #BFDBFE;

  /* ── Progress gradients ───────────────────────────── */
  --gradient-success: linear-gradient(90deg, #34D399, var(--c-success));
  --gradient-warning: linear-gradient(90deg, #FBBF24, var(--c-warn));
  --gradient-error:   linear-gradient(90deg, #FCA5A5, var(--c-err));

  /* ── Shape ────────────────────────────────────────── */
  --r-sm: 4px;
  --r:    6px;
  --r-lg: 8px;

  /* ── Elevation ────────────────────────────────────── */
  --s-sm:  0 1px 2px rgba(0, 0, 0, 0.05);
  --s-md:  0 2px 8px rgba(0, 0, 0, 0.08);
  --s-lg:  0 4px 16px rgba(0, 0, 0, 0.10);
  --shadow-action-bar: 0 -2px 8px rgba(0, 0, 0, 0.05);

  /* ── Motion ───────────────────────────────────────── */
  --transition-fast: 0.15s cubic-bezier(0.4, 0, 0.2, 1);
  --transition:      0.25s cubic-bezier(0.4, 0, 0.2, 1);
  --transition-slow: 0.4s cubic-bezier(0.4, 0, 0.2, 1);

  /* ── Type scale ───────────────────────────────────── */
  --text-2xs: 10px;
  --text-xs:  11px;
  --text-sm:  12px;
  --text-base: 14px;
  --text-md:  16px;
  --text-lg:  20px;
  --text-xl:  24px;

  /* ── Misc ─────────────────────────────────────────── */
  --separator:        rgba(0, 0, 0, 0.04);
  --separator-dashed: rgba(0, 0, 0, 0.06);
  --code-bg:          #F1F5F9;
  --breakpoint-mobile: 768px;
}
```

- [ ] **Step 2: Replace [data-theme="dark"] block**

Replace the `[data-theme="dark"]` block (lines 87–131) with:

```css
[data-theme="dark"] {
  color-scheme: dark;

  --c-prim:    #3D8DC5;
  --c-prim-l:  #5BA3D9;
  --c-prim-d:  #0E6BA8;
  --c-accent:  #22D3EE;
  --c-success: #4ADE80;
  --c-warn:    #FBBF24;
  --c-err:     #FB7185;
  --sider:     #0A1628;

  --c-txt:   #E5E7EB;
  --c-txt-2: #9CA3AF;
  --c-txt-3: #6B7280;

  --c-bg:       #111827;
  --c-surf:     #1F2937;
  --c-border:   #374151;
  --c-border-l: #1F2937;
  --c-hover:    rgba(59, 130, 246, 0.1);

  --c-subtle:          #1a2332;
  --bg-selected:       rgba(59, 130, 246, 0.15);
  --bg-selected-hover: rgba(59, 130, 246, 0.2);
  --bg-success-subtle: rgba(74, 222, 128, 0.1);
  --bg-warning-subtle: rgba(251, 191, 36, 0.1);
  --bg-error-subtle:   rgba(251, 113, 133, 0.1);
  --bg-info-subtle:    rgba(59, 130, 246, 0.1);

  --border-success:      #166534;
  --border-success-dark: #14532D;
  --border-info:         #1E40AF;

  --gradient-success: linear-gradient(90deg, #22C55E, #16A34A);
  --gradient-warning: linear-gradient(90deg, #F59E0B, #D97706);
  --gradient-error:   linear-gradient(90deg, #F87171, #EF4444);

  --s-sm: 0 1px 2px rgba(0, 0, 0, 0.3);
  --s-md: 0 2px 8px rgba(0, 0, 0, 0.4);
  --s-lg: 0 4px 16px rgba(0, 0, 0, 0.5);
  --shadow-action-bar: 0 -2px 8px rgba(0, 0, 0, 0.3);

  --separator:        rgba(255, 255, 255, 0.06);
  --separator-dashed: rgba(255, 255, 255, 0.08);
  --code-bg:          #1E293B;
}
```

- [ ] **Step 3: Update the remaining usages inside index.css itself**

In the body below the theme blocks, replace old token references:

```css
/* Line ~149: */
background: var(--c-bg);
color: var(--c-txt);

/* Table zebra, line ~161: */
background-color: var(--c-surf);   /* odd rows */
background-color: var(--c-subtle); /* even rows */

/* Table hover, line ~168: */
background-color: var(--c-hover) !important;

/* Table selected, line ~173: */
background-color: var(--bg-selected) !important;

/* Legacy .table-row-light/.table-row-dark, line ~178: */
background-color: var(--c-surf);
background-color: var(--c-subtle);
```

- [ ] **Step 4: Commit**

```bash
rtk git add frontend/src/index.css
rtk git commit -m "feat(tokens): rename CSS custom properties to design system v1.1 names in index.css"
```

---

## Task 2: Bulk-rename Token References Across All Source Files

**Files:**
- Modify: all `.tsx`, `.ts`, `.css` files under `frontend/src/` (except `index.css` already done)

- [ ] **Step 1: Run PowerShell bulk-replace script**

Open PowerShell in the worktree root and run:

```powershell
$srcDir = "frontend\src"
$files = Get-ChildItem -Path $srcDir -Recurse -Include "*.tsx","*.ts","*.css" |
    Where-Object { $_.Name -ne "index.css" }

foreach ($f in $files) {
    $content = Get-Content $f.FullName -Raw -Encoding UTF8
    $updated = $content `
        -replace '--color-primary-light', '--c-prim-l' `
        -replace '--color-primary-dark',  '--c-prim-d' `
        -replace '--color-primary',       '--c-prim' `
        -replace '--color-warning',       '--c-warn' `
        -replace '--color-error',         '--c-err' `
        -replace '--text-primary',        '--c-txt' `
        -replace '--text-secondary',      '--c-txt-2' `
        -replace '--text-tertiary',       '--c-txt-3' `
        -replace '--border-color',        '--c-border' `
        -replace '--border-light',        '--c-border-l' `
        -replace '--bg-layout',           '--c-bg' `
        -replace '--bg-card',             '--c-surf' `
        -replace '--bg-subtle',           '--c-subtle' `
        -replace '--radius-sm',           '--r-sm' `
        -replace '--radius-lg',           '--r-lg' `
        -replace '--radius(?!-)',         '--r' `
        -replace '--shadow-sm',           '--s-sm' `
        -replace '--shadow-md',           '--s-md' `
        -replace '--shadow-lg',           '--s-lg'
    if ($updated -ne $content) {
        Set-Content $f.FullName $updated -Encoding UTF8 -NoNewline
        Write-Host "Updated: $($f.FullName)"
    }
}
Write-Host "Done."
```

- [ ] **Step 2: Verify no old token names remain**

```powershell
$patterns = @('--color-primary','--color-warning','--color-error','--text-primary','--text-secondary','--text-tertiary','--border-color','--border-light','--bg-layout','--bg-card','--bg-subtle','--radius-sm','--radius-lg','--shadow-sm','--shadow-md','--shadow-lg')
foreach ($p in $patterns) {
    $hits = Select-String -Path "frontend\src\**\*.tsx","frontend\src\**\*.ts","frontend\src\**\*.css" -Pattern $p -SimpleMatch
    if ($hits) { Write-Host "REMAINING: $p"; $hits | ForEach-Object { Write-Host "  $($_.Filename):$($_.LineNumber)" } }
}
```

Expected: no output. If any remain, fix them manually.

- [ ] **Step 3: Fix --radius standalone replacement edge case**

The regex `--radius(?!-)` may not handle all cases correctly. Verify:

```powershell
Select-String -Path "frontend\src\**\*.tsx","frontend\src\**\*.css" -Pattern '\-\-radius[^-]' -SimpleMatch
```

Any hit on `--radius` (not `--r-sm` or `--r-lg`) should now read `--r`. Fix manually if needed.

- [ ] **Step 4: Type-check**

```bash
cd frontend && rtk tsc --noEmit
```

Expected: 0 errors. Fix any type errors before continuing.

- [ ] **Step 5: Commit**

```bash
rtk git add frontend/src
rtk git commit -m "feat(tokens): apply design system v1.1 token names across all source files"
```

---

## Task 3: Update theme.ts Brand Color References

**Files:**
- Modify: `frontend/src/theme.ts`

Read `frontend/src/theme.ts` in full, then:

- [ ] **Step 1: Replace old token names inside theme.ts string literals**

In `theme.ts`, any `var(--color-primary)` style string references should now read `var(--c-prim)` etc. (The bulk script in Task 2 handles this, but verify manually since theme.ts has Ant Design token definitions that must stay as their Ant-specific names like `colorPrimary`, `colorSuccess` — do NOT rename those.)

Check: `colorPrimary`, `colorSuccess`, etc. in the Ant Design ThemeConfig are Ant token keys, not CSS var names — leave them untouched.

- [ ] **Step 2: Verify and commit if any changes needed**

```bash
rtk git add frontend/src/theme.ts
rtk git commit -m "fix(tokens): verify theme.ts after token rename"
```

If no changes needed, skip this commit.

---

## Task 4: useDropZone Hook (TDD)

**Files:**
- Create: `frontend/src/hooks/useDropZone.ts`
- Create: `frontend/src/hooks/useDropZone.test.ts`

- [ ] **Step 1: Write the failing tests**

Create `frontend/src/hooks/useDropZone.test.ts`:

```ts
import React from 'react';
import { renderHook, act } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { useDropZone } from './useDropZone';

const xlsxFile = () => new File([''], 'data.xlsx', {
  type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
});
const pdfFile = () => new File([''], 'doc.pdf', { type: 'application/pdf' });
const dragEvent = (files: File[] = []) => ({
  preventDefault: () => {},
  dataTransfer: { files },
} as unknown as React.DragEvent);

describe('useDropZone', () => {
  it('starts in idle state with no file', () => {
    const { result } = renderHook(() => useDropZone({ accept: '.xlsx' }));
    expect(result.current.state).toBe('idle');
    expect(result.current.file).toBeNull();
    expect(result.current.progress).toBe(0);
  });

  it('idle → over on dragenter', () => {
    const { result } = renderHook(() => useDropZone({ accept: '.xlsx' }));
    act(() => result.current.handlers.onDragEnter(dragEvent()));
    expect(result.current.state).toBe('over');
  });

  it('over → idle on dragleave', () => {
    const { result } = renderHook(() => useDropZone({ accept: '.xlsx' }));
    act(() => result.current.handlers.onDragEnter(dragEvent()));
    act(() => result.current.handlers.onDragLeave(dragEvent()));
    expect(result.current.state).toBe('idle');
  });

  it('over → file on valid drop', () => {
    const { result } = renderHook(() => useDropZone({ accept: '.xlsx' }));
    const f = xlsxFile();
    act(() => result.current.handlers.onDragEnter(dragEvent()));
    act(() => result.current.handlers.onDrop(dragEvent([f])));
    expect(result.current.state).toBe('file');
    expect(result.current.file).toBe(f);
  });

  it('drop with wrong extension → fail with error message', () => {
    const { result } = renderHook(() => useDropZone({ accept: '.xlsx' }));
    act(() => result.current.handlers.onDrop(dragEvent([pdfFile()])));
    expect(result.current.state).toBe('fail');
    expect(result.current.errorMsg).toContain('.xlsx');
  });

  it('file → idle on onRemove', () => {
    const { result } = renderHook(() => useDropZone({ accept: '.xlsx' }));
    act(() => result.current.handlers.onDrop(dragEvent([xlsxFile()])));
    act(() => result.current.handlers.onRemove());
    expect(result.current.state).toBe('idle');
    expect(result.current.file).toBeNull();
  });

  it('setOk transitions to ok', () => {
    const { result } = renderHook(() => useDropZone({ accept: '.xlsx' }));
    act(() => result.current.handlers.onDrop(dragEvent([xlsxFile()])));
    act(() => result.current.setOk());
    expect(result.current.state).toBe('ok');
  });

  it('setFail transitions to fail with message', () => {
    const { result } = renderHook(() => useDropZone({ accept: '.xlsx' }));
    act(() => result.current.setFail('Server timeout'));
    expect(result.current.state).toBe('fail');
    expect(result.current.errorMsg).toBe('Server timeout');
  });

  it('setProgress transitions to busy', () => {
    const { result } = renderHook(() => useDropZone({ accept: '.xlsx' }));
    act(() => result.current.handlers.onDrop(dragEvent([xlsxFile()])));
    act(() => result.current.setProgress(50));
    expect(result.current.state).toBe('busy');
    expect(result.current.progress).toBe(50);
  });

  it('reset returns to idle from any state', () => {
    const { result } = renderHook(() => useDropZone({ accept: '.xlsx' }));
    act(() => result.current.setOk());
    act(() => result.current.reset());
    expect(result.current.state).toBe('idle');
    expect(result.current.file).toBeNull();
    expect(result.current.progress).toBe(0);
  });

  it('drop with multiple accept types accepts matching', () => {
    const { result } = renderHook(() => useDropZone({ accept: '.xlsx,.pdf' }));
    act(() => result.current.handlers.onDrop(dragEvent([pdfFile()])));
    expect(result.current.state).toBe('file');
  });

  it('rejects file exceeding maxSize', () => {
    const { result } = renderHook(() => useDropZone({ accept: '.xlsx', maxSize: 100 }));
    const bigFile = new File([new ArrayBuffer(200)], 'big.xlsx');
    act(() => result.current.handlers.onDrop(dragEvent([bigFile])));
    expect(result.current.state).toBe('fail');
    expect(result.current.errorMsg).toContain('100');
  });
});
```

- [ ] **Step 2: Run tests — expect failures**

```bash
cd frontend && rtk vitest run src/hooks/useDropZone.test.ts
```

Expected: FAIL — `useDropZone` not found.

- [ ] **Step 3: Implement useDropZone**

Create `frontend/src/hooks/useDropZone.ts`:

```ts
import { useState, useCallback } from 'react';

export type DropZoneState = 'idle' | 'over' | 'file' | 'busy' | 'ok' | 'fail';

interface UseDropZoneOptions {
  accept: string;
  maxSize?: number;
}

export interface UseDropZoneReturn {
  state: DropZoneState;
  file: File | null;
  progress: number;
  errorMsg: string;
  handlers: {
    onDragEnter: (e: React.DragEvent) => void;
    onDragLeave: (e: React.DragEvent) => void;
    onDragOver: (e: React.DragEvent) => void;
    onDrop: (e: React.DragEvent) => void;
    onFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    onRemove: () => void;
  };
  reset: () => void;
  setProgress: (n: number) => void;
  setFail: (msg: string) => void;
  setOk: () => void;
}

export function useDropZone({ accept, maxSize = 20 * 1024 * 1024 }: UseDropZoneOptions): UseDropZoneReturn {
  const [state, setState] = useState<DropZoneState>('idle');
  const [file, setFile] = useState<File | null>(null);
  const [progress, setProgressState] = useState(0);
  const [errorMsg, setErrorMsg] = useState('');

  const acceptFile = useCallback((f: File) => {
    const ext = '.' + (f.name.split('.').pop() ?? '').toLowerCase();
    const accepted = accept.split(',').map(a => a.trim().toLowerCase());
    if (!accepted.includes(ext)) {
      setState('fail');
      setErrorMsg(`Format tidak didukung. Gunakan ${accept}`);
      return;
    }
    if (f.size > maxSize) {
      setState('fail');
      setErrorMsg(`Ukuran file melebihi ${Math.round(maxSize / 1024)} KB`);
      return;
    }
    setFile(f);
    setState('file');
    setErrorMsg('');
    setProgressState(0);
  }, [accept, maxSize]);

  const handlers = {
    onDragEnter: useCallback((e: React.DragEvent) => {
      e.preventDefault();
      setState(s => s === 'idle' ? 'over' : s);
    }, []),

    onDragLeave: useCallback((e: React.DragEvent) => {
      e.preventDefault();
      setState(s => s === 'over' ? 'idle' : s);
    }, []),

    onDragOver: useCallback((e: React.DragEvent) => {
      e.preventDefault();
    }, []),

    onDrop: useCallback((e: React.DragEvent) => {
      e.preventDefault();
      const f = e.dataTransfer?.files?.[0];
      if (f) acceptFile(f);
    }, [acceptFile]),

    onFileChange: useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
      const f = e.target.files?.[0];
      if (f) acceptFile(f);
      e.target.value = '';
    }, [acceptFile]),

    onRemove: useCallback(() => {
      setFile(null);
      setState('idle');
      setErrorMsg('');
      setProgressState(0);
    }, []),
  };

  const reset = useCallback(() => {
    setFile(null);
    setState('idle');
    setErrorMsg('');
    setProgressState(0);
  }, []);

  const setProgress = useCallback((n: number) => {
    setState('busy');
    setProgressState(n);
  }, []);

  const setFail = useCallback((msg: string) => {
    setState('fail');
    setErrorMsg(msg);
  }, []);

  const setOk = useCallback(() => {
    setState('ok');
  }, []);

  return { state, file, progress, errorMsg, handlers, reset, setProgress, setFail, setOk };
}
```

- [ ] **Step 4: Run tests — expect all pass**

```bash
cd frontend && rtk vitest run src/hooks/useDropZone.test.ts
```

Expected: 12 tests pass.

- [ ] **Step 5: Commit**

```bash
rtk git add frontend/src/hooks/useDropZone.ts frontend/src/hooks/useDropZone.test.ts
rtk git commit -m "feat(hooks): add useDropZone state machine hook with tests"
```

---

## Task 5: DropZone Component

**Files:**
- Create: `frontend/src/components/DropZone.tsx`
- Create: `frontend/src/components/DropZone.css`

- [ ] **Step 1: Create DropZone.css**

Create `frontend/src/components/DropZone.css`:

```css
.dz {
  border: 2px dashed var(--c-border);
  background: var(--c-bg);
  border-radius: var(--r-lg);
  min-height: 160px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-direction: column;
  gap: 8px;
  cursor: pointer;
  transition: all var(--transition-fast);
  position: relative;
  padding: 24px 16px;
  text-align: center;
}

.dz:focus-visible {
  outline: 2px solid var(--c-prim);
  outline-offset: 2px;
}

.dz--over {
  border-style: solid;
  border-color: var(--c-prim);
  background: var(--c-hover);
  transform: scale(1.003);
}

.dz--file {
  border-style: solid;
  border-width: 1.5px;
  border-color: var(--c-prim);
  background: var(--c-surf);
  cursor: default;
  align-items: flex-start;
}

.dz--busy {
  border-style: solid;
  border-color: var(--c-prim);
  background: var(--c-surf);
  pointer-events: none;
  cursor: not-allowed;
}

.dz--ok {
  border-style: solid;
  border-color: var(--c-success);
  background: #F0FDF4;
  cursor: default;
}

[data-theme="dark"] .dz--ok {
  background: rgba(74, 222, 128, 0.08);
}

.dz--fail {
  border-style: solid;
  border-color: var(--c-err);
  background: #FFF1F0;
  cursor: default;
}

[data-theme="dark"] .dz--fail {
  background: rgba(251, 113, 133, 0.08);
}

/* Progress bar */
.dz__progress {
  position: absolute;
  bottom: 0;
  left: 0;
  height: 4px;
  border-radius: 0 0 0 var(--r-lg);
  background: var(--gradient-success);
  transition: width 0.3s ease;
}

/* Hidden file input */
.dz__input {
  display: none;
}

/* Idle content */
.dz__icon {
  font-size: 28px;
  color: var(--c-txt-3);
}

.dz__hint {
  font-size: var(--text-sm);
  color: var(--c-txt-2);
}

.dz__hint strong {
  color: var(--c-prim);
}

/* Ok / fail messages */
.dz__ok-msg {
  color: var(--c-success);
  font-size: var(--text-sm);
  font-weight: 600;
}

.dz__fail-msg {
  color: var(--c-err);
  font-size: var(--text-sm);
  font-weight: 500;
}

.dz__retry {
  margin-top: 8px;
  font-size: var(--text-sm);
  color: var(--c-prim);
  background: none;
  border: none;
  cursor: pointer;
  text-decoration: underline;
  padding: 0;
}

/* File item inside drop zone */
.fi {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 12px;
  background: var(--c-surf);
  border-radius: var(--r);
  width: 100%;
}

.fi-ico {
  font-size: 11px;
  font-weight: 700;
  padding: 3px 6px;
  border-radius: var(--r-sm);
  letter-spacing: 0.5px;
  white-space: nowrap;
}

.fi-ico--xlsx {
  background: #D1FAE5;
  color: #065F46;
}

.fi-ico--pdf {
  background: #FEE2E2;
  color: #991B1B;
}

.fi-ico--other {
  background: var(--c-border);
  color: var(--c-txt-2);
}

[data-theme="dark"] .fi-ico--xlsx {
  background: rgba(74, 222, 128, 0.15);
  color: #4ADE80;
}

[data-theme="dark"] .fi-ico--pdf {
  background: rgba(251, 113, 133, 0.15);
  color: #FB7185;
}

.fi-name {
  flex: 1;
  font-size: var(--text-base);
  color: var(--c-txt);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.fi-rm {
  background: none;
  border: none;
  cursor: pointer;
  color: var(--c-txt-2);
  padding: 2px 6px;
  border-radius: var(--r-sm);
  font-size: 16px;
  line-height: 1;
  transition: all var(--transition-fast);
}

.fi-rm:hover {
  background: var(--c-hover);
  color: var(--c-err);
}
```

- [ ] **Step 2: Create DropZone.tsx**

Create `frontend/src/components/DropZone.tsx`:

```tsx
import React, { useId } from 'react';
import type { DropZoneState, UseDropZoneReturn } from '../hooks/useDropZone';
import './DropZone.css';

interface DropZoneProps {
  accept: string;
  state: DropZoneState;
  file: File | null;
  progress: number;
  errorMsg?: string;
  handlers: UseDropZoneReturn['handlers'];
  onRetry?: () => void;
  onUploadAgain?: () => void;
}

function getExtBadge(filename: string) {
  const ext = filename.split('.').pop()?.toLowerCase() ?? '';
  if (ext === 'xlsx') return { cls: 'fi-ico--xlsx', label: 'XLSX' };
  if (ext === 'pdf')  return { cls: 'fi-ico--pdf',  label: 'PDF'  };
  return { cls: 'fi-ico--other', label: ext.toUpperCase() };
}

export const DropZone: React.FC<DropZoneProps> = ({
  accept, state, file, progress, errorMsg,
  handlers, onRetry, onUploadAgain,
}) => {
  const inputId = useId();

  const modClass = {
    idle:  '',
    over:  'dz--over',
    file:  'dz--file',
    busy:  'dz--busy',
    ok:    'dz--ok',
    fail:  'dz--fail',
  }[state];

  return (
    <div
      className={`dz ${modClass}`}
      onDragEnter={handlers.onDragEnter}
      onDragLeave={handlers.onDragLeave}
      onDragOver={handlers.onDragOver}
      onDrop={handlers.onDrop}
      onClick={state === 'idle' || state === 'over' ? () => document.getElementById(inputId)?.click() : undefined}
      role={state === 'idle' || state === 'over' ? 'button' : undefined}
      tabIndex={state === 'idle' ? 0 : undefined}
      onKeyDown={e => { if ((e.key === 'Enter' || e.key === ' ') && (state === 'idle' || state === 'over')) document.getElementById(inputId)?.click(); }}
    >
      <input
        id={inputId}
        className="dz__input"
        type="file"
        accept={accept}
        onChange={handlers.onFileChange}
      />

      {(state === 'idle' || state === 'over') && (
        <>
          <span className="dz__icon">📂</span>
          <span className="dz__hint">
            <strong>Klik atau seret file</strong> ke sini
          </span>
          <span className="dz__hint">{accept.replace(/,/g, ' / ')}</span>
        </>
      )}

      {state === 'file' && file && (
        <FileItem file={file} onRemove={handlers.onRemove} />
      )}

      {state === 'busy' && file && (
        <>
          <FileItem file={file} onRemove={() => {}} showRemove={false} />
          <div
            className="dz__progress"
            style={{ width: `${progress}%` }}
            role="progressbar"
            aria-valuenow={progress}
            aria-valuemin={0}
            aria-valuemax={100}
          />
        </>
      )}

      {state === 'ok' && (
        <>
          <span className="dz__ok-msg">✓ Upload berhasil</span>
          {onUploadAgain && (
            <button className="dz__retry" onClick={onUploadAgain}>Upload file lain</button>
          )}
        </>
      )}

      {state === 'fail' && (
        <>
          <span className="dz__fail-msg">{errorMsg || 'Upload gagal'}</span>
          {onRetry && (
            <button className="dz__retry" onClick={onRetry}>Coba lagi</button>
          )}
        </>
      )}
    </div>
  );
};

interface FileItemProps {
  file: File;
  onRemove: () => void;
  showRemove?: boolean;
}

export const FileItem: React.FC<FileItemProps> = ({ file, onRemove, showRemove = true }) => {
  const badge = getExtBadge(file.name);
  return (
    <div className="fi">
      <span className={`fi-ico ${badge.cls}`}>{badge.label}</span>
      <span className="fi-name" title={file.name}>{file.name}</span>
      {showRemove && (
        <button
          className="fi-rm"
          onClick={e => { e.stopPropagation(); onRemove(); }}
          aria-label="Hapus file"
        >
          ✕
        </button>
      )}
    </div>
  );
};
```

- [ ] **Step 3: Verify TypeScript**

```bash
cd frontend && rtk tsc --noEmit
```

Expected: 0 errors.

- [ ] **Step 4: Commit**

```bash
rtk git add frontend/src/components/DropZone.tsx frontend/src/components/DropZone.css
rtk git commit -m "feat(components): add DropZone component with 6 states + FileItem"
```

---

## Task 6: UploadSectionCard Component

**Files:**
- Create: `frontend/src/components/UploadSectionCard.tsx`
- Create: `frontend/src/components/UploadSectionCard.css`

- [ ] **Step 1: Create UploadSectionCard.css**

Create `frontend/src/components/UploadSectionCard.css`:

```css
.uc {
  border: 1px solid var(--c-border);
  border-radius: var(--r-lg);
  background: var(--c-surf);
  box-shadow: var(--s-sm);
  overflow: hidden;
  margin-bottom: 16px;
}

.uc-hd {
  width: 100%;
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px 20px;
  background: none;
  border: none;
  cursor: pointer;
  text-align: left;
  transition: background var(--transition-fast);
}

.uc-hd:hover {
  background: var(--c-hover);
}

.uc-num {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 26px;
  height: 26px;
  border-radius: 50%;
  background: var(--c-prim);
  color: #fff;
  font-size: var(--text-sm);
  font-weight: 700;
  flex-shrink: 0;
}

.uc-title {
  font-size: var(--text-base);
  font-weight: 600;
  color: var(--c-txt);
  flex: 1;
}

.uc-chevron {
  font-size: 18px;
  color: var(--c-txt-2);
  transition: transform var(--transition-fast);
  display: inline-block;
}

.uc-chevron--open {
  transform: rotate(180deg);
}

.uc-body {
  padding: 20px;
  border-top: 1px solid var(--c-border);
}

/* Two-column grid: form left, dropzone right */
.uc-grid {
  display: grid;
  grid-template-columns: 5fr 7fr;
  gap: 20px;
  align-items: start;
}

@media (max-width: 900px) {
  .uc-grid {
    grid-template-columns: 1fr;
  }
}

.uc-result {
  margin-top: 16px;
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}
```

- [ ] **Step 2: Create UploadSectionCard.tsx**

Create `frontend/src/components/UploadSectionCard.tsx`:

```tsx
import React, { useState } from 'react';
import './UploadSectionCard.css';

interface UploadSectionCardProps {
  number: number;
  title: string;
  badge?: React.ReactNode;
  statusChip?: React.ReactNode;
  defaultOpen?: boolean;
  children: React.ReactNode;
}

export const UploadSectionCard: React.FC<UploadSectionCardProps> = ({
  number, title, badge, statusChip, defaultOpen = false, children,
}) => {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className="uc">
      <button className="uc-hd" onClick={() => setOpen(o => !o)} aria-expanded={open}>
        <span className="uc-num">{number}</span>
        <span className="uc-title">{title}</span>
        {badge}
        {statusChip}
        <span className={`uc-chevron${open ? ' uc-chevron--open' : ''}`}>▾</span>
      </button>
      {open && <div className="uc-body">{children}</div>}
    </div>
  );
};
```

- [ ] **Step 3: Verify TypeScript**

```bash
cd frontend && rtk tsc --noEmit
```

Expected: 0 errors.

- [ ] **Step 4: Commit**

```bash
rtk git add frontend/src/components/UploadSectionCard.tsx frontend/src/components/UploadSectionCard.css
rtk git commit -m "feat(components): add UploadSectionCard accordion component"
```

---

## Task 7: UploadDataPage — Skeleton, StatusBar, UploadTarget

**Files:**
- Create: `frontend/src/pages/UploadDataPage.tsx`

- [ ] **Step 1: Create the page with StatusBar and UploadTarget section**

Create `frontend/src/pages/UploadDataPage.tsx`:

```tsx
import React, { useState, useCallback, useEffect } from 'react';
import {
  Select, Tag, Alert, Button, Form, Input, DatePicker, message, Table,
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { CheckCircleOutlined, CloseCircleOutlined, MinusCircleOutlined } from '@ant-design/icons';
import axios from 'axios';
import dayjs from 'dayjs';
import API_BASE_URL from '../config/api';
import { useAuthStore } from '../store/authStore';
import { UploadSectionCard } from '../components/UploadSectionCard';
import { DropZone } from '../components/DropZone';
import { useDropZone } from '../hooks/useDropZone';

// ── Types ───────────────────────────────────────────────────────────
interface HistoryRow {
  id: string;
  type: 'LRA' | 'Target' | 'Angkas';
  tahun: number;
  tanggal: string;
  user: string;
  status: string;
  keterangan: string;
}

interface TargetUploadResult {
  inserted: number;
  updated: number;
  skipped: number;
  failed: number;
  errors?: string[];
}

interface AngkasUploadResult {
  inserted: number;
  updated: number;
  skipped: number;
  unmatchedPuskesmas?: string[];
}

interface LraPreviewResult {
  bulan: string;
  tahun: number;
  bulanDetectedFromFilename: boolean;
  matchedCount: number;
  unmatchedPuskesmas: string[];
  unmatchedSubKegiatan: string[];
}

// ── Constants ───────────────────────────────────────────────────────
const TAHUN_OPTIONS = [2024, 2025, 2026].map(y => ({ value: y, label: String(y) }));
const BULAN_OPTIONS = [
  'Januari','Februari','Maret','April','Mei','Juni',
  'Juli','Agustus','September','Oktober','November','Desember',
].map((b, i) => ({ value: String(i + 1), label: b }));

const TYPE_COLORS: Record<string, string> = {
  LRA: '#0E6BA8',
  Target: '#7C3AED',
  Angkas: '#D97706',
};

// ── Sub-components ──────────────────────────────────────────────────

const ResultChip: React.FC<{ label: string; count: number; color: string }> = ({ label, count, color }) => (
  <Tag color={color}>{label}: {count}</Tag>
);

// ── UploadTarget Section ─────────────────────────────────────────────

const UploadTarget: React.FC<{ tahun: number; onSuccess: () => void }> = ({ tahun, onSuccess }) => {
  const token = useAuthStore(s => s.token);
  const dz = useDropZone({ accept: '.xlsx' });
  const [catatan, setCatatan] = useState('');
  const [bulanPenetapan, setBulanPenetapan] = useState<string | undefined>();
  const [tanggalPenetapan, setTanggalPenetapan] = useState<string | undefined>();
  const [result, setResult] = useState<TargetUploadResult | null>(null);

  const canUpload = !!dz.file && catatan.trim().length > 0;

  const handleUpload = async () => {
    if (!dz.file) return;
    const fd = new FormData();
    fd.append('file', dz.file);
    fd.append('catatan', catatan.trim());
    fd.append('tahun', String(tahun));
    if (bulanPenetapan) fd.append('bulan_penetapan', bulanPenetapan);
    if (tanggalPenetapan) fd.append('tanggal_penetapan', tanggalPenetapan);

    dz.setProgress(10);
    try {
      dz.setProgress(50);
      const res = await axios.post(`${API_BASE_URL}/target/upload`, fd, {
        headers: { Authorization: `Bearer ${token}` },
        onUploadProgress: e => {
          if (e.total) dz.setProgress(Math.round((e.loaded / e.total) * 80));
        },
      });
      dz.setProgress(100);
      dz.setOk();
      setResult(res.data);
      onSuccess();
    } catch (e: any) {
      dz.setFail(e.response?.data?.error || 'Upload gagal');
    }
  };

  return (
    <div className="uc-grid">
      <div>
        <Form layout="vertical" size="small">
          <Form.Item label="Catatan" required>
            <Input.TextArea
              rows={3}
              value={catatan}
              onChange={e => setCatatan(e.target.value)}
              placeholder="Catatan penetapan target anggaran..."
            />
          </Form.Item>
          <Form.Item label="Bulan Penetapan">
            <Select
              options={BULAN_OPTIONS}
              value={bulanPenetapan}
              onChange={setBulanPenetapan}
              placeholder="Pilih bulan"
              allowClear
              style={{ width: '100%' }}
            />
          </Form.Item>
          <Form.Item label="Tanggal Penetapan">
            <DatePicker
              style={{ width: '100%' }}
              onChange={(_, s) => setTanggalPenetapan(s as string || undefined)}
            />
          </Form.Item>
          <Button
            type="primary"
            block
            disabled={!canUpload}
            loading={dz.state === 'busy'}
            onClick={handleUpload}
          >
            Upload Target
          </Button>
        </Form>
      </div>
      <div>
        <DropZone
          accept=".xlsx"
          state={dz.state}
          file={dz.file}
          progress={dz.progress}
          errorMsg={dz.errorMsg}
          handlers={dz.handlers}
          onRetry={dz.reset}
          onUploadAgain={() => { dz.reset(); setResult(null); }}
        />
        {result && (
          <div className="uc-result">
            <ResultChip label="Ditambah" count={result.inserted} color="success" />
            <ResultChip label="Diperbarui" count={result.updated} color="processing" />
            <ResultChip label="Dilewati" count={result.skipped} color="default" />
            {result.failed > 0 && <ResultChip label="Gagal" count={result.failed} color="error" />}
          </div>
        )}
      </div>
    </div>
  );
};

// ── UploadAngkas Section ─────────────────────────────────────────────

const UploadAngkas: React.FC<{ tahun: number; onSuccess: () => void }> = ({ tahun, onSuccess }) => {
  const token = useAuthStore(s => s.token);
  const dz = useDropZone({ accept: '.pdf', maxSize: 20 * 1024 * 1024 });
  const [result, setResult] = useState<AngkasUploadResult | null>(null);

  const handleUpload = async () => {
    if (!dz.file) return;
    const fd = new FormData();
    fd.append('file', dz.file);
    fd.append('tahun', String(tahun));

    dz.setProgress(10);
    try {
      const res = await axios.post(`${API_BASE_URL}/angkas/upload`, fd, {
        headers: { Authorization: `Bearer ${token}` },
        onUploadProgress: e => {
          if (e.total) dz.setProgress(Math.round((e.loaded / e.total) * 80));
        },
      });
      dz.setProgress(100);
      dz.setOk();
      setResult(res.data.result);
      onSuccess();
    } catch (e: any) {
      dz.setFail(e.response?.data?.error || 'Upload gagal');
    }
  };

  return (
    <div className="uc-grid">
      <div>
        <Form layout="vertical" size="small">
          <Form.Item label="Tahun Anggaran">
            <Input value={tahun} readOnly />
          </Form.Item>
          <Button
            type="primary"
            block
            disabled={!dz.file}
            loading={dz.state === 'busy'}
            onClick={handleUpload}
          >
            Upload Angkas PDF
          </Button>
        </Form>
        {result?.unmatchedPuskesmas && result.unmatchedPuskesmas.length > 0 && (
          <Alert
            type="warning"
            style={{ marginTop: 12 }}
            message={`${result.unmatchedPuskesmas.length} puskesmas tidak dikenali`}
            description={result.unmatchedPuskesmas.join(', ')}
            showIcon
          />
        )}
      </div>
      <div>
        <DropZone
          accept=".pdf"
          state={dz.state}
          file={dz.file}
          progress={dz.progress}
          errorMsg={dz.errorMsg}
          handlers={dz.handlers}
          onRetry={dz.reset}
          onUploadAgain={() => { dz.reset(); setResult(null); }}
        />
        {result && (
          <div className="uc-result">
            <ResultChip label="Ditambah" count={result.inserted} color="success" />
            <ResultChip label="Diperbarui" count={result.updated} color="processing" />
            <ResultChip label="Dilewati" count={result.skipped} color="default" />
          </div>
        )}
      </div>
    </div>
  );
};

// ── UploadLRA Section ────────────────────────────────────────────────

const UploadLRA: React.FC<{ tahun: number; onSuccess: () => void }> = ({ tahun, onSuccess }) => {
  const token = useAuthStore(s => s.token);
  const dz = useDropZone({ accept: '.xlsx' });
  const [preview, setPreview] = useState<LraPreviewResult | null>(null);
  const [previewing, setPreviewing] = useState(false);
  const [confirming, setConfirming] = useState(false);

  const authConfig = { headers: { Authorization: `Bearer ${token}` } };

  const handlePreview = async () => {
    if (!dz.file) return;
    const fd = new FormData();
    fd.append('file', dz.file);
    fd.append('tahun', String(tahun));
    setPreviewing(true);
    setPreview(null);
    try {
      const res = await axios.post(`${API_BASE_URL}/lra/preview`, fd, authConfig);
      setPreview(res.data);
    } catch (e: any) {
      dz.setFail(e.response?.data?.error || 'Gagal preview');
    } finally {
      setPreviewing(false);
    }
  };

  const handleConfirm = async () => {
    if (!dz.file || !preview) return;
    const fd = new FormData();
    fd.append('file', dz.file);
    fd.append('bulan', preview.bulan);
    fd.append('tahun', String(preview.tahun));
    setConfirming(true);
    try {
      const res = await axios.post(`${API_BASE_URL}/lra/confirm`, fd, authConfig);
      message.success(`Berhasil menyimpan ${res.data.rowCount} baris data LRA`);
      dz.setOk();
      setPreview(null);
      onSuccess();
    } catch (e: any) {
      dz.setFail(e.response?.data?.error || 'Gagal konfirmasi');
    } finally {
      setConfirming(false);
    }
  };

  return (
    <div>
      <DropZone
        accept=".xlsx"
        state={dz.state}
        file={dz.file}
        progress={dz.progress}
        errorMsg={dz.errorMsg}
        handlers={dz.handlers}
        onRetry={dz.reset}
        onUploadAgain={() => { dz.reset(); setPreview(null); }}
      />
      {dz.file && dz.state === 'file' && !preview && (
        <Button
          type="default"
          style={{ marginTop: 12 }}
          loading={previewing}
          onClick={handlePreview}
        >
          Preview Data
        </Button>
      )}
      {preview && (
        <div style={{ marginTop: 16 }}>
          <Alert
            type="info"
            message={`Bulan: ${preview.bulan} ${preview.tahun}${preview.bulanDetectedFromFilename ? ' (terdeteksi dari nama file)' : ''}`}
            description={`${preview.matchedCount} baris berhasil dicocokkan`}
            showIcon
            style={{ marginBottom: 8 }}
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
          <div style={{ marginTop: 12, display: 'flex', gap: 8 }}>
            <Button type="primary" loading={confirming} onClick={handleConfirm}>
              Konfirmasi Upload
            </Button>
            <Button onClick={() => setPreview(null)}>Batalkan</Button>
          </div>
        </div>
      )}
    </div>
  );
};

// ── RiwayatTable ─────────────────────────────────────────────────────

const historyColumns: ColumnsType<HistoryRow> = [
  {
    title: 'Tanggal',
    dataIndex: 'tanggal',
    width: 160,
    render: v => new Date(v).toLocaleString('id-ID'),
  },
  {
    title: 'Jenis',
    dataIndex: 'type',
    width: 90,
    render: (t: string) => <Tag color={TYPE_COLORS[t]}>{t}</Tag>,
  },
  { title: 'Tahun', dataIndex: 'tahun', width: 70 },
  { title: 'User', dataIndex: 'user', ellipsis: true },
  { title: 'Keterangan', dataIndex: 'keterangan', ellipsis: true },
];

// ── Main Page ────────────────────────────────────────────────────────

const UploadDataPage: React.FC = () => {
  const token = useAuthStore(s => s.token);
  const [tahun, setTahun] = useState(new Date().getFullYear());
  const [history, setHistory] = useState<HistoryRow[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  const authConfig = { headers: { Authorization: `Bearer ${token}` } };

  const loadHistory = useCallback(async () => {
    setLoadingHistory(true);
    try {
      const [lraRes, batchRes] = await Promise.allSettled([
        axios.get(`${API_BASE_URL}/lra/batches`, authConfig),
        axios.get(`${API_BASE_URL}/target/admin`, { ...authConfig, params: { tahun } }),
      ]);

      const rows: HistoryRow[] = [];

      if (lraRes.status === 'fulfilled') {
        lraRes.value.data.slice(0, 10).forEach((b: any) => {
          rows.push({
            id: `lra-${b.id}`,
            type: 'LRA',
            tahun: b.tahun,
            tanggal: b.created_at,
            user: b.uploader?.nama ?? '-',
            status: 'sukses',
            keterangan: `${b.row_count} baris — ${b.bulan}`,
          });
        });
      }

      rows.sort((a, b) => new Date(b.tanggal).getTime() - new Date(a.tanggal).getTime());
      setHistory(rows.slice(0, 10));
    } catch {
      // ignore
    } finally {
      setLoadingHistory(false);
    }
  }, [token, tahun]);

  useEffect(() => { loadHistory(); }, [loadHistory]);

  return (
    <div style={{ maxWidth: 1080, margin: '0 auto', padding: '24px 16px' }}>
      {/* Header */}
      <div style={{ marginBottom: 8 }}>
        <h1 style={{ fontSize: 22, fontWeight: 800, color: 'var(--c-txt)', margin: 0 }}>
          Upload Data
        </h1>
        <p style={{ color: 'var(--c-txt-2)', marginTop: 4, maxWidth: 600 }}>
          Upload file Target Anggaran, Angkas, dan LRA. Klik section untuk membuka form upload.
        </p>
      </div>

      {/* Status bar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 24, flexWrap: 'wrap' }}>
        <Select
          options={TAHUN_OPTIONS}
          value={tahun}
          onChange={setTahun}
          style={{ width: 100 }}
        />
      </div>

      {/* Sections */}
      <UploadSectionCard number={1} title="Upload Target Anggaran" defaultOpen={true}
        badge={<Tag color="purple" style={{ marginLeft: 4 }}>XLSX</Tag>}
      >
        <UploadTarget tahun={tahun} onSuccess={loadHistory} />
      </UploadSectionCard>

      <UploadSectionCard number={2} title="Upload Angkas PDF"
        badge={<Tag color="orange" style={{ marginLeft: 4 }}>PDF</Tag>}
      >
        <UploadAngkas tahun={tahun} onSuccess={loadHistory} />
      </UploadSectionCard>

      <UploadSectionCard number={3} title="Upload LRA"
        badge={<Tag color="blue" style={{ marginLeft: 4 }}>XLSX</Tag>}
      >
        <UploadLRA tahun={tahun} onSuccess={loadHistory} />
      </UploadSectionCard>

      {/* History */}
      <div style={{ marginTop: 32 }}>
        <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 12 }}>Riwayat Upload</h2>
        <Table<HistoryRow>
          dataSource={history}
          columns={historyColumns}
          rowKey="id"
          loading={loadingHistory}
          size="small"
          pagination={false}
        />
      </div>
    </div>
  );
};

export default UploadDataPage;
```

- [ ] **Step 2: Type-check**

```bash
cd frontend && rtk tsc --noEmit
```

Expected: 0 errors. Fix any type errors.

- [ ] **Step 3: Commit**

```bash
rtk git add frontend/src/pages/UploadDataPage.tsx
rtk git commit -m "feat(pages): add unified UploadDataPage with Target, Angkas, LRA sections"
```

---

## Task 8: Nav Cleanup + App.tsx Routing

**Files:**
- Modify: `frontend/src/config/navConfig.tsx`
- Modify: `frontend/src/App.tsx`

- [ ] **Step 1: Update navConfig.tsx**

In `frontend/src/config/navConfig.tsx`, replace lines 75–92:

```tsx
    // OLD (remove these two):
    {
        key: '/admin/target-upload',
        icon: <UploadOutlined />,
        label: 'Upload Target & Angkas',
        roles: ['admin'],
    },
    {
        key: '/admin/target-edit',
        icon: <EditOutlined />,
        label: 'Edit Target & Angkas',
        roles: ['admin'],
    },
    {
        key: '/admin/lra-upload',
        icon: <UploadOutlined />,
        label: 'Upload LRA',
        roles: ['admin'],
    },
```

Replace with:

```tsx
    {
        key: '/admin/upload',
        icon: <UploadOutlined />,
        label: 'Upload Data',
        roles: ['admin'],
    },
    {
        key: '/admin/target-edit',
        icon: <EditOutlined />,
        label: 'Edit Target & Angkas',
        roles: ['admin'],
    },
```

- [ ] **Step 2: Update App.tsx — add UploadDataPage + redirects, remove old imports**

In `frontend/src/App.tsx`:

Replace lines 24–26:
```tsx
const AdminTargetUploadPage = lazy(() => import('./pages/AdminTargetUploadPage'));
const AdminTargetEditPage = lazy(() => import('./pages/AdminTargetEditPage'));
const AdminLraUploadPage = lazy(() => import('./pages/AdminLraUploadPage'));
```

With:
```tsx
const AdminTargetEditPage = lazy(() => import('./pages/AdminTargetEditPage'));
const UploadDataPage = lazy(() => import('./pages/UploadDataPage'));
```

Replace lines 174–198 (the two old upload routes):
```tsx
        {/* NEW: Consolidated Target & Angkas pages */}
        <Route
          path="/admin/target-upload"
          element={
            <AdminRoute>
              <PageWrapper component={AdminTargetUploadPage} />
            </AdminRoute>
          }
        />
        <Route
          path="/admin/target-edit"
          element={
            <AdminRoute>
              <PageWrapper component={AdminTargetEditPage} />
            </AdminRoute>
          }
        />
        <Route
          path="/admin/lra-upload"
          element={
            <AdminRoute>
              <PageWrapper component={AdminLraUploadPage} />
            </AdminRoute>
          }
        />
```

With:
```tsx
        {/* Redirects for old upload routes */}
        <Route path="/admin/target-upload" element={<Navigate replace to="/admin/upload" />} />
        <Route path="/admin/lra-upload"    element={<Navigate replace to="/admin/upload" />} />

        {/* Unified upload page */}
        <Route
          path="/admin/upload"
          element={
            <AdminRoute>
              <PageWrapper component={UploadDataPage} />
            </AdminRoute>
          }
        />
        <Route
          path="/admin/target-edit"
          element={
            <AdminRoute>
              <PageWrapper component={AdminTargetEditPage} />
            </AdminRoute>
          }
        />
```

- [ ] **Step 3: Type-check**

```bash
cd frontend && rtk tsc --noEmit
```

Expected: 0 errors.

- [ ] **Step 4: Commit**

```bash
rtk git add frontend/src/config/navConfig.tsx frontend/src/App.tsx
rtk git commit -m "feat(nav): replace two upload menu items with unified Upload Data route"
```

---

## Task 9: Delete Old Pages + Final Verification

**Files:**
- Delete: `frontend/src/pages/AdminTargetUploadPage.tsx`
- Delete: `frontend/src/pages/AdminLraUploadPage.tsx`

- [ ] **Step 1: Delete old pages**

```bash
rm frontend/src/pages/AdminTargetUploadPage.tsx
rm frontend/src/pages/AdminLraUploadPage.tsx
```

- [ ] **Step 2: Type-check**

```bash
cd frontend && rtk tsc --noEmit
```

Expected: 0 errors.

- [ ] **Step 3: Full build**

```bash
cd frontend && rtk next build
```

If using Vite (not Next.js):
```bash
cd frontend && npx vite build 2>&1 | tail -20
```

Expected: build succeeds, no errors.

- [ ] **Step 4: Commit**

```bash
rtk git add -A
rtk git commit -m "feat(cleanup): remove old AdminTargetUploadPage and AdminLraUploadPage"
```

---

## Completion Checklist

- [ ] All 19 token references replaced — no old token names remain in source
- [ ] `useDropZone` 12 tests passing
- [ ] `DropZone` component renders all 6 states
- [ ] `UploadSectionCard` accordion opens/closes
- [ ] `/admin/upload` page loads with 3 sections + history table
- [ ] Section 1 (Target): upload button disabled when catatan is empty
- [ ] Section 2 (Angkas): shows unmatched warning when API returns unmatchedPuskesmas
- [ ] Section 3 (LRA): preview panel appears before confirm; confirm commits to DB
- [ ] `/admin/target-upload` redirects to `/admin/upload`
- [ ] `/admin/lra-upload` redirects to `/admin/upload`
- [ ] Nav shows single "Upload Data" item (not two separate items)
- [ ] Dark mode works — all new components respect `[data-theme="dark"]`
- [ ] Responsive: grid collapses to 1 column at `<900px`
- [ ] `rtk tsc --noEmit` passes with 0 errors
- [ ] Build succeeds
