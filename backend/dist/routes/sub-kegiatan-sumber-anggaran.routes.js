"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const models_1 = require("../models");
const auth_1 = require("../middleware/auth");
const authorize_1 = require("../middleware/authorize");
const router = (0, express_1.Router)();
/**
 * @route GET /api/sub-kegiatan-sumber-dana
 * @desc Get all sub kegiatan sumber anggaran mappings (with optional filters)
 * @access Admin only
 */
router.get('/', auth_1.authenticate, authorize_1.authorizeAdmin, async (req, res) => {
    try {
        const { id_sub_kegiatan, id_sumber_anggaran, is_active } = req.query;
        const where = {};
        if (id_sub_kegiatan)
            where.id_sub_kegiatan = id_sub_kegiatan;
        if (id_sumber_anggaran)
            where.id_sumber_anggaran = id_sumber_anggaran;
        if (is_active !== undefined)
            where.is_active = is_active === 'true';
        const mappings = await models_1.SubKegiatanSumberAnggaran.findAll({
            where,
            include: [
                {
                    model: models_1.SubKegiatan,
                    as: 'subKegiatan',
                    attributes: ['id_sub_kegiatan', 'kode_sub', 'kegiatan', 'indikator_kinerja'],
                },
                {
                    model: models_1.SumberAnggaran,
                    as: 'sumberAnggaran',
                    attributes: ['id_sumber', 'sumber'],
                },
            ],
            order: [['id_sub_kegiatan', 'ASC'], ['id_sumber_anggaran', 'ASC']],
        });
        res.json({
            success: true,
            data: mappings,
        });
    }
    catch (error) {
        console.error('Error fetching sub kegiatan sumber anggaran:', error);
        res.status(500).json({
            success: false,
            message: 'Gagal mengambil data sumber anggaran sub kegiatan',
            error: error.message,
        });
    }
});
/**
 * @route GET /api/sub-kegiatan-sumber-dana/by-sub-kegiatan/:id_sub_kegiatan
 * @desc Get all sumber anggaran for a specific sub kegiatan
 * @access Authenticated (puskesmas & admin)
 */
router.get('/by-sub-kegiatan/:id_sub_kegiatan', auth_1.authenticate, async (req, res) => {
    try {
        const { id_sub_kegiatan } = req.params;
        const sumberAnggaranList = await models_1.SubKegiatanSumberAnggaran.findAll({
            where: {
                id_sub_kegiatan,
                is_active: true,
            },
            include: [
                {
                    model: models_1.SumberAnggaran,
                    as: 'sumberAnggaran',
                    attributes: ['id_sumber', 'sumber'],
                },
            ],
            order: [['id_sumber_anggaran', 'ASC']],
        });
        res.json({
            success: true,
            data: sumberAnggaranList,
        });
    }
    catch (error) {
        console.error('Error fetching sumber anggaran for sub kegiatan:', error);
        res.status(500).json({
            success: false,
            message: 'Gagal mengambil data sumber anggaran',
            error: error.message,
        });
    }
});
/**
 * @route POST /api/sub-kegiatan-sumber-dana
 * @desc Add sumber anggaran to sub kegiatan
 * @access Admin only
 */
router.post('/', auth_1.authenticate, authorize_1.authorizeAdmin, async (req, res) => {
    try {
        const { id_sub_kegiatan, id_sumber_anggaran, is_active = true } = req.body;
        // Validate required fields
        if (!id_sub_kegiatan || !id_sumber_anggaran) {
            return res.status(400).json({
                success: false,
                message: 'id_sub_kegiatan dan id_sumber_anggaran wajib diisi',
            });
        }
        // Check if sub kegiatan exists
        const subKegiatan = await models_1.SubKegiatan.findByPk(id_sub_kegiatan);
        if (!subKegiatan) {
            return res.status(404).json({
                success: false,
                message: 'Sub kegiatan tidak ditemukan',
            });
        }
        // Check if sumber anggaran exists
        const sumberAnggaran = await models_1.SumberAnggaran.findByPk(id_sumber_anggaran);
        if (!sumberAnggaran) {
            return res.status(404).json({
                success: false,
                message: 'Sumber anggaran tidak ditemukan',
            });
        }
        // Check if mapping already exists
        const existing = await models_1.SubKegiatanSumberAnggaran.findOne({
            where: { id_sub_kegiatan, id_sumber_anggaran },
        });
        if (existing) {
            // Update if exists
            existing.is_active = is_active;
            await existing.save();
            return res.json({
                success: true,
                message: 'Mapping berhasil diperbarui',
                data: existing,
            });
        }
        // Create new mapping
        const mapping = await models_1.SubKegiatanSumberAnggaran.create({
            id_sub_kegiatan,
            id_sumber_anggaran,
            is_active,
        });
        const result = await models_1.SubKegiatanSumberAnggaran.findByPk(mapping.id, {
            include: [
                {
                    model: models_1.SubKegiatan,
                    as: 'subKegiatan',
                    attributes: ['id_sub_kegiatan', 'kode_sub', 'kegiatan'],
                },
                {
                    model: models_1.SumberAnggaran,
                    as: 'sumberAnggaran',
                    attributes: ['id_sumber', 'sumber'],
                },
            ],
        });
        return res.status(201).json({
            success: true,
            message: 'sumber anggaran berhasil ditambahkan ke sub kegiatan',
            data: result,
        });
    }
    catch (error) {
        console.error('Error creating sub kegiatan sumber anggaran:', error);
        return res.status(500).json({
            success: false,
            message: 'Gagal menambahkan sumber anggaran',
            error: error.message,
        });
    }
});
/**
 * @route POST /api/sub-kegiatan-sumber-dana/bulk
 * @desc Bulk assign sumber anggaran to sub kegiatan (replaces existing)
 * @access Admin only
 */
