import { Router, Request, Response } from 'express';
import Kegiatan from '../models/Kegiatan';
import SubKegiatan from '../models/SubKegiatan';
import { authenticate } from '../middleware/auth';
import { authorizeAdmin } from '../middleware/authorize';

const router = Router();

// ==================== KEGIATAN ROUTES ====================

// GET all kegiatan with optional sub_kegiatan
router.get('/kegiatan', authenticate, async (req: Request, res: Response) => {
  try {
    const includeSubKegiatan = req.query.include === 'sub';
    
    const kegiatan = await Kegiatan.findAll({
      include: includeSubKegiatan ? [
        {
          model: SubKegiatan,
          as: 'subKegiatan',
        }
      ] : [],
      order: [['kode', 'ASC']],
    });

    return res.json(kegiatan);
  } catch (error) {
    console.error('Error fetching kegiatan:', error);
    return res.status(500).json({ message: 'Error fetching kegiatan' });
  }
});

// GET single kegiatan by ID
router.get('/kegiatan/:id', authenticate, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const kegiatan = await Kegiatan.findByPk(id, {
      include: [
        {
          model: SubKegiatan,
          as: 'subKegiatan',
        }
      ],
    });

    if (!kegiatan) {
      return res.status(404).json({ message: 'Kegiatan not found' });
    }

    return res.json(kegiatan);
  } catch (error) {
    console.error('Error fetching kegiatan:', error);
    return res.status(500).json({ message: 'Error fetching kegiatan' });
  }
});

// POST create new kegiatan (admin only)
router.post('/kegiatan', authenticate, authorizeAdmin, async (req: Request, res: Response) => {
  try {
    const { id_uraian, kode, kegiatan } = req.body;

    if (!id_uraian || !kode || !kegiatan) {
      return res.status(400).json({ message: 'id_uraian, kode, and kegiatan are required' });
    }

    const newKegiatan = await Kegiatan.create({
      id_uraian,
      kode,
      kegiatan,
    });

    return res.status(201).json(newKegiatan);
  } catch (error) {
    console.error('Error creating kegiatan:', error);
    return res.status(500).json({ message: 'Error creating kegiatan' });
  }
});

// PUT update kegiatan (admin only)
router.put('/kegiatan/:id', authenticate, authorizeAdmin, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { id_uraian, kode, kegiatan } = req.body;

    const kegiatanRecord = await Kegiatan.findByPk(id);
    if (!kegiatanRecord) {
      return res.status(404).json({ message: 'Kegiatan not found' });
    }

    await kegiatanRecord.update({
      id_uraian,
      kode,
      kegiatan,
    });

    return res.json(kegiatanRecord);
  } catch (error) {
    console.error('Error updating kegiatan:', error);
    return res.status(500).json({ message: 'Error updating kegiatan' });
  }
});

// DELETE kegiatan (admin only)
router.delete('/kegiatan/:id', authenticate, authorizeAdmin, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const kegiatan = await Kegiatan.findByPk(id);
    if (!kegiatan) {
      return res.status(404).json({ message: 'Kegiatan not found' });
    }

    // Check if kegiatan has sub_kegiatan
    const subKegiatanCount = await SubKegiatan.count({ where: { id_kegiatan: id } });
    if (subKegiatanCount > 0) {
      return res.status(400).json({ 
        message: 'Cannot delete kegiatan with existing sub kegiatan. Delete sub kegiatan first.' 
      });
    }

    await kegiatan.destroy();
    return res.json({ message: 'Kegiatan deleted successfully' });
  } catch (error) {
    console.error('Error deleting kegiatan:', error);
    return res.status(500).json({ message: 'Error deleting kegiatan' });
  }
});

// ==================== SUB KEGIATAN ROUTES ====================

