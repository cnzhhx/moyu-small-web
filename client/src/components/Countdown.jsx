import { useState, useEffect } from 'react'
import { useTheme } from '../ThemeContext.jsx'
import { ClockIcon } from './Icons.jsx'

export default function Countdown() {
  const { theme, tokens } = useTheme()
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
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          padding: '8px 14px',
          borderRadius: tokens.borderRadius.md,
          background: `${theme.status.success}15`,
          border: `1px solid ${theme.status.success}30`,
        }}
      >
        <span style={{ fontSize: '16px' }}>🎉</span>
        <span
          style={{
            fontSize: tokens.typography.fontSize.sm,
            fontWeight: tokens.typography.fontWeight.semibold,
            color: theme.status.success,
          }}
        >
          已下班！
        </span>
      </div>
    )
  }

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        padding: '8px 14px',
        borderRadius: tokens.borderRadius.md,
        background: theme.bg.tertiary,
        border: `1px solid ${theme.border.default}`,
      }}
    >
      {/* Icon */}
      <div
        style={{
          width: '28px',
          height: '28px',
          borderRadius: tokens.borderRadius.base,
          background: `${theme.accent.primary}15`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <ClockIcon size={16} color={theme.accent.primary} />
      </div>

      {/* Countdown */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span
            style={{
              fontSize: tokens.typography.fontSize.xs,
              color: theme.text.tertiary,
              fontWeight: tokens.typography.fontWeight.medium,
            }}
          >
            下班
          </span>
          <span
            style={{
              fontSize: tokens.typography.fontSize.sm,
              fontWeight: tokens.typography.fontWeight.bold,
              color: theme.accent.primary,
              fontFamily: tokens.typography.fontFamily.mono,
              fontVariantNumeric: 'tabular-nums',
            }}
          >
            {display}
          </span>
        </div>

        {/* Progress bar */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
          }}
        >
          <div
            style={{
              width: '60px',
              height: '4px',
              borderRadius: '2px',
              background: theme.bg.elevated,
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                width: `${progress}%`,
                height: '100%',
                borderRadius: '2px',
                background: `linear-gradient(90deg, ${theme.accent.primary} 0%, ${theme.accent.primaryHover} 100%)`,
                transition: 'width 1s ease',
              }}
            />
          </div>
          <span
            style={{
              fontSize: '10px',
              color: theme.text.tertiary,
              fontWeight: tokens.typography.fontWeight.medium,
              fontFamily: tokens.typography.fontFamily.mono,
            }}
          >
            {progress}%
          </span>
        </div>
      </div>
    </div>
  )
}
