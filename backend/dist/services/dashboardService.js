"use strict";
/**
 * Dashboard Service
 *
 * Provides optimized dashboard queries with caching.
 * Caches computed statistics to reduce database load on frequently accessed endpoints.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.DASHBOARD_CACHE_KEYS = void 0;
exports.getDashboardStats = getDashboardStats;
exports.getBudgetMonthly = getBudgetMonthly;
exports.getTop10Absorption = getTop10Absorption;
exports.invalidateDashboardCache = invalidateDashboardCache;
const models_1 = require("../models");
const sequelize_1 = require("sequelize");
const cacheService_1 = require("./cacheService");
// Cache keys for dashboard data
exports.DASHBOARD_CACHE_KEYS = {
    STATS: (tahun, bulan) => `dashboard:stats:${tahun}:${bulan || 'all'}`,
    BUDGET_MONTHLY: (tahun, bulan) => `dashboard:budget_monthly:${tahun}:${bulan}`,
    TOP_10_ABSORPTION: (tahun, bulan) => `dashboard:top10:${tahun}:${bulan}`,
    BUDGET_YTD: (tahun) => `dashboard:budget_ytd:${tahun}`,
    PUSKESMAS_REPORTING: (tahun, bulan) => `dashboard:puskesmas_reporting:${tahun}:${bulan || 'all'}`,
};
// Short TTL for dashboard data (2 minutes) since it can change frequently
const DASHBOARD_TTL = cacheService_1.CACHE_TTL.SHORT * 2; // 2 minutes
/**
 * Get dashboard statistics with caching
 */
async function getDashboardStats(tahun, bulan) {
    const cacheKey = exports.DASHBOARD_CACHE_KEYS.STATS(tahun, bulan);
    return cacheService_1.cacheService.getOrFetch(cacheKey, async () => {
        const where = { tahun };
        if (bulan) {
            where.bulan = bulan;
        }
        // Parallel queries for better performance
        const [totalLaporan, statusCounts, totalPuskesmas, puskesmasReporting] = await Promise.all([
            models_1.Laporan.count({ where }),
            models_1.Laporan.findAll({
                attributes: [
                    'status',
                    [models_1.Laporan.sequelize.fn('COUNT', models_1.Laporan.sequelize.col('id')), 'count']
                ],
                where,
                group: ['status'],
                raw: true
            }),
            models_1.User.count({ where: { role: 'puskesmas' } }),
            models_1.Laporan.count({
                where: { ...where, status: 'terkirim' },
                distinct: true,
                col: 'user_id'
            })
        ]);
        const tersimpan = statusCounts.find(s => s.status === 'tersimpan')?.count || 0;
        const terkirim = statusCounts.find(s => s.status === 'terkirim')?.count || 0;
        return {
            totalLaporan,
            tersimpan: parseInt(tersimpan),
            terkirim: parseInt(terkirim),
            totalPuskesmas,
            puskesmasReporting,
            persentasePuskesmasReporting: totalPuskesmas > 0
                ? Math.round((puskesmasReporting / totalPuskesmas) * 100 * 100) / 100
                : 0
        };
    }, DASHBOARD_TTL);
}
/**
 * Get monthly budget data with caching
 */
