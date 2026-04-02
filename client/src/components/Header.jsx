import { useState, useEffect, useCallback, useRef } from 'react'
import { useTheme } from '../ThemeContext.jsx'
import { RefreshCwIcon, KeyboardIcon, CalendarIcon, ClockIcon } from './Icons.jsx'

export default function Header({ onShowShortcuts }) {
  const { theme, tokens, isDark } = useTheme()
  const [sentence, setSentence] = useState('')
  const [currentTime, setCurrentTime] = useState(new Date())
  const [holiday, setHoliday] = useState(null)
  const [refreshing, setRefreshing] = useState(false)
  const [isScrolled, setIsScrolled] = useState(false)
  const headerRef = useRef(null)

  // 监听滚动
  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = document.querySelector('.content-area')?.scrollTop || 0
      setIsScrolled(scrollTop > 10)
    }
    
    const contentArea = document.querySelector('.content-area')
    if (contentArea) {
      contentArea.addEventListener('scroll', handleScroll)
      return () => contentArea.removeEventListener('scroll', handleScroll)
    }
  }, [])

  // 获取每日一言
  const fetchSentence = useCallback(async () => {
    setRefreshing(true)
    try {
      const res = await fetch('/api/daily/sentence')
      const data = await res.json()
      const d = data.data || data
      if (typeof d === 'string') {
        setSentence(d)
      } else if (d?.content) {
        const from = d.from ? ` —— ${d.from}` : ''
        setSentence(`${d.content}${from}`)
      } else {
        setSentence('今天也要开心工作哦~')
      }
    } catch {
      setSentence('今天也要开心工作哦~')
    } finally {
      setRefreshing(false)
    }
  }, [])

  // 获取假期倒计时
  useEffect(() => {
    fetch('/api/daily/countdown')
      .then(r => r.json())
      .then(data => {
        const d = data.data || data
        const next = d.next || d
        if (next?.name && next?.days !== undefined) {
          setHoliday(next)
        }
      })
      .catch(() => {})
  }, [])

  useEffect(() => {
    fetchSentence()
  }, [fetchSentence])

  // 时间更新
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])

  const timeStr = currentTime.toLocaleTimeString('zh-CN', { 
    hour12: false,
    hour: '2-digit',
    minute: '2-digit',
  })
  const dateStr = currentTime.toLocaleDateString('zh-CN', {
    month: 'short',
    day: 'numeric',
    weekday: 'short',
  })

  return (
    <header
      ref={headerRef}
      style={{
        height: '64px',
        minHeight: '64px',
        background: isScrolled 
          ? theme.glass.background
          : theme.bg.secondary,
        backdropFilter: isScrolled ? theme.glass.blur : 'none',
        borderBottom: `1px solid ${isScrolled ? theme.glass.border : theme.border.default}`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 24px',
        position: 'sticky',
        top: 0,
        zIndex: 50,
        transition: `all ${tokens.animation.duration.normal} ${tokens.animation.easing.smooth}`,
      }}
    >
      {/* 左侧：标题和日期 */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <CalendarIcon size={18} color={theme.text.tertiary} />
          <span
            style={{
              fontSize: tokens.typography.fontSize.sm,
              color: theme.text.secondary,
              fontWeight: tokens.typography.fontWeight.medium,
            }}
          >
            {dateStr}
          </span>
        </div>
      </div>

      {/* 中间：每日一言 */}
      <div
        style={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '12px',
          maxWidth: '600px',
          padding: '0 24px',
        }}
      >
        <span
          style={{
            fontSize: tokens.typography.fontSize.sm,
            color: theme.text.secondary,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            textAlign: 'center',
            fontStyle: 'italic',
          }}
        >
          {sentence || '加载中...'}
        </span>
        <button
          onClick={fetchSentence}
          disabled={refreshing}
          style={{
            width: '28px',
            height: '28px',
            borderRadius: tokens.borderRadius.base,
            background: 'transparent',
            border: 'none',
            cursor: refreshing ? 'not-allowed' : 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            opacity: refreshing ? 0.5 : 0.7,
            transition: `all ${tokens.animation.duration.fast} ease`,
          }}
          aria-label="刷新每日一言"
          title="换一句"
        >
          <RefreshCwIcon
            size={16}
            color={theme.text.tertiary}
            style={{
              animation: refreshing ? 'spin 1s linear infinite' : 'none',
            }}
          />
        </button>
      </div>

      {/* 右侧：功能区域 */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '16px',
        }}
      >
        {/* 假期提醒 */}
        {holiday && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 12px',
              borderRadius: tokens.borderRadius.full,
              background: `linear-gradient(135deg, ${theme.accent.primary}15 0%, ${theme.accent.primary}08 100%)`,
              border: `1px solid ${theme.accent.primary}30`,
            }}
          >
            <span style={{ fontSize: '14px' }}>🎉</span>
            <span
              style={{
                fontSize: tokens.typography.fontSize.xs,
                fontWeight: tokens.typography.fontWeight.medium,
                color: theme.accent.primary,
                whiteSpace: 'nowrap',
              }}
            >
              距{holiday.name}还有 <strong>{holiday.days}</strong> 天
            </span>
          </div>
        )}

        {/* 分隔线 */}
        <div
          style={{
            width: '1px',
            height: '24px',
            background: theme.border.default,
          }}
        />

        {/* 快捷键帮助 */}
        <button
          onClick={onShowShortcuts}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '8px 12px',
            borderRadius: tokens.borderRadius.md,
            background: 'transparent',
            border: `1px solid ${theme.border.default}`,
            cursor: 'pointer',
            transition: `all ${tokens.animation.duration.fast} ease`,
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = theme.accent.primary
            e.currentTarget.style.background = `${theme.accent.primary}10`
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = theme.border.default
            e.currentTarget.style.background = 'transparent'
          }}
          aria-label="查看键盘快捷键"
        >
          <KeyboardIcon size={16} color={theme.text.secondary} />
          <span
            style={{
              fontSize: tokens.typography.fontSize.xs,
              color: theme.text.secondary,
              fontWeight: tokens.typography.fontWeight.medium,
            }}
          >
            快捷键
          </span>
          <kbd
            style={{
              padding: '2px 6px',
              borderRadius: tokens.borderRadius.sm,
              background: theme.bg.tertiary,
              fontSize: '10px',
              fontFamily: tokens.typography.fontFamily.mono,
              color: theme.text.tertiary,
            }}
          >
            ?
          </kbd>
        </button>

        {/* 时间显示 */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '8px 14px',
            borderRadius: tokens.borderRadius.md,
            background: theme.bg.tertiary,
            border: `1px solid ${theme.border.default}`,
          }}
        >
          <ClockIcon size={16} color={theme.accent.primary} />
          <span
            style={{
              fontSize: tokens.typography.fontSize.base,
              fontWeight: tokens.typography.fontWeight.semibold,
              color: theme.text.primary,
              fontFamily: tokens.typography.fontFamily.mono,
              fontVariantNumeric: 'tabular-nums',
            }}
          >
            {timeStr}
          </span>
        </div>
      </div>

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </header>
  )
}
