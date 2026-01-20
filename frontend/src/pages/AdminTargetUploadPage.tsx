import React, { useState, useEffect, useCallback } from 'react';
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
  Tabs,
  Typography,
  Space,
  Popconfirm,
  Alert,
  Statistic,
} from 'antd';
import { UploadOutlined, LoadingOutlined, DeleteOutlined, LinkOutlined, HistoryOutlined } from '@ant-design/icons';
import axios from 'axios';
import API_BASE_URL from '../config/api';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { formatNumber, formatDateTime } from '../utils/formatters';

const { Text } = Typography;

// ============== SHARED INTERFACES ==============
interface Puskesmas {
  value: string;
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

// ============== TARGET ANGGARAN INTERFACES ==============
interface Target {
  id: number;
  user_id: string;
  id_sub_kegiatan: number;
  id_sumber_anggaran: number;
  target_k: number;
  target_rp: number;
  tahun: number;
  created_at: string;
  puskesmas: { id: number; username: string; nama: string };
  subKegiatan: { id_sub_kegiatan: number; kode_sub: string; kegiatan: string };
  sumberAnggaran: { id_sumber: number; sumber: string };
  creator: { id: number; username: string; nama: string };
}

interface TargetHistoryRecord {
  id: number;
  target_k: number;
  target_rp: number;
  catatan?: string | null;
  created_at: string;
  creator: { id: number; username: string; nama: string };
}

// ============== ANGKAS INTERFACES ==============
interface AngkasRecord {
  user_id: string;
  puskesmas: { id: string; nama: string; username: string };
  id_sub_kegiatan: number;
  subKegiatan: { id_sub_kegiatan: number; kegiatan: string; kode_sub: string };
  id_sumber_anggaran: number;
  sumberAnggaran: { id_sumber: number; sumber: string };
  tahun: number;
  target_rp: number;
  bulanan: number[];
  total: number;
  hasAngkas: boolean;
}

interface UnmatchedRecord {
  id: number;
  kode_rekening: string;
  uraian: string;
  tahun: number;
  puskesmas: { id: string; nama: string };
  sumberAnggaran: { id: number; nama: string };
}

interface AngkasHistoryRecord {
  bulan: number;
  values: Array<{
    id: number;
    nilai: number;
    created_at: string;
    sumberAnggaran?: { id_sumber: number; sumber: string };
    creator: { id: number; username: string; nama: string };
  }>;
}

const BULAN_NAMES = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
];

