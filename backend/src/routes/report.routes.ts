import { Router, Request, Response } from 'express';
import { Op } from 'sequelize';
import sequelize from '../config/database';
import Laporan from '../models/Laporan';
import SubKegiatan from '../models/SubKegiatan';
import Kegiatan from '../models/Kegiatan';
import User from '../models/User';
import SumberAnggaran from '../models/SumberAnggaran';
import { authenticate } from '../middleware/auth';
import { authorizeAdmin } from '../middleware/authorize';

const router = Router();

// GET laporan aggregated by sub kegiatan (admin only)
router.get('/by-sub-kegiatan', authenticate, authorizeAdmin, async (req: Request, res: Response) => {
  try {
    const { bulan, tahun, id_sub_kegiatan, status } = req.query;

    // Build where clause
    const whereClause: any = {};
    if (bulan) whereClause.bulan = bulan;
    if (tahun) whereClause.tahun = Number(tahun);
    if (id_sub_kegiatan) whereClause.id_sub_kegiatan = Number(id_sub_kegiatan);
    if (status) whereClause.status = status;

    // Get aggregated data
    const aggregatedData = await Laporan.findAll({
      attributes: [
        'id_sub_kegiatan',
        'bulan',
        'tahun',
        [sequelize.fn('COUNT', sequelize.col('id')), 'jumlah_laporan'],
        [sequelize.fn('SUM', sequelize.col('target_k')), 'total_target_k'],
        [sequelize.fn('SUM', sequelize.col('target_rp')), 'total_target_rp'],
        [sequelize.fn('SUM', sequelize.col('realisasi_k')), 'total_realisasi_k'],
        [sequelize.fn('SUM', sequelize.col('realisasi_rp')), 'total_realisasi_rp'],
        [sequelize.fn('SUM', sequelize.col('angkas')), 'total_angkas'],
      ],
      where: whereClause,
      include: [
        {
          model: SubKegiatan,
          as: 'subKegiatan',
          attributes: ['id_sub_kegiatan', 'kode_sub', 'kegiatan', 'indikator_kinerja', 'id_kegiatan'],
          include: [
            {
              model: Kegiatan,
              as: 'kegiatanParent',
              attributes: ['id_kegiatan', 'kode', 'kegiatan', 'id_uraian'],
            }
          ],
        },
      ],
      group: [
        'Laporan.id_sub_kegiatan', 
        'Laporan.bulan', 
        'Laporan.tahun', 
        'subKegiatan.id_sub_kegiatan',
        'subKegiatan.id_kegiatan',
        'subKegiatan.kode_sub',
        'subKegiatan.kegiatan',
        'subKegiatan.indikator_kinerja',
        'subKegiatan->kegiatanParent.id_kegiatan',
        'subKegiatan->kegiatanParent.id_uraian',
        'subKegiatan->kegiatanParent.kode',
        'subKegiatan->kegiatanParent.kegiatan'
      ],
      order: [[sequelize.col('subKegiatan->kegiatanParent.kode'), 'ASC'], [sequelize.col('subKegiatan.kode_sub'), 'ASC']],
      raw: false,
    });

    // Calculate percentages
    const result = aggregatedData.map((item: any) => {
      const totalTargetK = Number(item.getDataValue('total_target_k')) || 0;
      const totalRealisasiK = Number(item.getDataValue('total_realisasi_k')) || 0;
      const totalTargetRp = Number(item.getDataValue('total_target_rp')) || 0;
      const totalRealisasiRp = Number(item.getDataValue('total_realisasi_rp')) || 0;

      const persentaseK = totalTargetK > 0 ? (totalRealisasiK / totalTargetK) * 100 : 0;
      const persentaseRp = totalTargetRp > 0 ? (totalRealisasiRp / totalTargetRp) * 100 : 0;

      return {
        id_sub_kegiatan: item.id_sub_kegiatan,
        bulan: item.bulan,
        tahun: item.tahun,
        sub_kegiatan: item.subKegiatan,
        jumlah_laporan: Number(item.getDataValue('jumlah_laporan')),
        total_target_k: totalTargetK,
        total_realisasi_k: totalRealisasiK,
        total_target_rp: totalTargetRp,
        total_realisasi_rp: totalRealisasiRp,
        total_angkas: Number(item.getDataValue('total_angkas')) || 0,
        persentase_k: Math.round(persentaseK * 100) / 100,
        persentase_rp: Math.round(persentaseRp * 100) / 100,
      };
    });

    res.json(result);
  } catch (error) {
    console.error('Error fetching laporan by sub kegiatan:', error);
    res.status(500).json({ message: 'Error fetching laporan by sub kegiatan' });
  }
});

// GET detailed laporan for specific sub kegiatan (admin only)
router.get('/by-sub-kegiatan/detail', authenticate, authorizeAdmin, async (req: Request, res: Response) => {
  try {
    const { bulan, tahun, id_sub_kegiatan } = req.query;

    if (!bulan || !tahun || !id_sub_kegiatan) {
      return res.status(400).json({ message: 'bulan, tahun, and id_sub_kegiatan are required' });
    }

    const laporan = await Laporan.findAll({
      where: {
        bulan,
        tahun: Number(tahun),
        id_sub_kegiatan: Number(id_sub_kegiatan),
      },
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'nama', 'nama_puskesmas', 'kode_puskesmas'],
        },
        {
          model: SubKegiatan,
          as: 'subKegiatan',
          attributes: ['kode_sub', 'kegiatan', 'indikator_kinerja'],
        },
        {
          model: SumberAnggaran,
          as: 'sumberAnggaran',
          attributes: ['id_sumber', 'sumber'],
        },
      ],
      order: [['created_at', 'DESC']],
    });

    res.json(laporan);
  } catch (error) {
    console.error('Error fetching detail laporan:', error);
    res.status(500).json({ message: 'Error fetching detail laporan' });
  }
});

