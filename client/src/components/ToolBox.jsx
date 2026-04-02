import { useState, useEffect, useRef, useCallback } from 'react';
import * as Diff from 'diff';
import ReactMarkdown from 'react-markdown';
import QRCode from 'qrcode';
import { useTheme } from '../ThemeContext.jsx';
import { 
  SearchIcon, 
  XIcon, 
  ClockIcon,
  CopyIcon,
  CheckIcon,
  FileJsonIcon,
  ScaleIcon,
  HashIcon,
  TypeIcon,
  KeyIcon,
  FileTextIcon,
  PaletteIcon,
  BinaryIcon,
  CalculatorIcon,
  QrCodeIcon,
  FileMarkdownIcon,
  SparklesIcon,
  TrashIcon,
  ChevronRightIcon,
  DownloadIcon
} from './Icons.jsx';

const SEARCH_HISTORY_KEY = 'moyu-tool-search-history';
const MAX_HISTORY = 10;

// ═══════════════════════════════════════════════════
// 1. JSON 格式化
// ═══════════════════════════════════════════════════
function JsonFormatter({ theme, tokens }) {
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [error, setError] = useState('');
  const [mode, setMode] = useState('format'); // 'format' | 'compress' | 'validate'

  const handleProcess = () => {
    setError('');
    if (!input.trim()) {
      setOutput('');
      return;
    }
    try {
      const parsed = JSON.parse(input);
      if (mode === 'format') {
        setOutput(JSON.stringify(parsed, null, 2));
      } else if (mode === 'compress') {
        setOutput(JSON.stringify(parsed));
      } else {
        setOutput('JSON 格式正确');
      }
    } catch (e) {
      setError('JSON 格式错误: ' + e.message);
      setOutput('');
    }
  };

  const handleCopy = () => {
    navigator.clipboard?.writeText(output);
  };

  const handleDownload = () => {
    const blob = new Blob([output], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'data.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <ToolContainer theme={theme} tokens={tokens}>
      <ToolToolbar theme={theme} tokens={tokens}>
        {[
          { key: 'format', label: '格式化', icon: FileJsonIcon },
          { key: 'compress', label: '压缩', icon: BinaryIcon },
          { key: 'validate', label: '验证', icon: CheckIcon },
        ].map((m) => (
          <ToolTab
            key={m.key}
            active={mode === m.key}
            onClick={() => setMode(m.key)}
            theme={theme}
            tokens={tokens}
            icon={m.icon}
            label={m.label}
          />
        ))}
      </ToolToolbar>
      
      <ToolSplitView theme={theme} tokens={tokens}>
        <ToolPanel theme={theme} tokens={tokens} label="输入">
          <ToolTextarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="粘贴 JSON 数据..."
            theme={theme}
            tokens={tokens}
            error={!!error}
          />
          {error && (
            <div style={{
              marginTop: 8,
              padding: '8px 12px',
              borderRadius: tokens.borderRadius.base,
              background: `${theme.status.error}15`,
              border: `1px solid ${theme.status.error}30`,
              color: theme.status.error,
              fontSize: tokens.typography.fontSize.sm,
            }}>
              {error}
            </div>
          )}
        </ToolPanel>
        
        <ToolPanel theme={theme} tokens={tokens} label="输出" actions={output && (
          <>
            <ToolActionButton onClick={handleCopy} theme={theme} tokens={tokens} icon={CopyIcon} />
            <ToolActionButton onClick={handleDownload} theme={theme} tokens={tokens} icon={DownloadIcon} />
          </>
        )}>
          <ToolOutput value={output} theme={theme} tokens={tokens} />
        </ToolPanel>
      </ToolSplitView>
      
      <ToolActions theme={theme} tokens={tokens}>
        <ToolButton primary onClick={handleProcess} theme={theme} tokens={tokens}>
          {mode === 'format' ? '格式化' : mode === 'compress' ? '压缩' : '验证'}
        </ToolButton>
        <ToolButton onClick={() => { setInput(''); setOutput(''); setError(''); }} theme={theme} tokens={tokens}>
          清空
        </ToolButton>
      </ToolActions>
    </ToolContainer>
  );
}

// ═══════════════════════════════════════════════════
// 2. 文本对比
// ═══════════════════════════════════════════════════
function TextDiff({ theme, tokens }) {
  const [oldText, setOldText] = useState('');
  const [newText, setNewText] = useState('');
  const [diffResult, setDiffResult] = useState([]);

  const compare = () => {
    const diff = Diff.diffLines(oldText, newText);
    setDiffResult(diff);
  };

  return (
    <ToolContainer theme={theme} tokens={tokens}>
      <ToolSplitView theme={theme} tokens={tokens}>
        <ToolPanel theme={theme} tokens={tokens} label="原文本">
          <ToolTextarea
            value={oldText}
            onChange={(e) => setOldText(e.target.value)}
            placeholder="输入原始文本..."
            theme={theme}
            tokens={tokens}
          />
        </ToolPanel>
        
        <ToolPanel theme={theme} tokens={tokens} label="新文本">
          <ToolTextarea
            value={newText}
            onChange={(e) => setNewText(e.target.value)}
            placeholder="输入对比文本..."
            theme={theme}
            tokens={tokens}
          />
        </ToolPanel>
      </ToolSplitView>
      
      <div style={{
        marginTop: 16,
        padding: 16,
        borderRadius: tokens.borderRadius.lg,
        background: theme.bg.tertiary,
        border: `1px solid ${theme.border.default}`,
        minHeight: 200,
        maxHeight: 300,
        overflow: 'auto',
        fontFamily: tokens.typography.fontFamily.mono,
        fontSize: 13,
        lineHeight: 1.6,
      }}>
        {diffResult.length === 0 ? (
          <div style={{ color: theme.text.tertiary, textAlign: 'center', padding: 40 }}>
            点击"对比"查看差异结果
          </div>
        ) : (
          diffResult.map((part, i) => (
            <div
              key={i}
              style={{
                background: part.added 
                  ? `${theme.status.success}20` 
                  : part.removed 
                    ? `${theme.status.error}20` 
                    : 'transparent',
                color: part.added 
                  ? theme.status.success 
                  : part.removed 
                    ? theme.status.error 
                    : theme.text.primary,
                padding: '2px 8px',
                borderRadius: 4,
                marginBottom: 2,
                whiteSpace: 'pre-wrap',
              }}
            >
              {part.added ? '+ ' : part.removed ? '- ' : '  '}
              {part.value}
            </div>
          ))
        )}
      </div>
      
      <ToolActions theme={theme} tokens={tokens}>
        <ToolButton primary onClick={compare} theme={theme} tokens={tokens}>
          对比差异
        </ToolButton>
        <ToolButton onClick={() => { setOldText(''); setNewText(''); setDiffResult([]); }} theme={theme} tokens={tokens}>
          清空
        </ToolButton>
      </ToolActions>
    </ToolContainer>
  );
}

// ═══════════════════════════════════════════════════
// 3. Base64 编解码
// ═══════════════════════════════════════════════════
function Base64Tool({ theme, tokens }) {
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [mode, setMode] = useState('encode'); // 'encode' | 'decode'
  const [error, setError] = useState('');

  const process = () => {
    setError('');
    try {
      if (mode === 'encode') {
        setOutput(btoa(unescape(encodeURIComponent(input))));
      } else {
        setOutput(decodeURIComponent(escape(atob(input))));
      }
    } catch (e) {
      setError('处理失败: ' + e.message);
    }
  };

  const copyOutput = () => {
    navigator.clipboard?.writeText(output);
  };

  return (
    <ToolContainer theme={theme} tokens={tokens}>
      <ToolToolbar theme={theme} tokens={tokens}>
        <ToolTab
          active={mode === 'encode'}
          onClick={() => setMode('encode')}
          theme={theme}
          tokens={tokens}
          icon={BinaryIcon}
          label="编码"
        />
        <ToolTab
          active={mode === 'decode'}
          onClick={() => setMode('decode')}
          theme={theme}
          tokens={tokens}
          icon={FileTextIcon}
          label="解码"
        />
      </ToolToolbar>
      
      <ToolSplitView theme={theme} tokens={tokens}>
        <ToolPanel theme={theme} tokens={tokens} label={mode === 'encode' ? '原文' : 'Base64'}>
          <ToolTextarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={mode === 'encode' ? '输入要编码的文本...' : '输入Base64字符串...'}
            theme={theme}
            tokens={tokens}
          />
        </ToolPanel>
        
        <ToolPanel theme={theme} tokens={tokens} label={mode === 'encode' ? 'Base64' : '原文'} actions={output && (
          <ToolActionButton onClick={copyOutput} theme={theme} tokens={tokens} icon={CopyIcon} />
        )}>
          <ToolOutput value={output} theme={theme} tokens={tokens} />
        </ToolPanel>
      </ToolSplitView>
      
      {error && (
        <div style={{
          marginTop: 12,
          padding: '10px 14px',
          borderRadius: tokens.borderRadius.base,
          background: `${theme.status.error}15`,
          border: `1px solid ${theme.status.error}30`,
          color: theme.status.error,
          fontSize: tokens.typography.fontSize.sm,
        }}>
          {error}
        </div>
      )}
      
      <ToolActions theme={theme} tokens={tokens}>
        <ToolButton primary onClick={process} theme={theme} tokens={tokens}>
          {mode === 'encode' ? '编码' : '解码'}
        </ToolButton>
        <ToolButton onClick={() => { setInput(''); setOutput(''); setError(''); }} theme={theme} tokens={tokens}>
          清空
        </ToolButton>
      </ToolActions>
    </ToolContainer>
  );
}

// ═══════════════════════════════════════════════════
// 4. URL 编解码
// ═══════════════════════════════════════════════════
function UrlCodec({ theme, tokens }) {
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [mode, setMode] = useState('encode');

  const process = () => {
    try {
      if (mode === 'encode') {
        setOutput(encodeURIComponent(input));
      } else {
        setOutput(decodeURIComponent(input));
      }
    } catch (e) {
      setOutput('❌ 处理失败: ' + e.message);
    }
  };

  return (
    <ToolContainer theme={theme} tokens={tokens}>
      <ToolToolbar theme={theme} tokens={tokens}>
        <ToolTab
          active={mode === 'encode'}
          onClick={() => setMode('encode')}
          theme={theme}
          tokens={tokens}
          icon={BinaryIcon}
          label="编码"
        />
        <ToolTab
          active={mode === 'decode'}
          onClick={() => setMode('decode')}
          theme={theme}
          tokens={tokens}
          icon={FileTextIcon}
          label="解码"
        />
      </ToolToolbar>
      
      <ToolSplitView theme={theme} tokens={tokens}>
        <ToolPanel theme={theme} tokens={tokens} label="输入">
          <ToolTextarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="输入文本或URL..."
            theme={theme}
            tokens={tokens}
          />
        </ToolPanel>
        
        <ToolPanel theme={theme} tokens={tokens} label="输出" actions={output && (
          <ToolActionButton onClick={() => navigator.clipboard?.writeText(output)} theme={theme} tokens={tokens} icon={CopyIcon} />
        )}>
          <ToolOutput value={output} theme={theme} tokens={tokens} />
        </ToolPanel>
      </ToolSplitView>
      
      <ToolActions theme={theme} tokens={tokens}>
        <ToolButton primary onClick={process} theme={theme} tokens={tokens}>
          {mode === 'encode' ? '编码' : '解码'}
        </ToolButton>
        <ToolButton onClick={() => { setInput(''); setOutput(''); }} theme={theme} tokens={tokens}>
          清空
        </ToolButton>
      </ToolActions>
    </ToolContainer>
  );
}

// ═══════════════════════════════════════════════════
// 5. 时间戳转换
// ═══════════════════════════════════════════════════
function TimestampTool({ theme, tokens }) {
  const [timestamp, setTimestamp] = useState(Date.now().toString());
  const [dateTime, setDateTime] = useState(new Date().toISOString().slice(0, 16));

  const convertToDate = () => {
    const ts = parseInt(timestamp);
    if (!isNaN(ts)) {
      const date = new Date(ts < 1e10 ? ts * 1000 : ts);
      setDateTime(date.toISOString().slice(0, 16));
    }
  };

  const convertToTimestamp = () => {
    const date = new Date(dateTime);
    if (!isNaN(date)) {
      setTimestamp(Math.floor(date.getTime() / 1000).toString());
    }
  };

  const now = () => {
    setTimestamp(Date.now().toString());
    setDateTime(new Date().toISOString().slice(0, 16));
  };

  return (
    <ToolContainer theme={theme} tokens={tokens}>
      <div style={{ display: 'grid', gap: 16, marginBottom: 16 }}>
        <ToolInputGroup theme={theme} tokens={tokens} label="时间戳">
          <ToolInput
            type="text"
            value={timestamp}
            onChange={(e) => setTimestamp(e.target.value)}
            placeholder="Unix 时间戳..."
            theme={theme}
            tokens={tokens}
          />
          <ToolButton onClick={convertToDate} theme={theme} tokens={tokens}>
            转日期
          </ToolButton>
        </ToolInputGroup>
        
        <ToolInputGroup theme={theme} tokens={tokens} label="日期时间">
          <ToolInput
            type="datetime-local"
            value={dateTime}
            onChange={(e) => setDateTime(e.target.value)}
            theme={theme}
            tokens={tokens}
          />
          <ToolButton onClick={convertToTimestamp} theme={theme} tokens={tokens}>
            转时间戳
          </ToolButton>
        </ToolInputGroup>
      </div>
      
      <ToolActions theme={theme} tokens={tokens}>
        <ToolButton primary onClick={now} theme={theme} tokens={tokens}>
          获取当前时间
        </ToolButton>
      </ToolActions>
      
      <div style={{
        marginTop: 20,
        padding: 16,
        borderRadius: tokens.borderRadius.lg,
        background: theme.bg.tertiary,
        border: `1px solid ${theme.border.default}`,
      }}>
        <div style={{ 
          fontSize: tokens.typography.fontSize.sm, 
          color: theme.text.secondary,
          marginBottom: 8,
        }}>
          当前时间信息
        </div>
        <div style={{
          fontFamily: tokens.typography.fontFamily.mono,
          fontSize: tokens.typography.fontSize.base,
          color: theme.text.primary,
          lineHeight: 1.8,
        }}>
          <div>Unix 秒: {Math.floor(Date.now() / 1000)}</div>
          <div>Unix 毫秒: {Date.now()}</div>
          <div>ISO: {new Date().toISOString()}</div>
          <div>本地: {new Date().toLocaleString('zh-CN')}</div>
        </div>
      </div>
    </ToolContainer>
  );
}

// ═══════════════════════════════════════════════════
// 6. 密码生成器
// ═══════════════════════════════════════════════════
function PasswordGenerator({ theme, tokens }) {
  const [length, setLength] = useState(16);
  const [useUpper, setUseUpper] = useState(true);
  const [useLower, setUseLower] = useState(true);
  const [useNumbers, setUseNumbers] = useState(true);
  const [useSymbols, setUseSymbols] = useState(true);
  const [password, setPassword] = useState('');
  const [strength, setStrength] = useState(0);

  const generate = () => {
    const upper = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const lower = 'abcdefghijklmnopqrstuvwxyz';
    const numbers = '0123456789';
    const symbols = '!@#$%^&*()_+-=[]{}|;:,.<>?';
    
    let chars = '';
    if (useUpper) chars += upper;
    if (useLower) chars += lower;
    if (useNumbers) chars += numbers;
    if (useSymbols) chars += symbols;
    
    if (chars === '') return;
    
    let result = '';
    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setPassword(result);
    
    // 计算强度
    let score = 0;
    if (length >= 8) score++;
    if (length >= 12) score++;
    if (length >= 16) score++;
    if (useUpper) score++;
    if (useLower) score++;
    if (useNumbers) score++;
    if (useSymbols) score++;
    setStrength(score);
  };

  const copyPassword = () => {
    navigator.clipboard?.writeText(password);
  };

  useEffect(() => {
    generate();
  }, []);

  const strengthColors = [
    theme.status.error,
    theme.status.error,
    theme.status.warning,
    theme.status.warning,
    theme.status.success,
    theme.status.success,
    theme.status.success,
  ];

  return (
    <ToolContainer theme={theme} tokens={tokens}>
      <div style={{
        display: 'grid',
        gap: 12,
        marginBottom: 20,
      }}>
        <ToolSlider
          label="密码长度"
          value={length}
          onChange={setLength}
          min={6}
          max={32}
          theme={theme}
          tokens={tokens}
        />
        
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12 }}>
          <ToolCheckbox checked={useUpper} onChange={setUseUpper} theme={theme} tokens={tokens} label="大写字母 (A-Z)" />
          <ToolCheckbox checked={useLower} onChange={setUseLower} theme={theme} tokens={tokens} label="小写字母 (a-z)" />
          <ToolCheckbox checked={useNumbers} onChange={setUseNumbers} theme={theme} tokens={tokens} label="数字 (0-9)" />
          <ToolCheckbox checked={useSymbols} onChange={setUseSymbols} theme={theme} tokens={tokens} label="特殊字符 (!@#$...)" />
        </div>
      </div>
      
      <div style={{
        padding: 20,
        borderRadius: tokens.borderRadius.lg,
        background: theme.bg.tertiary,
        border: `1px solid ${theme.border.default}`,
        textAlign: 'center',
        marginBottom: 16,
      }}>
        <div style={{
          fontFamily: tokens.typography.fontFamily.mono,
          fontSize: 24,
          fontWeight: 700,
          color: theme.text.primary,
          wordBreak: 'break-all',
          marginBottom: 12,
          letterSpacing: 1,
        }}>
          {password || '点击生成'}
        </div>
        
        {password && (
          <>
            <div style={{
              display: 'flex',
              gap: 4,
              justifyContent: 'center',
              marginBottom: 12,
            }}>
              {[0, 1, 2, 3, 4, 5, 6].map((i) => (
                <div
                  key={i}
                  style={{
                    width: 32,
                    height: 4,
                    borderRadius: 2,
                    background: i < strength ? strengthColors[strength - 1] : theme.border.default,
                    transition: 'background 0.3s',
                  }}
                />
              ))}
            </div>
            <div style={{
              fontSize: tokens.typography.fontSize.sm,
              color: strength >= 5 ? theme.status.success : strength >= 3 ? theme.status.warning : theme.status.error,
              fontWeight: 600,
            }}>
              强度: {strength <= 2 ? '弱' : strength <= 4 ? '中' : '强'}
            </div>
          </>
        )}
      </div>
      
      <ToolActions theme={theme} tokens={tokens}>
        <ToolButton primary onClick={generate} theme={theme} tokens={tokens}>
          生成新密码
        </ToolButton>
        <ToolButton onClick={copyPassword} theme={theme} tokens={tokens}>
          复制
        </ToolButton>
      </ToolActions>
    </ToolContainer>
  );
}

