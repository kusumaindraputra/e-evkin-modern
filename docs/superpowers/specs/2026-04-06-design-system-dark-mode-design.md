# Design System Consolidation + Dark Mode

**Date:** 2026-04-06
**Branch:** rebranding
**Approach:** Extend existing `theme.ts` + CSS variables, add dark mode via antd `darkAlgorithm`

---

## 1. Dark Mode Token Architecture

### Strategy
- `theme.ts` exports `evkinThemeLight` and `evkinThemeDark` (antd `darkAlgorithm`)
- `index.css` has `:root` (light) and `[data-theme="dark"]` block
- Theme state persisted in `localStorage` key `evkin-theme`, default `light`
- New hook `useTheme()` returns `{ theme, toggle, isDark }`
- Toggle button in header (sun/moon icon)

### Dark Mode CSS Variables
```css
[data-theme="dark"] {
  --color-primary: #3D8DC5;
  --color-primary-light: #5BA3D9;
  --color-primary-dark: #0E6BA8;
  --color-accent: #22D3EE;
  --color-success: #4ADE80;
  --color-warning: #FBBF24;
  --color-error: #FB7185;

  --text-primary: #E5E7EB;
  --text-secondary: #9CA3AF;
  --text-tertiary: #6B7280;
  --border-color: #374151;
  --border-light: #1F2937;
  --bg-layout: #111827;
  --bg-card: #1F2937;

  --bg-hover: rgba(59, 130, 246, 0.1);
  --bg-selected: rgba(59, 130, 246, 0.15);
  --bg-selected-hover: rgba(59, 130, 246, 0.2);
  --bg-subtle: #1a2332;
  --bg-success-subtle: rgba(74, 222, 128, 0.1);
  --bg-warning-subtle: rgba(251, 191, 36, 0.1);
  --bg-error-subtle: rgba(251, 113, 133, 0.1);
  --bg-info-subtle: rgba(59, 130, 246, 0.1);

  --border-success: #166534;
  --border-info: #1E40AF;

  --gradient-success: linear-gradient(90deg, #22C55E, #16A34A);
  --gradient-warning: linear-gradient(90deg, #F59E0B, #D97706);
  --gradient-error: linear-gradient(90deg, #F87171, #EF4444);

  --shadow-sm: 0 1px 2px rgba(0, 0, 0, 0.3);
  --shadow-md: 0 2px 8px rgba(0, 0, 0, 0.4);
  --shadow-lg: 0 4px 16px rgba(0, 0, 0, 0.5);
}
```

### Antd Integration
- `ConfigProvider` reads theme state and switches between `defaultAlgorithm` and `darkAlgorithm`
- Component-level overrides in `evkinThemeDark` mirror dark CSS variables

---

## 2. Hardcoded Color Sweep

### Problem
~50+ hardcoded hex values scattered across CSS files: `LaporanBulkInput.css`, `Layout.css`, `ChatWidget.css`, `index.css`.

### New Semantic CSS Variables (added to `:root`)
```css
:root {
  /* Surfaces */
  --bg-hover: #EFF6FF;
  --bg-selected: #DBEAFE;
  --bg-selected-hover: #BFDBFE;
  --bg-subtle: #F8FAFC;
  --bg-success-subtle: #F0FDF4;
  --bg-warning-subtle: #FFF3CD;
  --bg-error-subtle: #FFF1F0;
  --bg-info-subtle: #EFF6FF;

  /* Semantic borders */
  --border-success: #86EFAC;
  --border-info: #BFDBFE;

  /* Progress bar gradients */
  --gradient-success: linear-gradient(90deg, #34D399, var(--color-success));
  --gradient-warning: linear-gradient(90deg, #FBBF24, var(--color-warning));
  --gradient-error: linear-gradient(90deg, #FCA5A5, var(--color-error));
}
```

### Files to sweep
- `frontend/src/components/LaporanBulkInput.css` — ~25 hardcoded values
- `frontend/src/components/Layout.css` — ~5 hardcoded values
- `frontend/src/components/ChatWidget.css` — ~2 hardcoded values
- `frontend/src/index.css` — antd table overrides with hardcoded hex
- `frontend/src/theme.ts` — Table component tokens point to hardcoded hex

All hardcoded hex → `var(--xxx)`. Antd Table component tokens in `theme.ts` also aligned.

---

## 3. Font Size Standardization

