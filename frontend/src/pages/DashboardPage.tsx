import React from 'react';
import { Row, Col, Card, Statistic, Typography, Progress, Space } from 'antd';
import {
  FileTextOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  BarChartOutlined,
} from '@ant-design/icons';
import { useAuthStore } from '../store/authStore';

const { Title, Text } = Typography;

export const DashboardPage: React.FC = () => {
  const { user } = useAuthStore();

  // Mock data - will be replaced with real API calls
  const stats = {
    totalLaporan: 156,
    laporanDiverifikasi: 142,
    laporanMenunggu: 14,
    rataRataKinerja: 87.5,
  };

  const recentActivities = [
    { id: 1, text: 'Laporan Januari 2024 diverifikasi', time: '2 jam lalu' },
    { id: 2, text: 'Laporan Desember 2023 dikirim', time: '1 hari lalu' },
    { id: 3, text: 'Update data puskesmas', time: '3 hari lalu' },
  ];

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <Title level={3}>Dashboard</Title>
        <Text type="secondary">
          Selamat datang, {user?.nama}! 👋
        </Text>
      </div>

      {/* Statistics Cards */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Total Laporan"
              value={stats.totalLaporan}
              prefix={<FileTextOutlined />}
              valueStyle={{ color: '#3f8600' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Terverifikasi"
              value={stats.laporanDiverifikasi}
              prefix={<CheckCircleOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Menunggu Verifikasi"
              value={stats.laporanMenunggu}
              prefix={<ClockCircleOutlined />}
              valueStyle={{ color: '#faad14' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Rata-rata Kinerja"
              value={stats.rataRataKinerja}
              prefix={<BarChartOutlined />}
              suffix="%"
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]}>
        {/* Performance Chart */}
        <Col xs={24} lg={16}>
          <Card title="Grafik Kinerja Bulanan" bordered={false}>
            <div style={{ height: 300, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Text type="secondary">Grafik akan ditampilkan di sini (Recharts)</Text>
            </div>
          </Card>
        </Col>

        {/* Recent Activities */}
        <Col xs={24} lg={8}>
          <Card title="Aktivitas Terbaru" bordered={false}>
            <Space direction="vertical" style={{ width: '100%' }}>
              {recentActivities.map((activity) => (
                <div key={activity.id} style={{ padding: '12px 0', borderBottom: '1px solid #f0f0f0' }}>
                  <Text>{activity.text}</Text>
                  <br />
                  <Text type="secondary" style={{ fontSize: 12 }}>
                    {activity.time}
                  </Text>
                </div>
              ))}
            </Space>
          </Card>
        </Col>
      </Row>

      {/* Performance Progress */}
      <Row gutter={[16, 16]} style={{ marginTop: 24 }}>
        <Col span={24}>
          <Card title="Capaian Target Kinerja" bordered={false}>
            <Row gutter={[16, 16]}>
              <Col xs={24} md={12}>
                <div style={{ marginBottom: 16 }}>
                  <Text>Pelayanan Kesehatan</Text>
                  <Progress percent={92} status="active" strokeColor="#52c41a" />
                </div>
                <div style={{ marginBottom: 16 }}>
                  <Text>Promosi Kesehatan</Text>
                  <Progress percent={85} status="active" strokeColor="#1890ff" />
                </div>
              </Col>
              <Col xs={24} md={12}>
                <div style={{ marginBottom: 16 }}>
                  <Text>Pencegahan Penyakit</Text>
                  <Progress percent={88} status="active" strokeColor="#722ed1" />
                </div>
                <div style={{ marginBottom: 16 }}>
                  <Text>Pemberdayaan Masyarakat</Text>
                  <Progress percent={78} status="active" strokeColor="#faad14" />
                </div>
              </Col>
            </Row>
          </Card>
        </Col>
      </Row>
    </div>
  );
};