// ═══════════════════════════════════════════════════
// 7. 字数统计
// ═══════════════════════════════════════════════════
function WordCounter({ theme, tokens }) {
  const [text, setText] = useState('');
  
  const stats = {
    chars: text.length,
    charsNoSpace: text.replace(/\s/g, '').length,
    words: text.trim() ? text.trim().split(/\s+/).length : 0,
    lines: text ? text.split('\n').length : 0,
    chinese: (text.match(/[\u4e00-\u9fa5]/g) || []).length,
  };

  return (
    <ToolContainer theme={theme} tokens={tokens}>
      <ToolTextarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="粘贴文本开始统计..."
        theme={theme}
        tokens={tokens}
        style={{ minHeight: 200 }}
      />
      
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
        gap: 12,
        marginTop: 16,
      }}>
        {[
          { label: '字符总数', value: stats.chars },
          { label: '不含空格', value: stats.charsNoSpace },
          { label: '单词数', value: stats.words },
          { label: '行数', value: stats.lines },
          { label: '中文字符', value: stats.chinese },
        ].map((stat) => (
          <div
            key={stat.label}
            style={{
              padding: 16,
              borderRadius: tokens.borderRadius.lg,
              background: theme.bg.tertiary,
              border: `1px solid ${theme.border.default}`,
              textAlign: 'center',
            }}
          >
            <div style={{
              fontSize: 28,
              fontWeight: 700,
              color: theme.accent.primary,
              marginBottom: 4,
            }}>
              {stat.value}
            </div>
            <div style={{
              fontSize: tokens.typography.fontSize.sm,
              color: theme.text.secondary,
            }}>
              {stat.label}
            </div>
          </div>
        ))}
      </div>
    </ToolContainer>
  );
}