// GET laporan aggregated by sumber anggaran (admin only)
router.get('/by-sumber-anggaran', authenticate, authorizeAdmin, async (req: Request, res: Response) => {
  try {
    const { bulan, tahun, id_sumber_anggaran, status } = req.query;

    // Build where clause
    const whereClause: any = {};
    if (bulan) whereClause.bulan = bulan;
    if (tahun) whereClause.tahun = Number(tahun);
    if (id_sumber_anggaran) whereClause.id_sumber_anggaran = Number(id_sumber_anggaran);
    if (status) whereClause.status = status;

    // Get aggregated data
    const aggregatedData = await Laporan.findAll({
      attributes: [
        'id_sumber_anggaran',
        'bulan',
        'tahun',
        [sequelize.fn('COUNT', sequelize.col('id')), 'jumlah_laporan'],
        [sequelize.fn('SUM', sequelize.col('target_k')), 'total_target_k'],
        [sequelize.fn('SUM', sequelize.col('target_rp')), 'total_target_rp'],
        [sequelize.fn('SUM', sequelize.col('realisasi_k')), 'total_realisasi_k'],
        [sequelize.fn('SUM', sequelize.col('realisasi_rp')), 'total_realisasi_rp'],
        [sequelize.fn('SUM', sequelize.col('angkas')), 'total_angkas'],
      ],
      where: whereClause,
      include: [
        {
          model: SumberAnggaran,
          as: 'sumberAnggaran',
          attributes: ['id_sumber', 'sumber'],
        },
      ],
      group: [
        'Laporan.id_sumber_anggaran', 
        'Laporan.bulan', 
        'Laporan.tahun', 
        'sumberAnggaran.id_sumber',
        'sumberAnggaran.sumber'
      ],
      order: [[sequelize.col('sumberAnggaran.sumber'), 'ASC']],
      raw: false,
    });

    // Calculate percentages
    const result = aggregatedData.map((item: any) => {
      const totalTargetK = Number(item.getDataValue('total_target_k')) || 0;
      const totalRealisasiK = Number(item.getDataValue('total_realisasi_k')) || 0;
      const totalTargetRp = Number(item.getDataValue('total_target_rp')) || 0;
      const totalRealisasiRp = Number(item.getDataValue('total_realisasi_rp')) || 0;

      const persentaseK = totalTargetK > 0 ? (totalRealisasiK / totalTargetK) * 100 : 0;
      const persentaseRp = totalTargetRp > 0 ? (totalRealisasiRp / totalTargetRp) * 100 : 0;

      return {
        id_sumber_anggaran: item.id_sumber_anggaran,
        bulan: item.bulan,
        tahun: item.tahun,
        sumber_anggaran: item.sumberAnggaran,
        jumlah_laporan: Number(item.getDataValue('jumlah_laporan')),
        total_target_k: totalTargetK,
        total_realisasi_k: totalRealisasiK,
        total_target_rp: totalTargetRp,
        total_realisasi_rp: totalRealisasiRp,
        total_angkas: Number(item.getDataValue('total_angkas')) || 0,
        persentase_k: Math.round(persentaseK * 100) / 100,
        persentase_rp: Math.round(persentaseRp * 100) / 100,
      };
    });

    res.json(result);
  } catch (error) {
    console.error('Error fetching laporan by sumber anggaran:', error);
    res.status(500).json({ message: 'Error fetching laporan by sumber anggaran' });
  }
});

// GET detailed laporan for specific sumber anggaran (admin only)
router.get('/by-sumber-anggaran/detail', authenticate, authorizeAdmin, async (req: Request, res: Response) => {
  try {
    const { bulan, tahun, id_sumber_anggaran } = req.query;

    if (!bulan || !tahun || !id_sumber_anggaran) {
      return res.status(400).json({ message: 'bulan, tahun, and id_sumber_anggaran are required' });
    }

    const laporan = await Laporan.findAll({
      where: {
        bulan,
        tahun: Number(tahun),
        id_sumber_anggaran: Number(id_sumber_anggaran),
      },
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'nama', 'nama_puskesmas', 'kode_puskesmas'],
        },
        {
          model: SubKegiatan,
          as: 'subKegiatan',
          attributes: ['kode_sub', 'kegiatan', 'indikator_kinerja'],
        },
        {
          model: SumberAnggaran,
          as: 'sumberAnggaran',
          attributes: ['id_sumber', 'sumber'],
        },
      ],
      order: [['created_at', 'DESC']],
    });

    res.json(laporan);
  } catch (error) {
    console.error('Error fetching detail laporan by sumber anggaran:', error);
    res.status(500).json({ message: 'Error fetching detail laporan' });
  }
});

export default router;
