# Mobile-First Responsive Layout Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Transform the E-EVKIN app from desktop-only (fixed 220px sidebar blocks mobile) to a mobile-first layout with drawer navigation, responsive tables, and proper touch-friendly spacing.

**Architecture:** Create a `useBreakpoint` hook to detect mobile/desktop. On mobile (<768px): sidebar becomes an Ant Design Drawer triggered by hamburger button, content goes full-width, tables get horizontal scroll. On desktop (>=768px): keep current fixed sidebar behavior unchanged. All changes are in Layout + CSS — page components get minimal/no changes because Ant Design Grid + theme CSS already handle most responsiveness.

**Tech Stack:** React hooks, Ant Design v5 (Drawer, Grid), CSS media queries at 768px

---

## File Structure

| File | Action | Responsibility |
|------|--------|----------------|
| `src/hooks/useBreakpoint.ts` | Create | Single hook: returns `{ isMobile }` based on window width |
| `src/components/Layout.tsx` | Modify | Add drawer mode for mobile, auto-collapse sidebar |
| `src/components/Layout.css` | Modify | Mobile-first media queries, full-width content on mobile |
| `src/index.css` | Modify | Global mobile overrides (table scroll, card padding) |

**No page changes needed** — Ant Design's Table/Card/Grid components handle overflow natively. The Layout is the only thing fundamentally broken on mobile.

---

## Task 1: Create useBreakpoint Hook

**Files:**
- Create: `frontend/src/hooks/useBreakpoint.ts`

- [ ] **Step 1.1: Create the hook file**

```typescript
import { useState, useEffect } from 'react';
import { breakpoints } from '../theme';

export function useBreakpoint() {
  const [isMobile, setIsMobile] = useState(
    () => typeof window !== 'undefined' && window.innerWidth < breakpoints.mobile
  );

  useEffect(() => {
    const mql = window.matchMedia(`(max-width: ${breakpoints.mobile - 1}px)`);
    const handler = (e: MediaQueryListEvent) => setIsMobile(e.matches);
    setIsMobile(mql.matches);
    mql.addEventListener('change', handler);
    return () => mql.removeEventListener('change', handler);
  }, []);

  return { isMobile };
}
```

- [ ] **Step 1.2: Commit**

```bash
git add frontend/src/hooks/useBreakpoint.ts
git commit -m "feat: add useBreakpoint hook for mobile detection"
```

---

## Task 2: Mobile Layout — Drawer Navigation

**Files:**
- Modify: `frontend/src/components/Layout.tsx`

This is the core change. On mobile, the fixed Sider becomes an Ant Design Drawer that opens/closes via hamburger button. On desktop, behavior is unchanged.

- [ ] **Step 2.1: Rewrite Layout.tsx for mobile-first**

Replace the entire file with:

