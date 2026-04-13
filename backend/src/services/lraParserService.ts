// backend/src/services/lraParserService.ts
import * as XLSX from 'xlsx';
import { User, SubKegiatan, SumberAnggaran, LraRealisasi, LraUploadBatch } from '../models';

const BULAN_NAMES = [
  'Januari','Februari','Maret','April','Mei','Juni',
  'Juli','Agustus','September','Oktober','November','Desember',
];

export interface LraRow {
  userId: string;
  idSubKegiatan: number;
  idSumberAnggaran: number;
  bulan: string;
  tahun: number;
  realisasiRp: number;
}

export interface LraParseResult {
  bulan: string;
  tahun: number;
  bulanDetectedFromFilename: boolean;
  rows: LraRow[];
  unmatchedPuskesmas: string[];   // kode_unit not found in users
  unmatchedSubKegiatan: string[]; // kode_sub not found in sub_kegiatan
  unmatchedSumber: string[];      // uraian keyword not matched to sumber_anggaran
}

/** Extract bulan/tahun from filename like "LRA SUB KEG DINKES 31 JANUARI 2026.xlsx" */
export function detectBulanTahunFromFilename(filename: string): { bulan: string | null; tahun: number | null } {
  const pattern = /(Januari|Februari|Maret|April|Mei|Juni|Juli|Agustus|September|Oktober|November|Desember)\s+(\d{4})/i;
  const match = filename.match(pattern);
  if (!match) return { bulan: null, tahun: null };
  const bulan = BULAN_NAMES.find(b => b.toLowerCase() === match[1].toLowerCase()) || null;
  return { bulan, tahun: parseInt(match[2]) };
}

/** Map uraian text to sumber anggaran name keyword */
function detectSumberKeyword(uraian: string): string | null {
  const u = uraian.toUpperCase();
  if (u.includes('BLUD')) return 'BLUD';
  if (u.includes('BOK')) return 'BOK';
  if (u.includes('JKN') || u.includes('KAPITASI')) return 'JKN';
  if (u.includes('DAK')) return 'DAK';
  if (u.includes('DAU')) return 'DAU';
  return null;
}

