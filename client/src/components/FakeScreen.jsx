import { useState, useEffect, useRef, useCallback } from 'react';
import { useTheme } from '../ThemeContext.jsx';

// 预定义的假代码模板
const CODE_TEMPLATES = {
  react: `import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchUserData } from './api/user';

export const UserDashboard = ({ userId }) => {
  const dispatch = useDispatch();
  const [loading, setLoading] = useState(true);
  const userData = useSelector(state => state.user.data);

  useEffect(() => {
    const loadData = async () => {
      try {
        await dispatch(fetchUserData(userId));
      } catch (error) {
        console.error('Failed to fetch user:', error);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [userId, dispatch]);

  if (loading) return <div className="loading">Loading...</div>;

  return (
    <div className="dashboard">
      <h1>{userData?.name || 'User Profile'}</h1>
      <UserStats stats={userData?.stats} />
      <ActivityLog activities={userData?.activities} />
    </div>
  );
};`,
  vue: `<template>
  <div class="app-container">
    <header class="main-header">
      <nav class="nav-menu">
        <router-link to="/">Home</router-link>
        <router-link to="/about">About</router-link>
      </nav>
    </header>
    <main class="content">
      <component :is="currentComponent" />
    </main>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import Home from './views/Home.vue';
import About from './views/About.vue';

const route = useRoute();
const currentComponent = computed(() => {
  return route.path === '/' ? Home : About;
});

const user = ref(null);

onMounted(async () => {
  const response = await fetch('/api/user');
  user.value = await response.json();
});
</script>

<style scoped>
.app-container { min-height: 100vh; }
.main-header { background: #2c3e50; padding: 1rem; }
.nav-menu a { color: white; margin-right: 1rem; text-decoration: none; }
</style>`,
  node: `const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const { connectDB } = require('./config/database');
const routes = require('./routes');

const app = express();
const PORT = process.env.PORT || 3000;

// Security middleware
app.use(helmet());
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100
});
app.use('/api/', limiter);

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api', routes);

// Error handling
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

connectDB().then(() => {
  app.listen(PORT, () => {
    console.log(\`Server running on port \${PORT}\`);
  });
});`,
  python: `import asyncio
import aiohttp
from typing import List, Dict, Optional
from dataclasses import dataclass
from datetime import datetime

@dataclass
class ApiResponse:
    status: int
    data: Dict
    timestamp: datetime

class DataFetcher:
    def __init__(self, base_url: str, api_key: str):
        self.base_url = base_url
        self.api_key = api_key
        self.session: Optional[aiohttp.ClientSession] = None

    async def __aenter__(self):
        self.session = aiohttp.ClientSession(
            headers={'Authorization': f'Bearer {self.api_key}'}
        )
        return self

    async def __aexit__(self, *args):
        if self.session:
            await self.session.close()

    async def fetch_data(self, endpoint: str) -> ApiResponse:
        if not self.session:
            raise RuntimeError('Session not initialized')

        async with self.session.get(
            f'{self.base_url}/{endpoint}'
        ) as response:
            data = await response.json()
            return ApiResponse(
                status=response.status,
                data=data,
                timestamp=datetime.now()
            )

async def main():
    async with DataFetcher('https://api.example.com', 'key123') as fetcher:
        result = await fetcher.fetch_data('users')
        print(f'Fetched {len(result.data)} users')

if __name__ == '__main__':
    asyncio.run(main())`,
  java: `package com.example.project.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import lombok.extern.slf4j.Slf4j;
import java.util.List;
import java.util.Optional;

@Slf4j
@Service
@Transactional(readOnly = true)
public class UserService {

    private final UserRepository userRepository;
    private final EmailService emailService;

    @Autowired
    public UserService(UserRepository userRepository, 
                       EmailService emailService) {
        this.userRepository = userRepository;
        this.emailService = emailService;
    }

    public Optional<User> findById(Long id) {
        log.info("Finding user by id: {}", id);
        return userRepository.findById(id);
    }

    public List<User> findAllActive() {
        return userRepository.findByActiveTrue();
    }

    @Transactional
    public User createUser(UserDTO dto) {
        User user = new User();
        user.setName(dto.getName());
        user.setEmail(dto.getEmail());
        user.setActive(true);

        User saved = userRepository.save(user);
        emailService.sendWelcomeEmail(saved);

        return saved;
    }
}`,
  sql: `-- Create users table with constraints
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT TRUE
);

-- Create indexes for performance
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_created_at ON users(created_at);

-- Insert sample data
INSERT INTO users (username, email, password_hash) VALUES
('john_doe', 'john@example.com', '$2b$12$...'),
('jane_smith', 'jane@example.com', '$2b$12$...');

-- Query with JOIN
SELECT u.id, u.username, u.email, p.title, p.created_at
FROM users u
LEFT JOIN posts p ON u.id = p.user_id
WHERE u.is_active = TRUE
ORDER BY p.created_at DESC
LIMIT 20;

-- Update trigger for updated_at
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;`,
};

