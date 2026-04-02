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
  Form,
  InputNumber,
  Input,
  Alert,
} from 'antd';
import { HistoryOutlined, EditOutlined } from '@ant-design/icons';
import axios from 'axios';
import API_BASE_URL from '../config/api';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { formatNumber, formatDateTime } from '../utils/formatters';
import { brand } from '../theme';

interface Target {
  id: number;
  user_id: string;
  id_sub_kegiatan: number;
  id_sumber_anggaran: number;
  id_satuan: number | null;
  target_k: number;
  target_rp: number;
  tahun: number;
  created_at: string;
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
  } | null;
  creator: {
    id: string;
    username: string;
    nama: string;
  };
}

interface HistoryRecord {
  id: number;
  target_k: number;
  target_rp: number;
  id_satuan: number | null;
  catatan?: string | null;
  created_at: string;
  creator: {
    id: string;
    username: string;
    nama: string;
  };
  satuan?: {
    id_satuan: number;
    satuannya: string;
  } | null;
}

interface SubKegiatan {
  value: number;
  label: string;
}

interface SumberAnggaran {
  value: number;
  label: string;
}

interface SatuanOption {
  value: number;
  label: string;
}

export const PuskesmasTargetKinerjaPage: React.FC = () => {
  const navigate = useNavigate();
  const { token } = useAuthStore();
  const [form] = Form.useForm();

  const [targets, setTargets] = useState<Target[]>([]);
  const [loading, setLoading] = useState(false);
  const [historyModalVisible, setHistoryModalVisible] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [selectedTarget, setSelectedTarget] = useState<Target | null>(null);
  const [historyData, setHistoryData] = useState<HistoryRecord[]>([]);
  const [saving, setSaving] = useState(false);

  // Reference data
  const [subKegiatanList, setSubKegiatanList] = useState<SubKegiatan[]>([]);
  const [sumberAnggaranList, setSumberAnggaranList] = useState<SumberAnggaran[]>([]);
  const [satuanList, setSatuanList] = useState<SatuanOption[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [editAllowed, setEditAllowed] = useState<boolean>(false);
  const [permissionInfo, setPermissionInfo] = useState<{ enabled?: boolean; start_at?: string | null; end_at?: string | null }>({});

  // Filters
  const [filters, setFilters] = useState({
    id_sub_kegiatan: undefined as number | undefined,
    id_sumber_anggaran: undefined as number | undefined,
    tahun: new Date().getFullYear(),
  });

  useEffect(() => {
    loadReferenceData();
  }, []);

  useEffect(() => {
    loadTargets();
    checkPermissionStatus();
  }, [filters]);

  const loadReferenceData = async () => {
    try {
      const headers = { Authorization: `Bearer ${token}` };

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

      // Load satuan list
      const satuanRes = await axios.get(`${API_BASE_URL}/reference/satuan`, { headers });
      const satuanData = Array.isArray(satuanRes.data) ? satuanRes.data : (satuanRes.data.data || []);
      // API returns {value, label} format
      setSatuanList(satuanData);
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

      if (filters.id_sub_kegiatan && filters.id_sub_kegiatan !== undefined) {
        params.id_sub_kegiatan = filters.id_sub_kegiatan;
      }
      if (filters.id_sumber_anggaran && filters.id_sumber_anggaran !== undefined) {
        params.id_sumber_anggaran = filters.id_sumber_anggaran;
      }
      if (filters.tahun && filters.tahun !== undefined) {
        params.tahun = filters.tahun;
      }

      // Use puskesmas endpoint (not admin)
      const response = await axios.get(`${API_BASE_URL}/target`, {
        headers: { Authorization: `Bearer ${token}` },
        params,
      });

      if (response.data.success) {
        // Fetch additional data for display (satuan, sumber anggaran names)
        const targetsWithRelations = await Promise.all(
          response.data.data.map(async (target: any) => {
            // Find satuan name
            const satuanInfo = satuanList.find(s => s.value === target.id_satuan);
            // Find sumber anggaran name
            const sumberInfo = sumberAnggaranList.find(s => s.value === target.id_sumber_anggaran);

            return {
              ...target,
              satuan: satuanInfo ? { id_satuan: satuanInfo.value, satuannya: satuanInfo.label } : null,
              sumberAnggaran: sumberInfo ? { id_sumber: sumberInfo.value, sumber: sumberInfo.label } : null,
            };
          })
        );
        setTargets(targetsWithRelations);
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
      setLoading(false);
    }
  };

  const checkPermissionStatus = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/puskesmas-config/edit-permission/status`, {
        headers: { Authorization: `Bearer ${token}` },
        params: { scope: 'target_kinerja', tahun: filters.tahun },
      });
      const data = response.data?.data;
      setEditAllowed(!!data?.allowed);
      setPermissionInfo({ enabled: data?.enabled, start_at: data?.start_at || null, end_at: data?.end_at || null });
    } catch (error) {
      console.error('Error checking permission status:', error);
      setEditAllowed(false);
    }
  };

  // Re-load targets when reference data changes
  useEffect(() => {
    if (satuanList.length > 0 && sumberAnggaranList.length > 0) {
      loadTargets();
    }
  }, [satuanList, sumberAnggaranList]);

  const handleViewHistory = async (target: Target) => {
    setSelectedTarget(target);
    setHistoryModalVisible(true);
    try {
      const response = await axios.get(`${API_BASE_URL}/target/history/${target.id_sub_kegiatan}`, {
        headers: { Authorization: `Bearer ${token}` },
        params: {
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

  const handleEdit = (target: Target) => {
    setSelectedTarget(target);
    form.setFieldsValue({
      target_k: target.target_k,
      id_satuan: target.id_satuan || undefined,
      catatan: '',
    });
    setEditModalVisible(true);
  };

  const handleSave = async () => {
    try {
      const values = await form.validateFields();

      if (!selectedTarget) return;

      setSaving(true);

      const response = await axios.put(
        `${API_BASE_URL}/target/${selectedTarget.id}/kinerja`,
        {
          target_k: values.target_k,
          id_satuan: values.id_satuan || null,
          catatan: values.catatan,
          tahun: selectedTarget.tahun,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (response.data.success) {
        message.success('Target kinerja berhasil diperbarui');
        setEditModalVisible(false);
        form.resetFields();
        loadTargets();
      }
    } catch (error: any) {
      console.error('Error saving target:', error);
      if (error.response?.status === 401) {
        message.error('Session expired. Please login again.');
        navigate('/login');
        return;
      }
      message.error(error.response?.data?.message || 'Gagal menyimpan target');
    } finally {
      setSaving(false);
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
      title: 'Sub Kegiatan',
      dataIndex: ['subKegiatan', 'kegiatan'],
      key: 'subKegiatan',
      width: 280,
      render: (text: string, record: Target) => (
        <div>
          <Tag color="blue">{record.subKegiatan?.kode_sub}</Tag>
          <div style={{ marginTop: 4 }}>{text}</div>
        </div>
      ),
    },
    {
      title: 'Sumber Anggaran',
      dataIndex: ['sumberAnggaran', 'sumber'],
      key: 'sumberAnggaran',
      width: 140,
      render: (_: string, record: Target) => record.sumberAnggaran?.sumber || <Tag color="red">Tidak ada data</Tag>,
    },
    {
      title: 'Tahun',
      dataIndex: 'tahun',
      key: 'tahun',
      width: 70,
    },
    {
      title: 'Target (K)',
      dataIndex: 'target_k',
      key: 'target_k',
      width: 100,
      align: 'right' as const,
      render: (value: number) => (
        <span style={{ color: value === 0 ? brand.warning : undefined }}>
          {formatNumber(value)}
        </span>
      ),
    },
    {
      title: 'Satuan',
      dataIndex: ['satuan', 'satuannya'],
      key: 'satuan',
      width: 120,
      render: (_: string, record: Target) => {
        if (record.satuan?.satuannya) {
          return record.satuan.satuannya;
        }
        return <Tag color="warning">Silahkan Pilih</Tag>;
      },
    },
    {
      title: 'Target Anggaran (Rp)',
      dataIndex: 'target_rp',
      key: 'target_rp',
      width: 160,
      align: 'right' as const,
      render: (value: number) => formatNumber(value),
    },
    {
      title: 'Aksi',
      key: 'action',
      width: 160,
      fixed: 'right' as const,
      render: (_: any, record: Target) => (
        <div style={{ display: 'flex', gap: 8 }}>
          <Button
            size="small"
            type="primary"
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
            disabled={!editAllowed}
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
        </div>
      ),
    },
  ];

  return (
    <div style={{ padding: '24px' }}>
      <Card title="Target Kinerja Saya" style={{ marginBottom: 24 }}>
        {!editAllowed && (
          <Alert
            type="info"
            showIcon
            style={{ marginBottom: 12 }}
            message="Pengeditan target kinerja belum dibuka oleh Admin"
            description={
              <div>
                {permissionInfo.enabled ? 'Ditutup oleh Admin.' : (
                  <div>
                    {permissionInfo.start_at ? (
                      <span>Jadwal mulai: {formatDateTime(permissionInfo.start_at)}</span>
                    ) : (
                      <span>Menunggu jadwal dibuka.</span>
                    )}
                    {permissionInfo.end_at && (
                      <div>Jadwal selesai: {formatDateTime(permissionInfo.end_at)}</div>
                    )}
                  </div>
                )}
              </div>
            }
          />
        )}
        <Row gutter={16} style={{ marginBottom: 16 }}>
          <Col span={8}>
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
          <Col span={8}>
            <Select
              placeholder="Pilih Sumber Anggaran"
              style={{ width: '100%' }}
              allowClear
              options={sumberAnggaranList}
              value={filters.id_sumber_anggaran}
              onChange={(value) => setFilters({ ...filters, id_sumber_anggaran: value })}
            />
          </Col>
          <Col span={8}>
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

        <p style={{ color: brand.textTertiary, fontSize: '12px', marginBottom: 16 }}>
          * Target dengan nilai 0 dan satuan "Silahkan Pilih" perlu diupdate<br />
          * Target Anggaran (Rp) diset oleh Admin dan tidak dapat diubah di sini
        </p>

        <Table
          columns={columns}
          dataSource={targets}
          rowKey="id"
          loading={loading}
          scroll={{ x: 1200, y: 500 }}
          sticky
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

      {/* Edit Modal */}
      <Modal
        title="Edit Target Kinerja"
        open={editModalVisible}
        onCancel={() => {
          setEditModalVisible(false);
          form.resetFields();
        }}
        onOk={handleSave}
        okText="Simpan"
        cancelText="Batal"
        confirmLoading={saving}
        width={500}
      >
        {selectedTarget && (
          <div style={{ marginBottom: 16, padding: 12, background: brand.bgLayout, borderRadius: 6 }}>
            <p style={{ margin: 0 }}>
              <strong>Sub Kegiatan:</strong> {selectedTarget.subKegiatan?.kode_sub || 'N/A'} -{' '}
              {selectedTarget.subKegiatan?.kegiatan || 'N/A'}
            </p>
            <p style={{ margin: '4px 0' }}>
              <strong>Sumber Anggaran:</strong> {selectedTarget.sumberAnggaran?.sumber || 'N/A'}
            </p>
            <p style={{ margin: '4px 0' }}>
              <strong>Tahun:</strong> {selectedTarget.tahun}
            </p>
            <p style={{ margin: 0 }}>
              <strong>Target Anggaran (Rp):</strong> {formatNumber(selectedTarget.target_rp)}
            </p>
          </div>
        )}

        <Form form={form} layout="vertical">
          <Form.Item
            name="target_k"
            label="Target Kinerja (K)"
            rules={[{ required: true, message: 'Target K harus diisi' }]}
          >
            <InputNumber
              style={{ width: '100%' }}
              min={0}
              placeholder="Masukkan target kinerja"
              formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, '.')}
              parser={(value) => value!.replace(/\./g, '') as any}
            />
          </Form.Item>

          <Form.Item
            name="id_satuan"
            label="Satuan"
            rules={[{ required: true, message: 'Satuan harus dipilih' }]}
          >
            <Select
              placeholder="Silahkan Pilih"
              allowClear
              showSearch
              filterOption={(input, option) =>
                (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
              }
              options={satuanList}
            />
          </Form.Item>

          <Form.Item
            name="catatan"
            label="Catatan Perubahan"
            rules={[{ required: true, message: 'Catatan perubahan harus diisi' }]}
          >
            <Input.TextArea
              rows={3}
              placeholder="Contoh: Penyesuaian target sesuai RAK / Update satuan"
            />
          </Form.Item>
        </Form>
      </Modal>

      {/* History Modal */}
      <Modal
        title="History Target Kinerja"
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
                  Target (K): <strong>{formatNumber(record.target_k)}</strong>
                </div>
                <div>
                  Satuan: <strong>{record.satuan?.satuannya || <i style={{ color: brand.textTertiary }}>Belum dipilih</i>}</strong>
                </div>
                <div style={{ color: brand.textTertiary, fontSize: '12px' }}>
                  Target Anggaran (Rp): {formatNumber(record.target_rp)}
                </div>
                <div style={{ marginTop: 4, fontSize: '12px', color: brand.textTertiary }}>
                  Dibuat oleh: {record.creator?.nama || record.creator?.username || 'N/A'}
                </div>
                {record.catatan && (
                  <div style={{ marginTop: 6, padding: '6px 10px', background: brand.bgLayout, borderRadius: 4, fontSize: '12px', color: brand.textSecondary }}>
                    <strong>Catatan:</strong> {record.catatan}
                  </div>
                )}
              </div>
            ),
          }))}
        />
      </Modal>
    </div>
  );
};

export default PuskesmasTargetKinerjaPage;
