import { useState, useEffect, useCallback, createContext, useContext } from 'react'
import { useTheme } from './ThemeContext.jsx'
import './App.css'
import Sidebar from './components/Sidebar.jsx'
import Header from './components/Header.jsx'
import HotList from './components/HotList.jsx'
import TodoList from './components/TodoList.jsx'
import ToolBox from './components/ToolBox.jsx'
import FakeScreen from './components/FakeScreen.jsx'
import GameCenter from './components/GameCenter.jsx'
import { XIcon, KeyboardIcon } from './components/Icons.jsx'

// Toast Context
const ToastContext = createContext(null)
export const useToast = () => useContext(ToastContext)

// Toast Component - Glassmorphism Style
function Toast({ message, type, onClose, theme, tokens }) {
  useEffect(() => {
    const timer = setTimeout(onClose, 4000)
    return () => clearTimeout(timer)
  }, [onClose])

  const icons = {
    success: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
        <polyline points="22 4 12 14.01 9 11.01" />
      </svg>
    ),
    error: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" />
        <line x1="15" y1="9" x2="9" y2="15" />
        <line x1="9" y1="9" x2="15" y2="15" />
      </svg>
    ),
    info: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={theme.accent.primary} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" />
        <line x1="12" y1="16" x2="12" y2="12" />
        <line x1="12" y1="8" x2="12.01" y2="8" />
      </svg>
    ),
  }

  const colors = {
    success: '#22c55e',
    error: '#ef4444',
    info: theme.accent.primary,
  }

  return (
    <div
      style={{
        position: 'fixed',
        bottom: '24px',
        right: '24px',
        zIndex: 1000,
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        padding: '16px 20px',
        borderRadius: tokens.borderRadius.lg,
        background: theme.glass.background,
        backdropFilter: theme.glass.blur,
        border: `1px solid ${type === 'success' ? colors.success + '40' : type === 'error' ? colors.error + '40' : theme.accent.primary + '40'}`,
        boxShadow: theme.shadow.lg,
        animation: 'toastSlideIn 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
        maxWidth: '400px',
        minWidth: '280px',
      }}
      role="alert"
      aria-live="polite"
    >
      {/* Icon */}
      <div
        style={{
          width: '36px',
          height: '36px',
          borderRadius: tokens.borderRadius.base,
          background: `${colors[type]}15`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
        }}
      >
        {icons[type]}
      </div>

      {/* Message */}
      <span
        style={{
          flex: 1,
          fontSize: tokens.typography.fontSize.sm,
          color: theme.text.primary,
          fontWeight: tokens.typography.fontWeight.medium,
          lineHeight: 1.5,
        }}
      >
        {message}
      </span>

      {/* Close Button */}
      <button
        onClick={onClose}
        style={{
          width: '28px',
          height: '28px',
          borderRadius: tokens.borderRadius.base,
          background: 'transparent',
          border: 'none',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          opacity: 0.6,
          transition: `opacity ${tokens.animation.duration.fast} ease`,
        }}
        onMouseEnter={(e) => { e.currentTarget.style.opacity = '1' }}
        onMouseLeave={(e) => { e.currentTarget.style.opacity = '0.6' }}
        aria-label="关闭通知"
      >
        <XIcon size={18} color={theme.text.secondary} />
      </button>
    </div>
  )
}

// Toast Provider
function ToastProvider({ children }) {
  const { theme, tokens } = useTheme()
  const [toast, setToast] = useState(null)

  const showToast = useCallback((message, type = 'info') => {
    setToast({ message, type })
  }, [])

  const hideToast = useCallback(() => {
    setToast(null)
  }, [])

  return (
    <ToastContext.Provider value={showToast}>
      {children}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={hideToast}
          theme={theme}
          tokens={tokens}
        />
      )}
    </ToastContext.Provider>
  )
}