```typescript
import React, { useState, useEffect } from 'react';
import { Layout as AntLayout, Menu, Button, Dropdown, Avatar, Typography, Drawer } from 'antd';
import {
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  UserOutlined,
  LogoutOutlined,
  CloseOutlined,
} from '@ant-design/icons';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { NAV_ITEMS } from '../config/navConfig';
import { layout } from '../theme';
import { useBreakpoint } from '../hooks/useBreakpoint';
import './Layout.css';

const { Header, Sider, Content } = AntLayout;
const { Text } = Typography;

interface LayoutProps {
  children: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ children }) => {
  const [collapsed, setCollapsed] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuthStore();
  const { isMobile } = useBreakpoint();

  // Close drawer on route change
  useEffect(() => {
    setDrawerOpen(false);
  }, [location.pathname]);

  // Auto-collapse sidebar when switching to mobile
  useEffect(() => {
    if (isMobile) setCollapsed(true);
  }, [isMobile]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const menuItems = NAV_ITEMS.filter(item =>
    user?.role && item.roles.includes(user.role)
  ).map(item => ({
    key: item.key,
    icon: item.icon,
    label: item.label,
    onClick: () => navigate(item.key),
  }));

  const userMenuItems = [
    {
      key: 'profile',
      icon: <UserOutlined />,
      label: 'Profil',
      onClick: () => navigate('/profile'),
    },
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: 'Keluar',
      danger: true,
      onClick: handleLogout,
    },
  ];

  const siderMenu = (
    <>
      <div className="logo-container">
        <Text
          strong
          className={`logo-text ${isMobile || !collapsed ? 'logo-text-expanded' : 'logo-text-collapsed'}`}
        >
          {!isMobile && collapsed ? 'E-EV' : 'E-EVKIN'}
        </Text>
      </div>
      <Menu
        theme="dark"
        mode="inline"
        selectedKeys={[location.pathname]}
        items={menuItems}
      />
    </>
  );

  // ── Mobile layout: Drawer ──
  if (isMobile) {
    return (
      <AntLayout className="layout-container">
        <Drawer
          placement="left"
          open={drawerOpen}
          onClose={() => setDrawerOpen(false)}
          width={260}
          closable={false}
          className="mobile-drawer"
          styles={{
            body: { padding: 0, background: layout.siderBg || '#094D7A' },
            header: { display: 'none' },
          }}
        >
          <div className="drawer-close-row">
            <Button
              type="text"
              icon={<CloseOutlined />}
              onClick={() => setDrawerOpen(false)}
              className="drawer-close-btn"
            />
          </div>
          {siderMenu}
        </Drawer>

        <AntLayout className="layout-content-wrapper mobile">
          <Header className="layout-header mobile-header">
            <Button
              type="text"
              icon={<MenuUnfoldOutlined />}
              onClick={() => setDrawerOpen(true)}
              className="trigger-button"
            />
            <Dropdown menu={{ items: userMenuItems }} placement="bottomRight">
              <div className="user-profile">
                <Avatar icon={<UserOutlined />} size="small" />
                <div className="user-info mobile-user-info">
                  <Text strong className="user-name-text">{user?.nama}</Text>
                </div>
              </div>
            </Dropdown>
          </Header>
          <Content className="layout-content mobile-content">
            {children}
          </Content>
        </AntLayout>
      </AntLayout>
    );
  }

  // ── Desktop layout: Fixed Sider ──
  return (
    <AntLayout className="layout-container">
      <Sider
        trigger={null}
        collapsible
        collapsed={collapsed}
        width={layout.siderWidth}
        collapsedWidth={layout.siderCollapsedWidth}
        className="layout-sider"
      >
        {siderMenu}
      </Sider>
      <AntLayout
        className="layout-content-wrapper"
        style={{ marginLeft: collapsed ? layout.siderCollapsedWidth : layout.siderWidth }}
      >
        <Header className="layout-header">
          <Button
            type="text"
            icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
            onClick={() => setCollapsed(!collapsed)}
            className="trigger-button"
          />
          <Dropdown menu={{ items: userMenuItems }} placement="bottomRight">
            <div className="user-profile">
              <Avatar icon={<UserOutlined />} style={{ marginRight: 8 }} />
              <div className="user-info">
                <Text strong>{user?.nama}</Text>
                <Text type="secondary" className="user-role-text">
                  {user?.role === 'admin' ? 'Administrator' : (user?.nama_puskesmas || 'Puskesmas')}
                </Text>
              </div>
            </div>
          </Dropdown>
        </Header>
        <Content className="layout-content">
          {children}
        </Content>
      </AntLayout>
    </AntLayout>
  );
};
```

- [ ] **Step 2.2: Commit**

```bash
git add frontend/src/components/Layout.tsx
git commit -m "feat: mobile-first layout with Drawer navigation on mobile"
```

---

## Task 3: Mobile Layout CSS

**Files:**
- Modify: `frontend/src/components/Layout.css`

- [ ] **Step 3.1: Rewrite Layout.css for mobile-first**

Replace the entire file with:

```css
/* ===================================
   LAYOUT — Mobile-First
   Desktop overrides at @media (min-width: 768px)
   =================================== */

.layout-container {
  min-height: 100vh;
}

/* ── Mobile Drawer ── */
.mobile-drawer .ant-drawer-body {
  background: var(--color-primary-dark) !important;
}

.drawer-close-row {
  display: flex;
  justify-content: flex-end;
  padding: 12px 16px 0;
}

.drawer-close-btn {
  color: rgba(255, 255, 255, 0.65) !important;
  font-size: 18px !important;
}

.drawer-close-btn:hover {
  color: #fff !important;
}

/* ── Logo ── */
.logo-container {
  height: 64px;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 16px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
}

.logo-text {
  color: #fff !important;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  transition: font-size var(--transition);
  letter-spacing: 0.5px;
}

.logo-text-collapsed {
  font-size: 16px;
}

.logo-text-expanded {
  font-size: 20px;
}

/* ── Desktop Sider (hidden on mobile via Layout.tsx conditional) ── */
.layout-sider {
  height: 100vh;
  position: fixed !important;
  left: 0;
  top: 0;
  bottom: 0;
  overflow: auto;
  z-index: 100;
}

/* ── Content wrapper ── */
.layout-content-wrapper {
  transition: margin-left var(--transition);
}

.layout-content-wrapper.mobile {
  margin-left: 0 !important;
}

/* ── Header ── */
.layout-header {
  padding: 0 12px;
  background: var(--bg-card) !important;
  display: flex;
  align-items: center;
  justify-content: space-between;
  box-shadow: var(--shadow-sm);
  position: sticky;
  top: 0;
  z-index: 99;
}

.trigger-button {
  font-size: 16px !important;
  width: 48px !important;
  height: 48px !important;
}

/* ── User Profile ── */
.user-profile {
  display: flex;
  align-items: center;
  cursor: pointer;
  padding: 4px 8px;
  border-radius: var(--radius);
  transition: background-color var(--transition);
}

.user-profile:hover {
  background-color: rgba(0, 0, 0, 0.04);
}

.user-info {
  display: flex;
  flex-direction: column;
}

.mobile-user-info {
  margin-left: 8px;
}

.user-name-text {
  font-size: 13px;
  max-width: 120px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.user-role-text {
  font-size: 12px !important;
}

/* ── Content ── */
.layout-content {
  margin: 12px 8px;
  padding: 16px;
  min-height: 280px;
  background: var(--bg-card);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-sm);
}

/* ── Desktop overrides ── */
@media (min-width: 768px) {
  .layout-header {
    padding: 0 24px;
  }

  .trigger-button {
    width: 64px !important;
    height: 64px !important;
  }

  .layout-content {
    margin: 24px 16px;
    padding: 24px;
  }

  .user-info {
    margin-left: 0;
  }
}
```

