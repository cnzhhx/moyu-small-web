import winston from 'winston';
import DailyRotateFile from 'winston-daily-rotate-file';
import { v4 as uuidv4 } from 'uuid';
import path from 'path';
import fs from 'fs';

// 确保日志目录存在
const logsDir = path.join(process.cwd(), 'logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

// ====================================================================
//  日志格式定义
// ====================================================================

// JSON 结构化日志格式（生产环境）
const jsonFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss.SSS' }),
  winston.format.errors({ stack: true }),
  winston.format.json()
);

// 控制台格式（开发环境友好）
const consoleFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.colorize(),
  winston.format.printf(({ level, message, timestamp, requestId, ...metadata }) => {
    let msg = `${timestamp} [${level}]`;
    if (requestId) {
      msg += ` [${requestId}]`;
    }
    msg += `: ${message}`;
    if (Object.keys(metadata).length > 0) {
      const metaStr = Object.entries(metadata)
        .map(([k, v]) => `${k}=${JSON.stringify(v)}`)
        .join(' ');
      msg += ` | ${metaStr}`;
    }
    return msg;
  })
);

// ====================================================================
//  按日期分割的日志传输器
// ====================================================================

// 错误日志 - 按日期分割
const errorRotateTransport = new DailyRotateFile({
  filename: path.join(logsDir, 'error-%DATE%.log'),
  datePattern: 'YYYY-MM-DD',
  level: 'error',
  format: jsonFormat,
  maxSize: '50m',
  maxFiles: '30d',
  zippedArchive: true,
});

// 应用日志 - 按日期分割
const appRotateTransport = new DailyRotateFile({
  filename: path.join(logsDir, 'app-%DATE%.log'),
  datePattern: 'YYYY-MM-DD',
  format: jsonFormat,
  maxSize: '100m',
  maxFiles: '30d',
  zippedArchive: true,
});

// 请求日志 - 按日期分割
const requestRotateTransport = new DailyRotateFile({
  filename: path.join(logsDir, 'request-%DATE%.log'),
  datePattern: 'YYYY-MM-DD',
  format: jsonFormat,
  maxSize: '100m',
  maxFiles: '14d',
  zippedArchive: true,
});

// 热榜抓取日志 - 按日期分割
const hotlistRotateTransport = new DailyRotateFile({
  filename: path.join(logsDir, 'hotlist-%DATE%.log'),
  datePattern: 'YYYY-MM-DD',
  format: jsonFormat,
  maxSize: '50m',
  maxFiles: '14d',
  zippedArchive: true,
});

// 异常处理日志
const exceptionRotateTransport = new DailyRotateFile({
  filename: path.join(logsDir, 'exception-%DATE%.log'),
  datePattern: 'YYYY-MM-DD',
  maxSize: '50m',
  maxFiles: '30d',
  zippedArchive: true,
});

// Promise 拒绝日志
const rejectionRotateTransport = new DailyRotateFile({
  filename: path.join(logsDir, 'rejection-%DATE%.log'),
  datePattern: 'YYYY-MM-DD',
  maxSize: '50m',
  maxFiles: '30d',
  zippedArchive: true,
});

// ====================================================================
//  创建 Logger 实例
// ====================================================================

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  defaultMeta: {
    service: 'moyu-server',
    version: '2.0.0',
    environment: process.env.NODE_ENV || 'development',
  },
  transports: [
    errorRotateTransport,
    appRotateTransport,
    requestRotateTransport,
    hotlistRotateTransport,
    new winston.transports.Console({
      format: consoleFormat,
    }),
  ],
  exceptionHandlers: [exceptionRotateTransport],
  rejectionHandlers: [rejectionRotateTransport],
  exitOnError: false,
});

// 创建子 logger 用于特定模块
export function createChildLogger(module) {
  return logger.child({ module });
}

// ====================================================================
//  请求追踪工具
// ====================================================================

// 生成请求ID
export function generateRequestId() {
  return uuidv4().slice(0, 8);
}

