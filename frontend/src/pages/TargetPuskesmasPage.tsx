import React, { useState, useEffect } from 'react';
import {
  Card,
  Button,
  Space,
  Typography,
  Row,
  Col,
  Select,
  Modal,
  message,
  Form,
  InputNumber,
  Divider,
  Tooltip,
  Tag,
  Timeline,
} from 'antd';
import {
  SaveOutlined,
  HistoryOutlined,
  InfoCircleOutlined,
} from '@ant-design/icons';
import axios from 'axios';
import { useAuthStore } from '../store/authStore';
import API_BASE_URL from '../config/api';

const { Title, Text } = Typography;

interface SubKegiatanOption {
  value: number;
  label: string;
  kegiatan: string;
  indikator_kinerja: string;
}

interface SumberAnggaranData {
  value: number;
  label: string;
}

interface TargetHistory {
  id: number;
  id_sumber_anggaran: number;
  target_k: number;
  target_rp: number;
  tahun: number;
  created_at: string;
  creator?: {
    username: string;
    nama: string;
  } | null;
}

export const TargetPuskesmasPage: React.FC = () => {
  const { token } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [form] = Form.useForm();
  
  // Data
  const [subKegiatanList, setSubKegiatanList] = useState<SubKegiatanOption[]>([]);
  const [selectedSubKegiatan, setSelectedSubKegiatan] = useState<number | null>(null);
  const [assignedSumberAnggaran, setAssignedSumberAnggaran] = useState<SumberAnggaranData[]>([]);
  
  // Periode
  const [selectedTahun, setSelectedTahun] = useState<number>(new Date().getFullYear());
  
  // UI State
  const [editMode, setEditMode] = useState(false);
  const [historyModalVisible, setHistoryModalVisible] = useState(false);
  const [historyData, setHistoryData] = useState<TargetHistory[]>([]);
  const [selectedHistoryItem, setSelectedHistoryItem] = useState<any>(null);

  const tahunOptions = Array.from({ length: 5 }, (_, i) => {
    const year = new Date().getFullYear() + 1 - i;
    return { value: year, label: year.toString() };
  });

  // Load assigned sub kegiatan
  useEffect(() => {
    loadAssignedSubKegiatan();
  }, [selectedTahun]);

  // Load sumber anggaran when sub kegiatan changes
  useEffect(() => {
    if (selectedSubKegiatan) {
      loadSumberAnggaranForSubKegiatan(selectedSubKegiatan);
      loadTargetData();
    }
  }, [selectedSubKegiatan, selectedTahun]);

  const loadAssignedSubKegiatan = async () => {
    try {
      const response = await axios.get(
        `${API_BASE_URL}/target/assigned?tahun=${selectedTahun}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      // Response format: { data: [{ subKegiatan, targets }] }
      const subKegiatan = response.data.data
        .filter((item: any) => item.targets && item.targets.length > 0)
        .map((item: any) => ({
          value: item.subKegiatan.id_sub_kegiatan,
          label: item.subKegiatan.kegiatan,
          kegiatan: item.subKegiatan.kegiatan,
          indikator_kinerja: item.subKegiatan.indikator_kinerja,
        }));

      setSubKegiatanList(subKegiatan);
      if (subKegiatan.length > 0) {
        setSelectedSubKegiatan(subKegiatan[0].value);
      } else {
        message.warning('Belum ada sub kegiatan dengan target yang diset untuk tahun ini');
      }
    } catch (error: any) {
      console.error('Error loading sub kegiatan:', error);
      message.error('Gagal memuat sub kegiatan');
    }
  };

  const loadSumberAnggaranForSubKegiatan = async (idSubKegiatan: number) => {
    try {
      const response = await axios.get(
        `${API_BASE_URL}/sub-kegiatan-sumber-anggaran/by-sub-kegiatan/${idSubKegiatan}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      const sumberAnggaran = response.data.data.map((item: any) => ({
        value: item.sumberAnggaran.id_sumber,
        label: item.sumberAnggaran.sumber,
      }));

      setAssignedSumberAnggaran(sumberAnggaran);
    } catch (error: any) {
      console.error('Error loading sumber anggaran:', error);
      setAssignedSumberAnggaran([]);
    }
  };

  const loadTargetData = async () => {
    if (!selectedSubKegiatan) return;

    setLoading(true);
    try {
      const response = await axios.get(`${API_BASE_URL}/target`, {
        headers: { Authorization: `Bearer ${token}` },
        params: {
          id_sub_kegiatan: selectedSubKegiatan,
          tahun: selectedTahun,
        },
      });

      const targets = response.data.data || [];
      const formData: any = {};

      targets.forEach((target: any) => {
        formData[`target_k_${target.id_sumber_anggaran}`] = target.target_k;
        formData[`target_rp_${target.id_sumber_anggaran}`] = target.target_rp;
      });

      form.setFieldsValue(formData);
    } catch (error: any) {
      console.error('Error loading targets:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = () => {
    setEditMode(true);
  };

  const handleCancel = () => {
    setEditMode(false);
    loadTargetData();
  };

  const handleSave = async () => {
    try {
      await form.validateFields();
      const values = form.getFieldsValue();

      if (!selectedSubKegiatan) {
        message.error('Pilih sub kegiatan terlebih dahulu');
        return;
      }

      // Transform data untuk bulk create
      const targets = assignedSumberAnggaran.map((sa) => ({
        id_sub_kegiatan: selectedSubKegiatan,
        id_sumber_anggaran: sa.value,
        target_k: values[`target_k_${sa.value}`] || 0,
        target_rp: values[`target_rp_${sa.value}`] || 0,
      }));

      setLoading(true);
      await axios.post(
        `${API_BASE_URL}/target/bulk`,
        {
          targets,
          tahun: selectedTahun,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      message.success('Target berhasil disimpan');
      setEditMode(false);
      loadTargetData();
    } catch (error: any) {
      console.error('Error saving targets:', error);
      message.error(error.response?.data?.message || 'Gagal menyimpan target');
    } finally {
      setLoading(false);
    }
  };

  const handleViewHistory = async (idSumberAnggaran: number, labelSumberAnggaran: string) => {
    if (!selectedSubKegiatan) return;

    try {
      setSelectedHistoryItem({
        subKegiatan: subKegiatanList.find(s => s.value === selectedSubKegiatan)?.kegiatan,
        sumberAnggaran: labelSumberAnggaran,
      });
      setLoading(true);
      const response = await axios.get(
        `${API_BASE_URL}/target/history/${selectedSubKegiatan}`,
        {
          headers: { Authorization: `Bearer ${token}` },
          params: {
            tahun: selectedTahun,
            id_sumber_anggaran: idSumberAnggaran,
          },
        }
      );

      setHistoryData(response.data.data || []);
      setHistoryModalVisible(true);
    } catch (error: any) {
      console.error('Error loading history:', error);
      message.error('Gagal memuat history');
    } finally {
      setLoading(false);
    }
  };

  const formatRupiah = (value: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(value);
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('id-ID', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const currentSubKegiatan = subKegiatanList.find(s => s.value === selectedSubKegiatan);

  return (
    <div>
      <Row justify="space-between" align="middle" style={{ marginBottom: 24 }}>
        <Col>
          <Title level={2}>Target Sub Kegiatan</Title>
          <Text type="secondary">
            Kelola target kuantitas dan rupiah untuk setiap sub kegiatan per sumber anggaran
          </Text>
        </Col>
      </Row>

      <Card style={{ marginBottom: 24 }}>
        <Space size="large" wrap>
          <div>
            <Text strong>Sub Kegiatan</Text>
            <br />
            <Select
              style={{ width: 300 }}
              value={selectedSubKegiatan}
              onChange={setSelectedSubKegiatan}
              options={subKegiatanList}
              placeholder="Pilih sub kegiatan"
              showSearch
              optionFilterProp="children"
              filterOption={(input, option) =>
                (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
              }
            />
          </div>

          <div>
            <Text strong>Periode</Text>
            <br />
            <Select
              style={{ width: 100 }}
              value={selectedTahun}
              onChange={setSelectedTahun}
              options={tahunOptions}
              placeholder="Tahun"
            />
          </div>

          <Divider type="vertical" style={{ height: 50 }} />

          <div>
            <Text strong>Aksi</Text>
            <br />
            {!editMode ? (
              <Button
                type="primary"
                icon={<SaveOutlined />}
                onClick={handleEdit}
                disabled={!selectedSubKegiatan || assignedSumberAnggaran.length === 0}
              >
                Edit Target
              </Button>
            ) : (
              <Space>
                <Button onClick={handleCancel}>
                  Batal
                </Button>
                <Button
                  type="primary"
                  icon={<SaveOutlined />}
                  onClick={handleSave}
                  loading={loading}
                >
                  Simpan
                </Button>
              </Space>
            )}
          </div>
        </Space>
      </Card>

      {!selectedSubKegiatan ? (
        <Card>
          <div style={{ textAlign: 'center', padding: '40px 0' }}>
            <InfoCircleOutlined style={{ fontSize: 48, color: '#d9d9d9' }} />
            <Title level={4} type="secondary">Pilih sub kegiatan</Title>
            <Text type="secondary">
              Pilih sub kegiatan di atas untuk melihat target yang tersedia
            </Text>
          </div>
        </Card>
      ) : assignedSumberAnggaran.length === 0 ? (
        <Card>
          <div style={{ textAlign: 'center', padding: '40px 0' }}>
            <InfoCircleOutlined style={{ fontSize: 48, color: '#d9d9d9' }} />
            <Title level={4} type="secondary">Tidak ada sumber anggaran</Title>
            <Text type="secondary">
              Sub kegiatan ini belum memiliki sumber anggaran yang di-assign.
              <br />
              Silakan hubungi admin untuk mengatur sumber anggaran.
            </Text>
          </div>
        </Card>
      ) : (
        <div>
          {currentSubKegiatan && (
            <Card title={`${currentSubKegiatan.kegiatan}`} style={{ marginBottom: 16 }}>
              <Text type="secondary">{currentSubKegiatan.indikator_kinerja}</Text>
            </Card>
          )}

          <Form form={form} layout="vertical">
            {assignedSumberAnggaran.map((sa) => (
              <Card
                key={sa.value}
                type="inner"
                title={sa.label}
                style={{ marginBottom: 16 }}
                extra={
                  !editMode && (
                    <Tooltip title="Lihat History">
                      <Button
                        type="text"
                        icon={<HistoryOutlined />}
                        onClick={() => handleViewHistory(sa.value, sa.label)}
                      />
                    </Tooltip>
                  )
                }
              >
                <Row gutter={16}>
                  <Col span={12}>
                    <Form.Item
                      label="Target Kinerja (K)"
                      name={`target_k_${sa.value}`}
                      rules={[
                        { required: true, message: 'Wajib diisi' },
                        { type: 'number', min: 0, message: 'Minimal 0' },
                      ]}
                    >
                      <InputNumber
                        style={{ width: '100%' }}
                        placeholder="0"
                        min={0}
                        disabled={!editMode}
                      />
                    </Form.Item>
                  </Col>
                  <Col span={12}>
                    <Form.Item
                      label="Target Anggaran (Rp)"
                      name={`target_rp_${sa.value}`}
                      rules={[
                        { required: true, message: 'Wajib diisi' },
                        { type: 'number', min: 0, message: 'Minimal 0' },
                      ]}
                    >
                      <InputNumber
                        style={{ width: '100%' }}
                        placeholder="0"
                        min={0}
                        disabled={!editMode}
                        formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, '.')}
                        parser={(value) => Number(value!.replace(/\./g, '')) as any}
                      />
                    </Form.Item>
                  </Col>
                </Row>
              </Card>
            ))}
          </Form>
        </div>
      )}

      {/* History Modal */}
      <Modal
        title={
          <Space>
            <HistoryOutlined />
            <span>
              History Target - {selectedHistoryItem?.subKegiatan} ({selectedHistoryItem?.sumberAnggaran})
            </span>
          </Space>
        }
        open={historyModalVisible}
        onCancel={() => setHistoryModalVisible(false)}
        footer={[
          <Button key="close" onClick={() => setHistoryModalVisible(false)}>
            Tutup
          </Button>,
        ]}
        width={700}
      >
        {historyData.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '20px 0' }}>
            <Text type="secondary">Belum ada history untuk periode ini</Text>
          </div>
        ) : (
          <Timeline
            items={historyData.map((item) => ({
              children: (
                <div>
                  <Space direction="vertical" size={0}>
                    <Text strong>{formatDateTime(item.created_at)}</Text>
                    <Text type="secondary">oleh {item.creator?.username || 'Unknown User'}</Text>
                    <Space style={{ marginTop: 8 }}>
                      <Tag color="blue">Target (K): {item.target_k.toLocaleString('id-ID')}</Tag>
                      <Tag color="green">Target (Rp): {formatRupiah(item.target_rp)}</Tag>
                    </Space>
                    {item.target_k === 0 && item.target_rp === 0 && (
                      <Text type="danger" style={{ fontSize: '12px' }}>Target dihapus</Text>
                    )}
                  </Space>
                </div>
              ),
            }))}
          />
        )}
      </Modal>
    </div>
  );
};

export default TargetPuskesmasPage;
