"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LaporanController = void 0;
const laporan_service_1 = require("../services/laporan.service");
class LaporanController {
    static async findAll(req, res) {
        try {
            const result = await laporan_service_1.LaporanService.findAll({
                user_id: req.user?.id,
                role: req.user?.role,
                bulan: req.query.bulan,
                tahun: req.query.tahun ? parseInt(req.query.tahun) : undefined,
                status: req.query.status,
                page: parseInt(req.query.page),
                limit: parseInt(req.query.limit),
                // Admin can filter by specific user_id
                ...(req.user?.role === 'admin' && req.query.user_id ? { user_id: req.query.user_id } : {})
            });
            res.json({
                data: result.rows,
                pagination: {
                    total: result.count,
                    page: parseInt(req.query.page) || 1,
                    limit: parseInt(req.query.limit) || 50,
                    totalPages: Math.ceil(result.count / (parseInt(req.query.limit) || 50))
                }
            });
        }
        catch (error) {
            console.error('Error fetching laporan:', error);
            res.status(500).json({ error: 'Failed to fetch laporan', message: error.message });
        }
    }
    static async findById(req, res) {
        try {
            if (!req.user)
                return res.status(401).json({ error: 'Unauthorized' });
            const laporan = await laporan_service_1.LaporanService.findById(req.params.id, req.user.id, req.user.role);
            res.json(laporan);
        }
        catch (error) {
            if (error.message.includes('not found')) {
                res.status(404).json({ error: 'Laporan not found' });
            }
            else if (error.message.includes('Forbidden')) {
                res.status(403).json({ error: 'Forbidden', message: error.message });
            }
            else {
                res.status(500).json({ error: 'Failed to fetch laporan', message: error.message });
            }
        }
    }
    static async create(req, res) {
        try {
            if (!req.user)
                return res.status(401).json({ error: 'Unauthorized' });
            const payload = { ...req.body };
            // Security: Puskesmas creates for themselves
            if (req.user.role === 'puskesmas') {
                payload.user_id = req.user.id;
            }
            const result = await laporan_service_1.LaporanService.create(payload);
            res.status(201).json(result);
        }
        catch (error) {
            if (error.message.includes('Target belum diset') || error.message.includes('melebihi target')) {
                res.status(400).json({ error: 'Validation error', message: error.message });
            }
            else {
                res.status(500).json({ error: 'Failed to create laporan', message: error.message });
            }
        }
    }
    static async bulkCreate(req, res) {
        try {
            if (!req.user)
                return res.status(401).json({ error: 'Unauthorized' });
            const result = await laporan_service_1.LaporanService.bulkCreate(req.body.laporanArray, req.user.id, req.user.role);
            res.status(201).json({
                success: true,
                count: result.length,
                data: result,
            });
        }
        catch (error) {
            res.status(error.message.includes('laporanArray') ? 400 : 500).json({
                error: 'Failed to bulk create laporan',
                message: error.message
            });
        }
    }
    static async bulkUpsert(req, res) {
        try {
            if (!req.user)
                return res.status(401).json({ error: 'Unauthorized' });
            const result = await laporan_service_1.LaporanService.bulkUpsert(req.body.laporanArray, req.user.id, req.user.role);
            res.status(200).json({
                success: true,
                message: `Bulk upsert completed: ${result.created} created, ${result.updated} updated, ${result.skipped} skipped`,
                results: result,
            });
        }
        catch (error) {
            res.status(error.message.includes('laporanArray') ? 400 : 500).json({
                error: 'Failed to bulk upsert laporan',
                message: error.message
            });
        }
    }
    static async update(req, res) {
        try {
            if (!req.user)
                return res.status(401).json({ error: 'Unauthorized' });
            const result = await laporan_service_1.LaporanService.update({
                id: req.params.id,
                user_id: req.user.id,
                role: req.user.role,
                data: req.body
            });
            res.json(result);
        }
        catch (error) {
            if (error.message.includes('not found')) {
                res.status(404).json({ error: 'Laporan not found' });
            }
            else if (error.message.includes('Forbidden')) {
                res.status(403).json({ error: 'Forbidden', message: error.message });
            }
            else if (error.message.includes('Validation') || error.message.includes('Target')) {
                res.status(400).json({ error: 'Validation error', message: error.message });
            }
            else {
                res.status(500).json({ error: 'Failed to update laporan', message: error.message });
            }
        }
    }
    static async delete(req, res) {
        try {
            if (!req.user)
                return res.status(401).json({ error: 'Unauthorized' });
            await laporan_service_1.LaporanService.delete(req.params.id, req.user.id, req.user.role);
            res.json({ message: 'Laporan deleted successfully' });
        }
        catch (error) {
            if (error.message.includes('not found')) {
                res.status(404).json({ error: 'Laporan not found' });
            }
            else if (error.message.includes('Forbidden')) {
                res.status(403).json({ error: 'Forbidden', message: error.message });
            }
            else {
                res.status(500).json({ error: 'Failed to delete laporan', message: error.message });
            }
        }
    }
    static async submit(req, res) {
        try {
            if (!req.user)
                return res.status(401).json({ error: 'Unauthorized' });
            const { bulan, tahun, user_id } = req.body;
            if (!bulan || !tahun) {
                return res.status(400).json({ error: 'Missing required fields', message: 'bulan and tahun are required' });
            }
            const count = await laporan_service_1.LaporanService.submit(bulan, tahun, req.user.id, req.user.role, user_id);
            res.json({ message: 'Laporan berhasil dikirim', updatedCount: count });
        }
        catch (error) {
            if (error.message.includes('sudah dikirim') || error.message.includes('Missing user_id')) {
                res.status(400).json({ error: 'Bad Request', message: error.message });
            }
            else if (error.message.includes('Tidak ada laporan')) {
                res.status(404).json({ error: 'No laporan found', message: error.message });
            }
            else {
                res.status(500).json({ error: 'Failed to submit laporan', message: error.message });
            }
        }
    }
}
exports.LaporanController = LaporanController;
//# sourceMappingURL=laporan.controller.js.map