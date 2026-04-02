import React, { useEffect, useState, useCallback } from 'react';
import { Row, Col, Card, Statistic, Typography, Progress, Space, Select, Skeleton, Switch, Divider } from 'antd';
import {
  CheckCircleOutlined,
  ClockCircleOutlined,
  FileTextOutlined,
  DollarOutlined,
  BarChartOutlined,
} from '@ant-design/icons';
import { useAuthStore } from '../store/authStore';
import apiClient from '../utils/apiClient';
import { formatCurrencyWithPrefix, formatCurrencyAbbreviated } from '../utils/formatters';
import { brand } from '../theme';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

const { Title, Text } = Typography;

const ChartSkeleton = ({ height = 400 }: { height?: number }) => (
  <div style={{ height, padding: 20 }}>
    <Skeleton.Input active style={{ width: '100%', height: 20, marginBottom: 20 }} />
    <Skeleton active paragraph={{ rows: 8 }} />
  </div>
);

interface PuskesmasStats {
  totalLaporan: number;
  tersimpan: number;
  terkirim: number;
}

interface BudgetMonthlyItem {
  sub_kegiatan: string;
  kegiatan: string;
  target_rp: number;
  realisasi_rp: number;
  persentase: number;
}

interface ChartData {
  label: string;
  anggaran: number;
  angkas: number;
  realisasi_anggaran: number;
  realisasi_fisik: number;
}

