import { Router, Request, Response } from 'express';
import { Laporan } from '../models';
import { authenticate } from '../middleware/auth';
import { QueryTypes } from 'sequelize';
import { cacheService, CACHE_TTL } from '../services/cacheService';
import { getChartData } from '../services/dashboardService';

const router = Router();

// All routes require authentication (puskesmas role checked inline)
router.use(authenticate);

/**
 * GET /api/puskesmas/dashboard/stats
 * Puskesmas-specific laporan stats (own data only)
 */
router.get('/stats', async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    if (!userId) { res.status(401).json({ message: 'Unauthorized' }); return; }

    const tahun = req.query.tahun ? parseInt(req.query.tahun as string) : new Date().getFullYear();
    const bulan = req.query.bulan as string | undefined;

    const cacheKey = `puskesmas_dashboard:stats:${userId}:${tahun}:${bulan || 'all'}`;

    const stats = await cacheService.getOrFetch(cacheKey, async () => {
      const where: any = { tahun, user_id: userId };
      if (bulan) where.bulan = bulan;

      const [totalLaporan, statusCounts] = await Promise.all([
        Laporan.count({ where }),
        Laporan.findAll({
          attributes: [
            'status',
            [Laporan.sequelize!.fn('COUNT', Laporan.sequelize!.col('id')), 'count']
          ],
          where,
          group: ['status'],
          raw: true,
        }) as Promise<any[]>,
      ]);

      const tersimpan = parseInt((statusCounts.find(s => s.status === 'tersimpan') as any)?.count || '0');
      const terkirim = parseInt((statusCounts.find(s => s.status === 'terkirim') as any)?.count || '0');

      return { totalLaporan, tersimpan, terkirim };
    }, CACHE_TTL.SHORT * 2);

    res.json({ success: true, data: stats });
  } catch (error: any) {
    console.error('Puskesmas dashboard stats error:', error);
    res.status(500).json({ success: false, message: 'Gagal mengambil statistik' });
  }
});

/**
 * GET /api/puskesmas/dashboard/budget-ytd
 * Puskesmas-specific YTD budget (own data only)
 */
router.get('/budget-ytd', async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    if (!userId) { res.status(401).json({ message: 'Unauthorized' }); return; }

    const tahun = req.query.tahun ? parseInt(req.query.tahun as string) : new Date().getFullYear();

    const cacheKey = `puskesmas_dashboard:budget_ytd:${userId}:${tahun}`;

    const data = await cacheService.getOrFetch(cacheKey, async () => {
      const budgetData = await Laporan.findAll({
        attributes: [
          'bulan',
          [Laporan.sequelize!.fn('SUM', Laporan.sequelize!.col('target_rp')), 'target_rp'],
          [Laporan.sequelize!.fn('SUM', Laporan.sequelize!.col('realisasi_rp')), 'realisasi_rp'],
        ],
        where: { tahun, user_id: userId, status: 'terkirim' },
        group: ['bulan'],
        order: [
          [Laporan.sequelize!.literal(`
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

      return budgetData.map((item: any) => {
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
    }, CACHE_TTL.SHORT * 2);

    res.json({ success: true, data });
  } catch (error: any) {
    console.error('Puskesmas budget YTD error:', error);
    res.status(500).json({ success: false, message: 'Gagal mengambil data anggaran' });
  }
});

/**
 * GET /api/puskesmas/dashboard/budget-monthly
 * Puskesmas-specific monthly budget breakdown by sub-kegiatan
 */
router.get('/budget-monthly', async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    if (!userId) { res.status(401).json({ message: 'Unauthorized' }); return; }

    const tahun = req.query.tahun ? parseInt(req.query.tahun as string) : new Date().getFullYear();
    const bulan = req.query.bulan as string;
    if (!bulan) { res.status(400).json({ message: 'Bulan parameter required' }); return; }

    const cacheKey = `puskesmas_dashboard:budget_monthly:${userId}:${tahun}:${bulan}`;

    const result = await cacheService.getOrFetch(cacheKey, async () => {
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

      const data = await Laporan.sequelize!.query(query, {
        replacements: { tahun, bulan, userId },
        type: QueryTypes.SELECT,
      }) as any[];

      const processed = data.map((item: any) => {
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
    }, CACHE_TTL.SHORT * 2);

    res.json({ success: true, ...result });
  } catch (error: any) {
    console.error('Puskesmas budget monthly error:', error);
    res.status(500).json({ success: false, message: 'Gagal mengambil data anggaran bulanan' });
  }
});

/**
 * GET /api/puskesmas/dashboard/chart-data
 * Reuses admin chart service with user_id filter locked to current user
 */
router.get('/chart-data', async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    if (!userId) { res.status(401).json({ message: 'Unauthorized' }); return; }

    const tahun = req.query.tahun ? parseInt(req.query.tahun as string) : new Date().getFullYear();
    const sumberAnggaranId = req.query.sumberAnggaran ? parseInt(req.query.sumberAnggaran as string) : undefined;
    const subKegiatanId = req.query.subKegiatan ? parseInt(req.query.subKegiatan as string) : undefined;

    // Force userId to current user — puskesmas can only see own data
    const result = await getChartData(tahun, userId, sumberAnggaranId, subKegiatanId);

    res.json({ success: true, ...result });
  } catch (error: any) {
    console.error('Puskesmas chart data error:', error);
    res.status(500).json({ success: false, message: 'Gagal mengambil data chart' });
  }
});

export default router;
