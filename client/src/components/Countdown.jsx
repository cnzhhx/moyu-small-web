import { useState, useEffect } from 'react'
import { useTheme } from '../ThemeContext.jsx'

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
      <span style={{ fontWeight: 600, color: colors.accent }}>
        🎉 已下班！
      </span>
    )
  }

  return (
    <span style={{ fontWeight: 600 }}>
      <span style={{ color: colors.textSecondary }}>🏃 下班 </span>
      <span style={{ color: colors.accent }}>{display}</span>
      <span style={{ color: colors.textSecondary }}> | 进度 </span>
      <span style={{ color: colors.accent }}>{progress}%</span>
    </span>
  )
}
