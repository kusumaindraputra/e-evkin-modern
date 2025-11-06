import React, { useState, useEffect } from 'react';
import {
  Table,
  Button,
  Space,
  Tag,
  Typography,
  Row,
  Col,
  Card,
  Select,
  message,
  InputNumber,
  Input,
  Popconfirm,
} from 'antd';
import {
  SaveOutlined,
  SendOutlined,
  ReloadOutlined,
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import axios from 'axios';
import { useAuthStore } from '../store/authStore';

const { Title, Text } = Typography;
const { TextArea } = Input;

interface SubKegiatanAssignment {
  id_sub_kegiatan: number;
  subKegiatan: {
    id_sub_kegiatan: number;
    kode_sub: string;
    kegiatan: string;
    indikator_kinerja: string;
    kegiatanParent: {
      id_kegiatan: number;
      kode: string;
      kegiatan: string;
    };
  };
}

interface LaporanRow {
  id_sub_kegiatan: number;
  kode_sub: string;
  kegiatan: string;
  indikator_kinerja: string;
  id_kegiatan: number;
  kegiatan_parent: string;
  
  // Form fields
  id_sumber_anggaran?: number;
  id_satuan?: number;
  target_k?: number;
  angkas?: number;
  target_rp?: number;
  realisasi_k?: number;
  realisasi_rp?: number;
  permasalahan?: string;
  upaya?: string;
  
  // Existing laporan data
  laporan_id?: string;
  status?: string;
}

interface ReferenceData {
  sumberAnggaran: Array<{ value: number; label: string }>;
  satuan: Array<{ value: number; label: string }>;
}

export const LaporanBulkInputPage: React.FC = () => {
  const { user, token } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [rows, setRows] = useState<LaporanRow[]>([]);
  const [referenceData, setReferenceData] = useState<ReferenceData>({
    sumberAnggaran: [],
    satuan: [],
  });
  
  // Filters
  const [filterBulan, setFilterBulan] = useState<string>('');
  const [filterTahun, setFilterTahun] = useState<number>(new Date().getFullYear());

  const bulanOptions = [
    { value: 'Januari', label: 'Januari' },
    { value: 'Februari', label: 'Februari' },
    { value: 'Maret', label: 'Maret' },
    { value: 'April', label: 'April' },
    { value: 'Mei', label: 'Mei' },
    { value: 'Juni', label: 'Juni' },
    { value: 'Juli', label: 'Juli' },
    { value: 'Agustus', label: 'Agustus' },
    { value: 'September', label: 'September' },
    { value: 'Oktober', label: 'Oktober' },
    { value: 'November', label: 'November' },
    { value: 'Desember', label: 'Desember' },
  ];

  const tahunOptions = Array.from({ length: 5 }, (_, i) => {
    const year = new Date().getFullYear() - i;
    return { value: year, label: year.toString() };
  });

  useEffect(() => {
    loadReferenceData();
  }, []);

  useEffect(() => {
    if (filterBulan && filterTahun) {
      loadData();
    }
  }, [filterBulan, filterTahun]);

  const loadReferenceData = async () => {
    try {
      const config = { headers: { Authorization: `Bearer ${token}` } };

      const [sumberAnggaranRes, satuanRes] = await Promise.all([
        axios.get('http://localhost:5000/api/reference/sumber-anggaran', config),
        axios.get('http://localhost:5000/api/reference/satuan', config),
      ]);

      setReferenceData({
        sumberAnggaran: sumberAnggaranRes.data,
        satuan: satuanRes.data,
      });
    } catch (error) {
      console.error('Failed to load reference data:', error);
      message.error('Gagal memuat data referensi');
    }
  };

  const loadData = async () => {
    if (!user || !filterBulan || !filterTahun) return;

    setLoading(true);
    try {
      const config = { headers: { Authorization: `Bearer ${token}` } };

      // Load assigned sub kegiatan
      const assignmentsRes = await axios.get(
        `http://localhost:5000/api/puskesmas-config/puskesmas/${user.id}/sub-kegiatan`,
        config
      );

      // Load existing laporan for this month
      const laporanRes = await axios.get('http://localhost:5000/api/laporan', {
        headers: { Authorization: `Bearer ${token}` },
        params: { bulan: filterBulan, tahun: filterTahun, limit: 1000 },
      });

      const existingLaporan = Array.isArray(laporanRes.data.data)
        ? laporanRes.data.data
        : Array.isArray(laporanRes.data)
        ? laporanRes.data
        : [];

      // Map assignments to rows
      const assignments: SubKegiatanAssignment[] = assignmentsRes.data.assignments || [];
      const mappedRows: LaporanRow[] = assignments.map((assignment) => {
        const existing = existingLaporan.find(
          (l: any) => l.id_sub_kegiatan === assignment.subKegiatan.id_sub_kegiatan
        );

        return {
          id_sub_kegiatan: assignment.subKegiatan.id_sub_kegiatan,
          kode_sub: assignment.subKegiatan.kode_sub,
          kegiatan: assignment.subKegiatan.kegiatan,
          indikator_kinerja: assignment.subKegiatan.indikator_kinerja,
          id_kegiatan: assignment.subKegiatan.kegiatanParent?.id_kegiatan || 0,
          kegiatan_parent: assignment.subKegiatan.kegiatanParent?.kegiatan || '',
          
          // Populate with existing data if available
          laporan_id: existing?.id,
          status: existing?.status,
          id_sumber_anggaran: existing?.id_sumber_anggaran,
          id_satuan: existing?.id_satuan,
          target_k: existing?.target_k,
          angkas: existing?.angkas,
          target_rp: existing?.target_rp,
          realisasi_k: existing?.realisasi_k,
          realisasi_rp: existing?.realisasi_rp,
          permasalahan: existing?.permasalahan || '',
          upaya: existing?.upaya || '',
        };
      });

      setRows(mappedRows);
    } catch (error: any) {
      console.error('Error loading data:', error);
      message.error(error.response?.data?.message || 'Gagal memuat data');
    } finally {
      setLoading(false);
    }
  };

  const handleFieldChange = (id_sub_kegiatan: number, field: string, value: any) => {
    setRows((prevRows) =>
      prevRows.map((row) =>
        row.id_sub_kegiatan === id_sub_kegiatan ? { ...row, [field]: value } : row
      )
    );
  };

  const handleSave = async () => {
    if (!filterBulan || !filterTahun) {
      message.warning('Pilih bulan dan tahun terlebih dahulu');
      return;
    }

    // Validate: check if at least one row has data
    const hasData = rows.some(
      (row) =>
        row.id_sumber_anggaran ||
        row.id_satuan ||
        row.target_k ||
        row.realisasi_k
    );

    if (!hasData) {
      message.warning('Isi minimal satu baris data');
      return;
    }

    setLoading(true);
    try {
      const config = { headers: { Authorization: `Bearer ${token}` } };

      // Save each row (create or update)
      const promises = rows
        .filter(
          (row) =>
            row.id_sumber_anggaran && row.id_satuan // At minimum need these fields
        )
        .map((row) => {
          const payload = {
            id_kegiatan: row.id_kegiatan,
            id_sub_kegiatan: row.id_sub_kegiatan,
            id_sumber_anggaran: row.id_sumber_anggaran,
            id_satuan: row.id_satuan,
            target_k: row.target_k || 0,
            angkas: row.angkas || 0,
            target_rp: row.target_rp || 0,
            realisasi_k: row.realisasi_k || 0,
            realisasi_rp: row.realisasi_rp || 0,
            permasalahan: row.permasalahan || '',
            upaya: row.upaya || '',
            bulan: filterBulan,
            tahun: filterTahun,
          };

          if (row.laporan_id) {
            // Update existing
            return axios.put(
              `http://localhost:5000/api/laporan/${row.laporan_id}`,
              payload,
              config
            );
          } else {
            // Create new
            return axios.post('http://localhost:5000/api/laporan', payload, config);
          }
        });

      await Promise.all(promises);
      message.success(`Berhasil menyimpan ${promises.length} laporan`);
      loadData(); // Reload to get updated data
    } catch (error: any) {
      console.error('Error saving:', error);
      message.error(error.response?.data?.message || 'Gagal menyimpan laporan');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!filterBulan || !filterTahun) {
      message.warning('Pilih bulan dan tahun terlebih dahulu');
      return;
    }

    setLoading(true);
    try {
      const config = { headers: { Authorization: `Bearer ${token}` } };
      await axios.post(
        'http://localhost:5000/api/laporan/submit',
        { bulan: filterBulan, tahun: filterTahun },
        config
      );
      message.success(`Laporan ${filterBulan} ${filterTahun} berhasil dikirim`);
      loadData();
    } catch (error: any) {
      message.error(error.response?.data?.message || 'Gagal mengirim laporan');
    } finally {
      setLoading(false);
    }
  };

  const formatNumber = (num: number | undefined) => {
    if (num === null || num === undefined) return '';
    return num.toLocaleString('id-ID');
  };

  const columns: ColumnsType<LaporanRow> = [
    {
      title: 'No',
      key: 'no',
      width: 50,
      fixed: 'left',
      render: (_: any, __: any, index: number) => index + 1,
    },
    {
      title: 'Kode',
      dataIndex: 'kode_sub',
      key: 'kode_sub',
      width: 100,
      fixed: 'left',
    },
    {
      title: 'Kegiatan',
      dataIndex: 'kegiatan_parent',
      key: 'kegiatan_parent',
      width: 200,
    },
    {
      title: 'Sub Kegiatan',
      dataIndex: 'kegiatan',
      key: 'kegiatan',
      width: 250,
    },
    {
      title: 'Indikator Kinerja',
      dataIndex: 'indikator_kinerja',
      key: 'indikator_kinerja',
      width: 250,
      render: (text: string) => (
        <div style={{ whiteSpace: 'pre-wrap' }}>{text}</div>
      ),
    },
    {
      title: 'Sumber Anggaran',
      key: 'id_sumber_anggaran',
      width: 150,
      render: (_: any, record: LaporanRow) => (
        <Select
          style={{ width: '100%' }}
          value={record.id_sumber_anggaran}
          onChange={(value) =>
            handleFieldChange(record.id_sub_kegiatan, 'id_sumber_anggaran', value)
          }
          options={referenceData.sumberAnggaran}
          placeholder="Pilih"
          disabled={record.status === 'terkirim' || record.status === 'diverifikasi'}
        />
      ),
    },
    {
      title: 'Satuan',
      key: 'id_satuan',
      width: 120,
      render: (_: any, record: LaporanRow) => (
        <Select
          style={{ width: '100%' }}
          value={record.id_satuan}
          onChange={(value) =>
            handleFieldChange(record.id_sub_kegiatan, 'id_satuan', value)
          }
          options={referenceData.satuan}
          placeholder="Pilih"
          disabled={record.status === 'terkirim' || record.status === 'diverifikasi'}
        />
      ),
    },
    {
      title: 'Target (K)',
      key: 'target_k',
      width: 120,
      render: (_: any, record: LaporanRow) => (
        <InputNumber
          style={{ width: '100%' }}
          value={record.target_k}
          onChange={(value) =>
            handleFieldChange(record.id_sub_kegiatan, 'target_k', value)
          }
          min={0}
          formatter={(value) => formatNumber(value as number)}
          parser={(value) => value?.replace(/\./g, '') as any}
          disabled={record.status === 'terkirim' || record.status === 'diverifikasi'}
        />
      ),
    },
    {
      title: 'Target Angkas (Rp)',
      key: 'angkas',
      width: 150,
      render: (_: any, record: LaporanRow) => (
        <InputNumber
          style={{ width: '100%' }}
          value={record.angkas}
          onChange={(value) =>
            handleFieldChange(record.id_sub_kegiatan, 'angkas', value)
          }
          min={0}
          formatter={(value) => formatNumber(value as number)}
          parser={(value) => value?.replace(/\./g, '') as any}
          disabled={record.status === 'terkirim' || record.status === 'diverifikasi'}
        />
      ),
    },
    {
      title: 'Target Pagu (Rp)',
      key: 'target_rp',
      width: 150,
      render: (_: any, record: LaporanRow) => (
        <InputNumber
          style={{ width: '100%' }}
          value={record.target_rp}
          onChange={(value) =>
            handleFieldChange(record.id_sub_kegiatan, 'target_rp', value)
          }
          min={0}
          formatter={(value) => formatNumber(value as number)}
          parser={(value) => value?.replace(/\./g, '') as any}
          disabled={record.status === 'terkirim' || record.status === 'diverifikasi'}
        />
      ),
    },
    {
      title: 'Realisasi (K)',
      key: 'realisasi_k',
      width: 120,
      render: (_: any, record: LaporanRow) => (
        <InputNumber
          style={{ width: '100%' }}
          value={record.realisasi_k}
          onChange={(value) =>
            handleFieldChange(record.id_sub_kegiatan, 'realisasi_k', value)
          }
          min={0}
          formatter={(value) => formatNumber(value as number)}
          parser={(value) => value?.replace(/\./g, '') as any}
          disabled={record.status === 'terkirim' || record.status === 'diverifikasi'}
        />
      ),
    },
    {
      title: 'Realisasi (Rp)',
      key: 'realisasi_rp',
      width: 150,
      render: (_: any, record: LaporanRow) => (
        <InputNumber
          style={{ width: '100%' }}
          value={record.realisasi_rp}
          onChange={(value) =>
            handleFieldChange(record.id_sub_kegiatan, 'realisasi_rp', value)
          }
          min={0}
          formatter={(value) => formatNumber(value as number)}
          parser={(value) => value?.replace(/\./g, '') as any}
          disabled={record.status === 'terkirim' || record.status === 'diverifikasi'}
        />
      ),
    },
    {
      title: 'Permasalahan',
      key: 'permasalahan',
      width: 200,
      render: (_: any, record: LaporanRow) => (
        <TextArea
          value={record.permasalahan}
          onChange={(e) =>
            handleFieldChange(record.id_sub_kegiatan, 'permasalahan', e.target.value)
          }
          rows={2}
          disabled={record.status === 'terkirim' || record.status === 'diverifikasi'}
        />
      ),
    },
    {
      title: 'Upaya',
      key: 'upaya',
      width: 200,
      render: (_: any, record: LaporanRow) => (
        <TextArea
          value={record.upaya}
          onChange={(e) =>
            handleFieldChange(record.id_sub_kegiatan, 'upaya', e.target.value)
          }
          rows={2}
          disabled={record.status === 'terkirim' || record.status === 'diverifikasi'}
        />
      ),
    },
    {
      title: 'Status',
      key: 'status',
      width: 120,
      fixed: 'right',
      render: (_: any, record: LaporanRow) => {
        if (!record.status) return <Tag>Belum Disimpan</Tag>;
        const color =
          record.status === 'diverifikasi'
            ? 'success'
            : record.status === 'terkirim'
            ? 'processing'
            : record.status === 'ditolak'
            ? 'error'
            : 'warning';
        return <Tag color={color}>{record.status}</Tag>;
      },
    },
  ];

  const hasUnsavedChanges = rows.some(
    (row) => row.status === 'menunggu' || !row.laporan_id
  );

  return (
    <div>
      <Row justify="space-between" align="middle" style={{ marginBottom: 24 }}>
        <Col>
          <Title level={3}>Laporan Kinerja Bulanan</Title>
          <Text type="secondary">
            Isi laporan untuk semua sub kegiatan yang telah dikonfigurasi
          </Text>
        </Col>
      </Row>

      {/* Filter Section */}
      <Card style={{ marginBottom: 16 }}>
        <Row gutter={[16, 16]} align="middle">
          <Col xs={24} sm={8} md={6}>
            <Text strong>Periode Laporan:</Text>
          </Col>
          <Col xs={24} sm={8} md={6}>
            <Select
              placeholder="Pilih bulan"
              style={{ width: '100%' }}
              value={filterBulan}
              onChange={setFilterBulan}
              options={bulanOptions}
            />
          </Col>
          <Col xs={24} sm={8} md={6}>
            <Select
              placeholder="Pilih tahun"
              style={{ width: '100%' }}
              value={filterTahun}
              onChange={setFilterTahun}
              options={tahunOptions}
            />
          </Col>
          <Col xs={24} sm={8} md={6}>
            <Space>
              <Button icon={<ReloadOutlined />} onClick={loadData} disabled={!filterBulan || !filterTahun}>
                Refresh
              </Button>
            </Space>
          </Col>
        </Row>
      </Card>

      {filterBulan && filterTahun && (
        <>
          {/* Action Buttons */}
          <Card style={{ marginBottom: 16 }}>
            <Space>
              <Button
                type="primary"
                icon={<SaveOutlined />}
                onClick={handleSave}
                loading={loading}
                disabled={rows.length === 0}
              >
                Simpan Laporan
              </Button>
              <Popconfirm
                title="Kirim laporan ini?"
                description="Laporan yang sudah dikirim tidak dapat diubah kecuali ditolak oleh admin"
                onConfirm={handleSubmit}
                okText="Ya, Kirim"
                cancelText="Batal"
                disabled={hasUnsavedChanges}
              >
                <Button
                  icon={<SendOutlined />}
                  loading={loading}
                  disabled={rows.length === 0 || hasUnsavedChanges}
                >
                  Kirim Laporan {filterBulan} {filterTahun}
                </Button>
              </Popconfirm>
            </Space>
            {hasUnsavedChanges && (
              <div style={{ marginTop: 8 }}>
                <Text type="warning">
                  * Simpan terlebih dahulu sebelum mengirim laporan
                </Text>
              </div>
            )}
          </Card>

          {/* Table */}
          <Card>
            <Table
              columns={columns}
              dataSource={rows}
              loading={loading}
              rowKey="id_sub_kegiatan"
              scroll={{ x: 2800 }}
              pagination={false}
              bordered
            />
          </Card>
        </>
      )}

      {!filterBulan || !filterTahun ? (
        <Card>
          <div style={{ textAlign: 'center', padding: '40px 0' }}>
            <Text type="secondary" style={{ fontSize: 16 }}>
              Pilih bulan dan tahun untuk mulai input laporan
            </Text>
          </div>
        </Card>
      ) : null}
    </div>
  );
};

export default LaporanBulkInputPage;
