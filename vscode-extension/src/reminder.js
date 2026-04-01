const vscode = require('vscode');

class ReminderManager {
  constructor(context) {
    this.context = context;
    this.workTimer = null;
    this.breakTimer = null;
    this.breakCountdownTimer = null;
    this.breakStatusBar = null;
    this.isOnBreak = false;
    this.workStartTime = Date.now();
  }

  /**
   * 启动工作计时器
   */
  start() {
    this.stop();

    const config = vscode.workspace.getConfiguration('moyuIsland');
    const enabled = config.get('enableReminder', true);

    if (!enabled) {
      return;
    }

    const intervalMinutes = config.get('reminderInterval', 60);
    const intervalMs = intervalMinutes * 60 * 1000;

    this.workStartTime = Date.now();

    // 设置提醒定时器
    this.workTimer = setTimeout(() => {
      this.showBreakReminder();
    }, intervalMs);

    // 每分钟更新一次状态栏
    this.updateStatusBar();
    this.breakTimer = setInterval(() => {
      this.updateStatusBar();
    }, 60000);
  }

  /**
   * 停止所有计时器
   */
  stop() {
    if (this.workTimer) {
      clearTimeout(this.workTimer);
      this.workTimer = null;
    }
    if (this.breakTimer) {
      clearInterval(this.breakTimer);
      this.breakTimer = null;
    }
    if (this.breakCountdownTimer) {
      clearInterval(this.breakCountdownTimer);
      this.breakCountdownTimer = null;
    }
    this.isOnBreak = false;
    this.hideStatusBar();
  }

  /**
   * 更新状态栏显示
   */
  updateStatusBar() {
    if (this.isOnBreak) {
      return;
    }

    const config = vscode.workspace.getConfiguration('moyuIsland');
    const enabled = config.get('enableReminder', true);

    if (!enabled) {
      this.hideStatusBar();
      return;
    }

    const intervalMinutes = config.get('reminderInterval', 60);
    const elapsedMs = Date.now() - this.workStartTime;
    const elapsedMinutes = Math.floor(elapsedMs / 60000);
    const remainingMinutes = Math.max(0, intervalMinutes - elapsedMinutes);

    if (!this.breakStatusBar) {
      this.breakStatusBar = vscode.window.createStatusBarItem(
        vscode.StatusBarAlignment.Right,
        198
      );
    }

    this.breakStatusBar.text = `⏱️ 工作 ${elapsedMinutes}分钟`;
    this.breakStatusBar.tooltip = `已连续工作 ${elapsedMinutes} 分钟\n距离休息提醒还有 ${remainingMinutes} 分钟`;
    this.breakStatusBar.command = 'moyuIsland.startBreak';
    this.breakStatusBar.show();
  }

  /**
   * 显示休息提醒
   */
  showBreakReminder() {
    const config = vscode.workspace.getConfiguration('moyuIsland');
    const breakDuration = config.get('breakDuration', 5);

    vscode.window
      .showInformationMessage(
        `🍵 你已经连续工作一段时间了，休息${breakDuration}分钟吧！`,
        { modal: false },
        '休息5分钟',
        '跳过这次'
      )
      .then(selection => {
        if (selection === '休息5分钟') {
          this.startBreak();
        } else {
          // 跳过，重新开始计时
          this.start();
        }
      });
  }

  /**
   * 开始休息
   */
  startBreak() {
    const config = vscode.workspace.getConfiguration('moyuIsland');
    const breakDuration = config.get('breakDuration', 5);
    const breakSeconds = breakDuration * 60;

    this.isOnBreak = true;

    // 显示休息倒计时状态栏
    if (!this.breakStatusBar) {
      this.breakStatusBar = vscode.window.createStatusBarItem(
        vscode.StatusBarAlignment.Right,
        198
      );
    }

    let remainingSeconds = breakSeconds;

    const updateBreakDisplay = () => {
      const mins = Math.floor(remainingSeconds / 60);
      const secs = remainingSeconds % 60;
      const timeStr = `${mins}:${secs.toString().padStart(2, '0')}`;
      this.breakStatusBar.text = `☕ 休息中 ${timeStr}`;
      this.breakStatusBar.tooltip = '正在休息，放松一下吧！';
      this.breakStatusBar.command = 'moyuIsland.skipBreak';
    };

    updateBreakDisplay();
    this.breakStatusBar.show();

    // 倒计时
    this.breakCountdownTimer = setInterval(() => {
      remainingSeconds--;
      updateBreakDisplay();

      if (remainingSeconds <= 0) {
        this.endBreak();
      }
    }, 1000);

    // 显示开始休息的通知
    vscode.window.showInformationMessage(
      `☕ 休息开始！${breakDuration}分钟后继续工作~`,
      '跳过休息'
    ).then(selection => {
      if (selection === '跳过休息') {
        this.endBreak();
      }
    });
  }

  /**
   * 结束休息
   */
  endBreak() {
    if (this.breakCountdownTimer) {
      clearInterval(this.breakCountdownTimer);
      this.breakCountdownTimer = null;
    }

    this.isOnBreak = false;

    // 播放提示音（如果系统支持）
    vscode.window.showInformationMessage('🎉 休息结束！继续加油工作吧~');

    // 重新开始工作计时
    this.start();
  }

  /**
   * 隐藏状态栏
   */
  hideStatusBar() {
    if (this.breakStatusBar) {
      this.breakStatusBar.hide();
    }
  }

  /**
   * 释放资源
   */
  dispose() {
    this.stop();
    if (this.breakStatusBar) {
      this.breakStatusBar.dispose();
    }
  }
}

module.exports = { ReminderManager };
