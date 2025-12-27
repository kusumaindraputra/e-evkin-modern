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
            }>;
        };
    };
    trends: {
        comparison: string;
        improvement: string;
    };
}
/**
 * Aggregate laporan data untuk AI context
 */
export declare const aggregateLaporanData: () => Promise<LaporanAnalysis>;
/**
 * Get AI insights dengan context laporan
 */
export declare const getAIInsights: (userQuestion: string) => Promise<string>;
/**
 * Get suggested questions untuk dashboard
 */
export declare const getSuggestedQuestions: () => string[];
export {};
//# sourceMappingURL=aiService.d.ts.map