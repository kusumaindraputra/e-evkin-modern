export interface LraRow {
    userId: string;
    idSubKegiatan: number;
    idSumberAnggaran: number;
    bulan: string;
    tahun: number;
    realisasiRp: number;
}
export interface LraParseResult {
    bulan: string;
    tahun: number;
    bulanDetectedFromFilename: boolean;
    rows: LraRow[];
    unmatchedPuskesmas: string[];
    unmatchedSubKegiatan: string[];
    unmatchedSumber: string[];
}
/** Extract bulan/tahun from filename like "LRA SUB KEG DINKES 31 JANUARI 2026.xlsx" */
export declare function detectBulanTahunFromFilename(filename: string): {
    bulan: string | null;
    tahun: number | null;
};
export declare function parseLraExcel(buffer: Buffer, filename: string, bulanOverride?: string, tahunOverride?: number): Promise<LraParseResult>;
/**
 * Get latest LRA realisasi_rp for a puskesmas user for a given bulan/tahun.
 * Returns a Map keyed by "idSubKegiatan_idSumberAnggaran" -> realisasi_rp
 */
export declare function getLraRealisasiMap(userId: string, bulan: string, tahun: number): Promise<Map<string, number>>;
//# sourceMappingURL=lraParserService.d.ts.map