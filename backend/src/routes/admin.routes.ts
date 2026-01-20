import { Router, Request, Response } from 'express';
import { Laporan, User, SubKegiatan, Kegiatan } from '../models';
import { authenticate } from '../middleware/auth';
import { Op, QueryTypes } from 'sequelize';
import { getDashboardStats, getBudgetMonthly, getTop10Absorption } from '../services/dashboardService';

const router = Router();

// Get all submitted laporan grouped by puskesmas for admin verification
router.get('/verifikasi', authenticate, async (req: Request, res: Response): Promise<void> => {
  try {
    const userRole = (req as any).user?.role;
    if (userRole !== 'admin') {
      res.status(403).json({ message: 'Access denied. Admin only.' });
      return;
    }

    const { puskesmas, bulan, tahun, page = 1, pageSize = 10 } = req.query;

    // Validate and parse numeric parameters
    const parsedTahun = tahun ? parseInt(tahun as string, 10) : undefined;
    const parsedPage = parseInt(page as string, 10) || 1;
    const parsedPageSize = parseInt(pageSize as string, 10) || 10;

    // Build where clause
    const where: any = {
      status: 'terkirim' // Only show submitted reports
    };

    if (bulan) where.bulan = bulan;
    if (parsedTahun && !isNaN(parsedTahun)) where.tahun = parsedTahun;

    // User filter
    const userWhere: any = {};
    if (puskesmas) {
      userWhere.nama_puskesmas = { [Op.like]: `%${puskesmas}%` };
    }

    const offset = (parsedPage - 1) * parsedPageSize;
    const limit = parsedPageSize;

    // Query laporan with grouping
    const { rows, count } = await Laporan.findAndCountAll({
      where,
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'username', 'nama', 'nama_puskesmas', 'kecamatan', 'wilayah'],
          where: userWhere
        },
        {
          model: SubKegiatan,
          as: 'subKegiatan',
          attributes: ['id_sub_kegiatan', 'kode_sub', 'kegiatan'],
          include: [{
            model: Kegiatan,
            as: 'kegiatanParent',
            attributes: ['id_kegiatan', 'kode', 'kegiatan']
          }]
        }
      ],
      offset,
      limit,
      order: [['user_id', 'ASC'], ['bulan', 'ASC'], ['tahun', 'DESC']]
    });

    // Group by puskesmas, bulan, tahun
    const grouped: any = {};
    rows.forEach((lap: any) => {
      const key = `${lap.user_id}_${lap.bulan}_${lap.tahun}`;
      if (!grouped[key]) {
        grouped[key] = {
          user_id: lap.user_id,
          puskesmas: lap.user?.nama_puskesmas || 'N/A',
          nama_lengkap: lap.user?.nama || 'N/A',
          kecamatan: lap.user?.kecamatan || 'N/A',
          wilayah: lap.user?.wilayah || 'N/A',
          bulan: lap.bulan,
          tahun: lap.tahun,
          total_laporan: 0,
          terkirim: 0,
          laporan: []
        };
      }
      grouped[key].total_laporan++;
      if (lap.status === 'terkirim') grouped[key].terkirim++;
      grouped[key].laporan.push(lap);
    });

    const result = Object.values(grouped);

    res.json({
      data: result,
      pagination: {
        total: count,
        page: parseInt(page as string),
        pageSize: parseInt(pageSize as string),
        totalPages: Math.ceil(count / parseInt(pageSize as string))
      }
    });
  } catch (error: any) {
    console.error('Admin verifikasi error:', error);
    res.status(500).json({ message: 'Gagal mengambil data verifikasi', error: error.message });
  }
});

// Get laporan detail for specific puskesmas + bulan + tahun
router.get('/laporan/:userId/:bulan/:tahun', authenticate, async (req: Request, res: Response): Promise<void> => {
  try {
    const userRole = (req as any).user?.role;
    if (userRole !== 'admin') {
      res.status(403).json({ message: 'Access denied. Admin only.' });
      return;
    }

    const { userId, bulan, tahun } = req.params;
    const { status, page = 1, pageSize = 50 } = req.query;

    const where: any = {
      user_id: userId,
      bulan,
      tahun: parseInt(tahun)
    };

    if (status) {
      where.status = status;
    } else {
      where.status = 'terkirim'; // Only show submitted reports
    }

    const offset = (parseInt(page as string) - 1) * parseInt(pageSize as string);
    const limit = parseInt(pageSize as string);

    const { rows, count } = await Laporan.findAndCountAll({
      where,
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'username', 'nama', 'nama_puskesmas', 'kecamatan']
        },
        {
          model: SubKegiatan,
          as: 'subKegiatan',
          attributes: ['id_sub_kegiatan', 'kode_sub', 'kegiatan', 'indikator_kinerja'],
          include: [{
            model: Kegiatan,
            as: 'kegiatanParent',
            attributes: ['id_kegiatan', 'kode', 'kegiatan']
          }]
        }
      ],
      offset,
      limit,
      order: [['id_kegiatan', 'ASC'], ['id_sub_kegiatan', 'ASC']]
    });

    res.json({
      data: rows,
      pagination: {
        total: count,
        page: parseInt(page as string),
        pageSize: parseInt(pageSize as string),
        totalPages: Math.ceil(count / parseInt(pageSize as string))
      }
    });
  } catch (error: any) {
    console.error('Admin laporan detail error:', error);
    res.status(500).json({ message: 'Gagal mengambil detail laporan', error: error.message });
  }
});

