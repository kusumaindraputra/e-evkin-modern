import { Router, Request, Response } from 'express';
import { Laporan, User, SubKegiatanTarget, AnggaranKas, SubKegiatan, Kegiatan } from '../models';
import { authenticate } from '../middleware/auth';
import { authorizeAdmin } from '../middleware/authorize';
import { Op, QueryTypes } from 'sequelize';
import { getDashboardStats, getBudgetMonthly, getTop10Absorption, getBottom10Absorption } from '../services/dashboardService';

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
    res.status(500).json({ message: 'Gagal mengambil data verifikasi', error: error.message });
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
    res.status(500).json({ message: 'Gagal mengambil detail laporan', error: error.message });
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
    res.status(500).json({ message: 'Gagal mengembalikan laporan', error: error.message });
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
    res.status(500).json({ message: 'Gagal mengembalikan laporan', error: error.message });
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
    res.status(500).json({ message: 'Gagal mengambil statistik dashboard', error: error.message });
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
    res.status(500).json({ message: 'Gagal mengambil data anggaran bulanan', error: error.message });
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
    res.status(500).json({ message: 'Gagal mengambil data top 10 penyerapan', error: error.message });
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
    res.status(500).json({ message: 'Gagal mengambil data bottom 10 penyerapan', error: error.message });
  }
});

