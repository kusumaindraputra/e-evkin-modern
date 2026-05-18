import React, { useState, useCallback, useEffect, useMemo } from 'react';
import axios from 'axios';
import type { Dayjs } from 'dayjs';
import {
  Select,
  Tag,
  Alert,
  Button,
  Form,
  Input,
  DatePicker,
  Table,
  message,
} from 'antd';
import type { ColumnsType } from 'antd/es/table';

import { UploadSectionCard } from '../components/UploadSectionCard';
import { DropZone } from '../components/DropZone';
import { useDropZone } from '../hooks/useDropZone';
import API_BASE_URL from '../config/api';
import { useAuthStore } from '../store/authStore';

// ─── Types ──────────────────────────────────────────────────────────────────

interface BatchRecord {
  id: number;
  filename: string;
  bulan: number | null;
  tahun: number;
  row_count: number;
  created_at: string;
  jenis?: 'LRA' | 'Target' | 'Angkas';
  keterangan?: string;
  uploader?: { nama: string };
}

interface LraPreviewResult {
  bulan: number;
  tahun: number;
  bulanDetectedFromFilename: boolean;
  matchedCount: number;
  unmatchedPuskesmas: string[];
  unmatchedSubKegiatan: string[];
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

const BULAN_NAMES: Record<number, string> = {
  1: 'Januari', 2: 'Februari', 3: 'Maret', 4: 'April',
  5: 'Mei', 6: 'Juni', 7: 'Juli', 8: 'Agustus',
  9: 'September', 10: 'Oktober', 11: 'November', 12: 'Desember',
};

// ─── History Table ────────────────────────────────────────────────────────────

interface HistoryRow {
  id: number | string;
  tanggal: string;
  jenis: string;
  tahun: number;
  user: string;
  keterangan: string;
}

const JENIS_COLOR: Record<string, string> = {
  LRA: '#0E6BA8',
  Target: '#7C3AED',
  Angkas: '#D97706',
};

const historyColumns: ColumnsType<HistoryRow> = [
  {
    title: 'Tanggal',
    dataIndex: 'tanggal',
    key: 'tanggal',
    render: (v: string) => new Date(v).toLocaleString('id-ID'),
  },
  {
    title: 'Jenis',
    dataIndex: 'jenis',
    key: 'jenis',
    render: (v: string) => (
      <Tag color={JENIS_COLOR[v] ?? '#666'} style={{ color: '#fff' }}>
        {v}
      </Tag>
    ),
  },
  { title: 'Tahun', dataIndex: 'tahun', key: 'tahun' },
  { title: 'User', dataIndex: 'user', key: 'user' },
  { title: 'Keterangan', dataIndex: 'keterangan', key: 'keterangan' },
];

// ─── Main Page ────────────────────────────────────────────────────────────────

const UploadDataPage: React.FC = () => {
  const token = useAuthStore(s => s.token);
  const userName = useAuthStore(s => s.user?.nama ?? '—');
  const authHeader = useMemo(
    () => ({ Authorization: `Bearer ${token}` }),
    [token]
  );

  const tahunOptions = useMemo(() => {
    const y = new Date().getFullYear();
    return [y - 1, y, y + 1];
  }, []);

  const [tahun, setTahun] = useState<number>(() => new Date().getFullYear());

  // ── History ──────────────────────────────────────────────────────────────
  // LRA history is fetched from backend (persisted). Target/Angkas rows are
  // optimistic (session-only — no batch-history endpoint exists for those).
  const [history, setHistory] = useState<HistoryRow[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyError, setHistoryError] = useState(false);

  const loadHistory = useCallback(async () => {
    setHistoryLoading(true);
    setHistoryError(false);
    try {
      const res = await axios.get<BatchRecord[]>(`${API_BASE_URL}/lra/batches`, { headers: authHeader });
      setHistory(prev => {
        // Keep any optimistic Target/Angkas rows; replace LRA rows with fresh data
        const optimistic = prev.filter(r => r.jenis !== 'LRA');
        const lraRows: HistoryRow[] = res.data.map(b => ({
          id: b.id,
          tanggal: b.created_at,
          jenis: b.jenis ?? 'LRA',
          tahun: b.tahun,
          user: b.uploader?.nama ?? '—',
          keterangan: b.keterangan ?? (b.bulan ? `Bulan ${BULAN_NAMES[b.bulan] ?? b.bulan}` : ''),
        }));
        return [...optimistic, ...lraRows]
          .sort((a, b) => new Date(b.tanggal).getTime() - new Date(a.tanggal).getTime())
          .slice(0, 10);
      });
    } catch {
      setHistoryError(true);
    } finally {
      setHistoryLoading(false);
    }
  }, [authHeader]);

  const addHistoryRow = useCallback((row: HistoryRow) => {
    setHistory(prev => [row, ...prev].slice(0, 10));
  }, []);

  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

  // ── Section 1 — Target Anggaran ──────────────────────────────────────────
  const targetDz = useDropZone({ accept: '.xlsx' });
  const [targetCatatan, setTargetCatatan] = useState('');
  const [targetBulanPenetapan, setTargetBulanPenetapan] = useState<number | undefined>();
  const [targetTanggalPenetapan, setTargetTanggalPenetapan] = useState<Dayjs | null>(null);
  const [targetLoading, setTargetLoading] = useState(false);
  const [targetResult, setTargetResult] = useState<{
    inserted: number; updated: number; skipped: number; failed: number; errors?: string[];
  } | null>(null);

  const handleTargetUpload = useCallback(async () => {
    if (!targetDz.file || !targetCatatan.trim()) return;
    setTargetLoading(true);
    const fd = new FormData();
    fd.append('file', targetDz.file);
    fd.append('catatan', targetCatatan.trim());
    fd.append('tahun', String(tahun));
    if (targetBulanPenetapan != null) fd.append('bulan_penetapan', String(targetBulanPenetapan));
    if (targetTanggalPenetapan) fd.append('tanggal_penetapan', targetTanggalPenetapan.format('YYYY-MM-DD'));

    try {
      const res = await axios.post(`${API_BASE_URL}/target/upload`, fd, {
        headers: authHeader,
        onUploadProgress: (e) => {
          if (e.total) targetDz.setProgress(Math.round((e.loaded / e.total) * 95));
        },
      });
      targetDz.setProgress(100);
      targetDz.setOk();
      const result = res.data as { inserted: number; updated: number; skipped: number; failed: number; errors?: string[] };
      setTargetResult(result);
      message.success('Target Anggaran berhasil diupload');
      // Optimistic row — Target has no backend batch-history; session-only
      addHistoryRow({
        id: `target-${Date.now()}`,
        jenis: 'Target',
        tahun,
        tanggal: new Date().toISOString(),
        user: userName,
        keterangan: `${result.inserted} ditambah, ${result.updated} diperbarui`,
      });
    } catch (err: unknown) {
      const msg = axios.isAxiosError(err) ? (err.response?.data?.error ?? err.message) : 'Upload gagal';
      targetDz.setFail(msg);
      message.error(msg);
    } finally {
      setTargetLoading(false);
    }
  }, [targetDz, targetCatatan, tahun, targetBulanPenetapan, targetTanggalPenetapan, authHeader, userName, addHistoryRow]);

  // ── Section 2 — Angkas PDF ───────────────────────────────────────────────
  const angkasDz = useDropZone({ accept: '.pdf', maxSize: 20 * 1024 * 1024 });
  const [angkasLoading, setAngkasLoading] = useState(false);
  const [angkasResult, setAngkasResult] = useState<{
    inserted: number; updated: number; skipped: number; unmatchedPuskesmas?: string[];
  } | null>(null);

  const handleAngkasUpload = useCallback(async () => {
    if (!angkasDz.file) return;
    setAngkasLoading(true);
    const fd = new FormData();
    fd.append('file', angkasDz.file);
    fd.append('tahun', String(tahun));

    try {
      const res = await axios.post(`${API_BASE_URL}/angkas/upload`, fd, {
        headers: authHeader,
        onUploadProgress: (e) => {
          if (e.total) angkasDz.setProgress(Math.round((e.loaded / e.total) * 95));
        },
      });
      angkasDz.setProgress(100);
      angkasDz.setOk();
      const result = (res.data.result ?? res.data) as { inserted: number; updated: number; skipped: number; unmatchedPuskesmas?: string[] };
      setAngkasResult(result);
      message.success('Angkas PDF berhasil diupload');
      // Optimistic row — Angkas has no backend batch-history; session-only
      addHistoryRow({
        id: `angkas-${Date.now()}`,
        jenis: 'Angkas',
        tahun,
        tanggal: new Date().toISOString(),
        user: userName,
        keterangan: `${result.inserted} ditambah, ${result.updated} diperbarui`,
      });
    } catch (err: unknown) {
      const msg = axios.isAxiosError(err) ? (err.response?.data?.error ?? err.message) : 'Upload gagal';
      angkasDz.setFail(msg);
      message.error(msg);
    } finally {
      setAngkasLoading(false);
    }
  }, [angkasDz, tahun, authHeader, userName, addHistoryRow]);

  // ── Section 3 — LRA ──────────────────────────────────────────────────────
  const lraDz = useDropZone({ accept: '.xlsx' });
  const [lraLoading, setLraLoading] = useState(false);
  const [lraPreview, setLraPreview] = useState<LraPreviewResult | null>(null);
  const [lraConfirming, setLraConfirming] = useState(false);
  const [lraConfirmed, setLraConfirmed] = useState(false);

  const handleLraPreview = useCallback(async () => {
    if (!lraDz.file) return;
    setLraLoading(true);
    setLraPreview(null);
    setLraConfirmed(false);
    const fd = new FormData();
    fd.append('file', lraDz.file);
    fd.append('tahun', String(tahun));

    try {
      lraDz.setProgress(40);
      const res = await axios.post(`${API_BASE_URL}/lra/preview`, fd, { headers: authHeader });
      lraDz.setProgress(80);
      setLraPreview(res.data);
    } catch (err: unknown) {
      const msg = axios.isAxiosError(err) ? (err.response?.data?.error ?? err.message) : 'Preview gagal';
      lraDz.setFail(msg);
      message.error(msg);
    } finally {
      setLraLoading(false);
    }
  }, [lraDz, tahun, authHeader]);

  const handleLraConfirm = useCallback(async () => {
    if (!lraDz.file || !lraPreview) return;
    setLraConfirming(true);
    const fd = new FormData();
    fd.append('file', lraDz.file);
    fd.append('bulan', String(lraPreview.bulan));
    fd.append('tahun', String(lraPreview.tahun));

    try {
      const res = await axios.post(`${API_BASE_URL}/lra/confirm`, fd, { headers: authHeader });
      lraDz.setOk();
      setLraConfirmed(true);
      setLraPreview(null);
      const rowCount = (res.data as { rowCount?: number }).rowCount;
      message.success(rowCount != null ? `LRA berhasil diimport — ${rowCount} baris` : 'LRA berhasil diimport');
      loadHistory();
    } catch (err: unknown) {
      const msg = axios.isAxiosError(err) ? (err.response?.data?.error ?? err.message) : 'Konfirmasi gagal';
      lraDz.setFail(msg);
      message.error(msg);
    } finally {
      setLraConfirming(false);
    }
  }, [lraDz, lraPreview, authHeader, loadHistory]);

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div style={{ padding: '24px', maxWidth: 900, margin: '0 auto' }}>
      {/* Page header */}
      <div style={{ marginBottom: 16 }}>
        <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700 }}>Upload Data</h1>
        <p style={{ margin: '4px 0 0', color: 'var(--c-txt-2)' }}>
          Upload file Target Anggaran, Angkas, dan LRA ke sistem.
        </p>
      </div>

      {/* Year selector — single selector applies to all sections */}
      <div style={{ marginBottom: 20 }}>
        <span style={{ marginRight: 8 }}>Tahun:</span>
        <Select
          value={tahun}
          onChange={setTahun}
          style={{ width: 100 }}
          options={tahunOptions.map(y => ({ value: y, label: String(y) }))}
        />
      </div>

      {/* ── Section 1: Target Anggaran ── */}
      <UploadSectionCard
        number={1}
        title="Target Anggaran"
        badge={<Tag color="#7C3AED" style={{ color: '#fff', marginLeft: 8 }}>XLSX</Tag>}
        defaultOpen={true}
      >
        <div className="uc-grid">
          <div>
            <Form layout="vertical" style={{ marginBottom: 16 }}>
              <Form.Item
                label="Catatan"
                required
                style={{ marginBottom: 12 }}
              >
                <Input.TextArea
                  rows={2}
                  placeholder="Catatan upload (wajib diisi)"
                  value={targetCatatan}
                  onChange={e => setTargetCatatan(e.target.value)}
                />
              </Form.Item>
              <Form.Item label="Bulan Penetapan" style={{ marginBottom: 12 }}>
                <Select
                  allowClear
                  placeholder="Pilih bulan"
                  value={targetBulanPenetapan}
                  onChange={v => setTargetBulanPenetapan(v)}
                  style={{ width: '100%' }}
                  options={Object.entries(BULAN_NAMES).map(([k, v]) => ({
                    value: Number(k),
                    label: v,
                  }))}
                />
              </Form.Item>
              <Form.Item label="Tanggal Penetapan" style={{ marginBottom: 0 }}>
                <DatePicker
                  style={{ width: '100%' }}
                  value={targetTanggalPenetapan}
                  onChange={d => setTargetTanggalPenetapan(d)}
                  format="DD/MM/YYYY"
                />
              </Form.Item>
            </Form>
            <DropZone
              accept=".xlsx"
              state={targetDz.state}
              file={targetDz.file}
              progress={targetDz.progress}
              errorMsg={targetDz.errorMsg}
              handlers={targetDz.handlers}
              onRetry={targetDz.reset}
              onUploadAgain={() => { targetDz.reset(); setTargetResult(null); }}
            />
            <Button
              type="primary"
              style={{ marginTop: 12 }}
              disabled={!targetDz.file || !targetCatatan.trim() || targetLoading}
              loading={targetLoading}
              onClick={handleTargetUpload}
            >
              Upload Target
            </Button>
          </div>
          {targetResult && (
            <div className="uc-result">
              <Alert
                type="success"
                message="Hasil Upload Target"
                description={
                  <ul style={{ margin: 0, paddingLeft: 18 }}>
                    <li>Inserted: {targetResult.inserted}</li>
                    <li>Updated: {targetResult.updated}</li>
                    <li>Skipped: {targetResult.skipped}</li>
                    <li>Failed: {targetResult.failed}</li>
                    {targetResult.errors && targetResult.errors.length > 0 && (
                      <li>Errors: {targetResult.errors.join(', ')}</li>
                    )}
                  </ul>
                }
              />
            </div>
          )}
        </div>
      </UploadSectionCard>

      {/* ── Section 2: Angkas PDF ── */}
      <UploadSectionCard
        number={2}
        title="Angkas PDF"
        badge={<Tag color="#D97706" style={{ color: '#fff', marginLeft: 8 }}>PDF</Tag>}
        defaultOpen={false}
      >
        <p style={{ margin: '0 0 12px', color: 'var(--c-txt-2)', fontSize: 13 }}>
          Tahun mengikuti pilihan di atas.
        </p>
        <div className="uc-grid">
          <div>
            <DropZone
              accept=".pdf"
              state={angkasDz.state}
              file={angkasDz.file}
              progress={angkasDz.progress}
              errorMsg={angkasDz.errorMsg}
              handlers={angkasDz.handlers}
              onRetry={angkasDz.reset}
              onUploadAgain={() => { angkasDz.reset(); setAngkasResult(null); }}
            />
            <Button
              type="primary"
              style={{ marginTop: 12 }}
              disabled={!angkasDz.file || angkasLoading}
              loading={angkasLoading}
              onClick={handleAngkasUpload}
            >
              Upload Angkas
            </Button>
          </div>
          {angkasResult && (
            <div className="uc-result">
              <Alert
                type="success"
                message="Hasil Upload Angkas"
                description={
                  <ul style={{ margin: 0, paddingLeft: 18 }}>
                    <li>Inserted: {angkasResult.inserted}</li>
                    <li>Updated: {angkasResult.updated}</li>
                    <li>Skipped: {angkasResult.skipped}</li>
                    {angkasResult.unmatchedPuskesmas && angkasResult.unmatchedPuskesmas.length > 0 && (
                      <li>Unmatched: {angkasResult.unmatchedPuskesmas.join(', ')}</li>
                    )}
                  </ul>
                }
              />
            </div>
          )}
        </div>
      </UploadSectionCard>

      {/* ── Section 3: LRA ── */}
      <UploadSectionCard
        number={3}
        title="LRA (Laporan Realisasi Anggaran)"
        badge={<Tag color="#0E6BA8" style={{ color: '#fff', marginLeft: 8 }}>XLSX</Tag>}
        defaultOpen={false}
      >
        <div className="uc-grid">
          <div>
            <DropZone
              accept=".xlsx"
              state={lraDz.state}
              file={lraDz.file}
              progress={lraDz.progress}
              errorMsg={lraDz.errorMsg}
              handlers={lraDz.handlers}
              onRetry={() => { lraDz.reset(); setLraPreview(null); setLraConfirmed(false); }}
              onUploadAgain={() => { lraDz.reset(); setLraPreview(null); setLraConfirmed(false); }}
            />
            {!lraPreview && !lraConfirmed && (
              <Button
                type="primary"
                style={{ marginTop: 12 }}
                disabled={!lraDz.file || lraLoading}
                loading={lraLoading}
                onClick={handleLraPreview}
              >
                Preview LRA
              </Button>
            )}
          </div>

          {/* Preview panel */}
          {lraPreview && !lraConfirmed && (
            <div className="uc-result">
              <Alert
                type="info"
                message={`Preview LRA — ${BULAN_NAMES[lraPreview.bulan] ?? lraPreview.bulan} ${lraPreview.tahun}`}
                description={
                  <div>
                    {lraPreview.bulanDetectedFromFilename && (
                      <p style={{ margin: '0 0 8px' }}>Bulan terdeteksi dari nama file.</p>
                    )}
                    <p style={{ margin: '0 0 4px' }}>
                      Baris cocok: <strong>{lraPreview.matchedCount}</strong>
                    </p>
                    {lraPreview.unmatchedPuskesmas.length > 0 && (
                      <p style={{ margin: '0 0 4px', color: '#D97706' }}>
                        Puskesmas tidak ditemukan ({lraPreview.unmatchedPuskesmas.length}):{' '}
                        {lraPreview.unmatchedPuskesmas.join(', ')}
                      </p>
                    )}
                    {lraPreview.unmatchedSubKegiatan.length > 0 && (
                      <p style={{ margin: '0 0 8px', color: '#D97706' }}>
                        Sub-kegiatan tidak ditemukan ({lraPreview.unmatchedSubKegiatan.length}):{' '}
                        {lraPreview.unmatchedSubKegiatan.join(', ')}
                      </p>
                    )}
                    <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                      <Button
                        type="primary"
                        loading={lraConfirming}
                        onClick={handleLraConfirm}
                      >
                        Konfirmasi Import
                      </Button>
                      <Button
                        onClick={() => { setLraPreview(null); }}
                        disabled={lraConfirming}
                      >
                        Batal
                      </Button>
                    </div>
                  </div>
                }
              />
            </div>
          )}

          {lraConfirmed && (
            <div className="uc-result">
              <Alert
                type="success"
                message="LRA berhasil diimport"
                description="Data LRA telah tersimpan ke database."
              />
            </div>
          )}
        </div>
      </UploadSectionCard>

      {/* ── History Table ── */}
      <div style={{ marginTop: 32 }}>
        <h2 style={{ fontSize: 16, fontWeight: 600, marginBottom: 4 }}>Riwayat Upload (10 Terakhir)</h2>
        <p style={{ fontSize: 12, color: 'var(--c-txt-2)', marginBottom: historyError ? 4 : 12 }}>
          LRA: disimpan permanen. Target &amp; Angkas: hanya sesi ini.
        </p>
        {historyError && (
          <p style={{ fontSize: 12, color: 'var(--c-err)', marginBottom: 12 }}>
            Gagal memuat riwayat — periksa koneksi atau muat ulang halaman.
          </p>
        )}
        <Table<HistoryRow>
          columns={historyColumns}
          dataSource={history}
          rowKey="id"
          loading={historyLoading}
          pagination={false}
          size="small"
          bordered
        />
      </div>
    </div>
  );
};

export default UploadDataPage;
