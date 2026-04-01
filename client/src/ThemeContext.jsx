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

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(() => {
    try {
      return localStorage.getItem(STORAGE_KEY) || 'dark'
    } catch {
      return 'dark'
    }
  })

  const isDark = theme === 'dark'
  const colors = themes[theme]

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, theme)
    } catch {}
  }, [theme])

  const toggleTheme = () => setTheme((t) => (t === 'dark' ? 'light' : 'dark'))

  return (
    <ThemeContext.Provider value={{ theme, colors, toggleTheme, isDark }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  const ctx = useContext(ThemeContext)
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider')
  return ctx
}
