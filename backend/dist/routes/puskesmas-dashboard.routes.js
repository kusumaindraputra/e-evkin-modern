"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const models_1 = require("../models");
const auth_1 = require("../middleware/auth");
const sequelize_1 = require("sequelize");
const cacheService_1 = require("../services/cacheService");
const dashboardService_1 = require("../services/dashboardService");
const router = (0, express_1.Router)();
// All routes require authentication (puskesmas role checked inline)
router.use(auth_1.authenticate);
/**
 * GET /api/puskesmas/dashboard/stats
 * Puskesmas-specific laporan stats (own data only)
 */
router.get('/stats', async (req, res) => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            res.status(401).json({ message: 'Unauthorized' });
            return;
        }
        const tahun = req.query.tahun ? parseInt(req.query.tahun) : new Date().getFullYear();
        const bulan = req.query.bulan;
        const cacheKey = `puskesmas_dashboard:stats:${userId}:${tahun}:${bulan || 'all'}`;
        const stats = await cacheService_1.cacheService.getOrFetch(cacheKey, async () => {
            const where = { tahun, user_id: userId };
            if (bulan)
                where.bulan = bulan;
            const [totalLaporan, statusCounts] = await Promise.all([
                models_1.Laporan.count({ where }),
                models_1.Laporan.findAll({
                    attributes: [
                        'status',
                        [models_1.Laporan.sequelize.fn('COUNT', models_1.Laporan.sequelize.col('id')), 'count']
                    ],
                    where,
                    group: ['status'],
                    raw: true,
                }),
            ]);
            const tersimpan = parseInt(statusCounts.find(s => s.status === 'tersimpan')?.count || '0');
            const terkirim = parseInt(statusCounts.find(s => s.status === 'terkirim')?.count || '0');
            return { totalLaporan, tersimpan, terkirim };
        }, cacheService_1.CACHE_TTL.SHORT * 2);
        res.json({ success: true, data: stats });
    }
    catch (error) {
        console.error('Puskesmas dashboard stats error:', error);
        res.status(500).json({ success: false, message: 'Gagal mengambil statistik' });
    }
});
/**
 * GET /api/puskesmas/dashboard/budget-ytd
 * Puskesmas-specific YTD budget (own data only)
 */
router.get('/budget-ytd', async (req, res) => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            res.status(401).json({ message: 'Unauthorized' });
            return;
        }
        const tahun = req.query.tahun ? parseInt(req.query.tahun) : new Date().getFullYear();
        const cacheKey = `puskesmas_dashboard:budget_ytd:${userId}:${tahun}`;
        const data = await cacheService_1.cacheService.getOrFetch(cacheKey, async () => {
            const budgetData = await models_1.Laporan.findAll({
                attributes: [
                    'bulan',
                    [models_1.Laporan.sequelize.fn('SUM', models_1.Laporan.sequelize.col('target_rp')), 'target_rp'],
                    [models_1.Laporan.sequelize.fn('SUM', models_1.Laporan.sequelize.col('realisasi_rp')), 'realisasi_rp'],
                ],
                where: { tahun, user_id: userId, status: 'terkirim' },
                group: ['bulan'],
                order: [
                    [models_1.Laporan.sequelize.literal(`
            CASE bulan
              WHEN 'Januari' THEN 1 WHEN 'Februari' THEN 2 WHEN 'Maret' THEN 3
              WHEN 'April' THEN 4 WHEN 'Mei' THEN 5 WHEN 'Juni' THEN 6
              WHEN 'Juli' THEN 7 WHEN 'Agustus' THEN 8 WHEN 'September' THEN 9
              WHEN 'Oktober' THEN 10 WHEN 'November' THEN 11 WHEN 'Desember' THEN 12
            END
          `), 'ASC'],
                ],
                raw: true,
            });
            return budgetData.map((item) => {
                const targetRp = parseFloat(item.target_rp) || 0;
                const realisasiRp = parseFloat(item.realisasi_rp) || 0;
                const persentase = targetRp > 0 ? (realisasiRp / targetRp) * 100 : 0;
                return {
                    bulan: item.bulan,
                    target_rp: targetRp,
                    realisasi_rp: realisasiRp,
                    persentase: Math.round(persentase * 100) / 100,
                };
            });
        }, cacheService_1.CACHE_TTL.SHORT * 2);
        res.json({ success: true, data });
    }
    catch (error) {
        console.error('Puskesmas budget YTD error:', error);
        res.status(500).json({ success: false, message: 'Gagal mengambil data anggaran' });
    }
});
/**
 * GET /api/puskesmas/dashboard/budget-monthly
 * Puskesmas-specific monthly budget breakdown by sub-kegiatan
 */
