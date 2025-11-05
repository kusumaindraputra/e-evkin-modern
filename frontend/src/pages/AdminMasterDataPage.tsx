import React, { useState, useEffect } from 'react';
import {
  Tabs,
  Table,
  Button,
  Modal,
  Form,
  Input,
  InputNumber,
  Select,
  Space,
  message,
  Popconfirm,
  Card,
  Typography,
} from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import axios from 'axios';
import { useAuthStore } from '../store/authStore';

const { Title } = Typography;
const { TextArea } = Input;

interface Satuan {
  id_satuan: number;
  satuannya: string;
}

interface SumberAnggaran {
  id_sumber: number;
  sumber: string;
}

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

export const AdminMasterDataPage: React.FC = () => {
  const { token } = useAuthStore();
  
  // Satuan state
  const [satuanList, setSatuanList] = useState<Satuan[]>([]);
  const [satuanModalVisible, setSatuanModalVisible] = useState(false);
  const [satuanModalMode, setSatuanModalMode] = useState<'create' | 'edit'>('create');
  const [editingSatuan, setEditingSatuan] = useState<Satuan | null>(null);
  const [satuanForm] = Form.useForm();

  // Sumber Anggaran state
  const [anggaranList, setAnggaranList] = useState<SumberAnggaran[]>([]);
  const [anggaranModalVisible, setAnggaranModalVisible] = useState(false);
  const [anggaranModalMode, setAnggaranModalMode] = useState<'create' | 'edit'>('create');
  const [editingAnggaran, setEditingAnggaran] = useState<SumberAnggaran | null>(null);
  const [anggaranForm] = Form.useForm();

  // Kegiatan state
  const [kegiatanList, setKegiatanList] = useState<Kegiatan[]>([]);
  const [kegiatanModalVisible, setKegiatanModalVisible] = useState(false);
  const [editingKegiatan, setEditingKegiatan] = useState<Kegiatan | null>(null);
  const [kegiatanForm] = Form.useForm();

  // Sub Kegiatan state
  const [subKegiatanList, setSubKegiatanList] = useState<SubKegiatan[]>([]);
  const [subModalVisible, setSubModalVisible] = useState(false);
  const [editingSub, setEditingSub] = useState<SubKegiatan | null>(null);
  const [subForm] = Form.useForm();

  const [loading, setLoading] = useState(false);

  // Search state
  const [searchSatuan, setSearchSatuan] = useState('');
  const [searchAnggaran, setSearchAnggaran] = useState('');
  const [searchKegiatan, setSearchKegiatan] = useState('');
  const [searchSubKegiatan, setSearchSubKegiatan] = useState('');

  // Filtered data
  const filteredSatuan = satuanList.filter(item =>
    item.satuannya.toLowerCase().includes(searchSatuan.toLowerCase())
  );

  const filteredAnggaran = anggaranList.filter(item =>
    item.sumber.toLowerCase().includes(searchAnggaran.toLowerCase())
  );

  const filteredKegiatan = kegiatanList.filter(item =>
    item.kode.toLowerCase().includes(searchKegiatan.toLowerCase()) ||
    item.kegiatan.toLowerCase().includes(searchKegiatan.toLowerCase())
  );

  const filteredSubKegiatan = subKegiatanList.filter(item =>
    item.kode_sub.toLowerCase().includes(searchSubKegiatan.toLowerCase()) ||
    item.kegiatan.toLowerCase().includes(searchSubKegiatan.toLowerCase()) ||
    item.kegiatanParent?.kegiatan.toLowerCase().includes(searchSubKegiatan.toLowerCase())
  );

  // ================== SATUAN FUNCTIONS ==================
  
  const loadSatuan = async () => {
    if (!token) {
      message.error('Token tidak ditemukan. Silakan login kembali.');
      return;
    }

    setLoading(true);
    try {
      const response = await axios.get('http://localhost:5000/api/masterdata/satuan', {
        headers: { Authorization: `Bearer ${token}` },
      });
      setSatuanList(response.data);
    } catch (error: any) {
      console.error('Error loading satuan:', error);
      message.error(error.response?.data?.message || 'Gagal memuat data satuan');
    } finally {
      setLoading(false);
    }
  };

  const handleSatuanCreate = () => {
    setSatuanModalMode('create');
    setSatuanModalVisible(true);
    satuanForm.resetFields();
  };

  const handleSatuanEdit = (record: Satuan) => {
    setSatuanModalMode('edit');
    setEditingSatuan(record);
    setSatuanModalVisible(true);
    satuanForm.setFieldsValue({ satuannya: record.satuannya });
  };

  const handleSatuanSubmit = async (values: any) => {
    try {
      if (satuanModalMode === 'create') {
        await axios.post(
          'http://localhost:5000/api/masterdata/satuan',
          values,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        message.success('Satuan berhasil ditambahkan');
      } else {
        await axios.put(
          `http://localhost:5000/api/masterdata/satuan/${editingSatuan?.id_satuan}`,
          values,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        message.success('Satuan berhasil diperbarui');
      }
      setSatuanModalVisible(false);
      loadSatuan();
    } catch (error: any) {
      message.error(error.response?.data?.message || 'Gagal menyimpan satuan');
    }
  };

  const handleSatuanDelete = async (id: number) => {
    try {
      await axios.delete(`http://localhost:5000/api/masterdata/satuan/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      message.success('Satuan berhasil dihapus');
      loadSatuan();
    } catch (error: any) {
      message.error(error.response?.data?.message || 'Gagal menghapus satuan');
    }
  };

  // ================== SUMBER ANGGARAN FUNCTIONS ==================

  const loadAnggaran = async () => {
    if (!token) {
      message.error('Token tidak ditemukan. Silakan login kembali.');
      return;
    }

    setLoading(true);
    try {
      const response = await axios.get('http://localhost:5000/api/masterdata/sumber-anggaran', {
        headers: { Authorization: `Bearer ${token}` },
      });
      setAnggaranList(response.data);
    } catch (error: any) {
      console.error('Error loading sumber anggaran:', error);
      message.error(error.response?.data?.message || 'Gagal memuat data sumber anggaran');
    } finally {
      setLoading(false);
    }
  };

  const handleAnggaranCreate = () => {
    setAnggaranModalMode('create');
    setAnggaranModalVisible(true);
    anggaranForm.resetFields();
  };

  const handleAnggaranEdit = (record: SumberAnggaran) => {
    setAnggaranModalMode('edit');
    setEditingAnggaran(record);
    setAnggaranModalVisible(true);
    anggaranForm.setFieldsValue({ sumber: record.sumber });
  };

  const handleAnggaranSubmit = async (values: any) => {
    try {
      if (anggaranModalMode === 'create') {
        await axios.post(
          'http://localhost:5000/api/masterdata/sumber-anggaran',
          values,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        message.success('Sumber anggaran berhasil ditambahkan');
      } else {
        await axios.put(
          `http://localhost:5000/api/masterdata/sumber-anggaran/${editingAnggaran?.id_sumber}`,
          values,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        message.success('Sumber anggaran berhasil diperbarui');
      }
      setAnggaranModalVisible(false);
      loadAnggaran();
    } catch (error: any) {
      message.error(error.response?.data?.message || 'Gagal menyimpan sumber anggaran');
    }
  };

  const handleAnggaranDelete = async (id: number) => {
    try {
      await axios.delete(`http://localhost:5000/api/masterdata/sumber-anggaran/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      message.success('Sumber anggaran berhasil dihapus');
      loadAnggaran();
    } catch (error: any) {
      message.error(error.response?.data?.message || 'Gagal menghapus sumber anggaran');
    }
  };

  // ================== KEGIATAN FUNCTIONS ==================

  const loadKegiatan = async () => {
    if (!token) {
      message.error('Token tidak ditemukan. Silakan login kembali.');
      return;
    }

    setLoading(true);
    try {
      const response = await axios.get('http://localhost:5000/api/masterdata/kegiatan', {
        headers: { Authorization: `Bearer ${token}` },
      });
      setKegiatanList(response.data);
    } catch (error: any) {
      console.error('Error loading kegiatan:', error);
      message.error(error.response?.data?.message || 'Gagal memuat data kegiatan');
    } finally {
      setLoading(false);
    }
  };

  const handleKegiatanCreate = () => {
    setEditingKegiatan(null);
    kegiatanForm.resetFields();
    setKegiatanModalVisible(true);
  };

  const handleKegiatanEdit = (record: Kegiatan) => {
    setEditingKegiatan(record);
    kegiatanForm.setFieldsValue(record);
    setKegiatanModalVisible(true);
  };

  const handleKegiatanSubmit = async () => {
    try {
      const values = await kegiatanForm.validateFields();
      if (!token) return;

      if (editingKegiatan) {
        await axios.put(
          `http://localhost:5000/api/masterdata/kegiatan/${editingKegiatan.id_kegiatan}`,
          values,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        message.success('Kegiatan berhasil diperbarui');
      } else {
        await axios.post('http://localhost:5000/api/masterdata/kegiatan', values, {
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

  const handleKegiatanDelete = async (id: number) => {
    if (!token) return;

    try {
      await axios.delete(`http://localhost:5000/api/masterdata/kegiatan/${id}`, {
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

  // ================== SUB KEGIATAN FUNCTIONS ==================

  const loadSubKegiatan = async () => {
    if (!token) {
      message.error('Token tidak ditemukan. Silakan login kembali.');
      return;
    }

    setLoading(true);
    try {
      const response = await axios.get('http://localhost:5000/api/masterdata/sub-kegiatan', {
        headers: { Authorization: `Bearer ${token}` },
      });
      setSubKegiatanList(response.data);
    } catch (error: any) {
      console.error('Error loading sub kegiatan:', error);
      message.error(error.response?.data?.message || 'Gagal memuat data sub kegiatan');
    } finally {
      setLoading(false);
    }
  };

  const handleSubCreate = () => {
    setEditingSub(null);
    subForm.resetFields();
    setSubModalVisible(true);
  };

  const handleSubEdit = (record: SubKegiatan) => {
    setEditingSub(record);
    subForm.setFieldsValue(record);
    setSubModalVisible(true);
  };

  const handleSubSubmit = async () => {
    try {
      const values = await subForm.validateFields();
      if (!token) return;

      if (editingSub) {
        await axios.put(
          `http://localhost:5000/api/masterdata/sub-kegiatan/${editingSub.id_sub_kegiatan}`,
          values,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        message.success('Sub kegiatan berhasil diperbarui');
      } else {
        await axios.post('http://localhost:5000/api/masterdata/sub-kegiatan', values, {
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

  const handleSubDelete = async (id: number) => {
    if (!token) return;

    try {
      await axios.delete(`http://localhost:5000/api/masterdata/sub-kegiatan/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      message.success('Sub kegiatan berhasil dihapus');
      loadSubKegiatan();
    } catch (error: any) {
      console.error('Error deleting sub kegiatan:', error);
      message.error(error.response?.data?.message || 'Gagal menghapus sub kegiatan');
    }
  };

  // ================== TABLE COLUMNS ==================

  const satuanColumns: ColumnsType<Satuan> = [
    {
      title: 'No',
      key: 'no',
      width: 60,
      render: (_, __, index) => index + 1,
    },
    {
      title: 'Nama Satuan',
      dataIndex: 'satuannya',
      key: 'satuannya',
    },
    {
      title: 'Aksi',
      key: 'action',
      width: 100,
      render: (_, record) => (
        <Space>
          <Button
            type="primary"
            icon={<EditOutlined />}
            onClick={() => handleSatuanEdit(record)}
            size="small"
          />
          <Popconfirm
            title="Hapus satuan ini?"
            onConfirm={() => handleSatuanDelete(record.id_satuan)}
            okText="Ya"
            cancelText="Tidak"
          >
            <Button 
              danger 
              icon={<DeleteOutlined />} 
              size="small"
            />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  const anggaranColumns: ColumnsType<SumberAnggaran> = [
    {
      title: 'No',
      key: 'no',
      width: 60,
      render: (_, __, index) => index + 1,
    },
    {
      title: 'Nama Sumber Anggaran',
      dataIndex: 'sumber',
      key: 'sumber',
    },
    {
      title: 'Aksi',
      key: 'action',
      width: 100,
      render: (_, record) => (
        <Space>
          <Button
            type="primary"
            icon={<EditOutlined />}
            onClick={() => handleAnggaranEdit(record)}
            size="small"
          />
          <Popconfirm
            title="Hapus sumber anggaran ini?"
            onConfirm={() => handleAnggaranDelete(record.id_sumber)}
            okText="Ya"
            cancelText="Tidak"
          >
            <Button 
              danger 
              icon={<DeleteOutlined />} 
              size="small"
            />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  const kegiatanColumns: ColumnsType<Kegiatan> = [
    {
      title: 'No',
      key: 'no',
      width: 60,
      render: (_, __, index) => index + 1,
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
      width: 100,
      render: (_, record) => (
        <Space>
          <Button
            type="primary"
            icon={<EditOutlined />}
            onClick={() => handleKegiatanEdit(record)}
            size="small"
          />
          <Popconfirm
            title="Hapus kegiatan ini?"
            description="Sub kegiatan yang terkait harus dihapus terlebih dahulu."
            onConfirm={() => handleKegiatanDelete(record.id_kegiatan)}
            okText="Ya"
            cancelText="Batal"
          >
            <Button 
              danger 
              icon={<DeleteOutlined />} 
              size="small"
            />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  const subKegiatanColumns: ColumnsType<SubKegiatan> = [
    {
      title: 'No',
      key: 'no',
      width: 60,
      render: (_, __, index) => index + 1,
    },
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
      width: 100,
      render: (_, record) => (
        <Space>
          <Button
            type="primary"
            icon={<EditOutlined />}
            onClick={() => handleSubEdit(record)}
            size="small"
          />
          <Popconfirm
            title="Hapus sub kegiatan ini?"
            onConfirm={() => handleSubDelete(record.id_sub_kegiatan)}
            okText="Ya"
            cancelText="Batal"
          >
            <Button 
              danger 
              icon={<DeleteOutlined />} 
              size="small"
            />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  // Load data on mount
  useEffect(() => {
    loadSatuan();
    loadAnggaran();
    loadKegiatan();
    loadSubKegiatan();
  }, []);

  const tabItems = [
    {
      key: 'satuan',
      label: 'Satuan',
      children: (
        <>
          <Space style={{ marginBottom: 16, width: '100%', justifyContent: 'space-between' }}>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={handleSatuanCreate}
            >
              Tambah Satuan
            </Button>
            <Input
              placeholder="Cari satuan..."
              value={searchSatuan}
              onChange={(e) => setSearchSatuan(e.target.value)}
              style={{ width: 300 }}
              allowClear
            />
          </Space>
          <Table
            columns={satuanColumns}
            dataSource={filteredSatuan}
            rowKey="id_satuan"
            loading={loading}
            pagination={{ pageSize: 10 }}
          />
        </>
      ),
    },
    {
      key: 'anggaran',
      label: 'Sumber Anggaran',
      children: (
        <>
          <Space style={{ marginBottom: 16, width: '100%', justifyContent: 'space-between' }}>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={handleAnggaranCreate}
            >
              Tambah Sumber Anggaran
            </Button>
            <Input
              placeholder="Cari sumber anggaran..."
              value={searchAnggaran}
              onChange={(e) => setSearchAnggaran(e.target.value)}
              style={{ width: 300 }}
              allowClear
            />
          </Space>
          <Table
            columns={anggaranColumns}
            dataSource={filteredAnggaran}
            rowKey="id_sumber"
            loading={loading}
            pagination={{ pageSize: 10 }}
          />
        </>
      ),
    },
    {
      key: 'kegiatan',
      label: 'Kegiatan',
      children: (
        <>
          <Space style={{ marginBottom: 16, width: '100%', justifyContent: 'space-between' }}>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={handleKegiatanCreate}
            >
              Tambah Kegiatan
            </Button>
            <Input
              placeholder="Cari kode atau nama kegiatan..."
              value={searchKegiatan}
              onChange={(e) => setSearchKegiatan(e.target.value)}
              style={{ width: 300 }}
              allowClear
            />
          </Space>
          <Table
            columns={kegiatanColumns}
            dataSource={filteredKegiatan}
            rowKey="id_kegiatan"
            loading={loading}
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
          <Space style={{ marginBottom: 16, width: '100%', justifyContent: 'space-between' }}>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={handleSubCreate}
            >
              Tambah Sub Kegiatan
            </Button>
            <Input
              placeholder="Cari kode, nama sub kegiatan, atau kegiatan parent..."
              value={searchSubKegiatan}
              onChange={(e) => setSearchSubKegiatan(e.target.value)}
              style={{ width: 400 }}
              allowClear
            />
          </Space>
          <Table
            columns={subKegiatanColumns}
            dataSource={filteredSubKegiatan}
            rowKey="id_sub_kegiatan"
            loading={loading}
            pagination={{ pageSize: 10 }}
          />
        </>
      ),
    },
  ];

  return (
    <div>
      <Title level={3}>Master Data</Title>
      <Card>
        <Tabs items={tabItems} />
      </Card>

      {/* Satuan Modal */}
      <Modal
        title={satuanModalMode === 'create' ? 'Tambah Satuan' : 'Edit Satuan'}
        open={satuanModalVisible}
        onCancel={() => setSatuanModalVisible(false)}
        footer={null}
      >
        <Form form={satuanForm} onFinish={handleSatuanSubmit} layout="vertical">
          <Form.Item
            name="satuannya"
            label="Nama Satuan"
            rules={[{ required: true, message: 'Nama satuan harus diisi' }]}
          >
            <Input placeholder="Contoh: Orang, Dokumen, Kegiatan" />
          </Form.Item>
          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit">
                Simpan
              </Button>
              <Button onClick={() => setSatuanModalVisible(false)}>Batal</Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      {/* Sumber Anggaran Modal */}
      <Modal
        title={anggaranModalMode === 'create' ? 'Tambah Sumber Anggaran' : 'Edit Sumber Anggaran'}
        open={anggaranModalVisible}
        onCancel={() => setAnggaranModalVisible(false)}
        footer={null}
      >
        <Form form={anggaranForm} onFinish={handleAnggaranSubmit} layout="vertical">
          <Form.Item
            name="sumber"
            label="Nama Sumber Anggaran"
            rules={[{ required: true, message: 'Nama sumber anggaran harus diisi' }]}
          >
            <Input placeholder="Contoh: BLUD Puskesmas, APBD, DAK" />
          </Form.Item>
          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit">
                Simpan
              </Button>
              <Button onClick={() => setAnggaranModalVisible(false)}>Batal</Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

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
    </div>
  );
};
