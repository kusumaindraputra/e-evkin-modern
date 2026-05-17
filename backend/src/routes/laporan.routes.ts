import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { checkEditPermission } from '../middleware/editPermission';
import { LaporanController } from '../controllers/laporan.controller';

const router = Router();

// Get all laporan with pagination
router.get('/', authenticate, LaporanController.findAll);

// Get laporan by ID
router.get('/:id', authenticate, LaporanController.findById);

// Bulk upsert laporan (optimized) — sole write path for puskesmas
router.post('/bulk-upsert', authenticate, checkEditPermission('laporan'), LaporanController.bulkUpsert);

// Update laporan
router.put('/:id', authenticate, checkEditPermission('laporan'), LaporanController.update);

// Delete laporan
router.delete('/:id', authenticate, checkEditPermission('laporan'), LaporanController.delete);

// Submit laporan
router.post('/submit', authenticate, checkEditPermission('laporan'), LaporanController.submit);

export default router;
