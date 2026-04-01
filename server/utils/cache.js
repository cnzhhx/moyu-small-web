import Redis from 'ioredis';

// 配置常量
const CACHE_TTL = 10 * 60; // 10分钟（秒）

// 内存缓存
const memoryCache = new Map();
const cacheStats = {
  hits: 0,
  misses: 0,
  sets: 0,
  lastReset: new Date().toISOString(),
};

// Redis 连接
let redis = null;
let redisAvailable = false;

if (process.env.REDIS_URL) {
  try {
    redis = new Redis(process.env.REDIS_URL, {
      maxRetriesPerRequest: 3,
      retryStrategy: (times) => Math.min(times * 50, 2000),
    });

    redis.on('connect', () => {
      console.log('Redis 已连接');
      redisAvailable = true;
    });

    redis.on('error', (err) => {
      console.error('Redis 错误:', err.message);
      redisAvailable = false;
    });
  } catch (err) {
    console.error('Redis 初始化失败:', err.message);
  }
}

/**
 * 获取缓存
 * @param {string} key - 缓存键
 * @returns {Promise<object|null>} 缓存数据
 */
export async function getCache(key) {
  // 优先尝试 Redis
  if (redisAvailable && redis) {
    try {
      const data = await redis.get(key);
      if (data) {
        cacheStats.hits++;
        return JSON.parse(data);
      }
    } catch (err) {
      console.error('Redis get 错误:', err.message);
    }
  }

  // 回退到内存缓存
  const entry = memoryCache.get(key);
  if (entry && Date.now() - entry.time < CACHE_TTL * 1000) {
    cacheStats.hits++;
    return entry.data;
  }

  memoryCache.delete(key);
  cacheStats.misses++;
  return null;
}

/**
 * 设置缓存
 * @param {string} key - 缓存键
 * @param {object} data - 缓存数据
 */
export async function setCache(key, data) {
  // 写入 Redis
  if (redisAvailable && redis) {
    try {
      await redis.setex(key, CACHE_TTL, JSON.stringify(data));
    } catch (err) {
      console.error('Redis set 错误:', err.message);
    }
  }

  // 同时写入内存缓存
  memoryCache.set(key, { data, time: Date.now() });
  cacheStats.sets++;
}

/**
 * 删除缓存
 * @param {string} key - 缓存键
 */
export async function delCache(key) {
  if (redisAvailable && redis) {
    try {
      await redis.del(key);
    } catch (err) {
      console.error('Redis del 错误:', err.message);
    }
  }
  memoryCache.delete(key);
}

/**
 * 清空缓存
 */
export async function clearCache() {
  if (redisAvailable && redis) {
    try {
      await redis.flushdb();
    } catch (err) {
      console.error('Redis flush 错误:', err.message);
    }
  }
  memoryCache.clear();
}

/**
 * 获取缓存统计
 */
export function getCacheStats() {
  const entries = Array.from(memoryCache.entries());
  const now = Date.now();
  return {
    size: memoryCache.size,
    redisAvailable,
    hits: cacheStats.hits,
    misses: cacheStats.misses,
    sets: cacheStats.sets,
    hitRate: cacheStats.hits + cacheStats.misses > 0
      ? ((cacheStats.hits / (cacheStats.hits + cacheStats.misses)) * 100).toFixed(2) + '%'
      : '0%',
    lastReset: cacheStats.lastReset,
    keys: entries.map(([key, entry]) => ({
      key,
      age: Math.round((now - entry.time) / 1000) + 's',
      ttl: Math.max(0, Math.round((CACHE_TTL * 1000 - (now - entry.time)) / 1000)) + 's',
    })),
  };
}

/**
 * 重置缓存统计
 */
export function resetCacheStats() {
  cacheStats.hits = 0;
  cacheStats.misses = 0;
  cacheStats.sets = 0;
  cacheStats.lastReset = new Date().toISOString();
}

export { redis, redisAvailable };

/**
 * 获取 Redis 客户端实例
 */
export function getRedisClient() {
  return redis;
}
