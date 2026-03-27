/**
 * Simple In-Memory Cache Service
 *
 * Provides caching for reference data that rarely changes.
 * Can be replaced with Redis in production for distributed caching.
 *
 * Features:
 * - TTL-based expiration
 * - Cache invalidation
 * - Memory-efficient for small datasets
 */
declare class CacheService {
    private cache;
    private defaultTTL;
    private cleanupInterval;
    constructor();
    private cleanup;
    /**
     * Get item from cache
     * @param key Cache key
     * @returns Cached data or null if not found/expired
     */
    get<T>(key: string): T | null;
    /**
     * Set item in cache
     * @param key Cache key
     * @param data Data to cache
     * @param ttlMs Time to live in milliseconds (default: 5 minutes)
     */
    set<T>(key: string, data: T, ttlMs?: number): void;
    /**
     * Delete item from cache
     * @param key Cache key
     */
    delete(key: string): boolean;
    /**
     * Invalidate all cache entries matching a pattern
     * @param pattern Prefix pattern to match
     */
    invalidatePattern(pattern: string): number;
    /**
     * Clear all cache
     */
    clear(): void;
    /**
     * Get cache statistics
     */
    stats(): {
        size: number;
        keys: string[];
    };
    /**
     * Get or fetch - returns cached data or fetches and caches
     * @param key Cache key
     * @param fetcher Function to fetch data if not cached
     * @param ttlMs TTL in milliseconds
     */
    getOrFetch<T>(key: string, fetcher: () => Promise<T>, ttlMs?: number): Promise<T>;
}
export declare const cacheService: CacheService;
export declare const CACHE_KEYS: {
    SUMBER_ANGGARAN: string;
    SATUAN: string;
    KEGIATAN: string;
    SUB_KEGIATAN_ALL: string;
    SUB_KEGIATAN_BY_KEGIATAN: (id: number) => string;
};
export declare const CACHE_TTL: {
    REFERENCE_DATA: number;
    SHORT: number;
    MEDIUM: number;
    LONG: number;
};
export default cacheService;
//# sourceMappingURL=cacheService.d.ts.map