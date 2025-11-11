import React, { useState } from 'react';
import { Layout as AntLayout, Menu, Button, Dropdown, Avatar, Typography } from 'antd';
import {
  DashboardOutlined,
  FileTextOutlined,
  BarChartOutlined,
  SettingOutlined,
  LogoutOutlined,
  UserOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  QuestionCircleOutlined,
  TeamOutlined,
  AppstoreOutlined,
} from '@ant-design/icons';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';

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

  const menuItems = [];

  // Different menus for puskesmas vs admin
  if (user?.role === 'puskesmas') {
    menuItems.push(
      {
        key: '/laporan',
        icon: <FileTextOutlined />,
        label: 'Laporan Kinerja',
        onClick: () => navigate('/laporan'),
      },
      {
        key: '/cara-pengisian',
        icon: <QuestionCircleOutlined />,
        label: 'Cara Pengisian',
        onClick: () => navigate('/cara-pengisian'),
      }
    );
  }

  if (user?.role === 'admin') {
    menuItems.push(
      {
        key: '/dashboard',
        icon: <DashboardOutlined />,
        label: 'Dashboard',
        onClick: () => navigate('/dashboard'),
      },
      {
        key: '/admin/laporan-sub-kegiatan',
        icon: <BarChartOutlined />,
        label: 'Laporan Per Sub Kegiatan',
        onClick: () => navigate('/admin/laporan-sub-kegiatan'),
      },
      {
        key: '/admin/laporan-sumber-anggaran',
        icon: <BarChartOutlined />,
        label: 'Laporan Per Sumber Anggaran',
        onClick: () => navigate('/admin/laporan-sumber-anggaran'),
      },
      {
        key: '/admin/puskesmas',
        icon: <TeamOutlined />,
        label: 'Daftar Puskesmas',
        onClick: () => navigate('/admin/puskesmas'),
      },
      {
        key: '/admin/kegiatan',
        icon: <AppstoreOutlined />,
        label: 'Kegiatan',
        onClick: () => navigate('/admin/kegiatan'),
      },
      {
        key: '/admin/puskesmas-config',
        icon: <AppstoreOutlined />,
        label: 'Konfigurasi Sub Kegiatan',
        onClick: () => navigate('/admin/puskesmas-config'),
      },
      {
        key: '/admin/master-data',
        icon: <SettingOutlined />,
        label: 'Master Data',
        onClick: () => navigate('/admin/master-data'),
      }
    );
  }

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
    <AntLayout style={{ minHeight: '100vh' }}>
      <Sider
        trigger={null}
        collapsible
        collapsed={collapsed}
        style={{
          overflow: 'auto',
          height: '100vh',
          position: 'fixed',
          left: 0,
          top: 0,
          bottom: 0,
        }}
      >
        <div
          style={{
            height: 64,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '16px',
          }}
        >
          <Text
            strong
            style={{
              color: '#fff',
              fontSize: collapsed ? 16 : 20,
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
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
      <AntLayout style={{ marginLeft: collapsed ? 80 : 200 }}>
        <Header
          style={{
            padding: '0 24px',
            background: '#fff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            boxShadow: '0 1px 4px rgba(0,21,41,.08)',
          }}
        >
          <Button
            type="text"
            icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
            onClick={() => setCollapsed(!collapsed)}
            style={{
              fontSize: '16px',
              width: 64,
              height: 64,
            }}
          />
          <Dropdown
            menu={{
              items: userMenuItems,
            }}
            placement="bottomRight"
          >
            <div style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
              <Avatar icon={<UserOutlined />} style={{ marginRight: 8 }} />
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <Text strong>{user?.nama}</Text>
                <Text type="secondary" style={{ fontSize: 12 }}>
                  {user?.role === 'admin' ? 'Administrator' : user?.kode_puskesmas}
                </Text>
              </div>
            </div>
          </Dropdown>
        </Header>
        <Content
          style={{
            margin: '24px 16px',
            padding: 24,
            minHeight: 280,
            background: '#fff',
            borderRadius: 8,
          }}
        >
          {children}
        </Content>
      </AntLayout>
    </AntLayout>
  );
};
