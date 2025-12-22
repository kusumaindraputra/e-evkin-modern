import { Router, Request, Response } from 'express';
import { Laporan, User, SumberAnggaran, Satuan, SubKegiatan, Kegiatan, SubKegiatanSumberAnggaran, SubKegiatanTarget } from '../models';
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
    
    // VALIDATION: Check if sumber anggaran is valid for sub kegiatan
    const { id_sub_kegiatan, id_sumber_anggaran } = req.body;
    
    if (id_sub_kegiatan && id_sumber_anggaran) {
      const isValid = await SubKegiatanSumberAnggaran.findOne({
        where: {
          id_sub_kegiatan,
          id_sumber_anggaran,
          is_active: true,
        },
      });

      if (!isValid) {
        return res.status(400).json({
          error: 'Invalid sumber anggaran',
          message: 'Sumber anggaran tidak valid untuk sub kegiatan ini. Hubungi admin untuk mengatur sumber dana yang tersedia.',
        });
      }
    }
    
    // Set default status to 'tersimpan' if not provided
    if (!req.body.status) {
      req.body.status = 'tersimpan';
    }
    
    const laporan = await Laporan.create(req.body);
    return res.status(201).json(laporan);
  } catch (error: any) {
    console.error('Error creating laporan:', error);
    return res.status(500).json({ error: 'Failed to create laporan', message: error.message });
  }
});

