import React, { useState } from 'react';
import { Layout as AntLayout, Menu, Button, Dropdown, Avatar, Typography } from 'antd';
import {
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  UserOutlined,
  LogoutOutlined,
} from '@ant-design/icons';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { NAV_ITEMS } from '../config/navConfig';
import { layout } from '../theme';
import './Layout.css';

const { Header, Sider, Content } = AntLayout;
const { Text } = Typography;

interface LayoutProps {
  children: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ children }) => {
  const [collapsed, setCollapsed] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuthStore();

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
        <div className="logo-container">
          <Text
            strong
            className={`logo-text ${collapsed ? 'logo-text-collapsed' : 'logo-text-expanded'}`}
          >
            {collapsed ? 'E-EV' : 'E-EVKIN'}
          </Text>
        </div>
        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[location.pathname]}
          items={menuItems}
        />
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
          <Dropdown
            menu={{
              items: userMenuItems,
            }}
            placement="bottomRight"
          >
            <div className="user-profile">
              <Avatar icon={<UserOutlined />} style={{ marginRight: 8 }} />
              <div className="user-info">
                <Text strong>{user?.nama}</Text>
                <Text type="secondary" className="user-role-text">
                  {user?.role === 'admin' ? 'Administrator' : (user?.nama_puskesmas || user?.kode_puskesmas)}
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