// ═══════════════════════════════════════════════════
// 8. 正则测试
// ═══════════════════════════════════════════════════
function RegexTester({ theme, tokens }) {
  const [pattern, setPattern] = useState('');
  const [flags, setFlags] = useState('g');
  const [text, setText] = useState('');
  const [matches, setMatches] = useState([]);
  const [error, setError] = useState('');

  const test = () => {
    setError('');
    setMatches([]);
    
    if (!pattern || !text) return;
    
    try {
      const regex = new RegExp(pattern, flags);
      const results = [];
      let match;
      
      if (flags.includes('g')) {
        while ((match = regex.exec(text)) !== null) {
          results.push({
            text: match[0],
            index: match.index,
            groups: match.slice(1),
          });
        }
      } else {
        match = regex.exec(text);
        if (match) {
          results.push({
            text: match[0],
            index: match.index,
            groups: match.slice(1),
          });
        }
      }
      
      setMatches(results);
    } catch (e) {
      setError('正则表达式错误: ' + e.message);
    }
  };

  useEffect(() => {
    test();
  }, [pattern, flags, text]);

  return (
    <ToolContainer theme={theme} tokens={tokens}>
      <div style={{ marginBottom: 16 }}>
        <ToolInputGroup theme={theme} tokens={tokens} label="正则表达式">
          <ToolInput
            value={pattern}
            onChange={(e) => setPattern(e.target.value)}
            placeholder="输入正则表达式..."
            theme={theme}
            tokens={tokens}
            style={{ fontFamily: tokens.typography.fontFamily.mono }}
          />
          <ToolSelect
            value={flags}
            onChange={(e) => setFlags(e.target.value)}
            theme={theme}
            tokens={tokens}
            options={[
              { value: 'g', label: 'g (全局)' },
              { value: 'gi', label: 'gi (全局+忽略大小写)' },
              { value: 'i', label: 'i (忽略大小写)' },
              { value: 'm', label: 'm (多行)' },
            ]}
          />
        </ToolInputGroup>
      </div>
      
      <ToolTextarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="输入测试文本..."
        theme={theme}
        tokens={tokens}
        style={{ minHeight: 120 }}
      />
      
      {error && (
        <div style={{
          marginTop: 12,
          padding: '10px 14px',
          borderRadius: tokens.borderRadius.base,
          background: `${theme.status.error}15`,
          border: `1px solid ${theme.status.error}30`,
          color: theme.status.error,
          fontSize: tokens.typography.fontSize.sm,
        }}>
          {error}
        </div>
      )}
      
      {matches.length > 0 && (
        <div style={{ marginTop: 16 }}>
          <div style={{
            fontSize: tokens.typography.fontSize.sm,
            color: theme.text.secondary,
            marginBottom: 8,
          }}>
            匹配结果 ({matches.length} 个)
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {matches.map((m, i) => (
              <div
                key={i}
                style={{
                  padding: 12,
                  borderRadius: tokens.borderRadius.base,
                  background: theme.bg.tertiary,
                  border: `1px solid ${theme.border.default}`,
                  fontFamily: tokens.typography.fontFamily.mono,
                  fontSize: 13,
                }}
              >
                <span style={{ color: theme.accent.primary, fontWeight: 600 }}>
                  匹配 {i + 1}:
                </span>
                <span style={{ color: theme.text.primary, marginLeft: 8 }}>
                  "{m.text}"
                </span>
                <span style={{ color: theme.text.tertiary, marginLeft: 8 }}>
                  @ 位置 {m.index}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </ToolContainer>
  );
}

// ═══════════════════════════════════════════════════
// 9. 颜色转换
// ═══════════════════════════════════════════════════
function ColorConverter({ theme, tokens }) {
  const [hex, setHex] = useState('#ff6b6b');
  const [rgb, setRgb] = useState({ r: 255, g: 107, b: 107 });
  const [hsl, setHsl] = useState({ h: 0, s: 100, l: 71 });

  const hexToRgb = (h) => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(h);
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16),
    } : null;
  };

  const rgbToHsl = (r, g, b) => {
    r /= 255; g /= 255; b /= 255;
    const max = Math.max(r, g, b), min = Math.min(r, g, b);
    let h, s, l = (max + min) / 2;

    if (max === min) {
      h = s = 0;
    } else {
      const d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
      switch (max) {
        case r: h = (g - b) / d + (g < b ? 6 : 0); break;
        case g: h = (b - r) / d + 2; break;
        case b: h = (r - g) / d + 4; break;
      }
      h /= 6;
    }
    return { h: Math.round(h * 360), s: Math.round(s * 100), l: Math.round(l * 100) };
  };

  const updateFromHex = (value) => {
    setHex(value);
    const newRgb = hexToRgb(value);
    if (newRgb) {
      setRgb(newRgb);
      setHsl(rgbToHsl(newRgb.r, newRgb.g, newRgb.b));
    }
  };

  return (
    <ToolContainer theme={theme} tokens={tokens}>
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 20,
      }}>
        {/* Color Preview */}
        <div style={{
          width: 120,
          height: 120,
          borderRadius: '50%',
          background: hex,
          border: `4px solid ${theme.border.default}`,
          boxShadow: `0 4px 20px ${hex}40`,
        }} />
        
        {/* HEX Input */}
        <ToolInputGroup theme={theme} tokens={tokens} label="HEX">
          <ToolInput
            value={hex}
            onChange={(e) => updateFromHex(e.target.value)}
            theme={theme}
            tokens={tokens}
            style={{ textAlign: 'center', fontFamily: tokens.typography.fontFamily.mono }}
          />
        </ToolInputGroup>
        
        {/* RGB Inputs */}
        <div style={{ display: 'flex', gap: 12, width: '100%' }}>
          {['r', 'g', 'b'].map((c) => (
            <ToolInputGroup key={c} theme={theme} tokens={tokens} label={c.toUpperCase()}>
              <ToolInput
                type="number"
                value={rgb[c]}
                onChange={(e) => {
                  const newRgb = { ...rgb, [c]: parseInt(e.target.value) || 0 };
                  setRgb(newRgb);
                  const newHex = `#${newRgb.r.toString(16).padStart(2, '0')}${newRgb.g.toString(16).padStart(2, '0')}${newRgb.b.toString(16).padStart(2, '0')}`;
                  setHex(newHex);
                  setHsl(rgbToHsl(newRgb.r, newRgb.g, newRgb.b));
                }}
                theme={theme}
                tokens={tokens}
              />
            </ToolInputGroup>
          ))}
        </div>
        
        {/* HSL Display */}
        <div style={{
          padding: 16,
          borderRadius: tokens.borderRadius.lg,
          background: theme.bg.tertiary,
          border: `1px solid ${theme.border.default}`,
          width: '100%',
          textAlign: 'center',
          fontFamily: tokens.typography.fontFamily.mono,
          fontSize: 16,
          color: theme.text.primary,
        }}>
          hsl({hsl.h}, {hsl.s}%, {hsl.l}%)
        </div>
      </div>
    </ToolContainer>
  );
}

