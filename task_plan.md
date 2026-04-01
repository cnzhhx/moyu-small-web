# 摸鱼岛功能增强计划

## 目标
实现 Phase 1 高性价比功能 + 摸鱼小游戏

## 任务清单

### Phase 1A: 热榜增强 ✅
- [x] 1.1 Server: 添加 GitHub Trending API
  - 文件: server/routes/hotlist.js
  - 添加 github 数据源爬取
  - 更新 Swagger 文档

### Phase 1B: 截图伪装工具 ✅
- [x] 1.2 Client: 创建 FakeScreen 组件
  - 文件: client/src/components/FakeScreen.jsx (984 lines)
  - 支持 IDE 界面（VS Code/IntelliJ 风格）
  - 支持终端界面
  - 支持多种编程语言代码高亮
  - 语法高亮显示

### Phase 1C: 快速切换快捷键 ✅
- [x] 1.3 Client: 添加老板键功能
  - 文件: client/src/App.jsx
  - 快捷键 ` 或 F12 切换伪装模式
  - 快捷键 Ctrl+4 切换到游戏中心

### Phase 2: 摸鱼小游戏 ✅
- [x] 2.1 Client: 创建 GameCenter 组件
  - 文件: client/src/components/GameCenter.jsx (900+ lines)
  - 贪吃蛇游戏（支持暂停、最高分记录）
  - 俄罗斯方块（支持旋转、消行、等级）
  - 游戏数据持久化到 localStorage

### Phase 3: 集成 ✅
- [x] 3.1 更新 Sidebar 添加游戏中心入口
- [x] 3.2 更新快捷键帮助
- [x] 版本号更新到 v1.1

## 当前状态
- [completed] 2024-04-01 全部功能已实现

## 新增功能说明

### 老板键 (` 或 F12)
- 一键切换到伪装模式
- 显示假 IDE 界面或终端
- 支持多种编程语言
- 按 ESC 或 ` 退出

### 游戏中心
- 贪吃蛇：WASD/方向键控制，空格暂停
- 俄罗斯方块：方向键移动，上/W旋转，下/S加速
- 最高分自动保存

### GitHub Trending
- 新增 GitHub 热榜数据源
- 显示仓库名、语言、Star 数
- 前端热榜列表已添加 GitHub 选项