// GET all sub_kegiatan with optional filter by id_kegiatan
router.get('/sub-kegiatan', authenticate, async (req: Request, res: Response) => {
  try {
    const { id_kegiatan } = req.query;
    
    const whereClause = id_kegiatan ? { id_kegiatan: Number(id_kegiatan) } : {};

    const subKegiatan = await SubKegiatan.findAll({
      where: whereClause,
      include: [
        {
          model: Kegiatan,
          as: 'kegiatanParent',
        }
      ],
      order: [['kode_sub', 'ASC']],
    });

    return res.json(subKegiatan);
  } catch (error) {
    console.error('Error fetching sub kegiatan:', error);
    return res.status(500).json({ message: 'Error fetching sub kegiatan' });
  }
});

// GET single sub_kegiatan by ID
router.get('/sub-kegiatan/:id', authenticate, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const subKegiatan = await SubKegiatan.findByPk(id, {
      include: [
        {
          model: Kegiatan,
          as: 'kegiatanParent',
        }
      ],
    });

    if (!subKegiatan) {
      return res.status(404).json({ message: 'Sub kegiatan not found' });
    }

    return res.json(subKegiatan);
  } catch (error) {
    console.error('Error fetching sub kegiatan:', error);
    return res.status(500).json({ message: 'Error fetching sub kegiatan' });
  }
});

// POST create new sub_kegiatan (admin only)
router.post('/sub-kegiatan', authenticate, authorizeAdmin, async (req: Request, res: Response) => {
  try {
    const { id_kegiatan, kode_sub, kegiatan, indikator_kinerja } = req.body;

    if (!id_kegiatan || !kode_sub || !kegiatan || !indikator_kinerja) {
      return res.status(400).json({ 
        message: 'id_kegiatan, kode_sub, kegiatan, and indikator_kinerja are required' 
      });
    }

    // Check if parent kegiatan exists
    const parentKegiatan = await Kegiatan.findByPk(id_kegiatan);
    if (!parentKegiatan) {
      return res.status(404).json({ message: 'Parent kegiatan not found' });
    }

    const newSubKegiatan = await SubKegiatan.create({
      id_kegiatan,
      kode_sub,
      kegiatan,
      indikator_kinerja,
    });

    return res.status(201).json(newSubKegiatan);
  } catch (error) {
    console.error('Error creating sub kegiatan:', error);
    return res.status(500).json({ message: 'Error creating sub kegiatan' });
  }
});

// PUT update sub_kegiatan (admin only)
router.put('/sub-kegiatan/:id', authenticate, authorizeAdmin, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { id_kegiatan, kode_sub, kegiatan, indikator_kinerja } = req.body;

    const subKegiatanRecord = await SubKegiatan.findByPk(id);
    if (!subKegiatanRecord) {
      return res.status(404).json({ message: 'Sub kegiatan not found' });
    }

    // If id_kegiatan is being changed, check if new parent exists
    if (id_kegiatan && id_kegiatan !== subKegiatanRecord.id_kegiatan) {
      const parentKegiatan = await Kegiatan.findByPk(id_kegiatan);
      if (!parentKegiatan) {
        return res.status(404).json({ message: 'Parent kegiatan not found' });
      }
    }

    await subKegiatanRecord.update({
      id_kegiatan,
      kode_sub,
      kegiatan,
      indikator_kinerja,
    });

    return res.json(subKegiatanRecord);
  } catch (error) {
    console.error('Error updating sub kegiatan:', error);
    return res.status(500).json({ message: 'Error updating sub kegiatan' });
  }
});

// DELETE sub_kegiatan (admin only)
router.delete('/sub-kegiatan/:id', authenticate, authorizeAdmin, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const subKegiatan = await SubKegiatan.findByPk(id);
    if (!subKegiatan) {
      return res.status(404).json({ message: 'Sub kegiatan not found' });
    }

    await subKegiatan.destroy();
    return res.json({ message: 'Sub kegiatan deleted successfully' });
  } catch (error) {
    console.error('Error deleting sub kegiatan:', error);
    return res.status(500).json({ message: 'Error deleting sub kegiatan' });
  }
});

export default router;
