// frontend/src/pages/AdminLraUploadPage.tsx
import React, { useState, useEffect, useCallback } from 'react';
import {
  Card, Typography, Upload, Button, Select, InputNumber,
  Table, Alert, Space, Divider, message,
} from 'antd';
import { UploadOutlined, InboxOutlined } from '@ant-design/icons';
import type { UploadFile } from 'antd/es/upload/interface';
import type { ColumnsType } from 'antd/es/table';
import axios from 'axios';
import API_BASE_URL from '../config/api';
import { useAuthStore } from '../store/authStore';

const { Title, Text } = Typography;
const { Dragger } = Upload;

const BULAN_OPTIONS = [
  'Januari','Februari','Maret','April','Mei','Juni',
  'Juli','Agustus','September','Oktober','November','Desember',
].map(b => ({ value: b, label: b }));

interface PreviewResult {
  bulan: string;
  tahun: number;
  bulanDetectedFromFilename: boolean;
  matchedCount: number;
  unmatchedPuskesmas: string[];
  unmatchedSubKegiatan: string[];
  unmatchedSumber: string[];
}

interface BatchRecord {
  id: string;
  filename: string;
  bulan: string;
  tahun: number;
  row_count: number;
  created_at: string;
  uploader?: { nama: string };
}

const AdminLraUploadPage: React.FC = () => {
  const token = useAuthStore(s => s.token);
  const [fileList, setFileList] = useState<UploadFile[]>([]);
  const [bulan, setBulan] = useState<string | undefined>();
  const [tahun, setTahun] = useState<number | undefined>();
  const [preview, setPreview] = useState<PreviewResult | null>(null);
  const [previewing, setPreviewing] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [batches, setBatches] = useState<BatchRecord[]>([]);
  const [loadingBatches, setLoadingBatches] = useState(false);

  const authConfig = { headers: { Authorization: `Bearer ${token}` } };

  const loadBatches = useCallback(async () => {
    setLoadingBatches(true);
    try {
      const res = await axios.get(`${API_BASE_URL}/lra/batches`, authConfig);
      setBatches(res.data);
    } catch {
      // ignore
    } finally {
      setLoadingBatches(false);
    }
  }, [token]);

  useEffect(() => { loadBatches(); }, [loadBatches]);

  const buildFormData = () => {
    const fd = new FormData();
    // fileList[0] is an RcFile (extends File) stored directly from beforeUpload;
    // originFileObj is only set on the UploadFile wrapper, not on the raw RcFile,
    // so use the file object itself which IS a File.
    const file = (fileList[0].originFileObj ?? fileList[0]) as unknown as File;
    fd.append('file', file);
    if (bulan) fd.append('bulan', bulan);
    if (tahun) fd.append('tahun', String(tahun));
    return fd;
  };

  const handlePreview = async () => {
    if (!fileList[0]) { message.warning('Pilih file terlebih dahulu'); return; }
    setPreviewing(true);
    setPreview(null);
    try {
      const res = await axios.post(`${API_BASE_URL}/lra/preview`, buildFormData(), authConfig);
      setPreview(res.data);
      if (!bulan) setBulan(res.data.bulan);
      if (!tahun) setTahun(res.data.tahun);
    } catch (e: any) {
      message.error(e.response?.data?.error || 'Gagal preview file');
    } finally {
      setPreviewing(false);
    }
  };

  const handleConfirm = async () => {
    if (!fileList[0] || !preview) return;
    setConfirming(true);
    try {
      const res = await axios.post(`${API_BASE_URL}/lra/confirm`, buildFormData(), authConfig);
      message.success(`Berhasil menyimpan ${res.data.rowCount} baris data LRA`);
      setFileList([]);
      setPreview(null);
      setBulan(undefined);
      setTahun(undefined);
      loadBatches();
    } catch (e: any) {
      message.error(e.response?.data?.error || 'Gagal menyimpan data LRA');
    } finally {
      setConfirming(false);
    }
  };

  const batchColumns: ColumnsType<BatchRecord> = [
    { title: 'File', dataIndex: 'filename', ellipsis: true },
    { title: 'Bulan', dataIndex: 'bulan', width: 100 },
    { title: 'Tahun', dataIndex: 'tahun', width: 80 },
    { title: 'Baris', dataIndex: 'row_count', width: 80 },
    { title: 'Diupload oleh', dataIndex: ['uploader', 'nama'], width: 150 },
    {
      title: 'Tanggal',
      dataIndex: 'created_at',
      width: 160,
      render: (v: string) => new Date(v).toLocaleString('id-ID'),
    },
  ];

  return (
    <div style={{ maxWidth: 900, margin: '0 auto', padding: '24px 16px' }}>
      <Title level={3}>Upload LRA Realisasi Anggaran</Title>
      <Text type="secondary">
        Upload file LRA Excel bulanan dari SiRDA/SIPD. Realisasi anggaran akan otomatis terisi di form laporan puskesmas.
      </Text>

      <Card style={{ marginTop: 24 }}>
        <Dragger
          accept=".xlsx"
          fileList={fileList}
          beforeUpload={file => { setFileList([file as any]); setPreview(null); return false; }}
          onRemove={() => { setFileList([]); setPreview(null); }}
          maxCount={1}
        >
          <p className="ant-upload-drag-icon"><InboxOutlined /></p>
          <p className="ant-upload-text">Klik atau drag file .xlsx ke sini</p>
          <p className="ant-upload-hint">Format: LRA SUB KEG DINKES DD BULAN YYYY.xlsx</p>
        </Dragger>

        <Space style={{ marginTop: 16 }} wrap>
          <Select
            placeholder="Bulan (opsional — auto-detect dari nama file)"
            value={bulan}
            onChange={setBulan}
            options={BULAN_OPTIONS}
            style={{ width: 280 }}
            allowClear
          />
          <InputNumber
            placeholder="Tahun"
            value={tahun}
            onChange={v => setTahun(v ?? undefined)}
            style={{ width: 100 }}
            min={2020}
            max={2099}
          />
          <Button
            type="default"
            icon={<UploadOutlined />}
            onClick={handlePreview}
            loading={previewing}
            disabled={!fileList[0]}
          >
            Preview
          </Button>
        </Space>

        {preview && (
          <>
            <Divider />
            <Alert
              type="info"
              message={`Bulan: ${preview.bulan} ${preview.tahun}${preview.bulanDetectedFromFilename ? ' (terdeteksi dari nama file)' : ''}`}
              description={`${preview.matchedCount} baris berhasil dicocokkan`}
              showIcon
              style={{ marginBottom: 12 }}
            />
            {preview.unmatchedPuskesmas.length > 0 && (
              <Alert
                type="warning"
                message={`${preview.unmatchedPuskesmas.length} kode puskesmas tidak dikenali`}
                description={preview.unmatchedPuskesmas.join(', ')}
                showIcon
                style={{ marginBottom: 8 }}
              />
            )}
            {preview.unmatchedSubKegiatan.length > 0 && (
              <Alert
                type="warning"
                message={`${preview.unmatchedSubKegiatan.length} kode sub kegiatan tidak dikenali`}
                description={preview.unmatchedSubKegiatan.join(', ')}
                showIcon
                style={{ marginBottom: 8 }}
              />
            )}
            <Space style={{ marginTop: 16 }}>
              <Button type="primary" onClick={handleConfirm} loading={confirming}>
                Simpan ke Database
              </Button>
              <Button onClick={() => setPreview(null)}>Batal</Button>
            </Space>
          </>
        )}
      </Card>

      <Card style={{ marginTop: 24 }} title="Riwayat Upload">
        <Table<BatchRecord>
          dataSource={batches}
          columns={batchColumns}
          rowKey="id"
          loading={loadingBatches}
          size="small"
          pagination={{ pageSize: 10 }}
        />
      </Card>
    </div>
  );
};

export default AdminLraUploadPage;
