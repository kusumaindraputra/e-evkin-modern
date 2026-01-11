"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const multer_1 = __importDefault(require("multer"));
const models_1 = require("../models");
const sequelize_1 = require("sequelize");
const auth_1 = require("../middleware/auth");
const authorize_1 = require("../middleware/authorize");
const editPermission_1 = require("../middleware/editPermission");
const angkasParserService_1 = require("../services/angkasParserService");
const router = (0, express_1.Router)();
// Configure multer for memory storage
const upload = (0, multer_1.default)({
    storage: multer_1.default.memoryStorage(),
    limits: { fileSize: 50 * 1024 * 1024 }, // 50MB limit for large PDFs
    fileFilter: (_req, file, cb) => {
        if (file.mimetype === 'application/pdf') {
            cb(null, true);
        }
        else {
            cb(new Error('Only PDF files are allowed'));
        }
    },
});
/**
 * Mapping kode sumber anggaran dari PDF ke nama sumber anggaran di database
 * Berdasarkan struktur kode rekening pendek (3 karakter)
 */
const SUMBER_ANGGARAN_MAPPING = {
    // PAD - Pendapatan Asli Daerah biasanya terkait BLUD
    '4.1': ['BLUD', 'PAD', 'Pendapatan Asli'],
    // Transfer - Dana dari pemerintah pusat/provinsi
    '4.2': ['DAK', 'APBD', 'Transfer', 'Dana Alokasi'],
    // JKN / Kapitasi
    '4.3': ['JKN', 'Kapitasi', 'BPJS'],
};
/**
 * Find or create sumber anggaran based on PDF code and name
 */
async function findOrCreateSumberAnggaran(kode, nama) {
    if (!kode && !nama)
        return null;
    // Get all existing sumber anggaran
    const existingSumber = await models_1.SumberAnggaran.findAll();
    // Try to match by name first (fuzzy)
    if (nama) {
        const normalizedNama = nama.toLowerCase();
        for (const sumber of existingSumber) {
            const sumberNama = sumber.sumber.toLowerCase();
            if (sumberNama.includes(normalizedNama) || normalizedNama.includes(sumberNama)) {
                return { id: sumber.id_sumber, nama: sumber.sumber };
            }
        }
    }
    // Try to match by kode mapping
    if (kode && SUMBER_ANGGARAN_MAPPING[kode]) {
        const keywords = SUMBER_ANGGARAN_MAPPING[kode];
        for (const sumber of existingSumber) {
            const sumberNama = sumber.sumber.toLowerCase();
            if (keywords.some(kw => sumberNama.includes(kw.toLowerCase()))) {
                return { id: sumber.id_sumber, nama: sumber.sumber };
            }
        }
    }
    // If not found and we have a name, create new sumber anggaran
    if (nama) {
        const newSumber = await models_1.SumberAnggaran.create({ sumber: nama });
        return { id: newSumber.id_sumber, nama: newSumber.sumber };
    }
    return null;
}
/**
 * POST /api/angkas/upload
 * Upload Angkas PDF file and parse monthly budget data
 * Sumber anggaran is detected from PDF (kode rekening pendek like "4.1")
 * Uses INSERT for history tracking (not upsert) - skips if value is same as latest record
 */
