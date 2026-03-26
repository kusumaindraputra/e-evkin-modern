import { Request, Response, NextFunction } from 'express';
import { Op } from 'sequelize';
import PuskesmasEditPermission from '../models/PuskesmasEditPermission';
import SubKegiatanTarget from '../models/SubKegiatanTarget';
import Laporan from '../models/Laporan';

export const checkEditPermission = (scope: string) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      // @ts-ignore populated by authenticate
      const user = req.user;
      if (!user || user.role !== 'puskesmas') {
        return next(); // Only gate puskesmas; admins or others bypass
      }

      // Determine period
      // Support both direct body fields and nested laporanArray (bulk-upsert)
      const firstItem = Array.isArray(req.body?.laporanArray) ? req.body.laporanArray[0] : null;
      const bulan: string | undefined = (req.body?.bulan as string) || (req.query?.bulan as string) || firstItem?.bulan;
      let tahunRaw = (req.body?.tahun as string) || (req.query?.tahun as string) || firstItem?.tahun;
      let tahun = tahunRaw ? parseInt(String(tahunRaw)) : undefined;

      // If tahun not provided, try to get it from the record being edited
      if (!tahun && req.params?.id) {
        // Try Laporan first (UUID ids), then SubKegiatanTarget (integer ids)
        const laporan = await Laporan.findByPk(req.params.id);
        if (laporan) {
          tahun = laporan.tahun;
        } else {
          const idNum = parseInt(req.params.id);
          if (!isNaN(idNum)) {
            const target = await SubKegiatanTarget.findByPk(idNum);
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
      // Match exact bulan first, then fall back to null bulan (wildcard = all months)
      const bulanCondition = bulan ? { [Op.or]: [bulan, null] } : null;

      // First try user-specific permission
      const userPermission = await PuskesmasEditPermission.findOne({
        where: {
          scope,
          bulan: bulanCondition,
          tahun,
          user_id: user.id,
        },
        order: [['bulan', 'DESC NULLS LAST'], ['created_at', 'DESC']],
      });

      // If user-specific exists, use it exclusively (even if restrictive)
      // Only fall back to global if no user-specific permission exists
      let permission = userPermission;
      if (!permission) {
        permission = await PuskesmasEditPermission.findOne({
          where: {
            scope,
            bulan: bulanCondition,
            tahun,
            user_id: null,
          },
          order: [['bulan', 'DESC NULLS LAST'], ['created_at', 'DESC']],
        });
      }

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
    } catch (error) {
      console.error('Edit permission check error:', error);
      return res.status(500).json({ success: false, message: 'Gagal memeriksa permission edit' });
    }
  };
};
