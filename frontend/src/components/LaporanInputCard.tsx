import React, { useState, useCallback, useMemo } from 'react';
import { Tag, InputNumber, Input, Tooltip } from 'antd';
import { DownOutlined, InfoCircleOutlined, WarningOutlined } from '@ant-design/icons';
import { Link } from 'react-router-dom';
import { formatNumber, formatSumberAnggaran, getSumberAnggaranColor } from '../utils/formatters';


const { TextArea } = Input;

export interface LaporanRowData {
  id_sub_kegiatan: number;
  kode_sub: string;
  kegiatan: string;
  indikator_kinerja: string;
  id_kegiatan: number;
  id_sumber_anggaran?: number;
  id_satuan?: number;
  target_k?: number;
  target_rp?: number;
  angkas?: number | null;
  realisasi_k?: number;
  realisasi_rp?: number;
  realisasi_fisik?: number;
  permasalahan?: string;
  upaya?: string;
  laporan_id?: string;
  status?: string;
  isManualAngkas?: boolean;
}

interface LaporanInputCardProps {
  row: LaporanRowData;
  sumberAnggaranLabel?: string;
  satuanLabel?: string;
  onFieldChange: (
    id_sub_kegiatan: number,
    id_sumber_anggaran: number,
    field: string,
    value: string | number | null
  ) => void;
}

const getCapaianColor = (pct: number): string => {
  if (pct >= 90) return 'capaian-green';
  if (pct >= 70) return 'capaian-blue';
  if (pct >= 50) return 'capaian-orange';
  return 'capaian-red';
};

const getCapaianTextColor = (pct: number): string => {
  if (pct >= 90) return 'var(--color-success)';
  if (pct >= 70) return 'var(--color-primary)';
  if (pct >= 50) return 'var(--color-warning)';
  return 'var(--color-error)';
};

const numberFormatter = (val: number | string | undefined) => {
  if (!val) return '0';
  return `${val}`.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
};

const numberParser = (val: string | undefined) => {
  const parsed = val?.replace(/\./g, '');
  return parsed ? Number(parsed) : 0;
};

