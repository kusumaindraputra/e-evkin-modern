/**
 * Dashboard Service
 * 
 * Provides optimized dashboard queries with caching.
 * Caches computed statistics to reduce database load on frequently accessed endpoints.
 */

import { Laporan, User } from '../models';
import { QueryTypes } from 'sequelize';
import { cacheService, CACHE_TTL } from './cacheService';

// Cache keys for dashboard data
export const DASHBOARD_CACHE_KEYS = {
  STATS: (tahun: number, bulan?: string) => 
    `dashboard:stats:${tahun}:${bulan || 'all'}`,
  BUDGET_MONTHLY: (tahun: number, bulan: string) => 
    `dashboard:budget_monthly:${tahun}:${bulan}`,
  TOP_10_ABSORPTION: (tahun: number, bulan: string) => 
    `dashboard:top10:${tahun}:${bulan}`,
  BOTTOM_10_ABSORPTION: (tahun: number, bulan: string) => 
    `dashboard:bottom10:${tahun}:${bulan}`,
  BUDGET_YTD: (tahun: number) => 
    `dashboard:budget_ytd:${tahun}`,
  PUSKESMAS_REPORTING: (tahun: number, bulan?: string) => 
    `dashboard:puskesmas_reporting:${tahun}:${bulan || 'all'}`,
};

// Short TTL for dashboard data (2 minutes) since it can change frequently
const DASHBOARD_TTL = CACHE_TTL.SHORT * 2; // 2 minutes

interface DashboardStats {
  totalLaporan: number;
  tersimpan: number;
  terkirim: number;
  totalPuskesmas: number;
  puskesmasReporting: number;
  persentasePuskesmasReporting: number;
}

interface BudgetData {
  sub_kegiatan: string;
  kegiatan: string;
  target_rp: number;
  realisasi_rp: number;
  persentase: number;
}

interface PuskesmasAbsorption {
  puskesmas: string;
  target_rp: number;
  realisasi_rp: number;
  persentase: number;
}

/**
 * Get dashboard statistics with caching
 */
export async function getDashboardStats(tahun: number, bulan?: string): Promise<DashboardStats> {
  const cacheKey = DASHBOARD_CACHE_KEYS.STATS(tahun, bulan);
  
  return cacheService.getOrFetch(cacheKey, async () => {
    const where: any = { tahun };
    if (bulan) {
      where.bulan = bulan;
    }

    // Parallel queries for better performance
    const [totalLaporan, statusCounts, totalPuskesmas, puskesmasReporting] = await Promise.all([
      Laporan.count({ where }),
      Laporan.findAll({
        attributes: [
          'status',
          [Laporan.sequelize!.fn('COUNT', Laporan.sequelize!.col('id')), 'count']
        ],
        where,
        group: ['status'],
        raw: true
      }) as Promise<any[]>,
      User.count({ where: { role: 'puskesmas' } }),
      Laporan.count({
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
export async function getBudgetMonthly(tahun: number, bulan: string): Promise<{
  data: BudgetData[];
  summary: { totalTarget: number; totalRealisasi: number; totalPersentase: number };
}> {
  const cacheKey = DASHBOARD_CACHE_KEYS.BUDGET_MONTHLY(tahun, bulan);
  
  return cacheService.getOrFetch(cacheKey, async () => {
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

    const monthlyData = await Laporan.sequelize!.query(query, {
      replacements: { tahun, bulan },
      type: QueryTypes.SELECT
    }) as any[];

    const processedData = monthlyData.map((item: any) => {
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
export async function getTop10Absorption(tahun: number, bulan: string): Promise<PuskesmasAbsorption[]> {
  const cacheKey = DASHBOARD_CACHE_KEYS.TOP_10_ABSORPTION(tahun, bulan);
  
  return cacheService.getOrFetch(cacheKey, async () => {
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

    const top10Data = await Laporan.sequelize!.query(query, {
      replacements: { tahun, bulan },
      type: QueryTypes.SELECT
    }) as any[];

    return top10Data.map((item: any) => ({
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
export async function getBottom10Absorption(tahun: number, bulan: string): Promise<PuskesmasAbsorption[]> {
  const cacheKey = DASHBOARD_CACHE_KEYS.BOTTOM_10_ABSORPTION(tahun, bulan);
  
  return cacheService.getOrFetch(cacheKey, async () => {
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

    const bottom10Data = await Laporan.sequelize!.query(query, {
      replacements: { tahun, bulan },
      type: QueryTypes.SELECT
    }) as any[];

    return bottom10Data.map((item: any) => ({
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
export function invalidateDashboardCache(tahun?: number): void {
  if (tahun) {
    cacheService.invalidatePattern(`dashboard:stats:${tahun}`);
    cacheService.invalidatePattern(`dashboard:budget_monthly:${tahun}`);
    cacheService.invalidatePattern(`dashboard:top10:${tahun}`);
    cacheService.invalidatePattern(`dashboard:bottom10:${tahun}`);
    cacheService.invalidatePattern(`dashboard:budget_ytd:${tahun}`);
    cacheService.invalidatePattern(`dashboard:puskesmas_reporting:${tahun}`);
  } else {
    cacheService.invalidatePattern('dashboard:');
  }
}

export default {
  getDashboardStats,
  getBudgetMonthly,
  getTop10Absorption,
  getBottom10Absorption,
  invalidateDashboardCache,
  DASHBOARD_CACHE_KEYS,
};
