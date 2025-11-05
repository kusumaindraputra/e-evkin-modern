import React, { useState, useEffect } from 'react';
import {
  Card,
  Table,
  Button,
  Modal,
  Form,
  Input,
  message,
  Popconfirm,
  Space,
  Typography,
  Tag,
} from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, UserOutlined } from '@ant-design/icons';
import axios from 'axios';
import { useAuthStore } from '../store/authStore';

const { Title } = Typography;

interface PuskesmasUser {
  id: string;
  username: string;
  nama: string;
  kode_puskesmas: string | null;
  nama_puskesmas: string;
  id_blud: string | null;
  kecamatan: string | null;
  wilayah: string | null;
  created_at: string;
  updated_at: string;
}

export const AdminPuskesmasPage: React.FC = () => {
  const { token } = useAuthStore();
  const [users, setUsers] = useState<PuskesmasUser[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingUser, setEditingUser] = useState<PuskesmasUser | null>(null);
  const [form] = Form.useForm();

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    if (!token) {
      message.error('Token tidak ditemukan. Silakan login kembali.');
      return;
    }

    setLoading(true);
    try {
      const response = await axios.get('http://localhost:5000/api/users/puskesmas', {
        headers: { Authorization: `Bearer ${token}` },
      });
      setUsers(response.data);
    } catch (error: any) {
      console.error('Error loading puskesmas users:', error);
      message.error(error.response?.data?.message || 'Gagal memuat data puskesmas');
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = () => {
    setEditingUser(null);
    form.resetFields();
    setModalVisible(true);
  };

  const handleEdit = (record: PuskesmasUser) => {
    setEditingUser(record);
    form.setFieldsValue({
      ...record,
      password: '', // Don't show password
    });
    setModalVisible(true);
  };

  const handleDelete = async (id: string) => {
    if (!token) return;

    try {
      await axios.delete(`http://localhost:5000/api/users/puskesmas/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      message.success('Puskesmas berhasil dihapus');
      loadUsers();
    } catch (error: any) {
      console.error('Error deleting puskesmas:', error);
      message.error(error.response?.data?.message || 'Gagal menghapus puskesmas');
    }
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      if (!token) return;

      // Remove password field if empty during edit
      if (editingUser && !values.password) {
        delete values.password;
      }

      if (editingUser) {
        // Update
        await axios.put(
          `http://localhost:5000/api/users/puskesmas/${editingUser.id}`,
          values,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        message.success('Puskesmas berhasil diupdate');
      } else {
        // Create
        await axios.post('http://localhost:5000/api/users/puskesmas', values, {
          headers: { Authorization: `Bearer ${token}` },
        });
        message.success('Puskesmas berhasil ditambahkan');
      }

      setModalVisible(false);
      form.resetFields();
      loadUsers();
    } catch (error: any) {
      console.error('Error saving puskesmas:', error);
      message.error(error.response?.data?.message || 'Gagal menyimpan puskesmas');
    }
  };

  const columns = [
    {
      title: 'Username',
      dataIndex: 'username',
      key: 'username',
      width: 150,
      render: (text: string) => (
        <Space>
          <UserOutlined />
          <strong>{text}</strong>
        </Space>
      ),
    },
    {
      title: 'Nama Puskesmas',
      dataIndex: 'nama_puskesmas',
      key: 'nama_puskesmas',
    },
    {
      title: 'Nama Penanggung Jawab',
      dataIndex: 'nama',
      key: 'nama',
    },
    {
      title: 'Kode Puskesmas',
      dataIndex: 'kode_puskesmas',
      key: 'kode_puskesmas',
      width: 150,
      render: (text: string | null) =>
        text ? <Tag color="blue">{text}</Tag> : <Tag color="default">-</Tag>,
    },
    {
      title: 'Kecamatan',
      dataIndex: 'kecamatan',
      key: 'kecamatan',
      width: 150,
      render: (text: string | null) => text || '-',
    },
    {
      title: 'Wilayah',
      dataIndex: 'wilayah',
      key: 'wilayah',
      width: 120,
      render: (text: string | null) => text || '-',
    },
    {
      title: 'Aksi',
      key: 'action',
      width: 150,
      fixed: 'right' as const,
      render: (_: any, record: PuskesmasUser) => (
        <Space>
          <Button type="link" icon={<EditOutlined />} onClick={() => handleEdit(record)}>
            Edit
          </Button>
          <Popconfirm
            title="Hapus puskesmas ini?"
            description="Data laporan tidak akan terhapus, namun user tidak dapat login lagi."
            onConfirm={() => handleDelete(record.id)}
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

  return (
    <div>
      <Title level={2}>Manajemen Daftar Puskesmas</Title>
      <Card>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={handleAdd}
          style={{ marginBottom: 16 }}
        >
          Tambah Puskesmas
        </Button>
        <Table
          columns={columns}
          dataSource={users}
          rowKey="id"
          loading={loading}
          pagination={{ pageSize: 10, showTotal: (total) => `Total ${total} puskesmas` }}
          scroll={{ x: 1200 }}
        />
      </Card>

      {/* Modal */}
      <Modal
        title={editingUser ? 'Edit Puskesmas' : 'Tambah Puskesmas'}
        open={modalVisible}
        onOk={handleSubmit}
        onCancel={() => {
          setModalVisible(false);
          form.resetFields();
        }}
        width={700}
        okText="Simpan"
        cancelText="Batal"
      >
        <Form form={form} layout="vertical">
          <Form.Item
            name="username"
            label="Username"
            rules={[
              { required: true, message: 'Username wajib diisi' },
              {
                pattern: /^[a-zA-Z0-9_]+$/,
                message: 'Username hanya boleh huruf, angka, dan underscore',
              },
            ]}
          >
            <Input placeholder="Contoh: puskesmas_bojonggede" />
          </Form.Item>

          <Form.Item
            name="password"
            label={editingUser ? 'Password (kosongkan jika tidak diubah)' : 'Password'}
            rules={
              editingUser
                ? []
                : [
                    { required: true, message: 'Password wajib diisi' },
                    { min: 6, message: 'Password minimal 6 karakter' },
                  ]
            }
          >
            <Input.Password placeholder="Minimal 6 karakter" />
          </Form.Item>

          <Form.Item
            name="nama_puskesmas"
            label="Nama Puskesmas"
            rules={[{ required: true, message: 'Nama puskesmas wajib diisi' }]}
          >
            <Input placeholder="Contoh: Puskesmas Bojonggede" />
          </Form.Item>

          <Form.Item
            name="nama"
            label="Nama Penanggung Jawab"
            rules={[{ required: true, message: 'Nama penanggung jawab wajib diisi' }]}
          >
            <Input placeholder="Nama kepala puskesmas atau PJ" />
          </Form.Item>

          <Form.Item name="kode_puskesmas" label="Kode Puskesmas (Opsional)">
            <Input placeholder="Contoh: P001" />
          </Form.Item>

          <Form.Item name="id_blud" label="ID BLUD (Opsional)">
            <Input placeholder="ID BLUD jika ada" />
          </Form.Item>

          <Form.Item name="kecamatan" label="Kecamatan (Opsional)">
            <Input placeholder="Contoh: Bojonggede" />
          </Form.Item>

          <Form.Item name="wilayah" label="Wilayah (Opsional)">
            <Input placeholder="Contoh: Kabupaten Bogor" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};
