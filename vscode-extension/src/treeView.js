const vscode = require('vscode');

/**
 * 热榜树视图提供者
 */
class HotlistTreeProvider {
  constructor() {
    this._onDidChangeTreeData = new vscode.EventEmitter();
    this.onDidChangeTreeData = this._onDidChangeTreeData.event;
    this.items = [];
    this.filteredItems = [];
    this.currentSource = 'zhihu';
    this.isLoading = false;
    this.searchFilter = '';
    this.highlightIndices = [];
    this.sources = [
      { key: 'zhihu', label: '知乎热榜', icon: '$(book)' },
      { key: 'weibo', label: '微博热搜', icon: '$(comment-discussion)' },
      { key: 'bilibili', label: 'B站热门', icon: '$(play-circle)' },
      { key: 'juejin', label: '掘金热榜', icon: '$(code)' },
      { key: 'douyin', label: '抖音热榜', icon: '$(device-camera)' },
      { key: 'baidu', label: '百度热搜', icon: '$(search)' },
      { key: 'hupu', label: '虎扑热榜', icon: '$(jersey)' },
      { key: 'github', label: 'GitHub趋势', icon: '$(github)' },
      { key: 'tieba', label: '贴吧热议', icon: '$(comment)' }
    ];
  }

  /**
   * 刷新热榜数据
   */
  async refresh(source = this.currentSource) {
    this.isLoading = true;
    this._onDidChangeTreeData.fire();

    try {
      const config = vscode.workspace.getConfiguration('moyuIsland');
      const serverUrl = config.get('serverUrl', 'http://localhost:3001');
      const response = await fetch(`${serverUrl}/api/hotlist/${source}`);

      if (response.ok) {
        const data = await response.json();
        this.items = data.items || data.data || data || [];
        this.currentSource = source;
        this.applyFilter();
      } else {
        this.items = [];
        this.filteredItems = [];
        vscode.window.showErrorMessage('获取热榜失败，请检查后端服务');
      }
    } catch (err) {
      this.items = [];
      this.filteredItems = [];
      vscode.window.showErrorMessage('获取热榜失败: ' + err.message);
    } finally {
      this.isLoading = false;
      this._onDidChangeTreeData.fire();
    }
  }

  /**
   * 设置搜索过滤
   */
  setSearchFilter(filter) {
    this.searchFilter = filter.toLowerCase().trim();
    this.applyFilter();
    this._onDidChangeTreeData.fire();

    // 更新全局状态以控制清除按钮显示
    vscode.commands.executeCommand(
      'setContext',
      'moyuIsland.hasSearchFilter',
      !!this.searchFilter
    );
  }

  /**
   * 清除搜索过滤
   */
  clearSearchFilter() {
    this.searchFilter = '';
    this.filteredItems = [];
    this.applyFilter();
    this._onDidChangeTreeData.fire();

    vscode.commands.executeCommand(
      'setContext',
      'moyuIsland.hasSearchFilter',
      false
    );
  }

  /**
   * 应用过滤器
   */
  applyFilter() {
    if (!this.searchFilter) {
      this.filteredItems = this.items;
      return;
    }

    this.filteredItems = this.items.filter(item => {
      const title = (item.title || item.name || '').toLowerCase();
      return title.includes(this.searchFilter);
    });
  }

  /**
   * 获取树节点
   */
  getTreeItem(element) {
    return element;
  }

  /**
   * 获取子节点
   */
  getChildren(element) {
    if (element) {
      return Promise.resolve([]);
    }

    // 显示搜索过滤状态
    if (this.searchFilter && this.filteredItems.length === 0 && !this.isLoading) {
      const noResultItem = new vscode.TreeItem(`未找到 "${this.searchFilter}" 的结果`);
      noResultItem.iconPath = new vscode.ThemeIcon('search');
      return Promise.resolve([noResultItem]);
    }

    if (this.isLoading) {
      const loadingItem = new vscode.TreeItem('加载中...');
      loadingItem.iconPath = new vscode.ThemeIcon('loading~spin');
      return Promise.resolve([loadingItem]);
    }

    const itemsToShow = this.searchFilter ? this.filteredItems : this.items;

    if (itemsToShow.length === 0) {
      const emptyItem = new vscode.TreeItem('暂无数据，点击刷新按钮');
      emptyItem.iconPath = new vscode.ThemeIcon('info');
      emptyItem.contextValue = 'empty';
      return Promise.resolve([emptyItem]);
    }

    return Promise.resolve(
      itemsToShow.slice(0, 20).map((item, index) => {
        const isHighlighted = this.searchFilter &&
          (item.title || item.name || '').toLowerCase().includes(this.searchFilter);

        const treeItem = new HotlistTreeItem(
          item.title || item.name || '未知标题',
          index + 1,
          item.url || item.link || item.mobileUrl || '',
          item.hot || item.hotValue || item.heat || '',
          this.currentSource,
          isHighlighted
        );
        return treeItem;
      })
    );
  }

  /**
   * 获取数据源列表
   */
  getSources() {
    return this.sources;
  }
}

/**
 * 热榜树节点
 */
class HotlistTreeItem extends vscode.TreeItem {
  constructor(title, rank, url, hot, source, isHighlighted = false) {
    super(title, vscode.TreeItemCollapsibleState.None);
    this.rank = rank;
    this.url = url;
    this.hot = hot;
    this.source = source;
    this.title = title;
    this.isHighlighted = isHighlighted;

    this.description = hot ? this.formatHot(hot) : `#${rank}`;
    this.tooltip = `${title}${hot ? `\n热度: ${hot}` : ''}`;
    this.contextValue = 'hotlistItem';

    // 高亮效果
    if (isHighlighted) {
      this.iconPath = new vscode.ThemeIcon('flame', new vscode.ThemeColor('charts.orange'));
      this.description = '✦ ' + (this.description || '');
    } else if (rank <= 3) {
      this.iconPath = new vscode.ThemeIcon('flame', new vscode.ThemeColor('charts.red'));
    } else {
      this.iconPath = new vscode.ThemeIcon('circle-outline');
    }

    this.command = {
      command: 'moyuIsland.openHotlistItem',
      title: '打开',
      arguments: [this]
    };
  }

  formatHot(value) {
    if (!value) return '';
    const num = parseInt(value, 10);
    if (isNaN(num)) return String(value);
    if (num >= 10000) return (num / 10000).toFixed(1) + '万';
    return String(num);
  }
}

module.exports = { HotlistTreeProvider, HotlistTreeItem };
