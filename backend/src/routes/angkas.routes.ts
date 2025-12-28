import { Router, Request, Response } from 'express';
import multer from 'multer';
import { AnggaranKas, User, SubKegiatan, SumberAnggaran, SubKegiatanTarget } from '../models';
import { Op } from 'sequelize';
import { authenticate } from '../middleware/auth';
import { authorizeAdmin } from '../middleware/authorize';
import { parseAngkasPdf, findBestMatch, findPuskesmasUser, PuskesmasAngkas, AngkasRow } from '../services/angkasParserService';

const router = Router();

// Configure multer for memory storage
const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB limit for large PDFs
  fileFilter: (_req, file, cb) => {
    if (file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('Only PDF files are allowed'));
    }
  },
});

interface UploadResult {
  success: number;
  inserted: number;
  updated: number;  // New version created (value changed)
  skipped: number;  // Same value as existing or zero
  failed: number;
  unmatchedPuskesmas: string[];
  unmatchedSumberAnggaran: string[];
  createdSumberAnggaran: number;
  detectedSumberAnggaran: Array<{ kode: string; nama: string }>;
  errors: Array<{
    puskesmas: string;
    kodeRekening: string;
    uraian: string;
    error: string;
  }>;
  successList: Array<{
    type: 'inserted' | 'updated';
    puskesmas: string;
    kodeRekening: string;
    uraian: string;
    sumberAnggaran: string;
    tahun: number;
    bulan: number;
    oldValue?: number;
    newValue: number;
  }>;
}

/**
 * Mapping kode sumber anggaran dari PDF ke nama sumber anggaran di database
 * Berdasarkan struktur kode rekening pendek (3 karakter)
 */
const SUMBER_ANGGARAN_MAPPING: Record<string, string[]> = {
  // PAD - Pendapatan Asli Daerah biasanya terkait BLUD
  '4.1': ['BLUD', 'PAD', 'Pendapatan Asli'],
  // Transfer - Dana dari pemerintah pusat/provinsi
  '4.2': ['DAK', 'APBD', 'Transfer', 'Dana Alokasi'],
  // JKN / Kapitasi
  '4.3': ['JKN', 'Kapitasi', 'BPJS'],
};

/**
 * Find or create sumber anggaran based on PDF code and name
 */
async function findOrCreateSumberAnggaran(
  kode: string | null, 
  nama: string | null
): Promise<{ id: number; nama: string } | null> {
  if (!kode && !nama) return null;

  // Get all existing sumber anggaran
  const existingSumber = await SumberAnggaran.findAll();
  
  // Try to match by name first (fuzzy)
  if (nama) {
    const normalizedNama = nama.toLowerCase();
    for (const sumber of existingSumber) {
      const sumberNama = sumber.sumber.toLowerCase();
      if (sumberNama.includes(normalizedNama) || normalizedNama.includes(sumberNama)) {
        return { id: sumber.id_sumber, nama: sumber.sumber };
      }
    }
  }

  // Try to match by kode mapping
  if (kode && SUMBER_ANGGARAN_MAPPING[kode]) {
    const keywords = SUMBER_ANGGARAN_MAPPING[kode];
    for (const sumber of existingSumber) {
      const sumberNama = sumber.sumber.toLowerCase();
      if (keywords.some(kw => sumberNama.includes(kw.toLowerCase()))) {
        return { id: sumber.id_sumber, nama: sumber.sumber };
      }
    }
  }

  // If not found and we have a name, create new sumber anggaran
  if (nama) {
    const newSumber = await SumberAnggaran.create({ sumber: nama });
    console.log(`✅ Created new sumber anggaran: ${nama}`);
    return { id: newSumber.id_sumber, nama: newSumber.sumber };
  }

  return null;
}

/**
 * POST /api/angkas/upload
 * Upload Angkas PDF file and parse monthly budget data
 * Sumber anggaran is detected from PDF (kode rekening pendek like "4.1")
 * Uses INSERT for history tracking (not upsert) - skips if value is same as latest record
 */
