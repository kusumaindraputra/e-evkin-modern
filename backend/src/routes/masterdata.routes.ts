import { Router } from 'express';
import Satuan from '../models/Satuan';
import SumberAnggaran from '../models/SumberAnggaran';
import Kegiatan from '../models/Kegiatan';
import SubKegiatan from '../models/SubKegiatan';
import { authenticate } from '../middleware/auth';

const router = Router();

// ============================================
// SATUAN ROUTES
// ============================================

// Get all satuan
router.get('/satuan', authenticate, async (req, res, next) => {
  try {
    const satuan = await Satuan.findAll({
      order: [['satuannya', 'ASC']],
    });
    res.json(satuan);
  } catch (error) {
    next(error);
  }
});

// Get satuan by ID
router.get('/satuan/:id', authenticate, async (req, res, next) => {
  try {
    const satuan = await Satuan.findByPk(req.params.id);
    if (!satuan) {
      return res.status(404).json({ message: 'Satuan tidak ditemukan' });
    }
    res.json(satuan);
  } catch (error) {
    next(error);
  }
});

// Create satuan (Admin only)
router.post('/satuan', authenticate, async (req, res, next) => {
  try {
    // Check admin role
    if (req.user?.role !== 'admin') {
      return res.status(403).json({ message: 'Akses ditolak. Hanya admin yang dapat menambah satuan' });
    }

    const { satuannya } = req.body;

    if (!satuannya) {
      return res.status(400).json({ message: 'Nama satuan harus diisi' });
    }

    const satuan = await Satuan.create({ satuannya });
    res.status(201).json(satuan);
  } catch (error) {
    next(error);
  }
});

// Update satuan (Admin only)
router.put('/satuan/:id', authenticate, async (req, res, next) => {
  try {
    // Check admin role
    if (req.user?.role !== 'admin') {
      return res.status(403).json({ message: 'Akses ditolak. Hanya admin yang dapat mengubah satuan' });
    }

    const satuan = await Satuan.findByPk(req.params.id);
    if (!satuan) {
      return res.status(404).json({ message: 'Satuan tidak ditemukan' });
    }

    const { satuannya } = req.body;
    if (!satuannya) {
      return res.status(400).json({ message: 'Nama satuan harus diisi' });
    }

    await satuan.update({ satuannya });
    res.json(satuan);
  } catch (error) {
    next(error);
  }
});

// Delete satuan (Admin only)
router.delete('/satuan/:id', authenticate, async (req, res, next) => {
  try {
    // Check admin role
    if (req.user?.role !== 'admin') {
      return res.status(403).json({ message: 'Akses ditolak. Hanya admin yang dapat menghapus satuan' });
    }

    const satuan = await Satuan.findByPk(req.params.id);
    if (!satuan) {
      return res.status(404).json({ message: 'Satuan tidak ditemukan' });
    }

    await satuan.destroy();
    res.json({ message: 'Satuan berhasil dihapus' });
  } catch (error) {
    next(error);
  }
});

// ============================================
// SUMBER ANGGARAN ROUTES
// ============================================

// Get all sumber anggaran
router.get('/sumber-anggaran', authenticate, async (req, res, next) => {
  try {
    const sumberAnggaran = await SumberAnggaran.findAll({
      order: [['sumber', 'ASC']],
    });
    res.json(sumberAnggaran);
  } catch (error) {
    next(error);
  }
});

// Get sumber anggaran by ID
router.get('/sumber-anggaran/:id', authenticate, async (req, res, next) => {
  try {
    const sumberAnggaran = await SumberAnggaran.findByPk(req.params.id);
    if (!sumberAnggaran) {
      return res.status(404).json({ message: 'Sumber anggaran tidak ditemukan' });
    }
    res.json(sumberAnggaran);
  } catch (error) {
    next(error);
  }
});

// Create sumber anggaran (Admin only)
router.post('/sumber-anggaran', authenticate, async (req, res, next) => {
  try {
    if (req.user?.role !== 'admin') {
      return res.status(403).json({ message: 'Akses ditolak. Hanya admin yang dapat menambah sumber anggaran' });
    }

    const { sumber } = req.body;
    if (!sumber) {
      return res.status(400).json({ message: 'Nama sumber anggaran harus diisi' });
    }

    const sumberAnggaran = await SumberAnggaran.create({ sumber });
    res.status(201).json(sumberAnggaran);
  } catch (error) {
    next(error);
  }
});