router.post('/upload', auth_1.authenticate, authorize_1.authorizeAdmin, upload.single('file'), async (req, res) => {
    try {
        const adminId = req.user.id;
        const { tahun: tahunOverride } = req.body;
        if (!req.file) {
            res.status(400).json({ error: 'No file uploaded' });
            return;
        }
        // Parse PDF
        const parsed = await (0, angkasParserService_1.parseAngkasPdf)(req.file.buffer);
        const tahun = tahunOverride ? parseInt(tahunOverride) : parsed.tahun;
        // Get all puskesmas users (include kode_sub_unit for matching)
        const puskesmasUsers = await models_1.User.findAll({
            where: { role: 'puskesmas' },
            attributes: ['id', 'nama', 'username', 'kode_sub_unit', 'nama_puskesmas'],
        });
        // Create mapping from kode_sub_unit to user_id for fast lookup
        const kodeSubUnitToUserId = new Map();
        puskesmasUsers.forEach(u => {
            if (u.kode_sub_unit) {
                kodeSubUnitToUserId.set(u.kode_sub_unit, u.id);
            }
        });
        // Get all sub kegiatan for matching
        const subKegiatanList = await models_1.SubKegiatan.findAll({
            attributes: ['id_sub_kegiatan', 'kegiatan', 'kode_sub'],
        });
        // Cache sumber anggaran mappings
        const sumberAnggaranCache = new Map();
        let createdSumberAnggaran = 0;
        const result = {
            success: 0,
            inserted: 0,
            updated: 0,
            skipped: 0,
            failed: 0,
            unmatchedPuskesmas: [],
            unmatchedSumberAnggaran: [],
            createdSumberAnggaran: 0,
            detectedSumberAnggaran: parsed.detectedSumberAnggaran,
            errors: [],
            successList: [],
        };
        // OPTIMIZATION: Pre-fetch all existing AnggaranKas for this tahun
        // This eliminates N+1 queries (12 per row for each bulan!)
        const existingAngkas = await models_1.AnggaranKas.findAll({
            where: { tahun },
            attributes: ['id', 'user_id', 'kode_rekening', 'id_sumber_anggaran', 'bulan', 'nilai', 'created_at'],
            order: [['created_at', 'DESC']],
        });
        // Build lookup map: user_id + kode_rekening + id_sumber_anggaran + bulan -> latest record
        const existingAngkasMap = new Map();
        for (const angkas of existingAngkas) {
            const key = `${angkas.user_id}_${angkas.kode_rekening}_${angkas.id_sumber_anggaran}_${angkas.bulan}`;
            if (!existingAngkasMap.has(key)) {
                existingAngkasMap.set(key, angkas);
            }
        }
        // Process each puskesmas
        for (const puskesmasData of parsed.puskesmasList) {
            // Primary: match by kode_sub_unit (kodePuskesmas from PDF)
            let userId = kodeSubUnitToUserId.get(puskesmasData.kodePuskesmas);
            // Fallback: match by name if kode not found
            if (!userId) {
                userId = (0, angkasParserService_1.findPuskesmasUser)(puskesmasData.namaPuskesmas, puskesmasUsers.map(u => ({ id: u.id, nama: u.nama, username: u.username }))) || undefined;
            }
            if (!userId) {
                result.unmatchedPuskesmas.push(`${puskesmasData.namaPuskesmas} (kode: ${puskesmasData.kodePuskesmas})`);
                continue;
            }
            // Process each row
            for (const row of puskesmasData.rows) {
                // Get sumber anggaran from cache or find/create
                const cacheKey = `${row.sumberAnggaranKode || ''}-${row.sumberAnggaranNama || ''}`;
                let sumberAnggaran = sumberAnggaranCache.get(cacheKey);
                if (sumberAnggaran === undefined) {
                    sumberAnggaran = await findOrCreateSumberAnggaran(row.sumberAnggaranKode, row.sumberAnggaranNama);
                    sumberAnggaranCache.set(cacheKey, sumberAnggaran);
                    if (sumberAnggaran && !result.detectedSumberAnggaran.some(s => s.kode === row.sumberAnggaranKode)) {
                        createdSumberAnggaran++;
                    }
                }
                if (!sumberAnggaran) {
                    // Track unmatched sumber anggaran
                    const unmatchedKey = `${row.sumberAnggaranKode || 'unknown'}: ${row.sumberAnggaranNama || 'unknown'}`;
                    if (!result.unmatchedSumberAnggaran.includes(unmatchedKey)) {
                        result.unmatchedSumberAnggaran.push(unmatchedKey);
                    }
                    result.skipped++;
                    continue;
                }
                // Try to match to sub_kegiatan
                const idSubKegiatan = (0, angkasParserService_1.findBestMatch)(row.uraian, subKegiatanList.map(sk => ({ id: sk.id_sub_kegiatan, nama: sk.kegiatan })));
                // Process each month
                for (let bulan = 1; bulan <= 12; bulan++) {
                    const nilai = row.bulanan[bulan - 1] || 0;
                    // Skip zero values
                    if (nilai === 0) {
                        result.skipped++;
                        continue;
                    }
                    try {
                        // OPTIMIZED: Check if record already exists using pre-fetched map
                        const angkasKey = `${userId}_${row.kodeRekening}_${sumberAnggaran.id}_${bulan}`;
                        const existingRecord = existingAngkasMap.get(angkasKey) || null;
                        if (existingRecord) {
                            // Compare values - skip if same
                            const existingNilai = Number(existingRecord.nilai);
                            const newNilai = Number(nilai);
                            if (existingNilai === newNilai) {
                                result.skipped++;
                                continue; // Skip - no change needed
                            }
                            // INSERT new record for history tracking (value changed)
                            const newAngkas = await models_1.AnggaranKas.create({
                                user_id: userId,
                                id_sub_kegiatan: idSubKegiatan,
                                id_sumber_anggaran: sumberAnggaran.id,
                                kode_rekening: row.kodeRekening,
                                uraian: row.uraian,
                                tahun,
                                bulan,
                                nilai: newNilai,
                                created_by: adminId,
                            });
                            // Update cache with new record for potential future iterations
                            existingAngkasMap.set(angkasKey, newAngkas);
                            result.updated++;
                            result.success++;
                            result.successList.push({
                                type: 'updated',
                                puskesmas: puskesmasData.namaPuskesmas,
                                kodeRekening: row.kodeRekening,
                                uraian: row.uraian,
                                sumberAnggaran: sumberAnggaran.nama,
                                tahun,
                                bulan,
                                oldValue: existingNilai,
                                newValue: newNilai,
                            });
                        }
                        else {
                            // INSERT new record (first entry)
                            const newAngkas = await models_1.AnggaranKas.create({
                                user_id: userId,
                                id_sub_kegiatan: idSubKegiatan,
                                id_sumber_anggaran: sumberAnggaran.id,
                                kode_rekening: row.kodeRekening,
                                uraian: row.uraian,
                                tahun,
                                bulan,
                                nilai,
                                created_by: adminId,
                            });
                            // Add to cache for potential future iterations
                            existingAngkasMap.set(angkasKey, newAngkas);
                            result.inserted++;
                            result.success++;
                            result.successList.push({
                                type: 'inserted',
                                puskesmas: puskesmasData.namaPuskesmas,
                                kodeRekening: row.kodeRekening,
                                uraian: row.uraian,
                                sumberAnggaran: sumberAnggaran.nama,
                                tahun,
                                bulan,
                                newValue: nilai,
                            });
                        }
                    }
                    catch (error) {
                        result.failed++;
                        // Log detailed error for debugging
                        const errorDetails = error.errors ? error.errors.map((e) => `${e.path}: ${e.message}`).join(', ') : error.message;
                        console.error(`❌ Insert error for ${puskesmasData.namaPuskesmas} - ${row.uraian}:`, errorDetails);
                        result.errors.push({
                            puskesmas: puskesmasData.namaPuskesmas,
                            kodeRekening: row.kodeRekening,
                            uraian: row.uraian,
                            error: errorDetails,
                        });
                    }
                }
            }
        }
        result.createdSumberAnggaran = createdSumberAnggaran;
        res.json({
            message: `Upload completed. ${result.success} records processed (${result.inserted} new, ${result.updated} updated, ${result.skipped} skipped).`,
            result,
            parsedPuskesmas: parsed.puskesmasList.length,
            tahun,
        });
    }
    catch (error) {
        console.error('Error uploading angkas PDF:', error);
        res.status(500).json({ error: 'Failed to process PDF file', details: error.message });
    }
});
/**
 * GET /api/angkas
 * Get all sub kegiatan + sumber anggaran + puskesmas combinations from target anggaran
 * with monthly angkas values (zeros if not uploaded yet)
 * This allows tracking which combinations haven't been updated with angkas data
 */
