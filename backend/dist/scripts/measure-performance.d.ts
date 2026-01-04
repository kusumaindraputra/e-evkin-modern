/**
 * Performance Testing & Measurement Script
 * Purpose: Establish baseline metrics untuk performance optimization
 * Run: npx tsx src/scripts/measure-performance.ts
 */
declare function measureTime<T>(fn: () => Promise<T>): Promise<{
    result: T;
    duration: number;
}>;
declare function measureFrontendBundleSize(): Promise<{
    size: string;
    sizeGzipped: string;
}>;
declare function measureBackendEndpoints(): Promise<{
    referenceData: number;
    laporanList: number;
    dashboard: number;
    bulkSave: number;
}>;
declare function measureDatabaseMetrics(): Promise<{
    totalCount: number;
    avgQueryTime: number;
    slowQueryCount: number;
}>;
export { measureTime, measureFrontendBundleSize, measureBackendEndpoints, measureDatabaseMetrics };
//# sourceMappingURL=measure-performance.d.ts.map