// 终端输出模板
const TERMINAL_OUTPUTS = [
  `[14:32:15] Starting development server...
[14:32:16] ✓ Compiled successfully in 2451ms
[14:32:16] 
[14:32:16]   Local:   http://localhost:5173/
[14:32:16]   Network: http://192.168.1.100:5173/
[14:32:16] 
[14:32:16]   ➜  press h + enter to show help`,
  `✔ build [===================] 187/187 modules (42 active)
vite v5.0.0 building for production...
✓ 124 modules transformed.
dist/                     0.05 kB │ gzip: 0.07 kB
dist/assets/index.js    142.58 kB │ gzip: 45.23 kB
dist/assets/style.css     3.21 kB │ gzip: 1.45 kB
✓ built in 3.42s`,
  `[INFO] --- maven-compiler-plugin:3.8.1:compile (default-compile) @ project ---
[INFO] Changes detected - recompiling the module!
[INFO] Compiling 42 source files to /target/classes
[INFO] --------------------------------------------------------------
[INFO] BUILD SUCCESS
[INFO] --------------------------------------------------------------
[INFO] Total time:  12.345 s
[INFO] Finished at: 2024-01-15T14:32:16+08:00`,
];

// 假 IDE 标题
const IDE_TITLES = [
  'VS Code',
  'IntelliJ IDEA',
  'WebStorm',
  'PyCharm',
  'GoLand',
  'Cursor',
];

// 语法高亮颜色
const SYNTAX_COLORS = {
  keyword: '#c586c0',
  string: '#ce9178',
  comment: '#6a9955',
  function: '#dcdcaa',
  number: '#b5cea8',
  class: '#4ec9b0',
  operator: '#d4d4d4',
  tag: '#569cd6',
  attr: '#9cdcfe',
};