// Get budget realization year to date for dashboard
router.get('/dashboard/budget-ytd', authenticate, authorizeAdmin, async (req: Request, res: Response): Promise<void> => {
  try {

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

// Get comprehensive chart data with filters for dashboard
// Helper to get latest targets
// Helper to get all targets with full history for time-based filtering
const getAllTargetsWithHistory = async (whereClause: any) => {
  const allTargets = await SubKegiatanTarget.findAll({
    where: whereClause,
    include: [{
      model: SubKegiatan,
      as: 'subKegiatan',
      attributes: ['id_sub_kegiatan', 'kegiatan']
    }],
    order: [['created_at', 'ASC']], // ASC to process oldest first
    raw: true,
    nest: true
  });
  return allTargets;
};

// Helper to get anggaran valid at a specific month based on createdAt history
const getAnggaranForMonth = (allTargets: any[], year: number, monthNum: number) => {
  // Get the end of the month as cutoff date
  const cutoffDate = new Date(year, monthNum, 0, 23, 59, 59, 999); // Last day of month

  // Group by unique key and get latest record created before or during this month
  const grouped = new Map();
  allTargets.forEach((t: any) => {
    const createdAt = new Date(t.createdAt); // Use camelCase as returned by Sequelize
    if (createdAt <= cutoffDate) {
      const key = `${t.user_id}_${t.id_sub_kegiatan}_${t.id_sumber_anggaran}_${t.tahun}`;
      // Since sorted ASC, later records overwrite earlier ones
      grouped.set(key, t);
    }
  });

  return Array.from(grouped.values());
};

// Helper to get all angkas with full history
const getAllAngkasWithHistory = async (whereClause: any) => {
  const allAngkas = await AnggaranKas.findAll({
    where: whereClause,
    order: [['created_at', 'ASC']], // ASC to process oldest first
    raw: true
  });
  return allAngkas;
};

// Helper to get cumulative angkas up to a specific month (sum Jan to monthNum)
const getCumulativeAngkasForMonth = (allAngkas: any[], year: number, monthNum: number) => {
  // Get the end of the month as cutoff date
  const cutoffDate = new Date(year, monthNum, 0, 23, 59, 59, 999);

  // First, get latest angkas per unique key per month (for months 1 to monthNum)
  const latestPerKeyPerMonth = new Map(); // key_month -> record

  allAngkas.forEach((a: any) => {
    const createdAt = new Date(a.createdAt); // Use camelCase as returned by Sequelize
    if (createdAt <= cutoffDate && a.bulan <= monthNum) {
      const keyMonth = `${a.user_id}_${a.kode_rekening}_${a.id_sumber_anggaran}_${a.tahun}_${a.bulan}`;
      // Since sorted ASC, later records overwrite earlier ones
      latestPerKeyPerMonth.set(keyMonth, a);
    }
  });

  // Sum all latest values across all months (1 to monthNum)
  let total = 0;
  latestPerKeyPerMonth.forEach((record: any) => {
    total += Number(record.nilai) || 0;
  });

  return total;
};

// Enhanced endpoint for chart data
router.get('/dashboard/chart-data', authenticate, authorizeAdmin, async (req: Request, res: Response): Promise<void> => {
  try {
    const { tahun, userId, sumberAnggaran, subKegiatan } = req.query;
    const yearParsed = parseInt(tahun as string) || new Date().getFullYear();
    const sumberAnggaranId = sumberAnggaran ? parseInt(sumberAnggaran as string) : null;
    const subKegiatanId = subKegiatan ? parseInt(subKegiatan as string) : null;

    // Base filters (no month filter - we fetch all data and process per month)
    const targetFilter: any = { tahun: yearParsed };
    const angkasFilter: any = { tahun: yearParsed };
    // Include all submitted statuses for comprehensive dashboard view
    const laporanFilter: any = {
      tahun: yearParsed,
      status: { [Op.in]: ['terkirim', 'menunggu', 'diverifikasi'] }
    };

    if (userId) {
      targetFilter.user_id = userId;
      angkasFilter.user_id = userId;
      laporanFilter.user_id = userId;
    }

    // Add sumber anggaran filter
    if (sumberAnggaranId) {
      targetFilter.id_sumber_anggaran = sumberAnggaranId;
      angkasFilter.id_sumber_anggaran = sumberAnggaranId;
      laporanFilter.id_sumber_anggaran = sumberAnggaranId;
    }

    // Add sub kegiatan filter
    if (subKegiatanId) {
      targetFilter.id_sub_kegiatan = subKegiatanId;
      angkasFilter.id_sub_kegiatan = subKegiatanId;
      laporanFilter.id_sub_kegiatan = subKegiatanId;
    }

    // Fetch all data with history for time-based processing
    const [allTargets, allAngkas, laporanData] = await Promise.all([
      getAllTargetsWithHistory(targetFilter),
      getAllAngkasWithHistory(angkasFilter),
      Laporan.findAll({
        where: laporanFilter,
        include: [{
          model: SubKegiatan,
          as: 'subKegiatan',
          attributes: ['id_sub_kegiatan', 'kegiatan']
        }],
        raw: true,
        nest: true
      })
    ]);

    const months = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];

    // First pass: calculate raw values per month
    const rawData = months.map((monthName, index) => {
      const monthNum = index + 1;

      // Get anggaran valid at this month (based on createdAt history)
      const targetsForMonth = getAnggaranForMonth(allTargets, yearParsed, monthNum);
      const anggaranForMonth = targetsForMonth.reduce((sum: number, t: any) => sum + (Number(t.target_rp) || 0), 0);

      // Get CUMULATIVE angkas from Jan to this month
      const cumulativeAngkas = getCumulativeAngkasForMonth(allAngkas, yearParsed, monthNum);

      // Sum Realisasi for this month only
      const laporanForMonth = laporanData.filter((l: any) => l.bulan === monthName);
      const realisasiRp = laporanForMonth.reduce((sum: number, l: any) => sum + (Number(l.realisasi_rp) || 0), 0);

      // Average physical realization for this month
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

    // Second pass: make realisasi cumulative (carry forward - at least same as previous month)
    const processedData = rawData.map((data, index) => {
      if (index === 0) return data;

      const prevData = rawData.slice(0, index);

      // Cumulative realisasi anggaran: sum of all months up to current
      const cumulativeRealisasiAnggaran = prevData.reduce((sum, d) => sum + d.realisasi_anggaran, 0) + data.realisasi_anggaran;

      // For realisasi fisik: use the maximum value seen so far (carry forward)
      const maxPrevFisik = Math.max(...prevData.map(d => d.realisasi_fisik), 0);
      const cumulativeRealisasiFisik = Math.max(maxPrevFisik, data.realisasi_fisik);

      return {
        ...data,
        realisasi_anggaran: cumulativeRealisasiAnggaran,
        realisasi_fisik: Math.round(cumulativeRealisasiFisik * 100) / 100
      };
    });

    // Fix first month to be itself (no accumulation needed)
    if (processedData.length > 0) {
      processedData[0] = rawData[0];
    }

    res.json({
      success: true,
      data: processedData,
      debug: {
        targetsCount: allTargets.length,
        angkasCount: allAngkas.length,
        laporanCount: laporanData.length
      }
    });

  } catch (error: any) {
    console.error('Error in chart data:', error);
    res.status(500).json({ message: 'Gagal mengambil data chart', error: error.message });
  }
});

// Get puskesmas reporting details (who has reported and who hasn't)
router.get('/dashboard/puskesmas-reporting-details', authenticate, authorizeAdmin, async (req: Request, res: Response): Promise<void> => {
  try {

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
