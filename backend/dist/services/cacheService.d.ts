import NodeCache from 'node-cache';
/**
 * Cache service using node-cache for reference data
 * TTL: 1 hour (3600 seconds) for reference data
 */
declare class CacheService {
    private cache;
    private readonly CACHE_TTL;
    constructor();
    /**
     * Get value from cache
     */
    get<T>(key: string): T | undefined;
    /**
     * Set value in cache
     */
    set<T>(key: string, value: T, ttl?: number): void;
    /**
     * Delete from cache
     */
    delete(key: string): number;
    /**
     * Clear all cache
     */
    flush(): void;
    /**
     * Get all keys
     */
    getKeys(): string[];
    /**
     * Get cache stats
     */
    getStats(): NodeCache.Stats;
}
export declare const cacheService: CacheService;
export default cacheService;
//# sourceMappingURL=cacheService.d.ts.map