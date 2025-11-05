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
      status: { [Op.in]: ['terkirim', 'diverifikasi', 'ditolak'] }
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
          diverifikasi: 0,
          ditolak: 0,
          laporan: []
        };
      }
      grouped[key].total_laporan++;
      grouped[key][lap.status]++;
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
      where.status = { [Op.in]: ['terkirim', 'diverifikasi', 'ditolak'] };
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

// Verify or reject laporan
router.put('/laporan/:id/verify', authenticate, async (req: Request, res: Response): Promise<void> => {
  try {
    const userRole = (req as any).user?.role;
    if (userRole !== 'admin') {
      res.status(403).json({ message: 'Access denied. Admin only.' });
      return;
    }

    const { id } = req.params;
    const { action, catatan } = req.body;

    if (!action || !['approve', 'reject'].includes(action)) {
      res.status(400).json({ message: 'Invalid action. Use "approve" or "reject".' });
      return;
    }

    const laporan = await Laporan.findByPk(id);
    if (!laporan) {
      res.status(404).json({ message: 'Laporan tidak ditemukan' });
      return;
    }

    if (laporan.status !== 'terkirim') {
      res.status(400).json({ message: 'Hanya laporan dengan status "terkirim" yang dapat diverifikasi' });
      return;
    }

    const newStatus = action === 'approve' ? 'diverifikasi' : 'ditolak';
    await laporan.update({ 
      status: newStatus,
      catatan: catatan || null
    });

    res.json({
      message: `Laporan berhasil ${action === 'approve' ? 'diverifikasi' : 'ditolak'}`,
      data: laporan
    });
  } catch (error: any) {
    console.error('Verify laporan error:', error);
    res.status(500).json({ message: 'Gagal memverifikasi laporan', error: error.message });
  }
});

// Bulk verify or reject laporan
router.post('/laporan/bulk-verify', authenticate, async (req: Request, res: Response): Promise<void> => {
  try {
    const userRole = (req as any).user?.role;
    if (userRole !== 'admin') {
      res.status(403).json({ message: 'Access denied. Admin only.' });
      return;
    }

    const { userId, bulan, tahun, action, catatan } = req.body;

    if (!userId || !bulan || !tahun) {
      res.status(400).json({ message: 'userId, bulan, dan tahun wajib diisi' });
      return;
    }

    if (!action || !['approve', 'reject'].includes(action)) {
      res.status(400).json({ message: 'Invalid action. Use "approve" or "reject".' });
      return;
    }

    const newStatus = action === 'approve' ? 'diverifikasi' : 'ditolak';

    const [updated] = await Laporan.update(
      { 
        status: newStatus,
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
      message: `${updated} laporan berhasil ${action === 'approve' ? 'diverifikasi' : 'ditolak'}`,
      updated
    });
  } catch (error: any) {
    console.error('Bulk verify error:', error);
    res.status(500).json({ message: 'Gagal melakukan bulk verifikasi', error: error.message });
  }
});

export default router;
