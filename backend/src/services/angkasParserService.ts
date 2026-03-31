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

// Disable worker (not needed for server-side text extraction)
pdfjsLib.GlobalWorkerOptions.workerSrc = '';

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
// Example: "1.02.0.00.0.00.01.0050   Labkesda   ..." (no "Puskesmas" prefix)
// We capture the code and name (text before numbers)
const PUSKESMAS_PATTERN = /^(1\.02\.0\.00\.0\.00\.\d+\.\d+)\s+(?:(Puskesmas|Puskemas)\s+)?([A-Za-z][A-Za-z\s]*?)(?:\s+\d|$)/i;

// Pattern to match sub-kegiatan lines (budget items)
// Example: "1.02.02.2.02.0033   Operasional Pelayanan Puskesmas   476.605.756,00   476.605.756,00   ..."
const KEGIATAN_PATTERN = /^(1\.\d+\.\d+\.\d+\.\d+\.\d+)\s+(.+?)(\d{1,3}(?:\.\d{3})*(?:,\d{2})?(?:\s+|$))/;

// Pattern to match Sumber Anggaran header lines (short code like "4.1" or "4.2")
// Example: "4.1   Pendapatan Asli Daerah"
// Example: "4.2   Transfer"
// Must NOT match when followed only by currency values (e.g., "4.1   1.139.718.035.880,00")
const SUMBER_ANGGARAN_PATTERN = /^(\d\.\d)\s+([A-Za-z].+?)(?:\s+\d{1,3}(?:\.\d{3})*(?:,\d{2})?|$)/;

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
 * Returns ALL puskesmas found on this page (may be multiple)
 * Also returns rows that belong to currentPuskesmas (from previous page)
 */