router.get('/', auth_1.authenticate, async (req, res) => {
    try {
        const { tahun, user_id, id_sub_kegiatan, id_sumber_anggaran } = req.query;
        const currentUser = req.user;
        const targetTahun = tahun ? parseInt(tahun) : new Date().getFullYear();
        // Build where clause for SubKegiatanTarget
        const targetWhere = {
            tahun: targetTahun,
            bulan: null, // Only yearly targets
        };
        // User filter - puskesmas can only see their own data
        if (currentUser.role === 'puskesmas') {
            targetWhere.user_id = currentUser.id;
        }
        else if (user_id) {
            targetWhere.user_id = user_id;
        }
        // Optional filters
        if (id_sub_kegiatan) {
            targetWhere.id_sub_kegiatan = parseInt(id_sub_kegiatan);
        }
        if (id_sumber_anggaran) {
            targetWhere.id_sumber_anggaran = parseInt(id_sumber_anggaran);
        }
        // Step 1: Get all unique combinations from SubKegiatanTarget (latest per combination)
        const allTargets = await models_1.SubKegiatanTarget.findAll({
            where: targetWhere,
            include: [
                { model: models_1.User, as: 'puskesmas', attributes: ['id', 'nama', 'username'] },
                { model: models_1.SubKegiatan, as: 'subKegiatan', attributes: ['id_sub_kegiatan', 'kegiatan', 'kode_sub'] },
                { model: models_1.SumberAnggaran, as: 'sumberAnggaran', attributes: ['id_sumber', 'sumber'] },
            ],
            order: [['created_at', 'DESC']],
        });
        // Get only latest target per combination (user_id + id_sub_kegiatan + id_sumber_anggaran)
        const latestTargets = new Map();
        for (const target of allTargets) {
            const key = `${target.user_id}-${target.id_sub_kegiatan}-${target.id_sumber_anggaran}`;
            if (!latestTargets.has(key)) {
                latestTargets.set(key, target);
            }
        }
        // Step 2: Build where clause for AnggaranKas
        const angkasWhere = {
            tahun: targetTahun,
            id_sub_kegiatan: { [sequelize_1.Op.ne]: null }, // Only matched records
        };
        if (currentUser.role === 'puskesmas') {
            angkasWhere.user_id = currentUser.id;
        }
        else if (user_id) {
            angkasWhere.user_id = user_id;
        }
        if (id_sub_kegiatan) {
            angkasWhere.id_sub_kegiatan = parseInt(id_sub_kegiatan);
        }
        if (id_sumber_anggaran) {
            angkasWhere.id_sumber_anggaran = parseInt(id_sumber_anggaran);
        }
        // Get all angkas data
        const allAngkas = await models_1.AnggaranKas.findAll({
            where: angkasWhere,
            order: [['created_at', 'DESC']],
        });
        // Get latest angkas per combination (user_id + id_sub_kegiatan + bulan)
        // NOTE: We ignore id_sumber_anggaran because PDF angkas uses different sumber than targets
        const latestAngkas = new Map();
        for (const angkas of allAngkas) {
            // Use getDataValue to get actual values (avoid Sequelize getter issues with public class fields)
            const userId = angkas.getDataValue('user_id');
            const subKegId = angkas.getDataValue('id_sub_kegiatan');
            const bulan = angkas.getDataValue('bulan');
            // Key without id_sumber_anggaran - match by user + subkegiatan + bulan only
            const key = `${userId}-${subKegId}-${bulan}`;
            if (!latestAngkas.has(key)) {
                latestAngkas.set(key, angkas);
            }
        }
        // Step 3: Identify multi-sumber sub_kegiatan per user
        // For these, we should NOT auto-fill angkas (user must input manually)
        const sumberCountMap = new Map(); // user_id-id_sub_kegiatan -> count of sumber_anggaran
        for (const target of latestTargets.values()) {
            const key = `${target.user_id}-${target.id_sub_kegiatan}`;
            sumberCountMap.set(key, (sumberCountMap.get(key) || 0) + 1);
        }
        // Step 4: Build result - all targets with angkas values (or zeros)
        // For multi-sumber sub_kegiatan: hasAngkas=false, bulanan/total stay zero
        // For single-sumber sub_kegiatan: populate angkas from PDF data
        const result = [];
        for (const target of latestTargets.values()) {
            const bulanan = Array(12).fill(0);
            let total = 0;
            let hasAngkas = false;
            // Check if this sub_kegiatan has multiple sumber_anggaran for this user
            const sumberKey = `${target.user_id}-${target.id_sub_kegiatan}`;
            const sumberCount = sumberCountMap.get(sumberKey) || 1;
            const isManualAngkas = sumberCount > 1;
            // Only populate angkas for single-sumber sub_kegiatan
            // Multi-sumber requires manual input (we can't split PDF angkas)
            if (!isManualAngkas) {
                // Fill in angkas values for each month
                for (let bulan = 1; bulan <= 12; bulan++) {
                    const key = `${target.user_id}-${target.id_sub_kegiatan}-${bulan}`;
                    const foundAngkas = latestAngkas.get(key);
                    if (foundAngkas) {
                        const nilai = Number(foundAngkas.getDataValue('nilai')) || 0;
                        bulanan[bulan - 1] = nilai;
                        total += nilai;
                        hasAngkas = true;
                    }
                }
            }
            result.push({
                user_id: target.user_id,
                puskesmas: target.puskesmas,
                id_sub_kegiatan: target.id_sub_kegiatan,
                subKegiatan: target.subKegiatan,
                id_sumber_anggaran: target.id_sumber_anggaran,
                sumberAnggaran: target.sumberAnggaran,
                tahun: targetTahun,
                target_rp: Number(target.target_rp) || 0,
                bulanan,
                total,
                hasAngkas,
                isManualAngkas,
            });
        }
        // Sort by puskesmas name, then sub kegiatan
        result.sort((a, b) => {
            const puskesmasCompare = (a.puskesmas?.nama || '').localeCompare(b.puskesmas?.nama || '');
            if (puskesmasCompare !== 0)
                return puskesmasCompare;
            return (a.subKegiatan?.kegiatan || '').localeCompare(b.subKegiatan?.kegiatan || '');
        });
        res.json({
            tahun: targetTahun,
            total: result.length,
            withAngkas: result.filter(r => r.hasAngkas).length,
            withoutAngkas: result.filter(r => !r.hasAngkas).length,
            data: result,
        });
    }
    catch (error) {
        console.error('Error fetching angkas:', error);
        res.status(500).json({ error: 'Failed to fetch angkas data', details: error.message });
    }
});
/**
 * GET /api/angkas/by-sub-kegiatan
 * Get cumulative angkas grouped by sub kegiatan for a specific user/puskesmas
 * Always returns the latest record for each combination (history support)
 * NOTE: Groups by id_sub_kegiatan ONLY (not id_sumber_anggaran) because PDF angkas
 * may have different sumber_anggaran than what targets use
 */