// ═══════════════════════════════════════════════════
// 10. Lorem 生成
// ═══════════════════════════════════════════════════
function LoremChinese({ theme, tokens }) {
  const [count, setCount] = useState(3);
  const [output, setOutput] = useState('');

  const phrases = [
    '工作是一种生活态度', '今天的事今天做完', '人生苦短及时行乐',
    '代码能跑就行不要追求完美', '需求又改了但是我已记录',
    '这个bug待会儿再查', '在座的各位都是开发者', '早安开发者',
    '吃饭要积极身体才健康', '工作如登山一步步来',
    '老板的建议很有道理', '今天也是元气满满工作的一天',
    '效率是固定的但方法可以优化', '键盘敲得越响思路越清晰',
    '会议是最好的沟通时间', '专注工作才能事半功倍',
    '下班倒计时提醒合理安排时间', '工作一时累一直工作有成就',
    '今天的目标就是完成', '代码写完了准备提交',
    '午饭吃什么不重要健康就好', '又是美好的工作日',
    '工作使我快乐休息使我更高效', '这个需求需要评估工作量',
    '我不是在工作我是在创造价值', '电脑开着人在专注思考',
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

  const copy = () => {
    navigator.clipboard?.writeText(output);
  };

  return (
    <ToolContainer theme={theme} tokens={tokens}>
      <ToolSlider
        label="生成段落数"
        value={count}
        onChange={setCount}
        min={1}
        max={10}
        theme={theme}
        tokens={tokens}
      />
      
      <ToolActions theme={theme} tokens={tokens}>
        <ToolButton primary onClick={generate} theme={theme} tokens={tokens}>
          生成文本
        </ToolButton>
        <ToolButton onClick={copy} disabled={!output} theme={theme} tokens={tokens}>
          复制
        </ToolButton>
      </ToolActions>
      
      <ToolOutput value={output} theme={theme} tokens={tokens} style={{ marginTop: 16, minHeight: 200 }} />
    </ToolContainer>
  );
}

// ═══════════════════════════════════════════════════
// 11. Markdown 预览
// ═══════════════════════════════════════════════════
function MarkdownPreview({ theme, tokens }) {
  const [md, setMd] = useState('# 标题\n\n这是一段 **Markdown** 文本。\n\n- 列表项 1\n- 列表项 2\n\n```js\nconsole.log("Hello World");\n```');

  return (
    <ToolContainer theme={theme} tokens={tokens}>
      <ToolSplitView theme={theme} tokens={tokens}>
        <ToolPanel theme={theme} tokens={tokens} label="Markdown 输入">
          <ToolTextarea
            value={md}
            onChange={(e) => setMd(e.target.value)}
            placeholder="输入 Markdown..."
            theme={theme}
            tokens={tokens}
            style={{ minHeight: 280 }}
          />
        </ToolPanel>
        
        <ToolPanel theme={theme} tokens={tokens} label="预览">
          <div style={{
            flex: 1,
            minHeight: 280,
            lineHeight: 1.7,
            overflow: 'auto',
            padding: 16,
            background: theme.bg.tertiary,
            borderRadius: tokens.borderRadius.base,
            border: `1px solid ${theme.border.default}`,
            color: theme.text.primary,
          }}>
            <ReactMarkdown>{md}</ReactMarkdown>
          </div>
        </ToolPanel>
      </ToolSplitView>
    </ToolContainer>
  );
}

// ═══════════════════════════════════════════════════
// 12. 进制转换
// ═══════════════════════════════════════════════════
function BaseConverter({ theme, tokens }) {
  const [input, setInput] = useState('');
  const [fromBase, setFromBase] = useState(10);
  const [results, setResults] = useState({});

  const convert = () => {
    try {
      const num = parseInt(input, fromBase);
      if (isNaN(num)) { setResults({}); return; }
      setResults({
        2: num.toString(2),
        8: num.toString(8),
        10: num.toString(10),
        16: num.toString(16).toUpperCase(),
      });
    } catch {
      setResults({});
    }
  };

  return (
    <ToolContainer theme={theme} tokens={tokens}>
      <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
        <div style={{ flex: 1 }}>
          <ToolInput
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="输入数字..."
            theme={theme}
            tokens={tokens}
          />
        </div>
        <ToolSelect
          value={fromBase}
          onChange={(e) => setFromBase(parseInt(e.target.value))}
          theme={theme}
          tokens={tokens}
          options={[
            { value: 2, label: '二进制' },
            { value: 8, label: '八进制' },
            { value: 10, label: '十进制' },
            { value: 16, label: '十六进制' },
          ]}
        />
      </div>
      
      <ToolButton primary onClick={convert} theme={theme} tokens={tokens} style={{ marginBottom: 16 }}>
        转换
      </ToolButton>
      
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {Object.entries(results).map(([base, value]) => (
          <div
            key={base}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              padding: 12,
              borderRadius: tokens.borderRadius.base,
              background: theme.bg.tertiary,
              border: `1px solid ${theme.border.default}`,
            }}
          >
            <span style={{
              width: 60,
              color: theme.text.secondary,
              fontSize: tokens.typography.fontSize.sm,
            }}>
              {base === '2' ? '二进制' : base === '8' ? '八进制' : base === '10' ? '十进制' : '十六进制'}
            </span>
            <code style={{
              flex: 1,
              color: theme.text.primary,
              background: theme.bg.elevated,
              padding: '6px 12px',
              borderRadius: 4,
              fontFamily: tokens.typography.fontFamily.mono,
            }}>
              {value}
            </code>
            <ToolActionButton
              onClick={() => navigator.clipboard?.writeText(value)}
              theme={theme}
              tokens={tokens}
              icon={CopyIcon}
            />
          </div>
        ))}
      </div>
    </ToolContainer>
  );
}

