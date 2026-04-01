import { useState, useEffect } from 'react';
import * as Diff from 'diff';
import ReactMarkdown from 'react-markdown';
import QRCode from 'qrcode';
import { useTheme } from '../ThemeContext.jsx';

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
// Tool registry
// ═══════════════════════════════════════════════════
const TOOLS = [
  { icon: '🔧', name: 'JSON 格式化', component: JsonFormatter },
  { icon: '📝', name: '文本对比', component: TextDiff },
  { icon: '🔐', name: 'Base64 编解码', component: Base64Tool },
  { icon: '🔗', name: 'URL 编解码', component: UrlTool },
  { icon: '⏱️', name: '时间戳转换', component: TimestampTool },
  { icon: '🔑', name: '密码生成器', component: PasswordGenerator },
  { icon: '📊', name: '字数统计', component: WordCounter },
  { icon: '🧪', name: '正则测试', component: RegexTester },
  { icon: '🎨', name: '颜色转换', component: ColorConverter },
  { icon: '📄', name: 'Lorem生成', component: LoremChinese },
  { icon: '📖', name: 'Markdown预览', component: MarkdownPreview },
  { icon: '🔢', name: '进制转换', component: BaseConverter },
  { icon: '🆔', name: 'UUID生成器', component: UuidGenerator },
  { icon: '💰', name: '摸鱼计算器', component: SalaryCalculator },
  { icon: '📱', name: '二维码生成', component: QrCodeGenerator },
];

// ═══════════════════════════════════════════════════
// Main ToolBox component
// ═══════════════════════════════════════════════════
export default function ToolBox() {
  const { colors } = useTheme();
  const [search, setSearch] = useState('');
  const [activeTool, setActiveTool] = useState(null);
  const [hoveredIdx, setHoveredIdx] = useState(-1);

  const filtered = TOOLS.filter(t =>
    t.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      {/* Search bar */}
      <div style={{
        position: 'relative', marginBottom: 20,
      }}>
        <span style={{
          position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)',
          fontSize: 16, pointerEvents: 'none',
        }}>🔍</span>
        <input
          type="text"
          placeholder="搜索工具..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{
            width: '100%', padding: '12px 12px 12px 40px',
            background: colors.cardBg, border: `1px solid ${colors.border}`,
            borderRadius: 10, color: colors.text, fontSize: 15,
            outline: 'none', boxSizing: 'border-box',
            transition: 'border-color 0.2s',
          }}
          onFocus={e => e.target.style.borderColor = colors.accent}
          onBlur={e => e.target.style.borderColor = colors.border}
        />
      </div>

      {/* Tool cards grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))',
        gap: 12,
      }}>
        {filtered.map((tool, idx) => (
          <div
            key={tool.name}
            onClick={() => setActiveTool(tool)}
            onMouseEnter={() => setHoveredIdx(idx)}
            onMouseLeave={() => setHoveredIdx(-1)}
            style={{
              background: colors.cardBg,
              border: `1px solid ${hoveredIdx === idx ? colors.accent : colors.border}`,
              borderRadius: 12,
              padding: '20px 12px',
              cursor: 'pointer',
              textAlign: 'center',
              transition: 'all 0.2s ease',
              transform: hoveredIdx === idx ? 'translateY(-2px)' : 'none',
              boxShadow: hoveredIdx === idx ? `0 4px 12px ${colors.shadow}` : 'none',
            }}
          >
            <div style={{ fontSize: 32, marginBottom: 8 }}>{tool.icon}</div>
            <div style={{ color: colors.text, fontSize: 13, fontWeight: 500 }}>{tool.name}</div>
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
        <div className="modal-overlay" onClick={e => { if (e.target === e.currentTarget) setActiveTool(null); }}>
          <div className="modal-content" style={{ background: colors.cardBg, borderColor: colors.border }}>
            <div className="modal-header" style={{ borderBottomColor: colors.border }}>
              <h2 style={{ color: colors.accent }}>{activeTool.icon} {activeTool.name}</h2>
              <button className="modal-close" onClick={() => setActiveTool(null)} style={{ color: colors.textSecondary }}>✕</button>
            </div>
            <activeTool.component colors={colors} />
          </div>
        </div>
      )}
    </div>
  );
}