// Return laporan back to puskesmas for correction
router.put('/laporan/:id/return', authenticate, async (req: Request, res: Response): Promise<void> => {
  try {
    const userRole = (req as any).user?.role;
    if (userRole !== 'admin') {
      res.status(403).json({ message: 'Access denied. Admin only.' });
      return;
    }

    const { id } = req.params;
    const { catatan } = req.body;

    const laporan = await Laporan.findByPk(id);
    if (!laporan) {
      res.status(404).json({ message: 'Laporan tidak ditemukan' });
      return;
    }

    if (laporan.status !== 'terkirim') {
      res.status(400).json({ message: 'Hanya laporan dengan status "terkirim" yang dapat dikembalikan' });
      return;
    }

    await laporan.update({ 
      status: 'tersimpan',
      catatan: catatan || null
    });

    res.json({
      message: 'Laporan berhasil dikembalikan ke puskesmas',
      data: laporan
    });
  } catch (error: any) {
    console.error('Return laporan error:', error);
    res.status(500).json({ message: 'Gagal mengembalikan laporan', error: error.message });
  }
});

// Bulk return laporan back to puskesmas
router.post('/laporan/bulk-return', authenticate, async (req: Request, res: Response): Promise<void> => {
  try {
    const userRole = (req as any).user?.role;
    if (userRole !== 'admin') {
      res.status(403).json({ message: 'Access denied. Admin only.' });
      return;
    }

    const { userId, bulan, tahun, catatan } = req.body;

    if (!userId || !bulan || !tahun) {
      res.status(400).json({ message: 'userId, bulan, dan tahun wajib diisi' });
      return;
    }

    const [updated] = await Laporan.update(
      { 
        status: 'tersimpan',
        catatan: catatan || null
      },
      {
        where: {
          user_id: userId,
          bulan,
          tahun: parseInt(tahun),
          status: 'terkirim'
        }
      }
    );

    res.json({
      message: `${updated} laporan berhasil dikembalikan ke puskesmas`,
      updated
    });
  } catch (error: any) {
    console.error('Bulk return error:', error);
    res.status(500).json({ message: 'Gagal mengembalikan laporan', error: error.message });
  }
});

// Get dashboard statistics for admin (CACHED)
router.get('/dashboard/stats', authenticate, async (req: Request, res: Response): Promise<void> => {
  try {
    const userRole = (req as any).user?.role;
    if (userRole !== 'admin') {
      res.status(403).json({ message: 'Access denied. Admin only.' });
      return;
    }

    const { tahun, bulan } = req.query;
    const currentYear = tahun ? parseInt(tahun as string) : new Date().getFullYear();
    const currentMonth = bulan as string || undefined;

    // Use cached dashboard service
    const stats = await getDashboardStats(currentYear, currentMonth);

    res.status(200).json({
      message: 'Dashboard statistics retrieved successfully',
      data: stats,
      tahun: currentYear,
      bulan: currentMonth
    });
  } catch (error: any) {
    console.error('Dashboard stats error:', error);
    res.status(500).json({ message: 'Gagal mengambil statistik dashboard', error: error.message });
  }
});

// Get budget realization per month for dashboard (with month filter) - CACHED
router.get('/dashboard/budget-monthly', authenticate, async (req: Request, res: Response): Promise<void> => {
  try {
    const userRole = (req as any).user?.role;
    if (userRole !== 'admin') {
      res.status(403).json({ message: 'Access denied. Admin only.' });
      return;
    }

    const { tahun, bulan } = req.query;
    const currentYear = tahun ? parseInt(tahun as string) : new Date().getFullYear();
    const currentMonth = bulan as string;

    if (!currentMonth) {
      res.status(400).json({ message: 'Bulan parameter is required' });
      return;
    }

    // Use cached dashboard service
    const result = await getBudgetMonthly(currentYear, currentMonth);

    res.status(200).json({
      message: 'Monthly budget data retrieved successfully',
      data: result.data,
      summary: result.summary,
      tahun: currentYear,
      bulan: currentMonth
    });
  } catch (error: any) {
    console.error('Monthly budget error:', error);
    res.status(500).json({ message: 'Gagal mengambil data anggaran bulanan', error: error.message });
  }
});

