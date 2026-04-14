"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// backend/src/routes/lra.routes.ts
const express_1 = require("express");
const multer_1 = __importDefault(require("multer"));
const auth_1 = require("../middleware/auth");
const authorize_1 = require("../middleware/authorize");
const lraParserService_1 = require("../services/lraParserService");
const models_1 = require("../models");
const router = (0, express_1.Router)();
const upload = (0, multer_1.default)({
    storage: multer_1.default.memoryStorage(),
    limits: { fileSize: 20 * 1024 * 1024 }, // 20MB
    fileFilter: (_req, file, cb) => {
        if (file.mimetype === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
            file.originalname.endsWith('.xlsx')) {
            cb(null, true);
        }
        else {
            cb(new Error('Hanya file .xlsx yang diizinkan'));
        }
    },
});
/**
 * POST /api/lra/preview
 * Parse LRA file and return preview without saving to DB
 */
router.post('/preview', auth_1.authenticate, authorize_1.authorizeAdmin, upload.single('file'), async (req, res) => {
    if (!req.file) {
        res.status(400).json({ error: 'File tidak ditemukan' });
        return;
    }
    const bulanOverride = req.body.bulan || undefined;
    const tahunOverride = req.body.tahun ? parseInt(req.body.tahun) : undefined;
    const result = await (0, lraParserService_1.parseLraExcel)(req.file.buffer, req.file.originalname, bulanOverride, tahunOverride);
    if (!result.bulan || !result.tahun) {
        res.status(400).json({
            error: 'Bulan/tahun tidak terdeteksi dari nama file. Silakan isi manual.',
            bulanDetectedFromFilename: false,
        });
        return;
    }
    res.json({
        bulan: result.bulan,
        tahun: result.tahun,
        bulanDetectedFromFilename: result.bulanDetectedFromFilename,
        matchedCount: result.rows.length,
        unmatchedPuskesmas: result.unmatchedPuskesmas,
        unmatchedSubKegiatan: result.unmatchedSubKegiatan,
        unmatchedSumber: result.unmatchedSumber,
    });
});
/**
 * POST /api/lra/confirm
 * Re-parse and save to DB
 */
router.post('/confirm', auth_1.authenticate, authorize_1.authorizeAdmin, upload.single('file'), async (req, res) => {
    if (!req.file) {
        res.status(400).json({ error: 'File tidak ditemukan' });
        return;
    }
    const bulanOverride = req.body.bulan || undefined;
    const tahunOverride = req.body.tahun ? parseInt(req.body.tahun) : undefined;
    const result = await (0, lraParserService_1.parseLraExcel)(req.file.buffer, req.file.originalname, bulanOverride, tahunOverride);
    if (!result.bulan || !result.tahun) {
        res.status(400).json({ error: 'Bulan/tahun wajib diisi' });
        return;
    }
    if (result.rows.length === 0) {
        res.status(400).json({ error: 'Tidak ada data yang berhasil diparse dari file ini' });
        return;
    }
    const adminId = req.user.id;
    // Create batch
    const batch = await models_1.LraUploadBatch.create({
        filename: req.file.originalname,
        bulan: result.bulan,
        tahun: result.tahun,
        uploaded_by: adminId,
        row_count: result.rows.length,
    });
    // Insert all rows
    await models_1.LraRealisasi.bulkCreate(result.rows.map(r => ({
        batch_id: batch.id,
        user_id: r.userId,
        id_sub_kegiatan: r.idSubKegiatan,
        id_sumber_anggaran: r.idSumberAnggaran,
        bulan: r.bulan,
        tahun: r.tahun,
        realisasi_rp: r.realisasiRp,
    })), { validate: true });
    res.json({
        success: true,
        batchId: batch.id,
        rowCount: result.rows.length,
        bulan: result.bulan,
        tahun: result.tahun,
        unmatchedPuskesmas: result.unmatchedPuskesmas,
        unmatchedSubKegiatan: result.unmatchedSubKegiatan,
        unmatchedSumber: result.unmatchedSumber,
    });
});
/**
 * GET /api/lra/batches
 * List all upload batches
 */
router.get('/batches', auth_1.authenticate, authorize_1.authorizeAdmin, async (_req, res) => {
    const batches = await models_1.LraUploadBatch.findAll({
        include: [{ model: models_1.User, as: 'uploader', attributes: ['nama'] }],
        order: [['created_at', 'DESC']],
    });
    res.json(batches);
});
/**
 * GET /api/lra/realisasi?bulan=Januari&tahun=2026
 * Get latest LRA realisasi map for the current puskesmas user
 */
router.get('/realisasi', auth_1.authenticate, async (req, res) => {
    const { bulan, tahun } = req.query;
    if (!bulan || !tahun) {
        res.status(400).json({ error: 'bulan dan tahun wajib diisi' });
        return;
    }
    const userId = req.user.id;
    const lraMap = await (0, lraParserService_1.getLraRealisasiMap)(userId, bulan, parseInt(tahun));
    // Convert map to object for JSON response
    const result = {};
    lraMap.forEach((v, k) => { result[k] = v; });
    res.json({ realisasi: result, available: lraMap.size > 0 });
});
exports.default = router;
//# sourceMappingURL=lra.routes.js.map