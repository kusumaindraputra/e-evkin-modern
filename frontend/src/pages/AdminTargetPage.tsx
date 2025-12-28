import React, { useState, useEffect } from 'react';
import {
  Card,
  Table,
  Button,
  Select,
  message,
  Tag,
  Timeline,
  Row,
  Col,
  Upload,
  Progress,
  Modal,
} from 'antd';
import AppModal from '../components/AppModal';
import '../styles/global.css';
import { HistoryOutlined, UploadOutlined, LoadingOutlined } from '@ant-design/icons';
import axios from 'axios';
import API_BASE_URL from '../config/api';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';

interface Target {
  id: number;
  user_id: string;  // UUID string
  id_sub_kegiatan: number;
  id_sumber_anggaran: number;
  target_k: number;
  target_rp: number;
  tahun: number;
  created_at: string;
  puskesmas: {
    id: number;
    username: string;
    nama: string;
  };
  subKegiatan: {
    id_sub_kegiatan: number;
    kode_sub: string;
    kegiatan: string;
    indikator_kinerja: string;
  };
  sumberAnggaran: {
    id_sumber: number;
    sumber: string;
  };
  satuan?: {
    id_satuan: number;
    satuannya: string;
  };
  creator: {
    id: number;
    username: string;
    nama: string;
  };
}

interface HistoryRecord {
  id: number;
  target_k: number;
  target_rp: number;
  catatan?: string | null;
  created_at: string;
  creator: {
    id: number;
    username: string;
    nama: string;
  };
}

interface Puskesmas {
  value: number;
  label: string;
}

interface SubKegiatan {
  value: number;
  label: string;
}

interface SumberAnggaran {
  value: number;
  label: string;
}

