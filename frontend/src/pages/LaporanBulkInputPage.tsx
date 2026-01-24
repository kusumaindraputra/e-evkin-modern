import React, { useState, useEffect, useCallback, useMemo, memo, useRef } from 'react';
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
import { formatNumber, formatSumberAnggaran } from '../utils/formatters';

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
  target_angkas?: number; // From PDF for single sumber, or manual input for multiple sumber
  realisasi_k?: number;
  realisasi_rp?: number;
  realisasi_fisik?: number;
  permasalahan?: string;
  upaya?: string;

  // Existing laporan data
  laporan_id?: string;
  status?: string;

  // Angkas handling flag
  // true = user must enter target_angkas manually (multiple sumber anggaran per sub kegiatan)
  // false = target_angkas auto-filled from PDF upload (single sumber anggaran)
  isManualAngkas?: boolean;
}

interface ReferenceData {
  sumberAnggaran: Array<{ value: number; label: string }>;
  satuan: Array<{ value: number; label: string }>;
}

// Interface for target data from API
interface TargetData {
  id: number;
  id_sumber_anggaran: number;
  id_satuan: number | null;
  target_k: number;
  target_rp: string | number;
  bulan: string | null;
  tahun: number;
}

// Interface for existing laporan from API
interface ExistingLaporan {
  id: string;
  id_sub_kegiatan: number;
  id_sumber_anggaran: number;
  target_angkas: string | number | null;
  realisasi_k: number;
  realisasi_rp: string | number;
  realisasi_fisik: string | number;
  permasalahan: string;
  upaya: string;
  status: string;
}

// Type for field change values
type FieldChangeValue = string | number | null;

// Memoized render components to prevent re-renders
interface SumberAnggaranCellProps {
  id_sumber_anggaran?: number;
  sumberAnggaran: ReferenceData['sumberAnggaran'];
}

const SumberAnggaranCell = memo(({ id_sumber_anggaran, sumberAnggaran }: SumberAnggaranCellProps) => {
  const sumber = sumberAnggaran.find((sa) => sa.value === id_sumber_anggaran);
  const simplifiedLabel = formatSumberAnggaran(sumber?.label);
  return (
    <div>
      <Tag color="blue" style={{ margin: 0, whiteSpace: 'normal' }}>{simplifiedLabel}</Tag>
    </div>
  );
});
SumberAnggaranCell.displayName = 'SumberAnggaranCell';

interface SatuanCellProps {
  id_satuan?: number;
  satuan: ReferenceData['satuan'];
}

const SatuanCell = memo(({ id_satuan, satuan }: SatuanCellProps) => {
  const satuanItem = satuan.find((s) => s.value === id_satuan);
  return <div style={{ textAlign: 'center' }}>{satuanItem?.label || '-'}</div>;
});
SatuanCell.displayName = 'SatuanCell';

interface RealisasiKInputProps {
  value?: number;
  disabled?: boolean;
  onChange: (value: number | null) => void;
}

const RealisasiKInput = memo(({ value, disabled, onChange }: RealisasiKInputProps) => (
  <InputNumber
    style={{ width: '100%' }}
    value={value}
    onChange={onChange}
    min={0}
    step={1}
    controls={false}
    formatter={(val) => {
      if (!val) return '0';
      return `${val}`.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
    }}
    parser={(val) => {
      const parsed = val?.replace(/\./g, '');
      return parsed ? Number(parsed) : 0;
    }}
    disabled={disabled}
  />
));
RealisasiKInput.displayName = 'RealisasiKInput';

interface RealisasiRpInputProps {
  value?: number;
  maxValue?: number;
  disabled?: boolean;
  onChange: (value: number | null) => void;
}

const RealisasiRpInput = memo(({ value, maxValue, disabled, onChange }: RealisasiRpInputProps) => (
  <InputNumber
    style={{ width: '100%' }}
    value={value}
    onChange={onChange}
    min={0}
    max={maxValue || undefined}
    step={1}
    controls={false}
    formatter={(val) => {
      if (!val) return '0';
      return `${val}`.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
    }}
    parser={(val) => {
      const parsed = val?.replace(/\./g, '');
      return parsed ? Number(parsed) : 0;
    }}
    disabled={disabled}
  />
));
RealisasiRpInput.displayName = 'RealisasiRpInput';

interface RealisasiFisikInputProps {
  value?: number;
  disabled?: boolean;
  onChange: (value: number | null) => void;
}

