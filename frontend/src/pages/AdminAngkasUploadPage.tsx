import React, { useState, useEffect } from 'react';
import {
  Card,
  Table,
  Button,
  Select,
  message,
  Tag,
  Row,
  Col,
  Upload,
  Progress,
  Tabs,
  Typography,
  Space,
  Popconfirm,
  InputNumber,
  Alert,
  Statistic,
} from 'antd';
import AppModal from '../components/AppModal';
  Timeline,
} from 'antd';
import { UploadOutlined, LoadingOutlined, DeleteOutlined, LinkOutlined, InfoCircleOutlined, HistoryOutlined } from '@ant-design/icons';
import axios from 'axios';
import API_BASE_URL from '../config/api';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';

const { Title, Text } = Typography;

interface AngkasRecord {
  user_id: string;
  puskesmas: {
    id: string;
    nama: string;
    username: string;
  };
  id_sub_kegiatan: number;
  subKegiatan: {
    id_sub_kegiatan: number;
    kegiatan: string;
    kode_sub: string;
  };
  id_sumber_anggaran: number;
  sumberAnggaran: {
    id_sumber: number;
    sumber: string;
  };
  tahun: number;
  target_rp: number;
  bulanan: number[]; // Index 0 = Jan, 11 = Dec
  total: number;
  hasAngkas: boolean; // Flag indicating if angkas data exists
}

interface UnmatchedRecord {
  id: number;
  kode_rekening: string;
  uraian: string;
  tahun: number;
  puskesmas: {
    id: string;
    nama: string;
  };
  sumberAnggaran: {
    id: number;
    nama: string;
  };
}

interface SumberAnggaran {
  value: number;
  label: string;
}

interface SubKegiatan {
  value: number;
  label: string;
}

interface HistoryRecord {
  id: number;
  bulan: number;
  nilai: number;
  created_at: string;
  creator: {
    id: number;
    username: string;
    nama: string;
  };
}

interface HistoryAllResponse {
  angkasHistory: {
    bulan: number;
    values: HistoryRecord[];
  }[];
  targetAnggaran: {
    id: number;
    target_rp: number;
    created_at: string;
    creator: {
      id: number;
      username: string;
      nama: string;
    };
  }[];
  targetKinerja: {
    id: number;
    target_k: number;
    satuan: string;
    created_at: string;
    creator: {
      id: number;
      username: string;
      nama: string;
    };
  }[];
}

