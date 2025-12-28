"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.checkEditPermission = void 0;
const PuskesmasEditPermission_1 = __importDefault(require("../models/PuskesmasEditPermission"));
const sequelize_1 = require("sequelize");
const checkEditPermission = (scope) => {
    return async (req, res, next) => {
        try {
            // @ts-ignore populated by authenticate
            const user = req.user;
            if (!user || user.role !== 'puskesmas') {
                return next(); // Only gate puskesmas; admins or others bypass
            }
            // Determine period
            const bulan = req.body?.bulan || req.query?.bulan;
            const tahunRaw = req.body?.tahun || req.query?.tahun;
            const tahun = tahunRaw ? parseInt(tahunRaw) : undefined;
            if (!tahun) {
                return res.status(400).json({ success: false, message: 'Tahun harus disertakan untuk validasi permission' });
            }
            // Get latest permission config for user/scope/period
            const permission = await PuskesmasEditPermission_1.default.findOne({
                where: {
                    scope,
                    bulan: bulan || null,
                    tahun,
                    [sequelize_1.Op.or]: [{ user_id: user.id }, { user_id: null }],
                },
                order: [['created_at', 'DESC']],
            });
            if (!permission) {
                return res.status(403).json({ success: false, message: 'Pengeditan belum dibuka oleh admin untuk periode ini' });
            }
            if (permission.enabled) {
                return next();
            }
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