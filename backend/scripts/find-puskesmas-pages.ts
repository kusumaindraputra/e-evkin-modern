/**
 * Find pages with Puskesmas data in PDF
 */

import fs from 'fs';
import path from 'path';

const pdfjsLib = require('pdfjs-dist/legacy/build/pdf.js');

async function findPuskesmasPages() {
  const pdfPath = path.join(__dirname, '../../docs/Angkas Parsial 3 tahun 2025.pdf');
  const pdfBuffer = fs.readFileSync(pdfPath);
  const uint8Array = new Uint8Array(pdfBuffer);

  const pdf = await pdfjsLib.getDocument(uint8Array).promise;
  console.log(`Total pages: ${pdf.numPages}`);

  const puskesmasPages: number[] = [];

  for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
    const page = await pdf.getPage(pageNum);
    const textContent = await page.getTextContent();
    const pageText = textContent.items.map((item: any) => item.str).join(' ');

    // Check for Puskesmas pattern with kode rekening
    if (pageText.match(/1\.02\.0\.00\.0\.00\.\d+\.\d+\s+Puskesmas/)) {
      puskesmasPages.push(pageNum);
      
      // Extract puskesmas names from this page
      const matches = pageText.match(/Puskesmas\s+[A-Za-z\s]+/g);
      if (matches) {
        const uniqueNames = [...new Set(matches.map(m => m.trim()))];
        console.log(`\nPage ${pageNum}:`);
        uniqueNames.slice(0, 5).forEach(name => console.log(`  - ${name}`));
        if (uniqueNames.length > 5) {
          console.log(`  ... and ${uniqueNames.length - 5} more`);
        }
      }
    }
  }

  console.log(`\n\nPages with Puskesmas data: ${puskesmasPages.join(', ')}`);
  console.log(`Total puskesmas pages: ${puskesmasPages.length}`);

  // Now let's look at one puskesmas page in detail
  if (puskesmasPages.length > 0) {
    const samplePage = puskesmasPages[0];
    console.log(`\n\n=== DETAILED VIEW OF PAGE ${samplePage} ===\n`);
    
    const page = await pdf.getPage(samplePage);
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

    // Find lines with Puskesmas
    lines.forEach((line, i) => {
      if (line.includes('Puskesmas')) {
        console.log(`[${i}] ${line.substring(0, 200)}`);
      }
    });
  }
}

findPuskesmasPages().catch(console.error);
