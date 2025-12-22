import React, { useState, useEffect } from 'react';
import {
  Card,
  Table,
  Button,
  Modal,
  Form,
  InputNumber,
  Select,
  message,
  Space,
  Tag,
  Timeline,
  Row,
  Col,
} from 'antd';
import { EditOutlined, HistoryOutlined, PlusOutlined } from '@ant-design/icons';
import axios from 'axios';
import API_BASE_URL from '../config/api';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';

interface Target {
  id: number;
  user_id: number;
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
    id: number;
    nama: string;
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
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [historyModalVisible, setHistoryModalVisible] = useState(false);
  const [selectedTarget, setSelectedTarget] = useState<Target | null>(null);
  const [historyData, setHistoryData] = useState<HistoryRecord[]>([]);
  const [form] = Form.useForm();

  // Reference data
  const [puskesmasList, setPuskesmasList] = useState<Puskesmas[]>([]);
  const [subKegiatanList, setSubKegiatanList] = useState<SubKegiatan[]>([]);
  const [sumberAnggaranList, setSumberAnggaranList] = useState<SumberAnggaran[]>([]);
  const [satuanList, setSatuanList] = useState<Array<{ value: number; label: string }>>([]);
  const [modalSubKegiatanList, setModalSubKegiatanList] = useState<SubKegiatan[]>([]);

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
      setPuskesmasList(
        (Array.isArray(puskesmasRes.data) ? puskesmasRes.data : puskesmasRes.data.data || [])
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
      // API already returns formatted array with value/label
      setSumberAnggaranList(Array.isArray(sumberAnggaranRes.data) ? sumberAnggaranRes.data : []);

      // Load satuan
      const satuanRes = await axios.get(`${API_BASE_URL}/reference/satuan`, { headers });
      setSatuanList(Array.isArray(satuanRes.data) ? satuanRes.data : []);
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
      if (filters.user_id) params.user_id = filters.user_id;
      if (filters.id_sub_kegiatan) params.id_sub_kegiatan = filters.id_sub_kegiatan;
      if (filters.id_sumber_anggaran) params.id_sumber_anggaran = filters.id_sumber_anggaran;
      if (filters.tahun) params.tahun = filters.tahun;

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

  const handleEdit = (target: Target) => {
    setSelectedTarget(target);
    form.setFieldsValue({
      user_id: target.user_id,
      id_sub_kegiatan: target.id_sub_kegiatan,
      id_sumber_anggaran: target.id_sumber_anggaran,
      target_k: target.target_k,
      target_rp: target.target_rp,
      tahun: target.tahun,
    });
    setEditModalVisible(true);
  };

  const handleSave = async () => {
    try {
      const values = await form.validateFields();

      await axios.post(`${API_BASE_URL}/target/admin`, values, {
        headers: { Authorization: `Bearer ${token}` },
      });

      message.success('Target berhasil disimpan');
      setEditModalVisible(false);
      loadTargets();
    } catch (error: any) {
      console.error('Error saving target:', error);
      if (error.response?.status === 401) {
        message.error('Session expired. Please login again.');
        navigate('/login');
        return;
      }
      message.error(error.response?.data?.message || 'Gagal menyimpan target');
    }
  };

  const handlePuskesmasChange = async (userId: string) => {
    // Reset dependent fields
    form.setFieldsValue({
      id_sub_kegiatan: undefined,
      id_sumber_anggaran: undefined,
    });
    
    // Fetch assigned sub kegiatan for this puskesmas
    try {
      const response = await axios.get(
        `${API_BASE_URL}/puskesmas-config/puskesmas/${userId}/sub-kegiatan`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      if (response.data.assignments) {
        const assigned = response.data.assignments.map((a: any) => ({
          value: a.subKegiatan.id_sub_kegiatan,
          label: `${a.subKegiatan.kode_sub} - ${a.subKegiatan.kegiatan}`,
        }));
        setModalSubKegiatanList(assigned);
      }
    } catch (error) {
      console.error('Error fetching assigned sub kegiatan:', error);
      message.error('Gagal memuat sub kegiatan yang di-assign');
      setModalSubKegiatanList([]);
    }
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
      render: (text: string, record: Target) => record.sumberAnggaran?.sumber || <Tag color="red">Tidak ada data</Tag>,
    },
    {
      title: 'Tahun',
      dataIndex: 'tahun',
      key: 'tahun',
      width: 80,
    },
    {
      title: 'Target K',
      dataIndex: 'target_k',
      key: 'target_k',
      width: 100,
      align: 'right' as const,
      render: (value: number) => value?.toLocaleString('id-ID'),
    },
    {
      title: 'Satuan',
      dataIndex: ['satuan', 'satuannya'],
      key: 'satuan',
      width: 100,
      render: (text: string, record: Target) => record.satuan?.satuannya || '-',
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
      width: 120,
      fixed: 'right' as const,
      render: (_: any, record: Target) => (
        <Space>
          <Button
            type="primary"
            size="small"
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
          >
            Edit
          </Button>
          <Button
            size="small"
            icon={<HistoryOutlined />}
            onClick={() => handleViewHistory(record)}
          >
            History
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <div style={{ padding: '24px' }}>
      <Card title="Manajemen Target Tahunan" style={{ marginBottom: 24 }}>
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
            icon={<PlusOutlined />}
            onClick={() => {
              form.resetFields();
              setSelectedTarget(null);
              setEditModalVisible(true);
            }}
          >
            Tambah Target Baru
          </Button>
        </div>

        <Table
          columns={columns}
          dataSource={targets}
          rowKey="id"
          loading={loading}
          scroll={{ x: 1500 }}
          pagination={{ pageSize: 10 }}
        />
      </Card>

      {/* Edit Modal */}
      <Modal
        title={selectedTarget ? "Edit Target" : "Tambah Target Baru"}
        open={editModalVisible}
        onOk={handleSave}
        onCancel={() => setEditModalVisible(false)}
        width={600}
      >
        <Form form={form} layout="vertical" style={{ marginTop: 20 }}>
          <Form.Item name="user_id" label="Puskesmas" rules={[{ required: true }]}>
            <Select
              placeholder="Pilih Puskesmas"
              disabled={!!selectedTarget}
              showSearch
              filterOption={(input, option) =>
                (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
              }
              options={puskesmasList}
              onChange={(value) => {
                if (!selectedTarget) {
                  fetchAssignedSubKegiatan(value);
                  form.setFieldValue('id_sub_kegiatan', undefined);
                }
              }}
            />
          </Form.Item>

          <Form.Item name="id_sub_kegiatan" label="Sub Kegiatan" rules={[{ required: true }]}>
            <Select
              placeholder="Pilih Sub Kegiatan"
              showSearch
              filterOption={(input, option) =>
                (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
              }
              options={selectedTarget ? modalSubKegiatanList : subKegiatanList}
            />
          </Form.Item>

          <Form.Item
            name="id_sumber_anggaran"
            label="Sumber Anggaran"
            rules={[{ required: true }]}
          >
            <Select placeholder="Pilih Sumber Anggaran" options={sumberAnggaranList} />
          </Form.Item>

          <Form.Item name="tahun" label="Tahun" rules={[{ required: true }]}>
            <Select
              placeholder="Pilih Tahun"
              options={[
                { value: 2024, label: '2024' },
                { value: 2025, label: '2025' },
                { value: 2026, label: '2026' },
              ]}
            />
          </Form.Item>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="target_k"
                label="Target Kinerja (K)"
                rules={[{ required: true, message: 'Isi target kinerja!' }]}
              >
                <InputNumber style={{ width: '100%' }} min={0} placeholder="0" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="id_satuan" label="Satuan">
                <Select
                  placeholder="Pilih Satuan"
                  allowClear
                  showSearch
                  filterOption={(input, option) =>
                    (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
                  }
                  options={satuanList}
                />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            name="target_rp"
            label="Target Anggaran (Rp)"
            rules={[{ required: true, message: 'Isi target anggaran!' }]}
          >
            <InputNumber style={{ width: '100%' }} min={0} placeholder="0" />
          </Form.Item>
        </Form>
      </Modal>

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
                  {new Date(record.created_at).toLocaleString('id-ID')}
                </div>
                <div style={{ marginTop: 8 }}>
                  Target K: <strong>{record.target_k.toLocaleString('id-ID')}</strong>
                </div>
                <div>
                  Target Rp: <strong>Rp {record.target_rp.toLocaleString('id-ID')}</strong>
                </div>
                <div style={{ marginTop: 4, fontSize: '12px', color: '#888' }}>
                  Dibuat oleh: {record.creator?.nama || record.creator?.username || 'N/A'}
                </div>
              </div>
            ),
          }))}
        />
      </Modal>
    </div>
  );
};

export default AdminTargetPage;
