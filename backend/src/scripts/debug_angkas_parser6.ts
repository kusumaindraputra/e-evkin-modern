/**
 * Debug v6 - check monthly values and sumber anggaran for a specific puskesmas
 */
import fs from 'fs';
import { parseAngkasPdf } from '../services/angkasParserService';

async function main() {
  const pdfPath = 'C:\\Users\\kusum\\Downloads\\Sistem Informasi Pemerintahan Daerah - Penatausahaan.pdf';
  const pdfBuffer = fs.readFileSync(pdfPath);
  const result = await parseAngkasPdf(pdfBuffer);

  const bjg = result.puskesmasList.find(p => p.namaPuskesmas.toLowerCase().includes('bojonggede'));
  if (bjg) {
    console.log('=== BOJONGGEDE - Monthly Values ===');
    for (const row of bjg.rows.slice(0, 5)) {
      console.log(`\n${row.kodeRekening} | ${row.uraian}`);
      console.log(`  Total: ${row.jumlahAnggaran.toLocaleString()}`);
      console.log(`  RAK:   ${row.jumlahRak.toLocaleString()}`);
      console.log(`  Monthly: [${row.bulanan.map(v => v.toLocaleString()).join(', ')}]`);
      console.log(`  Sum monthly: ${row.bulanan.reduce((a, b) => a + b, 0).toLocaleString()}`);
      console.log(`  Sumber: ${row.sumberAnggaranKode} = ${row.sumberAnggaranNama}`);
    }
  }

  // Check what kode 1.02.02.2.02.0033 has - it combines BOK + PAD in Excel
  // In PDF it shows 267,631,106 which = 85,094,000 (BOK) + 182,537,106 (PAD)
  const bjg33 = bjg?.rows.find(r => r.kodeRekening === '1.02.02.2.02.0033');
  if (bjg33) {
    console.log('\n\n=== BOJONGGEDE 0033 (Operasional) ===');
    console.log(`Total: ${bjg33.jumlahAnggaran.toLocaleString()}`);
    console.log(`Expected: 267,631,106 (= 85,094,000 BOK + 182,537,106 PAD)`);
    console.log(`Monthly: [${bjg33.bulanan.map(v => v.toLocaleString()).join(', ')}]`);
  }

  // Detected sumber anggaran
  console.log('\n\nDetected Sumber Anggaran:');
  for (const sa of result.detectedSumberAnggaran) {
    console.log(`  ${sa.kode} = ${sa.nama}`);
  }

  // Show total counts
  const withRows = result.puskesmasList.filter(p => p.rows.length > 0);
  console.log(`\nPuskesmas with data: ${withRows.length} / ${result.puskesmasList.length}`);
}

main().catch(console.error);