router.post('/upload', authenticate, authorizeAdmin, upload.single('file'), async (req: Request, res: Response): Promise<void> => {
  try {
    const adminId = req.user!.id;
    const { tahun: tahunOverride } = req.body;

    if (!req.file) {
      res.status(400).json({ error: 'No file uploaded' });
      return;
    }

    // Parse PDF
    const parsed = await parseAngkasPdf(req.file.buffer);
    const tahun = tahunOverride ? parseInt(tahunOverride) : parsed.tahun;

    console.log(`📄 Parsed PDF: ${parsed.puskesmasList.length} puskesmas found`);
    console.log(`📋 Detected sumber anggaran: ${parsed.detectedSumberAnggaran.map(s => `${s.kode} - ${s.nama}`).join(', ')}`);

    // Get all puskesmas users
    const puskesmasUsers = await User.findAll({
      where: { role: 'puskesmas' },
      attributes: ['id', 'nama', 'username'],
    });

    // Get all sub kegiatan for matching
    const subKegiatanList = await SubKegiatan.findAll({
      attributes: ['id_sub_kegiatan', 'kegiatan', 'kode_sub'],
    });

    // Cache sumber anggaran mappings
    const sumberAnggaranCache = new Map<string, { id: number; nama: string } | null>();
    let createdSumberAnggaran = 0;

    const result: UploadResult = {
      success: 0,
      inserted: 0,
      updated: 0,
      skipped: 0,
      failed: 0,
      unmatchedPuskesmas: [],
      unmatchedSumberAnggaran: [],
      createdSumberAnggaran: 0,
      detectedSumberAnggaran: parsed.detectedSumberAnggaran,
      errors: [],
      successList: [],
    };

    // Process each puskesmas
    for (const puskesmasData of parsed.puskesmasList) {
      const userId = findPuskesmasUser(
        puskesmasData.namaPuskesmas,
        puskesmasUsers.map(u => ({ id: u.id, nama: u.nama, username: u.username }))
      );

      if (!userId) {
        result.unmatchedPuskesmas.push(puskesmasData.namaPuskesmas);
        continue;
      }

      // Process each row
      for (const row of puskesmasData.rows) {
        // Get sumber anggaran from cache or find/create
        const cacheKey = `${row.sumberAnggaranKode || ''}-${row.sumberAnggaranNama || ''}`;
        let sumberAnggaran = sumberAnggaranCache.get(cacheKey);
        
        if (sumberAnggaran === undefined) {
          sumberAnggaran = await findOrCreateSumberAnggaran(
            row.sumberAnggaranKode,
            row.sumberAnggaranNama
          );
          sumberAnggaranCache.set(cacheKey, sumberAnggaran);
          
          if (sumberAnggaran && !result.detectedSumberAnggaran.some(s => s.kode === row.sumberAnggaranKode)) {
            createdSumberAnggaran++;
          }
        }

        if (!sumberAnggaran) {
          // Track unmatched sumber anggaran
          const unmatchedKey = `${row.sumberAnggaranKode || 'unknown'}: ${row.sumberAnggaranNama || 'unknown'}`;
          if (!result.unmatchedSumberAnggaran.includes(unmatchedKey)) {
            result.unmatchedSumberAnggaran.push(unmatchedKey);
          }
          result.skipped++;
          continue;
        }

        // Try to match to sub_kegiatan
        const idSubKegiatan = findBestMatch(
          row.uraian,
          subKegiatanList.map(sk => ({ id: sk.id_sub_kegiatan, nama: sk.kegiatan }))
        );

        // Process each month
        for (let bulan = 1; bulan <= 12; bulan++) {
          const nilai = row.bulanan[bulan - 1] || 0;
          
          // Skip zero values
          if (nilai === 0) {
            result.skipped++;
            continue;
          }

          try {
            // Check if record already exists (get latest for comparison)
            const existingRecord = await AnggaranKas.findOne({
              where: {
                user_id: userId,
                kode_rekening: row.kodeRekening,
                id_sumber_anggaran: sumberAnggaran.id,
                tahun,
                bulan,
              },
              order: [['created_at', 'DESC']], // Get the latest record
            });

            if (existingRecord) {
              // Compare values - skip if same
              const existingNilai = Number(existingRecord.nilai);
              const newNilai = Number(nilai);

              if (existingNilai === newNilai) {
                result.skipped++;
                continue; // Skip - no change needed
              }

              // INSERT new record for history tracking (value changed)
              await AnggaranKas.create({
                user_id: userId,
                id_sub_kegiatan: idSubKegiatan,
                id_sumber_anggaran: sumberAnggaran.id,
                kode_rekening: row.kodeRekening,
                uraian: row.uraian,
                tahun,
                bulan,
                nilai: newNilai,
                created_by: adminId,
              });

              result.updated++;
              result.success++;

              result.successList.push({
                type: 'updated',
                puskesmas: puskesmasData.namaPuskesmas,
                kodeRekening: row.kodeRekening,
                uraian: row.uraian,
                sumberAnggaran: sumberAnggaran.nama,
                tahun,
                bulan,
                oldValue: existingNilai,
                newValue: newNilai,
              });
            } else {
              // INSERT new record (first entry)
              await AnggaranKas.create({
                user_id: userId,
                id_sub_kegiatan: idSubKegiatan,
                id_sumber_anggaran: sumberAnggaran.id,
                kode_rekening: row.kodeRekening,
                uraian: row.uraian,
                tahun,
                bulan,
                nilai,
                created_by: adminId,
              });

              result.inserted++;
              result.success++;

              result.successList.push({
                type: 'inserted',
                puskesmas: puskesmasData.namaPuskesmas,
                kodeRekening: row.kodeRekening,
                uraian: row.uraian,
                sumberAnggaran: sumberAnggaran.nama,
                tahun,
                bulan,
                newValue: nilai,
              });
            }
          } catch (error: any) {
            result.failed++;
            // Log detailed error for debugging
            const errorDetails = error.errors ? error.errors.map((e: any) => `${e.path}: ${e.message}`).join(', ') : error.message;
            console.error(`❌ Insert error for ${puskesmasData.namaPuskesmas} - ${row.uraian}:`, errorDetails);
            result.errors.push({
              puskesmas: puskesmasData.namaPuskesmas,
              kodeRekening: row.kodeRekening,
              uraian: row.uraian,
              error: errorDetails,
            });
          }
        }
      }
    }

    result.createdSumberAnggaran = createdSumberAnggaran;

    res.json({
      message: `Upload completed. ${result.success} records processed (${result.inserted} new, ${result.updated} updated, ${result.skipped} skipped).`,
      result,
      parsedPuskesmas: parsed.puskesmasList.length,
      tahun,
    });
  } catch (error: any) {
    console.error('Error uploading angkas PDF:', error);
    res.status(500).json({ error: 'Failed to process PDF file', details: error.message });
  }
});

