const vscode = require('vscode');
const { getWebviewContent } = require('./webview');

/** @type {vscode.StatusBarItem} */
let countdownStatusBar;
/** @type {vscode.StatusBarItem} */
let quoteStatusBar;
/** @type {NodeJS.Timer | undefined} */
let countdownTimer;

/**
 * @param {vscode.ExtensionContext} context
 */
function activate(context) {
  // 注册 WebviewViewProvider
  const provider = new MoyuIslandViewProvider(context.extensionUri);
  context.subscriptions.push(
    vscode.window.registerWebviewViewProvider('moyuIsland.mainView', provider)
  );

  // 创建下班倒计时状态栏
  countdownStatusBar = vscode.window.createStatusBarItem(
    vscode.StatusBarAlignment.Right,
    200
  );
  countdownStatusBar.tooltip = '摸鱼岛 - 下班倒计时';
  countdownStatusBar.command = 'moyuIsland.showPanel';
  countdownStatusBar.show();
  context.subscriptions.push(countdownStatusBar);

  // 创建每日一言状态栏
  quoteStatusBar = vscode.window.createStatusBarItem(
    vscode.StatusBarAlignment.Right,
    199
  );
  quoteStatusBar.tooltip = '摸鱼岛 - 每日一言';
  quoteStatusBar.show();
  context.subscriptions.push(quoteStatusBar);

  // 启动倒计时
  updateCountdown();
  countdownTimer = setInterval(updateCountdown, 1000);
  context.subscriptions.push({ dispose: () => clearInterval(countdownTimer) });

  // 获取每日一言
  fetchDailyQuote();

  // 注册打开摸鱼网站命令
  context.subscriptions.push(
    vscode.commands.registerCommand('moyuIsland.openWebsite', () => {
      const websites = [
        { label: '🎮 小霸王游戏机', url: 'https://www.yikm.net/' },
        { label: '📺 哔哩哔哩', url: 'https://www.bilibili.com/' },
        { label: '🐦 微博热搜', url: 'https://s.weibo.com/top/summary' },
        { label: '💬 知乎热榜', url: 'https://www.zhihu.com/hot' },
        { label: '📰 今日头条', url: 'https://www.toutiao.com/' },
        { label: '🎵 网易云音乐', url: 'https://music.163.com/' }
      ];
      vscode.window.showQuickPick(websites, {
        placeHolder: '选择一个摸鱼网站'
      }).then(selected => {
        if (selected) {
          vscode.env.openExternal(vscode.Uri.parse(selected.url));
        }
      });
    })
  );

  // 注册显示面板命令
  context.subscriptions.push(
    vscode.commands.registerCommand('moyuIsland.showPanel', () => {
      vscode.commands.executeCommand('moyuIsland.mainView.focus');
    })
  );
}

function updateCountdown() {
  const config = vscode.workspace.getConfiguration('moyuIsland');
  const offWorkTime = config.get('offWorkTime', '18:00');
  const [hours, minutes] = offWorkTime.split(':').map(Number);

  const now = new Date();
  const target = new Date();
  target.setHours(hours, minutes, 0, 0);

  const diff = target.getTime() - now.getTime();

  if (diff <= 0) {
    countdownStatusBar.text = '🐟 已下班，快溜！';
    return;
  }

  const h = Math.floor(diff / 3600000);
  const m = Math.floor((diff % 3600000) / 60000);
  const s = Math.floor((diff % 60000) / 1000);

  const hh = String(h).padStart(2, '0');
  const mm = String(m).padStart(2, '0');
  const ss = String(s).padStart(2, '0');

  countdownStatusBar.text = `🐟 距下班 ${hh}:${mm}:${ss}`;
}

async function fetchDailyQuote() {
  const defaultQuotes = [
    '今天也要元气满满地摸鱼哦~',
    '代码写累了，不如摸会儿鱼🐟',
    '摸鱼一时爽，一直摸鱼一直爽',
    '老板不在，摸鱼天堂',
    '认真工作是为了更好地摸鱼'
  ];

  try {
    const config = vscode.workspace.getConfiguration('moyuIsland');
    const serverUrl = config.get('serverUrl', 'http://localhost:3001');
    const response = await fetch(`${serverUrl}/api/quote`);
    if (response.ok) {
      const data = await response.json();
      quoteStatusBar.text = `💬 ${data.quote || data.hitokoto || defaultQuotes[0]}`;
    } else {
      throw new Error('fetch failed');
    }
  } catch {
    const randomQuote = defaultQuotes[Math.floor(Math.random() * defaultQuotes.length)];
    quoteStatusBar.text = `💬 ${randomQuote}`;
  }
}

class MoyuIslandViewProvider {
  /**
   * @param {vscode.Uri} extensionUri
   */
  constructor(extensionUri) {
    this._extensionUri = extensionUri;
    /** @type {vscode.WebviewView | undefined} */
    this._view = undefined;
  }

  /**
   * @param {vscode.WebviewView} webviewView
   */
  resolveWebviewView(webviewView) {
    this._view = webviewView;

    webviewView.webview.options = {
      enableScripts: true
    };

    const config = vscode.workspace.getConfiguration('moyuIsland');
    const offWorkTime = config.get('offWorkTime', '18:00');
    webviewView.webview.html = getWebviewContent(offWorkTime);

    // 处理 webview 发来的消息
    webviewView.webview.onDidReceiveMessage(async (message) => {
      switch (message.type) {
        case 'fetchHotlist': {
          await this._handleFetchHotlist(webviewView.webview, message.source);
          break;
        }
        case 'openUrl': {
          if (message.url) {
            vscode.env.openExternal(vscode.Uri.parse(message.url));
          }
          break;
        }
      }
    });
  }

  /**
   * @param {vscode.Webview} webview
   * @param {string} source
   */
  async _handleFetchHotlist(webview, source) {
    try {
      const config = vscode.workspace.getConfiguration('moyuIsland');
      const serverUrl = config.get('serverUrl', 'http://localhost:3001');
      const response = await fetch(`${serverUrl}/api/hotlist/${source}`);
      if (response.ok) {
        const data = await response.json();
        webview.postMessage({
          type: 'hotlistData',
          source: source,
          items: data.items || data.data || data || []
        });
      } else {
        throw new Error(`HTTP ${response.status}`);
      }
    } catch (err) {
      webview.postMessage({
        type: 'hotlistData',
        source: source,
        items: [],
        error: '获取热榜失败，请检查后端服务是否启动'
      });
    }
  }
}

function deactivate() {
  if (countdownTimer) {
    clearInterval(countdownTimer);
  }
}

module.exports = { activate, deactivate };
