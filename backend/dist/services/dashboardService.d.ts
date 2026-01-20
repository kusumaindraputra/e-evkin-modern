/**
 * Dashboard Service
 *
 * Provides optimized dashboard queries with caching.
 * Caches computed statistics to reduce database load on frequently accessed endpoints.
 */
export declare const DASHBOARD_CACHE_KEYS: {
    STATS: (tahun: number, bulan?: string) => string;
    BUDGET_MONTHLY: (tahun: number, bulan: string) => string;
    TOP_10_ABSORPTION: (tahun: number, bulan: string) => string;
    BOTTOM_10_ABSORPTION: (tahun: number, bulan: string) => string;
    BUDGET_YTD: (tahun: number) => string;
    PUSKESMAS_REPORTING: (tahun: number, bulan?: string) => string;
};
interface DashboardStats {
    totalLaporan: number;
    tersimpan: number;
    terkirim: number;
    totalPuskesmas: number;
    puskesmasReporting: number;
    persentasePuskesmasReporting: number;
}
interface BudgetData {
    sub_kegiatan: string;
    kegiatan: string;
    target_rp: number;
    realisasi_rp: number;
    persentase: number;
}
interface PuskesmasAbsorption {
    puskesmas: string;
    target_rp: number;
    realisasi_rp: number;
    persentase: number;
}
/**
 * Get dashboard statistics with caching
 */
export declare function getDashboardStats(tahun: number, bulan?: string): Promise<DashboardStats>;
/**
 * Get monthly budget data with caching
 */
export declare function getBudgetMonthly(tahun: number, bulan: string): Promise<{
    data: BudgetData[];
    summary: {
        totalTarget: number;
        totalRealisasi: number;
        totalPersentase: number;
    };
}>;
/**
 * Get top 10 budget absorption with caching
 */
export declare function getTop10Absorption(tahun: number, bulan: string): Promise<PuskesmasAbsorption[]>;
/**
 * Get bottom 10 budget absorption with caching
 */
export declare function getBottom10Absorption(tahun: number, bulan: string): Promise<PuskesmasAbsorption[]>;
/**
 * Invalidate dashboard cache when laporan data changes
 */
export declare function invalidateDashboardCache(tahun?: number): void;
declare const _default: {
    getDashboardStats: typeof getDashboardStats;
    getBudgetMonthly: typeof getBudgetMonthly;
    getTop10Absorption: typeof getTop10Absorption;
    getBottom10Absorption: typeof getBottom10Absorption;
    invalidateDashboardCache: typeof invalidateDashboardCache;
    DASHBOARD_CACHE_KEYS: {
        STATS: (tahun: number, bulan?: string) => string;
        BUDGET_MONTHLY: (tahun: number, bulan: string) => string;
        TOP_10_ABSORPTION: (tahun: number, bulan: string) => string;
        BOTTOM_10_ABSORPTION: (tahun: number, bulan: string) => string;
        BUDGET_YTD: (tahun: number) => string;
        PUSKESMAS_REPORTING: (tahun: number, bulan?: string) => string;
    };
};
export default _default;
//# sourceMappingURL=dashboardService.d.ts.map