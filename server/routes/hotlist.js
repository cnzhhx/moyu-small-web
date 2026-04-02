import { Router } from 'express';
import axios from 'axios';
import * as cheerio from 'cheerio';
import { getCache, setCache, getCacheStats, resetCacheStats } from '../utils/cache.js';
import {
  recordHotlistFetch,
  recordCacheHit,
  recordCacheMiss,
} from '../utils/metrics.js';
import { logHotlistFetch, logCacheEvent } from '../utils/logger.js';

const router = Router();

// ====================================================================
//  配置常量
// ====================================================================

const CACHE_TTL = 10 * 60 * 1000; // 10分钟缓存
const REQUEST_TIMEOUT = 10000;
const MAX_RETRIES = 3;
const BASE_RETRY_DELAY = 1000; // 1秒基础延迟

// 请求去重 Map：key -> Promise
const pendingRequests = new Map();

// ====================================================================
//  User-Agent 轮换池
// ====================================================================

const USER_AGENTS = [
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 14_4) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4 Safari/605.1.15',
  'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:125.0) Gecko/20100101 Firefox/125.0',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 14_4) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
];

function randomUA() {
  return USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)];
}

function defaultHeaders() {
  return {
    'User-Agent': randomUA(),
    Accept: 'application/json, text/html, */*',
  };
}

// ====================================================================
//  工具函数
// ====================================================================

/**
 * 指数退避延迟计算
 * @param {number} attempt - 当前尝试次数（从0开始）
 * @returns {number} 延迟毫秒数
 */
function getRetryDelay(attempt) {
  return BASE_RETRY_DELAY * Math.pow(2, attempt);
}

/**
 * 带指数退避重试的请求
 * @param {object} config - axios 配置
 * @param {number} attempt - 当前尝试次数
 * @returns {Promise} axios 响应
 */
async function fetchWithRetry(config, attempt = 0) {
  try {
    return await axios(config);
  } catch (err) {
    if (attempt >= MAX_RETRIES - 1) {
      throw err;
    }
    const delay = getRetryDelay(attempt);
    await new Promise((r) => setTimeout(r, delay));
    return fetchWithRetry(config, attempt + 1);
  }
}

/**
 * 请求去重包装器
 * @param {string} key - 去重键
 * @param {Function} fetchFn - 获取数据的函数
 * @returns {Promise} 数据
 */
async function dedupedFetch(key, fetchFn) {
  if (pendingRequests.has(key)) {
    return pendingRequests.get(key);
  }

  const requestPromise = fetchFn().finally(() => {
    pendingRequests.delete(key);
  });

  pendingRequests.set(key, requestPromise);
  return requestPromise;
}

/** 热度数字格式化：1234567 → "123.5万"，12345 → "1.2万"，999 → "999" */
function formatHot(num) {
  const n = typeof num === 'string' ? parseInt(num, 10) : num;
  if (!n && n !== 0) return '';
  if (n >= 10000) return `${(n / 10000).toFixed(1)}万`;
  return `${n}`;
}

/** 统一响应格式 */
function buildResponse(data, source) {
  return {
    success: true,
    data,
    source,
    updateTime: new Date().toISOString(),
  };
}

// ====================================================================
//  带指标记录的抓取包装器
// ====================================================================

async function fetchWithMetrics(name, fetchFn) {
  const startTime = process.hrtime();
  let success = false;
  let entriesCount = 0;
  let error = null;

  try {
    const result = await fetchFn();
    success = true;
    entriesCount = result?.length || 0;
    return result;
  } catch (err) {
    error = err;
    throw err;
  } finally {
    const diff = process.hrtime(startTime);
    const duration = diff[0] + diff[1] / 1e9;

    recordHotlistFetch(name, success, duration, entriesCount);
    logHotlistFetch(name, success, duration * 1000, entriesCount, error);
  }
}

// ====================================================================
//  数据源抓取函数
// ====================================================================

/** 知乎热榜 - 使用创作者热榜 API */
async function fetchZhihu() {
  return dedupedFetch('zhihu', async () =>
    fetchWithMetrics('zhihu', async () => {
      const { data } = await fetchWithRetry({
        method: 'get',
        url: 'https://www.zhihu.com/api/v4/creators/rank/hot?domain=0&period=hour&limit=20',
        headers: {
          ...defaultHeaders(),
          Referer: 'https://www.zhihu.com/creator',
        },
        timeout: REQUEST_TIMEOUT,
      });
      return (data.data || []).map((item) => ({
        title: item.question?.title || '',
        url: item.question?.url || '#',
        hot: item.reaction?.new_pv ? formatHot(item.reaction.new_pv) : '',
      }));
    })
  );
}

