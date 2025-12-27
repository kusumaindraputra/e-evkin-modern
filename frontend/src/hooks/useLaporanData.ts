import { useState, useCallback } from 'react';
import { message } from 'antd';
import axios from 'axios';
import API_BASE_URL from '../config/api';

interface LaporanRow {
  id_sub_kegiatan: number;
  kode_sub: string;
  kegiatan: string;
  indikator_kinerja: string;
  id_kegiatan: number;
  id_sumber_anggaran?: number;
  id_satuan?: number;
  target_k?: number;
  target_rp?: number;
  angkas?: number;
  realisasi_k?: number;
  realisasi_rp?: number;
  realisasi_fisik?: number;
  permasalahan?: string;
  upaya?: string;
  laporan_id?: string;
  status?: string;
}

interface UseLaporanDataProps {
  userId: string | undefined;
  token: string | null;
  bulan: string | undefined;
  tahun: number;
}

/**
 * Custom hook untuk manage laporan data loading and state
 */
export const useLaporanData = ({ userId, token, bulan, tahun }: UseLaporanDataProps) => {
  const [rows, setRows] = useState<LaporanRow[]>([]);
  const [loading, setLoading] = useState(false);

  const loadData = useCallback(async () => {
    if (!userId || !bulan || !tahun || !token) return;

    setLoading(true);
    try {
      const config = { headers: { Authorization: `Bearer ${token}` } };

      // Load sub kegiatan yang punya target di tahun ini
      const assignmentsRes = await axios.get(
        `${API_BASE_URL}/target/assigned?tahun=${tahun}`,
        config
      );

      // Load existing laporan for this month
      const laporanRes = await axios.get(`${API_BASE_URL}/laporan`, {
        headers: { Authorization: `Bearer ${token}` },
        params: { bulan, tahun, limit: 1000 },
      });

      const existingLaporan = Array.isArray(laporanRes.data.data)
        ? laporanRes.data.data
        : Array.isArray(laporanRes.data)
        ? laporanRes.data
        : [];

      // Map target data to rows
      const targetData = assignmentsRes.data.data || [];
      const mappedRows: LaporanRow[] = [];
      
      for (const item of targetData) {
        const subKegiatan = item.subKegiatan;
        const targets = item.targets || [];
        
        if (targets.length === 0) continue;
        
        const subKegiatanId = subKegiatan.id_sub_kegiatan;
        
        targets.forEach((target: any) => {
          const idSumberAnggaran = target.id_sumber_anggaran;
          
          const existing = existingLaporan.find(
            (l: any) => 
              l.id_sub_kegiatan === subKegiatanId && 
              l.id_sumber_anggaran === idSumberAnggaran
          );

          mappedRows.push({
            id_sub_kegiatan: subKegiatanId,
            kode_sub: subKegiatan.kode_sub,
            kegiatan: subKegiatan.kegiatan,
            indikator_kinerja: subKegiatan.indikator_kinerja,
            id_kegiatan: 0,
            id_sumber_anggaran: idSumberAnggaran,
            target_k: target.target_k,
            target_rp: target.target_rp,
            id_satuan: target.id_satuan,
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
  }, [userId, token, bulan, tahun]);

  const handleFieldChange = useCallback((
    id_sub_kegiatan: number, 
    id_sumber_anggaran: number, 
    field: string, 
    value: any
  ) => {
    setRows((prevRows) =>
      prevRows.map((row) =>
        row.id_sub_kegiatan === id_sub_kegiatan && row.id_sumber_anggaran === id_sumber_anggaran
          ? { ...row, [field]: value }
          : row
      )
    );
  }, []);

  return {
    rows,
    setRows,
    loading,
    loadData,
    handleFieldChange,
  };
};
