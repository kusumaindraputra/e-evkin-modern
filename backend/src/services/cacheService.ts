import NodeCache from 'node-cache';

/**
 * Cache service using node-cache for reference data
 * TTL: 1 hour (3600 seconds) for reference data
 */
class CacheService {
  private cache: NodeCache;
  private readonly CACHE_TTL = 3600; // 1 hour in seconds

  constructor() {
    // stdTTL: standard time to leave in seconds
    // checkperiod: auto delete check interval in seconds
    this.cache = new NodeCache({ stdTTL: this.CACHE_TTL, checkperiod: 600 });
  }

  /**
   * Get value from cache
   */
  get<T>(key: string): T | undefined {
    return this.cache.get<T>(key);
  }

  /**
   * Set value in cache
   */
  set<T>(key: string, value: T, ttl?: number): void {
    this.cache.set(key, value, ttl || this.CACHE_TTL);
  }

  /**
   * Delete from cache
   */
  delete(key: string): number {
    return this.cache.del(key);
  }

  /**
   * Clear all cache
   */
  flush(): void {
    this.cache.flushAll();
  }

  /**
   * Get all keys
   */
  getKeys(): string[] {
    return this.cache.keys();
  }

  /**
   * Get cache stats
   */
  getStats() {
    return this.cache.getStats();
  }
}

// Export singleton instance
export const cacheService = new CacheService();
export default cacheService;