### Problem
Font sizes 11/12/13/14/15/16/18/20/22px without clear hierarchy.

### Semantic Scale (7 levels)
```css
:root {
  --text-2xs: 10px;   /* micro labels, badges */
  --text-xs:  11px;   /* captions, helper text */
  --text-sm:  12px;   /* secondary labels, table cells */
  --text-base: 14px;  /* body text, inputs (antd default) */
  --text-md:  16px;   /* subheadings, emphasized text */
  --text-lg:  20px;   /* page titles, stat numbers */
  --text-xl:  24px;   /* hero numbers, login title */
}
```

### Migration mapping
| Current | Target | Context |
|---------|--------|---------|
| 11px | `--text-xs` | progress labels, badges, status text |
| 12px | `--text-sm` | table meta, form hints, chat |
| 13px | `--text-sm` or `--text-base` | case by case, 13px eliminated |
| 14px | `--text-base` | default body (often implicit) |
| 15-16px | `--text-md` | subheadings |
| 18px | `--text-md` | card titles |
| 20-22px | `--text-lg` | stat numbers, page titles |

---

## 4. Component Consistency Fixes

### 4a. Empty States (U9, U25)
- Shared CSS class `.evkin-empty` using antd `<Empty>` with consistent styling
- Pattern: icon + description text + optional action button
- Replace all ad-hoc empty states

### 4b. Modal Widths (U12)
- Use existing `modalWidths` from `theme.ts` (sm:480, md:640, lg:900, xl:1100)
- Audit all Modal usages and assign correct size:
  - Simple confirm/form → `sm` (480)
  - Edit form with few fields → `md` (640)
  - Complex table/multi-column → `lg` (900)
  - Full preview → `xl` (1100)

### 4c. Status Tags (U11)
Stop overloading orange. Use distinct colors from `brand.statusXxx`:
- `Terkirim` → green (`statusTerkirim`)
- `Tersimpan/Draft` → blue (`statusTersimpan`)
- `Ditolak` → red (`statusDitolak`)
- `Menunggu` → amber (`statusMenunggu`)
- `Manual` → gray
- `Multi-Sumber` → purple (match sumber anggaran)
- `Zero/Belum diisi` → default gray

### 4d. Error Handling Pattern (U15)
Standardize:
- `message.success()` — quick feedback (save, submit)
- `message.error()` — API errors
- `Modal.confirm()` — destructive actions only
- Remove `Alert` for transient feedback; only use for persistent inline warnings

### 4e. Validation Messages (U13)
Single format:
- Required: `"[Field] wajib diisi"`
- Format: `"[Field] tidak valid"`
- Consistent Bahasa Indonesia throughout

---

## 5. Theme Toggle

### Placement
Icon button in header, next to user dropdown. Sun icon (light mode) / Moon icon (dark mode).

### Implementation
```ts
// hooks/useTheme.ts
- Read localStorage('evkin-theme') on init, default 'light'
- Fallback to system prefers-color-scheme if no saved preference
- Set document.documentElement.setAttribute('data-theme', theme)
- Pass algorithm (defaultAlgorithm vs darkAlgorithm) to ConfigProvider
```

### Behavior
- Smooth 0.3s transition on background-color and color on toggle
- Sidebar stays dark in both modes (already dark-themed)
- Login page gradient stays as-is (already dark-friendly)

---

## Audit Items Addressed

This design addresses the following items from the application audit:
- **U11** — Status tag orange overloaded
- **U12** — Modal width not standardized
- **U13** — Validation message inconsistency
- **U15** — Error handling mixed patterns
- **U16** — 3 different blues
- **U17** — 6 border-radius values without hierarchy
- **U18** — Mobile breakpoint inconsistency (already fixed with `breakpoints.mobile`)
- **U19** — Inconsistent font-sizes
- **U20** — Multiple shadow values without system
- **U21** — Transition timing inconsistency
- **U22** — No dark mode
- **U23** — 5+ gray shades without semantic naming
- **U25** — Unified empty state component
- **U26** — Number formatting standardization (via consistent token usage)

---

## Out of Scope
- L1-L17 (logic/security issues — separate effort)
- U1 (mobile menu — already implemented)
- U2-U7 (navigation — already fixed)
- U8 (pagination — `paginationDefaults` already in theme.ts)
- U10 (edit button format)
- U24, U27-U31 (feature additions — separate effort)
