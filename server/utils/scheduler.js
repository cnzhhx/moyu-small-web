import { setCache } from './cache.js';
import { sendHotlistFailureNotification, sendSystemAlert } from './mailer.js';

/**
 * 定时任务调度器
 * 用于定时抓取热榜数据，避免前端请求触发实时爬取
 * 特性：
 * - 只在 8:00-22:00 更新
 * - 智能降级：连续失败延长间隔
 * - 邮件通知失败
 */

// 调度器配置
const SCHEDULER_CONFIG = {
  // 更新时间段（24小时制）
  activeHours: { start: 8, end: 22 }, // 8:00 - 22:00
  // 基础更新间隔（分钟）
  baseInterval: 120, // 2小时
  // 连续失败阈值
  failThreshold: 3,
  // 最大间隔倍数（失败后延长时间 = baseInterval * failMultiplier）
  maxFailMultiplier: 3, // 最多延长到 6 小时
};

// 调度器状态
const schedulerState = {
  isRunning: false,
  lastRun: null,
  nextRun: null,
  tasks: new Map(),
  intervalId: null,
  intervalMinutes: 60, // 实际运行间隔
};

/**
 * 创建定时任务
 * @param {string} name - 任务名称
 * @param {Function} taskFn - 任务函数
 * @param {number} intervalMinutes - 执行间隔（分钟）
 */
export function scheduleTask(name, taskFn, intervalMinutes) {
  const task = {
    name,
    taskFn,
    intervalMinutes,
    lastRun: null,
    lastError: null,
    runCount: 0,
    errorCount: 0,
  };

  schedulerState.tasks.set(name, task);
  console.log(`[调度器] 任务 "${name}" 已注册，间隔 ${intervalMinutes} 分钟`);
  return task;
}

/**
 * 检查当前是否在活跃时间段内
 */
function isInActiveHours() {
  const hour = new Date().getHours();
  return hour >= SCHEDULER_CONFIG.activeHours.start &&
         hour < SCHEDULER_CONFIG.activeHours.end;
}

/**
 * 计算任务的实际间隔（考虑失败次数）
 * @param {object} task - 任务对象
 */
function getTaskInterval(task) {
  // 根据连续失败次数计算间隔
  const consecutiveFails = task.consecutiveFails || 0;
  const multiplier = Math.min(
    1 + consecutiveFails * 0.5,
    SCHEDULER_CONFIG.maxFailMultiplier
  );
  return task.intervalMinutes * multiplier;
}

/**
 * 判断任务是否需要执行（基于上次执行时间和间隔）
 * @param {object} task - 任务对象
 */
function shouldTaskRun(task) {
  if (!task.lastRun) return true;

  const intervalMs = getTaskInterval(task) * 60 * 1000;
  const timeSinceLastRun = Date.now() - new Date(task.lastRun).getTime();
  return timeSinceLastRun >= intervalMs;
}

/**
 * 执行单个任务
 * @param {object} task - 任务对象
 */
async function executeTask(task) {
  const startTime = Date.now();
  const previousFails = task.consecutiveFails || 0;

  try {
    console.log(`[调度器] 开始执行任务: ${task.name}`);
    await task.taskFn();
    task.lastRun = new Date().toISOString();
    task.runCount++;
    task.lastError = null;
    task.consecutiveFails = 0; // 重置失败计数
    const duration = Date.now() - startTime;
    console.log(`[调度器] 任务 "${task.name}" 执行成功，耗时 ${duration}ms`);

    // 如果之前失败过，发送恢复通知
    if (previousFails >= SCHEDULER_CONFIG.failThreshold) {
      await sendSystemAlert(
        `${task.label || task.name} 恢复正常`,
        `数据源在连续 ${previousFails} 次失败后已恢复正常更新。`
      );
    }
  } catch (err) {
    task.errorCount++;
    task.consecutiveFails = (task.consecutiveFails || 0) + 1;
    task.lastError = {
      message: err.message,
      time: new Date().toISOString(),
    };
    console.error(`[调度器] 任务 "${task.name}" 执行失败（第${task.consecutiveFails}次）:`, err.message);

    // 发送失败通知（达到阈值时）
    if (task.consecutiveFails === SCHEDULER_CONFIG.failThreshold) {
      await sendHotlistFailureNotification(
        task.source || task.name,
        task.label || task.name,
        err.message,
        task.consecutiveFails
      );
    }
  }
}

/**
 * 执行所有任务
 */
