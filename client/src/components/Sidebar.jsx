import { useState, useEffect, useCallback } from 'react'
import { useTheme } from '../ThemeContext.jsx'
import { HomeIcon, CheckSquareIcon, ToolIcon, GamepadIcon, SunIcon, MoonIcon } from './Icons.jsx'

const navItems = [
  { id: 'home', icon: HomeIcon, label: '首页', shortcut: '⌘1' },
  { id: 'todo', icon: CheckSquareIcon, label: '待办', shortcut: '⌘2' },
  { id: 'tools', icon: ToolIcon, label: '工具箱', shortcut: '⌘3' },
  { id: 'games', icon: GamepadIcon, label: '游戏中心', shortcut: '⌘4' },
]

export default function Sidebar({ activePage, onNavigate }) {
  const { theme, isDark, toggleTheme, tokens } = useTheme()
  const [hoveredId, setHoveredId] = useState(null)
  const [isMobile, setIsMobile] = useState(false)
  const [isOpen, setIsOpen] = useState(true)
  const [isCollapsed, setIsCollapsed] = useState(false)

  // 检测移动端
  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth <= 768
      setIsMobile(mobile)
      if (mobile) {
        setIsOpen(false)
        setIsCollapsed(false)
      } else {
        setIsOpen(true)
        // 桌面端根据宽度自动折叠
        setIsCollapsed(window.innerWidth <= 1024)
      }
    }
    
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  const handleNavigate = useCallback((id) => {
    onNavigate(id)
    if (isMobile) setIsOpen(false)
  }, [isMobile, onNavigate])

  // 移动端悬浮按钮
  if (isMobile && !isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        style={{
          position: 'fixed',
          bottom: '24px',
          right: '24px',
          width: '56px',
          height: '56px',
          borderRadius: '50%',
          background: `linear-gradient(135deg, ${theme.accent.primary} 0%, ${theme.accent.primaryHover} 100%)`,
          border: 'none',
          boxShadow: `${theme.shadow.lg}, ${theme.shadow.glow}`,
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 100,
          transition: `transform ${tokens.animation.duration.normal} ${tokens.animation.easing.bounce}`,
        }}
        onMouseEnter={(e) => { e.currentTarget.style.transform = 'scale(1.1)' }}
        onMouseLeave={(e) => { e.currentTarget.style.transform = 'scale(1)' }}
        aria-label="打开导航菜单"
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <line x1="3" y1="12" x2="21" y2="12" />
          <line x1="3" y1="6" x2="21" y2="6" />
          <line x1="3" y1="18" x2="21" y2="18" />
        </svg>
      </button>
    )
  }

  const sidebarWidth = isCollapsed ? '72px' : '240px'
  const itemHeight = '48px'

  return (
    <>
      {/* 移动端遮罩 */}
      {isMobile && isOpen && (
        <div
          onClick={() => setIsOpen(false)}
          style={{
            position: 'fixed',
            inset: 0,
            background: theme.bg.overlay,
            backdropFilter: 'blur(4px)',
            zIndex: 99,
            animation: 'fadeIn 0.2s ease',
          }}
        />
      )}

      <nav
        style={{
          width: sidebarWidth,
          minWidth: sidebarWidth,
          height: '100vh',
          background: theme.glass.background,
          backdropFilter: theme.glass.blur,
          borderRight: theme.glass.border,
          display: 'flex',
          flexDirection: 'column',
          position: isMobile ? 'fixed' : 'relative',
          left: isMobile ? (isOpen ? 0 : '-100%') : 0,
          top: 0,
          zIndex: 100,
          transition: `width ${tokens.animation.duration.slow} ${tokens.animation.easing.smooth}, left ${tokens.animation.duration.normal} ease`,
          overflow: 'hidden',
        }}
      >
        {/* Logo 区域 */}
        <div
          style={{
            padding: isCollapsed ? '20px 0' : '24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: isCollapsed ? 'center' : 'flex-start',
            gap: '12px',
            borderBottom: `1px solid ${theme.border.default}`,
          }}
        >
          {/* Logo 图标 */}
          <div
            style={{
              width: '40px',
              height: '40px',
              borderRadius: '12px',
              background: theme.gradient.primary,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
              boxShadow: theme.shadow.glow,
            }}
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z" />
              <path d="M8 12h8M12 8v8" strokeLinecap="round" />
            </svg>
          </div>
          
          {!isCollapsed && (
            <div style={{ overflow: 'hidden' }}>
              <h1
                style={{
                  fontSize: tokens.typography.fontSize.lg,
                  fontWeight: tokens.typography.fontWeight.bold,
                  background: theme.gradient.primary,
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  whiteSpace: 'nowrap',
                }}
              >
                Moyu Hub
              </h1>
              <p
                style={{
                  fontSize: tokens.typography.fontSize.xs,
                  color: theme.text.tertiary,
                  marginTop: '2px',
                  whiteSpace: 'nowrap',
                }}
              >
                你的效率工作台
              </p>
            </div>
          )}

          {/* 折叠按钮（仅桌面端） */}
          {!isMobile && (
            <button
              onClick={() => setIsCollapsed(!isCollapsed)}
              style={{
                position: 'absolute',
                right: '-12px',
                top: '36px',
                width: '24px',
                height: '24px',
                borderRadius: '50%',
                background: theme.bg.elevated,
                border: `1px solid ${theme.border.default}`,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                opacity: 0,
                transition: `opacity ${tokens.animation.duration.fast} ease`,
              }}
              onMouseEnter={(e) => { e.currentTarget.style.opacity = '1' }}
              onMouseLeave={(e) => { e.currentTarget.style.opacity = '0' }}
              aria-label={isCollapsed ? '展开侧边栏' : '折叠侧边栏'}
            >
              <svg
                width="12"
                height="12"
                viewBox="0 0 24 24"
                fill="none"
                stroke={theme.text.secondary}
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                style={{
                  transform: isCollapsed ? 'rotate(180deg)' : 'rotate(0deg)',
                  transition: `transform ${tokens.animation.duration.normal} ease`,
                }}
              >
                <polyline points="15 18 9 12 15 6" />
              </svg>
            </button>
          )}

          {/* 移动端关闭按钮 */}
          {isMobile && (
            <button
              onClick={() => setIsOpen(false)}
              style={{
                position: 'absolute',
                right: '16px',
                top: '28px',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                padding: '4px',
              }}
              aria-label="关闭菜单"
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={theme.text.secondary} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          )}
        </div>

        {/* 导航项 */}
        <div
          style={{
            flex: 1,
            padding: isCollapsed ? '16px 12px' : '16px',
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
            overflowY: 'auto',
            overflowX: 'hidden',
          }}
        >
          {navItems.map((item) => {
            const Icon = item.icon
            const isActive = activePage === item.id
            const isHovered = hoveredId === item.id

            return (
              <button
                key={item.id}
                onClick={() => handleNavigate(item.id)}
                onMouseEnter={() => setHoveredId(item.id)}
                onMouseLeave={() => setHoveredId(null)}
                style={{
                  width: '100%',
                  height: itemHeight,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: isCollapsed ? 'center' : 'flex-start',
                  gap: '12px',
                  padding: isCollapsed ? '0' : '0 16px',
                  borderRadius: tokens.borderRadius.md,
                  background: isActive 
                    ? `linear-gradient(135deg, ${theme.accent.primary}20 0%, ${theme.accent.primary}10 100%)`
                    : isHovered 
                      ? theme.glass.backgroundHover
                      : 'transparent',
                  border: isActive 
                    ? `1px solid ${theme.accent.primary}40`
                    : '1px solid transparent',
                  cursor: 'pointer',
                  position: 'relative',
                  transition: `all ${tokens.animation.duration.normal} ${tokens.animation.easing.smooth}`,
                }}
                aria-label={item.label}
                aria-current={isActive ? 'page' : undefined}
              >
                {/* 激活指示条 */}
                {isActive && (
                  <span
                    style={{
                      position: 'absolute',
                      left: isCollapsed ? '4px' : '0',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      width: '3px',
                      height: '24px',
                      borderRadius: '0 2px 2px 0',
                      background: theme.gradient.primary,
                    }}
                  />
                )}

                {/* 图标 */}
                <Icon
                  size={22}
                  color={isActive ? theme.accent.primary : theme.text.secondary}
                  style={{
                    flexShrink: 0,
                    transition: `transform ${tokens.animation.duration.fast} ease`,
                    transform: isHovered && !isActive ? 'scale(1.1)' : 'scale(1)',
                  }}
                />

                {/* 标签 */}
                {!isCollapsed && (
                  <>
                    <span
                      style={{
                        flex: 1,
                        fontSize: tokens.typography.fontSize.sm,
                        fontWeight: isActive ? tokens.typography.fontWeight.semibold : tokens.typography.fontWeight.medium,
                        color: isActive ? theme.accent.primary : theme.text.primary,
                        textAlign: 'left',
                        whiteSpace: 'nowrap',
                        transition: `color ${tokens.animation.duration.fast} ease`,
                      }}
                    >
                      {item.label}
                    </span>
                    
                    {/* 快捷键提示 */}
                    <kbd
                      style={{
                        padding: '2px 6px',
                        borderRadius: tokens.borderRadius.sm,
                        background: theme.bg.tertiary,
                        fontSize: tokens.typography.fontSize.xs,
                        fontFamily: tokens.typography.fontFamily.mono,
                        color: theme.text.tertiary,
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {item.shortcut}
                    </kbd>
                  </>
                )}

                {/* 折叠状态下的 Tooltip */}
                {isCollapsed && isHovered && (
                  <div
                    style={{
                      position: 'absolute',
                      left: '100%',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      marginLeft: '12px',
                      padding: '8px 12px',
                      borderRadius: tokens.borderRadius.md,
                      background: theme.bg.elevated,
                      border: `1px solid ${theme.border.default}`,
                      boxShadow: theme.shadow.lg,
                      whiteSpace: 'nowrap',
                      zIndex: 1000,
                      pointerEvents: 'none',
                      animation: 'fadeIn 0.15s ease',
                    }}
                  >
                    <span
                      style={{
                        fontSize: tokens.typography.fontSize.sm,
                        color: theme.text.primary,
                      }}
                    >
                      {item.label}
                    </span>
                    <span
                      style={{
                        marginLeft: '8px',
                        padding: '2px 6px',
                        borderRadius: tokens.borderRadius.sm,
                        background: theme.bg.tertiary,
                        fontSize: tokens.typography.fontSize.xs,
                        fontFamily: tokens.typography.fontFamily.mono,
                        color: theme.text.tertiary,
                      }}
                    >
                      {item.shortcut}
                    </span>
                    {/* Tooltip 箭头 */}
                    <span
                      style={{
                        position: 'absolute',
                        left: '-6px',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        width: 0,
                        height: 0,
                        borderTop: '6px solid transparent',
                        borderBottom: '6px solid transparent',
                        borderRight: `6px solid ${theme.border.default}`,
                      }}
                    />
                  </div>
                )}
              </button>
            )
          })}
        </div>

        {/* 底部区域 */}
        <div
          style={{
            padding: isCollapsed ? '16px 12px' : '16px',
            borderTop: `1px solid ${theme.border.default}`,
            display: 'flex',
            flexDirection: isCollapsed ? 'column' : 'row',
            alignItems: 'center',
            justifyContent: isCollapsed ? 'center' : 'space-between',
            gap: '12px',
          }}
        >
          {/* 主题切换按钮 */}
          <button
            onClick={toggleTheme}
            style={{
              width: isCollapsed ? '44px' : 'auto',
              height: '44px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              padding: isCollapsed ? '0' : '0 16px',
              borderRadius: tokens.borderRadius.md,
              background: theme.bg.tertiary,
              border: `1px solid ${theme.border.default}`,
              cursor: 'pointer',
              transition: `all ${tokens.animation.duration.normal} ease`,
            }}
            aria-label={isDark ? '切换到浅色模式' : '切换到深色模式'}
          >
            {isDark ? (
              <SunIcon size={20} color={theme.accent.primary} />
            ) : (
              <MoonIcon size={20} color={theme.accent.secondary} />
            )}
            {!isCollapsed && (
              <span
                style={{
                  fontSize: tokens.typography.fontSize.sm,
                  color: theme.text.secondary,
                }}
              >
                {isDark ? '浅色模式' : '深色模式'}
              </span>
            )}
          </button>

          {/* 版本号 */}
          {!isCollapsed && (
            <span
              style={{
                fontSize: tokens.typography.fontSize.xs,
                color: theme.text.tertiary,
                fontFamily: tokens.typography.fontFamily.mono,
              }}
            >
              v2.0
            </span>
          )}
        </div>
      </nav>
    </>
  )
}