// ═══════════════════════════════════════════════════
// 13. UUID 生成
// ═══════════════════════════════════════════════════
function UuidGenerator({ theme, tokens }) {
  const [uuids, setUuids] = useState([]);
  const [count, setCount] = useState(5);

  const generate = () => {
    const newUuids = [];
    for (let i = 0; i < count; i++) {
      newUuids.push(crypto.randomUUID ? crypto.randomUUID() : 
        'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
          const r = Math.random() * 16 | 0;
          const v = c === 'x' ? r : (r & 0x3 | 0x8);
          return v.toString(16);
        }));
    }
    setUuids(newUuids);
  };

  const copyAll = () => {
    navigator.clipboard?.writeText(uuids.join('\n'));
  };

  return (
    <ToolContainer theme={theme} tokens={tokens}>
      <ToolSlider
        label="生成数量"
        value={count}
        onChange={setCount}
        min={1}
        max={20}
        theme={theme}
        tokens={tokens}
      />
      
      <ToolActions theme={theme} tokens={tokens}>
        <ToolButton primary onClick={generate} theme={theme} tokens={tokens}>
          生成 UUID
        </ToolButton>
        <ToolButton onClick={copyAll} disabled={uuids.length === 0} theme={theme} tokens={tokens}>
          复制全部
        </ToolButton>
      </ToolActions>
      
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 16 }}>
        {uuids.map((uuid, i) => (
          <div
            key={i}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              padding: 12,
              borderRadius: tokens.borderRadius.base,
              background: theme.bg.tertiary,
              border: `1px solid ${theme.border.default}`,
            }}
          >
            <span style={{ color: theme.text.tertiary, fontSize: 12, width: 24 }}>
              {i + 1}
            </span>
            <code style={{
              flex: 1,
              color: theme.text.primary,
              fontFamily: tokens.typography.fontFamily.mono,
              fontSize: 13,
            }}>
              {uuid}
            </code>
            <ToolActionButton
              onClick={() => navigator.clipboard?.writeText(uuid)}
              theme={theme}
              tokens={tokens}
              icon={CopyIcon}
            />
          </div>
        ))}
      </div>
    </ToolContainer>
  );
}

// ═══════════════════════════════════════════════════
// 14. 薪资计算器
// ═══════════════════════════════════════════════════
function SalaryCalculator({ theme, tokens }) {
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
    <ToolContainer theme={theme} tokens={tokens}>
      <div style={{ display: 'grid', gap: 12, marginBottom: 16 }}>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          <ToolInputGroup theme={theme} tokens={tokens} label="月薪 (¥)" style={{ flex: 1, minWidth: 120 }}>
            <ToolInput
              type="number"
              value={salary}
              onChange={(e) => setSalary(+e.target.value)}
              theme={theme}
              tokens={tokens}
            />
          </ToolInputGroup>
          <ToolInputGroup theme={theme} tokens={tokens} label="每月工作天数" style={{ flex: 1, minWidth: 120 }}>
            <ToolInput
              type="number"
              value={workDays}
              onChange={(e) => setWorkDays(+e.target.value)}
              theme={theme}
              tokens={tokens}
            />
          </ToolInputGroup>
          <ToolInputGroup theme={theme} tokens={tokens} label="每天工作小时" style={{ flex: 1, minWidth: 120 }}>
            <ToolInput
              type="number"
              value={workHours}
              onChange={(e) => setWorkHours(+e.target.value)}
              theme={theme}
              tokens={tokens}
            />
          </ToolInputGroup>
        </div>
      </div>
      
      <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        <ToolButton primary onClick={start} theme={theme} tokens={tokens}>
          {running ? '重新开始' : '开始计算'}
        </ToolButton>
        {running && <ToolButton onClick={stop} theme={theme} tokens={tokens}>暂停</ToolButton>}
        <ToolButton onClick={reset} theme={theme} tokens={tokens}>重置</ToolButton>
      </div>
      
      <div style={{
        padding: 24,
        borderRadius: tokens.borderRadius.lg,
        background: theme.bg.tertiary,
        border: `1px solid ${theme.border.default}`,
        textAlign: 'center',
      }}>
        <div style={{ color: theme.text.secondary, fontSize: 14, marginBottom: 8 }}>
          已累计
        </div>
        <div style={{
          color: theme.accent.primary,
          fontSize: 36,
          fontWeight: 700,
          fontFamily: tokens.typography.fontFamily.mono,
        }}>
          ¥{earned.toFixed(4)}
        </div>
        <div style={{
          marginTop: 12,
          fontSize: 13,
          color: theme.text.tertiary,
        }}>
          每秒 ¥{perSecond.toFixed(6)}
        </div>
      </div>
    </ToolContainer>
  );
}

