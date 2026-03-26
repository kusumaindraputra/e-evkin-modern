import { Router, Request, Response } from 'express';

const router = Router();

// Puskesmas routes placeholder
router.get('/', async (req: Request, res: Response): Promise<void> => {
  try {
    res.json({ message: 'Puskesmas list endpoint' });
  } catch (error: any) {
    console.error('Puskesmas list error:', error);
    res.status(500).json({ 
      message: 'Gagal memuat daftar puskesmas', 
      error: process.env.NODE_ENV !== 'production' ? error.message : undefined
    });
  }
});

export default router;