/**
 * GET /api/angkas
 * Get all sub kegiatan + sumber anggaran + puskesmas combinations from target anggaran
 * with monthly angkas values (zeros if not uploaded yet)
 * This allows tracking which combinations haven't been updated with angkas data
 */
router.get('/', authenticate, async (req: Request, res: Response) => {
  try {
    const { tahun, user_id, id_sub_kegiatan, id_sumber_anggaran } = req.query;
    const currentUser = req.user!;

    const targetTahun = tahun ? parseInt(tahun as string) : new Date().getFullYear();

    // Build where clause for SubKegiatanTarget
    const targetWhere: any = {
      tahun: targetTahun,
      bulan: null, // Only yearly targets
    };

    // User filter - puskesmas can only see their own data
    if (currentUser.role === 'puskesmas') {
      targetWhere.user_id = currentUser.id;
    } else if (user_id) {
      targetWhere.user_id = user_id;
    }

    // Optional filters
    if (id_sub_kegiatan) {
      targetWhere.id_sub_kegiatan = parseInt(id_sub_kegiatan as string);
    }

    if (id_sumber_anggaran) {
      targetWhere.id_sumber_anggaran = parseInt(id_sumber_anggaran as string);
    }

    // Step 1: Get all unique combinations from SubKegiatanTarget (latest per combination)
    const allTargets = await SubKegiatanTarget.findAll({
      where: targetWhere,
      include: [
        { model: User, as: 'puskesmas', attributes: ['id', 'nama', 'username'] },
        { model: SubKegiatan, as: 'subKegiatan', attributes: ['id_sub_kegiatan', 'kegiatan', 'kode_sub'] },
        { model: SumberAnggaran, as: 'sumberAnggaran', attributes: ['id_sumber', 'sumber'] },
      ],
      order: [['created_at', 'DESC']],
    });

    // Get only latest target per combination (user_id + id_sub_kegiatan + id_sumber_anggaran)
    const latestTargets = new Map<string, typeof allTargets[0]>();
    for (const target of allTargets) {
      const key = `${target.user_id}-${target.id_sub_kegiatan}-${target.id_sumber_anggaran}`;
      if (!latestTargets.has(key)) {
        latestTargets.set(key, target);
      }
    }

    // Step 2: Build where clause for AnggaranKas
    const angkasWhere: any = {
      tahun: targetTahun,
      id_sub_kegiatan: { [Op.ne]: null }, // Only matched records
    };

    if (currentUser.role === 'puskesmas') {
      angkasWhere.user_id = currentUser.id;
    } else if (user_id) {
      angkasWhere.user_id = user_id;
    }

    if (id_sub_kegiatan) {
      angkasWhere.id_sub_kegiatan = parseInt(id_sub_kegiatan as string);
    }

    if (id_sumber_anggaran) {
      angkasWhere.id_sumber_anggaran = parseInt(id_sumber_anggaran as string);
    }

    // Get all angkas data
    const allAngkas = await AnggaranKas.findAll({
      where: angkasWhere,
      order: [['created_at', 'DESC']],
    });

    // Get latest angkas per combination (user_id + id_sub_kegiatan + id_sumber_anggaran + bulan)
    const latestAngkas = new Map<string, typeof allAngkas[0]>();
    for (const angkas of allAngkas) {
      const key = `${angkas.user_id}-${angkas.id_sub_kegiatan}-${angkas.id_sumber_anggaran}-${angkas.bulan}`;
      if (!latestAngkas.has(key)) {
        latestAngkas.set(key, angkas);
      }
    }

    // Step 3: Build result - all targets with angkas values (or zeros)
    const result: Array<{
      user_id: string;
      puskesmas: any;
      id_sub_kegiatan: number;
      subKegiatan: any;
      id_sumber_anggaran: number;
      sumberAnggaran: any;
      tahun: number;
      target_rp: number;
      bulanan: number[];
      total: number;
      hasAngkas: boolean; // Flag to indicate if any angkas data exists
    }> = [];

    for (const target of latestTargets.values()) {
      const bulanan = Array(12).fill(0);
      let total = 0;
      let hasAngkas = false;

      // Fill in angkas values for each month
      for (let bulan = 1; bulan <= 12; bulan++) {
        const angkasKey = `${target.user_id}-${target.id_sub_kegiatan}-${target.id_sumber_anggaran}-${bulan}`;
        const angkas = latestAngkas.get(angkasKey);
        if (angkas) {
          const nilai = Number(angkas.nilai) || 0;
          bulanan[bulan - 1] = nilai;
          total += nilai;
          hasAngkas = true;
        }
      }

      result.push({
        user_id: target.user_id,
        puskesmas: (target as any).puskesmas,
        id_sub_kegiatan: target.id_sub_kegiatan,
        subKegiatan: (target as any).subKegiatan,
        id_sumber_anggaran: target.id_sumber_anggaran,
        sumberAnggaran: (target as any).sumberAnggaran,
        tahun: targetTahun,
        target_rp: Number(target.target_rp) || 0,
        bulanan,
        total,
        hasAngkas,
      });
    }

    // Sort by puskesmas name, then sub kegiatan
    result.sort((a, b) => {
      const puskesmasCompare = (a.puskesmas?.nama || '').localeCompare(b.puskesmas?.nama || '');
      if (puskesmasCompare !== 0) return puskesmasCompare;
      return (a.subKegiatan?.kegiatan || '').localeCompare(b.subKegiatan?.kegiatan || '');
    });

    res.json({
      tahun: targetTahun,
      total: result.length,
      withAngkas: result.filter(r => r.hasAngkas).length,
      withoutAngkas: result.filter(r => !r.hasAngkas).length,
      data: result,
    });
  } catch (error: any) {
    console.error('Error fetching angkas:', error);
    res.status(500).json({ error: 'Failed to fetch angkas data', details: error.message });
  }
});

