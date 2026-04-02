import { useState, useEffect, useRef, useCallback } from 'react';
import * as Diff from 'diff';
import ReactMarkdown from 'react-markdown';
import QRCode from 'qrcode';
import { useTheme } from '../ThemeContext.jsx';

const SEARCH_HISTORY_KEY = 'moyu-tool-search-history';
const MAX_HISTORY = 10;

// ═══════════════════════════════════════════════════
// SVG Icon Components (Retro-Futurism Style)
// ═══════════════════════════════════════════════════
const Icon = ({ name, size = 20, color = 'currentColor' }) => {
  const icons = {
    // 开发工具
    json: <path d="M5 3h2v2H5v4a2 2 0 01-2 2 2 2 0 012 2v4h2v2H5a2 2 0 01-2-2v-3a1 1 0 00-1-1H1v-2h1a1 1 0 001-1V5a2 2 0 012-2zm14 0a2 2 0 012 2v3a1 1 0 001 1h1v2h-1a1 1 0 00-1 1v3a2 2 0 01-2 2h-2v-2h2v-4a2 2 0 012-2 2 2 0 01-2-2V5h-2V3h2z" />,
    base64: <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm0 10.99h7c-.53 4.12-3.28 7.79-7 8.94V12H5V6.3l7-3.11v8.8z" />,
    url: <path d="M3.9 12c0-1.71 1.39-3.1 3.1-3.1h4V7H7c-2.76 0-5 2.24-5 5s2.24 5 5 5h4v-1.9H7c-1.71 0-3.1-1.39-3.1-3.1zM8 13h8v-2H8v2zm9-6h-4v1.9h4c1.71 0 3.1 1.39 3.1 3.1s-1.39 3.1-3.1 3.1h-4V17h4c2.76 0 5-2.24 5-5s-2.24-5-5-5z" />,
    regex: <path d="M19.14 12.94c.04-.31.06-.63.06-.94 0-.31-.02-.63-.06-.94l2.03-1.58c.18-.14.23-.41.12-.61l-1.92-3.32c-.12-.22-.37-.29-.59-.22l-2.39.96c-.5-.38-1.03-.7-1.62-.94l-.36-2.54c-.04-.24-.24-.41-.48-.41h-3.84c-.24 0-.43.17-.47.41l-.36 2.54c-.59.24-1.13.57-1.62.94l-2.39-.96c-.22-.08-.47 0-.59.22L3.16 8.87c-.12.21-.08.47.12.61l2.03 1.58c-.04.31-.06.63-.06.94s.02.63.06.94l-2.03 1.58c-.18.14-.23.41-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.05.24.24.41.48.41h3.84c.24 0 .44-.17.47-.41l.36-2.54c.59-.24 1.13-.56 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32c.12-.22.07-.47-.12-.61l-2.01-1.58zM12 15.6c-1.98 0-3.6-1.62-3.6-3.6s1.62-3.6 3.6-3.6 3.6 1.62 3.6 3.6-1.62 3.6-3.6 3.6z" />,
    naming: <path d="M9 4c0-1.11.89-2 2-2s2 .89 2 2-.89 2-2 2-2-.89-2-2zm9 10v-2h-2v2h2zm0 4v-2h-2v2h2zm-4-4v-2h-2v2h2zm0 4v-2h-2v2h2zm-4-4v-2H8v2h2zm0 4v-2H8v2h2zm-4-4v-2H4v2h2zm0 4v-2H4v2h2zM7 7h10v2H7z" />,
    http: <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z" />,
    uuid: <path d="M12 4V1L8 5l4 4V6c3.31 0 6 2.69 6 6 0 1.01-.25 1.97-.7 2.8l1.46 1.46A7.93 7.93 0 0020 12c0-4.42-3.58-8-8-8zm0 14c-3.31 0-6-2.69-6-6 0-1.01.25-1.97.7-2.8L5.24 7.74A7.93 7.93 0 004 12c0 4.42 3.58 8 8 8v3l4-4-4-4v3z" />,
    base: <path d="M7 2v11h3v9l7-12h-4l4-8z" />,
    // 文本工具
    diff: <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-7 14l-5-5 1.41-1.41L12 14.17l4.59-4.58L18 11l-6 6z" />,
    word: <path d="M2.5 4v3h5v12h3V7h5V4h-13zm19 5h-9v3h3v7h3v-7h3V9z" />,
    lorem: <path d="M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z" />,
    markdown: <path d="M20.56 18H3.44C2.65 18 2 17.37 2 16.59V7.41C2 6.63 2.65 6 3.44 6h17.12c.79 0 1.44.63 1.44 1.41v9.18c0 .78-.65 1.41-1.44 1.41zM6.81 15.19v-3.66l1.92 2.35 1.92-2.35v3.66h1.93V8.81h-1.93l-1.92 2.35-1.92-2.35H4.88v6.38h1.93zM19.69 12h-1.92V8.81h-1.92V12h-1.93l2.89 3.28L19.69 12z" />,
    // 转换工具
    timestamp: <path d="M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm.5-13H11v6l5.25 3.15.75-1.23-4.5-2.67z" />,
    color: <path d="M12 3c-4.97 0-9 4.03-9 9s4.03 9 9 9c.83 0 1.5-.67 1.5-1.5 0-.39-.15-.74-.39-1.01-.23-.26-.38-.61-.38-.99 0-.83.67-1.5 1.5-1.5H16c2.76 0 5-2.24 5-5 0-4.42-4.03-8-9-8zm-5.5 9c-.83 0-1.5-.67-1.5-1.5S5.67 9 6.5 9 8 9.67 8 10.5 7.33 12 6.5 12zm3-4C8.67 8 8 7.33 8 6.5S8.67 5 9.5 5s1.5.67 1.5 1.5S10.33 8 9.5 8zm5 0c-.83 0-1.5-.67-1.5-1.5S13.67 5 14.5 5s1.5.67 1.5 1.5S15.33 8 14.5 8zm3 4c-.83 0-1.5-.67-1.5-1.5S16.67 9 17.5 9s1.5.67 1.5 1.5-.67 1.5-1.5 1.5z" />,
    unit: <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-7 14h-2V9h-2V7h4v10zm4-6h-2v2h2v2h-2v2h-2V7h4v4z" />,
    image: <path d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z" />,
    document: <path d="M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z" />,
    // 生成工具
    password: <path d="M12.65 10C11.83 7.67 9.61 6 7 6c-3.31 0-6 2.69-6 6s2.69 6 6 6c2.61 0 4.83-1.67 5.65-4H17v4h4v-4h2v-4H12.65zM7 14c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2z" />,
    qrcode: <path d="M3 11h8V3H3v8zm2-6h4v4H5V5zm8-2v8h8V3h-8zm6 6h-4V5h4v4zM3 21h8v-8H3v8zm2-6h4v4H5v-4zm13 4h-2v2h2v-2zm2 0h2v-2h-2v2zm0-4h2v-2h-2v2zm-6 6h2v-2h-2v2zm0-8h2v-2h-2v2zm2 2h2v-2h-2v2z" />,
    cron: <path d="M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm.5-13H11v6l5.25 3.15.75-1.23-4.5-2.67z" />,
    // 查询工具
    ip: <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" />,
    // 效率工具
    salary: <path d="M11.8 10.9c-2.27-.59-3-1.2-3-2.15 0-1.09 1.01-1.85 2.7-1.85 1.78 0 2.44.85 2.5 2.1h2.21c-.07-1.72-1.12-3.3-3.21-3.81V3h-3v2.16c-1.94.42-3.5 1.68-3.5 3.61 0 2.31 1.91 3.46 4.7 4.13 2.5.6 3 1.48 3 2.41 0 .69-.49 1.79-2.7 1.79-2.06 0-2.87-.92-2.98-2.1h-2.2c.12 2.19 1.76 3.42 3.68 3.83V21h3v-2.15c1.95-.37 3.5-1.5 3.5-3.55 0-2.84-2.43-3.81-4.7-4.4z" />,
    keyboard: <path d="M20 5H4c-1.1 0-1.99.9-1.99 2L2 17c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm-9 3h2v2h-2V8zm0 3h2v2h-2v-2zM8 8h2v2H8V8zm0 3h2v2H8v-2zm-1 2H5v-2h2v2zm0-3H5V8h2v2zm9 7H8v-2h8v2zm0-4h-2v-2h2v2zm0-3h-2V8h2v2zm3 3h-2v-2h2v2zm0-3h-2V8h2v2z" />,
    pomodoro: <path d="M15 1H9v2h6V1zm-4 13h2V8h-2v6zm8.03-6.61l1.42-1.42c-.43-.51-.9-.99-1.41-1.41l-1.42 1.42A8.962 8.962 0 0012 4c-4.97 0-9 4.03-9 9s4.02 9 9 9 9-4.03 9-9c0-2.12-.74-4.07-1.97-5.61zM12 20c-3.87 0-7-3.13-7-7s3.13-7 7-7 7 3.13 7 7-3.13 7-7 7z" />,
    poem: <path d="M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z" />,
    // 分类图标
    all: <path d="M13.5.67s.74 2.65.74 4.8c0 2.06-1.35 3.73-3.41 3.73-2.07 0-3.63-1.67-3.63-3.73l.03-.36C5.21 7.51 4 10.62 4 14c0 4.42 3.58 8 8 8s8-3.58 8-8C20 8.61 17.41 3.8 13.5.67zM11.71 19c-1.78 0-3.22-1.4-3.22-3.14 0-1.62 1.05-2.76 2.81-3.12 1.77-.36 3.6-1.21 4.62-2.58.39 1.29.59 2.65.59 4.04 0 2.65-2.15 4.8-4.8 4.8z" />,
    fav: <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />,
    dev: <path d="M9.4 16.6L4.8 12l4.6-4.6L8 6l-6 6 6 6 1.4-1.4zm5.2 0l4.6-4.6-4.6-4.6L16 6l6 6-6 6-1.4-1.4z" />,
    text: <path d="M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z" />,
    convert: <path d="M12 4V1L8 5l4 4V6c3.31 0 6 2.69 6 6 0 1.01-.25 1.97-.7 2.8l1.46 1.46A7.93 7.93 0 0020 12c0-4.42-3.58-8-8-8zm0 14c-3.31 0-6-2.69-6-6 0-1.01.25-1.97.7-2.8L5.24 7.74A7.93 7.93 0 004 12c0 4.42 3.58 8 8 8v3l4-4-4-4v3z" />,
    gen: <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />,
    query: <path d="M15.5 14h-.79l-.28-.27A6.471 6.471 0 0016 9.5 6.5 6.5 0 109.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z" />,
    eff: <path d="M7 2v11h3v9l7-12h-4l4-8z" />,
    // 其他
    search: <path d="M15.5 14h-.79l-.28-.27A6.471 6.471 0 0016 9.5 6.5 6.5 0 109.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z" />,
    history: <path d="M13 3c-4.97 0-9 4.03-9 9H1l3.89 3.89.07.14L9 12H6c0-3.87 3.13-7 7-7s7 3.13 7 7-3.13 7-7 7c-1.93 0-3.68-.79-4.94-2.06l-1.42 1.42A8.954 8.954 0 0013 21c4.97 0 9-4.03 9-9s-4.03-9-9-9zm-1 5v5l4.28 2.54.72-1.21-3.5-2.08V8H12z" />,
    star: <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />,
    starEmpty: <path d="M22 9.24l-7.19-.62L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21 12 17.27 18.18 21l-1.63-7.03L22 9.24zM12 15.4l-3.76 2.27 1-4.28-3.32-2.88 4.38-.38L12 6.1l1.71 4.04 4.38.38-3.32 2.88 1 4.28L12 15.4z" />,
    close: <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />,
    copy: <path d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z" />,
  };

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill={color}
      style={{ display: 'inline-block', verticalAlign: 'middle' }}
    >
      {icons[name] || icons.all}
    </svg>
  );
};

