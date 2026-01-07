import {
    DashboardOutlined,
    FileTextOutlined,
    BarChartOutlined,
    SettingOutlined,
    TeamOutlined,
    AppstoreOutlined,
    AimOutlined,
    DollarOutlined,
    FilePdfOutlined,
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
        key: '/target-kinerja',
        icon: <AimOutlined />,
        label: 'Target Kinerja',
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
        key: '/admin/laporan-sub-kegiatan',
        icon: <BarChartOutlined />,
        label: 'Laporan Per Sub Kegiatan',
        roles: ['admin'],
    },
    {
        key: '/admin/laporan-sumber-anggaran',
        icon: <BarChartOutlined />,
        label: 'Laporan Per Sumber Anggaran',
        roles: ['admin'],
    },
    {
        key: '/admin/puskesmas',
        icon: <TeamOutlined />,
        label: 'Daftar Puskesmas',
        roles: ['admin'],
    },
    {
        key: '/admin/kegiatan',
        icon: <AppstoreOutlined />,
        label: 'Kegiatan',
        roles: ['admin'],
    },
    {
        key: '/admin/puskesmas-config',
        icon: <AppstoreOutlined />,
        label: 'Konfigurasi Sub Kegiatan',
        roles: ['admin'],
    },
    {
        key: '/admin/target',
        icon: <DollarOutlined />,
        label: 'Target Anggaran',
        roles: ['admin'],
    },
    {
        key: '/admin/target-kinerja',
        icon: <AimOutlined />,
        label: 'Target Kinerja',
        roles: ['admin'],
    },
    {
        key: '/admin/angkas',
        icon: <FilePdfOutlined />,
        label: 'Target Angkas',
        roles: ['admin'],
    },
    {
        key: '/admin/master-data',
        icon: <SettingOutlined />,
        label: 'Master Data',
        roles: ['admin'],
    },
];
