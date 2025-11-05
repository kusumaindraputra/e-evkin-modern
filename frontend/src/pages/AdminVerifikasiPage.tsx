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
  Input,
  message,
} from 'antd';
import { EyeOutlined, SearchOutlined, DownloadOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';

const { Title } = Typography;

interface VerifikasiData {
  user_id: string;
  puskesmas: string;
  nama_lengkap: string;
  kecamatan: string;
  wilayah: string;
  bulan: string;
  tahun: number;
  total_laporan: number;
  terkirim: number;
  diverifikasi: number;
  ditolak: number;
}

export const AdminVerifikasiPage: React.FC = () => {
  const navigate = useNavigate();
  const { token } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [dataSource, setDataSource] = useState<VerifikasiData[]>([]);
  
  // Pagination
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0,
  });
  
  // Filters
  const [filterPuskesmas, setFilterPuskesmas] = useState<string>('');
  const [filterBulan, setFilterBulan] = useState<string>('');
  const [filterTahun, setFilterTahun] = useState<number | undefined>(undefined);

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

  const currentYear = new Date().getFullYear();
  const tahunOptions = Array.from({ length: 5 }, (_, i) => ({
    value: currentYear - i,
    label: String(currentYear - i),
  }));

  useEffect(() => {
    loadVerifikasiData(pagination.current, pagination.pageSize);
  }, [filterPuskesmas, filterBulan, filterTahun]);

  const loadVerifikasiData = async (page = 1, pageSize = 10) => {
    setLoading(true);
    try {
      const params: any = { page, pageSize };
      if (filterPuskesmas) params.puskesmas = filterPuskesmas;
      if (filterBulan) params.bulan = filterBulan;
      if (filterTahun) params.tahun = filterTahun;

      const response = await axios.get('http://localhost:5000/api/admin/verifikasi', {
        headers: { Authorization: `Bearer ${token}` },
        params,
      });

      const result = response.data.data || response.data;
      const paginationData = response.data.pagination;

      setDataSource(result);
      setPagination({
        current: paginationData?.page || page,
        pageSize: paginationData?.pageSize || pageSize,
        total: paginationData?.total || result.length,
      });
    } catch (error: any) {
      message.error(error.response?.data?.message || 'Gagal mengambil data verifikasi');
      console.error('Load verifikasi error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleTableChange = (newPagination: any) => {
    loadVerifikasiData(newPagination.current, newPagination.pageSize);
  };

  const handleViewDetail = (record: VerifikasiData) => {
    navigate(`/admin/laporan/${record.user_id}/${record.bulan}/${record.tahun}`);
  };

  const handleExportExcel = async () => {
    try {
      const params = new URLSearchParams();
      if (filterPuskesmas) params.append('puskesmas', filterPuskesmas);
      if (filterBulan) params.append('bulan', filterBulan);
      if (filterTahun) params.append('tahun', filterTahun.toString());

      const response = await axios.get(
        `http://localhost:5000/api/export/admin/laporan?${params.toString()}`,
        {
          headers: { Authorization: `Bearer ${token}` },
          responseType: 'blob',
        }
      );

      // Create download link
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `Laporan_Admin_${filterBulan || 'All'}_${filterTahun || new Date().getFullYear()}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      message.success('Excel berhasil di-download');
    } catch (error: any) {
      message.error(error.response?.data?.message || 'Gagal export Excel');
    }
  };

  const columns: ColumnsType<VerifikasiData> = [
    {
      title: 'NO',
      key: 'no',
      width: 60,
      align: 'center',
      render: (_, __, index) => (pagination.current - 1) * pagination.pageSize + index + 1,
    },
    {
      title: 'Puskesmas',
      dataIndex: 'puskesmas',
      key: 'puskesmas',
      width: 200,
    },
    {
      title: 'Nama Lengkap',
      dataIndex: 'nama_lengkap',
      key: 'nama_lengkap',
      width: 180,
    },
    {
      title: 'Kecamatan',
      dataIndex: 'kecamatan',
      key: 'kecamatan',
      width: 150,
    },
    {
      title: 'Wilayah',
      dataIndex: 'wilayah',
      key: 'wilayah',
      width: 120,
    },
    {
      title: 'Bulan',
      dataIndex: 'bulan',
      key: 'bulan',
      align: 'center',
      width: 100,
    },
    {
      title: 'Tahun',
      dataIndex: 'tahun',
      key: 'tahun',
      align: 'center',
      width: 80,
    },
    {
      title: 'Total Laporan',
      dataIndex: 'total_laporan',
      key: 'total_laporan',
      align: 'center',
      width: 100,
    },
    {
      title: 'Status',
      key: 'status',
      width: 200,
      render: (_, record) => (
        <Space direction="vertical" size={2}>
          {record.terkirim > 0 && (
            <Tag color="blue">Terkirim: {record.terkirim}</Tag>
          )}
          {record.diverifikasi > 0 && (
            <Tag color="green">Diverifikasi: {record.diverifikasi}</Tag>
          )}
          {record.ditolak > 0 && (
            <Tag color="red">Ditolak: {record.ditolak}</Tag>
          )}
        </Space>
      ),
    },
    {
      title: 'Aksi',
      key: 'aksi',
      fixed: 'right',
      width: 120,
      align: 'center',
      render: (_, record) => (
        <Button
          type="primary"
          size="small"
          icon={<EyeOutlined />}
          onClick={() => handleViewDetail(record)}
        >
          Lihat Detail
        </Button>
      ),
    },
  ];

  return (
    <div>
      <Row justify="space-between" align="middle" style={{ marginBottom: 24 }}>
        <Col>
          <Title level={3}>Verifikasi Laporan Kinerja</Title>
        </Col>
        <Col>
          <Button
            type="primary"
            icon={<DownloadOutlined />}
            onClick={handleExportExcel}
          >
            Export Excel
          </Button>
        </Col>
      </Row>

      {/* Filter Section */}
      <Card style={{ marginBottom: 16 }}>
        <Row gutter={[16, 16]}>
          <Col xs={24} sm={8} md={8}>
            <Input
              placeholder="Cari puskesmas..."
              prefix={<SearchOutlined />}
              value={filterPuskesmas}
              onChange={(e) => setFilterPuskesmas(e.target.value)}
              allowClear
            />
          </Col>
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
              allowClear
            />
          </Col>
          <Col xs={24} sm={24} md={4}>
            <Button
              type="primary"
              block
              onClick={() => loadVerifikasiData(1, pagination.pageSize)}
            >
              Cari
            </Button>
          </Col>
        </Row>
      </Card>

      {/* Table */}
      <Card>
        <Table
          loading={loading}
          columns={columns}
          dataSource={dataSource}
          rowKey={(record) => `${record.user_id}_${record.bulan}_${record.tahun}`}
          pagination={pagination}
          onChange={handleTableChange}
          scroll={{ x: 1400 }}
        />
      </Card>
    </div>
  );
};

export default AdminVerifikasiPage;
