/**
 * DEBUG SCRIPT: Angkas PDF Upload Matching Analysis
 *
 * This script simulates the angkas upload route's matching logic to identify
 * why uploads fail for many puskesmas. It focuses on:
 * 1. Puskesmas user matching (kode_sub_unit and name-based)
 * 2. Sub kegiatan matching (kode_sub vs kodeRekening, and fuzzy name match)
 * 3. Sumber anggaran resolution (from PDF and from SubKegiatanTarget)
 *
 * Usage: npx ts-node -r dotenv/config src/scripts/debug_upload_matching.ts
 */

import * as fs from 'fs';
import { sequelize, User, SubKegiatan, SumberAnggaran, SubKegiatanTarget } from '../models';
import { parseAngkasPdf, findBestMatch, findPuskesmasUser } from '../services/angkasParserService';

const PDF_PATH = 'C:\\Users\\kusum\\Downloads\\Sistem Informasi Pemerintahan Daerah - Penatausahaan.pdf';
const TAHUN = 2025;

// Same mapping as in angkas.routes.ts
const SUMBER_ANGGARAN_MAPPING: Record<string, string[]> = {
  '4.1': ['BLUD', 'PAD', 'Pendapatan Asli'],
  '4.2': ['DAK', 'APBD', 'Transfer', 'Dana Alokasi'],
  '4.3': ['JKN', 'Kapitasi', 'BPJS'],
};

function findOrMatchSumber(
  kode: string | null,
  nama: string | null,
  existingSumber: Array<{ id_sumber: number; sumber: string }>
): { id: number; nama: string } | null {
  if (!kode && !nama) return null;

  if (nama) {
    const normalizedNama = nama.toLowerCase();
    for (const sumber of existingSumber) {
      const sumberNama = sumber.sumber.toLowerCase();
      if (sumberNama.includes(normalizedNama) || normalizedNama.includes(sumberNama)) {
        return { id: sumber.id_sumber, nama: sumber.sumber };
      }
    }
  }

  if (kode && SUMBER_ANGGARAN_MAPPING[kode]) {
    const keywords = SUMBER_ANGGARAN_MAPPING[kode];
    for (const sumber of existingSumber) {
      const sumberNama = sumber.sumber.toLowerCase();
      if (keywords.some(kw => sumberNama.includes(kw.toLowerCase()))) {
        return { id: sumber.id_sumber, nama: sumber.sumber };
      }
    }
  }

  return null;
}

