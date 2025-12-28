"use strict";
/**
 * Angkas PDF Parser Service
 *
 * Parses ANGGARAN KAS SKPD PDF files and extracts monthly budget data
 * per puskesmas and per kegiatan/sub-kegiatan
 *
 * Sumber Anggaran dideteksi dari kode rekening pendek (3 karakter seperti "4.1")
 * yang merupakan header sumber anggaran, data di bawahnya akan menggunakan
 * sumber anggaran tersebut.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.parseAngkasPdf = parseAngkasPdf;
exports.parseAngkasPdfSimple = parseAngkasPdfSimple;
exports.findBestMatch = findBestMatch;
exports.findPuskesmasUser = findPuskesmasUser;
// Use legacy build for Node.js compatibility
const pdfjsLib = require('pdfjs-dist/legacy/build/pdf.js');
// Pattern to match Puskesmas header line
// Example: "1.02.0.00.0.00.01.0010   Puskesmas Jasinga"
const PUSKESMAS_PATTERN = /^(1\.02\.0\.00\.0\.00\.\d+\.\d+)\s+(Puskesmas\s+.+)$/i;
// Pattern to match sub-kegiatan lines (budget items)
// Example: "1.02.02.2.02.0033   Operasional Pelayanan Puskesmas   476.605.756,00   476.605.756,00   ..."
const KEGIATAN_PATTERN = /^(1\.\d+\.\d+\.\d+\.\d+\.\d+)\s+(.+?)(\d{1,3}(?:\.\d{3})*(?:,\d{2})?(?:\s+|$))/;
// Pattern to match Sumber Anggaran header lines (short code like "4.1" or "4.2")
// Example: "4.1   Pendapatan Asli Daerah"
// Example: "4.2   Transfer"
const SUMBER_ANGGARAN_PATTERN = /^(\d\.\d)\s+(.+?)(?:\s+\d{1,3}(?:\.\d{3})*(?:,\d{2})?|$)/;
// Pattern to parse currency values (Indonesian format: 1.234.567,89)
const CURRENCY_PATTERN = /(\d{1,3}(?:\.\d{3})*(?:,\d{2})?)/g;
/**
 * Parse Indonesian currency format to number
 * Example: "476.605.756,00" -> 476605756.00
 */
function parseCurrency(value) {
    if (!value)
        return 0;
    // Remove thousand separators (.) and convert decimal separator (,) to (.)
    const normalized = value.replace(/\./g, '').replace(',', '.');
    return parseFloat(normalized) || 0;
}
/**
 * Extract all currency values from a line
 */
function extractCurrencyValues(line) {
    const matches = line.match(CURRENCY_PATTERN);
    if (!matches)
        return [];
    return matches.map(parseCurrency);
}
/**
 * Extract year from PDF content
 * Looks for patterns like "TAHUN 2025" or "ANGGARAN 2025"
 */
function extractYear(text) {
    const yearMatch = text.match(/(?:TAHUN|ANGGARAN)\s*(\d{4})/i);
    if (yearMatch) {
        return parseInt(yearMatch[1], 10);
    }
    // Default to current year if not found
    return new Date().getFullYear();
}
/**
 * Clean and normalize text from PDF
 */
function cleanText(text) {
    return text
        .replace(/\r\n/g, '\n')
        .replace(/\r/g, '\n')
        .replace(/\t/g, ' ')
        .replace(/ +/g, ' ')
        .trim();
}
/**
 * Parse a single page's text content
 * Tracks current sumber anggaran from short code headers
 */
