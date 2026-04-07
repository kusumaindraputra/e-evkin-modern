/**
 * Debug script v4 - test the fixed parser
 */
import fs from 'fs';
import { parseAngkasPdf } from '../services/angkasParserService';

async function main() {
  const pdfPath = 'C:\\Users\\kusum\\Downloads\\Sistem Informasi Pemerintahan Daerah - Penatausahaan.pdf';
  const pdfBuffer = fs.readFileSync(pdfPath);

  console.log('Parsing PDF with fixed parser...');
  const result = await parseAngkasPdf(pdfBuffer);

  console.log(`\nYear: ${result.tahun}`);
  console.log(`Total puskesmas found: ${result.puskesmasList.length}`);
  console.log(`Detected sumber anggaran: ${result.detectedSumberAnggaran.map(s => `${s.kode}=${s.nama}`).join(', ')}`);

  // Show first 20 puskesmas with their row counts
  console.log('\nPuskesmas found:');
  for (const p of result.puskesmasList.slice(0, 30)) {
    console.log(`  ${p.kodePuskesmas} | ${p.namaPuskesmas} | ${p.rows.length} rows`);
    // Show first 3 rows
    for (const row of p.rows.slice(0, 3)) {
      console.log(`    ${row.kodeRekening} | ${row.uraian.substring(0, 40)} | Total: ${row.jumlahAnggaran.toLocaleString()} | Sumber: ${row.sumberAnggaranKode || 'N/A'}`);
    }
  }

  // Check specific puskesmas
  const bojonggede = result.puskesmasList.find(p => p.namaPuskesmas.toLowerCase().includes('bojonggede'));
  const cibinong = result.puskesmasList.find(p => p.namaPuskesmas.toLowerCase().includes('cibinong'));

  if (bojonggede) {
    console.log(`\n=== BOJONGGEDE ===`);
    console.log(`Kode: ${bojonggede.kodePuskesmas}, Rows: ${bojonggede.rows.length}`);
    for (const row of bojonggede.rows) {
      console.log(`  ${row.kodeRekening} | ${row.uraian.substring(0, 50)} | ${row.jumlahAnggaran.toLocaleString()} | Sumber: ${row.sumberAnggaranKode}`);
    }
  } else {
    console.log('\nBojonggede NOT FOUND');
  }

  if (cibinong) {
    console.log(`\n=== CIBINONG ===`);
    console.log(`Kode: ${cibinong.kodePuskesmas}, Rows: ${cibinong.rows.length}`);
    for (const row of cibinong.rows) {
      console.log(`  ${row.kodeRekening} | ${row.uraian.substring(0, 50)} | ${row.jumlahAnggaran.toLocaleString()} | Sumber: ${row.sumberAnggaranKode}`);
    }
  } else {
    console.log('\nCibinong NOT FOUND');
  }
}

main().catch(console.error);
