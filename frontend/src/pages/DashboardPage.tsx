import React, { useEffect, useState } from 'react';
import { Row, Col, Card, Statistic, Typography, Progress, Space, Spin, Select, Modal, Table, Skeleton, Switch, Divider } from 'antd';
import {
  CheckCircleOutlined,
  ClockCircleOutlined,
  BarChartOutlined,
  DollarOutlined,
} from '@ant-design/icons';
import { useAuthStore } from '../store/authStore';
import axios from 'axios';
import API_BASE_URL from '../config/api';
import ChatWidget from '../components/ChatWidget';
import { formatCurrencyWithPrefix, formatCurrencyAbbreviated } from '../utils/formatters';
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

// Skeleton component for chart loading
const ChartSkeleton = ({ height = 400 }: { height?: number }) => (
  <div style={{ height, padding: 20 }}>
    <Skeleton.Input active style={{ width: '100%', height: 20, marginBottom: 20 }} />
    <Skeleton active paragraph={{ rows: 8 }} />
  </div>
);

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

interface Bottom10AbsorptionData {
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

interface PuskesmasSudahLapor {
  user_id: number;
  nama_puskesmas: string;
  tanggal_lapor: string;
}

interface PuskesmasBelumLapor {
  user_id: number;
  nama_puskesmas: string;
}

interface ChartData {
  label: string;
  anggaran: number;
  angkas: number;
  realisasi_anggaran: number;
  realisasi_fisik: number;
}

interface PuskesmasUser {
  id: string;
  nama_puskesmas: string;
}

export const DashboardPage: React.FC = () => {
  const { user, token } = useAuthStore();
  const [monthlyBudgetData, setMonthlyBudgetData] = useState<MonthlyBudgetData[]>([]);
  const [top10Data, setTop10Data] = useState<Top10AbsorptionData[]>([]);
  const [bottom10Data, setBottom10Data] = useState<Bottom10AbsorptionData[]>([]);
  const [stats, setStats] = useState<DashboardStats>({
    totalLaporan: 0,
    tersimpan: 0,
    terkirim: 0,
    totalPuskesmas: 0,
    puskesmasReporting: 0,
    persentasePuskesmasReporting: 0,
  });
  const [loadingMonthly, setLoadingMonthly] = useState(false);
  const [loadingTop10, setLoadingTop10] = useState(false);
  const [loadingBottom10, setLoadingBottom10] = useState(false);
  const [loadingStats, setLoadingStats] = useState(false);
  const [totalStats, setTotalStats] = useState({
    totalTarget: 0,
    totalRealisasi: 0,
    persentaseRealisasi: 0,
  });
  const [showPuskesmasModal, setShowPuskesmasModal] = useState(false);
  const [puskesmasSudahLapor, setPuskesmasSudahLapor] = useState<PuskesmasSudahLapor[]>([]);
  const [puskesmasBelumLapor, setPuskesmasBelumLapor] = useState<PuskesmasBelumLapor[]>([]);
  const [loadingPuskesmasDetails, setLoadingPuskesmasDetails] = useState(false);
  const [sudahLaporPage, setSudahLaporPage] = useState(1);
  const [belumLaporPage, setBelumLaporPage] = useState(1);

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

  // Filter for bottom 10
  const [bottom10Year, setBottom10Year] = useState(currentDate.getFullYear());
  const [bottom10Month, setBottom10Month] = useState(
    currentDate.toLocaleString('id-ID', { month: 'long' })
  );

  // Enhanced chart filter states
  const [chartData, setChartData] = useState<ChartData[]>([]);
  const [loadingChartData, setLoadingChartData] = useState(false);
  const [chartUserId, setChartUserId] = useState<string | null>(null);
  const [chartYear, setChartYear] = useState(currentDate.getFullYear());
  const [chartSumberAnggaran, setChartSumberAnggaran] = useState<number | null>(null);
  const [chartSubKegiatan, setChartSubKegiatan] = useState<number | null>(null);
  const [showAnggaran, setShowAnggaran] = useState(true);
  const [showAngkas, setShowAngkas] = useState(true);
  const [showRealisasiAnggaran, setShowRealisasiAnggaran] = useState(true);
  const [showRealisasiFisik, setShowRealisasiFisik] = useState(true);
  const [puskesmasList, setPuskesmasList] = useState<PuskesmasUser[]>([]);
  const [sumberAnggaranList, setSumberAnggaranList] = useState<{ value: number; label: string }[]>([]);
  const [subKegiatanList, setSubKegiatanList] = useState<{ value: number; label: string }[]>([]);

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
      fetchBottom10Absorption();
      fetchPuskesmasList();
      fetchChartData();
      fetchSumberAnggaranList();
      fetchSubKegiatanList();
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
      fetchBottom10Absorption();
    }
  }, [bottom10Year, bottom10Month]);

  useEffect(() => {
    if (user?.role === 'admin') {
      fetchDashboardStats();
    }
  }, [statsYear, statsMonth]);

  // Fetch chart data when filters change
  useEffect(() => {
    if (user?.role === 'admin') {
      fetchChartData();
    }
  }, [chartYear, chartUserId, chartSumberAnggaran, chartSubKegiatan]);

  const fetchBudgetData = async () => {
    try {
      const currentYear = new Date().getFullYear();

      // Fetch data realisasi anggaran per bulan for total stats
      const response = await axios.get(
        `${API_BASE_URL}/admin/dashboard/budget-ytd?tahun=${currentYear}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      const data = response.data.data || [];

      // Ensure data types are numbers
      const processedData = data.map((item: any) => ({
        ...item,
        target_rp: Number(item.target_rp) || 0,
        realisasi_rp: Number(item.realisasi_rp) || 0,
        persentase: Number(item.persentase) || 0
      }));

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
    }
  };

  const fetchPuskesmasList = async () => {
    try {
      const response = await axios.get(
        `${API_BASE_URL}/users/puskesmas`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      setPuskesmasList(response.data || []);
    } catch (error) {
      console.error('Error fetching puskesmas list:', error);
    }
  };

  const fetchChartData = async () => {
    setLoadingChartData(true);
    try {
      const params = new URLSearchParams({
        tahun: chartYear.toString()
      });

      if (chartUserId) {
        params.append('userId', chartUserId);
      }

      if (chartSumberAnggaran) {
        params.append('sumberAnggaran', chartSumberAnggaran.toString());
      }

      if (chartSubKegiatan) {
        params.append('subKegiatan', chartSubKegiatan.toString());
      }

      const response = await axios.get(
        `${API_BASE_URL}/admin/dashboard/chart-data?${params}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      setChartData(response.data.data || []);
    } catch (error) {
      console.error('Error fetching chart data:', error);
    } finally {
      setLoadingChartData(false);
    }
  };

  const fetchSumberAnggaranList = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/reference/sumber-anggaran`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setSumberAnggaranList((response.data || []).map((item: { value: number; label: string }) => ({
        value: item.value,
        label: item.label
      })));
    } catch (error) {
      console.error('Error fetching sumber anggaran list:', error);
    }
  };

  const fetchSubKegiatanList = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/reference/sub-kegiatan`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setSubKegiatanList((response.data || []).map((item: { value: number; label: string }) => ({
        value: item.value,
        label: item.label
      })));
    } catch (error) {
      console.error('Error fetching sub kegiatan list:', error);
    }
  };

  const fetchDashboardStats = async () => {
    setLoadingStats(true);
    try {
      // Fetch dashboard statistics with month and year filter
      const response = await axios.get(
        `${API_BASE_URL}/admin/dashboard/stats?tahun=${statsYear}&bulan=${statsMonth}`,
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
        `${API_BASE_URL}/admin/dashboard/budget-monthly?tahun=${selectedYear}&bulan=${selectedMonth}`,
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
        `${API_BASE_URL}/admin/dashboard/top-10-absorption?tahun=${top10Year}&bulan=${top10Month}`,
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

  const fetchBottom10Absorption = async () => {
    setLoadingBottom10(true);
    try {
      // Fetch bottom 10 absorption data
      const response = await axios.get(
        `${API_BASE_URL}/admin/dashboard/bottom-10-absorption?tahun=${bottom10Year}&bulan=${bottom10Month}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      setBottom10Data(response.data.data || []);
    } catch (error) {
      console.error('Error fetching bottom 10 absorption:', error);
    } finally {
      setLoadingBottom10(false);
    }
  };

  const fetchPuskesmasReportingDetails = async () => {
    setLoadingPuskesmasDetails(true);
    try {
      const response = await axios.get(
        `${API_BASE_URL}/admin/dashboard/puskesmas-reporting-details?tahun=${statsYear}&bulan=${statsMonth}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      setPuskesmasSudahLapor(response.data.data.sudahLapor || []);
      setPuskesmasBelumLapor(response.data.data.belumLapor || []);
    } catch (error) {
      console.error('Error fetching puskesmas reporting details:', error);
    } finally {
      setLoadingPuskesmasDetails(false);
    }
  };

  const handlePuskesmasCardClick = async () => {
    setShowPuskesmasModal(true);
    await fetchPuskesmasReportingDetails();
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
                <Card loading={loadingStats} variant="borderless">
                  <Statistic
                    title="Total Laporan Terkirim"
                    value={stats.terkirim}
                    prefix={<CheckCircleOutlined />}
                    valueStyle={{ color: '#52c41a' }}
                  />
                </Card>
              </Col>
              <Col xs={24} sm={8}>
                <Card loading={loadingStats} variant="borderless">
                  <Statistic
                    title="Laporan Tersimpan (Draft)"
                    value={stats.tersimpan}
                    prefix={<ClockCircleOutlined />}
                    valueStyle={{ color: '#faad14' }}
                  />
                </Card>
              </Col>
              <Col xs={24} sm={8}>
                <Card
                  loading={loadingStats}
                  variant="borderless"
                  hoverable
                  onClick={handlePuskesmasCardClick}
                  style={{ cursor: 'pointer' }}
                >
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
                formatter={(value) => formatCurrencyWithPrefix(value as number)}
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
                formatter={(value) => formatCurrencyWithPrefix(value as number)}
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
        {/* Budget Chart YTD - Admin Only - Enhanced with Filters */}
        {user?.role === 'admin' && (
          <Col xs={24}>
            <Card
              title="Grafik Realisasi Anggaran"
              variant="borderless"
            >
              {/* Filter Controls */}
              <div style={{ marginBottom: 16 }}>
                <Row gutter={[16, 12]} align="middle">
                  <Col xs={12} sm={6} md={3}>
                    <Text strong style={{ marginRight: 8 }}>Tahun:</Text>
                    <Select
                      value={chartYear}
                      onChange={setChartYear}
                      style={{ width: 90 }}
                      size="small"
                    >
                      {years.map(year => (
                        <Select.Option key={year} value={year}>{year}</Select.Option>
                      ))}
                    </Select>
                  </Col>
                  <Col xs={12} sm={6} md={5}>
                    <Text strong style={{ marginRight: 8 }}>Puskesmas:</Text>
                    <Select
                      value={chartUserId}
                      onChange={setChartUserId}
                      style={{ width: '100%', maxWidth: 200 }}
                      size="small"
                      placeholder="Semua Puskesmas"
                      allowClear
                      showSearch
                      optionFilterProp="children"
                    >
                      {puskesmasList.map(pusk => (
                        <Select.Option key={pusk.id} value={pusk.id}>{pusk.nama_puskesmas}</Select.Option>
                      ))}
                    </Select>
                  </Col>
                  <Col xs={12} sm={6} md={5}>
                    <Text strong style={{ marginRight: 8 }}>Sumber Anggaran:</Text>
                    <Select
                      value={chartSumberAnggaran}
                      onChange={setChartSumberAnggaran}
                      style={{ width: '100%', maxWidth: 200 }}
                      size="small"
                      placeholder="Semua"
                      allowClear
                      showSearch
                      optionFilterProp="children"
                    >
                      {sumberAnggaranList.map(item => (
                        <Select.Option key={item.value} value={item.value}>{item.label}</Select.Option>
                      ))}
                    </Select>
                  </Col>
                  <Col xs={24} sm={12} md={11}>
                    <Text strong style={{ marginRight: 8 }}>Sub Kegiatan:</Text>
                    <Select
                      value={chartSubKegiatan}
                      onChange={setChartSubKegiatan}
                      style={{ width: '100%', maxWidth: 400 }}
                      size="small"
                      placeholder="Semua Sub Kegiatan"
                      allowClear
                      showSearch
                      optionFilterProp="children"
                    >
                      {subKegiatanList.map(item => (
                        <Select.Option key={item.value} value={item.value}>{item.label}</Select.Option>
                      ))}
                    </Select>
                  </Col>
                </Row>

                <Divider style={{ margin: '12px 0' }} />

                <Row gutter={[16, 8]}>
                  <Col>
                    <Text strong style={{ marginRight: 16 }}>Tampilkan Data:</Text>
                  </Col>
                  <Col>
                    <Space wrap size="middle">
                      <Space>
                        <Switch
                          checked={showAnggaran}
                          onChange={setShowAnggaran}
                          size="small"
                          style={{ backgroundColor: showAnggaran ? '#1890ff' : undefined }}
                        />
                        <Text style={{ color: showAnggaran ? '#1890ff' : '#999' }}>Anggaran</Text>
                      </Space>
                      <Space>
                        <Switch
                          checked={showAngkas}
                          onChange={setShowAngkas}
                          size="small"
                          style={{ backgroundColor: showAngkas ? '#722ed1' : undefined }}
                        />
                        <Text style={{ color: showAngkas ? '#722ed1' : '#999' }}>Angkas</Text>
                      </Space>
                      <Space>
                        <Switch
                          checked={showRealisasiAnggaran}
                          onChange={setShowRealisasiAnggaran}
                          size="small"
                          style={{ backgroundColor: showRealisasiAnggaran ? '#52c41a' : undefined }}
                        />
                        <Text style={{ color: showRealisasiAnggaran ? '#52c41a' : '#999' }}>Realisasi Anggaran</Text>
                      </Space>
                      <Space>
                        <Switch
                          checked={showRealisasiFisik}
                          onChange={setShowRealisasiFisik}
                          size="small"
                          style={{ backgroundColor: showRealisasiFisik ? '#fa8c16' : undefined }}
                        />
                        <Text style={{ color: showRealisasiFisik ? '#fa8c16' : '#999' }}>Realisasi Fisik (%)</Text>
                      </Space>
                    </Space>
                  </Col>
                </Row>
              </div>

              {/* Chart */}
              {loadingChartData ? (
                <ChartSkeleton height={500} />
              ) : chartData.length > 0 ? (() => {
                const maxRpValue = Math.max(...chartData.map(d => Math.max(d.anggaran, d.angkas, d.realisasi_anggaran)));
                return (
                <ResponsiveContainer width="100%" height={500}>
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis
                      dataKey="label"
                      angle={0}
                      textAnchor="middle"
                      height={30}
                      interval={0}
                      tick={{ fontSize: 12 }}
                    />
                    <YAxis
                      yAxisId="left"
                      domain={[0, maxRpValue || 'auto']}
                      tickFormatter={(value) => `Rp ${formatCurrencyAbbreviated(value)}`}
                    />
                    <YAxis
                      yAxisId="right"
                      orientation="right"
                      domain={[0, 100]}
                      tickFormatter={(value) => `${value}%`}
                    />
                    <Tooltip
                      formatter={(value: number, name: string) => {
                        if (name === 'Realisasi Fisik (%)') {
                          return `${value.toFixed(2)}%`;
                        }
                        return formatCurrencyWithPrefix(value);
                      }}
                      labelStyle={{ color: '#000' }}
                    />
                    <Legend />
                    {showAnggaran && (
                      <Line
                        yAxisId="left"
                        type="monotone"
                        dataKey="anggaran"
                        name="Target Anggaran (Rp)"
                        stroke="#1890ff"
                        strokeWidth={2}
                        dot={{ fill: '#1890ff', r: 4 }}
                        activeDot={{ r: 6 }}
                      />
                    )}
                    {showAngkas && (
                      <Line
                        yAxisId="left"
                        type="monotone"
                        dataKey="angkas"
                        name="Angkas (Rp)"
                        stroke="#722ed1"
                        strokeWidth={2}
                        dot={{ fill: '#722ed1', r: 4 }}
                        activeDot={{ r: 6 }}
                      />
                    )}
                    {showRealisasiAnggaran && (
                      <Line
                        yAxisId="left"
                        type="monotone"
                        dataKey="realisasi_anggaran"
                        name="Realisasi Anggaran (Rp)"
                        stroke="#52c41a"
                        strokeWidth={2}
                        dot={{ fill: '#52c41a', r: 4 }}
                        activeDot={{ r: 6 }}
                      />
                    )}
                    {showRealisasiFisik && (
                      <Line
                        yAxisId="right"
                        type="monotone"
                        dataKey="realisasi_fisik"
                        name="Realisasi Fisik (%)"
                        stroke="#fa8c16"
                        strokeWidth={2}
                        dot={{ fill: '#fa8c16', r: 4 }}
                        activeDot={{ r: 6 }}
                      />
                    )}
                  </LineChart>
                </ResponsiveContainer>
                );
              })() : (
                <div style={{ height: 500, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Text type="secondary">Tidak ada data untuk periode ini</Text>
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
              variant="borderless"
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
                <ChartSkeleton height={400} />
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

        {/* Bottom 10 Penyerapan Anggaran - Admin Only */}
        {user?.role === 'admin' && (
          <Col xs={24}>
            <Card
              title="Bottom 10 Puskesmas - Penyerapan Anggaran Terendah"
              variant="borderless"
              extra={
                <Space>
                  <Select
                    value={bottom10Month}
                    onChange={setBottom10Month}
                    style={{ width: 120 }}
                    size="small"
                  >
                    {months.map(month => (
                      <Select.Option key={month} value={month}>{month}</Select.Option>
                    ))}
                  </Select>
                  <Select
                    value={bottom10Year}
                    onChange={setBottom10Year}
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
              {loadingBottom10 ? (
                <ChartSkeleton height={400} />
              ) : bottom10Data.length > 0 ? (
                <ResponsiveContainer width="100%" height={400}>
                  <BarChart
                    data={bottom10Data}
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
                      {bottom10Data.map((entry, index) => (
                        <Cell
                          key={`cell-bottom-${index}`}
                          fill={entry.persentase >= 70 ? '#faad14' : entry.persentase >= 50 ? '#fa8c16' : '#ff4d4f'}
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
              variant="borderless"
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
                <ChartSkeleton height={400} />
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
                            <Text strong style={{ fontSize: 11 }}>{formatCurrencyWithPrefix(item.target_rp)}</Text>
                          </div>
                          <div>
                            <Text style={{ fontSize: 11 }}>Realisasi: </Text>
                            <Text strong style={{ fontSize: 11, color: '#52c41a' }}>
                              {formatCurrencyWithPrefix(item.realisasi_rp)}
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
      </Row>

      {/* AI Chat Widget - Di bagian paling bawah */}
      <Row gutter={[16, 16]} style={{ marginTop: 24 }}>
        <Col xs={24}>
          <ChatWidget compact={false} />
        </Col>
      </Row>

      {/* Modal Detail Puskesmas Melaporkan */}
      <Modal
        title={`Detail Puskesmas Melaporkan - ${statsMonth} ${statsYear}`}
        open={showPuskesmasModal}
        onCancel={() => setShowPuskesmasModal(false)}
        footer={null}
        width={900}
      >
        <Spin spinning={loadingPuskesmasDetails}>
          <Space direction="vertical" style={{ width: '100%' }} size="large">
            {/* Puskesmas Sudah Melaporkan */}
            <div>
              <Title level={5} style={{ marginBottom: 12 }}>
                Puskesmas Sudah Melaporkan ({puskesmasSudahLapor.length})
              </Title>
              <Table
                dataSource={puskesmasSudahLapor}
                rowKey="user_id"
                size="small"
                pagination={{
                  pageSize: 10,
                  current: sudahLaporPage,
                  onChange: (page) => setSudahLaporPage(page)
                }}
                columns={[
                  {
                    title: 'No',
                    key: 'no',
                    width: 60,
                    render: (_: any, __: any, index: number) => {
                      return (sudahLaporPage - 1) * 10 + index + 1;
                    },
                  },
                  {
                    title: 'Nama Puskesmas',
                    dataIndex: 'nama_puskesmas',
                    key: 'nama_puskesmas',
                    sorter: (a, b) => a.nama_puskesmas.localeCompare(b.nama_puskesmas),
                  },
                  {
                    title: 'Tanggal Lapor',
                    dataIndex: 'tanggal_lapor',
                    key: 'tanggal_lapor',
                    width: 140,
                    render: (date: string) => {
                      const d = new Date(date);
                      const day = String(d.getDate()).padStart(2, '0');
                      const month = String(d.getMonth() + 1).padStart(2, '0');
                      const year = d.getFullYear();
                      const hour = String(d.getHours()).padStart(2, '0');
                      const minute = String(d.getMinutes()).padStart(2, '0');
                      return `${day}/${month}/${year} ${hour}:${minute}`;
                    },
                    sorter: (a, b) => new Date(a.tanggal_lapor).getTime() - new Date(b.tanggal_lapor).getTime(),
                  },
                ]}
              />
            </div>

            {/* Puskesmas Belum Melaporkan */}
            <div>
              <Title level={5} style={{ marginBottom: 12, color: '#ff4d4f' }}>
                Puskesmas Belum Melaporkan ({puskesmasBelumLapor.length})
              </Title>
              <Table
                dataSource={puskesmasBelumLapor}
                rowKey="user_id"
                size="small"
                pagination={{
                  pageSize: 10,
                  current: belumLaporPage,
                  onChange: (page) => setBelumLaporPage(page)
                }}
                columns={[
                  {
                    title: 'No',
                    key: 'no',
                    width: 60,
                    render: (_: any, __: any, index: number) => {
                      return (belumLaporPage - 1) * 10 + index + 1;
                    },
                  },
                  {
                    title: 'Nama Puskesmas',
                    dataIndex: 'nama_puskesmas',
                    key: 'nama_puskesmas',
                    sorter: (a, b) => a.nama_puskesmas.localeCompare(b.nama_puskesmas),
                  },
                ]}
              />
            </div>
          </Space>
        </Spin>
      </Modal>
    </div>
  );
};


export default DashboardPage;