async function main() {
  console.log('='.repeat(120));
  console.log('ANGKAS PDF UPLOAD MATCHING DEBUG');
  console.log('='.repeat(120));

  // Step 1: Read and parse the PDF
  console.log('\n[1] Reading PDF:', PDF_PATH);
  if (!fs.existsSync(PDF_PATH)) {
    console.error('ERROR: PDF file not found at', PDF_PATH);
    process.exit(1);
  }

  const pdfBuffer = fs.readFileSync(PDF_PATH);
  console.log('    PDF size:', (pdfBuffer.length / 1024 / 1024).toFixed(2), 'MB');

  const parsed = await parseAngkasPdf(pdfBuffer);
  console.log('    Parsed tahun:', parsed.tahun);
  console.log('    Puskesmas count:', parsed.puskesmasList.length);
  console.log('    Detected sumber anggaran:', JSON.stringify(parsed.detectedSumberAnggaran));

  // Step 2: Load DB data (same as upload route)
  console.log('\n[2] Loading database data...');

  const puskesmasUsers = await User.findAll({
    where: { role: 'puskesmas' },
    attributes: ['id', 'nama', 'username', 'kode_sub_unit'],
    raw: true,
  });
  console.log('    Puskesmas users in DB:', puskesmasUsers.length);

  const kodeSubUnitToUserId = new Map<string, string>();
  puskesmasUsers.forEach((u: any) => {
    if (u.kode_sub_unit) {
      kodeSubUnitToUserId.set(u.kode_sub_unit, u.id);
    }
  });
  console.log('    Users with kode_sub_unit:', kodeSubUnitToUserId.size);

  const subKegiatanList = await SubKegiatan.findAll({
    attributes: ['id_sub_kegiatan', 'kegiatan', 'kode_sub'],
    raw: true,
  });
  console.log('    SubKegiatan in DB:', subKegiatanList.length);

  const kodeSubMap = new Map<string, number>();
  for (const sk of subKegiatanList as any[]) {
    if (sk.kode_sub) {
      kodeSubMap.set(sk.kode_sub, sk.id_sub_kegiatan);
    }
  }
  console.log('    SubKegiatan with kode_sub:', kodeSubMap.size);

  const allTargets = await SubKegiatanTarget.findAll({
    where: { tahun: TAHUN },
    attributes: ['user_id', 'id_sub_kegiatan', 'id_sumber_anggaran', 'target_rp'],
    include: [{
      model: SumberAnggaran,
      as: 'sumberAnggaran',
      attributes: ['id_sumber', 'sumber'],
    }],
    raw: true,
  });
  console.log('    SubKegiatanTarget records for', TAHUN, ':', allTargets.length);

  // Build targetSumberMap
  const targetSumberMap = new Map<string, Array<{ id: number; nama: string; target_rp: number }>>();
  for (const t of allTargets as any[]) {
    const key = `${t.user_id}_${t.id_sub_kegiatan}`;
    if (!targetSumberMap.has(key)) {
      targetSumberMap.set(key, []);
    }
    const saId = t['sumberAnggaran.id_sumber'];
    const saNama = t['sumberAnggaran.sumber'];
    if (saId) {
      const arr = targetSumberMap.get(key)!;
      if (!arr.some(x => x.id === saId)) {
        arr.push({ id: saId, nama: saNama, target_rp: Number(t.target_rp) || 0 });
      }
    }
  }

  const existingSumber = await SumberAnggaran.findAll({ raw: true }) as any[];
  console.log('    SumberAnggaran in DB:', existingSumber.length);
  for (const s of existingSumber) {
    console.log('      -', s.id_sumber, ':', s.sumber);
  }

  // Step 3: Show all DB kode_sub values
  console.log('\n[3] DATABASE kode_sub VALUES (sub_kegiatan):');
  console.log('-'.repeat(100));
  for (const sk of (subKegiatanList as any[]).slice(0, 30)) {
    console.log(`    kode_sub: "${sk.kode_sub || '(null)'}"  =>  id=${sk.id_sub_kegiatan}  nama="${sk.kegiatan}"`);
  }
  if (subKegiatanList.length > 30) {
    console.log(`    ... and ${subKegiatanList.length - 30} more`);
  }

  // Step 4: Show DB user kode_sub_unit values
  console.log('\n[4] DATABASE kode_sub_unit VALUES (users):');
  console.log('-'.repeat(100));
  for (const u of puskesmasUsers as any[]) {
    console.log(`    kode_sub_unit: "${u.kode_sub_unit || '(null)'}"  =>  id=${u.id}  nama="${u.nama}"  username="${u.username}"`);
  }

  // Step 5: Process each puskesmas from PDF
  console.log('\n[5] MATCHING ANALYSIS PER PUSKESMAS:');
  console.log('='.repeat(120));

  let totalRows = 0;
  let matchedPuskesmas = 0;
  let unmatchedPuskesmas = 0;
  let subKegiatanMatchedByKode = 0;
  let subKegiatanMatchedByName = 0;
  let subKegiatanUnmatched = 0;
  let sumberFromPdf = 0;
  let sumberFromTarget = 0;
  let sumberFromTargetMultiple = 0;
  let sumberNotFound = 0;
  let wouldSucceed = 0;
  let wouldFail = 0;

  for (const puskesmasData of parsed.puskesmasList) {
    const isLabkesda = puskesmasData.namaPuskesmas.toLowerCase().includes('labkesda') ||
                       puskesmasData.namaPuskesmas.toLowerCase().includes('laboratorium');
    const showDetails = isLabkesda; // Show full details for labkesda

    // Match puskesmas user
    let userId = kodeSubUnitToUserId.get(puskesmasData.kodePuskesmas);
    let matchMethod = userId ? 'KODE' : 'NONE';

    if (!userId) {
      userId = findPuskesmasUser(
        puskesmasData.namaPuskesmas,
        puskesmasUsers.map((u: any) => ({ id: u.id, nama: u.nama, username: u.username }))
      ) || undefined;
      if (userId) matchMethod = 'NAME_FUZZY';
    }

    const userMatch = userId ? puskesmasUsers.find((u: any) => u.id === userId) as any : null;

    if (userId) {
      matchedPuskesmas++;
    } else {
      unmatchedPuskesmas++;
    }

    console.log(`\n${'*'.repeat(100)}`);
    console.log(`PUSKESMAS: "${puskesmasData.namaPuskesmas}" (PDF kode: ${puskesmasData.kodePuskesmas})`);
    console.log(`  User match: ${matchMethod} => ${userId ? `id=${userId} nama="${userMatch?.nama}" kode_sub_unit="${userMatch?.kode_sub_unit}"` : 'NOT FOUND'}`);
    console.log(`  Rows: ${puskesmasData.rows.length}`);

    if (!userId) {
      console.log('  => SKIPPING (no user match)');
      totalRows += puskesmasData.rows.length;
      wouldFail += puskesmasData.rows.length;
      continue;
    }

    // Process each row
    for (const row of puskesmasData.rows) {
      totalRows++;

      // Match sub_kegiatan by kode
      let idSubKegiatan: number | null = kodeSubMap.get(row.kodeRekening) || null;
      let skMatchMethod = idSubKegiatan ? 'KODE_EXACT' : 'NONE';

      if (!idSubKegiatan) {
        // Try fuzzy name match
        idSubKegiatan = findBestMatch(
          row.uraian,
          (subKegiatanList as any[]).map(sk => ({ id: sk.id_sub_kegiatan, nama: sk.kegiatan }))
        );
        if (idSubKegiatan) skMatchMethod = 'NAME_FUZZY';
      }

      if (skMatchMethod === 'KODE_EXACT') subKegiatanMatchedByKode++;
      else if (skMatchMethod === 'NAME_FUZZY') subKegiatanMatchedByName++;
      else subKegiatanUnmatched++;

      const matchedSk = idSubKegiatan
        ? (subKegiatanList as any[]).find(sk => sk.id_sub_kegiatan === idSubKegiatan)
        : null;

      // Resolve sumber anggaran
      let sumberResult: { id: number; nama: string } | null = null;
      let sumberMethod = 'NONE';

      // Try from PDF first
      sumberResult = findOrMatchSumber(row.sumberAnggaranKode, row.sumberAnggaranNama, existingSumber);
      if (sumberResult) {
        sumberMethod = 'PDF';
        sumberFromPdf++;
      }

      // If not from PDF, try from SubKegiatanTarget
      if (!sumberResult && userId && idSubKegiatan) {
        const targetKey = `${userId}_${idSubKegiatan}`;
        const targetSumbers = targetSumberMap.get(targetKey);
        if (targetSumbers && targetSumbers.length === 1) {
          sumberResult = { id: targetSumbers[0].id, nama: targetSumbers[0].nama };
          sumberMethod = 'TARGET_SINGLE';
          sumberFromTarget++;
        } else if (targetSumbers && targetSumbers.length > 1) {
          sumberResult = { id: targetSumbers[0].id, nama: `SPLIT(${targetSumbers.length})` };
          sumberMethod = 'TARGET_MULTIPLE';
          sumberFromTargetMultiple++;
        } else {
          sumberNotFound++;
        }
      } else if (!sumberResult) {
        sumberNotFound++;
      }

      // Determine if this row would succeed
      const hasNonZeroData = row.bulanan.some(v => v > 0);
      const rowWouldSucceed = !!idSubKegiatan && !!sumberResult && hasNonZeroData;
      if (rowWouldSucceed) wouldSucceed++;
      else wouldFail++;

      // Print details for all puskesmas, but more detail for labkesda
      const status = rowWouldSucceed ? 'OK' : 'FAIL';
      const failReasons: string[] = [];
      if (!idSubKegiatan) failReasons.push('NO_SUB_KEGIATAN');
      if (!sumberResult) failReasons.push('NO_SUMBER');
      if (!hasNonZeroData) failReasons.push('ZERO_DATA');

      if (showDetails || !rowWouldSucceed) {
        console.log(`\n  ROW [${status}${failReasons.length > 0 ? ' ' + failReasons.join(',') : ''}]:`);
        console.log(`    PDF kodeRekening: "${row.kodeRekening}"`);
        console.log(`    PDF uraian:       "${row.uraian}"`);
        console.log(`    PDF sumberKode:   "${row.sumberAnggaranKode || '(null)'}"`);
        console.log(`    PDF sumberNama:   "${row.sumberAnggaranNama || '(null)'}"`);
        console.log(`    SubKegiatan match: ${skMatchMethod}${matchedSk ? ` => id=${matchedSk.id_sub_kegiatan} kode_sub="${matchedSk.kode_sub}" nama="${matchedSk.kegiatan}"` : ' => NOT FOUND'}`);

        // Show kode format comparison if no kode match
        if (skMatchMethod !== 'KODE_EXACT') {
          console.log(`    FORMAT COMPARISON:`);
          console.log(`      PDF kodeRekening format: "${row.kodeRekening}"`);
          // Find the closest kode_sub in DB
          const pdfParts = row.kodeRekening.split('.');
          const closestKodes = Array.from(kodeSubMap.keys())
            .filter(k => {
              const kParts = k.split('.');
              // Check if first few segments match
              return kParts.length > 2 && pdfParts.length > 2 && kParts[0] === pdfParts[0];
            })
            .slice(0, 5);
          if (closestKodes.length > 0) {
            console.log(`      Similar DB kode_sub values:`);
            for (const k of closestKodes) {
              console.log(`        "${k}" => id=${kodeSubMap.get(k)}`);
            }
          }
        }

        console.log(`    Sumber match:     ${sumberMethod}${sumberResult ? ` => id=${sumberResult.id} nama="${sumberResult.nama}"` : ' => NOT FOUND'}`);
        console.log(`    Monthly values:   [${row.bulanan.map(v => v.toLocaleString('id-ID')).join(', ')}]`);
      }
    }
  }

  // Step 6: Summary
  console.log('\n' + '='.repeat(120));
  console.log('SUMMARY');
  console.log('='.repeat(120));
  console.log(`\nPUSKESMAS MATCHING:`);
  console.log(`  Total in PDF:    ${parsed.puskesmasList.length}`);
  console.log(`  Matched:         ${matchedPuskesmas}`);
  console.log(`  Unmatched:       ${unmatchedPuskesmas}`);

  console.log(`\nSUB KEGIATAN MATCHING (${totalRows} total rows):`);
  console.log(`  Matched by kode:  ${subKegiatanMatchedByKode}`);
  console.log(`  Matched by name:  ${subKegiatanMatchedByName}`);
  console.log(`  Unmatched:        ${subKegiatanUnmatched}`);

  console.log(`\nSUMBER ANGGARAN RESOLUTION:`);
  console.log(`  From PDF:            ${sumberFromPdf}`);
  console.log(`  From Target (single): ${sumberFromTarget}`);
  console.log(`  From Target (split):  ${sumberFromTargetMultiple}`);
  console.log(`  Not found:           ${sumberNotFound}`);

  console.log(`\nOVERALL RESULT:`);
  console.log(`  Would succeed: ${wouldSucceed} / ${totalRows} (${totalRows > 0 ? ((wouldSucceed / totalRows) * 100).toFixed(1) : 0}%)`);
  console.log(`  Would fail:    ${wouldFail} / ${totalRows} (${totalRows > 0 ? ((wouldFail / totalRows) * 100).toFixed(1) : 0}%)`);

  // Step 7: Show unmatched puskesmas list
  if (unmatchedPuskesmas > 0) {
    console.log('\nUNMATCHED PUSKESMAS:');
    for (const p of parsed.puskesmasList) {
      let userId = kodeSubUnitToUserId.get(p.kodePuskesmas);
      if (!userId) {
        userId = findPuskesmasUser(
          p.namaPuskesmas,
          puskesmasUsers.map((u: any) => ({ id: u.id, nama: u.nama, username: u.username }))
        ) || undefined;
      }
      if (!userId) {
        console.log(`  - "${p.namaPuskesmas}" (kode: ${p.kodePuskesmas}, ${p.rows.length} rows)`);
      }
    }
  }

  await sequelize.close();
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
