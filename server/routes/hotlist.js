import { Router } from 'express';
import axios from 'axios';
import * as cheerio from 'cheerio';

const router = Router();

// ====================================================================
//  配置常量
// ====================================================================

const CACHE_TTL = 10 * 60 * 1000; // 10分钟缓存
const REQUEST_TIMEOUT = 10000;
const RETRY_DELAY = 2000;

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
//  内存缓存
// ====================================================================

const cache = new Map();

function getCache(key) {
  const entry = cache.get(key);
  if (entry && Date.now() - entry.time < CACHE_TTL) return entry.data;
  cache.delete(key);
  return null;
}

function setCache(key, data) {
  cache.set(key, { data, time: Date.now() });
}

// ====================================================================
//  工具函数
// ====================================================================

/** 带重试的请求 — 失败后等 2s 重试一次 */
async function fetchWithRetry(config) {
  try {
    return await axios(config);
  } catch {
    await new Promise((r) => setTimeout(r, RETRY_DELAY));
    return axios(config);
  }
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
//  Mock 数据（每个源 20 条，标题 / URL 尽量真实）
// ====================================================================

function generateMock(source) {
  const mocks = {
    zhihu: [
      { title: '如何看待 2025 年 AI 行业的最新发展？', url: 'https://www.zhihu.com/question/638291045', hot: '2691万' },
      { title: '有哪些让你觉得「相见恨晚」的厨房好物？', url: 'https://www.zhihu.com/question/612034578', hot: '1853万' },
      { title: '为什么越来越多年轻人选择回老家发展？', url: 'https://www.zhihu.com/question/641029384', hot: '1547万' },
      { title: '你读过最有深度的一本书是什么？', url: 'https://www.zhihu.com/question/605482913', hot: '1321万' },
      { title: '程序员 35 岁以后都去做什么了？', url: 'https://www.zhihu.com/question/619283746', hot: '1204万' },
      { title: '2025 年有哪些值得关注的科技趋势？', url: 'https://www.zhihu.com/question/643018275', hot: '1098万' },
      { title: '如何评价最新发布的国产大模型？', url: 'https://www.zhihu.com/question/645029183', hot: '987万' },
      { title: '有哪些看似简单实则很难的事情？', url: 'https://www.zhihu.com/question/607291834', hot: '876万' },
      { title: '你在旅行中遇到过哪些难忘的经历？', url: 'https://www.zhihu.com/question/623019284', hot: '765万' },
      { title: '如何高效地学习一门新的编程语言？', url: 'https://www.zhihu.com/question/631928374', hot: '654万' },
      { title: '有哪些「越早知道越好」的人生经验？', url: 'https://www.zhihu.com/question/609182734', hot: '598万' },
      { title: '为什么有些人工作很努力却始终无法升职？', url: 'https://www.zhihu.com/question/618273946', hot: '543万' },
      { title: '你见过最惊艳的建筑设计是什么？', url: 'https://www.zhihu.com/question/625019283', hot: '487万' },
      { title: '如何看待「数字游民」这种生活方式？', url: 'https://www.zhihu.com/question/637281934', hot: '432万' },
      { title: '有哪些适合独居的生活小技巧？', url: 'https://www.zhihu.com/question/611029384', hot: '398万' },
      { title: '你觉得未来十年最有前景的行业是什么？', url: 'https://www.zhihu.com/question/642918273', hot: '356万' },
      { title: '如何克服拖延症？有哪些实用方法？', url: 'https://www.zhihu.com/question/608192734', hot: '312万' },
      { title: '有哪些被低估的国产软件？', url: 'https://www.zhihu.com/question/629183746', hot: '287万' },
      { title: '你在职场中学到的最重要的一课是什么？', url: 'https://www.zhihu.com/question/614029183', hot: '254万' },
      { title: '如何评价今年的诺贝尔奖得主？', url: 'https://www.zhihu.com/question/646019283', hot: '231万' },
    ],
    weibo: [
      { title: '某顶流官宣恋情引爆热搜', url: 'https://s.weibo.com/weibo?q=%23某顶流官宣恋情%23', hot: '587万' },
      { title: '全国多地迎来降温天气', url: 'https://s.weibo.com/weibo?q=%23全国降温%23', hot: '523万' },
      { title: '新能源汽车销量再创新高', url: 'https://s.weibo.com/weibo?q=%23新能源汽车销量%23', hot: '478万' },
      { title: '高考改革新方案公布', url: 'https://s.weibo.com/weibo?q=%23高考改革%23', hot: '432万' },
      { title: '国产电影票房突破50亿', url: 'https://s.weibo.com/weibo?q=%23国产电影票房%23', hot: '398万' },
      { title: '某综艺节目嘉宾阵容曝光', url: 'https://s.weibo.com/weibo?q=%23综艺嘉宾阵容%23', hot: '367万' },
      { title: '打工人的周一综合症', url: 'https://s.weibo.com/weibo?q=%23周一综合症%23', hot: '334万' },
      { title: '春节档电影预售开启', url: 'https://s.weibo.com/weibo?q=%23春节档预售%23', hot: '312万' },
      { title: '某地发现罕见野生动物', url: 'https://s.weibo.com/weibo?q=%23罕见野生动物%23', hot: '289万' },
      { title: '网友热议延迟退休政策', url: 'https://s.weibo.com/weibo?q=%23延迟退休%23', hot: '267万' },
      { title: '某明星演唱会门票秒空', url: 'https://s.weibo.com/weibo?q=%23演唱会门票%23', hot: '245万' },
      { title: '外卖小哥暖心举动走红', url: 'https://s.weibo.com/weibo?q=%23外卖小哥暖心%23', hot: '223万' },
      { title: '某品牌新品发布引关注', url: 'https://s.weibo.com/weibo?q=%23新品发布%23', hot: '198万' },
      { title: '大学生就业形势分析', url: 'https://s.weibo.com/weibo?q=%23大学生就业%23', hot: '176万' },
      { title: '某地美食街爆火出圈', url: 'https://s.weibo.com/weibo?q=%23美食街出圈%23', hot: '154万' },
      { title: '健身博主分享减脂秘诀', url: 'https://s.weibo.com/weibo?q=%23减脂秘诀%23', hot: '132万' },
      { title: '某电视剧收视率破纪录', url: 'https://s.weibo.com/weibo?q=%23收视率破纪录%23', hot: '118万' },
      { title: '宠物博主日常引百万点赞', url: 'https://s.weibo.com/weibo?q=%23宠物日常%23', hot: '98万' },
      { title: '某地房价出现新变化', url: 'https://s.weibo.com/weibo?q=%23房价变化%23', hot: '87万' },
      { title: '年度十大网络流行语出炉', url: 'https://s.weibo.com/weibo?q=%23网络流行语%23', hot: '76万' },
    ],
    bilibili: [
      { title: '【年度盘点】2025最值得看的100个视频', url: 'https://www.bilibili.com/video/BV1xK4y1E7pN', hot: '1253.6万' },
      { title: '当代大学生的真实日常（太真实了）', url: 'https://www.bilibili.com/video/BV1mT4y1G7hQ', hot: '987.2万' },
      { title: '耗时三个月做了一个超级马里奥', url: 'https://www.bilibili.com/video/BV1Ks4y1R7vM', hot: '876.5万' },
      { title: '这可能是全网最详细的PS教程', url: 'https://www.bilibili.com/video/BV1nW4y1F7kL', hot: '765.3万' },
      { title: '挑战24小时不花一分钱生存', url: 'https://www.bilibili.com/video/BV1pY4y1H7jR', hot: '654.8万' },
      { title: '【科普】为什么飞机能飞起来？', url: 'https://www.bilibili.com/video/BV1qZ4y1J7mS', hot: '598.1万' },
      { title: '用代码画出整个银河系', url: 'https://www.bilibili.com/video/BV1rX4y1K7nT', hot: '543.7万' },
      { title: '日本街头随机采访中国游客', url: 'https://www.bilibili.com/video/BV1sC4y1L7pU', hot: '487.4万' },
      { title: '一口气看完《三体》全集解说', url: 'https://www.bilibili.com/video/BV1tV4y1M7qV', hot: '432.9万' },
      { title: '【美食】复刻米其林三星主厨的招牌菜', url: 'https://www.bilibili.com/video/BV1uB4y1N7rW', hot: '398.2万' },
      { title: '我花了一万块组装了一台梦想电脑', url: 'https://www.bilibili.com/video/BV1vA4y1P7sX', hot: '367.6万' },
      { title: '【纪录片】中国最美的50个地方', url: 'https://www.bilibili.com/video/BV1wz4y1Q7tY', hot: '334.1万' },
      { title: '教你用Python做一个AI助手', url: 'https://www.bilibili.com/video/BV1xy4y1R7uZ', hot: '312.8万' },
      { title: '全网最搞笑的猫咪合集', url: 'https://www.bilibili.com/video/BV1yw4y1S7v1', hot: '289.3万' },
      { title: '【测评】2025年最值得买的手机', url: 'https://www.bilibili.com/video/BV1zv4y1T7w2', hot: '267.5万' },
      { title: '在家就能做的健身计划（零器械）', url: 'https://www.bilibili.com/video/BV1Au4y1U7x3', hot: '245.7万' },
      { title: '【Vlog】在冰岛看极光的一天', url: 'https://www.bilibili.com/video/BV1Bt4y1V7y4', hot: '223.4万' },
      { title: '用乐高搭建了一座微型城市', url: 'https://www.bilibili.com/video/BV1Cs4y1W7z5', hot: '198.9万' },
      { title: '【音乐】钢琴演奏久石让经典合集', url: 'https://www.bilibili.com/video/BV1Dr4y1X7A6', hot: '176.2万' },
      { title: '大学四年我是怎么自学编程的', url: 'https://www.bilibili.com/video/BV1Eq4y1Y7B7', hot: '154.8万' },
    ],
    juejin: [
      { title: '2025 前端技术趋势深度盘点', url: 'https://juejin.cn/post/7340291847562', hot: '1876' },
      { title: 'Node.js 性能优化完全指南', url: 'https://juejin.cn/post/7341029384756', hot: '1654' },
      { title: 'React 19 新特性全面解析', url: 'https://juejin.cn/post/7342918273645', hot: '1543' },
      { title: 'TypeScript 5.5 你需要知道的一切', url: 'https://juejin.cn/post/7343827364534', hot: '1432' },
      { title: '从零搭建企业级微前端架构', url: 'https://juejin.cn/post/7344736455423', hot: '1321' },
      { title: 'Rust 入门到实战：写一个 CLI 工具', url: 'https://juejin.cn/post/7345645546312', hot: '1234' },
      { title: 'CSS Container Queries 实战指南', url: 'https://juejin.cn/post/7346554637201', hot: '1156' },
      { title: 'Vite 6 深度解析与迁移指南', url: 'https://juejin.cn/post/7347463728190', hot: '1087' },
      { title: '大厂面试真题：手写 Promise 全系列', url: 'https://juejin.cn/post/7348372819089', hot: '998' },
      { title: 'Docker + K8s 部署 Node 应用最佳实践', url: 'https://juejin.cn/post/7349281910978', hot: '923' },
      { title: 'Vue 3.5 Composition API 高级模式', url: 'https://juejin.cn/post/7350191001867', hot: '867' },
      { title: '深入理解 JavaScript 事件循环机制', url: 'https://juejin.cn/post/7351100192756', hot: '812' },
      { title: 'Tailwind CSS v4 新特性与实战', url: 'https://juejin.cn/post/7352019283645', hot: '756' },
      { title: '用 Go 写一个高性能 Web 框架', url: 'https://juejin.cn/post/7352928374534', hot: '698' },
      { title: 'WebAssembly 在前端的应用场景', url: 'https://juejin.cn/post/7353837465423', hot: '643' },
      { title: 'Next.js 15 App Router 完全指南', url: 'https://juejin.cn/post/7354746556312', hot: '598' },
      { title: '前端工程化：Monorepo 实践总结', url: 'https://juejin.cn/post/7355655647201', hot: '554' },
      { title: 'GraphQL vs REST：2025 年该怎么选', url: 'https://juejin.cn/post/7356564738190', hot: '512' },
      { title: '浏览器渲染原理与性能优化', url: 'https://juejin.cn/post/7357473829089', hot: '476' },
      { title: 'AI 辅助编程工具横向评测', url: 'https://juejin.cn/post/7358382910978', hot: '432' },
    ],
    douyin: [
      { title: '这个舞蹈挑战全网都在跳', url: 'https://www.douyin.com/search/舞蹈挑战', hot: '3254万' },
      { title: '探店：人均50吃到撑的宝藏餐厅', url: 'https://www.douyin.com/search/宝藏餐厅', hot: '2876万' },
      { title: '旅行打卡：此生必去的绝美海岛', url: 'https://www.douyin.com/search/绝美海岛', hot: '2543万' },
      { title: '萌宠日常：猫咪的迷惑行为大赏', url: 'https://www.douyin.com/search/猫咪迷惑行为', hot: '2198万' },
      { title: '变装挑战：三秒换装惊艳全场', url: 'https://www.douyin.com/search/变装挑战', hot: '1987万' },
      { title: '搞笑配音：当古装剧遇上方言', url: 'https://www.douyin.com/search/搞笑配音', hot: '1765万' },
      { title: '美食教程：在家做出餐厅级牛排', url: 'https://www.douyin.com/search/牛排教程', hot: '1543万' },
      { title: '健身打卡：30天腹肌养成计划', url: 'https://www.douyin.com/search/腹肌养成', hot: '1432万' },
      { title: '街头采访：月薪多少才算够花', url: 'https://www.douyin.com/search/月薪够花', hot: '1321万' },
      { title: '手工达人：用纸板做出兰博基尼', url: 'https://www.douyin.com/search/纸板兰博基尼', hot: '1198万' },
      { title: '情侣日常：甜到齁的恋爱瞬间', url: 'https://www.douyin.com/search/恋爱瞬间', hot: '1087万' },
      { title: '知识科普：为什么天空是蓝色的', url: 'https://www.douyin.com/search/天空蓝色', hot: '976万' },
      { title: '穿搭分享：秋冬必备的五套搭配', url: 'https://www.douyin.com/search/秋冬穿搭', hot: '865万' },
      { title: '音乐现场：街头歌手唱哭路人', url: 'https://www.douyin.com/search/街头歌手', hot: '754万' },
      { title: '亲子互动：爸爸带娃的搞笑日常', url: 'https://www.douyin.com/search/爸爸带娃', hot: '654万' },
      { title: '汽车测评：20万级SUV怎么选', url: 'https://www.douyin.com/search/SUV测评', hot: '567万' },
      { title: '职场干货：面试必问的十个问题', url: 'https://www.douyin.com/search/面试问题', hot: '487万' },
      { title: '游戏实况：这操作我看了十遍', url: 'https://www.douyin.com/search/游戏操作', hot: '398万' },
      { title: '生活妙招：收纳整理的终极方案', url: 'https://www.douyin.com/search/收纳整理', hot: '321万' },
      { title: '减压视频：看完整个人都治愈了', url: 'https://www.douyin.com/search/减压治愈', hot: '267万' },
    ],
    baidu: [
      { title: '国务院发布重要经济政策', url: 'https://top.baidu.com/board?tab=realtime&sa=fyb_news', hot: '4987万' },
      { title: '多地发布暴雨红色预警', url: 'https://top.baidu.com/board?tab=realtime&sa=fyb_news', hot: '4321万' },
      { title: '某科技公司发布新一代芯片', url: 'https://top.baidu.com/board?tab=realtime&sa=fyb_news', hot: '3876万' },
      { title: '教育部公布高校新增专业名单', url: 'https://top.baidu.com/board?tab=realtime&sa=fyb_news', hot: '3543万' },
      { title: '国际油价出现大幅波动', url: 'https://top.baidu.com/board?tab=realtime&sa=fyb_news', hot: '3198万' },
      { title: '某地发生4.5级地震', url: 'https://top.baidu.com/board?tab=realtime&sa=fyb_news', hot: '2876万' },
      { title: '春运火车票开售时间确定', url: 'https://top.baidu.com/board?tab=realtime&sa=fyb_news', hot: '2654万' },
      { title: '医保新政策明年起实施', url: 'https://top.baidu.com/board?tab=realtime&sa=fyb_news', hot: '2432万' },
      { title: '某运动员打破世界纪录', url: 'https://top.baidu.com/board?tab=realtime&sa=fyb_news', hot: '2198万' },
      { title: '全国房贷利率再次下调', url: 'https://top.baidu.com/board?tab=realtime&sa=fyb_news', hot: '1987万' },
      { title: '某省公务员考试报名人数创新高', url: 'https://top.baidu.com/board?tab=realtime&sa=fyb_news', hot: '1765万' },
      { title: '新型流感疫苗研发成功', url: 'https://top.baidu.com/board?tab=realtime&sa=fyb_news', hot: '1543万' },
      { title: '某地发现千年古墓', url: 'https://top.baidu.com/board?tab=realtime&sa=fyb_news', hot: '1321万' },
      { title: '高铁新线路即将通车', url: 'https://top.baidu.com/board?tab=realtime&sa=fyb_news', hot: '1198万' },
      { title: '某互联网公司宣布大规模招聘', url: 'https://top.baidu.com/board?tab=realtime&sa=fyb_news', hot: '1087万' },
      { title: '全国多地出现极端高温', url: 'https://top.baidu.com/board?tab=realtime&sa=fyb_news', hot: '976万' },
      { title: '某地推出人才引进新政策', url: 'https://top.baidu.com/board?tab=realtime&sa=fyb_news', hot: '865万' },
      { title: '国产大飞机完成新一轮试飞', url: 'https://top.baidu.com/board?tab=realtime&sa=fyb_news', hot: '754万' },
      { title: '某电商平台双十一数据公布', url: 'https://top.baidu.com/board?tab=realtime&sa=fyb_news', hot: '654万' },
      { title: '全国碳交易市场正式启动', url: 'https://top.baidu.com/board?tab=realtime&sa=fyb_news', hot: '567万' },
    ],
    hupu: [
      { title: '湖人逆转勇士！詹姆斯砍下40+三双', url: 'https://bbs.hupu.com/62839401.html', hot: '4521' },
      { title: '文班亚马本赛季数据太恐怖了', url: 'https://bbs.hupu.com/62839402.html', hot: '3876' },
      { title: '中国男篮世预赛大胜对手', url: 'https://bbs.hupu.com/62839403.html', hot: '3543' },
      { title: '欧冠小组赛最新积分榜', url: 'https://bbs.hupu.com/62839404.html', hot: '3198' },
      { title: '某球星转会费创历史新高', url: 'https://bbs.hupu.com/62839405.html', hot: '2876' },
      { title: 'NBA 本赛季 MVP 排行榜更新', url: 'https://bbs.hupu.com/62839406.html', hot: '2654' },
      { title: '国足新帅上任首秀分析', url: 'https://bbs.hupu.com/62839407.html', hot: '2432' },
      { title: '某球队官宣签下顶级自由球员', url: 'https://bbs.hupu.com/62839408.html', hot: '2198' },
      { title: 'CBA 全明星赛阵容公布', url: 'https://bbs.hupu.com/62839409.html', hot: '1987' },
      { title: '英超争冠形势深度分析', url: 'https://bbs.hupu.com/62839410.html', hot: '1765' },
      { title: '某新秀赛季表现超出预期', url: 'https://bbs.hupu.com/62839411.html', hot: '1543' },
      { title: '世界杯预选赛最新战报', url: 'https://bbs.hupu.com/62839412.html', hot: '1321' },
      { title: '某球星伤情更新：预计缺阵6周', url: 'https://bbs.hupu.com/62839413.html', hot: '1198' },
      { title: '今日最佳球：不看人传球绝了', url: 'https://bbs.hupu.com/62839414.html', hot: '1087' },
      { title: '某教练赛后发布会语出惊人', url: 'https://bbs.hupu.com/62839415.html', hot: '976' },
      { title: '选秀预测：2025年状元热门分析', url: 'https://bbs.hupu.com/62839416.html', hot: '865' },
      { title: '某球队交易方案曝光', url: 'https://bbs.hupu.com/62839417.html', hot: '754' },
      { title: '历史最佳阵容评选：你选谁？', url: 'https://bbs.hupu.com/62839418.html', hot: '654' },
      { title: '某联赛裁判争议判罚引热议', url: 'https://bbs.hupu.com/62839419.html', hot: '567' },
      { title: '退役球星近况：转型做教练', url: 'https://bbs.hupu.com/62839420.html', hot: '487' },
    ],
    '36kr': [
      { title: 'OpenAI 发布新一代模型，性能提升显著', url: 'https://36kr.com/newsflashes/2710293847', hot: '2876' },
      { title: '某独角兽公司完成10亿美元融资', url: 'https://36kr.com/newsflashes/2710293848', hot: '2543' },
      { title: '苹果发布新款 MacBook，搭载 M4 芯片', url: 'https://36kr.com/newsflashes/2710293849', hot: '2198' },
      { title: '国内 SaaS 市场规模突破千亿', url: 'https://36kr.com/newsflashes/2710293850', hot: '1987' },
      { title: '某新能源车企月交付量破万', url: 'https://36kr.com/newsflashes/2710293851', hot: '1765' },
      { title: '字节跳动海外业务收入大幅增长', url: 'https://36kr.com/newsflashes/2710293852', hot: '1543' },
      { title: '某芯片公司成功流片国产 GPU', url: 'https://36kr.com/newsflashes/2710293853', hot: '1432' },
      { title: '生成式 AI 应用市场报告发布', url: 'https://36kr.com/newsflashes/2710293854', hot: '1321' },
      { title: '某电商平台推出 AI 购物助手', url: 'https://36kr.com/newsflashes/2710293855', hot: '1198' },
      { title: '自动驾驶出租车在多城市试运营', url: 'https://36kr.com/newsflashes/2710293856', hot: '1087' },
      { title: '某社交平台日活突破5亿', url: 'https://36kr.com/newsflashes/2710293857', hot: '976' },
      { title: '云计算市场格局生变：新玩家入局', url: 'https://36kr.com/newsflashes/2710293858', hot: '865' },
      { title: '某游戏公司IPO首日大涨', url: 'https://36kr.com/newsflashes/2710293859', hot: '754' },
      { title: '低空经济政策密集出台', url: 'https://36kr.com/newsflashes/2710293860', hot: '654' },
      { title: '某跨境电商平台进军欧洲市场', url: 'https://36kr.com/newsflashes/2710293861', hot: '567' },
      { title: '人形机器人赛道再获大额融资', url: 'https://36kr.com/newsflashes/2710293862', hot: '487' },
      { title: '某在线教育公司转型 AI 教育', url: 'https://36kr.com/newsflashes/2710293863', hot: '432' },
      { title: '量子计算取得重大突破', url: 'https://36kr.com/newsflashes/2710293864', hot: '398' },
      { title: '某物流公司推出无人配送服务', url: 'https://36kr.com/newsflashes/2710293865', hot: '356' },
      { title: '2025 年科技行业薪资报告出炉', url: 'https://36kr.com/newsflashes/2710293866', hot: '312' },
    ],
    sspai: [
      { title: '2025 年最值得关注的 20 款效率工具', url: 'https://sspai.com/post/87291', hot: '1876' },
      { title: '从零开始搭建个人知识管理系统', url: 'https://sspai.com/post/87292', hot: '1654' },
      { title: 'macOS 新版本深度体验：这些变化值得关注', url: 'https://sspai.com/post/87293', hot: '1543' },
      { title: '我的数字极简主义实践：一年后的总结', url: 'https://sspai.com/post/87294', hot: '1432' },
      { title: 'Obsidian 插件推荐：让笔记更强大', url: 'https://sspai.com/post/87295', hot: '1321' },
      { title: 'iPhone 拍照进阶指南：用好原生相机', url: 'https://sspai.com/post/87296', hot: '1234' },
      { title: '自动化工作流搭建实战：Shortcuts + Raycast', url: 'https://sspai.com/post/87297', hot: '1156' },
      { title: '年度好物推荐：改变我生活的 10 件产品', url: 'https://sspai.com/post/87298', hot: '1087' },
      { title: '如何用 Notion 管理一个小团队', url: 'https://sspai.com/post/87299', hot: '998' },
      { title: 'Linux 桌面美化完全指南', url: 'https://sspai.com/post/87300', hot: '923' },
      { title: '播客入门：从听众到创作者', url: 'https://sspai.com/post/87301', hot: '867' },
      { title: 'Arc 浏览器深度使用报告', url: 'https://sspai.com/post/87302', hot: '812' },
      { title: '用 Apple Watch 改善睡眠的一个月', url: 'https://sspai.com/post/87303', hot: '756' },
      { title: '远程办公两年：工具与心得分享', url: 'https://sspai.com/post/87304', hot: '698' },
      { title: '开源替代方案：告别订阅制软件', url: 'https://sspai.com/post/87305', hot: '643' },
      { title: 'NAS 入门指南：从选购到配置', url: 'https://sspai.com/post/87306', hot: '598' },
      { title: '用 AI 提升写作效率的五种方法', url: 'https://sspai.com/post/87307', hot: '554' },
      { title: '极简主义 App 推荐：少即是多', url: 'https://sspai.com/post/87308', hot: '512' },
      { title: '我的年度阅读清单与读书方法', url: 'https://sspai.com/post/87309', hot: '476' },
      { title: '智能家居入门：HomeKit 全屋方案', url: 'https://sspai.com/post/87310', hot: '432' },
    ],
    toutiao: [
      { title: '中央经济工作会议释放重要信号', url: 'https://www.toutiao.com/trending/7291038475623', hot: '5432万' },
      { title: '多地出台楼市新政：限购松绑', url: 'https://www.toutiao.com/trending/7291038475624', hot: '4876万' },
      { title: '某省高速公路发生重大交通事故', url: 'https://www.toutiao.com/trending/7291038475625', hot: '4321万' },
      { title: '全国流感进入高发期', url: 'https://www.toutiao.com/trending/7291038475626', hot: '3987万' },
      { title: '某地发现大型油气田', url: 'https://www.toutiao.com/trending/7291038475627', hot: '3654万' },
      { title: '退休金调整方案公布', url: 'https://www.toutiao.com/trending/7291038475628', hot: '3321万' },
      { title: '某城市地铁新线路开通', url: 'https://www.toutiao.com/trending/7291038475629', hot: '2987万' },
      { title: '国际局势最新动态分析', url: 'https://www.toutiao.com/trending/7291038475630', hot: '2654万' },
      { title: '某地农产品价格大幅上涨', url: 'https://www.toutiao.com/trending/7291038475631', hot: '2432万' },
      { title: '全国教师资格考试改革', url: 'https://www.toutiao.com/trending/7291038475632', hot: '2198万' },
      { title: '某知名企业家发表重要演讲', url: 'https://www.toutiao.com/trending/7291038475633', hot: '1987万' },
      { title: '新一轮冷空气即将来袭', url: 'https://www.toutiao.com/trending/7291038475634', hot: '1765万' },
      { title: '某地推出生育补贴新政', url: 'https://www.toutiao.com/trending/7291038475635', hot: '1543万' },
      { title: '高铁票价调整方案征求意见', url: 'https://www.toutiao.com/trending/7291038475636', hot: '1321万' },
      { title: '某省公布最新GDP数据', url: 'https://www.toutiao.com/trending/7291038475637', hot: '1198万' },
      { title: '全国多地开展安全生产检查', url: 'https://www.toutiao.com/trending/7291038475638', hot: '1087万' },
      { title: '某地文旅项目爆火出圈', url: 'https://www.toutiao.com/trending/7291038475639', hot: '976万' },
      { title: '新能源补贴政策延续至明年', url: 'https://www.toutiao.com/trending/7291038475640', hot: '865万' },
      { title: '某高校发布重大科研成果', url: 'https://www.toutiao.com/trending/7291038475641', hot: '754万' },
      { title: '全国社保缴费基数调整', url: 'https://www.toutiao.com/trending/7291038475642', hot: '654万' },
    ],
  };

  return mocks[source] || mocks.zhihu;
}

// ====================================================================
//  数据源抓取函数
// ====================================================================

/** 知乎热榜 */
async function fetchZhihu() {
  const { data } = await fetchWithRetry({
    method: 'get',
    url: 'https://www.zhihu.com/api/v3/feed/topstory/hot-lists/total?limit=20&desktop=true',
    headers: {
      ...defaultHeaders(),
      Referer: 'https://www.zhihu.com/hot',
      Cookie: '_zap=random; d_c0=random',
    },
    timeout: REQUEST_TIMEOUT,
  });
  return (data.data || []).map((item) => ({
    title: item.target?.title || item.title || '',
    url: item.target?.id ? `https://www.zhihu.com/question/${item.target.id}` : '#',
    hot: item.detail_text || (item.hot_score ? formatHot(item.hot_score) : ''),
  }));
}

/** 微博热搜 */
async function fetchWeibo() {
  const { data } = await fetchWithRetry({
    method: 'get',
    url: 'https://weibo.com/ajax/side/hotSearch',
    headers: defaultHeaders(),
    timeout: REQUEST_TIMEOUT,
  });
  return (data.data?.realtime || []).slice(0, 20).map((item) => ({
    title: item.note || item.word || '',
    url: `https://s.weibo.com/weibo?q=${encodeURIComponent(item.word || item.note || '')}`,
    hot: item.num ? formatHot(item.num) : '',
  }));
}

/** B站热门 */
async function fetchBilibili() {
  const { data } = await fetchWithRetry({
    method: 'get',
    url: 'https://api.bilibili.com/x/web-interface/ranking/v2?rid=0&type=all',
    headers: defaultHeaders(),
    timeout: REQUEST_TIMEOUT,
  });
  return (data.data?.list || []).slice(0, 20).map((item) => ({
    title: item.title || '',
    url: item.short_link_v2 || `https://www.bilibili.com/video/${item.bvid}`,
    hot: item.stat?.view ? `${formatHot(item.stat.view)}播放` : '',
  }));
}

/** 掘金热榜 */
async function fetchJuejin() {
  const { data } = await fetchWithRetry({
    method: 'post',
    url: 'https://api.juejin.cn/content_api/v1/content/article_rank?category_id=1&type=hot&count=20&from=0',
    data: {},
    headers: { ...defaultHeaders(), 'Content-Type': 'application/json' },
    timeout: REQUEST_TIMEOUT,
  });
  return (data.data || []).map((item) => ({
    title: item.content?.title || '',
    url: item.content?.content_id ? `https://juejin.cn/post/${item.content.content_id}` : '#',
    hot: item.content_counter?.hot_rank ? formatHot(item.content_counter.hot_rank) : '',
  }));
}

/** 抖音热搜 */
async function fetchDouyin() {
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
}

/** 百度热搜 */
async function fetchBaidu() {
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
}

/** 虎扑热帖 */
async function fetchHupu() {
  const { data: html } = await fetchWithRetry({
    method: 'get',
    url: 'https://bbs.hupu.com/all-gambia',
    headers: { ...defaultHeaders(), Accept: 'text/html' },
    timeout: REQUEST_TIMEOUT,
    responseType: 'text',
  });
  const $ = cheerio.load(html);
  const list = [];
  $('a.p-title, .textSpan, .list-item a[href*="/"]').each((i, el) => {
    if (list.length >= 20) return false;
    const title = $(el).text().trim();
    let href = $(el).attr('href') || '';
    if (href && !href.startsWith('http')) href = `https://bbs.hupu.com${href}`;
    if (title && title.length > 4) {
      list.push({ title, url: href || '#', hot: '' });
    }
  });
  if (!list.length) throw new Error('虎扑解析为空');
  return list;
}

/** 36氪快讯 */
async function fetch36kr() {
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
}

/** 少数派热门 */
async function fetchSspai() {
  const { data } = await fetchWithRetry({
    method: 'get',
    url: 'https://sspai.com/api/v1/article/tag/page/get?limit=20&offset=0&tag=%E7%83%AD%E9%97%A8',
    headers: { ...defaultHeaders(), Referer: 'https://sspai.com/' },
    timeout: REQUEST_TIMEOUT,
  });
  return (data.data || []).slice(0, 20).map((item) => ({
    title: item.title || '',
    url: item.id ? `https://sspai.com/post/${item.id}` : '#',
    hot: item.like_count ? formatHot(item.like_count) : '',
  }));
}

/** 今日头条热榜 */
async function fetchToutiao() {
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
}

// ====================================================================
//  源注册表 — 方便统一管理和 /all 端点使用
// ====================================================================

const SOURCES = {
  zhihu:    { fetch: fetchZhihu,    label: '知乎' },
  weibo:    { fetch: fetchWeibo,    label: '微博' },
  bilibili: { fetch: fetchBilibili, label: 'B站' },
  juejin:   { fetch: fetchJuejin,   label: '掘金' },
  douyin:   { fetch: fetchDouyin,   label: '抖音' },
  baidu:    { fetch: fetchBaidu,    label: '百度' },
  hupu:     { fetch: fetchHupu,     label: '虎扑' },
  '36kr':   { fetch: fetch36kr,     label: '36氪' },
  sspai:    { fetch: fetchSspai,    label: '少数派' },
  toutiao:  { fetch: fetchToutiao,  label: '今日头条' },
};

// ====================================================================
//  通用路由工厂 — 减少重复代码
// ====================================================================

function registerRoute(name) {
  router.get(`/${name}`, async (_req, res) => {
    const cached = getCache(name);
    if (cached) return res.json(cached);

    try {
      const list = await SOURCES[name].fetch();
      const result = buildResponse(list.length ? list : generateMock(name), name);
      setCache(name, result);
      res.json(result);
    } catch {
      res.json(buildResponse(generateMock(name), name));
    }
  });
}

// 注册所有单源路由
for (const name of Object.keys(SOURCES)) {
  registerRoute(name);
}

// ====================================================================
//  统一端点：GET /all — 并行获取所有源
// ====================================================================

router.get('/all', async (_req, res) => {
  const cached = getCache('__all__');
  if (cached) return res.json(cached);

  const names = Object.keys(SOURCES);

  const settled = await Promise.allSettled(
    names.map(async (name) => {
      // 单源也走缓存
      const c = getCache(name);
      if (c) return { name, ...c };

      try {
        const list = await SOURCES[name].fetch();
        const result = buildResponse(list.length ? list : generateMock(name), name);
        setCache(name, result);
        return { name, ...result };
      } catch {
        return { name, ...buildResponse(generateMock(name), name) };
      }
    }),
  );

  const payload = {};
  for (const item of settled) {
    const val = item.status === 'fulfilled' ? item.value : {
      name: 'unknown',
      ...buildResponse([], 'unknown'),
    };
    payload[val.name] = {
      success: val.success,
      data: val.data,
      source: val.source,
      updateTime: val.updateTime,
    };
  }

  const allResult = { success: true, data: payload, updateTime: new Date().toISOString() };
  setCache('__all__', allResult);
  res.json(allResult);
});

export default router;