async function getBudgetMonthly(tahun, bulan) {
    const cacheKey = exports.DASHBOARD_CACHE_KEYS.BUDGET_MONTHLY(tahun, bulan);
    return cacheService_1.cacheService.getOrFetch(cacheKey, async () => {
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
      WHERE l.tahun = :tahun 
        AND l.bulan = :bulan
        AND l.status = 'terkirim'
      GROUP BY l.id_sub_kegiatan, sk.kode_sub, sk.kegiatan, k.kode, k.kegiatan
      ORDER BY sk.kode_sub ASC
    `;
        const monthlyData = await models_1.Laporan.sequelize.query(query, {
            replacements: { tahun, bulan },
            type: sequelize_1.QueryTypes.SELECT
        });
        const processedData = monthlyData.map((item) => {
            const targetRp = parseFloat(item.target_rp) || 0;
            const realisasiRp = parseFloat(item.realisasi_rp) || 0;
            const persentase = targetRp > 0 ? (realisasiRp / targetRp) * 100 : 0;
            return {
                sub_kegiatan: `${item.kode_sub} - ${item.sub_kegiatan_nama}`,
                kegiatan: `${item.kegiatan_kode} - ${item.kegiatan_nama}`,
                target_rp: targetRp,
                realisasi_rp: realisasiRp,
                persentase: Math.round(persentase * 100) / 100
            };
        });
        const totalTarget = processedData.reduce((sum, item) => sum + item.target_rp, 0);
        const totalRealisasi = processedData.reduce((sum, item) => sum + item.realisasi_rp, 0);
        const totalPersentase = totalTarget > 0 ? (totalRealisasi / totalTarget) * 100 : 0;
        return {
            data: processedData,
            summary: {
                totalTarget,
                totalRealisasi,
                totalPersentase: Math.round(totalPersentase * 100) / 100
            }
        };
    }, DASHBOARD_TTL);
}
/**
 * Get top 10 budget absorption with caching
 */
async function getTop10Absorption(tahun, bulan) {
    const cacheKey = exports.DASHBOARD_CACHE_KEYS.TOP_10_ABSORPTION(tahun, bulan);
    return cacheService_1.cacheService.getOrFetch(cacheKey, async () => {
        const query = `
      SELECT 
        u.username as puskesmas_nama,
        CAST(SUM(l.target_rp) AS DECIMAL) as target_rp,
        CAST(SUM(l.realisasi_rp) AS DECIMAL) as realisasi_rp,
        CASE 
          WHEN SUM(l.target_rp) > 0 THEN (CAST(SUM(l.realisasi_rp) AS DECIMAL) / CAST(SUM(l.target_rp) AS DECIMAL)) * 100
          ELSE 0
        END as persentase
      FROM laporan l
      INNER JOIN users u ON l.user_id = u.id
      WHERE l.tahun = :tahun 
        AND l.bulan = :bulan
        AND l.status = 'terkirim'
        AND u.role = 'puskesmas'
      GROUP BY u.username
      ORDER BY 
        CASE 
          WHEN SUM(l.target_rp) > 0 THEN (CAST(SUM(l.realisasi_rp) AS DECIMAL) / CAST(SUM(l.target_rp) AS DECIMAL)) * 100
          ELSE 0
        END DESC,
        CAST(SUM(l.realisasi_rp) AS DECIMAL) DESC
      LIMIT 10
    `;
        const top10Data = await models_1.Laporan.sequelize.query(query, {
            replacements: { tahun, bulan },
            type: sequelize_1.QueryTypes.SELECT
        });
        return top10Data.map((item) => ({
            puskesmas: item.puskesmas_nama,
            target_rp: parseFloat(item.target_rp) || 0,
            realisasi_rp: parseFloat(item.realisasi_rp) || 0,
            persentase: Math.round((parseFloat(item.persentase) || 0) * 100) / 100
        }));
    }, DASHBOARD_TTL);
}
/**
 * Invalidate dashboard cache when laporan data changes
 */
function invalidateDashboardCache(tahun) {
    if (tahun) {
        cacheService_1.cacheService.invalidatePattern(`dashboard:stats:${tahun}`);
        cacheService_1.cacheService.invalidatePattern(`dashboard:budget_monthly:${tahun}`);
        cacheService_1.cacheService.invalidatePattern(`dashboard:top10:${tahun}`);
        cacheService_1.cacheService.invalidatePattern(`dashboard:budget_ytd:${tahun}`);
        cacheService_1.cacheService.invalidatePattern(`dashboard:puskesmas_reporting:${tahun}`);
    }
    else {
        cacheService_1.cacheService.invalidatePattern('dashboard:');
    }
}
exports.default = {
    getDashboardStats,
    getBudgetMonthly,
    getTop10Absorption,
    invalidateDashboardCache,
    DASHBOARD_CACHE_KEYS: exports.DASHBOARD_CACHE_KEYS,
};
//# sourceMappingURL=dashboardService.js.map