const LaporanInputCard: React.FC<LaporanInputCardProps> = ({
  row,
  sumberAnggaranLabel,
  satuanLabel,
  onFieldChange,
}) => {
  const [showExtras, setShowExtras] = useState(
    !!(row.permasalahan || row.upaya)
  );
  const [showIndikator, setShowIndikator] = useState(false);

  const isDisabled = row.status === 'terkirim';

  const sumberSimplified = useMemo(
    () => formatSumberAnggaran(sumberAnggaranLabel),
    [sumberAnggaranLabel]
  );
  const sumberColor = useMemo(
    () => getSumberAnggaranColor(sumberSimplified),
    [sumberSimplified]
  );

  // Calculate capaian
  const capaianK = useMemo(() => {
    if (!row.target_k || row.target_k === 0) return 0;
    return Math.round(((row.realisasi_k || 0) / row.target_k) * 100);
  }, [row.target_k, row.realisasi_k]);

  const capaianRp = useMemo(() => {
    const base = row.angkas != null ? row.angkas : row.target_rp;
    if (!base || base === 0) return 0;
    return Math.round(((row.realisasi_rp || 0) / base) * 100);
  }, [row.target_rp, row.angkas, row.realisasi_rp]);

  // Determine card status class
  const statusClass = useMemo(() => {
    if (row.status === 'terkirim') return 'status-terkirim';
    if (row.laporan_id) return 'status-tersimpan';
    return 'status-empty';
  }, [row.status, row.laporan_id]);

  const handleChange = useCallback(
    (field: string, value: string | number | null) => {
      onFieldChange(row.id_sub_kegiatan, row.id_sumber_anggaran!, field, value);
    },
    [row.id_sub_kegiatan, row.id_sumber_anggaran, onFieldChange]
  );

  return (
    <div className={`laporan-input-card ${statusClass}`}>
      {/* Meta row */}
      <div className="input-card-meta">
        <Tag color="blue" style={{ margin: 0 }}>
          {row.kode_sub}
        </Tag>
        <Tag color={sumberColor} style={{ margin: 0 }}>
          {sumberSimplified}
        </Tag>
        <span className="meta-title">{row.kegiatan}</span>
        
        {row.status && (
          <Tag
            color={
              row.status === 'terkirim'
                ? 'processing'
                : row.status === 'tersimpan'
                ? 'default'
                : 'warning'
            }
            style={{ margin: 0 }}
          >
            {row.status === 'terkirim'
              ? 'Terkirim'
              : row.status === 'tersimpan'
              ? 'Tersimpan'
              : row.status}
          </Tag>
        )}
        {!row.laporan_id && (
          <Tag style={{ margin: 0 }}>Belum Diisi</Tag>
        )}
        
        <Tooltip title="Lihat indikator kinerja">
          <InfoCircleOutlined
            style={{ color: 'var(--text-tertiary)', cursor: 'pointer', fontSize: 14 }}
            onClick={() => setShowIndikator((v) => !v)}
          />
        </Tooltip>
      </div>

      {/* Indikator Kinerja (collapsible) */}
      <div className={`input-card-indikator ${showIndikator ? 'visible' : ''}`}>
        <strong>Indikator Kinerja:</strong> {row.indikator_kinerja || '-'}
      </div>

      {/* Data Grid: Target | Realisasi */}
      <div className="input-card-data">
        {/* LEFT: Target (read-only) */}
        <div className="data-section target-section">
          <div className="data-section-title">📋 Target</div>
          <div className="data-row">
            <span className="data-label">Anggaran</span>
            <span className="data-value">Rp {formatNumber(row.target_rp || 0)}</span>
          </div>
          <div className="data-row">
            <span className="data-label">Angkas</span>
            <span className="data-value">
              Rp {formatNumber(row.angkas || 0)}
              {row.isManualAngkas && row.angkas == null && (
                <span className="warning-link">
                  <WarningOutlined style={{ color: 'var(--color-warning)' }} />
                  <span style={{ color: 'var(--text-secondary)' }}>Angkas belum diinput —</span>
                  <Link to={`/target?tab=angkas&highlight=sub:${row.id_sub_kegiatan}-sa:${row.id_sumber_anggaran}`}>
                    Ubah di sini
                  </Link>
                </span>
              )}
            </span>
          </div>
          <div className="data-row">
            <span className="data-label">Kinerja</span>
            <span className="data-value">
              {formatNumber(row.target_k || 0)} {satuanLabel || ''}
              {(!row.target_k || row.target_k === 0) && (
                <span className="warning-link">
                  <WarningOutlined style={{ color: 'var(--color-warning)' }} />
                  <span style={{ color: 'var(--text-secondary)' }}>Target belum diisi —</span>
                  <Link to={`/target?tab=target-kinerja&highlight=sub:${row.id_sub_kegiatan}`}>
                    Ubah di sini
                  </Link>
                </span>
              )}
            </span>
          </div>
        </div>

        {/* RIGHT: Realisasi (editable) */}
        <div className="data-section realisasi-section">
          <div className="data-section-title">✏️ Realisasi</div>
          
          {/* Realisasi Rp */}
          <div className="data-row">
            <span className="data-label">Anggaran</span>
            <div className="data-input">
              <InputNumber
                value={row.realisasi_rp}
                onChange={(v) => handleChange('realisasi_rp', v)}
                min={0}
                max={row.angkas || undefined}
                step={1}
                controls={false}
                changeOnBlur={false}
                formatter={numberFormatter}
                parser={numberParser}
                disabled={isDisabled}
                placeholder="0"
                size="small"
              />
            </div>
          </div>

          {/* Realisasi K */}
          <div className="data-row">
            <span className="data-label">Kinerja</span>
            <div className="data-input">
              <InputNumber
                value={row.realisasi_k}
                onChange={(v) => handleChange('realisasi_k', v)}
                min={0}
                step={1}
                controls={false}
                changeOnBlur={false}
                formatter={numberFormatter}
                parser={numberParser}
                disabled={isDisabled}
                placeholder="0"
                size="small"
              />
            </div>
          </div>

          {/* Realisasi Fisik */}
          <div className="data-row">
            <span className="data-label">Fisik (%)</span>
            <div className="data-input">
              <InputNumber
                value={row.realisasi_fisik}
                onChange={(v) => handleChange('realisasi_fisik', v)}
                min={0}
                max={100}
                step={0.01}
                controls={false}
                changeOnBlur={false}
                disabled={isDisabled}
                placeholder="0"
                size="small"
                style={{ width: '100%' }}
              />
            </div>
          </div>

          {/* Capaian bars */}
          <div className="capaian-inline">
            <span className="data-label" style={{ fontSize: 11, minWidth: 50 }}>
              Anggaran
            </span>
            <div className="capaian-bar">
              <div
                className={`capaian-bar-fill ${getCapaianColor(capaianRp)}`}
                style={{ width: `${Math.min(capaianRp, 100)}%` }}
              />
            </div>
            <span
              className="capaian-text"
              style={{ color: getCapaianTextColor(capaianRp) }}
            >
              {capaianRp}%
            </span>
          </div>
          <div className="capaian-inline" style={{ marginTop: 4, paddingTop: 0, borderTop: 'none' }}>
            <span className="data-label" style={{ fontSize: 11, minWidth: 50 }}>
              Kinerja
            </span>
            <div className="capaian-bar">
              <div
                className={`capaian-bar-fill ${getCapaianColor(capaianK)}`}
                style={{ width: `${Math.min(capaianK, 100)}%` }}
              />
            </div>
            <span
              className="capaian-text"
              style={{ color: getCapaianTextColor(capaianK) }}
            >
              {capaianK}%
            </span>
          </div>
        </div>
      </div>

      {/* Optional extras: Permasalahan & Upaya */}
      <div className="input-card-extras">
        <span
          className="extras-toggle"
          onClick={() => setShowExtras((v) => !v)}
        >
          <DownOutlined
            style={{
              fontSize: 10,
              transform: showExtras ? 'rotate(180deg)' : 'rotate(0)',
              transition: 'transform 0.2s',
            }}
          />
          {showExtras ? 'Sembunyikan' : 'Permasalahan & Upaya'}
        </span>

        {showExtras && (
          <div className="extras-fields">
            <div className="extras-field">
              <label>Permasalahan</label>
              <TextArea
                value={row.permasalahan}
                onChange={(e) => handleChange('permasalahan', e.target.value)}
                rows={2}
                disabled={isDisabled}
                placeholder="Jelaskan permasalahan (opsional)"
              />
            </div>
            <div className="extras-field">
              <label>Upaya Penyelesaian</label>
              <TextArea
                value={row.upaya}
                onChange={(e) => handleChange('upaya', e.target.value)}
                rows={2}
                disabled={isDisabled}
                placeholder="Jelaskan upaya (opsional)"
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default React.memo(LaporanInputCard, (prev, next) => {
  // Custom shallow comparison - only re-render if this row's data changed
  return (
    prev.row.realisasi_k === next.row.realisasi_k &&
    prev.row.realisasi_rp === next.row.realisasi_rp &&
    prev.row.realisasi_fisik === next.row.realisasi_fisik &&
    prev.row.permasalahan === next.row.permasalahan &&
    prev.row.upaya === next.row.upaya &&
    prev.row.status === next.row.status &&
    prev.row.laporan_id === next.row.laporan_id &&
    prev.row.angkas === next.row.angkas &&
    prev.row.target_k === next.row.target_k &&
    prev.row.target_rp === next.row.target_rp
  );
});