router.get('/by-sub-kegiatan', auth_1.authenticate, async (req, res) => {
    try {
        const { tahun, bulan, user_id } = req.query;
        const currentUser = req.user;
        const targetTahun = tahun ? parseInt(tahun) : new Date().getFullYear();
        const targetBulan = bulan ? parseInt(bulan) : new Date().getMonth() + 1;
        // Determine user_id based on role
        let targetUserId;
        if (currentUser.role === 'puskesmas') {
            targetUserId = currentUser.id;
        }
        else if (user_id) {
            targetUserId = user_id;
        }
        else {
            res.status(400).json({ error: 'user_id is required for admin' });
            return;
        }
        const where = {
            user_id: targetUserId,
            tahun: targetTahun,
            bulan: { [sequelize_1.Op.lte]: targetBulan },
            id_sub_kegiatan: { [sequelize_1.Op.ne]: null }, // Only records with matched sub_kegiatan
        };
        // Get all data first, ordered by created_at DESC to get latest first
        const allData = await models_1.AnggaranKas.findAll({
            where,
            include: [
                { model: models_1.SubKegiatan, as: 'subKegiatan', attributes: ['id_sub_kegiatan', 'kegiatan', 'kode_sub'] },
                { model: models_1.SumberAnggaran, as: 'sumberAnggaran', attributes: ['id_sumber', 'sumber'] },
            ],
            order: [['created_at', 'DESC']],
        });
        // Filter to get only the latest record for each combination (kode_rekening, bulan)
        // NOTE: Ignoring id_sumber_anggaran for history dedup because PDF may have different sumber
        const latestMap = new Map();
        for (const record of allData) {
            // Use getDataValue to avoid Sequelize public class field issue
            const kodeRekening = record.getDataValue('kode_rekening');
            const bulan = record.getDataValue('bulan');
            const key = `${kodeRekening}-${bulan}`;
            // Due to ordering by created_at DESC, first occurrence is latest
            if (!latestMap.has(key)) {
                latestMap.set(key, record);
            }
        }
        // Use only latest records for grouping
        const data = Array.from(latestMap.values());
        // Group by sub_kegiatan ONLY (NOT id_sumber_anggaran) and sum
        // This allows angkas to match with any target regardless of sumber_anggaran
        const grouped = new Map();
        for (const record of data) {
            // Use getDataValue to avoid Sequelize public class field issue
            const subKegiatanId = record.getDataValue('id_sub_kegiatan');
            const nilai = Number(record.getDataValue('nilai')) || 0;
            if (!grouped.has(subKegiatanId)) {
                grouped.set(subKegiatanId, {
                    id_sub_kegiatan: subKegiatanId,
                    subKegiatan: record.subKegiatan,
                    target_angkas: 0,
                });
            }
            grouped.get(subKegiatanId).target_angkas += nilai;
        }
        res.json({
            tahun: targetTahun,
            bulan: targetBulan,
            user_id: targetUserId,
            count: grouped.size,
            data: Array.from(grouped.values()),
        });
    }
    catch (error) {
        console.error('Error fetching angkas by sub kegiatan:', error);
        res.status(500).json({ error: 'Failed to fetch data', details: error.message });
    }
});
/**
 * GET /api/angkas/unmatched
 * Get angkas records that couldn't be matched to sub_kegiatan
 * Shows distinct kode_rekening per puskesmas (latest record only)
 */
