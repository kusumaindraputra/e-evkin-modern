/**
 * Centralized number formatting utilities for e-evkin Modern
 * All currency/number formatting should use these functions for consistency
 * 
 * IMPORTANT: Prefix (Rp) should be in column headers, not in cell values
 */

const LOCALE = 'id-ID';

/**
 * Format number with thousand separators (Indonesian format)
 * @param value - Number to format
 * @returns Formatted string with thousand separators (e.g., "1.234.567")
 */
export const formatNumber = (value: number | string | null | undefined): string => {
  if (value === null || value === undefined) return '0';
  const numValue = typeof value === 'string' ? parseFloat(value) : value;
  if (isNaN(numValue)) return '0';
  return numValue.toLocaleString(LOCALE);
};

/**
 * Format currency value (Rupiah) - WITHOUT prefix
 * Prefix "Rp" should be in column header
 * @param value - Number to format
 * @returns Formatted string without Rp prefix (e.g., "1.234.567")
 */
export const formatCurrency = (value: number | string | null | undefined): string => {
  return formatNumber(value);
};

/**
 * Format currency for display with Rp prefix (use sparingly - prefer header prefix)
 * @param value - Number to format
 * @returns Formatted string with Rp prefix (e.g., "Rp 1.234.567")
 */
export const formatCurrencyWithPrefix = (value: number | string | null | undefined): string => {
  return `Rp ${formatNumber(value)}`;
};

/**
 * Format large currency values in abbreviated form (for charts/dashboards)
 * @param value - Number to format
 * @returns Abbreviated string (e.g., "1,2M", "500Jt", "250Rb")
 */
export const formatCurrencyAbbreviated = (value: number | null | undefined): string => {
  if (value === null || value === undefined) return '0';

  if (value >= 1000000000) {
    return `${(value / 1000000000).toLocaleString(LOCALE, { maximumFractionDigits: 1 })}M`;
  }
  if (value >= 1000000) {
    return `${(value / 1000000).toLocaleString(LOCALE, { maximumFractionDigits: 1 })}Jt`;
  }
  if (value >= 1000) {
    return `${(value / 1000).toLocaleString(LOCALE, { maximumFractionDigits: 1 })}Rb`;
  }
  return formatNumber(value);
};

/**
 * Format percentage value
 * @param value - Percentage value (0-100)
 * @param decimals - Number of decimal places (default: 2)
 * @returns Formatted percentage string (e.g., "85,50%")
 */
export const formatPercentage = (value: number | null | undefined, decimals: number = 2): string => {
  if (value === null || value === undefined) return '0,00%';
  return `${value.toLocaleString(LOCALE, {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  })}%`;
};

/**
 * Format percentage without symbol (for Excel export)
 * @param value - Percentage value (0-100)
 * @returns Formatted percentage string without % (e.g., "85.50")
 */
export const formatPercentageForExcel = (value: number | null | undefined): string => {
  if (value === null || value === undefined) return '0.00';
  return value.toFixed(2);
};

/**
 * Format date to Indonesian locale
 * @param dateString - Date string or Date object
 * @param options - Intl.DateTimeFormatOptions
 * @returns Formatted date string
 */
export const formatDate = (
  dateString: string | Date | null | undefined,
  options: Intl.DateTimeFormatOptions = {
    day: '2-digit',
    month: 'long',
    year: 'numeric'
  }
): string => {
  if (!dateString) return '-';
  return new Date(dateString).toLocaleString(LOCALE, options);
};

/**
 * Format datetime to Indonesian locale
 * @param dateString - Date string or Date object
 * @returns Formatted datetime string
 */
export const formatDateTime = (dateString: string | Date | null | undefined): string => {
  return formatDate(dateString, {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

/**
 * Column header configurations for consistent table headers
 */
export const COLUMN_HEADERS = {
  // Physical targets/realizations
  TARGET_K: 'Target (K)',
  REALISASI_K: 'Realisasi (K)',

  // Budget targets/realizations (Rp in header)
  TARGET_RP: 'Target (Rp)',
  REALISASI_RP: 'Realisasi (Rp)',
  TARGET_ANGKAS: 'Target Angkas (Rp)',

  // Percentages
  CAPAIAN_K: 'Capaian K (%)',
  CAPAIAN_RP: 'Capaian Rp (%)',
  REALISASI_FISIK: 'Realisasi Fisik (%)',

  // Aggregated columns
  TOTAL_TARGET_K: 'Total Target (K)',
  TOTAL_TARGET_RP: 'Total Target (Rp)',
  TOTAL_REALISASI_K: 'Total Realisasi (K)',
  TOTAL_REALISASI_RP: 'Total Realisasi (Rp)',
  PERSENTASE_K: 'Persentase K (%)',
  PERSENTASE_RP: 'Persentase Rp (%)',
} as const;

/**
 * Sumber Anggaran label mapping for simplified UI display
 * Full name → Abbreviated name
 */
const SUMBER_ANGGARAN_MAP: Record<string, string> = {
  // Original mappings
  'DAK Non Fisik': 'BOK',
  'APBD': 'PAD',
  'APBD Kabupaten': 'PAD',
  'BLUD': 'BLUD',
  'BLUD Puskesmas': 'BLUD',
  'JKN': 'JKN',
  'Dana Kapitasi': 'JKN',
  'JKN (Dana Kapitasi)': 'JKN',
  // Actual database values from Bojonggede
  'Pendapatan dari BLUD': 'BLUD',
  'DAK Non Fisik-Dana BOK-BOK Puskesmas': 'BOK',
  'PENDAPATAN ASLI DAERAH (PAD)': 'PAD',
};

/**
 * Format sumber anggaran label to simplified form
 * @param label - Full sumber anggaran label from database
 * @returns Simplified label (BOK, PAD, BLUD, JKN) or original if not mapped
 */
export const formatSumberAnggaran = (label: string | null | undefined): string => {
  if (!label) return '-';
  return SUMBER_ANGGARAN_MAP[label] || label;
};

/**
 * Get color for sumber anggaran tag
 * @param simplifiedLabel - Simplified sumber anggaran label (BOK, PAD, BLUD, JKN)
 * @returns Ant Design tag color
 */
export const getSumberAnggaranColor = (simplifiedLabel: string): string => {
  switch (simplifiedLabel) {
    case 'BOK': return 'green';
    case 'PAD': return 'purple';
    case 'BLUD': return 'orange';
    case 'JKN': return 'cyan';
    default: return 'default';
  }
};
