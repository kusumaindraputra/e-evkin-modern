import React, { useState, useMemo } from 'react';
import { Tag, Badge } from 'antd';
import { RightOutlined } from '@ant-design/icons';
import LaporanInputCard, { type LaporanRowData } from './LaporanInputCard';

interface LaporanGroupCardProps {
  kegiatanLabel: string;
  kegiatanKode?: string;
  rows: LaporanRowData[];
  sumberAnggaranMap: Record<number, string>;
  satuanMap: Record<number, string>;
  onFieldChange: (
    id_sub_kegiatan: number,
    id_sumber_anggaran: number,
    field: string,
    value: string | number | null
  ) => void;
  defaultExpanded?: boolean;
}

const LaporanGroupCard: React.FC<LaporanGroupCardProps> = ({
  kegiatanLabel,
  kegiatanKode,
  rows,
  sumberAnggaranMap,
  satuanMap,
  onFieldChange,
  defaultExpanded = true,
}) => {
  const [expanded, setExpanded] = useState(defaultExpanded);

  const filledCount = useMemo(
    () => rows.filter((r) => r.laporan_id || (r.realisasi_k !== undefined && r.realisasi_k !== null)).length,
    [rows]
  );

  const allSubmitted = useMemo(
    () => rows.every((r) => r.status === 'terkirim'),
    [rows]
  );

  const badgeColor = useMemo(() => {
    if (allSubmitted) return '#52c41a';
    if (filledCount === rows.length) return '#1890ff';
    if (filledCount > 0) return '#faad14';
    return '#d9d9d9';
  }, [allSubmitted, filledCount, rows.length]);

  return (
    <div className="laporan-group-card">
      <div
        className="laporan-group-header"
        onClick={() => setExpanded((v) => !v)}
      >
        <RightOutlined
          className={`group-expand-icon ${expanded ? 'expanded' : ''}`}
        />
        <div className="group-title">
          {kegiatanKode && (
            <Tag color="geekblue" style={{ marginRight: 8, marginBottom: 0 }}>
              {kegiatanKode}
            </Tag>
          )}
          {kegiatanLabel}
        </div>
        <div className="group-badge">
          <Badge
            count={`${filledCount}/${rows.length}`}
            style={{
              backgroundColor: badgeColor,
              fontSize: 11,
              fontWeight: 600,
            }}
          />
        </div>
      </div>

      <div className={expanded ? 'group-body-visible' : 'group-body-hidden'}>
        <div className="laporan-group-body">
          {rows.map((row) => (
            <LaporanInputCard
              key={`${row.id_sub_kegiatan}-${row.id_sumber_anggaran}`}
              row={row}
              sumberAnggaranLabel={
                row.id_sumber_anggaran
                  ? sumberAnggaranMap[row.id_sumber_anggaran]
                  : undefined
              }
              satuanLabel={
                row.id_satuan ? satuanMap[row.id_satuan] : undefined
              }
              onFieldChange={onFieldChange}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default React.memo(LaporanGroupCard);
