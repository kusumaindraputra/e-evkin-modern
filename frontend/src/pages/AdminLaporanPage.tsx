import React, { useState, useEffect, useMemo } from 'react';
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
  Radio,
} from 'antd';
import { FileTextOutlined, DollarOutlined, EyeOutlined, ReloadOutlined, DownloadOutlined } from '@ant-design/icons';
import axios from 'axios';
import { useAuthStore } from '../store/authStore';
import API_BASE_URL from '../config/api';
import { exportToExcel, formatRupiahForExcel, formatPercentageForExcel } from '../utils/excelExport';
import { formatNumber } from '../utils/formatters';
import { modalWidths, statusTagColors } from '../theme';

const { Title } = Typography;
const { Option } = Select;

type GroupBy = 'sub_kegiatan' | 'sumber_anggaran';

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

interface SumberAnggaran {
  id_sumber: number;
  sumber: string;
}

interface AggregatedReportSubKegiatan {
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

interface AggregatedReportSumberAnggaran {
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

type AggregatedReport = AggregatedReportSubKegiatan | AggregatedReportSumberAnggaran;

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

export const AdminLaporanPage: React.FC = () => {
  const { token } = useAuthStore();
  const [reports, setReports] = useState<AggregatedReport[]>([]);
  const [loading, setLoading] = useState(false);
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [detailData, setDetailData] = useState<DetailLaporan[]>([]);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailPuskesmasFilter, setDetailPuskesmasFilter] = useState<string | undefined>(undefined);

  // Group by toggle
  const [groupBy, setGroupBy] = useState<GroupBy>('sub_kegiatan');

  // Filters
  const currentYear = new Date().getFullYear();
  const [selectedYear, setSelectedYear] = useState<number>(currentYear);
  const [selectedMonth, setSelectedMonth] = useState<string | undefined>(undefined);

  // Clear reports when groupBy changes to prevent data/column mismatch
  useEffect(() => {
    setReports([]);
  }, [groupBy]);

  useEffect(() => {
    loadReports();
  }, [selectedYear, selectedMonth, groupBy]);

  const loadReports = async () => {
    if (!token) {
      message.error('Token tidak ditemukan. Silakan login kembali.');
      return;
    }

    setLoading(true);
    try {
      const params: Record<string, unknown> = {};
      if (selectedYear) params.tahun = selectedYear;
      if (selectedMonth) params.bulan = selectedMonth;

      const endpoint = groupBy === 'sub_kegiatan'
        ? '/report/by-sub-kegiatan'
        : '/report/by-sumber-anggaran';

      const response = await axios.get(`${API_BASE_URL}${endpoint}`, {
        headers: { Authorization: `Bearer ${token}` },
        params,
      });
      setReports(response.data);
    } catch (error: unknown) {
      console.error('Error loading reports:', error);
      const errMsg = axios.isAxiosError(error) ? error.response?.data?.message : 'Unknown error';
      message.error(errMsg || 'Gagal memuat data laporan');
    } finally {
      setLoading(false);
    }
  };

