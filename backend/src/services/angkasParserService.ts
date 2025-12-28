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

// Use legacy build for Node.js compatibility
const pdfjsLib = require('pdfjs-dist/legacy/build/pdf.js');

export interface AngkasRow {
  kodeRekening: string;
  uraian: string;
  jumlahAnggaran: number;
  jumlahRak: number;
  bulanan: number[]; // Index 0 = Januari, ..., 11 = Desember
  sumberAnggaranKode: string | null; // Kode sumber anggaran dari PDF (e.g., "4.1")
  sumberAnggaranNama: string | null; // Nama sumber anggaran dari PDF (e.g., "Pendapatan Asli Daerah")
}

export interface PuskesmasAngkas {
  kodePuskesmas: string;
  namaPuskesmas: string;
  rows: AngkasRow[];
}

export interface ParsedAngkas {
  tahun: number;
  puskesmasList: PuskesmasAngkas[];
  detectedSumberAnggaran: Array<{ kode: string; nama: string }>; // List sumber anggaran yang ditemukan
}

// Pattern to match Puskesmas header line
// Example: "1.02.0.00.0.00.01.0010   Puskesmas Jasinga   5.975.916.762,00..."
// We capture only the name part (text before numbers)
const PUSKESMAS_PATTERN = /^(1\.02\.0\.00\.0\.00\.\d+\.\d+)\s+(Puskesmas\s+[A-Za-z\s]+)/i;

// Pattern to match sub-kegiatan lines (budget items)
// Example: "1.02.02.2.02.0033   Operasional Pelayanan Puskesmas   476.605.756,00   476.605.756,00   ..."
const KEGIATAN_PATTERN = /^(1\.\d+\.\d+\.\d+\.\d+\.\d+)\s+(.+?)(\d{1,3}(?:\.\d{3})*(?:,\d{2})?(?:\s+|$))/;

// Pattern to match Sumber Anggaran header lines (short code like "4.1" or "4.2")
// Example: "4.1   Pendapatan Asli Daerah"
// Example: "4.2   Transfer"
const SUMBER_ANGGARAN_PATTERN = /^(\d\.\d)\s+(.+?)(?:\s+\d{1,3}(?:\.\d{3})*(?:,\d{2})?|$)/;

// Pattern to parse currency values (Indonesian format: 1.234.567,89)
// MUST end with ,XX (decimal) to avoid matching kode rekening like 1.02.01.2.10.0001
// Also matches 0,00 for zero values
const CURRENCY_PATTERN = /(\d{1,3}(?:\.\d{3})*,\d{2})/g;

/**
 * Parse Indonesian currency format to number
 * Example: "476.605.756,00" -> 476605756.00
 */
function parseCurrency(value: string): number {
  if (!value) return 0;
  // Remove thousand separators (.) and convert decimal separator (,) to (.)
  const normalized = value.replace(/\./g, '').replace(',', '.');
  return parseFloat(normalized) || 0;
}

/**
 * Extract all currency values from a line
 * First removes the kode rekening part, then extracts currency values
 */
function extractCurrencyValues(line: string): number[] {
  // Remove kode rekening at the start (e.g., "1.02.01.2.10.0001")
  const withoutKode = line.replace(/^[\d.]+\s+/, '');
  const matches = withoutKode.match(CURRENCY_PATTERN);
  if (!matches) return [];
  return matches.map(parseCurrency);
}

/**
 * Extract year from PDF content
 * Looks for patterns like "TAHUN 2025" or "ANGGARAN 2025"
 */
