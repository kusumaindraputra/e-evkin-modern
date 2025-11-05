import { Router, Request, Response } from 'express';
import { SumberAnggaran, Satuan, Kegiatan, SubKegiatan } from '../models';

const router = Router();

// GET /api/reference/sumber-anggaran - Get all sumber anggaran
router.get('/sumber-anggaran', async (_req: Request, res: Response) => {
  try {
    const data = await SumberAnggaran.findAll({
      order: [['id_sumber', 'ASC']],
    });

    const formatted = data.map(item => ({
      value: item.id_sumber,
      label: item.sumber,
    }));

    res.json(formatted);
  } catch (error) {
    console.error('Error fetching sumber anggaran:', error);
    res.status(500).json({ message: 'Error fetching sumber anggaran' });
  }
});

// GET /api/reference/satuan - Get all satuan
router.get('/satuan', async (_req: Request, res: Response) => {
  try {
    const data = await Satuan.findAll({
      order: [['id_satuan', 'ASC']],
    });

    const formatted = data.map(item => ({
      value: item.id_satuan,
      label: item.satuannya,
    }));

    res.json(formatted);
  } catch (error) {
    console.error('Error fetching satuan:', error);
    res.status(500).json({ message: 'Error fetching satuan' });
  }
});

// GET /api/reference/kegiatan - Get all kegiatan
router.get('/kegiatan', async (_req: Request, res: Response) => {
  try {
    const data = await Kegiatan.findAll({
      order: [['id_kegiatan', 'ASC']],
    });

    const formatted = data.map(item => ({
      value: item.id_kegiatan,
      label: `${item.kode} - ${item.kegiatan}`,
      kode: item.kode,
      kegiatan: item.kegiatan,
    }));

    res.json(formatted);
  } catch (error) {
    console.error('Error fetching kegiatan:', error);
    res.status(500).json({ message: 'Error fetching kegiatan' });
  }
});

// GET /api/reference/sub-kegiatan - Get all or filtered sub kegiatan
router.get('/sub-kegiatan', async (req: Request, res: Response) => {
  try {
    const { id_kegiatan } = req.query;
    
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

    const formatted = data.map(item => ({
      value: item.id_sub_kegiatan,
      label: `${item.kode_sub} - ${item.kegiatan}`,
      id_kegiatan: item.id_kegiatan,
      kode_sub: item.kode_sub,
      kegiatan: item.kegiatan,
      indikator_kinerja: item.indikator_kinerja,
    }));

    res.json(formatted);
  } catch (error) {
    console.error('Error fetching sub kegiatan:', error);
    res.status(500).json({ message: 'Error fetching sub kegiatan' });
  }
});

export default router;
