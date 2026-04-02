import { createContext, useContext, useState, useEffect, useMemo } from 'react'

const STORAGE_KEY = 'moyu-theme-v2'

// Design System Tokens - 专业级设计系统
// 基于 UI/UX Pro Max: 工具+娱乐混合应用，采用现代 Glassmorphism + Neobrutalism 混合风格

const designTokens = {
  // 核心颜色 - 珊瑚橙主色，适合工具+娱乐
  colors: {
    coral: {
      50: '#fff1f0',
      100: '#ffe4e1',
      200: '#ffccc7',
      300: '#ffa39e',
      400: '#ff7875',
      500: '#ff6b6b', // 主色
      600: '#f75959',
      700: '#cf3c3c',
      800: '#a83232',
      900: '#8c2b2b',
    },
    ocean: {
      50: '#f0f9ff',
      100: '#e0f2fe',
      200: '#bae6fd',
      300: '#7dd3fc',
      400: '#38bdf8',
      500: '#0ea5e9', // 次要色
      600: '#0284c7',
      700: '#0369a1',
      800: '#075985',
      900: '#0c4a6e',
    },
    gray: {
      0: '#ffffff',
      50: '#f8fafc',
      100: '#f1f5f9',
      200: '#e2e8f0',
      300: '#cbd5e1',
      400: '#94a3b8',
      500: '#64748b',
      600: '#475569',
      700: '#334155',
      800: '#1e293b',
      900: '#0f172a',
      950: '#020617',
    },
    success: '#22c55e',
    warning: '#f59e0b',
    error: '#ef4444',
    info: '#3b82f6',
  },

  // 间距系统 - 4px 基准
  spacing: {
    0: '0',
    1: '4px',
    2: '8px',
    3: '12px',
    4: '16px',
    5: '20px',
    6: '24px',
    8: '32px',
    10: '40px',
    12: '48px',
    16: '64px',
    20: '80px',
    24: '96px',
  },

  // 字体系统
  typography: {
    fontFamily: {
      sans: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, "Noto Sans SC", sans-serif',
      mono: '"JetBrains Mono", "Fira Code", "SF Mono", Consolas, monospace',
    },
    fontSize: {
      xs: '12px',
      sm: '14px',
      base: '16px',
      lg: '18px',
      xl: '20px',
      '2xl': '24px',
      '3xl': '30px',
      '4xl': '36px',
    },
    fontWeight: {
      normal: 400,
      medium: 500,
      semibold: 600,
      bold: 700,
    },
    lineHeight: {
      tight: 1.25,
      normal: 1.5,
      relaxed: 1.75,
    },
  },

  // 圆角系统
  borderRadius: {
    none: '0',
    sm: '6px',
    base: '8px',
    md: '12px',
    lg: '16px',
    xl: '24px',
    '2xl': '32px',
    full: '9999px',
  },

  // 阴影系统
  shadows: {
    sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
    base: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px -1px rgba(0, 0, 0, 0.1)',
    md: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -2px rgba(0, 0, 0, 0.1)',
    lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -4px rgba(0, 0, 0, 0.1)',
    xl: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
    '2xl': '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
    glass: '0 8px 32px 0 rgba(0, 0, 0, 0.36)',
    inner: 'inset 0 2px 4px 0 rgba(0, 0, 0, 0.05)',
  },

  // 动画系统
  animation: {
    duration: {
      fast: '150ms',
      normal: '250ms',
      slow: '350ms',
    },
    easing: {
      default: 'cubic-bezier(0.4, 0, 0.2, 1)',
      bounce: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
      smooth: 'cubic-bezier(0.16, 1, 0.3, 1)',
    },
  },

  // Z-Index 层级
  zIndex: {
    base: 0,
    dropdown: 100,
    sticky: 200,
    fixed: 300,
    modalBackdrop: 400,
    modal: 500,
    popover: 600,
    tooltip: 700,
    toast: 800,
  },
}

