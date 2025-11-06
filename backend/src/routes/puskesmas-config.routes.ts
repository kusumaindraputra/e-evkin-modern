import { Router, Request, Response } from 'express';
import PuskesmasSubKegiatan from '../models/PuskesmasSubKegiatan';
import User from '../models/User';
import SubKegiatan from '../models/SubKegiatan';
import Kegiatan from '../models/Kegiatan';
import { authenticate } from '../middleware/auth';
import { authorizeAdmin } from '../middleware/authorize';

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

    // Delete existing assignments for this puskesmas
    await PuskesmasSubKegiatan.destroy({
      where: { user_id: userId },
    });

    // Create new assignments
    if (subKegiatanIds.length > 0) {
      const assignments = subKegiatanIds.map((id_sub_kegiatan) => ({
        user_id: userId, // UUID string, not number
        id_sub_kegiatan: Number(id_sub_kegiatan),
      }));

      await PuskesmasSubKegiatan.bulkCreate(assignments, {
        ignoreDuplicates: true,
      });
    }

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
