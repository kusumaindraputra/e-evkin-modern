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
export interface AngkasRow {
    kodeRekening: string;
    uraian: string;
    jumlahAnggaran: number;
    jumlahRak: number;
    bulanan: number[];
    sumberAnggaranKode: string | null;
    sumberAnggaranNama: string | null;
}
export interface PuskesmasAngkas {
    kodePuskesmas: string;
    namaPuskesmas: string;
    rows: AngkasRow[];
}
export interface ParsedAngkas {
    tahun: number;
    puskesmasList: PuskesmasAngkas[];
    detectedSumberAnggaran: Array<{
        kode: string;
        nama: string;
    }>;
}
/**
 * Main function to parse Angkas PDF buffer
 */
export declare function parseAngkasPdf(pdfBuffer: Buffer): Promise<ParsedAngkas>;
/**
 * Alternative parsing approach using raw text extraction
 * More reliable for PDFs with complex layouts
 */
export declare function parseAngkasPdfSimple(pdfBuffer: Buffer): Promise<ParsedAngkas>;
/**
 * Match parsed uraian to sub_kegiatan.nama using fuzzy matching
 */
export declare function findBestMatch(uraian: string, subKegiatanList: Array<{
    id: number;
    nama: string;
}>): number | null;
/**
 * Match puskesmas name to user
 */
export declare function findPuskesmasUser(namaPuskesmas: string, users: Array<{
    id: string;
    nama: string;
    username: string;
}>): string | null;
//# sourceMappingURL=angkasParserService.d.ts.map