/**
 * GET /api/angkas/by-sub-kegiatan
 * Get cumulative angkas grouped by sub kegiatan for a specific user/puskesmas
 * Always returns the latest record for each combination (history support)
 */
router.get('/by-sub-kegiatan', authenticate, async (req: Request, res: Response): Promise<void> => {
  try {
    const { tahun, bulan, user_id, id_sumber_anggaran } = req.query;
    const currentUser = req.user!;

    const targetTahun = tahun ? parseInt(tahun as string) : new Date().getFullYear();
    const targetBulan = bulan ? parseInt(bulan as string) : new Date().getMonth() + 1;

    // Determine user_id based on role
    let targetUserId: string;
    if (currentUser.role === 'puskesmas') {
      targetUserId = currentUser.id;
    } else if (user_id) {
      targetUserId = user_id as string;
    } else {
      res.status(400).json({ error: 'user_id is required for admin' });
      return;
    }

    const where: any = {
      user_id: targetUserId,
      tahun: targetTahun,
      bulan: { [Op.lte]: targetBulan },
      id_sub_kegiatan: { [Op.ne]: null }, // Only records with matched sub_kegiatan
    };

    if (id_sumber_anggaran) {
      where.id_sumber_anggaran = parseInt(id_sumber_anggaran as string);
    }

    // Get all data first, ordered by created_at DESC to get latest first
    const allData = await AnggaranKas.findAll({
      where,
      include: [
        { model: SubKegiatan, as: 'subKegiatan', attributes: ['id_sub_kegiatan', 'kegiatan', 'kode_sub'] },
        { model: SumberAnggaran, as: 'sumberAnggaran', attributes: ['id_sumber', 'sumber'] },
      ],
      order: [['created_at', 'DESC']],
    });

    // Filter to get only the latest record for each combination (kode_rekening, id_sumber_anggaran, bulan)
    const latestMap = new Map<string, typeof allData[0]>();
    for (const record of allData) {
      const key = `${record.kode_rekening}-${record.id_sumber_anggaran}-${record.bulan}`;
      // Due to ordering by created_at DESC, first occurrence is latest
      if (!latestMap.has(key)) {
        latestMap.set(key, record);
      }
    }

    // Use only latest records for grouping
    const data = Array.from(latestMap.values());

    // Group by sub_kegiatan + sumber_anggaran and sum
    const grouped = new Map<string, {
      id_sub_kegiatan: number;
      subKegiatan: any;
      id_sumber_anggaran: number;
      sumberAnggaran: any;
      target_angkas: number;
    }>();

    for (const record of data) {
      const key = `${record.id_sub_kegiatan}-${record.id_sumber_anggaran}`;
      
      if (!grouped.has(key)) {
        grouped.set(key, {
          id_sub_kegiatan: record.id_sub_kegiatan!,
          subKegiatan: (record as any).subKegiatan,
          id_sumber_anggaran: record.id_sumber_anggaran,
          sumberAnggaran: (record as any).sumberAnggaran,
          target_angkas: 0,
        });
      }

      grouped.get(key)!.target_angkas += Number(record.nilai) || 0;
    }

    res.json({
      tahun: targetTahun,
      bulan: targetBulan,
      user_id: targetUserId,
      count: grouped.size,
      data: Array.from(grouped.values()),
    });
  } catch (error: any) {
    console.error('Error fetching angkas by sub kegiatan:', error);
    res.status(500).json({ error: 'Failed to fetch data', details: error.message });
  }
});

