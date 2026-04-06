# Design System Consolidation + Dark Mode — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Consolidate all hardcoded CSS values into semantic design tokens, add dark mode via antd `darkAlgorithm` + CSS variables, standardize font sizes, and fix component consistency issues (empty states, modal widths, status tags, error handling, validation messages).

**Architecture:** Extend existing `theme.ts` with light/dark theme configs. CSS variables in `index.css` provide `:root` (light) and `[data-theme="dark"]` overrides. A `useTheme` hook manages state via `localStorage` and toggles both CSS `data-theme` attribute and antd `ConfigProvider` algorithm. All hardcoded hex/px values in CSS files are replaced with `var(--xxx)` references.

**Tech Stack:** React 18, Ant Design v5 (ConfigProvider + darkAlgorithm), CSS custom properties, TypeScript

---

## File Structure

| File | Action | Responsibility |
|------|--------|----------------|
| `frontend/src/theme.ts` | Modify | Add dark theme config, semantic color exports, `getThemeConfig()` function |
| `frontend/src/index.css` | Modify | Add semantic surface/font-size variables to `:root`, add `[data-theme="dark"]` block, replace hardcoded hex in table overrides |
| `frontend/src/hooks/useTheme.ts` | Create | Theme state hook: read/write localStorage, toggle `data-theme` attribute, return antd algorithm |
| `frontend/src/main.tsx` | Modify | Use `useTheme` hook to pass dynamic theme to `ConfigProvider` |
| `frontend/src/components/Layout.tsx` | Modify | Add theme toggle button in header |
| `frontend/src/components/Layout.css` | Modify | Replace hardcoded hex with CSS variables |
| `frontend/src/components/LaporanBulkInput.css` | Modify | Replace ~25 hardcoded hex/font-size values with CSS variables |
| `frontend/src/components/ChatWidget.css` | Modify | Replace hardcoded hex with CSS variables |
| `frontend/src/components/EvkinEmpty.tsx` | Create | Shared empty state component |
| `frontend/src/components/EvkinEmpty.css` | Create | Empty state styling |
| `frontend/src/pages/LaporanBulkInputPage.tsx` | Modify | Use `EvkinEmpty`, fix modal widths |
| `frontend/src/pages/AdminLaporanPage.tsx` | Modify | Fix status tag colors, modal widths |
| `frontend/src/pages/AdminTargetEditPage.tsx` | Modify | Fix status tag colors, modal widths |
| `frontend/src/pages/AdminTargetUploadPage.tsx` | Modify | Fix modal widths |
| `frontend/src/pages/AdminMasterDataPage.tsx` | Modify | Fix modal widths |
| `frontend/src/pages/AdminPuskesmasPage.tsx` | Modify | Fix modal widths |
| `frontend/src/pages/AdminPuskesmasConfigPage.tsx` | Modify | Fix modal widths |
| `frontend/src/pages/PuskesmasAngkasPage.tsx` | Modify | Fix status tag colors, modal widths |
| `frontend/src/pages/PuskesmasTargetKinerjaPage.tsx` | Modify | Fix modal widths |
| `frontend/src/pages/DashboardPage.tsx` | Modify | Fix modal widths |
| `frontend/src/pages/CaraPengisianPage.tsx` | Modify | Fix status tag colors |

---

## Task 1: Add Semantic CSS Variables + Font Size Tokens to `index.css`

**Files:**
- Modify: `frontend/src/index.css:4-46` (`:root` block)

- [ ] **Step 1: Add new semantic variables to `:root` block**

In `frontend/src/index.css`, replace the existing `:root` CSS variables block (lines 16-45) with the expanded version:

```css
  /* ── Theme CSS variables (mirrors theme.ts tokens) ──── */
  --color-primary: #0E6BA8;
  --color-primary-light: #3D8DC5;
  --color-primary-dark: #094D7A;
  --color-accent: #0891B2;
  --color-success: #2E8B57;
  --color-warning: #E8961E;
  --color-error: #CF1322;

  --text-primary: #1F2937;
  --text-secondary: #6B7280;
  --text-tertiary: #9CA3AF;
  --border-color: #E5E7EB;
  --border-light: #F3F4F6;
  --bg-layout: #F9FAFB;
  --bg-card: #FFFFFF;

  /* Semantic surfaces */
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
  --border-success-dark: #BBF7D0;
  --border-info: #BFDBFE;

  /* Progress gradients */
  --gradient-success: linear-gradient(90deg, #34D399, var(--color-success));
  --gradient-warning: linear-gradient(90deg, #FBBF24, var(--color-warning));
  --gradient-error: linear-gradient(90deg, #FCA5A5, var(--color-error));

  /* Radii */
  --radius-sm: 4px;
  --radius: 6px;
  --radius-lg: 8px;

  /* Shadows */
  --shadow-sm: 0 1px 2px rgba(0, 0, 0, 0.05);
  --shadow-md: 0 2px 8px rgba(0, 0, 0, 0.08);
  --shadow-lg: 0 4px 16px rgba(0, 0, 0, 0.10);
  --shadow-action-bar: 0 -2px 8px rgba(0, 0, 0, 0.05);

  /* Transitions */
  --transition-fast: 0.15s cubic-bezier(0.4, 0, 0.2, 1);
  --transition: 0.25s cubic-bezier(0.4, 0, 0.2, 1);
  --transition-slow: 0.4s cubic-bezier(0.4, 0, 0.2, 1);

  /* Font sizes (semantic scale) */
  --text-2xs: 10px;
  --text-xs: 11px;
  --text-sm: 12px;
  --text-base: 14px;
  --text-md: 16px;
  --text-lg: 20px;
  --text-xl: 24px;

  /* Misc */
  --separator: rgba(0, 0, 0, 0.04);
  --separator-dashed: rgba(0, 0, 0, 0.06);
  --code-bg: #F1F5F9;

  --breakpoint-mobile: 768px;
```

- [ ] **Step 2: Replace hardcoded hex in global table styles**

In the same file, replace the table override section (lines 64-94) with CSS variable references:

```css
/* Zebra striping */
.ant-table-wrapper .ant-table-tbody > tr:nth-child(odd) > td {
  background-color: var(--bg-card);
}
.ant-table-wrapper .ant-table-tbody > tr:nth-child(even) > td {
  background-color: var(--bg-subtle);
}

/* Hover */
.ant-table-wrapper .ant-table-tbody > tr:hover > td {
  background-color: var(--bg-hover) !important;
}

/* Selected row */
.ant-table-wrapper .ant-table-tbody > tr.ant-table-row-selected > td {
  background-color: var(--bg-selected) !important;
}

/* Legacy class support */
.table-row-light {
  background-color: var(--bg-card);
}
.table-row-dark {
  background-color: var(--bg-subtle);
}
.table-row-light:hover,
.table-row-dark:hover {
  background-color: var(--bg-hover) !important;
}
```

- [ ] **Step 3: Replace hardcoded highlight animation**

Replace the `highlight-blink` keyframe (line 154-156):

```css
@keyframes highlight-blink {
  0%, 100% { background-color: transparent; }
  50% { background-color: var(--bg-warning-subtle); }
}
```

- [ ] **Step 4: Verify the app loads without visual regressions**

Run: `cd frontend && npx vite build 2>&1 | head -20`
Expected: Build succeeds with no errors.

- [ ] **Step 5: Commit**

```bash
git add frontend/src/index.css
git commit -m "feat: add semantic CSS variables and font-size tokens to :root"
```

---

## Task 2: Add Dark Mode CSS Variables Block

**Files:**
- Modify: `frontend/src/index.css` (add after `:root` block, before `*` reset)

- [ ] **Step 1: Add `[data-theme="dark"]` block**

Insert after the `:root { ... }` closing brace and before `* { margin: 0; }`:

```css
/* ── Dark mode overrides ──────────────────────────────── */
[data-theme="dark"] {
  color-scheme: dark;

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
  --border-success-dark: #14532D;
  --border-info: #1E40AF;

  --gradient-success: linear-gradient(90deg, #22C55E, #16A34A);
  --gradient-warning: linear-gradient(90deg, #F59E0B, #D97706);
  --gradient-error: linear-gradient(90deg, #F87171, #EF4444);

  --shadow-sm: 0 1px 2px rgba(0, 0, 0, 0.3);
  --shadow-md: 0 2px 8px rgba(0, 0, 0, 0.4);
  --shadow-lg: 0 4px 16px rgba(0, 0, 0, 0.5);
  --shadow-action-bar: 0 -2px 8px rgba(0, 0, 0, 0.3);

  --separator: rgba(255, 255, 255, 0.06);
  --separator-dashed: rgba(255, 255, 255, 0.08);
  --code-bg: #1E293B;
}

/* Smooth theme transition */
html[data-theme] body,
html[data-theme] .ant-layout,
html[data-theme] .layout-content,
html[data-theme] .layout-header {
  transition: background-color 0.3s ease, color 0.3s ease;
}
```

- [ ] **Step 2: Verify the CSS is valid**

Run: `cd frontend && npx vite build 2>&1 | head -20`
Expected: Build succeeds.

- [ ] **Step 3: Commit**

