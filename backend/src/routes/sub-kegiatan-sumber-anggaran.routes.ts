import { Router, Request, Response } from 'express';
import { SubKegiatanSumberAnggaran, SubKegiatan, SumberAnggaran } from '../models';
import { authenticate } from '../middleware/auth';
import { authorizeAdmin } from '../middleware/authorize';

const router = Router();

/**
 * @route GET /api/sub-kegiatan-sumber-dana
 * @desc Get all sub kegiatan sumber anggaran mappings (with optional filters)
 * @access Admin only
 */
router.get('/', authenticate, authorizeAdmin, async (req: Request, res: Response) => {
  try {
    const { id_sub_kegiatan, id_sumber_anggaran, is_active } = req.query;

    const where: any = {};
    if (id_sub_kegiatan) where.id_sub_kegiatan = id_sub_kegiatan;
    if (id_sumber_anggaran) where.id_sumber_anggaran = id_sumber_anggaran;
    if (is_active !== undefined) where.is_active = is_active === 'true';

    const mappings = await SubKegiatanSumberAnggaran.findAll({
      where,
      include: [
        {
          model: SubKegiatan,
          as: 'subKegiatan',
          attributes: ['id_sub_kegiatan', 'kode_sub', 'kegiatan', 'indikator_kinerja'],
        },
        {
          model: SumberAnggaran,
          as: 'sumberAnggaran',
          attributes: ['id_sumber', 'sumber'],
        },
      ],
      order: [['id_sub_kegiatan', 'ASC'], ['id_sumber_anggaran', 'ASC']],
    });

    res.json({
      success: true,
      data: mappings,
    });
  } catch (error: any) {
    console.error('Error fetching sub kegiatan sumber anggaran:', error);
    res.status(500).json({
      success: false,
      message: 'Gagal mengambil data sumber anggaran sub kegiatan',
      error: error.message,
    });
  }
});

/**
 * @route GET /api/sub-kegiatan-sumber-dana/by-sub-kegiatan/:id_sub_kegiatan
 * @desc Get all sumber anggaran for a specific sub kegiatan
 * @access Authenticated (puskesmas & admin)
 */
router.get(
  '/by-sub-kegiatan/:id_sub_kegiatan',
  authenticate,
  async (req: Request, res: Response) => {
    try {
      const { id_sub_kegiatan } = req.params;

      const sumberAnggaranList = await SubKegiatanSumberAnggaran.findAll({
        where: {
          id_sub_kegiatan,
          is_active: true,
        },
        include: [
          {
            model: SumberAnggaran,
            as: 'sumberAnggaran',
            attributes: ['id_sumber', 'sumber'],
          },
        ],
        order: [['id_sumber_anggaran', 'ASC']],
      });

      res.json({
        success: true,
        data: sumberAnggaranList,
      });
    } catch (error: any) {
      console.error('Error fetching sumber anggaran for sub kegiatan:', error);
      res.status(500).json({
        success: false,
        message: 'Gagal mengambil data sumber anggaran',
        error: error.message,
      });
    }
  }
);

/**
 * @route POST /api/sub-kegiatan-sumber-dana
 * @desc Add sumber anggaran to sub kegiatan
 * @access Admin only
 */
router.post('/', authenticate, authorizeAdmin, async (req: Request, res: Response) => {
  try {
    const { id_sub_kegiatan, id_sumber_anggaran, is_active = true } = req.body;

    // Validate required fields
    if (!id_sub_kegiatan || !id_sumber_anggaran) {
      return res.status(400).json({
        success: false,
        message: 'id_sub_kegiatan dan id_sumber_anggaran wajib diisi',
      });
    }

    // Check if sub kegiatan exists
    const subKegiatan = await SubKegiatan.findByPk(id_sub_kegiatan);
    if (!subKegiatan) {
      return res.status(404).json({
        success: false,
        message: 'Sub kegiatan tidak ditemukan',
      });
    }

    // Check if sumber anggaran exists
    const sumberAnggaran = await SumberAnggaran.findByPk(id_sumber_anggaran);
    if (!sumberAnggaran) {
      return res.status(404).json({
        success: false,
        message: 'Sumber anggaran tidak ditemukan',
      });
    }

    // Check if mapping already exists
    const existing = await SubKegiatanSumberAnggaran.findOne({
      where: { id_sub_kegiatan, id_sumber_anggaran },
    });

    if (existing) {
      // Update if exists
      existing.is_active = is_active;
      await existing.save();

      return res.json({
        success: true,
        message: 'Mapping berhasil diperbarui',
        data: existing,
      });
    }

    // Create new mapping
    const mapping = await SubKegiatanSumberAnggaran.create({
      id_sub_kegiatan,
      id_sumber_anggaran,
      is_active,
    });

    const result = await SubKegiatanSumberAnggaran.findByPk(mapping.id, {
      include: [
        {
          model: SubKegiatan,
          as: 'subKegiatan',
          attributes: ['id_sub_kegiatan', 'kode_sub', 'kegiatan'],
        },
        {
          model: SumberAnggaran,
          as: 'sumberAnggaran',
          attributes: ['id_sumber', 'sumber'],
        },
      ],
    });

    res.status(201).json({
      success: true,
      message: 'sumber anggaran berhasil ditambahkan ke sub kegiatan',
      data: result,
    });
  } catch (error: any) {
    console.error('Error creating sub kegiatan sumber anggaran:', error);
    res.status(500).json({
      success: false,
      message: 'Gagal menambahkan sumber anggaran',
      error: error.message,
    });
  }
});

