"use strict";
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
Object.defineProperty(exports, "__esModule", { value: true });
exports.CACHE_TTL = exports.CACHE_KEYS = exports.cacheService = void 0;
class CacheService {
    cache = new Map();
    defaultTTL = 5 * 60 * 1000; // 5 minutes default
    /**
     * Get item from cache
     * @param key Cache key
     * @returns Cached data or null if not found/expired
     */
    get(key) {
        const entry = this.cache.get(key);
        if (!entry) {
            return null;
        }
        // Check if expired
        if (Date.now() > entry.expiresAt) {
            this.cache.delete(key);
            return null;
        }
        return entry.data;
    }
    /**
     * Set item in cache
     * @param key Cache key
     * @param data Data to cache
     * @param ttlMs Time to live in milliseconds (default: 5 minutes)
     */
    set(key, data, ttlMs = this.defaultTTL) {
        this.cache.set(key, {
            data,
            expiresAt: Date.now() + ttlMs,
        });
    }
    /**
     * Delete item from cache
     * @param key Cache key
     */
    delete(key) {
        return this.cache.delete(key);
    }
    /**
     * Invalidate all cache entries matching a pattern
     * @param pattern Prefix pattern to match
     */
    invalidatePattern(pattern) {
        let count = 0;
        for (const key of this.cache.keys()) {
            if (key.startsWith(pattern)) {
                this.cache.delete(key);
                count++;
            }
        }
        return count;
    }
    /**
     * Clear all cache
     */
    clear() {
        this.cache.clear();
    }
    /**
     * Get cache statistics
     */
    stats() {
        return {
            size: this.cache.size,
            keys: Array.from(this.cache.keys()),
        };
    }
    /**
     * Get or fetch - returns cached data or fetches and caches
     * @param key Cache key
     * @param fetcher Function to fetch data if not cached
     * @param ttlMs TTL in milliseconds
     */
    async getOrFetch(key, fetcher, ttlMs = this.defaultTTL) {
        const cached = this.get(key);
        if (cached !== null) {
            return cached;
        }
        const data = await fetcher();
        this.set(key, data, ttlMs);
        return data;
    }
}
// Singleton instance
exports.cacheService = new CacheService();
// Cache keys constants
exports.CACHE_KEYS = {
    SUMBER_ANGGARAN: 'reference:sumber_anggaran',
    SATUAN: 'reference:satuan',
    KEGIATAN: 'reference:kegiatan',
    SUB_KEGIATAN_ALL: 'reference:sub_kegiatan:all',
    SUB_KEGIATAN_BY_KEGIATAN: (id) => `reference:sub_kegiatan:kegiatan:${id}`,
};
// Cache TTLs
exports.CACHE_TTL = {
    REFERENCE_DATA: 10 * 60 * 1000, // 10 minutes for reference data
    SHORT: 1 * 60 * 1000, // 1 minute
    MEDIUM: 5 * 60 * 1000, // 5 minutes
    LONG: 30 * 60 * 1000, // 30 minutes
};
exports.default = exports.cacheService;
//# sourceMappingURL=cacheService.js.map