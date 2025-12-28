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
import API_BASE_URL from '../config/api';
import { useAuthStore } from '../store/authStore';

const { Title, Text } = Typography;
const { TextArea } = Input;

interface LaporanRow {
  id_sub_kegiatan: number;
  kode_sub: string;
  kegiatan: string;
  indikator_kinerja: string;
  id_kegiatan: number;
  
  // Form fields
  id_sumber_anggaran?: number;
  id_satuan?: number; // Read-only dari admin target
  target_k?: number; // Read-only dari admin
  target_rp?: number; // Read-only dari admin
  target_angkas?: number; // Read-only dari admin - kumulatif angkas
  angkas?: number;
  realisasi_k?: number;
  realisasi_rp?: number;
  realisasi_fisik?: number;
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
  const [filterBulan, setFilterBulan] = useState<string | undefined>(undefined);
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
        axios.get(`${API_BASE_URL}/reference/sumber-anggaran`, config),
        axios.get(`${API_BASE_URL}/reference/satuan`, config),
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

      // Get bulan index for angkas query (1-12)
      const bulanIndex = bulanOptions.findIndex(b => b.value === filterBulan) + 1;

      // Load sub kegiatan yang punya target di tahun ini
      const [assignmentsRes, laporanRes, angkasRes] = await Promise.all([
        axios.get(
          `${API_BASE_URL}/target/assigned?tahun=${filterTahun}`,
          config
        ),
        axios.get(`${API_BASE_URL}/laporan`, {
          headers: { Authorization: `Bearer ${token}` },
          params: { bulan: filterBulan, tahun: filterTahun, limit: 1000 },
        }),
        axios.get(`${API_BASE_URL}/angkas/by-sub-kegiatan`, {
          headers: { Authorization: `Bearer ${token}` },
          params: { tahun: filterTahun, bulan: bulanIndex },
        }).catch(() => ({ data: { data: [] } })), // Fallback jika belum ada data angkas
      ]);

      console.log('🔍 Target assigned response:', assignmentsRes.data);
      console.log('📊 Angkas response:', angkasRes.data);

      const existingLaporan = Array.isArray(laporanRes.data.data)
        ? laporanRes.data.data
        : Array.isArray(laporanRes.data)
        ? laporanRes.data
        : [];

      // Create map of angkas by sub_kegiatan ONLY (not sumber_anggaran)
      // PDF angkas may have different sumber_anggaran than targets
      const angkasMap = new Map<number, number>();
      if (angkasRes.data.data) {
        for (const item of angkasRes.data.data) {
          angkasMap.set(item.id_sub_kegiatan, item.target_angkas || 0);
        }
      }

      // Map target data to rows (NEW FORMAT)
      const targetData = assignmentsRes.data.data || [];
      console.log('📊 Target data:', targetData);
      
      const mappedRows: LaporanRow[] = [];
      
      // For each sub kegiatan with targets
      for (const item of targetData) {
        const subKegiatan = item.subKegiatan;
        const targets = item.targets || [];
        
        if (targets.length === 0) continue; // Skip jika tidak ada target
        
        const subKegiatanId = subKegiatan.id_sub_kegiatan;
        
        // Create one row for each target (each sumber anggaran)
        targets.forEach((target: any) => {
          const idSumberAnggaran = target.id_sumber_anggaran;
          
          // Find existing laporan for this sub kegiatan + sumber anggaran combo
          const existing = existingLaporan.find(
            (l: any) => 
              l.id_sub_kegiatan === subKegiatanId && 
              l.id_sumber_anggaran === idSumberAnggaran
          );

          // Get target_angkas from map (by sub_kegiatan only, not sumber_anggaran)
          const targetAngkas = angkasMap.get(subKegiatanId) || 0;

          mappedRows.push({
            id_sub_kegiatan: subKegiatanId,
            kode_sub: subKegiatan.kode_sub,
            kegiatan: subKegiatan.kegiatan,
            indikator_kinerja: subKegiatan.indikator_kinerja,
            id_kegiatan: 0,
            
            // Pre-fill sumber anggaran (readonly, dari target)
            id_sumber_anggaran: idSumberAnggaran,
            
            // Target dan satuan dari admin (READ-ONLY)
            target_k: target.target_k,
            target_rp: target.target_rp,
            target_angkas: targetAngkas,
            id_satuan: target.id_satuan,
            
            // Populate with existing data if available
            laporan_id: existing?.id,
            status: existing?.status,
            angkas: existing?.angkas ? Number(existing.angkas) : undefined,
            realisasi_k: existing?.realisasi_k ? Number(existing.realisasi_k) : undefined,
            realisasi_rp: existing?.realisasi_rp ? Number(existing.realisasi_rp) : undefined,
            realisasi_fisik: existing?.realisasi_fisik ? Number(existing.realisasi_fisik) : undefined,
            permasalahan: existing?.permasalahan || '',
            upaya: existing?.upaya || '',
          });
        });
      }

