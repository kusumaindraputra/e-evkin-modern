/**
 * Direct Upload Script - processes files and inserts directly to DB
 * Usage: node --loader tsx --no-warnings src/seeders/directUpload.ts
 */

import * as XLSX from 'xlsx';
import * as fs from 'fs';
import * as path from 'path';
import { User, SubKegiatan, SumberAnggaran, SubKegiatanTarget, AnggaranKas, Kegiatan, sequelize } from '../models';
import { Op } from 'sequelize';
import { parseAngkasPdf, findPuskesmasUser, findBestMatch } from '../services/angkasParserService';

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

async function uploadExcel() {
  console.log('\n=== Processing Excel Target File ===');
  
  const filePath = path.resolve(__dirname, '../../../docs/Rekap_Ver3 (7).xlsx');
  
  if (!fs.existsSync(filePath)) {
    console.error('Excel file not found:', filePath);
    return null;
  }
  
  // Parse Excel file
  const buffer = fs.readFileSync(filePath);
  const workbook = XLSX.read(buffer, { type: 'buffer' });
  const sheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[sheetName];
  const data = XLSX.utils.sheet_to_json<ExcelRow>(worksheet);

  console.log(`Rows in Excel: ${data.length}`);

  const result = {
    success: 0,
    inserted: 0,
    updated: 0,
    skipped: 0,
    createdSubKegiatan: 0,
    createdSumberAnggaran: 0,
    failed: 0,
    excludedNonPuskesmas: 0,
    errors: [] as Array<{ kode: string; nama: string; puskesmas: string; error: string }>,
    successList: [] as Array<{ puskesmas: string; subKegiatan: string; sumberDana: string; tahun: number; target_rp: number }>,
  };

  // Group by puskesmas kode + sub kegiatan + sumber dana + tahun
  const grouped = new Map<string, {
    kodeSubUnit: string;
    puskesmas: string;
    subKegiatanKode: string;
    subKegiatanNama: string;
    sumberDanaKode: string;
    sumberDanaNama: string;
    tahun: number;
    totalPagu: number;
  }>();

  // Filter only rows that belong to Puskesmas/Dinkes (kode starts with 1.02.0.00.0.00.01.)
  const puskesmasPrefix = '1.02.0.00.0.00.01.';
  let filteredCount = 0;
  let skippedCount = 0;
  
  data.forEach((row) => {
    const kodeSubUnit = row['KODE SUB UNIT'];
    
    // Skip non-puskesmas data
    if (!kodeSubUnit || !kodeSubUnit.startsWith(puskesmasPrefix)) {
      skippedCount++;
      return;
    }
    
    filteredCount++;
    const key = `${kodeSubUnit}_${row['KODE SUB KEGIATAN']}_${row['KODE SUMBER DANA']}_${row.TAHUN}`;
    
    if (!grouped.has(key)) {
      grouped.set(key, {
        kodeSubUnit: kodeSubUnit,
        puskesmas: row['NAMA SUB UNIT'],
        subKegiatanKode: row['KODE SUB KEGIATAN'],
        subKegiatanNama: row['NAMA SUB KEGIATAN'],
        sumberDanaKode: row['KODE SUMBER DANA'],
        sumberDanaNama: row['NAMA SUMBER DANA'],
        tahun: row.TAHUN,
        totalPagu: 0,
      });
    }
    
    const group = grouped.get(key)!;
    group.totalPagu += row.PAGU || 0;
  });

  console.log(`Puskesmas rows: ${filteredCount}, Non-puskesmas skipped: ${skippedCount}`);

  console.log(`Grouped entries: ${grouped.size}`);

  // Check if entity should be excluded (not Puskesmas or Labkesda)
  function isExcludedEntity(puskesmasName: string): boolean {
    const normalizedName = puskesmasName.toLowerCase();
    const validPrefixes = ['puskesmas', 'puskemas'];
    const validNames = ['laboratorium kesehatan daerah', 'labkesda'];
    
    for (const prefix of validPrefixes) {
      if (normalizedName.startsWith(prefix)) return false;
    }
    for (const name of validNames) {
      if (normalizedName.includes(name)) return false;
    }
    return true;
  }

  // Process each grouped target
  for (const [key, group] of grouped) {
    try {
      // PRIMARY: Find puskesmas by kode_sub_unit
      let puskesmas = await User.findOne({
        where: { 
          kode_sub_unit: group.kodeSubUnit,
          role: 'puskesmas',
        },
      });

      // FALLBACK: Old name-based matching
      if (!puskesmas) {
        if (group.puskesmas === 'Laboratorium Kesehatan Daerah') {
          puskesmas = await User.findOne({
            where: { username: 'labkesda', role: 'puskesmas' },
          });
        }
      }

      if (!puskesmas) {
        puskesmas = await User.findOne({
          where: { nama: group.puskesmas, role: 'puskesmas' },
        });
      }

      if (!puskesmas) {
        const searchName = group.puskesmas.replace(/^Puskesmas\s+|^Puskemas\s+/i, '');
        puskesmas = await User.findOne({
          where: { nama: { [Op.iLike]: searchName }, role: 'puskesmas' },
        });
      }

      if (!puskesmas) {
        if (isExcludedEntity(group.puskesmas)) {
          result.excludedNonPuskesmas++;
          continue;
        }
        
        result.failed++;
        result.errors.push({
          kode: group.kodeSubUnit,
          nama: group.puskesmas,
          puskesmas: group.puskesmas,
          error: `Puskesmas (kode: ${group.kodeSubUnit}) tidak ditemukan`,
        });
        continue;
      }

      // Find sub kegiatan by kode
      let subKegiatan = await SubKegiatan.findOne({
        where: { kode_sub: group.subKegiatanKode },
      });

      if (!subKegiatan) {
        let parentKegiatan = await Kegiatan.findOne({
          where: { kode: '99' },
        });

        if (!parentKegiatan) {
          parentKegiatan = await Kegiatan.create({
            kode: '99',
            kegiatan: 'Kegiatan Lainnya (Auto-generated)',
            id_uraian: 1,
          });
        }

        subKegiatan = await SubKegiatan.create({
          kode_sub: group.subKegiatanKode,
          kegiatan: group.subKegiatanNama,
          id_kegiatan: parentKegiatan.id_kegiatan,
          indikator_kinerja: 'Auto-generated dari upload Excel',
        });

        result.createdSubKegiatan++;
      }

      // Find sumber anggaran
      const sumberDanaNamaTrimmed = group.sumberDanaNama.trim();
      let sumberAnggaran = await SumberAnggaran.findOne({
        where: { sumber: sumberDanaNamaTrimmed },
      });

      if (!sumberAnggaran) {
        sumberAnggaran = await SumberAnggaran.findOne({
          where: { sumber: { [Op.iLike]: sumberDanaNamaTrimmed } },
        });
      }

      if (!sumberAnggaran) {
        sumberAnggaran = await SumberAnggaran.create({
          sumber: sumberDanaNamaTrimmed,
        });
        result.createdSumberAnggaran++;
      }

      // Find or create target (no unique constraint)
      const existingTarget = await SubKegiatanTarget.findOne({
        where: {
          user_id: puskesmas.id,
          id_sub_kegiatan: subKegiatan.id_sub_kegiatan,
          id_sumber_anggaran: sumberAnggaran.id_sumber,
          tahun: group.tahun,
        },
      });

      if (existingTarget) {
        await existingTarget.update({
          target_rp: group.totalPagu,
          catatan: 'Upload dari directUpload.ts',
        });
        result.updated++;
      } else {
        await SubKegiatanTarget.create({
          user_id: puskesmas.id,
          id_sub_kegiatan: subKegiatan.id_sub_kegiatan,
          id_sumber_anggaran: sumberAnggaran.id_sumber,
          tahun: group.tahun,
          target_rp: group.totalPagu,
          target_k: 0,
          catatan: 'Upload dari directUpload.ts',
          created_by: puskesmas.id, // Use puskesmas as creator
        });
        result.inserted++;
      }
      result.success++;

      result.successList.push({
        puskesmas: puskesmas.nama,
        subKegiatan: subKegiatan.kegiatan,
        sumberDana: sumberAnggaran.sumber,
        tahun: group.tahun,
        target_rp: group.totalPagu,
      });

    } catch (error: any) {
      result.failed++;
      result.errors.push({
        kode: group.kodeSubUnit,
        nama: group.puskesmas,
        puskesmas: group.puskesmas,
        error: error.message,
      });
    }
  }

  return result;
}

