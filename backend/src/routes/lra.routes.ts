// backend/src/routes/lra.routes.ts
import { Router, Request, Response } from 'express';
import multer from 'multer';
import { authenticate } from '../middleware/auth';
import { authorizeAdmin } from '../middleware/authorize';
import { parseLraExcel, getLraRealisasiMap } from '../services/lraParserService';
import { LraUploadBatch, LraRealisasi, User } from '../models';

const router = Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 20 * 1024 * 1024 }, // 20MB
  fileFilter: (_req, file, cb) => {
    if (file.mimetype === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
        file.originalname.endsWith('.xlsx')) {
      cb(null, true);
    } else {
      cb(new Error('Hanya file .xlsx yang diizinkan'));
    }
  },
});

/**
 * POST /api/lra/preview
 * Parse LRA file and return preview without saving to DB
 */
router.post('/preview', authenticate, authorizeAdmin, upload.single('file'), async (req: Request, res: Response): Promise<void> => {
  if (!req.file) {
    res.status(400).json({ error: 'File tidak ditemukan' });
    return;
  }

  const bulanOverride = req.body.bulan || undefined;
  const tahunOverride = req.body.tahun ? parseInt(req.body.tahun) : undefined;

  const result = await parseLraExcel(req.file.buffer, req.file.originalname, bulanOverride, tahunOverride);

  if (!result.bulan || !result.tahun) {
    res.status(400).json({
      error: 'Bulan/tahun tidak terdeteksi dari nama file. Silakan isi manual.',
      bulanDetectedFromFilename: false,
    });
    return;
  }

  res.json({
    bulan: result.bulan,
    tahun: result.tahun,
    bulanDetectedFromFilename: result.bulanDetectedFromFilename,
    matchedCount: result.rows.length,
    unmatchedPuskesmas: result.unmatchedPuskesmas,
    unmatchedSubKegiatan: result.unmatchedSubKegiatan,
    unmatchedSumber: result.unmatchedSumber,
  });
});

/**
 * POST /api/lra/confirm
 * Re-parse and save to DB
 */
router.post('/confirm', authenticate, authorizeAdmin, upload.single('file'), async (req: Request, res: Response): Promise<void> => {
  if (!req.file) {
    res.status(400).json({ error: 'File tidak ditemukan' });
    return;
  }

  const bulanOverride = req.body.bulan || undefined;
  const tahunOverride = req.body.tahun ? parseInt(req.body.tahun) : undefined;

  const result = await parseLraExcel(req.file.buffer, req.file.originalname, bulanOverride, tahunOverride);

  if (!result.bulan || !result.tahun) {
    res.status(400).json({ error: 'Bulan/tahun wajib diisi' });
    return;
  }

  if (result.rows.length === 0) {
    res.status(400).json({ error: 'Tidak ada data yang berhasil diparse dari file ini' });
    return;
  }

  const adminId = (req as any).user!.id;

  // Create batch
  const batch = await LraUploadBatch.create({
    filename: req.file.originalname,
    bulan: result.bulan,
    tahun: result.tahun,
    uploaded_by: adminId,
    row_count: result.rows.length,
  });

  // Insert all rows
  await LraRealisasi.bulkCreate(
    result.rows.map(r => ({
      batch_id: batch.id,
      user_id: r.userId,
      id_sub_kegiatan: r.idSubKegiatan,
      id_sumber_anggaran: r.idSumberAnggaran,
      bulan: r.bulan,
      tahun: r.tahun,
      realisasi_rp: r.realisasiRp,
    })),
    { validate: true }
  );

  res.json({
    success: true,
    batchId: batch.id,
    rowCount: result.rows.length,
    bulan: result.bulan,
    tahun: result.tahun,
    unmatchedPuskesmas: result.unmatchedPuskesmas,
    unmatchedSubKegiatan: result.unmatchedSubKegiatan,
    unmatchedSumber: result.unmatchedSumber,
  });
});

/**
 * GET /api/lra/batches
 * List all upload batches
 */
router.get('/batches', authenticate, authorizeAdmin, async (_req: Request, res: Response): Promise<void> => {
  const batches = await LraUploadBatch.findAll({
    include: [{ model: User, as: 'uploader', attributes: ['nama'] }],
    order: [['created_at', 'DESC']],
  });
  res.json(batches);
});

/**
 * GET /api/lra/realisasi?bulan=Januari&tahun=2026
 * Get latest LRA realisasi map for the current puskesmas user
 */
router.get('/realisasi', authenticate, async (req: Request, res: Response): Promise<void> => {
  const { bulan, tahun } = req.query as { bulan: string; tahun: string };
  if (!bulan || !tahun) {
    res.status(400).json({ error: 'bulan dan tahun wajib diisi' });
    return;
  }

  const userId = (req as any).user!.id;
  const lraMap = await getLraRealisasiMap(userId, bulan, parseInt(tahun));

  // Convert map to object for JSON response
  const result: Record<string, number> = {};
  lraMap.forEach((v, k) => { result[k] = v; });

  res.json({ realisasi: result, available: lraMap.size > 0 });
});

export default router;