const AdminTargetUploadPage: React.FC = () => {
  const navigate = useNavigate();
  const { token } = useAuthStore();

  // ============== SHARED STATE ==============
  const [puskesmasList, setPuskesmasList] = useState<Puskesmas[]>([]);
  const [subKegiatanList, setSubKegiatanList] = useState<SubKegiatan[]>([]);
  const [sumberAnggaranList, setSumberAnggaranList] = useState<SumberAnggaran[]>([]);
  const [activeTab, setActiveTab] = useState('target');

  // Shared filters
  const [filters, setFilters] = useState({
    user_id: undefined as string | undefined,
    id_sub_kegiatan: undefined as number | undefined,
    id_sumber_anggaran: undefined as number | undefined,
    tahun: new Date().getFullYear(),
    angkasStatus: 'all' as 'all' | 'uploaded' | 'not_uploaded',
  });

  // ============== TARGET ANGGARAN STATE ==============
  const [targets, setTargets] = useState<Target[]>([]);
  const [targetLoading, setTargetLoading] = useState(false);
  const [targetUploadModalVisible, setTargetUploadModalVisible] = useState(false);
  const [targetUploading, setTargetUploading] = useState(false);
  const [targetUploadProgress, setTargetUploadProgress] = useState(0);
  const [targetUploadCatatan, setTargetUploadCatatan] = useState('');
  const [targetHistoryModalVisible, setTargetHistoryModalVisible] = useState(false);
  const [selectedTarget, setSelectedTarget] = useState<Target | null>(null);
  const [targetHistoryData, setTargetHistoryData] = useState<TargetHistoryRecord[]>([]);
  const [targetCurrentPage, setTargetCurrentPage] = useState(1);
  const [targetPageSize] = useState(10);

  // ============== ANGKAS STATE ==============
  const [angkasData, setAngkasData] = useState<AngkasRecord[]>([]);
  const [angkasLoading, setAngkasLoading] = useState(false);
  const [angkasStats, setAngkasStats] = useState({ total: 0, withAngkas: 0, withoutAngkas: 0 });
  const [angkasUploadModalVisible, setAngkasUploadModalVisible] = useState(false);
  const [angkasUploading, setAngkasUploading] = useState(false);
  const [angkasUploadProgress, setAngkasUploadProgress] = useState(0);
  const [unmatchedData, setUnmatchedData] = useState<UnmatchedRecord[]>([]);
  const [matchModalVisible, setMatchModalVisible] = useState(false);
  const [selectedUnmatched, setSelectedUnmatched] = useState<UnmatchedRecord | null>(null);
  const [selectedSubKegiatan, setSelectedSubKegiatan] = useState<number | undefined>();
  const [angkasHistoryModalVisible, setAngkasHistoryModalVisible] = useState(false);
  const [selectedAngkasRecord, setSelectedAngkasRecord] = useState<AngkasRecord | null>(null);
  const [angkasHistoryData, setAngkasHistoryData] = useState<AngkasHistoryRecord[]>([]);

  // ============== LOAD REFERENCE DATA ==============
  useEffect(() => {
    loadReferenceData();
  }, []);

  const loadReferenceData = async () => {
    try {
      const headers = { Authorization: `Bearer ${token}` };

      const [puskesmasRes, kegiatanRes, sumberRes] = await Promise.all([
        axios.get(`${API_BASE_URL}/users/puskesmas`, { headers }),
        axios.get(`${API_BASE_URL}/kegiatan/kegiatan`, { headers, params: { include: 'sub' } }),
        axios.get(`${API_BASE_URL}/reference/sumber-anggaran`, { headers }),
      ]);

      // Puskesmas
      const puskesmasData = Array.isArray(puskesmasRes.data) ? puskesmasRes.data : (puskesmasRes.data.data || []);
      setPuskesmasList(puskesmasData.filter((u: any) => u.role === 'puskesmas').map((u: any) => ({
        value: u.id,
        label: u.nama || u.username,
      })));

      // Sub Kegiatan
      const kegiatanData = Array.isArray(kegiatanRes.data) ? kegiatanRes.data : (kegiatanRes.data.data || []);
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

      // Sumber Anggaran
      const sumberData = Array.isArray(sumberRes.data) ? sumberRes.data : (sumberRes.data.data || []);
      setSumberAnggaranList(sumberData);
    } catch (error: any) {
      console.error('Error loading reference data:', error);
      if (error.response?.status === 401) {
        message.error('Session expired. Please login again.');
        navigate('/login');
      }
    }
  };

  // ============== TARGET ANGGARAN FUNCTIONS ==============
  const loadTargets = useCallback(async () => {
    setTargetLoading(true);
    try {
      const params: any = { tahun: filters.tahun };
      if (filters.user_id) params.user_id = filters.user_id;
      if (filters.id_sub_kegiatan) params.id_sub_kegiatan = filters.id_sub_kegiatan;
      if (filters.id_sumber_anggaran) params.id_sumber_anggaran = filters.id_sumber_anggaran;

      const response = await axios.get(`${API_BASE_URL}/target/admin`, {
        headers: { Authorization: `Bearer ${token}` },
        params,
      });

      if (response.data.success) {
        setTargets(response.data.data);
      }
    } catch (error: any) {
      console.error('Error loading targets:', error);
      if (error.response?.status === 401) {
        message.error('Session expired. Please login again.');
        navigate('/login');
        return;
      }
      message.error('Gagal memuat data target');
    } finally {
      setTargetLoading(false);
    }
  }, [token, filters, navigate]);

  const handleTargetUpload = async (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    if (targetUploadCatatan.trim()) {
      formData.append('catatan', targetUploadCatatan.trim());
    }

    setTargetUploading(true);
    setTargetUploadProgress(0);

    let simulatedProgress = 0;
    const progressInterval = setInterval(() => {
      simulatedProgress += Math.random() * 8 + 2;
      if (simulatedProgress > 90) simulatedProgress = 90;
      setTargetUploadProgress(Math.round(simulatedProgress));
    }, 300);

    try {
      const response = await axios.post(`${API_BASE_URL}/target/upload`, formData, {
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'multipart/form-data' },
      });

      clearInterval(progressInterval);
      setTargetUploadProgress(100);

      if (response.data.success) {
        const result = response.data.data;
        Modal.success({
          title: 'Upload Target Anggaran Selesai',
          width: 700,
          content: (
            <div>
              <p><strong>Total Berhasil:</strong> {result.success} target</p>
              <p style={{ marginLeft: 20, color: '#52c41a' }}>• Inserted (Baru): {result.inserted}</p>
              <p style={{ marginLeft: 20, color: '#1890ff' }}>• Updated (Existing): {result.updated}</p>
              <p style={{ marginLeft: 20, color: '#faad14' }}>• Skipped (Same Value): {result.skipped || 0}</p>
              <p><strong>Gagal:</strong> {result.failed} target</p>
              {result.errors?.length > 0 && (
                <div style={{ marginTop: 16, maxHeight: 150, overflow: 'auto' }}>
                  <p style={{ color: '#ff4d4f' }}><strong>Errors:</strong></p>
                  {result.errors.slice(0, 5).map((err: any, idx: number) => (
                    <p key={idx} style={{ fontSize: 12, color: '#ff4d4f', marginLeft: 20 }}>
                      • Row {err.row}: {err.error}
                    </p>
                  ))}
                </div>
              )}
            </div>
          ),
        });
        setTargetUploadModalVisible(false);
        loadTargets();
      }
    } catch (error: any) {
      clearInterval(progressInterval);
      message.error(error.response?.data?.message || 'Gagal upload file');
    } finally {
      setTargetUploading(false);
      setTargetUploadProgress(0);
      setTargetUploadCatatan('');
    }
    return false;
  };

  const handleViewTargetHistory = async (target: Target) => {
    setSelectedTarget(target);
    setTargetHistoryModalVisible(true);
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
        setTargetHistoryData(response.data.data);
      }
    } catch (error: any) {
      message.error('Gagal memuat history');
    }
  };

  // ============== ANGKAS FUNCTIONS ==============
  const loadAngkasData = useCallback(async () => {
    setAngkasLoading(true);
    try {
      const params: any = { tahun: filters.tahun };
      if (filters.user_id) params.user_id = filters.user_id;
      if (filters.id_sumber_anggaran) params.id_sumber_anggaran = filters.id_sumber_anggaran;

      const response = await axios.get(`${API_BASE_URL}/angkas`, {
        headers: { Authorization: `Bearer ${token}` },
        params,
      });

      setAngkasData(response.data.data || []);
      setAngkasStats({
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
      setAngkasLoading(false);
    }
  }, [token, filters, navigate]);

  const loadUnmatchedData = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/angkas/unmatched`, {
        headers: { Authorization: `Bearer ${token}` },
        params: { tahun: filters.tahun },
      });
      setUnmatchedData(response.data.data || []);
    } catch (error: any) {
      message.error('Gagal memuat data unmatched');
    }
  };

  const handleAngkasUpload = async (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('tahun', filters.tahun.toString());

    setAngkasUploading(true);
    setAngkasUploadProgress(0);

    let simulatedProgress = 0;
    const progressInterval = setInterval(() => {
      simulatedProgress += Math.random() * 5 + 1;
      if (simulatedProgress > 85) simulatedProgress = 85;
      setAngkasUploadProgress(Math.round(simulatedProgress));
    }, 500);

    try {
      const response = await axios.post(`${API_BASE_URL}/angkas/upload`, formData, {
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'multipart/form-data' },
      });

      clearInterval(progressInterval);
      setAngkasUploadProgress(100);

      const result = response.data.result;
      Modal.success({
        title: 'Upload Angkas PDF Selesai',
        width: 700,
        content: (
          <div>
            <p><strong>Total Berhasil:</strong> {result.success} data</p>
            <p style={{ marginLeft: 20, color: '#52c41a' }}>• Inserted (Baru): {result.inserted}</p>
            <p style={{ marginLeft: 20, color: '#1890ff' }}>• Updated (History Baru): {result.updated}</p>
            <p style={{ marginLeft: 20, color: '#faad14' }}>• Skipped (Sama/Zero): {result.skipped}</p>
            <p><strong>Gagal:</strong> {result.failed} data</p>
            {result.unmatchedPuskesmas?.length > 0 && (
              <div style={{ marginTop: 12 }}>
                <p style={{ color: '#ff4d4f' }}><strong>Puskesmas Tidak Ditemukan:</strong></p>
                <ul style={{ marginLeft: 20, color: '#ff4d4f' }}>
                  {result.unmatchedPuskesmas.map((name: string, idx: number) => (
                    <li key={idx}>{name}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        ),
      });
      setAngkasUploadModalVisible(false);
      loadAngkasData();
    } catch (error: any) {
      clearInterval(progressInterval);
      message.error(error.response?.data?.error || 'Gagal mengupload file');
    } finally {
      setAngkasUploading(false);
      setAngkasUploadProgress(0);
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
      message.error(error.response?.data?.error || 'Gagal mencocokkan data');
    }
  };

  const handleBulkDeleteAngkas = async () => {
    if (!filters.id_sumber_anggaran) {
      message.error('Pilih sumber anggaran untuk filter hapus');
      return;
    }
    try {
      const response = await axios.delete(`${API_BASE_URL}/angkas/bulk`, {
        headers: { Authorization: `Bearer ${token}` },
        data: { tahun: filters.tahun, id_sumber_anggaran: filters.id_sumber_anggaran },
      });
      message.success(`Berhasil menghapus ${response.data.deleted} data`);
      loadAngkasData();
    } catch (error: any) {
      message.error('Gagal menghapus data');
    }
  };

  const handleViewAngkasHistory = async (record: AngkasRecord) => {
    setSelectedAngkasRecord(record);
    setAngkasHistoryModalVisible(true);
    try {
      const response = await axios.get(`${API_BASE_URL}/angkas/history/all`, {
        headers: { Authorization: `Bearer ${token}` },
        params: { user_id: record.user_id, id_sub_kegiatan: record.id_sub_kegiatan, tahun: filters.tahun },
      });
      if (response.data.success) {
        setAngkasHistoryData(response.data.data.angkasHistory || []);
      }
    } catch (error: any) {
      message.error('Gagal memuat history');
    }
  };

  // ============== LOAD DATA ON TAB/FILTER CHANGE ==============
  useEffect(() => {
    if (activeTab === 'target') {
      loadTargets();
    } else if (activeTab === 'angkas') {
      loadAngkasData();
    } else if (activeTab === 'unmatched') {
      loadUnmatchedData();
    }
  }, [activeTab, filters, loadTargets, loadAngkasData]);

  // ============== COLUMNS ==============
  const targetColumns = [
    { title: 'No', key: 'no', width: 50, align: 'center' as const, render: (_: any, __: any, index: number) => (targetCurrentPage - 1) * targetPageSize + index + 1 },
    { title: 'Puskesmas', dataIndex: ['puskesmas', 'nama'], key: 'puskesmas', width: 180 },
    {
      title: 'Sub Kegiatan', dataIndex: ['subKegiatan', 'kegiatan'], key: 'subKegiatan', width: 250,
      render: (text: string, record: Target) => (
        <div><Tag color="blue">{record.subKegiatan.kode_sub}</Tag><div style={{ marginTop: 4 }}>{text}</div></div>
      ),
    },
    { title: 'Sumber', dataIndex: ['sumberAnggaran', 'sumber'], key: 'sumberAnggaran', width: 120 },
    { title: 'Tahun', dataIndex: 'tahun', key: 'tahun', width: 70 },
    { title: 'Target Anggaran (Rp)', dataIndex: 'target_rp', key: 'target_rp', width: 160, align: 'right' as const, render: (value: number) => formatNumber(value) },
    { title: 'Dibuat Oleh', dataIndex: ['creator', 'nama'], key: 'creator', width: 130 },
    {
      title: 'Aksi', key: 'action', width: 100, fixed: 'right' as const,
      render: (_: any, record: Target) => (
        <Button size="small" icon={<HistoryOutlined />} onClick={() => handleViewTargetHistory(record)}>History</Button>
      ),
    },
  ];

  const angkasColumns = [
    { title: 'Status', key: 'status', width: 90, render: (_: any, record: AngkasRecord) => record.hasAngkas ? <Tag color="green">Uploaded</Tag> : <Tag color="red">Belum</Tag> },
    { title: 'Puskesmas', dataIndex: ['puskesmas', 'nama'], key: 'puskesmas', width: 130 },
    {
      title: 'Sub Kegiatan', key: 'subKegiatan', width: 180, ellipsis: true,
      render: (_: any, record: AngkasRecord) => (
        <span title={record.subKegiatan?.kegiatan}><Text code style={{ fontSize: 11 }}>{record.subKegiatan?.kode_sub}</Text> {record.subKegiatan?.kegiatan}</span>
      ),
    },
    { title: 'Sumber', dataIndex: ['sumberAnggaran', 'sumber'], key: 'sumberAnggaran', width: 100 },
    { title: 'Target Anggaran (Rp)', dataIndex: 'target_rp', key: 'target_rp', width: 140, align: 'right' as const, render: (value: number) => formatNumber(value || 0) },
    ...BULAN_NAMES.map((name, idx) => ({
      title: name.substring(0, 3), dataIndex: ['bulanan', idx], key: `bulan_${idx}`, width: 85, align: 'right' as const,
      render: (value: number, record: AngkasRecord) => !record.hasAngkas ? <span style={{ color: '#bfbfbf' }}>-</span> : (value ? formatNumber(value) : '-'),
    })),
    { title: 'Total Angkas', dataIndex: 'total', key: 'total', width: 120, fixed: 'right' as const, align: 'right' as const, render: (value: number, record: AngkasRecord) => <strong style={{ color: record.hasAngkas ? undefined : '#bfbfbf' }}>{formatNumber(value)}</strong> },
    {
      title: 'Aksi', key: 'action', width: 90, fixed: 'right' as const,
      render: (_: any, record: AngkasRecord) => <Button size="small" icon={<HistoryOutlined />} onClick={() => handleViewAngkasHistory(record)}>History</Button>,
    },
  ];

  const unmatchedColumns = [
    { title: 'Puskesmas', dataIndex: ['puskesmas', 'nama'], key: 'puskesmas' },
    { title: 'Kode Rekening', dataIndex: 'kode_rekening', key: 'kode_rekening' },
    { title: 'Uraian', dataIndex: 'uraian', key: 'uraian', ellipsis: true },
    { title: 'Sumber Anggaran', dataIndex: ['sumberAnggaran', 'sumber'], key: 'sumberAnggaran' },
    {
      title: 'Aksi', key: 'action',
      render: (_: any, record: UnmatchedRecord) => (
        <Button type="link" icon={<LinkOutlined />} onClick={() => { setSelectedUnmatched(record); setMatchModalVisible(true); }}>Match</Button>
      ),
    },
  ];

  // ============== SHARED FILTER COMPONENT ==============
  const FilterSection = () => (
    <Row gutter={16} style={{ marginBottom: 16 }}>
      <Col span={5}>
        <Select placeholder="Pilih Puskesmas" style={{ width: '100%' }} allowClear showSearch
          filterOption={(input, option) => (option?.label ?? '').toLowerCase().includes(input.toLowerCase())}
          options={puskesmasList} value={filters.user_id}
          onChange={(value) => setFilters({ ...filters, user_id: value })}
        />
      </Col>
      <Col span={6}>
        <Select placeholder="Pilih Sub Kegiatan" style={{ width: '100%' }} allowClear showSearch
          filterOption={(input, option) => (option?.label ?? '').toLowerCase().includes(input.toLowerCase())}
          options={subKegiatanList} value={filters.id_sub_kegiatan}
          onChange={(value) => setFilters({ ...filters, id_sub_kegiatan: value })}
        />
      </Col>
      <Col span={5}>
        <Select placeholder="Pilih Sumber Anggaran" style={{ width: '100%' }} allowClear
          options={sumberAnggaranList} value={filters.id_sumber_anggaran}
          onChange={(value) => setFilters({ ...filters, id_sumber_anggaran: value })}
        />
      </Col>
      <Col span={4}>
        <Select placeholder="Tahun" style={{ width: '100%' }} value={filters.tahun}
          onChange={(value) => setFilters({ ...filters, tahun: value })}
          options={[{ value: 2024, label: '2024' }, { value: 2025, label: '2025' }, { value: 2026, label: '2026' }]}
        />
      </Col>
      {activeTab === 'angkas' && (
        <Col span={4}>
          <Select placeholder="Status" style={{ width: '100%' }} value={filters.angkasStatus}
            onChange={(value) => setFilters({ ...filters, angkasStatus: value })}
            options={[{ value: 'all', label: 'Semua' }, { value: 'uploaded', label: 'Sudah Upload' }, { value: 'not_uploaded', label: 'Belum Upload' }]}
          />
        </Col>
      )}
    </Row>
  );

  // ============== RENDER ==============
  return (
    <div style={{ padding: '24px' }}>
      <Card title="Upload Data Target & Angkas">
        <FilterSection />

        <Tabs activeKey={activeTab} onChange={setActiveTab} items={[
          {
            key: 'target',
            label: 'Target Anggaran (Rp)',
            children: (
              <>
                <div style={{ marginBottom: 16 }}>
                  <Button type="primary" icon={<UploadOutlined />} onClick={() => setTargetUploadModalVisible(true)}>
                    Upload Excel Target
                  </Button>
                </div>
                <Table columns={targetColumns} dataSource={targets} rowKey="id" loading={targetLoading}
                  scroll={{ x: 1400, y: 500 }} sticky pagination={{ pageSize: targetPageSize, current: targetCurrentPage, onChange: (page) => setTargetCurrentPage(page) }}
                />
              </>
            ),
          },
          {
            key: 'angkas',
            label: 'Angkas (PDF)',
            children: (
              <>
                <Row gutter={16} style={{ marginBottom: 16 }}>
                  <Col span={8}><Card size="small"><Statistic title="Total Kombinasi" value={angkasStats.total} /></Card></Col>
                  <Col span={8}><Card size="small"><Statistic title="Sudah Upload" value={angkasStats.withAngkas} valueStyle={{ color: '#52c41a' }} /></Card></Col>
                  <Col span={8}><Card size="small"><Statistic title="Belum Upload" value={angkasStats.withoutAngkas} valueStyle={{ color: '#ff4d4f' }} /></Card></Col>
                </Row>
                <div style={{ marginBottom: 16 }}>
                  <Space>
                    <Button type="primary" icon={<UploadOutlined />} onClick={() => setAngkasUploadModalVisible(true)}>Upload PDF Angkas</Button>
                    {filters.id_sumber_anggaran && (
                      <Popconfirm title="Hapus Data" description={`Hapus semua angkas tahun ${filters.tahun} dengan sumber anggaran terpilih?`}
                        onConfirm={handleBulkDeleteAngkas} okText="Ya, Hapus" cancelText="Batal">
                        <Button danger icon={<DeleteOutlined />}>Hapus Data</Button>
                      </Popconfirm>
                    )}
                  </Space>
                </div>
                <Table columns={angkasColumns}
                  dataSource={angkasData.filter(r => filters.angkasStatus === 'uploaded' ? r.hasAngkas : filters.angkasStatus === 'not_uploaded' ? !r.hasAngkas : true)}
                  rowKey={(r) => `${r.user_id}-${r.id_sub_kegiatan}-${r.id_sumber_anggaran}`}
                  loading={angkasLoading} scroll={{ x: 2400, y: 500 }} sticky pagination={{ showSizeChanger: true }}
                />
              </>
            ),
          },
          {
            key: 'unmatched',
            label: <span>Belum Terhubung {unmatchedData.length > 0 && <Tag color="orange" style={{ marginLeft: 8 }}>{unmatchedData.length}</Tag>}</span>,
            children: (
              <>
                <Alert message="Data angkas yang belum terhubung ke Sub Kegiatan" description="Klik 'Match' untuk menghubungkan ke sub kegiatan yang sesuai."
                  type="warning" showIcon style={{ marginBottom: 16 }} />
                <Table columns={unmatchedColumns} dataSource={unmatchedData} rowKey="id" pagination={{ showSizeChanger: true }} />
              </>
            ),
          },
        ]} />
      </Card>

      {/* TARGET UPLOAD MODAL */}
      <Modal title="Upload Excel Target Anggaran" open={targetUploadModalVisible} onCancel={() => setTargetUploadModalVisible(false)} footer={null}>
        <div style={{ marginTop: 20 }}>
          <p>Format Excel harus sesuai template dengan kolom: TAHUN, NAMA SUB UNIT, KODE SUB KEGIATAN, dll.</p>
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', marginBottom: 8, fontWeight: 500 }}>Catatan Perubahan <span style={{ color: 'red' }}>*</span></label>
            <input type="text" value={targetUploadCatatan} onChange={(e) => setTargetUploadCatatan(e.target.value)}
              placeholder="Contoh: Pagu Murni / Perubahan Parsial 1" disabled={targetUploading}
              style={{ width: '100%', padding: '8px 12px', border: targetUploadCatatan.trim() ? '1px solid #d9d9d9' : '1px solid #ff7875', borderRadius: 6 }}
            />
          </div>
          <Upload.Dragger name="file" accept=".xlsx,.xls" beforeUpload={handleTargetUpload} showUploadList={false} disabled={targetUploading || !targetUploadCatatan.trim()}>
            {targetUploading ? (
              <div style={{ padding: '0 20px' }}><Progress percent={targetUploadProgress} status="active" /><p style={{ marginTop: 8 }}>Memproses...</p></div>
            ) : (<><p className="ant-upload-drag-icon"><UploadOutlined /></p><p>Klik atau drag file Excel ke sini</p></>)}
          </Upload.Dragger>
        </div>
      </Modal>

      {/* ANGKAS UPLOAD MODAL */}
      <Modal title="Upload PDF Angkas" open={angkasUploadModalVisible} onCancel={() => !angkasUploading && setAngkasUploadModalVisible(false)} footer={null} closable={!angkasUploading}>
        <Space direction="vertical" style={{ width: '100%' }} size="middle">
          <Text>Tahun: <strong>{filters.tahun}</strong></Text>
          <Alert message="Format: PDF dari sistem ANGGARAN KAS SKPD" type="info" showIcon />
          {angkasUploading ? (
            <div style={{ textAlign: 'center', padding: 20 }}><Progress type="circle" percent={angkasUploadProgress} /><p style={{ marginTop: 16 }}><LoadingOutlined /> Memproses PDF...</p></div>
          ) : (
            <Upload.Dragger accept=".pdf" showUploadList={false} beforeUpload={handleAngkasUpload}>
              <p className="ant-upload-drag-icon"><UploadOutlined style={{ fontSize: 48, color: '#1890ff' }} /></p>
              <p>Klik atau drag file PDF ke area ini</p>
            </Upload.Dragger>
          )}
        </Space>
      </Modal>

      {/* MATCH MODAL */}
      <Modal title="Hubungkan ke Sub Kegiatan" open={matchModalVisible}
        onCancel={() => { setMatchModalVisible(false); setSelectedUnmatched(null); setSelectedSubKegiatan(undefined); }}
        onOk={handleMatchSubKegiatan} okText="Simpan" cancelText="Batal">
        {selectedUnmatched && (
          <Space direction="vertical" style={{ width: '100%' }} size="middle">
            <div><Text strong>Kode Rekening:</Text><br /><Text code>{selectedUnmatched.kode_rekening}</Text></div>
            <div><Text strong>Uraian:</Text><br /><Text>{selectedUnmatched.uraian}</Text></div>
            <div>
              <Text strong>Pilih Sub Kegiatan:</Text>
              <Select value={selectedSubKegiatan} onChange={setSelectedSubKegiatan} style={{ width: '100%', marginTop: 8 }}
                placeholder="Cari Sub Kegiatan" showSearch filterOption={(input, option) => (option?.label ?? '').toLowerCase().includes(input.toLowerCase())}
                options={subKegiatanList} />
            </div>
          </Space>
        )}
      </Modal>

      {/* TARGET HISTORY MODAL */}
      <Modal title="History Target Anggaran" open={targetHistoryModalVisible} onCancel={() => setTargetHistoryModalVisible(false)}
        footer={[<Button key="close" onClick={() => setTargetHistoryModalVisible(false)}>Tutup</Button>]} width={700}>
        {selectedTarget && (
          <div style={{ marginBottom: 16 }}>
            <p><strong>Puskesmas:</strong> {selectedTarget.puskesmas?.nama}</p>
            <p><strong>Sub Kegiatan:</strong> {selectedTarget.subKegiatan?.kode_sub} - {selectedTarget.subKegiatan?.kegiatan}</p>
            <p><strong>Sumber Anggaran:</strong> {selectedTarget.sumberAnggaran?.sumber}</p>
          </div>
        )}
        <Timeline mode="left" items={targetHistoryData.map((record) => ({
          color: 'blue',
          children: (
            <div>
              <div style={{ fontWeight: 'bold' }}>{formatDateTime(record.created_at)}</div>
              <div style={{ marginTop: 8 }}>Target Anggaran (Rp): <strong>{formatNumber(record.target_rp)}</strong></div>
              <div style={{ fontSize: '12px', color: '#888' }}>Dibuat oleh: {record.creator?.nama || 'N/A'}</div>
              {record.catatan && <div style={{ marginTop: 6, padding: '6px 10px', background: '#f5f5f5', borderRadius: 4, fontSize: '12px' }}><strong>Catatan:</strong> {record.catatan}</div>}
            </div>
          ),
        }))} />
      </Modal>

      {/* ANGKAS HISTORY MODAL */}
      <Modal title="History Angkas" open={angkasHistoryModalVisible} onCancel={() => { setAngkasHistoryModalVisible(false); setSelectedAngkasRecord(null); }}
        footer={[<Button key="close" onClick={() => setAngkasHistoryModalVisible(false)}>Tutup</Button>]} width={800}>
        {selectedAngkasRecord && (
          <div style={{ marginBottom: 16 }}>
            <p><strong>Puskesmas:</strong> {selectedAngkasRecord.puskesmas?.nama}</p>
            <p><strong>Sub Kegiatan:</strong> {selectedAngkasRecord.subKegiatan?.kode_sub} - {selectedAngkasRecord.subKegiatan?.kegiatan}</p>
          </div>
        )}
        {angkasHistoryData.length > 0 ? (
          <div style={{ maxHeight: 400, overflow: 'auto' }}>
            {angkasHistoryData.map((bulanData) => (
              <Card key={bulanData.bulan} size="small" title={<Tag color="blue">{BULAN_NAMES[bulanData.bulan - 1]}</Tag>} style={{ marginBottom: 12 }}>
                <Timeline mode="left" items={bulanData.values.map((record) => ({
                  color: 'green',
                  children: (
                    <div>
                      <div style={{ fontWeight: 'bold' }}>{formatDateTime(record.created_at)}</div>
                      <div>Nilai: <strong>{formatNumber(record.nilai)}</strong></div>
                      <div style={{ fontSize: '12px', color: '#888' }}>Diupload oleh: {record.creator?.nama || 'N/A'}</div>
                    </div>
                  ),
                }))} />
              </Card>
            ))}
          </div>
        ) : <p style={{ textAlign: 'center', color: '#888' }}>Belum ada history</p>}
      </Modal>
    </div>
  );
};

export default AdminTargetUploadPage;
