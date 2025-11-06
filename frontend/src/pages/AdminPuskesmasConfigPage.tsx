import React, { useState, useEffect } from 'react';
import {
  Typography,
  Table,
  Button,
  Modal,
  Transfer,
  message,
  Space,
  Tag,
  Card,
} from 'antd';
import { SettingOutlined, ReloadOutlined } from '@ant-design/icons';
import axios from 'axios';
import { useAuthStore } from '../store/authStore';

const { Title, Text } = Typography;

interface Puskesmas {
  id: string; // UUID
  nama: string;
  nama_puskesmas: string;
  kecamatan: string;
  kode_puskesmas: string;
  jumlah_sub_kegiatan: number;
}

interface SubKegiatan {
  id_sub_kegiatan: number;
  kode_sub: string;
  kegiatan: string;
  indikator_kinerja: string;
  kegiatanParent: {
    id_kegiatan: number;
    kode: string;
    kegiatan: string;
  };
}

interface Assignment {
  id: number;
  user_id: number;
  id_sub_kegiatan: number;
  subKegiatan: SubKegiatan;
}

interface TransferItem {
  key: string;
  title: string;
  description: string;
}

export const AdminPuskesmasConfigPage: React.FC = () => {
  const [puskesmasList, setPuskesmasList] = useState<Puskesmas[]>([]);
  const [allSubKegiatan, setAllSubKegiatan] = useState<SubKegiatan[]>([]);
  const [selectedPuskesmas, setSelectedPuskesmas] = useState<Puskesmas | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [targetKeys, setTargetKeys] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const { token } = useAuthStore();

  const apiClient = axios.create({
    baseURL: 'http://localhost:5000/api',
    headers: { Authorization: `Bearer ${token}` },
  });

  useEffect(() => {
    loadPuskesmasOverview();
    loadAllSubKegiatan();
  }, []);

  const loadPuskesmasOverview = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get('/puskesmas-config/puskesmas-overview');
      setPuskesmasList(response.data);
    } catch (error) {
      message.error('Gagal memuat daftar puskesmas');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const loadAllSubKegiatan = async () => {
    try {
      const response = await apiClient.get('/masterdata/sub-kegiatan');
      setAllSubKegiatan(response.data);
    } catch (error) {
      message.error('Gagal memuat sub kegiatan');
      console.error(error);
    }
  };

  const loadPuskesmasAssignments = async (userId: string) => {
    try {
      const response = await apiClient.get(`/puskesmas-config/puskesmas/${userId}/sub-kegiatan`);
      
      // Set target keys for transfer component
      const assignedIds = response.data.assignments.map(
        (a: Assignment) => String(a.id_sub_kegiatan)
      );
      setTargetKeys(assignedIds);
    } catch (error) {
      message.error('Gagal memuat konfigurasi sub kegiatan');
      console.error(error);
    }
  };

  const handleConfigureClick = async (puskesmas: Puskesmas) => {
    setSelectedPuskesmas(puskesmas);
    await loadPuskesmasAssignments(puskesmas.id);
    setModalVisible(true);
  };

  const handleSaveConfiguration = async () => {
    if (!selectedPuskesmas) return;

    try {
      setLoading(true);
      const subKegiatanIds = targetKeys.map(Number);
      
      await apiClient.post(
        `/puskesmas-config/puskesmas/${selectedPuskesmas.id}/sub-kegiatan`,
        { subKegiatanIds }
      );

      message.success('Konfigurasi sub kegiatan berhasil disimpan');
      setModalVisible(false);
      loadPuskesmasOverview(); // Refresh overview
    } catch (error) {
      message.error('Gagal menyimpan konfigurasi');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const columns = [
    {
      title: 'No',
      key: 'no',
      width: 60,
      render: (_: any, __: any, index: number) => index + 1,
    },
    {
      title: 'Kode',
      dataIndex: 'kode_puskesmas',
      key: 'kode_puskesmas',
      width: 100,
    },
    {
      title: 'Nama Puskesmas',
      dataIndex: 'nama_puskesmas',
      key: 'nama_puskesmas',
    },
    {
      title: 'Kecamatan',
      dataIndex: 'kecamatan',
      key: 'kecamatan',
      width: 150,
    },
    {
      title: 'Jumlah Sub Kegiatan',
      dataIndex: 'jumlah_sub_kegiatan',
      key: 'jumlah_sub_kegiatan',
      width: 180,
      render: (count: number) => (
        <Tag color={count > 0 ? 'green' : 'default'}>
          {count} Sub Kegiatan
        </Tag>
      ),
    },
    {
      title: 'Aksi',
      key: 'action',
      width: 120,
      render: (_: any, record: Puskesmas) => (
        <Button
          type="primary"
          icon={<SettingOutlined />}
          onClick={() => handleConfigureClick(record)}
        >
          Konfigurasi
        </Button>
      ),
    },
  ];

  // Prepare data for Transfer component
  const transferData: TransferItem[] = allSubKegiatan.map((sk) => ({
    key: String(sk.id_sub_kegiatan),
    title: `${sk.kode_sub} - ${sk.kegiatan}`,
    description: `${sk.kegiatanParent?.kode || ''} ${sk.kegiatanParent?.kegiatan || ''}`,
  }));

  const handleTransferChange = (newTargetKeys: React.Key[]) => {
    setTargetKeys(newTargetKeys as string[]);
  };

  return (
    <div>
      <Space direction="vertical" size="large" style={{ width: '100%' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Title level={3}>Konfigurasi Sub Kegiatan Puskesmas</Title>
          <Button icon={<ReloadOutlined />} onClick={loadPuskesmasOverview} loading={loading}>
            Refresh
          </Button>
        </div>

        <Card>
          <Text type="secondary">
            Kelola sub kegiatan yang tersedia untuk setiap puskesmas. 
            Puskesmas hanya akan dapat membuat laporan untuk sub kegiatan yang telah dikonfigurasi.
          </Text>
        </Card>

        <Table
          columns={columns}
          dataSource={puskesmasList}
          rowKey="id"
          loading={loading}
          pagination={{
            pageSize: 20,
            showSizeChanger: true,
            showTotal: (total) => `Total ${total} puskesmas`,
          }}
        />
      </Space>

      <Modal
        title={
          <Space>
            <SettingOutlined />
            <span>
              Konfigurasi Sub Kegiatan - {selectedPuskesmas?.nama_puskesmas}
            </span>
          </Space>
        }
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        onOk={handleSaveConfiguration}
        width={800}
        okText="Simpan"
        cancelText="Batal"
        confirmLoading={loading}
      >
        <Space direction="vertical" size="middle" style={{ width: '100%' }}>
          <Text type="secondary">
            Pilih sub kegiatan yang tersedia untuk puskesmas ini. 
            Gunakan tombol panah atau double-click untuk memindahkan item.
          </Text>

          <Transfer
            dataSource={transferData}
            titles={['Semua Sub Kegiatan', 'Sub Kegiatan Terpilih']}
            targetKeys={targetKeys}
            onChange={handleTransferChange}
            render={(item) => (
              <div>
                <div style={{ fontWeight: 500 }}>{item.title}</div>
                <div style={{ fontSize: '12px', color: '#888' }}>{item.description}</div>
              </div>
            )}
            listStyle={{
              width: 350,
              height: 500,
            }}
            showSearch
            filterOption={(inputValue, item) =>
              item.title.toLowerCase().includes(inputValue.toLowerCase()) ||
              item.description.toLowerCase().includes(inputValue.toLowerCase())
            }
          />

          <Text type="secondary">
            Total terpilih: <strong>{targetKeys.length}</strong> sub kegiatan
          </Text>
        </Space>
      </Modal>
    </div>
  );
};

export default AdminPuskesmasConfigPage;
