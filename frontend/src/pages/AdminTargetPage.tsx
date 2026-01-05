import React, { useState, useEffect } from 'react';
import {
  Card,
  Table,
  Button,
  Modal,
  Select,
  message,
  Tag,
  Timeline,
  Row,
  Col,
  Upload,
  Progress,
} from 'antd';
import { HistoryOutlined, UploadOutlined, LoadingOutlined } from '@ant-design/icons';
import axios from 'axios';
import API_BASE_URL from '../config/api';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { formatNumber, formatDateTime } from '../utils/formatters';

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
              <p style={{ marginLeft: 20, color: '#52c41a' }}>
                • Inserted (Baru): {result.inserted}
              </p>
              <p style={{ marginLeft: 20, color: '#1890ff' }}>
                • Updated (Existing): {result.updated}
              </p>
              <p style={{ marginLeft: 20, color: '#faad14' }}>
                • Skipped (Same Value): {result.skipped || 0}
              </p>
              <p style={{ marginLeft: 20, color: '#722ed1' }}>
                • Sub Kegiatan Baru: {result.createdSubKegiatan || 0}
              </p>
              <p style={{ marginLeft: 20, color: '#13c2c2' }}>
                • Sumber Dana Baru: {result.createdSumberAnggaran || 0}
              </p>
              <p><strong>Gagal:</strong> {result.failed} target</p>
              {result.excludedNonPuskesmas > 0 && (
                <p style={{ color: '#8c8c8c' }}>
                  <strong>Excluded (bukan Puskesmas):</strong> {result.excludedNonPuskesmas} data
                </p>
              )}
              
              {/* Success List */}
              {result.successList && result.successList.length > 0 && (
                <div style={{ marginTop: 16 }}>
                  <p><strong>Data Berhasil Diproses:</strong></p>
                  <div style={{ maxHeight: 250, overflow: 'auto', border: '1px solid #d9d9d9', borderRadius: 4 }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                      <thead style={{ position: 'sticky', top: 0, background: '#fafafa' }}>
                        <tr>
                          <th style={{ padding: '8px', borderBottom: '1px solid #d9d9d9', textAlign: 'left' }}>Status</th>
                          <th style={{ padding: '8px', borderBottom: '1px solid #d9d9d9', textAlign: 'left' }}>Puskesmas</th>
                          <th style={{ padding: '8px', borderBottom: '1px solid #d9d9d9', textAlign: 'left' }}>Sub Kegiatan</th>
                          <th style={{ padding: '8px', borderBottom: '1px solid #d9d9d9', textAlign: 'left' }}>Sumber Dana</th>
                          <th style={{ padding: '8px', borderBottom: '1px solid #d9d9d9', textAlign: 'right' }}>Target Rp</th>
                        </tr>
                      </thead>
                      <tbody>
                        {result.successList.map((item: any, idx: number) => (
                          <tr key={idx} style={{ background: idx % 2 === 0 ? '#fff' : '#fafafa' }}>
                            <td style={{ padding: '6px 8px', borderBottom: '1px solid #f0f0f0' }}>
                              <span style={{ 
                                padding: '2px 8px', 
                                borderRadius: 4, 
                                fontSize: 11,
                                background: item.type === 'inserted' ? '#f6ffed' : '#e6f7ff',
                                color: item.type === 'inserted' ? '#52c41a' : '#1890ff',
                                border: `1px solid ${item.type === 'inserted' ? '#b7eb8f' : '#91d5ff'}`
                              }}>
                                {item.type === 'inserted' ? 'INSERT' : 'UPDATE'}
                              </span>
                            </td>
                            <td style={{ padding: '6px 8px', borderBottom: '1px solid #f0f0f0' }}>{item.puskesmas}</td>
                            <td style={{ padding: '6px 8px', borderBottom: '1px solid #f0f0f0', maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={item.subKegiatan}>{item.subKegiatan}</td>
                            <td style={{ padding: '6px 8px', borderBottom: '1px solid #f0f0f0' }}>{item.sumberDana}</td>
                            <td style={{ padding: '6px 8px', borderBottom: '1px solid #f0f0f0', textAlign: 'right' }}>{formatNumber(item.target_rp)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
              
              {/* Error List */}
              {result.errors.length > 0 && (
                <div style={{ marginTop: 16 }}>
                  <p><strong>Detail Error (10 pertama):</strong></p>
                  <ul style={{ maxHeight: 150, overflow: 'auto' }}>
                    {result.errors.slice(0, 10).map((err: any, idx: number) => (
                      <li key={idx}>
                        Row {err.row}: {err.puskesmas} - {err.subKegiatan}
                        <br />
                        <small style={{ color: 'red' }}>{err.error}</small>
                      </li>
                    ))}
                  </ul>
                  {result.errors.length > 10 && (
                    <p style={{ color: 'gray' }}>... dan {result.errors.length - 10} error lainnya</p>
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
      title: 'Target (Rp)',
      dataIndex: 'target_rp',
      key: 'target_rp',
      width: 150,
      align: 'right' as const,
      render: (value: number) => formatNumber(value),
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
    <div style={{ padding: '24px' }}>
      <Card title="Target Anggaran (Rp)" style={{ marginBottom: 24 }}>
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
          scroll={{ x: 1500, y: 500 }}
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
      <Modal
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
                  {formatDateTime(record.created_at)}
                </div>
                <div style={{ marginTop: 8 }}>
                  Target (Rp): <strong>{formatNumber(record.target_rp)}</strong>
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
      </Modal>

      {/* Upload Modal */}
      <Modal
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
      </Modal>
    </div>
  );
};

export default AdminTargetPage;
