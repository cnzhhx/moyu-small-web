/**
 * 生成摸鱼岛 Webview HTML 内容
 * @param {string} offWorkTime - 下班时间 HH:mm
 * @returns {string} 完整的 HTML 字符串
 */
function getWebviewContent(offWorkTime) {
  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>摸鱼岛</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }

    body {
      font-family: var(--vscode-font-family, -apple-system, BlinkMacSystemFont, sans-serif);
      font-size: var(--vscode-font-size, 13px);
      color: var(--vscode-foreground);
      background-color: var(--vscode-sideBar-background, var(--vscode-editor-background));
      padding: 12px;
      line-height: 1.5;
    }

    .header {
      text-align: center;
      padding: 8px 0 12px;
      font-size: 18px;
      font-weight: bold;
    }

    .card {
      background: var(--vscode-editorWidget-background, var(--vscode-editor-background));
      border: 1px solid var(--vscode-widget-border, var(--vscode-editorWidget-border, rgba(128,128,128,0.2)));
      border-radius: 8px;
      padding: 12px;
      margin-bottom: 10px;
    }

    .card-title {
      font-size: 12px;
      color: var(--vscode-descriptionForeground);
      margin-bottom: 8px;
      display: flex;
      align-items: center;
      gap: 4px;
    }

    /* 倒计时卡片 */
    .countdown-display {
      font-size: 28px;
      font-weight: bold;
      text-align: center;
      padding: 8px 0;
      font-variant-numeric: tabular-nums;
      color: var(--vscode-textLink-foreground);
    }

    .countdown-label {
      text-align: center;
      font-size: 11px;
      color: var(--vscode-descriptionForeground);
    }

    /* 进度条 */
    .progress-container {
      margin-top: 6px;
    }

    .progress-bar-bg {
      width: 100%;
      height: 8px;
      background: var(--vscode-progressBar-background, rgba(128,128,128,0.2));
      border-radius: 4px;
      overflow: hidden;
      opacity: 0.3;
    }

    .progress-bar-fill {
      height: 100%;
      background: var(--vscode-progressBar-background, #0078d4);
      border-radius: 4px;
      transition: width 1s ease;
    }

    .progress-text {
      text-align: center;
      font-size: 11px;
      color: var(--vscode-descriptionForeground);
      margin-top: 4px;
    }

    /* Tabs */
    .tabs {
      display: flex;
      gap: 4px;
      margin-bottom: 8px;
      flex-wrap: wrap;
    }

    .tab {
      padding: 4px 10px;
      border-radius: 4px;
      font-size: 12px;
      cursor: pointer;
      background: transparent;
      color: var(--vscode-descriptionForeground);
      border: 1px solid var(--vscode-widget-border, rgba(128,128,128,0.2));
      transition: all 0.2s;
    }

    .tab:hover {
      background: var(--vscode-list-hoverBackground);
    }

    .tab.active {
      background: var(--vscode-textLink-foreground);
      color: var(--vscode-editor-background);
      border-color: var(--vscode-textLink-foreground);
    }

    /* Hotlist */
    .hotlist {
      max-height: 300px;
      overflow-y: auto;
    }

    .hotlist-item {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 6px 4px;
      cursor: pointer;
      border-radius: 4px;
      transition: background 0.15s;
      font-size: 12px;
    }

    .hotlist-item:hover {
      background: var(--vscode-list-hoverBackground);
    }

    .hotlist-rank {
      min-width: 20px;
      text-align: center;
      font-weight: bold;
      font-size: 11px;
      color: var(--vscode-descriptionForeground);
    }

    .hotlist-rank.top {
      color: var(--vscode-textLink-foreground);
    }

    .hotlist-title {
      flex: 1;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .hotlist-hot {
      font-size: 10px;
      color: var(--vscode-descriptionForeground);
      white-space: nowrap;
    }

    .hotlist-empty, .hotlist-loading {
      text-align: center;
      padding: 20px;
      color: var(--vscode-descriptionForeground);
      font-size: 12px;
    }

    .tip-content {
      font-size: 12px;
      line-height: 1.6;
      color: var(--vscode-descriptionForeground);
    }
</style>
</head>
<body>
  <div class="header">🐟 摸鱼岛</div>

  <!-- 倒计时卡片 -->
  <div class="card">
    <div class="card-title">⏰ 下班倒计时</div>
    <div class="countdown-display" id="countdown">--:--:--</div>
    <div class="countdown-label" id="countdown-label">加载中...</div>
    <div class="progress-container">
      <div class="progress-bar-bg">
        <div class="progress-bar-fill" id="progress-fill" style="width: 0%"></div>
      </div>
      <div class="progress-text" id="progress-text">今日进度 0%</div>
    </div>
  </div>

  <!-- 热榜卡片 -->
  <div class="card">
    <div class="card-title">🔥 热榜</div>
    <div class="tabs" id="tabs"></div>
    <div class="hotlist" id="hotlist">
      <div class="hotlist-empty">点击标签加载热榜</div>
    </div>
  </div>

  <!-- 摸鱼小贴士 -->
  <div class="card">
    <div class="card-title">💡 摸鱼小贴士</div>
    <div class="tip-content" id="tip-content"></div>
  </div>

  <script>
    const vscode = acquireVsCodeApi();
    const OFF_WORK_TIME = '${offWorkTime}';
    const WORK_START = '09:00';

    // 摸鱼小贴士
    const tips = [
      '摸鱼的最高境界：让老板以为你在加班，同事以为你在开会',
      '建议每工作25分钟，摸鱼5分钟，这叫番茄摸鱼法🍅',
      '打开一个终端窗口放在旁边，看起来就像在编译代码',
      '记得时不时皱一下眉头，显得你在思考很难的问题',
      '摸鱼时记得把屏幕亮度调低，省电又护眼',
      '午饭后是摸鱼黄金时段，大家都在犯困没人注意你',
      '学会用快捷键秒切屏幕，Alt+Tab 是摸鱼人的好朋友',
      '在代码里写注释也算工作，写长一点的注释更好',
      '喝水、上厕所、接热水，合理利用每一次离开工位的机会',
      '保持桌面整洁，摸鱼时看起来更像一个认真工作的人',
      '开一个很长的会议，然后静音摸鱼，完美',
      '把摸鱼网站的标签页标题改成"技术文档"更安全'
    ];

    // 显示随机小贴士
    const tipEl = document.getElementById('tip-content');
    tipEl.textContent = tips[Math.floor(Math.random() * tips.length)];

    // 热榜标签
    const sources = [
      { key: 'zhihu', label: '知乎' },
      { key: 'weibo', label: '微博' },
      { key: 'bilibili', label: 'B站' },
      { key: 'juejin', label: '掘金' }
    ];

    let activeSource = '';
    const tabsEl = document.getElementById('tabs');
    const hotlistEl = document.getElementById('hotlist');

    sources.forEach(s => {
      const tab = document.createElement('span');
      tab.className = 'tab';
      tab.textContent = s.label;
      tab.dataset.source = s.key;
      tab.addEventListener('click', () => {
        document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        activeSource = s.key;
        hotlistEl.innerHTML = '<div class="hotlist-loading">加载中...</div>';
        vscode.postMessage({ type: 'fetchHotlist', source: s.key });
      });
      tabsEl.appendChild(tab);
    });

    // 接收 extension 消息
    window.addEventListener('message', event => {
      const msg = event.data;
      if (msg.type === 'hotlistData') {
        renderHotlist(msg.items, msg.error);
      }
    });

    function renderHotlist(items, error) {
      hotlistEl.innerHTML = '';
      if (error) {
        hotlistEl.innerHTML = '<div class="hotlist-empty">' + escapeHtml(error) + '</div>';
        return;
      }
      if (!items || items.length === 0) {
        hotlistEl.innerHTML = '<div class="hotlist-empty">暂无数据</div>';
        return;
      }
      items.slice(0, 20).forEach((item, index) => {
        const row = document.createElement('div');
        row.className = 'hotlist-item';

        const rank = document.createElement('span');
        rank.className = 'hotlist-rank' + (index < 3 ? ' top' : '');
        rank.textContent = index + 1;

        const title = document.createElement('span');
        title.className = 'hotlist-title';
        title.textContent = item.title || item.name || '未知标题';

        const hot = document.createElement('span');
        hot.className = 'hotlist-hot';
        hot.textContent = formatHot(item.hot || item.hotValue || item.heat || '');

        row.appendChild(rank);
        row.appendChild(title);
        if (hot.textContent) {
          row.appendChild(hot);
        }

        row.addEventListener('click', () => {
          const url = item.url || item.link || item.mobileUrl || '';
          if (url) {
            vscode.postMessage({ type: 'openUrl', url: url });
          }
        });

        hotlistEl.appendChild(row);
      });
    }

    function formatHot(value) {
      if (!value) return '';
      const num = parseInt(value, 10);
      if (isNaN(num)) return String(value);
      if (num >= 10000) return (num / 10000).toFixed(1) + '万';
      return String(num);
    }

    function escapeHtml(text) {
      const div = document.createElement('div');
      div.textContent = text;
      return div.innerHTML;
    }

    // 倒计时逻辑
    function updateCountdown() {
      const now = new Date();
      const [offH, offM] = OFF_WORK_TIME.split(':').map(Number);
      const [startH, startM] = WORK_START.split(':').map(Number);

      const target = new Date();
      target.setHours(offH, offM, 0, 0);

      const workStart = new Date();
      workStart.setHours(startH, startM, 0, 0);

      const diff = target.getTime() - now.getTime();
      const countdownEl = document.getElementById('countdown');
      const labelEl = document.getElementById('countdown-label');
      const fillEl = document.getElementById('progress-fill');
      const progressTextEl = document.getElementById('progress-text');

      if (diff <= 0) {
        countdownEl.textContent = '🎉 00:00:00';
        labelEl.textContent = '已下班，快溜快溜！';
        fillEl.style.width = '100%';
        progressTextEl.textContent = '今日进度 100% ✅';
        return;
      }

      const h = Math.floor(diff / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      const s = Math.floor((diff % 60000) / 1000);

      countdownEl.textContent =
        String(h).padStart(2, '0') + ':' +
        String(m).padStart(2, '0') + ':' +
        String(s).padStart(2, '0');
      labelEl.textContent = '距离下班 ' + OFF_WORK_TIME;

      // 计算今日进度
      const totalWork = target.getTime() - workStart.getTime();
      const elapsed = now.getTime() - workStart.getTime();
      let progress = 0;
      if (elapsed <= 0) {
        progress = 0;
      } else if (elapsed >= totalWork) {
        progress = 100;
      } else {
        progress = Math.round((elapsed / totalWork) * 100);
      }
      fillEl.style.width = progress + '%';
      progressTextEl.textContent = '今日进度 ' + progress + '%';
    }

    updateCountdown();
    setInterval(updateCountdown, 1000);
  </script>
</body>
</html>`;
}

module.exports = { getWebviewContent };
