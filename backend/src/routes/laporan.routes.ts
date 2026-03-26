import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { checkEditPermission } from '../middleware/editPermission';
import { LaporanController } from '../controllers/laporan.controller';

const router = Router();

// Get all laporan with pagination
router.get('/', authenticate, LaporanController.findAll);

// Get laporan by ID
router.get('/:id', authenticate, LaporanController.findById);

// Create new laporan
router.post('/', authenticate, checkEditPermission('laporan'), LaporanController.create);

// Bulk create laporan
router.post('/bulk', authenticate, checkEditPermission('laporan'), LaporanController.bulkCreate);

// Bulk upsert laporan (optimized)
router.post('/bulk-upsert', authenticate, checkEditPermission('laporan'), LaporanController.bulkUpsert);

// Update laporan
router.put('/:id', authenticate, checkEditPermission('laporan'), LaporanController.update);

// Delete laporan
router.delete('/:id', authenticate, LaporanController.delete);

// Submit laporan
router.post('/submit', authenticate, LaporanController.submit);

export default router;
