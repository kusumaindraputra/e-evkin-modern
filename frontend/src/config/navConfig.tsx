import {
    DashboardOutlined,
    FileTextOutlined,
    BarChartOutlined,
    SettingOutlined,
    TeamOutlined,
    AppstoreOutlined,
    AimOutlined,
    UploadOutlined,
    EditOutlined,
    QuestionCircleOutlined,
} from '@ant-design/icons';
import React from 'react';

export interface NavItem {
    key: string;
    icon: React.ReactNode;
    label: string;
    roles: string[];
}

export const NAV_ITEMS: NavItem[] = [
    // Puskesmas Items
    {
        key: '/laporan',
        icon: <FileTextOutlined />,
        label: 'Laporan Kinerja',
        roles: ['puskesmas'],
    },
    {
        key: '/target',
        icon: <AimOutlined />,
        label: 'Target & Angkas',
        roles: ['puskesmas'],
    },
    {
        key: '/cara-pengisian',
        icon: <QuestionCircleOutlined />,
        label: 'Cara Pengisian',
        roles: ['puskesmas'],
    },

    // Admin Items
    {
        key: '/dashboard',
        icon: <DashboardOutlined />,
        label: 'Dashboard',
        roles: ['admin'],
    },
    {
        key: '/admin/laporan',
        icon: <BarChartOutlined />,
        label: 'Laporan Kinerja',
        roles: ['admin'],
    },
    {
        key: '/admin/puskesmas',
        icon: <TeamOutlined />,
        label: 'Daftar Puskesmas',
        roles: ['admin'],
    },
    {
        key: '/admin/puskesmas-config',
        icon: <AppstoreOutlined />,
        label: 'Konfigurasi Sub Kegiatan',
        roles: ['admin'],
    },
    // NEW: Consolidated Target & Angkas
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
        key: '/admin/master-data',
        icon: <SettingOutlined />,
        label: 'Master Data',
        roles: ['admin'],
    },
];
