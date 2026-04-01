const vscode = require('vscode');

const HISTORY_KEY = 'moyuIsland.history';
const FAVORITES_KEY = 'moyuIsland.favorites';
const MAX_HISTORY = 10;
const MAX_FAVORITES = 50;

class HistoryManager {
  constructor(context) {
    this.context = context;
  }

  /**
   * 获取历史记录
   */
  getHistory() {
    return this.context.globalState.get(HISTORY_KEY, []);
  }

  /**
   * 添加历史记录
   */
  addHistory(item) {
    const history = this.getHistory();
    const newItem = {
      title: item.title,
      url: item.url,
      hot: item.hot,
      source: item.source || 'unknown',
      timestamp: Date.now()
    };

    // 去重：如果已存在相同URL的记录，先删除旧的
    const filtered = history.filter(h => h.url !== newItem.url);

    // 添加到开头
    filtered.unshift(newItem);

    // 只保留最近MAX_HISTORY条
    const limited = filtered.slice(0, MAX_HISTORY);

    return this.context.globalState.update(HISTORY_KEY, limited);
  }

  /**
   * 清空历史
   */
  clearHistory() {
    return this.context.globalState.update(HISTORY_KEY, []);
  }

  /**
   * 获取收藏列表
   */
  getFavorites() {
    return this.context.globalState.get(FAVORITES_KEY, []);
  }

  /**
   * 添加收藏
   */
  addFavorite(item) {
    const favorites = this.getFavorites();

    // 检查是否已收藏
    if (favorites.some(f => f.url === item.url)) {
      return false;
    }

    const newItem = {
      title: item.title,
      url: item.url,
      hot: item.hot,
      source: item.source || 'unknown',
      timestamp: Date.now()
    };

    favorites.unshift(newItem);

    // 限制数量
    if (favorites.length > MAX_FAVORITES) {
      favorites.length = MAX_FAVORITES;
    }

    return this.context.globalState.update(FAVORITES_KEY, favorites);
  }

  /**
   * 取消收藏
   */
  removeFavorite(url) {
    const favorites = this.getFavorites();
    const filtered = favorites.filter(f => f.url !== url);
    return this.context.globalState.update(FAVORITES_KEY, filtered);
  }

  /**
   * 检查是否已收藏
   */
  isFavorite(url) {
    const favorites = this.getFavorites();
    return favorites.some(f => f.url === url);
  }

  /**
   * 清空收藏
   */
  clearFavorites() {
    return this.context.globalState.update(FAVORITES_KEY, []);
  }
}

/**
 * 历史记录树视图提供者
 */
class HistoryTreeProvider {
  constructor(historyManager) {
    this.historyManager = historyManager;
    this._onDidChangeTreeData = new vscode.EventEmitter();
    this.onDidChangeTreeData = this._onDidChangeTreeData.event;
  }

  refresh() {
    this._onDidChangeTreeData.fire();
  }

  getTreeItem(element) {
    return element;
  }

  getChildren() {
    const history = this.historyManager.getHistory();

    if (history.length === 0) {
      const emptyItem = new vscode.TreeItem('暂无历史记录');
      emptyItem.iconPath = new vscode.ThemeIcon('info');
      return Promise.resolve([emptyItem]);
    }

    return Promise.resolve(
      history.map((item, index) => new HistoryTreeItem(item, index + 1))
    );
  }
}

class HistoryTreeItem extends vscode.TreeItem {
  constructor(item, index) {
    super(item.title, vscode.TreeItemCollapsibleState.None);
    this.url = item.url;
    this.index = index;

    const date = new Date(item.timestamp);
    const timeStr = date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
    this.description = timeStr;
    this.tooltip = `${item.title}\n来源: ${item.source}\n访问时间: ${date.toLocaleString()}`;
    this.iconPath = new vscode.ThemeIcon('history');

    this.command = {
      command: 'moyuIsland.openHotlistItem',
      title: '打开',
      arguments: [{ title: item.title, url: item.url }]
    };
  }
}

/**
 * 收藏树视图提供者
 */
class FavoritesTreeProvider {
  constructor(historyManager) {
    this.historyManager = historyManager;
    this._onDidChangeTreeData = new vscode.EventEmitter();
    this.onDidChangeTreeData = this._onDidChangeTreeData.event;
  }

  refresh() {
    this._onDidChangeTreeData.fire();
  }

  getTreeItem(element) {
    return element;
  }

  getChildren() {
    const favorites = this.historyManager.getFavorites();

    if (favorites.length === 0) {
      const emptyItem = new vscode.TreeItem('暂无收藏');
      emptyItem.iconPath = new vscode.ThemeIcon('info');
      return Promise.resolve([emptyItem]);
    }

    return Promise.resolve(
      favorites.map((item, index) => new FavoriteTreeItem(item, index + 1))
    );
  }
}

class FavoriteTreeItem extends vscode.TreeItem {
  constructor(item, index) {
    super(item.title, vscode.TreeItemCollapsibleState.None);
    this.url = item.url;
    this.index = index;
    this.description = item.source;
    this.tooltip = `${item.title}\n来源: ${item.source}\n收藏时间: ${new Date(item.timestamp).toLocaleString()}`;
    this.iconPath = new vscode.ThemeIcon('star-full', new vscode.ThemeColor('charts.yellow'));

    this.command = {
      command: 'moyuIsland.openHotlistItem',
      title: '打开',
      arguments: [{ title: item.title, url: item.url }]
    };
  }
}

module.exports = {
  HistoryManager,
  HistoryTreeProvider,
  HistoryTreeItem,
  FavoritesTreeProvider,
  FavoriteTreeItem
};
