import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import {
  Button,
  Typography,
  Row,
  Col,
  Card,
  Select,
  message,
  Popconfirm,
} from 'antd';
import {
  SaveOutlined,
  SendOutlined,
  ReloadOutlined,
  FileTextOutlined,
} from '@ant-design/icons';
import axios from 'axios';
import API_BASE_URL from '../config/api';
import { useAuthStore } from '../store/authStore';
import LaporanProgressHeader from '../components/LaporanProgressHeader';
import LaporanGroupCard from '../components/LaporanGroupCard';
import type { LaporanRowData } from '../components/LaporanInputCard';
import '../components/LaporanBulkInput.css';

const { Text } = Typography;

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
  angkas: string | number | null;
  realisasi_k: number;
  realisasi_rp: string | number;
  realisasi_fisik: string | number;
  permasalahan: string;
  upaya: string;
  status: string;
}

// Static options
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

// Group rows by kegiatan induk name (extracted from API data)
interface GroupedKegiatan {
  kegiatanLabel: string;
  kegiatanKode?: string;
  rows: LaporanRowData[];
}

export const LaporanBulkInputPage: React.FC = () => {
  const user = useAuthStore((state) => state.user);
  const token = useAuthStore((state) => state.token);
  const [loading, setLoading] = useState(false);
  const [rows, setRows] = useState<LaporanRowData[]>([]);
  const [referenceData, setReferenceData] = useState<ReferenceData>({
    sumberAnggaran: [],
    satuan: [],
  });

  // Store kegiatan parent info for grouping
  const [kegiatanParentMap, setKegiatanParentMap] = useState<
    Record<number, { kegiatan: string; kode: string }>
  >({});

  // Refs to prevent double-loading in React StrictMode
  const referenceDataLoaded = useRef(false);
  const loadDataInProgress = useRef(false);

  // Filters
  const [filterBulan, setFilterBulan] = useState<string | undefined>(undefined);
  const [filterTahun, setFilterTahun] = useState<number>(
    new Date().getFullYear()
  );

  const loadReferenceData = useCallback(async () => {
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
      referenceDataLoaded.current = false;
    }
  }, [token]);

  const loadData = useCallback(async () => {
    if (!user || !filterBulan || !filterTahun) return;
    if (loadDataInProgress.current) return;
    loadDataInProgress.current = true;

    setLoading(true);
    try {
      const config = { headers: { Authorization: `Bearer ${token}` } };
      const bulanIndex =
        BULAN_OPTIONS.findIndex((b) => b.value === filterBulan) + 1;

      const [assignmentsRes, laporanRes, angkasRes, angkasFullRes] =
        await Promise.all([
          axios.get(
            `${API_BASE_URL}/target/assigned?tahun=${filterTahun}`,
            config
          ),
          axios.get(`${API_BASE_URL}/laporan`, {
            headers: { Authorization: `Bearer ${token}` },
            params: { bulan: filterBulan, tahun: filterTahun, limit: 1000 },
          }),
          axios
            .get(`${API_BASE_URL}/angkas/by-sub-kegiatan`, {
              headers: { Authorization: `Bearer ${token}` },
              params: { tahun: filterTahun, bulan: bulanIndex },
            })
            .catch(() => ({ data: { data: [] } })),
          axios
            .get(`${API_BASE_URL}/angkas`, {
              headers: { Authorization: `Bearer ${token}` },
              params: { tahun: filterTahun },
            })
            .catch(() => ({ data: { data: [] } })),
        ]);

      const existingLaporan = Array.isArray(laporanRes.data.data)
        ? laporanRes.data.data
        : Array.isArray(laporanRes.data)
        ? laporanRes.data
        : [];

      // Angkas maps
      const angkasMap = new Map<number, number>();
      if (angkasRes.data.data) {
        for (const item of angkasRes.data.data) {
          angkasMap.set(item.id_sub_kegiatan, item.angkas || 0);
        }
      }

      const angkasFullMap = new Map<string, number>();
      if (angkasFullRes.data?.data) {
        for (const item of angkasFullRes.data.data) {
          const key = `${item.id_sub_kegiatan}-${item.id_sumber_anggaran}`;
          const bulanan = item.bulanan || [];
          let cumulative = 0;
          for (let i = 0; i < bulanIndex && i < bulanan.length; i++) {
            cumulative += Number(bulanan[i]) || 0;
          }
          angkasFullMap.set(key, cumulative);
        }
      }

      // Map target data to rows
      const targetData = assignmentsRes.data.data || [];
      const mappedRows: LaporanRowData[] = [];
      const parentMap: Record<number, { kegiatan: string; kode: string }> = {};

      for (const item of targetData) {
        const subKegiatan = item.subKegiatan;
        const targets = item.targets || [];
        if (targets.length === 0) continue;

        const subKegiatanId = subKegiatan.id_sub_kegiatan;
        const isManualAngkas = item.isManualAngkas || false;

        // Store parent kegiatan info for grouping
        if (subKegiatan.kegiatanParent) {
          const parentKegId = subKegiatan.kegiatanParent.id_kegiatan;
          if (!parentMap[parentKegId]) {
            parentMap[parentKegId] = {
              kegiatan: subKegiatan.kegiatanParent.kegiatan,
              kode: subKegiatan.kegiatanParent.kode || '',
            };
          }
        }

        targets.forEach((target: TargetData) => {
          const idSumberAnggaran = target.id_sumber_anggaran;

          const existing = existingLaporan.find(
            (l: ExistingLaporan) =>
              l.id_sub_kegiatan === subKegiatanId &&
              l.id_sumber_anggaran === idSumberAnggaran
          );

          let angkasValue: number;
          if (isManualAngkas) {
            const angkasKey = `${subKegiatanId}-${idSumberAnggaran}`;
            angkasValue = angkasFullMap.get(angkasKey) || 0;
          } else {
            angkasValue = angkasMap.get(subKegiatanId) || 0;
          }

          mappedRows.push({
            id_sub_kegiatan: subKegiatanId,
            kode_sub: subKegiatan.kode_sub,
            kegiatan: subKegiatan.kegiatan,
            indikator_kinerja: subKegiatan.indikator_kinerja,
            id_kegiatan: subKegiatan.kegiatanParent?.id_kegiatan || 0,
            id_sumber_anggaran: idSumberAnggaran,
            target_k: target.target_k || 0,
            target_rp: Number(target.target_rp) || 0,
            angkas: angkasValue,
            id_satuan: target.id_satuan || 1,
            isManualAngkas,
            laporan_id: existing?.id,
            status: existing?.status,
            realisasi_k: existing?.realisasi_k
              ? Number(existing.realisasi_k)
              : undefined,
            realisasi_rp: existing?.realisasi_rp
              ? Number(existing.realisasi_rp)
              : undefined,
            realisasi_fisik: existing?.realisasi_fisik
              ? Number(existing.realisasi_fisik)
              : undefined,
            permasalahan: existing?.permasalahan || '',
            upaya: existing?.upaya || '',
          });
        });
      }

      setKegiatanParentMap(parentMap);
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

  // Field change handler
  const handleFieldChange = useCallback(
    (
      id_sub_kegiatan: number,
      id_sumber_anggaran: number,
      field: string,
      value: string | number | null
    ) => {
      setRows((prevRows) =>
        prevRows.map((row) =>
          row.id_sub_kegiatan === id_sub_kegiatan &&
          row.id_sumber_anggaran === id_sumber_anggaran
            ? { ...row, [field]: value }
            : row
        )
      );
    },
    []
  );

  // Save handler
  const handleSave = useCallback(async () => {
    if (!filterBulan || !filterTahun) {
      message.warning('Pilih bulan dan tahun terlebih dahulu');
      return;
    }

    const hasData = rows.some(
      (row) => row.id_sumber_anggaran || row.id_satuan || row.target_k || row.realisasi_k
    );

    if (!hasData) {
      message.warning('Isi minimal satu baris data');
      return;
    }

    const rowsToSave = rows.filter(
      (row) => row.id_sumber_anggaran && row.id_satuan
    );
    const missingAngkas = rowsToSave.filter(
      (row) => row.isManualAngkas && (!row.angkas || row.angkas <= 0)
    );

    if (missingAngkas.length > 0) {
      const kodeList = [
        ...new Set(missingAngkas.map((r) => r.kode_sub)),
      ].join(', ');
      message.warning(
        `Angkas belum diinput untuk: ${kodeList}. Silakan input di halaman Target & Angkas terlebih dahulu.`
      );
    }

    setLoading(true);
    try {
      const config = { headers: { Authorization: `Bearer ${token}` } };

      const laporanArray = rowsToSave.map((row) => ({
        id: row.laporan_id,
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

      loadData();
    } catch (error: any) {
      console.error('Error saving:', error);
      message.error(
        error.response?.data?.message || 'Gagal menyimpan laporan'
      );
    } finally {
      setLoading(false);
    }
  }, [filterBulan, filterTahun, rows, token, loadData]);

  // Submit handler
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
      message.success(
        `Laporan ${filterBulan} ${filterTahun} berhasil dikirim`
      );
      loadData();
    } catch (error: any) {
      message.error(
        error.response?.data?.message || 'Gagal mengirim laporan'
      );
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

  // Group rows by parent kegiatan
  const groupedData = useMemo((): GroupedKegiatan[] => {
    const groups = new Map<number, GroupedKegiatan>();

    for (const row of rows) {
      const kegId = row.id_kegiatan || 0;
      if (!groups.has(kegId)) {
        const parent = kegiatanParentMap[kegId];
        groups.set(kegId, {
          kegiatanLabel: parent?.kegiatan || 'Kegiatan Lainnya',
          kegiatanKode: parent?.kode,
          rows: [],
        });
      }
      groups.get(kegId)!.rows.push(row);
    }

    // Sort groups by kode
    return Array.from(groups.values()).sort((a, b) =>
      (a.kegiatanKode || '').localeCompare(b.kegiatanKode || '')
    );
  }, [rows, kegiatanParentMap]);

  // Reference data maps for quick lookup
  const sumberAnggaranMap = useMemo(() => {
    const map: Record<number, string> = {};
    for (const sa of referenceData.sumberAnggaran) {
      map[sa.value] = sa.label;
    }
    return map;
  }, [referenceData.sumberAnggaran]);

  const satuanMap = useMemo(() => {
    const map: Record<number, string> = {};
    for (const s of referenceData.satuan) {
      map[s.value] = s.label;
    }
    return map;
  }, [referenceData.satuan]);

  // Progress stats
  const progressStats = useMemo(() => {
    const filled = rows.filter(
      (r) => r.laporan_id || (r.realisasi_k !== undefined && r.realisasi_k !== null)
    ).length;
    const totalTargetRp = rows.reduce((sum, r) => sum + (r.target_rp || 0), 0);
    const totalRealisasiRp = rows.reduce(
      (sum, r) => sum + (r.realisasi_rp || 0),
      0
    );
    const totalTargetK = rows.reduce((sum, r) => sum + (r.target_k || 0), 0);
    const totalRealisasiK = rows.reduce(
      (sum, r) => sum + (r.realisasi_k || 0),
      0
    );
    return {
      filled,
      totalTargetRp,
      totalRealisasiRp,
      totalTargetK,
      totalRealisasiK,
    };
  }, [rows]);

  // Action bar state
  const canSendReport =
    rows.length > 0 &&
    rows.every(
      (row) =>
        row.laporan_id &&
        (row.status === 'tersimpan' || row.status === 'terkirim')
    );

  const hasUnsavedChanges = rows.some(
    (row) => !row.laporan_id || (!row.id_sumber_anggaran && !row.id_satuan)
  );

  return (
    <div>
      {/* Filter Bar */}
      <Card className="laporan-filter-bar">
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
            <Button
              icon={<ReloadOutlined />}
              onClick={loadData}
              disabled={!filterBulan || !filterTahun}
              loading={loading}
            >
              Refresh
            </Button>
          </Col>
        </Row>
      </Card>

      {filterBulan && filterTahun && rows.length > 0 && (
        <>
          {/* Progress Header */}
          <LaporanProgressHeader
            bulan={filterBulan}
            tahun={filterTahun}
            totalRows={rows.length}
            filledRows={progressStats.filled}
            totalTargetRp={progressStats.totalTargetRp}
            totalRealisasiRp={progressStats.totalRealisasiRp}
            totalTargetK={progressStats.totalTargetK}
            totalRealisasiK={progressStats.totalRealisasiK}
          />

          {/* Grouped Cards */}
          {groupedData.map((group) => (
            <LaporanGroupCard
              key={group.kegiatanKode || group.kegiatanLabel}
              kegiatanLabel={group.kegiatanLabel}
              kegiatanKode={group.kegiatanKode}
              rows={group.rows}
              sumberAnggaranMap={sumberAnggaranMap}
              satuanMap={satuanMap}
              onFieldChange={handleFieldChange}
            />
          ))}

          {/* Sticky Action Bar */}
          <div className="laporan-action-bar">
            <div className="action-bar-info">
              {hasUnsavedChanges && (
                <Text type="warning">
                  ⚠ Simpan terlebih dahulu sebelum mengirim
                </Text>
              )}
              {!canSendReport && !hasUnsavedChanges && rows.length > 0 && (
                <Text type="secondary">
                  Semua laporan harus tersimpan untuk dikirim
                </Text>
              )}
            </div>
            <div className="action-bar-buttons">
              <Button
                type="primary"
                icon={<SaveOutlined />}
                onClick={handleSave}
                loading={loading}
                disabled={rows.length === 0}
                size="large"
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
                  disabled={
                    rows.length === 0 || !canSendReport || hasUnsavedChanges
                  }
                  size="large"
                >
                  Kirim {filterBulan}
                </Button>
              </Popconfirm>
            </div>
          </div>
        </>
      )}

      {/* Empty state when no data */}
      {filterBulan && filterTahun && rows.length === 0 && !loading && (
        <div className="laporan-empty-state">
          <FileTextOutlined className="empty-icon" />
          <div className="empty-text">
            Tidak ada sub kegiatan dengan target untuk periode ini
          </div>
        </div>
      )}

      {/* Initial state — no filter selected */}
      {(!filterBulan || !filterTahun) && (
        <Card>
          <div style={{ textAlign: 'center', padding: '60px 0' }}>
            <FileTextOutlined
              style={{ fontSize: 48, color: '#d9d9d9', marginBottom: 16 }}
            />
            <div>
              <Text type="secondary" style={{ fontSize: 16 }}>
                Pilih bulan dan tahun untuk mulai input laporan
              </Text>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
};

export default LaporanBulkInputPage;
