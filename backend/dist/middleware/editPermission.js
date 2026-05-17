"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.checkEditPermission = void 0;
const sequelize_1 = require("sequelize");
const PuskesmasEditPermission_1 = __importDefault(require("../models/PuskesmasEditPermission"));
const SubKegiatanTarget_1 = __importDefault(require("../models/SubKegiatanTarget"));
const Laporan_1 = __importDefault(require("../models/Laporan"));
const checkEditPermission = (scope) => {
    return async (req, res, next) => {
        try {
            // @ts-ignore populated by authenticate
            const user = req.user;
            if (!user || user.role !== 'puskesmas') {
                return next(); // Only gate puskesmas; admins or others bypass
            }
            // Determine period
            // Support both direct body fields and nested laporanArray (bulk-upsert)
            const firstItem = Array.isArray(req.body?.laporanArray) ? req.body.laporanArray[0] : null;
            const bulan = req.body?.bulan || req.query?.bulan || firstItem?.bulan;
            let tahunRaw = req.body?.tahun || req.query?.tahun || firstItem?.tahun;
            let tahun = tahunRaw ? parseInt(String(tahunRaw)) : undefined;
            // If tahun not provided, try to get it from the record being edited
            if (!tahun && req.params?.id) {
                // Try Laporan first (UUID ids), then SubKegiatanTarget (integer ids)
                const laporan = await Laporan_1.default.findByPk(req.params.id);
                if (laporan) {
                    tahun = laporan.tahun;
                }
                else {
                    const idNum = parseInt(req.params.id);
                    if (!isNaN(idNum)) {
                        const target = await SubKegiatanTarget_1.default.findByPk(idNum);
                        if (target) {
                            tahun = target.tahun;
                        }
                    }
                }
            }
            if (!tahun) {
                return res.status(400).json({ success: false, message: 'Tahun harus disertakan untuk validasi permission' });
            }
            // Get permission config: user-specific takes absolute priority over global
            // Single query fetches both user-specific and global, ordered so user-specific comes first
            const whereClause = {
                scope,
                tahun,
                user_id: { [sequelize_1.Op.or]: [user.id, null] },
            };
            if (bulan) {
                whereClause.bulan = { [sequelize_1.Op.or]: [bulan, null] };
            }
            const permissions = await PuskesmasEditPermission_1.default.findAll({
                where: whereClause,
                order: [
                    // User-specific first (non-null user_id), then global (null)
                    [PuskesmasEditPermission_1.default.sequelize.literal('CASE WHEN user_id IS NOT NULL THEN 0 ELSE 1 END'), 'ASC'],
                    ['bulan', 'DESC NULLS LAST'],
                    ['created_at', 'DESC'],
                ],
                limit: 2, // At most one user-specific + one global
            });
            // User-specific takes priority; fall back to global
            const userPermission = permissions.find(p => p.user_id !== null);
            const permission = userPermission || permissions.find(p => p.user_id === null) || null;
            if (!permission) {
                return res.status(403).json({ success: false, message: 'Pengeditan belum dibuka oleh admin untuk periode ini' });
            }
            // Check enabled flag
            if (permission.enabled) {
                return next();
            }
            // Check time window
            const now = new Date();
            const start = permission.start_at ? new Date(permission.start_at) : null;
            const end = permission.end_at ? new Date(permission.end_at) : null;
            if (start && now < start) {
                return res.status(403).json({ success: false, message: 'Pengeditan belum dimulai' });
            }
            if (end && now > end) {
                return res.status(403).json({ success: false, message: 'Pengeditan sudah ditutup' });
            }
            // If no start/end and not enabled, deny
            if (!start && !end) {
                return res.status(403).json({ success: false, message: 'Pengeditan tidak diizinkan saat ini' });
            }
            return next();
        }
        catch (error) {
            console.error('Edit permission check error:', error);
            return res.status(500).json({ success: false, message: 'Gagal memeriksa permission edit' });
        }
    };
};
exports.checkEditPermission = checkEditPermission;
//# sourceMappingURL=editPermission.js.map