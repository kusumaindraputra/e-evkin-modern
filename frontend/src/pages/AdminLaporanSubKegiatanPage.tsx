import React, { useState, useEffect } from 'react';
import {
  Card,
  Table,
  Select,
  Button,
  Space,
  Typography,
  Statistic,
  Row,
  Col,
  Modal,
  Tag,
  Descriptions,
  message,
} from 'antd';
import { FileTextOutlined, EyeOutlined, ReloadOutlined } from '@ant-design/icons';
import axios from 'axios';
import { useAuthStore } from '../store/authStore';

const { Title } = Typography;
const { Option } = Select;

interface SubKegiatan {
  id_sub_kegiatan: number;
  kode_sub: string;
  kegiatan: string;
  indikator_kinerja: string;
  kegiatanParent: {
    id_kegiatan: number;
    kode: string;
    kegiatan: string;
  };
}

interface AggregatedReport {
  id_sub_kegiatan: number;
  bulan: string;
  tahun: number;
  sub_kegiatan: SubKegiatan;
  jumlah_laporan: number;
  total_target_k: number;
  total_realisasi_k: number;
  total_target_rp: number;
  total_realisasi_rp: number;
  total_angkas: number;
  persentase_k: number;
  persentase_rp: number;
}

interface DetailLaporan {
  id: string;
  user: {
    nama: string;
    nama_puskesmas: string;
    kode_puskesmas: string;
  };
  subKegiatan: {
    kode_sub: string;
    kegiatan: string;
    indikator_kinerja: string;
  };
  sumberAnggaran: {
    sumber: string;
  };
  target_k: number;
  realisasi_k: number;
  target_rp: number;
  realisasi_rp: number;
  angkas: number;
  status: string;
  permasalahan: string;
  upaya: string;
}