// 深色主题 - Glassmorphism 风格
const darkTheme = {
  name: 'dark',
  // 背景色 - 深蓝灰，有层次感
  bg: {
    primary: '#0a0f1a',      // 主背景
    secondary: '#0d1321',    // 次要背景
    tertiary: '#111827',     // 第三层背景
    elevated: '#1a2332',     // 提升层（卡片、弹窗）
    overlay: 'rgba(0, 0, 0, 0.7)', // 遮罩层
  },
  // 文字色 - 高对比度
  text: {
    primary: '#f8fafc',      // 主文字
    secondary: '#94a3b8',    // 次要文字
    tertiary: '#64748b',     // 辅助文字
    disabled: '#475569',     // 禁用文字
    inverse: '#0f172a',      // 反色文字
  },
  // 边框色
  border: {
    default: 'rgba(148, 163, 184, 0.15)',
    hover: 'rgba(148, 163, 184, 0.25)',
    active: 'rgba(255, 107, 107, 0.5)',
  },
  // 强调色
  accent: {
    primary: '#ff6b6b',      // 珊瑚红
    primaryHover: '#ff8585',
    primaryActive: '#f75959',
    secondary: '#0ea5e9',    // 海洋蓝
    secondaryHover: '#38bdf8',
  },
  // 功能色
  status: {
    success: '#22c55e',
    warning: '#f59e0b',
    error: '#ef4444',
    info: '#3b82f6',
  },
  // 渐变
  gradient: {
    primary: 'linear-gradient(135deg, #ff6b6b 0%, #ff8585 100%)',
    secondary: 'linear-gradient(135deg, #0ea5e9 0%, #38bdf8 100%)',
    bg: 'linear-gradient(180deg, #0a0f1a 0%, #0d1321 100%)',
    card: 'linear-gradient(145deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.02) 100%)',
  },
  // Glassmorphism 效果
  glass: {
    background: 'rgba(26, 35, 50, 0.7)',
    backgroundHover: 'rgba(26, 35, 50, 0.85)',
    border: '1px solid rgba(255, 255, 255, 0.08)',
    blur: 'blur(20px) saturate(180%)',
  },
  // 阴影
  shadow: {
    sm: '0 1px 2px rgba(0, 0, 0, 0.3)',
    md: '0 4px 6px rgba(0, 0, 0, 0.4)',
    lg: '0 10px 15px rgba(0, 0, 0, 0.5)',
    xl: '0 20px 25px rgba(0, 0, 0, 0.6)',
    glow: '0 0 20px rgba(255, 107, 107, 0.3)',
  },
}

// 浅色主题
const lightTheme = {
  name: 'light',
  bg: {
    primary: '#f8fafc',
    secondary: '#f1f5f9',
    tertiary: '#e2e8f0',
    elevated: '#ffffff',
    overlay: 'rgba(15, 23, 42, 0.5)',
  },
  text: {
    primary: '#0f172a',
    secondary: '#475569',
    tertiary: '#64748b',
    disabled: '#94a3b8',
    inverse: '#f8fafc',
  },
  border: {
    default: 'rgba(148, 163, 184, 0.2)',
    hover: 'rgba(148, 163, 184, 0.35)',
    active: 'rgba(255, 107, 107, 0.5)',
  },
  accent: {
    primary: '#ff6b6b',
    primaryHover: '#ff5252',
    primaryActive: '#f75959',
    secondary: '#0ea5e9',
    secondaryHover: '#0284c7',
  },
  status: {
    success: '#22c55e',
    warning: '#f59e0b',
    error: '#ef4444',
    info: '#3b82f6',
  },
  gradient: {
    primary: 'linear-gradient(135deg, #ff6b6b 0%, #ff8585 100%)',
    secondary: 'linear-gradient(135deg, #0ea5e9 0%, #38bdf8 100%)',
    bg: 'linear-gradient(180deg, #f8fafc 0%, #f1f5f9 100%)',
    card: 'linear-gradient(145deg, #ffffff 0%, #f8fafc 100%)',
  },
  glass: {
    background: 'rgba(255, 255, 255, 0.8)',
    backgroundHover: 'rgba(255, 255, 255, 0.95)',
    border: '1px solid rgba(255, 255, 255, 0.5)',
    blur: 'blur(20px) saturate(180%)',
  },
  shadow: {
    sm: '0 1px 2px rgba(0, 0, 0, 0.05)',
    md: '0 4px 6px rgba(0, 0, 0, 0.07)',
    lg: '0 10px 15px rgba(0, 0, 0, 0.1)',
    xl: '0 20px 25px rgba(0, 0, 0, 0.15)',
    glow: '0 0 20px rgba(255, 107, 107, 0.2)',
  },
}

