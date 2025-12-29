/**
 * Redis Cache Layer - כמו Shopify
 * מאפשר cache מתקדם עם TTL גמיש
 * 🚀 Using Upstash Redis - Serverless & Fast!
 */

import { Redis } from '@upstash/redis';

let redis: Redis | null = null;

function getRedis(): Redis | null {
  if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
    if (!redis) {
      redis = new Redis({
        url: process.env.UPSTASH_REDIS_REST_URL,
        token: process.env.UPSTASH_REDIS_REST_TOKEN,
      });
    }
    return redis;
  }
  
  return null;
}

// Fallback to in-memory cache if Redis not available
const memoryCache = new Map<string, { data: any; expires: number }>();

export async function getCached<T>(
  key: string,
  fetcher: () => Promise<T>,
  ttlSeconds: number = 60
): Promise<T> {
  const now = Date.now();
  
  // ⚡ Level 1: Check in-memory cache first (instant!)
  const memCached = memoryCache.get(key);
  if (memCached && memCached.expires > now) {
    return memCached.data;
  }

  const client = getRedis();

  if (client) {
    // 🌍 Level 2: Check Redis (persistent but slower)
    try {
      const cached = await client.get(key);
      
      if (cached !== null && cached !== undefined) {
        // Store in memory for next time
        memoryCache.set(key, {
          data: cached as T,
          expires: now + ttlSeconds * 1000,
        });
        
        return cached as T;
      }

      const fresh = await fetcher();
      
      // Store in both Redis and memory
      await client.set(key, fresh as any, { ex: ttlSeconds });
      
      memoryCache.set(key, {
        data: fresh,
        expires: now + ttlSeconds * 1000,
      });
      
      return fresh;
    } catch (error) {
      // Fall through to memory cache
    }
  }

  // Use in-memory cache (fallback when Redis not available or errored)
  const cachedMem = memoryCache.get(key);
  
  if (cachedMem && cachedMem.expires > now) {
    return cachedMem.data;
  }

  const fresh = await fetcher();
  memoryCache.set(key, {
    data: fresh,
    expires: now + ttlSeconds * 1000,
  });

  // Cleanup old entries every 100 gets
  if (Math.random() < 0.01) {
    for (const [k, v] of memoryCache.entries()) {
      if (v.expires <= now) {
        memoryCache.delete(k);
      }
    }
  }

  return fresh;
}

export async function invalidateCache(pattern: string): Promise<void> {
  const client = getRedis();
  
  if (client) {
    try {
      const keys = await client.keys(pattern);
      if (keys.length > 0) {
        await client.del(...keys);
      }
    } catch (error) {
      console.warn('Redis invalidate error:', error);
    }
  }

  // Also clear memory cache
  const regex = new RegExp(pattern.replace('*', '.*'));
  for (const key of memoryCache.keys()) {
    if (regex.test(key)) {
      memoryCache.delete(key);
    }
  }
}

