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
import { layout, brand } from '../theme';
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
            body: { padding: 0, background: brand.primaryDark },
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
          <Header className="layout-header">
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
          <Content className="layout-content">
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
