import { Router } from 'express';
import User from '../models/User';
import { authenticate } from '../middleware/auth';
import { authorizeAdmin } from '../middleware/authorize';

const router = Router();

router.get('/', authenticate, authorizeAdmin, async (req, res, next) => {
  try {
    const puskesmas = await User.findAll({
      where: { role: 'puskesmas' },
      attributes: ['id', 'username', 'nama', 'nama_puskesmas', 'kecamatan', 'wilayah'],
      order: [['nama_puskesmas', 'ASC']],
    });
    return res.json(puskesmas);
  } catch (error) {
    return next(error);
  }
});

export default router;
