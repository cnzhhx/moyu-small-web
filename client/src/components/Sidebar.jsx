import { useState } from 'react'
import { useTheme } from '../ThemeContext.jsx'

const navItems = [
  { id: 'home', icon: '🏠', label: '首页' },
  { id: 'todo', icon: '✅', label: '待办' },
  { id: 'tools', icon: '🔧', label: '工具箱' },
]

export default function Sidebar({ activePage, onNavigate }) {
  const { colors, toggleTheme, isDark } = useTheme()
  const [hoveredId, setHoveredId] = useState(null)

  return (
    <nav style={{
      width: 60, minWidth: 60, background: colors.sidebarBg,
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      borderRight: `1px solid ${colors.border}`,
      transition: 'background 0.3s, border-color 0.3s',
      position: 'relative',
      zIndex: 10,
    }}>
      {/* Logo area */}
      <div style={{
        width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '18px 0 14px', borderBottom: `1px solid ${colors.border}`,
        marginBottom: 8, transition: 'border-color 0.3s',
      }}>
        <span style={{ fontSize: 28, lineHeight: 1 }}>🐟</span>
      </div>

      {/* Nav items */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, flex: 1 }}>
        {navItems.map((item) => {
          const isActive = activePage === item.id
          const isHovered = hoveredId === item.id
          return (
            <button
              key={item.id}
              style={{
                width: 48, height: 48, display: 'flex', flexDirection: 'column',
                alignItems: 'center', justifyContent: 'center', borderRadius: 10,
                cursor: 'pointer', border: 'none', position: 'relative',
                background: isActive ? colors.accentLight : isHovered ? colors.hover : 'transparent',
                fontSize: 20,
                transform: isHovered ? 'scale(1.05)' : 'scale(1)',
                transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
              }}
              onClick={() => onNavigate(item.id)}
              onMouseEnter={() => setHoveredId(item.id)}
              onMouseLeave={() => setHoveredId(null)}
            >
              {/* Active indicator bar */}
              {isActive && (
                <span style={{
                  position: 'absolute', left: -6, top: '50%', transform: 'translateY(-50%)',
                  width: 3, height: 20, borderRadius: 2,
                  background: colors.accent,
                  transition: 'all 0.3s',
                }} />
              )}
              <span>{item.icon}</span>
              <span style={{
                fontSize: 9, marginTop: 2, fontWeight: isActive ? 600 : 400,
                color: isActive ? colors.accent : colors.textSecondary,
                transition: 'color 0.2s',
              }}>{item.label}</span>

              {/* Tooltip with left-pointing arrow */}
              {isHovered && (
                <span style={{
                  position: 'absolute', left: 56, top: '50%', transform: 'translateY(-50%)',
                  background: colors.cardBg, color: colors.text,
                  padding: '5px 12px', borderRadius: 6, fontSize: 12,
                  whiteSpace: 'nowrap', zIndex: 1000, pointerEvents: 'none',
                  border: `1px solid ${colors.border}`,
                  boxShadow: `0 2px 8px ${colors.shadow}`,
                  display: 'flex', alignItems: 'center',
                }}>
                  {/* Left-pointing triangle */}
                  <span style={{
                    position: 'absolute', left: -6, top: '50%', transform: 'translateY(-50%)',
                    width: 0, height: 0,
                    borderTop: '5px solid transparent',
                    borderBottom: '5px solid transparent',
                    borderRight: `6px solid ${colors.border}`,
                  }} />
                  <span style={{
                    position: 'absolute', left: -5, top: '50%', transform: 'translateY(-50%)',
                    width: 0, height: 0,
                    borderTop: '5px solid transparent',
                    borderBottom: '5px solid transparent',
                    borderRight: `6px solid ${colors.cardBg}`,
                  }} />
                  {item.label}
                </span>
              )}
            </button>
          )
        })}
      </div>

      {/* Bottom section: theme toggle + version */}
      <div style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        paddingBottom: 12, gap: 8, borderTop: `1px solid ${colors.border}`,
        paddingTop: 12, width: '100%', transition: 'border-color 0.3s',
      }}>
        <button
          onClick={toggleTheme}
          onMouseEnter={() => setHoveredId('theme')}
          onMouseLeave={() => setHoveredId(null)}
          style={{
            width: 40, height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center',
            borderRadius: 10, cursor: 'pointer', fontSize: 18,
            border: `1px solid ${colors.border}`,
            background: hoveredId === 'theme' ? colors.hover : 'transparent',
            color: colors.text, position: 'relative',
            transform: hoveredId === 'theme' ? 'scale(1.05)' : 'scale(1)',
            transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
          }}
          title={isDark ? '切换日间模式' : '切换夜间模式'}
        >
          {isDark ? '☀️' : '🌙'}
          {hoveredId === 'theme' && (
            <span style={{
              position: 'absolute', left: 50, top: '50%', transform: 'translateY(-50%)',
              background: colors.cardBg, color: colors.text,
              padding: '5px 12px', borderRadius: 6, fontSize: 12,
              whiteSpace: 'nowrap', zIndex: 1000, pointerEvents: 'none',
              border: `1px solid ${colors.border}`,
              boxShadow: `0 2px 8px ${colors.shadow}`,
            }}>
              <span style={{
                position: 'absolute', left: -6, top: '50%', transform: 'translateY(-50%)',
                width: 0, height: 0,
                borderTop: '5px solid transparent',
                borderBottom: '5px solid transparent',
                borderRight: `6px solid ${colors.border}`,
              }} />
              <span style={{
                position: 'absolute', left: -5, top: '50%', transform: 'translateY(-50%)',
                width: 0, height: 0,
                borderTop: '5px solid transparent',
                borderBottom: '5px solid transparent',
                borderRight: `6px solid ${colors.cardBg}`,
              }} />
              {isDark ? '日间模式' : '夜间模式'}
            </span>
          )}
        </button>
        <span style={{
          fontSize: 10, color: colors.textMuted, letterSpacing: 0.5,
        }}>v1.0</span>
      </div>
    </nav>
  )
}
