import { Router, Request, Response } from 'express';
import { Laporan, User, SumberAnggaran, Satuan, SubKegiatan, Kegiatan, SubKegiatanTarget } from '../models';
import { authenticate } from '../middleware/auth';
import { Op } from 'sequelize';

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
    
    const userId = req.body.user_id;
    const { id_sub_kegiatan, id_sumber_anggaran, tahun, realisasi_k, realisasi_rp } = req.body;
    
    // VALIDATION: Check if target exists for this combination (using SubKegiatanTarget)
    if (id_sub_kegiatan && id_sumber_anggaran && tahun) {
      const target = await SubKegiatanTarget.findOne({
        where: {
          user_id: userId,
          id_sub_kegiatan,
          id_sumber_anggaran,
          bulan: null,
          tahun,
        },
        order: [['created_at', 'DESC']],
      });

      if (!target) {
        return res.status(400).json({
          error: 'Target belum diset',
          message: `Target belum diset untuk sub kegiatan dan sumber anggaran ini di tahun ${tahun}. Hubungi admin.`,
        });
      }

      // VALIDATION: Check realisasi vs target
      if (realisasi_k !== undefined && realisasi_k > target.target_k) {
        return res.status(400).json({
          error: 'Validation error',
          message: `Realisasi kinerja (${realisasi_k}) tidak boleh melebihi target (${target.target_k})`,
        });
      }

      if (realisasi_rp !== undefined && realisasi_rp > target.target_rp) {
        return res.status(400).json({
          error: 'Validation error',
          message: `Realisasi anggaran tidak boleh melebihi target pagu`,
        });
      }

      // Auto-fill id_kegiatan and id_satuan from target/sub_kegiatan
      if (!req.body.id_kegiatan) {
        const subKegiatan = await SubKegiatan.findByPk(id_sub_kegiatan, { attributes: ['id_kegiatan'] });
        req.body.id_kegiatan = subKegiatan?.id_kegiatan || 0;
      }
      if (!req.body.id_satuan) {
        req.body.id_satuan = target.id_satuan;
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
    
    // VALIDATION: Validate each laporan using SubKegiatanTarget
    for (const data of laporanArray) {
      if (!data.id_sub_kegiatan || !data.id_sumber_anggaran) {
        return res.status(400).json({ 
          error: 'Validation error',
          message: 'Setiap laporan harus memiliki id_sub_kegiatan dan id_sumber_anggaran' 
        });
      }

      // VALIDATION: Check if target exists (using SubKegiatanTarget instead of SubKegiatanSumberAnggaran)
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

      // Validasi realisasi_rp terhadap angkas (monthly budget input), bukan target_rp (yearly)
      // Realisasi anggaran tidak boleh melebihi realisasi angkas yang diinput user
      if (data.angkas !== undefined && data.realisasi_rp > data.angkas) {
        return res.status(400).json({
          error: 'Validation error',
          message: `Realisasi anggaran (Rp ${data.realisasi_rp?.toLocaleString('id-ID')}) tidak boleh melebihi realisasi angkas (Rp ${data.angkas?.toLocaleString('id-ID')})`,
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

// Bulk upsert laporan (optimized for bulk input page - create or update in one transaction)
router.post('/bulk-upsert', authenticate, async (req: Request, res: Response) => {
  const transaction = await Laporan.sequelize!.transaction();
  
  try {
    const { laporanArray } = req.body;
    
    if (!Array.isArray(laporanArray) || laporanArray.length === 0) {
      await transaction.rollback();
      return res.status(400).json({ error: 'laporanArray harus berupa array dan tidak boleh kosong' });
    }

    // SECURITY: Puskesmas hanya bisa create/update laporan untuk diri sendiri
    const userId = req.user?.role === 'puskesmas' ? req.user.id : laporanArray[0].user_id;
    
    const results = {
      created: 0,
      updated: 0,
      skipped: 0,
      errors: [] as string[],
    };

    // OPTIMIZATION: Pre-fetch all required data in single queries
    const subKegiatanIds = [...new Set(laporanArray.map((d: any) => d.id_sub_kegiatan).filter(Boolean))];
    const tahunValues = [...new Set(laporanArray.map((d: any) => d.tahun).filter(Boolean))];
    
    // Pre-fetch all SubKegiatan in one query
    const subKegiatanMap = new Map<number, any>();
    if (subKegiatanIds.length > 0) {
      const subKegiatanList = await SubKegiatan.findAll({
        where: { id_sub_kegiatan: { [Op.in]: subKegiatanIds } },
        attributes: ['id_sub_kegiatan', 'id_kegiatan'],
        transaction,
      });
      subKegiatanList.forEach(sk => subKegiatanMap.set(sk.id_sub_kegiatan, sk));
    }

    // Pre-fetch all targets for this user in relevant years
    const targetMap = new Map<string, any>();
    if (subKegiatanIds.length > 0 && tahunValues.length > 0) {
      const targets = await SubKegiatanTarget.findAll({
        where: {
          user_id: userId,
          id_sub_kegiatan: { [Op.in]: subKegiatanIds },
          bulan: null,
          tahun: { [Op.in]: tahunValues },
        },
        order: [['created_at', 'DESC']],
        transaction,
      });
      // Group by unique key (only keep latest per combination)
      for (const t of targets) {
        const key = `${t.id_sub_kegiatan}_${t.id_sumber_anggaran}_${t.tahun}`;
        if (!targetMap.has(key)) {
          targetMap.set(key, t);
        }
      }
    }

    // OPTIMIZATION: Pre-fetch all existing laporan for this user in relevant months/years
    // This eliminates N+1 findOne queries in the loop
    const bulanValues = [...new Set(laporanArray.map((d: any) => d.bulan).filter(Boolean))];
    const sumberAnggaranIds = [...new Set(laporanArray.map((d: any) => d.id_sumber_anggaran).filter(Boolean))];
    const existingLaporanMap = new Map<string, any>();
    
    if (subKegiatanIds.length > 0 && bulanValues.length > 0 && tahunValues.length > 0) {
      const existingLaporan = await Laporan.findAll({
        where: {
          user_id: userId,
          id_sub_kegiatan: { [Op.in]: subKegiatanIds },
          id_sumber_anggaran: { [Op.in]: sumberAnggaranIds },
          bulan: { [Op.in]: bulanValues },
          tahun: { [Op.in]: tahunValues },
        },
        transaction,
      });
      
      for (const lap of existingLaporan) {
        const key = `${lap.user_id}_${lap.id_sub_kegiatan}_${lap.id_sumber_anggaran}_${lap.bulan}_${lap.tahun}`;
        existingLaporanMap.set(key, lap);
      }
    }

    // Process each laporan within the transaction
    for (const data of laporanArray) {
      try {
        // Skip if missing critical fields
        if (!data.id_sub_kegiatan || !data.id_sumber_anggaran) {
          results.skipped++;
          continue;
        }

        // VALIDATION: Check if target exists (from pre-fetched map)
        const targetKey = `${data.id_sub_kegiatan}_${data.id_sumber_anggaran}_${data.tahun}`;
        const target = targetMap.get(targetKey);

        if (!target) {
          results.errors.push(`Sub kegiatan ${data.id_sub_kegiatan}: Target belum diset untuk tahun ${data.tahun}`);
          results.skipped++;
          continue;
        }

        // VALIDATION: Check realisasi vs target (STRICT)
        if (data.realisasi_k !== undefined && data.realisasi_k > target.target_k) {
          results.errors.push(`Sub kegiatan ${data.id_sub_kegiatan}: Realisasi kinerja (${data.realisasi_k}) melebihi target (${target.target_k})`);
          results.skipped++;
          continue;
        }

        // Validasi realisasi_rp terhadap angkas (monthly budget input), bukan target_rp (yearly)
        if (data.angkas !== undefined && data.realisasi_rp !== undefined && data.realisasi_rp > data.angkas) {
          results.errors.push(`Sub kegiatan ${data.id_sub_kegiatan}: Realisasi anggaran (Rp ${data.realisasi_rp?.toLocaleString('id-ID')}) melebihi realisasi angkas (Rp ${data.angkas?.toLocaleString('id-ID')})`);
          results.skipped++;
          continue;
        }

        // Get id_kegiatan from pre-fetched map
        const subKegiatan = subKegiatanMap.get(data.id_sub_kegiatan);

        const laporanData = {
          ...data,
          user_id: userId,
          id_kegiatan: subKegiatan?.id_kegiatan || data.id_kegiatan || 0,
          id_satuan: data.id_satuan || target.id_satuan, // Use target satuan if not provided
          status: data.status || 'tersimpan',
        };

        if (data.id) {
          // Update existing
          const [updatedCount] = await Laporan.update(laporanData, {
            where: { id: data.id, user_id: userId },
            transaction,
          });
          
          if (updatedCount > 0) {
            results.updated++;
          } else {
            results.skipped++;
          }
        } else {
          // OPTIMIZED: Check if exists using pre-fetched map (eliminates N+1 queries)
          const existingKey = `${userId}_${data.id_sub_kegiatan}_${data.id_sumber_anggaran}_${data.bulan}_${data.tahun}`;
          const existing = existingLaporanMap.get(existingKey);

          if (existing) {
            // Update existing
            await existing.update(laporanData, { transaction });
            results.updated++;
          } else {
            // Create new
            const newLaporan = await Laporan.create(laporanData, { transaction });
            // Add to map in case same combination appears again in same batch
            existingLaporanMap.set(existingKey, newLaporan);
            results.created++;
          }
        }
      } catch (err: any) {
        results.errors.push(`Sub kegiatan ${data.id_sub_kegiatan}: ${err.message}`);
      }
    }

    await transaction.commit();

    return res.status(200).json({
      success: true,
      message: `Bulk upsert completed: ${results.created} created, ${results.updated} updated, ${results.skipped} skipped`,
      results,
    });
  } catch (error: any) {
    await transaction.rollback();
    console.error('Error bulk upserting laporan:', error);
    return res.status(500).json({ 
      error: 'Failed to bulk upsert laporan', 
      message: error.message 
    });
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

    const { id_sub_kegiatan, id_sumber_anggaran, realisasi_k, realisasi_rp, tahun } = req.body;
    const subKegiatanId = id_sub_kegiatan || laporan.id_sub_kegiatan;
    const sumberAnggaranId = id_sumber_anggaran || laporan.id_sumber_anggaran;
    const tahunValue = tahun || laporan.tahun;

    // VALIDATION: Check if target exists (using SubKegiatanTarget)
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

    // VALIDATION: Check realisasi vs target (STRICT)
    if (realisasi_k !== undefined || realisasi_rp !== undefined) {
      const newRealisasiK = realisasi_k !== undefined ? realisasi_k : laporan.realisasi_k;
      const newRealisasiRp = realisasi_rp !== undefined ? realisasi_rp : laporan.realisasi_rp;
      const angkasValue = req.body.angkas !== undefined ? req.body.angkas : laporan.angkas;

      if (newRealisasiK > target.target_k) {
        res.status(400).json({
          error: 'Validation error',
          message: `Realisasi kinerja (${newRealisasiK}) tidak boleh melebihi target (${target.target_k})`,
        });
        return;
      }

      // Validasi realisasi_rp terhadap angkas (monthly budget input), bukan target_rp (yearly)
      if (angkasValue !== undefined && newRealisasiRp > angkasValue) {
        res.status(400).json({
          error: 'Validation error',
          message: `Realisasi anggaran (Rp ${newRealisasiRp?.toLocaleString('id-ID')}) tidak boleh melebihi realisasi angkas (Rp ${angkasValue?.toLocaleString('id-ID')})`,
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
