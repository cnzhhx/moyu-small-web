import { useState, useEffect } from 'react'
import { useTheme } from '../ThemeContext.jsx'

// SVG Icons
const RunIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="5" r="2"/>
    <path d="M4 17l3-3 3 3M15 17l3-3 3 3"/>
    <path d="M12 7v10"/>
  </svg>
)

const CheckCircleIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
    <polyline points="22,4 12,14.01 9,11.01"/>
  </svg>
)

export default function Countdown() {
  const { colors } = useTheme()
  const [display, setDisplay] = useState('')
  const [progress, setProgress] = useState(0)
  const [isOffWork, setIsOffWork] = useState(false)

  useEffect(() => {
    const calc = () => {
      const now = new Date()
      const start = new Date()
      start.setHours(9, 0, 0, 0)
      const end = new Date()
      end.setHours(18, 0, 0, 0)

      const diff = end - now

      if (diff <= 0) {
        setIsOffWork(true)
        setProgress(100)
        setDisplay('')
        return
      }

      setIsOffWork(false)

      const h = String(Math.floor(diff / 3600000)).padStart(2, '0')
      const m = String(Math.floor((diff % 3600000) / 60000)).padStart(2, '0')
      const s = String(Math.floor((diff % 60000) / 1000)).padStart(2, '0')
      setDisplay(`${h}:${m}:${s}`)

      // Calculate work progress based on 9:00-18:00
      const totalWork = end - start // 9 hours in ms
      const elapsed = now - start
      const pct = Math.max(0, Math.min(100, Math.round((elapsed / totalWork) * 100)))
      setProgress(pct)
    }

    calc()
    const timer = setInterval(calc, 1000)
    return () => clearInterval(timer)
  }, [])

  if (isOffWork) {
    return (
      <span style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6,
        fontWeight: 600,
        color: '#22C55E',
        padding: '4px 12px',
        background: 'rgba(34, 197, 94, 0.15)',
        borderRadius: 20,
      }}>
        <CheckCircleIcon />
        <span>已下班！</span>
      </span>
    )
  }

  return (
    <span style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: 8,
      fontWeight: 500,
      fontSize: 13,
    }}>
      <span style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 4,
        color: colors.textSecondary,
      }}>
        <RunIcon />
        <span>下班</span>
      </span>
      <span style={{
        color: colors.accent,
        fontFamily: 'Fredoka, monospace',
        fontWeight: 600,
        fontSize: 14,
      }}>
        {display}
      </span>
      <span style={{ color: colors.textMuted }}>|</span>
      <span style={{ color: colors.textSecondary }}>进度</span>
      <span style={{
        color: colors.accent,
        fontWeight: 600,
      }}>
        {progress}%
      </span>
    </span>
  )
}
