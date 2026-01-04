import { Request, Response, NextFunction } from 'express';
import PuskesmasEditPermission from '../models/PuskesmasEditPermission';
import SubKegiatanTarget from '../models/SubKegiatanTarget';

export const checkEditPermission = (scope: string) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      // @ts-ignore populated by authenticate
      const user = req.user;
      if (!user || user.role !== 'puskesmas') {
        return next(); // Only gate puskesmas; admins or others bypass
      }

      // Determine period
      const bulan: string | undefined = (req.body?.bulan as string) || (req.query?.bulan as string);
      let tahunRaw = (req.body?.tahun as string) || (req.query?.tahun as string);
      let tahun = tahunRaw ? parseInt(tahunRaw) : undefined;

      // If tahun not provided, try to get it from the target being edited (for PUT /:id/kinerja)
      if (!tahun && req.params?.id) {
        const target = await SubKegiatanTarget.findByPk(req.params.id);
        if (target) {
          tahun = target.tahun;
        }
      }

      if (!tahun) {
        return res.status(400).json({ success: false, message: 'Tahun harus disertakan untuk validasi permission' });
      }

      // Get permission config: prefer user-specific over global, then latest
      // First try user-specific permission
      let permission = await PuskesmasEditPermission.findOne({
        where: {
          scope,
          bulan: bulan || null,
          tahun,
          user_id: user.id,
        },
        order: [['created_at', 'DESC']],
      });

      // If no user-specific, fall back to global permission (user_id is null)
      if (!permission) {
        permission = await PuskesmasEditPermission.findOne({
          where: {
            scope,
            bulan: bulan || null,
            tahun,
            user_id: null,
          },
          order: [['created_at', 'DESC']],
        });
      }

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
    } catch (error) {
      console.error('Edit permission check error:', error);
      return res.status(500).json({ success: false, message: 'Gagal memeriksa permission edit' });
    }
  };
};