async function uploadPdf() {
  console.log('\n=== Processing Angkas PDF File ===');
  
  const filePath = path.resolve(__dirname, '../../../docs/Angkas Parsial 3 tahun 2025.pdf');
  
  if (!fs.existsSync(filePath)) {
    console.error('PDF file not found:', filePath);
    return null;
  }

  const buffer = fs.readFileSync(filePath);
  console.log('Parsing PDF...');
  const parsed = await parseAngkasPdf(buffer);
  const tahun = parsed.tahun;

  console.log(`Year: ${tahun}, Puskesmas found in PDF: ${parsed.puskesmasList.length}`);
  
  // Get all puskesmas users with kode_sub_unit
  const puskesmasUsers = await User.findAll({
    where: { role: 'puskesmas' },
    attributes: ['id', 'nama', 'username', 'kode_sub_unit'],
  });

  // Get all sumber anggaran for mapping
  const sumberAnggaranList = await SumberAnggaran.findAll({
    attributes: ['id_sumber', 'sumber'],
  });
  
  // Create sumber anggaran map
  const sumberAnggaranMap = new Map<string, number>();
  for (const sa of sumberAnggaranList) {
    sumberAnggaranMap.set(sa.sumber.toLowerCase(), sa.id_sumber);
  }

  // Get all sub kegiatan for matching
  const subKegiatanList = await SubKegiatan.findAll({
    attributes: ['id_sub_kegiatan', 'kegiatan', 'kode_sub'],
  });
  console.log(`SubKegiatan master: ${subKegiatanList.length} records`);

  const result = {
    success: 0,
    inserted: 0,
    updated: 0,
    skipped: 0,
    failed: 0,
    unmatchedPuskesmas: [] as string[],
    unmatchedPuskesmasDetails: [] as Array<{ kode: string; nama: string }>,
    unmatchedSumberAnggaran: [] as string[],
    errors: [] as string[],
  };

  // Function to find sumber anggaran ID by name (partial match)
  function findSumberAnggaranId(nama: string | null): number | null {
    if (!nama) return null;
    const namaLower = nama.toLowerCase();
    
    for (const [key, id] of sumberAnggaranMap) {
      if (namaLower.includes(key) || key.includes(namaLower)) {
        return id;
      }
    }
    return null;
  }

  // Collect all records to insert
  console.log('Collecting records from PDF data...');
  const recordsToInsert: Array<{
    user_id: string;
    id_sub_kegiatan: number | null;
    kode_rekening: string;
    id_sumber_anggaran: number;
    uraian: string;
    tahun: number;
    bulan: number;
    nilai: number;
  }> = [];

  // Process each puskesmas
  for (const puskesmasData of parsed.puskesmasList) {
    const userId = findPuskesmasUser(
      puskesmasData.namaPuskesmas,
      puskesmasUsers.map(u => ({ 
        id: u.id, 
        nama: u.nama, 
        username: u.username, 
        kode_sub_unit: u.kode_sub_unit || undefined 
      })),
      puskesmasData.kodePuskesmas
    );

    if (!userId) {
      result.unmatchedPuskesmas.push(puskesmasData.namaPuskesmas);
      result.unmatchedPuskesmasDetails.push({
        kode: puskesmasData.kodePuskesmas,
        nama: puskesmasData.namaPuskesmas,
      });
      continue;
    }

    // Process each row
    for (const row of puskesmasData.rows) {
      const sumberAnggaranId = findSumberAnggaranId(row.sumberAnggaranNama);

      if (!sumberAnggaranId) {
        const unmatchedKey = `${row.sumberAnggaranKode || 'unknown'}: ${row.sumberAnggaranNama || 'unknown'}`;
        if (!result.unmatchedSumberAnggaran.includes(unmatchedKey)) {
          result.unmatchedSumberAnggaran.push(unmatchedKey);
        }
        result.skipped++;
        continue;
      }

      // Match to sub_kegiatan using uraian
      const idSubKegiatan = findBestMatch(
        row.uraian,
        subKegiatanList.map(sk => ({ id: sk.id_sub_kegiatan, nama: sk.kegiatan }))
      );

      // Process each month
      for (let bulan = 1; bulan <= 12; bulan++) {
        const nilai = row.bulanan[bulan - 1] || 0;
        
        recordsToInsert.push({
          user_id: userId,
          id_sub_kegiatan: idSubKegiatan,
          kode_rekening: row.kodeRekening,
          id_sumber_anggaran: sumberAnggaranId,
          uraian: row.uraian || 'N/A',
          tahun,
          bulan,
          nilai,
        });
      }
    }
  }

  console.log(`Total records to process: ${recordsToInsert.length}`);

  // Get all existing records in one query
  console.log('Checking existing records...');
  const existingRecords = await AnggaranKas.findAll({
    where: { tahun },
    attributes: ['id', 'user_id', 'kode_rekening', 'id_sumber_anggaran', 'bulan'],
    raw: true,
  });

  // Create a Set for quick lookup
  const existingSet = new Set(
    existingRecords.map(r => 
      `${r.user_id}-${r.kode_rekening}-${r.id_sumber_anggaran}-${r.bulan}`
    )
  );
  const existingMap = new Map(
    existingRecords.map(r => [
      `${r.user_id}-${r.kode_rekening}-${r.id_sumber_anggaran}-${r.bulan}`,
      r.id
    ])
  );

  console.log(`Found ${existingRecords.length} existing records`);

  // Separate into insert and update batches
  const toInsert: typeof recordsToInsert = [];
  const toUpdate: Array<{ id: number; nilai: number }> = [];

  for (const record of recordsToInsert) {
    const key = `${record.user_id}-${record.kode_rekening}-${record.id_sumber_anggaran}-${record.bulan}`;
    if (existingSet.has(key)) {
      toUpdate.push({ id: existingMap.get(key)!, nilai: record.nilai });
    } else {
      toInsert.push(record);
    }
  }

  console.log(`Records to insert: ${toInsert.length}, to update: ${toUpdate.length}`);

  // Bulk insert new records
  if (toInsert.length > 0) {
    console.log('Bulk inserting new records...');
    const BATCH_SIZE = 1000;
    for (let i = 0; i < toInsert.length; i += BATCH_SIZE) {
      const batch = toInsert.slice(i, i + BATCH_SIZE);
      await AnggaranKas.bulkCreate(batch as any, { logging: false });
      if ((i + BATCH_SIZE) % 5000 === 0 || i + BATCH_SIZE >= toInsert.length) {
        console.log(`  Inserted ${Math.min(i + BATCH_SIZE, toInsert.length)}/${toInsert.length}`);
      }
    }
    result.inserted = toInsert.length;
  }

  // Batch update existing records
  if (toUpdate.length > 0) {
    console.log('Batch updating existing records...');
    const BATCH_SIZE = 500;
    for (let i = 0; i < toUpdate.length; i += BATCH_SIZE) {
      const batch = toUpdate.slice(i, i + BATCH_SIZE);
      await Promise.all(
        batch.map(({ id, nilai }) => 
          AnggaranKas.update({ nilai }, { where: { id }, logging: false })
        )
      );
      if ((i + BATCH_SIZE) % 2000 === 0 || i + BATCH_SIZE >= toUpdate.length) {
        console.log(`  Updated ${Math.min(i + BATCH_SIZE, toUpdate.length)}/${toUpdate.length}`);
      }
    }
    result.updated = toUpdate.length;
  }

  result.success = result.inserted + result.updated;

  return result;
}

