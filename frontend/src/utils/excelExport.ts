import * as XLSX from 'xlsx';
import { formatCurrencyWithPrefix, formatPercentage } from './formatters';

export interface ExcelExportData {
  fileName: string;
  sheetName: string;
  columns: Array<{
    header: string;
    key: string;
    width?: number;
    format?: (value: any, row?: Record<string, any>) => string;
  }>;
  data: Record<string, any>[];
}

/**
 * Export data to Excel file
 * @param exportData - Configuration object containing file name, sheet name, columns, and data
 */
export const exportToExcel = (exportData: ExcelExportData) => {
  const { fileName, sheetName, columns, data } = exportData;

  // Transform data to match column structure
  const transformedData = data.map((row) => {
    const transformedRow: Record<string, any> = {};
    columns.forEach((col) => {
      let value = row[col.key];

      // Handle nested object paths (e.g., 'sub_kegiatan.kode_sub')
      if (col.key.includes('.')) {
        const keys = col.key.split('.');
        value = keys.reduce((obj, k) => obj?.[k], row);
      }

      // Apply custom format if provided (pass both value and the whole row)
      if (col.format) {
        try {
          // Try common call signatures in order to be tolerant:
          // 1) format(value, row)
          // 2) format(row)
          // 3) format(value)
          let formatted = col.format(value, row);
          const isInvalid = (v: any) => v === undefined || v === null || (typeof v === 'string' && v.includes('undefined'));
          if (isInvalid(formatted)) {
            formatted = col.format(row as any);
          }
          if (isInvalid(formatted)) {
            formatted = col.format(value);
          }

          // Only overwrite when format returns a defined, non-undefined-string value
          if (!isInvalid(formatted)) {
            value = formatted;
          }
        } catch (e) {
          // If user format throws, fall back to raw value
          // eslint-disable-next-line no-console
          console.error('Error formatting column', col.header, e);
        }
      }

      transformedRow[col.header] = value ?? '';
    });
    return transformedRow;
  });

  // Create workbook and worksheet
  const workbook = XLSX.utils.book_new();
  const worksheet = XLSX.utils.json_to_sheet(transformedData);

  // Set column widths
  const colWidths = columns.map((col) => ({ wch: col.width || 15 }));
  worksheet['!cols'] = colWidths;

  // Add worksheet to workbook
  XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);

  // Generate timestamp for file name
  const timestamp = new Date().toISOString().split('T')[0];
  const finalFileName = `${fileName}-${timestamp}.xlsx`;

  // Write file
  XLSX.writeFile(workbook, finalFileName);
};

/**
 * Format Rupiah currency
 * @deprecated Use formatCurrencyWithPrefix from formatters.ts instead
 */
export const formatRupiahForExcel = (value: number): string => {
  return formatCurrencyWithPrefix(value);
};

/**
 * Format percentage
 * @deprecated Use formatPercentage from formatters.ts instead
 */
export const formatPercentageForExcel = (value: number): string => {
  return formatPercentage(value);
};