export const AdminLaporanSubKegiatanPage: React.FC = () => {
  const { token } = useAuthStore();
  const [reports, setReports] = useState<AggregatedReport[]>([]);
  const [loading, setLoading] = useState(false);
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [detailData, setDetailData] = useState<DetailLaporan[]>([]);
  const [detailLoading, setDetailLoading] = useState(false);

  // Filters
  const currentYear = new Date().getFullYear();
  const [selectedYear, setSelectedYear] = useState<number>(currentYear);
  const [selectedMonth, setSelectedMonth] = useState<string>('');

  useEffect(() => {
    loadReports();
  }, [selectedYear, selectedMonth]);

  const loadReports = async () => {
    if (!token) {
      message.error('Token tidak ditemukan. Silakan login kembali.');
      return;
    }

    setLoading(true);
    try {
      const params: any = {};
      if (selectedYear) params.tahun = selectedYear;
      if (selectedMonth) params.bulan = selectedMonth;

      const response = await axios.get('http://localhost:5000/api/report/by-sub-kegiatan', {
        headers: { Authorization: `Bearer ${token}` },
        params,
      });
      setReports(response.data);
    } catch (error: any) {
      console.error('Error loading reports:', error);
      message.error(error.response?.data?.message || 'Gagal memuat data laporan');
    } finally {
      setLoading(false);
    }
  };

  const loadDetail = async (record: AggregatedReport) => {
    if (!token) return;

    setDetailLoading(true);
    setDetailModalVisible(true);
    try {
      const response = await axios.get('http://localhost:5000/api/report/by-sub-kegiatan/detail', {
        headers: { Authorization: `Bearer ${token}` },
        params: {
          bulan: record.bulan,
          tahun: record.tahun,
          id_sub_kegiatan: record.id_sub_kegiatan,
        },
      });
      setDetailData(response.data);
    } catch (error: any) {
      console.error('Error loading detail:', error);
      message.error(error.response?.data?.message || 'Gagal memuat detail laporan');
    } finally {
      setDetailLoading(false);
    }
  };

  const formatRupiah = (value: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(value);
  };

  const getPersentaseColor = (persentase: number) => {
    if (persentase >= 90) return 'green';
    if (persentase >= 70) return 'blue';
    if (persentase >= 50) return 'orange';
    return 'red';
  };

  const columns = [
    {
      title: 'Kode Sub Kegiatan',
      dataIndex: ['sub_kegiatan', 'kode_sub'],
      key: 'kode_sub',
      width: 180,
      fixed: 'left' as const,
    },
    {
      title: 'Sub Kegiatan',
      dataIndex: ['sub_kegiatan', 'kegiatan'],
      key: 'kegiatan',
      width: 300,
    },
    {
      title: 'Kegiatan Parent',
      dataIndex: ['sub_kegiatan', 'kegiatanParent', 'kegiatan'],
      key: 'parent',
      width: 250,
      ellipsis: true,
    },
    {
      title: 'Bulan/Tahun',
      key: 'periode',
      width: 120,
      render: (_: any, record: AggregatedReport) => `${record.bulan}/${record.tahun}`,
    },
    {
      title: 'Jumlah Laporan',
      dataIndex: 'jumlah_laporan',
      key: 'jumlah_laporan',
      width: 120,
      align: 'center' as const,
      render: (value: number) => <Tag color="blue">{value}</Tag>,
    },
    {
      title: 'Target K',
      dataIndex: 'total_target_k',
      key: 'total_target_k',
      width: 120,
      align: 'right' as const,
      render: (value: number) => value.toLocaleString('id-ID'),
    },
    {
      title: 'Realisasi K',
      dataIndex: 'total_realisasi_k',
      key: 'total_realisasi_k',
      width: 120,
      align: 'right' as const,
      render: (value: number) => value.toLocaleString('id-ID'),
    },
    {
      title: '% K',
      dataIndex: 'persentase_k',
      key: 'persentase_k',
      width: 100,
      align: 'center' as const,
      render: (value: number) => (
        <Tag color={getPersentaseColor(value)}>{value.toFixed(2)}%</Tag>
      ),
    },
    {
      title: 'Target Rp',
      dataIndex: 'total_target_rp',
      key: 'total_target_rp',
      width: 150,
      align: 'right' as const,
      render: (value: number) => formatRupiah(value),
    },
    {
      title: 'Realisasi Rp',
      dataIndex: 'total_realisasi_rp',
      key: 'total_realisasi_rp',
      width: 150,
      align: 'right' as const,
      render: (value: number) => formatRupiah(value),
    },
    {
      title: '% Rp',
      dataIndex: 'persentase_rp',
      key: 'persentase_rp',
      width: 100,
      align: 'center' as const,
      render: (value: number) => (
        <Tag color={getPersentaseColor(value)}>{value.toFixed(2)}%</Tag>
      ),
    },
    {
      title: 'Aksi',
      key: 'action',
      width: 100,
      fixed: 'right' as const,
      render: (_: any, record: AggregatedReport) => (
        <Button
          type="link"
          icon={<EyeOutlined />}
          onClick={() => loadDetail(record)}
        >
          Detail
        </Button>
      ),
    },
  ];

  const detailColumns = [
    {
      title: 'Puskesmas',
      dataIndex: ['user', 'nama_puskesmas'],
      key: 'puskesmas',
      width: 200,
    },
    {
      title: 'Sumber Anggaran',
      dataIndex: ['sumberAnggaran', 'sumber'],
      key: 'sumber',
      width: 150,
    },
    {
      title: 'Target K',
      dataIndex: 'target_k',
      key: 'target_k',
      width: 100,
      align: 'right' as const,
    },
    {
      title: 'Realisasi K',
      dataIndex: 'realisasi_k',
      key: 'realisasi_k',
      width: 100,
      align: 'right' as const,
    },
    {
      title: 'Target Rp',
      dataIndex: 'target_rp',
      key: 'target_rp',
      width: 120,
      align: 'right' as const,
      render: (value: number) => formatRupiah(value),
    },
    {
      title: 'Realisasi Rp',
      dataIndex: 'realisasi_rp',
      key: 'realisasi_rp',
      width: 120,
      align: 'right' as const,
      render: (value: number) => formatRupiah(value),
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      width: 120,
      render: (status: string) => {
        const colors: Record<string, string> = {
          menunggu: 'orange',
          disetujui: 'green',
          ditolak: 'red',
          draft: 'default',
        };
        return <Tag color={colors[status] || 'default'}>{status}</Tag>;
      },
    },
  ];

  // Calculate summary statistics
  const totalLaporan = reports.reduce((sum, r) => sum + r.jumlah_laporan, 0);
  const totalTargetRp = reports.reduce((sum, r) => sum + r.total_target_rp, 0);
  const totalRealisasiRp = reports.reduce((sum, r) => sum + r.total_realisasi_rp, 0);
  const overallPersentase = totalTargetRp > 0 ? (totalRealisasiRp / totalTargetRp) * 100 : 0;

  return (
    <div>
      <Title level={2}>Laporan Per Sub Kegiatan</Title>

      {/* Summary Statistics */}
      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col span={6}>
          <Card>
            <Statistic
              title="Total Sub Kegiatan"
              value={reports.length}
              prefix={<FileTextOutlined />}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="Total Laporan"
              value={totalLaporan}
              prefix={<FileTextOutlined />}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="Total Target"
              value={totalTargetRp}
              prefix="Rp"
              precision={0}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="Persentase Realisasi"
              value={overallPersentase}
              suffix="%"
              precision={2}
              valueStyle={{ color: overallPersentase >= 70 ? '#3f8600' : '#cf1322' }}
            />
          </Card>
        </Col>
      </Row>

      {/* Filters */}
      <Card style={{ marginBottom: 16 }}>
        <Space>
          <Select
            placeholder="Pilih Tahun"
            style={{ width: 120 }}
            value={selectedYear}
            onChange={setSelectedYear}
          >
            {[currentYear - 2, currentYear - 1, currentYear, currentYear + 1].map((year) => (
              <Option key={year} value={year}>
                {year}
              </Option>
            ))}
          </Select>
          <Select
            placeholder="Pilih Bulan"
            style={{ width: 150 }}
            value={selectedMonth}
            onChange={setSelectedMonth}
            allowClear
          >
            {[
              'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
              'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
            ].map((month) => (
              <Option key={month} value={month}>
                {month}
              </Option>
            ))}
          </Select>
          <Button icon={<ReloadOutlined />} onClick={loadReports}>
            Refresh
          </Button>
        </Space>
      </Card>

      {/* Main Table */}
      <Card>
        <Table
          columns={columns}
          dataSource={reports}
          rowKey={(record) => `${record.id_sub_kegiatan}-${record.bulan}-${record.tahun}`}
          loading={loading}
          pagination={{ pageSize: 20, showTotal: (total) => `Total ${total} records` }}
          scroll={{ x: 2000 }}
        />
      </Card>

      {/* Detail Modal */}
      <Modal
        title="Detail Laporan Per Puskesmas"
        open={detailModalVisible}
        onCancel={() => setDetailModalVisible(false)}
        footer={null}
        width={1200}
      >
        <Table
          columns={detailColumns}
          dataSource={detailData}
          rowKey="id"
          loading={detailLoading}
          pagination={{ pageSize: 10 }}
          scroll={{ x: 1000 }}
        />
      </Modal>
    </div>
  );
};