async function main() {
  try {
    // Upload Excel first
    const excelResult = await uploadExcel();
    
    console.log('\n=== Excel Upload Result ===');
    if (excelResult) {
      console.log(`Success: ${excelResult.success}`);
      console.log(`Inserted: ${excelResult.inserted}`);
      console.log(`Updated: ${excelResult.updated}`);
      console.log(`Skipped: ${excelResult.skipped}`);
      console.log(`Failed: ${excelResult.failed}`);
      console.log(`Excluded Non-Puskesmas: ${excelResult.excludedNonPuskesmas}`);
      console.log(`Created SubKegiatan: ${excelResult.createdSubKegiatan}`);
      console.log(`Created SumberAnggaran: ${excelResult.createdSumberAnggaran}`);
      
      if (excelResult.errors.length > 0) {
        console.log('\n--- Excel Errors (first 20): ---');
        excelResult.errors.slice(0, 20).forEach(e => {
          console.log(`  [${e.kode}] ${e.nama}: ${e.error}`);
        });
      }
    }

    // Upload PDF
    const pdfResult = await uploadPdf();
    
    console.log('\n=== PDF Upload Result ===');
    if (pdfResult) {
      console.log(`Success: ${pdfResult.success}`);
      console.log(`Inserted: ${pdfResult.inserted}`);
      console.log(`Updated: ${pdfResult.updated}`);
      console.log(`Skipped: ${pdfResult.skipped}`);
      console.log(`Failed: ${pdfResult.failed}`);
      
      if (pdfResult.unmatchedPuskesmasDetails.length > 0) {
        console.log('\n--- Unmatched Puskesmas in PDF: ---');
        pdfResult.unmatchedPuskesmasDetails.forEach(p => {
          console.log(`  [${p.kode}] ${p.nama}`);
        });
      }
      
      if (pdfResult.unmatchedSumberAnggaran.length > 0) {
        console.log('\n--- Unmatched Sumber Anggaran: ---');
        pdfResult.unmatchedSumberAnggaran.forEach(s => {
          console.log(`  ${s}`);
        });
      }
      
      if (pdfResult.errors.length > 0) {
        console.log('\n--- PDF Errors (first 20): ---');
        pdfResult.errors.slice(0, 20).forEach(e => {
          console.log(`  ${e}`);
        });
      }
    }

    console.log('\n=== Upload Complete ===');
    
    // Verify data count
    const targetCount = await SubKegiatanTarget.count();
    const angkasCount = await AnggaranKas.count();
    console.log(`Final SubKegiatanTarget count: ${targetCount}`);
    console.log(`Final AnggaranKas count: ${angkasCount}`);

    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

main();
