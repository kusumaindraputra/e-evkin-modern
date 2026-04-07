/**
 * Debug script to understand why angkas PDF parser returns 0 results
 */
import fs from 'fs';
const pdfjsLib = require('pdfjs-dist/legacy/build/pdf.js');
pdfjsLib.GlobalWorkerOptions.workerSrc = '';

const PUSKESMAS_PATTERN = /^(1\.02\.0\.00\.0\.00\.\d+\.\d+)\s+(?:(Puskesmas|Puskemas)\s+)?([A-Za-z][A-Za-z\s]*?)(?:\s+\d|$)/i;
const KEGIATAN_PATTERN = /^(1\.\d+\.\d+\.\d+\.\d+\.\d+)\s+(.+?)(\d{1,3}(?:\.\d{3})*(?:,\d{2})?(?:\s+|$))/;
const SUMBER_ANGGARAN_PATTERN = /^(\d\.\d)\s+(.+?)(?:\s+\d{1,3}(?:\.\d{3})*(?:,\d{2})?|$)/;

async function debugPdf() {
  const pdfPath = 'C:\\Users\\kusum\\Downloads\\Sistem Informasi Pemerintahan Daerah - Penatausahaan.pdf';

  if (!fs.existsSync(pdfPath)) {
    console.error('PDF file not found:', pdfPath);
    return;
  }

  const pdfBuffer = fs.readFileSync(pdfPath);
  const uint8Array = new Uint8Array(pdfBuffer);
  const loadingTask = pdfjsLib.getDocument({ data: uint8Array });
  const pdf = await loadingTask.promise;

  console.log(`Total pages: ${pdf.numPages}`);

  // Check first 5 pages and pages around where we expect puskesmas data
  const pagesToCheck = [1, 2, 3, 4, 5, 10, 20, 27, 28, 30];

  let totalPuskesmasFound = 0;
  let totalKegiatanFound = 0;
  let totalSumberFound = 0;

  for (const pageNum of pagesToCheck) {
    if (pageNum > pdf.numPages) continue;

    const page = await pdf.getPage(pageNum);
    const textContent = await page.getTextContent();
    const textItems = textContent.items as Array<{ str: string; transform: number[] }>;

    // Sort by y descending, x ascending
    textItems.sort((a: any, b: any) => {
      const yDiff = b.transform[5] - a.transform[5];
      if (Math.abs(yDiff) > 5) return yDiff;
      return a.transform[4] - b.transform[4];
    });

    // Group into lines
    const lines: string[][] = [];
    let currentLine: string[] = [];
    let currentY = textItems.length > 0 ? textItems[0].transform[5] : 0;

    for (const item of textItems) {
      const y = item.transform[5];
      if (Math.abs(y - currentY) > 5) {
        if (currentLine.length > 0) lines.push(currentLine);
        currentLine = [item.str];
        currentY = y;
      } else {
        currentLine.push(item.str);
      }
    }
    if (currentLine.length > 0) lines.push(currentLine);

    const pageText = lines.map(line => line.join(' ')).join('\n');

    console.log(`\n${'='.repeat(80)}`);
    console.log(`PAGE ${pageNum}`);
    console.log(`${'='.repeat(80)}`);

    // Show first 30 lines
    const pageLines = pageText.split('\n').map(l => l.trim()).filter(l => l);
    console.log(`Total lines: ${pageLines.length}`);

    let puskesmasOnPage = 0;
    let kegiatanOnPage = 0;

    for (let i = 0; i < pageLines.length; i++) {
      const line = pageLines[i];

      const pm = line.match(PUSKESMAS_PATTERN);
      const km = line.match(KEGIATAN_PATTERN);
      const sm = line.match(SUMBER_ANGGARAN_PATTERN);

      if (pm) {
        console.log(`  LINE ${i}: [PUSKESMAS] kode=${pm[1]} nama="${pm[3].trim()}"`);
        puskesmasOnPage++;
        totalPuskesmasFound++;
      } else if (km) {
        console.log(`  LINE ${i}: [KEGIATAN] kode=${km[1]} uraian="${km[2].trim().substring(0, 50)}"`);
        kegiatanOnPage++;
        totalKegiatanFound++;
      } else if (sm) {
        console.log(`  LINE ${i}: [SUMBER] kode=${sm[1]} nama="${sm[2].trim()}"`);
        totalSumberFound++;
      }

      // Print first 15 lines raw for debugging
      if (i < 15) {
        console.log(`  RAW ${i}: ${line.substring(0, 120)}`);
      }
    }

    if (puskesmasOnPage === 0 && kegiatanOnPage === 0) {
      // Show some lines that contain "1.02" to see what format they're in
      const matching = pageLines.filter(l => l.includes('1.02') || l.toLowerCase().includes('puskesmas'));
      if (matching.length > 0) {
        console.log(`  Lines containing "1.02" or "puskesmas":`);
        matching.slice(0, 10).forEach((l, i) => {
          console.log(`    ${i}: ${l.substring(0, 150)}`);
        });
      }
    }
  }

  console.log(`\n${'='.repeat(80)}`);
  console.log(`SUMMARY`);
  console.log(`${'='.repeat(80)}`);
  console.log(`Total Puskesmas found: ${totalPuskesmasFound}`);
  console.log(`Total Kegiatan found: ${totalKegiatanFound}`);
  console.log(`Total Sumber Anggaran found: ${totalSumberFound}`);

  // Now also scan ALL pages for puskesmas headers
  console.log(`\nScanning ALL ${pdf.numPages} pages for puskesmas headers...`);
  let allPuskesmas: string[] = [];

  for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
    const page = await pdf.getPage(pageNum);
    const textContent = await page.getTextContent();
    const textItems = textContent.items as Array<{ str: string; transform: number[] }>;

    textItems.sort((a: any, b: any) => {
      const yDiff = b.transform[5] - a.transform[5];
      if (Math.abs(yDiff) > 5) return yDiff;
      return a.transform[4] - b.transform[4];
    });

    const lines: string[][] = [];
    let cl: string[] = [];
    let cy = textItems.length > 0 ? textItems[0].transform[5] : 0;

    for (const item of textItems) {
      const y = item.transform[5];
      if (Math.abs(y - cy) > 5) {
        if (cl.length > 0) lines.push(cl);
        cl = [item.str];
        cy = y;
      } else {
        cl.push(item.str);
      }
    }
    if (cl.length > 0) lines.push(cl);

    for (const parts of lines) {
      const line = parts.join(' ').trim();
      const pm = line.match(PUSKESMAS_PATTERN);
      if (pm) {
        allPuskesmas.push(`Page ${pageNum}: ${pm[1]} - ${pm[3].trim()}`);
      }
    }
  }

  console.log(`Found ${allPuskesmas.length} puskesmas across all pages:`);
  allPuskesmas.forEach(p => console.log(`  ${p}`));
}

debugPdf().catch(console.error);
