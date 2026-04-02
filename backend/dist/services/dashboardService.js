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
exports.getBottom10Absorption = getBottom10Absorption;
exports.invalidateDashboardCache = invalidateDashboardCache;
exports.getBudgetYTD = getBudgetYTD;
exports.getChartData = getChartData;
exports.getPuskesmasReportingDetails = getPuskesmasReportingDetails;
const models_1 = require("../models");
const sequelize_1 = require("sequelize");
const cacheService_1 = require("./cacheService");
// Cache keys for dashboard data
exports.DASHBOARD_CACHE_KEYS = {
    STATS: (tahun, bulan) => `dashboard:stats:${tahun}:${bulan || 'all'}`,
    BUDGET_MONTHLY: (tahun, bulan) => `dashboard:budget_monthly:${tahun}:${bulan}`,
    TOP_10_ABSORPTION: (tahun, bulan) => `dashboard:top10:${tahun}:${bulan}`,
    BOTTOM_10_ABSORPTION: (tahun, bulan) => `dashboard:bottom10:${tahun}:${bulan}`,
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
            models_1.Laporan.count({ where: { ...where, status: 'terkirim' } }),
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
 * Get bottom 10 budget absorption with caching
 */
async function getBottom10Absorption(tahun, bulan) {
    const cacheKey = exports.DASHBOARD_CACHE_KEYS.BOTTOM_10_ABSORPTION(tahun, bulan);
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
      HAVING SUM(l.target_rp) > 0
      ORDER BY 
        CASE 
          WHEN SUM(l.target_rp) > 0 THEN (CAST(SUM(l.realisasi_rp) AS DECIMAL) / CAST(SUM(l.target_rp) AS DECIMAL)) * 100
          ELSE 0
        END ASC,
        CAST(SUM(l.realisasi_rp) AS DECIMAL) ASC
      LIMIT 10
    `;
        const bottom10Data = await models_1.Laporan.sequelize.query(query, {
            replacements: { tahun, bulan },
            type: sequelize_1.QueryTypes.SELECT
        });
        return bottom10Data.map((item) => ({
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
        cacheService_1.cacheService.invalidatePattern(`dashboard:bottom10:${tahun}`);
        cacheService_1.cacheService.invalidatePattern(`dashboard:budget_ytd:${tahun}`);
        cacheService_1.cacheService.invalidatePattern(`dashboard:chart:${tahun}`);
        cacheService_1.cacheService.invalidatePattern(`dashboard:puskesmas_reporting:${tahun}`);
    }
    else {
        cacheService_1.cacheService.invalidatePattern('dashboard:');
    }
}
/**
 * Get budget YTD data with caching
 */
async function getBudgetYTD(tahun) {
    const cacheKey = exports.DASHBOARD_CACHE_KEYS.BUDGET_YTD(tahun);
    return cacheService_1.cacheService.getOrFetch(cacheKey, async () => {
        const budgetData = await models_1.Laporan.findAll({
            attributes: [
                'bulan',
                [models_1.Laporan.sequelize.fn('SUM', models_1.Laporan.sequelize.col('target_rp')), 'target_rp'],
                [models_1.Laporan.sequelize.fn('SUM', models_1.Laporan.sequelize.col('realisasi_rp')), 'realisasi_rp']
            ],
            where: {
                tahun,
                status: 'terkirim'
            },
            group: ['bulan'],
            order: [
                [models_1.Laporan.sequelize.literal(`
          CASE bulan
            WHEN 'Januari' THEN 1
            WHEN 'Februari' THEN 2
            WHEN 'Maret' THEN 3
            WHEN 'April' THEN 4
            WHEN 'Mei' THEN 5
            WHEN 'Juni' THEN 6
            WHEN 'Juli' THEN 7
            WHEN 'Agustus' THEN 8
            WHEN 'September' THEN 9
            WHEN 'Oktober' THEN 10
            WHEN 'November' THEN 11
            WHEN 'Desember' THEN 12
          END
        `), 'ASC']
            ],
            raw: true
        });
        return budgetData.map((item) => {
            const targetRp = parseFloat(item.target_rp) || 0;
            const realisasiRp = parseFloat(item.realisasi_rp) || 0;
            const persentase = targetRp > 0 ? (realisasiRp / targetRp) * 100 : 0;
            return {
                bulan: item.bulan,
                target_rp: targetRp,
                realisasi_rp: realisasiRp,
                persentase: Math.round(persentase * 100) / 100
            };
        });
    }, DASHBOARD_TTL);
}
/**
 * Get chart data with caching
 */
async function getChartData(tahun, userId, sumberAnggaranId, subKegiatanId) {
    const cacheKey = `dashboard:chart:${tahun}:${userId || 'all'}:${sumberAnggaranId || 'all'}:${subKegiatanId || 'all'}`;
    return cacheService_1.cacheService.getOrFetch(cacheKey, async () => {
        const { Op } = require('sequelize');
        const { SubKegiatanTarget, AnggaranKas, SubKegiatan } = require('../models');
        const targetFilter = { tahun };
        const angkasFilter = { tahun };
        const laporanFilter = {
            tahun,
            status: { [Op.in]: ['terkirim', 'menunggu', 'diverifikasi'] }
        };
        if (userId) {
            targetFilter.user_id = userId;
            angkasFilter.user_id = userId;
            laporanFilter.user_id = userId;
        }
        if (sumberAnggaranId) {
            targetFilter.id_sumber_anggaran = sumberAnggaranId;
            angkasFilter.id_sumber_anggaran = sumberAnggaranId;
            laporanFilter.id_sumber_anggaran = sumberAnggaranId;
        }
        if (subKegiatanId) {
            targetFilter.id_sub_kegiatan = subKegiatanId;
            angkasFilter.id_sub_kegiatan = subKegiatanId;
            laporanFilter.id_sub_kegiatan = subKegiatanId;
        }
        const [allTargets, allAngkas, laporanData] = await Promise.all([
            SubKegiatanTarget.findAll({
                where: targetFilter,
                include: [{ model: SubKegiatan, as: 'subKegiatan', attributes: ['id_sub_kegiatan', 'kegiatan'] }],
                order: [['created_at', 'ASC']],
                raw: true, nest: true
            }),
            AnggaranKas.findAll({
                where: angkasFilter,
                order: [['created_at', 'ASC']],
                raw: true
            }),
            models_1.Laporan.findAll({
                where: laporanFilter,
                include: [{ model: SubKegiatan, as: 'subKegiatan', attributes: ['id_sub_kegiatan', 'kegiatan'] }],
                raw: true, nest: true
            })
        ]);
        const months = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
        // Helper: get anggaran valid at a specific month
        // Uses bulan_penetapan (effective month) instead of created_at for determining
        // which budget revision applies to each month.
        // For month M, keeps the latest-created target whose bulan_penetapan <= M.
        const getAnggaranForMonth = (targets, year, monthNum) => {
            const grouped = new Map();
            // targets are ordered by created_at ASC, so later entries overwrite earlier ones
            targets.forEach((t) => {
                // bulan_penetapan null = berlaku dari awal tahun (treated as month 1)
                const effectiveMonth = t.bulan_penetapan || 1;
                if (effectiveMonth <= monthNum) {
                    const key = `${t.user_id}_${t.id_sub_kegiatan}_${t.id_sumber_anggaran}_${t.tahun}`;
                    grouped.set(key, t);
                }
            });
            return Array.from(grouped.values());
        };
        // Helper: cumulative angkas up to month
        // When a sub_kegiatan has MANUAL entries (split by sumber anggaran),
        // exclude the original PDF entry (combined/unsplit) to avoid double-counting
        const getCumulativeAngkas = (angkas, year, monthNum) => {
            const latestPerKeyPerMonth = new Map();
            // angkas are ordered by created_at ASC, so later entries overwrite earlier ones
            angkas.forEach((a) => {
                if (a.bulan <= monthNum) {
                    const keyMonth = `${a.user_id}_${a.kode_rekening}_${a.id_sumber_anggaran}_${a.tahun}_${a.bulan}`;
                    latestPerKeyPerMonth.set(keyMonth, a);
                }
            });
            // Find sub_kegiatan IDs that have MANUAL/ADMIN-MANUAL entries (split by sumber anggaran).
            // When these exist, the original PDF entry (combined/unsplit) must be excluded.
            const isManualEntry = (kodeRek) => kodeRek?.startsWith('MANUAL-') || kodeRek?.startsWith('ADMIN-MANUAL-');
            const subKegWithManual = new Set();
            latestPerKeyPerMonth.forEach((record) => {
                if (isManualEntry(record.kode_rekening) && record.id_sub_kegiatan) {
                    subKegWithManual.add(record.id_sub_kegiatan);
                }
            });
            // Sum values, excluding non-MANUAL entries for sub_kegiatan that have MANUAL splits
            let total = 0;
            latestPerKeyPerMonth.forEach((record) => {
                if (subKegWithManual.has(record.id_sub_kegiatan) && !isManualEntry(record.kode_rekening)) {
                    return; // skip PDF entry — MANUAL split replaces it
                }
                total += Number(record.nilai) || 0;
            });
            return total;
        };
        const rawData = months.map((monthName, index) => {
            const monthNum = index + 1;
            const targetsForMonth = getAnggaranForMonth(allTargets, tahun, monthNum);
            const anggaranForMonth = targetsForMonth.reduce((sum, t) => sum + (Number(t.target_rp) || 0), 0);
            const cumulativeAngkas = getCumulativeAngkas(allAngkas, tahun, monthNum);
            const laporanForMonth = laporanData.filter((l) => l.bulan === monthName);
            const realisasiRp = laporanForMonth.reduce((sum, l) => sum + (Number(l.realisasi_rp) || 0), 0);
            const totalFisik = laporanForMonth.reduce((sum, l) => sum + (Number(l.realisasi_fisik) || 0), 0);
            const countFisik = laporanForMonth.length;
            const avgFisik = countFisik > 0 ? totalFisik / countFisik : 0;
            return {
                label: monthName,
                anggaran: anggaranForMonth,
                angkas: cumulativeAngkas,
                realisasi_anggaran: realisasiRp,
                realisasi_fisik: Math.round(avgFisik * 100) / 100
            };
        });
        // Carry forward: realisasi is cumulative (total spending up to that month),
        // so months without laporan should show at least the previous month's value
        let prevRealisasi = 0;
        let prevFisik = 0;
        const chartData = rawData.map(data => {
            prevRealisasi = data.realisasi_anggaran > 0 ? data.realisasi_anggaran : prevRealisasi;
            prevFisik = data.realisasi_fisik > 0 ? data.realisasi_fisik : prevFisik;
            return {
                ...data,
                realisasi_anggaran: Math.max(data.realisasi_anggaran, prevRealisasi),
                realisasi_fisik: Math.max(data.realisasi_fisik, prevFisik),
            };
        });
        return {
            data: chartData,
            debug: {
                targetsCount: allTargets.length,
                angkasCount: allAngkas.length,
                laporanCount: laporanData.length
            }
        };
    }, cacheService_1.CACHE_TTL.MEDIUM); // 5 minutes for chart data
}
/**
 * Get puskesmas reporting details with caching
 */
async function getPuskesmasReportingDetails(tahun, bulan) {
    const cacheKey = exports.DASHBOARD_CACHE_KEYS.PUSKESMAS_REPORTING(tahun, bulan);
    return cacheService_1.cacheService.getOrFetch(cacheKey, async () => {
        const { QueryTypes } = require('sequelize');
        const laporanWhere = { tahun, status: 'terkirim' };
        if (bulan)
            laporanWhere.bulan = bulan;
        const allPuskesmas = await models_1.User.findAll({
            where: { role: 'puskesmas' },
            attributes: ['id', 'nama_puskesmas'],
            order: [['nama_puskesmas', 'ASC']],
            raw: true
        });
        const reportedLaporan = await models_1.Laporan.sequelize.query(`SELECT
        l.user_id,
        u.nama_puskesmas,
        MAX(l.updated_at) as tanggal_lapor
      FROM laporan l
      INNER JOIN users u ON l.user_id = u.id
      WHERE l.tahun = :tahun
        AND l.status = 'terkirim'
        ${bulan ? "AND l.bulan = :bulan" : ""}
        AND u.role = 'puskesmas'
      GROUP BY l.user_id, u.nama_puskesmas`, {
            replacements: { tahun, bulan },
            type: QueryTypes.SELECT
        });
        const reportedMap = new Map(reportedLaporan.map(item => [item.user_id, { user_id: item.user_id, nama_puskesmas: item.nama_puskesmas, tanggal_lapor: item.tanggal_lapor }]));
        const sudahLapor = [];
        const belumLapor = [];
        allPuskesmas.forEach((puskesmas) => {
            if (reportedMap.has(puskesmas.id)) {
                const reported = reportedMap.get(puskesmas.id);
                sudahLapor.push({ user_id: puskesmas.id, nama_puskesmas: puskesmas.nama_puskesmas, tanggal_lapor: reported?.tanggal_lapor });
            }
            else {
                belumLapor.push({ user_id: puskesmas.id, nama_puskesmas: puskesmas.nama_puskesmas });
            }
        });
        return { sudahLapor, belumLapor };
    }, DASHBOARD_TTL);
}
exports.default = {
    getDashboardStats,
    getBudgetMonthly,
    getTop10Absorption,
    getBottom10Absorption,
    getBudgetYTD,
    getChartData,
    getPuskesmasReportingDetails,
    invalidateDashboardCache,
    DASHBOARD_CACHE_KEYS: exports.DASHBOARD_CACHE_KEYS,
};
//# sourceMappingURL=dashboardService.js.map