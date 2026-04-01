import React, { useMemo } from 'react';
import { formatNumber, formatCurrencyAbbreviated } from '../utils/formatters';

interface ProgressHeaderProps {
  bulan: string;
  tahun: number;
  totalRows: number;
  filledRows: number;
  totalTargetRp: number;
  totalAngkas: number;
  totalRealisasiRp: number;
  totalTargetK: number;
  totalRealisasiK: number;
}

const LaporanProgressHeader: React.FC<ProgressHeaderProps> = ({
  bulan,
  tahun,
  totalRows,
  filledRows,
  totalTargetRp,
  totalAngkas,
  totalRealisasiRp,
  totalTargetK,
  totalRealisasiK,
}) => {
  const progressPercent = useMemo(() => {
    if (totalRows === 0) return 0;
    return Math.round((filledRows / totalRows) * 100);
  }, [totalRows, filledRows]);

  const capaianAnggaran = useMemo(() => {
    const base = totalAngkas > 0 ? totalAngkas : totalTargetRp;
    if (base === 0) return 0;
    return Math.round((totalRealisasiRp / base) * 100);
  }, [totalAngkas, totalTargetRp, totalRealisasiRp]);

  const capaianKinerja = useMemo(() => {
    if (totalTargetK === 0) return 0;
    return Math.round((totalRealisasiK / totalTargetK) * 100);
  }, [totalTargetK, totalRealisasiK]);

  return (
    <div className="laporan-progress-header">
      <div className="progress-title">
        Laporan Kinerja — {bulan} {tahun}
      </div>
      <div className="progress-subtitle">
        Isi realisasi untuk semua sub kegiatan yang telah dikonfigurasi
      </div>

      <div className="laporan-progress-stats">
        <div className="progress-stat-card">
          <div className="stat-label">Pengisian</div>
          <div className="stat-value">
            {filledRows}/{totalRows}
          </div>
          <div className="stat-unit">sub kegiatan terisi</div>
        </div>
        <div className="progress-stat-card">
          <div className="stat-label">Capaian Anggaran</div>
          <div className="stat-value">{capaianAnggaran}%</div>
          <div className="stat-unit">
            {formatCurrencyAbbreviated(totalRealisasiRp)} / {formatCurrencyAbbreviated(totalAngkas > 0 ? totalAngkas : totalTargetRp)}
          </div>
        </div>
        <div className="progress-stat-card">
          <div className="stat-label">Capaian Kinerja</div>
          <div className="stat-value">{capaianKinerja}%</div>
          <div className="stat-unit">
            {formatNumber(totalRealisasiK)} / {formatNumber(totalTargetK)}
          </div>
        </div>
        <div className="progress-stat-card">
          <div className="stat-label">Status</div>
          <div className="stat-value" style={{ fontSize: 16 }}>
            {progressPercent === 100 ? '✅ Lengkap' : `⏳ ${progressPercent}%`}
          </div>
          <div className="stat-unit">progress pengisian</div>
        </div>
      </div>

      <div className="progress-bar-container">
        <div className="progress-bar-track">
          <div
            className="progress-bar-fill"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
        <div className="progress-bar-labels">
          <span>{filledRows} terisi</span>
          <span>{totalRows - filledRows} belum</span>
        </div>
      </div>
    </div>
  );
};

export default React.memo(LaporanProgressHeader);