router.get('/unmatched', auth_1.authenticate, authorize_1.authorizeAdmin, async (req, res) => {
    try {
        const { tahun } = req.query;
        const targetTahun = tahun ? parseInt(tahun) : new Date().getFullYear();
        // Get all unmatched records
        const allData = await models_1.AnggaranKas.findAll({
            where: {
                tahun: targetTahun,
                id_sub_kegiatan: null,
            },
            include: [
                { model: models_1.User, as: 'puskesmas', attributes: ['id', 'nama', 'username'] },
                { model: models_1.SumberAnggaran, as: 'sumberAnggaran', attributes: ['id_sumber', 'sumber'] },
            ],
            attributes: ['id', 'user_id', 'kode_rekening', 'uraian', 'tahun', 'id_sumber_anggaran', 'created_at'],
            order: [['created_at', 'DESC']],
        });
        // Get distinct kode_rekening per user_id + id_sumber_anggaran (latest only)
        const distinctMap = new Map();
        for (const record of allData) {
            const key = `${record.user_id}-${record.kode_rekening}-${record.id_sumber_anggaran}`;
            if (!distinctMap.has(key)) {
                distinctMap.set(key, record);
            }
        }
        const data = Array.from(distinctMap.values());
        res.json({
            tahun: targetTahun,
            count: data.length,
            data,
        });
    }
    catch (error) {
        console.error('Error fetching unmatched angkas:', error);
        res.status(500).json({ error: 'Failed to fetch data', details: error.message });
    }
});
/**
 * PUT /api/angkas/:id/match
 * Manually match an angkas record to a sub_kegiatan
 */
router.put('/:id/match', auth_1.authenticate, authorize_1.authorizeAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        const { id_sub_kegiatan } = req.body;
        if (!id_sub_kegiatan) {
            res.status(400).json({ error: 'id_sub_kegiatan is required' });
            return;
        }
        // Verify sub_kegiatan exists
        const subKegiatan = await models_1.SubKegiatan.findByPk(id_sub_kegiatan);
        if (!subKegiatan) {
            res.status(400).json({ error: 'Invalid sub_kegiatan' });
            return;
        }
        // Find the record
        const record = await models_1.AnggaranKas.findByPk(id);
        if (!record) {
            res.status(404).json({ error: 'Angkas record not found' });
            return;
        }
        // Update this record and all similar records (same kode_rekening)
        await models_1.AnggaranKas.update({ id_sub_kegiatan }, {
            where: {
                kode_rekening: record.kode_rekening,
                user_id: record.user_id,
            },
        });
        res.json({
            message: 'Successfully matched angkas to sub_kegiatan',
            kode_rekening: record.kode_rekening,
            id_sub_kegiatan,
        });
    }
    catch (error) {
        console.error('Error matching angkas:', error);
        res.status(500).json({ error: 'Failed to match record', details: error.message });
    }
});
/**
 * DELETE /api/angkas/bulk
 * Delete angkas data by filters
 */
router.delete('/bulk', auth_1.authenticate, authorize_1.authorizeAdmin, async (req, res) => {
    try {
        const { tahun, id_sumber_anggaran, user_id } = req.body;
        const where = {};
        if (tahun)
            where.tahun = parseInt(tahun);
        if (id_sumber_anggaran)
            where.id_sumber_anggaran = parseInt(id_sumber_anggaran);
        if (user_id)
            where.user_id = user_id;
        if (Object.keys(where).length === 0) {
            res.status(400).json({ error: 'At least one filter is required' });
            return;
        }
        const deleted = await models_1.AnggaranKas.destroy({ where });
        res.json({
            message: `Deleted ${deleted} angkas records`,
            deleted,
        });
    }
    catch (error) {
        console.error('Error deleting angkas:', error);
        res.status(500).json({ error: 'Failed to delete records', details: error.message });
    }
});
/**
 * GET /api/angkas/history
 * Get history of angkas values for a specific combination (user + sub_kegiatan + bulan)
 * Shows all historical values for tracking changes over time
 */
router.get('/history', auth_1.authenticate, async (req, res) => {
    try {
        const { user_id, id_sub_kegiatan, bulan, tahun } = req.query;
        const currentUser = req.user;
        // Admin can view any user's history, puskesmas can only view their own
        let targetUserId;
        if (currentUser.role === 'puskesmas') {
            targetUserId = currentUser.id;
        }
        else if (user_id) {
            targetUserId = user_id;
        }
        else {
            res.status(400).json({ error: 'user_id is required for admin' });
            return;
        }
        if (!id_sub_kegiatan) {
            res.status(400).json({ error: 'id_sub_kegiatan is required' });
            return;
        }
        if (!bulan) {
            res.status(400).json({ error: 'bulan is required' });
            return;
        }
        const targetTahun = tahun ? parseInt(tahun) : new Date().getFullYear();
        const targetBulan = parseInt(bulan);
        const targetSubKegiatan = parseInt(id_sub_kegiatan);
        // Get all historical records for this combination
        const history = await models_1.AnggaranKas.findAll({
            where: {
                user_id: targetUserId,
                id_sub_kegiatan: targetSubKegiatan,
                bulan: targetBulan,
                tahun: targetTahun,
            },
            include: [
                { model: models_1.User, as: 'creator', attributes: ['id', 'nama', 'username'] },
                { model: models_1.SubKegiatan, as: 'subKegiatan', attributes: ['id_sub_kegiatan', 'kegiatan', 'kode_sub'] },
                { model: models_1.SumberAnggaran, as: 'sumberAnggaran', attributes: ['id_sumber', 'sumber'] },
            ],
            order: [['created_at', 'DESC']],
        });
        res.json({
            user_id: targetUserId,
            id_sub_kegiatan: targetSubKegiatan,
            bulan: targetBulan,
            tahun: targetTahun,
            count: history.length,
            data: history.map((record) => ({
                id: record.id,
                kode_rekening: record.kode_rekening,
                uraian: record.uraian,
                nilai: Number(record.nilai),
                sumberAnggaran: record.sumberAnggaran,
                subKegiatan: record.subKegiatan,
                created_by: record.created_by,
                creator: record.creator,
                created_at: record.created_at,
            })),
        });
    }
    catch (error) {
        console.error('Error fetching angkas history:', error);
        res.status(500).json({ error: 'Failed to fetch history', details: error.message });
    }
});
/**
 * GET /api/angkas/history/all
 * Get comprehensive history of angkas for a specific user + sub_kegiatan (all months)
 * This shows the complete upload history connected with target data
 */