function parsePage(pageText, currentPuskesmas, currentSumberAnggaran) {
    const lines = pageText.split('\n').map(l => l.trim()).filter(l => l);
    const rows = [];
    let puskesmas = currentPuskesmas;
    let sumberAnggaran = currentSumberAnggaran;
    const detectedSumberAnggaran = [];
    for (const line of lines) {
        // Check if this is a Puskesmas header
        const puskesmasMatch = line.match(PUSKESMAS_PATTERN);
        if (puskesmasMatch) {
            puskesmas = {
                kodePuskesmas: puskesmasMatch[1],
                namaPuskesmas: puskesmasMatch[2].trim(),
                rows: [],
            };
            continue;
        }
        // Check if this is a Sumber Anggaran header (short code like "4.1")
        const sumberMatch = line.match(SUMBER_ANGGARAN_PATTERN);
        if (sumberMatch) {
            const kode = sumberMatch[1];
            const nama = sumberMatch[2].trim();
            sumberAnggaran = { kode, nama };
            detectedSumberAnggaran.push({ kode, nama });
            console.log(`📋 Detected Sumber Anggaran: ${kode} - ${nama}`);
            continue;
        }
        // Check if this is a kegiatan/sub-kegiatan line
        const kegiatanMatch = line.match(KEGIATAN_PATTERN);
        if (kegiatanMatch && puskesmas) {
            const kodeRekening = kegiatanMatch[1];
            const uraian = kegiatanMatch[2].trim();
            const values = extractCurrencyValues(line);
            // Expected structure: Jumlah Anggaran, Jumlah RAK, Jan, Feb, Mar, Apr, Mei, Jun, Jul, Aug, Sep, Okt, Nov, Des
            // Minimum 14 values expected
            if (values.length >= 14) {
                const row = {
                    kodeRekening,
                    uraian,
                    jumlahAnggaran: values[0],
                    jumlahRak: values[1],
                    bulanan: values.slice(2, 14), // Jan to Dec
                    sumberAnggaranKode: sumberAnggaran?.kode || null,
                    sumberAnggaranNama: sumberAnggaran?.nama || null,
                };
                rows.push(row);
            }
            else if (values.length >= 2) {
                // Sometimes monthly values may be on next lines, store partial data
                const row = {
                    kodeRekening,
                    uraian,
                    jumlahAnggaran: values[0],
                    jumlahRak: values[1] || 0,
                    bulanan: values.slice(2).concat(Array(12 - Math.max(0, values.length - 2)).fill(0)),
                    sumberAnggaranKode: sumberAnggaran?.kode || null,
                    sumberAnggaranNama: sumberAnggaran?.nama || null,
                };
                rows.push(row);
            }
        }
    }
    return { puskesmas, rows, sumberAnggaran, detectedSumberAnggaran };
}
/**
 * Main function to parse Angkas PDF buffer
 */
async function parseAngkasPdf(pdfBuffer) {
    // Load the PDF document
    const loadingTask = pdfjsLib.getDocument({ data: pdfBuffer });
    const pdf = await loadingTask.promise;
    const numPages = pdf.numPages;
    let fullText = '';
    const puskesmasMap = new Map();
    let currentPuskesmas = null;
    let currentSumberAnggaran = null;
    const allDetectedSumberAnggaran = new Map();
    // Extract text from all pages
    for (let pageNum = 1; pageNum <= numPages; pageNum++) {
        const page = await pdf.getPage(pageNum);
        const textContent = await page.getTextContent();
        // Reconstruct text with positions for better accuracy
        const textItems = textContent.items;
        // Sort by vertical position (y) descending, then horizontal (x) ascending
        textItems.sort((a, b) => {
            const yDiff = b.transform[5] - a.transform[5];
            if (Math.abs(yDiff) > 5)
                return yDiff;
            return a.transform[4] - b.transform[4];
        });
        // Group items into lines based on y-position
        const lines = [];
        let currentLine = [];
        let currentY = textItems.length > 0 ? textItems[0].transform[5] : 0;
        for (const item of textItems) {
            const y = item.transform[5];
            if (Math.abs(y - currentY) > 5) {
                if (currentLine.length > 0) {
                    lines.push(currentLine);
                }
                currentLine = [item.str];
                currentY = y;
            }
            else {
                currentLine.push(item.str);
            }
        }
        if (currentLine.length > 0) {
            lines.push(currentLine);
        }
        const pageText = lines.map(line => line.join(' ')).join('\n');
        fullText += pageText + '\n';
        // Parse this page
        const { puskesmas, rows, sumberAnggaran, detectedSumberAnggaran } = parsePage(pageText, currentPuskesmas, currentSumberAnggaran);
        // Track detected sumber anggaran
        for (const sa of detectedSumberAnggaran) {
            allDetectedSumberAnggaran.set(sa.kode, sa);
        }
        // Update current sumber anggaran for next page
        if (sumberAnggaran) {
            currentSumberAnggaran = sumberAnggaran;
        }
        if (puskesmas && puskesmas !== currentPuskesmas) {
            currentPuskesmas = puskesmas;
            if (!puskesmasMap.has(puskesmas.kodePuskesmas)) {
                puskesmasMap.set(puskesmas.kodePuskesmas, puskesmas);
            }
        }
        // Add rows to current puskesmas
        if (currentPuskesmas && rows.length > 0) {
            const existing = puskesmasMap.get(currentPuskesmas.kodePuskesmas);
            if (existing) {
                existing.rows.push(...rows);
            }
        }
    }
    // Extract year from full text
    const tahun = extractYear(fullText);
    return {
        tahun,
        puskesmasList: Array.from(puskesmasMap.values()),
        detectedSumberAnggaran: Array.from(allDetectedSumberAnggaran.values()),
    };
}
/**
 * Alternative parsing approach using raw text extraction
 * More reliable for PDFs with complex layouts
 */