/**
 * @route POST /api/sub-kegiatan-sumber-dana/bulk
 * @desc Bulk assign sumber anggaran to sub kegiatan (replaces existing)
 * @access Admin only
 */
router.post('/bulk', authenticate, authorizeAdmin, async (req: Request, res: Response) => {
  try {
    const { id_sub_kegiatan, sumber_anggaran_ids } = req.body;

    if (!id_sub_kegiatan || !Array.isArray(sumber_anggaran_ids)) {
      return res.status(400).json({
        success: false,
        message: 'id_sub_kegiatan dan sumber_anggaran_ids (array) wajib diisi',
      });
    }

    // Check if sub kegiatan exists
    const subKegiatan = await SubKegiatan.findByPk(id_sub_kegiatan);
    if (!subKegiatan) {
      return res.status(404).json({
        success: false,
        message: 'Sub kegiatan tidak ditemukan',
      });
    }

    // Delete existing mappings
    await SubKegiatanSumberAnggaran.destroy({
      where: { id_sub_kegiatan },
    });

    // Create new mappings
    const mappings = await Promise.all(
      sumber_anggaran_ids.map((id_sumber_anggaran) =>
        SubKegiatanSumberAnggaran.create({
          id_sub_kegiatan,
          id_sumber_anggaran,
          is_active: true,
        })
      )
    );

    res.json({
      success: true,
      message: `Berhasil mengatur ${mappings.length} sumber anggaran untuk sub kegiatan`,
      data: mappings,
    });
  } catch (error: any) {
    console.error('Error bulk assigning sumber anggaran:', error);
    res.status(500).json({
      success: false,
      message: 'Gagal mengatur sumber anggaran',
      error: error.message,
    });
  }
});

/**
 * @route PUT /api/sub-kegiatan-sumber-dana/:id
 * @desc Update mapping (toggle is_active)
 * @access Admin only
 */
router.put('/:id', authenticate, authorizeAdmin, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { is_active } = req.body;

    const mapping = await SubKegiatanSumberAnggaran.findByPk(id);
    if (!mapping) {
      return res.status(404).json({
        success: false,
        message: 'Mapping tidak ditemukan',
      });
    }

    if (is_active !== undefined) {
      mapping.is_active = is_active;
      await mapping.save();
    }

    res.json({
      success: true,
      message: 'Mapping berhasil diperbarui',
      data: mapping,
    });
  } catch (error: any) {
    console.error('Error updating mapping:', error);
    res.status(500).json({
      success: false,
      message: 'Gagal memperbarui mapping',
      error: error.message,
    });
  }
});

/**
 * @route DELETE /api/sub-kegiatan-sumber-dana/:id
 * @desc Delete mapping
 * @access Admin only
 */
router.delete('/:id', authenticate, authorizeAdmin, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const mapping = await SubKegiatanSumberAnggaran.findByPk(id);
    if (!mapping) {
      return res.status(404).json({
        success: false,
        message: 'Mapping tidak ditemukan',
      });
    }

    await mapping.destroy();

    res.json({
      success: true,
      message: 'Mapping berhasil dihapus',
    });
  } catch (error: any) {
    console.error('Error deleting mapping:', error);
    res.status(500).json({
      success: false,
      message: 'Gagal menghapus mapping',
      error: error.message,
    });
  }
});

export default router;
