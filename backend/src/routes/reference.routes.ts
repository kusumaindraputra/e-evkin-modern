import { Router, Request, Response } from 'express';
import { SumberAnggaran, Satuan, Kegiatan, SubKegiatan } from '../models';
import { authenticate } from '../middleware/auth';
import { cacheService, CACHE_KEYS, CACHE_TTL } from '../services/cacheService';

const router = Router();

// Apply authentication to all routes
router.use(authenticate);

// GET /api/reference/sumber-anggaran - Get all sumber anggaran (CACHED)
router.get('/sumber-anggaran', async (_req: Request, res: Response) => {
  try {
    const formatted = await cacheService.getOrFetch(
      CACHE_KEYS.SUMBER_ANGGARAN,
      async () => {
        const data = await SumberAnggaran.findAll({
          order: [['id_sumber', 'ASC']],
        });
        return data.map(item => ({
          value: item.id_sumber,
          label: item.sumber,
        }));
      },
      CACHE_TTL.REFERENCE_DATA
    );

    res.json(formatted);
  } catch (error) {
    console.error('Error fetching sumber anggaran:', error);
    res.status(500).json({ message: 'Error fetching sumber anggaran' });
  }
});

// GET /api/reference/satuan - Get all satuan (CACHED)
router.get('/satuan', async (_req: Request, res: Response) => {
  try {
    const formatted = await cacheService.getOrFetch(
      CACHE_KEYS.SATUAN,
      async () => {
        const data = await Satuan.findAll({
          order: [['id_satuan', 'ASC']],
        });
        return data.map(item => ({
          value: item.id_satuan,
          label: item.satuannya,
        }));
      },
      CACHE_TTL.REFERENCE_DATA
    );

    res.json(formatted);
  } catch (error) {
    console.error('Error fetching satuan:', error);
    res.status(500).json({ message: 'Error fetching satuan' });
  }
});

// GET /api/reference/kegiatan - Get all kegiatan (CACHED)
router.get('/kegiatan', async (_req: Request, res: Response) => {
  try {
    const formatted = await cacheService.getOrFetch(
      CACHE_KEYS.KEGIATAN,
      async () => {
        const data = await Kegiatan.findAll({
          order: [['id_kegiatan', 'ASC']],
        });
        return data.map(item => ({
          value: item.id_kegiatan,
          label: `${item.kode} - ${item.kegiatan}`,
          kode: item.kode,
          kegiatan: item.kegiatan,
        }));
      },
      CACHE_TTL.REFERENCE_DATA
    );

    res.json(formatted);
  } catch (error) {
    console.error('Error fetching kegiatan:', error);
    res.status(500).json({ message: 'Error fetching kegiatan' });
  }
});

// GET /api/reference/sub-kegiatan - Get all or filtered sub kegiatan (CACHED)
router.get('/sub-kegiatan', async (req: Request, res: Response) => {
  try {
    const { id_kegiatan } = req.query;
    
    // Use different cache key based on filter
    const cacheKey = id_kegiatan 
      ? CACHE_KEYS.SUB_KEGIATAN_BY_KEGIATAN(Number(id_kegiatan))
      : CACHE_KEYS.SUB_KEGIATAN_ALL;

    const formatted = await cacheService.getOrFetch(
      cacheKey,
      async () => {
        const where: any = {};
        if (id_kegiatan) {
          where.id_kegiatan = id_kegiatan;
        }

        const data = await SubKegiatan.findAll({
          where,
          include: [
            {
              association: 'kegiatanParent',
              attributes: ['id_kegiatan', 'kode', 'kegiatan'],
            },
          ],
          order: [['id_sub_kegiatan', 'ASC']],
        });

        return data.map(item => ({
          value: item.id_sub_kegiatan,
          label: `${item.kode_sub} - ${item.kegiatan}`,
          id_kegiatan: item.id_kegiatan,
          kode_sub: item.kode_sub,
          kegiatan: item.kegiatan,
          indikator_kinerja: item.indikator_kinerja,
        }));
      },
      CACHE_TTL.REFERENCE_DATA
    );

    res.json(formatted);
  } catch (error) {
    console.error('Error fetching sub kegiatan:', error);
    res.status(500).json({ message: 'Error fetching sub kegiatan' });
  }
});

// GET /api/reference/cache/stats - Get cache statistics (admin only)
router.get('/cache/stats', async (req: Request, res: Response): Promise<void> => {
  try {
    // Only admin can see cache stats
    if (req.user?.role !== 'admin') {
      res.status(403).json({ message: 'Forbidden' });
      return;
    }
    
    const stats = cacheService.stats();
    res.json({
      success: true,
      data: stats,
    });
  } catch (error) {
    console.error('Error getting cache stats:', error);
    res.status(500).json({ message: 'Error getting cache stats' });
  }
});

// POST /api/reference/cache/invalidate - Invalidate cache (admin only)
router.post('/cache/invalidate', async (req: Request, res: Response): Promise<void> => {
  try {
    // Only admin can invalidate cache
    if (req.user?.role !== 'admin') {
      res.status(403).json({ message: 'Forbidden' });
      return;
    }
    
    const { pattern } = req.body;
    
    if (pattern) {
      const count = cacheService.invalidatePattern(pattern);
      res.json({
        success: true,
        message: `Invalidated ${count} cache entries matching pattern: ${pattern}`,
      });
    } else {
      cacheService.clear();
      res.json({
        success: true,
        message: 'All cache entries cleared',
      });
    }
  } catch (error) {
    console.error('Error invalidating cache:', error);
    res.status(500).json({ message: 'Error invalidating cache' });
  }
});

export default router;
