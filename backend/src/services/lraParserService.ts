// backend/src/services/lraParserService.ts
import * as XLSX from 'xlsx';
import { User, SubKegiatan, LraRealisasi, LraUploadBatch, SubKegiatanTarget } from '../models';

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
  unmatchedPuskesmas: string[];   // unit names not found in users
  unmatchedSubKegiatan: string[]; // kode_sub not found in sub_kegiatan
  unmatchedSumber: string[];      // (puskesmas, sub_kegiatan) with no sumber_anggaran in target
}

/** Extract bulan/tahun from filename like "LRA SUB KEG DINKES 31 JANUARI 2026.xlsx" */
export function detectBulanTahunFromFilename(filename: string): { bulan: string | null; tahun: number | null } {
  const pattern = /(Januari|Februari|Maret|April|Mei|Juni|Juli|Agustus|September|Oktober|November|Desember)\s+(\d{4})/i;
  const match = filename.match(pattern);
  if (!match) return { bulan: null, tahun: null };
  const bulan = BULAN_NAMES.find(b => b.toLowerCase() === match[1].toLowerCase()) || null;
  return { bulan, tahun: parseInt(match[2]) };
}

/** Normalize puskesmas name: strip "Puskesmas " prefix, lowercase, trim */
function normalizePuskesmasName(name: string): string {
  return name.trim().replace(/^puskesmas\s+/i, '').toLowerCase().trim();
}

/** Find the first available data sheet in the workbook */
function findDataSheet(workbook: XLSX.WorkBook): XLSX.WorkSheet | null {
  const candidates = ['SUB KEG', 'SUBKEG', 'Sheet1', 'Sheet2'];
  for (const name of candidates) {
    if (workbook.Sheets[name]) return workbook.Sheets[name];
  }
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
  const sheet = findDataSheet(workbook);
  if (!sheet) throw new Error(`Sheet data tidak ditemukan. Sheet tersedia: ${workbook.SheetNames.join(', ')}`);
  const rawData: any[][] = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' });

  // Load lookup tables from DB in parallel
  const [allUsers, allSubKegiatan, allTargets] = await Promise.all([
    User.findAll({ where: { role: 'puskesmas' }, attributes: ['id', 'nama_puskesmas'] }),
    SubKegiatan.findAll({ attributes: ['id_sub_kegiatan', 'kode_sub'] }),
    SubKegiatanTarget.findAll({
      where: { tahun: tahun || new Date().getFullYear() },
      attributes: ['user_id', 'id_sub_kegiatan', 'id_sumber_anggaran'],
    }),
  ]);

  // Build user map: normalized name → user_id
  const userByName = new Map<string, string>();
  allUsers.forEach(u => {
    const nama = (u as any).nama_puskesmas as string | undefined;
    if (nama) userByName.set(normalizePuskesmasName(nama), (u as any).id);
  });

  // Build sub-kegiatan map: kode_sub → id_sub_kegiatan
  const subKegByKode = new Map<string, number>();
  allSubKegiatan.forEach(sk => subKegByKode.set((sk as any).kode_sub, (sk as any).id_sub_kegiatan));

  // Build sumber map: "userId_idSubKegiatan" → Set<idSumberAnggaran>
  const sumberMap = new Map<string, Set<number>>();
  allTargets.forEach(t => {
    const key = `${(t as any).user_id}_${(t as any).id_sub_kegiatan}`;
    if (!sumberMap.has(key)) sumberMap.set(key, new Set());
    sumberMap.get(key)!.add((t as any).id_sumber_anggaran);
  });

  const rows: LraRow[] = [];
  const unmatchedPuskesmas = new Set<string>();
  const unmatchedSubKegiatan = new Set<string>();
  const unmatchedSumber = new Set<string>();

  // State machine: track current unit and sub-kegiatan
  let currentUnitName: string = '';  // normalized puskesmas name from uraian col[6]
  let currentKodeSub: string = '';
  let currentRealisasiRp: number = 0;

  const flushSubKegiatan = () => {
    if (!currentUnitName || !currentKodeSub || currentRealisasiRp === 0) return;

    const userId = userByName.get(currentUnitName);
    if (!userId) { unmatchedPuskesmas.add(currentUnitName); return; }

    const idSubKegiatan = subKegByKode.get(currentKodeSub);
    if (!idSubKegiatan) { unmatchedSubKegiatan.add(currentKodeSub); return; }

    const sumberKey = `${userId}_${idSubKegiatan}`;
    const sumberIds = sumberMap.get(sumberKey);
    if (!sumberIds || sumberIds.size === 0) {
      unmatchedSumber.add(`${currentUnitName} / ${currentKodeSub}`);
      return;
    }

    sumberIds.forEach(idSumberAnggaran => {
      rows.push({ userId, idSubKegiatan, idSumberAnggaran, bulan, tahun, realisasiRp: currentRealisasiRp });
    });
  };

  // Skip header rows (first 8 rows are headers)
  for (let i = 8; i < rawData.length; i++) {
    const row = rawData[i];
    const kodeUnit = String(row[3] || '').trim();
    const kodeSub  = String(row[4] || '').trim();
    const kodeRekening = String(row[5] || '').trim();
    const uraian = String(row[6] || '').trim();
    const realisasiJumlah = Number(row[12]) || 0;

    // Unit header row: col[3] has unit code, col[4] empty, col[6] has unit name
    if (kodeUnit && !kodeSub && kodeUnit.match(/^1\.02\.0\.00\.0\.00\.01\.\d+$/) && kodeUnit !== '1.02.0.00.0.00.01.0000') {
      flushSubKegiatan();
      currentUnitName = normalizePuskesmasName(uraian || kodeUnit);
      currentKodeSub = '';
      currentRealisasiRp = 0;
      continue;
    }

    // Sub-kegiatan summary row: col[4] has kode sub, col[5] empty → read realisasi directly from col[12]
    if (kodeSub && kodeSub.match(/^1\.\d+\.\d+\.\d+\.\d+\.\d+$/) && !kodeRekening) {
      flushSubKegiatan();
      currentKodeSub = kodeSub;
      currentRealisasiRp = realisasiJumlah;
      continue;
    }

    // Detail rows (col[5] non-empty) are skipped — realisasi is read from summary rows above
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
