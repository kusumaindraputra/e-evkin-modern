import { Router } from 'express';
import { SubKegiatanTarget, SubKegiatan, User, PuskesmasSubKegiatan, SumberAnggaran, Satuan } from '../models';
import { Op } from 'sequelize';
import { authenticate } from '../middleware/auth';
import { authorizeAdmin } from '../middleware/authorize';

const router = Router();

// Get targets untuk puskesmas yang login
router.get('/', authenticate, async (req, res) => {
  try {
    const userId = req.user!.id;
    const { tahun, id_sub_kegiatan, id_sumber_anggaran } = req.query;

    const whereClause: any = { user_id: userId, bulan: null };
    if (tahun) whereClause.tahun = parseInt(tahun as string);
    if (id_sub_kegiatan) whereClause.id_sub_kegiatan = parseInt(id_sub_kegiatan as string);
    if (id_sumber_anggaran) whereClause.id_sumber_anggaran = parseInt(id_sumber_anggaran as string);

    const targets = await SubKegiatanTarget.findAll({
      where: whereClause,
      include: [
        {
          model: SubKegiatan,
          as: 'subKegiatan',
          attributes: ['id_sub_kegiatan', 'kode_sub', 'kegiatan', 'indikator_kinerja'],
        },
        {
          model: User,
          as: 'creator',
          attributes: ['id', 'username', 'email'],
        },
      ],
      order: [['created_at', 'DESC']],
    });

    res.json({
      success: true,
      data: targets,
    });
  } catch (error) {
    console.error('Error fetching targets:', error);
    res.status(500).json({
      success: false,
      message: 'Gagal memuat data target',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// Get target history untuk sub kegiatan dan sumber anggaran tertentu
router.get('/history/:id_sub_kegiatan', authenticate, async (req, res) => {
  try {
    const userId = req.user!.id;
    const { id_sub_kegiatan } = req.params;
    const { tahun, id_sumber_anggaran } = req.query;

    const whereClause: any = {
      user_id: userId,
      id_sub_kegiatan: parseInt(id_sub_kegiatan),
      bulan: null,
    };

    if (tahun) whereClause.tahun = parseInt(tahun as string);
    if (id_sumber_anggaran) whereClause.id_sumber_anggaran = parseInt(id_sumber_anggaran as string);

    const history = await SubKegiatanTarget.findAll({
      where: whereClause,
      attributes: ['id', 'user_id', 'id_sub_kegiatan', 'id_sumber_anggaran', 'target_k', 'target_rp', 'bulan', 'tahun', 'created_by', 'created_at', 'updated_at'],
      order: [['created_at', 'DESC']],
    });

    // Map to include creator info by fetching user separately
    const result = await Promise.all(
      history.map(async (item: any) => {
        const createdById = item.getDataValue('created_by');
        let creator = null;
        
        if (createdById) {
          const userRecord = await User.findByPk(createdById, {
            attributes: ['id', 'username', 'nama'],
          });
          
          if (userRecord) {
            creator = {
              id: userRecord.getDataValue('id'),
              username: userRecord.getDataValue('username'),
              nama: userRecord.getDataValue('nama'),
            };
          }
        }

        return {
          id: item.getDataValue('id'),
          user_id: item.getDataValue('user_id'),
          id_sub_kegiatan: item.getDataValue('id_sub_kegiatan'),
          id_sumber_anggaran: item.getDataValue('id_sumber_anggaran'),
          target_k: item.getDataValue('target_k'),
          target_rp: item.getDataValue('target_rp'),
          bulan: item.getDataValue('bulan'),
          tahun: item.getDataValue('tahun'),
          created_by: item.getDataValue('created_by'),
          created_at: item.getDataValue('created_at'),
          updated_at: item.getDataValue('updated_at'),
          creator: creator,
        };
      })
    );

    return res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error('Error fetching target history:', error);
    return res.status(500).json({
      success: false,
      message: 'Gagal memuat history target',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// Get latest target untuk sub kegiatan dan sumber anggaran tertentu (untuk ditampilkan di form laporan)
router.get('/latest/:id_sub_kegiatan', authenticate, async (req, res) => {
  try {
    const userId = req.user!.id;
    const { id_sub_kegiatan } = req.params;
    const { tahun, id_sumber_anggaran } = req.query;

    if (!tahun) {
      return res.status(400).json({
        success: false,
        message: 'Tahun harus diisi',
      });
    }

    if (!id_sumber_anggaran) {
      return res.status(400).json({
        success: false,
        message: 'Sumber anggaran harus diisi',
      });
    }

    // Cari target tahunan yang diminta
    const target = await SubKegiatanTarget.findOne({
      where: {
        user_id: userId,
        id_sub_kegiatan: parseInt(id_sub_kegiatan),
        id_sumber_anggaran: parseInt(id_sumber_anggaran as string),
        bulan: null,
        tahun: parseInt(tahun as string),
      },
      order: [['created_at', 'DESC']],
    });

    if (!target) {
      return res.json({
        success: true,
        data: null,
        message: 'Target belum diset untuk periode ini',
      });
    }

    return res.json({
      success: true,
      data: target,
    });
  } catch (error) {
    console.error('Error fetching latest target:', error);
    return res.status(500).json({
      success: false,
      message: 'Gagal memuat target terbaru',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// Get semua sub kegiatan yang punya target untuk puskesmas ini
router.get('/assigned', authenticate, async (req, res) => {
  try {
    const userId = req.user!.id;
    const { tahun } = req.query;

    if (!tahun) {
      return res.status(400).json({
        success: false,
        message: 'Tahun harus diisi',
      });
    }

    // Langsung ambil targets untuk user ini di tahun tertentu
    const targets = await SubKegiatanTarget.findAll({
      where: {
        user_id: userId,
        bulan: null,
        tahun: parseInt(tahun as string),
        id_sumber_anggaran: { [Op.ne]: null }, // Filter out null sumber anggaran
      },
      include: [
        {
          model: SubKegiatan,
          as: 'subKegiatan',
          attributes: ['id_sub_kegiatan', 'kode_sub', 'kegiatan', 'indikator_kinerja'],
        },
      ],
      order: [['created_at', 'DESC']],
    });

    // Group by sub kegiatan
    const groupedBySubKegiatan = new Map<number, any>();
    
    for (const target of targets) {
      const subKegiatanId = target.id_sub_kegiatan;
      
      if (!groupedBySubKegiatan.has(subKegiatanId)) {
        groupedBySubKegiatan.set(subKegiatanId, {
          id_sub_kegiatan: subKegiatanId,
          subKegiatan: (target as any).subKegiatan,
          targets: [],
        });
      }
      
      // Tambahkan target ke group (hanya latest per sumber anggaran)
      const group = groupedBySubKegiatan.get(subKegiatanId)!;
      const existingTarget = group.targets.find((t: any) => t.id_sumber_anggaran === target.id_sumber_anggaran);
      
      if (!existingTarget) {
        group.targets.push({
          id: target.id,
          id_sumber_anggaran: target.id_sumber_anggaran,
          id_satuan: target.id_satuan,
          target_k: target.target_k,
          target_rp: target.target_rp,
          bulan: target.bulan,
          tahun: target.tahun,
          created_at: target.created_at,
          updated_at: target.updated_at,
        });
      }
    }

    const result = Array.from(groupedBySubKegiatan.values());

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error('Error fetching assigned sub kegiatan:', error);
    res.status(500).json({
      success: false,
      message: 'Gagal memuat sub kegiatan yang punya target',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// Create or update target
router.post('/', authenticate, async (req, res) => {
  try {
    const userId = req.user!.id;
    const { id_sub_kegiatan, id_sumber_anggaran, id_satuan, target_k, target_rp, tahun } = req.body;

    // Validasi input
    if (!id_sub_kegiatan || !id_sumber_anggaran || target_k === undefined || target_rp === undefined || !tahun) {
      return res.status(400).json({
        success: false,
        message: 'Semua field harus diisi (id_sub_kegiatan, id_sumber_anggaran, target_k, target_rp, tahun)',
      });
    }

    // Setiap perubahan akan membuat record baru (untuk history)
    const newTarget = await SubKegiatanTarget.create({
      user_id: userId,
      id_sub_kegiatan,
      id_sumber_anggaran,
      id_satuan: id_satuan || null,
      target_k,
      target_rp,
      bulan: null,
      tahun,
      created_by: userId,
    });

    const targetWithRelations = await SubKegiatanTarget.findByPk(newTarget.id, {
      include: [
        {
          model: SubKegiatan,
          as: 'subKegiatan',
          attributes: ['id_sub_kegiatan', 'kode_sub', 'kegiatan', 'indikator_kinerja'],
        },
        {
          model: User,
          as: 'creator',
          attributes: ['id', 'username', 'email'],
        },
      ],
    });

    return res.status(201).json({
      success: true,
      message: 'Target berhasil disimpan',
      data: targetWithRelations,
    });
  } catch (error) {
    console.error('Error creating target:', error);
    return res.status(500).json({
      success: false,
      message: 'Gagal menyimpan target',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// Bulk create/update targets
router.post('/bulk', authenticate, async (req, res) => {
  try {
    const userId = req.user!.id;
    const { targets, tahun } = req.body;

    // Validasi input
    if (!Array.isArray(targets) || !tahun) {
      return res.status(400).json({
        success: false,
        message: 'Format data tidak valid',
      });
    }

    // Create all targets (akan otomatis membuat history)
    const newTargets = await Promise.all(
      targets.map(target =>
        SubKegiatanTarget.create({
          user_id: userId,
          id_sub_kegiatan: target.id_sub_kegiatan,
          id_sumber_anggaran: target.id_sumber_anggaran,
          target_k: target.target_k,
          target_rp: target.target_rp,
          bulan: null,
          tahun,
          created_by: userId,
        })
      )
    );

    return res.status(201).json({
      success: true,
      message: `${newTargets.length} target berhasil disimpan`,
      data: newTargets,
    });
  } catch (error) {
    console.error('Error bulk creating targets:', error);
    return res.status(500).json({
      success: false,
      message: 'Gagal menyimpan target',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// Delete target (soft delete dengan membuat record target_k = 0, target_rp = 0)
router.delete('/:id', authenticate, async (req, res) => {
  try {
    const userId = req.user!.id;
    const { id } = req.params;

    const target = await SubKegiatanTarget.findByPk(id);

    if (!target) {
      return res.status(404).json({
        success: false,
        message: 'Target tidak ditemukan',
      });
    }

    if (target.user_id !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Tidak memiliki akses untuk menghapus target ini',
      });
    }

    // Soft delete: buat record baru dengan nilai 0
    await SubKegiatanTarget.create({
      user_id: target.user_id,
      id_sub_kegiatan: target.id_sub_kegiatan,
      id_sumber_anggaran: target.id_sumber_anggaran,
      target_k: 0,
      target_rp: 0,
      bulan: null,
      tahun: target.tahun,
      created_by: userId,
    });

    return res.json({
      success: true,
      message: 'Target berhasil dihapus (di-set ke 0)',
    });
  } catch (error) {
    console.error('Error deleting target:', error);
    return res.status(500).json({
      success: false,
      message: 'Gagal menghapus target',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// ============================================
// ADMIN ENDPOINTS
// ============================================

// Get all targets from all puskesmas (admin only)
router.get('/admin', authenticate, authorizeAdmin, async (req, res) => {
  try {
    const { user_id, id_sub_kegiatan, id_sumber_anggaran, tahun } = req.query;

    const whereClause: any = { bulan: null };
    if (user_id) whereClause.user_id = parseInt(user_id as string);
    if (id_sub_kegiatan) whereClause.id_sub_kegiatan = parseInt(id_sub_kegiatan as string);
    if (id_sumber_anggaran) whereClause.id_sumber_anggaran = parseInt(id_sumber_anggaran as string);
    if (tahun) whereClause.tahun = parseInt(tahun as string);

    // Get all targets
    const allTargets = await SubKegiatanTarget.findAll({
      where: whereClause,
      include: [
        {
          model: User,
          as: 'puskesmas',
          attributes: ['id', 'username', 'nama'],
        },
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
        {
          model: Satuan,
          as: 'satuan',
          attributes: ['id_satuan', 'satuannya'],
        },
        {
          model: User,
          as: 'creator',
          attributes: ['id', 'username', 'nama'],
        },
      ],
      order: [['created_at', 'DESC']],
    });

    // Group by combination and get latest per group
    const groupedTargets = allTargets.reduce((acc: any, target: any) => {
      const key = `${target.user_id}_${target.id_sub_kegiatan}_${target.id_sumber_anggaran}_${target.tahun}`;
      if (!acc[key]) {
        acc[key] = target;
      }
      return acc;
    }, {});

    const latestTargets = Object.values(groupedTargets);

    res.json({
      success: true,
      data: latestTargets,
    });
  } catch (error) {
    console.error('Error fetching admin targets:', error);
    res.status(500).json({
      success: false,
      message: 'Gagal memuat data target',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// Create or update target for any puskesmas (admin only)
router.post('/admin', authenticate, authorizeAdmin, async (req, res) => {
  try {
    const adminId = req.user!.id;
    const { user_id, id_sub_kegiatan, id_sumber_anggaran, id_satuan, target_k, target_rp, tahun } = req.body;

    // Validasi input
    if (!user_id || !id_sub_kegiatan || !id_sumber_anggaran || target_k === undefined || target_rp === undefined || !tahun) {
      return res.status(400).json({
        success: false,
        message: 'Semua field harus diisi (user_id, id_sub_kegiatan, id_sumber_anggaran, target_k, target_rp, tahun)',
      });
    }

    // Cek apakah puskesmas exists
    const puskesmas = await User.findByPk(user_id);
    if (!puskesmas || puskesmas.role !== 'puskesmas') {
      return res.status(400).json({
        success: false,
        message: 'Puskesmas tidak ditemukan',
      });
    }

    // Create new target record (history-based)
    const newTarget = await SubKegiatanTarget.create({
      user_id,
      id_sub_kegiatan,
      id_sumber_anggaran,
      id_satuan: id_satuan || null,
      target_k,
      target_rp,
      bulan: null,
      tahun,
      created_by: adminId,
    });

    const targetWithRelations = await SubKegiatanTarget.findByPk(newTarget.id, {
      include: [
        {
          model: User,
          as: 'puskesmas',
          attributes: ['id', 'username', 'nama'],
        },
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
        {
          model: User,
          as: 'creator',
          attributes: ['id', 'username', 'nama'],
        },
      ],
    });

    return res.status(201).json({
      success: true,
      message: 'Target berhasil disimpan',
      data: targetWithRelations,
    });
  } catch (error) {
    console.error('Error creating admin target:', error);
    return res.status(500).json({
      success: false,
      message: 'Gagal menyimpan target',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// Get history for specific combination (admin only)
router.get('/admin/history', authenticate, authorizeAdmin, async (req, res) => {
  try {
    const { user_id, id_sub_kegiatan, id_sumber_anggaran, tahun } = req.query;

    if (!user_id || !id_sub_kegiatan || !id_sumber_anggaran || !tahun) {
      return res.status(400).json({
        success: false,
        message: 'Parameter user_id, id_sub_kegiatan, id_sumber_anggaran, dan tahun harus diisi',
      });
    }

    const history = await SubKegiatanTarget.findAll({
      where: {
        user_id: parseInt(user_id as string),
        id_sub_kegiatan: parseInt(id_sub_kegiatan as string),
        id_sumber_anggaran: parseInt(id_sumber_anggaran as string),
        tahun: parseInt(tahun as string),
        bulan: null,
      },
      include: [
        {
          model: User,
          as: 'creator',
          attributes: ['id', 'username', 'nama'],
        },
      ],
      order: [['created_at', 'DESC']],
    });

    return res.json({
      success: true,
      data: history,
    });
  } catch (error) {
    console.error('Error fetching admin history:', error);
    return res.status(500).json({
      success: false,
      message: 'Gagal memuat history target',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

export default router;
