import React, { useEffect, useState } from 'react';
import { Row, Col, Card, Statistic, Typography, Progress, Space, Spin, Select } from 'antd';
import {
  CheckCircleOutlined,
  ClockCircleOutlined,
  BarChartOutlined,
  DollarOutlined,
} from '@ant-design/icons';
import { useAuthStore } from '../store/authStore';
import axios from 'axios';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
} from 'recharts';

const { Title, Text } = Typography;

interface BudgetData {
  bulan: string;
  target_rp: number;
  realisasi_rp: number;
  persentase: number;
}

interface MonthlyBudgetData {
  sub_kegiatan: string;
  kegiatan: string;
  target_rp: number;
  realisasi_rp: number;
  persentase: number;
}

interface Top10AbsorptionData {
  puskesmas: string;
  target_rp: number;
  realisasi_rp: number;
  persentase: number;
}

interface DashboardStats {
  totalLaporan: number;
  tersimpan: number;
  terkirim: number;
  totalPuskesmas: number;
  puskesmasReporting: number;
  persentasePuskesmasReporting: number;
}

export const DashboardPage: React.FC = () => {
  const { user, token } = useAuthStore();
  const [budgetData, setBudgetData] = useState<BudgetData[]>([]);
  const [monthlyBudgetData, setMonthlyBudgetData] = useState<MonthlyBudgetData[]>([]);
  const [top10Data, setTop10Data] = useState<Top10AbsorptionData[]>([]);
  const [stats, setStats] = useState<DashboardStats>({
    totalLaporan: 0,
    tersimpan: 0,
    terkirim: 0,
    totalPuskesmas: 0,
    puskesmasReporting: 0,
    persentasePuskesmasReporting: 0,
  });
  const [loadingBudget, setLoadingBudget] = useState(false);
  const [loadingMonthly, setLoadingMonthly] = useState(false);
  const [loadingTop10, setLoadingTop10] = useState(false);
  const [loadingStats, setLoadingStats] = useState(false);
  const [totalStats, setTotalStats] = useState({
    totalTarget: 0,
    totalRealisasi: 0,
    persentaseRealisasi: 0,
  });

  // Filter states
  const currentDate = new Date();
  const [selectedYear, setSelectedYear] = useState(currentDate.getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(
    currentDate.toLocaleString('id-ID', { month: 'long' })
  );
  
  // Filter for stats
  const [statsYear, setStatsYear] = useState(currentDate.getFullYear());
  const [statsMonth, setStatsMonth] = useState(
    currentDate.toLocaleString('id-ID', { month: 'long' })
  );

  // Filter for top 10
  const [top10Year, setTop10Year] = useState(currentDate.getFullYear());
  const [top10Month, setTop10Month] = useState(
    currentDate.toLocaleString('id-ID', { month: 'long' })
  );

  const months = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
  ];

  const years = Array.from({ length: 5 }, (_, i) => currentDate.getFullYear() - i);

  useEffect(() => {
    if (user?.role === 'admin') {
      fetchBudgetData();
      fetchDashboardStats();
      fetchMonthlyBudget();
      fetchTop10Absorption();
    }
  }, [user]);

  useEffect(() => {
    if (user?.role === 'admin') {
      fetchMonthlyBudget();
    }
  }, [selectedYear, selectedMonth]);

  useEffect(() => {
    if (user?.role === 'admin') {
      fetchTop10Absorption();
    }
  }, [top10Year, top10Month]);

  useEffect(() => {
    if (user?.role === 'admin') {
      fetchDashboardStats();
    }
  }, [statsYear, statsMonth]);

  const fetchBudgetData = async () => {
    setLoadingBudget(true);
    try {
      const currentYear = new Date().getFullYear();
      
      // Fetch data realisasi anggaran per bulan
      const response = await axios.get(
        `http://localhost:5000/api/admin/dashboard/budget-ytd?tahun=${currentYear}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      const data = response.data.data || [];
      
      // Debug: log data untuk melihat nilai sebenarnya
      console.log('YTD Budget Data (raw):', data);
      
      // Ensure data types are numbers
      const processedData = data.map((item: any) => ({
        ...item,
        target_rp: Number(item.target_rp) || 0,
        realisasi_rp: Number(item.realisasi_rp) || 0,
        persentase: Number(item.persentase) || 0
      }));
      
      console.log('YTD Budget Data (processed):', processedData);
      
      setBudgetData(processedData);

      // Hitung total
      const totalTarget = processedData.reduce((sum: number, item: BudgetData) => sum + Number(item.target_rp || 0), 0);
      const totalRealisasi = processedData.reduce((sum: number, item: BudgetData) => sum + Number(item.realisasi_rp || 0), 0);
      const persentase = totalTarget > 0 ? (totalRealisasi / totalTarget) * 100 : 0;

      setTotalStats({
        totalTarget,
        totalRealisasi,
        persentaseRealisasi: Math.round(persentase * 100) / 100,
      });
    } catch (error) {
      console.error('Error fetching budget data:', error);
    } finally {
      setLoadingBudget(false);
    }
  };

  const fetchDashboardStats = async () => {
    setLoadingStats(true);
    try {
      // Fetch dashboard statistics with month and year filter
      const response = await axios.get(
        `http://localhost:5000/api/admin/dashboard/stats?tahun=${statsYear}&bulan=${statsMonth}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      setStats(response.data.data);
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
    } finally {
      setLoadingStats(false);
    }
  };

  const fetchMonthlyBudget = async () => {
    setLoadingMonthly(true);
    try {
      // Fetch monthly budget data
      const response = await axios.get(
        `http://localhost:5000/api/admin/dashboard/budget-monthly?tahun=${selectedYear}&bulan=${selectedMonth}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      setMonthlyBudgetData(response.data.data || []);
    } catch (error) {
      console.error('Error fetching monthly budget:', error);
    } finally {
      setLoadingMonthly(false);
    }
  };

  const fetchTop10Absorption = async () => {
    setLoadingTop10(true);
    try {
      // Fetch top 10 absorption data
      const response = await axios.get(
        `http://localhost:5000/api/admin/dashboard/top-10-absorption?tahun=${top10Year}&bulan=${top10Month}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      setTop10Data(response.data.data || []);
    } catch (error) {
      console.error('Error fetching top 10 absorption:', error);
    } finally {
      setLoadingTop10(false);
    }
  };

  const formatRupiah = (value: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(value);
  };

  const formatRupiahShort = (value: number) => {
    if (value >= 1000000000) {
      return `Rp ${(value / 1000000000).toFixed(1)}M`;
    } else if (value >= 1000000) {
      return `Rp ${(value / 1000000).toFixed(1)}Jt`;
    } else if (value >= 1000) {
      return `Rp ${(value / 1000).toFixed(1)}Rb`;
    }
    return formatRupiah(value);
  };

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
        <Col span={24}>
          <Card 
            title="Statistik Laporan"
            extra={
              <Space>
                <Select
                  value={statsMonth}
                  onChange={setStatsMonth}
                  style={{ width: 120 }}
                >
                  {months.map(month => (
                    <Select.Option key={month} value={month}>{month}</Select.Option>
                  ))}
                </Select>
                <Select
                  value={statsYear}
                  onChange={setStatsYear}
                  style={{ width: 90 }}
                >
                  {years.map(year => (
                    <Select.Option key={year} value={year}>{year}</Select.Option>
                  ))}
                </Select>
              </Space>
            }
          >
            <Row gutter={[16, 16]}>
              <Col xs={24} sm={8}>
                <Card loading={loadingStats} bordered={false}>
                  <Statistic
                    title="Total Laporan Terkirim"
                    value={stats.terkirim}
                    prefix={<CheckCircleOutlined />}
                    valueStyle={{ color: '#52c41a' }}
                  />
                </Card>
              </Col>
              <Col xs={24} sm={8}>
                <Card loading={loadingStats} bordered={false}>
                  <Statistic
                    title="Laporan Tersimpan (Draft)"
                    value={stats.tersimpan}
                    prefix={<ClockCircleOutlined />}
                    valueStyle={{ color: '#faad14' }}
                  />
                </Card>
              </Col>
              <Col xs={24} sm={8}>
                <Card loading={loadingStats} bordered={false}>
                  <Statistic
                    title="Puskesmas Melaporkan"
                    value={stats.puskesmasReporting}
                    prefix={<BarChartOutlined />}
                    suffix={`/ ${stats.totalPuskesmas}`}
                    valueStyle={{ color: '#722ed1' }}
                  />
                  <Progress 
                    percent={stats.persentasePuskesmasReporting} 
                    status="active" 
                    strokeColor="#722ed1"
                    style={{ marginTop: 8 }}
                  />
                </Card>
              </Col>
            </Row>
          </Card>
        </Col>
      </Row>

      {/* Budget Year to Date - Admin Only */}
      {user?.role === 'admin' && (
        <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
          <Col xs={24} md={8}>
            <Card>
              <Statistic
                title="Total Target Anggaran YTD"
                value={totalStats.totalTarget}
                prefix={<DollarOutlined />}
                valueStyle={{ color: '#1890ff' }}
                formatter={(value) => formatRupiah(value as number)}
              />
            </Card>
          </Col>
          <Col xs={24} md={8}>
            <Card>
              <Statistic
                title="Total Realisasi Anggaran YTD"
                value={totalStats.totalRealisasi}
                prefix={<DollarOutlined />}
                valueStyle={{ color: '#52c41a' }}
                formatter={(value) => formatRupiah(value as number)}
              />
            </Card>
          </Col>
          <Col xs={24} md={8}>
            <Card>
              <Statistic
                title="Persentase Realisasi"
                value={totalStats.persentaseRealisasi}
                prefix={<BarChartOutlined />}
                suffix="%"
                precision={2}
                valueStyle={{ 
                  color: totalStats.persentaseRealisasi >= 80 ? '#52c41a' : 
                         totalStats.persentaseRealisasi >= 60 ? '#faad14' : '#ff4d4f' 
                }}
              />
            </Card>
          </Col>
        </Row>
      )}

      <Row gutter={[16, 16]}>
        {/* Budget Chart YTD - Admin Only */}
        {user?.role === 'admin' && (
          <Col xs={24}>
            <Card title="Grafik Realisasi Anggaran Year to Date" bordered={false}>
              {loadingBudget ? (
                <div style={{ height: 500, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Spin size="large" />
                </div>
              ) : budgetData.length > 0 ? (
                <ResponsiveContainer width="100%" height={500}>
                  <LineChart data={budgetData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="bulan" />
                    <YAxis 
                      tickFormatter={(value) => formatRupiahShort(value)}
                    />
                    <Tooltip 
                      formatter={(value: number) => formatRupiah(value)}
                      labelStyle={{ color: '#000' }}
                    />
                    <Legend />
                    <Line 
                      type="monotone" 
                      dataKey="target_rp" 
                      name="Target (Rp)" 
                      stroke="#1890ff" 
                      strokeWidth={2}
                      dot={{ fill: '#1890ff', r: 5 }}
                      activeDot={{ r: 8 }}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="realisasi_rp" 
                      name="Realisasi (Rp)" 
                      stroke="#52c41a" 
                      strokeWidth={2}
                      dot={{ fill: '#52c41a', r: 5 }}
                      activeDot={{ r: 8 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div style={{ height: 500, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Text type="secondary">Tidak ada data realisasi anggaran</Text>
                </div>
              )}
            </Card>
          </Col>
        )}

        {/* Top 10 Penyerapan Anggaran - Admin Only */}
        {user?.role === 'admin' && (
          <Col xs={24}>
            <Card 
              title="Top 10 Puskesmas - Penyerapan Anggaran Tertinggi"
              bordered={false}
              extra={
                <Space>
                  <Select
                    value={top10Month}
                    onChange={setTop10Month}
                    style={{ width: 120 }}
                    size="small"
                  >
                    {months.map(month => (
                      <Select.Option key={month} value={month}>{month}</Select.Option>
                    ))}
                  </Select>
                  <Select
                    value={top10Year}
                    onChange={setTop10Year}
                    style={{ width: 90 }}
                    size="small"
                  >
                    {years.map(year => (
                      <Select.Option key={year} value={year}>{year}</Select.Option>
                    ))}
                  </Select>
                </Space>
              }
            >
              {loadingTop10 ? (
                <div style={{ height: 400, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Spin size="large" />
                </div>
              ) : top10Data.length > 0 ? (
                <ResponsiveContainer width="100%" height={400}>
                  <BarChart 
                    data={top10Data} 
                    layout="vertical"
                    margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      type="number" 
                      domain={[0, 100]}
                      tickFormatter={(value) => `${value}%`}
                    />
                    <YAxis 
                      type="category" 
                      dataKey="puskesmas" 
                      width={200}
                      tick={{ fontSize: 12 }}
                    />
                    <Tooltip 
                      formatter={(value: number, name: string) => {
                        if (name === 'Penyerapan') return `${value.toFixed(2)}%`;
                        return value;
                      }}
                      labelStyle={{ color: '#000', fontSize: 12 }}
                      contentStyle={{ fontSize: 12 }}
                    />
                    <Legend />
                    <Bar dataKey="persentase" name="Penyerapan" radius={[0, 8, 8, 0]}>
                      {top10Data.map((entry, index) => (
                        <Cell 
                          key={`cell-${index}`} 
                          fill={entry.persentase >= 90 ? '#52c41a' : entry.persentase >= 70 ? '#faad14' : '#ff4d4f'} 
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div style={{ height: 400, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Text type="secondary">Tidak ada data penyerapan anggaran untuk periode ini</Text>
                </div>
              )}
            </Card>
          </Col>
        )}

        {/* Monthly Budget Chart - Admin Only */}
        {user?.role === 'admin' && (
          <Col xs={24}>
            <Card 
              title="Realisasi Anggaran Per Bulan"
              bordered={false}
              extra={
                <Space>
                  <Select
                    value={selectedMonth}
                    onChange={setSelectedMonth}
                    style={{ width: 120 }}
                    size="small"
                  >
                    {months.map(month => (
                      <Select.Option key={month} value={month}>{month}</Select.Option>
                    ))}
                  </Select>
                  <Select
                    value={selectedYear}
                    onChange={setSelectedYear}
                    style={{ width: 90 }}
                    size="small"
                  >
                    {years.map(year => (
                      <Select.Option key={year} value={year}>{year}</Select.Option>
                    ))}
                  </Select>
                </Space>
              }
            >
              {loadingMonthly ? (
                <div style={{ height: 400, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Spin size="large" />
                </div>
              ) : monthlyBudgetData.length > 0 ? (
                <Row gutter={[16, 16]}>
                  {monthlyBudgetData.map((item, index) => (
                    <Col xs={24} sm={12} lg={8} xl={6} key={index}>
                      <Card size="small" style={{ background: '#fafafa', height: '100%' }}>
                        <Text strong style={{ fontSize: 13, display: 'block', marginBottom: 4 }}>
                          {item.sub_kegiatan}
                        </Text>
                        <Text type="secondary" style={{ fontSize: 11, display: 'block', marginBottom: 12 }}>
                          {item.kegiatan}
                        </Text>
                        <Space direction="vertical" style={{ width: '100%' }} size="small">
                          <div>
                            <Text style={{ fontSize: 11 }}>Target: </Text>
                            <Text strong style={{ fontSize: 11 }}>{formatRupiah(item.target_rp)}</Text>
                          </div>
                          <div>
                            <Text style={{ fontSize: 11 }}>Realisasi: </Text>
                            <Text strong style={{ fontSize: 11, color: '#52c41a' }}>
                              {formatRupiah(item.realisasi_rp)}
                            </Text>
                          </div>
                          <Progress 
                            percent={item.persentase} 
                            size="small"
                            strokeColor={
                              item.persentase >= 80 ? '#52c41a' : 
                              item.persentase >= 60 ? '#faad14' : '#ff4d4f'
                            }
                          />
                        </Space>
                      </Card>
                    </Col>
                  ))}
                </Row>
              ) : (
                <div style={{ height: 400, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Text type="secondary">Tidak ada data untuk bulan ini</Text>
                </div>
              )}
            </Card>
          </Col>
        )}

        {/* Performance Chart - Hidden when admin */}
        {user?.role !== 'admin' && (
          <Col xs={24} lg={16}>
            <Card title="Grafik Kinerja Bulanan" bordered={false}>
              <div style={{ height: 300, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Text type="secondary">Grafik akan ditampilkan di sini (Recharts)</Text>
              </div>
            </Card>
          </Col>
        )}
      </Row>
    </div>
  );
};
