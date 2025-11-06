import { Router, Request, Response } from 'express';
import { Laporan, User, SubKegiatan, Kegiatan } from '../models';
import { authenticate } from '../middleware/auth';
import { Op } from 'sequelize';

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

    // Build where clause
    const where: any = {
      status: 'terkirim' // Only show submitted reports
    };

    if (bulan) where.bulan = bulan;
    if (tahun) where.tahun = parseInt(tahun as string);

    // User filter
    const userWhere: any = {};
    if (puskesmas) {
      userWhere.nama_puskesmas = { [Op.like]: `%${puskesmas}%` };
    }

    const offset = (parseInt(page as string) - 1) * parseInt(pageSize as string);
    const limit = parseInt(pageSize as string);

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

export default router;