const PuskesmasDashboardPage: React.FC = () => {
  const { user } = useAuthStore();
  const currentDate = new Date();

  // Stats
  const [stats, setStats] = useState<PuskesmasStats>({ totalLaporan: 0, tersimpan: 0, terkirim: 0 });
  const [loadingStats, setLoadingStats] = useState(false);
  const [statsYear, setStatsYear] = useState(currentDate.getFullYear());
  const [statsMonth, setStatsMonth] = useState(
    currentDate.toLocaleString('id-ID', { month: 'long' })
  );

  // Budget YTD
  const [totalStats, setTotalStats] = useState({ totalTarget: 0, totalRealisasi: 0, persentaseRealisasi: 0 });

  // Chart
  const [chartData, setChartData] = useState<ChartData[]>([]);
  const [loadingChart, setLoadingChart] = useState(false);
  const [chartYear, setChartYear] = useState(currentDate.getFullYear());
  const [chartSumberAnggaran, setChartSumberAnggaran] = useState<number | null>(null);
  const [chartSubKegiatan, setChartSubKegiatan] = useState<number | null>(null);
  const [showAnggaran, setShowAnggaran] = useState(true);
  const [showAngkas, setShowAngkas] = useState(true);
  const [showRealisasiAnggaran, setShowRealisasiAnggaran] = useState(true);
  const [showRealisasiFisik, setShowRealisasiFisik] = useState(true);
  const [sumberAnggaranList, setSumberAnggaranList] = useState<{ value: number; label: string }[]>([]);
  const [subKegiatanList, setSubKegiatanList] = useState<{ value: number; label: string }[]>([]);

  // Budget monthly
  const [monthlyData, setMonthlyData] = useState<BudgetMonthlyItem[]>([]);
  const [loadingMonthly, setLoadingMonthly] = useState(false);
  const [selectedYear, setSelectedYear] = useState(currentDate.getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(
    currentDate.toLocaleString('id-ID', { month: 'long' })
  );

  const months = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember',
  ];
  const years = Array.from({ length: 5 }, (_, i) => currentDate.getFullYear() - i);

  const fetchStats = useCallback(async () => {
    setLoadingStats(true);
    try {
      const res = await apiClient.get(`/puskesmas/dashboard/stats?tahun=${statsYear}&bulan=${statsMonth}`);
      setStats(res.data.data);
    } catch (e) {
      console.error('Stats error:', e);
    } finally {
      setLoadingStats(false);
    }
  }, [statsYear, statsMonth]);

  const fetchBudgetYTD = useCallback(async () => {
    try {
      const res = await apiClient.get(`/puskesmas/dashboard/budget-ytd?tahun=${currentDate.getFullYear()}`);
      const data = (res.data.data || []).map((d: any) => ({
        ...d,
        target_rp: Number(d.target_rp) || 0,
        realisasi_rp: Number(d.realisasi_rp) || 0,
      }));
      const totalTarget = data.reduce((s: number, d: any) => s + d.target_rp, 0);
      const totalRealisasi = data.reduce((s: number, d: any) => s + d.realisasi_rp, 0);
      setTotalStats({
        totalTarget,
        totalRealisasi,
        persentaseRealisasi: totalTarget > 0 ? Math.round((totalRealisasi / totalTarget) * 100 * 100) / 100 : 0,
      });
    } catch (e) {
      console.error('Budget YTD error:', e);
    }
  }, []);

  const fetchChartData = useCallback(async () => {
    setLoadingChart(true);
    try {
      const params = new URLSearchParams({ tahun: chartYear.toString() });
      if (chartSumberAnggaran) params.append('sumberAnggaran', chartSumberAnggaran.toString());
      if (chartSubKegiatan) params.append('subKegiatan', chartSubKegiatan.toString());
      const res = await apiClient.get(`/puskesmas/dashboard/chart-data?${params}`);
      setChartData(res.data.data || []);
    } catch (e) {
      console.error('Chart error:', e);
    } finally {
      setLoadingChart(false);
    }
  }, [chartYear, chartSumberAnggaran, chartSubKegiatan]);

  const fetchMonthlyBudget = useCallback(async () => {
    setLoadingMonthly(true);
    try {
      const res = await apiClient.get(`/puskesmas/dashboard/budget-monthly?tahun=${selectedYear}&bulan=${selectedMonth}`);
      setMonthlyData(res.data.data || []);
    } catch (e) {
      console.error('Monthly budget error:', e);
    } finally {
      setLoadingMonthly(false);
    }
  }, [selectedYear, selectedMonth]);

  const fetchReferenceData = useCallback(async () => {
    try {
      const [saRes, skRes] = await Promise.all([
        apiClient.get('/reference/sumber-anggaran'),
        apiClient.get('/reference/sub-kegiatan'),
      ]);
      setSumberAnggaranList((saRes.data || []).map((i: any) => ({ value: i.value, label: i.label })));
      setSubKegiatanList((skRes.data || []).map((i: any) => ({ value: i.value, label: i.label })));
    } catch (e) {
      console.error('Reference data error:', e);
    }
  }, []);

  useEffect(() => {
    fetchStats();
    fetchBudgetYTD();
    fetchChartData();
    fetchMonthlyBudget();
    fetchReferenceData();
  }, []);

  useEffect(() => { fetchStats(); }, [statsYear, statsMonth]);
  useEffect(() => { fetchChartData(); }, [chartYear, chartSumberAnggaran, chartSubKegiatan]);
  useEffect(() => { fetchMonthlyBudget(); }, [selectedYear, selectedMonth]);

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <Title level={3}>Dashboard</Title>
        <Text type="secondary">
          Selamat datang, {user?.nama}! - {user?.nama_puskesmas}
        </Text>
      </div>

      {/* Stats Cards */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col span={24}>
          <Card
            title="Statistik Laporan Saya"
            extra={
              <Space>
                <Select value={statsMonth} onChange={setStatsMonth} style={{ width: 120 }}>
                  {months.map(m => <Select.Option key={m} value={m}>{m}</Select.Option>)}
                </Select>
                <Select value={statsYear} onChange={setStatsYear} style={{ width: 90 }}>
                  {years.map(y => <Select.Option key={y} value={y}>{y}</Select.Option>)}
                </Select>
              </Space>
            }
          >
            <Row gutter={[16, 16]}>
              <Col xs={24} sm={8}>
                <Card loading={loadingStats} variant="borderless">
                  <Statistic
                    title="Total Laporan"
                    value={stats.totalLaporan}
                    prefix={<FileTextOutlined />}
                    valueStyle={{ color: brand.primary }}
                  />
                </Card>
              </Col>
              <Col xs={24} sm={8}>
                <Card loading={loadingStats} variant="borderless">
                  <Statistic
                    title="Terkirim"
                    value={stats.terkirim}
                    prefix={<CheckCircleOutlined />}
                    valueStyle={{ color: brand.success }}
                  />
                </Card>
              </Col>
              <Col xs={24} sm={8}>
                <Card loading={loadingStats} variant="borderless">
                  <Statistic
                    title="Tersimpan (Draft)"
                    value={stats.tersimpan}
                    prefix={<ClockCircleOutlined />}
                    valueStyle={{ color: brand.warning }}
                  />
                </Card>
              </Col>
            </Row>
          </Card>
        </Col>
      </Row>

      {/* Budget YTD */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} md={8}>
          <Card>
            <Statistic
              title="Total Target Anggaran YTD"
              value={totalStats.totalTarget}
              prefix={<DollarOutlined />}
              valueStyle={{ color: brand.primary }}
              formatter={(v) => formatCurrencyWithPrefix(v as number)}
            />
          </Card>
        </Col>
        <Col xs={24} md={8}>
          <Card>
            <Statistic
              title="Total Realisasi Anggaran YTD"
              value={totalStats.totalRealisasi}
              prefix={<DollarOutlined />}
              valueStyle={{ color: brand.success }}
              formatter={(v) => formatCurrencyWithPrefix(v as number)}
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
                color: totalStats.persentaseRealisasi >= 80 ? brand.success :
                  totalStats.persentaseRealisasi >= 60 ? brand.warning : brand.error,
              }}
            />
          </Card>
        </Col>
      </Row>

      {/* Chart */}
      <Row gutter={[16, 16]}>
        <Col xs={24}>
          <Card title="Grafik Realisasi Anggaran" variant="borderless">
            <div style={{ marginBottom: 16 }}>
              <Row gutter={[16, 12]} align="middle">
                <Col xs={12} sm={6} md={3}>
                  <Text strong style={{ marginRight: 8 }}>Tahun:</Text>
                  <Select value={chartYear} onChange={setChartYear} style={{ width: 90 }} size="small">
                    {years.map(y => <Select.Option key={y} value={y}>{y}</Select.Option>)}
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
                    {sumberAnggaranList.map(i => (
                      <Select.Option key={i.value} value={i.value}>{i.label}</Select.Option>
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
                    {subKegiatanList.map(i => (
                      <Select.Option key={i.value} value={i.value}>{i.label}</Select.Option>
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
                      <Switch checked={showAnggaran} onChange={setShowAnggaran} size="small" style={{ backgroundColor: showAnggaran ? brand.primary : undefined }} />
                      <Text style={{ color: showAnggaran ? brand.primary : brand.textTertiary }}>Anggaran</Text>
                    </Space>
                    <Space>
                      <Switch checked={showAngkas} onChange={setShowAngkas} size="small" style={{ backgroundColor: showAngkas ? brand.accent : undefined }} />
                      <Text style={{ color: showAngkas ? brand.accent : brand.textTertiary }}>Angkas</Text>
                    </Space>
                    <Space>
                      <Switch checked={showRealisasiAnggaran} onChange={setShowRealisasiAnggaran} size="small" style={{ backgroundColor: showRealisasiAnggaran ? brand.success : undefined }} />
                      <Text style={{ color: showRealisasiAnggaran ? brand.success : brand.textTertiary }}>Realisasi Anggaran</Text>
                    </Space>
                    <Space>
                      <Switch checked={showRealisasiFisik} onChange={setShowRealisasiFisik} size="small" style={{ backgroundColor: showRealisasiFisik ? brand.warning : undefined }} />
                      <Text style={{ color: showRealisasiFisik ? brand.warning : brand.textTertiary }}>Realisasi Fisik (%)</Text>
                    </Space>
                  </Space>
                </Col>
              </Row>
            </div>

            {loadingChart ? (
              <ChartSkeleton height={500} />
            ) : chartData.length > 0 ? (() => {
              const maxRpValue = Math.max(...chartData.map(d => Math.max(d.anggaran, d.angkas, d.realisasi_anggaran)));
              return (
              <ResponsiveContainer width="100%" height={500}>
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="label" angle={0} textAnchor="middle" height={30} interval={0} tick={{ fontSize: 12 }} />
                  <YAxis yAxisId="left" domain={[0, maxRpValue || 'auto']} tickFormatter={(v) => `Rp ${formatCurrencyAbbreviated(v)}`} />
                  <YAxis yAxisId="right" orientation="right" domain={[0, 100]} tickFormatter={(v) => `${v}%`} />
                  <Tooltip
                    formatter={(value: number, name: string) => {
                      if (name === 'Realisasi Fisik (%)') return `${value.toFixed(2)}%`;
                      return formatCurrencyWithPrefix(value);
                    }}
                    labelStyle={{ color: brand.textPrimary }}
                  />
                  <Legend />
                  {showAnggaran && <Line yAxisId="left" type="monotone" dataKey="anggaran" name="Target Anggaran (Rp)" stroke={brand.primary} strokeWidth={2} dot={{ fill: brand.primary, r: 4 }} activeDot={{ r: 6 }} />}
                  {showAngkas && <Line yAxisId="left" type="monotone" dataKey="angkas" name="Angkas (Rp)" stroke={brand.accent} strokeWidth={2} dot={{ fill: brand.accent, r: 4 }} activeDot={{ r: 6 }} />}
                  {showRealisasiAnggaran && <Line yAxisId="left" type="monotone" dataKey="realisasi_anggaran" name="Realisasi Anggaran (Rp)" stroke={brand.success} strokeWidth={2} dot={{ fill: brand.success, r: 4 }} activeDot={{ r: 6 }} />}
                  {showRealisasiFisik && <Line yAxisId="right" type="monotone" dataKey="realisasi_fisik" name="Realisasi Fisik (%)" stroke={brand.warning} strokeWidth={2} dot={{ fill: brand.warning, r: 4 }} activeDot={{ r: 6 }} />}
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

        {/* Monthly Budget Breakdown */}
        <Col xs={24}>
          <Card
            title="Realisasi Anggaran Per Sub Kegiatan"
            variant="borderless"
            extra={
              <Space>
                <Select value={selectedMonth} onChange={setSelectedMonth} style={{ width: 120 }} size="small">
                  {months.map(m => <Select.Option key={m} value={m}>{m}</Select.Option>)}
                </Select>
                <Select value={selectedYear} onChange={setSelectedYear} style={{ width: 90 }} size="small">
                  {years.map(y => <Select.Option key={y} value={y}>{y}</Select.Option>)}
                </Select>
              </Space>
            }
          >
            {loadingMonthly ? (
              <ChartSkeleton height={300} />
            ) : monthlyData.length > 0 ? (
              <Row gutter={[16, 16]}>
                {monthlyData.map((item, index) => (
                  <Col xs={24} sm={12} lg={8} xl={6} key={index}>
                    <Card size="small" style={{ background: brand.bgLayout, height: '100%' }}>
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
                          <Text strong style={{ fontSize: 11, color: brand.success }}>
                            {formatCurrencyWithPrefix(item.realisasi_rp)}
                          </Text>
                        </div>
                        <Progress
                          percent={item.persentase}
                          size="small"
                          strokeColor={
                            item.persentase >= 80 ? brand.success :
                              item.persentase >= 60 ? brand.warning : brand.error
                          }
                        />
                      </Space>
                    </Card>
                  </Col>
                ))}
              </Row>
            ) : (
              <div style={{ height: 200, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Text type="secondary">Tidak ada data untuk bulan ini</Text>
              </div>
            )}
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default PuskesmasDashboardPage;