// Get top 10 budget absorption for dashboard - CACHED
router.get('/dashboard/top-10-absorption', authenticate, async (req: Request, res: Response): Promise<void> => {
  try {
    const userRole = (req as any).user?.role;
    if (userRole !== 'admin') {
      res.status(403).json({ message: 'Access denied. Admin only.' });
      return;
    }

    const { tahun, bulan } = req.query;
    const currentYear = tahun ? parseInt(tahun as string) : new Date().getFullYear();
    const currentMonth = bulan as string;

    if (!currentMonth) {
      res.status(400).json({ message: 'Bulan parameter is required' });
      return;
    }

    // Use cached dashboard service
    const processedData = await getTop10Absorption(currentYear, currentMonth);

    res.status(200).json({
      message: 'Top 10 absorption data retrieved successfully',
      data: processedData,
      tahun: currentYear,
      bulan: currentMonth
    });
  } catch (error: any) {
    console.error('Top 10 absorption error:', error);
    res.status(500).json({ message: 'Gagal mengambil data top 10 penyerapan', error: error.message });
  }
});

// Get budget realization year to date for dashboard
router.get('/dashboard/budget-ytd', authenticate, async (req: Request, res: Response): Promise<void> => {
  try {
    const userRole = (req as any).user?.role;
    if (userRole !== 'admin') {
      res.status(403).json({ message: 'Access denied. Admin only.' });
      return;
    }

    const { tahun } = req.query;
    const currentYear = tahun ? parseInt(tahun as string) : new Date().getFullYear();

    // Query untuk mendapatkan total target_rp dan realisasi_rp per bulan
    const budgetData = await Laporan.findAll({
      attributes: [
        'bulan',
        [Laporan.sequelize!.fn('SUM', Laporan.sequelize!.col('target_rp')), 'target_rp'],
        [Laporan.sequelize!.fn('SUM', Laporan.sequelize!.col('realisasi_rp')), 'realisasi_rp']
      ],
      where: {
        tahun: currentYear,
        status: 'terkirim' // Only count submitted reports
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

    // Calculate percentage for each month
    const processedData = budgetData.map((item: any) => {
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

    res.json({
      message: 'Data realisasi anggaran berhasil diambil',
      data: processedData,
      tahun: currentYear
    });
  } catch (error: any) {
    console.error('Budget YTD error:', error);
    res.status(500).json({ message: 'Gagal mengambil data anggaran', error: error.message });
  }
});

// Get puskesmas reporting details (who has reported and who hasn't)
router.get('/dashboard/puskesmas-reporting-details', authenticate, async (req: Request, res: Response): Promise<void> => {
  try {
    const userRole = (req as any).user?.role;
    if (userRole !== 'admin') {
      res.status(403).json({ message: 'Access denied. Admin only.' });
      return;
    }

    const { tahun, bulan } = req.query;
    const currentYear = tahun ? parseInt(tahun as string) : new Date().getFullYear();
    const currentMonth = bulan as string || undefined;

    // Build where clause for laporan
    const laporanWhere: any = { tahun: currentYear, status: 'terkirim' };
    if (currentMonth) {
      laporanWhere.bulan = currentMonth;
    }

    // Get all puskesmas users
    const allPuskesmas = await User.findAll({
      where: { role: 'puskesmas' },
      attributes: ['id', 'nama_puskesmas'],
      order: [['nama_puskesmas', 'ASC']],
      raw: true
    });

    // Use raw query to get puskesmas that have submitted reports with latest date
    const reportedLaporan = await Laporan.sequelize!.query(
      `SELECT 
        l.user_id,
        u.nama_puskesmas,
        MAX(l.updated_at) as tanggal_lapor
      FROM laporan l
      INNER JOIN users u ON l.user_id = u.id
      WHERE l.tahun = :tahun 
        AND l.status = 'terkirim'
        ${currentMonth ? "AND l.bulan = :bulan" : ""}
        AND u.role = 'puskesmas'
      GROUP BY l.user_id, u.nama_puskesmas`,
      {
        replacements: { tahun: currentYear, bulan: currentMonth },
        type: QueryTypes.SELECT
      }
    ) as any[];

    // Create map of reported puskesmas
    const reportedMap = new Map(
      reportedLaporan.map(item => [
        item.user_id,
        {
          user_id: item.user_id,
          nama_puskesmas: item.nama_puskesmas,
          tanggal_lapor: item.tanggal_lapor
        }
      ])
    );

    // Separate puskesmas into reported and not reported
    const sudahLapor: any[] = [];
    const belumLapor: any[] = [];

    allPuskesmas.forEach((puskesmas: any) => {
      if (reportedMap.has(puskesmas.id)) {
        const reported = reportedMap.get(puskesmas.id);
        sudahLapor.push({
          user_id: puskesmas.id,
          nama_puskesmas: puskesmas.nama_puskesmas,
          tanggal_lapor: reported?.tanggal_lapor
        });
      } else {
        belumLapor.push({
          user_id: puskesmas.id,
          nama_puskesmas: puskesmas.nama_puskesmas
        });
      }
    });

    res.status(200).json({
      message: 'Puskesmas reporting details retrieved successfully',
      data: {
        sudahLapor,
        belumLapor
      },
      tahun: currentYear,
      bulan: currentMonth
    });
  } catch (error: any) {
    console.error('Puskesmas reporting details error:', error);
    res.status(500).json({ message: 'Gagal mengambil detail puskesmas', error: error.message });
  }
});

export default router;