// 请求上下文存储（用于跨异步调用传递请求ID）
const asyncStorage = new Map();

export function setRequestContext(req) {
  const asyncId = process.hrtime.bigint().toString();
  asyncStorage.set(asyncId, {
    requestId: req.requestId,
    startTime: req.startTime,
    path: req.path,
  });
  return asyncId;
}

export function getRequestContext(asyncId) {
  return asyncStorage.get(asyncId);
}

export function clearRequestContext(asyncId) {
  asyncStorage.delete(asyncId);
}

// ====================================================================
//  Express 中间件
// ====================================================================

// 请求日志中间件
export function requestLogger(req, res, next) {
  req.requestId = req.get('X-Request-ID') || generateRequestId();
  req.startTime = Date.now();

  // 设置响应头
  res.setHeader('X-Request-ID', req.requestId);

  // 记录请求开始
  const requestLog = {
    requestId: req.requestId,
    type: 'request_start',
    method: req.method,
    url: req.originalUrl || req.url,
    path: req.path,
    query: req.query,
    ip: req.ip || req.connection?.remoteAddress || req.socket?.remoteAddress,
    userAgent: req.get('user-agent'),
    referer: req.get('referer'),
    timestamp: new Date().toISOString(),
  };

  logger.info('Request started', requestLog);

  // 响应完成时记录
  res.on('finish', () => {
    const duration = Date.now() - req.startTime;
    const responseLog = {
      requestId: req.requestId,
      type: 'request_complete',
      method: req.method,
      url: req.originalUrl || req.url,
      path: req.path,
      statusCode: res.statusCode,
      duration: duration,
      durationMs: `${duration}ms`,
      contentLength: res.get('content-length'),
      ip: req.ip || req.connection?.remoteAddress,
    };

    if (res.statusCode >= 500) {
      logger.error('Request failed with server error', responseLog);
    } else if (res.statusCode >= 400) {
      logger.warn('Request completed with client error', responseLog);
    } else {
      logger.info('Request completed', responseLog);
    }
  });

  // 错误时记录
  res.on('error', (error) => {
    logger.error('Response error', {
      requestId: req.requestId,
      type: 'response_error',
      error: error.message,
      stack: error.stack,
    });
  });

  next();
}

// 错误日志中间件
export function errorLogger(err, req, res, next) {
  const errorLog = {
    requestId: req.requestId,
    type: 'request_error',
    method: req.method,
    url: req.originalUrl || req.url,
    path: req.path,
    error: err.message,
    stack: err.stack,
    code: err.code,
    statusCode: err.statusCode || res.statusCode,
    ip: req.ip || req.connection?.remoteAddress,
    timestamp: new Date().toISOString(),
  };

  logger.error('Request error', errorLog);
  next(err);
}

// ====================================================================
//  热榜专用日志
// ====================================================================

export function logHotlistFetch(source, success, duration, entriesCount, error = null) {
  const logData = {
    type: 'hotlist_fetch',
    source,
    success,
    duration,
    entriesCount,
    timestamp: new Date().toISOString(),
  };

  if (error) {
    logData.error = error.message;
    logData.errorStack = error.stack;
  }

  if (success) {
    logger.info(`Hotlist fetched: ${source}`, logData);
  } else {
    logger.error(`Hotlist fetch failed: ${source}`, logData);
  }
}

export function logCacheEvent(event, source, details = {}) {
  logger.info(`Cache ${event}: ${source}`, {
    type: 'cache_event',
    event,
    source,
    ...details,
    timestamp: new Date().toISOString(),
  });
}

// ====================================================================
//  性能日志
// ====================================================================

export function logPerformance(label, duration, metadata = {}) {
  logger.info(`Performance: ${label}`, {
    type: 'performance',
    label,
    duration,
    ...metadata,
    timestamp: new Date().toISOString(),
  });
}

// ====================================================================
//  导出
// ====================================================================

export default logger;
export { logger };
