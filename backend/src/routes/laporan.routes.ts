import { Router, Request, Response } from 'express';
import { Laporan, User, SumberAnggaran, Satuan, SubKegiatan, Kegiatan } from '../models';
import { authenticate } from '../middleware/auth';

const router = Router();

// Get all laporan with pagination (hanya laporan user sendiri untuk puskesmas)
router.get('/', authenticate, async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 50;
    const offset = (page - 1) * limit;

    // Build where clause
    const where: any = {};
    
    // SECURITY: Puskesmas hanya bisa lihat laporan sendiri
    if (req.user?.role === 'puskesmas') {
      where.user_id = req.user.id;
    } else if (req.user?.role === 'admin' && req.query.user_id) {
      // Admin bisa filter by user_id
      where.user_id = req.query.user_id;
    }
    
    if (req.query.bulan) where.bulan = req.query.bulan;
    if (req.query.tahun) where.tahun = parseInt(req.query.tahun as string);
    if (req.query.status) where.status = req.query.status;

    const { count, rows } = await Laporan.findAndCountAll({
      where,
      limit,
      offset,
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'username', 'nama', 'nama_puskesmas']
        },
        {
          model: SumberAnggaran,
          as: 'sumberAnggaran',
          attributes: ['id_sumber', 'sumber']
        },
        {
          model: Satuan,
          as: 'satuan',
          attributes: ['id_satuan', 'satuannya']
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
      order: [['created_at', 'DESC']]
    });

    res.json({
      data: rows,
      pagination: {
        total: count,
        page,
        limit,
        totalPages: Math.ceil(count / limit)
      }
    });
  } catch (error: any) {
    console.error('Error fetching laporan:', error);
    res.status(500).json({ error: 'Failed to fetch laporan', message: error.message });
  }
});

// Get laporan by ID (hanya boleh akses laporan sendiri untuk puskesmas)
router.get('/:id', authenticate, async (req: Request, res: Response): Promise<void> => {
  try {
    const laporan = await Laporan.findByPk(req.params.id, {
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'username', 'nama', 'nama_puskesmas']
        },
        {
          model: SumberAnggaran,
          as: 'sumberAnggaran',
          attributes: ['id_sumber', 'sumber']
        },
        {
          model: Satuan,
          as: 'satuan',
          attributes: ['id_satuan', 'satuannya']
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
      ]
    });

    if (!laporan) {
      res.status(404).json({ error: 'Laporan not found' });
      return;
    }

    // SECURITY: Puskesmas hanya bisa akses laporan sendiri
    if (req.user?.role === 'puskesmas' && laporan.user_id !== req.user.id) {
      res.status(403).json({ error: 'Forbidden', message: 'Anda tidak bisa mengakses laporan puskesmas lain' });
      return;
    }

    res.json(laporan);
  } catch (error: any) {
    console.error('Error fetching laporan:', error);
    res.status(500).json({ error: 'Failed to fetch laporan', message: error.message });
  }
});

// Create new laporan (puskesmas hanya bisa create untuk diri sendiri)
router.post('/', authenticate, async (req: Request, res: Response) => {
  try {
    // SECURITY: Puskesmas hanya bisa create laporan untuk diri sendiri
    if (req.user?.role === 'puskesmas') {
      req.body.user_id = req.user.id;
    }
    
    const laporan = await Laporan.create(req.body);
    res.status(201).json(laporan);
  } catch (error: any) {
    console.error('Error creating laporan:', error);
    res.status(500).json({ error: 'Failed to create laporan', message: error.message });
  }
});

// Update laporan (puskesmas hanya bisa update laporan sendiri)
router.put('/:id', authenticate, async (req: Request, res: Response): Promise<void> => {
  try {
    const laporan = await Laporan.findByPk(req.params.id);
    
    if (!laporan) {
      res.status(404).json({ error: 'Laporan not found' });
      return;
    }

    // SECURITY: Puskesmas hanya bisa update laporan sendiri
    if (req.user?.role === 'puskesmas' && laporan.user_id !== req.user.id) {
      res.status(403).json({ error: 'Forbidden', message: 'Anda tidak bisa mengubah laporan puskesmas lain' });
      return;
    }

    await laporan.update(req.body);
    res.json(laporan);
  } catch (error: any) {
    console.error('Error updating laporan:', error);
    res.status(500).json({ error: 'Failed to update laporan', message: error.message });
  }
});

// Delete laporan (puskesmas hanya bisa delete laporan sendiri)
router.delete('/:id', authenticate, async (req: Request, res: Response): Promise<void> => {
  try {
    const laporan = await Laporan.findByPk(req.params.id);
    
    if (!laporan) {
      res.status(404).json({ error: 'Laporan not found' });
      return;
    }

    // SECURITY: Puskesmas hanya bisa delete laporan sendiri
    if (req.user?.role === 'puskesmas' && laporan.user_id !== req.user.id) {
      res.status(403).json({ error: 'Forbidden', message: 'Anda tidak bisa menghapus laporan puskesmas lain' });
      return;
    }

    await laporan.destroy();
    res.json({ message: 'Laporan deleted successfully' });
  } catch (error: any) {
    console.error('Error deleting laporan:', error);
    res.status(500).json({ error: 'Failed to delete laporan', message: error.message });
  }
});

// Submit laporan (bulk action for specific bulan+tahun, hanya untuk laporan sendiri)
router.post('/submit', authenticate, async (req: Request, res: Response): Promise<void> => {
  try {
    const { bulan, tahun } = req.body;

    if (!bulan || !tahun) {
      res.status(400).json({ 
        error: 'Missing required fields', 
        message: 'bulan and tahun are required' 
      });
      return;
    }

    // SECURITY: Puskesmas hanya bisa submit laporan sendiri
    const user_id = req.user?.role === 'puskesmas' ? req.user.id : req.body.user_id;

    if (!user_id) {
      res.status(400).json({ 
        error: 'Missing user_id', 
        message: 'user_id is required' 
      });
      return;
    }

    // Check if already submitted
    const existingSubmitted = await Laporan.findOne({
      where: {
        user_id,
        bulan,
        tahun,
        status: 'terkirim'
      }
    });

    if (existingSubmitted) {
      res.status(400).json({
        error: 'Already submitted',
        message: `Laporan untuk ${bulan} ${tahun} sudah pernah dikirim sebelumnya`
      });
      return;
    }

    // Update all 'menunggu' laporan to 'terkirim'
    const [updatedCount] = await Laporan.update(
      { status: 'terkirim' },
      {
        where: {
          user_id,
          bulan,
          tahun,
          status: 'menunggu'
        }
      }
    );

    if (updatedCount === 0) {
      res.status(404).json({
        error: 'No laporan found',
        message: `Tidak ada laporan dengan status "menunggu" untuk ${bulan} ${tahun}`
      });
      return;
    }

    res.json({
      message: 'Laporan berhasil dikirim',
      updatedCount
    });
  } catch (error: any) {
    console.error('Error submitting laporan:', error);
    res.status(500).json({ error: 'Failed to submit laporan', message: error.message });
  }
});

export default router;
