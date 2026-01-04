"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const models_1 = require("../models");
const auth_1 = require("../middleware/auth");
const cacheService_1 = require("../services/cacheService");
const router = (0, express_1.Router)();
// Cache keys
const CACHE_KEYS = {
    SUMBER_ANGGARAN: 'reference:sumber-anggaran',
    SATUAN: 'reference:satuan',
    KEGIATAN: 'reference:kegiatan',
    SUB_KEGIATAN: (id) => id ? `reference:sub-kegiatan:${id}` : 'reference:sub-kegiatan:all',
};
// Apply authentication to all routes
router.use(auth_1.authenticate);
// GET /api/reference/sumber-anggaran - Get all sumber anggaran (cached)
router.get('/sumber-anggaran', async (_req, res) => {
    try {
        // Check cache first
        const cached = cacheService_1.cacheService.get(CACHE_KEYS.SUMBER_ANGGARAN);
        if (cached) {
            console.log('Cache hit: sumber-anggaran');
            res.json(cached);
            return;
        }
        const data = await models_1.SumberAnggaran.findAll({
            order: [['id_sumber', 'ASC']],
        });
        const formatted = data.map(item => ({
            value: item.id_sumber,
            label: item.sumber,
        }));
        // Cache the result
        cacheService_1.cacheService.set(CACHE_KEYS.SUMBER_ANGGARAN, formatted);
        res.json(formatted);
    }
    catch (error) {
        console.error('Error fetching sumber anggaran:', error);
        res.status(500).json({ message: 'Error fetching sumber anggaran' });
    }
});
// GET /api/reference/satuan - Get all satuan (cached)
router.get('/satuan', async (_req, res) => {
    try {
        // Check cache first
        const cached = cacheService_1.cacheService.get(CACHE_KEYS.SATUAN);
        if (cached) {
            console.log('Cache hit: satuan');
            res.json(cached);
            return;
        }
        const data = await models_1.Satuan.findAll({
            order: [['id_satuan', 'ASC']],
        });
        const formatted = data.map(item => ({
            value: item.id_satuan,
            label: item.satuannya,
        }));
        // Cache the result
        cacheService_1.cacheService.set(CACHE_KEYS.SATUAN, formatted);
        res.json(formatted);
    }
    catch (error) {
        console.error('Error fetching satuan:', error);
        res.status(500).json({ message: 'Error fetching satuan' });
    }
});
// GET /api/reference/kegiatan - Get all kegiatan (cached)
router.get('/kegiatan', async (_req, res) => {
    try {
        // Check cache first
        const cached = cacheService_1.cacheService.get(CACHE_KEYS.KEGIATAN);
        if (cached) {
            console.log('Cache hit: kegiatan');
            res.json(cached);
            return;
        }
        const data = await models_1.Kegiatan.findAll({
            order: [['id_kegiatan', 'ASC']],
        });
        const formatted = data.map(item => ({
            value: item.id_kegiatan,
            label: `${item.kode} - ${item.kegiatan}`,
            kode: item.kode,
            kegiatan: item.kegiatan,
        }));
        // Cache the result
        cacheService_1.cacheService.set(CACHE_KEYS.KEGIATAN, formatted);
        res.json(formatted);
    }
    catch (error) {
        console.error('Error fetching kegiatan:', error);
        res.status(500).json({ message: 'Error fetching kegiatan' });
    }
});
// GET /api/reference/sub-kegiatan - Get all or filtered sub kegiatan (cached)
router.get('/sub-kegiatan', async (req, res) => {
    try {
        const { id_kegiatan } = req.query;
        // Create cache key based on filter
        const cacheKey = CACHE_KEYS.SUB_KEGIATAN(id_kegiatan ? Number(id_kegiatan) : undefined);
        // Check cache first
        const cached = cacheService_1.cacheService.get(cacheKey);
        if (cached) {
            console.log(`Cache hit: sub-kegiatan ${id_kegiatan ? `(kegiatan: ${id_kegiatan})` : '(all)'}`);
            res.json(cached);
            return;
        }
        const where = {};
        if (id_kegiatan) {
            where.id_kegiatan = id_kegiatan;
        }
        const data = await models_1.SubKegiatan.findAll({
            where,
            include: [
                {
                    association: 'kegiatanParent',
                    attributes: ['id_kegiatan', 'kode', 'kegiatan'],
                },
            ],
            order: [['id_sub_kegiatan', 'ASC']],
        });
        const formatted = data.map(item => ({
            value: item.id_sub_kegiatan,
            label: `${item.kode_sub} - ${item.kegiatan}`,
            id_kegiatan: item.id_kegiatan,
            kode_sub: item.kode_sub,
            kegiatan: item.kegiatan,
            indikator_kinerja: item.indikator_kinerja,
        }));
        // Cache the result
        cacheService_1.cacheService.set(cacheKey, formatted);
        res.json(formatted);
    }
    catch (error) {
        console.error('Error fetching sub kegiatan:', error);
        res.status(500).json({ message: 'Error fetching sub kegiatan' });
    }
});
exports.default = router;
//# sourceMappingURL=reference.routes.js.map