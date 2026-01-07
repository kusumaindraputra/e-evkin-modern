import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { LaporanController } from '../controllers/laporan.controller';

const router = Router();

// Get all laporan with pagination
router.get('/', authenticate, LaporanController.findAll);

// Get laporan by ID
router.get('/:id', authenticate, LaporanController.findById);

// Create new laporan
router.post('/', authenticate, LaporanController.create);

// Bulk create laporan
router.post('/bulk', authenticate, LaporanController.bulkCreate);

// Bulk upsert laporan (optimized)
router.post('/bulk-upsert', authenticate, LaporanController.bulkUpsert);

// Update laporan
router.put('/:id', authenticate, LaporanController.update);

// Delete laporan
router.delete('/:id', authenticate, LaporanController.delete);

// Submit laporan
router.post('/submit', authenticate, LaporanController.submit);

export default router;