```bash
git add frontend/src/index.css
git commit -m "feat: add dark mode CSS variables block"
```

---

## Task 3: Create `useTheme` Hook

**Files:**
- Create: `frontend/src/hooks/useTheme.ts`

- [ ] **Step 1: Create the hook file**

Create `frontend/src/hooks/useTheme.ts`:

```ts
import { useState, useEffect, useCallback } from 'react';
import { theme as antdTheme } from 'antd';
import type { ThemeConfig } from 'antd';

type ThemeMode = 'light' | 'dark';

const STORAGE_KEY = 'evkin-theme';

function getInitialTheme(): ThemeMode {
  if (typeof window === 'undefined') return 'light';
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored === 'light' || stored === 'dark') return stored;
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

function applyThemeToDOM(mode: ThemeMode) {
  document.documentElement.setAttribute('data-theme', mode);
}

export function useTheme() {
  const [mode, setMode] = useState<ThemeMode>(getInitialTheme);

  useEffect(() => {
    applyThemeToDOM(mode);
    localStorage.setItem(STORAGE_KEY, mode);
  }, [mode]);

  // Apply on first render (before React hydrates)
  useEffect(() => {
    applyThemeToDOM(getInitialTheme());
  }, []);

  const toggle = useCallback(() => {
    setMode(prev => prev === 'light' ? 'dark' : 'light');
  }, []);

  const isDark = mode === 'dark';

  const algorithm = isDark ? antdTheme.darkAlgorithm : antdTheme.defaultAlgorithm;

  return { mode, toggle, isDark, algorithm };
}
```

- [ ] **Step 2: Commit**

```bash
git add frontend/src/hooks/useTheme.ts
git commit -m "feat: create useTheme hook with localStorage persistence"
```

---

## Task 4: Update `theme.ts` to Support Dark Mode

**Files:**
- Modify: `frontend/src/theme.ts`

- [ ] **Step 1: Add dark brand palette and `getThemeConfig` function**

At the end of `frontend/src/theme.ts` (after `evkinTheme`), add:

```ts
// ── Dark brand palette ────────────────────────────────
export const brandDark = {
  ...brand,
  primary:      '#3D8DC5',
  primaryLight: '#5BA3D9',
  primaryDark:  '#0E6BA8',
  accent:       '#22D3EE',
  success:      '#4ADE80',
  warning:      '#FBBF24',
  error:        '#FB7185',

  textPrimary:   '#E5E7EB',
  textSecondary: '#9CA3AF',
  textTertiary:  '#6B7280',
  border:        '#374151',
  borderLight:   '#1F2937',
  bgLayout:      '#111827',
  bgCard:        '#1F2937',
  bgElevated:    '#374151',
} as const;

// ── Dark Ant Design theme config ──────────────────────
export const evkinThemeDark: ThemeConfig = {
  ...evkinTheme,
  token: {
    ...evkinTheme.token,
    colorPrimary:     brandDark.primary,
    colorSuccess:     brandDark.success,
    colorWarning:     brandDark.warning,
    colorError:       brandDark.error,
    colorInfo:        brandDark.accent,
    colorBgLayout:    brandDark.bgLayout,
    colorBgContainer: brandDark.bgCard,
    colorBgElevated:  brandDark.bgElevated,
    colorBorder:      brandDark.border,
    colorBorderSecondary: brandDark.borderLight,
    colorText:          brandDark.textPrimary,
    colorTextSecondary: brandDark.textSecondary,
    colorTextTertiary:  brandDark.textTertiary,
    boxShadow:          '0 2px 8px rgba(0, 0, 0, 0.4)',
    boxShadowSecondary: '0 1px 2px rgba(0, 0, 0, 0.3)',
  },
  components: {
    ...evkinTheme.components,
    Layout: {
      headerBg:     brandDark.bgCard,
      siderBg:      brandDark.primaryDark,
      bodyBg:       brandDark.bgLayout,
      headerHeight: layout.headerHeight,
    },
    Table: {
      headerBg:       '#1a2332',
      headerColor:    brandDark.textPrimary,
      rowHoverBg:     'rgba(59, 130, 246, 0.1)',
      rowSelectedBg:  'rgba(59, 130, 246, 0.15)',
      rowSelectedHoverBg: 'rgba(59, 130, 246, 0.2)',
      borderColor:    brandDark.borderLight,
    },
  },
};
```

- [ ] **Step 2: Also update the light theme's Table tokens to use the same values as CSS variables**

In the existing `evkinTheme.components.Table`, replace hardcoded hex with explicit references (these already match the CSS vars, just documenting the alignment):