/**
 * GET /api/angkas/unmatched
 * Get angkas records that couldn't be matched to sub_kegiatan
 * Shows distinct kode_rekening per puskesmas (latest record only)
 */
router.get('/unmatched', authenticate, authorizeAdmin, async (req: Request, res: Response) => {
  try {
    const { tahun } = req.query;
    const targetTahun = tahun ? parseInt(tahun as string) : new Date().getFullYear();

    // Get all unmatched records
    const allData = await AnggaranKas.findAll({
      where: {
        tahun: targetTahun,
        id_sub_kegiatan: null,
      },
      include: [
        { model: User, as: 'puskesmas', attributes: ['id', 'nama', 'username'] },
        { model: SumberAnggaran, as: 'sumberAnggaran', attributes: ['id_sumber', 'sumber'] },
      ],
      attributes: ['id', 'user_id', 'kode_rekening', 'uraian', 'tahun', 'id_sumber_anggaran', 'created_at'],
      order: [['created_at', 'DESC']],
    });

    // Get distinct kode_rekening per user_id + id_sumber_anggaran (latest only)
    const distinctMap = new Map<string, typeof allData[0]>();
    for (const record of allData) {
      const key = `${record.user_id}-${record.kode_rekening}-${record.id_sumber_anggaran}`;
      if (!distinctMap.has(key)) {
        distinctMap.set(key, record);
      }
    }

    const data = Array.from(distinctMap.values());

    res.json({
      tahun: targetTahun,
      count: data.length,
      data,
    });
  } catch (error: any) {
    console.error('Error fetching unmatched angkas:', error);
    res.status(500).json({ error: 'Failed to fetch data', details: error.message });
  }
});

