# 🐟 摸鱼岛

> 上班摸鱼神器，一站式热榜聚合、待办管理、工具箱

摸鱼岛是一个三件套项目，包含 Web 前端、后端服务和 VS Code 扩展，为打工人提供全方位的摸鱼体验。

## 📁 项目结构

```
moyu-small-web/
├── 📱 client/          # React + Vite 前端
├── 🔧 server/          # Express 后端服务
└── 🎯 vscode-extension/# VS Code 扩展
```

## 🌟 功能特性

### 📱 Client (Web 前端)

**热榜聚合**
- 知乎、微博、B站、掘金、抖音、百度、虎扑、36氪、少数派、头条
- 双栏/单栏自适应布局
- 实时热度显示
- 一键跳转原文

**待办清单**
- 本地存储持久化
- 优先级管理（高/中/低）
- 进度统计与激励语
- 拖拽排序
- 导入/导出功能

**工具箱**
- JSON 格式化/压缩/验证
- 文本对比
- Base64/URL 编解码
- 时间戳转换
- 密码生成器
- 字数统计
- 正则测试
- 颜色转换
- Markdown 预览
- 进制转换
- UUID 生成
- 摸鱼计算器
- 二维码生成

### 🔧 Server (后端服务)

**API 接口**
- `/api/hotlist/:source` - 获取单平台热榜
- `/api/hotlist/all` - 获取全部热榜
- `/api/daily/sentence` - 每日一言
- `/api/daily/countdown` - 假期倒计时
- `/api/health` - 健康检查
- `/api/stats` - 服务统计

**性能优化**
- Redis 缓存支持
- 请求去重合并
- 指数退避重试
- Gzip 压缩
- 限流保护（每分钟30次）

### 🎯 VS Code 扩展

**核心功能**
- 下班倒计时（状态栏实时显示）
- 每日一言
- 热榜树视图（侧边栏）
- Webview 面板（完整热榜）

**便捷操作**
- 快捷键 `Ctrl+Shift+M` 打开面板
- 命令面板集成
- 一键打开摸鱼网站
- 自定义下班时间

## 🚀 快速开始

### 环境要求
- Node.js 18+
- Redis (可选，用于缓存)
- VS Code 1.85+ (扩展)

### 安装依赖

```bash
# 1. 启动后端
cd server
npm install
npm run dev

# 2. 启动前端
cd client
npm install
npm run dev

# 3. 安装 VS Code 扩展
cd vscode-extension
npm install
# 按 F5 启动调试
```

### 访问应用
- Web: http://localhost:5173
- API: http://localhost:3001
- API 文档: http://localhost:3001/api-docs
- 监控指标: http://localhost:3001/metrics

## 🔌 API 文档

### 获取热榜

```http
GET /api/hotlist/zhihu
```

响应：
```json
{
  "success": true,
  "data": [
    { "title": "...", "url": "...", "hot": "123万" }
  ],
  "source": "zhihu",
  "updateTime": "2024-01-01T12:00:00.000Z"
}
```

### 每日一言

```http
GET /api/daily/sentence
```

响应：
```json
{
  "success": true,
  "data": {
    "content": "摸鱼一时爽，一直摸鱼一直爽",
    "from": "摸鱼学导论"
  }
}
```

### 假期倒计时

```http
GET /api/daily/countdown
```

响应：
```json
{
  "success": true,
  "data": {
    "next": { "name": "元旦", "days": 5 },
    "list": [...]
  }
}
```

## ⚙️ 配置说明

### 服务端 (.env)

```env
PORT=3001
REDIS_URL=redis://localhost:6379
LOG_LEVEL=info
```

### VS Code 扩展设置

```json
{
  "moyuIsland.offWorkTime": "18:00",
  "moyuIsland.serverUrl": "http://localhost:3001",
  "moyuIsland.enableHotlist": true,
  "moyuIsland.enableCountdown": true
}
```

## 🛠️ 技术栈

### Client
- React 18
- Vite
- React Markdown
- QRCode
- Diff

### Server
- Express
- Axios
- Cheerio
- Redis (ioredis)
- Winston
- Prometheus

### VS Code Extension
- VS Code API
- Webview
- TreeView

## 📊 监控指标

服务端暴露 Prometheus 指标：

```
http_requests_total{method="GET",route="/api/hotlist/zhihu",status="200"}
http_request_duration_seconds{method="GET",route="/api/hotlist/zhihu"}
hotlist_fetch_total{source="zhihu",status="success"}
```

## 🤝 贡献指南

1. Fork 本项目
2. 创建特性分支 (`git checkout -b feature/amazing-feature`)
3. 提交更改 (`git commit -m 'Add some amazing feature'`)
4. 推送分支 (`git push origin feature/amazing-feature`)
5. 创建 Pull Request

## 📄 许可证

MIT License

## 🙏 致谢

- 热榜数据来源于各平台公开接口
- 每日一言来自 Hitokoto

---

**免责声明**：本项目仅供学习和娱乐使用，请合理安排工作时间，适度摸鱼 😄
