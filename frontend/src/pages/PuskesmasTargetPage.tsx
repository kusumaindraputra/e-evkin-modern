import React, { useState } from 'react';
import { Tabs, Typography } from 'antd';
import { AimOutlined, DollarOutlined } from '@ant-design/icons';
import { useSearchParams } from 'react-router-dom';

// Import existing page components as sub-components
import { PuskesmasTargetKinerjaPage as TargetKinerjaContent } from './PuskesmasTargetKinerjaPage';
import { PuskesmasAngkasPage as AngkasContent } from './PuskesmasAngkasPage';

const { Title } = Typography;

/**
 * PuskesmasTargetPage - Consolidated page for Target Kinerja and Angkas Manual
 * 
 * Uses tabs to switch between:
 * 1. Target Kinerja - Edit target_k and id_satuan for assigned sub-kegiatan
 * 2. Angkas Manual - Edit monthly angkas values for sub-kegiatan with multiple sumber anggaran
 */
export const PuskesmasTargetPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialTab = searchParams.get('tab') || 'target-kinerja';
  const [activeTab, setActiveTab] = useState(initialTab);

  const handleTabChange = (key: string) => {
    setActiveTab(key);
    setSearchParams({ tab: key });
  };

  const tabItems = [
    {
      key: 'target-kinerja',
      label: (
        <span>
          <AimOutlined style={{ marginRight: 8 }} />
          Target Kinerja
        </span>
      ),
      children: <TargetKinerjaContent />,
    },
    {
      key: 'angkas',
      label: (
        <span>
          <DollarOutlined style={{ marginRight: 8 }} />
          Angkas Manual
        </span>
      ),
      children: <AngkasContent />,
    },
  ];

  return (
    <div>
      <Title level={2}>Target & Angkas</Title>
      <Tabs
        activeKey={activeTab}
        onChange={handleTabChange}
        items={tabItems}
        size="large"
        type="card"
      />
    </div>
  );
};

export default PuskesmasTargetPage;
