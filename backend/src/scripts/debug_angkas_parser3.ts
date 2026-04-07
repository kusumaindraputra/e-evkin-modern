/**
 * Debug script v3 - dump raw lines from pages that should have puskesmas data
 */
import fs from 'fs';

const pdfjsLib = require('pdfjs-dist/legacy/build/pdf.js');
pdfjsLib.GlobalWorkerOptions.workerSrc = '';

async function debugPdf() {
  const pdfPath = 'C:\\Users\\kusum\\Downloads\\Sistem Informasi Pemerintahan Daerah - Penatausahaan.pdf';
  const pdfBuffer = fs.readFileSync(pdfPath);
  const uint8Array = new Uint8Array(pdfBuffer);
  const pdf = await (pdfjsLib.getDocument({ data: uint8Array })).promise;

  // From previous analysis, puskesmas sub-units start around page 10-11
  // where "1.02.0.00.0.00.01.XXXX" codes appear
  // Let's check pages 10-15 and dump ALL lines to see the actual format

  for (let pageNum = 10; pageNum <= 15; pageNum++) {
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

    console.log(`\n=== PAGE ${pageNum} (${rawLines.length} lines) ===`);

    // Print ALL lines, marking lines that contain patterns of interest
    for (let i = 0; i < rawLines.length; i++) {
      const line = rawLines[i];
      let marker = '';

      if (line.match(/1\.02\.0\.00/)) marker += ' [SUB-UNIT?]';
      if (line.match(/puskesmas|puskemas/i)) marker += ' [PUSKESMAS?]';
      if (line.match(/^1\.02\.\d+\.\d+\.\d+\./)) marker += ' [PARTIAL-KODE]';
      if (line.match(/^\d{4}\s/)) marker += ' [KODE-TAIL?]';
      if (line.match(/^0\d{3}\s/)) marker += ' [KODE-TAIL?]';
      if (line.match(/^0\d{3}$/)) marker += ' [KODE-TAIL?]';

      console.log(`  ${i.toString().padStart(3)}: ${line.substring(0, 130)}${marker}`);
    }
  }

  // Also check pages where we know from Python extraction that specific puskesmas should be
  // Leuwiliang was around page 27-28, let's check
  console.log('\n\n=== CHECKING PAGES 11-13 for first puskesmas sub-units ===');

  for (let pageNum = 11; pageNum <= 13; pageNum++) {
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

    console.log(`\n=== PAGE ${pageNum} (${rawLines.length} lines) ===`);
    for (let i = 0; i < rawLines.length; i++) {
      const line = rawLines[i];
      if (line.match(/1\.02\.0\.00|puskesmas|puskemas|0\.01\./i) || line.match(/^\d{4}$/)) {
        console.log(`  ${i.toString().padStart(3)}: ${line.substring(0, 150)}`);
      }
    }
  }
}

debugPdf().catch(console.error);