const RealisasiFisikInput = memo(({ value, disabled, onChange }: RealisasiFisikInputProps) => (
  <InputNumber
    style={{ width: '100%' }}
    value={value}
    onChange={onChange}
    min={0}
    max={100}
    step={0.01}
    controls={false}
    formatter={(val) => `${val}`}
    disabled={disabled}
  />
));
RealisasiFisikInput.displayName = 'RealisasiFisikInput';

interface TextAreaInputProps {
  value?: string;
  disabled?: boolean;
  onChange: (value: string) => void;
}

const TextAreaInput = memo(({ value, disabled, onChange }: TextAreaInputProps) => (
  <TextArea
    value={value}
    onChange={(e) => onChange(e.target.value)}
    rows={2}
    disabled={disabled}
  />
));
TextAreaInput.displayName = 'TextAreaInput';

interface StatusTagProps {
  status?: string;
}

const StatusTag = memo(({ status }: StatusTagProps) => {
  if (!status) return <Tag>Belum Disimpan</Tag>;
  const color =
    status === 'terkirim'
      ? 'processing'
      : status === 'tersimpan'
        ? 'default'
        : 'warning';

  const label =
    status === 'tersimpan'
      ? 'Tersimpan'
      : status === 'terkirim'
        ? 'Terkirim'
        : status;

  return <Tag color={color}>{label}</Tag>;
});
StatusTag.displayName = 'StatusTag';

