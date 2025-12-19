"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const models_1 = require("../models");
const sequelize_1 = require("sequelize");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
// Get targets untuk puskesmas yang login
router.get('/', auth_1.authenticate, async (req, res) => {
    try {
        const userId = req.user.id;
        const { tahun, id_sub_kegiatan, id_sumber_anggaran } = req.query;
        const whereClause = { user_id: userId, bulan: null };
        if (tahun)
            whereClause.tahun = parseInt(tahun);
        if (id_sub_kegiatan)
            whereClause.id_sub_kegiatan = parseInt(id_sub_kegiatan);
        if (id_sumber_anggaran)
            whereClause.id_sumber_anggaran = parseInt(id_sumber_anggaran);
        const targets = await models_1.SubKegiatanTarget.findAll({
            where: whereClause,
            include: [
                {
                    model: models_1.SubKegiatan,
                    as: 'subKegiatan',
                    attributes: ['id_sub_kegiatan', 'kode_sub', 'kegiatan', 'indikator_kinerja'],
                },
                {
                    model: models_1.User,
                    as: 'creator',
                    attributes: ['id', 'username', 'email'],
                },
            ],
            order: [['created_at', 'DESC']],
        });
        res.json({
            success: true,
            data: targets,
        });
    }
    catch (error) {
        console.error('Error fetching targets:', error);
        res.status(500).json({
            success: false,
            message: 'Gagal memuat data target',
            error: error instanceof Error ? error.message : 'Unknown error',
        });
    }
});
// Get target history untuk sub kegiatan dan sumber anggaran tertentu
router.get('/history/:id_sub_kegiatan', auth_1.authenticate, async (req, res) => {
    try {
        const userId = req.user.id;
        const { id_sub_kegiatan } = req.params;
        const { tahun, id_sumber_anggaran } = req.query;
        const whereClause = {
            user_id: userId,
            id_sub_kegiatan: parseInt(id_sub_kegiatan),
            bulan: null,
        };
        if (tahun)
            whereClause.tahun = parseInt(tahun);
        if (id_sumber_anggaran)
            whereClause.id_sumber_anggaran = parseInt(id_sumber_anggaran);
        console.log('Fetching history with where clause:', whereClause);
        const history = await models_1.SubKegiatanTarget.findAll({
            where: whereClause,
            attributes: ['id', 'user_id', 'id_sub_kegiatan', 'id_sumber_anggaran', 'target_k', 'target_rp', 'bulan', 'tahun', 'created_by', 'created_at', 'updated_at'],
            order: [['created_at', 'DESC']],
        });
        console.log('Found history records:', history.length);
        // Map to include creator info by fetching user separately
        const result = await Promise.all(history.map(async (item) => {
            const createdById = item.getDataValue('created_by');
            let creator = null;
            if (createdById) {
                const userRecord = await models_1.User.findByPk(createdById, {
                    attributes: ['id', 'username', 'nama'],
                });
                if (userRecord) {
                    creator = {
                        id: userRecord.getDataValue('id'),
                        username: userRecord.getDataValue('username'),
                        nama: userRecord.getDataValue('nama'),
                    };
                }
            }
            return {
                id: item.getDataValue('id'),
                user_id: item.getDataValue('user_id'),
                id_sub_kegiatan: item.getDataValue('id_sub_kegiatan'),
                id_sumber_anggaran: item.getDataValue('id_sumber_anggaran'),
                target_k: item.getDataValue('target_k'),
                target_rp: item.getDataValue('target_rp'),
                bulan: item.getDataValue('bulan'),
                tahun: item.getDataValue('tahun'),
                created_by: item.getDataValue('created_by'),
                created_at: item.getDataValue('created_at'),
                updated_at: item.getDataValue('updated_at'),
                creator: creator,
            };
        }));
        return res.json({
            success: true,
            data: result,
        });
    }
    catch (error) {
        console.error('Error fetching target history:', error);
        return res.status(500).json({
            success: false,
            message: 'Gagal memuat history target',
            error: error instanceof Error ? error.message : 'Unknown error',
        });
    }
});
// Get latest target untuk sub kegiatan dan sumber anggaran tertentu (untuk ditampilkan di form laporan)
router.get('/latest/:id_sub_kegiatan', auth_1.authenticate, async (req, res) => {
    try {
        const userId = req.user.id;
        const { id_sub_kegiatan } = req.params;
        const { tahun, id_sumber_anggaran } = req.query;
        if (!tahun) {
            return res.status(400).json({
                success: false,
                message: 'Tahun harus diisi',
            });
        }
        if (!id_sumber_anggaran) {
            return res.status(400).json({
                success: false,
                message: 'Sumber anggaran harus diisi',
            });
        }
        // Cari target tahunan yang diminta
        const target = await models_1.SubKegiatanTarget.findOne({
            where: {
                user_id: userId,
                id_sub_kegiatan: parseInt(id_sub_kegiatan),
                id_sumber_anggaran: parseInt(id_sumber_anggaran),
                bulan: null,
                tahun: parseInt(tahun),
            },
            order: [['created_at', 'DESC']],
        });
        if (!target) {
            return res.json({
                success: true,
                data: null,
                message: 'Target belum diset untuk periode ini',
            });
        }
        return res.json({
            success: true,
            data: target,
        });
    }
    catch (error) {
        console.error('Error fetching latest target:', error);
        return res.status(500).json({
            success: false,
            message: 'Gagal memuat target terbaru',
            error: error instanceof Error ? error.message : 'Unknown error',
        });
    }
});
// Get semua sub kegiatan yang di-assign ke puskesmas dengan target terbaru per sumber anggaran
router.get('/assigned', auth_1.authenticate, async (req, res) => {
    try {
        const userId = req.user.id;
        const { tahun } = req.query;
        // Get assigned sub kegiatan
        const assignments = await models_1.PuskesmasSubKegiatan.findAll({
            where: { user_id: userId },
            include: [
                {
                    model: models_1.SubKegiatan,
                    as: 'subKegiatan',
                    attributes: ['id_sub_kegiatan', 'kode_sub', 'kegiatan', 'indikator_kinerja'],
                },
            ],
        });
        // Get latest yearly targets untuk setiap sub kegiatan dan sumber anggaran
        const subKegiatanIds = assignments.map((a) => a.id_sub_kegiatan);
        let targets = [];
        if (tahun) {
            targets = await models_1.SubKegiatanTarget.findAll({
                where: {
                    user_id: userId,
                    id_sub_kegiatan: { [sequelize_1.Op.in]: subKegiatanIds },
                    bulan: null,
                    tahun: parseInt(tahun),
                },
                order: [['created_at', 'DESC']],
            });
        }
        // Gabungkan data
        const result = assignments.map((assignment) => {
            const assignmentTargets = targets.filter((t) => t.id_sub_kegiatan === assignment.id_sub_kegiatan);
            return {
                id_sub_kegiatan: assignment.id_sub_kegiatan,
                subKegiatan: assignment.subKegiatan,
                targets: assignmentTargets.map((t) => ({
                    id: t.id,
                    id_sumber_anggaran: t.id_sumber_anggaran,
                    target_k: t.target_k,
                    target_rp: t.target_rp,
                    bulan: t.bulan,
                    tahun: t.tahun,
                    created_at: t.created_at,
                    updated_at: t.updated_at,
                })),
            };
        });
        res.json({
            success: true,
            data: result,
        });
    }
    catch (error) {
        console.error('Error fetching assigned sub kegiatan:', error);
        res.status(500).json({
            success: false,
            message: 'Gagal memuat sub kegiatan yang di-assign',
            error: error instanceof Error ? error.message : 'Unknown error',
        });
    }
});
// Create or update target
router.post('/', auth_1.authenticate, async (req, res) => {
    try {
        const userId = req.user.id;
        const { id_sub_kegiatan, id_sumber_anggaran, target_k, target_rp, tahun } = req.body;
        // Validasi input
        if (!id_sub_kegiatan || !id_sumber_anggaran || target_k === undefined || target_rp === undefined || !tahun) {
            return res.status(400).json({
                success: false,
                message: 'Semua field harus diisi (id_sub_kegiatan, id_sumber_anggaran, target_k, target_rp, tahun)',
            });
        }
        // Cek apakah sub kegiatan sudah di-assign ke puskesmas ini
        const assignment = await models_1.PuskesmasSubKegiatan.findOne({
            where: {
                user_id: userId,
                id_sub_kegiatan,
            },
        });
        if (!assignment) {
            return res.status(403).json({
                success: false,
                message: 'Sub kegiatan tidak di-assign ke puskesmas ini',
            });
        }
        // Setiap perubahan akan membuat record baru (untuk history)
        const newTarget = await models_1.SubKegiatanTarget.create({
            user_id: userId,
            id_sub_kegiatan,
            id_sumber_anggaran,
            target_k,
            target_rp,
            bulan: null,
            tahun,
            created_by: userId,
        });
        const targetWithRelations = await models_1.SubKegiatanTarget.findByPk(newTarget.id, {
            include: [
                {
                    model: models_1.SubKegiatan,
                    as: 'subKegiatan',
                    attributes: ['id_sub_kegiatan', 'kode_sub', 'kegiatan', 'indikator_kinerja'],
                },
                {
                    model: models_1.User,
                    as: 'creator',
                    attributes: ['id', 'username', 'email'],
                },
            ],
        });
        return res.status(201).json({
            success: true,
            message: 'Target berhasil disimpan',
            data: targetWithRelations,
        });
    }
    catch (error) {
        console.error('Error creating target:', error);
        return res.status(500).json({
            success: false,
            message: 'Gagal menyimpan target',
            error: error instanceof Error ? error.message : 'Unknown error',
        });
    }
});
// Bulk create/update targets
router.post('/bulk', auth_1.authenticate, async (req, res) => {
    try {
        const userId = req.user.id;
        const { targets, tahun } = req.body;
        // Validasi input
        if (!Array.isArray(targets) || !tahun) {
            return res.status(400).json({
                success: false,
                message: 'Format data tidak valid',
            });
        }
        // Validasi semua sub kegiatan sudah di-assign
        const subKegiatanIds = targets.map(t => t.id_sub_kegiatan);
        const assignments = await models_1.PuskesmasSubKegiatan.findAll({
            where: {
                user_id: userId,
                id_sub_kegiatan: { [sequelize_1.Op.in]: subKegiatanIds },
            },
        });
        if (assignments.length !== subKegiatanIds.length) {
            return res.status(403).json({
                success: false,
                message: 'Beberapa sub kegiatan tidak di-assign ke puskesmas ini',
            });
        }
        // Create all targets (akan otomatis membuat history)
        const newTargets = await Promise.all(targets.map(target => models_1.SubKegiatanTarget.create({
            user_id: userId,
            id_sub_kegiatan: target.id_sub_kegiatan,
            id_sumber_anggaran: target.id_sumber_anggaran,
            target_k: target.target_k,
            target_rp: target.target_rp,
            bulan: null,
            tahun,
            created_by: userId,
        })));
        return res.status(201).json({
            success: true,
            message: `${newTargets.length} target berhasil disimpan`,
            data: newTargets,
        });
    }
    catch (error) {
        console.error('Error bulk creating targets:', error);
        return res.status(500).json({
            success: false,
            message: 'Gagal menyimpan target',
            error: error instanceof Error ? error.message : 'Unknown error',
        });
    }
});
// Delete target (soft delete dengan membuat record target_k = 0, target_rp = 0)
router.delete('/:id', auth_1.authenticate, async (req, res) => {
    try {
        const userId = req.user.id;
        const { id } = req.params;
        const target = await models_1.SubKegiatanTarget.findByPk(id);
        if (!target) {
            return res.status(404).json({
                success: false,
                message: 'Target tidak ditemukan',
            });
        }
        if (target.user_id !== userId) {
            return res.status(403).json({
                success: false,
                message: 'Tidak memiliki akses untuk menghapus target ini',
            });
        }
        // Soft delete: buat record baru dengan nilai 0
        await models_1.SubKegiatanTarget.create({
            user_id: target.user_id,
            id_sub_kegiatan: target.id_sub_kegiatan,
            id_sumber_anggaran: target.id_sumber_anggaran,
            target_k: 0,
            target_rp: 0,
            bulan: null,
            tahun: target.tahun,
            created_by: userId,
        });
        return res.json({
            success: true,
            message: 'Target berhasil dihapus (di-set ke 0)',
        });
    }
    catch (error) {
        console.error('Error deleting target:', error);
        return res.status(500).json({
            success: false,
            message: 'Gagal menghapus target',
            error: error instanceof Error ? error.message : 'Unknown error',
        });
    }
});
exports.default = router;
//# sourceMappingURL=target.routes.js.map