const ThemeContext = createContext(null)

function getSystemTheme() {
  if (typeof window === 'undefined') return 'dark'
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

export function ThemeProvider({ children }) {
  const [themeMode, setThemeMode] = useState(() => {
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
  const theme = isDark ? darkTheme : lightTheme

  // 向后兼容的 colors 对象（映射到新主题系统）
  const colors = useMemo(() => ({
    bg: theme.bg.primary,
    cardBg: theme.bg.elevated,
    sidebarBg: theme.bg.secondary,
    headerBg: theme.bg.secondary,
    border: theme.border.default,
    accent: theme.accent.primary,
    accentLight: theme.accent.primary + '20',
    text: theme.text.primary,
    textSecondary: theme.text.secondary,
    textMuted: theme.text.tertiary,
    hover: theme.bg.tertiary,
    scrollTrack: theme.bg.primary,
    scrollThumb: theme.text.tertiary,
    inputBg: theme.bg.tertiary,
    shadow: theme.shadow.md,
  }), [theme])

  // 组合所有设计令牌
  const value = useMemo(() => ({
    themeMode,
    resolvedTheme,
    isDark,
    theme,
    tokens: designTokens,
    colors, // 向后兼容
    setTheme: (mode) => {
      setThemeMode(mode)
      try {
        localStorage.setItem(STORAGE_KEY, mode)
      } catch {}
    },
    toggleTheme: () => {
      const newTheme = resolvedTheme === 'dark' ? 'light' : 'dark'
      setThemeMode(newTheme)
      setResolvedTheme(newTheme)
      try {
        localStorage.setItem(STORAGE_KEY, newTheme)
      } catch {}
    },
  }), [themeMode, resolvedTheme, isDark, theme, colors])

  useEffect(() => {
    if (themeMode === 'system') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
      setResolvedTheme(mediaQuery.matches ? 'dark' : 'light')
      const handler = (e) => setResolvedTheme(e.matches ? 'dark' : 'light')
      mediaQuery.addEventListener('change', handler)
      return () => mediaQuery.removeEventListener('change', handler)
    }
  }, [themeMode])

  // 设置 CSS 变量
  useEffect(() => {
    const root = document.documentElement
    const t = theme
    
    // 背景色
    root.style.setProperty('--bg-primary', t.bg.primary)
    root.style.setProperty('--bg-secondary', t.bg.secondary)
    root.style.setProperty('--bg-tertiary', t.bg.tertiary)
    root.style.setProperty('--bg-elevated', t.bg.elevated)
    
    // 文字色
    root.style.setProperty('--text-primary', t.text.primary)
    root.style.setProperty('--text-secondary', t.text.secondary)
    root.style.setProperty('--text-tertiary', t.text.tertiary)
    root.style.setProperty('--text-disabled', t.text.disabled)
    
    // 强调色
    root.style.setProperty('--accent-primary', t.accent.primary)
    root.style.setProperty('--accent-primary-hover', t.accent.primaryHover)
    root.style.setProperty('--accent-secondary', t.accent.secondary)
    
    // 边框
    root.style.setProperty('--border-default', t.border.default)
    root.style.setProperty('--border-hover', t.border.hover)
    
    // 阴影
    root.style.setProperty('--shadow-sm', t.shadow.sm)
    root.style.setProperty('--shadow-md', t.shadow.md)
    root.style.setProperty('--shadow-lg', t.shadow.lg)
    root.style.setProperty('--shadow-glow', t.shadow.glow)
    
    // Glass
    root.style.setProperty('--glass-bg', t.glass.background)
    root.style.setProperty('--glass-border', t.glass.border)
    root.style.setProperty('--glass-blur', t.glass.blur)
  }, [theme])

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  const ctx = useContext(ThemeContext)
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider')
  return ctx
}

export { designTokens, darkTheme, lightTheme }