/** 微博热搜 - 需要 Referer */
async function fetchWeibo() {
  return dedupedFetch('weibo', async () =>
    fetchWithMetrics('weibo', async () => {
      const { data } = await fetchWithRetry({
        method: 'get',
        url: 'https://weibo.com/ajax/side/hotSearch',
        headers: {
          ...defaultHeaders(),
          Referer: 'https://weibo.com/hot/search',
          'X-Requested-With': 'XMLHttpRequest',
        },
        timeout: REQUEST_TIMEOUT,
      });
      return (data.data?.realtime || []).slice(0, 20).map((item) => ({
        title: item.note || item.word || '',
        url: `https://s.weibo.com/weibo?q=${encodeURIComponent(item.word || item.note || '')}`,
        hot: item.num ? formatHot(item.num) : '',
      }));
    })
  );
}

/** B站热门 - 使用入站必刷API */
async function fetchBilibili() {
  return dedupedFetch('bilibili', async () =>
    fetchWithMetrics('bilibili', async () => {
      const { data } = await fetchWithRetry({
        method: 'get',
        url: 'https://api.bilibili.com/x/web-interface/popular/precious?page_size=20',
        headers: {
          ...defaultHeaders(),
          Referer: 'https://www.bilibili.com',
        },
        timeout: REQUEST_TIMEOUT,
      });

      const list = (data.data?.list || []).slice(0, 20).map((item) => ({
        title: item.title || '',
        url: item.bvid ? `https://www.bilibili.com/video/${item.bvid}` : '#',
        hot: item.stat?.view ? `${formatHot(item.stat.view)}播放` : '',
        image: item.pic || item.cover || null,
      }));

      if (!list.length) throw new Error('B站热门获取为空');
      return list;
    })
  );
}

/** 掘金热榜 - 使用推荐 feed API */
async function fetchJuejin() {
  return dedupedFetch('juejin', async () =>
    fetchWithMetrics('juejin', async () => {
      const { data } = await fetchWithRetry({
        method: 'post',
        url: 'https://api.juejin.cn/recommend_api/v1/article/recommend_all_feed',
        data: {
          sort_type: 200,  // 热榜排序
          cursor: '0',
          limit: 20,
        },
        headers: {
          ...defaultHeaders(),
          'Content-Type': 'application/json',
          Referer: 'https://juejin.cn/',
        },
        timeout: REQUEST_TIMEOUT,
      });
      return (data.data || []).map((item, index) => ({
        title: item.item_info?.article_info?.title || '',
        url: item.item_info?.article_id ? `https://juejin.cn/post/${item.item_info.article_id}` : '#',
        hot: item.item_info?.article_info?.view_count ? formatHot(item.item_info.article_info.view_count) : '',
        image: item.item_info?.article_info?.cover_image || null,
      }));
    })
  );
}

/** 抖音热搜 */
async function fetchDouyin() {
  return dedupedFetch('douyin', async () =>
    fetchWithMetrics('douyin', async () => {
      const { data } = await fetchWithRetry({
        method: 'get',
        url: 'https://www.douyin.com/aweme/v1/web/hot/search/list/',
        headers: {
          ...defaultHeaders(),
          Referer: 'https://www.douyin.com/',
        },
        timeout: REQUEST_TIMEOUT,
      });
      return (data.data?.word_list || []).slice(0, 20).map((item) => ({
        title: item.word || '',
        url: `https://www.douyin.com/search/${encodeURIComponent(item.word || '')}`,
        hot: item.hot_value ? formatHot(item.hot_value) : '',
      }));
    })
  );
}

/** 百度热搜 */
async function fetchBaidu() {
  return dedupedFetch('baidu', async () =>
    fetchWithMetrics('baidu', async () => {
      const { data: html } = await fetchWithRetry({
        method: 'get',
        url: 'https://top.baidu.com/board?tab=realtime',
        headers: { ...defaultHeaders(), Accept: 'text/html' },
        timeout: REQUEST_TIMEOUT,
        responseType: 'text',
      });
      const $ = cheerio.load(html);
      const list = [];
      $('.category-wrap_iQLoo .content_1YWBm').each((i, el) => {
        if (i >= 20) return false;
        const title = $(el).find('.c-single-text-ellipsis').first().text().trim();
        const href = $(el).closest('a').attr('href') || '#';
        const hot = $(el).find('.hot-index_1Bl1a').text().trim();
        if (title) list.push({ title, url: href, hot: hot ? formatHot(parseInt(hot, 10)) : '' });
      });
      if (!list.length) throw new Error('百度热搜解析为空');
      return list;
    })
  );
}

/** 36氪快讯 */
async function fetch36kr() {
  return dedupedFetch('36kr', async () =>
    fetchWithMetrics('36kr', async () => {
      const { data } = await fetchWithRetry({
        method: 'get',
        url: 'https://36kr.com/api/newsflash',
        headers: { ...defaultHeaders(), Referer: 'https://36kr.com/newsflashes' },
        timeout: REQUEST_TIMEOUT,
      });
      const items = data?.data?.items || data?.data?.newsflashes || [];
      return items.slice(0, 20).map((item) => ({
        title: item.title || item.entity?.title || '',
        url: item.news_url || (item.id ? `https://36kr.com/newsflashes/${item.id}` : '#'),
        hot: item.counters?.view ? formatHot(item.counters.view) : '',
      }));
    })
  );
}