- [ ] **Step 3.2: Commit**

```bash
git add frontend/src/components/Layout.css
git commit -m "feat: mobile-first Layout.css with drawer and full-width content"
```

---

## Task 4: Global Mobile Overrides

**Files:**
- Modify: `frontend/src/index.css`

Add global rules so Ant Design tables scroll horizontally on mobile and cards have tighter padding.

- [ ] **Step 4.1: Add mobile overrides to index.css**

Append at the end of `frontend/src/index.css`, before the closing of the file:

```css
/* ===================================
   MOBILE-FIRST GLOBAL OVERRIDES
   =================================== */

/* Tables: horizontal scroll on mobile */
.ant-table-wrapper {
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
}

/* Cards: tighter padding on mobile */
@media (max-width: 767px) {
  .ant-card-body {
    padding: 12px !important;
  }

  .ant-modal {
    max-width: calc(100vw - 16px) !important;
    margin: 8px auto !important;
  }

  .ant-modal .ant-modal-body {
    padding: 16px !important;
    max-height: 70vh;
    overflow-y: auto;
  }

  /* Stat cards: smaller on mobile */
  .ant-statistic-title {
    font-size: 12px !important;
  }

  .ant-statistic-content-value {
    font-size: 20px !important;
  }

  /* Select: full width on mobile */
  .ant-select {
    min-width: unset !important;
  }

  /* Space: tighter on mobile */
  .ant-space-gap-middle {
    gap: 8px !important;
  }

  /* Table: smaller font on mobile */
  .ant-table {
    font-size: 12px;
  }

  .ant-table-cell {
    padding: 8px 8px !important;
  }
}
```

- [ ] **Step 4.2: Commit**

```bash
git add frontend/src/index.css
git commit -m "feat: global mobile overrides for tables, cards, modals"
```

---

## Task 5: Build, Test, Deploy

**Files:**
- `frontend/dist/` (build output)

- [ ] **Step 5.1: Build frontend**

```bash
cd frontend && npx vite build
```

Expected: Clean build, no errors.

- [ ] **Step 5.2: Commit build**

```bash
git add frontend/dist
git commit -m "chore: build frontend with mobile-first layout"
```

- [ ] **Step 5.3: Push and deploy to production**

```bash
git push origin rebranding
```

Deploy on production server:

```bash
sshpass -p 'M4rw1y4hmama!' ssh -o StrictHostKeyChecking=no root@192.168.102.123 << 'DEPLOY'
cd /root/e-evkin-modern
git pull origin rebranding

# Copy frontend dist to nginx root
rm -rf /www/wwwroot/e-evkin-modern/frontend/dist
cp -r frontend/dist /www/wwwroot/e-evkin-modern/frontend/dist

echo "Frontend deployed"
DEPLOY
```

- [ ] **Step 5.4: Test mobile on production**

Use Chrome DevTools mobile emulation or actual mobile device:

1. Open `https://e-evkindinkes.bogorkab.go.id` on mobile viewport (375px width)
2. Verify: Page loads full-width, no sidebar visible
3. Tap hamburger icon → Drawer opens from left with menu
4. Tap a menu item → Drawer closes, page navigates
5. Verify: Tables scroll horizontally on mobile
6. Verify: Cards have 12px padding on mobile
7. Verify: Modals don't overflow viewport
8. Verify: Desktop layout unchanged (>768px) — sidebar still works as before

---

## Summary

| Task | What It Does | Files |
|------|-------------|-------|
| 1 | `useBreakpoint` hook | 1 new file |
| 2 | Layout.tsx: Drawer on mobile, Sider on desktop | 1 modified |
| 3 | Layout.css: Mobile-first, desktop overrides | 1 modified |
| 4 | Global CSS: Table scroll, card/modal/table sizing | 1 modified |
| 5 | Build + deploy + test | Deploy |

**Total: 1 new file, 3 modified files.** No page component changes needed.
