"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.detectBulanTahunFromFilename = detectBulanTahunFromFilename;
exports.parseLraExcel = parseLraExcel;
exports.getLraRealisasiMap = getLraRealisasiMap;
// backend/src/services/lraParserService.ts
const XLSX = __importStar(require("xlsx"));
const models_1 = require("../models");
const BULAN_NAMES = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember',
];
/** Extract bulan/tahun from filename like "LRA SUB KEG DINKES 31 JANUARI 2026.xlsx" */
function detectBulanTahunFromFilename(filename) {
    const pattern = /(Januari|Februari|Maret|April|Mei|Juni|Juli|Agustus|September|Oktober|November|Desember)\s+(\d{4})/i;
    const match = filename.match(pattern);
    if (!match)
        return { bulan: null, tahun: null };
    const bulan = BULAN_NAMES.find(b => b.toLowerCase() === match[1].toLowerCase()) || null;
    return { bulan, tahun: parseInt(match[2]) };
}
/** Normalize puskesmas name: strip "Puskesmas " prefix, lowercase, trim */
function normalizePuskesmasName(name) {
    return name.trim().replace(/^puskesmas\s+/i, '').toLowerCase().trim();
}
/** Find the first available data sheet in the workbook */
function findDataSheet(workbook) {
    const candidates = ['SUB KEG', 'SUBKEG', 'Sheet1', 'Sheet2'];
    for (const name of candidates) {
        if (workbook.Sheets[name])
            return workbook.Sheets[name];
    }
    return null;
}
async function parseLraExcel(buffer, filename, bulanOverride, tahunOverride) {
    // Detect bulan/tahun
    const detected = detectBulanTahunFromFilename(filename);
    const bulan = bulanOverride || detected.bulan || '';
    const tahun = tahunOverride || detected.tahun || 0;
    const bulanDetectedFromFilename = !bulanOverride && !!detected.bulan;
    // Parse Excel
    const workbook = XLSX.read(buffer, { type: 'buffer' });
    const sheet = findDataSheet(workbook);
    if (!sheet)
        throw new Error(`Sheet data tidak ditemukan. Sheet tersedia: ${workbook.SheetNames.join(', ')}`);
    const rawData = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' });
    // Load lookup tables from DB in parallel
    const [allUsers, allSubKegiatan, allTargets] = await Promise.all([
        models_1.User.findAll({ where: { role: 'puskesmas' }, attributes: ['id', 'nama_puskesmas'] }),
        models_1.SubKegiatan.findAll({ attributes: ['id_sub_kegiatan', 'kode_sub'] }),
        models_1.SubKegiatanTarget.findAll({
            where: { tahun: tahun || new Date().getFullYear() },
            attributes: ['user_id', 'id_sub_kegiatan', 'id_sumber_anggaran'],
        }),
    ]);
    // Build user map: normalized name → user_id
    const userByName = new Map();
    allUsers.forEach(u => {
        const nama = u.nama_puskesmas;
        if (nama)
            userByName.set(normalizePuskesmasName(nama), u.id);
    });
    // Build sub-kegiatan map: kode_sub → id_sub_kegiatan
    const subKegByKode = new Map();
    allSubKegiatan.forEach(sk => subKegByKode.set(sk.kode_sub, sk.id_sub_kegiatan));
    // Build sumber map: "userId_idSubKegiatan" → Set<idSumberAnggaran>
    const sumberMap = new Map();
    allTargets.forEach(t => {
        const key = `${t.user_id}_${t.id_sub_kegiatan}`;
        if (!sumberMap.has(key))
            sumberMap.set(key, new Set());
        sumberMap.get(key).add(t.id_sumber_anggaran);
    });
    const rows = [];
    const unmatchedPuskesmas = new Set();
    const unmatchedSubKegiatan = new Set();
    const unmatchedSumber = new Set();
    // State machine: track current unit and sub-kegiatan
    let currentUnitName = ''; // normalized puskesmas name from uraian col[6]
    let currentKodeSub = '';
    let currentRealisasiRp = 0;
    const flushSubKegiatan = () => {
        if (!currentUnitName || !currentKodeSub || currentRealisasiRp === 0)
            return;
        const userId = userByName.get(currentUnitName);
        if (!userId) {
            unmatchedPuskesmas.add(currentUnitName);
            return;
        }
        const idSubKegiatan = subKegByKode.get(currentKodeSub);
        if (!idSubKegiatan) {
            unmatchedSubKegiatan.add(currentKodeSub);
            return;
        }
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
        const kodeSub = String(row[4] || '').trim();
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
async function getLraRealisasiMap(userId, bulan, tahun) {
    const rows = await models_1.LraRealisasi.findAll({
        where: { user_id: userId, bulan, tahun },
        include: [{
                model: models_1.LraUploadBatch,
                as: 'batch',
                attributes: ['created_at'],
            }],
        order: [[{ model: models_1.LraUploadBatch, as: 'batch' }, 'created_at', 'DESC']],
    });
    const map = new Map();
    for (const row of rows) {
        const key = `${row.id_sub_kegiatan}_${row.id_sumber_anggaran}`;
        if (!map.has(key)) {
            // First result is latest (ordered by batch created_at DESC)
            map.set(key, Number(row.realisasi_rp));
        }
    }
    return map;
}
//# sourceMappingURL=lraParserService.js.map