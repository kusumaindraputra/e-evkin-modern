"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LaporanController = void 0;
const laporan_service_1 = require("../services/laporan.service");
const MAX_BULK_SIZE = 500;
class LaporanController {
    static async findAll(req, res) {
        try {
            const result = await laporan_service_1.LaporanService.findAll({
                user_id: req.user?.id,
                role: req.user?.role,
                bulan: req.query.bulan,
                tahun: req.query.tahun ? parseInt(req.query.tahun) : undefined,
                status: req.query.status,
                page: req.query.page ? parseInt(req.query.page) : undefined,
                limit: req.query.limit ? parseInt(req.query.limit) : undefined,
                // Admin can filter by specific user_id
                ...(req.user?.role === 'admin' && req.query.user_id ? { user_id: req.query.user_id } : {})
            });
            res.json({
                data: result.rows,
                pagination: {
                    total: result.count,
                    page: req.query.page ? parseInt(req.query.page) : 1,
                    limit: req.query.limit ? parseInt(req.query.limit) : 50,
                    totalPages: Math.ceil(result.count / (req.query.limit ? parseInt(req.query.limit) : 50))
                }
            });
        }
        catch (error) {
            console.error('Error fetching laporan:', error);
            res.status(500).json({ success: false, error: 'Gagal mengambil data laporan' });
        }
    }
    static async findById(req, res) {
        try {
            if (!req.user) {
                res.status(401).json({ error: 'Unauthorized' });
                return;
            }
            const laporan = await laporan_service_1.LaporanService.findById(req.params.id, req.user.id, req.user.role);
            res.json(laporan);
        }
        catch (error) {
            if (error.message.includes('not found')) {
                res.status(404).json({ error: 'Laporan tidak ditemukan' });
            }
            else if (error.message.includes('Forbidden')) {
                res.status(403).json({ error: 'Akses ditolak' });
            }
            else {
                res.status(500).json({ success: false, error: 'Gagal mengambil laporan' });
            }
        }
    }
    static async create(req, res) {
        try {
            if (!req.user) {
                res.status(401).json({ error: 'Unauthorized' });
                return;
            }
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
                res.status(400).json({ error: 'Validasi gagal', message: error.message });
            }
            else {
                console.error('Create laporan error:', error);
                res.status(500).json({ success: false, error: 'Gagal membuat laporan' });
            }
        }
    }
    static async bulkCreate(req, res) {
        try {
            if (!req.user) {
                res.status(401).json({ error: 'Unauthorized' });
                return;
            }
            if (!Array.isArray(req.body.laporanArray) || req.body.laporanArray.length === 0) {
                res.status(400).json({ success: false, error: 'laporanArray harus berupa array dan tidak boleh kosong' });
                return;
            }
            if (req.body.laporanArray.length > MAX_BULK_SIZE) {
                res.status(400).json({ success: false, error: `Maksimal ${MAX_BULK_SIZE} item per batch` });
                return;
            }
            const result = await laporan_service_1.LaporanService.bulkCreate(req.body.laporanArray, req.user.id, req.user.role);
            res.status(201).json({
                success: true,
                count: result.length,
                data: result,
            });
        }
        catch (error) {
            const isValidation = error.message.includes('laporanArray');
            console.error('Bulk create error:', error);
            res.status(isValidation ? 400 : 500).json({
                success: false,
                error: isValidation ? error.message : 'Gagal menyimpan laporan',
            });
        }
    }
    static async bulkUpsert(req, res) {
        try {
            if (!req.user) {
                res.status(401).json({ error: 'Unauthorized' });
                return;
            }
            if (!Array.isArray(req.body.laporanArray) || req.body.laporanArray.length === 0) {
                res.status(400).json({ success: false, error: 'laporanArray harus berupa array dan tidak boleh kosong' });
                return;
            }
            if (req.body.laporanArray.length > MAX_BULK_SIZE) {
                res.status(400).json({ success: false, error: `Maksimal ${MAX_BULK_SIZE} item per batch` });
                return;
            }
            const result = await laporan_service_1.LaporanService.bulkUpsert(req.body.laporanArray, req.user.id, req.user.role);
            res.status(200).json({
                success: true,
                message: `Bulk upsert completed: ${result.created} created, ${result.updated} updated, ${result.skipped} skipped`,
                results: result,
            });
        }
        catch (error) {
            const isValidation = error.message.includes('laporanArray');
            console.error('Bulk upsert error:', error);
            res.status(isValidation ? 400 : 500).json({
                success: false,
                error: isValidation ? error.message : 'Gagal menyimpan laporan',
            });
        }
    }
    static async update(req, res) {
        try {
            if (!req.user) {
                res.status(401).json({ error: 'Unauthorized' });
                return;
            }
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
                res.status(404).json({ error: 'Laporan tidak ditemukan' });
            }
            else if (error.message.includes('Forbidden')) {
                res.status(403).json({ error: 'Akses ditolak' });
            }
            else if (error.message.includes('Validation') || error.message.includes('Target')) {
                res.status(400).json({ error: 'Validasi gagal', message: error.message });
            }
            else {
                console.error('Update laporan error:', error);
                res.status(500).json({ success: false, error: 'Gagal mengupdate laporan' });
            }
        }
    }
    static async delete(req, res) {
        try {
            if (!req.user) {
                res.status(401).json({ error: 'Unauthorized' });
                return;
            }
            await laporan_service_1.LaporanService.delete(req.params.id, req.user.id, req.user.role);
            res.json({ message: 'Laporan deleted successfully' });
        }
        catch (error) {
            if (error.message.includes('not found')) {
                res.status(404).json({ error: 'Laporan tidak ditemukan' });
            }
            else if (error.message.includes('Forbidden')) {
                res.status(403).json({ error: 'Akses ditolak' });
            }
            else {
                console.error('Delete laporan error:', error);
                res.status(500).json({ success: false, error: 'Gagal menghapus laporan' });
            }
        }
    }
    static async submit(req, res) {
        try {
            if (!req.user) {
                res.status(401).json({ error: 'Unauthorized' });
                return;
            }
            const { bulan, tahun, user_id } = req.body;
            if (!bulan || !tahun) {
                res.status(400).json({ error: 'Missing required fields', message: 'bulan and tahun are required' });
                return;
            }
            const count = await laporan_service_1.LaporanService.submit(bulan, tahun, req.user.id, req.user.role, user_id);
            res.json({ message: 'Laporan berhasil dikirim', updatedCount: count });
        }
        catch (error) {
            if (error.message.includes('sudah dikirim') || error.message.includes('Missing user_id')) {
                res.status(400).json({ error: 'Validasi gagal', message: error.message });
            }
            else if (error.message.includes('Tidak ada laporan')) {
                res.status(404).json({ error: 'Tidak ada laporan ditemukan', message: error.message });
            }
            else {
                console.error('Submit laporan error:', error);
                res.status(500).json({ success: false, error: 'Gagal mengirim laporan' });
            }
        }
    }
}
exports.LaporanController = LaporanController;
//# sourceMappingURL=laporan.controller.js.map