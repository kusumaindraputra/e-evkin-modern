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
  message,
} from 'antd';
import { DollarOutlined, EyeOutlined, ReloadOutlined, DownloadOutlined } from '@ant-design/icons';
import axios from 'axios';
import { useAuthStore } from '../store/authStore';
import API_BASE_URL from '../config/api';
import { exportToExcel, formatRupiahForExcel, formatPercentageForExcel } from '../utils/excelExport';
import { formatNumber } from '../utils/formatters';

const { Title } = Typography;
const { Option } = Select;

interface SumberAnggaran {
  id_sumber: number;
  sumber: string;
}

interface AggregatedReport {
  id_sumber_anggaran: number;
  bulan: string;
  tahun: number;
  sumber_anggaran: SumberAnggaran;
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
  realisasi_fisik: number;
  angkas: number;
  status: string;
  permasalahan: string;
  upaya: string;
}

export const AdminLaporanSumberAnggaranPage: React.FC = () => {
  const { token } = useAuthStore();
  const [reports, setReports] = useState<AggregatedReport[]>([]);
  const [loading, setLoading] = useState(false);
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [detailData, setDetailData] = useState<DetailLaporan[]>([]);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailPuskesmasFilter, setDetailPuskesmasFilter] = useState<string | undefined>(undefined);

  // Filters
  const currentYear = new Date().getFullYear();
  const [selectedYear, setSelectedYear] = useState<number>(currentYear);
  const [selectedMonth, setSelectedMonth] = useState<string | undefined>(undefined);

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

      const response = await axios.get(`${API_BASE_URL}/report/by-sumber-anggaran`, {
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
      const response = await axios.get(`${API_BASE_URL}/report/by-sumber-anggaran/detail`, {
        headers: { Authorization: `Bearer ${token}` },
        params: {
          bulan: record.bulan,
          tahun: record.tahun,
          id_sumber_anggaran: record.id_sumber_anggaran,
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

  const getPersentaseColor = (persentase: number) => {
    if (persentase >= 90) return 'green';
    if (persentase >= 70) return 'blue';
    if (persentase >= 50) return 'orange';
    return 'red';
  };

  const getUniquePuskesmas = () => {
    const puskesmasList = Array.from(
      new Map(
        detailData.map((item) => [
          item.user?.nama_puskesmas,
          { nama_puskesmas: item.user?.nama_puskesmas },
        ])
      ).values()
    );
    return puskesmasList.sort((a, b) =>
      (a.nama_puskesmas || '').localeCompare(b.nama_puskesmas || '')
    );
  };

  const getFilteredDetailData = () => {
    if (!detailPuskesmasFilter) return detailData;
    return detailData.filter(
      (item) => item.user?.nama_puskesmas === detailPuskesmasFilter
    );
  };

  const handleExportExcel = () => {
    if (reports.length === 0) {
      message.warning('Tidak ada data untuk diekspor');
      return;
    }

    const exportColumns = [
      { header: 'Sumber Anggaran', key: 'sumber_anggaran.sumber', width: 30 },
      { header: 'Bulan/Tahun', key: 'periode', width: 15, format: (value: any) => value },
      { header: 'Jumlah Laporan', key: 'jumlah_laporan', width: 15 },
      { header: 'Total Angkas', key: 'total_angkas', width: 18, format: (value: number) => formatRupiahForExcel(value) },
      { header: 'Target K', key: 'total_target_k', width: 15 },
      { header: 'Realisasi K', key: 'total_realisasi_k', width: 15 },
      { header: '% K', key: 'persentase_k', width: 12, format: (value: number) => formatPercentageForExcel(value) },
      { header: 'Target Rp', key: 'total_target_rp', width: 18, format: (value: number) => formatRupiahForExcel(value) },
      { header: 'Realisasi Rp', key: 'total_realisasi_rp', width: 18, format: (value: number) => formatRupiahForExcel(value) },
      { header: '% Rp', key: 'persentase_rp', width: 12, format: (value: number) => formatPercentageForExcel(value) },
    ];

    const exportData = reports.map((r) => ({ ...r, periode: `${r.bulan}/${r.tahun}` }));

    exportToExcel({
      fileName: 'laporan-sumber-anggaran',
      sheetName: 'Laporan Sumber Anggaran',
      columns: exportColumns,
      data: exportData,
    });

    message.success('Data berhasil diunduh');
  };

  const handleExportDetailExcel = () => {
    const filteredData = getFilteredDetailData();
    if (filteredData.length === 0) {
      message.warning('Tidak ada data untuk diekspor');
      return;
    }

    const exportColumns = [
      { header: 'Puskesmas', key: 'user.nama_puskesmas', width: 30 },
      { header: 'Sub Kegiatan', key: 'subKegiatan.kegiatan', width: 40 },
      { header: 'Sumber Anggaran', key: 'sumberAnggaran.sumber', width: 25 },
      { header: 'Angkas', key: 'angkas', width: 20, format: (value: number) => formatRupiahForExcel(value) },
      { header: 'Target K', key: 'target_k', width: 15 },
      { header: 'Realisasi K', key: 'realisasi_k', width: 15 },
      {
        header: '% K',
        key: 'persen_k',
        width: 12,
        format: (_: any, row?: Record<string, any>) => {
          if (!row || row.target_k === 0) return '0.00%';
          return formatPercentageForExcel((row.realisasi_k / row.target_k) * 100);
        },
      },
      { header: 'Target Rp', key: 'target_rp', width: 20, format: (value: number) => formatRupiahForExcel(value) },
      { header: 'Realisasi Rp', key: 'realisasi_rp', width: 20, format: (value: number) => formatRupiahForExcel(value) },
      {
        header: '% Rp',
        key: 'persen_rp',
        width: 12,
        format: (_: any, row?: Record<string, any>) => {
          if (!row || row.target_rp === 0) return '0.00%';
          return formatPercentageForExcel((row.realisasi_rp / row.target_rp) * 100);
        },
      },
      { header: 'Realisasi Fisik (%)', key: 'realisasi_fisik', width: 18, format: (value: number) => formatPercentageForExcel(value) },
      { header: 'Status', key: 'status', width: 15 },
    ];

    exportToExcel({
      fileName: 'laporan-detail-sumber-anggaran',
      sheetName: 'Detail Laporan',
      columns: exportColumns,
      data: filteredData,
    });

    message.success('Data berhasil diunduh');
  };

  const columns = [
    {
      title: 'Sumber Anggaran',
      dataIndex: ['sumber_anggaran', 'sumber'],
      key: 'sumber',
      width: 200,
      fixed: 'left' as const,
      render: (text: string) => <strong>{text}</strong>,
      sorter: (a: AggregatedReport, b: AggregatedReport) => (a.sumber_anggaran?.sumber || '').localeCompare(b.sumber_anggaran?.sumber || ''),
    },
    {
      title: 'Bulan/Tahun',
      key: 'periode',
      width: 120,
      render: (_: any, record: AggregatedReport) => `${record.bulan}/${record.tahun}`,
      sorter: (a: AggregatedReport, b: AggregatedReport) => {
        const aMonth = `${a.bulan}/${a.tahun}`;
        const bMonth = `${b.bulan}/${b.tahun}`;
        return aMonth.localeCompare(bMonth);
      },
    },
    {
      title: 'Jumlah Laporan',
      dataIndex: 'jumlah_laporan',
      key: 'jumlah_laporan',
      width: 120,
      align: 'center' as const,
      render: (value: number) => <Tag color="blue">{value}</Tag>,
      sorter: (a: AggregatedReport, b: AggregatedReport) => a.jumlah_laporan - b.jumlah_laporan,
    },
    {
      title: 'Total Angkas (Rp)',
      dataIndex: 'total_angkas',
      key: 'total_angkas',
      width: 150,
      align: 'right' as const,
      render: (value: number) => formatNumber(value),
      sorter: (a: AggregatedReport, b: AggregatedReport) => a.total_angkas - b.total_angkas,
    },
    {
      title: 'Target (K)',
      dataIndex: 'total_target_k',
      key: 'total_target_k',
      width: 120,
      align: 'right' as const,
      render: (value: number) => formatNumber(value),
      sorter: (a: AggregatedReport, b: AggregatedReport) => a.total_target_k - b.total_target_k,
    },
    {
      title: 'Realisasi (K)',
      dataIndex: 'total_realisasi_k',
      key: 'total_realisasi_k',
      width: 120,
      align: 'right' as const,
      render: (value: number) => formatNumber(value),
      sorter: (a: AggregatedReport, b: AggregatedReport) => a.total_realisasi_k - b.total_realisasi_k,
    },
    {
      title: 'Capaian K (%)',
      dataIndex: 'persentase_k',
      key: 'persentase_k',
      width: 100,
      align: 'center' as const,
      render: (value: number) => (
        <Tag color={getPersentaseColor(value)}>{value.toFixed(2)}%</Tag>
      ),
      sorter: (a: AggregatedReport, b: AggregatedReport) => a.persentase_k - b.persentase_k,
    },
    {
      title: 'Target (Rp)',
      dataIndex: 'total_target_rp',
      key: 'total_target_rp',
      width: 150,
      align: 'right' as const,
      render: (value: number) => formatNumber(value),
      sorter: (a: AggregatedReport, b: AggregatedReport) => a.total_target_rp - b.total_target_rp,
    },
    {
      title: 'Realisasi (Rp)',
      dataIndex: 'total_realisasi_rp',
      key: 'total_realisasi_rp',
      width: 150,
      align: 'right' as const,
      render: (value: number) => formatNumber(value),
      sorter: (a: AggregatedReport, b: AggregatedReport) => a.total_realisasi_rp - b.total_realisasi_rp,
    },
    {
      title: 'Capaian Rp (%)',
      dataIndex: 'persentase_rp',
      key: 'persentase_rp',
      width: 100,
      align: 'center' as const,
      render: (value: number) => (
        <Tag color={getPersentaseColor(value)}>{value.toFixed(2)}%</Tag>
      ),
      sorter: (a: AggregatedReport, b: AggregatedReport) => a.persentase_rp - b.persentase_rp,
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
      sorter: (a: DetailLaporan, b: DetailLaporan) => (a.user?.nama_puskesmas || '').localeCompare(b.user?.nama_puskesmas || ''),
    },
    {
      title: 'Sub Kegiatan',
      dataIndex: ['subKegiatan', 'kegiatan'],
      key: 'sub_kegiatan',
      width: 250,
      sorter: (a: DetailLaporan, b: DetailLaporan) => (a.subKegiatan?.kegiatan || '').localeCompare(b.subKegiatan?.kegiatan || ''),
    },
    {
      title: 'Angkas (Rp)',
      dataIndex: 'angkas',
      key: 'angkas',
      width: 120,
      align: 'right' as const,
      render: (value: number) => formatNumber(value),
      sorter: (a: DetailLaporan, b: DetailLaporan) => a.angkas - b.angkas,
    },
    {
      title: 'Target (K)',
      dataIndex: 'target_k',
      key: 'target_k',
      width: 100,
      align: 'right' as const,
      render: (value: number) => formatNumber(value),
      sorter: (a: DetailLaporan, b: DetailLaporan) => a.target_k - b.target_k,
    },
    {
      title: 'Realisasi (K)',
      dataIndex: 'realisasi_k',
      key: 'realisasi_k',
      width: 100,
      align: 'right' as const,
      render: (value: number) => formatNumber(value),
      sorter: (a: DetailLaporan, b: DetailLaporan) => a.realisasi_k - b.realisasi_k,
    },
    {
      title: 'Capaian K (%)',
      key: 'persen_k',
      width: 100,
      align: 'right' as const,
      render: (_: any, record: DetailLaporan) => {
        if (record.target_k === 0) return '0.00%';
        const capaian = (record.realisasi_k / record.target_k) * 100;
        return `${capaian.toFixed(2)}%`;
      },
      sorter: (a: DetailLaporan, b: DetailLaporan) => {
        const aCapaian = a.target_k === 0 ? 0 : (a.realisasi_k / a.target_k) * 100;
        const bCapaian = b.target_k === 0 ? 0 : (b.realisasi_k / b.target_k) * 100;
        return aCapaian - bCapaian;
      },
    },
    {
      title: 'Target (Rp)',
      dataIndex: 'target_rp',
      key: 'target_rp',
      width: 120,
      align: 'right' as const,
      render: (value: number) => formatNumber(value),
      sorter: (a: DetailLaporan, b: DetailLaporan) => a.target_rp - b.target_rp,
    },
    {
      title: 'Realisasi (Rp)',
      dataIndex: 'realisasi_rp',
      key: 'realisasi_rp',
      width: 120,
      align: 'right' as const,
      render: (value: number) => formatNumber(value),
      sorter: (a: DetailLaporan, b: DetailLaporan) => a.realisasi_rp - b.realisasi_rp,
    },
    {
      title: 'Capaian Rp (%)',
      key: 'persen_rp',
      width: 100,
      align: 'right' as const,
      render: (_: any, record: DetailLaporan) => {
        if (record.target_rp === 0) return '0.00%';
        const capaian = (record.realisasi_rp / record.target_rp) * 100;
        return `${capaian.toFixed(2)}%`;
      },
      sorter: (a: DetailLaporan, b: DetailLaporan) => {
        const aCapaian = a.target_rp === 0 ? 0 : (a.realisasi_rp / a.target_rp) * 100;
        const bCapaian = b.target_rp === 0 ? 0 : (b.realisasi_rp / b.target_rp) * 100;
        return aCapaian - bCapaian;
      },
    },
    {
      title: 'Realisasi Fisik (%)',
      dataIndex: 'realisasi_fisik',
      key: 'realisasi_fisik',
      width: 120,
      align: 'right' as const,
      render: (value: number) => {
        const num = Number(value);
        return isNaN(num) ? '0.00%' : `${num.toFixed(2)}%`;
      },
      sorter: (a: DetailLaporan, b: DetailLaporan) => a.realisasi_fisik - b.realisasi_fisik,
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
      sorter: (a: DetailLaporan, b: DetailLaporan) => a.status.localeCompare(b.status),
    },
  ];

  // Calculate summary statistics
  const totalLaporan = reports.reduce((sum, r) => sum + r.jumlah_laporan, 0);
  const totalAngkas = reports.reduce((sum, r) => sum + r.total_angkas, 0);
  const totalTargetRp = reports.reduce((sum, r) => sum + r.total_target_rp, 0);
  const totalRealisasiRp = reports.reduce((sum, r) => sum + r.total_realisasi_rp, 0);
  const overallPersentase = totalTargetRp > 0 ? (totalRealisasiRp / totalTargetRp) * 100 : 0;

  return (
    <div>
      <Title level={2}>Laporan Per Sumber Anggaran</Title>

      {/* Summary Statistics */}
      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col span={6}>
          <Card>
            <Statistic
              title="Total Sumber Anggaran"
              value={reports.length}
              prefix={<DollarOutlined />}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="Total Laporan"
              value={totalLaporan}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="Total Angkas"
              value={totalAngkas}
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
            placeholder="Semua Bulan"
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
          <Button
            type="primary"
            icon={<DownloadOutlined />}
            onClick={handleExportExcel}
            disabled={reports.length === 0}
          >
            Download Excel
          </Button>
        </Space>
      </Card>

      {/* Main Table */}
      <Card>
        <Table
          columns={columns}
          dataSource={reports}
          rowKey={(record) => `${record.id_sumber_anggaran}-${record.bulan}-${record.tahun}`}
          loading={loading}
          pagination={{ pageSize: 20, showTotal: (total) => `Total ${total} records` }}
          sticky
          scroll={{ x: 1500, y: 500 }}
        />
      </Card>

      {/* Detail Modal */}
      <Modal
        title="Detail Laporan Per Puskesmas"
        open={detailModalVisible}
        onCancel={() => {
          setDetailModalVisible(false);
          setDetailPuskesmasFilter(undefined);
        }}
        footer={null}
        width={1200}
      >
        <Space style={{ marginBottom: 16 }}>
          <Select
            placeholder="Semua Puskesmas"
            style={{ width: 250 }}
            value={detailPuskesmasFilter}
            onChange={setDetailPuskesmasFilter}
            allowClear
          >
            {getUniquePuskesmas().map((puskesmas) => (
              <Option key={puskesmas.nama_puskesmas} value={puskesmas.nama_puskesmas || ''}>
                {puskesmas.nama_puskesmas}
              </Option>
            ))}
          </Select>
          <Button
            type="primary"
            icon={<DownloadOutlined />}
            onClick={handleExportDetailExcel}
            disabled={getFilteredDetailData().length === 0}
          >
            Download Excel
          </Button>
        </Space>
        <Table
          columns={detailColumns}
          dataSource={getFilteredDetailData()}
          rowKey="id"
          loading={detailLoading}
          pagination={{ pageSize: 10 }}
          sticky
          scroll={{ x: 1100, y: 400 }}
        />
      </Modal>
    </div>
  );
};
