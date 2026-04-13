import { Router, Request, Response } from 'express';
import PuskesmasSubKegiatan from '../models/PuskesmasSubKegiatan';
import User from '../models/User';
import SubKegiatan from '../models/SubKegiatan';
import Kegiatan from '../models/Kegiatan';
import { authenticate } from '../middleware/auth';
import { authorizeAdmin } from '../middleware/authorize';
import PuskesmasEditPermission from '../models/PuskesmasEditPermission';
import sequelize from '../config/database';

const router = Router();

// GET all sub kegiatan assigned to a specific puskesmas
router.get('/puskesmas/:userId/sub-kegiatan', authenticate, async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;

    // Allow puskesmas to access their own data, admin can access any
    if (req.user?.role === 'puskesmas' && req.user?.id !== userId) {
      return res.status(403).json({ message: 'Access denied. You can only access your own data' });
    }

    // Verify puskesmas exists
    const puskesmas = await User.findOne({
      where: { id: userId, role: 'puskesmas' },
    });

    if (!puskesmas) {
      return res.status(404).json({ message: 'Puskesmas tidak ditemukan' });
    }

    // Get assigned sub kegiatan
    const assignments = await PuskesmasSubKegiatan.findAll({
      where: { user_id: userId },
      include: [
        {
          model: SubKegiatan,
          as: 'subKegiatan',
          include: [
            {
              model: Kegiatan,
              as: 'kegiatanParent',
              attributes: ['id_kegiatan', 'kode', 'kegiatan'],
            },
          ],
        },
      ],
      order: [[{ model: SubKegiatan, as: 'subKegiatan' }, 'kode_sub', 'ASC']],
    });

    return res.json({
      puskesmas: {
        id: puskesmas.id,
        nama: puskesmas.nama,
        nama_puskesmas: puskesmas.nama_puskesmas,
      },
      assignments,
    });
  } catch (error) {
    console.error('Error fetching puskesmas sub kegiatan:', error);
    return res.status(500).json({ message: 'Error fetching puskesmas sub kegiatan' });
  }
});

// POST assign sub kegiatan to puskesmas (bulk)
router.post('/puskesmas/:userId/sub-kegiatan', authenticate, authorizeAdmin, async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const { subKegiatanIds } = req.body; // Array of id_sub_kegiatan

    if (!Array.isArray(subKegiatanIds)) {
      return res.status(400).json({ message: 'subKegiatanIds harus berupa array' });
    }

    // Verify puskesmas exists
    const puskesmas = await User.findOne({
      where: { id: userId, role: 'puskesmas' },
    });

    if (!puskesmas) {
      return res.status(404).json({ message: 'Puskesmas tidak ditemukan' });
    }

    // Delete and recreate assignments atomically
    await sequelize.transaction(async (t) => {
      await PuskesmasSubKegiatan.destroy({
        where: { user_id: userId },
        transaction: t,
      });

      if (subKegiatanIds.length > 0) {
        const assignments = subKegiatanIds.map((id_sub_kegiatan) => ({
          user_id: userId,
          id_sub_kegiatan: Number(id_sub_kegiatan),
        }));

        await PuskesmasSubKegiatan.bulkCreate(assignments, {
          ignoreDuplicates: true,
          transaction: t,
        });
      }
    });

    // Return updated assignments
    const updatedAssignments = await PuskesmasSubKegiatan.findAll({
      where: { user_id: userId },
      include: [
        {
          model: SubKegiatan,
          as: 'subKegiatan',
          include: [
            {
              model: Kegiatan,
              as: 'kegiatanParent',
              attributes: ['id_kegiatan', 'kode', 'kegiatan'],
            },
          ],
        },
      ],
      order: [[{ model: SubKegiatan, as: 'subKegiatan' }, 'kode_sub', 'ASC']],
    });

    return res.json({
      message: 'Sub kegiatan berhasil dikonfigurasi',
      assignments: updatedAssignments,
    });
  } catch (error) {
    console.error('Error assigning sub kegiatan:', error);
    return res.status(500).json({ message: 'Error assigning sub kegiatan' });
  }
});

// DELETE single assignment
router.delete('/puskesmas/:userId/sub-kegiatan/:subKegiatanId', authenticate, authorizeAdmin, async (req: Request, res: Response) => {
  try {
    const { userId, subKegiatanId } = req.params;

    const deleted = await PuskesmasSubKegiatan.destroy({
      where: {
        user_id: userId,
        id_sub_kegiatan: subKegiatanId,
      },
    });

    if (deleted === 0) {
      return res.status(404).json({ message: 'Assignment tidak ditemukan' });
    }

    return res.json({ message: 'Sub kegiatan berhasil dihapus dari puskesmas' });
  } catch (error) {
    console.error('Error deleting assignment:', error);
    return res.status(500).json({ message: 'Error deleting assignment' });
  }
});

