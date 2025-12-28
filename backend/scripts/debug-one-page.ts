/**
 * Detailed debug of one Puskesmas page
 */

import fs from 'fs';
import path from 'path';

const pdfjsLib = require('pdfjs-dist/legacy/build/pdf.js');

async function debugOnePage() {
  const pdfPath = path.join(__dirname, '../../docs/Angkas Parsial 3 tahun 2025.pdf');
  const pdfBuffer = fs.readFileSync(pdfPath);
  const uint8Array = new Uint8Array(pdfBuffer);

  const pdf = await pdfjsLib.getDocument(uint8Array).promise;
  const page = await pdf.getPage(16); // First puskesmas page (Jasinga)
  const textContent = await page.getTextContent();
  
  const textItems = textContent.items as Array<{ str: string; transform: number[] }>;
  
  // Sort by Y then X
  textItems.sort((a, b) => {
    const yDiff = b.transform[5] - a.transform[5];
    if (Math.abs(yDiff) > 5) return yDiff;
    return a.transform[4] - b.transform[4];
  });

  // Group into lines
  const lines: string[] = [];
  let currentLine: string[] = [];
  let currentY = textItems[0]?.transform[5] || 0;

  for (const item of textItems) {
    const y = item.transform[5];
    if (Math.abs(y - currentY) > 5) {
      if (currentLine.length > 0) {
        lines.push(currentLine.join(' ').trim());
      }
      currentLine = [item.str];
      currentY = y;
    } else {
      currentLine.push(item.str);
    }
  }
  if (currentLine.length > 0) {
    lines.push(currentLine.join(' ').trim());
  }

  console.log('=== PAGE 16 - ALL LINES ===\n');
  lines.forEach((line, i) => {
    const hasKode = line.match(/^1\.\d+\.\d+/);
    const prefix = hasKode ? '📋' : '  ';
    console.log(`[${i.toString().padStart(2)}] ${prefix} ${line.substring(0, 150)}`);
  });

  // Parse one kegiatan line
  console.log('\n\n=== PARSING SAMPLE LINE ===\n');
  const sampleLine = lines.find(l => l.match(/^1\.02\.01\.2\.10\.0001/));
  if (sampleLine) {
    console.log('Full line:', sampleLine);
    console.log('\n');
    
    // Currency pattern - MUST end with ,XX
    const CURRENCY_PATTERN = /(\d{1,3}(?:\.\d{3})*,\d{2})/g;
    // Remove kode rekening first
    const withoutKode = sampleLine.replace(/^[\d.]+\s+/, '');
    const values = withoutKode.match(CURRENCY_PATTERN);
    console.log('Extracted values:', values?.slice(0, 16));
    console.log('Total values:', values?.length);
    
    // Parse values
    if (values) {
      const parsed = values.map(v => {
        const normalized = v.replace(/\./g, '').replace(',', '.');
        return parseFloat(normalized) || 0;
      });
      console.log('\nParsed numeric values:');
      console.log('  Jumlah Anggaran:', parsed[0]?.toLocaleString());
      console.log('  Jumlah RAK:', parsed[1]?.toLocaleString());
      console.log('  Januari:', parsed[2]?.toLocaleString());
      console.log('  Februari:', parsed[3]?.toLocaleString());
      console.log('  Maret:', parsed[4]?.toLocaleString());
      // etc...
    }
  }
}

debugOnePage().catch(console.error);