```ts
    Table: {
      headerBg:       '#F8FAFC',    // matches --bg-subtle
      headerColor:    brand.textPrimary,
      rowHoverBg:     '#EFF6FF',    // matches --bg-hover
      rowSelectedBg:  '#DBEAFE',    // matches --bg-selected
      rowSelectedHoverBg: '#BFDBFE', // matches --bg-selected-hover
      borderColor:    brand.borderLight,
    },
```

(These values are already correct; this step just adds comments for clarity.)

- [ ] **Step 3: Commit**

```bash
git add frontend/src/theme.ts
git commit -m "feat: add dark brand palette and evkinThemeDark config"
```

---

## Task 5: Wire `useTheme` into `main.tsx` and `Layout.tsx`

**Files:**
- Modify: `frontend/src/main.tsx`
- Modify: `frontend/src/components/Layout.tsx`
- Modify: `frontend/src/App.tsx`

- [ ] **Step 1: Create a ThemeProvider wrapper in `main.tsx`**

Replace `frontend/src/main.tsx` with:

```tsx
import React from 'react'
import ReactDOM from 'react-dom/client'
import { ConfigProvider } from 'antd';
import idID from 'antd/locale/id_ID';
import { evkinTheme, evkinThemeDark } from './theme';
import { useTheme } from './hooks/useTheme';
import App from './App'
import './index.css'

function Root() {
  const { isDark, algorithm } = useTheme();
  const themeConfig = isDark ? evkinThemeDark : evkinTheme;

  return (
    <ConfigProvider
      locale={idID}
      theme={{ ...themeConfig, algorithm }}
    >
      <App />
    </ConfigProvider>
  );
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <Root />
  </React.StrictMode>,
)
```

- [ ] **Step 2: Add theme toggle button in `Layout.tsx` header**

In `frontend/src/components/Layout.tsx`, add the import at the top:

```tsx
import { SunOutlined, MoonOutlined } from '@ant-design/icons';
import { useTheme } from '../hooks/useTheme';
```

Inside the `Layout` component, add the hook call:

```tsx
const { isDark, toggle: toggleTheme } = useTheme();
```

In the desktop header section (the `<Header>` inside the desktop return block), add the toggle button before the user dropdown:

```tsx
<Header className="layout-header">
  <Button
    type="text"
    icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
    onClick={() => setCollapsed(!collapsed)}
    className="trigger-button"
  />
  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
    <Button
      type="text"
      icon={isDark ? <SunOutlined /> : <MoonOutlined />}
      onClick={toggleTheme}
      title={isDark ? 'Light mode' : 'Dark mode'}
      style={{ fontSize: 18 }}
    />
    <Dropdown menu={{ items: userMenuItems }} placement="bottomRight">
      {/* existing user profile dropdown */}
    </Dropdown>
  </div>
</Header>
```

Do the same for the mobile header section.

- [ ] **Step 3: Verify the toggle works**

Run: `cd frontend && npx vite dev`
Expected: Toggle button in header switches between light and dark mode. Antd components respond to theme change. CSS variables switch between light and dark.

- [ ] **Step 4: Commit**

```bash
git add frontend/src/main.tsx frontend/src/components/Layout.tsx
git commit -m "feat: wire useTheme into ConfigProvider and add toggle button"
```

---

## Task 6: Sweep Hardcoded Values in `LaporanBulkInput.css`

**Files:**
- Modify: `frontend/src/components/LaporanBulkInput.css`

- [ ] **Step 1: Replace all hardcoded hex colors with CSS variable references**

Apply these replacements throughout the file:

| Line(s) | Old value | New value |
|----------|-----------|-----------|
| 12 | `color: #fff;` | `color: #fff;` (keep — on gradient bg) |
| 53 | `background: rgba(255, 255, 255, 0.12);` | keep (on gradient bg) |
| 62 | `background: rgba(255, 255, 255, 0.20);` | keep (on gradient bg) |
| 91 | `background: rgba(255, 255, 255, 0.2);` | keep (on gradient bg) |
| 99 | `background: linear-gradient(90deg, var(--color-success), #3BA06B);` | `background: var(--gradient-success);` |
| 155 | `background: #EFF6FF;` | `background: var(--bg-info-subtle);` |
| 217 | `background: #F0FDF4;` | `background: var(--bg-success-subtle);` |
| 218 | `border-color: #86EFAC;` | `border-color: var(--border-success);` |
| 222 | `background: #F8FAFC;` | `background: var(--bg-subtle);` |
| 298 | `background: #EFF6FF;` | `background: var(--bg-info-subtle);` |
| 299 | `border: 1px solid #BFDBFE;` | `border: 1px solid var(--border-info);` |
| 303 | `background: #F0FDF4;` | `background: var(--bg-success-subtle);` |
| 304 | `border: 1px solid #BBF7D0;` | `border: 1px solid var(--border-success-dark);` |
| 332 | `border-top: 1px solid rgba(0, 0, 0, 0.04);` | `border-top: 1px solid var(--separator);` |
| 379 | `border-top: 1px dashed rgba(0, 0, 0, 0.06);` | `border-top: 1px dashed var(--separator-dashed);` |
| 397 | `background: linear-gradient(90deg, #34D399, var(--color-success));` | `background: var(--gradient-success);` |
| 405 | `background: linear-gradient(90deg, #FBBF24, var(--color-warning));` | `background: var(--gradient-warning);` |
| 409 | `background: linear-gradient(90deg, #FCA5A5, var(--color-error));` | `background: var(--gradient-error);` |
| 478 | `box-shadow: 0 -2px 8px rgba(0, 0, 0, 0.05);` | `box-shadow: var(--shadow-action-bar);` |