async function parseAngkasPdfSimple(pdfBuffer) {
    const loadingTask = pdfjsLib.getDocument({ data: pdfBuffer });
    const pdf = await loadingTask.promise;
    const numPages = pdf.numPages;
    let fullText = '';
    // Extract all text first
    for (let pageNum = 1; pageNum <= numPages; pageNum++) {
        const page = await pdf.getPage(pageNum);
        const textContent = await page.getTextContent();
        const pageText = textContent.items.map((item) => item.str).join(' ');
        fullText += pageText + '\n';
    }
    const cleanedText = cleanText(fullText);
    const tahun = extractYear(cleanedText);
    // Find all Puskesmas sections
    const puskesmasMap = new Map();
    const puskesmasMatches = cleanedText.matchAll(new RegExp(PUSKESMAS_PATTERN, 'gi'));
    for (const match of puskesmasMatches) {
        const kodePuskesmas = match[1];
        const namaPuskesmas = match[2].trim();
        if (!puskesmasMap.has(kodePuskesmas)) {
            puskesmasMap.set(kodePuskesmas, {
                kodePuskesmas,
                namaPuskesmas,
                rows: [],
            });
        }
    }
    return {
        tahun,
        puskesmasList: Array.from(puskesmasMap.values()),
        detectedSumberAnggaran: [], // Simple parser doesn't detect sumber anggaran
    };
}
/**
 * Match parsed uraian to sub_kegiatan.nama using fuzzy matching
 */
function findBestMatch(uraian, subKegiatanList) {
    const normalizedUraian = uraian.toLowerCase().trim();
    // Try exact match first
    const exactMatch = subKegiatanList.find(sk => sk.nama.toLowerCase().trim() === normalizedUraian);
    if (exactMatch)
        return exactMatch.id;
    // Try contains match
    const containsMatch = subKegiatanList.find(sk => normalizedUraian.includes(sk.nama.toLowerCase().trim()) ||
        sk.nama.toLowerCase().trim().includes(normalizedUraian));
    if (containsMatch)
        return containsMatch.id;
    // Try word-based similarity
    const uraianWords = normalizedUraian.split(/\s+/);
    let bestMatch = null;
    for (const sk of subKegiatanList) {
        const skWords = sk.nama.toLowerCase().trim().split(/\s+/);
        const matchingWords = uraianWords.filter(word => skWords.some(skWord => skWord.includes(word) || word.includes(skWord)));
        const score = matchingWords.length / Math.max(uraianWords.length, skWords.length);
        if (score > 0.5 && (!bestMatch || score > bestMatch.score)) {
            bestMatch = { id: sk.id, score };
        }
    }
    return bestMatch?.id || null;
}
/**
 * Match puskesmas name to user
 */
function findPuskesmasUser(namaPuskesmas, users) {
    const normalizedName = namaPuskesmas.toLowerCase().replace('puskesmas', '').trim();
    // Try to find matching user by nama or username
    const match = users.find(user => {
        const userName = user.nama.toLowerCase().replace('puskesmas', '').trim();
        const userUsername = user.username.toLowerCase();
        return userName.includes(normalizedName) ||
            normalizedName.includes(userName) ||
            userUsername.includes(normalizedName) ||
            normalizedName.includes(userUsername);
    });
    return match?.id || null;
}
//# sourceMappingURL=angkasParserService.js.map