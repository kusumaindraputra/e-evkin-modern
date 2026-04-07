/**
 * Debug v5 - check what joined lines look like for a specific puskesmas page
 */
import fs from 'fs';

const pdfjsLib = require('pdfjs-dist/legacy/build/pdf.js');
pdfjsLib.GlobalWorkerOptions.workerSrc = '';

async function main() {
  const pdfPath = 'C:\\Users\\kusum\\Downloads\\Sistem Informasi Pemerintahan Daerah - Penatausahaan.pdf';
  const pdfBuffer = fs.readFileSync(pdfPath);
  const uint8Array = new Uint8Array(pdfBuffer);
  const pdf = await (pdfjsLib.getDocument({ data: uint8Array })).promise;

  // Check a page where we know a puskesmas with data should be (page 27 had Leuwiliang kegiatan data)
  // Let's also find Bojonggede
  for (let pageNum = 15; pageNum <= 20; pageNum++) {
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

    // Show lines with puskesmas-related content
    const hasRelevant = rawLines.some(l => l.includes('0.00.0.0') || l.toLowerCase().includes('puskesmas') || l.toLowerCase().includes('bojonggede') || l.toLowerCase().includes('cibinong'));
    if (!hasRelevant) continue;

    console.log(`\n=== PAGE ${pageNum} ===`);
    for (let i = 0; i < rawLines.length; i++) {
      const line = rawLines[i];
      // Show lines with kode patterns, especially around puskesmas headers and sub-kegiatan
      if (line.includes('1.02') || line.match(/^\d{4}\b/) || line.toLowerCase().includes('puskesmas') || line.toLowerCase().includes('bojonggede') || line.toLowerCase().includes('cibinong') || line.match(/^4\.\d/)) {
        console.log(`  ${i.toString().padStart(3)}: ${line.substring(0, 140)}`);
      }
    }
  }

  // Also scan for Bojonggede specifically
  console.log('\n\n=== SCANNING FOR BOJONGGEDE ===');
  for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
    const page = await pdf.getPage(pageNum);
    const textContent = await page.getTextContent();
    const text = textContent.items.map((item: any) => item.str).join(' ');
    if (text.toLowerCase().includes('bojonggede')) {
      console.log(`Found "bojonggede" on page ${pageNum}`);
      // Dump the page
      const textItems = textContent.items as Array<{ str: string; transform: number[] }>;
      textItems.sort((a: any, b: any) => {
        const yDiff = b.transform[5] - a.transform[5];
        if (Math.abs(yDiff) > 5) return yDiff;
        return a.transform[4] - b.transform[4];
      });

      const rawLines2: string[] = [];
      let cl2: string[] = [];
      let cy2 = textItems.length > 0 ? textItems[0].transform[5] : 0;
      for (const item of textItems) {
        const y = item.transform[5];
        if (Math.abs(y - cy2) > 5) {
          if (cl2.length > 0) rawLines2.push(cl2.join(' ').trim());
          cl2 = [item.str];
          cy2 = y;
        } else {
          cl2.push(item.str);
        }
      }
      if (cl2.length > 0) rawLines2.push(cl2.join(' ').trim());

      for (let i = 0; i < rawLines2.length; i++) {
        console.log(`  ${i.toString().padStart(3)}: ${rawLines2[i].substring(0, 140)}`);
      }
      break; // Only show first occurrence
    }
  }
}

main().catch(console.error);