  const loadDetail = async (record: AggregatedReport) => {
    if (!token) return;

    setDetailLoading(true);
    setDetailModalVisible(true);
    try {
      const endpoint = groupBy === 'sub_kegiatan'
        ? '/report/by-sub-kegiatan/detail'
        : '/report/by-sumber-anggaran/detail';

      const params: Record<string, unknown> = {
        bulan: record.bulan,
        tahun: record.tahun,
      };
      if (groupBy === 'sub_kegiatan') {
        params.id_sub_kegiatan = (record as AggregatedReportSubKegiatan).id_sub_kegiatan;
      } else {
        params.id_sumber_anggaran = (record as AggregatedReportSumberAnggaran).id_sumber_anggaran;
      }

      const response = await axios.get(`${API_BASE_URL}${endpoint}`, {
        headers: { Authorization: `Bearer ${token}` },
        params,
      });
      setDetailData(response.data);
    } catch (error: unknown) {
      console.error('Error loading detail:', error);
      const errMsg = axios.isAxiosError(error) ? error.response?.data?.message : 'Unknown error';
      message.error(errMsg || 'Gagal memuat detail laporan');
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

    if (groupBy === 'sub_kegiatan') {
      const exportColumns = [
        { header: 'Kode Sub Kegiatan', key: 'sub_kegiatan.kode_sub', width: 18 },
        { header: 'Sub Kegiatan', key: 'sub_kegiatan.kegiatan', width: 35 },
        { header: 'Kegiatan Parent', key: 'sub_kegiatan.kegiatanParent.kegiatan', width: 30 },
        { header: 'Bulan/Tahun', key: 'periode', width: 15, format: (value: string) => value },
        { header: 'Jumlah Laporan', key: 'jumlah_laporan', width: 15 },
        { header: 'Target K', key: 'total_target_k', width: 15 },
        { header: 'Realisasi K', key: 'total_realisasi_k', width: 15 },
        { header: '% K', key: 'persentase_k', width: 12, format: (value: number) => formatPercentageForExcel(value) },
        { header: 'Target Rp', key: 'total_target_rp', width: 18, format: (value: number) => formatRupiahForExcel(value) },
        { header: 'Realisasi Rp', key: 'total_realisasi_rp', width: 18, format: (value: number) => formatRupiahForExcel(value) },
        { header: '% Rp', key: 'persentase_rp', width: 12, format: (value: number) => formatPercentageForExcel(value) },
      ];

      const exportData = reports.map((report) => ({
        ...report,
        periode: `${report.bulan}/${report.tahun}`,
      }));

      exportToExcel({
        fileName: 'laporan-sub-kegiatan',
        sheetName: 'Laporan Sub Kegiatan',
        columns: exportColumns,
        data: exportData,
      });
    } else {
      const exportColumns = [
        { header: 'Sumber Anggaran', key: 'sumber_anggaran.sumber', width: 30 },
        { header: 'Bulan/Tahun', key: 'periode', width: 15, format: (value: string) => value },
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
    }

    message.success('Data berhasil diunduh');
  };

  const handleExportDetailExcel = () => {
    const filteredData = getFilteredDetailData();
    if (filteredData.length === 0) {
      message.warning('Tidak ada data untuk diekspor');
      return;
    }

    const baseColumns = [
      { header: 'Puskesmas', key: 'user.nama_puskesmas', width: 30 },
      ...(groupBy === 'sumber_anggaran' ? [{ header: 'Sub Kegiatan', key: 'subKegiatan.kegiatan', width: 40 }] : []),
      { header: 'Sumber Anggaran', key: 'sumberAnggaran.sumber', width: 25 },
      { header: 'Angkas', key: 'angkas', width: 20, format: (value: number) => formatRupiahForExcel(value) },
      { header: 'Target K', key: 'target_k', width: 15 },
      { header: 'Realisasi K', key: 'realisasi_k', width: 15 },
      {
        header: '% K',
        key: 'persen_k',
        width: 12,
        format: (_: number, row?: Record<string, unknown>) => {
          const r = row as { target_k?: number; realisasi_k?: number } | undefined;
          if (!r || r.target_k === 0) return '0.00%';
          return formatPercentageForExcel(((r.realisasi_k || 0) / (r.target_k || 1)) * 100);
        },
      },
      { header: 'Target Rp', key: 'target_rp', width: 20, format: (value: number) => formatRupiahForExcel(value) },
      { header: 'Realisasi Rp', key: 'realisasi_rp', width: 20, format: (value: number) => formatRupiahForExcel(value) },
      {
        header: '% Rp',
        key: 'persen_rp',
        width: 12,
        format: (_: number, row?: Record<string, unknown>) => {
          const r = row as { target_rp?: number; realisasi_rp?: number } | undefined;
          if (!r || r.target_rp === 0) return '0.00%';
          return formatPercentageForExcel(((r.realisasi_rp || 0) / (r.target_rp || 1)) * 100);
        },
      },
      { header: 'Realisasi Fisik (%)', key: 'realisasi_fisik', width: 18, format: (value: number) => formatPercentageForExcel(value) },
      { header: 'Status', key: 'status', width: 15 },
    ];

    exportToExcel({
      fileName: `laporan-detail-${groupBy === 'sub_kegiatan' ? 'sub-kegiatan' : 'sumber-anggaran'}`,
      sheetName: 'Detail Laporan',
      columns: baseColumns,
      data: filteredData,
    });

    message.success('Data berhasil diunduh');
  };

  // Memoized columns based on groupBy
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const columns: any[] = useMemo(() => {
    const commonCols = getCommonColumns(groupBy === 'sumber_anggaran');

    if (groupBy === 'sub_kegiatan') {
      return [
        {
          title: 'Kode Sub Kegiatan',
          dataIndex: ['sub_kegiatan', 'kode_sub'],
          key: 'kode_sub',
          width: 180,
          sorter: (a: AggregatedReportSubKegiatan, b: AggregatedReportSubKegiatan) =>
            (a.sub_kegiatan?.kode_sub || '').localeCompare(b.sub_kegiatan?.kode_sub || ''),
        },
        {
          title: 'Sub Kegiatan',
          dataIndex: ['sub_kegiatan', 'kegiatan'],
          key: 'kegiatan',
          width: 300,
          sorter: (a: AggregatedReportSubKegiatan, b: AggregatedReportSubKegiatan) =>
            (a.sub_kegiatan?.kegiatan || '').localeCompare(b.sub_kegiatan?.kegiatan || ''),
        },
        {
          title: 'Kegiatan Parent',
          dataIndex: ['sub_kegiatan', 'kegiatanParent', 'kegiatan'],
          key: 'parent',
          width: 250,
          ellipsis: true,
          sorter: (a: AggregatedReportSubKegiatan, b: AggregatedReportSubKegiatan) =>
            (a.sub_kegiatan?.kegiatanParent?.kegiatan || '').localeCompare(b.sub_kegiatan?.kegiatanParent?.kegiatan || ''),
        },
        ...commonCols,
      ];
    } else {
      return [
        {
          title: 'Sumber Anggaran',
          dataIndex: ['sumber_anggaran', 'sumber'],
          key: 'sumber',
          width: 200,
          render: (text: string, record: AggregatedReportSumberAnggaran) => (
            <strong>{text || record.sumber_anggaran?.sumber || '(Tidak ada data)'}</strong>
          ),
          sorter: (a: AggregatedReportSumberAnggaran, b: AggregatedReportSumberAnggaran) =>
            (a.sumber_anggaran?.sumber || '').localeCompare(b.sumber_anggaran?.sumber || ''),
        },
        ...commonCols,
      ];
    }
  }, [groupBy]);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  function getCommonColumns(showAngkas = false): any[] {
    const cols: any[] = [
      {
        title: 'Bulan/Tahun',
        key: 'periode',
        width: 120,
        render: (_: unknown, record: AggregatedReport) => `${record.bulan}/${record.tahun}`,
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
    ];

    if (showAngkas) {
      cols.push({
        title: 'Total Angkas (Rp)',
        dataIndex: 'total_angkas',
        key: 'total_angkas',
        width: 150,
        align: 'right' as const,
        render: (value: number) => formatNumber(value),
        sorter: (a: AggregatedReport, b: AggregatedReport) => a.total_angkas - b.total_angkas,
      });
    }

    // Column order: Target Anggaran, Angkas (if shown above), Realisasi (Rp), Capaian Rp, Target (K), Realisasi (K), Capaian K
    cols.push(
      {
        title: 'Target Anggaran (Rp)',
        dataIndex: 'total_target_rp',
        key: 'total_target_rp',
        width: 160,
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
        title: 'Capaian Anggaran (%)',
        dataIndex: 'persentase_rp',
        key: 'persentase_rp',
        width: 120,
        align: 'center' as const,
        render: (value: number) => (
          <Tag color={getPersentaseColor(value)}>{value.toFixed(2)}%</Tag>
        ),
        sorter: (a: AggregatedReport, b: AggregatedReport) => a.persentase_rp - b.persentase_rp,
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
        title: 'Aksi',
        key: 'action',
        width: 100,
        fixed: 'right' as const,
        render: (_: unknown, record: AggregatedReport) => (
          <Button
            type="link"
            icon={<EyeOutlined />}
            onClick={() => loadDetail(record)}
          >
            Detail
          </Button>
        ),
      }
    );

    return cols;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const detailColumns: any[] = useMemo(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const baseCols: any[] = [
      {
        title: 'Puskesmas',
        dataIndex: ['user', 'nama_puskesmas'],
        key: 'puskesmas',
        width: 200,
        sorter: (a: DetailLaporan, b: DetailLaporan) =>
          (a.user?.nama_puskesmas || '').localeCompare(b.user?.nama_puskesmas || ''),
      },
    ];

    if (groupBy === 'sumber_anggaran') {
      baseCols.push({
        title: 'Sub Kegiatan',
        dataIndex: ['subKegiatan', 'kegiatan'],
        key: 'sub_kegiatan',
        width: 250,
        sorter: (a: DetailLaporan, b: DetailLaporan) =>
          (a.subKegiatan?.kegiatan || '').localeCompare(b.subKegiatan?.kegiatan || ''),
      });
    }

    if (groupBy === 'sub_kegiatan') {
      baseCols.push({
        title: 'Sumber Anggaran',
        dataIndex: ['sumberAnggaran', 'sumber'],
        key: 'sumber',
        width: 150,
        sorter: (a: DetailLaporan, b: DetailLaporan) =>
          (a.sumberAnggaran?.sumber || '').localeCompare(b.sumberAnggaran?.sumber || ''),
      });
    }

    // Common detail columns - Order: Target Anggaran, Angkas, Realisasi (Rp), Capaian Anggaran, Capaian Angkas, Target (K), Satuan, Realisasi (K), Capaian K, Realisasi Fisik
    return [
      ...baseCols,
      {
        title: 'Target Anggaran (Rp)',
        dataIndex: 'target_rp',
        key: 'target_rp',
        width: 150,
        align: 'right' as const,
        render: (value: number) => formatNumber(value),
        sorter: (a: DetailLaporan, b: DetailLaporan) => a.target_rp - b.target_rp,
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
        title: 'Realisasi (Rp)',
        dataIndex: 'realisasi_rp',
        key: 'realisasi_rp',
        width: 120,
        align: 'right' as const,
        render: (value: number) => formatNumber(value),
        sorter: (a: DetailLaporan, b: DetailLaporan) => a.realisasi_rp - b.realisasi_rp,
      },
      {
        title: 'Capaian Anggaran (%)',
        key: 'persen_rp',
        width: 120,
        align: 'right' as const,
        render: (_: unknown, record: DetailLaporan) => {
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
        title: 'Capaian Angkas (%)',
        key: 'persen_angkas',
        width: 120,
        align: 'right' as const,
        render: (_: unknown, record: DetailLaporan) => {
          if (record.angkas === 0) return '0.00%';
          const capaian = (record.realisasi_rp / record.angkas) * 100;
          return `${capaian.toFixed(2)}%`;
        },
        sorter: (a: DetailLaporan, b: DetailLaporan) => {
          const aCapaian = a.angkas === 0 ? 0 : (a.realisasi_rp / a.angkas) * 100;
          const bCapaian = b.angkas === 0 ? 0 : (b.realisasi_rp / b.angkas) * 100;
          return aCapaian - bCapaian;
        },
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
        render: (_: unknown, record: DetailLaporan) => {
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
          return <Tag color={statusTagColors[status] || 'default'}>{status}</Tag>;
        },
        sorter: (a: DetailLaporan, b: DetailLaporan) => a.status.localeCompare(b.status),
      },
    ];
  }, [groupBy]);

  // Calculate summary statistics
  const totalLaporan = reports.reduce((sum, r) => sum + r.jumlah_laporan, 0);
  const totalAngkas = reports.reduce((sum, r) => sum + r.total_angkas, 0);
  const totalTargetRp = reports.reduce((sum, r) => sum + r.total_target_rp, 0);
  const totalRealisasiRp = reports.reduce((sum, r) => sum + r.total_realisasi_rp, 0);
  const overallPersentase = totalTargetRp > 0 ? (totalRealisasiRp / totalTargetRp) * 100 : 0;

  const getRowKey = (record: AggregatedReport) => {
    if (groupBy === 'sub_kegiatan') {
      return `${(record as AggregatedReportSubKegiatan).id_sub_kegiatan}-${record.bulan}-${record.tahun}`;
    }
    return `${(record as AggregatedReportSumberAnggaran).id_sumber_anggaran}-${record.bulan}-${record.tahun}`;
  };

  return (
    <div>
      <Title level={2}>
        {groupBy === 'sub_kegiatan' ? 'Laporan Per Sub Kegiatan' : 'Laporan Per Sumber Anggaran'}
      </Title>

      {/* Summary Statistics */}
      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col span={6}>
          <Card>
            <Statistic
              title={groupBy === 'sub_kegiatan' ? 'Total Sub Kegiatan' : 'Total Sumber Anggaran'}
              value={reports.length}
              prefix={groupBy === 'sub_kegiatan' ? <FileTextOutlined /> : <DollarOutlined />}
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
              title={groupBy === 'sumber_anggaran' ? 'Total Angkas' : 'Total Target'}
              value={groupBy === 'sumber_anggaran' ? totalAngkas : totalTargetRp}
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
              valueStyle={{ color: overallPersentase >= 70 ? 'var(--c-success)' : 'var(--c-err)' }}
            />
          </Card>
        </Col>
      </Row>

      {/* Filters */}
      <Card style={{ marginBottom: 16 }}>
        <Space wrap>
          <Radio.Group
            value={groupBy}
            onChange={(e) => setGroupBy(e.target.value)}
            buttonStyle="solid"
          >
            <Radio.Button value="sub_kegiatan">
              <FileTextOutlined /> Per Sub Kegiatan
            </Radio.Button>
            <Radio.Button value="sumber_anggaran">
              <DollarOutlined /> Per Sumber Anggaran
            </Radio.Button>
          </Radio.Group>
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
          key={`table-${groupBy}`}
          columns={columns}
          dataSource={reports as any[]}
          rowKey={getRowKey}
          loading={loading}
          pagination={{ pageSize: 20, showTotal: (total) => `Total ${total} records` }}
          sticky
          scroll={{ x: groupBy === 'sub_kegiatan' ? 2000 : 1500, y: 500 }}
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
        width={modalWidths.lg}
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
          scroll={{ x: groupBy === 'sumber_anggaran' ? 1100 : 1000, y: 400 }}
        />
      </Modal>
    </div>
  );
};

export default AdminLaporanPage;