/** 今日头条热榜 */
async function fetchToutiao() {
  return dedupedFetch('toutiao', async () =>
    fetchWithMetrics('toutiao', async () => {
      const { data } = await fetchWithRetry({
        method: 'get',
        url: 'https://www.toutiao.com/hot-event/hot-board/?origin=toutiao_pc',
        headers: {
          ...defaultHeaders(),
          Referer: 'https://www.toutiao.com/',
        },
        timeout: REQUEST_TIMEOUT,
      });
      return (data.data || []).slice(0, 20).map((item) => ({
        title: item.Title || item.title || '',
        url: item.Url || item.url || '#',
        hot: item.HotValue ? formatHot(item.HotValue) : '',
      }));
    })
  );
}

// ====================================================================
//  源注册表
// ====================================================================

const SOURCES = {
  zhihu:    { fetch: fetchZhihu,    label: '知乎' },
  weibo:    { fetch: fetchWeibo,    label: '微博' },
  bilibili: { fetch: fetchBilibili, label: 'B站' },
  juejin:   { fetch: fetchJuejin,   label: '掘金' },
  douyin:   { fetch: fetchDouyin,   label: '抖音' },
  baidu:    { fetch: fetchBaidu,    label: '百度' },
  '36kr':   { fetch: fetch36kr,     label: '36氪' },
  toutiao:  { fetch: fetchToutiao,  label: '今日头条' },
};

// ====================================================================
//  通用路由工厂 - 只读缓存，不实时爬取
// ====================================================================

function registerRoute(name) {
  router.get(`/${name}`, async (req, res) => {
    // 优先从缓存读取
    const cached = await getCache(name);
    if (cached) {
      recordCacheHit(name);
      logCacheEvent('hit', name, { requestId: req.requestId });
      return res.json(cached);
    }

    // 缓存未命中，尝试实时抓取一次
    recordCacheMiss(name);
    logCacheEvent('miss', name, { requestId: req.requestId });

    const source = SOURCES[name];
    if (!source) {
      return res.status(404).json({ success: false, message: '未知数据源', data: [], source: name });
    }

    try {
      const list = await source.fetch();
      if (list && list.length > 0) {
        const result = buildResponse(list, name);
        await setCache(name, result);
        return res.json(result);
      }
      res.status(503).json({ success: false, message: '数据源暂时无数据', data: [], source: name });
    } catch (err) {
      res.status(503).json({
        success: false,
        message: `数据获取失败，请稍后再试`,
        data: [],
        source: name,
      });
    }
  });
}

// 注册所有单源路由
for (const name of Object.keys(SOURCES)) {
  registerRoute(name);
}

// ====================================================================
//  统一端点：GET /all
// ====================================================================

router.get('/all', async (req, res) => {
  const names = Object.keys(SOURCES);
  const payload = {};

  // 从缓存读取所有数据
  for (const name of names) {
    const cached = await getCache(name);
    if (cached) {
      recordCacheHit(name);
      payload[name] = {
        success: cached.success,
        data: cached.data,
        source: cached.source,
        updateTime: cached.updateTime,
      };
    } else {
      recordCacheMiss(name);
      payload[name] = {
        success: false,
        message: '数据正在初始化中',
        data: [],
        source: name,
        updateTime: new Date().toISOString(),
      };
    }
  }

  res.json({
    success: true,
    data: payload,
    updateTime: new Date().toISOString(),
  });
});

// ====================================================================
//  定时更新任务
// ====================================================================

import { registerHotlistTasks, getSchedulerStatus } from '../utils/scheduler.js';

/**
 * 初始化热榜定时更新
 * @param {number} intervalMinutes - 更新间隔（分钟），默认2小时
 */
export function initHotlistScheduler(intervalMinutes = 120) {
  console.log(`[热榜] 初始化定时更新，间隔: ${intervalMinutes} 分钟，时间段: 8:00-22:00`);

  // 注册所有热榜任务
  registerHotlistTasks(SOURCES, intervalMinutes);
}

/**
 * 手动触发所有热榜更新
 */
export async function refreshAllHotlists() {
  console.log('[热榜] 手动触发全量更新');
  for (const [name, config] of Object.entries(SOURCES)) {
    try {
      const list = await config.fetch();
      if (list && list.length > 0) {
        const result = buildResponse(list, name);
        await setCache(name, result);
        console.log(`[热榜] ${config.label} 已刷新`);
      }
    } catch (err) {
      console.error(`[热榜] ${config.label} 刷新失败:`, err.message);
    }
    // 添加延迟避免并发
    await new Promise(r => setTimeout(r, 2000));
  }
  console.log('[热榜] 全量更新完成');
}

// 导出函数
export { getCacheStats, resetCacheStats, getSchedulerStatus };
export default router;
