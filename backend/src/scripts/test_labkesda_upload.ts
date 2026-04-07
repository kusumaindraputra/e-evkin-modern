/**
 * Test script: Parse angkas PDF and check Labkesda matching
 * Usage: npx tsx src/scripts/test_labkesda_upload.ts
 */
import * as fs from 'fs';
import * as path from 'path';
import { parseAngkasPdf, findPuskesmasUser } from '../services/angkasParserService';
import { User } from '../models';
import { sequelize } from '../config/database';

async function main() {
  const filePath = path.resolve('C:/Users/kusum/Downloads/Sistem Informasi Pemerintahan Daerah - Penatausahaan.pdf');

  if (!fs.existsSync(filePath)) {
    console.error('PDF file not found:', filePath);
    process.exit(1);
  }

  console.log('=== Step 1: Parse PDF ===');
  const buffer = fs.readFileSync(filePath);
  const parsed = await parseAngkasPdf(buffer);

  console.log(`Tahun: ${parsed.tahun}`);
  console.log(`Total puskesmas in PDF: ${parsed.puskesmasList.length}`);
  console.log(`Detected sumber anggaran:`, parsed.detectedSumberAnggaran);

  console.log('\n=== All Puskesmas in PDF ===');
  for (const p of parsed.puskesmasList) {
    console.log(`  [${p.kodePuskesmas}] ${p.namaPuskesmas} (${p.rows.length} rows)`);
  }

  // Check specifically for Labkesda
  const labkesda = parsed.puskesmasList.find(p =>
    p.namaPuskesmas.toLowerCase().includes('lab') ||
    p.kodePuskesmas === '1.02.0.00.0.00.01.0050'
  );

  if (labkesda) {
    console.log('\n=== LABKESDA FOUND IN PDF ===');
    console.log(`  Kode: ${labkesda.kodePuskesmas}`);
    console.log(`  Nama: ${labkesda.namaPuskesmas}`);
    console.log(`  Rows: ${labkesda.rows.length}`);
    if (labkesda.rows.length > 0) {
      console.log('  First 3 rows:');
      labkesda.rows.slice(0, 3).forEach(r => {
        console.log(`    [${r.kodeRekening}] ${r.uraian} - Anggaran: ${r.jumlahAnggaran}, Sumber: ${r.sumberAnggaranKode}/${r.sumberAnggaranNama}`);
        console.log(`    Bulanan: ${r.bulanan.join(', ')}`);
      });
    }
  } else {
    console.log('\n=== LABKESDA NOT FOUND IN PDF ===');
    console.log('Possible reasons: different name format or missing from this PDF');
  }

  console.log('\n=== Step 2: Check DB matching ===');
  await sequelize.authenticate();

  const puskesmasUsers = await User.findAll({
    where: { role: 'puskesmas' },
    attributes: ['id', 'nama', 'username', 'kode_sub_unit'],
  });

  // Check Labkesda user in DB
  const labkesdaUser = puskesmasUsers.find(u =>
    u.nama.toLowerCase().includes('lab') || u.username === 'labkesda'
  );

  if (labkesdaUser) {
    console.log(`Labkesda DB user: id=${labkesdaUser.id}, nama=${labkesdaUser.nama}, username=${labkesdaUser.username}, kode_sub_unit=${labkesdaUser.kode_sub_unit || 'NULL'}`);
  } else {
    console.log('Labkesda user NOT FOUND in database!');
  }

  // Test matching for all puskesmas
  console.log('\n=== Step 3: Test matching all puskesmas ===');
  const matched: string[] = [];
  const unmatched: string[] = [];

  for (const p of parsed.puskesmasList) {
    const userId = findPuskesmasUser(
      p.namaPuskesmas,
      puskesmasUsers.map(u => ({
        id: u.id,
        nama: u.nama,
        username: u.username,
        kode_sub_unit: u.kode_sub_unit || undefined
      })),
      p.kodePuskesmas
    );

    if (userId) {
      const user = puskesmasUsers.find(u => u.id === userId);
      matched.push(`✅ [${p.kodePuskesmas}] ${p.namaPuskesmas} -> ${user?.nama} (${user?.kode_sub_unit || 'no kode'})`);
    } else {
      unmatched.push(`❌ [${p.kodePuskesmas}] ${p.namaPuskesmas}`);
    }
  }

  console.log(`Matched: ${matched.length}, Unmatched: ${unmatched.length}`);

  if (unmatched.length > 0) {
    console.log('\n--- UNMATCHED ---');
    unmatched.forEach(u => console.log(u));
  }

  // Show a few matched for verification
  console.log('\n--- MATCHED (first 5) ---');
  matched.slice(0, 5).forEach(m => console.log(m));

  await sequelize.close();
  process.exit(0);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
