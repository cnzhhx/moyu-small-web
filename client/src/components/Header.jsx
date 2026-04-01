import { useState, useEffect, useCallback } from 'react'
import { useTheme } from '../ThemeContext.jsx'
import Countdown from './Countdown.jsx'

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
          setSentence('今天也要开心摸鱼哦~ 🐟')
        }
      })
      .catch(() => setSentence('今天也要开心摸鱼哦~ 🐟'))
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
      height: 56, minHeight: 56, background: colors.headerBg,
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '0 24px',
      boxShadow: `0 1px 4px ${colors.shadow}`,
      transition: 'background 0.3s, box-shadow 0.3s',
      position: 'relative', zIndex: 5,
    }}>
      {/* Left: Logo */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
        <span style={{ fontSize: 24 }}>🐟</span>
        <span style={{
          fontSize: 18, fontWeight: 700,
          background: 'linear-gradient(135deg, #e94560, #ff6b8a)',
          WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
        }}>摸鱼岛</span>
      </div>

      {/* Center: Daily sentence with refresh */}
      <div style={{
        flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '0 20px', overflow: 'hidden', gap: 8,
      }}>
        <span style={{
          fontSize: 13, color: colors.textSecondary,
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
        }}>
          {sentence || '加载中...'}
        </span>
        <button
          onClick={fetchSentence}
          disabled={refreshing}
          style={{
            background: 'none', border: 'none', cursor: refreshing ? 'default' : 'pointer',
            fontSize: 14, padding: '2px 4px', borderRadius: 4, flexShrink: 0,
            opacity: refreshing ? 0.5 : 0.7,
            transform: refreshing ? 'rotate(180deg)' : 'rotate(0deg)',
            transition: 'opacity 0.2s, transform 0.4s',
          }}
          title="换一句"
        >
          🔄
        </button>
      </div>

      {/* Right: Countdown + Holiday + Clock + Shortcuts */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 14,
        fontSize: 13, color: colors.textSecondary, whiteSpace: 'nowrap', flexShrink: 0,
      }}>
        <Countdown />
        {holiday && (
          <span style={{
            background: colors.accentLight, color: colors.accent,
            padding: '3px 10px', borderRadius: 12, fontSize: 12, fontWeight: 500,
            border: `1px solid ${colors.accent}33`,
          }}>
            距 {holiday.name} 还有 {holiday.days} 天
          </span>
        )}
        <button
          onClick={onShowShortcuts}
          style={{
            background: 'transparent', border: `1px solid ${colors.border}`,
            color: colors.textSecondary, fontSize: 12,
            padding: '4px 8px', borderRadius: 6, cursor: 'pointer',
            display: 'flex', alignItems: 'center', gap: 4,
            transition: 'all 0.2s',
          }}
          onMouseEnter={e => { e.currentTarget.style.borderColor = colors.accent; e.currentTarget.style.color = colors.accent }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = colors.border; e.currentTarget.style.color = colors.textSecondary }}
          title="查看快捷键"
        >
          <span>⌨️</span>
          <span>?</span>
        </button>
        <span style={{ color: colors.textSecondary }}>🕐 {timeStr}</span>
      </div>
    </header>
  )
}
