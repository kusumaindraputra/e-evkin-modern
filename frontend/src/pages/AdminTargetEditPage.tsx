import React, { useState, useEffect, useCallback } from 'react';
import dayjs from 'dayjs';
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
  Form,
  InputNumber,
  Input,
  DatePicker,
  Switch,
  Tabs,
} from 'antd';
import { HistoryOutlined, EditOutlined } from '@ant-design/icons';
import axios from 'axios';
import API_BASE_URL from '../config/api';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { formatNumber, formatDateTime } from '../utils/formatters';
import { brand, modalWidths } from '../theme';

// ============== INTERFACES ==============
interface Puskesmas { value: string; label: string; }
interface SubKegiatan { value: number; label: string; }
interface SumberAnggaran { value: number; label: string; }
interface SatuanOption { value: number; label: string; }

interface TargetKinerja {
  id: number;
  user_id: string;
  id_sub_kegiatan: number;
  id_sumber_anggaran: number;
  id_satuan: number | null;
  target_k: number;
  target_rp: number;
  tahun: number;
  created_at: string;
  puskesmas: { id: string; username: string; nama: string };
  subKegiatan: { id_sub_kegiatan: number; kode_sub: string; kegiatan: string };
  sumberAnggaran: { id_sumber: number; sumber: string };
  satuan?: { id_satuan: number; satuannya: string } | null;
  creator: { id: string; username: string; nama: string };
}

interface TargetHistoryRecord {
  id: number;
  target_k: number;
  target_rp: number;
  id_satuan: number | null;
  catatan?: string | null;
  created_at: string;
  creator: { id: string; username: string; nama: string };
  satuan?: { id_satuan: number; satuannya: string } | null;
}

interface AngkasData {
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
  isManualAngkas: boolean;
}

interface AngkasHistoryRecord {
  created_at: string;
  creator: { id: string; nama: string; username: string } | null;
  uraian: string;
  bulanan: Array<{ bulan: number; nilai: number }>;
  total: number;
}

const BULAN_NAMES = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
];