const AdminTargetPage: React.FC = () => {
  const navigate = useNavigate();
  const { token } = useAuthStore();

  // Helper function untuk format tanggal
  const formatDate = (dateString: string | null | undefined) => {
    try {
      if (!dateString) {
        return 'No Date';
      }
      
      const date = new Date(dateString);
      
      // Check if date is valid
      if (isNaN(date.getTime())) {
        console.warn('Invalid date string:', dateString);
        return 'Invalid Date';
      }
      
      const day = date.getDate().toString().padStart(2, '0');
      const month = (date.getMonth() + 1).toString().padStart(2, '0');
      const year = date.getFullYear();
      const hours = date.getHours().toString().padStart(2, '0');
      const minutes = date.getMinutes().toString().padStart(2, '0');
      
      return `${day}/${month}/${year} ${hours}:${minutes}`;
    } catch (error) {
      console.error('Error formatting date:', error, 'Input:', dateString);
      return 'Format Error';
    }
  };

  const [targets, setTargets] = useState<Target[]>([]);
  const [loading, setLoading] = useState(false);
  const [historyModalVisible, setHistoryModalVisible] = useState(false);
  const [selectedTarget, setSelectedTarget] = useState<Target | null>(null);
  const [historyData, setHistoryData] = useState<HistoryRecord[]>([]);

  // Reference data
  const [puskesmasList, setPuskesmasList] = useState<Puskesmas[]>([]);
  const [subKegiatanList, setSubKegiatanList] = useState<SubKegiatan[]>([]);
  const [sumberAnggaranList, setSumberAnggaranList] = useState<SumberAnggaran[]>([]);
  const [uploadModalVisible, setUploadModalVisible] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadStatus, setUploadStatus] = useState<'uploading' | 'processing'>('uploading');
  const [uploadCatatan, setUploadCatatan] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Filters
  const [filters, setFilters] = useState({
    user_id: undefined as number | undefined,
    id_sub_kegiatan: undefined as number | undefined,
    id_sumber_anggaran: undefined as number | undefined,
    tahun: new Date().getFullYear(),
  });

  useEffect(() => {
    loadReferenceData();
  }, []);

  useEffect(() => {
    loadTargets();
  }, [filters]);

  const loadReferenceData = async () => {
    try {
      const headers = { Authorization: `Bearer ${token}` };

      // Load puskesmas list
      const puskesmasRes = await axios.get(`${API_BASE_URL}/users/puskesmas`, { headers });
      const puskesmasData = Array.isArray(puskesmasRes.data) ? puskesmasRes.data : (puskesmasRes.data.data || []);
      setPuskesmasList(
        puskesmasData
          .filter((u: any) => u.role === 'puskesmas')
          .map((u: any) => ({
            value: u.id,
            label: u.nama || u.username,
          }))
      );

      // Load sub kegiatan
      const subKegiatanRes = await axios.get(`${API_BASE_URL}/kegiatan/kegiatan`, { 
        headers,
        params: { include: 'sub' },
      });
      const kegiatanData = Array.isArray(subKegiatanRes.data) ? subKegiatanRes.data : (subKegiatanRes.data.data || []);
      const allSubKegiatan: SubKegiatan[] = [];
      kegiatanData.forEach((kegiatan: any) => {
        kegiatan.subKegiatan?.forEach((sub: any) => {
          allSubKegiatan.push({
            value: sub.id_sub_kegiatan,
            label: `${sub.kode_sub} - ${sub.kegiatan}`,
          });
        });
      });
      setSubKegiatanList(allSubKegiatan);

      // Load sumber anggaran
      const sumberAnggaranRes = await axios.get(`${API_BASE_URL}/reference/sumber-anggaran`, {
        headers,
      });
      const sumberAnggaranData = Array.isArray(sumberAnggaranRes.data) ? sumberAnggaranRes.data : (sumberAnggaranRes.data.data || []);
      setSumberAnggaranList(sumberAnggaranData);
    } catch (error: any) {
      console.error('Error loading reference data:', error);
      if (error.response?.status === 401) {
        message.error('Session expired. Please login again.');
        navigate('/login');
        return;
      }
      message.error('Gagal memuat data referensi');
    }
  };

  const loadTargets = async () => {
    setLoading(true);
    try {
      const params: any = {};
      
      // Only add params if they have valid values
      if (filters.user_id && filters.user_id !== undefined) {
        params.user_id = filters.user_id;
      }
      if (filters.id_sub_kegiatan && filters.id_sub_kegiatan !== undefined) {
        params.id_sub_kegiatan = filters.id_sub_kegiatan;
      }
      if (filters.id_sumber_anggaran && filters.id_sumber_anggaran !== undefined) {
        params.id_sumber_anggaran = filters.id_sumber_anggaran;
      }
      if (filters.tahun && filters.tahun !== undefined) {
        params.tahun = filters.tahun;
      }

      console.log('Loading targets with params:', params);

      const response = await axios.get(`${API_BASE_URL}/target/admin`, {
        headers: { Authorization: `Bearer ${token}` },
        params,
      });

      if (response.data.success) {
        setTargets(response.data.data);
      }
    } catch (error: any) {
      console.error('Error loading targets:', error);
      console.error('Error response:', error.response?.data);
      if (error.response?.status === 401) {
        message.error('Session expired. Please login again.');
        navigate('/login');
        return;
      }
      message.error('Gagal memuat data target');
    } finally {
      setLoading(false);
    }
  };

  const handleUpload = async (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    if (uploadCatatan.trim()) {
      formData.append('catatan', uploadCatatan.trim());
    }

    setUploading(true);
    setUploadProgress(0);
    setUploadStatus('uploading');
    
    // Simulate progress for better UX
    let simulatedProgress = 0;
    const progressInterval = setInterval(() => {
      simulatedProgress += Math.random() * 8 + 2; // Add 2-10% randomly
      if (simulatedProgress > 90) simulatedProgress = 90; // Cap at 90% until response
      setUploadProgress(Math.round(simulatedProgress));
    }, 300);

    try {
      // Switch to processing status after a brief upload phase
      setTimeout(() => setUploadStatus('processing'), 500);
      
      const response = await axios.post(`${API_BASE_URL}/target/upload`, formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data',
        },
      });
      
      // Stop simulation and set to 100%
      clearInterval(progressInterval);
      setUploadProgress(100);

      if (response.data.success) {
        const result = response.data.data;
        
        Modal.success({
          title: 'Upload Selesai',
          width: 800,
          content: (
            <div>
              <p><strong>Total Berhasil:</strong> {result.success} target</p>
              <p className="ml-20 text-green">
                • Inserted (Baru): {result.inserted}
              </p>
              <p className="ml-20 text-blue">
                • Updated (Existing): {result.updated}
              </p>
              <p className="ml-20 text-yellow">
                • Skipped (Same Value): {result.skipped || 0}
              </p>
              <p className="ml-20 text-purple">
                • Sub Kegiatan Baru: {result.createdSubKegiatan || 0}
              </p>
              <p className="ml-20 text-cyan">
                • Sumber Dana Baru: {result.createdSumberAnggaran || 0}
              </p>
              <p><strong>Gagal:</strong> {result.failed} target</p>
              {result.excludedNonPuskesmas > 0 && (
                <p className="text-gray">
                  <strong>Excluded (bukan Puskesmas):</strong> {result.excludedNonPuskesmas} data
                </p>
              )}
              
              {/* Success List */}
              {result.successList && result.successList.length > 0 && (
                <div className="mt-16">
                  <p><strong>Data Berhasil Diproses:</strong></p>
                  <div className="maxh-250 overflow-auto border-gray br-4">
                    <table className="w-100 border-collapse fs-12">
                      <thead className="sticky-top bg-light">
                        <tr>
                          <th className="p-8 borderb-gray text-left">Status</th>
                          <th className="p-8 borderb-gray text-left">Puskesmas</th>
                          <th className="p-8 borderb-gray text-left">Sub Kegiatan</th>
                          <th className="p-8 borderb-gray text-left">Sumber Dana</th>
                          <th className="p-8 borderb-gray text-right">Target (Rp)</th>
                        </tr>
                      </thead>
                      <tbody>
                        {result.successList.map((item: any, idx: number) => (
                          <tr key={idx} className={idx % 2 === 0 ? 'bg-white' : 'bg-light'}>
                            <td className="p-6-8 borderb-light">
                              <span className={item.type === 'inserted' ? 'badge-inserted' : 'badge-updated'}>
                                {item.type === 'inserted' ? 'INSERT' : 'UPDATE'}
                              </span>
                            </td>
                            <td className="p-6-8 borderb-light">{item.puskesmas}</td>
                            <td className="p-6-8 borderb-light maxw-200 ellipsis" title={item.subKegiatan}>{item.subKegiatan}</td>
                            <td className="p-6-8 borderb-light">{item.sumberDana}</td>
                            <td className="p-6-8 borderb-light thousand-sep">{item.target_rp?.toLocaleString('id-ID')}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
              
              {/* Error List */}
              {result.errors.length > 0 && (
                <div className="mt-16">
                  <p><strong>Detail Error (10 pertama):</strong></p>
                  <ul className="maxh-150 overflow-auto">
                    {result.errors.slice(0, 10).map((err: any, idx: number) => (
                      <li key={idx}>
                        Row {err.row}: {err.puskesmas} - {err.subKegiatan}
                        <br />
                        <small className="text-red">{err.error}</small>
                      </li>
                    ))}
                  </ul>
                  {result.errors.length > 10 && (
                    <p className="text-gray">... dan {result.errors.length - 10} error lainnya</p>
                  )}
                </div>
              )}
            </div>
          ),
        });
        
        setUploadModalVisible(false);
        loadTargets();
      }
    } catch (error: any) {
      clearInterval(progressInterval);
      console.error('Upload error:', error);
      message.error(error.response?.data?.message || 'Gagal upload file');
    } finally {
      setUploading(false);
      setUploadProgress(0);
      setUploadStatus('uploading');
      setUploadCatatan('');
    }

    return false; // Prevent default upload behavior
  };

  const handleViewHistory = async (target: Target) => {
    setSelectedTarget(target);
    setHistoryModalVisible(true);
    try {
      const response = await axios.get(`${API_BASE_URL}/target/admin/history`, {
        headers: { Authorization: `Bearer ${token}` },
        params: {
          user_id: target.user_id,
          id_sub_kegiatan: target.id_sub_kegiatan,
          id_sumber_anggaran: target.id_sumber_anggaran,
          tahun: target.tahun,
        },
      });

      if (response.data.success) {
        setHistoryData(response.data.data);
      }
    } catch (error: any) {
      console.error('Error loading history:', error);
      if (error.response?.status === 401) {
        message.error('Session expired. Please login again.');
        navigate('/login');
        return;
      }
      message.error('Gagal memuat history');
    }
  };

  const columns = [
    {
      title: 'No',
      key: 'no',
      width: 50,
      align: 'center' as const,
      render: (_: any, __: any, index: number) => (currentPage - 1) * pageSize + index + 1,
    },
    {
      title: 'Puskesmas',
      dataIndex: ['puskesmas', 'nama'],
      key: 'puskesmas',
      width: 200,
    },
    {
      title: 'Sub Kegiatan',
      dataIndex: ['subKegiatan', 'kegiatan'],
      key: 'subKegiatan',
      width: 250,
      render: (text: string, record: Target) => (
        <div>
          <Tag color="blue">{record.subKegiatan.kode_sub}</Tag>
          <div style={{ marginTop: 4 }}>{text}</div>
        </div>
      ),
    },
    {
      title: 'Sumber Anggaran',
      dataIndex: ['sumberAnggaran', 'sumber'],
      key: 'sumberAnggaran',
      width: 150,
      render: (_: string, record: Target) => record.sumberAnggaran?.sumber || <Tag color="red">Tidak ada data</Tag>,
    },
    {
      title: 'Tahun',
      dataIndex: 'tahun',
      key: 'tahun',
      width: 80,
    },
    {
      title: 'Target Rp',
      dataIndex: 'target_rp',
      key: 'target_rp',
      width: 150,
      align: 'right' as const,
      render: (value: number) => `Rp ${value?.toLocaleString('id-ID')}`,
    },
    {
      title: 'Dibuat Oleh',
      dataIndex: ['creator', 'nama'],
      key: 'creator',
      width: 150,
    },
    {
      title: 'Aksi',
      key: 'action',
      width: 100,
      fixed: 'right' as const,
      render: (_: any, record: Target) => (
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

  return (
    <div style={{ padding: 24 }}>
      <Card title="Target Anggaran (Rp)" bodyStyle={{ padding: 24 }} style={{ marginBottom: 24 }}>
        <Row gutter={16} style={{ marginBottom: 16 }}>
          <Col span={6}>
            <Select
              placeholder="Pilih Puskesmas"
              style={{ width: '100%' }}
              allowClear
              showSearch
              filterOption={(input, option) =>
                (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
              }
              options={puskesmasList}
              value={filters.user_id}
              onChange={(value) => setFilters({ ...filters, user_id: value })}
            />
          </Col>
          <Col span={6}>
            <Select
              placeholder="Pilih Sub Kegiatan"
              style={{ width: '100%' }}
              allowClear
              showSearch
              filterOption={(input, option) =>
                (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
              }
              options={subKegiatanList}
              value={filters.id_sub_kegiatan}
              onChange={(value) => setFilters({ ...filters, id_sub_kegiatan: value })}
            />
          </Col>
          <Col span={6}>
            <Select
              placeholder="Pilih Sumber Anggaran"
              style={{ width: '100%' }}
              allowClear
              options={sumberAnggaranList}
              value={filters.id_sumber_anggaran}
              onChange={(value) => setFilters({ ...filters, id_sumber_anggaran: value })}
            />
          </Col>
          <Col span={6}>
            <Select
              placeholder="Pilih Tahun"
              style={{ width: '100%' }}
              value={filters.tahun}
              onChange={(value) => setFilters({ ...filters, tahun: value })}
              options={[
                { value: 2024, label: '2024' },
                { value: 2025, label: '2025' },
                { value: 2026, label: '2026' },
              ]}
            />
          </Col>
        </Row>

        <div style={{ marginBottom: 16 }}>
          <Button
            type="primary"
            icon={<UploadOutlined />}
            onClick={() => setUploadModalVisible(true)}
          >
            Upload Excel
          </Button>
        </div>

        <Table
          columns={columns}
          dataSource={targets}
          rowKey="id"
          loading={loading}
          scroll={{ x: 1500 }}
          pagination={{ 
            pageSize: pageSize,
            showSizeChanger: false,
            current: currentPage,
            onChange: (page, size) => {
              setCurrentPage(page);
              setPageSize(size || 10);
            }
          }}
        />
      </Card>

      {/* History Modal */}
      <AppModal
        title="History Target"
        open={historyModalVisible}
        onCancel={() => setHistoryModalVisible(false)}
        footer={[
          <Button key="close" onClick={() => setHistoryModalVisible(false)}>
            Tutup
          </Button>,
        ]}
        width={700}
      >
        {selectedTarget && (
          <div style={{ marginBottom: 16 }}>
            <p>
              <strong>Puskesmas:</strong> {selectedTarget.puskesmas?.nama || 'N/A'}
            </p>
            <p>
              <strong>Sub Kegiatan:</strong> {selectedTarget.subKegiatan?.kode_sub || 'N/A'} -{' '}
              {selectedTarget.subKegiatan?.kegiatan || 'N/A'}
            </p>
            <p>
              <strong>Sumber Anggaran:</strong> {selectedTarget.sumberAnggaran?.sumber || 'N/A'}
            </p>
            <p>
              <strong>Tahun:</strong> {selectedTarget.tahun}
            </p>
          </div>
        )}

        <Timeline
          mode="left"
          items={historyData.map((record) => ({
            color: 'blue',
            children: (
              <div>
                <div style={{ fontWeight: 'bold' }}>
                  {formatDate(record.created_at)}
                </div>
                <div style={{ marginTop: 8 }}>
                  Target Rp: <strong>Rp {record.target_rp.toLocaleString('id-ID')}</strong>
                </div>
                <div style={{ marginTop: 4, fontSize: '12px', color: '#888' }}>
                  Dibuat oleh: {record.creator?.nama || record.creator?.username || 'N/A'}
                </div>
                {record.catatan && (
                  <div style={{ marginTop: 6, padding: '6px 10px', background: '#f5f5f5', borderRadius: 4, fontSize: '12px', color: '#595959' }}>
                    <strong>Catatan:</strong> {record.catatan}
                  </div>
                )}
              </div>
            ),
          }))}
        />
      </AppModal>

      {/* Upload Modal */}
      <AppModal
        title="Upload File Excel Target Anggaran"
        open={uploadModalVisible}
        onCancel={() => setUploadModalVisible(false)}
        footer={null}
      >
        <div style={{ marginTop: 20 }}>
          <p>
            Format file Excel harus sesuai dengan template Rekap Ver3.xlsx dengan kolom:
          </p>
          <ul style={{ marginLeft: 20, marginBottom: 20 }}>
            <li>TAHUN</li>
            <li>NAMA SUB UNIT (Nama Puskesmas)</li>
            <li>KODE SUB KEGIATAN</li>
            <li>NAMA SUB KEGIATAN</li>
            <li>KODE SUMBER DANA</li>
            <li>NAMA SUMBER DANA</li>
            <li>PAGU</li>
          </ul>
          <p style={{ color: '#888', fontSize: '12px', marginBottom: 16 }}>
            * Target Kinerja (K) dan Satuan harus diset manual di halaman Target Kinerja<br />
            * PAGU akan diagregat per kombinasi Puskesmas + Sub Kegiatan + Sumber Dana<br />
            * Nama unit "Laboratorium Kesehatan Daerah" akan dipetakan ke user "labkesda"
          </p>
          
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', marginBottom: 8, fontWeight: 500 }}>
              Catatan Perubahan <span style={{ color: 'red' }}>*</span>
            </label>
            <input
              type="text"
              value={uploadCatatan}
              onChange={(e) => setUploadCatatan(e.target.value)}
              placeholder="Contoh: Pagu Murni / Perubahan Parsial 1 / Perubahan Reguler"
              style={{
                width: '100%',
                padding: '8px 12px',
                border: uploadCatatan.trim() ? '1px solid #d9d9d9' : '1px solid #ff7875',
                borderRadius: 6,
                fontSize: 14,
                backgroundColor: uploadCatatan.trim() ? '#fff' : '#fff2f0',
              }}
              disabled={uploading}
            />
            {!uploadCatatan.trim() && (
              <p style={{ color: '#ff4d4f', fontSize: '12px', marginTop: 4 }}>
                ⚠️ Catatan wajib diisi
              </p>
            )}
            <p style={{ color: '#888', fontSize: '12px', marginTop: 4 }}>
              Catatan ini akan tersimpan di history untuk data yang diupload/diupdate
            </p>
          </div>

          <Upload.Dragger
            name="file"
            accept=".xlsx,.xls"
            beforeUpload={handleUpload}
            showUploadList={false}
            disabled={uploading || !uploadCatatan.trim()}
          >
            <p className="ant-upload-drag-icon">
              {uploading ? <LoadingOutlined style={{ fontSize: 48 }} spin /> : <UploadOutlined />}
            </p>
            {uploading ? (
              <div style={{ padding: '0 20px' }}>
                <Progress 
                  percent={uploadProgress} 
                  status="active" 
                  strokeColor={{
                    '0%': '#108ee9',
                    '100%': '#87d068',
                  }}
                />
                <p style={{ marginTop: 8 }}>
                  {uploadStatus === 'uploading' 
                    ? 'Mengunggah file...' 
                    : 'Memproses data Excel...'}
                </p>
              </div>
            ) : (
              <>
                <p className="ant-upload-text">
                  Klik atau drag file Excel ke sini
                </p>
                <p className="ant-upload-hint">
                  Support file .xlsx dan .xls
                </p>
              </>
            )}
          </Upload.Dragger>
        </div>
      </AppModal>
    </div>
  );
};

export default AdminTargetPage;