// ═══════════════════════════════════════════════════
// 15. 二维码生成
// ═══════════════════════════════════════════════════
function QrCodeGenerator({ theme, tokens }) {
  const [text, setText] = useState('');
  const [qrDataUrl, setQrDataUrl] = useState('');

  const generate = async () => {
    if (!text) return;
    try {
      const url = await QRCode.toDataURL(text, { width: 256, margin: 2 });
      setQrDataUrl(url);
    } catch (e) {
      console.error('QR生成失败:', e);
    }
  };

  const download = () => {
    if (!qrDataUrl) return;
    const a = document.createElement('a');
    a.href = qrDataUrl;
    a.download = 'qrcode.png';
    a.click();
  };

  return (
    <ToolContainer theme={theme} tokens={tokens}>
      <ToolTextarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="输入文本或URL..."
        theme={theme}
        tokens={tokens}
        style={{ minHeight: 100 }}
      />
      
      <ToolActions theme={theme} tokens={tokens}>
        <ToolButton primary onClick={generate} theme={theme} tokens={tokens}>
          生成二维码
        </ToolButton>
        <ToolButton onClick={download} disabled={!qrDataUrl} theme={theme} tokens={tokens}>
          下载图片
        </ToolButton>
      </ToolActions>
      
      {qrDataUrl && (
        <div style={{
          marginTop: 20,
          textAlign: 'center',
          padding: 20,
          borderRadius: tokens.borderRadius.lg,
          background: theme.bg.tertiary,
          border: `1px solid ${theme.border.default}`,
        }}>
          <img src={qrDataUrl} alt="QR Code" style={{ maxWidth: '100%', borderRadius: 8 }} />
        </div>
      )}
    </ToolContainer>
  );
}

// ═══════════════════════════════════════════════════
// UI 组件（使用新主题系统）
// ═══════════════════════════════════════════════════

function ToolContainer({ children, theme, tokens, style = {} }) {
  return (
    <div style={{
      padding: 24,
      borderRadius: tokens.borderRadius.lg,
      background: theme.glass.background,
      backdropFilter: theme.glass.blur,
      border: theme.glass.border,
      boxShadow: theme.shadow.md,
      ...style,
    }}>
      {children}
    </div>
  );
}

function ToolToolbar({ children, theme, tokens }) {
  return (
    <div style={{
      display: 'flex',
      gap: 8,
      marginBottom: 16,
      padding: 4,
      borderRadius: tokens.borderRadius.md,
      background: theme.bg.tertiary,
    }}>
      {children}
    </div>
  );
}

function ToolTab({ active, onClick, theme, tokens, icon: Icon, label }) {
  return (
    <button
      onClick={onClick}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 6,
        padding: '8px 16px',
        borderRadius: tokens.borderRadius.base,
        border: 'none',
        background: active ? theme.accent.primary : 'transparent',
        color: active ? '#fff' : theme.text.secondary,
        cursor: 'pointer',
        fontSize: tokens.typography.fontSize.sm,
        fontWeight: active ? 600 : 500,
        transition: `all ${tokens.animation.duration.fast} ease`,
      }}
    >
      {Icon && <Icon size={16} />}
      {label}
    </button>
  );
}

function ToolSplitView({ children, theme, tokens }) {
  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
      gap: 16,
    }}>
      {children}
    </div>
  );
}

function ToolPanel({ children, theme, tokens, label, actions, style = {} }) {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      gap: 8,
      ...style,
    }}>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
      }}>
        <span style={{
          fontSize: tokens.typography.fontSize.sm,
          color: theme.text.secondary,
          fontWeight: 500,
        }}>
          {label}
        </span>
        {actions && (
          <div style={{ display: 'flex', gap: 4 }}>
            {actions}
          </div>
        )}
      </div>
      {children}
    </div>
  );
}

function ToolTextarea({ theme, tokens, error, style = {}, ...props }) {
  return (
    <textarea
      {...props}
      style={{
        width: '100%',
        minHeight: 140,
        padding: 12,
        background: theme.bg.tertiary,
        border: `1px solid ${error ? theme.status.error : theme.border.default}`,
        borderRadius: tokens.borderRadius.base,
        color: theme.text.primary,
        fontSize: tokens.typography.fontSize.base,
        fontFamily: tokens.typography.fontFamily.mono,
        resize: 'vertical',
        outline: 'none',
        boxSizing: 'border-box',
        transition: `border-color ${tokens.animation.duration.fast} ease, box-shadow ${tokens.animation.duration.fast} ease`,
        ...style,
      }}
    />
  );
}

function ToolOutput({ value, theme, tokens, style = {} }) {
  return (
    <pre style={{
      width: '100%',
      minHeight: 140,
      padding: 12,
      background: theme.bg.tertiary,
      border: `1px solid ${theme.border.default}`,
      borderRadius: tokens.borderRadius.base,
      color: theme.text.primary,
      fontSize: tokens.typography.fontSize.base,
      fontFamily: tokens.typography.fontFamily.mono,
      whiteSpace: 'pre-wrap',
      wordBreak: 'break-all',
      overflowY: 'auto',
      maxHeight: 300,
      boxSizing: 'border-box',
      margin: 0,
      ...style,
    }}>
      {value || <span style={{ color: theme.text.tertiary }}>等待输出...</span>}
    </pre>
  );
}

function ToolInput({ theme, tokens, style = {}, ...props }) {
  return (
    <input
      {...props}
      style={{
        width: '100%',
        padding: '10px 12px',
        background: theme.bg.tertiary,
        border: `1px solid ${theme.border.default}`,
        borderRadius: tokens.borderRadius.base,
        color: theme.text.primary,
        fontSize: tokens.typography.fontSize.base,
        outline: 'none',
        boxSizing: 'border-box',
        transition: `border-color ${tokens.animation.duration.fast} ease`,
        ...style,
      }}
    />
  );
}

function ToolSelect({ theme, tokens, options, ...props }) {
  return (
    <select
      {...props}
      style={{
        padding: '10px 12px',
        background: theme.bg.tertiary,
        border: `1px solid ${theme.border.default}`,
        borderRadius: tokens.borderRadius.base,
        color: theme.text.primary,
        fontSize: tokens.typography.fontSize.base,
        outline: 'none',
        cursor: 'pointer',
      }}
    >
      {options.map(opt => (
        <option key={opt.value} value={opt.value}>{opt.label}</option>
      ))}
    </select>
  );
}

