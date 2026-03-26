import { Router, Request, Response } from 'express';
import { Laporan, User, SubKegiatan, Kegiatan } from '../models';
import { authenticate } from '../middleware/auth';
import { authorizeAdmin } from '../middleware/authorize';
import { Op } from 'sequelize';
import { getDashboardStats, getBudgetMonthly, getTop10Absorption, getBottom10Absorption, getBudgetYTD, getChartData, getPuskesmasReportingDetails } from '../services/dashboardService';

const router = Router();

// Get all submitted laporan grouped by puskesmas for admin verification
router.get('/verifikasi', authenticate, authorizeAdmin, async (req: Request, res: Response): Promise<void> => {
  try {

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
    res.status(500).json({ success: false, message: 'Gagal mengambil data verifikasi' });
  }
});

// Get laporan detail for specific puskesmas + bulan + tahun
router.get('/laporan/:userId/:bulan/:tahun', authenticate, authorizeAdmin, async (req: Request, res: Response): Promise<void> => {
  try {

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
    res.status(500).json({ success: false, message: 'Gagal mengambil detail laporan' });
  }
});

// Return laporan back to puskesmas for correction
router.put('/laporan/:id/return', authenticate, authorizeAdmin, async (req: Request, res: Response): Promise<void> => {
  try {

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
    res.status(500).json({ success: false, message: 'Gagal mengembalikan laporan' });
  }
});

// Bulk return laporan back to puskesmas
router.post('/laporan/bulk-return', authenticate, authorizeAdmin, async (req: Request, res: Response): Promise<void> => {
  try {

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
    res.status(500).json({ success: false, message: 'Gagal mengembalikan laporan' });
  }
});

// Get dashboard statistics for admin (CACHED)
router.get('/dashboard/stats', authenticate, authorizeAdmin, async (req: Request, res: Response): Promise<void> => {
  try {

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
    res.status(500).json({ success: false, message: 'Gagal mengambil statistik dashboard' });
  }
});

// Get budget realization per month for dashboard (with month filter) - CACHED
router.get('/dashboard/budget-monthly', authenticate, authorizeAdmin, async (req: Request, res: Response): Promise<void> => {
  try {

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
    res.status(500).json({ success: false, message: 'Gagal mengambil data anggaran bulanan' });
  }
});

// Get top 10 budget absorption for dashboard - CACHED
router.get('/dashboard/top-10-absorption', authenticate, authorizeAdmin, async (req: Request, res: Response): Promise<void> => {
  try {

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
    res.status(500).json({ success: false, message: 'Gagal mengambil data top 10 penyerapan' });
  }
});

// Get bottom 10 budget absorption for dashboard - CACHED
router.get('/dashboard/bottom-10-absorption', authenticate, authorizeAdmin, async (req: Request, res: Response): Promise<void> => {
  try {

    const { tahun, bulan } = req.query;
    const currentYear = tahun ? parseInt(tahun as string) : new Date().getFullYear();
    const currentMonth = bulan as string;

    if (!currentMonth) {
      res.status(400).json({ message: 'Bulan parameter is required' });
      return;
    }

    // Use cached dashboard service
    const processedData = await getBottom10Absorption(currentYear, currentMonth);

    res.status(200).json({
      message: 'Bottom 10 absorption data retrieved successfully',
      data: processedData,
      tahun: currentYear,
      bulan: currentMonth
    });
  } catch (error: any) {
    console.error('Bottom 10 absorption error:', error);
    res.status(500).json({ success: false, message: 'Gagal mengambil data bottom 10 penyerapan' });
  }
});

// Get budget realization year to date for dashboard - CACHED
router.get('/dashboard/budget-ytd', authenticate, authorizeAdmin, async (req: Request, res: Response): Promise<void> => {
  try {
    const { tahun } = req.query;
    const currentYear = tahun ? parseInt(tahun as string) : new Date().getFullYear();

    const processedData = await getBudgetYTD(currentYear);

    res.json({
      message: 'Data realisasi anggaran berhasil diambil',
      data: processedData,
      tahun: currentYear
    });
  } catch (error: any) {
    console.error('Budget YTD error:', error);
    res.status(500).json({ success: false, message: 'Gagal mengambil data anggaran' });
  }
});

// Get comprehensive chart data with filters for dashboard - CACHED
router.get('/dashboard/chart-data', authenticate, authorizeAdmin, async (req: Request, res: Response): Promise<void> => {
  try {
    const { tahun, userId, sumberAnggaran, subKegiatan } = req.query;
    const yearParsed = parseInt(tahun as string) || new Date().getFullYear();
    const sumberAnggaranId = sumberAnggaran ? parseInt(sumberAnggaran as string) : undefined;
    const subKegiatanId = subKegiatan ? parseInt(subKegiatan as string) : undefined;

    const result = await getChartData(yearParsed, userId as string, sumberAnggaranId, subKegiatanId);

    res.json({
      success: true,
      ...result
    });
  } catch (error: any) {
    console.error('Error in chart data:', error);
    res.status(500).json({ success: false, message: 'Gagal mengambil data chart' });
  }
});

// Get puskesmas reporting details (who has reported and who hasn't) - CACHED
router.get('/dashboard/puskesmas-reporting-details', authenticate, authorizeAdmin, async (req: Request, res: Response): Promise<void> => {
  try {
    const { tahun, bulan } = req.query;
    const currentYear = tahun ? parseInt(tahun as string) : new Date().getFullYear();
    const currentMonth = bulan as string || undefined;

    const data = await getPuskesmasReportingDetails(currentYear, currentMonth);

    res.status(200).json({
      message: 'Puskesmas reporting details retrieved successfully',
      data,
      tahun: currentYear,
      bulan: currentMonth
    });
  } catch (error: any) {
    console.error('Puskesmas reporting details error:', error);
    res.status(500).json({ success: false, message: 'Gagal mengambil detail puskesmas' });
  }
});

export default router;
