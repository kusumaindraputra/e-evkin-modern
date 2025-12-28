import React, { useState } from 'react';
import '../styles/global.css';
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
  AimOutlined,
  DollarOutlined,
  FilePdfOutlined,
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
        key: '/target-kinerja',
        icon: <AimOutlined />,
        label: 'Target Kinerja',
        onClick: () => navigate('/target-kinerja'),
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
        key: '/admin/target',
        icon: <DollarOutlined />,
        label: 'Target Anggaran',
        onClick: () => navigate('/admin/target'),
      },
      {
        key: '/admin/target-kinerja',
        icon: <AimOutlined />,
        label: 'Target Kinerja',
        onClick: () => navigate('/admin/target-kinerja'),
      },
      {
        key: '/admin/angkas',
        icon: <FilePdfOutlined />,
        label: 'Target Angkas',
        onClick: () => navigate('/admin/angkas'),
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
    <AntLayout className="minh-100vh">
      <Sider
        trigger={null}
        collapsible
        collapsed={collapsed}
        className="overflow-auto minh-100vh fixed left-0 top-0 bottom-0"
      >
        <div className="h-64 flex items-center justify-center p-16">
          <Text
            strong
            className={`text-white ${collapsed ? 'fs-16' : 'fs-20'} nowrap overflow-hidden ellipsis`}
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
      <AntLayout className={collapsed ? 'ml-80' : 'ml-200'}>
        <Header className="px-24 bg-white flex items-center justify-between shadow-header">
          <Button
            type="text"
            icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
            onClick={() => setCollapsed(!collapsed)}
            className="fs-16 w-64 h-64"
          />
          <Dropdown
            menu={{
              items: userMenuItems,
            }}
            placement="bottomRight"
          >
            <div className="flex items-center pointer">
              <Avatar icon={<UserOutlined />} className="mr-8" />
              <div className="flex flex-col">
                <Text strong>{user?.nama}</Text>
                <Text type="secondary" className="fs-12">
                  {user?.role === 'admin' ? 'Administrator' : user?.kode_puskesmas}
                </Text>
              </div>
            </div>
          </Dropdown>
        </Header>
        <Content className="m-24-16 p-24 minh-280 bg-white br-8">
          {children}
        </Content>
      </AntLayout>
    </AntLayout>
  );
};