function parsePage(
  pageText: string, 
  currentPuskesmas: PuskesmasAngkas | null,
  currentSumberAnggaran: { kode: string; nama: string } | null
): {
  puskesmasList: PuskesmasAngkas[];
  lastPuskesmas: PuskesmasAngkas | null;
  rows: AngkasRow[];
  rowsForCurrentPuskesmas: AngkasRow[];  // Rows belonging to puskesmas from previous page
  sumberAnggaran: { kode: string; nama: string } | null;
  detectedSumberAnggaran: Array<{ kode: string; nama: string }>;
} {
  const lines = pageText.split('\n').map(l => l.trim()).filter(l => l);
  const puskesmasList: PuskesmasAngkas[] = [];
  let puskesmas = currentPuskesmas;
  let sumberAnggaran = currentSumberAnggaran;
  const detectedSumberAnggaran: Array<{ kode: string; nama: string }> = [];
  const rowsForPuskesmas = new Map<string, AngkasRow[]>();
  const rowsForCurrentPuskesmas: AngkasRow[] = [];  // Rows before first puskesmas header on this page
  let foundFirstPuskesmasOnPage = false;

  for (const line of lines) {
    // Check if this is a Puskesmas header
    const puskesmasMatch = line.match(PUSKESMAS_PATTERN);
    if (puskesmasMatch) {
      // Group 1: kode, Group 2: "Puskesmas" or "Puskemas" or undefined, Group 3: nama
      const namaPuskesmas = puskesmasMatch[3].trim();
      puskesmas = {
        kodePuskesmas: puskesmasMatch[1],
        namaPuskesmas: puskesmasMatch[2] ? `${puskesmasMatch[2]} ${namaPuskesmas}` : namaPuskesmas,
        rows: [],
      };
      puskesmasList.push(puskesmas);
      rowsForPuskesmas.set(puskesmas.kodePuskesmas, []);
      foundFirstPuskesmasOnPage = true;  // Mark that we found a puskesmas on this page
      continue;
    }

    // Check if this is a Sumber Anggaran header (short code like "4.1")
    const sumberMatch = line.match(SUMBER_ANGGARAN_PATTERN);
    if (sumberMatch) {
      const kode = sumberMatch[1];
      const nama = sumberMatch[2].trim();
      sumberAnggaran = { kode, nama };
      detectedSumberAnggaran.push({ kode, nama });
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
        // If we haven't found a puskesmas on this page yet, this row belongs to currentPuskesmas (from previous page)
        if (!foundFirstPuskesmasOnPage && currentPuskesmas) {
          rowsForCurrentPuskesmas.push(row);
        } else {
          // Add to current puskesmas rows (puskesmas found on this page)
          const rows = rowsForPuskesmas.get(puskesmas.kodePuskesmas) || [];
          rows.push(row);
          rowsForPuskesmas.set(puskesmas.kodePuskesmas, rows);
        }
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
        // If we haven't found a puskesmas on this page yet, this row belongs to currentPuskesmas (from previous page)
        if (!foundFirstPuskesmasOnPage && currentPuskesmas) {
          rowsForCurrentPuskesmas.push(row);
        } else {
          const rows = rowsForPuskesmas.get(puskesmas.kodePuskesmas) || [];
          rows.push(row);
          rowsForPuskesmas.set(puskesmas.kodePuskesmas, rows);
        }
      }
    }
  }

  // Assign rows to puskesmas
  for (const p of puskesmasList) {
    p.rows = rowsForPuskesmas.get(p.kodePuskesmas) || [];
  }

  // Collect all rows for backward compatibility
  const allRows: AngkasRow[] = [];
  for (const rows of rowsForPuskesmas.values()) {
    allRows.push(...rows);
  }

  return {
    puskesmasList,
    lastPuskesmas: puskesmas,
    rows: allRows,
    rowsForCurrentPuskesmas,  // Rows that belong to puskesmas from previous page
    sumberAnggaran,
    detectedSumberAnggaran,
  };
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

    // Build raw lines from grouped text items
    const rawLines = lines.map(line => line.join(' ').trim());

    // JOIN SPLIT KODE LINES: The SIPD Penatausahaan PDF splits kode rekening
    // across 2-3 lines due to column layout. We need to reconstruct them.
    //
    // Pattern A - Puskesmas header (3-line split):
    //   Line N:   "1.02.0.00.0.0  Puskesmas"       (partial kode + optional text)
    //   Line N+1: "4.367.839.106,00 ..."            (values)
    //   Line N+2: "0.01.0018 Bojonggede"            (kode tail + name)
    //   -> Join as: "1.02.0.00.0.00.01.0018 Puskesmas Bojonggede  4.367..."
    //
    // Pattern B - Sub-kegiatan (2-3 line split):
    //   Line N:   "1.02.02.2.02."                   (partial kode)
    //   Line N+1: "dengan Masalah  30.025.000,00..."(uraian + values)
    //   Line N+2: "0021"                            (kode tail)
    //   -> Join as: "1.02.02.2.02.0021 dengan Masalah 30.025.000,00..."
    //
    // Pattern B2 - Sub-kegiatan variant:
    //   Line N:   "1.02.02.2.02.  Operasional Pelayanan"
    //   Line N+1: "331.035.100,00 ..."              (values)
    //   Line N+2: "0033 Puskesmas"                  (kode tail + uraian cont.)
    //   -> Join as: "1.02.02.2.02.0033 Operasional Pelayanan Puskesmas 331.035..."

    const joinedLines: string[] = [];
    for (let i = 0; i < rawLines.length; i++) {
      const line = rawLines[i];

      // Pattern A: Puskesmas header - partial kode "1.02.0.00.0.0" with optional text
      const puskesmasKodeMatch = line.match(/^(1\.02\.0\.00\.0\.0)\s*(.*)/);
      if (puskesmasKodeMatch) {
        const partialKode = puskesmasKodeMatch[1];
        const textOnKodeLine = puskesmasKodeMatch[2].trim();
        // Search next 1-3 lines for the kode tail "0.01.XXXX" or "0.XX.XXXX"
        let kodeTail = '';
        let kodeTailName = '';
        let valuesLine = '';
        let skipTo = i;

        for (let j = i + 1; j <= Math.min(i + 3, rawLines.length - 1); j++) {
          const candidate = rawLines[j];
          const tailMatch = candidate.match(/^(0\.\d+\.\d+)\s*(.*)/);
          if (tailMatch) {
            kodeTail = tailMatch[1];
            kodeTailName = tailMatch[2].trim();
            skipTo = j;
            break;
          } else {
            // This is a text/values line between partial kode and tail
            valuesLine += ' ' + candidate;
          }
        }

        if (kodeTail) {
          const fullKode = partialKode + kodeTail;
          // Build: "fullKode textOnKodeLine kodeTailName valuesLine"
          const textParts = [textOnKodeLine, kodeTailName].filter(Boolean).join(' ');
          joinedLines.push(fullKode + ' ' + textParts + valuesLine);
          i = skipTo;
          continue;
        }
      }

      // Pattern B: Sub-kegiatan partial kode "1.02.XX.X.XX." with optional text
      const subKegKodeMatch = line.match(/^(1\.\d+\.\d+\.\d+\.\d+\.)\s*(.*)/);
      if (subKegKodeMatch) {
        const partialKode = subKegKodeMatch[1];
        const textOnKodeLine = subKegKodeMatch[2].trim();
        // Search next 1-3 lines for the kode tail "XXXX" (4 digits)
        let kodeTail = '';
        let kodeTailText = '';
        let middleContent = '';
        let skipTo = i;

        for (let j = i + 1; j <= Math.min(i + 3, rawLines.length - 1); j++) {
          const candidate = rawLines[j];
          const tailMatch = candidate.match(/^(\d{4})\b\s*(.*)/);
          if (tailMatch) {
            kodeTail = tailMatch[1];
            kodeTailText = tailMatch[2].trim();
            skipTo = j;
            break;
          } else {
            middleContent += ' ' + candidate;
          }
        }

        if (kodeTail) {
          const fullKode = partialKode + kodeTail;
          // Build: "fullKode textOnKodeLine middleContent kodeTailText"
          const allText = [textOnKodeLine, middleContent.trim(), kodeTailText].filter(Boolean).join(' ');
          joinedLines.push(fullKode + ' ' + allText);
          i = skipTo;
          continue;
        }
      }

      // Default: keep line as-is
      joinedLines.push(line);
    }

    const pageText = joinedLines.join('\n');
    fullText += pageText + '\n';

    // Parse this page
    const { puskesmasList: pagePuskesmasList, lastPuskesmas, rowsForCurrentPuskesmas, sumberAnggaran, detectedSumberAnggaran } = parsePage(
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
    
    // IMPORTANT: Add rows that belong to currentPuskesmas (from previous page)
    // This handles the case where puskesmas header is on page N but kegiatan continues on page N+1
    if (rowsForCurrentPuskesmas.length > 0 && currentPuskesmas && puskesmasMap.has(currentPuskesmas.kodePuskesmas)) {
      const existing = puskesmasMap.get(currentPuskesmas.kodePuskesmas)!;
      existing.rows.push(...rowsForCurrentPuskesmas);
    }
    
    // Add all puskesmas found on this page to the map
    for (const puskesmas of pagePuskesmasList) {
      if (!puskesmasMap.has(puskesmas.kodePuskesmas)) {
        puskesmasMap.set(puskesmas.kodePuskesmas, puskesmas);
      } else {
        // Merge rows if puskesmas already exists
        const existing = puskesmasMap.get(puskesmas.kodePuskesmas)!;
        existing.rows.push(...puskesmas.rows);
      }
    }
    
    // Update current puskesmas for continuity to next page
    if (lastPuskesmas) {
      currentPuskesmas = lastPuskesmas;
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
    // Group 2: "Puskesmas" or "Puskemas" or undefined, Group 3: nama
    const namaPuskesmas = match[2] ? `${match[2]} ${match[3]}`.trim() : match[3].trim();

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
 * Normalize puskesmas name by removing "puskesmas"/"puskemas", numbers, and extra spaces
 * Example: "Puskesmas Lebak Wangi   123,456" -> "lebakwangi"
 * Example: "Puskemas Cibeuteung Udik" -> "cibeuteungudik"
 */
function normalizePuskesmasName(name: string): string {
  return name
    .toLowerCase()
    .replace(/puskesmas|puskemas/gi, '')  // Remove "puskesmas" or "puskemas" (typo)
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
  // Labkesda doesn't have "Puskesmas" prefix in PDF
  'labkesda': 'labkesda',
  // Full name variant in newer PDFs (2026+)
  'laboratoriumkesehatandaerah': 'labkesda',
};

/**
 * Match puskesmas name to user with fuzzy matching
 * Enhanced: Now also supports matching by kode_sub_unit from PDF's kodePuskesmas
 */
export function findPuskesmasUser(
  namaPuskesmas: string, 
  users: Array<{ id: string; nama: string; username: string; kode_sub_unit?: string }>,
  kodePuskesmas?: string
): string | null {
  // FIRST: Try to match by kode_sub_unit (most reliable)
  // kodePuskesmas from PDF = "1.02.0.00.0.00.01.0010" should match kode_sub_unit in DB
  if (kodePuskesmas) {
    const userByKode = users.find(u => u.kode_sub_unit === kodePuskesmas);
    if (userByKode) {
      return userByKode.id;
    }
  }

  // FALLBACK: Original fuzzy matching by name
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
    return bestMatch.user.id;
  }
  
  return null;
}