- [ ] **Step 2: Replace hardcoded font-sizes with CSS variable references**

| Line(s) | Old | New |
|----------|-----|-----|
| 16 | `font-size: 18px;` | `font-size: var(--text-md);` (card title on gradient — 18→16 acceptable) |
| 22 | `font-size: 13px;` | `font-size: var(--text-sm);` |
| 48 | `font-size: 15px;` | `font-size: var(--text-md);` (mobile title: 15→16) |
| 66 | `font-size: 11px;` | `font-size: var(--text-xs);` |
| 74 | `font-size: 22px;` | `font-size: var(--text-lg);` (stat value: 22→20) |
| 80 | `font-size: 11px;` | `font-size: var(--text-xs);` |
| 107 | `font-size: 11px;` | `font-size: var(--text-xs);` |
| 159 | `font-size: 12px;` | `font-size: var(--text-sm);` |
| 171 | `font-size: 14px;` | `font-size: var(--text-base);` |
| 198 | `font-size: 13px;` | `font-size: var(--text-sm);` (mobile group title: 13→12) |
| 246 | `font-size: 13px;` | `font-size: var(--text-sm);` |
| 258 | `font-size: 12px;` | `font-size: var(--text-sm);` |
| 263 | `font-size: 12px;` | `font-size: var(--text-sm);` |
| 308 | `font-size: 11px;` | `font-size: var(--text-xs);` |
| 336 | `font-size: 12px;` | `font-size: var(--text-sm);` |
| 343 | `font-size: 13px;` | `font-size: var(--text-base);` (data value: 13→14) |
| 362 | `font-size: 11px;` | `font-size: var(--text-xs);` |
| 413 | `font-size: 12px;` | `font-size: var(--text-sm);` |
| 427 | `font-size: 12px;` | `font-size: var(--text-sm);` |
| 455 | `font-size: 12px;` | `font-size: var(--text-sm);` |
| 497 | `font-size: 13px;` | `font-size: var(--text-sm);` |
| 561 | `font-size: 11px;` | `font-size: var(--text-xs);` |
| 567 | `font-size: 11px;` | `font-size: var(--text-xs);` |

- [ ] **Step 3: Verify build**

Run: `cd frontend && npx vite build 2>&1 | head -20`
Expected: Build succeeds.

- [ ] **Step 4: Commit**

```bash
git add frontend/src/components/LaporanBulkInput.css
git commit -m "refactor: replace hardcoded values in LaporanBulkInput.css with design tokens"
```

---

## Task 7: Sweep Hardcoded Values in `Layout.css` and `ChatWidget.css`

**Files:**
- Modify: `frontend/src/components/Layout.css`
- Modify: `frontend/src/components/ChatWidget.css`

- [ ] **Step 1: Replace hardcoded values in `Layout.css`**

| Line | Old | New |
|------|-----|-----|
| 22 | `color: rgba(255, 255, 255, 0.65) !important;` | keep (sidebar is always dark) |
| 23 | `font-size: 18px !important;` | `font-size: var(--text-md) !important;` |
| 27 | `color: #fff !important;` | keep (sidebar always dark) |
| 37 | `border-bottom: 1px solid rgba(255, 255, 255, 0.08);` | keep (sidebar always dark) |
| 41 | `color: #fff !important;` | keep (sidebar always dark) |
| 50 | `font-size: 16px;` | `font-size: var(--text-md);` |
| 54 | `font-size: 20px;` | `font-size: var(--text-lg);` |
| 91 | `font-size: 16px !important;` | `font-size: var(--text-md) !important;` |
| 107 | `background-color: rgba(0, 0, 0, 0.04);` | `background-color: var(--separator);` |
| 120 | `font-size: 13px;` | `font-size: var(--text-sm);` |
| 128 | `font-size: 12px !important;` | `font-size: var(--text-sm) !important;` |