const AdminTargetEditPage: React.FC = () => {
  const navigate = useNavigate();
  const { token } = useAuthStore();
  const [targetForm] = Form.useForm();
  const [angkasForm] = Form.useForm();
  const [permFormTarget] = Form.useForm();
  const [permFormAngkas] = Form.useForm();

  // ============== SHARED STATE ==============
  const [activeTab, setActiveTab] = useState('target_kinerja');
  const [puskesmasList, setPuskesmasList] = useState<Puskesmas[]>([]);
  const [subKegiatanList, setSubKegiatanList] = useState<SubKegiatan[]>([]);
  const [sumberAnggaranList, setSumberAnggaranList] = useState<SumberAnggaran[]>([]);
  const [satuanList, setSatuanList] = useState<SatuanOption[]>([]);

  // Shared filters
  const [filters, setFilters] = useState({
    user_id: undefined as string | undefined,
    id_sub_kegiatan: undefined as number | undefined,
    id_sumber_anggaran: undefined as number | undefined,
    tahun: new Date().getFullYear(),
  });

  // ============== TARGET KINERJA STATE ==============
  const [targetData, setTargetData] = useState<TargetKinerja[]>([]);
  const [targetLoading, setTargetLoading] = useState(false);
  const [targetEditModalVisible, setTargetEditModalVisible] = useState(false);
  const [selectedTarget, setSelectedTarget] = useState<TargetKinerja | null>(null);
  const [targetHistoryModalVisible, setTargetHistoryModalVisible] = useState(false);
  const [targetHistoryData, setTargetHistoryData] = useState<TargetHistoryRecord[]>([]);
  const [targetSaving, setTargetSaving] = useState(false);
  const [targetCurrentPage, setTargetCurrentPage] = useState(1);
  const [targetPageSize] = useState(10);

  // Permission state for target_kinerja
  const [savingPermTarget, setSavingPermTarget] = useState(false);
  const [loadingPermTargetStatus, setLoadingPermTargetStatus] = useState(false);

  // ============== ANGKAS STATE ==============
  const [angkasData, setAngkasData] = useState<AngkasData[]>([]);
  const [angkasLoading, setAngkasLoading] = useState(false);
  const [angkasEditModalVisible, setAngkasEditModalVisible] = useState(false);
  const [selectedAngkas, setSelectedAngkas] = useState<AngkasData | null>(null);
  const [angkasHistoryModalVisible, setAngkasHistoryModalVisible] = useState(false);
  const [angkasHistoryData, setAngkasHistoryData] = useState<AngkasHistoryRecord[]>([]);
  const [angkasSaving, setAngkasSaving] = useState(false);
  const [angkasCurrentPage, setAngkasCurrentPage] = useState(1);
  const [angkasPageSize] = useState(10);
  const [angkasFormTotal, setAngkasFormTotal] = useState(0);

  // Permission state for angkas
  const [savingPermAngkas, setSavingPermAngkas] = useState(false);
  const [loadingPermAngkasStatus, setLoadingPermAngkasStatus] = useState(false);

  // ============== LOAD REFERENCE DATA ==============
  useEffect(() => {
    loadReferenceData();
  }, []);

  const loadReferenceData = async () => {
    try {
      const headers = { Authorization: `Bearer ${token}` };
      const [puskesmasRes, kegiatanRes, sumberRes, satuanRes] = await Promise.all([
        axios.get(`${API_BASE_URL}/users/puskesmas`, { headers }),
        axios.get(`${API_BASE_URL}/kegiatan/kegiatan`, { headers, params: { include: 'sub' } }),
        axios.get(`${API_BASE_URL}/reference/sumber-anggaran`, { headers }),
        axios.get(`${API_BASE_URL}/reference/satuan`, { headers }),
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
          allSubKegiatan.push({ value: sub.id_sub_kegiatan, label: `${sub.kode_sub} - ${sub.kegiatan}` });
        });
      });
      setSubKegiatanList(allSubKegiatan);

      // Sumber Anggaran
      const sumberData = Array.isArray(sumberRes.data) ? sumberRes.data : (sumberRes.data.data || []);
      setSumberAnggaranList(sumberData);

      // Satuan
      const satuanData = Array.isArray(satuanRes.data) ? satuanRes.data : (satuanRes.data.data || []);
      setSatuanList(satuanData);
    } catch (error: any) {
      console.error('Error loading reference data:', error);
      if (error.response?.status === 401) {
        message.error('Session expired. Please login again.');
        navigate('/login');
      }
    }
  };

  // ============== TARGET KINERJA FUNCTIONS ==============
  const loadTargetData = useCallback(async () => {
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
        setTargetData(response.data.data);
      }
    } catch (error: any) {
      console.error('Error loading targets:', error);
      if (error.response?.status === 401) {
        navigate('/login');
        return;
      }
      message.error('Gagal memuat data target kinerja');
    } finally {
      setTargetLoading(false);
    }
  }, [token, filters, navigate]);

  const handleEditTarget = (record: TargetKinerja) => {
    setSelectedTarget(record);
    targetForm.setFieldsValue({
      target_k: record.target_k,
      id_satuan: record.id_satuan || undefined,
      catatan: '',
    });
    setTargetEditModalVisible(true);
  };

  const handleSaveTarget = async () => {
    try {
      const values = await targetForm.validateFields();
      if (!selectedTarget) return;

      setTargetSaving(true);
      const response = await axios.put(
        `${API_BASE_URL}/target/admin/${selectedTarget.id}/target-kinerja`,
        { target_k: values.target_k, id_satuan: values.id_satuan || null, catatan: values.catatan },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.data.success) {
        message.success('Target kinerja berhasil diperbarui');
        setTargetEditModalVisible(false);
        targetForm.resetFields();
        loadTargetData();
      }
    } catch (error: any) {
      message.error(error.response?.data?.message || 'Gagal menyimpan target');
    } finally {
      setTargetSaving(false);
    }
  };

  const handleViewTargetHistory = async (record: TargetKinerja) => {
    setSelectedTarget(record);
    setTargetHistoryModalVisible(true);
    try {
      const response = await axios.get(`${API_BASE_URL}/target/admin/history`, {
        headers: { Authorization: `Bearer ${token}` },
        params: { user_id: record.user_id, id_sub_kegiatan: record.id_sub_kegiatan, id_sumber_anggaran: record.id_sumber_anggaran, tahun: record.tahun },
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
      if (filters.id_sub_kegiatan) params.id_sub_kegiatan = filters.id_sub_kegiatan;
      if (filters.id_sumber_anggaran) params.id_sumber_anggaran = filters.id_sumber_anggaran;

      const response = await axios.get(`${API_BASE_URL}/angkas`, {
        headers: { Authorization: `Bearer ${token}` },
        params,
      });

      if (response.data?.data) {
        setAngkasData(response.data.data);
      }
    } catch (error: any) {
      console.error('Error loading angkas:', error);
      if (error.response?.status === 401) {
        navigate('/login');
        return;
      }
      message.error('Gagal memuat data angkas');
    } finally {
      setAngkasLoading(false);
    }
  }, [token, filters, navigate]);

  const handleEditAngkas = (record: AngkasData) => {
    setSelectedAngkas(record);
    const formValues: any = { catatan: '' };
    let total = 0;
    BULAN_NAMES.forEach((_, index) => {
      const val = record.bulanan[index] || 0;
      formValues[`bulan_${index + 1}`] = val;
      total += val;
    });
    angkasForm.setFieldsValue(formValues);
    setAngkasFormTotal(total);
    setAngkasEditModalVisible(true);
  };

  const calculateAngkasTotal = () => {
    const values = angkasForm.getFieldsValue();
    let total = 0;
    for (let i = 1; i <= 12; i++) {
      total += Number(values[`bulan_${i}`]) || 0;
    }
    setAngkasFormTotal(total);
  };

  const getAngkasSelisih = () => {
    if (!selectedAngkas) return 0;
    return angkasFormTotal - selectedAngkas.target_rp;
  };

  const isValidAngkasTotal = () => {
    if (!selectedAngkas) return false;
    return angkasFormTotal === selectedAngkas.target_rp;
  };

  const handleSaveAngkas = async () => {
    try {
      const values = await angkasForm.validateFields();
      if (!selectedAngkas) return;

      setAngkasSaving(true);
      const bulanan: number[] = [];
      for (let i = 1; i <= 12; i++) {
        bulanan.push(Number(values[`bulan_${i}`]) || 0);
      }

      const response = await axios.put(
        `${API_BASE_URL}/angkas/admin/manual`,
        {
          user_id: selectedAngkas.user_id,
          id_sub_kegiatan: selectedAngkas.id_sub_kegiatan,
          id_sumber_anggaran: selectedAngkas.id_sumber_anggaran,
          tahun: selectedAngkas.tahun,
          bulanan,
          catatan: values.catatan,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.data.success) {
        message.success(response.data.message || 'Angkas berhasil disimpan');
        setAngkasEditModalVisible(false);
        angkasForm.resetFields();
        loadAngkasData();
      }
    } catch (error: any) {
      message.error(error.response?.data?.message || 'Gagal menyimpan angkas');
    } finally {
      setAngkasSaving(false);
    }
  };

  const handleViewAngkasHistory = async (record: AngkasData) => {
    setSelectedAngkas(record);
    setAngkasHistoryModalVisible(true);
    try {
      const response = await axios.get(`${API_BASE_URL}/angkas/manual/history`, {
        headers: { Authorization: `Bearer ${token}` },
        params: { user_id: record.user_id, id_sub_kegiatan: record.id_sub_kegiatan, id_sumber_anggaran: record.id_sumber_anggaran, tahun: record.tahun },
      });
      if (response.data.success) {
        setAngkasHistoryData(response.data.data.history || []);
      }
    } catch (error: any) {
      message.error('Gagal memuat history');
    }
  };

  // ============== PERMISSION FUNCTIONS ==============
  const handleSavePermission = async (scope: 'target_kinerja' | 'angkas') => {
    const form = scope === 'target_kinerja' ? permFormTarget : permFormAngkas;
    const setSaving = scope === 'target_kinerja' ? setSavingPermTarget : setSavingPermAngkas;

    try {
      const values = await form.validateFields();
      if (!values.tahun) {
        message.warning('Tahun wajib diisi');
        return;
      }
      setSaving(true);
      const payload = {
        user_id: values.user_id || null,
        scope,
        bulan: null,
        tahun: values.tahun,
        enabled: !!values.enabled,
        start_at: values.start_at ? values.start_at.toISOString() : null,
        end_at: values.end_at ? values.end_at.toISOString() : null,
      };
      const resp = await axios.post(`${API_BASE_URL}/puskesmas-config/edit-permission`, payload, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (resp.data?.success) {
        message.success(`Jadwal edit ${scope === 'target_kinerja' ? 'Target Kinerja' : 'Angkas'} berhasil disimpan`);
        fetchPermissionStatus(scope, { user_id: values.user_id || null, tahun: values.tahun });
      }
    } catch (error: any) {
      message.error(error.response?.data?.message || 'Gagal menyimpan konfigurasi');
    } finally {
      setSaving(false);
    }
  };

  const fetchPermissionStatus = async (scope: 'target_kinerja' | 'angkas', { user_id, tahun }: { user_id?: string | null; tahun: number }) => {
    const form = scope === 'target_kinerja' ? permFormTarget : permFormAngkas;
    const setLoading = scope === 'target_kinerja' ? setLoadingPermTargetStatus : setLoadingPermAngkasStatus;

    try {
      setLoading(true);
      const params: any = { scope, tahun };
      if (user_id) params.user_id = user_id;
      const resp = await axios.get(`${API_BASE_URL}/puskesmas-config/edit-permission/latest`, {
        headers: { Authorization: `Bearer ${token}` },
        params,
      });
      const latest = resp.data?.data || null;
      form.setFieldsValue({
        enabled: latest ? latest.enabled : false,
        start_at: latest?.start_at ? dayjs(latest.start_at) : null,
        end_at: latest?.end_at ? dayjs(latest.end_at) : null,
      });
    } catch (error) {
      console.error('Error fetching permission status:', error);
    } finally {
      setLoading(false);
    }
  };

  // ============== LOAD DATA ON TAB/FILTER CHANGE ==============
  useEffect(() => {
    if (activeTab === 'target_kinerja') {
      loadTargetData();
    } else if (activeTab === 'angkas') {
      loadAngkasData();
    }
  }, [activeTab, filters, loadTargetData, loadAngkasData]);

  // ============== COLUMNS ==============
  const targetColumns = [
    { title: 'No', key: 'no', width: 50, align: 'center' as const, render: (_: any, __: any, index: number) => (targetCurrentPage - 1) * targetPageSize + index + 1 },
    { title: 'Puskesmas', dataIndex: ['puskesmas', 'nama'], key: 'puskesmas', width: 150 },
    {
      title: 'Sub Kegiatan', dataIndex: ['subKegiatan', 'kegiatan'], key: 'subKegiatan', width: 250,
      render: (text: string, record: TargetKinerja) => (
        <div><Tag color="blue">{record.subKegiatan?.kode_sub}</Tag><div style={{ marginTop: 4 }}>{text}</div></div>
      ),
    },
    { title: 'Sumber', dataIndex: ['sumberAnggaran', 'sumber'], key: 'sumberAnggaran', width: 120 },
    { title: 'Tahun', dataIndex: 'tahun', key: 'tahun', width: 70 },
    {
      title: 'Target (K)', dataIndex: 'target_k', key: 'target_k', width: 100, align: 'right' as const,
      render: (value: number) => <span style={{ color: value === 0 ? brand.warning : undefined }}>{formatNumber(value)}</span>,
    },
    {
      title: 'Satuan', key: 'satuan', width: 120,
      render: (_: any, record: TargetKinerja) => record.satuan?.satuannya || <Tag color="warning">Silahkan Pilih</Tag>,
    },
    { title: 'Target Anggaran (Rp)', dataIndex: 'target_rp', key: 'target_rp', width: 140, align: 'right' as const, render: (value: number) => formatNumber(value) },
    { title: 'Dibuat Oleh', dataIndex: ['creator', 'nama'], key: 'creator', width: 120 },
    {
      title: 'Aksi', key: 'action', width: 150, fixed: 'right' as const,
      render: (_: any, record: TargetKinerja) => (
        <div style={{ display: 'flex', gap: 8 }}>
          <Button size="small" type="primary" icon={<EditOutlined />} onClick={() => handleEditTarget(record)}>Edit</Button>
          <Button size="small" icon={<HistoryOutlined />} onClick={() => handleViewTargetHistory(record)}>History</Button>
        </div>
      ),
    },
  ];

  const angkasColumns = [
    { title: 'No', key: 'no', width: 50, align: 'center' as const, render: (_: any, __: any, index: number) => (angkasCurrentPage - 1) * angkasPageSize + index + 1 },
    { title: 'Puskesmas', dataIndex: ['puskesmas', 'nama'], key: 'puskesmas', width: 150 },
    {
      title: 'Sub Kegiatan', dataIndex: ['subKegiatan', 'kegiatan'], key: 'subKegiatan', width: 250,
      render: (text: string, record: AngkasData) => (
        <div><Tag color="blue">{record.subKegiatan?.kode_sub}</Tag><div style={{ marginTop: 4 }}>{text}</div></div>
      ),
    },
    { title: 'Sumber', dataIndex: ['sumberAnggaran', 'sumber'], key: 'sumberAnggaran', width: 100 },
    { title: 'Target Anggaran (Rp)', dataIndex: 'target_rp', key: 'target_rp', width: 130, align: 'right' as const, render: (value: number) => formatNumber(value) },
    {
      title: 'Total Angkas', dataIndex: 'total', key: 'total', width: 130, align: 'right' as const,
      render: (value: number, record: AngkasData) => (
        <span style={{ color: value === 0 ? brand.warning : undefined }}>
          {formatNumber(value)}
          {record.hasAngkas && <Tag color="green" style={{ marginLeft: 4 }}>✓</Tag>}
        </span>
      ),
    },
    {
      title: 'Status', key: 'status', width: 110,
      render: (_: any, record: AngkasData) => record.isManualAngkas ? <Tag color="purple">Multi-Sumber</Tag> : <Tag color="default">Single-Sumber</Tag>,
    },
    {
      title: 'Aksi', key: 'action', width: 150, fixed: 'right' as const,
      render: (_: any, record: AngkasData) => (
        <div style={{ display: 'flex', gap: 8 }}>
          <Button size="small" type="primary" icon={<EditOutlined />} onClick={() => handleEditAngkas(record)}>Edit</Button>
          <Button size="small" icon={<HistoryOutlined />} onClick={() => handleViewAngkasHistory(record)}>History</Button>
        </div>
      ),
    },
  ];

  // ============== SHARED FILTER COMPONENT ==============
  const FilterSection = () => (
    <Row gutter={16} style={{ marginBottom: 16 }}>
      <Col span={6}>
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
      <Col span={6}>
        <Select placeholder="Pilih Sumber Anggaran" style={{ width: '100%' }} allowClear
          options={sumberAnggaranList} value={filters.id_sumber_anggaran}
          onChange={(value) => setFilters({ ...filters, id_sumber_anggaran: value })}
        />
      </Col>
      <Col span={6}>
        <Select placeholder="Tahun" style={{ width: '100%' }} value={filters.tahun}
          onChange={(value) => setFilters({ ...filters, tahun: value })}
          options={[{ value: 2024, label: '2024' }, { value: 2025, label: '2025' }, { value: 2026, label: '2026' }]}
        />
      </Col>
    </Row>
  );

  // ============== PERMISSION CONFIG COMPONENT ==============
  const PermissionConfigCard = ({ scope, form, saving, loadingStatus }: { scope: 'target_kinerja' | 'angkas'; form: any; saving: boolean; loadingStatus: boolean }) => (
    <Card title={`Jadwal Edit ${scope === 'target_kinerja' ? 'Target Kinerja' : 'Angkas'} (Puskesmas)`} size="small" style={{ marginBottom: 16 }}>
      <Form layout="vertical" form={form} initialValues={{ enabled: false, tahun: new Date().getFullYear() }}
        onValuesChange={(changedValues, allValues) => {
          if ('user_id' in changedValues || 'tahun' in changedValues) {
            const { user_id, tahun } = allValues;
            if (tahun) fetchPermissionStatus(scope, { user_id: user_id || null, tahun });
          }
        }}>
        <Row gutter={16}>
          <Col span={6}>
            <Form.Item name="user_id" label="Puskesmas">
              <Select placeholder="Semua Puskesmas" allowClear showSearch
                filterOption={(input, option) => (option?.label ?? '').toLowerCase().includes(input.toLowerCase())}
                options={puskesmasList} />
            </Form.Item>
          </Col>
          <Col span={4}>
            <Form.Item name="tahun" label="Tahun" rules={[{ required: true }]}>
              <Select options={[{ value: 2024, label: '2024' }, { value: 2025, label: '2025' }, { value: 2026, label: '2026' }]} />
            </Form.Item>
          </Col>
          <Col span={4}>
            <Form.Item name="enabled" label="Buka Langsung" valuePropName="checked">
              <Switch loading={loadingStatus} />
            </Form.Item>
          </Col>
          <Col span={4}>
            <Form.Item name="start_at" label="Mulai">
              <DatePicker showTime style={{ width: '100%' }} />
            </Form.Item>
          </Col>
          <Col span={4}>
            <Form.Item name="end_at" label="Selesai">
              <DatePicker showTime style={{ width: '100%' }} />
            </Form.Item>
          </Col>
          <Col span={2}>
            <Form.Item label=" " colon={false}>
              <Button type="primary" onClick={() => handleSavePermission(scope)} loading={saving}>Simpan</Button>
            </Form.Item>
          </Col>
        </Row>
      </Form>
    </Card>
  );

  // ============== RENDER ==============
  return (
    <div style={{ padding: '24px' }}>
      <Card title="Edit Data Target & Angkas">
        <FilterSection />

        <Tabs activeKey={activeTab} onChange={setActiveTab} items={[
          {
            key: 'target_kinerja',
            label: 'Target Kinerja (K)',
            children: (
              <>
                <PermissionConfigCard scope="target_kinerja" form={permFormTarget} saving={savingPermTarget} loadingStatus={loadingPermTargetStatus} />
                <Table columns={targetColumns} dataSource={targetData} rowKey="id" loading={targetLoading}
                  scroll={{ x: 1500, y: 500 }} sticky pagination={{ pageSize: targetPageSize, current: targetCurrentPage, onChange: (page) => setTargetCurrentPage(page) }}
                />
              </>
            ),
          },
          {
            key: 'angkas',
            label: 'Angkas Manual',
            children: (
              <>
                <PermissionConfigCard scope="angkas" form={permFormAngkas} saving={savingPermAngkas} loadingStatus={loadingPermAngkasStatus} />
                <p style={{ color: brand.textTertiary, fontSize: '12px', marginBottom: 16 }}>
                  * <Tag color="purple">Multi-Sumber</Tag> = Puskesmas dapat input manual | Admin dapat edit semua data
                </p>
                <Table columns={angkasColumns} dataSource={angkasData} rowKey={(r) => `${r.user_id}-${r.id_sub_kegiatan}-${r.id_sumber_anggaran}`}
                  loading={angkasLoading} scroll={{ x: 1400, y: 500 }} sticky
                  pagination={{ pageSize: angkasPageSize, current: angkasCurrentPage, onChange: (page) => setAngkasCurrentPage(page) }}
                />
              </>
            ),
          },
        ]} />
      </Card>

      {/* TARGET KINERJA EDIT MODAL */}
      <Modal title="Edit Target Kinerja" open={targetEditModalVisible}
        onCancel={() => { setTargetEditModalVisible(false); targetForm.resetFields(); }}
        onOk={handleSaveTarget} okText="Simpan" cancelText="Batal" confirmLoading={targetSaving} width={modalWidths.md}>
        {selectedTarget && (
          <div style={{ marginBottom: 16, padding: 12, background: brand.bgLayout, borderRadius: 6 }}>
            <p style={{ margin: 0 }}><strong>Puskesmas:</strong> {selectedTarget.puskesmas?.nama}</p>
            <p style={{ margin: '4px 0' }}><strong>Sub Kegiatan:</strong> {selectedTarget.subKegiatan?.kode_sub} - {selectedTarget.subKegiatan?.kegiatan}</p>
            <p style={{ margin: '4px 0' }}><strong>Sumber Anggaran:</strong> {selectedTarget.sumberAnggaran?.sumber}</p>
            <p style={{ margin: 0 }}><strong>Target Anggaran (Rp):</strong> {formatNumber(selectedTarget.target_rp)}</p>
          </div>
        )}
        <Form form={targetForm} layout="vertical">
          <Form.Item name="target_k" label="Target Kinerja (K)" rules={[{ required: true, message: 'Target Kinerja wajib diisi' }]}>
            <InputNumber style={{ width: '100%' }} min={0} formatter={(v) => `${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, '.')} parser={(v) => v!.replace(/\./g, '') as any} />
          </Form.Item>
          <Form.Item name="id_satuan" label="Satuan" rules={[{ required: true, message: 'Satuan wajib dipilih' }]}>
            <Select placeholder="Pilih Satuan" showSearch filterOption={(input, option) => (option?.label ?? '').toLowerCase().includes(input.toLowerCase())} options={satuanList} />
          </Form.Item>
          <Form.Item name="catatan" label="Catatan Perubahan" rules={[{ required: true, message: 'Catatan perubahan wajib diisi' }]}>
            <Input.TextArea rows={3} placeholder="Contoh: Penyesuaian target sesuai RAK" />
          </Form.Item>
        </Form>
      </Modal>

      {/* TARGET KINERJA HISTORY MODAL */}
      <Modal title="History Target Kinerja" open={targetHistoryModalVisible} onCancel={() => setTargetHistoryModalVisible(false)}
        footer={[<Button key="close" onClick={() => setTargetHistoryModalVisible(false)}>Tutup</Button>]} width={modalWidths.lg}>
        {selectedTarget && (
          <div style={{ marginBottom: 16 }}>
            <p><strong>Puskesmas:</strong> {selectedTarget.puskesmas?.nama}</p>
            <p><strong>Sub Kegiatan:</strong> {selectedTarget.subKegiatan?.kode_sub} - {selectedTarget.subKegiatan?.kegiatan}</p>
          </div>
        )}
        <Timeline mode="left" items={targetHistoryData.map((record) => ({
          color: 'blue',
          children: (
            <div>
              <div style={{ fontWeight: 'bold' }}>{formatDateTime(record.created_at)}</div>
              <div style={{ marginTop: 8 }}>Target (K): <strong>{formatNumber(record.target_k)}</strong></div>
              <div>Satuan: <strong>{record.satuan?.satuannya || <i style={{ color: brand.textTertiary }}>Belum dipilih</i>}</strong></div>
              <div style={{ fontSize: '12px', color: brand.textTertiary }}>Target Anggaran (Rp): {formatNumber(record.target_rp)}</div>
              <div style={{ fontSize: '12px', color: brand.textTertiary }}>Dibuat oleh: {record.creator?.nama || 'N/A'}</div>
              {record.catatan && <div style={{ marginTop: 6, padding: '6px 10px', background: brand.bgLayout, borderRadius: 4, fontSize: '12px' }}><strong>Catatan:</strong> {record.catatan}</div>}
            </div>
          ),
        }))} />
      </Modal>

      {/* ANGKAS EDIT MODAL */}
      <Modal title="Edit Angkas" open={angkasEditModalVisible}
        onCancel={() => { setAngkasEditModalVisible(false); angkasForm.resetFields(); setAngkasFormTotal(0); }}
        onOk={handleSaveAngkas} okText="Simpan" cancelText="Batal" confirmLoading={angkasSaving} okButtonProps={{ disabled: !isValidAngkasTotal() }} width={modalWidths.md}>
        {selectedAngkas && (
          <div style={{ marginBottom: 16, padding: 12, background: brand.bgLayout, borderRadius: 6 }}>
            <p style={{ margin: 0 }}><strong>Puskesmas:</strong> {selectedAngkas.puskesmas?.nama}</p>
            <p style={{ margin: '4px 0' }}><strong>Sub Kegiatan:</strong> {selectedAngkas.subKegiatan?.kode_sub} - {selectedAngkas.subKegiatan?.kegiatan}</p>
            <p style={{ margin: '4px 0' }}><strong>Sumber Anggaran:</strong> {selectedAngkas.sumberAnggaran?.sumber}</p>
            <p style={{ margin: 0 }}><strong>Target Anggaran (Rp):</strong> {formatNumber(selectedAngkas.target_rp)}</p>
          </div>
        )}
        {selectedAngkas && (
          <div style={{
            marginBottom: 16,
            padding: 12,
            background: isValidAngkasTotal() ? '#f6ffed' : '#fff2e8',
            border: `1px solid ${isValidAngkasTotal() ? '#b7eb8f' : '#ffbb96'}`,
            borderRadius: 6
          }}>
            <Row gutter={16}>
              <Col span={8}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ color: brand.textTertiary, fontSize: 12 }}>Total Angkas</div>
                  <div style={{ fontSize: 16, fontWeight: 'bold' }}>{formatNumber(angkasFormTotal)}</div>
                </div>
              </Col>
              <Col span={8}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ color: brand.textTertiary, fontSize: 12 }}>Target Anggaran</div>
                  <div style={{ fontSize: 16, fontWeight: 'bold' }}>{formatNumber(selectedAngkas.target_rp)}</div>
                </div>
              </Col>
              <Col span={8}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ color: brand.textTertiary, fontSize: 12 }}>Selisih</div>
                  <div style={{
                    fontSize: 16,
                    fontWeight: 'bold',
                    color: getAngkasSelisih() === 0 ? brand.success : brand.error
                  }}>
                    {getAngkasSelisih() > 0 ? '+' : ''}{formatNumber(getAngkasSelisih())}
                  </div>
                </div>
              </Col>
            </Row>
            {!isValidAngkasTotal() && (
              <div style={{ marginTop: 12, padding: '8px 12px', background: '#FFF8E1', border: `1px solid ${brand.warning}`, borderRadius: 4 }}>
                <span style={{ color: brand.warning }}>⚠️ Total angkas harus sama dengan target anggaran untuk dapat menyimpan</span>
              </div>
            )}
          </div>
        )}
        <Form form={angkasForm} layout="vertical">
          <Row gutter={16}>
            {BULAN_NAMES.map((bulan, index) => (
              <Col span={8} key={bulan}>
                <Form.Item name={`bulan_${index + 1}`} label={bulan}>
                  <InputNumber style={{ width: '100%' }} min={0} formatter={(v) => `${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, '.')} parser={(v) => v!.replace(/\./g, '') as any} addonAfter="Rp" onChange={calculateAngkasTotal} />
                </Form.Item>
              </Col>
            ))}
          </Row>
          <Form.Item name="catatan" label="Catatan Perubahan" rules={[{ required: true, message: 'Catatan perubahan wajib diisi' }]}>
            <Input.TextArea rows={3} placeholder="Contoh: Penyesuaian angkas sesuai revisi anggaran" />
          </Form.Item>
        </Form>
      </Modal>

      {/* ANGKAS HISTORY MODAL */}
      <Modal title="History Angkas" open={angkasHistoryModalVisible} onCancel={() => { setAngkasHistoryModalVisible(false); setSelectedAngkas(null); }}
        footer={[<Button key="close" onClick={() => setAngkasHistoryModalVisible(false)}>Tutup</Button>]} width={modalWidths.lg}>
        {selectedAngkas && (
          <div style={{ marginBottom: 16 }}>
            <p><strong>Puskesmas:</strong> {selectedAngkas.puskesmas?.nama}</p>
            <p><strong>Sub Kegiatan:</strong> {selectedAngkas.subKegiatan?.kode_sub} - {selectedAngkas.subKegiatan?.kegiatan}</p>
          </div>
        )}
        {angkasHistoryData.length === 0 ? (
          <p style={{ textAlign: 'center', color: brand.textTertiary }}>Belum ada history perubahan</p>
        ) : (
          <Timeline mode="left" items={angkasHistoryData.map((record) => ({
            color: 'blue',
            children: (
              <div>
                <div style={{ fontWeight: 'bold' }}>{formatDateTime(record.created_at)}</div>
                <div style={{ marginTop: 8 }}><strong>Total:</strong> Rp {formatNumber(record.total)}</div>
                <div style={{ marginTop: 4, display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  {record.bulanan.map((item) => <Tag key={item.bulan} color="blue">{BULAN_NAMES[item.bulan - 1]}: Rp {formatNumber(item.nilai)}</Tag>)}
                </div>
                <div style={{ fontSize: '12px', color: brand.textTertiary }}>Dibuat oleh: {record.creator?.nama || 'N/A'}</div>
                {record.uraian && <div style={{ marginTop: 6, padding: '6px 10px', background: brand.bgLayout, borderRadius: 4, fontSize: '12px' }}><strong>Catatan:</strong> {record.uraian}</div>}
              </div>
            ),
          }))} />
        )}
      </Modal>
    </div>
  );
};

export default AdminTargetEditPage;