const AdminAngkasUploadPage: React.FC = () => {
  const navigate = useNavigate();
  const { token } = useAuthStore();

  const [angkasData, setAngkasData] = useState<AngkasRecord[]>([]);
  const [unmatchedData, setUnmatchedData] = useState<UnmatchedRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [sumberAnggaranList, setSumberAnggaranList] = useState<SumberAnggaran[]>([]);
  const [subKegiatanList, setSubKegiatanList] = useState<SubKegiatan[]>([]);
  const [stats, setStats] = useState({ total: 0, withAngkas: 0, withoutAngkas: 0 });
  
  // Upload state
  const [uploadModalVisible, setUploadModalVisible] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadStatus, setUploadStatus] = useState<'uploading' | 'processing'>('uploading');

  // Filters
  const [filters, setFilters] = useState({
    tahun: new Date().getFullYear(),
    id_sumber_anggaran: undefined as number | undefined,
    status: 'all' as 'all' | 'uploaded' | 'not_uploaded',
  });

  // Match modal
  const [matchModalVisible, setMatchModalVisible] = useState(false);
  const [selectedUnmatched, setSelectedUnmatched] = useState<UnmatchedRecord | null>(null);
  const [selectedSubKegiatan, setSelectedSubKegiatan] = useState<number | undefined>();

  // History modal
  const [historyModalVisible, setHistoryModalVisible] = useState(false);
  const [selectedAngkasRecord, setSelectedAngkasRecord] = useState<AngkasRecord | null>(null);
  const [historyAllData, setHistoryAllData] = useState<HistoryAllResponse | null>(null);
  const [historyLoading, setHistoryLoading] = useState(false);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const formatDate = (dateString: string | null | undefined) => {
    try {
      if (!dateString) return 'No Date';
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return 'Invalid Date';
      const day = date.getDate().toString().padStart(2, '0');
      const month = (date.getMonth() + 1).toString().padStart(2, '0');
      const year = date.getFullYear();
      const hours = date.getHours().toString().padStart(2, '0');
      const minutes = date.getMinutes().toString().padStart(2, '0');
      return `${day}/${month}/${year} ${hours}:${minutes}`;
    } catch (error) {
      console.error('Error formatting date:', error);
      return 'Format Error';
    }
  };

  const bulanNames = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
  ];

  useEffect(() => {
    loadReferenceData();
  }, []);

  useEffect(() => {
    loadAngkasData();
  }, [filters]);

  const loadReferenceData = async () => {
    try {
      const [sumberResponse, subKegiatanResponse] = await Promise.all([
        axios.get(`${API_BASE_URL}/reference/sumber-anggaran`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        axios.get(`${API_BASE_URL}/reference/sub-kegiatan`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);

      // Reference API returns array directly with value/label format
      setSumberAnggaranList(
        (sumberResponse.data || []).map((item: any) => ({
          value: item.value,
          label: item.label,
        }))
      );

      setSubKegiatanList(
        (subKegiatanResponse.data || []).map((item: any) => ({
          value: item.value,
          label: item.label,
        }))
      );
    } catch (error: any) {
      console.error('Error loading reference data:', error);
      if (error.response?.status === 401) {
        message.error('Session expired. Please login again.');
        navigate('/login');
      }
    }
  };

  const loadAngkasData = async () => {
    setLoading(true);
    try {
      const params: any = {
        tahun: filters.tahun,
      };

      if (filters.id_sumber_anggaran) {
        params.id_sumber_anggaran = filters.id_sumber_anggaran;
      }

      const response = await axios.get(`${API_BASE_URL}/angkas`, {
        headers: { Authorization: `Bearer ${token}` },
        params,
      });

      setAngkasData(response.data.data || []);
      
      // Update stats from response
      setStats({
        total: response.data.total || 0,
        withAngkas: response.data.withAngkas || 0,
        withoutAngkas: response.data.withoutAngkas || 0,
      });
    } catch (error: any) {
      console.error('Error loading angkas:', error);
      if (error.response?.status === 401) {
        message.error('Session expired. Please login again.');
        navigate('/login');
        return;
      }
      message.error('Gagal memuat data angkas');
    } finally {
      setLoading(false);
    }
  };

  const loadUnmatchedData = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${API_BASE_URL}/angkas/unmatched`, {
        headers: { Authorization: `Bearer ${token}` },
        params: { tahun: filters.tahun },
      });

      setUnmatchedData(response.data.data || []);
    } catch (error: any) {
      console.error('Error loading unmatched:', error);
      message.error('Gagal memuat data unmatched');
    } finally {
      setLoading(false);
    }
  };

  const handleUpload = async (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('tahun', filters.tahun.toString());

    setUploading(true);
    setUploadProgress(0);
    setUploadStatus('uploading');

    let simulatedProgress = 0;
    const progressInterval = setInterval(() => {
      simulatedProgress += Math.random() * 5 + 1;
      if (simulatedProgress > 85) simulatedProgress = 85;
      setUploadProgress(Math.round(simulatedProgress));
    }, 500);

    try {
      setTimeout(() => setUploadStatus('processing'), 1000);

      const response = await axios.post(`${API_BASE_URL}/angkas/upload`, formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data',
        },
      });

      clearInterval(progressInterval);
      setUploadProgress(100);

      const result = response.data.result;

      Modal.success({
        title: 'Upload Selesai',
        width: 700,
        content: (
          <div>
            <p><strong>Puskesmas Ditemukan:</strong> {response.data.parsedPuskesmas}</p>
            <p><strong>Total Berhasil:</strong> {result.success} data</p>
            <p style={{ marginLeft: 20, color: '#52c41a' }}>
              • Inserted (Baru): {result.inserted}
            </p>
            <p style={{ marginLeft: 20, color: '#1890ff' }}>
              • Updated (Nilai Berubah - History Baru): {result.updated}
            </p>
            <p style={{ marginLeft: 20, color: '#faad14' }}>
              • Skipped (Nilai Sama/Zero): {result.skipped}
            </p>
            <p><strong>Gagal:</strong> {result.failed} data</p>

            {result.detectedSumberAnggaran?.length > 0 && (
              <div style={{ marginTop: 12 }}>
                <p style={{ color: '#1890ff' }}>
                  <strong>Sumber Anggaran Terdeteksi dari PDF:</strong>
                </p>
                <ul style={{ marginLeft: 20, color: '#1890ff' }}>
                  {result.detectedSumberAnggaran.map((sa: any, idx: number) => (
                    <li key={idx}>{sa.kode} - {sa.nama}</li>
                  ))}
                </ul>
              </div>
            )}

            {result.createdSumberAnggaran > 0 && (
              <p style={{ color: '#52c41a', marginTop: 8 }}>
                <strong>Sumber Anggaran Baru Dibuat:</strong> {result.createdSumberAnggaran}
              </p>
            )}
            
            {result.unmatchedPuskesmas.length > 0 && (
              <div style={{ marginTop: 12 }}>
                <p style={{ color: '#ff4d4f' }}>
                  <strong>Puskesmas Tidak Ditemukan:</strong>
                </p>
                <ul style={{ marginLeft: 20, color: '#ff4d4f' }}>
                  {result.unmatchedPuskesmas.map((name: string, idx: number) => (
                    <li key={idx}>{name}</li>
                  ))}
                </ul>
              </div>
            )}

            {result.unmatchedSumberAnggaran?.length > 0 && (
              <div style={{ marginTop: 12 }}>
                <p style={{ color: '#faad14' }}>
                  <strong>Sumber Anggaran Tidak Ditemukan:</strong>
                </p>
                <ul style={{ marginLeft: 20, color: '#faad14' }}>
                  {result.unmatchedSumberAnggaran.map((name: string, idx: number) => (
                    <li key={idx}>{name}</li>
                  ))}
                </ul>
              </div>
            )}

            {result.errors.length > 0 && (
              <div style={{ marginTop: 12, maxHeight: 150, overflow: 'auto' }}>
                <p style={{ color: '#ff4d4f' }}><strong>Errors:</strong></p>
                {result.errors.slice(0, 10).map((err: any, idx: number) => (
                  <p key={idx} style={{ fontSize: 12, color: '#ff4d4f', marginLeft: 20 }}>
                    • {err.puskesmas}: {err.uraian} - {err.error}
                  </p>
                ))}
                {result.errors.length > 10 && (
                  <p style={{ fontSize: 12, color: '#999' }}>
                    ... dan {result.errors.length - 10} error lainnya
                  </p>
                )}
              </div>
            )}
          </div>
        ),
      });

      setUploadModalVisible(false);
      loadAngkasData();
    } catch (error: any) {
      clearInterval(progressInterval);
      console.error('Upload error:', error);
      message.error(error.response?.data?.error || 'Gagal mengupload file');
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }

    return false;
  };

  const handleMatchSubKegiatan = async () => {
    if (!selectedUnmatched || !selectedSubKegiatan) {
      message.error('Pilih sub kegiatan');
      return;
    }

    try {
      await axios.put(
        `${API_BASE_URL}/angkas/${selectedUnmatched.id}/match`,
        { id_sub_kegiatan: selectedSubKegiatan },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      message.success('Berhasil mencocokkan data');
      setMatchModalVisible(false);
      setSelectedUnmatched(null);
      setSelectedSubKegiatan(undefined);
      loadUnmatchedData();
      loadAngkasData();
    } catch (error: any) {
      console.error('Match error:', error);
      message.error(error.response?.data?.error || 'Gagal mencocokkan data');
    }
  };

  const handleBulkDelete = async () => {
    if (!filters.id_sumber_anggaran) {
      message.error('Pilih sumber anggaran untuk filter hapus');
      return;
    }

    try {
      const response = await axios.delete(`${API_BASE_URL}/angkas/bulk`, {
        headers: { Authorization: `Bearer ${token}` },
        data: {
          tahun: filters.tahun,
          id_sumber_anggaran: filters.id_sumber_anggaran,
        },
      });

      message.success(`Berhasil menghapus ${response.data.deleted} data`);
      loadAngkasData();
    } catch (error: any) {
      console.error('Delete error:', error);
      message.error('Gagal menghapus data');
    }
  };

  const handleViewHistory = async (record: AngkasRecord) => {
    setSelectedAngkasRecord(record);
    setHistoryModalVisible(true);
    setHistoryLoading(true);
    setHistoryAllData(null);

    try {
      const response = await axios.get(`${API_BASE_URL}/angkas/history/all`, {
        headers: { Authorization: `Bearer ${token}` },
        params: {
          user_id: record.user_id,
          id_sub_kegiatan: record.id_sub_kegiatan,
          tahun: filters.tahun,
        },
      });

      if (response.data.success) {
        setHistoryAllData(response.data.data);
      }
    } catch (error: any) {
      console.error('Error loading history:', error);
      if (error.response?.status === 401) {
        message.error('Session expired. Please login again.');
        navigate('/login');
        return;
      }
      message.error('Gagal memuat history');
    } finally {
      setHistoryLoading(false);
    }
  };

  // Generate monthly columns
  const monthlyColumns = bulanNames.map((name, idx) => ({
    title: name.substring(0, 3), // Short name: Jan, Feb, etc.
    dataIndex: ['bulanan', idx],
    key: `bulan_${idx}`,
    width: 90,
    align: 'right' as const,
    render: (value: number, record: AngkasRecord) => {
      if (!record.hasAngkas) {
        return <span style={{ color: '#bfbfbf' }}>-</span>;
      }
      return value ? formatCurrency(value) : '-';
    },
  }));

  const columns = [
    {
      title: 'Status',
      key: 'status',
      width: 90,
      fixed: 'left' as const,
      render: (_: any, record: AngkasRecord) => (
        record.hasAngkas ? (
          <Tag color="green">Uploaded</Tag>
        ) : (
          <Tag color="red">Belum</Tag>
        )
      ),
    },
    {
      title: 'Puskesmas',
      dataIndex: ['puskesmas', 'nama'],
      key: 'puskesmas',
      width: 130,
      fixed: 'left' as const,
    },
    {
      title: 'Sub Kegiatan',
      dataIndex: 'subKegiatan',
      key: 'subKegiatan',
      width: 180,
      ellipsis: true,
      render: (subKegiatan: any) => (
        <span title={subKegiatan?.kegiatan}>
          <Text code style={{ fontSize: 11 }}>{subKegiatan?.kode_sub}</Text>{' '}
          {subKegiatan?.kegiatan}
        </span>
      ),
    },
    {
      title: 'Sumber',
      dataIndex: ['sumberAnggaran', 'sumber'],
      key: 'sumberAnggaran',
      width: 100,
    },
    {
      title: 'Target Rp',
      dataIndex: 'target_rp',
      key: 'target_rp',
      width: 120,
      align: 'right' as const,
      render: (value: number) => formatCurrency(value || 0),
    },
    ...monthlyColumns,
    {
      title: 'Total Angkas',
      dataIndex: 'total',
      key: 'total',
      width: 120,
      fixed: 'right' as const,
      render: (value: number, record: AngkasRecord) => (
        <strong style={{ color: record.hasAngkas ? undefined : '#bfbfbf' }}>
          {formatCurrency(value)}
        </strong>
      ),
      align: 'right' as const,
    },
    {
      title: 'Aksi',
      key: 'action',
      width: 90,
      fixed: 'right' as const,
      render: (_: any, record: AngkasRecord) => (
        <Button
          size="small"
          icon={<HistoryOutlined />}
          onClick={() => handleViewHistory(record)}
        >
          History
        </Button>
      ),
    },
  ];

  const unmatchedColumns = [
    {
      title: 'Puskesmas',
      dataIndex: ['puskesmas', 'nama'],
      key: 'puskesmas',
    },
    {
      title: 'Kode Rekening',
      dataIndex: 'kode_rekening',
      key: 'kode_rekening',
    },
    {
      title: 'Uraian',
      dataIndex: 'uraian',
      key: 'uraian',
      ellipsis: true,
    },
    {
      title: 'Sumber Anggaran',
      dataIndex: ['sumberAnggaran', 'sumber'],
      key: 'sumberAnggaran',
    },
    {
      title: 'Aksi',
      key: 'action',
      render: (_: any, record: UnmatchedRecord) => (
        <Button
          type="link"
          icon={<LinkOutlined />}
          onClick={() => {
            setSelectedUnmatched(record);
            setMatchModalVisible(true);
          }}
        >
          Match
        </Button>
      ),
    },
  ];

  return (
    <div style={{ padding: 24 }}>
      <Title level={3}>Upload Target Angkas (Anggaran Kas)</Title>
      
      <Alert
        message="Informasi Target Angkas"
        description={
          <span>
            Data ditampilkan berdasarkan <strong>Target Anggaran</strong> per Puskesmas. 
            Status menunjukkan apakah data Angkas sudah diupload untuk kombinasi tersebut.
            Upload file PDF untuk mengisi data bulanan.
          </span>
        }
        type="info"
        showIcon
        icon={<InfoCircleOutlined />}
        style={{ marginBottom: 16 }}
      />

      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col span={8}>
          <Card size="small" bodyStyle={{ padding: 16 }} style={{ marginBottom: 16 }}>
            <Statistic title="Total Kombinasi" value={stats.total} />
          </Card>
        </Col>
        <Col span={8}>
          <Card size="small" bodyStyle={{ padding: 16 }} style={{ marginBottom: 16 }}>
            <Statistic 
              title="Sudah Upload Angkas" 
              value={stats.withAngkas} 
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col span={8}>
          <Card size="small" bodyStyle={{ padding: 16 }} style={{ marginBottom: 16 }}>
            <Statistic 
              title="Belum Upload Angkas" 
              value={stats.withoutAngkas} 
              valueStyle={{ color: '#ff4d4f' }}
            />
          </Card>
        </Col>
      </Row>

      <Card bodyStyle={{ padding: 24 }} style={{ marginBottom: 24 }}>
        <Row gutter={16} align="middle">
          <Col>
            <span>Tahun: </span>
            <InputNumber
              value={filters.tahun}
              onChange={(value) => setFilters({ ...filters, tahun: value || new Date().getFullYear() })}
              min={2020}
              max={2050}
            />
          </Col>
          <Col>
            <span>Sumber Anggaran: </span>
            <Select
              value={filters.id_sumber_anggaran}
              onChange={(value) => setFilters({ ...filters, id_sumber_anggaran: value })}
              style={{ width: 150 }}
              allowClear
              placeholder="Semua"
              options={sumberAnggaranList}
            />
          </Col>
          <Col>
            <span>Status: </span>
            <Select
              value={filters.status}
              onChange={(value) => setFilters({ ...filters, status: value })}
              style={{ width: 140 }}
              options={[
                { value: 'all', label: 'Semua' },
                { value: 'uploaded', label: 'Sudah Upload' },
                { value: 'not_uploaded', label: 'Belum Upload' },
              ]}
            />
          </Col>
          <Col flex="auto" />
          <Col>
            <Space>
              {filters.id_sumber_anggaran && (
                <Popconfirm
                  title="Hapus Data"
                  description={`Hapus semua data angkas tahun ${filters.tahun} dengan sumber anggaran terpilih?`}
                  onConfirm={handleBulkDelete}
                  okText="Ya, Hapus"
                  cancelText="Batal"
                >
                  <Button danger icon={<DeleteOutlined />}>
                    Hapus Data
                  </Button>
                </Popconfirm>
              )}
              <Button
                type="primary"
                icon={<UploadOutlined />}
                onClick={() => setUploadModalVisible(true)}
              >
                Upload PDF
              </Button>
            </Space>
          </Col>
        </Row>
      </Card>

      <Tabs
        defaultActiveKey="data"
        onChange={(key) => {
          if (key === 'unmatched') {
            loadUnmatchedData();
          }
        }}
        items={[
          {
            key: 'data',
            label: 'Data Angkas',
            children: (
              <Card bodyStyle={{ padding: 24 }} style={{ marginBottom: 24 }}>
                <Table
                  columns={columns}
                  dataSource={angkasData.filter(record => {
                    if (filters.status === 'uploaded') return record.hasAngkas;
                    if (filters.status === 'not_uploaded') return !record.hasAngkas;
                    return true;
                  })}
                  rowKey={(record) => `${record.user_id}-${record.id_sub_kegiatan}-${record.id_sumber_anggaran}`}
                  loading={loading}
                  scroll={{ x: 2400 }}
                  pagination={{
                    showSizeChanger: true,
                    showTotal: (total) => `Total ${total} data`,
                  }}
                />
              </Card>
            ),
          },
          {
            key: 'unmatched',
            label: (
              <span>
                Belum Terhubung
                {unmatchedData.length > 0 && (
                  <Tag color="orange" style={{ marginLeft: 8 }}>
                    {unmatchedData.length}
                  </Tag>
                )}
              </span>
            ),
            children: (
              <Card bodyStyle={{ padding: 24 }} style={{ marginBottom: 24 }}>
                <Alert
                  message="Data yang belum terhubung ke Sub Kegiatan"
                  description="Data ini akan di-skip saat perhitungan target angkas per sub kegiatan. Klik 'Match' untuk menghubungkan ke sub kegiatan."
                  type="warning"
                  showIcon
                  style={{ marginBottom: 16 }}
                />
                <Table
                  columns={unmatchedColumns}
                  dataSource={unmatchedData}
                  rowKey="id"
                  loading={loading}
                  pagination={{
                    showSizeChanger: true,
                    showTotal: (total) => `Total ${total} data`,
                  }}
                />
              </Card>
            ),
          },
        ]}
      />

      {/* Upload Modal */}
      <AppModal
        title="Upload File PDF Angkas"
        open={uploadModalVisible}
        onCancel={() => !uploading && setUploadModalVisible(false)}
        footer={null}
        closable={!uploading}
        maskClosable={!uploading}
      >
        <Space direction="vertical" style={{ width: '100%' }} size="middle">
          <div>
            <Text>Tahun: <strong>{filters.tahun}</strong></Text>
          </div>
          <Alert
            message="Format File & Deteksi Sumber Anggaran"
            description={
              <ul style={{ margin: '8px 0', paddingLeft: 20 }}>
                <li>File PDF dari sistem ANGGARAN KAS SKPD</li>
                <li>Berisi data per Puskesmas dengan nilai bulanan</li>
                <li><strong>Sumber anggaran otomatis terdeteksi</strong> dari kode rekening pendek (contoh: "4.1" = PAD)</li>
                <li>Data akan diparsing otomatis dari PDF</li>
              </ul>
            }
            type="info"
            showIcon
          />
          {uploading ? (
            <div style={{ textAlign: 'center', padding: 20 }}>
              <Progress
                type="circle"
                percent={uploadProgress}
                status={uploadProgress === 100 ? 'success' : 'active'}
              />
              <p style={{ marginTop: 16 }}>
                {uploadStatus === 'uploading' ? (
                  <>
                    <LoadingOutlined /> Mengupload file...
                  </>
                ) : (
                  <>
                    <LoadingOutlined /> Memproses PDF...
                  </>
                )}
              </p>
            </div>
          ) : (
            <Upload.Dragger
              accept=".pdf"
              showUploadList={false}
              beforeUpload={handleUpload}
            >
              <p className="ant-upload-drag-icon">
                <UploadOutlined style={{ fontSize: 48, color: '#1890ff' }} />
              </p>
              <p className="ant-upload-text">
                Klik atau drag file PDF ke area ini
              </p>
              <p className="ant-upload-hint">
                Maksimal ukuran file: 50MB
              </p>
            </Upload.Dragger>
          )}
        </Space>
      </AppModal>

      {/* Match Modal */}
      <AppModal
        title="Hubungkan ke Sub Kegiatan"
        open={matchModalVisible}
        onCancel={() => {
          setMatchModalVisible(false);
          setSelectedUnmatched(null);
          setSelectedSubKegiatan(undefined);
        }}
        onOk={handleMatchSubKegiatan}
        okText="Simpan"
        cancelText="Batal"
      >
        {selectedUnmatched && (
          <Space direction="vertical" style={{ width: '100%' }} size="middle">
            <div>
              <Text strong>Kode Rekening:</Text>
              <br />
              <Text code>{selectedUnmatched.kode_rekening}</Text>
            </div>
            <div>
              <Text strong>Uraian dari PDF:</Text>
              <br />
              <Text>{selectedUnmatched.uraian}</Text>
            </div>
            <div>
              <Text strong>Pilih Sub Kegiatan:</Text>
              <Select
                value={selectedSubKegiatan}
                onChange={setSelectedSubKegiatan}
                style={{ width: '100%', marginTop: 8 }}
                placeholder="Cari Sub Kegiatan"
                showSearch
                filterOption={(input, option) =>
                  (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
                }
                options={subKegiatanList}
              />
            </div>
          </Space>
        )}
      </AppModal>

      {/* History Modal */}
      <AppModal
        title="History Angkas & Target"
        open={historyModalVisible}
        onCancel={() => {
          setHistoryModalVisible(false);
          setSelectedAngkasRecord(null);
          setHistoryAllData(null);
        }}
        footer={[
          <Button key="close" onClick={() => setHistoryModalVisible(false)}>
            Tutup
          </Button>,
        ]}
        width={900}
      >
        {selectedAngkasRecord && (
          <div style={{ marginBottom: 16 }}>
            <Row gutter={16}>
              <Col span={12}>
                <p><strong>Puskesmas:</strong> {selectedAngkasRecord.puskesmas?.nama || 'N/A'}</p>
                <p><strong>Sub Kegiatan:</strong> {selectedAngkasRecord.subKegiatan?.kode_sub || 'N/A'} - {selectedAngkasRecord.subKegiatan?.kegiatan || 'N/A'}</p>
              </Col>
              <Col span={12}>
                <p><strong>Sumber Anggaran:</strong> {selectedAngkasRecord.sumberAnggaran?.sumber || 'N/A'}</p>
                <p><strong>Tahun:</strong> {filters.tahun}</p>
              </Col>
            </Row>
          </div>
        )}
        {historyLoading ? (
          <div style={{ textAlign: 'center', padding: 40 }}>
            <LoadingOutlined style={{ fontSize: 32 }} />
            <p>Memuat history...</p>
          </div>
        ) : historyAllData ? (
          <Tabs
            defaultActiveKey="angkas"
            items={[
              {
                key: 'angkas',
                label: `Angkas Bulanan`,
                children: (
                  <div style={{ maxHeight: 400, overflow: 'auto' }}>
                    {historyAllData.angkasHistory.length > 0 ? (
                      historyAllData.angkasHistory.map((bulanData) => (
                        <Card
                          key={bulanData.bulan}
                          size="small"
                          title={<Tag color="blue">{bulanNames[bulanData.bulan - 1]}</Tag>}
                          style={{ marginBottom: 12 }}
                        >
                          <Timeline
                            mode="left"
                            items={bulanData.values.map((record) => ({
                              color: 'green',
                              children: (
                                <div>
                                  <div style={{ fontWeight: 'bold' }}>
                                    {formatDate(record.created_at)}
                                  </div>
                                  <div style={{ marginTop: 4 }}>
                                    Nilai: <strong>{formatCurrency(record.nilai)}</strong>
                                  </div>
                                  <div style={{ fontSize: '12px', color: '#888' }}>
                                    Diupload oleh: {record.creator?.nama || record.creator?.username || 'N/A'}
                                  </div>
                                </div>
                              ),
                            }))}
                          />
                        </Card>
                      ))
                    ) : (
                      <Alert message="Belum ada history angkas untuk kombinasi ini" type="info" showIcon />
                    )}
                  </div>
                ),
              },
              {
                key: 'target_anggaran',
                label: `Target Anggaran (${historyAllData.targetAnggaran.length})`,
                children: (
                  <div style={{ maxHeight: 400, overflow: 'auto' }}>
                    {historyAllData.targetAnggaran.length > 0 ? (
                      <Timeline
                        mode="left"
                        items={historyAllData.targetAnggaran.map((record) => ({
                          color: 'blue',
                          children: (
                            <div>
                              <div style={{ fontWeight: 'bold' }}>
                                {formatDate(record.created_at)}
                              </div>
                              <div style={{ marginTop: 4 }}>
                                Target Rp: <strong>{formatCurrency(record.target_rp)}</strong>
                              </div>
                              <div style={{ fontSize: '12px', color: '#888' }}>
                                Diupload oleh: {record.creator?.nama || record.creator?.username || 'N/A'}
                              </div>
                            </div>
                          ),
                        }))}
                      />
                    ) : (
                      <Alert message="Belum ada history target anggaran" type="info" showIcon />
                    )}
                  </div>
                ),
              },
              {
                key: 'target_kinerja',
                label: `Target Kinerja (${historyAllData.targetKinerja.length})`,
                children: (
                  <div style={{ maxHeight: 400, overflow: 'auto' }}>
                    {historyAllData.targetKinerja.length > 0 ? (
                      <Timeline
                        mode="left"
                        items={historyAllData.targetKinerja.map((record) => ({
                          color: 'orange',
                          children: (
                            <div>
                              <div style={{ fontWeight: 'bold' }}>
                                {formatDate(record.created_at)}
                              </div>
                              <div style={{ marginTop: 4 }}>
                                Target K: <strong>{record.target_k}</strong> {record.satuan || '-'}
                              </div>
                              <div style={{ fontSize: '12px', color: '#888' }}>
                                Diupload oleh: {record.creator?.nama || record.creator?.username || 'N/A'}
                              </div>
                            </div>
                          ),
                        }))}
                      />
                    ) : (
                      <Alert message="Belum ada history target kinerja" type="info" showIcon />
                    )}
                  </div>
                ),
              },
            ]}
          />
        ) : (
          <Alert message="Tidak ada data history" type="warning" showIcon />
        )}
      </AppModal>
    </div>
  );
};

export default AdminAngkasUploadPage;