router.get('/history/all', auth_1.authenticate, async (req, res) => {
    try {
        const { user_id, id_sub_kegiatan, tahun } = req.query;
        const currentUser = req.user;
        // Admin can view any user's history, puskesmas can only view their own
        let targetUserId;
        if (currentUser.role === 'puskesmas') {
            targetUserId = currentUser.id;
        }
        else if (user_id) {
            targetUserId = user_id;
        }
        else {
            res.status(400).json({ error: 'user_id is required for admin' });
            return;
        }
        if (!id_sub_kegiatan) {
            res.status(400).json({ error: 'id_sub_kegiatan is required' });
            return;
        }
        const targetTahun = tahun ? parseInt(tahun) : new Date().getFullYear();
        const targetSubKegiatan = parseInt(id_sub_kegiatan);
        // Get all historical angkas records for this user + sub_kegiatan
        const angkasHistory = await models_1.AnggaranKas.findAll({
            where: {
                user_id: targetUserId,
                id_sub_kegiatan: targetSubKegiatan,
                tahun: targetTahun,
            },
            include: [
                { model: models_1.User, as: 'creator', attributes: ['id', 'nama', 'username'] },
                { model: models_1.SumberAnggaran, as: 'sumberAnggaran', attributes: ['id_sumber', 'sumber'] },
            ],
            order: [['created_at', 'DESC']],
        });
        // Get Target Anggaran (target_rp) - where bulan is NULL
        const targetAnggaran = await models_1.SubKegiatanTarget.findAll({
            where: {
                user_id: targetUserId,
                id_sub_kegiatan: targetSubKegiatan,
                tahun: targetTahun,
                bulan: null,
            },
            include: [
                { model: models_1.User, as: 'creator', attributes: ['id', 'nama', 'username'] },
                { model: models_1.SumberAnggaran, as: 'sumberAnggaran', attributes: ['id_sumber', 'sumber'] },
            ],
            order: [['created_at', 'DESC']],
        });
        // Get Target Kinerja (target_k) - where bulan is NOT NULL (monthly targets)
        const targetKinerja = await models_1.SubKegiatanTarget.findAll({
            where: {
                user_id: targetUserId,
                id_sub_kegiatan: targetSubKegiatan,
                tahun: targetTahun,
                bulan: { [sequelize_1.Op.not]: null },
            },
            include: [
                { model: models_1.User, as: 'creator', attributes: ['id', 'nama', 'username'] },
                { model: models_1.SumberAnggaran, as: 'sumberAnggaran', attributes: ['id_sumber', 'sumber'] },
                { model: models_1.Satuan, as: 'satuan', attributes: ['id_satuan', 'satuannya'] },
            ],
            order: [['created_at', 'DESC']],
        });
        // Group angkas by bulan for easier display
        const angkasByBulan = new Map();
        for (const record of angkasHistory) {
            const bulan = record.bulan;
            if (!angkasByBulan.has(bulan)) {
                angkasByBulan.set(bulan, []);
            }
            angkasByBulan.get(bulan).push({
                id: record.id,
                bulan: record.bulan,
                nilai: Number(record.nilai),
                sumberAnggaran: record.sumberAnggaran,
                creator: record.creator,
                created_at: record.created_at,
            });
        }
        // Convert Map to array format for frontend
        const angkasHistoryArray = Array.from(angkasByBulan.entries())
            .sort((a, b) => a[0] - b[0])
            .map(([bulan, values]) => ({
            bulan,
            values,
        }));
        res.json({
            success: true,
            data: {
                angkasHistory: angkasHistoryArray,
                targetAnggaran: targetAnggaran.map((t) => ({
                    id: t.id,
                    target_rp: Number(t.target_rp),
                    creator: t.creator,
                    created_at: t.created_at,
                })),
                targetKinerja: targetKinerja.map((t) => ({
                    id: t.id,
                    target_k: t.target_k,
                    satuan: t.satuan?.satuan || null,
                    creator: t.creator,
                    created_at: t.created_at,
                })),
            },
        });
    }
    catch (error) {
        console.error('Error fetching comprehensive angkas history:', error);
        res.status(500).json({ error: 'Failed to fetch history', details: error.message });
    }
});
/**
 * PUT /api/angkas/manual
 * Puskesmas manually update angkas values for a sub_kegiatan + sumber_anggaran combination
 * Only allowed for sub_kegiatan with multiple sumber_anggaran (isManualAngkas = true)
 * Creates new history records for each month
 */
