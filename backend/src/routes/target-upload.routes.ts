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

    // Group by puskesmas + sub kegiatan + sumber dana + tahun
    const grouped = new Map<string, {
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
      const key = `${row['NAMA SUB UNIT']}_${row['KODE SUB KEGIATAN']}_${row['KODE SUMBER DANA']}_${row.TAHUN}`;
      
      if (!grouped.has(key)) {
        grouped.set(key, {
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

    // OPTIMIZATION: Pre-load all reference data to avoid N+1 queries
    // Load all puskesmas users once
    const allUsers = await User.findAll({
      where: { role: 'puskesmas' },
      attributes: ['id', 'nama', 'username'],
      raw: true,
    });

    // Create lookup maps for fast in-memory search
    const userByUsername = new Map<string, typeof allUsers[0]>();
    const userByNama = new Map<string, typeof allUsers[0]>();
    const userByNamaLower = new Map<string, typeof allUsers[0]>();
    const userByNamaNoSpace = new Map<string, typeof allUsers[0]>();
    
    allUsers.forEach(user => {
      userByUsername.set(user.username.toLowerCase(), user);
      userByNama.set(user.nama, user);
      userByNamaLower.set(user.nama.toLowerCase(), user);
      userByNamaNoSpace.set(user.nama.toLowerCase().replace(/\s+/g, ''), user);
    });

    // Helper function to find puskesmas from pre-loaded data
    const findPuskesmasUser = (puskesmasName: string): typeof allUsers[0] | null => {
      // 1. Special case: Laboratorium Kesehatan Daerah -> labkesda
      if (puskesmasName === 'Laboratorium Kesehatan Daerah') {
        return userByUsername.get('labkesda') || null;
      }

      // 2. Exact match
      let user = userByNama.get(puskesmasName);
      if (user) return user;

      // 3. Try without "Puskesmas" or "Puskemas" prefix
      const withoutPrefix = puskesmasName.replace(/^Puskesmas\s+|^Puskemas\s+/i, '');
      user = userByNama.get(withoutPrefix);
      if (user) return user;

      // 4. Case-insensitive match
      user = userByNamaLower.get(withoutPrefix.toLowerCase());
      if (user) return user;

      // 5. No-space match
      const noSpace = withoutPrefix.toLowerCase().replace(/\s+/g, '');
      user = userByNamaNoSpace.get(noSpace);
      if (user) return user;

      // 6. Partial match (last resort)
      for (const [key, u] of userByNamaLower) {
        if (key.includes(noSpace) || noSpace.includes(key)) {
          return u;
        }
      }

      return null;
    };

    // Pre-load sub kegiatan and sumber anggaran for batch lookups
    const allSubKegiatan = await SubKegiatan.findAll({
      attributes: ['id_sub_kegiatan', 'kode_sub', 'kegiatan', 'id_kegiatan'],
      raw: true,
    });
    const subKegiatanByKode = new Map(
      allSubKegiatan.map(sk => [sk.kode_sub, sk])
    );

    const allSumberAnggaran = await SumberAnggaran.findAll({
      attributes: ['id_sumber', 'sumber'],
      raw: true,
    });
    const sumberAnggaranByNama = new Map<string, typeof allSumberAnggaran[0]>();
    const sumberAnggaranByNamaLower = new Map<string, typeof allSumberAnggaran[0]>();
    allSumberAnggaran.forEach(sa => {
      sumberAnggaranByNama.set(sa.sumber, sa);
      sumberAnggaranByNamaLower.set(sa.sumber.toLowerCase(), sa);
    });

    // Process each grouped target
    for (const [key, group] of grouped) {
      try {
        // Find puskesmas from pre-loaded data (no database queries!)
        const puskesmasData = findPuskesmasUser(group.puskesmas);
        
        if (!puskesmasData) {

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
            error: `Puskesmas "${group.puskesmas}" tidak ditemukan`,
          });
          continue;
        }

        // Find sub kegiatan from pre-loaded data
        let subKegiatanData = subKegiatanByKode.get(group.subKegiatanKode);

        if (!subKegiatanData) {
          // Need to create new sub kegiatan - do database query only for new ones
          let parentKegiatan = await Kegiatan.findOne({
            where: { kode: '99' },
            raw: true,
          });

          if (!parentKegiatan) {
            parentKegiatan = await Kegiatan.create({
              kode: '99',
              kegiatan: 'Kegiatan Lainnya (Auto-generated)',
              id_uraian: 1,
            });
          }

          const newSubKegiatan = await SubKegiatan.create({
            kode_sub: group.subKegiatanKode,
            kegiatan: group.subKegiatanNama,
            id_kegiatan: parentKegiatan.id_kegiatan,
            indikator_kinerja: 'Auto-generated dari upload Excel',
          });

          // Add to cache for subsequent iterations (use raw data)
          subKegiatanData = {
            id_sub_kegiatan: newSubKegiatan.id_sub_kegiatan,
            kode_sub: newSubKegiatan.kode_sub,
            kegiatan: newSubKegiatan.kegiatan,
            id_kegiatan: newSubKegiatan.id_kegiatan,
          } as any;
          subKegiatanByKode.set(group.subKegiatanKode, subKegiatanData!);
          result.createdSubKegiatan++;
        }

        // Find sumber anggaran from pre-loaded data
        const sumberDanaNamaTrimmed = group.sumberDanaNama.trim();
        let sumberAnggaranData = 
          sumberAnggaranByNama.get(sumberDanaNamaTrimmed) ||
          sumberAnggaranByNamaLower.get(sumberDanaNamaTrimmed.toLowerCase());

        if (!sumberAnggaranData) {
          // Create new sumber anggaran
          const newSumber = await SumberAnggaran.create({
            sumber: sumberDanaNamaTrimmed,
          });
          
          // Add to cache (use raw data)
          sumberAnggaranData = {
            id_sumber: newSumber.id_sumber,
            sumber: newSumber.sumber,
          } as any;
          sumberAnggaranByNama.set(sumberDanaNamaTrimmed, sumberAnggaranData!);
          sumberAnggaranByNamaLower.set(sumberDanaNamaTrimmed.toLowerCase(), sumberAnggaranData!);
          result.createdSumberAnggaran++;
        }

        // Check if target already exists
        const existingTarget = await SubKegiatanTarget.findOne({
          where: {
            user_id: puskesmasData.id,
            id_sub_kegiatan: subKegiatanData!.id_sub_kegiatan,
            id_sumber_anggaran: sumberAnggaranData!.id_sumber,
            tahun: group.tahun,
            bulan: null,
          },
          order: [['created_at', 'DESC']],
        });

        if (existingTarget) {
          const existingTargetRp = Number(existingTarget.target_rp);
          const newTargetRp = Number(group.totalPagu);
          
          if (existingTargetRp === newTargetRp) {
            result.skipped++;
            continue;
          }

          // INSERT new record for history tracking
          await SubKegiatanTarget.create({
            user_id: puskesmasData.id,
            id_sub_kegiatan: subKegiatanData!.id_sub_kegiatan,
            id_sumber_anggaran: sumberAnggaranData!.id_sumber,
            tahun: group.tahun,
            bulan: null,
            target_k: existingTarget.target_k,
            target_rp: group.totalPagu,
            id_satuan: existingTarget.id_satuan,
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
          // INSERT new target
          await SubKegiatanTarget.create({
            user_id: puskesmasData.id,
            id_sub_kegiatan: subKegiatanData!.id_sub_kegiatan,
            id_sumber_anggaran: sumberAnggaranData!.id_sumber,
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
