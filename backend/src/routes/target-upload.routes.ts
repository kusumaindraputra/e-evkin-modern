import { Router, Request, Response } from 'express';
import multer from 'multer';
import * as XLSX from 'xlsx';
import { SubKegiatanTarget, User, SubKegiatan, SumberAnggaran, Satuan, Kegiatan } from '../models';
import { Op } from 'sequelize';
import { authenticate } from '../middleware/auth';
import { authorizeAdmin } from '../middleware/authorize';

const router = Router();

// Configure multer for memory storage
const upload = multer({ storage: multer.memoryStorage() });

interface ExcelRow {
  NO: number;
  TAHUN: number;
  'KODE SUB UNIT': string;
  'NAMA SUB UNIT': string;
  'KODE SUB KEGIATAN': string;
  'NAMA SUB KEGIATAN': string;
  'KODE SUMBER DANA': string;
  'NAMA SUMBER DANA': string;
  PAGU: number;
}

interface UploadResult {
  success: number;
  inserted: number;
  updated: number;
  skipped: number;
  createdSubKegiatan: number;
  createdSumberAnggaran: number;
  failed: number;
  excludedNonPuskesmas: number;
  errors: Array<{
    row: number;
    puskesmas: string;
    subKegiatan: string;
    error: string;
  }>;
  successList: Array<{
    type: 'inserted' | 'updated';
    puskesmas: string;
    subKegiatan: string;
    sumberDana: string;
    tahun: number;
    target_rp: number;
  }>;
}

// Helper function to check if entity should be excluded from errors
// Only Puskesmas and Labkesda are valid - everything else is excluded
function isExcludedEntity(puskesmasName: string): boolean {
  const normalizedName = puskesmasName.toLowerCase();
  
  // Valid entities that should NOT be excluded
  const validPrefixes = ['puskesmas', 'puskemas']; // Include typo variant
  const validNames = ['laboratorium kesehatan daerah', 'labkesda'];
  
  // Check if it's a valid Puskesmas
  for (const prefix of validPrefixes) {
    if (normalizedName.startsWith(prefix)) {
      return false; // Don't exclude - it's a Puskesmas
    }
  }
  
  // Check if it's Labkesda
  for (const name of validNames) {
    if (normalizedName.includes(name)) {
      return false; // Don't exclude - it's Labkesda
    }
  }
  
  // Everything else should be excluded
  return true;
}

