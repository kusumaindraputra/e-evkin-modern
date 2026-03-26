"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_1 = require("../middleware/auth");
const editPermission_1 = require("../middleware/editPermission");
const laporan_controller_1 = require("../controllers/laporan.controller");
const router = (0, express_1.Router)();
// Get all laporan with pagination
router.get('/', auth_1.authenticate, laporan_controller_1.LaporanController.findAll);
// Get laporan by ID
router.get('/:id', auth_1.authenticate, laporan_controller_1.LaporanController.findById);
// Create new laporan
router.post('/', auth_1.authenticate, (0, editPermission_1.checkEditPermission)('laporan'), laporan_controller_1.LaporanController.create);
// Bulk create laporan
router.post('/bulk', auth_1.authenticate, (0, editPermission_1.checkEditPermission)('laporan'), laporan_controller_1.LaporanController.bulkCreate);
// Bulk upsert laporan (optimized)
router.post('/bulk-upsert', auth_1.authenticate, (0, editPermission_1.checkEditPermission)('laporan'), laporan_controller_1.LaporanController.bulkUpsert);
// Update laporan
router.put('/:id', auth_1.authenticate, (0, editPermission_1.checkEditPermission)('laporan'), laporan_controller_1.LaporanController.update);
// Delete laporan
router.delete('/:id', auth_1.authenticate, laporan_controller_1.LaporanController.delete);
// Submit laporan
router.post('/submit', auth_1.authenticate, laporan_controller_1.LaporanController.submit);
exports.default = router;
//# sourceMappingURL=laporan.routes.js.map