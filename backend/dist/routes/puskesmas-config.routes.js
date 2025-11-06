"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const PuskesmasSubKegiatan_1 = __importDefault(require("../models/PuskesmasSubKegiatan"));
const User_1 = __importDefault(require("../models/User"));
const SubKegiatan_1 = __importDefault(require("../models/SubKegiatan"));
const Kegiatan_1 = __importDefault(require("../models/Kegiatan"));
const auth_1 = require("../middleware/auth");
const authorize_1 = require("../middleware/authorize");
const router = (0, express_1.Router)();
// GET all sub kegiatan assigned to a specific puskesmas
router.get('/puskesmas/:userId/sub-kegiatan', auth_1.authenticate, async (req, res) => {
    try {
        const { userId } = req.params;
        // Allow puskesmas to access their own data, admin can access any
        if (req.user?.role === 'puskesmas' && req.user?.id !== userId) {
            return res.status(403).json({ message: 'Access denied. You can only access your own data' });
        }
        // Verify puskesmas exists
        const puskesmas = await User_1.default.findOne({
            where: { id: userId, role: 'puskesmas' },
        });
        if (!puskesmas) {
            return res.status(404).json({ message: 'Puskesmas tidak ditemukan' });
        }
        // Get assigned sub kegiatan
        const assignments = await PuskesmasSubKegiatan_1.default.findAll({
            where: { user_id: userId },
            include: [
                {
                    model: SubKegiatan_1.default,
                    as: 'subKegiatan',
                    include: [
                        {
                            model: Kegiatan_1.default,
                            as: 'kegiatanParent',
                            attributes: ['id_kegiatan', 'kode', 'kegiatan'],
                        },
                    ],
                },
            ],
            order: [[{ model: SubKegiatan_1.default, as: 'subKegiatan' }, 'kode_sub', 'ASC']],
        });
        return res.json({
            puskesmas: {
                id: puskesmas.id,
                nama: puskesmas.nama,
                nama_puskesmas: puskesmas.nama_puskesmas,
            },
            assignments,
        });
    }
    catch (error) {
        console.error('Error fetching puskesmas sub kegiatan:', error);
        return res.status(500).json({ message: 'Error fetching puskesmas sub kegiatan' });
    }
});
// POST assign sub kegiatan to puskesmas (bulk)
router.post('/puskesmas/:userId/sub-kegiatan', auth_1.authenticate, authorize_1.authorizeAdmin, async (req, res) => {
    try {
        const { userId } = req.params;
        const { subKegiatanIds } = req.body; // Array of id_sub_kegiatan
        if (!Array.isArray(subKegiatanIds)) {
            return res.status(400).json({ message: 'subKegiatanIds harus berupa array' });
        }
        // Verify puskesmas exists
        const puskesmas = await User_1.default.findOne({
            where: { id: userId, role: 'puskesmas' },
        });
        if (!puskesmas) {
            return res.status(404).json({ message: 'Puskesmas tidak ditemukan' });
        }
        // Delete existing assignments for this puskesmas
        await PuskesmasSubKegiatan_1.default.destroy({
            where: { user_id: userId },
        });
        // Create new assignments
        if (subKegiatanIds.length > 0) {
            const assignments = subKegiatanIds.map((id_sub_kegiatan) => ({
                user_id: userId, // UUID string, not number
                id_sub_kegiatan: Number(id_sub_kegiatan),
            }));
            await PuskesmasSubKegiatan_1.default.bulkCreate(assignments, {
                ignoreDuplicates: true,
            });
        }
        // Return updated assignments
        const updatedAssignments = await PuskesmasSubKegiatan_1.default.findAll({
            where: { user_id: userId },
            include: [
                {
                    model: SubKegiatan_1.default,
                    as: 'subKegiatan',
                    include: [
                        {
                            model: Kegiatan_1.default,
                            as: 'kegiatanParent',
                            attributes: ['id_kegiatan', 'kode', 'kegiatan'],
                        },
                    ],
                },
            ],
            order: [[{ model: SubKegiatan_1.default, as: 'subKegiatan' }, 'kode_sub', 'ASC']],
        });
        return res.json({
            message: 'Sub kegiatan berhasil dikonfigurasi',
            assignments: updatedAssignments,
        });
    }
    catch (error) {
        console.error('Error assigning sub kegiatan:', error);
        return res.status(500).json({ message: 'Error assigning sub kegiatan' });
    }
});
// DELETE single assignment
router.delete('/puskesmas/:userId/sub-kegiatan/:subKegiatanId', auth_1.authenticate, authorize_1.authorizeAdmin, async (req, res) => {
    try {
        const { userId, subKegiatanId } = req.params;
        const deleted = await PuskesmasSubKegiatan_1.default.destroy({
            where: {
                user_id: userId,
                id_sub_kegiatan: subKegiatanId,
            },
        });
        if (deleted === 0) {
            return res.status(404).json({ message: 'Assignment tidak ditemukan' });
        }
        return res.json({ message: 'Sub kegiatan berhasil dihapus dari puskesmas' });
    }
    catch (error) {
        console.error('Error deleting assignment:', error);
        return res.status(500).json({ message: 'Error deleting assignment' });
    }
});
// GET all puskesmas with their assigned sub kegiatan count
router.get('/puskesmas-overview', auth_1.authenticate, authorize_1.authorizeAdmin, async (req, res) => {
    try {
        const puskesmasList = await User_1.default.findAll({
            where: { role: 'puskesmas' },
            attributes: ['id', 'nama', 'nama_puskesmas', 'kecamatan', 'kode_puskesmas'],
            order: [['nama_puskesmas', 'ASC']],
        });
        // Get assignment counts for each puskesmas
        const overview = await Promise.all(puskesmasList.map(async (puskesmas) => {
            const count = await PuskesmasSubKegiatan_1.default.count({
                where: { user_id: puskesmas.id },
            });
            return {
                id: puskesmas.id,
                nama: puskesmas.nama,
                nama_puskesmas: puskesmas.nama_puskesmas,
                kecamatan: puskesmas.kecamatan,
                kode_puskesmas: puskesmas.kode_puskesmas,
                jumlah_sub_kegiatan: count,
            };
        }));
        return res.json(overview);
    }
    catch (error) {
        console.error('Error fetching puskesmas overview:', error);
        return res.status(500).json({ message: 'Error fetching puskesmas overview' });
    }
});
exports.default = router;
//# sourceMappingURL=puskesmas-config.routes.js.map