"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const models_1 = require("../models");
const auth_1 = require("../middleware/auth");
const authorize_1 = require("../middleware/authorize");
const sequelize_1 = require("sequelize");
const dashboardService_1 = require("../services/dashboardService");
const router = (0, express_1.Router)();
// Get all submitted laporan grouped by puskesmas for admin verification
router.get('/verifikasi', auth_1.authenticate, authorize_1.authorizeAdmin, async (req, res) => {
    try {
        const { puskesmas, bulan, tahun, page = 1, pageSize = 10 } = req.query;
        // Validate and parse numeric parameters
        const parsedTahun = tahun ? parseInt(tahun, 10) : undefined;
        const parsedPage = parseInt(page, 10) || 1;
        const parsedPageSize = parseInt(pageSize, 10) || 10;
        // Build where clause
        const where = {
            status: 'terkirim' // Only show submitted reports
        };
        if (bulan)
            where.bulan = bulan;
        if (parsedTahun && !isNaN(parsedTahun))
            where.tahun = parsedTahun;
        // User filter
        const userWhere = {};
        if (puskesmas) {
            userWhere.nama_puskesmas = { [sequelize_1.Op.like]: `%${puskesmas}%` };
        }
        const offset = (parsedPage - 1) * parsedPageSize;
        const limit = parsedPageSize;
        // Query laporan with grouping
        const { rows, count } = await models_1.Laporan.findAndCountAll({
            where,
            include: [
                {
                    model: models_1.User,
                    as: 'user',
                    attributes: ['id', 'username', 'nama', 'nama_puskesmas', 'kecamatan', 'wilayah'],
                    where: userWhere
                },
                {
                    model: models_1.SubKegiatan,
                    as: 'subKegiatan',
                    attributes: ['id_sub_kegiatan', 'kode_sub', 'kegiatan'],
                    include: [{
                            model: models_1.Kegiatan,
                            as: 'kegiatanParent',
                            attributes: ['id_kegiatan', 'kode', 'kegiatan']
                        }]
                }
            ],
            offset,
            limit,
            order: [['user_id', 'ASC'], ['bulan', 'ASC'], ['tahun', 'DESC']]
        });
        // Group by puskesmas, bulan, tahun
        const grouped = {};
        rows.forEach((lap) => {
            const key = `${lap.user_id}_${lap.bulan}_${lap.tahun}`;
            if (!grouped[key]) {
                grouped[key] = {
                    user_id: lap.user_id,
                    puskesmas: lap.user?.nama_puskesmas || 'N/A',
                    nama_lengkap: lap.user?.nama || 'N/A',
                    kecamatan: lap.user?.kecamatan || 'N/A',
                    wilayah: lap.user?.wilayah || 'N/A',
                    bulan: lap.bulan,
                    tahun: lap.tahun,
                    total_laporan: 0,
                    terkirim: 0,
                    laporan: []
                };
            }
            grouped[key].total_laporan++;
            if (lap.status === 'terkirim')
                grouped[key].terkirim++;
            grouped[key].laporan.push(lap);
        });
        const result = Object.values(grouped);
        res.json({
            data: result,
            pagination: {
                total: count,
                page: parseInt(page),
                pageSize: parseInt(pageSize),
                totalPages: Math.ceil(count / parseInt(pageSize))
            }
        });
    }
    catch (error) {
        console.error('Admin verifikasi error:', error);
        res.status(500).json({ success: false, message: 'Gagal mengambil data verifikasi' });
    }
});
// Get laporan detail for specific puskesmas + bulan + tahun
router.get('/laporan/:userId/:bulan/:tahun', auth_1.authenticate, authorize_1.authorizeAdmin, async (req, res) => {
    try {
        const { userId, bulan, tahun } = req.params;
        const { status, page = 1, pageSize = 50 } = req.query;
        const where = {
            user_id: userId,
            bulan,
            tahun: parseInt(tahun)
        };
        if (status) {
            where.status = status;
        }
        else {
            where.status = 'terkirim'; // Only show submitted reports
        }
        const offset = (parseInt(page) - 1) * parseInt(pageSize);
        const limit = parseInt(pageSize);
        const { rows, count } = await models_1.Laporan.findAndCountAll({
            where,
            include: [
                {
                    model: models_1.User,
                    as: 'user',
                    attributes: ['id', 'username', 'nama', 'nama_puskesmas', 'kecamatan']
                },
                {
                    model: models_1.SubKegiatan,
                    as: 'subKegiatan',
                    attributes: ['id_sub_kegiatan', 'kode_sub', 'kegiatan', 'indikator_kinerja'],
                    include: [{
                            model: models_1.Kegiatan,
                            as: 'kegiatanParent',
                            attributes: ['id_kegiatan', 'kode', 'kegiatan']
                        }]
                }
            ],
            offset,
            limit,
            order: [['id_kegiatan', 'ASC'], ['id_sub_kegiatan', 'ASC']]
        });
        res.json({
            data: rows,
            pagination: {
                total: count,
                page: parseInt(page),
                pageSize: parseInt(pageSize),
                totalPages: Math.ceil(count / parseInt(pageSize))
            }
        });
    }
    catch (error) {
        console.error('Admin laporan detail error:', error);
        res.status(500).json({ success: false, message: 'Gagal mengambil detail laporan' });
    }
});
// Return laporan back to puskesmas for correction
router.put('/laporan/:id/return', auth_1.authenticate, authorize_1.authorizeAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        const { catatan } = req.body;
        const laporan = await models_1.Laporan.findByPk(id);
        if (!laporan) {
            res.status(404).json({ message: 'Laporan tidak ditemukan' });
            return;
        }
        if (laporan.status !== 'terkirim') {
            res.status(400).json({ message: 'Hanya laporan dengan status "terkirim" yang dapat dikembalikan' });
            return;
        }
        await laporan.update({
            status: 'tersimpan',
            catatan: catatan || null
        });
        res.json({
            message: 'Laporan berhasil dikembalikan ke puskesmas',
            data: laporan
        });
    }
    catch (error) {
        console.error('Return laporan error:', error);
        res.status(500).json({ success: false, message: 'Gagal mengembalikan laporan' });
    }
});
// Bulk return laporan back to puskesmas
router.post('/laporan/bulk-return', auth_1.authenticate, authorize_1.authorizeAdmin, async (req, res) => {
    try {
        const { userId, bulan, tahun, catatan } = req.body;
        if (!userId || !bulan || !tahun) {
            res.status(400).json({ message: 'userId, bulan, dan tahun wajib diisi' });
            return;
        }
        const [updated] = await models_1.Laporan.update({
            status: 'tersimpan',
            catatan: catatan || null
        }, {
            where: {
                user_id: userId,
                bulan,
                tahun: parseInt(tahun),
                status: 'terkirim'
            }
        });
        res.json({
            message: `${updated} laporan berhasil dikembalikan ke puskesmas`,
            updated
        });
    }
    catch (error) {
        console.error('Bulk return error:', error);
        res.status(500).json({ success: false, message: 'Gagal mengembalikan laporan' });
    }
});
// Get dashboard statistics for admin (CACHED)
router.get('/dashboard/stats', auth_1.authenticate, authorize_1.authorizeAdmin, async (req, res) => {
    try {
        const { tahun, bulan } = req.query;
        const currentYear = tahun ? parseInt(tahun) : new Date().getFullYear();
        const currentMonth = bulan || undefined;
        // Use cached dashboard service
        const stats = await (0, dashboardService_1.getDashboardStats)(currentYear, currentMonth);
        res.status(200).json({
            message: 'Dashboard statistics retrieved successfully',
            data: stats,
            tahun: currentYear,
            bulan: currentMonth
        });
    }
    catch (error) {
        console.error('Dashboard stats error:', error);
        res.status(500).json({ success: false, message: 'Gagal mengambil statistik dashboard' });
    }
});
// Get budget realization per month for dashboard (with month filter) - CACHED
router.get('/dashboard/budget-monthly', auth_1.authenticate, authorize_1.authorizeAdmin, async (req, res) => {
    try {
        const { tahun, bulan } = req.query;
        const currentYear = tahun ? parseInt(tahun) : new Date().getFullYear();
        const currentMonth = bulan;
        if (!currentMonth) {
            res.status(400).json({ message: 'Bulan parameter is required' });
            return;
        }
        // Use cached dashboard service
        const result = await (0, dashboardService_1.getBudgetMonthly)(currentYear, currentMonth);
        res.status(200).json({
            message: 'Monthly budget data retrieved successfully',
            data: result.data,
            summary: result.summary,
            tahun: currentYear,
            bulan: currentMonth
        });
    }
    catch (error) {
        console.error('Monthly budget error:', error);
        res.status(500).json({ success: false, message: 'Gagal mengambil data anggaran bulanan' });
    }
});
// Get top 10 budget absorption for dashboard - CACHED
router.get('/dashboard/top-10-absorption', auth_1.authenticate, authorize_1.authorizeAdmin, async (req, res) => {
    try {
        const { tahun, bulan } = req.query;
        const currentYear = tahun ? parseInt(tahun) : new Date().getFullYear();
        const currentMonth = bulan;
        if (!currentMonth) {
            res.status(400).json({ message: 'Bulan parameter is required' });
            return;
        }
        // Use cached dashboard service
        const processedData = await (0, dashboardService_1.getTop10Absorption)(currentYear, currentMonth);
        res.status(200).json({
            message: 'Top 10 absorption data retrieved successfully',
            data: processedData,
            tahun: currentYear,
            bulan: currentMonth
        });
    }
    catch (error) {
        console.error('Top 10 absorption error:', error);
        res.status(500).json({ success: false, message: 'Gagal mengambil data top 10 penyerapan' });
    }
});
// Get bottom 10 budget absorption for dashboard - CACHED
router.get('/dashboard/bottom-10-absorption', auth_1.authenticate, authorize_1.authorizeAdmin, async (req, res) => {
    try {
        const { tahun, bulan } = req.query;
        const currentYear = tahun ? parseInt(tahun) : new Date().getFullYear();
        const currentMonth = bulan;
        if (!currentMonth) {
            res.status(400).json({ message: 'Bulan parameter is required' });
            return;
        }
        // Use cached dashboard service
        const processedData = await (0, dashboardService_1.getBottom10Absorption)(currentYear, currentMonth);
        res.status(200).json({
            message: 'Bottom 10 absorption data retrieved successfully',
            data: processedData,
            tahun: currentYear,
            bulan: currentMonth
        });
    }
    catch (error) {
        console.error('Bottom 10 absorption error:', error);
        res.status(500).json({ success: false, message: 'Gagal mengambil data bottom 10 penyerapan' });
    }
});
// Get budget realization year to date for dashboard - CACHED
router.get('/dashboard/budget-ytd', auth_1.authenticate, authorize_1.authorizeAdmin, async (req, res) => {
    try {
        const { tahun } = req.query;
        const currentYear = tahun ? parseInt(tahun) : new Date().getFullYear();
        const processedData = await (0, dashboardService_1.getBudgetYTD)(currentYear);
        res.json({
            message: 'Data realisasi anggaran berhasil diambil',
            data: processedData,
            tahun: currentYear
        });
    }
    catch (error) {
        console.error('Budget YTD error:', error);
        res.status(500).json({ success: false, message: 'Gagal mengambil data anggaran' });
    }
});
// Get comprehensive chart data with filters for dashboard - CACHED
router.get('/dashboard/chart-data', auth_1.authenticate, authorize_1.authorizeAdmin, async (req, res) => {
    try {
        const { tahun, userId, sumberAnggaran, subKegiatan } = req.query;
        const yearParsed = parseInt(tahun) || new Date().getFullYear();
        const sumberAnggaranId = sumberAnggaran ? parseInt(sumberAnggaran) : undefined;
        const subKegiatanId = subKegiatan ? parseInt(subKegiatan) : undefined;
        const result = await (0, dashboardService_1.getChartData)(yearParsed, userId, sumberAnggaranId, subKegiatanId);
        res.json({
            success: true,
            ...result
        });
    }
    catch (error) {
        console.error('Error in chart data:', error);
        res.status(500).json({ success: false, message: 'Gagal mengambil data chart' });
    }
});
// Get puskesmas reporting details (who has reported and who hasn't) - CACHED
router.get('/dashboard/puskesmas-reporting-details', auth_1.authenticate, authorize_1.authorizeAdmin, async (req, res) => {
    try {
        const { tahun, bulan } = req.query;
        const currentYear = tahun ? parseInt(tahun) : new Date().getFullYear();
        const currentMonth = bulan || undefined;
        const data = await (0, dashboardService_1.getPuskesmasReportingDetails)(currentYear, currentMonth);
        res.status(200).json({
            message: 'Puskesmas reporting details retrieved successfully',
            data,
            tahun: currentYear,
            bulan: currentMonth
        });
    }
    catch (error) {
        console.error('Puskesmas reporting details error:', error);
        res.status(500).json({ success: false, message: 'Gagal mengambil detail puskesmas' });
    }
});
exports.default = router;
//# sourceMappingURL=admin.routes.js.map