// Update sumber anggaran (Admin only)
router.put('/sumber-anggaran/:id', authenticate, async (req, res, next) => {
  try {
    if (req.user?.role !== 'admin') {
      return res.status(403).json({ message: 'Akses ditolak. Hanya admin yang dapat mengubah sumber anggaran' });
    }

    const sumberAnggaran = await SumberAnggaran.findByPk(req.params.id);
    if (!sumberAnggaran) {
      return res.status(404).json({ message: 'Sumber anggaran tidak ditemukan' });
    }

    const { sumber } = req.body;
    if (!sumber) {
      return res.status(400).json({ message: 'Nama sumber anggaran harus diisi' });
    }

    await sumberAnggaran.update({ sumber });
    res.json(sumberAnggaran);
  } catch (error) {
    next(error);
  }
});

// Delete sumber anggaran (Admin only)
router.delete('/sumber-anggaran/:id', authenticate, async (req, res, next) => {
  try {
    if (req.user?.role !== 'admin') {
      return res.status(403).json({ message: 'Akses ditolak. Hanya admin yang dapat menghapus sumber anggaran' });
    }

    const sumberAnggaran = await SumberAnggaran.findByPk(req.params.id);
    if (!sumberAnggaran) {
      return res.status(404).json({ message: 'Sumber anggaran tidak ditemukan' });
    }

    await sumberAnggaran.destroy();
    res.json({ message: 'Sumber anggaran berhasil dihapus' });
  } catch (error) {
    next(error);
  }
});

// ============================================
// KEGIATAN ROUTES
// ============================================

// GET all kegiatan with optional sub_kegiatan
router.get('/kegiatan', authenticate, async (req, res, next) => {
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

    res.json(kegiatan);
  } catch (error) {
    next(error);
  }
});

// GET single kegiatan by ID
router.get('/kegiatan/:id', authenticate, async (req, res, next) => {
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
      return res.status(404).json({ message: 'Kegiatan tidak ditemukan' });
    }

    res.json(kegiatan);
  } catch (error) {
    next(error);
  }
});

// POST create new kegiatan (admin only)
router.post('/kegiatan', authenticate, async (req, res, next) => {
  try {
    if (req.user?.role !== 'admin') {
      return res.status(403).json({ message: 'Akses ditolak. Hanya admin yang dapat menambah kegiatan' });
    }

    const { id_uraian, kode, kegiatan } = req.body;

    if (!id_uraian || !kode || !kegiatan) {
      return res.status(400).json({ message: 'id_uraian, kode, dan kegiatan harus diisi' });
    }

    const newKegiatan = await Kegiatan.create({
      id_uraian,
      kode,
      kegiatan,
    });

    res.status(201).json(newKegiatan);
  } catch (error) {
    next(error);
  }
});

// PUT update kegiatan (admin only)
router.put('/kegiatan/:id', authenticate, async (req, res, next) => {
  try {
    if (req.user?.role !== 'admin') {
      return res.status(403).json({ message: 'Akses ditolak. Hanya admin yang dapat mengubah kegiatan' });
    }

    const { id } = req.params;
    const { id_uraian, kode, kegiatan } = req.body;

    const kegiatanRecord = await Kegiatan.findByPk(id);
    if (!kegiatanRecord) {
      return res.status(404).json({ message: 'Kegiatan tidak ditemukan' });
    }

    await kegiatanRecord.update({
      id_uraian,
      kode,
      kegiatan,
    });

    res.json(kegiatanRecord);
  } catch (error) {
    next(error);
  }
});

