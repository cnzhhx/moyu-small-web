import { createContext, useContext, useState, useEffect } from 'react'

const STORAGE_KEY = 'moyu-theme'

const themes = {
  dark: {
    // 基础颜色
    primary: '#0F172A',
    secondary: '#1E293B',
    background: '#020617',
    text: '#F8FAFC',

    // 背景层级
    bg: '#020617',
    bgSecondary: '#0F172A',
    bgTertiary: '#1E293B',
    cardBg: '#1E293B',
    sidebarBg: '#0F172A',
    headerBg: '#0F172A',

    // 边框与分割线
    border: '#334155',
    borderLight: '#1E293B',
    divider: 'rgba(148, 163, 184, 0.1)',

    // CTA/Accent (积极操作)
    accent: '#22C55E',
    accentHover: '#16A34A',
    accentLight: 'rgba(34, 197, 94, 0.15)',
    accentMuted: 'rgba(34, 197, 94, 0.08)',

    // 文字颜色
    textPrimary: '#F8FAFC',
    textSecondary: '#94A3B8',
    textMuted: '#64748B',
    textDisabled: '#475569',

    // 语义化颜色
    success: '#22C55E',
    successLight: 'rgba(34, 197, 94, 0.15)',
    warning: '#F59E0B',
    warningLight: 'rgba(245, 158, 11, 0.15)',
    info: '#3B82F6',
    infoLight: 'rgba(59, 130, 246, 0.15)',
    error: '#EF4444',
    errorLight: 'rgba(239, 68, 68, 0.15)',

    // 交互状态
    hover: 'rgba(34, 197, 94, 0.08)',
    active: 'rgba(34, 197, 94, 0.15)',
    disabled: '#374151',
    focus: 'rgba(34, 197, 94, 0.25)',

    // 滚动条
    scrollTrack: '#0F172A',
    scrollThumb: '#334155',

    // 输入框
    inputBg: '#0F172A',
    inputBorder: '#334155',
    inputFocus: '#22C55E',

    // 渐变色
    gradientPrimary: 'linear-gradient(135deg, #0F172A 0%, #1E293B 100%)',
    gradientAccent: 'linear-gradient(135deg, #22C55E 0%, #16A34A 100%)',
    gradientCard: 'linear-gradient(180deg, #1E293B 0%, #0F172A 100%)',
    gradientHeader: 'linear-gradient(180deg, #0F172A 0%, #020617 100%)',
    gradientSuccess: 'linear-gradient(135deg, #22C55E 0%, #16A34A 100%)',
    gradientWarning: 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)',
    gradientError: 'linear-gradient(135deg, #EF4444 0%, #DC2626 100%)',
    gradientInfo: 'linear-gradient(135deg, #3B82F6 0%, #2563EB 100%)',

    // 阴影
    shadow: 'rgba(0, 0, 0, 0.5)',
    shadowSm: '0 1px 2px rgba(0, 0, 0, 0.3)',
    shadowMd: '0 4px 6px rgba(0, 0, 0, 0.4)',
    shadowLg: '0 10px 15px rgba(0, 0, 0, 0.5)',
    shadowXl: '0 20px 25px rgba(0, 0, 0, 0.6)',
    shadowAccent: '0 4px 14px rgba(34, 197, 94, 0.25)',
    shadowGlow: '0 0 20px rgba(34, 197, 94, 0.3)',

    // 兼容旧变量
    text: '#F8FAFC',
  },
  light: {
    // 基础颜色
    primary: '#0F172A',
    secondary: '#1E293B',
    background: '#F8FAFC',
    text: '#0F172A',

    // 背景层级
    bg: '#F8FAFC',
    bgSecondary: '#F1F5F9',
    bgTertiary: '#E2E8F0',
    cardBg: '#FFFFFF',
    sidebarBg: '#FFFFFF',
    headerBg: '#FFFFFF',

    // 边框与分割线
    border: '#E2E8F0',
    borderLight: '#F1F5F9',
    divider: 'rgba(15, 23, 42, 0.1)',

    // CTA/Accent (积极操作)
    accent: '#22C55E',
    accentHover: '#16A34A',
    accentLight: 'rgba(34, 197, 94, 0.1)',
    accentMuted: 'rgba(34, 197, 94, 0.05)',

    // 文字颜色
    textPrimary: '#0F172A',
    textSecondary: '#475569',
    textMuted: '#64748B',
    textDisabled: '#94A3B8',

    // 语义化颜色
    success: '#22C55E',
    successLight: 'rgba(34, 197, 94, 0.1)',
    warning: '#F59E0B',
    warningLight: 'rgba(245, 158, 11, 0.1)',
    info: '#3B82F6',
    infoLight: 'rgba(59, 130, 246, 0.1)',
    error: '#EF4444',
    errorLight: 'rgba(239, 68, 68, 0.1)',

    // 交互状态
    hover: 'rgba(34, 197, 94, 0.05)',
    active: 'rgba(34, 197, 94, 0.1)',
    disabled: '#E2E8F0',
    focus: 'rgba(34, 197, 94, 0.2)',

    // 滚动条
    scrollTrack: '#F1F5F9',
    scrollThumb: '#CBD5E1',

    // 输入框
    inputBg: '#FFFFFF',
    inputBorder: '#E2E8F0',
    inputFocus: '#22C55E',

    // 渐变色
    gradientPrimary: 'linear-gradient(135deg, #0F172A 0%, #1E293B 100%)',
    gradientAccent: 'linear-gradient(135deg, #22C55E 0%, #16A34A 100%)',
    gradientCard: 'linear-gradient(180deg, #FFFFFF 0%, #F8FAFC 100%)',
    gradientHeader: 'linear-gradient(180deg, #FFFFFF 0%, #F1F5F9 100%)',
    gradientSuccess: 'linear-gradient(135deg, #22C55E 0%, #16A34A 100%)',
    gradientWarning: 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)',
    gradientError: 'linear-gradient(135deg, #EF4444 0%, #DC2626 100%)',
    gradientInfo: 'linear-gradient(135deg, #3B82F6 0%, #2563EB 100%)',

    // 阴影
    shadow: 'rgba(15, 23, 42, 0.08)',
    shadowSm: '0 1px 2px rgba(15, 23, 42, 0.05)',
    shadowMd: '0 4px 6px rgba(15, 23, 42, 0.07)',
    shadowLg: '0 10px 15px rgba(15, 23, 42, 0.1)',
    shadowXl: '0 20px 25px rgba(15, 23, 42, 0.15)',
    shadowAccent: '0 4px 14px rgba(34, 197, 94, 0.15)',
    shadowGlow: '0 0 20px rgba(34, 197, 94, 0.2)',

    // 兼容旧变量
    text: '#0F172A',
  },
}

// 动画时长配置
export const animationDuration = {
  fast: '150ms',
  normal: '250ms',
  slow: '400ms',
  verySlow: '600ms',
}

// 过渡曲线配置
export const transitionTiming = {
  ease: 'cubic-bezier(0.4, 0, 0.2, 1)',
  easeIn: 'cubic-bezier(0.4, 0, 1, 1)',
  easeOut: 'cubic-bezier(0, 0, 0.2, 1)',
  easeInOut: 'cubic-bezier(0.4, 0, 0.2, 1)',
  bounce: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
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