// 简单的语法高亮
function highlightCode(code, lang) {
  if (!code) return '';

  const keywords = ['import', 'from', 'const', 'let', 'var', 'function', 'return', 'if', 'else', 'for', 'while', 'class', 'extends', 'async', 'await', 'export', 'default', 'new', 'this', 'try', 'catch', 'finally', 'throw', 'typeof', 'instanceof', 'package', 'public', 'private', 'protected', 'static', 'void', 'int', 'String', 'def', 'class', 'pass', 'yield', 'with'];

  let html = code
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

  // 注释
  html = html.replace(/(\/\/.*$|\/\*[\s\S]*?\*\/|#.*$|--.*$)/gm, '<span style="color:' + SYNTAX_COLORS.comment + '">$1</span>');

  // 字符串
  html = html.replace(/(['"\`])(.*?)(\1)/g, '<span style="color:' + SYNTAX_COLORS.string + '">$1$2$3</span>');

  // 关键字
  keywords.forEach(kw => {
    const regex = new RegExp(`\\b(${kw})\\b`, 'g');
    html = html.replace(regex, '<span style="color:' + SYNTAX_COLORS.keyword + '">$1</span>');
  });

  // 函数调用
  html = html.replace(/(\w+)(\s*\()/g, '<span style="color:' + SYNTAX_COLORS.function + '">$1</span>$2');

  // 数字
  html = html.replace(/\b(\d+)\b/g, '<span style="color:' + SYNTAX_COLORS.number + '">$1</span>');

  return html;
}

// IDE 界面组件
function IDEView({ code, ideType, fileName, colors }) {
  const isDark = ideType === 'vscode' || ideType === 'idea';
  const bgColor = isDark ? '#1e1e1e' : '#ffffff';
  const textColor = isDark ? '#d4d4d4' : '#333333';
  const sidebarColor = isDark ? '#252526' : '#f3f3f3';
  const tabColor = isDark ? '#2d2d2d' : '#ececec';
  const activeTabColor = isDark ? '#1e1e1e' : '#ffffff';

  const fileTree = [
    { name: 'src', type: 'folder', open: true },
    { name: '  components', type: 'folder', open: true },
    { name: '    UserCard.tsx', type: 'file', active: false },
    { name: '    Button.jsx', type: 'file', active: true },
    { name: '  utils', type: 'folder', open: false },
    { name: '  App.tsx', type: 'file', active: false },
    { name: '  main.tsx', type: 'file', active: false },
    { name: 'package.json', type: 'file', active: false },
    { name: 'tsconfig.json', type: 'file', active: false },
  ];

  return (
    <div style={{
      width: '100%',
      height: '100%',
      background: bgColor,
      borderRadius: 8,
      overflow: 'hidden',
      display: 'flex',
      flexDirection: 'column',
      fontFamily: 'Consolas, Monaco, "Courier New", monospace',
      fontSize: 13,
    }}>
      {/* Title Bar */}
      <div style={{
        height: 30,
        background: isDark ? '#3c3c3c' : '#dddddd',
        display: 'flex',
        alignItems: 'center',
        padding: '0 12px',
        gap: 8,
      }}>
        <div style={{ display: 'flex', gap: 6 }}>
          <span style={{ width: 12, height: 12, borderRadius: '50%', background: '#ff5f56' }} />
          <span style={{ width: 12, height: 12, borderRadius: '50%', background: '#ffbd2e' }} />
          <span style={{ width: 12, height: 12, borderRadius: '50%', background: '#27ca40' }} />
        </div>
        <span style={{ flex: 1, textAlign: 'center', color: isDark ? '#cccccc' : '#666666', fontSize: 12 }}>
          {fileName} - {IDE_TITLES[Math.floor(Math.random() * IDE_TITLES.length)]}
        </span>
      </div>

      {/* Main Content */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        {/* Sidebar */}
        <div style={{
          width: 200,
          background: sidebarColor,
          padding: '8px 0',
          overflowY: 'auto',
        }}>
          {fileTree.map((file, idx) => (
            <div
              key={idx}
              style={{
                padding: '4px 12px',
                paddingLeft: file.name.startsWith('  ') ? 24 : 12,
                color: file.active ? (isDark ? '#ffffff' : '#000000') : (isDark ? '#858585' : '#666666'),
                background: file.active ? (isDark ? '#37373d' : '#e4e6f1') : 'transparent',
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                fontSize: 12,
              }}
            >
              <span>{file.type === 'folder' ? (file.open ? '📂' : '📁') : '📄'}</span>
              {file.name.trim()}
            </div>
          ))}
        </div>

        {/* Code Area */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          {/* Tabs */}
          <div style={{
            height: 35,
            background: tabColor,
            display: 'flex',
            alignItems: 'center',
            padding: '0 8px',
            gap: 2,
          }}>
            <div style={{
              padding: '8px 16px',
              background: activeTabColor,
              color: textColor,
              fontSize: 12,
              borderTop: `2px solid ${colors.accent}`,
              display: 'flex',
              alignItems: 'center',
              gap: 8,
            }}>
              📄 {fileName}
              <span style={{ opacity: 0.5 }}>×</span>
            </div>
          </div>

          {/* Code Editor */}
          <div style={{
            flex: 1,
            overflow: 'auto',
            padding: '16px',
            color: textColor,
            lineHeight: 1.6,
          }}>
            <pre style={{ margin: 0, fontFamily: 'inherit' }}>
              <code dangerouslySetInnerHTML={{ __html: highlightCode(code) }} />
            </pre>
          </div>
        </div>
      </div>

      {/* Status Bar */}
      <div style={{
        height: 22,
        background: isDark ? '#007acc' : '#007acc',
        color: '#ffffff',
        display: 'flex',
        alignItems: 'center',
        padding: '0 12px',
        fontSize: 11,
        gap: 16,
      }}>
        <span>🌿 main*</span>
        <span style={{ marginLeft: 'auto' }}>Ln 42, Col 18</span>
        <span>UTF-8</span>
        <span>TypeScript</span>
        <span>Prettier</span>
      </div>
    </div>
  );
}

// 终端界面组件
function TerminalView({ output, colors }) {
  return (
    <div style={{
      width: '100%',
      height: '100%',
      background: '#1e1e1e',
      borderRadius: 8,
      overflow: 'hidden',
      display: 'flex',
      flexDirection: 'column',
      fontFamily: 'Consolas, Monaco, "Courier New", monospace',
      fontSize: 13,
    }}>
      {/* Title Bar */}
      <div style={{
        height: 30,
        background: '#2d2d2d',
        display: 'flex',
        alignItems: 'center',
        padding: '0 12px',
        gap: 8,
      }}>
        <div style={{ display: 'flex', gap: 6 }}>
          <span style={{ width: 12, height: 12, borderRadius: '50%', background: '#ff5f56' }} />
          <span style={{ width: 12, height: 12, borderRadius: '50%', background: '#ffbd2e' }} />
          <span style={{ width: 12, height: 12, borderRadius: '50%', background: '#27ca40' }} />
        </div>
        <span style={{ flex: 1, textAlign: 'center', color: '#cccccc', fontSize: 12 }}>
          Terminal — zsh
        </span>
      </div>

      {/* Terminal Content */}
      <div style={{
        flex: 1,
        padding: '12px 16px',
        color: '#cccccc',
        overflow: 'auto',
        whiteSpace: 'pre-wrap',
        lineHeight: 1.5,
      }}>
        <div>
          <span style={{ color: '#27ca40' }}>➜</span>{' '}
          <span style={{ color: '#5ccfe6' }}>~/Projects/my-app</span>{' '}
          <span style={{ color: '#f5a97f' }}>git:(main)</span>{' '}
          <span style={{ color: '#ed8796' }}>✗</span>
        </div>
        <div style={{ marginTop: 8, color: '#cccccc' }}>{output}</div>
        <div style={{ marginTop: 12 }}>
          <span style={{ color: '#27ca40' }}>➜</span>{' '}
          <span style={{ color: '#5ccfe6' }}>~/Projects/my-app</span>{' '}
          <span style={{ color: '#f5a97f' }}>git:(main)</span>{' '}
          <span className="cursor" style={{
            display: 'inline-block',
            width: 8,
            height: 16,
            background: '#cccccc',
            animation: 'blink 1s step-end infinite',
          }} />
        </div>
      </div>

      <style>{`
        @keyframes blink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0; }
        }
      `}</style>
    </div>
  );
}

export default function FakeScreen({ isOpen, onClose }) {
  const { colors } = useTheme();
  const [mode, setMode] = useState('ide'); // 'ide' | 'terminal'
  const [codeType, setCodeType] = useState('react');
  const [ideType, setIdeType] = useState('vscode');
  const [terminalOutput, setTerminalOutput] = useState(TERMINAL_OUTPUTS[0]);

  const currentCode = CODE_TEMPLATES[codeType] || CODE_TEMPLATES.react;
  const fileNames = {
    react: 'UserDashboard.tsx',
    vue: 'App.vue',
    node: 'server.js',
    python: 'fetcher.py',
    java: 'UserService.java',
    sql: 'schema.sql',
  };

  // 键盘快捷键
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!isOpen) return;
      if (e.key === 'Escape') {
        onClose();
      }
      if (e.key === '`' && !e.repeat) {
        e.preventDefault();
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.3)',
        backdropFilter: 'blur(20px)',
        zIndex: 9999,
        display: 'flex',
        flexDirection: 'column',
        padding: 40,
        gap: 16,
      }}
      onClick={onClose}
    >
      {/* Control Bar */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 16,
          padding: '12px 20px',
          background: colors.cardBg,
          borderRadius: 12,
          border: `1px solid ${colors.border}`,
          boxShadow: `0 4px 20px ${colors.shadow}`,
        }}
        onClick={e => e.stopPropagation()}
      >
        <span style={{ fontSize: 16, fontWeight: 600, color: colors.text }}>
          🎭 截图伪装模式
        </span>
        <div style={{ flex: 1 }} />

        {/* Mode Switch */}
        <div style={{ display: 'flex', gap: 4, background: colors.inputBg, padding: 4, borderRadius: 8 }}>
          {[
            { key: 'ide', label: 'IDE', icon: '💻' },
            { key: 'terminal', label: '终端', icon: '⌨️' },
          ].map(m => (
            <button
              key={m.key}
              onClick={() => setMode(m.key)}
              style={{
                padding: '6px 14px',
                borderRadius: 6,
                border: 'none',
                background: mode === m.key ? colors.accent : 'transparent',
                color: mode === m.key ? '#fff' : colors.textSecondary,
                cursor: 'pointer',
                fontSize: 13,
                fontWeight: 500,
                transition: 'all 0.2s',
              }}
            >
              {m.icon} {m.label}
            </button>
          ))}
        </div>

        {mode === 'ide' && (
          <>
            {/* IDE Type */}
            <select
              value={ideType}
              onChange={(e) => setIdeType(e.target.value)}
              style={{
                padding: '6px 12px',
                borderRadius: 6,
                border: `1px solid ${colors.border}`,
                background: colors.inputBg,
                color: colors.text,
                fontSize: 13,
                cursor: 'pointer',
              }}
            >
              <option value="vscode">VS Code</option>
              <option value="idea">IntelliJ IDEA</option>
            </select>

            {/* Code Type */}
            <select
              value={codeType}
              onChange={(e) => setCodeType(e.target.value)}
              style={{
                padding: '6px 12px',
                borderRadius: 6,
                border: `1px solid ${colors.border}`,
                background: colors.inputBg,
                color: colors.text,
                fontSize: 13,
                cursor: 'pointer',
              }}
            >
              <option value="react">React</option>
              <option value="vue">Vue</option>
              <option value="node">Node.js</option>
              <option value="python">Python</option>
              <option value="java">Java</option>
              <option value="sql">SQL</option>
            </select>
          </>
        )}

        {mode === 'terminal' && (
          <select
            value={terminalOutput}
            onChange={(e) => setTerminalOutput(e.target.value)}
            style={{
              padding: '6px 12px',
              borderRadius: 6,
              border: `1px solid ${colors.border}`,
              background: colors.inputBg,
              color: colors.text,
              fontSize: 13,
              cursor: 'pointer',
            }}
          >
            {TERMINAL_OUTPUTS.map((output, idx) => (
              <option key={idx} value={output}>
                终端输出 {idx + 1}
              </option>
            ))}
          </select>
        )}

        <div style={{ width: 1, height: 24, background: colors.border }} />

        <button
          onClick={onClose}
          style={{
            padding: '6px 16px',
            borderRadius: 6,
            border: 'none',
            background: colors.accent,
            color: '#fff',
            cursor: 'pointer',
            fontSize: 13,
            fontWeight: 500,
          }}
        >
          退出 (ESC/`)
        </button>
      </div>

      {/* Main Content */}
      <div
        style={{
          flex: 1,
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
        }}
        onClick={e => e.stopPropagation()}
      >
        <div style={{ width: '100%', height: '100%', maxWidth: 1400 }}>
          {mode === 'ide' ? (
            <IDEView
              code={currentCode}
              ideType={ideType}
              fileName={fileNames[codeType]}
              colors={colors}
            />
          ) : (
            <TerminalView output={terminalOutput} colors={colors} />
          )}
        </div>
      </div>

      {/* Hint */}
      <div style={{ textAlign: 'center', color: colors.textMuted, fontSize: 12 }}>
        按 ESC 或 ` 键快速退出伪装模式
      </div>
    </div>
  );
}
