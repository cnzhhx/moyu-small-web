import { useState, useEffect, useCallback } from 'react'
import { useTheme } from '../ThemeContext.jsx'
import Countdown from './Countdown.jsx'

// SVG Icons (Heroicons/Lucide style)
const Icons = {
  Fish: ({ size = 24, className = '' }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c1.5 0 2.5-1 2.5-2.5 0-.5-.2-1-.4-1.4-.3-.4-.4-.8-.4-1.2 0-1.1.9-2 2-2h2.3c3.3 0 6-2.7 6-6 0-4.4-4.5-8-10-8zm-3 12c-.8 0-1.5-.7-1.5-1.5S8.2 11 9 11s1.5.7 1.5 1.5S9.8 14 9 14zm3-4c-.8 0-1.5-.7-1.5-1.5S11.2 7 12 7s1.5.7 1.5 1.5S12.8 10 12 10zm4 2c-.8 0-1.5-.7-1.5-1.5S15.2 9 16 9s1.5.7 1.5 1.5S16.8 12 16 12z"/>
    </svg>
  ),
  Refresh: ({ size = 16, className = '' }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
      <path d="M3 3v5h5" />
      <path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16" />
      <path d="M16 21h5v-5" />
    </svg>
  ),
  Keyboard: ({ size = 16, className = '' }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <rect x="2" y="4" width="20" height="16" rx="2" />
      <path d="M6 8h.001" />
      <path d="M10 8h.001" />
      <path d="M14 8h.001" />
      <path d="M18 8h.001" />
      <path d="M8 12h.001" />
      <path d="M12 12h.001" />
      <path d="M16 12h.001" />
      <path d="M7 16h10" />
    </svg>
  ),
  Clock: ({ size = 16, className = '' }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  ),
}

export default function Header({ onShowShortcuts }) {
  const { colors } = useTheme()
  const [sentence, setSentence] = useState('')
  const [currentTime, setCurrentTime] = useState(new Date())
  const [holiday, setHoliday] = useState(null)
  const [refreshing, setRefreshing] = useState(false)

  const fetchSentence = useCallback(() => {
    setRefreshing(true)
    fetch('/api/daily/sentence')
      .then((r) => r.json())
      .then((data) => {
        const d = data.data || data
        if (typeof d === 'string') setSentence(d)
        else if (d && d.content) {
          const from = d.from ? ` —— ${d.from}` : ''
          setSentence(`${d.content}${from}`)
        } else {
          setSentence('今天也要开心摸鱼哦~')
        }
      })
      .catch(() => setSentence('今天也要开心摸鱼哦~'))
      .finally(() => setRefreshing(false))
  }, [])

  useEffect(() => {
    fetchSentence()
  }, [fetchSentence])

  useEffect(() => {
    fetch('/api/daily/countdown')
      .then((r) => r.json())
      .then((data) => {
        const d = data.data || data
        const next = d.next || d
        if (next && next.name && next.days !== undefined) {
          setHoliday(next)
        }
      })
      .catch(() => {})
  }, [])

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])

  const timeStr = currentTime.toLocaleTimeString('zh-CN', { hour12: false })

  return (
    <header style={{
      height: 60, minHeight: 60, background: colors.headerBg,
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '0 24px',
      boxShadow: `0 2px 8px ${colors.shadow}`,
      transition: 'background 0.3s, box-shadow 0.3s',
      position: 'relative', zIndex: 5,
    }}>
      {/* Left: Logo */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 10,
        flexShrink: 0, cursor: 'pointer',
        transition: 'transform 0.2s',
      }}
      onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.02)'}
      onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
      >
        <Icons.Fish size={26} style={{ color: colors.accent }} />
        <span style={{
          fontSize: 20, fontWeight: 700,
          background: `linear-gradient(135deg, ${colors.accent}, #818CF8)`,
          WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
          letterSpacing: '0.5px',
        }}>摸鱼岛</span>
      </div>

      {/* Center: Daily sentence with refresh */}
      <div style={{
        flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '0 24px', overflow: 'hidden', gap: 10,
      }}>
        <span style={{
          fontSize: 14, color: colors.textSecondary,
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          fontStyle: 'italic',
          opacity: sentence ? 1 : 0.6,
          transition: 'opacity 0.3s',
        }}>
          {sentence || '加载中...'}
        </span>
        <button
          onClick={fetchSentence}
          disabled={refreshing}
          style={{
            background: 'none', border: 'none',
            cursor: refreshing ? 'default' : 'pointer',
            padding: '4px', borderRadius: 6, flexShrink: 0,
            opacity: refreshing ? 0.4 : 0.6,
            transform: refreshing ? 'rotate(180deg)' : 'rotate(0deg)',
            transition: 'opacity 0.2s, transform 0.5s cubic-bezier(0.4, 0, 0.2, 1)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}
          onMouseEnter={(e) => {
            if (!refreshing) {
              e.currentTarget.style.opacity = '1'
              e.currentTarget.style.background = colors.hover
            }
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.opacity = refreshing ? '0.4' : '0.6'
            e.currentTarget.style.background = 'transparent'
          }}
          title="换一句"
        >
          <Icons.Refresh size={16} style={{ color: colors.textSecondary }} />
        </button>
      </div>

      {/* Right: Countdown + Holiday + Clock + Shortcuts */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 16,
        fontSize: 13, color: colors.textSecondary, whiteSpace: 'nowrap', flexShrink: 0,
      }}>
        <Countdown />
        {holiday && (
          <span style={{
            background: `linear-gradient(135deg, ${colors.accentLight}, ${colors.accent}20)`,
            color: colors.accent,
            padding: '4px 12px', borderRadius: 16, fontSize: 12, fontWeight: 600,
            border: `1px solid ${colors.accent}30`,
            boxShadow: `0 2px 8px ${colors.accent}20`,
            transition: 'all 0.2s',
            cursor: 'default',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'scale(1.02)'
            e.currentTarget.style.boxShadow = `0 4px 12px ${colors.accent}30`
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'scale(1)'
            e.currentTarget.style.boxShadow = `0 2px 8px ${colors.accent}20`
          }}
          >
            距 {holiday.name} 还有 {holiday.days} 天
          </span>
        )}
        <button
          onClick={onShowShortcuts}
          style={{
            background: 'transparent', border: `1px solid ${colors.border}`,
            color: colors.textSecondary, fontSize: 12,
            padding: '6px 10px', borderRadius: 8, cursor: 'pointer',
            display: 'flex', alignItems: 'center', gap: 6,
            transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
            fontWeight: 500,
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = colors.accent
            e.currentTarget.style.color = colors.accent
            e.currentTarget.style.background = `${colors.accent}10`
            e.currentTarget.style.transform = 'scale(1.02)'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = colors.border
            e.currentTarget.style.color = colors.textSecondary
            e.currentTarget.style.background = 'transparent'
            e.currentTarget.style.transform = 'scale(1)'
          }}
          title="查看快捷键"
        >
          <Icons.Keyboard size={14} />
          <span>?</span>
        </button>
        <div style={{
          display: 'flex', alignItems: 'center', gap: 6,
          padding: '4px 10px',
          background: colors.cardBg,
          borderRadius: 8,
          border: `1px solid ${colors.border}`,
          transition: 'all 0.2s',
        }}>
          <Icons.Clock size={14} style={{ color: colors.accent }} />
          <span style={{
            color: colors.textSecondary,
            fontFamily: 'monospace',
            fontSize: 13,
            fontWeight: 500,
            letterSpacing: '0.5px',
          }}>{timeStr}</span>
        </div>
      </div>
    </header>
  )
}
