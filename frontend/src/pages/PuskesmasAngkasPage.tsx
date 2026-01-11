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
  Tooltip,
} from 'antd';
import { HistoryOutlined, EditOutlined, LockOutlined } from '@ant-design/icons';
import axios from 'axios';
import API_BASE_URL from '../config/api';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { formatNumber, formatDateTime } from '../utils/formatters';

interface AngkasData {
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
  bulanan: number[];
  total: number;
  hasAngkas: boolean;
  isManualAngkas: boolean;
}

interface HistoryRecord {
  created_at: string;
  creator: {
    id: string;
    nama: string;
    username: string;
  } | null;
  uraian: string;
  bulanan: Array<{ bulan: number; nilai: number }>;
  total: number;
}

interface SubKegiatan {
  value: number;
  label: string;
}

interface SumberAnggaran {
  value: number;
  label: string;
}

const BULAN_NAMES = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
];

export const PuskesmasAngkasPage: React.FC = () => {
  const navigate = useNavigate();
  const { token } = useAuthStore();
  const [form] = Form.useForm();

  const [angkasData, setAngkasData] = useState<AngkasData[]>([]);
  const [loading, setLoading] = useState(false);
  const [historyModalVisible, setHistoryModalVisible] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<AngkasData | null>(null);
  const [historyData, setHistoryData] = useState<HistoryRecord[]>([]);
  const [saving, setSaving] = useState(false);
  const [formTotal, setFormTotal] = useState(0);

  // Reference data
  const [subKegiatanList, setSubKegiatanList] = useState<SubKegiatan[]>([]);
  const [sumberAnggaranList, setSumberAnggaranList] = useState<SumberAnggaran[]>([]);
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
    loadAngkasData();
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

  const loadAngkasData = async () => {
    setLoading(true);
    try {
      const params: any = { tahun: filters.tahun };
      
      if (filters.id_sub_kegiatan) {
        params.id_sub_kegiatan = filters.id_sub_kegiatan;
      }
      if (filters.id_sumber_anggaran) {
        params.id_sumber_anggaran = filters.id_sumber_anggaran;
      }

      const response = await axios.get(`${API_BASE_URL}/angkas`, {
        headers: { Authorization: `Bearer ${token}` },
        params,
      });

      if (response.data?.data) {
        setAngkasData(response.data.data);
      }
    } catch (error: any) {
      console.error('Error loading angkas data:', error);
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

  const checkPermissionStatus = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/puskesmas-config/edit-permission/status`, {
        headers: { Authorization: `Bearer ${token}` },
        params: { scope: 'angkas', tahun: filters.tahun },
      });
      const data = response.data?.data;
      setEditAllowed(!!data?.allowed);
      setPermissionInfo({ enabled: data?.enabled, start_at: data?.start_at || null, end_at: data?.end_at || null });
    } catch (error) {
      console.error('Error checking permission status:', error);
      setEditAllowed(false);
    }
  };

  const handleViewHistory = async (record: AngkasData) => {
    setSelectedRecord(record);
    setHistoryModalVisible(true);
    try {
      const response = await axios.get(`${API_BASE_URL}/angkas/manual/history`, {
        headers: { Authorization: `Bearer ${token}` },
        params: {
          id_sub_kegiatan: record.id_sub_kegiatan,
          id_sumber_anggaran: record.id_sumber_anggaran,
          tahun: record.tahun,
        },
      });

      if (response.data.success) {
        setHistoryData(response.data.data.history || []);
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

  const handleEdit = (record: AngkasData) => {
    setSelectedRecord(record);
    // Set form values with current monthly values
    const formValues: any = { catatan: '' };
    let total = 0;
    BULAN_NAMES.forEach((_, index) => {
      const val = record.bulanan[index] || 0;
      formValues[`bulan_${index + 1}`] = val;
      total += val;
    });
    form.setFieldsValue(formValues);
    setFormTotal(total);
    setEditModalVisible(true);
  };

  const calculateTotal = () => {
    const values = form.getFieldsValue();
    let total = 0;
    for (let i = 1; i <= 12; i++) {
      total += Number(values[`bulan_${i}`]) || 0;
    }
    setFormTotal(total);
  };

  const getSelisih = () => {
    if (!selectedRecord) return 0;
    return formTotal - selectedRecord.target_rp;
  };

  const isValidTotal = () => {
    if (!selectedRecord) return false;
    return formTotal === selectedRecord.target_rp;
  };

  const handleSave = async () => {
    try {
      const values = await form.validateFields();
      
      if (!selectedRecord) return;

      setSaving(true);

      // Build bulanan array from form values
      const bulanan: number[] = [];
      for (let i = 1; i <= 12; i++) {
        bulanan.push(Number(values[`bulan_${i}`]) || 0);
      }

      const response = await axios.put(
        `${API_BASE_URL}/angkas/manual`,
        {
          id_sub_kegiatan: selectedRecord.id_sub_kegiatan,
          id_sumber_anggaran: selectedRecord.id_sumber_anggaran,
          tahun: selectedRecord.tahun,
          bulanan,
          catatan: values.catatan,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (response.data.success) {
        message.success(response.data.message || 'Angkas berhasil disimpan');
        setEditModalVisible(false);
        form.resetFields();
        loadAngkasData();
      }
    } catch (error: any) {
      console.error('Error saving angkas:', error);
      if (error.response?.status === 401) {
        message.error('Session expired. Please login again.');
        navigate('/login');
        return;
      }
      message.error(error.response?.data?.message || 'Gagal menyimpan angkas');
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
      render: (text: string, record: AngkasData) => (
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
      render: (_: string, record: AngkasData) => record.sumberAnggaran?.sumber || <Tag color="red">Tidak ada data</Tag>,
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
      title: 'Total Angkas',
      dataIndex: 'total',
      key: 'total',
      width: 140,
      align: 'right' as const,
      render: (value: number, record: AngkasData) => (
        <span style={{ color: value === 0 ? '#faad14' : undefined }}>
          {formatNumber(value)}
          {record.hasAngkas && <Tag color="green" style={{ marginLeft: 4 }}>✓</Tag>}
        </span>
      ),
    },
    {
      title: 'Status',
      key: 'status',
      width: 120,
      render: (_: any, record: AngkasData) => (
        record.isManualAngkas ? (
          <Tag color="orange">Manual Input</Tag>
        ) : (
          <Tooltip title="Data dari PDF upload, tidak dapat diedit">
            <Tag color="default" icon={<LockOutlined />}>Dari PDF</Tag>
          </Tooltip>
        )
      ),
    },
    {
      title: 'Aksi',
      key: 'action',
      width: 160,
      fixed: 'right' as const,
      render: (_: any, record: AngkasData) => (
        <div style={{ display: 'flex', gap: 8 }}>
          <Tooltip title={!record.isManualAngkas ? 'Data dari PDF tidak dapat diedit' : (!editAllowed ? 'Pengeditan belum dibuka' : '')}>
            <Button
              size="small"
              type="primary"
              icon={<EditOutlined />}
              onClick={() => handleEdit(record)}
              disabled={!record.isManualAngkas || !editAllowed}
            >
              Edit
            </Button>
          </Tooltip>
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
      <Card title="Angkas (Anggaran Kas) Saya" style={{ marginBottom: 24 }}>
        {!editAllowed && (
          <Alert
            type="info"
            showIcon
            style={{ marginBottom: 12 }}
            message="Pengeditan angkas manual belum dibuka oleh Admin"
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

        <p style={{ color: '#888', fontSize: '12px', marginBottom: 16 }}>
          * <Tag color="orange">Manual Input</Tag> = Sub kegiatan dengan lebih dari 1 sumber anggaran, dapat diedit manual<br />
          * <Tag color="default"><LockOutlined /> Dari PDF</Tag> = Data dari upload PDF, tidak dapat diedit di halaman ini
        </p>

        <Table
          columns={columns}
          dataSource={angkasData}
          rowKey={(record) => `${record.id_sub_kegiatan}-${record.id_sumber_anggaran}`}
          loading={loading}
          scroll={{ x: 1200, y: 500 }}
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
        title="Edit Angkas Manual"
        open={editModalVisible}
        onCancel={() => {
          setEditModalVisible(false);
          form.resetFields();
          setFormTotal(0);
        }}
        onOk={handleSave}
        okText="Simpan"
        cancelText="Batal"
        confirmLoading={saving}
        okButtonProps={{ disabled: !isValidTotal() }}
        width={700}
      >
        {selectedRecord && (
          <div style={{ marginBottom: 16, padding: 12, background: '#f5f5f5', borderRadius: 6 }}>
            <p style={{ margin: 0 }}>
              <strong>Sub Kegiatan:</strong> {selectedRecord.subKegiatan?.kode_sub || 'N/A'} -{' '}
              {selectedRecord.subKegiatan?.kegiatan || 'N/A'}
            </p>
            <p style={{ margin: '4px 0' }}>
              <strong>Sumber Anggaran:</strong> {selectedRecord.sumberAnggaran?.sumber || 'N/A'}
            </p>
            <p style={{ margin: '4px 0' }}>
              <strong>Tahun:</strong> {selectedRecord.tahun}
            </p>
            <p style={{ margin: 0 }}>
              <strong>Target Anggaran (Rp):</strong> {formatNumber(selectedRecord.target_rp)}
            </p>
          </div>
        )}

        {selectedRecord && (
          <div style={{ 
            marginBottom: 16, 
            padding: 12, 
            background: isValidTotal() ? '#f6ffed' : '#fff2e8', 
            border: `1px solid ${isValidTotal() ? '#b7eb8f' : '#ffbb96'}`,
            borderRadius: 6 
          }}>
            <Row gutter={16}>
              <Col span={8}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ color: '#888', fontSize: 12 }}>Total Angkas</div>
                  <div style={{ fontSize: 16, fontWeight: 'bold' }}>{formatNumber(formTotal)}</div>
                </div>
              </Col>
              <Col span={8}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ color: '#888', fontSize: 12 }}>Target Anggaran</div>
                  <div style={{ fontSize: 16, fontWeight: 'bold' }}>{formatNumber(selectedRecord.target_rp)}</div>
                </div>
              </Col>
              <Col span={8}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ color: '#888', fontSize: 12 }}>Selisih</div>
                  <div style={{ 
                    fontSize: 16, 
                    fontWeight: 'bold', 
                    color: getSelisih() === 0 ? '#52c41a' : '#fa541c' 
                  }}>
                    {getSelisih() > 0 ? '+' : ''}{formatNumber(getSelisih())}
                  </div>
                </div>
              </Col>
            </Row>
            {!isValidTotal() && (
              <Alert 
                type="warning" 
                message="Total angkas harus sama dengan target anggaran untuk dapat menyimpan" 
                style={{ marginTop: 12 }}
                showIcon
              />
            )}
          </div>
        )}

        <Form form={form} layout="vertical">
          <Row gutter={16}>
            {BULAN_NAMES.map((bulan, index) => (
              <Col span={8} key={bulan}>
                <Form.Item
                  name={`bulan_${index + 1}`}
                  label={bulan}
                >
                  <InputNumber
                    style={{ width: '100%' }}
                    min={0}
                    placeholder="0"
                    formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, '.')}
                    parser={(value) => value!.replace(/\./g, '') as any}
                    addonAfter="Rp"
                    onChange={calculateTotal}
                  />
                </Form.Item>
              </Col>
            ))}
          </Row>

          <Form.Item
            name="catatan"
            label="Catatan Perubahan"
            rules={[{ required: true, message: 'Catatan perubahan harus diisi' }]}
          >
            <Input.TextArea
              rows={3}
              placeholder="Contoh: Penyesuaian angkas berdasarkan RAK terbaru"
            />
          </Form.Item>
        </Form>
      </Modal>

      {/* History Modal */}
      <Modal
        title="History Angkas"
        open={historyModalVisible}
        onCancel={() => setHistoryModalVisible(false)}
        footer={[
          <Button key="close" onClick={() => setHistoryModalVisible(false)}>
            Tutup
          </Button>,
        ]}
        width={800}
      >
        {selectedRecord && (
          <div style={{ marginBottom: 16 }}>
            <p>
              <strong>Sub Kegiatan:</strong> {selectedRecord.subKegiatan?.kode_sub || 'N/A'} -{' '}
              {selectedRecord.subKegiatan?.kegiatan || 'N/A'}
            </p>
            <p>
              <strong>Sumber Anggaran:</strong> {selectedRecord.sumberAnggaran?.sumber || 'N/A'}
            </p>
            <p>
              <strong>Tahun:</strong> {selectedRecord.tahun}
            </p>
          </div>
        )}

        {historyData.length === 0 ? (
          <Alert type="info" message="Belum ada history perubahan untuk kombinasi ini" />
        ) : (
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
                    <strong>Total:</strong> Rp {formatNumber(record.total)}
                  </div>
                  <div style={{ marginTop: 4, display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                    {record.bulanan.map((item) => (
                      <Tag key={item.bulan} color="blue">
                        {BULAN_NAMES[item.bulan - 1]}: Rp {formatNumber(item.nilai)}
                      </Tag>
                    ))}
                  </div>
                  <div style={{ marginTop: 4, fontSize: '12px', color: '#888' }}>
                    Dibuat oleh: {record.creator?.nama || record.creator?.username || 'N/A'}
                  </div>
                  {record.uraian && (
                    <div style={{ marginTop: 6, padding: '6px 10px', background: '#f5f5f5', borderRadius: 4, fontSize: '12px', color: '#595959' }}>
                      <strong>Catatan:</strong> {record.uraian}
                    </div>
                  )}
                </div>
              ),
            }))}
          />
        )}
      </Modal>
    </div>
  );
};

export default PuskesmasAngkasPage;