router.put('/manual', auth_1.authenticate, (0, editPermission_1.checkEditPermission)('angkas'), async (req, res) => {
    try {
        const currentUser = req.user;
        const { id_sub_kegiatan, id_sumber_anggaran, tahun, bulanan, catatan } = req.body;
        // Validate required fields
        if (!id_sub_kegiatan || !id_sumber_anggaran || !tahun || !bulanan) {
            res.status(400).json({
                success: false,
                message: 'id_sub_kegiatan, id_sumber_anggaran, tahun, dan bulanan harus diisi'
            });
            return;
        }
        // Validate bulanan is array of 12 numbers
        if (!Array.isArray(bulanan) || bulanan.length !== 12) {
            res.status(400).json({
                success: false,
                message: 'bulanan harus berupa array dengan 12 nilai (Jan-Des)'
            });
            return;
        }
        // For puskesmas: verify they can only edit their own data
        const targetUserId = currentUser.role === 'puskesmas' ? currentUser.id : req.body.user_id || currentUser.id;
        if (currentUser.role === 'puskesmas') {
            // Check if this sub_kegiatan has multiple sumber_anggaran (isManualAngkas)
            const targetCount = await models_1.SubKegiatanTarget.count({
                where: {
                    user_id: targetUserId,
                    id_sub_kegiatan: parseInt(id_sub_kegiatan),
                    tahun: parseInt(tahun),
                    bulan: null, // yearly targets only
                },
                distinct: true,
                col: 'id_sumber_anggaran',
            });
            if (targetCount <= 1) {
                res.status(403).json({
                    success: false,
                    message: 'Anda hanya dapat mengedit angkas untuk sub kegiatan dengan lebih dari satu sumber anggaran. Sub kegiatan ini memiliki data angkas dari PDF.'
                });
                return;
            }
        }
        // Verify sub_kegiatan exists
        const subKegiatan = await models_1.SubKegiatan.findByPk(id_sub_kegiatan);
        if (!subKegiatan) {
            res.status(400).json({ success: false, message: 'Sub kegiatan tidak ditemukan' });
            return;
        }
        // Verify sumber_anggaran exists
        const sumberAnggaran = await models_1.SumberAnggaran.findByPk(id_sumber_anggaran);
        if (!sumberAnggaran) {
            res.status(400).json({ success: false, message: 'Sumber anggaran tidak ditemukan' });
            return;
        }
        // Get existing latest values for comparison
        const existingAngkas = await models_1.AnggaranKas.findAll({
            where: {
                user_id: targetUserId,
                id_sub_kegiatan: parseInt(id_sub_kegiatan),
                id_sumber_anggaran: parseInt(id_sumber_anggaran),
                tahun: parseInt(tahun),
            },
            order: [['created_at', 'DESC']],
        });
        // Get latest value per month
        const latestByMonth = new Map();
        for (const record of existingAngkas) {
            const bulan = record.getDataValue('bulan');
            if (!latestByMonth.has(bulan)) {
                latestByMonth.set(bulan, Number(record.getDataValue('nilai')) || 0);
            }
        }
        // Create records for months with changed values
        const recordsToCreate = [];
        const changedMonths = [];
        for (let bulan = 1; bulan <= 12; bulan++) {
            const newValue = Number(bulanan[bulan - 1]) || 0;
            const oldValue = latestByMonth.get(bulan) || 0;
            // Only create new record if value changed
            if (newValue !== oldValue) {
                changedMonths.push(bulan);
                recordsToCreate.push({
                    user_id: targetUserId,
                    id_sub_kegiatan: parseInt(id_sub_kegiatan),
                    id_sumber_anggaran: parseInt(id_sumber_anggaran),
                    kode_rekening: `MANUAL-${id_sub_kegiatan}-${id_sumber_anggaran}`,
                    uraian: catatan || `Input manual: ${subKegiatan.kegiatan}`,
                    tahun: parseInt(tahun),
                    bulan,
                    nilai: newValue,
                    created_by: currentUser.id,
                });
            }
        }
        if (recordsToCreate.length === 0) {
            res.json({
                success: true,
                message: 'Tidak ada perubahan nilai angkas',
                updated: 0,
            });
            return;
        }
        // Bulk create new records
        await models_1.AnggaranKas.bulkCreate(recordsToCreate);
        res.json({
            success: true,
            message: `Berhasil menyimpan angkas untuk ${recordsToCreate.length} bulan`,
            updated: recordsToCreate.length,
            changedMonths,
        });
    }
    catch (error) {
        console.error('Error saving manual angkas:', error);
        res.status(500).json({ success: false, message: 'Gagal menyimpan angkas', details: error.message });
    }
});
/**
 * PUT /api/angkas/admin/manual
 * Admin can update angkas for any puskesmas, without multi-sumber restriction
 */