export async function parseLraExcel(
  buffer: Buffer,
  filename: string,
  bulanOverride?: string,
  tahunOverride?: number
): Promise<LraParseResult> {
  // Detect bulan/tahun
  const detected = detectBulanTahunFromFilename(filename);
  const bulan = bulanOverride || detected.bulan || '';
  const tahun = tahunOverride || detected.tahun || 0;
  const bulanDetectedFromFilename = !bulanOverride && !!detected.bulan;

  // Parse Excel
  const workbook = XLSX.read(buffer, { type: 'buffer' });
  const sheet = workbook.Sheets['SUB KEG'];
  if (!sheet) throw new Error('Sheet "SUB KEG" tidak ditemukan dalam file LRA');
  const rawData: any[][] = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' });

  // Load lookup tables from DB
  const [allUsers, allSubKegiatan, allSumber] = await Promise.all([
    User.findAll({ where: { role: 'puskesmas' }, attributes: ['id', 'kode_puskesmas'] }),
    SubKegiatan.findAll({ attributes: ['id_sub_kegiatan', 'kode_sub'] }),
    SumberAnggaran.findAll({ attributes: ['id_sumber', 'sumber'] }),
  ]);

  const userByKode = new Map<string, string>(); // kode_puskesmas -> user_id
  allUsers.forEach(u => { if (u.kode_puskesmas) userByKode.set(u.kode_puskesmas, u.id); });

  const subKegByKode = new Map<string, number>(); // kode_sub -> id_sub_kegiatan
  allSubKegiatan.forEach(sk => subKegByKode.set((sk as any).kode_sub, (sk as any).id_sub_kegiatan));

  const sumberByKeyword = new Map<string, number>(); // keyword -> id_sumber
  allSumber.forEach(s => {
    const upper = ((s as any).sumber as string).toUpperCase();
    if (upper.includes('BLUD')) sumberByKeyword.set('BLUD', (s as any).id_sumber);
    if (upper.includes('BOK')) sumberByKeyword.set('BOK', (s as any).id_sumber);
    if (upper.includes('JKN') || upper.includes('KAPITASI')) sumberByKeyword.set('JKN', (s as any).id_sumber);
    if (upper.includes('DAK')) sumberByKeyword.set('DAK', (s as any).id_sumber);
    if (upper.includes('DAU')) sumberByKeyword.set('DAU', (s as any).id_sumber);
  });

  const rows: LraRow[] = [];
  const unmatchedPuskesmas = new Set<string>();
  const unmatchedSubKegiatan = new Set<string>();
  const unmatchedSumber = new Set<string>();

  // State machine: track current puskesmas + sub-kegiatan
  let currentKodeUnit: string = '';
  let currentKodeSub: string = '';
  // Accumulate realisasi per sumber keyword for current sub-kegiatan
  let currentSumberBuckets = new Map<string, number>(); // keyword -> realisasi_rp

  const flushSubKegiatan = () => {
    if (!currentKodeUnit || !currentKodeSub || currentSumberBuckets.size === 0) return;

    const userId = userByKode.get(currentKodeUnit);
    if (!userId) { unmatchedPuskesmas.add(currentKodeUnit); return; }

    const idSubKegiatan = subKegByKode.get(currentKodeSub);
    if (!idSubKegiatan) { unmatchedSubKegiatan.add(currentKodeSub); return; }

    currentSumberBuckets.forEach((realisasiRp, keyword) => {
      if (realisasiRp === 0) return;
      const idSumberAnggaran = sumberByKeyword.get(keyword);
      if (!idSumberAnggaran) { unmatchedSumber.add(keyword); return; }
      rows.push({ userId, idSubKegiatan, idSumberAnggaran, bulan, tahun, realisasiRp });
    });
  };

  // Skip header rows (first 8 rows are headers)
  for (let i = 8; i < rawData.length; i++) {
    const row = rawData[i];
    const kodeUnit = String(row[3] || '').trim();
    const kodeSub = String(row[4] || '').trim();
    const kodeRekening = String(row[5] || '').trim();
    const uraian = String(row[6] || '').trim();
    const realisasiJumlah = Number(row[12]) || 0;

    // Unit header row: col 4 empty, col 3 has puskesmas unit code
    if (kodeUnit && !kodeSub && kodeUnit.match(/^1\.02\.0\.00\.0\.00\.01\.\d+$/) && kodeUnit !== '1.02.0.00.0.00.01.0000') {
      flushSubKegiatan();
      currentKodeUnit = kodeUnit;
      currentKodeSub = '';
      currentSumberBuckets = new Map();
      continue;
    }

    // Sub-kegiatan summary row: col 4 has sub keg code, col 5 empty
    if (kodeSub && kodeSub.match(/^1\.\d+\.\d+\.\d+\.\d+\.\d+$/) && !kodeRekening) {
      flushSubKegiatan();
      currentKodeSub = kodeSub;
      currentSumberBuckets = new Map();
      continue;
    }

    // Detail row: col 5 has kode rekening → accumulate into sumber bucket
    if (currentKodeSub && kodeRekening && realisasiJumlah > 0) {
      const keyword = detectSumberKeyword(uraian);
      if (keyword) {
        currentSumberBuckets.set(keyword, (currentSumberBuckets.get(keyword) || 0) + realisasiJumlah);
      } else {
        unmatchedSumber.add(uraian.substring(0, 60));
      }
    }
  }

  // Flush last sub-kegiatan
  flushSubKegiatan();

  return {
    bulan,
    tahun,
    bulanDetectedFromFilename,
    rows,
    unmatchedPuskesmas: [...unmatchedPuskesmas],
    unmatchedSubKegiatan: [...unmatchedSubKegiatan],
    unmatchedSumber: [...unmatchedSumber],
  };
}

/**
 * Get latest LRA realisasi_rp for a puskesmas user for a given bulan/tahun.
 * Returns a Map keyed by "idSubKegiatan_idSumberAnggaran" -> realisasi_rp
 */
export async function getLraRealisasiMap(
  userId: string,
  bulan: string,
  tahun: number
): Promise<Map<string, number>> {
  const rows = await LraRealisasi.findAll({
    where: { user_id: userId, bulan, tahun },
    include: [{
      model: LraUploadBatch,
      as: 'batch',
      attributes: ['created_at'],
    }],
    order: [[{ model: LraUploadBatch, as: 'batch' }, 'created_at', 'DESC']],
  });

  const map = new Map<string, number>();
  for (const row of rows) {
    const key = `${row.id_sub_kegiatan}_${row.id_sumber_anggaran}`;
    if (!map.has(key)) {
      // First result is latest (ordered by batch created_at DESC)
      map.set(key, Number(row.realisasi_rp));
    }
  }
  return map;
}
