"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const crypto_1 = __importDefault(require("crypto"));
const models_1 = require("../models");
const auth_1 = require("../middleware/auth");
const cacheService_1 = require("../services/cacheService");
const router = (0, express_1.Router)();
// Apply authentication to all routes
router.use(auth_1.authenticate);
/**
 * Generate ETag from data content for HTTP caching
 */
function generateETag(data) {
    const hash = crypto_1.default.createHash('md5').update(JSON.stringify(data)).digest('hex');
    return `"${hash}"`;
}
/**
 * Send response with HTTP cache headers.
 * Returns 304 Not Modified if client's cached version matches.
 */
function sendCached(req, res, data, maxAge = 600) {
    const etag = generateETag(data);
    // Check If-None-Match header
    if (req.headers['if-none-match'] === etag) {
        res.status(304).end();
        return;
    }
    res.set({
        'ETag': etag,
        'Cache-Control': `private, max-age=${maxAge}, stale-while-revalidate=${maxAge * 2}`,
    });
    res.json(data);
}
// GET /api/reference/sumber-anggaran - Get all sumber anggaran (CACHED)
router.get('/sumber-anggaran', async (req, res) => {
    try {
        const formatted = await cacheService_1.cacheService.getOrFetch(cacheService_1.CACHE_KEYS.SUMBER_ANGGARAN, async () => {
            const data = await models_1.SumberAnggaran.findAll({
                order: [['id_sumber', 'ASC']],
            });
            return data.map(item => ({
                value: item.id_sumber,
                label: item.sumber,
            }));
        }, cacheService_1.CACHE_TTL.REFERENCE_DATA);
        sendCached(req, res, formatted);
    }
    catch (error) {
        console.error('Error fetching sumber anggaran:', error);
        res.status(500).json({ message: 'Error fetching sumber anggaran' });
    }
});
// GET /api/reference/satuan - Get all satuan (CACHED)
router.get('/satuan', async (req, res) => {
    try {
        const formatted = await cacheService_1.cacheService.getOrFetch(cacheService_1.CACHE_KEYS.SATUAN, async () => {
            const data = await models_1.Satuan.findAll({
                order: [['id_satuan', 'ASC']],
            });
            return data.map(item => ({
                value: item.id_satuan,
                label: item.satuannya,
            }));
        }, cacheService_1.CACHE_TTL.REFERENCE_DATA);
        sendCached(req, res, formatted);
    }
    catch (error) {
        console.error('Error fetching satuan:', error);
        res.status(500).json({ message: 'Error fetching satuan' });
    }
});
// GET /api/reference/kegiatan - Get all kegiatan (CACHED)
router.get('/kegiatan', async (req, res) => {
    try {
        const formatted = await cacheService_1.cacheService.getOrFetch(cacheService_1.CACHE_KEYS.KEGIATAN, async () => {
            const data = await models_1.Kegiatan.findAll({
                order: [['id_kegiatan', 'ASC']],
            });
            return data.map(item => ({
                value: item.id_kegiatan,
                label: `${item.kode} - ${item.kegiatan}`,
                kode: item.kode,
                kegiatan: item.kegiatan,
            }));
        }, cacheService_1.CACHE_TTL.REFERENCE_DATA);
        sendCached(req, res, formatted);
    }
    catch (error) {
        console.error('Error fetching kegiatan:', error);
        res.status(500).json({ message: 'Error fetching kegiatan' });
    }
});
// GET /api/reference/sub-kegiatan - Get all or filtered sub kegiatan (CACHED)
router.get('/sub-kegiatan', async (req, res) => {
    try {
        const { id_kegiatan } = req.query;
        // Use different cache key based on filter
        const cacheKey = id_kegiatan
            ? cacheService_1.CACHE_KEYS.SUB_KEGIATAN_BY_KEGIATAN(Number(id_kegiatan))
            : cacheService_1.CACHE_KEYS.SUB_KEGIATAN_ALL;
        const formatted = await cacheService_1.cacheService.getOrFetch(cacheKey, async () => {
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
            return data.map(item => ({
                value: item.id_sub_kegiatan,
                label: `${item.kode_sub} - ${item.kegiatan}`,
                id_kegiatan: item.id_kegiatan,
                kode_sub: item.kode_sub,
                kegiatan: item.kegiatan,
                indikator_kinerja: item.indikator_kinerja,
            }));
        }, cacheService_1.CACHE_TTL.REFERENCE_DATA);
        sendCached(req, res, formatted);
    }
    catch (error) {
        console.error('Error fetching sub kegiatan:', error);
        res.status(500).json({ message: 'Error fetching sub kegiatan' });
    }
});
// GET /api/reference/cache/stats - Get cache statistics (admin only)
router.get('/cache/stats', async (req, res) => {
    try {
        // Only admin can see cache stats
        if (req.user?.role !== 'admin') {
            res.status(403).json({ message: 'Forbidden' });
            return;
        }
        const stats = cacheService_1.cacheService.stats();
        res.json({
            success: true,
            data: stats,
        });
    }
    catch (error) {
        console.error('Error getting cache stats:', error);
        res.status(500).json({ message: 'Error getting cache stats' });
    }
});
// POST /api/reference/cache/invalidate - Invalidate cache (admin only)
router.post('/cache/invalidate', async (req, res) => {
    try {
        // Only admin can invalidate cache
        if (req.user?.role !== 'admin') {
            res.status(403).json({ message: 'Forbidden' });
            return;
        }
        const { pattern } = req.body;
        if (pattern) {
            const count = cacheService_1.cacheService.invalidatePattern(pattern);
            res.json({
                success: true,
                message: `Invalidated ${count} cache entries matching pattern: ${pattern}`,
            });
        }
        else {
            cacheService_1.cacheService.clear();
            res.json({
                success: true,
                message: 'All cache entries cleared',
            });
        }
    }
    catch (error) {
        console.error('Error invalidating cache:', error);
        res.status(500).json({ message: 'Error invalidating cache' });
    }
});
exports.default = router;
//# sourceMappingURL=reference.routes.js.map