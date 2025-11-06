"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const models_1 = require("../models");
const auth_1 = require("../middleware/auth");
const sequelize_1 = require("sequelize");
const router = (0, express_1.Router)();
// Get all submitted laporan grouped by puskesmas for admin verification
router.get('/verifikasi', auth_1.authenticate, async (req, res) => {
    try {
        const userRole = req.user?.role;
        if (userRole !== 'admin') {
            res.status(403).json({ message: 'Access denied. Admin only.' });
            return;
        }
        const { puskesmas, bulan, tahun, page = 1, pageSize = 10 } = req.query;
        // Build where clause
        const where = {
            status: 'terkirim' // Only show submitted reports
        };
        if (bulan)
            where.bulan = bulan;
        if (tahun)
            where.tahun = parseInt(tahun);
        // User filter
        const userWhere = {};
        if (puskesmas) {
            userWhere.nama_puskesmas = { [sequelize_1.Op.like]: `%${puskesmas}%` };
        }
        const offset = (parseInt(page) - 1) * parseInt(pageSize);
        const limit = parseInt(pageSize);
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
        res.status(500).json({ message: 'Gagal mengambil data verifikasi', error: error.message });
    }
});
// Get laporan detail for specific puskesmas + bulan + tahun
router.get('/laporan/:userId/:bulan/:tahun', auth_1.authenticate, async (req, res) => {
    try {
        const userRole = req.user?.role;
        if (userRole !== 'admin') {
            res.status(403).json({ message: 'Access denied. Admin only.' });
            return;
        }
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
        res.status(500).json({ message: 'Gagal mengambil detail laporan', error: error.message });
    }
});
// Return laporan back to puskesmas for correction
router.put('/laporan/:id/return', auth_1.authenticate, async (req, res) => {
    try {
        const userRole = req.user?.role;
        if (userRole !== 'admin') {
            res.status(403).json({ message: 'Access denied. Admin only.' });
            return;
        }
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
        res.status(500).json({ message: 'Gagal mengembalikan laporan', error: error.message });
    }
});
// Bulk return laporan back to puskesmas
router.post('/laporan/bulk-return', auth_1.authenticate, async (req, res) => {
    try {
        const userRole = req.user?.role;
        if (userRole !== 'admin') {
            res.status(403).json({ message: 'Access denied. Admin only.' });
            return;
        }
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
        res.status(500).json({ message: 'Gagal mengembalikan laporan', error: error.message });
    }
});
// Get dashboard statistics for admin
router.get('/dashboard/stats', auth_1.authenticate, async (req, res) => {
    try {
        const userRole = req.user?.role;
        if (userRole !== 'admin') {
            res.status(403).json({ message: 'Access denied. Admin only.' });
            return;
        }
        const { tahun, bulan } = req.query;
        const currentYear = tahun ? parseInt(tahun) : new Date().getFullYear();
        const currentMonth = bulan || undefined;
        // Build where clause
        const where = { tahun: currentYear };
        if (currentMonth) {
            where.bulan = currentMonth;
        }
        // Get total laporan count
        const totalLaporan = await models_1.Laporan.count({ where });
        // Get status counts
        const statusCounts = await models_1.Laporan.findAll({
            attributes: [
                'status',
                [models_1.Laporan.sequelize.fn('COUNT', models_1.Laporan.sequelize.col('id')), 'count']
            ],
            where,
            group: ['status'],
            raw: true
        });
        const tersimpan = statusCounts.find(s => s.status === 'tersimpan')?.count || 0;
        const terkirim = statusCounts.find(s => s.status === 'terkirim')?.count || 0;
        // Get total puskesmas
        const totalPuskesmas = await models_1.User.count({
            where: { role: 'puskesmas' }
        });
        // Get puskesmas yang sudah mengirim laporan
        const puskesmasReporting = await models_1.Laporan.count({
            where: { ...where, status: 'terkirim' },
            distinct: true,
            col: 'user_id'
        });
        res.status(200).json({
            message: 'Dashboard statistics retrieved successfully',
            data: {
                totalLaporan,
                tersimpan,
                terkirim,
                totalPuskesmas,
                puskesmasReporting,
                persentasePuskesmasReporting: totalPuskesmas > 0 ? Math.round((puskesmasReporting / totalPuskesmas) * 100 * 100) / 100 : 0
            },
            tahun: currentYear,
            bulan: currentMonth
        });
    }
    catch (error) {
        console.error('Dashboard stats error:', error);
        res.status(500).json({ message: 'Gagal mengambil statistik dashboard', error: error.message });
    }
});
// Get budget realization per month for dashboard (with month filter)
router.get('/dashboard/budget-monthly', auth_1.authenticate, async (req, res) => {
    try {
        const userRole = req.user?.role;
        if (userRole !== 'admin') {
            res.status(403).json({ message: 'Access denied. Admin only.' });
            return;
        }
        const { tahun, bulan } = req.query;
        const currentYear = tahun ? parseInt(tahun) : new Date().getFullYear();
        const currentMonth = bulan;
        if (!currentMonth) {
            res.status(400).json({ message: 'Bulan parameter is required' });
            return;
        }
        // Query untuk mendapatkan data per sub kegiatan untuk bulan tertentu
        const query = `
      SELECT 
        l.id_sub_kegiatan,
        sk.kode_sub,
        sk.kegiatan as sub_kegiatan_nama,
        k.kode as kegiatan_kode,
        k.kegiatan as kegiatan_nama,
        SUM(l.target_rp) as target_rp,
        SUM(l.realisasi_rp) as realisasi_rp
      FROM laporan l
      INNER JOIN sub_kegiatan sk ON l.id_sub_kegiatan = sk.id_sub_kegiatan
      INNER JOIN kegiatan k ON sk.id_kegiatan = k.id_kegiatan
      WHERE l.tahun = :tahun 
        AND l.bulan = :bulan
        AND l.status = 'terkirim'
      GROUP BY l.id_sub_kegiatan, sk.kode_sub, sk.kegiatan, k.kode, k.kegiatan
      ORDER BY sk.kode_sub ASC
    `;
        const monthlyData = await models_1.Laporan.sequelize.query(query, {
            replacements: { tahun: currentYear, bulan: currentMonth },
            type: sequelize_1.QueryTypes.SELECT
        });
        // Process data
        const processedData = monthlyData.map((item) => {
            const targetRp = parseFloat(item.target_rp) || 0;
            const realisasiRp = parseFloat(item.realisasi_rp) || 0;
            const persentase = targetRp > 0 ? (realisasiRp / targetRp) * 100 : 0;
            return {
                sub_kegiatan: `${item.kode_sub} - ${item.sub_kegiatan_nama}`,
                kegiatan: `${item.kegiatan_kode} - ${item.kegiatan_nama}`,
                target_rp: targetRp,
                realisasi_rp: realisasiRp,
                persentase: Math.round(persentase * 100) / 100
            };
        });
        // Calculate totals
        const totalTarget = processedData.reduce((sum, item) => sum + item.target_rp, 0);
        const totalRealisasi = processedData.reduce((sum, item) => sum + item.realisasi_rp, 0);
        const totalPersentase = totalTarget > 0 ? (totalRealisasi / totalTarget) * 100 : 0;
        res.status(200).json({
            message: 'Monthly budget data retrieved successfully',
            data: processedData,
            summary: {
                totalTarget,
                totalRealisasi,
                totalPersentase: Math.round(totalPersentase * 100) / 100
            },
            tahun: currentYear,
            bulan: currentMonth
        });
    }
    catch (error) {
        console.error('Monthly budget error:', error);
        res.status(500).json({ message: 'Gagal mengambil data anggaran bulanan', error: error.message });
    }
});
// Get budget realization year to date for dashboard
router.get('/dashboard/budget-ytd', auth_1.authenticate, async (req, res) => {
    try {
        const userRole = req.user?.role;
        if (userRole !== 'admin') {
            res.status(403).json({ message: 'Access denied. Admin only.' });
            return;
        }
        const { tahun } = req.query;
        const currentYear = tahun ? parseInt(tahun) : new Date().getFullYear();
        // Query untuk mendapatkan total target_rp dan realisasi_rp per bulan
        const budgetData = await models_1.Laporan.findAll({
            attributes: [
                'bulan',
                [models_1.Laporan.sequelize.fn('SUM', models_1.Laporan.sequelize.col('target_rp')), 'target_rp'],
                [models_1.Laporan.sequelize.fn('SUM', models_1.Laporan.sequelize.col('realisasi_rp')), 'realisasi_rp']
            ],
            where: {
                tahun: currentYear,
                status: 'terkirim' // Only count submitted reports
            },
            group: ['bulan'],
            order: [
                [models_1.Laporan.sequelize.literal(`
          CASE bulan 
            WHEN 'Januari' THEN 1 
            WHEN 'Februari' THEN 2 
            WHEN 'Maret' THEN 3 
            WHEN 'April' THEN 4 
            WHEN 'Mei' THEN 5 
            WHEN 'Juni' THEN 6 
            WHEN 'Juli' THEN 7 
            WHEN 'Agustus' THEN 8 
            WHEN 'September' THEN 9 
            WHEN 'Oktober' THEN 10 
            WHEN 'November' THEN 11 
            WHEN 'Desember' THEN 12 
          END
        `), 'ASC']
            ],
            raw: true
        });
        // Calculate percentage for each month
        const processedData = budgetData.map((item) => {
            const targetRp = parseFloat(item.target_rp) || 0;
            const realisasiRp = parseFloat(item.realisasi_rp) || 0;
            const persentase = targetRp > 0 ? (realisasiRp / targetRp) * 100 : 0;
            return {
                bulan: item.bulan,
                target_rp: targetRp,
                realisasi_rp: realisasiRp,
                persentase: Math.round(persentase * 100) / 100
            };
        });
        res.json({
            message: 'Data realisasi anggaran berhasil diambil',
            data: processedData,
            tahun: currentYear
        });
    }
    catch (error) {
        console.error('Budget YTD error:', error);
        res.status(500).json({ message: 'Gagal mengambil data anggaran', error: error.message });
    }
});
exports.default = router;
//# sourceMappingURL=admin.routes.js.map