function extractYear(text: string): number {
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
function cleanText(text: string): string {
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
function parsePage(
  pageText: string, 
  currentPuskesmas: PuskesmasAngkas | null,
  currentSumberAnggaran: { kode: string; nama: string } | null
): {
  puskesmas: PuskesmasAngkas | null;
  rows: AngkasRow[];
  sumberAnggaran: { kode: string; nama: string } | null;
  detectedSumberAnggaran: Array<{ kode: string; nama: string }>;
} {
  const lines = pageText.split('\n').map(l => l.trim()).filter(l => l);
  const rows: AngkasRow[] = [];
  let puskesmas = currentPuskesmas;
  let sumberAnggaran = currentSumberAnggaran;
  const detectedSumberAnggaran: Array<{ kode: string; nama: string }> = [];

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
        const row: AngkasRow = {
          kodeRekening,
          uraian,
          jumlahAnggaran: values[0],
          jumlahRak: values[1],
          bulanan: values.slice(2, 14), // Jan to Dec
          sumberAnggaranKode: sumberAnggaran?.kode || null,
          sumberAnggaranNama: sumberAnggaran?.nama || null,
        };
        rows.push(row);
      } else if (values.length >= 2) {
        // Sometimes monthly values may be on next lines, store partial data
        const row: AngkasRow = {
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
export async function parseAngkasPdf(pdfBuffer: Buffer): Promise<ParsedAngkas> {
  // Load the PDF document - convert Buffer to Uint8Array for pdfjs-dist v3+
  const uint8Array = new Uint8Array(pdfBuffer);
  const loadingTask = pdfjsLib.getDocument({ data: uint8Array });
  const pdf = await loadingTask.promise;

  const numPages = pdf.numPages;
  let fullText = '';
  const puskesmasMap = new Map<string, PuskesmasAngkas>();
  let currentPuskesmas: PuskesmasAngkas | null = null;
  let currentSumberAnggaran: { kode: string; nama: string } | null = null;
  const allDetectedSumberAnggaran = new Map<string, { kode: string; nama: string }>();

  // Extract text from all pages
  for (let pageNum = 1; pageNum <= numPages; pageNum++) {
    const page = await pdf.getPage(pageNum);
    const textContent = await page.getTextContent();
    
    // Reconstruct text with positions for better accuracy
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
    let currentY = textItems.length > 0 ? textItems[0].transform[5] : 0;

    for (const item of textItems) {
      const y = item.transform[5];
      if (Math.abs(y - currentY) > 5) {
        if (currentLine.length > 0) {
          lines.push(currentLine);
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

    const pageText = lines.map(line => line.join(' ')).join('\n');
    fullText += pageText + '\n';

    // Parse this page
    const { puskesmas, rows, sumberAnggaran, detectedSumberAnggaran } = parsePage(
      pageText, 
      currentPuskesmas,
      currentSumberAnggaran
    );
    
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
export async function parseAngkasPdfSimple(pdfBuffer: Buffer): Promise<ParsedAngkas> {
  // Convert Buffer to Uint8Array for pdfjs-dist v3+
  const uint8Array = new Uint8Array(pdfBuffer);
  const loadingTask = pdfjsLib.getDocument({ data: uint8Array });
  const pdf = await loadingTask.promise;

  const numPages = pdf.numPages;
  let fullText = '';

  // Extract all text first
  for (let pageNum = 1; pageNum <= numPages; pageNum++) {
    const page = await pdf.getPage(pageNum);
    const textContent = await page.getTextContent();
    const pageText = textContent.items.map((item: { str: string }) => item.str).join(' ');
    fullText += pageText + '\n';
  }

  const cleanedText = cleanText(fullText);
  const tahun = extractYear(cleanedText);

  // Find all Puskesmas sections
  const puskesmasMap = new Map<string, PuskesmasAngkas>();
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
export function findBestMatch(uraian: string, subKegiatanList: Array<{ id: number; nama: string }>): number | null {
  const normalizedUraian = uraian.toLowerCase().trim();
  
  // Try exact match first
  const exactMatch = subKegiatanList.find(
    sk => sk.nama.toLowerCase().trim() === normalizedUraian
  );
  if (exactMatch) return exactMatch.id;

  // Try contains match
  const containsMatch = subKegiatanList.find(
    sk => normalizedUraian.includes(sk.nama.toLowerCase().trim()) ||
          sk.nama.toLowerCase().trim().includes(normalizedUraian)
  );
  if (containsMatch) return containsMatch.id;

  // Try word-based similarity
  const uraianWords = normalizedUraian.split(/\s+/);
  let bestMatch: { id: number; score: number } | null = null;

  for (const sk of subKegiatanList) {
    const skWords = sk.nama.toLowerCase().trim().split(/\s+/);
    const matchingWords = uraianWords.filter(word => 
      skWords.some(skWord => skWord.includes(word) || word.includes(skWord))
    );
    const score = matchingWords.length / Math.max(uraianWords.length, skWords.length);
    
    if (score > 0.5 && (!bestMatch || score > bestMatch.score)) {
      bestMatch = { id: sk.id, score };
    }
  }

  return bestMatch?.id || null;
}

/**
 * Normalize puskesmas name by removing "puskesmas", numbers, and extra spaces
 * Example: "Puskesmas Lebak Wangi   123,456" -> "lebakwangi"
 */
function normalizePuskesmasName(name: string): string {
  return name
    .toLowerCase()
    .replace(/puskesmas/gi, '')  // Remove "puskesmas"
    .replace(/[\d.,]+/g, '')     // Remove numbers, dots, commas (budget values)
    .replace(/\s+/g, '')         // Remove ALL spaces (handles "Lebak Wangi" vs "Lebakwangi")
    .trim();
}

/**
 * Calculate similarity between two strings (Levenshtein distance based)
 */
function calculateSimilarity(str1: string, str2: string): number {
  const len1 = str1.length;
  const len2 = str2.length;
  
  if (len1 === 0) return len2 === 0 ? 1 : 0;
  if (len2 === 0) return 0;
  
  // Quick exact match
  if (str1 === str2) return 1;
  
  // Quick contains check
  if (str1.includes(str2) || str2.includes(str1)) return 0.9;
  
  // Levenshtein distance
  const matrix: number[][] = [];
  
  for (let i = 0; i <= len1; i++) {
    matrix[i] = [i];
  }
  for (let j = 0; j <= len2; j++) {
    matrix[0][j] = j;
  }
  
  for (let i = 1; i <= len1; i++) {
    for (let j = 1; j <= len2; j++) {
      const cost = str1[i - 1] === str2[j - 1] ? 0 : 1;
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1,      // deletion
        matrix[i][j - 1] + 1,      // insertion
        matrix[i - 1][j - 1] + cost // substitution
      );
    }
  }
  
  const distance = matrix[len1][len2];
  const maxLen = Math.max(len1, len2);
  return 1 - (distance / maxLen);
}

/**
 * Known aliases for puskesmas names (typos, variations)
 * Key = normalized PDF name, Value = normalized DB name
 */
const PUSKESMAS_ALIASES: Record<string, string> = {
  // Add known typos/variations here
  // Example: 'lebakwangii': 'lebakwangi',
};

/**
 * Match puskesmas name to user with fuzzy matching
 */
export function findPuskesmasUser(
  namaPuskesmas: string, 
  users: Array<{ id: string; nama: string; username: string }>
): string | null {
  const normalizedName = normalizePuskesmasName(namaPuskesmas);
  
  // Check alias table first
  const aliasedName = PUSKESMAS_ALIASES[normalizedName] || normalizedName;
  
  let bestMatch: { user: typeof users[0]; score: number } | null = null;
  
  for (const user of users) {
    const userName = normalizePuskesmasName(user.nama);
    const userUsername = user.username.toLowerCase().replace(/\s+/g, '');
    
    // Calculate similarity scores
    const nameScore = calculateSimilarity(aliasedName, userName);
    const usernameScore = calculateSimilarity(aliasedName, userUsername);
    const maxScore = Math.max(nameScore, usernameScore);
    
    if (maxScore > 0.85 && (!bestMatch || maxScore > bestMatch.score)) {
      bestMatch = { user, score: maxScore };
    }
  }

  if (bestMatch) {
    // Log low-confidence matches for debugging
    if (bestMatch.score < 0.95) {
      console.log(`🔍 Fuzzy match: "${namaPuskesmas}" → "${bestMatch.user.nama}" (score: ${bestMatch.score.toFixed(2)})`);
    }
    return bestMatch.user.id;
  }
  
  console.log(`❌ No match for: "${namaPuskesmas}" (normalized: "${normalizedName}")`);
  return null;
}