router.put('/admin/manual', auth_1.authenticate, authorize_1.authorizeAdmin, async (req, res) => {
    try {
        const currentUser = req.user;
        const { user_id, id_sub_kegiatan, id_sumber_anggaran, tahun, bulanan, catatan } = req.body;
        // Validate required fields
        if (!user_id || !id_sub_kegiatan || !id_sumber_anggaran || !tahun || !bulanan) {
            res.status(400).json({
                success: false,
                message: 'user_id, id_sub_kegiatan, id_sumber_anggaran, tahun, dan bulanan harus diisi'
            });
            return;
        }
        // Validate bulanan is array of 12 numbers
        if (!Array.isArray(bulanan) || bulanan.length !== 12) {
            res.status(400).json({
                success: false,
                message: 'bulanan harus berupa array dengan 12 nilai (Jan-Des)'
            });
            return;
        }
        // Verify user exists
        const targetUser = await models_1.User.findByPk(user_id);
        if (!targetUser) {
            res.status(400).json({ success: false, message: 'User tidak ditemukan' });
            return;
        }
        // Verify sub_kegiatan exists
        const subKegiatan = await models_1.SubKegiatan.findByPk(id_sub_kegiatan);
        if (!subKegiatan) {
            res.status(400).json({ success: false, message: 'Sub kegiatan tidak ditemukan' });
            return;
        }
        // Verify sumber_anggaran exists
        const sumberAnggaran = await models_1.SumberAnggaran.findByPk(id_sumber_anggaran);
        if (!sumberAnggaran) {
            res.status(400).json({ success: false, message: 'Sumber anggaran tidak ditemukan' });
            return;
        }
        // Get existing latest values for comparison
        const existingAngkas = await models_1.AnggaranKas.findAll({
            where: {
                user_id,
                id_sub_kegiatan: parseInt(id_sub_kegiatan),
                id_sumber_anggaran: parseInt(id_sumber_anggaran),
                tahun: parseInt(tahun),
            },
            order: [['created_at', 'DESC']],
        });
        // Get latest value per month
        const latestByMonth = new Map();
        for (const record of existingAngkas) {
            const bulan = record.getDataValue('bulan');
            if (!latestByMonth.has(bulan)) {
                latestByMonth.set(bulan, Number(record.getDataValue('nilai')) || 0);
            }
        }
        // Create records for months with changed values
        const recordsToCreate = [];
        const changedMonths = [];
        for (let bulan = 1; bulan <= 12; bulan++) {
            const newValue = Number(bulanan[bulan - 1]) || 0;
            const oldValue = latestByMonth.get(bulan) || 0;
            // Only create new record if value changed
            if (newValue !== oldValue) {
                changedMonths.push(bulan);
                recordsToCreate.push({
                    user_id,
                    id_sub_kegiatan: parseInt(id_sub_kegiatan),
                    id_sumber_anggaran: parseInt(id_sumber_anggaran),
                    kode_rekening: `ADMIN-MANUAL-${id_sub_kegiatan}-${id_sumber_anggaran}`,
                    uraian: catatan || `Input manual oleh admin: ${subKegiatan.kegiatan}`,
                    tahun: parseInt(tahun),
                    bulan,
                    nilai: newValue,
                    created_by: currentUser.id,
                });
            }
        }
        if (recordsToCreate.length === 0) {
            res.json({
                success: true,
                message: 'Tidak ada perubahan nilai angkas',
                updated: 0,
            });
            return;
        }
        // Bulk create new records
        await models_1.AnggaranKas.bulkCreate(recordsToCreate);
        res.json({
            success: true,
            message: `Berhasil menyimpan angkas untuk ${recordsToCreate.length} bulan`,
            updated: recordsToCreate.length,
            changedMonths,
        });
    }
    catch (error) {
        console.error('Error saving admin manual angkas:', error);
        res.status(500).json({ success: false, message: 'Gagal menyimpan angkas', details: error.message });
    }
});
/**
 * GET /api/angkas/manual/history
 * Get history of manual angkas edits for a specific combination
 * Groups by sumber_anggaran to show complete edit history
 */
router.get('/manual/history', auth_1.authenticate, async (req, res) => {
    try {
        const { user_id, id_sub_kegiatan, id_sumber_anggaran, tahun } = req.query;
        const currentUser = req.user;
        // Admin can view any user's history, puskesmas can only view their own
        let targetUserId;
        if (currentUser.role === 'puskesmas') {
            targetUserId = currentUser.id;
        }
        else if (user_id) {
            targetUserId = user_id;
        }
        else {
            res.status(400).json({ success: false, message: 'user_id diperlukan untuk admin' });
            return;
        }
        if (!id_sub_kegiatan || !id_sumber_anggaran) {
            res.status(400).json({ success: false, message: 'id_sub_kegiatan dan id_sumber_anggaran diperlukan' });
            return;
        }
        const targetTahun = tahun ? parseInt(tahun) : new Date().getFullYear();
        // Get all records for this combination, ordered by created_at DESC
        const allRecords = await models_1.AnggaranKas.findAll({
            where: {
                user_id: targetUserId,
                id_sub_kegiatan: parseInt(id_sub_kegiatan),
                id_sumber_anggaran: parseInt(id_sumber_anggaran),
                tahun: targetTahun,
            },
            include: [
                { model: models_1.User, as: 'creator', attributes: ['id', 'nama', 'username'] },
                { model: models_1.SubKegiatan, as: 'subKegiatan', attributes: ['id_sub_kegiatan', 'kegiatan', 'kode_sub'] },
                { model: models_1.SumberAnggaran, as: 'sumberAnggaran', attributes: ['id_sumber', 'sumber'] },
            ],
            order: [['created_at', 'DESC'], ['bulan', 'ASC']],
        });
        // Group by created_at timestamp (batch edits)
        const batchMap = new Map();
        for (const record of allRecords) {
            const createdAt = record.created_at.toISOString();
            if (!batchMap.has(createdAt)) {
                batchMap.set(createdAt, []);
            }
            batchMap.get(createdAt).push({
                bulan: record.getDataValue('bulan'),
                nilai: Number(record.getDataValue('nilai')),
                uraian: record.getDataValue('uraian'),
            });
        }
        // Convert to array with metadata
        const history = Array.from(batchMap.entries()).map(([createdAt, records]) => {
            const firstRecord = allRecords.find(r => r.created_at.toISOString() === createdAt);
            return {
                created_at: createdAt,
                creator: firstRecord?.creator || null,
                uraian: records[0]?.uraian || '',
                bulanan: records.sort((a, b) => a.bulan - b.bulan),
                total: records.reduce((sum, r) => sum + r.nilai, 0),
            };
        });
        res.json({
            success: true,
            data: {
                user_id: targetUserId,
                id_sub_kegiatan: parseInt(id_sub_kegiatan),
                id_sumber_anggaran: parseInt(id_sumber_anggaran),
                tahun: targetTahun,
                subKegiatan: allRecords[0]?.subKegiatan || null,
                sumberAnggaran: allRecords[0]?.sumberAnggaran || null,
                history,
            },
        });
    }
    catch (error) {
        console.error('Error fetching manual angkas history:', error);
        res.status(500).json({ success: false, message: 'Gagal mengambil history', details: error.message });
    }
});
exports.default = router;
//# sourceMappingURL=angkas.routes.js.map