function ToolInputGroup({ children, theme, tokens, label, style = {} }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6, ...style }}>
      <span style={{
        fontSize: tokens.typography.fontSize.sm,
        color: theme.text.secondary,
        fontWeight: 500,
      }}>
        {label}
      </span>
      {children}
    </div>
  );
}

function ToolButton({ children, primary, disabled, onClick, theme, tokens, style = {} }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
        padding: '10px 20px',
        borderRadius: tokens.borderRadius.md,
        border: 'none',
        background: primary ? theme.gradient.primary : theme.bg.tertiary,
        color: primary ? '#fff' : theme.text.primary,
        fontSize: tokens.typography.fontSize.sm,
        fontWeight: 600,
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.5 : 1,
        boxShadow: primary ? theme.shadow.md : 'none',
        transition: `all ${tokens.animation.duration.fast} ease`,
        ...style,
      }}
      onMouseEnter={(e) => {
        if (!disabled && !primary) {
          e.currentTarget.style.background = theme.glass.backgroundHover;
          e.currentTarget.style.borderColor = theme.border.hover;
        }
      }}
      onMouseLeave={(e) => {
        if (!disabled && !primary) {
          e.currentTarget.style.background = theme.bg.tertiary;
          e.currentTarget.style.borderColor = theme.border.default;
        }
      }}
    >
      {children}
    </button>
  );
}

function ToolActions({ children, theme, tokens, style = {} }) {
  return (
    <div style={{
      display: 'flex',
      gap: 8,
      flexWrap: 'wrap',
      marginTop: 16,
      ...style,
    }}>
      {children}
    </div>
  );
}

function ToolActionButton({ onClick, theme, tokens, icon: Icon }) {
  return (
    <button
      onClick={onClick}
      style={{
        width: 32,
        height: 32,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: tokens.borderRadius.base,
        background: 'transparent',
        border: 'none',
        cursor: 'pointer',
        color: theme.text.secondary,
        transition: `all ${tokens.animation.duration.fast} ease`,
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.background = theme.glass.backgroundHover;
        e.currentTarget.style.color = theme.accent.primary;
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = 'transparent';
        e.currentTarget.style.color = theme.text.secondary;
      }}
    >
      <Icon size={18} />
    </button>
  );
}

function ToolSlider({ label, value, onChange, min, max, theme, tokens }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
      }}>
        <span style={{
          fontSize: tokens.typography.fontSize.sm,
          color: theme.text.secondary,
        }}>
          {label}
        </span>
        <span style={{
          fontSize: tokens.typography.fontSize.sm,
          color: theme.accent.primary,
          fontWeight: 600,
          fontFamily: tokens.typography.fontFamily.mono,
        }}>
          {value}
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        value={value}
        onChange={(e) => onChange(parseInt(e.target.value))}
        style={{
          width: '100%',
          height: 6,
          borderRadius: 3,
          background: theme.bg.tertiary,
          outline: 'none',
          cursor: 'pointer',
          WebkitAppearance: 'none',
        }}
      />
    </div>
  );
}

function ToolCheckbox({ checked, onChange, theme, tokens, label }) {
  return (
    <label style={{
      display: 'flex',
      alignItems: 'center',
      gap: 8,
      cursor: 'pointer',
      padding: '8px 12px',
      borderRadius: tokens.borderRadius.base,
      background: checked ? `${theme.accent.primary}15` : theme.bg.tertiary,
      border: `1px solid ${checked ? theme.accent.primary : theme.border.default}`,
      transition: `all ${tokens.animation.duration.fast} ease`,
    }}>
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        style={{ cursor: 'pointer' }}
      />
      <span style={{
        fontSize: tokens.typography.fontSize.sm,
        color: checked ? theme.accent.primary : theme.text.primary,
        fontWeight: checked ? 600 : 400,
      }}>
        {label}
      </span>
    </label>
  );
}

// ═══════════════════════════════════════════════════
// 工具列表
// ═══════════════════════════════════════════════════
const TOOLS = [
  { icon: FileJsonIcon, name: 'JSON 格式化', component: JsonFormatter },
  { icon: ScaleIcon, name: '文本对比', component: TextDiff },
  { icon: BinaryIcon, name: 'Base64', component: Base64Tool },
  { icon: HashIcon, name: 'URL 编解码', component: UrlCodec },
  { icon: ClockIcon, name: '时间戳转换', component: TimestampTool },
  { icon: KeyIcon, name: '密码生成器', component: PasswordGenerator },
  { icon: TypeIcon, name: '字数统计', component: WordCounter },
  { icon: FileTextIcon, name: '正则测试', component: RegexTester },
  { icon: PaletteIcon, name: '颜色转换', component: ColorConverter },
  { icon: SparklesIcon, name: 'Lorem 生成', component: LoremChinese },
  { icon: FileMarkdownIcon, name: 'Markdown预览', component: MarkdownPreview },
  { icon: BinaryIcon, name: '进制转换', component: BaseConverter },
  { icon: KeyIcon, name: 'UUID生成器', component: UuidGenerator },
  { icon: CalculatorIcon, name: '薪资计算器', component: SalaryCalculator },
  { icon: QrCodeIcon, name: '二维码生成', component: QrCodeGenerator },
];

// ═══════════════════════════════════════════════════
// Main ToolBox component
// ═══════════════════════════════════════════════════
export default function ToolBox({ searchOpen, onSearchChange }) {
  const { theme, tokens } = useTheme();
  const [search, setSearch] = useState('');
  const [activeTool, setActiveTool] = useState(null);
  const [hoveredIdx, setHoveredIdx] = useState(-1);
  const [history, setHistory] = useState(() => {
    try { return JSON.parse(localStorage.getItem(SEARCH_HISTORY_KEY)) || []; }
    catch { return []; }
  });
  const [showHistory, setShowHistory] = useState(false);
  const searchInputRef = useRef(null);
  const historyRef = useRef(null);

  const saveHistory = useCallback((term) => {
    if (!term.trim()) return;
    const newHistory = [term.trim(), ...history.filter(h => h !== term.trim())].slice(0, MAX_HISTORY);
    setHistory(newHistory);
    try { localStorage.setItem(SEARCH_HISTORY_KEY, JSON.stringify(newHistory)); }
    catch {}
  }, [history]);

  const clearHistory = () => {
    setHistory([]);
    try { localStorage.removeItem(SEARCH_HISTORY_KEY); }
    catch {}
  };

  const selectFromHistory = (term) => {
    setSearch(term);
    setShowHistory(false);
  };

  const filtered = TOOLS.filter(t =>
    t.name.toLowerCase().includes(search.toLowerCase())
  );

  useEffect(() => {
    if (searchOpen && searchInputRef.current) {
      searchInputRef.current.focus();
      onSearchChange?.(false);
    }
  }, [searchOpen, onSearchChange]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (historyRef.current && !historyRef.current.contains(e.target)) {
        setShowHistory(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSearchKeyDown = (e) => {
    if (e.key === 'Enter' && search.trim()) {
      saveHistory(search.trim());
      setShowHistory(false);
    }
  };

  const ActiveToolComponent = activeTool?.component;

  return (
    <div>
      {/* Search bar with glassmorphism */}
      <div
        ref={historyRef}
        style={{
          position: 'relative',
          marginBottom: 24,
        }}
      >
        <div style={{
          position: 'absolute',
          left: 16,
          top: '50%',
          transform: 'translateY(-50%)',
          pointerEvents: 'none',
          color: theme.text.tertiary,
        }}>
          <SearchIcon size={20} />
        </div>
        
        <input
          ref={searchInputRef}
          type="text"
          placeholder="搜索工具... (Ctrl+K)"
          value={search}
          onChange={e => setSearch(e.target.value)}
          onKeyDown={handleSearchKeyDown}
          onFocus={() => history.length > 0 && setShowHistory(true)}
          style={{
            width: '100%',
            padding: '14px 100px 14px 48px',
            background: theme.glass.background,
            backdropFilter: theme.glass.blur,
            border: `1px solid ${theme.glass.border}`,
            borderRadius: tokens.borderRadius.lg,
            color: theme.text.primary,
            fontSize: tokens.typography.fontSize.base,
            outline: 'none',
            boxSizing: 'border-box',
            transition: `all ${tokens.animation.duration.fast} ease`,
            boxShadow: theme.shadow.sm,
          }}
        />
        
        <div style={{
          position: 'absolute',
          right: 16,
          top: '50%',
          transform: 'translateY(-50%)',
          display: 'flex',
          alignItems: 'center',
          gap: 8,
        }}>
          <kbd style={{
            padding: '4px 8px',
            borderRadius: tokens.borderRadius.sm,
            background: theme.bg.tertiary,
            border: `1px solid ${theme.border.default}`,
            fontSize: 11,
            fontFamily: tokens.typography.fontFamily.mono,
            color: theme.text.tertiary,
          }}>
            Ctrl+K
          </kbd>
        </div>

        {/* Search history dropdown */}
        {showHistory && history.length > 0 && (
          <div style={{
            position: 'absolute',
            top: '100%',
            left: 0,
            right: 0,
            marginTop: 8,
            background: theme.glass.background,
            backdropFilter: theme.glass.blur,
            border: theme.glass.border,
            borderRadius: tokens.borderRadius.lg,
            boxShadow: theme.shadow.lg,
            zIndex: 100,
            overflow: 'hidden',
          }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '12px 16px',
              borderBottom: `1px solid ${theme.border.default}`,
            }}>
              <span style={{ fontSize: tokens.typography.fontSize.sm, color: theme.text.secondary }}>
                搜索历史
              </span>
              <button
                onClick={clearHistory}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 4,
                  fontSize: tokens.typography.fontSize.xs,
                  color: theme.status.error,
                  background: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  padding: '4px 8px',
                  borderRadius: tokens.borderRadius.base,
                  transition: `background ${tokens.animation.duration.fast} ease`,
                }}
                onMouseEnter={e => e.currentTarget.style.background = `${theme.status.error}15`}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
              >
                <TrashIcon size={14} />
                清空
              </button>
            </div>
            {history.map((term, idx) => (
              <div
                key={idx}
                onClick={() => selectFromHistory(term)}
                style={{
                  padding: '12px 16px',
                  cursor: 'pointer',
                  fontSize: tokens.typography.fontSize.sm,
                  color: theme.text.primary,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  transition: `background ${tokens.animation.duration.fast} ease`,
                }}
                onMouseEnter={e => e.currentTarget.style.background = theme.glass.backgroundHover}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
              >
                <ClockIcon size={16} color={theme.text.tertiary} />
                <span style={{ flex: 1 }}>{term}</span>
                <ChevronRightIcon size={16} color={theme.text.tertiary} />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Tool cards grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))',
        gap: 16,
      }}>
        {filtered.map((tool, idx) => {
          const Icon = tool.icon;
          return (
            <div
              key={tool.name}
              onClick={() => setActiveTool(tool)}
              onMouseEnter={() => setHoveredIdx(idx)}
              onMouseLeave={() => setHoveredIdx(-1)}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 12,
                padding: '24px 16px',
                background: hoveredIdx === idx ? theme.glass.backgroundHover : theme.glass.background,
                backdropFilter: theme.glass.blur,
                border: `1px solid ${hoveredIdx === idx ? theme.accent.primary : theme.glass.border}`,
                borderRadius: tokens.borderRadius.lg,
                cursor: 'pointer',
                textAlign: 'center',
                transition: `all ${tokens.animation.duration.normal} ${tokens.animation.easing.smooth}`,
                transform: hoveredIdx === idx ? 'translateY(-4px)' : 'translateY(0)',
                boxShadow: hoveredIdx === idx ? `${theme.shadow.lg}, ${theme.shadow.glow}` : theme.shadow.sm,
              }}
            >
              <div style={{
                width: 48,
                height: 48,
                borderRadius: tokens.borderRadius.md,
                background: hoveredIdx === idx ? theme.gradient.primary : theme.bg.tertiary,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: `all ${tokens.animation.duration.fast} ease`,
              }}>
                <Icon 
                  size={24} 
                  color={hoveredIdx === idx ? '#fff' : theme.accent.primary}
                />
              </div>
              <div style={{
                color: hoveredIdx === idx ? theme.accent.primary : theme.text.primary,
                fontSize: tokens.typography.fontSize.sm,
                fontWeight: hoveredIdx === idx ? 600 : 500,
                transition: `color ${tokens.animation.duration.fast} ease`,
              }}>
                {tool.name}
              </div>
            </div>
          );
        })}
      </div>

      {filtered.length === 0 && (
        <div style={{
          textAlign: 'center',
          color: theme.text.tertiary,
          padding: 60,
          fontSize: tokens.typography.fontSize.base,
        }}>
          <div style={{ marginBottom: 16 }}>
            <SearchIcon size={48} color={theme.text.tertiary} />
          </div>
          没有找到匹配的工具
        </div>
      )}

      {/* Modal */}
      {activeTool && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: theme.bg.overlay,
            backdropFilter: 'blur(8px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: 20,
          }}
          onClick={e => { if (e.target === e.currentTarget) setActiveTool(null); }}
        >
          <div style={{
            background: theme.bg.elevated,
            borderRadius: tokens.borderRadius.xl,
            border: `1px solid ${theme.border.default}`,
            boxShadow: theme.shadow['2xl'],
            maxWidth: 900,
            width: '100%',
            maxHeight: '85vh',
            overflow: 'auto',
            animation: 'scaleIn 0.25s ease',
          }}>
            {/* Modal Header */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '20px 24px',
              borderBottom: `1px solid ${theme.border.default}`,
            }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
              }}>
                <div style={{
                  width: 40,
                  height: 40,
                  borderRadius: tokens.borderRadius.md,
                  background: `${theme.accent.primary}15`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}>
                  <activeTool.icon size={22} color={theme.accent.primary} />
                </div>
                <h2 style={{
                  color: theme.text.primary,
                  fontSize: tokens.typography.fontSize.xl,
                  fontWeight: 700,
                  margin: 0,
                }}>
                  {activeTool.name}
                </h2>
              </div>
              <button
                onClick={() => setActiveTool(null)}
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: tokens.borderRadius.md,
                  background: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: theme.text.secondary,
                  transition: `all ${tokens.animation.duration.fast} ease`,
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.background = theme.bg.tertiary;
                  e.currentTarget.style.color = theme.text.primary;
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.background = 'transparent';
                  e.currentTarget.style.color = theme.text.secondary;
                }}
              >
                <XIcon size={20} />
              </button>
            </div>
            
            {/* Modal Content */}
            <div style={{ padding: 24 }}>
              <ActiveToolComponent theme={theme} tokens={tokens} />
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes scaleIn {
          from {
            opacity: 0;
            transform: scale(0.95) translateY(10px);
          }
          to {
            opacity: 1;
            transform: scale(1) translateY(0);
          }
        }
      `}</style>
    </div>
  );
}
