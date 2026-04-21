import nodemailer from 'nodemailer';

// HTML 转义，防止 XSS
function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

// 邮件配置（使用环境变量或默认配置）
const SMTP_CONFIG = {
  host: process.env.SMTP_HOST || 'smtp.qq.com',
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: process.env.SMTP_SECURE === 'true',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
};

// 通知邮箱列表
const NOTIFICATION_EMAILS = (process.env.NOTIFICATION_EMAILS || '236194422@qq.com')
  .split(',')
  .map(e => e.trim())
  .filter(e => e);

// 创建邮件传输器
let transporter = null;

function getTransporter() {
  if (!transporter) {
    transporter = nodemailer.createTransport(SMTP_CONFIG);
  }
  return transporter;
}

/**
 * 发送邮件通知
 * @param {string} subject - 邮件主题
 * @param {string} html - HTML 内容
 */
export async function sendNotification(subject, html) {
  if (!SMTP_CONFIG.auth.user || !SMTP_CONFIG.auth.pass) {
    console.log('[邮件] SMTP 未配置，跳过发送');
    return false;
  }

  try {
    const info = await getTransporter().sendMail({
      from: `"热榜监控系统" <${SMTP_CONFIG.auth.user}>`,
      to: NOTIFICATION_EMAILS.join(','),
      subject,
      html,
    });
    console.log(`[邮件] 已发送: ${info.messageId}`);
    return true;
  } catch (err) {
    console.error('[邮件] 发送失败:', err.message);
    return false;
  }
}

/**
 * 发送热榜更新失败通知
 * @param {string} source - 数据源名称
 * @param {string} label - 数据源中文名
 * @param {string} error - 错误信息
 * @param {number} failCount - 连续失败次数
 */
export async function sendHotlistFailureNotification(source, label, error, failCount) {
  const subject = `[热榜监控] ${label} 热榜更新失败（第${failCount}次）`;
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #e74c3c;">🔥 热榜更新失败通知</h2>
      <div style="background: #f8f9fa; padding: 20px; border-radius: 8px;">
        <p><strong>数据源：</strong>${escapeHtml(label)} (${escapeHtml(source)})</p>
        <p><strong>失败次数：</strong>${failCount} 次连续失败</p>
        <p><strong>错误信息：</strong></p>
        <pre style="background: #fff; padding: 10px; border-radius: 4px; overflow-x: auto;">${escapeHtml(error)}</pre>
        <p><strong>时间：</strong>${new Date().toLocaleString('zh-CN')}</p>
      </div>
      <p style="color: #666; font-size: 12px; margin-top: 20px;">
        此邮件由热榜监控系统自动发送，如无需接收请回复退订。
      </p>
    </div>
  `;
  return sendNotification(subject, html);
}

/**
 * 发送系统告警通知
 * @param {string} title - 告警标题
 * @param {string} message - 告警内容
 */
export async function sendSystemAlert(title, message) {
  const subject = `[热榜监控] 系统告警: ${title}`;
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #f39c12;">⚠️ 系统告警</h2>
      <div style="background: #fff3cd; padding: 20px; border-radius: 8px; border-left: 4px solid #f39c12;">
        <p><strong>告警：</strong>${escapeHtml(title)}</p>
        <p><strong>详情：</strong>${escapeHtml(message)}</p>
        <p><strong>时间：</strong>${new Date().toLocaleString('zh-CN')}</p>
      </div>
    </div>
  `;
  return sendNotification(subject, html);
}
