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
const PuskesmasEditPermission_1 = __importDefault(require("../models/PuskesmasEditPermission"));
const sequelize_1 = require("sequelize");
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
// =============================
// Edit Permission (Admin)
// =============================
// Create or update edit permission window for a puskesmas
router.post('/edit-permission', auth_1.authenticate, authorize_1.authorizeAdmin, async (req, res) => {
    try {
        const adminId = req.user.id;
        const { user_id, scope, bulan, tahun, enabled, start_at, end_at } = req.body;
        if (!scope || !tahun) {
            return res.status(400).json({ message: 'scope dan tahun wajib diisi' });
        }
        const record = await PuskesmasEditPermission_1.default.create({
            user_id: user_id || null,
            scope,
            bulan: bulan || null,
            tahun: parseInt(String(tahun)),
            enabled: Boolean(enabled),
            start_at: start_at ? new Date(start_at) : null,
            end_at: end_at ? new Date(end_at) : null,
            created_by: adminId,
        });
        return res.status(201).json({ success: true, data: record });
    }
    catch (error) {
        console.error('Error setting edit permission:', error);
        return res.status(500).json({ success: false, message: 'Gagal menyimpan konfigurasi permission' });
    }
});
// Get permissions by filter (admin)
router.get('/edit-permission', auth_1.authenticate, authorize_1.authorizeAdmin, async (req, res) => {
    try {
        const { user_id, scope, bulan, tahun } = req.query;
        const where = {};
        if (user_id)
            where.user_id = user_id; // if omitted, returns all including global
        if (scope)
            where.scope = scope;
        if (bulan)
            where.bulan = bulan;
        if (tahun)
            where.tahun = parseInt(String(tahun));
        const rows = await PuskesmasEditPermission_1.default.findAll({ where, order: [['created_at', 'DESC']] });
        return res.json({ success: true, data: rows });
    }
    catch (error) {
        console.error('Error fetching edit permissions:', error);
        return res.status(500).json({ success: false, message: 'Gagal mengambil data permission' });
    }
});
// Get latest permission (admin) for a specific scope/period, optional user or global
router.get('/edit-permission/latest', auth_1.authenticate, authorize_1.authorizeAdmin, async (req, res) => {
    try {
        const { user_id, scope, bulan, tahun } = req.query;
        if (!scope || !tahun) {
            return res.status(400).json({ success: false, message: 'scope dan tahun wajib diisi' });
        }
        const where = {
            scope,
            bulan: bulan || null,
            tahun: parseInt(String(tahun)),
        };
        if (user_id) {
            where.user_id = user_id;
        }
        else {
            // Prefer user-specific if supplied; otherwise only global
            where.user_id = null;
        }
        const latest = await PuskesmasEditPermission_1.default.findOne({
            where,
            order: [['created_at', 'DESC']],
        });
        return res.json({ success: true, data: latest });
    }
    catch (error) {
        console.error('Error fetching latest permission:', error);
        return res.status(500).json({ success: false, message: 'Gagal mengambil permission terbaru' });
    }
});
// Puskesmas: check current status for a period and scope
router.get('/edit-permission/status', auth_1.authenticate, async (req, res) => {
    try {
        const userId = req.user.id;
        const { scope, bulan, tahun } = req.query;
        if (!scope || !tahun) {
            return res.status(400).json({ success: false, message: 'scope dan tahun wajib diisi' });
        }
        const record = await PuskesmasEditPermission_1.default.findOne({
            where: {
                scope: String(scope),
                bulan: bulan || null,
                tahun: parseInt(String(tahun)),
                [sequelize_1.Op.or]: [{ user_id: userId }, { user_id: null }],
            },
            order: [['created_at', 'DESC']],
        });
        if (!record)
            return res.json({ success: true, data: { allowed: false } });
        const now = new Date();
        const start = record.start_at ? new Date(record.start_at) : null;
        const end = record.end_at ? new Date(record.end_at) : null;
        const withinWindow = (start ? now >= start : true) && (end ? now <= end : true);
        const allowed = record.enabled || withinWindow;
        return res.json({ success: true, data: { allowed, enabled: record.enabled, start_at: record.start_at, end_at: record.end_at } });
    }
    catch (error) {
        console.error('Error getting permission status:', error);
        return res.status(500).json({ success: false, message: 'Gagal memeriksa status permission' });
    }
});
//# sourceMappingURL=puskesmas-config.routes.js.map