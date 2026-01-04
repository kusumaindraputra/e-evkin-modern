/**
 * Debug script to check why some puskesmas are not matched
 */
import path from 'path';
import fs from 'fs';
import { parseAngkasPdf } from '../services/angkasParserService';
import { User } from '../models';

async function debugPdfMatching() {
  const pdfPath = path.join(__dirname, '../../../docs/Angkas Parsial 3 tahun 2025.pdf');
  
  console.log('Reading PDF from:', pdfPath);
  
  if (!fs.existsSync(pdfPath)) {
    console.error('PDF file not found!');
    return;
  }
  
  const pdfBuffer = fs.readFileSync(pdfPath);
  console.log('PDF size:', pdfBuffer.length, 'bytes');
  
  // Parse PDF
  const parsed = await parseAngkasPdf(pdfBuffer);
  
  console.log('\n=== PDF Parsing Results ===');
  console.log('Year:', parsed.tahun);
  console.log('Total puskesmas found in PDF:', parsed.puskesmasList.length);
  
  // Get all puskesmas from DB
  const dbUsers = await User.findAll({
    where: { role: 'puskesmas' },
    attributes: ['id', 'nama', 'username', 'kode_sub_unit'],
    order: [['kode_sub_unit', 'ASC']]
  });
  
  console.log('Total puskesmas in DB:', dbUsers.length);
  
  // Create a set of kode_sub_unit from PDF
  const pdfKodes = new Set(parsed.puskesmasList.map(p => p.kodePuskesmas));
  
  // Missing puskesmas (16 yang tidak ada datanya)
  const missingKodes = [
    '1.02.0.00.0.00.01.0013', // Nanggung
    '1.02.0.00.0.00.01.0023', // Cimandala
    '1.02.0.00.0.00.01.0034', // Rumpin
    '1.02.0.00.0.00.01.0035', // Pamijahan
    '1.02.0.00.0.00.01.0054', // Lebakwangi
    '1.02.0.00.0.00.01.0055', // Bunar
    '1.02.0.00.0.00.01.0056', // Kiara Pandak
    '1.02.0.00.0.00.01.0066', // Ciasmara
    '1.02.0.00.0.00.01.0069', // Pasir
    '1.02.0.00.0.00.01.0084', // Cinagara
    '1.02.0.00.0.00.01.0085', // Ciburayut
    '1.02.0.00.0.00.01.0086', // Sukaharja
    '1.02.0.00.0.00.01.0097', // Sukaraja
    '1.02.0.00.0.00.01.0098', // Cilebut
    '1.02.0.00.0.00.01.0110', // Balekambang
    '1.02.0.00.0.00.01.0111', // Sukadamai
  ];
  
  console.log('\n=== Checking Missing Puskesmas ===');
  for (const kode of missingKodes) {
    const inPdf = pdfKodes.has(kode);
    const dbUser = dbUsers.find(u => u.kode_sub_unit === kode);
    const pdfPuskesmas = parsed.puskesmasList.find(p => p.kodePuskesmas === kode);
    
    console.log(`\n${kode}:`);
    console.log(`  DB nama: ${dbUser?.nama || 'NOT FOUND'}`);
    console.log(`  In PDF: ${inPdf ? 'YES' : 'NO'}`);
    if (pdfPuskesmas) {
      console.log(`  PDF nama: ${pdfPuskesmas.namaPuskesmas}`);
      console.log(`  PDF rows: ${pdfPuskesmas.rows.length}`);
    }
  }
  
  // Show all kodes from PDF
  console.log('\n=== All Kodes from PDF ===');
  const sortedPdfKodes = Array.from(pdfKodes).sort();
  sortedPdfKodes.forEach(k => {
    const puskesmas = parsed.puskesmasList.find(p => p.kodePuskesmas === k);
    console.log(`${k} -> ${puskesmas?.namaPuskesmas} (${puskesmas?.rows.length || 0} rows)`);
  });
  
  // Check DB kodes NOT in PDF
  console.log('\n=== DB Kodes NOT in PDF ===');
  for (const user of dbUsers) {
    if (user.kode_sub_unit && !pdfKodes.has(user.kode_sub_unit)) {
      console.log(`${user.kode_sub_unit} -> ${user.nama} (NOT IN PDF)`);
    }
  }
}

debugPdfMatching().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });
