"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const router = (0, express_1.Router)();
// Puskesmas routes placeholder
router.get('/', async (req, res) => {
    try {
        res.json({ message: 'Puskesmas list endpoint' });
    }
    catch (error) {
        console.error('Puskesmas list error:', error);
        res.status(500).json({
            message: 'Gagal memuat daftar puskesmas',
            error: process.env.NODE_ENV !== 'production' ? error.message : undefined
        });
    }
});
exports.default = router;
//# sourceMappingURL=puskesmas.routes.js.map