// ─── Shared style builders ───
const getStyles = (colors) => ({
  input: {
    width: '100%', padding: '10px 12px', background: colors.inputBg,
    border: `1px solid ${colors.border}`, borderRadius: 6, color: colors.text,
    fontSize: 14, outline: 'none', boxSizing: 'border-box',
  },
  textarea: {
    width: '100%', minHeight: 140, padding: 10, background: colors.inputBg,
    border: `1px solid ${colors.border}`, borderRadius: 6, color: colors.text,
    fontSize: 14, fontFamily: 'monospace', resize: 'vertical',
    outline: 'none', boxSizing: 'border-box',
  },
  btn: {
    padding: '8px 18px', background: colors.accent, color: '#fff',
    border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 14,
    fontWeight: 600, transition: 'opacity .2s',
  },
  btnSec: {
    padding: '8px 18px', background: 'transparent', color: colors.text,
    border: `1px solid ${colors.border}`, borderRadius: 6, cursor: 'pointer', fontSize: 14,
  },
  row: { display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 10 },
  label: { color: colors.textSecondary, fontSize: 13, marginBottom: 4, display: 'block' },
  output: {
    width: '100%', minHeight: 100, padding: 10, background: colors.inputBg,
    border: `1px solid ${colors.border}`, borderRadius: 6, color: colors.text,
    fontSize: 14, fontFamily: 'monospace', whiteSpace: 'pre-wrap',
    wordBreak: 'break-all', overflowY: 'auto', maxHeight: 300,
    boxSizing: 'border-box',
  },
});

// ─── Copy helper with feedback ───
function useCopy() {
  const [copied, setCopied] = useState(false);
  const copy = (text) => {
    navigator.clipboard?.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };
  return { copy, copied };
}

function CopyBtn({ text, colors, label = '复制' }) {
  const { copy, copied } = useCopy();
  const S = getStyles(colors);
  return (
    <button style={S.btnSec} onClick={() => copy(text)}>
      {copied ? '已复制 ✓' : label}
    </button>
  );
}

// ═══════════════════════════════════════════════════
// 1. JSON 格式化
// ═══════════════════════════════════════════════════
function JsonFormatter({ colors }) {
  const S = getStyles(colors);
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [error, setError] = useState('');

  const format = () => {
    try { setOutput(JSON.stringify(JSON.parse(input), null, 2)); setError(''); }
    catch (e) { setError(e.message); setOutput(''); }
  };
  const compress = () => {
    try { setOutput(JSON.stringify(JSON.parse(input))); setError(''); }
    catch (e) { setError(e.message); setOutput(''); }
  };
  const validate = () => {
    try { JSON.parse(input); setError(''); setOutput('✅ JSON 格式正确'); }
    catch (e) { setError('❌ ' + e.message); setOutput(''); }
  };

  const highlight = (str) => {
    if (!str) return null;
    return str.split('\n').map((line, i) => {
      const colored = line
        .replace(/"([^"]+)"(?=\s*:)/g, '<key>"$1"</key>')
        .replace(/:\s*"([^"]*)"/g, ': <str>"$1"</str>')
        .replace(/:\s*(true|false)/g, ': <bool>$1</bool>')
        .replace(/:\s*(\d+\.?\d*)/g, ': <num>$1</num>')
        .replace(/:\s*(null)/g, ': <nil>$1</nil>');
      return (
        <div key={i} dangerouslySetInnerHTML={{
          __html: colored
            .replace(/<key>/g, `<span style="color:${colors.accent}">`)
            .replace(/<\/key>/g, '</span>')
            .replace(/<str>/g, '<span style="color:#a8e6cf">')
            .replace(/<\/str>/g, '</span>')
            .replace(/<bool>/g, '<span style="color:#ffd93d">')
            .replace(/<\/bool>/g, '</span>')
            .replace(/<num>/g, '<span style="color:#6ec6ff">')
            .replace(/<\/num>/g, '</span>')
            .replace(/<nil>/g, `<span style="color:${colors.textSecondary}">`)
            .replace(/<\/nil>/g, '</span>')
        }} />
      );
    });
  };

  return (
    <div>
      <textarea style={S.textarea} rows={8} placeholder="粘贴 JSON..." value={input} onChange={e => setInput(e.target.value)} />
      <div style={S.row}>
        <button style={S.btn} onClick={format}>格式化</button>
        <button style={S.btnSec} onClick={compress}>压缩</button>
        <button style={S.btnSec} onClick={validate}>验证</button>
        {output && <CopyBtn text={output} colors={colors} />}
      </div>
      {error && <div style={{ color: colors.accent, marginBottom: 8 }}>{error}</div>}
      {output && <div style={S.output}>{highlight(output)}</div>}
    </div>
  );
}