router.post('/bulk', auth_1.authenticate, authorize_1.authorizeAdmin, async (req, res) => {
    try {
        const { id_sub_kegiatan, sumber_anggaran_ids } = req.body;
        if (!id_sub_kegiatan || !Array.isArray(sumber_anggaran_ids)) {
            return res.status(400).json({
                success: false,
                message: 'id_sub_kegiatan dan sumber_anggaran_ids (array) wajib diisi',
            });
        }
        // Check if sub kegiatan exists
        const subKegiatan = await models_1.SubKegiatan.findByPk(id_sub_kegiatan);
        if (!subKegiatan) {
            return res.status(404).json({
                success: false,
                message: 'Sub kegiatan tidak ditemukan',
            });
        }
        // Delete existing mappings
        await models_1.SubKegiatanSumberAnggaran.destroy({
            where: { id_sub_kegiatan },
        });
        // Create new mappings
        const mappings = await Promise.all(sumber_anggaran_ids.map((id_sumber_anggaran) => models_1.SubKegiatanSumberAnggaran.create({
            id_sub_kegiatan,
            id_sumber_anggaran,
            is_active: true,
        })));
        return res.json({
            success: true,
            message: `Berhasil mengatur ${mappings.length} sumber anggaran untuk sub kegiatan`,
            data: mappings,
        });
    }
    catch (error) {
        console.error('Error bulk assigning sumber anggaran:', error);
        return res.status(500).json({
            success: false,
            message: 'Gagal mengatur sumber anggaran',
            error: error.message,
        });
    }
});
/**
 * @route PUT /api/sub-kegiatan-sumber-dana/:id
 * @desc Update mapping (toggle is_active)
 * @access Admin only
 */
router.put('/:id', auth_1.authenticate, authorize_1.authorizeAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        const { is_active } = req.body;
        const mapping = await models_1.SubKegiatanSumberAnggaran.findByPk(id);
        if (!mapping) {
            return res.status(404).json({
                success: false,
                message: 'Mapping tidak ditemukan',
            });
        }
        if (is_active !== undefined) {
            mapping.is_active = is_active;
            await mapping.save();
        }
        return res.json({
            success: true,
            message: 'Mapping berhasil diperbarui',
            data: mapping,
        });
    }
    catch (error) {
        console.error('Error updating mapping:', error);
        return res.status(500).json({
            success: false,
            message: 'Gagal memperbarui mapping',
            error: error.message,
        });
    }
});
/**
 * @route DELETE /api/sub-kegiatan-sumber-dana/:id
 * @desc Delete mapping
 * @access Admin only
 */
router.delete('/:id', auth_1.authenticate, authorize_1.authorizeAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        const mapping = await models_1.SubKegiatanSumberAnggaran.findByPk(id);
        if (!mapping) {
            return res.status(404).json({
                success: false,
                message: 'Mapping tidak ditemukan',
            });
        }
        await mapping.destroy();
        return res.json({
            success: true,
            message: 'Mapping berhasil dihapus',
        });
    }
    catch (error) {
        console.error('Error deleting mapping:', error);
        return res.status(500).json({
            success: false,
            message: 'Gagal menghapus mapping',
            error: error.message,
        });
    }
});
exports.default = router;
//# sourceMappingURL=sub-kegiatan-sumber-anggaran.routes.js.map