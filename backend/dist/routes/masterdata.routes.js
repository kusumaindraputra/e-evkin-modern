"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const Satuan_1 = __importDefault(require("../models/Satuan"));
const SumberAnggaran_1 = __importDefault(require("../models/SumberAnggaran"));
const Kegiatan_1 = __importDefault(require("../models/Kegiatan"));
const SubKegiatan_1 = __importDefault(require("../models/SubKegiatan"));
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
// ============================================
// SATUAN ROUTES
// ============================================
// Get all satuan
router.get('/satuan', auth_1.authenticate, async (req, res, next) => {
    try {
        const satuan = await Satuan_1.default.findAll({
            order: [['satuannya', 'ASC']],
        });
        return res.json(satuan);
    }
    catch (error) {
        return next(error);
    }
});
// Get satuan by ID
router.get('/satuan/:id', auth_1.authenticate, async (req, res, next) => {
    try {
        const satuan = await Satuan_1.default.findByPk(req.params.id);
        if (!satuan) {
            return res.status(404).json({ message: 'Satuan tidak ditemukan' });
        }
        return res.json(satuan);
    }
    catch (error) {
        return next(error);
    }
});
// Create satuan (Admin only)
router.post('/satuan', auth_1.authenticate, async (req, res, next) => {
    try {
        // Check admin role
        if (req.user?.role !== 'admin') {
            return res.status(403).json({ message: 'Akses ditolak. Hanya admin yang dapat menambah satuan' });
        }
        const { satuannya } = req.body;
        if (!satuannya) {
            return res.status(400).json({ message: 'Nama satuan harus diisi' });
        }
        const satuan = await Satuan_1.default.create({ satuannya });
        return res.status(201).json(satuan);
    }
    catch (error) {
        return next(error);
    }
});
// Update satuan (Admin only)
router.put('/satuan/:id', auth_1.authenticate, async (req, res, next) => {
    try {
        // Check admin role
        if (req.user?.role !== 'admin') {
            return res.status(403).json({ message: 'Akses ditolak. Hanya admin yang dapat mengubah satuan' });
        }
        const satuan = await Satuan_1.default.findByPk(req.params.id);
        if (!satuan) {
            return res.status(404).json({ message: 'Satuan tidak ditemukan' });
        }
        const { satuannya } = req.body;
        if (!satuannya) {
            return res.status(400).json({ message: 'Nama satuan harus diisi' });
        }
        await satuan.update({ satuannya });
        return res.json(satuan);
    }
    catch (error) {
        return next(error);
    }
});
// Delete satuan (Admin only)
router.delete('/satuan/:id', auth_1.authenticate, async (req, res, next) => {
    try {
        // Check admin role
        if (req.user?.role !== 'admin') {
            return res.status(403).json({ message: 'Akses ditolak. Hanya admin yang dapat menghapus satuan' });
        }
        const satuan = await Satuan_1.default.findByPk(req.params.id);
        if (!satuan) {
            return res.status(404).json({ message: 'Satuan tidak ditemukan' });
        }
        await satuan.destroy();
        return res.json({ message: 'Satuan berhasil dihapus' });
    }
    catch (error) {
        return next(error);
    }
});
// ============================================
// SUMBER ANGGARAN ROUTES
// ============================================
// Get all sumber anggaran
router.get('/sumber-anggaran', auth_1.authenticate, async (req, res, next) => {
    try {
        const sumberAnggaran = await SumberAnggaran_1.default.findAll({
            order: [['sumber', 'ASC']],
        });
        return res.json(sumberAnggaran);
    }
    catch (error) {
        return next(error);
    }
});
// Get sumber anggaran by ID
router.get('/sumber-anggaran/:id', auth_1.authenticate, async (req, res, next) => {
    try {
        const sumberAnggaran = await SumberAnggaran_1.default.findByPk(req.params.id);
        if (!sumberAnggaran) {
            return res.status(404).json({ message: 'Sumber anggaran tidak ditemukan' });
        }
        return res.json(sumberAnggaran);
    }
    catch (error) {
        return next(error);
    }
});
// Create sumber anggaran (Admin only)
router.post('/sumber-anggaran', auth_1.authenticate, async (req, res, next) => {
    try {
        if (req.user?.role !== 'admin') {
            return res.status(403).json({ message: 'Akses ditolak. Hanya admin yang dapat menambah sumber anggaran' });
        }
        const { sumber } = req.body;
        if (!sumber) {
            return res.status(400).json({ message: 'Nama sumber anggaran harus diisi' });
        }
        const sumberAnggaran = await SumberAnggaran_1.default.create({ sumber });
        return res.status(201).json(sumberAnggaran);
    }
    catch (error) {
        return next(error);
    }
});
// Update sumber anggaran (Admin only)
router.put('/sumber-anggaran/:id', auth_1.authenticate, async (req, res, next) => {
    try {
        if (req.user?.role !== 'admin') {
            return res.status(403).json({ message: 'Akses ditolak. Hanya admin yang dapat mengubah sumber anggaran' });
        }
        const sumberAnggaran = await SumberAnggaran_1.default.findByPk(req.params.id);
        if (!sumberAnggaran) {
            return res.status(404).json({ message: 'Sumber anggaran tidak ditemukan' });
        }
        const { sumber } = req.body;
        if (!sumber) {
            return res.status(400).json({ message: 'Nama sumber anggaran harus diisi' });
        }
        await sumberAnggaran.update({ sumber });
        return res.json(sumberAnggaran);
    }
    catch (error) {
        return next(error);
    }
});
// Delete sumber anggaran (Admin only)
router.delete('/sumber-anggaran/:id', auth_1.authenticate, async (req, res, next) => {
    try {
        if (req.user?.role !== 'admin') {
            return res.status(403).json({ message: 'Akses ditolak. Hanya admin yang dapat menghapus sumber anggaran' });
        }
        const sumberAnggaran = await SumberAnggaran_1.default.findByPk(req.params.id);
        if (!sumberAnggaran) {
            return res.status(404).json({ message: 'Sumber anggaran tidak ditemukan' });
        }
        await sumberAnggaran.destroy();
        return res.json({ message: 'Sumber anggaran berhasil dihapus' });
    }
    catch (error) {
        return next(error);
    }
});
// ============================================
// KEGIATAN ROUTES
// ============================================
// GET all kegiatan with optional sub_kegiatan
router.get('/kegiatan', auth_1.authenticate, async (req, res, next) => {
    try {
        const includeSubKegiatan = req.query.include === 'sub';
        const kegiatan = await Kegiatan_1.default.findAll({
            include: includeSubKegiatan ? [
                {
                    model: SubKegiatan_1.default,
                    as: 'subKegiatan',
                }
            ] : [],
            order: [['kode', 'ASC']],
        });
        return res.json(kegiatan);
    }
    catch (error) {
        return next(error);
    }
});
// GET single kegiatan by ID
router.get('/kegiatan/:id', auth_1.authenticate, async (req, res, next) => {
    try {
        const { id } = req.params;
        const kegiatan = await Kegiatan_1.default.findByPk(id, {
            include: [
                {
                    model: SubKegiatan_1.default,
                    as: 'subKegiatan',
                }
            ],
        });
        if (!kegiatan) {
            return res.status(404).json({ message: 'Kegiatan tidak ditemukan' });
        }
        return res.json(kegiatan);
    }
    catch (error) {
        return next(error);
    }
});
// POST create new kegiatan (admin only)
router.post('/kegiatan', auth_1.authenticate, async (req, res, next) => {
    try {
        if (req.user?.role !== 'admin') {
            return res.status(403).json({ message: 'Akses ditolak. Hanya admin yang dapat menambah kegiatan' });
        }
        const { id_uraian, kode, kegiatan } = req.body;
        if (!id_uraian || !kode || !kegiatan) {
            return res.status(400).json({ message: 'id_uraian, kode, dan kegiatan harus diisi' });
        }
        const newKegiatan = await Kegiatan_1.default.create({
            id_uraian,
            kode,
            kegiatan,
        });
        return res.status(201).json(newKegiatan);
    }
    catch (error) {
        return next(error);
    }
});
// PUT update kegiatan (admin only)
router.put('/kegiatan/:id', auth_1.authenticate, async (req, res, next) => {
    try {
        if (req.user?.role !== 'admin') {
            return res.status(403).json({ message: 'Akses ditolak. Hanya admin yang dapat mengubah kegiatan' });
        }
        const { id } = req.params;
        const { id_uraian, kode, kegiatan } = req.body;
        const kegiatanRecord = await Kegiatan_1.default.findByPk(id);
        if (!kegiatanRecord) {
            return res.status(404).json({ message: 'Kegiatan tidak ditemukan' });
        }
        await kegiatanRecord.update({
            id_uraian,
            kode,
            kegiatan,
        });
        return res.json(kegiatanRecord);
    }
    catch (error) {
        return next(error);
    }
});
// DELETE kegiatan (admin only)
router.delete('/kegiatan/:id', auth_1.authenticate, async (req, res, next) => {
    try {
        if (req.user?.role !== 'admin') {
            return res.status(403).json({ message: 'Akses ditolak. Hanya admin yang dapat menghapus kegiatan' });
        }
        const { id } = req.params;
        const kegiatan = await Kegiatan_1.default.findByPk(id);
        if (!kegiatan) {
            return res.status(404).json({ message: 'Kegiatan tidak ditemukan' });
        }
        // Check if kegiatan has sub_kegiatan
        const subKegiatanCount = await SubKegiatan_1.default.count({ where: { id_kegiatan: id } });
        if (subKegiatanCount > 0) {
            return res.status(400).json({
                message: 'Tidak dapat menghapus kegiatan yang memiliki sub kegiatan. Hapus sub kegiatan terlebih dahulu.'
            });
        }
        await kegiatan.destroy();
        return res.json({ message: 'Kegiatan berhasil dihapus' });
    }
    catch (error) {
        return next(error);
    }
});
// ============================================
// SUB KEGIATAN ROUTES
// ============================================
// GET all sub_kegiatan with optional filter by id_kegiatan
router.get('/sub-kegiatan', auth_1.authenticate, async (req, res, next) => {
    try {
        const { id_kegiatan } = req.query;
        const whereClause = id_kegiatan ? { id_kegiatan: Number(id_kegiatan) } : {};
        const subKegiatan = await SubKegiatan_1.default.findAll({
            where: whereClause,
            include: [
                {
                    model: Kegiatan_1.default,
                    as: 'kegiatanParent',
                }
            ],
            order: [['kode_sub', 'ASC']],
        });
        return res.json(subKegiatan);
    }
    catch (error) {
        return next(error);
    }
});
// GET single sub_kegiatan by ID
router.get('/sub-kegiatan/:id', auth_1.authenticate, async (req, res, next) => {
    try {
        const { id } = req.params;
        const subKegiatan = await SubKegiatan_1.default.findByPk(id, {
            include: [
                {
                    model: Kegiatan_1.default,
                    as: 'kegiatanParent',
                }
            ],
        });
        if (!subKegiatan) {
            return res.status(404).json({ message: 'Sub kegiatan tidak ditemukan' });
        }
        return res.json(subKegiatan);
    }
    catch (error) {
        return next(error);
    }
});
// POST create new sub_kegiatan (admin only)
router.post('/sub-kegiatan', auth_1.authenticate, async (req, res, next) => {
    try {
        if (req.user?.role !== 'admin') {
            return res.status(403).json({ message: 'Akses ditolak. Hanya admin yang dapat menambah sub kegiatan' });
        }
        const { id_kegiatan, kode_sub, kegiatan, indikator_kinerja } = req.body;
        if (!id_kegiatan || !kode_sub || !kegiatan || !indikator_kinerja) {
            return res.status(400).json({
                message: 'id_kegiatan, kode_sub, kegiatan, dan indikator_kinerja harus diisi'
            });
        }
        // Check if parent kegiatan exists
        const parentKegiatan = await Kegiatan_1.default.findByPk(id_kegiatan);
        if (!parentKegiatan) {
            return res.status(404).json({ message: 'Kegiatan parent tidak ditemukan' });
        }
        const newSubKegiatan = await SubKegiatan_1.default.create({
            id_kegiatan,
            kode_sub,
            kegiatan,
            indikator_kinerja,
        });
        return res.status(201).json(newSubKegiatan);
    }
    catch (error) {
        return next(error);
    }
});
// PUT update sub_kegiatan (admin only)
router.put('/sub-kegiatan/:id', auth_1.authenticate, async (req, res, next) => {
    try {
        if (req.user?.role !== 'admin') {
            return res.status(403).json({ message: 'Akses ditolak. Hanya admin yang dapat mengubah sub kegiatan' });
        }
        const { id } = req.params;
        const { id_kegiatan, kode_sub, kegiatan, indikator_kinerja } = req.body;
        const subKegiatanRecord = await SubKegiatan_1.default.findByPk(id);
        if (!subKegiatanRecord) {
            return res.status(404).json({ message: 'Sub kegiatan tidak ditemukan' });
        }
        // If id_kegiatan is being changed, check if new parent exists
        if (id_kegiatan && id_kegiatan !== subKegiatanRecord.id_kegiatan) {
            const parentKegiatan = await Kegiatan_1.default.findByPk(id_kegiatan);
            if (!parentKegiatan) {
                return res.status(404).json({ message: 'Kegiatan parent tidak ditemukan' });
            }
        }
        await subKegiatanRecord.update({
            id_kegiatan,
            kode_sub,
            kegiatan,
            indikator_kinerja,
        });
        return res.json(subKegiatanRecord);
    }
    catch (error) {
        return next(error);
    }
});
// DELETE sub_kegiatan (admin only)
router.delete('/sub-kegiatan/:id', auth_1.authenticate, async (req, res, next) => {
    try {
        if (req.user?.role !== 'admin') {
            return res.status(403).json({ message: 'Akses ditolak. Hanya admin yang dapat menghapus sub kegiatan' });
        }
        const { id } = req.params;
        const subKegiatan = await SubKegiatan_1.default.findByPk(id);
        if (!subKegiatan) {
            return res.status(404).json({ message: 'Sub kegiatan tidak ditemukan' });
        }
        await subKegiatan.destroy();
        return res.json({ message: 'Sub kegiatan berhasil dihapus' });
    }
    catch (error) {
        return next(error);
    }
});
exports.default = router;
//# sourceMappingURL=masterdata.routes.js.map