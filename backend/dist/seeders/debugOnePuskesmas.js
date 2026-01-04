"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * Debug one puskesmas PDF parsing in detail
 */
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const pdfjsLib = require('pdfjs-dist/legacy/build/pdf.js');
const PUSKESMAS_PATTERN = /^(1\.02\.0\.00\.0\.00\.\d+\.\d+)\s+(?:(Puskesmas|Puskemas)\s+)?([A-Za-z][A-Za-z\s]*?)(?:\s+\d|$)/i;
const KEGIATAN_PATTERN = /^(1\.\d+\.\d+\.\d+\.\d+\.\d+)\s+(.+?)(\d{1,3}(?:\.\d{3})*(?:,\d{2})?(?:\s+|$))/;
const CURRENCY_PATTERN = /(\d{1,3}(?:\.\d{3})*,\d{2})/g;
// Target: Puskesmas Nanggung (0013) - has 0 rows but exists in PDF
const TARGET_KODE = '1.02.0.00.0.00.01.0013';
async function debugOnePuskesmas() {
    const pdfPath = path_1.default.join(__dirname, '../../../docs/Angkas Parsial 3 tahun 2025.pdf');
    const pdfBuffer = fs_1.default.readFileSync(pdfPath);
    const uint8Array = new Uint8Array(pdfBuffer);
    const loadingTask = pdfjsLib.getDocument({ data: uint8Array });
    const pdf = await loadingTask.promise;
    const numPages = pdf.numPages;
    console.log(`Total pages: ${numPages}`);
    let foundPage = -1;
    let pageText = '';
    // Find the page containing Nanggung
    for (let pageNum = 1; pageNum <= numPages; pageNum++) {
        const page = await pdf.getPage(pageNum);
        const textContent = await page.getTextContent();
        // Reconstruct text with positions
        const textItems = textContent.items;
        textItems.sort((a, b) => {
            const yDiff = b.transform[5] - a.transform[5];
            if (Math.abs(yDiff) > 5)
                return yDiff;
            return a.transform[4] - b.transform[4];
        });
        const lines = [];
        let currentLine = [];
        let currentY = textItems.length > 0 ? textItems[0].transform[5] : 0;
        for (const item of textItems) {
            const y = item.transform[5];
            if (Math.abs(y - currentY) > 5) {
                if (currentLine.length > 0)
                    lines.push(currentLine);
                currentLine = [item.str];
                currentY = y;
            }
            else {
                currentLine.push(item.str);
            }
        }
        if (currentLine.length > 0)
            lines.push(currentLine);
        const text = lines.map(line => line.join(' ')).join('\n');
        if (text.includes(TARGET_KODE) || text.toLowerCase().includes('nanggung')) {
            foundPage = pageNum;
            pageText = text;
            break;
        }
    }
    if (foundPage === -1) {
        console.log('Puskesmas not found in any page!');
        return;
    }
    console.log(`\n=== Found on Page ${foundPage} ===`);
    // Check pages around Nanggung
    console.log(`\n=== CHECKING PAGES 19-22 ===`);
    for (let pageNum = 19; pageNum <= 22; pageNum++) {
        const page = await pdf.getPage(pageNum);
        const textContent = await page.getTextContent();
        // Reconstruct text with positions
        const textItems = textContent.items;
        textItems.sort((a, b) => {
            const yDiff = b.transform[5] - a.transform[5];
            if (Math.abs(yDiff) > 5)
                return yDiff;
            return a.transform[4] - b.transform[4];
        });
        const lines = [];
        let currentLine = [];
        let currentY = textItems.length > 0 ? textItems[0].transform[5] : 0;
        for (const item of textItems) {
            const y = item.transform[5];
            if (Math.abs(y - currentY) > 5) {
                if (currentLine.length > 0)
                    lines.push(currentLine);
                currentLine = [item.str];
                currentY = y;
            }
            else {
                currentLine.push(item.str);
            }
        }
        if (currentLine.length > 0)
            lines.push(currentLine);
        const pageLines = lines.map(line => line.join(' '));
        console.log(`\n--- PAGE ${pageNum} ---`);
        // Show puskesmas headers and kegiatan
        for (let i = 0; i < pageLines.length; i++) {
            const line = pageLines[i].trim();
            if (!line)
                continue;
            const puskesmasMatch = line.match(PUSKESMAS_PATTERN);
            if (puskesmasMatch) {
                console.log(`[${i}] PUSKESMAS: ${puskesmasMatch[1]} - ${puskesmasMatch[3]}`);
            }
            const kegiatanMatch = line.match(KEGIATAN_PATTERN);
            if (kegiatanMatch) {
                const values = line.match(CURRENCY_PATTERN);
                console.log(`[${i}] KEGIATAN: ${kegiatanMatch[1]} (${values?.length || 0} values)`);
            }
        }
    }
    console.log('\n--- ANALYZING LINES ---');
    const lines = pageText.split('\n').map(l => l.trim()).filter(l => l);
    let inNanggung = false;
    let lineCount = 0;
    for (const line of lines) {
        // Check for Puskesmas header
        const puskesmasMatch = line.match(PUSKESMAS_PATTERN);
        if (puskesmasMatch) {
            if (puskesmasMatch[1] === TARGET_KODE) {
                console.log('\n>>> FOUND NANGGUNG HEADER <<<');
                console.log('Line:', line);
                inNanggung = true;
                lineCount = 0;
            }
            else if (inNanggung) {
                console.log(`\n>>> NEXT PUSKESMAS (${puskesmasMatch[1]}) - Ending Nanggung section <<<`);
                break;
            }
        }
        if (inNanggung && lineCount < 50) {
            lineCount++;
            // Test kegiatan pattern
            const kegiatanMatch = line.match(KEGIATAN_PATTERN);
            if (kegiatanMatch) {
                console.log(`\n[${lineCount}] KEGIATAN FOUND:`);
                console.log('  Line:', line.substring(0, 120));
                console.log('  Kode:', kegiatanMatch[1]);
                console.log('  Uraian:', kegiatanMatch[2]);
                // Extract currency values
                const values = line.match(CURRENCY_PATTERN);
                console.log('  Values count:', values?.length || 0);
            }
        }
    }
}
debugOnePuskesmas().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });
//# sourceMappingURL=debugOnePuskesmas.js.map