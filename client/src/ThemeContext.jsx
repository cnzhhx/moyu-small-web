import { createContext, useContext, useState, useEffect } from 'react'

const STORAGE_KEY = 'moyu-theme'

const themes = {
  dark: {
    bg: '#1a1a2e', cardBg: '#16213e', sidebarBg: '#0d1025', headerBg: '#0d1025',
    border: '#0f3460', accent: '#e94560', accentLight: 'rgba(233,69,96,0.15)',
    text: '#e0e0e0', textSecondary: '#888', textMuted: '#555',
    hover: 'rgba(233,69,96,0.08)', scrollTrack: '#1a1a2e', scrollThumb: '#0f3460',
    inputBg: '#1a1a2e', shadow: 'rgba(0,0,0,0.3)',
  },
  light: {
    bg: '#f0f2f5', cardBg: '#ffffff', sidebarBg: '#ffffff', headerBg: '#ffffff',
    border: '#e4e6eb', accent: '#e94560', accentLight: 'rgba(233,69,96,0.08)',
    text: '#1a1a2e', textSecondary: '#65676b', textMuted: '#8a8d91',
    hover: 'rgba(233,69,96,0.05)', scrollTrack: '#f0f2f5', scrollThumb: '#ccc',
    inputBg: '#f0f2f5', shadow: 'rgba(0,0,0,0.08)',
  },
}

const ThemeContext = createContext()

function getSystemTheme() {
  if (typeof window === 'undefined') return 'dark'
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(() => {
    try {
      return localStorage.getItem(STORAGE_KEY) || 'system'
    } catch {
      return 'system'
    }
  })

  const [resolvedTheme, setResolvedTheme] = useState(() => {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved && saved !== 'system') return saved
    return getSystemTheme()
  })

  const isDark = resolvedTheme === 'dark'
  const colors = themes[resolvedTheme]

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, theme)
    } catch {}
  }, [theme])

  // 监听系统主题变化
  useEffect(() => {
    if (theme !== 'system') {
      setResolvedTheme(theme)
      return
    }
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    setResolvedTheme(getSystemTheme())
    const handler = (e) => setResolvedTheme(e.matches ? 'dark' : 'light')
    mediaQuery.addEventListener('change', handler)
    return () => mediaQuery.removeEventListener('change', handler)
  }, [theme])

  const toggleTheme = () => setTheme((t) => (t === 'dark' ? 'light' : 'dark'))
  const setThemeMode = (mode) => setTheme(mode)

  return (
    <ThemeContext.Provider value={{ theme, resolvedTheme, colors, toggleTheme, setThemeMode, isDark }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  const ctx = useContext(ThemeContext)
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider')
  return ctx
}
