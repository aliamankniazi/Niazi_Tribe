import { cacheManager } from '../services/cache';

export async function clearCache() {
  try {
    // Clear in-memory cache
    await cacheManager.reset();

    // Clear Redis cache if configured
    if (process.env.REDIS_URL) {
      const redis = await import('redis');
      const client = redis.createClient({
        url: process.env.REDIS_URL
      });
      await client.connect();
      await client.flushAll();
      await client.disconnect();
    }

    return true;
  } catch (error) {
    console.error('Failed to clear cache:', error);
    throw new Error('Failed to clear system cache');
  }
} 