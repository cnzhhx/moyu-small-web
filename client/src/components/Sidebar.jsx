import { useState, useEffect } from 'react'
import { useTheme } from '../ThemeContext.jsx'

const navItems = [
  { id: 'home', icon: '🏠', label: '首页' },
  { id: 'todo', icon: '✅', label: '待办' },
  { id: 'tools', icon: '🔧', label: '工具箱' },
  { id: 'games', icon: '🎮', label: '游戏中心' },
]

export default function Sidebar({ activePage, onNavigate }) {
  const { colors, toggleTheme, isDark } = useTheme()
  const [hoveredId, setHoveredId] = useState(null)
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768)
  const [isCollapsed, setIsCollapsed] = useState(window.innerWidth <= 768)

  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth <= 768
      setIsMobile(mobile)
      if (mobile && !isCollapsed) setIsCollapsed(true)
    }
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [isCollapsed])

  const handleNavigate = (id) => {
    onNavigate(id)
    if (isMobile) setIsCollapsed(true)
  }

  // Mobile toggle button
  if (isMobile && isCollapsed) {
    return (
      <button
        onClick={() => setIsCollapsed(false)}
        style={{
          position: 'fixed', bottom: 20, right: 20, zIndex: 100,
          width: 50, height: 50, borderRadius: '50%',
          background: colors.accent, color: '#fff', border: 'none',
          boxShadow: `0 4px 12px ${colors.shadow}`,
          fontSize: 20, cursor: 'pointer', display: 'flex',
          alignItems: 'center', justifyContent: 'center',
        }}
      >
        ☰
      </button>
    )
  }

  return (
    <>
      {isMobile && !isCollapsed && (
        <div
          onClick={() => setIsCollapsed(true)}
          style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)',
            zIndex: 99, transition: 'opacity 0.3s',
          }}
        />
      )}
      <nav style={{
        width: isMobile ? 200 : 60, minWidth: isMobile ? 200 : 60,
        background: colors.sidebarBg,
        display: 'flex', flexDirection: 'column', alignItems: isMobile ? 'flex-start' : 'center',
        borderRight: `1px solid ${colors.border}`,
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        position: isMobile ? 'fixed' : 'relative',
        left: isMobile ? (isCollapsed ? -200 : 0) : 0,
        top: 0, bottom: 0, zIndex: 100,
      }}>
      {/* Logo area */}
      <div style={{
        width: '100%', display: 'flex', alignItems: 'center',
        justifyContent: isMobile ? 'space-between' : 'center',
        padding: isMobile ? '18px 16px 14px' : '18px 0 14px',
        borderBottom: `1px solid ${colors.border}`,
        marginBottom: 8, transition: 'border-color 0.3s',
      }}>
        <span style={{ fontSize: 28, lineHeight: 1 }}>🐟</span>
        {isMobile && (
          <button
            onClick={() => setIsCollapsed(true)}
            style={{
              background: 'none', border: 'none', fontSize: 20,
              color: colors.textSecondary, cursor: 'pointer',
            }}
          >
            ✕
          </button>
        )}
      </div>

      {/* Nav items */}
      <div style={{
        display: 'flex', flexDirection: 'column',
        alignItems: isMobile ? 'stretch' : 'center',
        gap: 4, flex: 1, width: isMobile ? '100%' : 'auto', padding: isMobile ? '0 12px' : 0,
      }}>
        {navItems.map((item) => {
          const isActive = activePage === item.id
          const isHovered = hoveredId === item.id
          return (
            <button
              key={item.id}
              style={{
                width: isMobile ? '100%' : 48, height: 48,
                display: 'flex', flexDirection: isMobile ? 'row' : 'column',
                alignItems: 'center', justifyContent: isMobile ? 'flex-start' : 'center',
                gap: isMobile ? 12 : 0,
                padding: isMobile ? '0 12px' : 0,
                borderRadius: 10,
                cursor: 'pointer', border: 'none', position: 'relative',
                background: isActive ? colors.accentLight : isHovered ? colors.hover : 'transparent',
                fontSize: 20,
                transform: isHovered && !isMobile ? 'scale(1.05)' : 'scale(1)',
                transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
              }}
              onClick={() => handleNavigate(item.id)}
              onMouseEnter={() => setHoveredId(item.id)}
              onMouseLeave={() => setHoveredId(null)}
            >
              {/* Active indicator bar */}
              {isActive && (
                <span style={{
                  position: 'absolute', left: isMobile ? 0 : -6,
                  top: '50%', transform: 'translateY(-50%)',
                  width: isMobile ? 4 : 3, height: isMobile ? 24 : 20,
                  borderRadius: 2,
                  background: colors.accent,
                  transition: 'all 0.3s',
                }} />
              )}
              <span>{item.icon}</span>
              <span style={{
                fontSize: isMobile ? 14 : 9, marginTop: isMobile ? 0 : 2,
                fontWeight: isActive ? 600 : 400,
                color: isActive ? colors.accent : colors.textSecondary,
                transition: 'color 0.2s',
              }}>{item.label}</span>

              {/* Tooltip with left-pointing arrow (desktop only) */}
              {isHovered && !isMobile && (
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
        display: 'flex', flexDirection: isMobile ? 'row' : 'column',
        alignItems: 'center', justifyContent: isMobile ? 'space-between' : 'center',
        padding: isMobile ? '12px 16px' : '12px 0',
        gap: 8, borderTop: `1px solid ${colors.border}`,
        width: '100%', transition: 'border-color 0.3s',
      }}>
        <button
          onClick={toggleTheme}
          onMouseEnter={() => setHoveredId('theme')}
          onMouseLeave={() => setHoveredId(null)}
          style={{
            width: isMobile ? '100%' : 40, height: 40,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            gap: isMobile ? 8 : 0,
            borderRadius: 10, cursor: 'pointer', fontSize: 18,
            border: `1px solid ${colors.border}`,
            background: hoveredId === 'theme' ? colors.hover : 'transparent',
            color: colors.text, position: 'relative',
            transform: hoveredId === 'theme' && !isMobile ? 'scale(1.05)' : 'scale(1)',
            transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
          }}
          title={isDark ? '切换日间模式' : '切换夜间模式'}
        >
          {isDark ? '☀️' : '🌙'}
          {isMobile && <span style={{ fontSize: 14 }}>{isDark ? '日间模式' : '夜间模式'}</span>}
          {hoveredId === 'theme' && !isMobile && (
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
        }}>v1.1</span>
      </div>
    </nav>
    </>
  )
}