      setRows(mappedRows);
    } catch (error: any) {
      console.error('Error loading data:', error);
      message.error(error.response?.data?.message || 'Gagal memuat data');
    } finally {
      setLoading(false);
    }
  };

  const handleFieldChange = (id_sub_kegiatan: number, id_sumber_anggaran: number, field: string, value: any) => {
    setRows((prevRows) =>
      prevRows.map((row) =>
        row.id_sub_kegiatan === id_sub_kegiatan && row.id_sumber_anggaran === id_sumber_anggaran
          ? { ...row, [field]: value }
          : row
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

      // Prepare laporan array for bulk upsert
      const laporanArray = rows
        .filter((row) => row.id_sumber_anggaran && row.id_satuan)
        .map((row) => ({
          id: row.laporan_id, // Include ID for update detection
          id_kegiatan: row.id_kegiatan,
          id_sub_kegiatan: row.id_sub_kegiatan,
          id_sumber_anggaran: row.id_sumber_anggaran,
          id_satuan: row.id_satuan,
          target_k: row.target_k || 0,
          angkas: row.angkas || 0,
          target_rp: row.target_rp || 0,
          realisasi_k: row.realisasi_k || 0,
          realisasi_rp: row.realisasi_rp || 0,
          realisasi_fisik: row.realisasi_fisik || 0,
          permasalahan: row.permasalahan || '',
          upaya: row.upaya || '',
          bulan: filterBulan,
          tahun: filterTahun,
        }));

      // Use optimized bulk-upsert endpoint (single transaction)
      const response = await axios.post(
        `${API_BASE_URL}/laporan/bulk-upsert`,
        { laporanArray },
        config
      );

      const { results } = response.data;
      message.success(
        `Berhasil: ${results.created} dibuat, ${results.updated} diupdate${
          results.skipped > 0 ? `, ${results.skipped} dilewati` : ''
        }`
      );
      
      if (results.errors?.length > 0) {
        console.warn('Errors during save:', results.errors);
      }
      
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
        `${API_BASE_URL}/laporan/submit`,
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
      sorter: (a, b) => a.kode_sub.localeCompare(b.kode_sub),
    },
    {
      title: 'Sub Kegiatan',
      dataIndex: 'kegiatan',
      key: 'kegiatan',
      width: 250,
      sorter: (a, b) => a.kegiatan.localeCompare(b.kegiatan),
    },
    {
      title: 'Indikator Kinerja',
      dataIndex: 'indikator_kinerja',
      key: 'indikator_kinerja',
      width: 250,
      render: (text: string) => (
        <div style={{ whiteSpace: 'pre-wrap' }}>{text}</div>
      ),
      sorter: (a, b) => a.indikator_kinerja.localeCompare(b.indikator_kinerja),
    },
    {
      title: 'Sumber Anggaran',
      key: 'id_sumber_anggaran',
      width: 150,
      render: (_: any, record: LaporanRow) => {
        const sumberAnggaran = referenceData.sumberAnggaran.find(
          (sa) => sa.value === record.id_sumber_anggaran
        );
        return (
          <Tag color="blue">
            {sumberAnggaran?.label || 'N/A'}
          </Tag>
        );
      },
      sorter: (a, b) => (a.id_sumber_anggaran || 0) - (b.id_sumber_anggaran || 0),
    },
    {
      title: 'Target (K)',
      key: 'target_k',
      width: 120,
      sorter: (a, b) => (a.target_k || 0) - (b.target_k || 0),
      render: (_: any, record: LaporanRow) => (
        <div style={{ textAlign: 'right' }}>
          {(record.target_k || 0).toLocaleString('id-ID')}
        </div>
      ),
    },
    {
      title: 'Satuan',
      key: 'id_satuan',
      width: 120,
      render: (_: any, record: LaporanRow) => {
        const satuan = referenceData.satuan.find((s) => s.value === record.id_satuan);
        return (
          <div style={{ textAlign: 'center' }}>
            {satuan?.label || '-'}
          </div>
        );
      },
    },
    {
      title: 'Realisasi Angkas (Rp)',
      key: 'angkas',
      width: 150,
      sorter: (a, b) => (a.angkas || 0) - (b.angkas || 0),
      render: (_: any, record: LaporanRow) => (
        <InputNumber
          style={{ width: '100%' }}
          value={record.angkas}
          onChange={(value) =>
            handleFieldChange(record.id_sub_kegiatan, record.id_sumber_anggaran!, 'angkas', value)
          }
          min={0}
          max={record.target_angkas || undefined} // Cannot exceed target_angkas
          step={1}
          controls={false}
          formatter={(value) => {
            if (!value) return '0';
            return `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
          }}
          parser={(value) => {
            const parsed = value?.replace(/\./g, '');
            return parsed ? Number(parsed) : 0;
          }}
          disabled={record.status === 'terkirim'}
        />
      ),
    },
    {
      title: 'Target Pagu (Rp)',
      key: 'target_rp',
      width: 150,
      sorter: (a, b) => (a.target_rp || 0) - (b.target_rp || 0),
      render: (_: any, record: LaporanRow) => (
        <div style={{ textAlign: 'right' }}>
          {(record.target_rp || 0).toLocaleString('id-ID')}
        </div>
      ),
    },
    {
      title: 'Target Angkas (Rp)',
      key: 'target_angkas',
      width: 150,
      sorter: (a, b) => (a.target_angkas || 0) - (b.target_angkas || 0),
      render: (_: any, record: LaporanRow) => (
        <div style={{ textAlign: 'right', color: record.target_angkas ? '#1890ff' : '#999' }}>
          {(record.target_angkas || 0).toLocaleString('id-ID')}
        </div>
      ),
    },
    {
      title: 'Realisasi (K)',
      key: 'realisasi_k',
      width: 120,
      sorter: (a, b) => (a.realisasi_k || 0) - (b.realisasi_k || 0),
      render: (_: any, record: LaporanRow) => (
        <InputNumber
          style={{ width: '100%' }}
          value={record.realisasi_k}
          onChange={(value) =>
            handleFieldChange(record.id_sub_kegiatan, record.id_sumber_anggaran!, 'realisasi_k', value)
          }
          min={0}
          step={1}
          controls={false}
          formatter={(value) => {
            if (!value) return '0';
            return `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
          }}
          parser={(value) => {
            const parsed = value?.replace(/\./g, '');
            return parsed ? Number(parsed) : 0;
          }}
          disabled={record.status === 'terkirim'}
        />
      ),
    },
    {
      title: 'Realisasi (Rp)',
      key: 'realisasi_rp',
      width: 150,
      sorter: (a, b) => (a.realisasi_rp || 0) - (b.realisasi_rp || 0),
      render: (_: any, record: LaporanRow) => (
        <InputNumber
          style={{ width: '100%' }}
          value={record.realisasi_rp}
          onChange={(value) =>
            handleFieldChange(record.id_sub_kegiatan, record.id_sumber_anggaran!, 'realisasi_rp', value)
          }
          min={0}
          max={record.angkas || undefined} // Cannot exceed angkas (realisasi angkas)
          step={1}
          controls={false}
          formatter={(value) => {
            if (!value) return '0';
            return `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
          }}
          parser={(value) => {
            const parsed = value?.replace(/\./g, '');
            return parsed ? Number(parsed) : 0;
          }}
          disabled={record.status === 'terkirim'}
        />
      ),
    },
    {
      title: 'Realisasi Fisik (%)',
      key: 'realisasi_fisik',
      width: 120,
      sorter: (a, b) => (a.realisasi_fisik || 0) - (b.realisasi_fisik || 0),
      render: (_: any, record: LaporanRow) => (
        <InputNumber
          style={{ width: '100%' }}
          value={record.realisasi_fisik}
          onChange={(value) =>
            handleFieldChange(record.id_sub_kegiatan, record.id_sumber_anggaran!, 'realisasi_fisik', value)
          }
          min={0}
          max={100}
          step={0.01}
          controls={false}
          formatter={(value) => `${value}`}
          disabled={record.status === 'terkirim'}
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
            handleFieldChange(record.id_sub_kegiatan, record.id_sumber_anggaran!, 'permasalahan', e.target.value)
          }
          rows={2}
          disabled={record.status === 'terkirim'}
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
            handleFieldChange(record.id_sub_kegiatan, record.id_sumber_anggaran!, 'upaya', e.target.value)
          }
          rows={2}
          disabled={record.status === 'terkirim'}
        />
      ),
    },
    {
      title: 'Status',
      key: 'status',
      width: 120,
      fixed: 'right',
      sorter: (a, b) => (a.status || '').localeCompare(b.status || ''),
      render: (_: any, record: LaporanRow) => {
        if (!record.status) return <Tag>Belum Disimpan</Tag>;
        const color =
          record.status === 'terkirim'
            ? 'processing'
            : record.status === 'tersimpan'
            ? 'default'
            : 'warning';
        
        const label = 
          record.status === 'tersimpan' ? 'Tersimpan' :
          record.status === 'terkirim' ? 'Terkirim' :
          record.status;
        
        return <Tag color={color}>{label}</Tag>;
      },
    },
  ];

  // Check if there are no unsaved records (allow mix of tersimpan and terkirim)
  const canSendReport = rows.length > 0 && rows.every(
    (row) => row.laporan_id && (row.status === 'tersimpan' || row.status === 'terkirim')
  );
  
  // Check if there are unsaved changes (no laporan_id or missing required fields)
  const hasUnsavedChanges = rows.some(
    (row) => !row.laporan_id || (!row.id_sumber_anggaran && !row.id_satuan)
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
              placeholder="Pilih Bulan"
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
                disabled={!canSendReport || hasUnsavedChanges}
              >
                <Button
                  icon={<SendOutlined />}
                  loading={loading}
                  disabled={rows.length === 0 || !canSendReport || hasUnsavedChanges}
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
            {!canSendReport && !hasUnsavedChanges && rows.length > 0 && (
              <div style={{ marginTop: 8 }}>
                <Text type="warning">
                  * Semua laporan harus berstatus "Tersimpan" atau "Terkirim" untuk dapat dikirim ulang
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
              rowKey={(record) => `${record.id_sub_kegiatan}-${record.id_sumber_anggaran}`}
              sticky
              scroll={{ x: 2800, y: 500 }}
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