// 快捷键帮助弹窗
function ShortcutModal({ isOpen, onClose, theme, tokens }) {
  if (!isOpen) return null

  const shortcuts = [
    { key: '` 或 F12', desc: '切换伪装模式（老板键）', icon: '👻' },
    { key: 'Ctrl/Cmd + K', desc: '工具箱搜索', icon: '🔍' },
    { key: 'Ctrl/Cmd + 1', desc: '切换到首页', icon: '🏠' },
    { key: 'Ctrl/Cmd + 2', desc: '切换到待办', icon: '✓' },
    { key: 'Ctrl/Cmd + 3', desc: '切换到工具箱', icon: '🔧' },
    { key: 'Ctrl/Cmd + 4', desc: '切换到游戏中心', icon: '🎮' },
    { key: 'ESC', desc: '关闭弹窗', icon: '✕' },
    { key: '?', desc: '显示快捷键帮助', icon: '?' },
  ]

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: theme.bg.overlay,
        backdropFilter: 'blur(8px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 500,
        animation: 'fadeIn 0.2s ease',
        padding: '20px',
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: theme.bg.elevated,
          borderRadius: tokens.borderRadius.xl,
          border: `1px solid ${theme.border.default}`,
          boxShadow: theme.shadow['2xl'],
          maxWidth: '480px',
          width: '100%',
          maxHeight: '80vh',
          overflow: 'hidden',
          animation: 'scaleIn 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            padding: '24px',
            borderBottom: `1px solid ${theme.border.default}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div
              style={{
                width: '40px',
                height: '40px',
                borderRadius: tokens.borderRadius.md,
                background: `${theme.accent.primary}15`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <KeyboardIcon size={22} color={theme.accent.primary} />
            </div>
            <div>
              <h2
                style={{
                  fontSize: tokens.typography.fontSize.lg,
                  fontWeight: tokens.typography.fontWeight.bold,
                  color: theme.text.primary,
                }}
              >
                键盘快捷键
              </h2>
              <p
                style={{
                  fontSize: tokens.typography.fontSize.xs,
                  color: theme.text.tertiary,
                  marginTop: '2px',
                }}
              >
                高效操作，快人一步
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              width: '36px',
              height: '36px',
              borderRadius: tokens.borderRadius.md,
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: `background ${tokens.animation.duration.fast} ease`,
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = theme.bg.tertiary }}
            onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent' }}
            aria-label="关闭"
          >
            <XIcon size={20} color={theme.text.secondary} />
          </button>
        </div>

        {/* Shortcuts List */}
        <div
          style={{
            padding: '16px',
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
            maxHeight: '400px',
            overflowY: 'auto',
          }}
        >
          {shortcuts.map((shortcut, index) => (
            <div
              key={index}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '12px 16px',
                borderRadius: tokens.borderRadius.md,
                background: index % 2 === 0 ? theme.bg.secondary : 'transparent',
                transition: `background ${tokens.animation.duration.fast} ease`,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <span style={{ fontSize: '18px' }}>{shortcut.icon}</span>
                <span
                  style={{
                    fontSize: tokens.typography.fontSize.sm,
                    color: theme.text.secondary,
                  }}
                >
                  {shortcut.desc}
                </span>
              </div>
              <kbd
                style={{
                  padding: '6px 12px',
                  borderRadius: tokens.borderRadius.base,
                  background: theme.bg.tertiary,
                  border: `1px solid ${theme.border.default}`,
                  fontSize: tokens.typography.fontSize.xs,
                  fontFamily: tokens.typography.fontFamily.mono,
                  color: theme.text.primary,
                  fontWeight: tokens.typography.fontWeight.semibold,
                  whiteSpace: 'nowrap',
                }}
              >
                {shortcut.key}
              </kbd>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div
          style={{
            padding: '16px 24px',
            borderTop: `1px solid ${theme.border.default}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <span
            style={{
              fontSize: tokens.typography.fontSize.xs,
              color: theme.text.tertiary,
            }}
          >
            按 <kbd style={{ padding: '2px 6px', borderRadius: '4px', background: theme.bg.tertiary, margin: '0 4px' }}>?</kbd> 随时打开此帮助
          </span>
        </div>
      </div>
    </div>
  )
}

