import client from 'prom-client';

// 创建默认注册表
const register = new client.Registry();

// 添加默认 Node.js 指标
client.collectDefaultMetrics({ register });

// ====================================================================
//  HTTP 请求指标
// ====================================================================

// 请求总数计数器
const httpRequestsTotal = new client.Counter({
  name: 'http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'route', 'status_code'],
  registers: [register],
});

// 请求持续时间直方图
const httpRequestDuration = new client.Histogram({
  name: 'http_request_duration_seconds',
  help: 'HTTP request duration in seconds',
  labelNames: ['method', 'route', 'status_code'],
  buckets: [0.01, 0.05, 0.1, 0.25, 0.5, 1, 2, 5, 10],
  registers: [register],
});

// 请求持续时间汇总
const httpRequestDurationSummary = new client.Summary({
  name: 'http_request_duration_summary_seconds',
  help: 'HTTP request duration summary in seconds',
  labelNames: ['method', 'route'],
  percentiles: [0.5, 0.9, 0.95, 0.99],
  registers: [register],
});

// ====================================================================
//  热榜抓取指标
// ====================================================================

// 热榜抓取总数
const hotlistFetchTotal = new client.Counter({
  name: 'hotlist_fetch_total',
  help: 'Total number of hotlist fetch attempts',
  labelNames: ['source', 'status'],
  registers: [register],
});

// 热榜抓取持续时间
const hotlistFetchDuration = new client.Histogram({
  name: 'hotlist_fetch_duration_seconds',
  help: 'Hotlist fetch duration in seconds',
  labelNames: ['source'],
  buckets: [0.1, 0.5, 1, 2, 3, 5, 10, 15, 30],
  registers: [register],
});

// 热榜条目数量
const hotlistEntriesCount = new client.Gauge({
  name: 'hotlist_entries_count',
  help: 'Number of entries in hotlist',
  labelNames: ['source'],
  registers: [register],
});

// 缓存命中次数
const cacheHitsTotal = new client.Counter({
  name: 'cache_hits_total',
  help: 'Total number of cache hits',
  labelNames: ['source'],
  registers: [register],
});

// 缓存未命中次数
const cacheMissesTotal = new client.Counter({
  name: 'cache_misses_total',
  help: 'Total number of cache misses',
  labelNames: ['source'],
  registers: [register],
});

// ====================================================================
//  Redis 连接指标
// ====================================================================

const redisConnectionsTotal = new client.Counter({
  name: 'redis_connections_total',
  help: 'Total number of Redis connections',
  registers: [register],
});

const redisErrorsTotal = new client.Counter({
  name: 'redis_errors_total',
  help: 'Total number of Redis errors',
  registers: [register],
});

// ====================================================================
//  辅助函数
// ====================================================================

/**
 * 记录 HTTP 请求指标
 */
export function recordHttpRequest(method, route, statusCode, durationSec) {
  httpRequestsTotal.inc({ method, route, status_code: statusCode });
  httpRequestDuration.observe({ method, route, status_code: statusCode }, durationSec);
  httpRequestDurationSummary.observe({ method, route }, durationSec);
}

/**
 * 记录热榜抓取指标
 */
export function recordHotlistFetch(source, success, durationSec, entriesCount = 0) {
  const status = success ? 'success' : 'failure';
  hotlistFetchTotal.inc({ source, status });
  hotlistFetchDuration.observe({ source }, durationSec);
  if (entriesCount > 0) {
    hotlistEntriesCount.set({ source }, entriesCount);
  }
}

/**
 * 记录缓存命中
 */
export function recordCacheHit(source) {
  cacheHitsTotal.inc({ source });
}

/**
 * 记录缓存未命中
 */
export function recordCacheMiss(source) {
  cacheMissesTotal.inc({ source });
}

/**
 * 记录 Redis 连接
 */
export function recordRedisConnection() {
  redisConnectionsTotal.inc();
}

/**
 * 记录 Redis 错误
 */
export function recordRedisError() {
  redisErrorsTotal.inc();
}

/**
 * 获取所有指标
 */
export async function getMetrics() {
  return register.metrics();
}

/**
 * 获取 Prometheus 注册表
 */
export function getRegister() {
  return register;
}

export default {
  recordHttpRequest,
  recordHotlistFetch,
  recordCacheHit,
  recordCacheMiss,
  recordRedisConnection,
  recordRedisError,
  getMetrics,
  getRegister,
};
