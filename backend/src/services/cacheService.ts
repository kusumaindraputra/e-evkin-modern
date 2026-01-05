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

interface CacheEntry<T> {
  data: T;
  expiresAt: number;
}

class CacheService {
  private cache: Map<string, CacheEntry<any>> = new Map();
  private defaultTTL: number = 5 * 60 * 1000; // 5 minutes default

  /**
   * Get item from cache
   * @param key Cache key
   * @returns Cached data or null if not found/expired
   */
  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    
    if (!entry) {
      return null;
    }

    // Check if expired
    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      return null;
    }

    return entry.data as T;
  }

  /**
   * Set item in cache
   * @param key Cache key
   * @param data Data to cache
   * @param ttlMs Time to live in milliseconds (default: 5 minutes)
   */
  set<T>(key: string, data: T, ttlMs: number = this.defaultTTL): void {
    this.cache.set(key, {
      data,
      expiresAt: Date.now() + ttlMs,
    });
  }

  /**
   * Delete item from cache
   * @param key Cache key
   */
  delete(key: string): boolean {
    return this.cache.delete(key);
  }

  /**
   * Invalidate all cache entries matching a pattern
   * @param pattern Prefix pattern to match
   */
  invalidatePattern(pattern: string): number {
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
  clear(): void {
    this.cache.clear();
  }

  /**
   * Get cache statistics
   */
  stats(): { size: number; keys: string[] } {
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
  async getOrFetch<T>(
    key: string,
    fetcher: () => Promise<T>,
    ttlMs: number = this.defaultTTL
  ): Promise<T> {
    const cached = this.get<T>(key);
    if (cached !== null) {
      return cached;
    }

    const data = await fetcher();
    this.set(key, data, ttlMs);
    return data;
  }
}

// Singleton instance
export const cacheService = new CacheService();

// Cache keys constants
export const CACHE_KEYS = {
  SUMBER_ANGGARAN: 'reference:sumber_anggaran',
  SATUAN: 'reference:satuan',
  KEGIATAN: 'reference:kegiatan',
  SUB_KEGIATAN_ALL: 'reference:sub_kegiatan:all',
  SUB_KEGIATAN_BY_KEGIATAN: (id: number) => `reference:sub_kegiatan:kegiatan:${id}`,
};

// Cache TTLs
export const CACHE_TTL = {
  REFERENCE_DATA: 10 * 60 * 1000, // 10 minutes for reference data
  SHORT: 1 * 60 * 1000,           // 1 minute
  MEDIUM: 5 * 60 * 1000,          // 5 minutes
  LONG: 30 * 60 * 1000,           // 30 minutes
};

export default cacheService;
