import express from 'express';
import cors from 'cors';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import swaggerUi from 'swagger-ui-express';
import hotlistRouter, { getCacheStats } from './routes/hotlist.js';
import dailyRouter from './routes/daily.js';
import { requestLogger, errorLogger } from './utils/logger.js';
import { getRedisClient } from './utils/cache.js';
import {
  recordHttpRequest,
  getMetrics,
  recordRedisConnection,
} from './utils/metrics.js';

const app = express();
const PORT = process.env.PORT || 3001;

// 存储活跃连接用于优雅关闭
const connections = new Set();
let server = null;

// ====================================================================
//  Swagger API 文档配置
// ====================================================================

const swaggerDocument = {
  openapi: '3.0.0',
  info: {
    title: '摸鱼热榜 API',
    description: '聚合多平台热榜数据的 API 服务',
    version: '2.0.0',
    contact: {
      name: '摸鱼团队',
    },
  },
  servers: [
    {
      url: `http://localhost:${PORT}`,
      description: '本地开发服务器',
    },
  ],
  tags: [
    { name: '热榜', description: '各平台热榜数据接口' },
    { name: '每日早报', description: '每日60秒早报接口' },
    { name: '监控', description: '健康检查和监控端点' },
  ],
  paths: {
    '/api/hotlist/{source}': {
      get: {
        tags: ['热榜'],
        summary: '获取指定平台热榜',
        description: '获取单个平台的热榜数据，支持缓存',
        parameters: [
          {
            name: 'source',
            in: 'path',
            required: true,
            description: '热榜来源',
            schema: {
              type: 'string',
              enum: ['zhihu', 'weibo', 'bilibili', 'juejin', 'douyin', 'baidu', 'hupu', '36kr', 'sspai', 'toutiao'],
            },
          },
        ],
        responses: {
          200: {
            description: '成功获取热榜数据',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    data: {
                      type: 'array',
                      items: {
                        type: 'object',
                        properties: {
                          title: { type: 'string' },
                          url: { type: 'string' },
                          hot: { type: 'string' },
                        },
                      },
                    },
                    source: { type: 'string' },
                    updateTime: { type: 'string', format: 'date-time' },
                  },
                },
              },
            },
          },
          429: {
            description: '请求过于频繁',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: false },
                    message: { type: 'string' },
                  },
                },
              },
            },
          },
          503: {
            description: '数据源不可用',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: false },
                    message: { type: 'string' },
                    data: { type: 'array' },
                    source: { type: 'string' },
                  },
                },
              },
            },
          },
        },
      },
    },
    '/api/hotlist/all': {
      get: {
        tags: ['热榜'],
        summary: '获取所有平台热榜',
        description: '并行获取所有平台的热榜数据',
        responses: {
          200: {
            description: '成功获取所有热榜数据',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean' },
                    data: {
                      type: 'object',
                      additionalProperties: {
                        type: 'object',
                        properties: {
                          success: { type: 'boolean' },
                          data: { type: 'array' },
                          source: { type: 'string' },
                          updateTime: { type: 'string' },
                          message: { type: 'string' },
                        },
                      },
                    },
                    updateTime: { type: 'string', format: 'date-time' },
                  },
                },
              },
            },
          },
        },
      },
    },
    '/api/daily/sentence': {
      get: {
        tags: ['每日早报'],
        summary: '获取每日一言',
        description: '获取随机一言（ hitokoto ）',
        responses: {
          200: {
            description: '成功获取每日一言',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean' },
                    data: {
                      type: 'object',
                      properties: {
                        content: { type: 'string', description: '一言内容' },
                        from: { type: 'string', description: '出处' },
                        author: { type: 'string', description: '作者' },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
    '/api/daily/countdown': {
      get: {
        tags: ['每日早报'],
        summary: '获取假期倒计时',
        description: '获取下一个假期和假期列表倒计时',
        responses: {
          200: {
            description: '成功获取假期倒计时',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean' },
                    data: {
                      type: 'object',
                      properties: {
                        next: {
                          type: 'object',
                          properties: {
                            name: { type: 'string', description: '假期名称' },
                            date: { type: 'string', format: 'date' },
                            days: { type: 'number', description: '剩余天数' },
                          },
                        },
                        list: {
                          type: 'array',
                          items: {
                            type: 'object',
                            properties: {
                              name: { type: 'string' },
                              date: { type: 'string', format: 'date' },
                              days: { type: 'number' },
                            },
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
    '/api/health': {
      get: {
        tags: ['监控'],
        summary: '健康检查',
        description: '获取服务器健康状态和运行信息',
        responses: {
          200: {
            description: '服务器正常运行',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    status: { type: 'string', example: 'ok' },
                    timestamp: { type: 'string', format: 'date-time' },
                    uptime: {
                      type: 'object',
                      properties: {
                        seconds: { type: 'number' },
                        formatted: { type: 'string' },
                      },
                    },
                    memory: {
                      type: 'object',
                      properties: {
                        used: { type: 'string' },
                        total: { type: 'string' },
                        rss: { type: 'string' },
                      },
                    },
                    cache: {
                      type: 'object',
                      properties: {
                        size: { type: 'number' },
                        hits: { type: 'number' },
                        misses: { type: 'number' },
                        hitRate: { type: 'string' },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
    '/metrics': {
      get: {
        tags: ['监控'],
        summary: 'Prometheus 指标',
        description: '获取 Prometheus 格式的监控指标',
        responses: {
          200: {
            description: 'Prometheus 指标数据',
            content: {
              'text/plain': {
                schema: { type: 'string' },
              },
            },
          },
        },
      },
    },
  },
};

// ====================================================================
//  中间件配置
// ====================================================================

// 请求ID中间件
app.use((req, res, next) => {
  req.requestId = req.get('X-Request-ID') || Math.random().toString(36).substring(2, 10);
  res.setHeader('X-Request-ID', req.requestId);
  next();
});

// CORS 配置
app.use(cors({
  origin: ['http://localhost:5173'],
  credentials: true,
}));

// 数据压缩
app.use(compression());

// 请求体解析
app.use(express.json());

// 结构化日志中间件
app.use(requestLogger);

// 指标收集中间件
app.use((req, res, next) => {
  const start = process.hrtime();

  res.on('finish', () => {
    const diff = process.hrtime(start);
    const duration = diff[0] + diff[1] / 1e9;
    const route = req.route ? req.route.path : req.path;
    recordHttpRequest(req.method, route, res.statusCode, duration);
  });

  next();
});

// ====================================================================
//  请求限流配置
// ====================================================================

// 热榜接口限流 - 每分钟最多30次
const hotlistLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    res.status(429).json({
      success: false,
      message: '请求过于频繁，请稍后再试',
    });
  },
});

// ====================================================================
//  路由注册
// ====================================================================

// API 文档
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

// 热榜路由
app.use('/api/hotlist', hotlistLimiter, hotlistRouter);
app.use('/api/daily', dailyRouter);

// ====================================================================
//  健康检查和监控端点
// ====================================================================

// 健康检查
app.get('/api/health', (_req, res) => {
  const memUsage = process.memoryUsage();
  const cacheStats = getCacheStats();

  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: {
      seconds: Math.floor(process.uptime()),
      formatted: `${Math.floor(process.uptime() / 3600)}h ${Math.floor((process.uptime() % 3600) / 60)}m`,
    },
    memory: {
      used: `${Math.round(memUsage.heapUsed / 1024 / 1024)}MB`,
      total: `${Math.round(memUsage.heapTotal / 1024 / 1024)}MB`,
      rss: `${Math.round(memUsage.rss / 1024 / 1024)}MB`,
    },
    cache: {
      size: cacheStats.size,
      hits: cacheStats.hits,
      misses: cacheStats.misses,
      hitRate: cacheStats.hitRate,
    },
  });
});

// Prometheus 指标端点
app.get('/metrics', async (_req, res) => {
  try {
    const metrics = await getMetrics();
    res.set('Content-Type', 'text/plain');
    res.send(metrics);
  } catch (error) {
    res.status(500).send('Error collecting metrics');
  }
});

// 错误日志中间件
app.use(errorLogger);

// ====================================================================
//  优雅关闭处理
// ====================================================================

async function gracefulShutdown(signal) {
  console.log(`\n${signal} 信号接收，开始优雅关闭...`);

  // 停止接收新连接
  if (server) {
    server.close(() => {
      console.log('HTTP 服务器已关闭');
    });
  }

  // 等待活跃连接完成（最多30秒）
  const timeout = setTimeout(() => {
    console.error('强制关闭：超时');
    process.exit(1);
  }, 30000);

  // 关闭所有活跃连接
  for (const connection of connections) {
    connection.destroy();
  }

  // 关闭 Redis 连接
  try {
    const redis = getRedisClient();
    if (redis) {
      await redis.quit();
      console.log('Redis 连接已关闭');
    }
  } catch (error) {
    console.error('关闭 Redis 连接时出错:', error.message);
  }

  clearTimeout(timeout);
  console.log('优雅关闭完成');
  process.exit(0);
}

// 监听关闭信号
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// 未捕获异常处理
process.on('uncaughtException', (error) => {
  console.error('未捕获的异常:', error);
  gracefulShutdown('UNCAUGHT_EXCEPTION');
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('未处理的 Promise 拒绝:', reason);
});

// ====================================================================
//  启动服务器
// ====================================================================

server = app.listen(PORT, () => {
  console.log(`摸鱼服务器已启动: http://localhost:${PORT}`);
  console.log(`API 文档: http://localhost:${PORT}/api-docs`);
  console.log(`健康检查: http://localhost:${PORT}/api/health`);
  console.log(`Prometheus 指标: http://localhost:${PORT}/metrics`);
});

// 跟踪活跃连接
server.on('connection', (connection) => {
  connections.add(connection);
  connection.on('close', () => {
    connections.delete(connection);
  });
});

// 记录 Redis 连接
recordRedisConnection();