/**
 * PUT /api/angkas/:id/match
 * Manually match an angkas record to a sub_kegiatan
 */
router.put('/:id/match', authenticate, authorizeAdmin, async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { id_sub_kegiatan } = req.body;

    if (!id_sub_kegiatan) {
      res.status(400).json({ error: 'id_sub_kegiatan is required' });
      return;
    }

    // Verify sub_kegiatan exists
    const subKegiatan = await SubKegiatan.findByPk(id_sub_kegiatan);
    if (!subKegiatan) {
      res.status(400).json({ error: 'Invalid sub_kegiatan' });
      return;
    }

    // Find the record
    const record = await AnggaranKas.findByPk(id);
    if (!record) {
      res.status(404).json({ error: 'Angkas record not found' });
      return;
    }

    // Update this record and all similar records (same kode_rekening)
    await AnggaranKas.update(
      { id_sub_kegiatan },
      {
        where: {
          kode_rekening: record.kode_rekening,
          user_id: record.user_id,
        },
      }
    );

    res.json({
      message: 'Successfully matched angkas to sub_kegiatan',
      kode_rekening: record.kode_rekening,
      id_sub_kegiatan,
    });
  } catch (error: any) {
    console.error('Error matching angkas:', error);
    res.status(500).json({ error: 'Failed to match record', details: error.message });
  }
});

/**
 * DELETE /api/angkas/bulk
 * Delete angkas data by filters
 */
router.delete('/bulk', authenticate, authorizeAdmin, async (req: Request, res: Response): Promise<void> => {
  try {
    const { tahun, id_sumber_anggaran, user_id } = req.body;

    const where: any = {};

    if (tahun) where.tahun = parseInt(tahun);
    if (id_sumber_anggaran) where.id_sumber_anggaran = parseInt(id_sumber_anggaran);
    if (user_id) where.user_id = user_id;

    if (Object.keys(where).length === 0) {
      res.status(400).json({ error: 'At least one filter is required' });
      return;
    }

    const deleted = await AnggaranKas.destroy({ where });

    res.json({
      message: `Deleted ${deleted} angkas records`,
      deleted,
    });
  } catch (error: any) {
    console.error('Error deleting angkas:', error);
    res.status(500).json({ error: 'Failed to delete records', details: error.message });
  }
});

export default router;
