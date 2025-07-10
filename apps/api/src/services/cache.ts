import NodeCache from 'node-cache';

export class CacheService {
  private cache: NodeCache;
  private defaultTTL: number = 3600; // 1 hour in seconds

  constructor() {
    this.cache = new NodeCache();
  }

  get<T>(key: string): T | undefined {
    return this.cache.get<T>(key);
  }

  set<T>(key: string, value: T, ttl: number = this.defaultTTL): boolean {
    const ttlSeconds = Math.max(1, Math.floor(ttl));
    return this.cache.set(key, value, ttlSeconds);
  }

  del(key: string): number {
    return this.cache.del(key);
  }

  flush(): void {
    this.cache.flushAll();
  }
}

const cacheService = new CacheService();
export default cacheService;

class CacheManager {
  private cache: NodeCache;

  constructor() {
    this.cache = new NodeCache({
      stdTTL: 600, // 10 minutes default TTL
      checkperiod: 120 // Check for expired keys every 2 minutes
    });
  }

  async get<T>(key: string): Promise<T | undefined> {
    return this.cache.get<T>(key);
  }

  async set<T>(key: string, value: T, ttl?: number): Promise<boolean> {
    return this.cache.set(key, value, ttl);
  }

  async del(key: string): Promise<number> {
    return this.cache.del(key);
  }

  async reset(): Promise<void> {
    return this.cache.flushAll();
  }

  async keys(): Promise<string[]> {
    return this.cache.keys();
  }

  async stats() {
    return {
      keys: this.cache.keys().length,
      hits: this.cache.getStats().hits,
      misses: this.cache.getStats().misses,
      ksize: this.cache.getStats().ksize,
      vsize: this.cache.getStats().vsize
    };
  }
}

export const cacheManager = new CacheManager(); 