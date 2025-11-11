import React, { useState, useEffect } from 'react';
import { Modal, Transfer, message, Spin } from 'antd';
import axios from 'axios';
import { useAuthStore } from '../store/authStore';

interface SumberAnggaran {
  value: number;  // API returns 'value' not 'id_sumber'
  label: string;  // API returns 'label' not 'sumber'
}

interface SubKegiatanSumberAnggaranModalProps {
  visible: boolean;
  subKegiatanId: number | null;
  subKegiatanName: string;
  onClose: () => void;
  onSuccess: () => void;
}

export const SubKegiatanSumberAnggaranModal: React.FC<SubKegiatanSumberAnggaranModalProps> = ({
  visible,
  subKegiatanId,
  subKegiatanName,
  onClose,
  onSuccess,
}) => {
  const { token } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [allSumberAnggaran, setAllSumberAnggaran] = useState<SumberAnggaran[]>([]);
  const [selectedKeys, setSelectedKeys] = useState<number[]>([]);

  useEffect(() => {
    if (visible && subKegiatanId) {
      loadData();
    }
  }, [visible, subKegiatanId]);

  const loadData = async () => {
    if (!token || !subKegiatanId) return;

    setLoading(true);
    try {
      // Load all sumber anggaran
      const allResponse = await axios.get('http://localhost:5000/api/reference/sumber-anggaran', {
        headers: { Authorization: `Bearer ${token}` },
      });
      setAllSumberAnggaran(allResponse.data);

      // Load assigned sumber anggaran for this sub kegiatan
      const assignedResponse = await axios.get(
        `http://localhost:5000/api/sub-kegiatan-sumber-anggaran/by-sub-kegiatan/${subKegiatanId}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      // Extract the id_sumber from sumberAnggaran relation (not id_sumber_anggaran!)
      const assigned = assignedResponse.data.data
        .map((item: any) => item.sumberAnggaran?.id_sumber)
        .filter((id: any) => id !== undefined);
      setSelectedKeys(assigned);
    } catch (error: any) {
      console.error('Error loading sumber anggaran:', error);
      message.error('Gagal memuat data sumber anggaran');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!token || !subKegiatanId) return;

    setSaving(true);
    try {
      await axios.post(
        'http://localhost:5000/api/sub-kegiatan-sumber-anggaran/bulk',
        {
          id_sub_kegiatan: subKegiatanId,
          sumber_anggaran_ids: selectedKeys,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      message.success('sumber anggaran berhasil diperbarui');
      onSuccess();
      onClose();
    } catch (error: any) {
      console.error('Error saving sumber anggaran:', error);
      message.error(error.response?.data?.message || 'Gagal menyimpan sumber anggaran');
    } finally {
      setSaving(false);
    }
  };

  const handleChange = (targetKeys: React.Key[]) => {
    setSelectedKeys(targetKeys.map((key) => parseInt(key.toString())));
  };

  return (
    <Modal
      title={`Kelola sumber anggaran: ${subKegiatanName}`}
      open={visible}
      onOk={handleSave}
      onCancel={onClose}
      confirmLoading={saving}
      width={700}
      okText="Simpan"
      cancelText="Batal"
    >
      <Spin spinning={loading}>
        <div style={{ marginBottom: 16 }}>
          <p>
            Pilih sumber anggaran yang tersedia untuk sub kegiatan ini. Puskesmas hanya bisa
            memilih dari sumber anggaran yang telah Anda assign di sini.
          </p>
        </div>
        <Transfer
          dataSource={allSumberAnggaran
            .filter((item) => item.value && item.label)
            .map((item) => ({
              key: item.value.toString(),
              title: item.label,
            }))}
          titles={['Tersedia', 'Dipilih']}
          targetKeys={selectedKeys.filter((key) => key).map((key) => key.toString())}
          onChange={handleChange}
          render={(item) => item.title}
          listStyle={{
            width: 300,
            height: 400,
          }}
          showSearch
          filterOption={(inputValue, item) =>
            item.title?.toLowerCase().includes(inputValue.toLowerCase()) || false
          }
        />
      </Spin>
    </Modal>
  );
};