// ═══════════════════════════════════════════════════
// 2. 文本对比
// ═══════════════════════════════════════════════════
function TextDiff({ colors }) {
  const S = getStyles(colors);
  const [left, setLeft] = useState('');
  const [right, setRight] = useState('');
  const [result, setResult] = useState(null);

  const compare = () => setResult(Diff.diffLines(left, right));

  return (
    <div>
      <div style={{ display: 'flex', gap: 10 }}>
        <div style={{ flex: 1 }}>
          <span style={S.label}>原始文本</span>
          <textarea style={S.textarea} rows={8} value={left} onChange={e => setLeft(e.target.value)} />
        </div>
        <div style={{ flex: 1 }}>
          <span style={S.label}>修改文本</span>
          <textarea style={S.textarea} rows={8} value={right} onChange={e => setRight(e.target.value)} />
        </div>
      </div>
      <div style={{ ...S.row, marginTop: 10 }}>
        <button style={S.btn} onClick={compare}>对比</button>
      </div>
      {result && (
        <div style={{ ...S.output, maxHeight: 350 }}>
          {result.map((part, i) => (
            <span key={i} style={{
              background: part.added ? 'rgba(0,180,80,.25)' : part.removed ? 'rgba(233,69,96,.25)' : 'transparent',
              color: part.added ? '#4caf50' : part.removed ? colors.accent : colors.text,
              textDecoration: part.removed ? 'line-through' : 'none',
            }}>{part.value}</span>
          ))}
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════
// 3. Base64 编解码
// ═══════════════════════════════════════════════════
function Base64Tool({ colors }) {
  const S = getStyles(colors);
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [err, setErr] = useState('');

  const encode = () => {
    try {
      setOutput(btoa(new TextEncoder().encode(input).reduce((s, b) => s + String.fromCharCode(b), '')));
      setErr('');
    } catch (e) { setErr(e.message); }
  };
  const decode = () => {
    try {
      const bytes = Uint8Array.from(atob(input), c => c.charCodeAt(0));
      setOutput(new TextDecoder().decode(bytes));
      setErr('');
    } catch (e) { setErr(e.message); }
  };

  return (
    <div>
      <textarea style={S.textarea} rows={5} placeholder="输入文本..." value={input} onChange={e => setInput(e.target.value)} />
      <div style={S.row}>
        <button style={S.btn} onClick={encode}>编码</button>
        <button style={S.btnSec} onClick={decode}>解码</button>
        {output && <CopyBtn text={output} colors={colors} />}
      </div>
      {err && <div style={{ color: colors.accent, marginBottom: 8 }}>{err}</div>}
      {output && <div style={S.output}>{output}</div>}
    </div>
  );
}

// ═══════════════════════════════════════════════════
// 4. URL 编解码
// ═══════════════════════════════════════════════════
function UrlTool({ colors }) {
  const S = getStyles(colors);
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');

  return (
    <div>
      <textarea style={S.textarea} rows={4} placeholder="输入 URL..." value={input} onChange={e => setInput(e.target.value)} />
      <div style={S.row}>
        <button style={S.btn} onClick={() => setOutput(encodeURIComponent(input))}>编码</button>
        <button style={S.btnSec} onClick={() => { try { setOutput(decodeURIComponent(input)); } catch { setOutput('解码失败'); } }}>解码</button>
        {output && <CopyBtn text={output} colors={colors} />}
      </div>
      {output && <div style={S.output}>{output}</div>}
    </div>
  );
}

// ═══════════════════════════════════════════════════
// 5. 时间戳转换
// ═══════════════════════════════════════════════════
function TimestampTool({ colors }) {
  const S = getStyles(colors);
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');

  const toDate = () => {
    const n = Number(input);
    if (isNaN(n)) { setOutput('无效时间戳'); return; }
    const ms = n > 1e12 ? n : n * 1000;
    setOutput(new Date(ms).toLocaleString('zh-CN', { hour12: false }));
  };
  const toTimestamp = () => {
    const d = new Date(input);
    if (isNaN(d.getTime())) { setOutput('无效日期'); return; }
    setOutput(`秒: ${Math.floor(d.getTime() / 1000)}\n毫秒: ${d.getTime()}`);
  };
  const now = () => {
    const t = Math.floor(Date.now() / 1000);
    setInput(String(t));
    setOutput(new Date(t * 1000).toLocaleString('zh-CN', { hour12: false }));
  };

  return (
    <div>
      <input style={S.input} placeholder="时间戳 或 日期字符串 (如 2024-01-01 12:00:00)" value={input} onChange={e => setInput(e.target.value)} />
      <div style={{ ...S.row, marginTop: 10 }}>
        <button style={S.btn} onClick={toDate}>时间戳 → 日期</button>
        <button style={S.btnSec} onClick={toTimestamp}>日期 → 时间戳</button>
        <button style={S.btnSec} onClick={now}>当前时间</button>
      </div>
      {output && <div style={S.output}>{output}</div>}
    </div>
  );
}

// ═══════════════════════════════════════════════════
// 6. 密码生成器
// ═══════════════════════════════════════════════════
function PasswordGenerator({ colors }) {
  const S = getStyles(colors);
  const [len, setLen] = useState(16);
  const [upper, setUpper] = useState(true);
  const [lower, setLower] = useState(true);
  const [nums, setNums] = useState(true);
  const [syms, setSyms] = useState(true);
  const [pwd, setPwd] = useState('');

  const generate = () => {
    let chars = '';
    if (upper) chars += 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    if (lower) chars += 'abcdefghijklmnopqrstuvwxyz';
    if (nums) chars += '0123456789';
    if (syms) chars += '!@#$%^&*()_+-=[]{}|;:,.<>?';
    if (!chars) { setPwd('请至少选择一种字符类型'); return; }
    let result = '';
    const arr = new Uint32Array(len);
    crypto.getRandomValues(arr);
    for (let i = 0; i < len; i++) result += chars[arr[i] % chars.length];
    setPwd(result);
  };

  const chk = (label, val, set) => (
    <label style={{ color: colors.text, fontSize: 14, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}>
      <input type="checkbox" checked={val} onChange={e => set(e.target.checked)} style={{ accentColor: colors.accent }} /> {label}
    </label>
  );

  return (
    <div>
      <div style={{ ...S.row, alignItems: 'center' }}>
        <span style={{ color: colors.textSecondary, fontSize: 13 }}>长度: {len}</span>
        <input type="range" min={8} max={64} value={len} onChange={e => setLen(+e.target.value)}
          style={{ flex: 1, accentColor: colors.accent }} />
      </div>
      <div style={{ ...S.row, marginBottom: 12 }}>
        {chk('大写', upper, setUpper)}
        {chk('小写', lower, setLower)}
        {chk('数字', nums, setNums)}
        {chk('符号', syms, setSyms)}
      </div>
      <div style={S.row}>
        <button style={S.btn} onClick={generate}>生成密码</button>
        {pwd && <CopyBtn text={pwd} colors={colors} />}
      </div>
      {pwd && <div style={{ ...S.output, fontSize: 16, letterSpacing: 1 }}>{pwd}</div>}
    </div>
  );
}

// ═══════════════════════════════════════════════════
// 7. 字数统计
// ═══════════════════════════════════════════════════
function WordCounter({ colors }) {
  const S = getStyles(colors);
  const [text, setText] = useState('');

  const chars = text.length;
  const charsNoSpace = text.replace(/\s/g, '').length;
  const lines = text ? text.split('\n').length : 0;
  const chinese = (text.match(/[\u4e00-\u9fff]/g) || []).length;
  const english = (text.match(/[a-zA-Z]+/g) || []).length;
  const spaces = (text.match(/ /g) || []).length;

  const statStyle = {
    background: colors.inputBg, border: `1px solid ${colors.border}`, borderRadius: 8,
    padding: '12px 16px', textAlign: 'center', minWidth: 80, flex: '1 1 80px',
  };

  return (
    <div>
      <textarea style={{ ...S.textarea, minHeight: 180 }} placeholder="输入或粘贴文本..." value={text} onChange={e => setText(e.target.value)} />
      <div style={{ display: 'flex', gap: 10, marginTop: 12, flexWrap: 'wrap' }}>
        {[
          ['字符数', chars], ['行数', lines], ['中文字数', chinese],
          ['英文单词', english], ['空格数', spaces],
        ].map(([label, val]) => (
          <div key={label} style={statStyle}>
            <div style={{ color: colors.accent, fontSize: 22, fontWeight: 700 }}>{val}</div>
            <div style={{ color: colors.textSecondary, fontSize: 12, marginTop: 4 }}>{label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════
// 8. 正则测试
// ═══════════════════════════════════════════════════
function RegexTester({ colors }) {
  const S = getStyles(colors);
  const [pattern, setPattern] = useState('');
  const [flagG, setFlagG] = useState(true);
  const [flagI, setFlagI] = useState(false);
  const [flagM, setFlagM] = useState(false);
  const [text, setText] = useState('');

  const flags = (flagG ? 'g' : '') + (flagI ? 'i' : '') + (flagM ? 'm' : '');
  let matches = [];
  let error = '';

  if (pattern) {
    try {
      const re = new RegExp(pattern, flags);
      let m;
      if (flags.includes('g')) {
        while ((m = re.exec(text)) !== null) {
          matches.push({ index: m.index, text: m[0] });
          if (!m[0]) break;
        }
      } else {
        m = re.exec(text);
        if (m) matches.push({ index: m.index, text: m[0] });
      }
    } catch (e) { error = e.message; }
  }

  const buildHighlighted = () => {
    if (!matches.length || error) return text;
    const parts = [];
    let last = 0;
    matches.forEach(({ index, text: mt }) => {
      if (index > last) parts.push(<span key={`t${last}`}>{text.slice(last, index)}</span>);
      parts.push(<span key={`m${index}`} style={{ background: colors.accentLight, color: colors.accent, borderRadius: 2, padding: '0 2px', fontWeight: 600 }}>{mt}</span>);
      last = index + mt.length;
    });
    if (last < text.length) parts.push(<span key="end">{text.slice(last)}</span>);
    return parts;
  };

  const chkStyle = { color: colors.text, fontSize: 13, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 3 };

  return (
    <div>
      <div style={{ display: 'flex', gap: 8, marginBottom: 10, alignItems: 'center' }}>
        <input style={{ ...S.input, flex: 1 }} placeholder="正则表达式" value={pattern} onChange={e => setPattern(e.target.value)} />
      </div>
      <div style={{ ...S.row, marginBottom: 10 }}>
        <label style={chkStyle}><input type="checkbox" checked={flagG} onChange={e => setFlagG(e.target.checked)} style={{ accentColor: colors.accent }} /> g (全局)</label>
        <label style={chkStyle}><input type="checkbox" checked={flagI} onChange={e => setFlagI(e.target.checked)} style={{ accentColor: colors.accent }} /> i (忽略大小写)</label>
        <label style={chkStyle}><input type="checkbox" checked={flagM} onChange={e => setFlagM(e.target.checked)} style={{ accentColor: colors.accent }} /> m (多行)</label>
      </div>
      <textarea style={S.textarea} rows={6} placeholder="测试文本..." value={text} onChange={e => setText(e.target.value)} />
      {error && <div style={{ color: colors.accent, marginTop: 6 }}>{error}</div>}
      <div style={{ color: colors.textSecondary, fontSize: 13, margin: '8px 0' }}>匹配数: {matches.length}</div>
      {text && <div style={{ ...S.output, whiteSpace: 'pre-wrap' }}>{buildHighlighted()}</div>}
    </div>
  );
}

// ═══════════════════════════════════════════════════
// 9. 颜色转换
// ═══════════════════════════════════════════════════
function ColorConverter({ colors }) {
  const S = getStyles(colors);
  const [input, setInput] = useState('#e94560');
  const [results, setResults] = useState(null);

  const parse = (val) => {
    let r, g, b;
    const hexMatch = val.match(/^#?([0-9a-f]{3,8})$/i);
    if (hexMatch) {
      let h = hexMatch[1];
      if (h.length === 3) h = h[0]+h[0]+h[1]+h[1]+h[2]+h[2];
      r = parseInt(h.slice(0,2),16); g = parseInt(h.slice(2,4),16); b = parseInt(h.slice(4,6),16);
    }
    const rgbMatch = val.match(/rgb\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*\)/i);
    if (rgbMatch) { r = +rgbMatch[1]; g = +rgbMatch[2]; b = +rgbMatch[3]; }
    const hslMatch = val.match(/hsl\(\s*(\d+)\s*,\s*(\d+)%?\s*,\s*(\d+)%?\s*\)/i);
    if (hslMatch) {
      const h2 = +hslMatch[1]/360, s2 = +hslMatch[2]/100, l2 = +hslMatch[3]/100;
      if (s2 === 0) { r = g = b = Math.round(l2*255); }
      else {
        const hue2rgb = (p,q,t) => { if(t<0)t+=1; if(t>1)t-=1; if(t<1/6)return p+(q-p)*6*t; if(t<1/2)return q; if(t<2/3)return p+(q-p)*(2/3-t)*6; return p; };
        const q = l2<.5 ? l2*(1+s2) : l2+s2-l2*s2, p = 2*l2-q;
        r = Math.round(hue2rgb(p,q,h2+1/3)*255); g = Math.round(hue2rgb(p,q,h2)*255); b = Math.round(hue2rgb(p,q,h2-1/3)*255);
      }
    }
    if (r === undefined) return null;
    const r1=r/255, g1=g/255, b1=b/255;
    const max=Math.max(r1,g1,b1), min=Math.min(r1,g1,b1), l=(max+min)/2;
    let h=0, s=0;
    if (max!==min) {
      const d=max-min; s=l>.5?d/(2-max-min):d/(max+min);
      if(max===r1) h=((g1-b1)/d+(g1<b1?6:0))/6;
      else if(max===g1) h=((b1-r1)/d+2)/6;
      else h=((r1-g1)/d+4)/6;
    }
    return {
      hex: `#${((1<<24)+(r<<16)+(g<<8)+b).toString(16).slice(1)}`,
      rgb: `rgb(${r}, ${g}, ${b})`,
      hsl: `hsl(${Math.round(h*360)}, ${Math.round(s*100)}%, ${Math.round(l*100)}%)`,
    };
  };

  const convert = () => setResults(parse(input));

  return (
    <div>
      <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
        <input style={{ ...S.input, flex: 1 }} placeholder="#hex / rgb(r,g,b) / hsl(h,s%,l%)" value={input} onChange={e => setInput(e.target.value)} />
        <button style={S.btn} onClick={convert}>转换</button>
      </div>
      {results && (
        <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start', flexWrap: 'wrap' }}>
          <div style={{ width: 80, height: 80, borderRadius: 8, background: results.hex, border: `2px solid ${colors.border}` }} />
          <div style={{ flex: 1 }}>
            {['hex','rgb','hsl'].map(k => (
              <div key={k} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                <span style={{ color: colors.textSecondary, width: 36, fontSize: 13, textTransform: 'uppercase' }}>{k}:</span>
                <code style={{ color: colors.text, background: colors.inputBg, padding: '4px 10px', borderRadius: 4, flex: 1 }}>{results[k]}</code>
                <CopyBtn text={results[k]} colors={colors} />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════
// 10. Lorem 生成 (Chinese)
// ═══════════════════════════════════════════════════
function LoremChinese({ colors }) {
  const S = getStyles(colors);
  const [count, setCount] = useState(3);
  const [output, setOutput] = useState('');

  const phrases = [
    '摸鱼是一种生活态度', '今天的工作明天再说', '人生苦短何必加班',
    '代码能跑就行不要追求完美', '需求又改了但是我已经下班了',
    '这个bug不是我写的', '在座的各位都是打工人', '早安打工人',
    '干饭不积极思想有问题', '上班如上坟心情很沉重',
    '老板的饼画得真圆', '今天也是元气满满摸鱼的一天',
    '工资是固定的但摸鱼是无限的', '键盘敲得越响摸鱼越开心',
    '会议是最好的摸鱼时间', '假装很忙其实在发呆',
    '下班倒计时才是真正的动力', '摸鱼一时爽一直摸鱼一直爽',
    '今天的KPI就是活着', '代码写完了但是不想提交',
    '午饭吃什么是每天最大的难题', '又是美好的摸鱼日',
    '工作使我快乐摸鱼使我更快乐', '这个需求做不了建议砍掉',
    '我不是在摸鱼我是在思考人生', '电脑开着人已经神游了',
  ];

  const generate = () => {
    let result = '';
    for (let i = 0; i < count; i++) {
      const sentenceCount = 3 + Math.floor(Math.random() * 4);
      const sentences = [];
      for (let j = 0; j < sentenceCount; j++) {
        sentences.push(phrases[Math.floor(Math.random() * phrases.length)]);
      }
      result += sentences.join('，') + '。\n\n';
    }
    setOutput(result.trim());
  };

  return (
    <div>
      <div style={{ ...S.row, alignItems: 'center' }}>
        <span style={{ color: colors.textSecondary, fontSize: 13 }}>段落数:</span>
        <input type="number" min={1} max={10} value={count} onChange={e => setCount(Math.min(10, Math.max(1, +e.target.value)))}
          style={{ ...S.input, width: 80 }} />
        <button style={S.btn} onClick={generate}>生成</button>
        {output && <CopyBtn text={output} colors={colors} />}
      </div>
      {output && <div style={{ ...S.output, marginTop: 10 }}>{output}</div>}
    </div>
  );
}

// ═══════════════════════════════════════════════════
// 11. Markdown 预览
// ═══════════════════════════════════════════════════
function MarkdownPreview({ colors }) {
  const S = getStyles(colors);
  const [md, setMd] = useState('# 标题\n\n这是一段 **Markdown** 文本。\n\n- 列表项 1\n- 列表项 2\n\n```js\nconsole.log("摸鱼快乐");\n```');

  return (
    <div style={{ display: 'flex', gap: 12, minHeight: 300 }}>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        <span style={S.label}>Markdown 输入</span>
        <textarea style={{ ...S.textarea, flex: 1, minHeight: 280 }} value={md} onChange={e => setMd(e.target.value)} />
      </div>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        <span style={S.label}>预览</span>
        <div style={{
          ...S.output, flex: 1, minHeight: 280, lineHeight: 1.7,
          overflow: 'auto', padding: 14,
        }}>
          <ReactMarkdown>{md}</ReactMarkdown>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════
// 12. 进制转换
// ═══════════════════════════════════════════════════
function BaseConverter({ colors }) {
  const S = getStyles(colors);
  const [input, setInput] = useState('');
  const [fromBase, setFromBase] = useState(10);
  const [results, setResults] = useState(null);

  const convert = () => {
    try {
      const num = parseInt(input, fromBase);
      if (isNaN(num)) { setResults(null); return; }
      setResults({
        '二进制 (2)': num.toString(2),
        '八进制 (8)': num.toString(8),
        '十进制 (10)': num.toString(10),
        '十六进制 (16)': num.toString(16).toUpperCase(),
      });
    } catch { setResults(null); }
  };

  const bases = [
    { label: '二进制', val: 2 }, { label: '八进制', val: 8 },
    { label: '十进制', val: 10 }, { label: '十六进制', val: 16 },
  ];

  return (
    <div>
      <div style={{ display: 'flex', gap: 8, marginBottom: 10, alignItems: 'center' }}>
        <input style={{ ...S.input, flex: 1 }} placeholder="输入数字" value={input} onChange={e => setInput(e.target.value)} />
        <select value={fromBase} onChange={e => setFromBase(+e.target.value)}
          style={{ ...S.input, width: 120, cursor: 'pointer' }}>
          {bases.map(b => <option key={b.val} value={b.val}>{b.label}</option>)}
        </select>
        <button style={S.btn} onClick={convert}>转换</button>
      </div>
      {results && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {Object.entries(results).map(([label, val]) => (
            <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ color: colors.textSecondary, fontSize: 13, width: 100 }}>{label}:</span>
              <code style={{ color: colors.text, background: colors.inputBg, padding: '6px 12px', borderRadius: 4, flex: 1, fontFamily: 'monospace' }}>{val}</code>
              <CopyBtn text={val} colors={colors} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════
// 13. UUID 生成器
// ═══════════════════════════════════════════════════
function UuidGenerator({ colors }) {
  const S = getStyles(colors);
  const [count, setCount] = useState(5);
  const [uuids, setUuids] = useState([]);

  const genUUID = () => {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
      const r = (Math.random() * 16) | 0;
      return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16);
    });
  };

  const generate = () => {
    const n = Math.min(100, Math.max(1, count));
    const list = [];
    for (let i = 0; i < n; i++) list.push(genUUID());
    setUuids(list);
  };

  const allText = uuids.join('\n');

  return (
    <div>
      <div style={{ ...S.row, alignItems: 'center' }}>
        <span style={{ color: colors.textSecondary, fontSize: 13 }}>数量:</span>
        <input type="number" min={1} max={100} value={count}
          onChange={e => setCount(+e.target.value)}
          style={{ ...S.input, width: 80 }} />
        <button style={S.btn} onClick={generate}>生成</button>
        {uuids.length > 0 && <CopyBtn text={allText} colors={colors} label="复制全部" />}
      </div>
      {uuids.length > 0 && (
        <div style={{ ...S.output, marginTop: 10, maxHeight: 300 }}>
          {uuids.map((u, i) => (
            <div key={i} style={{ padding: '2px 0', display: 'flex', alignItems: 'center', gap: 8 }}>
              <code style={{ flex: 1, color: colors.text }}>{u}</code>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════
// 14. 摸鱼计算器
// ═══════════════════════════════════════════════════
function SalaryCalculator({ colors }) {
  const S = getStyles(colors);
  const [salary, setSalary] = useState(10000);
  const [workDays, setWorkDays] = useState(22);
  const [workHours, setWorkHours] = useState(8);
  const [earned, setEarned] = useState(0);
  const [running, setRunning] = useState(false);

  const perSecond = salary / workDays / workHours / 3600;

  useEffect(() => {
    if (!running) return;
    const id = setInterval(() => {
      setEarned(prev => prev + perSecond);
    }, 1000);
    return () => clearInterval(id);
  }, [running, perSecond]);

  const start = () => { setEarned(0); setRunning(true); };
  const stop = () => setRunning(false);
  const reset = () => { setRunning(false); setEarned(0); };

  return (
    <div>
      <div style={{ display: 'flex', gap: 10, marginBottom: 12, flexWrap: 'wrap' }}>
        <div style={{ flex: 1, minWidth: 120 }}>
          <span style={S.label}>月薪 (¥)</span>
          <input type="number" style={S.input} value={salary} onChange={e => setSalary(+e.target.value)} />
        </div>
        <div style={{ flex: 1, minWidth: 120 }}>
          <span style={S.label}>每月工作天数</span>
          <input type="number" style={S.input} value={workDays} onChange={e => setWorkDays(+e.target.value)} />
        </div>
        <div style={{ flex: 1, minWidth: 120 }}>
          <span style={S.label}>每天工作小时</span>
          <input type="number" style={S.input} value={workHours} onChange={e => setWorkHours(+e.target.value)} />
        </div>
      </div>
      <div style={S.row}>
        <button style={S.btn} onClick={start}>{running ? '重新开始' : '开始摸鱼'}</button>
        {running && <button style={S.btnSec} onClick={stop}>暂停</button>}
        <button style={S.btnSec} onClick={reset}>重置</button>
      </div>
      <div style={{
        marginTop: 16, padding: 24, background: colors.inputBg,
        border: `1px solid ${colors.border}`, borderRadius: 12, textAlign: 'center',
      }}>
        <div style={{ color: colors.textSecondary, fontSize: 14, marginBottom: 8 }}>已摸鱼赚了</div>
        <div style={{ color: colors.accent, fontSize: 36, fontWeight: 700, fontFamily: 'monospace' }}>
          ¥{earned.toFixed(4)}
        </div>
        <div style={{ color: colors.textMuted, fontSize: 12, marginTop: 8 }}>
          每秒 ¥{perSecond.toFixed(4)}
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════
// 15. 二维码生成
// ═══════════════════════════════════════════════════
function QrCodeGenerator({ colors }) {
  const S = getStyles(colors);
  const [text, setText] = useState('');
  const [qrUrl, setQrUrl] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (!text.trim()) { setQrUrl(''); setError(''); return; }
    QRCode.toDataURL(text, { width: 256, margin: 2 })
      .then(url => { setQrUrl(url); setError(''); })
      .catch(() => setError('生成失败'));
  }, [text]);

  return (
    <div>
      <textarea style={S.textarea} rows={3} placeholder="输入文本或链接..." value={text} onChange={e => setText(e.target.value)} />
      {error && <div style={{ color: colors.accent, marginTop: 8 }}>{error}</div>}
      {qrUrl && (
        <div style={{ marginTop: 12, textAlign: 'center' }}>
          <img src={qrUrl} alt="QR Code" style={{ borderRadius: 8, border: `2px solid ${colors.border}` }} />
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════
// 16. HTTP 请求测试
// ═══════════════════════════════════════════════════
function HttpTester({ colors }) {
  const S = getStyles(colors);
  const [method, setMethod] = useState('GET');
  const [url, setUrl] = useState('https://api.github.com/users/github');
  const [headers, setHeaders] = useState('{}');
  const [body, setBody] = useState('');
  const [response, setResponse] = useState('');
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('headers');

  const methods = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'HEAD', 'OPTIONS'];

  const sendRequest = async () => {
    setLoading(true);
    setResponse('');
    setStatus(null);
    const startTime = performance.now();

    try {
      const options = {
        method,
        headers: { 'Content-Type': 'application/json', ...JSON.parse(headers || '{}') },
      };
      if (['POST', 'PUT', 'PATCH'].includes(method) && body) {
        options.body = body;
      }

      const res = await fetch(url, options);
      const contentType = res.headers.get('content-type') || '';
      let data;
      if (contentType.includes('application/json')) {
        data = await res.json();
        data = JSON.stringify(data, null, 2);
      } else {
        data = await res.text();
      }

      const duration = (performance.now() - startTime).toFixed(0);
      setStatus({ code: res.status, text: res.statusText, duration });
      setResponse(data);
    } catch (err) {
      setStatus({ code: 0, text: 'Error', duration: 0 });
      setResponse(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
        <select
          value={method}
          onChange={e => setMethod(e.target.value)}
          style={{ ...S.input, width: 100, cursor: 'pointer' }}
        >
          {methods.map(m => <option key={m} value={m}>{m}</option>)}
        </select>
        <input
          style={{ ...S.input, flex: 1 }}
          placeholder="输入 URL..."
          value={url}
          onChange={e => setUrl(e.target.value)}
        />
        <button
          onClick={sendRequest}
          disabled={loading}
          style={{ ...S.btn, opacity: loading ? 0.6 : 1, minWidth: 80 }}
        >
          {loading ? '发送中...' : '发送'}
        </button>
      </div>

      <div style={{ display: 'flex', gap: 8, marginBottom: 10, borderBottom: `1px solid ${colors.border}` }}>
        {['headers', 'body'].map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            style={{
              padding: '8px 16px', border: 'none', background: 'transparent',
              color: activeTab === tab ? colors.accent : colors.textSecondary,
              borderBottom: `2px solid ${activeTab === tab ? colors.accent : 'transparent'}`,
              cursor: 'pointer', fontSize: 13, textTransform: 'capitalize',
            }}
          >
            {tab === 'headers' ? '请求头' : '请求体'}
          </button>
        ))}
      </div>

      {activeTab === 'headers' && (
        <textarea
          style={{ ...S.textarea, minHeight: 80 }}
          placeholder='{"Authorization": "Bearer token"}'
          value={headers}
          onChange={e => setHeaders(e.target.value)}
        />
      )}
      {activeTab === 'body' && (
        <textarea
          style={{ ...S.textarea, minHeight: 80 }}
          placeholder='{"key": "value"}'
          value={body}
          onChange={e => setBody(e.target.value)}
        />
      )}

      {status && (
        <div style={{
          marginTop: 16, padding: '10px 14px', background: colors.inputBg,
          borderRadius: 8, display: 'flex', gap: 16, alignItems: 'center',
        }}>
          <span style={{
            color: status.code >= 200 && status.code < 300 ? '#22c55e' : status.code >= 400 ? '#ef4444' : colors.accent,
            fontWeight: 600,
          }}>
            {status.code} {status.text}
          </span>
          <span style={{ color: colors.textSecondary, fontSize: 13 }}>
            {status.duration}ms
          </span>
          {response && <CopyBtn text={response} colors={colors} />}
        </div>
      )}

      {response && (
        <div style={{ ...S.output, marginTop: 12, maxHeight: 300 }}>{response}</div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════
// 17. CRON 表达式解析器
// ═══════════════════════════════════════════════════
function CronParser({ colors }) {
  const S = getStyles(colors);
  const [cron, setCron] = useState('0 9 * * 1-5');
  const [result, setResult] = useState(null);

  const parseCron = () => {
    const parts = cron.trim().split(/\s+/);
    if (parts.length !== 5) {
      setResult({ error: 'CRON 表达式需要5个字段: 分 时 日 月 周' });
      return;
    }

    const [minute, hour, day, month, weekday] = parts;

    const descriptions = {
      minute: parseField(minute, '分钟', 0, 59),
      hour: parseField(hour, '小时', 0, 23),
      day: parseField(day, '日期', 1, 31),
      month: parseField(month, '月份', 1, 12, ['', '一月', '二月', '三月', '四月', '五月', '六月', '七月', '八月', '九月', '十月', '十一月', '十二月']),
      weekday: parseField(weekday, '星期', 0, 6, ['周日', '周一', '周二', '周三', '周四', '周五', '周六']),
    };

    const readable = generateReadable(descriptions);
    const nextRuns = generateNextRuns(parts);

    setResult({ descriptions, readable, nextRuns });
  };

  const parseField = (field, name, min, max, labels) => {
    if (field === '*') return { type: 'any', name, desc: `每${name}` };
    if (field === '*/1' || field === '1') return { type: 'every', name, desc: `每${name}` };
    if (field.startsWith('*/')) return { type: 'step', name, desc: `每隔${field.slice(2)}${name}` };
    if (field.includes('-')) {
      const [start, end] = field.split('-');
      const startLabel = labels ? labels[parseInt(start)] : start;
      const endLabel = labels ? labels[parseInt(end)] : end;
      return { type: 'range', name, desc: `${startLabel}到${endLabel}` };
    }
    if (field.includes(',')) {
      const values = field.split(',').map(v => labels ? labels[parseInt(v)] : v);
      return { type: 'list', name, desc: values.join(', ') };
    }
    const val = parseInt(field);
    return { type: 'specific', name, desc: labels ? labels[val] : field };
  };

  const generateReadable = (desc) => {
    const parts = [];
    if (desc.month.type !== 'any') parts.push(desc.month.desc);
    if (desc.day.type !== 'any') parts.push(desc.day.desc);
    if (desc.weekday.type !== 'any') parts.push(desc.weekday.desc);
    parts.push(`${desc.hour.desc}的${desc.minute.desc}`);
    return `在${parts.join('、')}执行`;
  };

  const generateNextRuns = (parts) => {
    const runs = [];
    const now = new Date();
    for (let i = 1; i <= 5; i++) {
      const next = new Date(now.getTime() + i * 24 * 60 * 60 * 1000);
      next.setHours(parseInt(parts[1]) || 0, parseInt(parts[0]) || 0, 0, 0);
      runs.push(next.toLocaleString('zh-CN'));
    }
    return runs;
  };

  const presets = [
    { label: '每分钟', value: '* * * * *' },
    { label: '每小时', value: '0 * * * *' },
    { label: '每天9点', value: '0 9 * * *' },
    { label: '工作日9点', value: '0 9 * * 1-5' },
    { label: '每周一', value: '0 0 * * 1' },
    { label: '每月1号', value: '0 0 1 * *' },
  ];

  return (
    <div>
      <div style={{ display: 'flex', gap: 8, marginBottom: 12, flexWrap: 'wrap' }}>
        {presets.map(p => (
          <button
            key={p.value}
            onClick={() => setCron(p.value)}
            style={{
              padding: '6px 12px', borderRadius: 6, border: `1px solid ${colors.border}`,
              background: cron === p.value ? colors.accent : 'transparent',
              color: cron === p.value ? '#fff' : colors.text,
              cursor: 'pointer', fontSize: 12,
            }}
          >
            {p.label}
          </button>
        ))}
      </div>
      <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
        <input
          style={{ ...S.input, flex: 1, fontFamily: 'monospace' }}
          placeholder="分 时 日 月 周 (如: 0 9 * * 1-5)"
          value={cron}
          onChange={e => setCron(e.target.value)}
        />
        <button style={S.btn} onClick={parseCron}>解析</button>
      </div>

      {result && !result.error && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{
            padding: 16, background: colors.inputBg, borderRadius: 8,
            border: `1px solid ${colors.border}`,
          }}>
            <div style={{ color: colors.textSecondary, fontSize: 12, marginBottom: 6 }}>执行时间</div>
            <div style={{ color: colors.accent, fontSize: 16, fontWeight: 600 }}>{result.readable}</div>
          </div>

          <div style={{
            padding: 16, background: colors.inputBg, borderRadius: 8,
            border: `1px solid ${colors.border}`,
          }}>
            <div style={{ color: colors.textSecondary, fontSize: 12, marginBottom: 8 }}>接下来5次执行</div>
            {result.nextRuns.map((time, i) => (
              <div key={i} style={{ color: colors.text, fontSize: 13, padding: '3px 0' }}>
                {i + 1}. {time}
              </div>
            ))}
          </div>
        </div>
      )}
      {result?.error && <div style={{ color: colors.accent }}>{result.error}</div>}
    </div>
  );
}

// ═══════════════════════════════════════════════════
// 18. 代码命名生成器
// ═══════════════════════════════════════════════════
function NamingGenerator({ colors }) {
  const S = getStyles(colors);
  const [input, setInput] = useState('user name');
  const [style, setStyle] = useState('camel');

  const styles = [
    { key: 'camel', label: 'camelCase', desc: '驼峰命名' },
    { key: 'pascal', label: 'PascalCase', desc: '帕斯卡命名' },
    { key: 'snake', label: 'snake_case', desc: '蛇形命名' },
    { key: 'kebab', label: 'kebab-case', desc: '短横线命名' },
    { key: 'screaming', label: 'SCREAMING_SNAKE', desc: '常量命名' },
    { key: 'constant', label: 'UPPER.CASE', desc: '全大写命名' },
  ];

  const convert = (text, styleType) => {
    const words = text.toLowerCase().split(/[\s_-]+/);

    switch (styleType) {
      case 'camel':
        return words[0] + words.slice(1).map(w => w.charAt(0).toUpperCase() + w.slice(1)).join('');
      case 'pascal':
        return words.map(w => w.charAt(0).toUpperCase() + w.slice(1)).join('');
      case 'snake':
        return words.join('_');
      case 'kebab':
        return words.join('-');
      case 'screaming':
        return words.join('_').toUpperCase();
      case 'constant':
        return words.join('.').toUpperCase();
      default:
        return text;
    }
  };

  const results = styles.map(s => ({
    ...s,
    value: convert(input, s.key),
  }));

  return (
    <div>
      <input
        style={{ ...S.input, marginBottom: 12 }}
        placeholder="输入描述（如: user name）..."
        value={input}
        onChange={e => setInput(e.target.value)}
      />

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {results.map(r => (
          <div
            key={r.key}
            style={{
              display: 'flex', alignItems: 'center', gap: 12,
              padding: '12px 16px', background: colors.inputBg,
              borderRadius: 8, border: `1px solid ${colors.border}`,
            }}
          >
            <span style={{ color: colors.textSecondary, fontSize: 12, width: 120 }}>{r.label}</span>
            <code style={{
              flex: 1, color: colors.text, fontFamily: 'monospace',
              fontSize: 14, padding: '4px 8px', background: colors.cardBg,
              borderRadius: 4,
            }}>
              {r.value}
            </code>
            <CopyBtn text={r.value} colors={colors} />
          </div>
        ))}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════
// 19. 单位转换器
// ═══════════════════════════════════════════════════
function UnitConverter({ colors }) {
  const S = getStyles(colors);
  const [category, setCategory] = useState('length');
  const [fromValue, setFromValue] = useState(1);
  const [fromUnit, setFromUnit] = useState('m');
  const [toUnit, setToUnit] = useState('cm');

  const categories = {
    length: {
      label: '长度',
      units: {
        m: { label: '米', factor: 1 },
        km: { label: '千米', factor: 1000 },
        cm: { label: '厘米', factor: 0.01 },
        mm: { label: '毫米', factor: 0.001 },
        in: { label: '英寸', factor: 0.0254 },
        ft: { label: '英尺', factor: 0.3048 },
        yd: { label: '码', factor: 0.9144 },
        mi: { label: '英里', factor: 1609.344 },
      },
    },
    weight: {
      label: '重量',
      units: {
        kg: { label: '千克', factor: 1 },
        g: { label: '克', factor: 0.001 },
        mg: { label: '毫克', factor: 0.000001 },
        lb: { label: '磅', factor: 0.453592 },
        oz: { label: '盎司', factor: 0.0283495 },
        t: { label: '吨', factor: 1000 },
      },
    },
    temperature: {
      label: '温度',
      units: {
        c: { label: '摄氏度' },
        f: { label: '华氏度' },
        k: { label: '开尔文' },
      },
    },
    digital: {
      label: '存储',
      units: {
        b: { label: 'B', factor: 1 },
        kb: { label: 'KB', factor: 1024 },
        mb: { label: 'MB', factor: 1024 * 1024 },
        gb: { label: 'GB', factor: 1024 * 1024 * 1024 },
        tb: { label: 'TB', factor: 1024 * 1024 * 1024 * 1024 },
      },
    },
  };

  const convert = () => {
    const cat = categories[category];
    if (category === 'temperature') {
      let celsius;
      if (fromUnit === 'c') celsius = fromValue;
      else if (fromUnit === 'f') celsius = (fromValue - 32) * 5 / 9;
      else if (fromUnit === 'k') celsius = fromValue - 273.15;

      if (toUnit === 'c') return celsius;
      if (toUnit === 'f') return celsius * 9 / 5 + 32;
      if (toUnit === 'k') return celsius + 273.15;
    }

    const fromFactor = cat.units[fromUnit].factor;
    const toFactor = cat.units[toUnit].factor;
    return (fromValue * fromFactor) / toFactor;
  };

  const result = convert();
  const currentCat = categories[category];

  return (
    <div>
      <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        {Object.entries(categories).map(([key, cat]) => (
          <button
            key={key}
            onClick={() => {
              setCategory(key);
              const units = Object.keys(cat.units);
              setFromUnit(units[0]);
              setToUnit(units[1] || units[0]);
            }}
            style={{
              padding: '8px 16px', borderRadius: 6,
              border: `1px solid ${category === key ? colors.accent : colors.border}`,
              background: category === key ? colors.accent : 'transparent',
              color: category === key ? '#fff' : colors.text,
              cursor: 'pointer', fontSize: 13,
            }}
          >
            {cat.label}
          </button>
        ))}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
        <div style={{ flex: 1 }}>
          <input
            type="number"
            style={S.input}
            value={fromValue}
            onChange={e => setFromValue(parseFloat(e.target.value) || 0)}
          />
          <select
            value={fromUnit}
            onChange={e => setFromUnit(e.target.value)}
            style={{ ...S.input, marginTop: 8, cursor: 'pointer' }}
          >
            {Object.entries(currentCat.units).map(([key, u]) => (
              <option key={key} value={key}>{u.label}</option>
            ))}
          </select>
        </div>
        <span style={{ color: colors.textSecondary, fontSize: 20 }}>→</span>
        <div style={{ flex: 1 }}>
          <input
            type="number"
            style={{ ...S.input, background: colors.hover }}
            value={result.toFixed(6).replace(/\.?0+$/, '')}
            readOnly
          />
          <select
            value={toUnit}
            onChange={e => setToUnit(e.target.value)}
            style={{ ...S.input, marginTop: 8, cursor: 'pointer' }}
          >
            {Object.entries(currentCat.units).map(([key, u]) => (
              <option key={key} value={key}>{u.label}</option>
            ))}
          </select>
        </div>
      </div>

      <div style={{ textAlign: 'center', color: colors.textSecondary, fontSize: 14 }}>
        {fromValue} {currentCat.units[fromUnit].label} = {' '}
        <span style={{ color: colors.accent, fontWeight: 600, fontSize: 18 }}>
          {result.toFixed(4).replace(/\.?0+$/, '')}
        </span>
        {' '}{currentCat.units[toUnit].label}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════
// 20. IP 信息查询
// ═══════════════════════════════════════════════════
function IpLookup({ colors }) {
  const S = getStyles(colors);
  const [ip, setIp] = useState('');
  const [info, setInfo] = useState(null);
  const [loading, setLoading] = useState(false);

  const lookup = async () => {
    setLoading(true);
    try {
      // 使用 ipapi.co 免费API
      const targetIp = ip.trim() || '';
      const res = await fetch(`https://ipapi.co/${targetIp}/json/`);
      const data = await res.json();
      setInfo(data);
    } catch {
      setInfo({ error: '查询失败，请检查网络' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { lookup(); }, []);

  return (
    <div>
      <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
        <input
          style={{ ...S.input, flex: 1 }}
          placeholder="输入IP地址（留空查询本机）..."
          value={ip}
          onChange={e => setIp(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && lookup()}
        />
        <button style={S.btn} onClick={lookup} disabled={loading}>
          {loading ? '查询中...' : '查询'}
        </button>
      </div>

      {info && !info.error && (
        <div style={{
          display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10,
        }}>
          {[
            ['IP 地址', info.ip],
            ['国家', `${info.country_name} (${info.country_code})`],
            ['地区', info.region],
            ['城市', info.city],
            ['运营商', info.org],
            ['时区', info.timezone],
            ['经纬度', `${info.latitude}, ${info.longitude}`],
            ['货币', info.currency],
          ].map(([label, value]) => value && (
            <div
              key={label}
              style={{
                padding: '12px 14px', background: colors.inputBg,
                borderRadius: 8, border: `1px solid ${colors.border}`,
              }}
            >
              <div style={{ color: colors.textSecondary, fontSize: 11, marginBottom: 4 }}>{label}</div>
              <div style={{ color: colors.text, fontSize: 14, fontWeight: 500 }}>{value}</div>
            </div>
          ))}
        </div>
      )}
      {info?.error && <div style={{ color: colors.accent }}>{info.error}</div>}
    </div>
  );
}

// ═══════════════════════════════════════════════════
// 21. 图片处理工具
// ═══════════════════════════════════════════════════
function ImageProcessor({ colors }) {
  const S = getStyles(colors);
  const [image, setImage] = useState(null);
  const [preview, setPreview] = useState('');
  const [width, setWidth] = useState(0);
  const [height, setHeight] = useState(0);
  const [quality, setQuality] = useState(90);
  const [format, setFormat] = useState('jpeg');
  const [activeTab, setActiveTab] = useState('resize');

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (!file || !file.type.startsWith('image/')) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        setImage(file);
        setPreview(event.target.result);
        setWidth(img.width);
        setHeight(img.height);
      };
      img.src = event.target.result;
    };
    reader.readAsDataURL(file);
  };

  const resizeImage = () => {
    if (!preview) return;
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    const img = new Image();
    img.onload = () => {
      ctx.drawImage(img, 0, 0, width, height);
      canvas.toBlob((blob) => {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `resized_${width}x${height}.${format}`;
        a.click();
        URL.revokeObjectURL(url);
      }, `image/${format}`, quality / 100);
    };
    img.src = preview;
  };

  const splitImage = () => {
    if (!preview) return;
    const rows = parseInt(prompt('输入行数:', 2)) || 2;
    const cols = parseInt(prompt('输入列数:', 2)) || 2;

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();
    img.onload = () => {
      const pieceWidth = img.width / cols;
      const pieceHeight = img.height / rows;
      canvas.width = pieceWidth;
      canvas.height = pieceHeight;

      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          ctx.clearRect(0, 0, pieceWidth, pieceHeight);
          ctx.drawImage(img, -c * pieceWidth, -r * pieceHeight, img.width, img.height);
          canvas.toBlob((blob) => {
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `split_${r}_${c}.${format}`;
            a.click();
            URL.revokeObjectURL(url);
          }, `image/${format}`, 1);
        }
      }
    };
    img.src = preview;
  };

  const tabs = [
    { key: 'resize', label: '调整尺寸', icon: '📐' },
    { key: 'split', label: '分割图片', icon: '✂️' },
    { key: 'format', label: '格式转换', icon: '🔄' },
  ];

  return (
    <div>
      {/* File Upload */}
      <div style={{
        border: `2px dashed ${colors.border}`, borderRadius: 8, padding: 20,
        textAlign: 'center', marginBottom: 16,
      }}>
        <input
          type="file"
          accept="image/*"
          onChange={handleFileSelect}
          style={{ display: 'none' }}
          id="image-input"
        />
        <label htmlFor="image-input" style={{ cursor: 'pointer' }}>
          <div style={{ fontSize: 32, marginBottom: 8 }}>📷</div>
          <div style={{ color: colors.textSecondary, fontSize: 14 }}>
            点击上传图片或拖拽到此处
          </div>
        </label>
      </div>

      {preview && (
        <>
          {/* Preview */}
          <div style={{ marginBottom: 16, textAlign: 'center' }}>
            <img
              src={preview}
              alt="Preview"
              style={{ maxWidth: '100%', maxHeight: 200, borderRadius: 8, border: `1px solid ${colors.border}` }}
            />
            <div style={{ color: colors.textSecondary, fontSize: 12, marginTop: 8 }}>
              原始尺寸: {width} x {height}
            </div>
          </div>

          {/* Tabs */}
          <div style={{ display: 'flex', gap: 8, marginBottom: 16, borderBottom: `1px solid ${colors.border}` }}>
            {tabs.map(tab => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                style={{
                  padding: '10px 16px', border: 'none', background: 'transparent',
                  color: activeTab === tab.key ? colors.accent : colors.textSecondary,
                  borderBottom: `2px solid ${activeTab === tab.key ? colors.accent : 'transparent'}`,
                  cursor: 'pointer', fontSize: 13, display: 'flex', alignItems: 'center', gap: 6,
                }}
              >
                {tab.icon} {tab.label}
              </button>
            ))}
          </div>

          {/* Resize Panel */}
          {activeTab === 'resize' && (
            <div>
              <div style={{ display: 'flex', gap: 12, marginBottom: 12 }}>
                <div style={{ flex: 1 }}>
                  <span style={S.label}>宽度 (px)</span>
                  <input
                    type="number"
                    style={S.input}
                    value={width}
                    onChange={e => setWidth(parseInt(e.target.value) || 0)}
                  />
                </div>
                <div style={{ flex: 1 }}>
                  <span style={S.label}>高度 (px)</span>
                  <input
                    type="number"
                    style={S.input}
                    value={height}
                    onChange={e => setHeight(parseInt(e.target.value) || 0)}
                  />
                </div>
              </div>
              <div style={{ marginBottom: 12 }}>
                <span style={S.label}>质量 ({quality}%)</span>
                <input
                  type="range"
                  min={10}
                  max={100}
                  value={quality}
                  onChange={e => setQuality(parseInt(e.target.value))}
                  style={{ width: '100%', accentColor: colors.accent }}
                />
              </div>
              <button style={S.btn} onClick={resizeImage}>💾 下载处理后的图片</button>
            </div>
          )}

          {/* Split Panel */}
          {activeTab === 'split' && (
            <div style={{ textAlign: 'center', padding: 20 }}>
              <div style={{ fontSize: 48, marginBottom: 12 }}>✂️</div>
              <div style={{ color: colors.textSecondary, marginBottom: 16 }}>
                将图片分割成多张小图
              </div>
              <button style={S.btn} onClick={splitImage}>🚀 开始分割</button>
            </div>
          )}

          {/* Format Panel */}
          {activeTab === 'format' && (
            <div>
              <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
                {['jpeg', 'png', 'webp', 'gif'].map(f => (
                  <button
                    key={f}
                    onClick={() => setFormat(f)}
                    style={{
                      padding: '8px 16px', borderRadius: 6,
                      border: `1px solid ${format === f ? colors.accent : colors.border}`,
                      background: format === f ? colors.accent : 'transparent',
                      color: format === f ? '#fff' : colors.text,
                      cursor: 'pointer', fontSize: 13, textTransform: 'uppercase',
                    }}
                  >
                    {f}
                  </button>
                ))}
              </div>
              <button style={S.btn} onClick={resizeImage}>🔄 转换并下载</button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════
// 22. 文档转换器
// ═══════════════════════════════════════════════════
function DocumentConverter({ colors }) {
  const S = getStyles(colors);
  const [activeMode, setActiveMode] = useState('pdf2word');
  const [file, setFile] = useState(null);
  const [converting, setConverting] = useState(false);

  const modes = [
    { key: 'pdf2word', label: 'PDF → Word', icon: '📄→📝', desc: '将PDF转换为可编辑的Word文档' },
    { key: 'word2pdf', label: 'Word → PDF', icon: '📝→📄', desc: '将Word文档转换为PDF格式' },
    { key: 'img2pdf', label: '图片 → PDF', icon: '🖼️→📄', desc: '将多张图片合并为PDF' },
    { key: 'pdfmerge', label: '合并 PDF', icon: '📄+📄', desc: '将多个PDF文件合并为一个' },
    { key: 'pdfsplit', label: '分割 PDF', icon: '✂️📄', desc: '将一个PDF分割为多个文件' },
  ];

  const handleFileSelect = (e) => {
    const selected = Array.from(e.target.files);
    setFile(selected);
  };

  const convert = () => {
    if (!file || file.length === 0) return;
    setConverting(true);

    // 模拟转换过程
    setTimeout(() => {
      setConverting(false);
      alert('转换完成！(演示功能，实际需后端支持)');
    }, 2000);
  };

  const currentMode = modes.find(m => m.key === activeMode);

  return (
    <div>
      {/* Mode Selection */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8, marginBottom: 16 }}>
        {modes.map(mode => (
          <button
            key={mode.key}
            onClick={() => { setActiveMode(mode.key); setFile(null); }}
            style={{
              padding: '12px 8px', borderRadius: 8,
              border: `1px solid ${activeMode === mode.key ? colors.accent : colors.border}`,
              background: activeMode === mode.key ? colors.accentLight : colors.inputBg,
              color: activeMode === mode.key ? colors.accent : colors.text,
              cursor: 'pointer', fontSize: 12, fontWeight: activeMode === mode.key ? 600 : 400,
            }}
          >
            <div style={{ fontSize: 20, marginBottom: 4 }}>{mode.icon}</div>
            <div>{mode.label}</div>
          </button>
        ))}
      </div>

      {/* Description */}
      <div style={{
        padding: 12, background: colors.inputBg, borderRadius: 8,
        marginBottom: 16, color: colors.textSecondary, fontSize: 13,
      }}>
        {currentMode.desc}
      </div>

      {/* File Upload */}
      <div style={{
        border: `2px dashed ${colors.border}`, borderRadius: 8, padding: 30,
        textAlign: 'center', marginBottom: 16,
      }}>
        <input
          type="file"
          multiple={['pdfmerge', 'img2pdf'].includes(activeMode)}
          accept={activeMode === 'word2pdf' ? '.doc,.docx' : activeMode === 'img2pdf' ? 'image/*' : '.pdf'}
          onChange={handleFileSelect}
          style={{ display: 'none' }}
          id="doc-input"
        />
        <label htmlFor="doc-input" style={{ cursor: 'pointer' }}>
          <div style={{ fontSize: 40, marginBottom: 8 }}>📁</div>
          <div style={{ color: colors.textSecondary, fontSize: 14 }}>
            点击选择文件
          </div>
          <div style={{ color: colors.textMuted, fontSize: 12, marginTop: 4 }}>
            {file ? `已选择 ${file.length} 个文件` : '或将文件拖拽到此处'}
          </div>
        </label>
      </div>

      {file && (
        <div style={{ marginBottom: 16 }}>
          <div style={{
            padding: 12, background: colors.inputBg, borderRadius: 8,
            display: 'flex', alignItems: 'center', gap: 8,
          }}>
            <span>📄</span>
            <span style={{ flex: 1, color: colors.text, fontSize: 13 }}>
              {file.map(f => f.name).join(', ')}
            </span>
          </div>
        </div>
      )}

      <button
        style={{ ...S.btn, width: '100%', opacity: converting || !file ? 0.6 : 1 }}
        onClick={convert}
        disabled={converting || !file}
      >
        {converting ? '⏳ 转换中...' : '🚀 开始转换'}
      </button>

      <div style={{
        marginTop: 16, padding: 12, background: colors.inputBg,
        borderRadius: 8, color: colors.textMuted, fontSize: 12,
      }}>
        💡 提示：此功能为前端演示，实际转换需要后端服务支持
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════
// 23. 键盘音效器
// ═══════════════════════════════════════════════════
function KeyboardSound({ colors }) {
  const S = getStyles(colors);
  const [enabled, setEnabled] = useState(false);
  const [volume, setVolume] = useState(50);
  const [soundType, setSoundType] = useState('mechanical');
  const [keyCount, setKeyCount] = useState(0);

  const soundTypes = [
    { key: 'mechanical', label: '机械键盘', desc: '清脆的机械轴声音' },
    { key: 'typewriter', label: '打字机', desc: '复古打字机声音' },
    { key: 'bubble', label: '泡泡', desc: '可爱的泡泡声' },
    { key: 'water', label: '水滴', desc: '清新的水滴声' },
  ];

  useEffect(() => {
    if (!enabled) return;

    const handleKeyDown = () => {
      setKeyCount(c => c + 1);
      // 这里可以播放实际音效
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [enabled]);

  return (
    <div>
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: 16, background: colors.inputBg, borderRadius: 8,
        marginBottom: 16,
      }}>
        <div>
          <div style={{ fontSize: 16, fontWeight: 600, color: colors.text }}>
            键盘音效
          </div>
          <div style={{ fontSize: 12, color: colors.textSecondary, marginTop: 4 }}>
            为打字添加音效反馈
          </div>
        </div>
        <button
          onClick={() => setEnabled(!enabled)}
          style={{
            padding: '10px 20px', borderRadius: 20,
            border: 'none', cursor: 'pointer', fontSize: 14, fontWeight: 600,
            background: enabled ? '#22c55e' : colors.border,
            color: enabled ? '#fff' : colors.text,
            transition: 'all 0.2s',
          }}
        >
          {enabled ? '🔊 已开启' : '🔇 已关闭'}
        </button>
      </div>

      {enabled && (
        <>
          <div style={{ marginBottom: 16 }}>
            <span style={S.label}>音量 ({volume}%)</span>
            <input
              type="range"
              min={0}
              max={100}
              value={volume}
              onChange={e => setVolume(parseInt(e.target.value))}
              style={{ width: '100%', accentColor: colors.accent }}
            />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 16 }}>
            {soundTypes.map(type => (
              <button
                key={type.key}
                onClick={() => setSoundType(type.key)}
                style={{
                  padding: 12, borderRadius: 8, textAlign: 'left',
                  border: `1px solid ${soundType === type.key ? colors.accent : colors.border}`,
                  background: soundType === type.key ? colors.accentLight : colors.inputBg,
                  cursor: 'pointer',
                }}
              >
                <div style={{ fontWeight: 600, color: soundType === type.key ? colors.accent : colors.text }}>
                  {type.label}
                </div>
                <div style={{ fontSize: 12, color: colors.textSecondary, marginTop: 2 }}>
                  {type.desc}
                </div>
              </button>
            ))}
          </div>
        </>
      )}

      <div style={{
        padding: 16, background: colors.inputBg, borderRadius: 8, textAlign: 'center',
      }}>
        <div style={{ fontSize: 32, marginBottom: 8 }}>⌨️</div>
        <div style={{ color: colors.textSecondary, fontSize: 13 }}>
          按键次数: <span style={{ color: colors.accent, fontWeight: 600, fontSize: 20 }}>{keyCount}</span>
        </div>
      </div>

      <div style={{ marginTop: 16, color: colors.textMuted, fontSize: 12, textAlign: 'center' }}>
        💡 在任何页面打字都可以听到音效
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════
// 24. 番茄时钟
// ═══════════════════════════════════════════════════
function PomodoroTimer({ colors }) {
  const S = getStyles(colors);
  const [timeLeft, setTimeLeft] = useState(25 * 60);
  const [isRunning, setIsRunning] = useState(false);
  const [mode, setMode] = useState('work'); // work, shortBreak, longBreak
  const [cycles, setCycles] = useState(0);

  const modes = {
    work: { label: '专注', minutes: 25, color: '#ef4444' },
    shortBreak: { label: '短休息', minutes: 5, color: '#22c55e' },
    longBreak: { label: '长休息', minutes: 15, color: '#3b82f6' },
  };

  useEffect(() => {
    if (!isRunning) return;

    const timer = setInterval(() => {
      setTimeLeft(t => {
        if (t <= 1) {
          setIsRunning(false);
          if (mode === 'work') {
            setCycles(c => c + 1);
          }
          return 0;
        }
        return t - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isRunning, mode]);

  const switchMode = (newMode) => {
    setMode(newMode);
    setTimeLeft(modes[newMode].minutes * 60);
    setIsRunning(false);
  };

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const progress = 1 - (timeLeft / (modes[mode].minutes * 60));

  return (
    <div>
      {/* Mode Selector */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
        {Object.entries(modes).map(([key, m]) => (
          <button
            key={key}
            onClick={() => switchMode(key)}
            style={{
              flex: 1, padding: '10px 8px', borderRadius: 8,
              border: `1px solid ${mode === key ? m.color : colors.border}`,
              background: mode === key ? `${m.color}22` : 'transparent',
              color: mode === key ? m.color : colors.textSecondary,
              cursor: 'pointer', fontSize: 12, fontWeight: mode === key ? 600 : 400,
            }}
          >
            {m.label}
          </button>
        ))}
      </div>

      {/* Timer Display */}
      <div style={{
        position: 'relative', width: 200, height: 200, margin: '0 auto 20px',
        borderRadius: '50%',
        background: `conic-gradient(${modes[mode].color} ${progress * 360}deg, ${colors.inputBg} 0deg)`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <div style={{
          width: 170, height: 170, borderRadius: '50%',
          background: colors.cardBg, display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center',
        }}>
          <div style={{
            fontSize: 48, fontWeight: 700, fontFamily: 'monospace',
            color: modes[mode].color,
          }}>
            {formatTime(timeLeft)}
          </div>
          <div style={{ fontSize: 12, color: colors.textSecondary, marginTop: 4 }}>
            {modes[mode].label}中
          </div>
        </div>
      </div>

      {/* Controls */}
      <div style={{ display: 'flex', gap: 12, justifyContent: 'center', marginBottom: 16 }}>
        <button
          onClick={() => setIsRunning(!isRunning)}
          style={{
            padding: '12px 32px', borderRadius: 8, border: 'none',
            background: modes[mode].color, color: '#fff',
            cursor: 'pointer', fontSize: 16, fontWeight: 600,
          }}
        >
          {isRunning ? '⏸️ 暂停' : '▶️ 开始'}
        </button>
        <button
          onClick={() => switchMode(mode)}
          style={{
            padding: '12px 24px', borderRadius: 8,
            border: `1px solid ${colors.border}`, background: 'transparent',
            color: colors.text, cursor: 'pointer', fontSize: 14,
          }}
        >
          🔄 重置
        </button>
      </div>

      {/* Stats */}
      <div style={{
        display: 'flex', justifyContent: 'center', gap: 24,
        padding: 16, background: colors.inputBg, borderRadius: 8,
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 24, fontWeight: 700, color: colors.accent }}>{cycles}</div>
          <div style={{ fontSize: 12, color: colors.textSecondary }}>完成番茄</div>
        </div>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 24, fontWeight: 700, color: colors.accent }}>
            {Math.floor(cycles * 25 / 60)}h{cycles * 25 % 60}m
          </div>
          <div style={{ fontSize: 12, color: colors.textSecondary }}>专注时间</div>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════
// 25. 诗词生成器
// ═══════════════════════════════════════════════════
function PoemGenerator({ colors }) {
  const S = getStyles(colors);
  const [poem, setPoem] = useState('');
  const [loading, setLoading] = useState(false);

  const poems = [
    { title: '静夜思', author: '李白', content: '床前明月光，疑是地上霜。\n举头望明月，低头思故乡。' },
    { title: '春晓', author: '孟浩然', content: '春眠不觉晓，处处闻啼鸟。\n夜来风雨声，花落知多少。' },
    { title: '登鹳雀楼', author: '王之涣', content: '白日依山尽，黄河入海流。\n欲穷千里目，更上一层楼。' },
    { title: '相思', author: '王维', content: '红豆生南国，春来发几枝。\n愿君多采撷，此物最相思。' },
    { title: '江雪', author: '柳宗元', content: '千山鸟飞绝，万径人踪灭。\n孤舟蓑笠翁，独钓寒江雪。' },
    { title: '悯农', author: '李绅', content: '锄禾日当午，汗滴禾下土。\n谁知盘中餐，粒粒皆辛苦。' },
    { title: '咏鹅', author: '骆宾王', content: '鹅鹅鹅，曲项向天歌。\n白毛浮绿水，红掌拨清波。' },
    { title: '风', author: '李峤', content: '解落三秋叶，能开二月花。\n过江千尺浪，入竹万竿斜。' },
  ];

  const generate = () => {
    setLoading(true);
    setTimeout(() => {
      const random = poems[Math.floor(Math.random() * poems.length)];
      setPoem(random);
      setLoading(false);
    }, 500);
  };

  return (
    <div>
      <div style={{ textAlign: 'center', marginBottom: 20 }}>
        <button
          onClick={generate}
          disabled={loading}
          style={{
            padding: '12px 32px', borderRadius: 8, border: 'none',
            background: colors.accent, color: '#fff',
            cursor: loading ? 'default' : 'pointer', fontSize: 16,
            opacity: loading ? 0.6 : 1,
          }}
        >
          {loading ? '📜 Fetching...' : '🎲 随机一首'}
        </button>
      </div>

      {poem && (
        <div style={{
          padding: 30, background: colors.inputBg, borderRadius: 12,
          border: `1px solid ${colors.border}`, textAlign: 'center',
          fontFamily: '"Noto Serif SC", serif',
        }}>
          <div style={{
            fontSize: 14, color: colors.textSecondary, marginBottom: 8,
          }}>
            [{poem.author}]
          </div>
          <div style={{
            fontSize: 24, fontWeight: 700, color: colors.text,
            marginBottom: 20, letterSpacing: 4,
          }}>
            {poem.title}
          </div>
          <div style={{
            fontSize: 18, color: colors.text, lineHeight: 2,
            whiteSpace: 'pre-line', letterSpacing: 2,
          }}>
            {poem.content}
          </div>
        </div>
      )}

      <div style={{
        marginTop: 16, textAlign: 'center', color: colors.textMuted, fontSize: 12,
      }}>
        点击按钮随机获取一首唐诗
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════
// Tool registry
// ═══════════════════════════════════════════════════
const TOOLS = [
  // 开发工具
  { icon: 'json', name: 'JSON 格式化', component: JsonFormatter, category: 'dev' },
  { icon: 'base64', name: 'Base64 编解码', component: Base64Tool, category: 'dev' },
  { icon: 'url', name: 'URL 编解码', component: UrlTool, category: 'dev' },
  { icon: 'regex', name: '正则测试', component: RegexTester, category: 'dev' },
  { icon: 'naming', name: '命名生成器', component: NamingGenerator, category: 'dev' },
  { icon: 'http', name: 'HTTP请求测试', component: HttpTester, category: 'dev' },
  { icon: 'uuid', name: 'UUID生成器', component: UuidGenerator, category: 'dev' },
  { icon: 'base', name: '进制转换', component: BaseConverter, category: 'dev' },
  // 文本工具
  { icon: 'diff', name: '文本对比', component: TextDiff, category: 'text' },
  { icon: 'word', name: '字数统计', component: WordCounter, category: 'text' },
  { icon: 'lorem', name: 'Lorem生成', component: LoremChinese, category: 'text' },
  { icon: 'markdown', name: 'Markdown预览', component: MarkdownPreview, category: 'text' },
  // 转换工具
  { icon: 'timestamp', name: '时间戳转换', component: TimestampTool, category: 'convert' },
  { icon: 'color', name: '颜色转换', component: ColorConverter, category: 'convert' },
  { icon: 'unit', name: '单位转换器', component: UnitConverter, category: 'convert' },
  { icon: 'image', name: '图片处理', component: ImageProcessor, category: 'convert' },
  { icon: 'document', name: '文档转换', component: DocumentConverter, category: 'convert' },
  // 生成工具
  { icon: 'password', name: '密码生成器', component: PasswordGenerator, category: 'gen' },
  { icon: 'qrcode', name: '二维码生成', component: QrCodeGenerator, category: 'gen' },
  { icon: 'cron', name: 'CRON解析器', component: CronParser, category: 'gen' },
  // 查询工具
  { icon: 'ip', name: 'IP信息查询', component: IpLookup, category: 'query' },
  // 效率工具
  { icon: 'salary', name: '摸鱼计算器', component: SalaryCalculator, category: 'eff' },
  { icon: 'keyboard', name: '键盘音效', component: KeyboardSound, category: 'eff' },
  { icon: 'pomodoro', name: '番茄时钟', component: PomodoroTimer, category: 'eff' },
  { icon: 'poem', name: '诗词生成', component: PoemGenerator, category: 'eff' },
];

// ═══════════════════════════════════════════════════
// Main ToolBox component
// ═══════════════════════════════════════════════════
export default function ToolBox({ searchOpen, onSearchChange }) {
  const { colors } = useTheme();
  const [search, setSearch] = useState('');
  const [activeTool, setActiveTool] = useState(null);
  const [hoveredIdx, setHoveredIdx] = useState(-1);
  const [activeCategory, setActiveCategory] = useState('all');
  const [favorites, setFavorites] = useState(() => {
    try { return JSON.parse(localStorage.getItem('moyu-tool-favorites')) || []; }
    catch { return []; }
  });
  const [history, setHistory] = useState(() => {
    try { return JSON.parse(localStorage.getItem(SEARCH_HISTORY_KEY)) || []; }
    catch { return []; }
  });
  const [showHistory, setShowHistory] = useState(false);
  const searchInputRef = useRef(null);
  const historyRef = useRef(null);

  const categories = [
    { key: 'all', label: '全部', icon: 'all' },
    { key: 'fav', label: '收藏', icon: 'fav' },
    { key: 'dev', label: '开发', icon: 'dev' },
    { key: 'text', label: '文本', icon: 'text' },
    { key: 'convert', label: '转换', icon: 'convert' },
    { key: 'gen', label: '生成', icon: 'gen' },
    { key: 'query', label: '查询', icon: 'query' },
    { key: 'eff', label: '效率', icon: 'eff' },
  ];

  const toggleFavorite = (toolName, e) => {
    e.stopPropagation();
    const newFavorites = favorites.includes(toolName)
      ? favorites.filter(f => f !== toolName)
      : [...favorites, toolName];
    setFavorites(newFavorites);
    localStorage.setItem('moyu-tool-favorites', JSON.stringify(newFavorites));
  };

  // 保存搜索历史
  const saveHistory = useCallback((term) => {
    if (!term.trim()) return;
    const newHistory = [term.trim(), ...history.filter(h => h !== term.trim())].slice(0, MAX_HISTORY);
    setHistory(newHistory);
    try { localStorage.setItem(SEARCH_HISTORY_KEY, JSON.stringify(newHistory)); }
    catch {}
  }, [history]);

  // 清空历史
  const clearHistory = () => {
    setHistory([]);
    try { localStorage.removeItem(SEARCH_HISTORY_KEY); }
    catch {}
  };

  // 从历史选择
  const selectFromHistory = (term) => {
    setSearch(term);
    setShowHistory(false);
  };

  // 根据分类和搜索过滤工具
  const filtered = TOOLS.filter(t => {
    const matchesSearch = t.name.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = activeCategory === 'all' ? true :
      activeCategory === 'fav' ? favorites.includes(t.name) :
      t.category === activeCategory;
    return matchesSearch && matchesCategory;
  });

  // 监听全局搜索触发
  useEffect(() => {
    if (searchOpen && searchInputRef.current) {
      searchInputRef.current.focus();
      onSearchChange?.(false);
    }
  }, [searchOpen, onSearchChange]);

  // 监听 ESC 关闭弹窗和历史
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setActiveTool(null);
        setShowHistory(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // 点击外部关闭历史
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (historyRef.current && !historyRef.current.contains(e.target) &&
          searchInputRef.current && !searchInputRef.current.contains(e.target)) {
        setShowHistory(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // 输入框回车保存历史
  const handleSearchKeyDown = (e) => {
    if (e.key === 'Enter' && search.trim()) {
      saveHistory(search.trim());
      setShowHistory(false);
    }
  };

  return (
    <div>
      {/* Category tabs */}
      <div style={{
        display: 'flex', gap: 6, marginBottom: 16, overflowX: 'auto',
        paddingBottom: 4, scrollbarWidth: 'none',
      }}>
        {categories.map(cat => (
          <button
            key={cat.key}
            onClick={() => setActiveCategory(cat.key)}
            style={{
              padding: '8px 14px', borderRadius: 20, whiteSpace: 'nowrap',
              border: `1px solid ${activeCategory === cat.key ? '#22C55E' : colors.border}`,
              background: activeCategory === cat.key ? '#22C55E' : 'transparent',
              color: activeCategory === cat.key ? '#fff' : colors.textSecondary,
              cursor: 'pointer', fontSize: 13, fontWeight: activeCategory === cat.key ? 600 : 400,
              display: 'flex', alignItems: 'center', gap: 6,
              transition: 'all 0.2s ease',
              boxShadow: activeCategory === cat.key ? '0 2px 8px rgba(34, 197, 94, 0.3)' : 'none',
            }}
          >
            <Icon name={cat.icon} size={16} color={activeCategory === cat.key ? '#fff' : colors.textSecondary} />
            {cat.label}
            {cat.key === 'fav' && favorites.length > 0 && (
              <span style={{
                background: activeCategory === cat.key ? 'rgba(255,255,255,0.3)' : 'rgba(34, 197, 94, 0.15)',
                color: activeCategory === cat.key ? '#fff' : '#22C55E',
                padding: '1px 6px', borderRadius: 10, fontSize: 10, marginLeft: 2,
              }}>{favorites.length}</span>
            )}
          </button>
        ))}
      </div>

      {/* Search bar */}
      <div style={{
        position: 'relative', marginBottom: 20,
      }} ref={historyRef}>
        <span style={{
          position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)',
          pointerEvents: 'none', display: 'flex', alignItems: 'center',
        }}>
          <Icon name="search" size={18} color={colors.textMuted} />
        </span>
        <input
          ref={searchInputRef}
          type="text"
          placeholder="搜索工具... (Ctrl+K)"
          value={search}
          onChange={e => setSearch(e.target.value)}
          onKeyDown={handleSearchKeyDown}
          onFocus={e => {
            if (history.length > 0) setShowHistory(true);
            e.target.style.borderColor = '#22C55E';
            e.target.style.boxShadow = '0 0 0 3px rgba(34, 197, 94, 0.15)';
          }}
          onBlur={e => {
            e.target.style.borderColor = colors.border;
            e.target.style.boxShadow = 'none';
          }}
          style={{
            width: '100%', padding: '12px 80px 12px 44px',
            background: colors.cardBg, border: `1px solid ${colors.border}`,
            borderRadius: 10, color: colors.text, fontSize: 15,
            outline: 'none', boxSizing: 'border-box',
            transition: 'border-color 0.2s, box-shadow 0.2s',
          }}
        />
        <span style={{
          position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
          fontSize: 11, color: colors.textMuted, pointerEvents: 'none',
          background: colors.inputBg, padding: '2px 6px', borderRadius: 4,
          border: `1px solid ${colors.border}`,
        }}>Ctrl+K</span>

        {/* 搜索历史下拉 */}
        {showHistory && history.length > 0 && (
          <div style={{
            position: 'absolute', top: '100%', left: 0, right: 0, marginTop: 6,
            background: colors.cardBg, border: `1px solid ${colors.border}`,
            borderRadius: 10, boxShadow: `0 4px 16px ${colors.shadow}`,
            zIndex: 100, overflow: 'hidden',
          }}>
            <div style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              padding: '8px 12px', borderBottom: `1px solid ${colors.border}`,
            }}>
              <span style={{ fontSize: 12, color: colors.textSecondary }}>搜索历史</span>
              <button
                onClick={clearHistory}
                style={{
                  fontSize: 11, color: '#22C55E', background: 'transparent',
                  border: 'none', cursor: 'pointer', padding: '2px 6px',
                }}
              >清空</button>
            </div>
            {history.map((term, idx) => (
              <div
                key={idx}
                onClick={() => selectFromHistory(term)}
                style={{
                  padding: '10px 14px', cursor: 'pointer', fontSize: 14,
                  color: colors.text, display: 'flex', alignItems: 'center', gap: 8,
                  transition: 'background 0.15s',
                }}
                onMouseEnter={e => e.currentTarget.style.background = colors.hover}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
              >
                <Icon name="history" size={16} color={colors.textMuted} />
                <span style={{ flex: 1 }}>{term}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Results count */}
      <div style={{ marginBottom: 12, color: colors.textSecondary, fontSize: 13 }}>
        共 {filtered.length} 个工具
        {activeCategory !== 'all' && ` • ${categories.find(c => c.key === activeCategory)?.label}`}
      </div>

      {/* Tool cards grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))',
        gap: 14,
      }}>
        {filtered.map((tool, idx) => (
          <div
            key={tool.name}
            onClick={() => setActiveTool(tool)}
            onMouseEnter={() => setHoveredIdx(idx)}
            onMouseLeave={() => setHoveredIdx(-1)}
            style={{
              background: colors.cardBg,
              border: `1px solid ${hoveredIdx === idx ? '#22C55E' : colors.border}`,
              borderRadius: 14,
              padding: '22px 14px',
              cursor: 'pointer',
              textAlign: 'center',
              transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
              transform: hoveredIdx === idx ? 'translateY(-4px)' : 'none',
              boxShadow: hoveredIdx === idx
                ? '0 8px 24px rgba(34, 197, 94, 0.2), 0 4px 12px rgba(0, 0, 0, 0.15)'
                : 'none',
              position: 'relative',
              overflow: 'hidden',
            }}
          >
            {/* Hover glow effect */}
            {hoveredIdx === idx && (
              <div style={{
                position: 'absolute', top: 0, left: 0, right: 0, height: 2,
                background: 'linear-gradient(90deg, transparent, #22C55E, transparent)',
                opacity: 0.8,
              }} />
            )}
            {/* Favorite button */}
            <button
              onClick={(e) => toggleFavorite(tool.name, e)}
              style={{
                position: 'absolute', top: 8, right: 8,
                background: 'transparent', border: 'none',
                cursor: 'pointer', opacity: 0.5,
                transition: 'opacity 0.2s, transform 0.2s',
                transform: favorites.includes(tool.name) ? 'scale(1.1)' : 'scale(1)',
                padding: 4,
              }}
              onMouseEnter={e => e.currentTarget.style.opacity = '1'}
              onMouseLeave={e => e.currentTarget.style.opacity = '0.5'}
            >
              <Icon
                name={favorites.includes(tool.name) ? 'star' : 'starEmpty'}
                size={18}
                color={favorites.includes(tool.name) ? '#f59e0b' : colors.textMuted}
              />
            </button>
            <div style={{
              marginBottom: 10,
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              height: 40,
            }}>
              <Icon name={tool.icon} size={32} color={hoveredIdx === idx ? '#22C55E' : colors.accent} />
            </div>
            <div style={{
              color: colors.text,
              fontSize: 13,
              fontWeight: 500,
              lineHeight: 1.4,
            }}>{tool.name}</div>
          </div>
        ))}
      </div>

      {filtered.length === 0 && (
        <div style={{ textAlign: 'center', color: colors.textMuted, padding: 40, fontSize: 14 }}>
          没有找到匹配的工具
        </div>
      )}

      {/* Modal */}
      {activeTool && (
        <div
          className="modal-overlay"
          onClick={e => { if (e.target === e.currentTarget) setActiveTool(null); }}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(15, 23, 42, 0.85)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: 20,
          }}
        >
          <div
            className="modal-content"
            style={{
              background: colors.cardBg,
              borderColor: colors.border,
              borderRadius: 16,
              border: `1px solid ${colors.border}`,
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
              maxWidth: 700,
              width: '100%',
              maxHeight: '85vh',
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column',
              animation: 'modalSlideIn 0.25s ease-out',
            }}
          >
            <div
              className="modal-header"
              style={{
                borderBottomColor: colors.border,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '16px 20px',
                borderBottom: `1px solid ${colors.border}`,
              }}
            >
              <h2 style={{
                color: '#22C55E',
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                margin: 0,
                fontSize: 18,
                fontWeight: 600,
              }}>
                <Icon name={activeTool.icon} size={24} color="#22C55E" />
                <span>{activeTool.name}</span>
              </h2>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <button
                  onClick={(e) => { toggleFavorite(activeTool.name, e); }}
                  style={{
                    background: 'transparent', border: 'none',
                    cursor: 'pointer', padding: 6,
                    transition: 'transform 0.2s',
                  }}
                  title={favorites.includes(activeTool.name) ? '取消收藏' : '添加收藏'}
                >
                  <Icon
                    name={favorites.includes(activeTool.name) ? 'star' : 'starEmpty'}
                    size={22}
                    color={favorites.includes(activeTool.name) ? '#f59e0b' : colors.textSecondary}
                  />
                </button>
                <button
                  className="modal-close"
                  onClick={() => setActiveTool(null)}
                  style={{
                    color: colors.textSecondary,
                    background: 'none',
                    border: 'none',
                    padding: 6,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Icon name="close" size={22} color={colors.textSecondary} />
                </button>
              </div>
            </div>
            <div style={{ padding: 20, overflow: 'auto' }}>
              <activeTool.component colors={colors} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