router.get('/budget-monthly', async (req, res) => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            res.status(401).json({ message: 'Unauthorized' });
            return;
        }
        const tahun = req.query.tahun ? parseInt(req.query.tahun) : new Date().getFullYear();
        const bulan = req.query.bulan;
        if (!bulan) {
            res.status(400).json({ message: 'Bulan parameter required' });
            return;
        }
        const cacheKey = `puskesmas_dashboard:budget_monthly:${userId}:${tahun}:${bulan}`;
        const result = await cacheService_1.cacheService.getOrFetch(cacheKey, async () => {
            const query = `
        SELECT
          l.id_sub_kegiatan,
          sk.kode_sub,
          sk.kegiatan as sub_kegiatan_nama,
          k.kode as kegiatan_kode,
          k.kegiatan as kegiatan_nama,
          SUM(l.target_rp) as target_rp,
          SUM(l.realisasi_rp) as realisasi_rp
        FROM laporan l
        INNER JOIN sub_kegiatan sk ON l.id_sub_kegiatan = sk.id_sub_kegiatan
        INNER JOIN kegiatan k ON sk.id_kegiatan = k.id_kegiatan
        WHERE l.tahun = :tahun AND l.bulan = :bulan AND l.user_id = :userId AND l.status = 'terkirim'
        GROUP BY l.id_sub_kegiatan, sk.kode_sub, sk.kegiatan, k.kode, k.kegiatan
        ORDER BY sk.kode_sub ASC
      `;
            const data = await models_1.Laporan.sequelize.query(query, {
                replacements: { tahun, bulan, userId },
                type: sequelize_1.QueryTypes.SELECT,
            });
            const processed = data.map((item) => {
                const targetRp = parseFloat(item.target_rp) || 0;
                const realisasiRp = parseFloat(item.realisasi_rp) || 0;
                const persentase = targetRp > 0 ? (realisasiRp / targetRp) * 100 : 0;
                return {
                    sub_kegiatan: `${item.kode_sub} - ${item.sub_kegiatan_nama}`,
                    kegiatan: `${item.kegiatan_kode} - ${item.kegiatan_nama}`,
                    target_rp: targetRp,
                    realisasi_rp: realisasiRp,
                    persentase: Math.round(persentase * 100) / 100,
                };
            });
            const totalTarget = processed.reduce((s, i) => s + i.target_rp, 0);
            const totalRealisasi = processed.reduce((s, i) => s + i.realisasi_rp, 0);
            return {
                data: processed,
                summary: {
                    totalTarget,
                    totalRealisasi,
                    totalPersentase: totalTarget > 0 ? Math.round((totalRealisasi / totalTarget) * 100 * 100) / 100 : 0,
                },
            };
        }, cacheService_1.CACHE_TTL.SHORT * 2);
        res.json({ success: true, ...result });
    }
    catch (error) {
        console.error('Puskesmas budget monthly error:', error);
        res.status(500).json({ success: false, message: 'Gagal mengambil data anggaran bulanan' });
    }
});
/**
 * GET /api/puskesmas/dashboard/chart-data
 * Reuses admin chart service with user_id filter locked to current user
 */
router.get('/chart-data', async (req, res) => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            res.status(401).json({ message: 'Unauthorized' });
            return;
        }
        const tahun = req.query.tahun ? parseInt(req.query.tahun) : new Date().getFullYear();
        const sumberAnggaranId = req.query.sumberAnggaran ? parseInt(req.query.sumberAnggaran) : undefined;
        const subKegiatanId = req.query.subKegiatan ? parseInt(req.query.subKegiatan) : undefined;
        // Force userId to current user — puskesmas can only see own data
        const result = await (0, dashboardService_1.getChartData)(tahun, userId, sumberAnggaranId, subKegiatanId);
        res.json({ success: true, ...result });
    }
    catch (error) {
        console.error('Puskesmas chart data error:', error);
        res.status(500).json({ success: false, message: 'Gagal mengambil data chart' });
    }
});
exports.default = router;
//# sourceMappingURL=puskesmas-dashboard.routes.js.map