// Main App Component
function App() {
  const [activePage, setActivePage] = useState('home')
  const [searchOpen, setSearchOpen] = useState(false)
  const [showShortcuts, setShowShortcuts] = useState(false)
  const [fakeScreenOpen, setFakeScreenOpen] = useState(false)
  const { theme, tokens } = useTheme()

  // 键盘快捷键处理
  useEffect(() => {
    const handleKeyDown = (e) => {
      const isMod = e.metaKey || e.ctrlKey

      // ` 键切换伪装模式（老板键）
      if (e.key === '`' && !e.repeat) {
        e.preventDefault()
        setFakeScreenOpen(prev => !prev)
        return
      }

      // F12 也作为老板键
      if (e.key === 'F12') {
        e.preventDefault()
        setFakeScreenOpen(prev => !prev)
        return
      }

      // Ctrl/Cmd + K 打开搜索
      if (isMod && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        if (activePage === 'tools') {
          setSearchOpen(true)
        }
      }

      // Ctrl/Cmd + 1/2/3/4 切换页面
      if (isMod && ['1', '2', '3', '4'].includes(e.key)) {
        e.preventDefault()
        const pages = ['home', 'todo', 'tools', 'games']
        const pageIndex = parseInt(e.key) - 1
        if (pageIndex < pages.length) {
          setActivePage(pages[pageIndex])
        }
      }

      // ESC 关闭弹窗
      if (e.key === 'Escape') {
        setSearchOpen(false)
        setShowShortcuts(false)
        window.dispatchEvent(new CustomEvent('closeModal'))
      }

      // ? 显示快捷键帮助
      if (e.key === '?' && !isMod && !e.shiftKey && !e.altKey) {
        const target = e.target
        if (target.tagName !== 'INPUT' && target.tagName !== 'TEXTAREA' && !target.isContentEditable) {
          e.preventDefault()
          setShowShortcuts(true)
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [activePage])

  // 从 ToolBox 传递搜索状态
  const handleToolBoxSearch = useCallback((searchState) => {
    setSearchOpen(searchState)
  }, [])

  // 页面内容
  const renderPage = () => {
    switch (activePage) {
      case 'home':
        return <HotList />
      case 'todo':
        return <TodoList />
      case 'tools':
        return <ToolBox searchOpen={searchOpen} onSearchChange={handleToolBoxSearch} />
      case 'games':
        return <GameCenter />
      default:
        return <HotList />
    }
  }

  return (
    <ToastProvider>
      <div
        className="app-layout"
        style={{
          display: 'flex',
          height: '100vh',
          overflow: 'hidden',
          background: theme.bg.primary,
        }}
      >
        {/* Sidebar */}
        <Sidebar activePage={activePage} onNavigate={setActivePage} />

        {/* Main Content Area */}
        <div
          className="main-area"
          style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            minWidth: 0,
          }}
        >
          {/* Header */}
          <Header onShowShortcuts={() => setShowShortcuts(true)} />

          {/* Page Content */}
          <div
            className="content-area"
            style={{
              flex: 1,
              overflow: 'auto',
              position: 'relative',
              padding: '20px',
            }}
          >
            <div className="page-enter" key={activePage}>
              {renderPage()}
            </div>
          </div>
        </div>

        {/* Modals */}
        <ShortcutModal
          isOpen={showShortcuts}
          onClose={() => setShowShortcuts(false)}
          theme={theme}
          tokens={tokens}
        />

        <FakeScreen isOpen={fakeScreenOpen} onClose={() => setFakeScreenOpen(false)} />
      </div>
    </ToastProvider>
  )
}

export default App