- [ ] **Step 2: Replace hardcoded values in `ChatWidget.css`**

| Line | Old | New |
|------|-----|-----|
| 60 | `font-size: 12px;` | `font-size: var(--text-sm);` |
| 64 | `background-color: #F1F5F9;` | `background-color: var(--code-bg);` |

- [ ] **Step 3: Verify build**

Run: `cd frontend && npx vite build 2>&1 | head -20`
Expected: Build succeeds.

- [ ] **Step 4: Commit**

```bash
git add frontend/src/components/Layout.css frontend/src/components/ChatWidget.css
git commit -m "refactor: replace hardcoded values in Layout.css and ChatWidget.css with design tokens"
```

---

## Task 8: Create Shared Empty State Component

**Files:**
- Create: `frontend/src/components/EvkinEmpty.tsx`
- Create: `frontend/src/components/EvkinEmpty.css`
- Modify: `frontend/src/pages/LaporanBulkInputPage.tsx`

- [ ] **Step 1: Create `EvkinEmpty.tsx`**

```tsx
import React from 'react';
import { Empty, Button } from 'antd';
import { FileTextOutlined } from '@ant-design/icons';
import './EvkinEmpty.css';

interface EvkinEmptyProps {
  icon?: React.ReactNode;
  description: string;
  actionText?: string;
  onAction?: () => void;
}

export const EvkinEmpty: React.FC<EvkinEmptyProps> = ({
  icon,
  description,
  actionText,
  onAction,
}) => (
  <div className="evkin-empty">
    <Empty
      image={icon || <FileTextOutlined className="evkin-empty-icon" />}
      description={<span className="evkin-empty-text">{description}</span>}
    >
      {actionText && onAction && (
        <Button type="primary" onClick={onAction}>{actionText}</Button>
      )}
    </Empty>
  </div>
);
```

- [ ] **Step 2: Create `EvkinEmpty.css`**

```css
.evkin-empty {
  text-align: center;
  padding: 60px 20px;
}

.evkin-empty-icon {
  font-size: 48px;
  color: var(--border-color);
}

.evkin-empty-text {
  font-size: var(--text-md);
  color: var(--text-tertiary);
}
```

- [ ] **Step 3: Replace ad-hoc empty state in `LaporanBulkInputPage.tsx`**

In `frontend/src/pages/LaporanBulkInputPage.tsx`, add import:

```tsx
import { EvkinEmpty } from '../components/EvkinEmpty';
```

Replace the existing empty state block (around lines 702-707):

```tsx
{/* Old code: */}
<div className="laporan-empty-state">
  <FileTextOutlined className="empty-icon" />
  <div className="empty-text">...</div>
</div>

{/* New code: */}
<EvkinEmpty
  description="Belum ada data laporan untuk filter yang dipilih"
/>
```

- [ ] **Step 4: Verify build**

Run: `cd frontend && npx vite build 2>&1 | head -20`
Expected: Build succeeds.

- [ ] **Step 5: Commit**

```bash
git add frontend/src/components/EvkinEmpty.tsx frontend/src/components/EvkinEmpty.css frontend/src/pages/LaporanBulkInputPage.tsx
git commit -m "feat: create shared EvkinEmpty component and use in LaporanBulkInputPage"
```

---

## Task 9: Standardize Modal Widths

**Files:**
- Modify: `frontend/src/pages/AdminTargetUploadPage.tsx`
- Modify: `frontend/src/pages/AdminTargetEditPage.tsx`
- Modify: `frontend/src/pages/AdminLaporanPage.tsx`
- Modify: `frontend/src/pages/AdminMasterDataPage.tsx`
- Modify: `frontend/src/pages/AdminPuskesmasPage.tsx`
- Modify: `frontend/src/pages/AdminPuskesmasConfigPage.tsx`
- Modify: `frontend/src/pages/PuskesmasAngkasPage.tsx`
- Modify: `frontend/src/pages/PuskesmasTargetKinerjaPage.tsx`
- Modify: `frontend/src/pages/DashboardPage.tsx`

- [ ] **Step 1: Add `modalWidths` import to all files that use `<Modal>`**

In each file listed above, add the import (if not already present):

```tsx
import { modalWidths } from '../theme';
```

- [ ] **Step 2: Apply standardized widths based on content type**

For each Modal in the codebase, set `width={modalWidths.XX}`:

