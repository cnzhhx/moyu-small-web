const vscode = require('vscode');
const { getWebviewContent } = require('./webview');
const { HotlistTreeProvider, HotlistTreeItem } = require('./treeView');
const { HistoryManager, HistoryTreeProvider, FavoritesTreeProvider } = require('./history');
const { ReminderManager } = require('./reminder');

/** @type {vscode.StatusBarItem} */
let countdownStatusBar;
/** @type {vscode.StatusBarItem} */
let quoteStatusBar;
/** @type {NodeJS.Timer | undefined} */
let countdownTimer;
/** @type {HotlistTreeProvider} */
let hotlistProvider;
/** @type {HistoryManager} */
let historyManager;
/** @type {HistoryTreeProvider} */
let historyTreeProvider;
/** @type {FavoritesTreeProvider} */
let favoritesTreeProvider;
/** @type {ReminderManager} */
let reminderManager;

/**
 * 每日一言缓存
 */
let currentQuote = '';

/**
 * @param {vscode.ExtensionContext} context
 */
function activate(context) {
  const config = vscode.workspace.getConfiguration('moyuIsland');
  const enableCountdown = config.get('enableCountdown', true);

  // 初始化历史管理器
  historyManager = new HistoryManager(context);

  // 初始化提醒管理器
  reminderManager = new ReminderManager(context);
  reminderManager.start();

  // 注册 WebviewViewProvider
  const provider = new MoyuIslandViewProvider(context.extensionUri);
  context.subscriptions.push(
    vscode.window.registerWebviewViewProvider('moyuIsland.mainView', provider)
  );

  // 注册热榜树视图
  hotlistProvider = new HotlistTreeProvider();
  context.subscriptions.push(
    vscode.window.registerTreeDataProvider('moyuIsland.hotlistTree', hotlistProvider)
  );

  // 注册收藏树视图
  favoritesTreeProvider = new FavoritesTreeProvider(historyManager);
  context.subscriptions.push(
    vscode.window.registerTreeDataProvider('moyuIsland.favoritesTree', favoritesTreeProvider)
  );

  // 注册历史树视图
  historyTreeProvider = new HistoryTreeProvider(historyManager);
  context.subscriptions.push(
    vscode.window.registerTreeDataProvider('moyuIsland.historyTree', historyTreeProvider)
  );

  // 创建下班倒计时状态栏（根据配置）
  if (enableCountdown) {
    countdownStatusBar = vscode.window.createStatusBarItem(
      vscode.StatusBarAlignment.Right,
      200
    );
    countdownStatusBar.tooltip = 'Moyu Hub - 下班倒计时';
    countdownStatusBar.command = 'moyuIsland.showPanel';
    countdownStatusBar.show();
    context.subscriptions.push(countdownStatusBar);

    // 启动倒计时
    updateCountdown();
    countdownTimer = setInterval(updateCountdown, 1000);
    context.subscriptions.push({ dispose: () => clearInterval(countdownTimer) });
  }

  // 创建每日一言状态栏
  quoteStatusBar = vscode.window.createStatusBarItem(
    vscode.StatusBarAlignment.Right,
    199
  );
  quoteStatusBar.tooltip = 'Moyu Hub - 每日一言（点击刷新，右键查看完整）';
  quoteStatusBar.command = 'moyuIsland.refreshQuote';
  quoteStatusBar.show();
  context.subscriptions.push(quoteStatusBar);

  // 获取每日一言
  fetchDailyQuote();

  // 注册刷新每日一言命令
  context.subscriptions.push(
    vscode.commands.registerCommand('moyuIsland.refreshQuote', async () => {
      await fetchDailyQuote();
      vscode.window.showInformationMessage('💬 ' + currentQuote);
    })
  );

  // 注册右键显示完整内容命令
  context.subscriptions.push(
    vscode.commands.registerCommand('moyuIsland.showFullQuote', () => {
      if (currentQuote) {
        vscode.window.showInformationMessage('💬 ' + currentQuote);
      }
    })
  );

  // 注册打开资讯网站命令
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
        placeHolder: '选择一个资讯网站'
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

  // 注册刷新热榜命令
  context.subscriptions.push(
    vscode.commands.registerCommand('moyuIsland.refreshHotlist', async () => {
      // 让用户选择数据源
      const sources = hotlistProvider.getSources();
      const selected = await vscode.window.showQuickPick(
        sources.map(s => ({ label: s.label, description: s.key })),
        { placeHolder: '选择要刷新的热榜' }
      );
      if (selected) {
        await hotlistProvider.refresh(selected.description);
      }
    })
  );

  // 注册搜索热榜命令
  context.subscriptions.push(
    vscode.commands.registerCommand('moyuIsland.searchHotlist', async () => {
      const searchTerm = await vscode.window.showInputBox({
        prompt: '输入关键词搜索热榜',
        placeHolder: '例如：科技、娱乐、新闻...'
      });
      if (searchTerm !== undefined) {
        hotlistProvider.setSearchFilter(searchTerm);
      }
    })
  );

  // 注册清除搜索命令
  context.subscriptions.push(
    vscode.commands.registerCommand('moyuIsland.clearSearch', () => {
      hotlistProvider.clearSearchFilter();
    })
  );

  // 注册打开热榜条目命令（带历史记录）
  context.subscriptions.push(
    vscode.commands.registerCommand('moyuIsland.openHotlistItem', async (item) => {
      if (item && item.url) {
        // 添加到历史记录
        await historyManager.addHistory({
          title: item.title || '未知标题',
          url: item.url,
          hot: item.hot,
          source: item.source || hotlistProvider.currentSource
        });
        // 刷新历史视图
        historyTreeProvider.refresh();
        // 打开链接
        vscode.env.openExternal(vscode.Uri.parse(item.url));
      }
    })
  );

  // 注册收藏命令
  context.subscriptions.push(
    vscode.commands.registerCommand('moyuIsland.favoriteItem', async (item) => {
      if (item && item.url) {
        const result = await historyManager.addFavorite({
          title: item.title,
          url: item.url,
          hot: item.hot,
          source: item.source || hotlistProvider.currentSource
        });
        if (result) {
          vscode.window.showInformationMessage('⭐ 已收藏到收藏夹');
          favoritesTreeProvider.refresh();
        } else {
          vscode.window.showWarningMessage('该条目已在收藏夹中');
        }
      }
    })
  );

  // 注册取消收藏命令
  context.subscriptions.push(
    vscode.commands.registerCommand('moyuIsland.unfavoriteItem', async (item) => {
      if (item && item.url) {
        await historyManager.removeFavorite(item.url);
        vscode.window.showInformationMessage('已取消收藏');
        favoritesTreeProvider.refresh();
      }
    })
  );

  // 注册清空收藏命令
  context.subscriptions.push(
    vscode.commands.registerCommand('moyuIsland.clearFavorites', async () => {
      const result = await vscode.window.showWarningMessage(
        '确定要清空所有收藏吗？',
        { modal: true },
        '确定'
      );
      if (result === '确定') {
        await historyManager.clearFavorites();
        favoritesTreeProvider.refresh();
        vscode.window.showInformationMessage('收藏夹已清空');
      }
    })
  );

  // 注册清空历史命令
  context.subscriptions.push(
    vscode.commands.registerCommand('moyuIsland.clearHistory', async () => {
      const result = await vscode.window.showWarningMessage(
        '确定要清空所有历史记录吗？',
        { modal: true },
        '确定'
      );
      if (result === '确定') {
        await historyManager.clearHistory();
        historyTreeProvider.refresh();
        vscode.window.showInformationMessage('历史记录已清空');
      }
    })
  );

  // 注册开始休息命令
  context.subscriptions.push(
    vscode.commands.registerCommand('moyuIsland.startBreak', () => {
      reminderManager.startBreak();
    })
  );

  // 注册跳过休息命令
  context.subscriptions.push(
    vscode.commands.registerCommand('moyuIsland.skipBreak', () => {
      reminderManager.endBreak();
    })
  );

  // 注册查看假期命令
  context.subscriptions.push(
    vscode.commands.registerCommand('moyuIsland.viewHoliday', async () => {
      try {
        const config = vscode.workspace.getConfiguration('moyuIsland');
        const serverUrl = config.get('serverUrl', 'http://localhost:3001');
        const response = await fetch(`${serverUrl}/api/holiday`);
        if (response.ok) {
          const data = await response.json();
          const holidayInfo = data.holiday || '今日无假期信息';
          vscode.window.showInformationMessage('🏖️ ' + holidayInfo);
        } else {
          vscode.window.showInformationMessage('🏖️ 周末愉快！记得休息~');
        }
      } catch {
        vscode.window.showInformationMessage('🏖️ 努力工作，周末即将到来！');
      }
    })
  );

  // 注册打开设置命令
  context.subscriptions.push(
    vscode.commands.registerCommand('moyuIsland.openSettings', () => {
      vscode.commands.executeCommand(
        'workbench.action.openSettings',
        '@ext:moyu-island'
      );
    })
  );

  // 监听配置变更
  context.subscriptions.push(
    vscode.workspace.onDidChangeConfiguration(e => {
      if (e.affectsConfiguration('moyuIsland')) {
        // 配置变更时重新加载窗口以应用新配置
        vscode.window.showInformationMessage('Moyu Hub 配置已更新，请重新加载窗口以生效', '重新加载')
          .then(selection => {
            if (selection === '重新加载') {
              vscode.commands.executeCommand('workbench.action.reloadWindow');
            }
          });
      }
    })
  );

  // 注册销毁
  context.subscriptions.push({
    dispose: () => {
      reminderManager.dispose();
    }
  });
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
    '今天也要元气满满地工作哦~',
    '代码写累了，记得休息一下🐟',
    '工作使我快乐，休息使我更高效',
    '保持专注，高效完成工作',
    '认真工作是为了更好地生活'
  ];

  try {
    const config = vscode.workspace.getConfiguration('moyuIsland');
    const serverUrl = config.get('serverUrl', 'http://localhost:3001');
    const response = await fetch(`${serverUrl}/api/quote`);
    if (response.ok) {
      const data = await response.json();
      currentQuote = data.quote || data.hitokoto || defaultQuotes[0];
      quoteStatusBar.text = `💬 ${truncateQuote(currentQuote)}`;
    } else {
      throw new Error('fetch failed');
    }
  } catch {
    currentQuote = defaultQuotes[Math.floor(Math.random() * defaultQuotes.length)];
    quoteStatusBar.text = `💬 ${truncateQuote(currentQuote)}`;
  }
}

/**
 * 截断过长的名言显示在状态栏
 */
function truncateQuote(quote, maxLength = 15) {
  if (quote.length <= maxLength) return quote;
  return quote.substring(0, maxLength) + '...';
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
    const enableHotlist = config.get('enableHotlist', true);
    const enableCountdown = config.get('enableCountdown', true);
    const customTips = config.get('tips', []);

    webviewView.webview.html = getWebviewContent({
      offWorkTime,
      enableHotlist,
      enableCountdown,
      tips: customTips
    });

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
  if (reminderManager) {
    reminderManager.dispose();
  }
}

module.exports = { activate, deactivate };