// Bulk create laporan (for multiple sumber anggaran in one form submission)
router.post('/bulk', authenticate, async (req: Request, res: Response) => {
  try {
    const { laporanArray } = req.body;
    
    if (!Array.isArray(laporanArray) || laporanArray.length === 0) {
      return res.status(400).json({ error: 'laporanArray harus berupa array dan tidak boleh kosong' });
    }

    // SECURITY: Puskesmas hanya bisa create laporan untuk diri sendiri
    const userId = req.user?.role === 'puskesmas' ? req.user.id : laporanArray[0].user_id;
    
    // VALIDATION: Validate each laporan and check sumber anggaran
    for (const data of laporanArray) {
      if (!data.id_sub_kegiatan || !data.id_sumber_anggaran) {
        return res.status(400).json({ 
          error: 'Validation error',
          message: 'Setiap laporan harus memiliki id_sub_kegiatan dan id_sumber_anggaran' 
        });
      }

      const isValid = await SubKegiatanSumberAnggaran.findOne({
        where: {
          id_sub_kegiatan: data.id_sub_kegiatan,
          id_sumber_anggaran: data.id_sumber_anggaran,
          is_active: true,
        },
      });

      if (!isValid) {
        return res.status(400).json({
          error: 'Invalid sumber anggaran',
          message: `Sumber anggaran ${data.id_sumber_anggaran} tidak valid untuk sub kegiatan ini`,
        });
      }

      // VALIDATION: Check realisasi vs target (STRICT)
      const target = await SubKegiatanTarget.findOne({
        where: {
          user_id: userId,
          id_sub_kegiatan: data.id_sub_kegiatan,
          id_sumber_anggaran: data.id_sumber_anggaran,
          bulan: null,
          tahun: data.tahun,
        },
        order: [['created_at', 'DESC']],
      });

      if (!target) {
        return res.status(400).json({
          error: 'Target belum diset',
          message: `Target belum diset untuk sub kegiatan dan sumber anggaran ini di tahun ${data.tahun}. Hubungi admin.`,
        });
      }

      if (data.realisasi_k > target.target_k) {
        return res.status(400).json({
          error: 'Validation error',
          message: `Realisasi kinerja (${data.realisasi_k}) tidak boleh melebihi target (${target.target_k})`,
        });
      }

      if (data.realisasi_rp > target.target_rp) {
        return res.status(400).json({
          error: 'Validation error',
          message: `Realisasi anggaran (Rp ${data.realisasi_rp.toLocaleString('id-ID')}) tidak boleh melebihi target (Rp ${target.target_rp.toLocaleString('id-ID')})`,
        });
      }
    }

    // Prepare laporan data with user_id and default status
    const laporanData = laporanArray.map((data: any) => ({
      ...data,
      user_id: userId,
      status: data.status || 'tersimpan',
    }));

    // Create all laporan in a transaction
    const createdLaporan = await Laporan.bulkCreate(laporanData, {
      validate: true,
      returning: true,
    });

    return res.status(201).json({
      success: true,
      count: createdLaporan.length,
      data: createdLaporan,
    });
  } catch (error: any) {
    console.error('Error bulk creating laporan:', error);
    return res.status(500).json({ error: 'Failed to bulk create laporan', message: error.message });
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

    // VALIDATION: If updating sumber anggaran, check if valid for sub kegiatan
    const { id_sub_kegiatan, id_sumber_anggaran, realisasi_k, realisasi_rp, tahun } = req.body;
    
    if (id_sumber_anggaran && (id_sub_kegiatan || laporan.id_sub_kegiatan)) {
      const subKegiatanId = id_sub_kegiatan || laporan.id_sub_kegiatan;
      
      const isValid = await SubKegiatanSumberAnggaran.findOne({
        where: {
          id_sub_kegiatan: subKegiatanId,
          id_sumber_anggaran,
          is_active: true,
        },
      });

      if (!isValid) {
        res.status(400).json({
          error: 'Invalid sumber anggaran',
          message: 'Sumber anggaran tidak valid untuk sub kegiatan ini.',
        });
        return;
      }
    }

    // VALIDATION: Check realisasi vs target (STRICT)
    if (realisasi_k !== undefined || realisasi_rp !== undefined) {
      const subKegiatanId = id_sub_kegiatan || laporan.id_sub_kegiatan;
      const sumberAnggaranId = id_sumber_anggaran || laporan.id_sumber_anggaran;
      const tahunValue = tahun || laporan.tahun;

      const target = await SubKegiatanTarget.findOne({
        where: {
          user_id: laporan.user_id,
          id_sub_kegiatan: subKegiatanId,
          id_sumber_anggaran: sumberAnggaranId,
          bulan: null,
          tahun: tahunValue,
        },
        order: [['created_at', 'DESC']],
      });

      if (!target) {
        res.status(400).json({
          error: 'Target belum diset',
          message: `Target belum diset untuk sub kegiatan dan sumber anggaran ini di tahun ${tahunValue}. Hubungi admin.`,
        });
        return;
      }

      const newRealisasiK = realisasi_k !== undefined ? realisasi_k : laporan.realisasi_k;
      const newRealisasiRp = realisasi_rp !== undefined ? realisasi_rp : laporan.realisasi_rp;

      if (newRealisasiK > target.target_k) {
        res.status(400).json({
          error: 'Validation error',
          message: `Realisasi kinerja (${newRealisasiK}) tidak boleh melebihi target (${target.target_k})`,
        });
        return;
      }

      if (newRealisasiRp > target.target_rp) {
        res.status(400).json({
          error: 'Validation error',
          message: `Realisasi anggaran (Rp ${newRealisasiRp.toLocaleString('id-ID')}) tidak boleh melebihi target (Rp ${target.target_rp.toLocaleString('id-ID')})`,
        });
        return;
      }
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

    // Update all 'tersimpan' laporan to 'terkirim' (skip yang sudah terkirim)
    const [updatedCount] = await Laporan.update(
      { status: 'terkirim' },
      {
        where: {
          user_id,
          bulan,
          tahun,
          status: 'tersimpan'
        }
      }
    );

    if (updatedCount === 0) {
      // Check if all are already submitted
      const alreadySubmittedCount = await Laporan.count({
        where: {
          user_id,
          bulan,
          tahun,
          status: 'terkirim'
        }
      });

      if (alreadySubmittedCount > 0) {
        res.status(400).json({
          error: 'Already submitted',
          message: `Semua laporan untuk ${bulan} ${tahun} sudah dikirim sebelumnya`
        });
        return;
      }

      res.status(404).json({
        error: 'No laporan found',
        message: `Tidak ada laporan dengan status "tersimpan" untuk ${bulan} ${tahun}`
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