| File | Modal | Current width | New width |
|------|-------|---------------|-----------|
| `AdminTargetUploadPage.tsx` | Upload Excel Target | default (520) | `modalWidths.md` (640) |
| `AdminTargetUploadPage.tsx` | Upload PDF Angkas | default (520) | `modalWidths.md` (640) |
| `AdminTargetUploadPage.tsx` | Hubungkan ke Sub Kegiatan | default (520) | `modalWidths.lg` (900) |
| `AdminTargetUploadPage.tsx` | History Target Anggaran | 700 | `modalWidths.lg` (900) |
| `AdminTargetUploadPage.tsx` | History Angkas | 800 | `modalWidths.lg` (900) |
| `AdminTargetEditPage.tsx` | Edit Target Kinerja | default (520) | `modalWidths.md` (640) |
| `AdminTargetEditPage.tsx` | History Target Kinerja | 700 | `modalWidths.lg` (900) |
| `AdminTargetEditPage.tsx` | Edit Angkas | default (520) | `modalWidths.md` (640) |
| `AdminTargetEditPage.tsx` | History Angkas | 800 | `modalWidths.lg` (900) |
| `AdminLaporanPage.tsx` | Detail Laporan | default | `modalWidths.lg` (900) |
| `AdminMasterDataPage.tsx` | CRUD modals | default | `modalWidths.sm` (480) |
| `AdminPuskesmasPage.tsx` | User CRUD | default | `modalWidths.sm` (480) |
| `AdminPuskesmasConfigPage.tsx` | Config modal | default | `modalWidths.md` (640) |
| `PuskesmasAngkasPage.tsx` | Angkas modals | default | `modalWidths.md` (640) |
| `PuskesmasTargetKinerjaPage.tsx` | Target modals | default | `modalWidths.md` (640) |
| `DashboardPage.tsx` | Dashboard detail | default | `modalWidths.lg` (900) |

Example change in `AdminTargetUploadPage.tsx`:

```tsx
// Before:
<Modal title="History Target Anggaran" ... width={700}>

// After:
<Modal title="History Target Anggaran" ... width={modalWidths.lg}>
```

- [ ] **Step 3: Verify build**

Run: `cd frontend && npx vite build 2>&1 | head -20`
Expected: Build succeeds.

- [ ] **Step 4: Commit**

```bash
git add frontend/src/pages/AdminTargetUploadPage.tsx frontend/src/pages/AdminTargetEditPage.tsx frontend/src/pages/AdminLaporanPage.tsx frontend/src/pages/AdminMasterDataPage.tsx frontend/src/pages/AdminPuskesmasPage.tsx frontend/src/pages/AdminPuskesmasConfigPage.tsx frontend/src/pages/PuskesmasAngkasPage.tsx frontend/src/pages/PuskesmasTargetKinerjaPage.tsx frontend/src/pages/DashboardPage.tsx
git commit -m "refactor: standardize all modal widths using modalWidths tokens"
```

---

## Task 10: Fix Status Tag Colors

**Files:**
- Modify: `frontend/src/pages/AdminLaporanPage.tsx`
- Modify: `frontend/src/pages/AdminTargetEditPage.tsx`
- Modify: `frontend/src/pages/PuskesmasAngkasPage.tsx`
- Modify: `frontend/src/pages/CaraPengisianPage.tsx`

- [ ] **Step 1: Define a shared status color map**

In `frontend/src/theme.ts`, add after the `brand` object:

```ts
// ── Status tag color map (for antd <Tag color="xxx">) ──
export const statusTagColors: Record<string, string> = {
  terkirim:     brand.statusTerkirim,    // green
  tersimpan:    brand.statusTersimpan,   // blue
  ditolak:      brand.statusDitolak,     // red
  menunggu:     brand.statusMenunggu,    // amber
  diverifikasi: brand.statusVerified,    // dark green
};
```

- [ ] **Step 2: Update `AdminLaporanPage.tsx`**

Find the status tag render function (around line 656). Replace the inline `colors` object:

```tsx
// Before:
const colors: Record<string, string> = { ... };
return <Tag color={colors[status] || 'default'}>{status}</Tag>;

// After:
import { statusTagColors } from '../theme';
// ...
return <Tag color={statusTagColors[status] || 'default'}>{status}</Tag>;
```

- [ ] **Step 3: Update `AdminTargetEditPage.tsx`**

Find the `Multi-Sumber` tag (line 512). Change:

```tsx
// Before:
record.isManualAngkas ? <Tag color="orange">Multi-Sumber</Tag> : <Tag color="default">Single-Sumber</Tag>

// After:
import { brand } from '../theme';
// ...
record.isManualAngkas ? <Tag color="purple">Multi-Sumber</Tag> : <Tag color="default">Single-Sumber</Tag>
```

