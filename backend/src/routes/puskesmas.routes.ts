import { Router } from 'express';

const router = Router();

// Puskesmas routes placeholder
router.get('/', (req, res) => {
  res.json({ message: 'Puskesmas list endpoint' });
});

export default router;
