/**
 * Debug script for angkas PDF parsing - shows raw extracted values
 */

import fs from 'fs';
import path from 'path';

const pdfjsLib = require('pdfjs-dist/legacy/build/pdf.js');

// Currency pattern
const CURRENCY_PATTERN = /(\d{1,3}(?:\.\d{3})*(?:,\d{2})?)/g;

function parseCurrency(value: string): number {
  if (!value) return 0;
  const normalized = value.replace(/\./g, '').replace(',', '.');
  return parseFloat(normalized) || 0;
}

async function debugPdf() {
  const pdfPath = path.join(__dirname, '../../docs/Angkas Parsial 3 tahun 2025.pdf');
  const pdfBuffer = fs.readFileSync(pdfPath);
  const uint8Array = new Uint8Array(pdfBuffer);

  const pdf = await pdfjsLib.getDocument(uint8Array).promise;
  
  // Read first 2 pages
  for (let pageNum = 1; pageNum <= 2; pageNum++) {
    const page = await pdf.getPage(pageNum);
    const textContent = await page.getTextContent();
    const pageText = textContent.items
      .map((item: any) => item.str)
      .join(' ')
      .replace(/\s+/g, ' ');

    console.log(`\n========== PAGE ${pageNum} ==========`);
    console.log(pageText.substring(0, 2000));

    // Look for Puskesmas lines
    const lines = pageText.split(/(?=1\.02\.)/).slice(0, 5);
    
    console.log('\n\n--- EXTRACTED LINES ---');
    for (const line of lines) {
      if (line.includes('Puskesmas')) {
        console.log('\n📋 LINE:', line.substring(0, 200));
        
        // Extract currency values
        const matches = line.match(CURRENCY_PATTERN);
        if (matches) {
          console.log('💰 Currency values found:', matches.slice(0, 5));
          console.log('💰 Parsed:', matches.slice(0, 5).map(v => parseCurrency(v)));
        }
      }
    }
  }

  // Look for a specific kegiatan line
  console.log('\n\n========== LOOKING FOR KEGIATAN LINES ==========');
  const page1 = await pdf.getPage(1);
  const text1 = (await page1.getTextContent()).items.map((item: any) => item.str).join(' ');
  
  // Look for kegiatan codes like 1.02.02
  const kegiatanMatches = text1.match(/1\.02\.\d+\.\d+\.\d+\.\d+\s+[\w\s]+/g);
  if (kegiatanMatches) {
    console.log('Found kegiatan patterns:', kegiatanMatches.slice(0, 5));
  }
}

debugPdf().catch(console.error);