// POST /api/target/upload - Upload Excel file to bulk import targets
router.post('/upload', authenticate, authorizeAdmin, upload.single('file'), async (req: Request, res: Response) => {
  try {
    const adminId = req.user!.id;
    const catatan = req.body.catatan || null; // Catatan manual dari user

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'File tidak ditemukan',
      });
    }

    // Parse Excel file
    const workbook = XLSX.read(req.file.buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json<ExcelRow>(worksheet);

    if (data.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'File Excel kosong',
      });
    }

    const result: UploadResult = {
      success: 0,
      inserted: 0,
      updated: 0,
      skipped: 0,
      createdSubKegiatan: 0,
      createdSumberAnggaran: 0,
      failed: 0,
      excludedNonPuskesmas: 0,
      errors: [],
      successList: [],
    };

    // Group by kode_sub_unit + sub kegiatan + sumber dana + tahun
    const grouped = new Map<string, {
      kodeSubUnit: string;
      puskesmas: string;
      subKegiatanKode: string;
      subKegiatanNama: string;
      sumberDanaKode: string;
      sumberDanaNama: string;
      tahun: number;
      totalPagu: number;
      rows: number[];
    }>();

    data.forEach((row, index) => {
      const key = `${row['KODE SUB UNIT']}_${row['KODE SUB KEGIATAN']}_${row['KODE SUMBER DANA']}_${row.TAHUN}`;
      
      if (!grouped.has(key)) {
        grouped.set(key, {
          kodeSubUnit: row['KODE SUB UNIT'],
          puskesmas: row['NAMA SUB UNIT'],
          subKegiatanKode: row['KODE SUB KEGIATAN'],
          subKegiatanNama: row['NAMA SUB KEGIATAN'],
          sumberDanaKode: row['KODE SUMBER DANA'],
          sumberDanaNama: row['NAMA SUMBER DANA'],
          tahun: row.TAHUN,
          totalPagu: 0,
          rows: [],
        });
      }
      
      const group = grouped.get(key)!;
      group.totalPagu += row.PAGU || 0;
      group.rows.push(index + 2); // +2 karena Excel row 1 = header, index 0 = row 2
    });

    // Process each grouped target
    for (const [key, group] of grouped) {
      try {
        // Find puskesmas by kode_sub_unit (primary method)
        let puskesmas: User | null = null;
        
        if (group.kodeSubUnit) {
          puskesmas = await User.findOne({
            where: { 
              kode_sub_unit: group.kodeSubUnit,
              role: 'puskesmas',
            },
          });
        }

        // Fallback: Handle specific mapping for "Laboratorium Kesehatan Daerah" -> "labkesda"
        if (!puskesmas && group.puskesmas === 'Laboratorium Kesehatan Daerah') {
          puskesmas = await User.findOne({
            where: { 
              username: 'labkesda',
              role: 'puskesmas',
            },
          });
        }

        // Fallback: try by nama_puskesmas
        if (!puskesmas) {
          const searchName = group.puskesmas.replace(/^Puskesmas\s+|^Puskemas\s+/i, '');
          puskesmas = await User.findOne({
            where: { 
              nama_puskesmas: { [Op.iLike]: searchName },
              role: 'puskesmas',
            },
          });
        }

        if (!puskesmas) {
          // Check if this is a non-Puskesmas entity that should be excluded
          if (isExcludedEntity(group.puskesmas)) {
            result.excludedNonPuskesmas++;
            continue;
          }
          
          result.failed++;
          result.errors.push({
            row: group.rows[0],
            puskesmas: group.puskesmas,
            subKegiatan: group.subKegiatanNama,
            error: `Puskesmas "${group.puskesmas}" (kode: ${group.kodeSubUnit}) tidak ditemukan`,
          });
          continue;
        }

        // Find sub kegiatan by kode
        let subKegiatan = await SubKegiatan.findOne({
          where: { kode_sub: group.subKegiatanKode },
        });

        if (!subKegiatan) {
          // Insert new sub kegiatan if not found
          // First, find or create a default parent kegiatan
          let parentKegiatan = await Kegiatan.findOne({
            where: { kode: '99' }, // Default parent kegiatan
          });

          if (!parentKegiatan) {
            // Create default parent kegiatan
            parentKegiatan = await Kegiatan.create({
              kode: '99',
              kegiatan: 'Kegiatan Lainnya (Auto-generated)',
              id_uraian: 1, // Default uraian
            });
          }

          // Create new sub kegiatan
          subKegiatan = await SubKegiatan.create({
            kode_sub: group.subKegiatanKode,
            kegiatan: group.subKegiatanNama,
            id_kegiatan: parentKegiatan.id_kegiatan,
            indikator_kinerja: 'Auto-generated dari upload Excel',
          });

          result.createdSubKegiatan++;
        }

        // Find sumber anggaran - need to map KODE SUMBER DANA to our table
        // Trim whitespace and try to match by nama
        const sumberDanaNamaTrimmed = group.sumberDanaNama.trim();
        let sumberAnggaran = await SumberAnggaran.findOne({
          where: { sumber: sumberDanaNamaTrimmed },
        });

        // If not found, try case-insensitive search
        if (!sumberAnggaran) {
          sumberAnggaran = await SumberAnggaran.findOne({
            where: { sumber: { [Op.iLike]: sumberDanaNamaTrimmed } },
          });
        }

        // If still not found, create new sumber anggaran
        if (!sumberAnggaran) {
          sumberAnggaran = await SumberAnggaran.create({
            sumber: sumberDanaNamaTrimmed,
          });
          result.createdSumberAnggaran++;
        }

        // Check if target already exists
        const existingTarget = await SubKegiatanTarget.findOne({
          where: {
            user_id: puskesmas.id,
            id_sub_kegiatan: subKegiatan.id_sub_kegiatan,
            id_sumber_anggaran: sumberAnggaran.id_sumber,
            tahun: group.tahun,
            bulan: null,
          },
          order: [['created_at', 'DESC']], // Get the latest record
        });

        if (existingTarget) {
          // Check if target_rp is the same, skip if no change needed
          // Note: BIGINT dari database dikembalikan sebagai string oleh Sequelize
          const existingTargetRp = Number(existingTarget.target_rp);
          const newTargetRp = Number(group.totalPagu);
          
          if (existingTargetRp === newTargetRp) {
            result.skipped++;
            continue; // Skip this iteration
          }

          // INSERT new record for history tracking (instead of UPDATE)
          // This preserves the old value and creates a new entry
          // Preserve target_k and id_satuan from existing record (only update target_rp)
          await SubKegiatanTarget.create({
            user_id: puskesmas.id,
            id_sub_kegiatan: subKegiatan.id_sub_kegiatan,
            id_sumber_anggaran: sumberAnggaran.id_sumber,
            tahun: group.tahun,
            bulan: null,
            target_k: existingTarget.target_k,  // Preserve existing target_k
            target_rp: group.totalPagu,
            id_satuan: existingTarget.id_satuan,  // Preserve existing satuan
            created_by: adminId,
            catatan: catatan,
          });
          result.updated++;
          result.successList.push({
            type: 'updated',
            puskesmas: group.puskesmas,
            subKegiatan: `${group.subKegiatanKode} - ${group.subKegiatanNama}`,
            sumberDana: group.sumberDanaNama,
            tahun: group.tahun,
            target_rp: group.totalPagu,
          });
        } else {
          // INSERT new target (first entry)
          // Set target_k=0 and id_satuan=null - admin must set via Target Kinerja page
          await SubKegiatanTarget.create({
            user_id: puskesmas.id,
            id_sub_kegiatan: subKegiatan.id_sub_kegiatan,
            id_sumber_anggaran: sumberAnggaran.id_sumber,
            tahun: group.tahun,
            bulan: null,
            target_k: 0,  // Default 0, must be set in Target Kinerja page
            target_rp: group.totalPagu,
            id_satuan: null,  // Null, must be selected in Target Kinerja page
            created_by: adminId,
            catatan: catatan,
          });
          result.inserted++;
          result.successList.push({
            type: 'inserted',
            puskesmas: group.puskesmas,
            subKegiatan: `${group.subKegiatanKode} - ${group.subKegiatanNama}`,
            sumberDana: group.sumberDanaNama,
            tahun: group.tahun,
            target_rp: group.totalPagu,
          });
        }

        result.success++;
      } catch (error) {
        result.failed++;
        result.errors.push({
          row: group.rows[0],
          puskesmas: group.puskesmas,
          subKegiatan: group.subKegiatanNama,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }

    return res.json({
      success: true,
      message: `Upload selesai. Berhasil: ${result.success}, Skipped: ${result.skipped}, Gagal: ${result.failed}, Sub Kegiatan Baru: ${result.createdSubKegiatan}, Sumber Dana Baru: ${result.createdSumberAnggaran}${result.excludedNonPuskesmas > 0 ? `, Excluded (bukan Puskesmas): ${result.excludedNonPuskesmas}` : ''}`,
      data: result,
    });
  } catch (error) {
    console.error('Error uploading targets:', error);
    return res.status(500).json({
      success: false,
      message: 'Gagal upload file',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

export default router;
