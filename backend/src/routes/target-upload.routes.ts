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
  failed: number;
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

// POST /api/target/upload - Upload Excel file to bulk import targets
router.post('/upload', authenticate, authorizeAdmin, upload.single('file'), async (req: Request, res: Response) => {
  try {
    const adminId = req.user!.id;

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
      failed: 0,
      errors: [],
      successList: [],
    };

    // Get default satuan "Dokumen" (id = 2)
    const defaultSatuan = await Satuan.findOne({ where: { satuannya: 'Dokumen' } });
    const defaultSatuanId = defaultSatuan?.id_satuan || 2;

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

    console.log(`📊 Found ${grouped.size} unique targets to process from ${data.length} rows`);

    // Process each grouped target
    for (const [key, group] of grouped) {
      try {
        // Find puskesmas by nama
        // Handle prefix "Puskesmas" in Excel vs DB without prefix
        let puskesmas = await User.findOne({
          where: { 
            nama: group.puskesmas,
            role: 'puskesmas',
          },
        });

        // If not found, try without "Puskesmas" prefix
        if (!puskesmas && group.puskesmas.startsWith('Puskesmas ')) {
          const namaWithoutPrefix = group.puskesmas.replace('Puskesmas ', '');
          puskesmas = await User.findOne({
            where: { 
              nama: namaWithoutPrefix,
              role: 'puskesmas',
            },
          });
        }

        // Handle typo "Puskemas" instead of "Puskesmas"
        if (!puskesmas && group.puskesmas.startsWith('Puskemas ')) {
          const namaWithoutPrefix = group.puskesmas.replace('Puskemas ', '');
          puskesmas = await User.findOne({
            where: { 
              nama: namaWithoutPrefix,
              role: 'puskesmas',
            },
          });
        }

        // Handle case differences like "Kota batu" vs "Kota Batu"
        if (!puskesmas) {
          const searchName = group.puskesmas.replace(/^Puskesmas\s+|^Puskemas\s+/i, '');
          puskesmas = await User.findOne({
            where: { 
              nama: { [Op.iLike]: searchName }, // Case-insensitive search
              role: 'puskesmas',
            },
          });
        }

        // Handle space differences like "Karya Mekar" vs "Karyamekar"
        if (!puskesmas) {
          const searchName = group.puskesmas
            .replace(/^Puskesmas\s+|^Puskemas\s+/i, '')
            .replace(/\s+/g, ''); // Remove all spaces
          puskesmas = await User.findOne({
            where: { 
              nama: { [Op.iLike]: searchName },
              role: 'puskesmas',
            },
          });
        }

        // Last resort: try to match DB names that contain the search term
        if (!puskesmas) {
          const searchName = group.puskesmas
            .replace(/^Puskesmas\s+|^Puskemas\s+/i, '')
            .replace(/\s+/g, '');
          puskesmas = await User.findOne({
            where: { 
              nama: { [Op.iLike]: `%${searchName}%` },
              role: 'puskesmas',
            },
          });
        }

        if (!puskesmas) {
          result.failed++;
          result.errors.push({
            row: group.rows[0],
            puskesmas: group.puskesmas,
            subKegiatan: group.subKegiatanNama,
            error: `Puskesmas "${group.puskesmas}" tidak ditemukan`,
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
          console.log(`✅ Created new sub kegiatan: ${group.subKegiatanKode} - ${group.subKegiatanNama}`);
        }

        // Find sumber anggaran - need to map KODE SUMBER DANA to our table
        // For now, try to match by nama
        const sumberAnggaran = await SumberAnggaran.findOne({
          where: { sumber: group.sumberDanaNama },
        });

        if (!sumberAnggaran) {
          result.failed++;
          result.errors.push({
            row: group.rows[0],
            puskesmas: group.puskesmas,
            subKegiatan: group.subKegiatanNama,
            error: `Sumber dana "${group.sumberDanaNama}" tidak ditemukan`,
          });
          continue;
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
        });

        if (existingTarget) {
          // Check if target_rp is the same, skip if no change needed
          if (existingTarget.target_rp === group.totalPagu) {
            result.skipped++;
            console.log(`⏭️  Skipped (same value) ${group.puskesmas} - ${group.subKegiatanKode}: ${group.totalPagu}`);
            continue; // Skip this iteration
          }

          // UPDATE existing target
          await existingTarget.update({
            target_k: 10,
            target_rp: group.totalPagu,
            id_satuan: defaultSatuanId,
            created_by: adminId,
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
            user_id: puskesmas.id,
            id_sub_kegiatan: subKegiatan.id_sub_kegiatan,
            id_sumber_anggaran: sumberAnggaran.id_sumber,
            tahun: group.tahun,
            bulan: null,
            target_k: 10,
            target_rp: group.totalPagu,
            id_satuan: defaultSatuanId,
            created_by: adminId,
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
      message: `Upload selesai. Berhasil: ${result.success}, Skipped: ${result.skipped}, Gagal: ${result.failed}, Sub Kegiatan Baru: ${result.createdSubKegiatan}`,
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
