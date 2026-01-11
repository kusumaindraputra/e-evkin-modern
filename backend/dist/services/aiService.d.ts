interface LaporanAnalysis {
    month: string;
    year: number;
    totalLaporan: number;
    kegiatan: {
        name: string;
        totalTarget: number;
        totalRealisasi: number;
        persentase: number;
        puskesmasCount: number;
        status: string;
    }[];
    sumberAnggaran: {
        name: string;
        totalTarget: number;
        totalRealisasi: number;
        persentase: number;
        kegiatan: string[];
    }[];
    topPerformers: string[];
    lowPerformers: string[];
    allPuskesmasPerformance: string[];
    detailLaporanByPuskesmas: {
        [puskesmasName: string]: {
            persentase: number;
            kegiatan: Array<{
                nama: string;
                target: number;
                realisasi: number;
                satuan: string;
                persentase: number;
                realisasiRp: number;
                targetRp: number;
                permasalahan: string;
                upaya: string;
            }>;
        };
    };
    trends: {
        comparison: string;
        improvement: string;
    };
    systemContext: {
        totalPuskesmas: number;
        totalKegiatan: number;
        totalSubKegiatan: number;
        sumberAnggaranList: string[];
    };
}
/**
 * Aggregate laporan data untuk AI context
 * Mengumpulkan seluruh data laporan puskesmas untuk analisis AI
 */
export declare const aggregateLaporanData: () => Promise<LaporanAnalysis>;
/**
 * Get AI insights dengan context laporan
 * Asisten Analis Kinerja Puskesmas - Hanya menggunakan Bahasa Indonesia
 */
export declare const getAIInsights: (userQuestion: string) => Promise<string>;
/**
 * Get suggested questions untuk dashboard
 * Pertanyaan yang disarankan dalam Bahasa Indonesia untuk analisis kinerja
 */
export declare const getSuggestedQuestions: () => string[];
export {};
//# sourceMappingURL=aiService.d.ts.map