import { useState, useEffect, useCallback, createContext, useContext } from 'react'
import { useTheme } from './ThemeContext.jsx'
import './App.css'
import Sidebar from './components/Sidebar.jsx'
import Header from './components/Header.jsx'
import HotList from './components/HotList.jsx'
import TodoList from './components/TodoList.jsx'
import ToolBox from './components/ToolBox.jsx'

// Toast Context
const ToastContext = createContext(null)
export const useToast = () => useContext(ToastContext)

// Toast Component
function Toast({ message, type, onClose, colors }) {
  useEffect(() => {
    const timer = setTimeout(onClose, 3000)
    return () => clearTimeout(timer)
  }, [onClose])

  const icon = type === 'success' ? '✓' : type === 'error' ? '✕' : 'ℹ'
  const bgColor = type === 'success' ? '#22c55e' : type === 'error' ? '#ef4444' : colors.accent

  return (
    <div style={{
      position: 'fixed', bottom: 24, right: 24, zIndex: 10000,
      display: 'flex', alignItems: 'center', gap: 10,
      padding: '14px 20px', borderRadius: 12,
      background: colors.cardBg, color: colors.text,
      border: `1px solid ${colors.border}`,
      boxShadow: `0 8px 30px ${colors.shadow}`,
      animation: 'toastSlideIn 0.3s ease-out',
    }}>
      <style>{`
        @keyframes toastSlideIn {
          from { transform: translateX(100%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
        @keyframes toastSlideOut {
          from { transform: translateX(0); opacity: 1; }
          to { transform: translateX(100%); opacity: 0; }
        }
      `}</style>
      <span style={{
        width: 24, height: 24, borderRadius: '50%',
        background: bgColor, color: '#fff',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 14, fontWeight: 'bold',
      }}>{icon}</span>
      <span style={{ fontSize: 14, fontWeight: 500 }}>{message}</span>
    </div>
  )
}

// Toast Provider Component
function ToastProvider({ children, colors }) {
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
          colors={colors}
        />
      )}
    </ToastContext.Provider>
  )
}

// 快捷键上下文
export const useShortcutContext = () => {
  const [searchOpen, setSearchOpen] = useState(false)
  const [activeModal, setActiveModal] = useState(null)
  const [hotlistData, setHotlistData] = useState(null)
  return { searchOpen, setSearchOpen, activeModal, setActiveModal, hotlistData, setHotlistData }
}

function App() {
  const [activePage, setActivePage] = useState('home')
  const [searchOpen, setSearchOpen] = useState(false)
  const [showShortcuts, setShowShortcuts] = useState(false)
  const { colors } = useTheme()

  // 键盘快捷键处理
  useEffect(() => {
    const handleKeyDown = (e) => {
      const isMod = e.metaKey || e.ctrlKey

      // Ctrl/Cmd + K 打开搜索
      if (isMod && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        if (activePage === 'tools') {
          setSearchOpen(true)
        }
      }

      // Ctrl/Cmd + 1/2/3 切换页面
      if (isMod && ['1', '2', '3'].includes(e.key)) {
        e.preventDefault()
        const pages = ['home', 'todo', 'tools']
        setActivePage(pages[parseInt(e.key) - 1])
      }

      // ESC 关闭弹窗
      if (e.key === 'Escape') {
        setSearchOpen(false)
        setShowShortcuts(false)
        // 触发全局事件让其他组件关闭弹窗
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

  const renderPage = () => {
    switch (activePage) {
      case 'home':
        return <HotList />
      case 'todo':
        return <TodoList />
      case 'tools':
        return <ToolBox searchOpen={searchOpen} onSearchChange={handleToolBoxSearch} />
      default:
        return <HotList />
    }
  }

  // 快捷键帮助弹窗
  const ShortcutModal = () => {
    if (!showShortcuts) return null
    const shortcuts = [
      { key: 'Ctrl/Cmd + K', desc: '工具箱搜索' },
      { key: 'Ctrl/Cmd + 1', desc: '切换到首页' },
      { key: 'Ctrl/Cmd + 2', desc: '切换到待办' },
      { key: 'Ctrl/Cmd + 3', desc: '切换到工具箱' },
      { key: 'ESC', desc: '关闭弹窗' },
      { key: '?', desc: '显示快捷键帮助' },
    ]
    return (
      <div style={{
        position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000,
      }} onClick={() => setShowShortcuts(false)}>
        <div style={{
          background: colors.cardBg, borderRadius: 12, padding: 24,
          border: `1px solid ${colors.border}`, maxWidth: 400, width: '90%',
          boxShadow: `0 4px 20px ${colors.shadow}`,
        }} onClick={e => e.stopPropagation()}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
            <h3 style={{ margin: 0, color: colors.text }}>⌨️ 键盘快捷键</h3>
            <button onClick={() => setShowShortcuts(false)} style={{
              background: 'none', border: 'none', color: colors.textSecondary,
              fontSize: 20, cursor: 'pointer', padding: '4px 8px',
            }}>✕</button>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {shortcuts.map((s, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ color: colors.textSecondary, fontSize: 14 }}>{s.desc}</span>
                <kbd style={{
                  background: colors.inputBg, color: colors.text, padding: '4px 10px',
                  borderRadius: 6, fontSize: 12, fontFamily: 'monospace',
                  border: `1px solid ${colors.border}`,
                }}>{s.key}</kbd>
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <ToastProvider colors={colors}>
      <div className="app-layout" style={{ background: colors.bg, color: colors.text }}>
        <Sidebar activePage={activePage} onNavigate={setActivePage} />
        <div className="main-area">
          <Header onShowShortcuts={() => setShowShortcuts(true)} />
          <div className="content-area">
            {renderPage()}
          </div>
        </div>
        <ShortcutModal />
      </div>
    </ToastProvider>
  )
}

export default App
