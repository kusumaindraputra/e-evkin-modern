/**
 * Debug PDF line-by-line structure
 */

import fs from 'fs';
import path from 'path';

const pdfjsLib = require('pdfjs-dist/legacy/build/pdf.js');

async function debugLines() {
  const pdfPath = path.join(__dirname, '../../docs/Angkas Parsial 3 tahun 2025.pdf');
  const pdfBuffer = fs.readFileSync(pdfPath);
  const uint8Array = new Uint8Array(pdfBuffer);

  const pdf = await pdfjsLib.getDocument(uint8Array).promise;
  const page = await pdf.getPage(3); // Page 3 should have puskesmas data
  const textContent = await page.getTextContent();

  const textItems = textContent.items as Array<{ str: string; transform: number[] }>;

  // Sort by vertical position (y) descending, then horizontal (x) ascending
  textItems.sort((a, b) => {
    const yDiff = b.transform[5] - a.transform[5];
    if (Math.abs(yDiff) > 5) return yDiff;
    return a.transform[4] - b.transform[4];
  });

  // Group items into lines based on y-position
  const lines: string[][] = [];
  let currentLine: string[] = [];
  let currentY = textItems[0]?.transform[5] || 0;

  for (const item of textItems) {
    const y = item.transform[5];
    if (Math.abs(y - currentY) > 5) {
      if (currentLine.length > 0) {
        lines.push([...currentLine]);
      }
      currentLine = [item.str];
      currentY = y;
    } else {
      currentLine.push(item.str);
    }
  }
  if (currentLine.length > 0) {
    lines.push(currentLine);
  }

  console.log('=== PAGE 3 LINE BY LINE ===\n');
  lines.slice(0, 30).forEach((line, i) => {
    const text = line.join(' ').trim();
    if (text.includes('Puskesmas') || text.match(/^1\.02/)) {
      console.log(`[LINE ${i}] 📋 ${text.substring(0, 150)}`);
    } else if (text.match(/^\d{1,3}(?:\.\d{3})*(?:,\d{2})?/)) {
      console.log(`[LINE ${i}] 💰 ${text.substring(0, 100)}`);
    } else {
      console.log(`[LINE ${i}] ${text.substring(0, 80)}`);
    }
  });

  // Look specifically for Puskesmas lines with budget values
  console.log('\n\n=== LOOKING FOR PUSKESMAS + BUDGET PATTERN ===\n');
  const allText = lines.map(l => l.join(' ')).join('\n');
  const puskesmasPattern = /1\.02\.0\.00\.0\.00\.\d+\.\d+\s+Puskesmas\s+([A-Za-z\s]+)/g;
  
  let match;
  let count = 0;
  while ((match = puskesmasPattern.exec(allText)) !== null && count < 10) {
    console.log(`Found: Puskesmas ${match[1].trim()}`);
    count++;
  }
}

debugLines().catch(console.error);