async function executeAllTasks() {
  if (schedulerState.isRunning) {
    console.log('[调度器] 上一轮任务仍在执行，跳过本次');
    return;
  }

  // 检查是否在活跃时间段
  if (!isInActiveHours()) {
    const now = new Date();
    const nextHour = SCHEDULER_CONFIG.activeHours.start;
    console.log(`[调度器] 当前不在更新时间段内（${now.getHours()}:00），下次更新将在 ${nextHour}:00`);
    return;
  }

  schedulerState.isRunning = true;
  schedulerState.lastRun = new Date().toISOString();

  const tasks = Array.from(schedulerState.tasks.values());
  console.log(`[调度器] 开始执行 ${tasks.length} 个任务`);

  // 串行执行，避免并发请求被封IP
  for (const task of tasks) {
    // 检查该任务是否需要执行（基于各自间隔）
    if (!shouldTaskRun(task)) {
      const interval = getTaskInterval(task);
      console.log(`[调度器] 任务 "${task.name}" 跳过（下次执行: ${interval}分钟后）`);
      continue;
    }

    await executeTask(task);
    // 任务间添加随机延迟，模拟人类行为
    await randomDelay(1000, 3000);
  }

  schedulerState.nextRun = new Date(Date.now() + schedulerState.intervalMinutes * 60 * 1000).toISOString();
  schedulerState.isRunning = false;
  console.log('[调度器] 所有任务执行完成');
}

/**
 * 随机延迟
 * @param {number} min - 最小延迟（毫秒）
 * @param {number} max - 最大延迟（毫秒）
 */
function randomDelay(min, max) {
  const delay = Math.floor(Math.random() * (max - min + 1)) + min;
  return new Promise(resolve => setTimeout(resolve, delay));
}

/**
 * 获取下次执行间隔（默认60分钟）
 */
function getNextInterval() {
  // 默认60分钟
  return 60 * 60 * 1000;
}

/**
 * 启动调度器
 * @param {number} intervalMinutes - 全局执行间隔（分钟）
 */
export function startScheduler(intervalMinutes = 60) {
  if (schedulerState.intervalId) {
    console.log('[调度器] 已经启动');
    return;
  }

  schedulerState.intervalMinutes = intervalMinutes;
  console.log(`[调度器] 启动，执行间隔: ${intervalMinutes} 分钟`);

  // 立即执行一次（预热）
  setTimeout(() => {
    executeAllTasks();
  }, 5000); // 启动后5秒执行，避免阻塞启动流程

  // 定时执行
  const intervalMs = intervalMinutes * 60 * 1000;
  schedulerState.intervalId = setInterval(executeAllTasks, intervalMs);
  schedulerState.nextRun = new Date(Date.now() + intervalMs).toISOString();
}

/**
 * 停止调度器
 */
export function stopScheduler() {
  if (schedulerState.intervalId) {
    clearInterval(schedulerState.intervalId);
    schedulerState.intervalId = null;
    console.log('[调度器] 已停止');
  }
}

/**
 * 手动触发任务
 * @param {string} name - 任务名称，不传则执行所有
 */
export async function triggerTask(name) {
  if (name) {
    const task = schedulerState.tasks.get(name);
    if (task) {
      await executeTask(task);
    } else {
      throw new Error(`任务 "${name}" 不存在`);
    }
  } else {
    await executeAllTasks();
  }
}

/**
 * 获取调度器状态
 */
export function getSchedulerStatus() {
  return {
    isRunning: schedulerState.isRunning,
    lastRun: schedulerState.lastRun,
    nextRun: schedulerState.nextRun,
    tasks: Array.from(schedulerState.tasks.values()).map(task => ({
      name: task.name,
      intervalMinutes: task.intervalMinutes,
      lastRun: task.lastRun,
      runCount: task.runCount,
      errorCount: task.errorCount,
      lastError: task.lastError,
    })),
  };
}

/**
 * 注册热榜抓取任务
 * @param {object} sources - 数据源对象
 * @param {number} intervalMinutes - 更新间隔
 */
export function registerHotlistTasks(sources, intervalMinutes = 60) {
  // 为每个平台创建独立任务
  for (const [name, config] of Object.entries(sources)) {
    const task = scheduleTask(`hotlist-${name}`, async () => {
      try {
        const list = await config.fetch();
        if (list && list.length > 0) {
          const result = {
            success: true,
            data: list,
            source: name,
            updateTime: new Date().toISOString(),
          };
          await setCache(name, result);
          console.log(`[调度器] ${config.label} 数据已更新，共 ${list.length} 条`);
        }
      } catch (err) {
        console.error(`[调度器] ${config.label} 更新失败:`, err.message);
        throw err;
      }
    }, intervalMinutes);

    // 添加额外信息用于通知
    task.source = name;
    task.label = config.label;
  }

  // 启动调度器
  startScheduler(intervalMinutes);
}