// Static options moved outside component to prevent re-creation on every render
const BULAN_OPTIONS = [
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

const TAHUN_OPTIONS = Array.from({ length: 5 }, (_, i) => {
  const year = new Date().getFullYear() - i;
  return { value: year, label: year.toString() };
});


export const LaporanBulkInputPage: React.FC = () => {
  // Use individual selectors to prevent unnecessary re-renders
  const user = useAuthStore((state) => state.user);
  const token = useAuthStore((state) => state.token);
  const [loading, setLoading] = useState(false);
  const [rows, setRows] = useState<LaporanRow[]>([]);
  const [referenceData, setReferenceData] = useState<ReferenceData>({
    sumberAnggaran: [],
    satuan: [],
  });

  // Refs to prevent double-loading in React StrictMode
  const referenceDataLoaded = useRef(false);
  const loadDataInProgress = useRef(false);

  // Filters
  const [filterBulan, setFilterBulan] = useState<string | undefined>(undefined);
  const [filterTahun, setFilterTahun] = useState<number>(new Date().getFullYear());

  const loadReferenceData = useCallback(async () => {
    // Skip if already loaded (prevents double-loading in React StrictMode)
    if (referenceDataLoaded.current) return;
    referenceDataLoaded.current = true;

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
      // Reset flag to allow retry on error
      referenceDataLoaded.current = false;
    }
  }, [token]);

  const loadData = useCallback(async () => {
    if (!user || !filterBulan || !filterTahun) return;

    // Prevent concurrent requests (React StrictMode double-invokes effects)
    if (loadDataInProgress.current) return;
    loadDataInProgress.current = true;

    setLoading(true);
    try {
      const config = { headers: { Authorization: `Bearer ${token}` } };

      // Get bulan index for angkas query (1-12)
      const bulanIndex = BULAN_OPTIONS.findIndex(b => b.value === filterBulan) + 1;

      // Load sub kegiatan yang punya target di tahun ini
      // Also load full angkas data (with monthly values per sumber anggaran)
      const [assignmentsRes, laporanRes, angkasRes, angkasFullRes] = await Promise.all([
        axios.get(
          `${API_BASE_URL}/target/assigned?tahun=${filterTahun}`,
          config
        ),
        axios.get(`${API_BASE_URL}/laporan`, {
          headers: { Authorization: `Bearer ${token}` },
          params: { bulan: filterBulan, tahun: filterTahun, limit: 1000 },
        }),
        // For single-sumber: get cumulative angkas by sub_kegiatan
        axios.get(`${API_BASE_URL}/angkas/by-sub-kegiatan`, {
          headers: { Authorization: `Bearer ${token}` },
          params: { tahun: filterTahun, bulan: bulanIndex },
        }).catch(() => ({ data: { data: [] } })),
        // For multi-sumber: get full angkas data by sumber_anggaran with monthly values
        axios.get(`${API_BASE_URL}/angkas`, {
          headers: { Authorization: `Bearer ${token}` },
          params: { tahun: filterTahun },
        }).catch(() => ({ data: { data: [] } })),
      ]);


      const existingLaporan = Array.isArray(laporanRes.data.data)
        ? laporanRes.data.data
        : Array.isArray(laporanRes.data)
          ? laporanRes.data
          : [];

      // Create map of angkas by sub_kegiatan ONLY (for single-sumber sub kegiatan)
      // PDF angkas may have different sumber_anggaran than targets
      const angkasMap = new Map<number, number>();
      if (angkasRes.data.data) {
        for (const item of angkasRes.data.data) {
          angkasMap.set(item.id_sub_kegiatan, item.target_angkas || 0);
        }
      }

      // Create map of angkas by sub_kegiatan + sumber_anggaran (for multi-sumber sub kegiatan)
      // Calculate cumulative angkas from month 1 to selected month
      const angkasFullMap = new Map<string, number>();
      if (angkasFullRes.data?.data) {
        for (const item of angkasFullRes.data.data) {
          const key = `${item.id_sub_kegiatan}-${item.id_sumber_anggaran}`;
          // Sum bulanan values from month 1 to bulanIndex
          const bulanan = item.bulanan || [];
          let cumulative = 0;
          for (let i = 0; i < bulanIndex && i < bulanan.length; i++) {
            cumulative += Number(bulanan[i]) || 0;
          }
          angkasFullMap.set(key, cumulative);
        }
      }

      // Map target data to rows (NEW FORMAT)
      const targetData = assignmentsRes.data.data || [];
      const mappedRows: LaporanRow[] = [];

      // For each sub kegiatan with targets
      for (const item of targetData) {
        const subKegiatan = item.subKegiatan;
        const targets = item.targets || [];

        if (targets.length === 0) continue; // Skip jika tidak ada target

        const subKegiatanId = subKegiatan.id_sub_kegiatan;

        // isManualAngkas from backend: true if multiple sumber anggaran
        // When true, puskesmas must input angkas manually (PDF angkas can't be split)
        // When false, angkas is auto-filled from PDF upload
        const isManualAngkas = item.isManualAngkas || false;

        // Create one row for each target (each sumber anggaran)
        targets.forEach((target: TargetData) => {
          const idSumberAnggaran = target.id_sumber_anggaran;

          // Find existing laporan for this sub kegiatan + sumber anggaran combo
          const existing = existingLaporan.find(
            (l: ExistingLaporan) =>
              l.id_sub_kegiatan === subKegiatanId &&
              l.id_sumber_anggaran === idSumberAnggaran
          );

          // Get target_angkas:
          // - For single sumber: from PDF angkas (by sub_kegiatan only)
          // - For multi sumber: from angkas page (by sub_kegiatan + sumber_anggaran)
          let targetAngkas: number;
          if (isManualAngkas) {
            // Get cumulative angkas from angkas page (per sumber_anggaran)
            const angkasKey = `${subKegiatanId}-${idSumberAnggaran}`;
            targetAngkas = angkasFullMap.get(angkasKey) || 0;
          } else {
            // Auto-fill from PDF angkas (by sub_kegiatan only)
            targetAngkas = angkasMap.get(subKegiatanId) || 0;
          }

          mappedRows.push({
            id_sub_kegiatan: subKegiatanId,
            kode_sub: subKegiatan.kode_sub,
            kegiatan: subKegiatan.kegiatan,
            indikator_kinerja: subKegiatan.indikator_kinerja,
            id_kegiatan: 0,

            // Pre-fill sumber anggaran (readonly, dari target)
            id_sumber_anggaran: idSumberAnggaran,

            // Target dan satuan dari admin (READ-ONLY)
            // Use default satuan (1=Orang) if not set in target
            target_k: target.target_k || 0,
            target_rp: Number(target.target_rp) || 0,
            target_angkas: targetAngkas,
            id_satuan: target.id_satuan || 1, // Default to "Orang" if not set

            // Flag for angkas handling
            isManualAngkas,

            // Populate with existing data if available
            laporan_id: existing?.id,
            status: existing?.status,
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
      loadDataInProgress.current = false;
    }
  }, [user, filterBulan, filterTahun, token]);

  useEffect(() => {
    loadReferenceData();
  }, [loadReferenceData]);

  useEffect(() => {
    if (filterBulan && filterTahun) {
      loadData();
    }
  }, [filterBulan, filterTahun, loadData]);

  const handleFieldChange = useCallback(
    (id_sub_kegiatan: number, id_sumber_anggaran: number, field: string, value: FieldChangeValue) => {
      setRows((prevRows) =>
        prevRows.map((row) =>
          row.id_sub_kegiatan === id_sub_kegiatan && row.id_sumber_anggaran === id_sumber_anggaran
            ? { ...row, [field]: value }
            : row
        )
      );
    },
    []
  );

  const handleSave = useCallback(async () => {
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

    // Warn if multi-sumber sub kegiatan has no angkas data (should be input on angkas page first)
    const rowsToSave = rows.filter((row) => row.id_sumber_anggaran && row.id_satuan);
    const missingAngkas = rowsToSave.filter(
      (row) => row.isManualAngkas && (!row.target_angkas || row.target_angkas <= 0)
    );

    if (missingAngkas.length > 0) {
      const kodeList = [...new Set(missingAngkas.map(r => r.kode_sub))].join(', ');
      message.warning(`Angkas belum diinput untuk: ${kodeList}. Silakan input di halaman Target & Angkas terlebih dahulu.`);
      // Don't block save, just warn - user may want to save other data
    }

    setLoading(true);
    try {
      const config = { headers: { Authorization: `Bearer ${token}` } };

      // Prepare laporan array for bulk upsert
      // target_angkas is not saved - it's always calculated from angkas page data
      // angkas field is set to target_angkas value (angkas = how much can be spent this month)
      const laporanArray = rowsToSave
        .map((row) => ({
          id: row.laporan_id, // Include ID for update detection
          id_kegiatan: row.id_kegiatan,
          id_sub_kegiatan: row.id_sub_kegiatan,
          id_sumber_anggaran: row.id_sumber_anggaran,
          id_satuan: row.id_satuan,
          target_k: row.target_k || 0,
          angkas: row.target_angkas || 0, // angkas = target_angkas (how much can be spent)
          target_rp: row.target_rp || 0,
          // target_angkas no longer saved - pulled from angkas page
          target_angkas: null,
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
        `Berhasil: ${results.created} dibuat, ${results.updated} diupdate${results.skipped > 0 ? `, ${results.skipped} dilewati` : ''
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
  }, [filterBulan, filterTahun, rows, token, loadData]);

  const handleSubmit = useCallback(async () => {
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
  }, [filterBulan, filterTahun, token, loadData]);

  // Stable filter handlers
  const handleFilterBulanChange = useCallback((value: string) => {
    setFilterBulan(value);
  }, []);

  const handleFilterTahunChange = useCallback((value: number) => {
    setFilterTahun(value);
  }, []);

  const columns: ColumnsType<LaporanRow> = useMemo(
    () => [
      {
        title: 'No',
        key: 'no',
        width: 50,
        align: 'center',
        fixed: 'left' as const,
        render: (_: any, __: any, index: number) => index + 1,
      },
      {
        title: 'Sub Kegiatan',
        key: 'sub_kegiatan',
        width: 320,
        fixed: 'left' as const,
        render: (_: any, record: LaporanRow) => {
          const sumber = referenceData.sumberAnggaran.find((sa) => sa.value === record.id_sumber_anggaran);
          const simplifiedSumber = formatSumberAnggaran(sumber?.label);
          return (
            <div>
              <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                <Tag color="blue">{record.kode_sub}</Tag>
                <Tag color="green">{simplifiedSumber}</Tag>
              </div>
              <div style={{ marginTop: 4 }}>{record.kegiatan}</div>
            </div>
          );
        },
        sorter: (a, b) => a.kode_sub.localeCompare(b.kode_sub),
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
      // Column order: Target Anggaran, Target Angkas, Realisasi (Rp), Target (K), Satuan, Realisasi (K)
      {
        title: 'Target Anggaran (Rp)',
        key: 'target_rp',
        width: 160,
        sorter: (a, b) => (a.target_rp || 0) - (b.target_rp || 0),
        render: (_: any, record: LaporanRow) => (
          <div style={{ textAlign: 'right' }}>
            {formatNumber(record.target_rp || 0)}
          </div>
        ),
      },
      {
        title: 'Target Angkas (Rp)',
        key: 'target_angkas',
        width: 150,
        sorter: (a, b) => (a.target_angkas || 0) - (b.target_angkas || 0),
        render: (_: any, record: LaporanRow) => {
          // Target angkas is always read-only on laporan page
          // - For single sumber: from PDF upload
          // - For multi sumber: from angkas page (manual input there)
          const hasAngkas = record.target_angkas && record.target_angkas > 0;
          return (
            <div style={{ textAlign: 'right' }}>
              {formatNumber(record.target_angkas || 0)}
              {record.isManualAngkas && !hasAngkas && (
                <div style={{ fontSize: '10px', color: '#fa8c16' }}>Belum diinput</div>
              )}
            </div>
          );
        },
      },
      {
        title: 'Realisasi (Rp)',
        key: 'realisasi_rp',
        width: 150,
        sorter: (a, b) => (a.realisasi_rp || 0) - (b.realisasi_rp || 0),
        render: (_: any, record: LaporanRow) => (
          <RealisasiRpInput
            value={record.realisasi_rp}
            maxValue={record.target_angkas}
            disabled={record.status === 'terkirim'}
            onChange={(value) =>
              handleFieldChange(record.id_sub_kegiatan, record.id_sumber_anggaran!, 'realisasi_rp', value)
            }
          />
        ),
      },
      {
        title: 'Target (K)',
        key: 'target_k',
        width: 120,
        sorter: (a, b) => (a.target_k || 0) - (b.target_k || 0),
        render: (_: any, record: LaporanRow) => (
          <div style={{ textAlign: 'right' }}>
            {formatNumber(record.target_k || 0)}
          </div>
        ),
      },
      {
        title: 'Satuan',
        key: 'id_satuan',
        width: 120,
        render: (_: any, record: LaporanRow) => (
          <SatuanCell id_satuan={record.id_satuan} satuan={referenceData.satuan} />
        ),
      },
      {
        title: 'Realisasi (K)',
        key: 'realisasi_k',
        width: 120,
        sorter: (a, b) => (a.realisasi_k || 0) - (b.realisasi_k || 0),
        render: (_: any, record: LaporanRow) => (
          <RealisasiKInput
            value={record.realisasi_k}
            disabled={record.status === 'terkirim'}
            onChange={(value) =>
              handleFieldChange(record.id_sub_kegiatan, record.id_sumber_anggaran!, 'realisasi_k', value)
            }
          />
        ),
      },
      {
        title: 'Realisasi Fisik (%)',
        key: 'realisasi_fisik',
        width: 120,
        sorter: (a, b) => (a.realisasi_fisik || 0) - (b.realisasi_fisik || 0),
        render: (_: any, record: LaporanRow) => (
          <RealisasiFisikInput
            value={record.realisasi_fisik}
            disabled={record.status === 'terkirim'}
            onChange={(value) =>
              handleFieldChange(record.id_sub_kegiatan, record.id_sumber_anggaran!, 'realisasi_fisik', value)
            }
          />
        ),
      },
      {
        title: 'Permasalahan',
        key: 'permasalahan',
        width: 200,
        render: (_: any, record: LaporanRow) => (
          <TextAreaInput
            value={record.permasalahan}
            disabled={record.status === 'terkirim'}
            onChange={(value) =>
              handleFieldChange(record.id_sub_kegiatan, record.id_sumber_anggaran!, 'permasalahan', value)
            }
          />
        ),
      },
      {
        title: 'Upaya',
        key: 'upaya',
        width: 200,
        render: (_: any, record: LaporanRow) => (
          <TextAreaInput
            value={record.upaya}
            disabled={record.status === 'terkirim'}
            onChange={(value) =>
              handleFieldChange(record.id_sub_kegiatan, record.id_sumber_anggaran!, 'upaya', value)
            }
          />
        ),
      },
      {
        title: 'Status',
        key: 'status',
        width: 120,
        fixed: 'right',
        sorter: (a, b) => (a.status || '').localeCompare(b.status || ''),
        render: (_: any, record: LaporanRow) => <StatusTag status={record.status} />,
      },
    ],
    [referenceData, handleFieldChange]
  );

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
              onChange={handleFilterBulanChange}
              options={BULAN_OPTIONS}
            />
          </Col>
          <Col xs={24} sm={8} md={6}>
            <Select
              placeholder="Pilih tahun"
              style={{ width: '100%' }}
              value={filterTahun}
              onChange={handleFilterTahunChange}
              options={TAHUN_OPTIONS}
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

          {/* Table - with virtual scrolling for large datasets */}
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
              virtual
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
