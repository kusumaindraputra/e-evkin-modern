import React, { useState, useEffect } from 'react';
import {
  Card,
  Tabs,
  Table,
  Button,
  Modal,
  Form,
  Input,
  InputNumber,
  Select,
  message,
  Popconfirm,
  Space,
  Typography,
  Tag,
} from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, SettingOutlined } from '@ant-design/icons';
import axios from 'axios';
import { useAuthStore } from '../store/authStore';
import { SubKegiatanSumberAnggaranModal } from '../components/SubKegiatanSumberAnggaranModal';

const { Title } = Typography;
const { TextArea } = Input;

interface Kegiatan {
  id_kegiatan: number;
  id_uraian: number;
  kode: string;
  kegiatan: string;
  subKegiatan?: SubKegiatan[];
}

interface SubKegiatan {
  id_sub_kegiatan: number;
  id_kegiatan: number;
  kode_sub: string;
  kegiatan: string;
  indikator_kinerja: string;
  kegiatanParent?: Kegiatan;
}

export const AdminKegiatanPage: React.FC = () => {
  const { token } = useAuthStore();
  const [kegiatanList, setKegiatanList] = useState<Kegiatan[]>([]);
  const [subKegiatanList, setSubKegiatanList] = useState<SubKegiatan[]>([]);
  const [loadingKegiatan, setLoadingKegiatan] = useState(false);
  const [loadingSub, setLoadingSub] = useState(false);

  // Kegiatan modal
  const [kegiatanModalVisible, setKegiatanModalVisible] = useState(false);
  const [editingKegiatan, setEditingKegiatan] = useState<Kegiatan | null>(null);
  const [kegiatanForm] = Form.useForm();

  // Sub Kegiatan modal
  const [subModalVisible, setSubModalVisible] = useState(false);
  const [editingSub, setEditingSub] = useState<SubKegiatan | null>(null);
  const [subForm] = Form.useForm();

  // Sumber Anggaran modal
  const [sumberAnggaranModalVisible, setsumberAnggaranModalVisible] = useState(false);
  const [selectedSubKegiatan, setSelectedSubKegiatan] = useState<{
    id: number;
    name: string;
  } | null>(null);

  useEffect(() => {
    loadKegiatan();
    loadSubKegiatan();
  }, []);

  const loadKegiatan = async () => {
    if (!token) {
      message.error('Token tidak ditemukan. Silakan login kembali.');
      return;
    }

    setLoadingKegiatan(true);
    try {
      const response = await axios.get('http://localhost:5000/api/kegiatan/kegiatan', {
        headers: { Authorization: `Bearer ${token}` },
      });
      setKegiatanList(response.data);
    } catch (error: any) {
      console.error('Error loading kegiatan:', error);
      message.error(error.response?.data?.message || 'Gagal memuat data kegiatan');
    } finally {
      setLoadingKegiatan(false);
    }
  };

  const loadSubKegiatan = async () => {
    if (!token) {
      message.error('Token tidak ditemukan. Silakan login kembali.');
      return;
    }

    setLoadingSub(true);
    try {
      const response = await axios.get('http://localhost:5000/api/kegiatan/sub-kegiatan', {
        headers: { Authorization: `Bearer ${token}` },
      });
      setSubKegiatanList(response.data);
    } catch (error: any) {
      console.error('Error loading sub kegiatan:', error);
      message.error(error.response?.data?.message || 'Gagal memuat data sub kegiatan');
    } finally {
      setLoadingSub(false);
    }
  };

  // ========== KEGIATAN CRUD ==========
  const handleAddKegiatan = () => {
    setEditingKegiatan(null);
    kegiatanForm.resetFields();
    setKegiatanModalVisible(true);
  };

  const handleEditKegiatan = (record: Kegiatan) => {
    setEditingKegiatan(record);
    kegiatanForm.setFieldsValue(record);
    setKegiatanModalVisible(true);
  };

  const handleDeleteKegiatan = async (id: number) => {
    if (!token) return;

    try {
      await axios.delete(`http://localhost:5000/api/kegiatan/kegiatan/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      message.success('Kegiatan berhasil dihapus');
      loadKegiatan();
      loadSubKegiatan(); // Refresh if any child deleted
    } catch (error: any) {
      console.error('Error deleting kegiatan:', error);
      message.error(error.response?.data?.message || 'Gagal menghapus kegiatan');
    }
  };

  const handleKegiatanSubmit = async () => {
    try {
      const values = await kegiatanForm.validateFields();
      if (!token) return;

      if (editingKegiatan) {
        // Update
        await axios.put(
          `http://localhost:5000/api/kegiatan/kegiatan/${editingKegiatan.id_kegiatan}`,
          values,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        message.success('Kegiatan berhasil diupdate');
      } else {
        // Create
        await axios.post('http://localhost:5000/api/kegiatan/kegiatan', values, {
          headers: { Authorization: `Bearer ${token}` },
        });
        message.success('Kegiatan berhasil ditambahkan');
      }

      setKegiatanModalVisible(false);
      kegiatanForm.resetFields();
      loadKegiatan();
    } catch (error: any) {
      console.error('Error saving kegiatan:', error);
      message.error(error.response?.data?.message || 'Gagal menyimpan kegiatan');
    }
  };

  // ========== SUB KEGIATAN CRUD ==========
  const handleAddSub = () => {
    setEditingSub(null);
    subForm.resetFields();
    setSubModalVisible(true);
  };

  const handleEditSub = (record: SubKegiatan) => {
    setEditingSub(record);
    subForm.setFieldsValue(record);
    setSubModalVisible(true);
  };

  const handleDeleteSub = async (id: number) => {
    if (!token) return;

    try {
      await axios.delete(`http://localhost:5000/api/kegiatan/sub-kegiatan/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      message.success('Sub kegiatan berhasil dihapus');
      loadSubKegiatan();
    } catch (error: any) {
      console.error('Error deleting sub kegiatan:', error);
      message.error(error.response?.data?.message || 'Gagal menghapus sub kegiatan');
    }
  };

  const handleSubSubmit = async () => {
    try {
      const values = await subForm.validateFields();
      if (!token) return;

      if (editingSub) {
        // Update
        await axios.put(
          `http://localhost:5000/api/kegiatan/sub-kegiatan/${editingSub.id_sub_kegiatan}`,
          values,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        message.success('Sub kegiatan berhasil diupdate');
      } else {
        // Create
        await axios.post('http://localhost:5000/api/kegiatan/sub-kegiatan', values, {
          headers: { Authorization: `Bearer ${token}` },
        });
        message.success('Sub kegiatan berhasil ditambahkan');
      }

      setSubModalVisible(false);
      subForm.resetFields();
      loadSubKegiatan();
    } catch (error: any) {
      console.error('Error saving sub kegiatan:', error);
      message.error(error.response?.data?.message || 'Gagal menyimpan sub kegiatan');
    }
  };

  const kegiatanColumns = [
    {
      title: 'ID Uraian',
      dataIndex: 'id_uraian',
      key: 'id_uraian',
      width: 100,
    },
    {
      title: 'Kode',
      dataIndex: 'kode',
      key: 'kode',
      width: 150,
    },
    {
      title: 'Kegiatan',
      dataIndex: 'kegiatan',
      key: 'kegiatan',
    },
    {
      title: 'Aksi',
      key: 'action',
      width: 150,
      render: (_: any, record: Kegiatan) => (
        <Space>
          <Button
            type="link"
            icon={<EditOutlined />}
            onClick={() => handleEditKegiatan(record)}
          >
            Edit
          </Button>
          <Popconfirm
            title="Hapus kegiatan ini?"
            description="Sub kegiatan yang terkait harus dihapus terlebih dahulu."
            onConfirm={() => handleDeleteKegiatan(record.id_kegiatan)}
            okText="Ya"
            cancelText="Batal"
          >
            <Button type="link" danger icon={<DeleteOutlined />}>
              Hapus
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  const subKegiatanColumns = [
    {
      title: 'Kegiatan Parent',
      dataIndex: ['kegiatanParent', 'kegiatan'],
      key: 'parent',
      width: 200,
      render: (_: string, record: SubKegiatan) => 
        record.kegiatanParent?.kegiatan || `ID: ${record.id_kegiatan}`,
    },
    {
      title: 'Kode Sub',
      dataIndex: 'kode_sub',
      key: 'kode_sub',
      width: 150,
    },
    {
      title: 'Sub Kegiatan',
      dataIndex: 'kegiatan',
      key: 'kegiatan',
    },
    {
      title: 'Indikator Kinerja',
      dataIndex: 'indikator_kinerja',
      key: 'indikator_kinerja',
      ellipsis: true,
    },
    {
      title: 'Aksi',
      key: 'action',
      width: 200,
      render: (_: any, record: SubKegiatan) => (
        <Space>
          <Button
            type="link"
            icon={<SettingOutlined />}
            onClick={() => {
              setSelectedSubKegiatan({
                id: record.id_sub_kegiatan,
                name: record.kegiatan,
              });
              setsumberAnggaranModalVisible(true);
            }}
          >
            Sumber Anggaran
          </Button>
          <Button type="link" icon={<EditOutlined />} onClick={() => handleEditSub(record)}>
            Edit
          </Button>
          <Popconfirm
            title="Hapus sub kegiatan ini?"
            onConfirm={() => handleDeleteSub(record.id_sub_kegiatan)}
            okText="Ya"
            cancelText="Batal"
          >
            <Button type="link" danger icon={<DeleteOutlined />}>
              Hapus
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  const tabItems = [
    {
      key: 'kegiatan',
      label: 'Kegiatan',
      children: (
        <>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={handleAddKegiatan}
            style={{ marginBottom: 16 }}
          >
            Tambah Kegiatan
          </Button>
          <Table
            columns={kegiatanColumns}
            dataSource={kegiatanList}
            rowKey="id_kegiatan"
            loading={loadingKegiatan}
            pagination={{ pageSize: 10 }}
          />
        </>
      ),
    },
    {
      key: 'sub-kegiatan',
      label: 'Sub Kegiatan',
      children: (
        <>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={handleAddSub}
            style={{ marginBottom: 16 }}
          >
            Tambah Sub Kegiatan
          </Button>
          <Table
            columns={subKegiatanColumns}
            dataSource={subKegiatanList}
            rowKey="id_sub_kegiatan"
            loading={loadingSub}
            pagination={{ pageSize: 10 }}
          />
        </>
      ),
    },
  ];

  return (
    <div>
      <Title level={2}>Manajemen Kegiatan & Sub Kegiatan</Title>
      <Card>
        <Tabs items={tabItems} />
      </Card>

      {/* Kegiatan Modal */}
      <Modal
        title={editingKegiatan ? 'Edit Kegiatan' : 'Tambah Kegiatan'}
        open={kegiatanModalVisible}
        onOk={handleKegiatanSubmit}
        onCancel={() => {
          setKegiatanModalVisible(false);
          kegiatanForm.resetFields();
        }}
        width={600}
      >
        <Form form={kegiatanForm} layout="vertical">
          <Form.Item
            name="id_uraian"
            label="ID Uraian"
            rules={[{ required: true, message: 'ID Uraian wajib diisi' }]}
          >
            <InputNumber style={{ width: '100%' }} min={1} />
          </Form.Item>
          <Form.Item
            name="kode"
            label="Kode Kegiatan"
            rules={[{ required: true, message: 'Kode wajib diisi' }]}
          >
            <Input placeholder="Contoh: 1.02.01.2.10" maxLength={20} />
          </Form.Item>
          <Form.Item
            name="kegiatan"
            label="Nama Kegiatan"
            rules={[{ required: true, message: 'Nama kegiatan wajib diisi' }]}
          >
            <TextArea rows={3} maxLength={200} />
          </Form.Item>
        </Form>
      </Modal>

      {/* Sub Kegiatan Modal */}
      <Modal
        title={editingSub ? 'Edit Sub Kegiatan' : 'Tambah Sub Kegiatan'}
        open={subModalVisible}
        onOk={handleSubSubmit}
        onCancel={() => {
          setSubModalVisible(false);
          subForm.resetFields();
        }}
        width={700}
      >
        <Form form={subForm} layout="vertical">
          <Form.Item
            name="id_kegiatan"
            label="Kegiatan Parent"
            rules={[{ required: true, message: 'Kegiatan parent wajib dipilih' }]}
          >
            <Select
              placeholder="Pilih kegiatan"
              showSearch
              optionFilterProp="children"
              filterOption={(input, option) =>
                (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
              }
              options={kegiatanList.map((k) => ({
                value: k.id_kegiatan,
                label: `${k.kode} - ${k.kegiatan}`,
              }))}
            />
          </Form.Item>
          <Form.Item
            name="kode_sub"
            label="Kode Sub Kegiatan"
            rules={[{ required: true, message: 'Kode sub wajib diisi' }]}
          >
            <Input placeholder="Contoh: 1.02.01.2.10.0001" maxLength={200} />
          </Form.Item>
          <Form.Item
            name="kegiatan"
            label="Nama Sub Kegiatan"
            rules={[{ required: true, message: 'Nama sub kegiatan wajib diisi' }]}
          >
            <TextArea rows={3} maxLength={200} />
          </Form.Item>
          <Form.Item
            name="indikator_kinerja"
            label="Indikator Kinerja"
            rules={[{ required: true, message: 'Indikator kinerja wajib diisi' }]}
          >
            <TextArea rows={3} />
          </Form.Item>
        </Form>
      </Modal>

      {/* Sumber Anggaran Modal */}
      <SubKegiatanSumberAnggaranModal
        visible={sumberAnggaranModalVisible}
        subKegiatanId={selectedSubKegiatan?.id || null}
        subKegiatanName={selectedSubKegiatan?.name || ''}
        onClose={() => {
          setsumberAnggaranModalVisible(false);
          setSelectedSubKegiatan(null);
        }}
        onSuccess={() => {
          message.success('Sumber Anggaran berhasil diperbarui');
        }}
      />
    </div>
  );
};