// GET all puskesmas with their assigned sub kegiatan count
router.get('/puskesmas-overview', authenticate, authorizeAdmin, async (req: Request, res: Response) => {
  try {
    const puskesmasList = await User.findAll({
      where: { role: 'puskesmas' },
      attributes: ['id', 'nama', 'nama_puskesmas', 'kecamatan', 'kode_puskesmas'],
      order: [['nama_puskesmas', 'ASC']],
    });

    // Get assignment counts for each puskesmas
    const overview = await Promise.all(
      puskesmasList.map(async (puskesmas) => {
        const count = await PuskesmasSubKegiatan.count({
          where: { user_id: puskesmas.id },
        });

        return {
          id: puskesmas.id,
          nama: puskesmas.nama,
          nama_puskesmas: puskesmas.nama_puskesmas,
          kecamatan: puskesmas.kecamatan,
          kode_puskesmas: puskesmas.kode_puskesmas,
          jumlah_sub_kegiatan: count,
        };
      })
    );

    return res.json(overview);
  } catch (error) {
    console.error('Error fetching puskesmas overview:', error);
    return res.status(500).json({ message: 'Error fetching puskesmas overview' });
  }
});

export default router;

// =============================
// Edit Permission (Admin)
// =============================

// Create or update edit permission window for a puskesmas
router.post('/edit-permission', authenticate, authorizeAdmin, async (req: Request, res: Response) => {
  try {
    const adminId = req.user!.id;
    const { user_id, scope, bulan, tahun, enabled, start_at, end_at } = req.body;

    if (!scope || !tahun) {
      return res.status(400).json({ message: 'scope dan tahun wajib diisi' });
    }

    const record = await PuskesmasEditPermission.create({
      user_id: user_id || null,
      scope,
      bulan: bulan || null,
      tahun: parseInt(String(tahun)),
      enabled: Boolean(enabled),
      start_at: start_at ? new Date(start_at) : null,
      end_at: end_at ? new Date(end_at) : null,
      created_by: adminId,
    });

    return res.status(201).json({ success: true, data: record });
  } catch (error) {
    console.error('Error setting edit permission:', error);
    return res.status(500).json({ success: false, message: 'Gagal menyimpan konfigurasi permission' });
  }
});

// Get permissions by filter (admin)
router.get('/edit-permission', authenticate, authorizeAdmin, async (req: Request, res: Response) => {
  try {
    const { user_id, scope, bulan, tahun } = req.query;
    const where: any = {};
    if (user_id) where.user_id = user_id; // if omitted, returns all including global
    if (scope) where.scope = scope;
    if (bulan) where.bulan = bulan;
    if (tahun) where.tahun = parseInt(String(tahun));

    const rows = await PuskesmasEditPermission.findAll({ where, order: [['created_at', 'DESC']] });
    return res.json({ success: true, data: rows });
  } catch (error) {
    console.error('Error fetching edit permissions:', error);
    return res.status(500).json({ success: false, message: 'Gagal mengambil data permission' });
  }
});

// Get latest permission (admin) for a specific scope/period, optional user or global
router.get('/edit-permission/latest', authenticate, authorizeAdmin, async (req: Request, res: Response) => {
  try {
    const { user_id, scope, bulan, tahun } = req.query;
    if (!scope || !tahun) {
      return res.status(400).json({ success: false, message: 'scope dan tahun wajib diisi' });
    }
    const where: any = {
      scope,
      bulan: (bulan as string) || null,
      tahun: parseInt(String(tahun)),
    };
    if (user_id) {
      where.user_id = user_id;
    } else {
      // Prefer user-specific if supplied; otherwise only global
      where.user_id = null;
    }

    const latest = await PuskesmasEditPermission.findOne({
      where,
      order: [['created_at', 'DESC']],
    });

    return res.json({ success: true, data: latest });
  } catch (error) {
    console.error('Error fetching latest permission:', error);
    return res.status(500).json({ success: false, message: 'Gagal mengambil permission terbaru' });
  }
});

// Puskesmas: check current status for a period and scope
router.get('/edit-permission/status', authenticate, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const { scope, bulan, tahun } = req.query;
    if (!scope || !tahun) {
      return res.status(400).json({ success: false, message: 'scope dan tahun wajib diisi' });
    }
    
    // First try user-specific permission, then fall back to global
    let record = await PuskesmasEditPermission.findOne({
      where: {
        scope: String(scope),
        bulan: (bulan as string) || null,
        tahun: parseInt(String(tahun)),
        user_id: userId,
      },
      order: [['created_at', 'DESC']],
    });
    
    if (!record) {
      record = await PuskesmasEditPermission.findOne({
        where: {
          scope: String(scope),
          bulan: (bulan as string) || null,
          tahun: parseInt(String(tahun)),
          user_id: null,
        },
        order: [['created_at', 'DESC']],
      });
    }
    
    if (!record) return res.json({ success: true, data: { allowed: false } });
    
    // If enabled is true, always allow
    if (record.enabled) {
      return res.json({ success: true, data: { allowed: true, enabled: record.enabled, start_at: record.start_at, end_at: record.end_at } });
    }
    
    // If enabled is false, check time window
    const now = new Date();
    const start = record.start_at ? new Date(record.start_at) : null;
    const end = record.end_at ? new Date(record.end_at) : null;
    
    // If no time window and not enabled, deny
    if (!start && !end) {
      return res.json({ success: true, data: { allowed: false, enabled: record.enabled, start_at: record.start_at, end_at: record.end_at } });
    }
    
    // Check if within time window
    const withinWindow = (start ? now >= start : true) && (end ? now <= end : true);
    return res.json({ success: true, data: { allowed: withinWindow, enabled: record.enabled, start_at: record.start_at, end_at: record.end_at } });
  } catch (error) {
    console.error('Error getting permission status:', error);
    return res.status(500).json({ success: false, message: 'Gagal memeriksa status permission' });
  }
});
