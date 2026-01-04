"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.cacheService = void 0;
const node_cache_1 = __importDefault(require("node-cache"));
/**
 * Cache service using node-cache for reference data
 * TTL: 1 hour (3600 seconds) for reference data
 */
class CacheService {
    cache;
    CACHE_TTL = 3600; // 1 hour in seconds
    constructor() {
        // stdTTL: standard time to leave in seconds
        // checkperiod: auto delete check interval in seconds
        this.cache = new node_cache_1.default({ stdTTL: this.CACHE_TTL, checkperiod: 600 });
    }
    /**
     * Get value from cache
     */
    get(key) {
        return this.cache.get(key);
    }
    /**
     * Set value in cache
     */
    set(key, value, ttl) {
        this.cache.set(key, value, ttl || this.CACHE_TTL);
    }
    /**
     * Delete from cache
     */
    delete(key) {
        return this.cache.del(key);
    }
    /**
     * Clear all cache
     */
    flush() {
        this.cache.flushAll();
    }
    /**
     * Get all keys
     */
    getKeys() {
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
exports.cacheService = new CacheService();
exports.default = exports.cacheService;
//# sourceMappingURL=cacheService.js.map