- [ ] **Step 4: Update `PuskesmasAngkasPage.tsx`**

Find the `Manual Input` tag (line 384). Change:

```tsx
// Before:
<Tag color="orange">Manual Input</Tag>

// After:
<Tag color="purple">Manual Input</Tag>
```

- [ ] **Step 5: Update `CaraPengisianPage.tsx`**

Fix status tags to match the color scheme:

```tsx
// Line 161: Tersimpan tag
// Before:
<Tag color="orange">Tersimpan</Tag>
// After:
<Tag color="blue">Tersimpan</Tag>

// Line 167: Terkirim tag
// Before:
<Tag color="blue">Terkirim</Tag>
// After:
<Tag color="green">Terkirim</Tag>

// Line 183: Tersimpan status
// Before:
<Tag color="orange">Tersimpan</Tag>
// After:
<Tag color="blue">Tersimpan</Tag>

// Line 187: Terkirim status
// Before:
<Tag color="blue">Terkirim</Tag>
// After:
<Tag color="green">Terkirim</Tag>
```

- [ ] **Step 6: Verify build**

Run: `cd frontend && npx vite build 2>&1 | head -20`
Expected: Build succeeds.

- [ ] **Step 7: Commit**

```bash
git add frontend/src/theme.ts frontend/src/pages/AdminLaporanPage.tsx frontend/src/pages/AdminTargetEditPage.tsx frontend/src/pages/PuskesmasAngkasPage.tsx frontend/src/pages/CaraPengisianPage.tsx
git commit -m "refactor: standardize status tag colors — stop overloading orange"
```

---

## Task 11: Standardize Validation Messages

**Files:**
- Modify: all pages with form validation (search codebase for `"harus diisi"`, `"Wajib diisi"`, `"required"`)

- [ ] **Step 1: Search for all validation message patterns**

Run: `grep -rn "harus diisi\|Wajib diisi\|required\|tidak valid\|Please input\|Please select" frontend/src/pages/ --include="*.tsx" | head -30`

- [ ] **Step 2: Standardize all messages**

Replace all variations with consistent Bahasa Indonesia format:
- Required fields: `"[Field] wajib diisi"`
- Format errors: `"[Field] tidak valid"`
- Selection required: `"[Field] wajib dipilih"`

Example:
```tsx
// Before:
rules={[{ required: true, message: 'Nama harus diisi!' }]}

// After:
rules={[{ required: true, message: 'Nama wajib diisi' }]}
```

Remove trailing `!` from all validation messages (too aggressive for government app).

- [ ] **Step 3: Verify build**

Run: `cd frontend && npx vite build 2>&1 | head -20`
Expected: Build succeeds.

- [ ] **Step 4: Commit**

```bash
git add frontend/src/pages/
git commit -m "refactor: standardize validation messages to consistent Bahasa Indonesia"
```

---

## Task 12: Final Build + Visual Verification

**Files:** None (verification only)

- [ ] **Step 1: Full build check**

Run: `cd frontend && npx vite build`
Expected: Build succeeds with no errors.

- [ ] **Step 2: Run TypeScript check**

Run: `cd frontend && npx tsc --noEmit`
Expected: No type errors.

- [ ] **Step 3: Manual visual verification checklist**

Start dev server: `cd frontend && npx vite dev`

Verify:
- [ ] Light mode: all colors use design tokens (no hardcoded blue/gray visible in DevTools)
- [ ] Dark mode toggle works from header
- [ ] Dark mode: background is dark, text is light, cards have proper contrast
- [ ] Dark mode: sidebar stays dark (already was)
- [ ] Dark mode: login page gradient stays readable
- [ ] Tables: zebra striping and hover work in both modes
- [ ] LaporanBulkInput: progress header, stat cards, data sections render correctly
- [ ] Modals: consistent widths (sm for simple, md for forms, lg for tables/history)
- [ ] Status tags: Terkirim=green, Tersimpan=blue, Multi-Sumber=purple
- [ ] Empty states: consistent icon + text pattern
- [ ] Theme persists on page refresh (localStorage)

- [ ] **Step 4: Commit any final fixes**

```bash
git add -A
git commit -m "fix: final visual adjustments after design system integration"
```

Plan complete and saved to `docs/superpowers/plans/2026-04-06-design-system-dark-mode.md`. Two execution options:

**1. Subagent-Driven (recommended)** - I dispatch a fresh subagent per task, review between tasks, fast iteration

**2. Inline Execution** - Execute tasks in this session using executing-plans, batch execution with checkpoints

Which approach?
