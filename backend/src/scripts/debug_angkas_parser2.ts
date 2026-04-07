/**
 * Debug script v2 - find split kode patterns and puskesmas headers
 */
import fs from 'fs';

const pdfjsLib = require('pdfjs-dist/legacy/build/pdf.js');
pdfjsLib.GlobalWorkerOptions.workerSrc = '';

async function debugPdf() {
  const pdfPath = 'C:\\Users\\kusum\\Downloads\\Sistem Informasi Pemerintahan Daerah - Penatausahaan.pdf';
  const pdfBuffer = fs.readFileSync(pdfPath);
  const uint8Array = new Uint8Array(pdfBuffer);
  const pdf = await (pdfjsLib.getDocument({ data: uint8Array })).promise;

  console.log(`Total pages: ${pdf.numPages}`);

  // Scan all pages, join split lines, look for puskesmas headers
  let totalPuskesmas = 0;
  let totalKegiatan = 0;

  for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
    const page = await pdf.getPage(pageNum);
    const textContent = await page.getTextContent();
    const textItems = textContent.items as Array<{ str: string; transform: number[] }>;

    textItems.sort((a: any, b: any) => {
      const yDiff = b.transform[5] - a.transform[5];
      if (Math.abs(yDiff) > 5) return yDiff;
      return a.transform[4] - b.transform[4];
    });

    const rawLines: string[] = [];
    let currentLine: string[] = [];
    let currentY = textItems.length > 0 ? textItems[0].transform[5] : 0;

    for (const item of textItems) {
      const y = item.transform[5];
      if (Math.abs(y - currentY) > 5) {
        if (currentLine.length > 0) rawLines.push(currentLine.join(' ').trim());
        currentLine = [item.str];
        currentY = y;
      } else {
        currentLine.push(item.str);
      }
    }
    if (currentLine.length > 0) rawLines.push(currentLine.join(' ').trim());

    // JOIN SPLIT LINES: If a line ends with "." and the next starts with digits, join them
    const joinedLines: string[] = [];
    for (let i = 0; i < rawLines.length; i++) {
      let line = rawLines[i];

      // Check if next line starts with digits that complete a split kode
      // Pattern: current line has partial kode ending in "." or digit
      // Next line starts with "0" or digits that complete it
      while (i + 1 < rawLines.length) {
        const nextLine = rawLines[i + 1];

        // Case 1: kode split - "1.02.0.00.0.0" + "0.01.0000" -> "1.02.0.00.0.00.01.0000"
        // Case 2: kode split - "1.02.02.2.02." + "0001 Uraian..." -> "1.02.02.2.02.0001 Uraian..."
        if (/\d\.\d*$/.test(line) && /^\d/.test(nextLine)) {
          line = line + nextLine;
          i++;
        } else if (/\.$/.test(line) && /^\d/.test(nextLine)) {
          line = line + nextLine;
          i++;
        } else {
          break;
        }
      }

      joinedLines.push(line);
    }

    // Now check for patterns
    const PUSKESMAS_PATTERN = /^(1\.02\.0\.00\.0\.00\.\d+\.\d+)\s+(?:(Puskesmas|Puskemas)\s+)?([A-Za-z][A-Za-z\s]*?)(?:\s+\d|$)/i;
    const KEGIATAN_PATTERN = /^(1\.\d+\.\d+\.\d+\.\d+\.\d+)\s+(.+?)(\d{1,3}(?:\.\d{3})*(?:,\d{2})?(?:\s+|$))/;

    for (const line of joinedLines) {
      const pm = line.match(PUSKESMAS_PATTERN);
      if (pm) {
        totalPuskesmas++;
        console.log(`Page ${pageNum}: [PUSKESMAS] kode=${pm[1]} nama="${pm[3].trim()}"`);
      }

      const km = line.match(KEGIATAN_PATTERN);
      if (km) {
        totalKegiatan++;
      }
    }
  }

  console.log(`\nTotal Puskesmas found: ${totalPuskesmas}`);
  console.log(`Total Kegiatan found: ${totalKegiatan}`);
}

debugPdf().catch(console.error);