// DELETE kegiatan (admin only)
router.delete('/kegiatan/:id', authenticate, async (req, res, next) => {
  try {
    if (req.user?.role !== 'admin') {
      return res.status(403).json({ message: 'Akses ditolak. Hanya admin yang dapat menghapus kegiatan' });
    }

    const { id } = req.params;

    const kegiatan = await Kegiatan.findByPk(id);
    if (!kegiatan) {
      return res.status(404).json({ message: 'Kegiatan tidak ditemukan' });
    }

    // Check if kegiatan has sub_kegiatan
    const subKegiatanCount = await SubKegiatan.count({ where: { id_kegiatan: id } });
    if (subKegiatanCount > 0) {
      return res.status(400).json({ 
        message: 'Tidak dapat menghapus kegiatan yang memiliki sub kegiatan. Hapus sub kegiatan terlebih dahulu.' 
      });
    }

    await kegiatan.destroy();
    res.json({ message: 'Kegiatan berhasil dihapus' });
  } catch (error) {
    next(error);
  }
});

// ============================================
// SUB KEGIATAN ROUTES
// ============================================

// GET all sub_kegiatan with optional filter by id_kegiatan
router.get('/sub-kegiatan', authenticate, async (req, res, next) => {
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

    res.json(subKegiatan);
  } catch (error) {
    next(error);
  }
});

// GET single sub_kegiatan by ID
router.get('/sub-kegiatan/:id', authenticate, async (req, res, next) => {
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
      return res.status(404).json({ message: 'Sub kegiatan tidak ditemukan' });
    }

    res.json(subKegiatan);
  } catch (error) {
    next(error);
  }
});

// POST create new sub_kegiatan (admin only)
router.post('/sub-kegiatan', authenticate, async (req, res, next) => {
  try {
    if (req.user?.role !== 'admin') {
      return res.status(403).json({ message: 'Akses ditolak. Hanya admin yang dapat menambah sub kegiatan' });
    }

    const { id_kegiatan, kode_sub, kegiatan, indikator_kinerja } = req.body;

    if (!id_kegiatan || !kode_sub || !kegiatan || !indikator_kinerja) {
      return res.status(400).json({ 
        message: 'id_kegiatan, kode_sub, kegiatan, dan indikator_kinerja harus diisi' 
      });
    }

    // Check if parent kegiatan exists
    const parentKegiatan = await Kegiatan.findByPk(id_kegiatan);
    if (!parentKegiatan) {
      return res.status(404).json({ message: 'Kegiatan parent tidak ditemukan' });
    }

    const newSubKegiatan = await SubKegiatan.create({
      id_kegiatan,
      kode_sub,
      kegiatan,
      indikator_kinerja,
    });

    res.status(201).json(newSubKegiatan);
  } catch (error) {
    next(error);
  }
});

// PUT update sub_kegiatan (admin only)
router.put('/sub-kegiatan/:id', authenticate, async (req, res, next) => {
  try {
    if (req.user?.role !== 'admin') {
      return res.status(403).json({ message: 'Akses ditolak. Hanya admin yang dapat mengubah sub kegiatan' });
    }

    const { id } = req.params;
    const { id_kegiatan, kode_sub, kegiatan, indikator_kinerja } = req.body;

    const subKegiatanRecord = await SubKegiatan.findByPk(id);
    if (!subKegiatanRecord) {
      return res.status(404).json({ message: 'Sub kegiatan tidak ditemukan' });
    }

    // If id_kegiatan is being changed, check if new parent exists
    if (id_kegiatan && id_kegiatan !== subKegiatanRecord.id_kegiatan) {
      const parentKegiatan = await Kegiatan.findByPk(id_kegiatan);
      if (!parentKegiatan) {
        return res.status(404).json({ message: 'Kegiatan parent tidak ditemukan' });
      }
    }

    await subKegiatanRecord.update({
      id_kegiatan,
      kode_sub,
      kegiatan,
      indikator_kinerja,
    });

    res.json(subKegiatanRecord);
  } catch (error) {
    next(error);
  }
});

// DELETE sub_kegiatan (admin only)
router.delete('/sub-kegiatan/:id', authenticate, async (req, res, next) => {
  try {
    if (req.user?.role !== 'admin') {
      return res.status(403).json({ message: 'Akses ditolak. Hanya admin yang dapat menghapus sub kegiatan' });
    }

    const { id } = req.params;

    const subKegiatan = await SubKegiatan.findByPk(id);
    if (!subKegiatan) {
      return res.status(404).json({ message: 'Sub kegiatan tidak ditemukan' });
    }

    await subKegiatan.destroy();
    res.json({ message: 'Sub kegiatan berhasil dihapus' });
  } catch (error) {
    next(error);
  }
});

export default router;
