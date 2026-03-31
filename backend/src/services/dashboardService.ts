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
    cacheService.invalidatePattern(`dashboard:chart:${tahun}`);
    cacheService.invalidatePattern(`dashboard:puskesmas_reporting:${tahun}`);
  } else {
    cacheService.invalidatePattern('dashboard:');
  }
}

/**
 * Get budget YTD data with caching
 */
export async function getBudgetYTD(tahun: number): Promise<any[]> {
  const cacheKey = DASHBOARD_CACHE_KEYS.BUDGET_YTD(tahun);

  return cacheService.getOrFetch(cacheKey, async () => {
    const budgetData = await Laporan.findAll({
      attributes: [
        'bulan',
        [Laporan.sequelize!.fn('SUM', Laporan.sequelize!.col('target_rp')), 'target_rp'],
        [Laporan.sequelize!.fn('SUM', Laporan.sequelize!.col('realisasi_rp')), 'realisasi_rp']
      ],
      where: {
        tahun,
        status: 'terkirim'
      },
      group: ['bulan'],
      order: [
        [Laporan.sequelize!.literal(`
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

    return budgetData.map((item: any) => {
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
export async function getChartData(tahun: number, userId?: string, sumberAnggaranId?: number, subKegiatanId?: number): Promise<any> {
  const cacheKey = `dashboard:chart:${tahun}:${userId || 'all'}:${sumberAnggaranId || 'all'}:${subKegiatanId || 'all'}`;

  return cacheService.getOrFetch(cacheKey, async () => {
    const { Op } = require('sequelize');
    const { SubKegiatanTarget, AnggaranKas, SubKegiatan } = require('../models');

    const targetFilter: any = { tahun };
    const angkasFilter: any = { tahun };
    const laporanFilter: any = {
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
      Laporan.findAll({
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
    const getAnggaranForMonth = (targets: any[], year: number, monthNum: number) => {
      const grouped = new Map();
      // targets are ordered by created_at ASC, so later entries overwrite earlier ones
      targets.forEach((t: any) => {
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
    const getCumulativeAngkas = (angkas: any[], year: number, monthNum: number) => {
      const latestPerKeyPerMonth = new Map();
      // angkas are ordered by created_at ASC, so later entries overwrite earlier ones
      angkas.forEach((a: any) => {
        if (a.bulan <= monthNum) {
          const keyMonth = `${a.user_id}_${a.kode_rekening}_${a.id_sumber_anggaran}_${a.tahun}_${a.bulan}`;
          latestPerKeyPerMonth.set(keyMonth, a);
        }
      });

      // Find sub_kegiatan IDs that have MANUAL/ADMIN-MANUAL entries (split by sumber anggaran).
      // When these exist, the original PDF entry (combined/unsplit) must be excluded.
      const isManualEntry = (kodeRek: string) => kodeRek?.startsWith('MANUAL-') || kodeRek?.startsWith('ADMIN-MANUAL-');
      const subKegWithManual = new Set<number>();
      latestPerKeyPerMonth.forEach((record: any) => {
        if (isManualEntry(record.kode_rekening) && record.id_sub_kegiatan) {
          subKegWithManual.add(record.id_sub_kegiatan);
        }
      });

      // Sum values, excluding non-MANUAL entries for sub_kegiatan that have MANUAL splits
      let total = 0;
      latestPerKeyPerMonth.forEach((record: any) => {
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
      const anggaranForMonth = targetsForMonth.reduce((sum: number, t: any) => sum + (Number(t.target_rp) || 0), 0);
      const cumulativeAngkas = getCumulativeAngkas(allAngkas, tahun, monthNum);
      const laporanForMonth = laporanData.filter((l: any) => l.bulan === monthName);
      const realisasiRp = laporanForMonth.reduce((sum: number, l: any) => sum + (Number(l.realisasi_rp) || 0), 0);
      const totalFisik = laporanForMonth.reduce((sum: number, l: any) => sum + (Number(l.realisasi_fisik) || 0), 0);
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

    const processedData = rawData.map((data, index) => {
      if (index === 0) return data;
      const prevData = rawData.slice(0, index);
      const cumulativeRealisasiAnggaran = prevData.reduce((sum, d) => sum + d.realisasi_anggaran, 0) + data.realisasi_anggaran;
      const maxPrevFisik = Math.max(...prevData.map(d => d.realisasi_fisik), 0);
      const cumulativeRealisasiFisik = Math.max(maxPrevFisik, data.realisasi_fisik);
      return {
        ...data,
        realisasi_anggaran: cumulativeRealisasiAnggaran,
        realisasi_fisik: Math.round(cumulativeRealisasiFisik * 100) / 100
      };
    });

    if (processedData.length > 0) {
      processedData[0] = rawData[0];
    }

    return {
      data: processedData,
      debug: {
        targetsCount: allTargets.length,
        angkasCount: allAngkas.length,
        laporanCount: laporanData.length
      }
    };
  }, CACHE_TTL.MEDIUM); // 5 minutes for chart data
}

/**
 * Get puskesmas reporting details with caching
 */
export async function getPuskesmasReportingDetails(tahun: number, bulan?: string): Promise<any> {
  const cacheKey = DASHBOARD_CACHE_KEYS.PUSKESMAS_REPORTING(tahun, bulan);

  return cacheService.getOrFetch(cacheKey, async () => {
    const { QueryTypes } = require('sequelize');

    const laporanWhere: any = { tahun, status: 'terkirim' };
    if (bulan) laporanWhere.bulan = bulan;

    const allPuskesmas = await User.findAll({
      where: { role: 'puskesmas' },
      attributes: ['id', 'nama_puskesmas'],
      order: [['nama_puskesmas', 'ASC']],
      raw: true
    });

    const reportedLaporan = await Laporan.sequelize!.query(
      `SELECT
        l.user_id,
        u.nama_puskesmas,
        MAX(l.updated_at) as tanggal_lapor
      FROM laporan l
      INNER JOIN users u ON l.user_id = u.id
      WHERE l.tahun = :tahun
        AND l.status = 'terkirim'
        ${bulan ? "AND l.bulan = :bulan" : ""}
        AND u.role = 'puskesmas'
      GROUP BY l.user_id, u.nama_puskesmas`,
      {
        replacements: { tahun, bulan },
        type: QueryTypes.SELECT
      }
    ) as any[];

    const reportedMap = new Map(
      reportedLaporan.map(item => [item.user_id, { user_id: item.user_id, nama_puskesmas: item.nama_puskesmas, tanggal_lapor: item.tanggal_lapor }])
    );

    const sudahLapor: any[] = [];
    const belumLapor: any[] = [];

    allPuskesmas.forEach((puskesmas: any) => {
      if (reportedMap.has(puskesmas.id)) {
        const reported = reportedMap.get(puskesmas.id);
        sudahLapor.push({ user_id: puskesmas.id, nama_puskesmas: puskesmas.nama_puskesmas, tanggal_lapor: reported?.tanggal_lapor });
      } else {
        belumLapor.push({ user_id: puskesmas.id, nama_puskesmas: puskesmas.nama_puskesmas });
      }
    });

    return { sudahLapor, belumLapor };
  }, DASHBOARD_TTL);
}

export default {
  getDashboardStats,
  getBudgetMonthly,
  getTop10Absorption,
  getBottom10Absorption,
  getBudgetYTD,
  getChartData,
  getPuskesmasReportingDetails,
  invalidateDashboardCache,
  DASHBOARD_CACHE_KEYS,
};
