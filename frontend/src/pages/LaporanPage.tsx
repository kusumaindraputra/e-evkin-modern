import React, { useState, useEffect } from 'react';
import {
  Table,
  Button,
  Space,
  Tag,
  Typography,
  Row,
  Col,
  Card,
  Select,
  Modal,
  message,
  Popconfirm,
} from 'antd';
import {
  PlusOutlined,
  EyeOutlined,
  EditOutlined,
  DeleteOutlined,
  DownloadOutlined,
  SendOutlined,
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import axios from 'axios';
import LaporanForm from '../components/LaporanForm';
import LaporanDetail from '../components/LaporanDetail';
import { useAuthStore } from '../store/authStore';

const { Title } = Typography;

interface LaporanData {
  id: string;
  user_id: string;
  id_kegiatan: number;
  id_sub_kegiatan: number;
  id_sumber_anggaran: number;
  id_satuan: number;
  target_k: number;
  angkas: number;
  target_rp: number;
  realisasi_k: number;
  realisasi_rp: number;
  permasalahan: string;
  upaya: string;
  bulan: string;
  tahun: number;
  status: string;
  subKegiatan?: {
    kegiatan: string;
    indikator_kinerja: string;
    kode_sub: string;
    kegiatanParent?: {
      id_kegiatan: number;
      kegiatan: string;
      kode: string;
    };
  };
  sumberAnggaran?: {
    sumber: string;
  };
  satuan?: {
    satuannya: string;
  };
  created_at: string;
  updated_at: string;
}

export const LaporanPage: React.FC = () => {
  const { user, token } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [laporanData, setLaporanData] = useState<LaporanData[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  const [selectedLaporan, setSelectedLaporan] = useState<any>(null);
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [detailLaporan, setDetailLaporan] = useState<any>(null);
  const [submitLoading, setSubmitLoading] = useState(false);
  
  // Pagination
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0,
  });
  
  // Filters
  const [filterBulan, setFilterBulan] = useState<string>('');
  const [filterTahun, setFilterTahun] = useState<number | undefined>(undefined);
  const [filterStatus, setFilterStatus] = useState<string>('');

  const bulanOptions = [
    { value: 'Januari', label: 'Januari' },
    { value: 'Februari', label: 'Februari' },
    { value: 'Maret', label: 'Maret' },
    { value: 'April', label: 'April' },
    { value: 'Mei', label: 'Mei' },
    { value: 'Juni', label: 'Juni' },
    { value: 'Juli', label: 'Juli' },
    { value: 'Agustus', label: 'Agustus' },
    { value: 'September', label: 'September' },
    { value: 'Oktober', label: 'Oktober' },
    { value: 'November', label: 'November' },
    { value: 'Desember', label: 'Desember' },
  ];

  const tahunOptions = Array.from({ length: 5 }, (_, i) => {
    const year = new Date().getFullYear() - i;
    return { value: year, label: year.toString() };
  });

  const statusOptions = [
    { value: '', label: 'Semua Status' },
    { value: 'menunggu', label: 'Menunggu' },
    { value: 'terkirim', label: 'Terkirim' },
    { value: 'diverifikasi', label: 'Diverifikasi' },
    { value: 'ditolak', label: 'Ditolak' },
  ];

  useEffect(() => {
    loadLaporanData();
  }, [filterBulan, filterTahun, filterStatus]);

  const loadLaporanData = async (page = 1, pageSize = 10) => {
    setLoading(true);
    try {
      const params: any = {
        page,
        limit: pageSize,
      };
      if (filterBulan) params.bulan = filterBulan;
      if (filterTahun) params.tahun = filterTahun;
      if (filterStatus) params.status = filterStatus;

      console.log('Loading laporan with params:', params);

      const response = await axios.get('http://localhost:5000/api/laporan', {
        headers: { Authorization: `Bearer ${token}` },
        params,
      });

      console.log('Laporan response:', response.data);

      // Handle response structure: { data: [...], pagination: {...} }
      const data = response.data.data || response.data;
      const paginationData = response.data.pagination || {};
      
      setLaporanData(Array.isArray(data) ? data : []);
      setPagination({
        current: paginationData.page || page,
        pageSize: paginationData.limit || pageSize,
        total: paginationData.total || 0,
      });
      
      console.log('Laporan data set:', Array.isArray(data) ? data : []);
    } catch (error: any) {
      console.error('Error loading laporan:', error);
      message.error(error.response?.data?.message || 'Gagal memuat data laporan');
      setLaporanData([]);
    } finally {
      setLoading(false);
    }
  };

  const handleTableChange = (paginationConfig: any) => {
    loadLaporanData(paginationConfig.current, paginationConfig.pageSize);
  };

  const handleCreate = () => {
    setModalMode('create');
    setSelectedLaporan(null);
    setModalVisible(true);
  };

  const handleEdit = (record: LaporanData) => {
    setModalMode('edit');
    setSelectedLaporan({
      ...record,
      id_kegiatan: record.subKegiatan?.kegiatanParent?.id_kegiatan || record.id_kegiatan,
    });
    setModalVisible(true);
  };

  const handleView = (record: LaporanData) => {
    setDetailLaporan(record);
    setDetailModalVisible(true);
  };

  const handleDelete = async (id: string) => {
    try {
      await axios.delete(`http://localhost:5000/api/laporan/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      message.success('Laporan berhasil dihapus');
      loadLaporanData();
    } catch (error: any) {
      message.error(error.response?.data?.message || 'Gagal menghapus laporan');
    }
  };

  const handleSubmit = async (values: any) => {
    try {
      const now = new Date();
      const bulanSekarang = bulanOptions[now.getMonth()].value; // Get current month name
      const tahunSekarang = now.getFullYear();
      
      const payload = {
        ...values,
        // user_id akan diambil otomatis dari token di backend
        bulan: bulanSekarang,
        tahun: tahunSekarang,
      };

      console.log('Submitting laporan:', payload);

      if (modalMode === 'create') {
        await axios.post('http://localhost:5000/api/laporan', payload, {
          headers: { Authorization: `Bearer ${token}` },
        });
        message.success('Laporan berhasil dibuat');
      } else {
        await axios.put(`http://localhost:5000/api/laporan/${selectedLaporan.id}`, payload, {
          headers: { Authorization: `Bearer ${token}` },
        });
        message.success('Laporan berhasil diupdate');
      }

      setModalVisible(false);
      loadLaporanData();
    } catch (error: any) {
      throw error;
    }
  };

  const handleSubmitLaporan = async () => {
    if (!user || !token) return;

    if (!filterBulan) {
      message.warning('Pilih bulan terlebih dahulu');
      return;
    }

    setSubmitLoading(true);
    try {
      await axios.post(
        'http://localhost:5000/api/laporan/submit',
        {
          bulan: filterBulan,
          tahun: filterTahun,
          // user_id akan diambil otomatis dari token di backend
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      message.success(`Laporan ${filterBulan} ${filterTahun} berhasil dikirim`);
      loadLaporanData();
    } catch (error: any) {
      message.error(error.response?.data?.message || 'Gagal mengirim laporan');
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleExportExcel = async () => {
    try {
      const tahun = filterTahun || new Date().getFullYear();
      const params = new URLSearchParams();
      if (filterBulan) params.append('bulan', filterBulan);
      params.append('tahun', tahun.toString());

      const response = await axios.get(
        `http://localhost:5000/api/export/laporan?${params.toString()}`,
        {
          headers: { Authorization: `Bearer ${token}` },
          responseType: 'blob',
        }
      );

      // Create download link
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `Laporan_${filterBulan || 'All'}_${tahun}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      message.success('Excel berhasil di-download');
    } catch (error: any) {
      message.error(error.response?.data?.message || 'Gagal export Excel');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'diverifikasi':
        return 'success';
      case 'terkirim':
        return 'processing';
      case 'menunggu':
        return 'warning';
      case 'ditolak':
        return 'error';
      default:
        return 'default';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'diverifikasi':
        return 'Diverifikasi';
      case 'terkirim':
        return 'Terkirim';
      case 'menunggu':
        return 'Menunggu';
      case 'ditolak':
        return 'Ditolak';
      default:
        return status;
    }
  };

  const formatNumber = (num: number | string) => {
    if (num === null || num === undefined || num === '') return '0';
    const numValue = typeof num === 'string' ? parseFloat(num) : num;
    if (isNaN(numValue)) return '0';
    return numValue.toLocaleString('id-ID');
  };

  const formatPercentage = (num: number) => {
    if (num === null || num === undefined) return '0,00';
    return num.toLocaleString('id-ID', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  const columns: ColumnsType<LaporanData> = [
    {
      title: 'NO',
      key: 'no',
      width: 60,
      align: 'center',
      render: (_, __, index) => (pagination.current - 1) * pagination.pageSize + index + 1,
    },
    {
      title: 'Bulan',
      dataIndex: 'bulan',
      key: 'bulan',
      width: 100,
      align: 'center',
    },
    {
      title: 'Kode',
      key: 'kode',
      width: 120,
      align: 'center',
      render: (_, record) => record.subKegiatan?.kode_sub || '-',
    },
    {
      title: 'Kegiatan',
      key: 'kegiatan',
      width: 200,
      align: 'center',
      render: (_, record) => record.subKegiatan?.kegiatanParent?.kegiatan || '-',
    },
    {
      title: 'Sub Kegiatan',
      key: 'sub_kegiatan',
      width: 250,
      align: 'center',
      render: (_, record) => record.subKegiatan?.kegiatan || '-',
    },
    {
      title: 'Sumber Anggaran',
      key: 'sumber_anggaran',
      width: 150,
      align: 'center',
      render: (_, record) => record.sumberAnggaran?.sumber || '-',
    },
    {
      title: 'Indikator Kinerja',
      key: 'indikator_kinerja',
      width: 300,
      align: 'center',
      render: (_, record) => (
        <div style={{ whiteSpace: 'pre-wrap' }}>
          {record.subKegiatan?.indikator_kinerja || '-'}
        </div>
      ),
    },
    {
      title: 'Satuan',
      key: 'satuan',
      width: 100,
      align: 'center',
      render: (_, record) => record.satuan?.satuannya || '-',
    },
    {
      title: 'Target (K)',
      dataIndex: 'target_k',
      key: 'target_k',
      width: 100,
      align: 'center',
      render: (val) => formatNumber(val),
    },
    {
      title: 'Target Angkas (Rp)',
      dataIndex: 'angkas',
      key: 'angkas',
      width: 150,
      align: 'center',
      render: (val) => formatNumber(val),
    },
    {
      title: 'Target Pagu (Rp)',
      dataIndex: 'target_rp',
      key: 'target_rp',
      width: 150,
      align: 'center',
      render: (val) => formatNumber(val),
    },
    {
      title: 'Realisasi (K)',
      dataIndex: 'realisasi_k',
      key: 'realisasi_k',
      width: 100,
      align: 'center',
      render: (val) => formatNumber(val),
    },
    {
      title: 'Realisasi (Rp)',
      dataIndex: 'realisasi_rp',
      key: 'realisasi_rp',
      width: 150,
      align: 'center',
      render: (val) => formatNumber(val),
    },
    {
      title: 'Capaian K (%)',
      key: 'capaian_k',
      width: 100,
      align: 'center',
      render: (_, record) => {
        if (record.target_k === 0) return '0,00';
        const capaian = (record.realisasi_k / record.target_k) * 100;
        return formatPercentage(capaian);
      },
    },
    {
      title: 'Capaian Angkas (%)',
      key: 'capaian_angkas',
      width: 120,
      align: 'center',
      render: (_, record) => {
        if (record.angkas === 0) return '0,00';
        const capaian = (record.realisasi_rp / record.angkas) * 100;
        return formatPercentage(capaian);
      },
    },
    {
      title: 'Capaian Pagu (%)',
      key: 'capaian_pagu',
      width: 120,
      align: 'center',
      render: (_, record) => {
        if (record.target_rp === 0) return '0,00';
        const capaian = (record.realisasi_rp / record.target_rp) * 100;
        return formatPercentage(capaian);
      },
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      width: 120,
      align: 'center',
      render: (status: string) => (
        <Tag color={getStatusColor(status)}>{getStatusText(status)}</Tag>
      ),
    },
    {
      title: 'Aksi',
      key: 'action',
      width: 180,
      align: 'center',
      render: (_, record) => (
        <Space size="small">
          <Button
            type="link"
            size="small"
            icon={<EyeOutlined />}
            onClick={() => handleView(record)}
          >
            Lihat
          </Button>
          {record.status === 'menunggu' && (
            <>
              <Button
                type="link"
                size="small"
                icon={<EditOutlined />}
                onClick={() => handleEdit(record)}
              >
                Edit
              </Button>
              <Popconfirm
                title="Hapus laporan ini?"
                description="Data yang dihapus tidak dapat dikembalikan"
                onConfirm={() => handleDelete(record.id)}
                okText="Ya"
                cancelText="Tidak"
              >
                <Button
                  type="link"
                  danger
                  size="small"
                  icon={<DeleteOutlined />}
                />
              </Popconfirm>
            </>
          )}
        </Space>
      ),
    },
  ];

  return (
    <div>
      <Row justify="space-between" align="middle" style={{ marginBottom: 24 }}>
        <Col>
          <Title level={3}>Laporan Kinerja</Title>
        </Col>
        <Col>
          <Space>
            {user?.role === 'puskesmas' && filterBulan && (
              <Button 
                type="default" 
                icon={<SendOutlined />}
                loading={submitLoading}
                onClick={handleSubmitLaporan}
              >
                Kirim Laporan {filterBulan} {filterTahun}
              </Button>
            )}
            <Button icon={<DownloadOutlined />} onClick={handleExportExcel}>
              Export Excel
            </Button>
            {user?.role === 'puskesmas' && (
              <Button type="primary" icon={<PlusOutlined />} onClick={handleCreate}>
                Tambah Laporan
              </Button>
            )}
          </Space>
        </Col>
      </Row>

      {/* Filter Section */}
      <Card style={{ marginBottom: 16 }}>
        <Row gutter={[16, 16]}>
          <Col xs={24} sm={8} md={6}>
            <Select
              placeholder="Pilih bulan"
              style={{ width: '100%' }}
              value={filterBulan}
              onChange={setFilterBulan}
              options={bulanOptions}
              allowClear
            />
          </Col>
          <Col xs={24} sm={8} md={6}>
            <Select
              placeholder="Pilih tahun"
              style={{ width: '100%' }}
              value={filterTahun}
              onChange={setFilterTahun}
              options={tahunOptions}
            />
          </Col>
          <Col xs={24} sm={8} md={6}>
            <Select
              placeholder="Pilih status"
              style={{ width: '100%' }}
              value={filterStatus}
              onChange={setFilterStatus}
              options={statusOptions}
            />
          </Col>
        </Row>
      </Card>

      {/* Table */}
      <Card>
        <Table
          columns={columns}
          dataSource={laporanData}
          loading={loading}
          rowKey="id"
          rowClassName={(_, index) => index % 2 === 0 ? 'table-row-light' : 'table-row-dark'}
          scroll={{ x: 3000 }}
          pagination={{
            current: pagination.current,
            pageSize: pagination.pageSize,
            total: pagination.total,
            showSizeChanger: true,
            pageSizeOptions: ['10', '25', '50', '100'],
            showTotal: (total) => `Total ${total} laporan`,
          }}
          onChange={handleTableChange}
        />
      </Card>

      {/* Modal Form */}
      <Modal
        title={modalMode === 'create' ? 'Tambah Laporan Baru' : 'Edit Laporan'}
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        footer={null}
        width={900}
      >
        <LaporanForm
          mode={modalMode}
          initialValues={selectedLaporan}
          onSubmit={handleSubmit}
          onCancel={() => setModalVisible(false)}
        />
      </Modal>

      {/* Modal Detail */}
      <Modal
        title="Detail Laporan"
        open={detailModalVisible}
        onCancel={() => setDetailModalVisible(false)}
        footer={null}
        width={1000}
      >
        {detailLaporan && <LaporanDetail laporan={detailLaporan} />}
      </Modal>
    </div>
  );
};
