import { useState, useEffect } from 'react'
import { useTheme } from '../ThemeContext.jsx'

// SVG Icons (Heroicons/Lucide style)
const Icons = {
  // Navigation icons
  Home: ({ size = 20, className = '' }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
      <polyline points="9 22 9 12 15 12 15 22" />
    </svg>
  ),
  CheckCircle: ({ size = 20, className = '' }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <circle cx="12" cy="12" r="10" />
      <path d="M9 12l2 2 4-4" />
    </svg>
  ),
  Wrench: ({ size = 20, className = '' }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
    </svg>
  ),
  Gamepad: ({ size = 20, className = '' }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <line x1="6" y1="12" x2="10" y2="12" />
      <line x1="8" y1="10" x2="8" y2="14" />
      <line x1="15" y1="13" x2="15.01" y2="13" />
      <line x1="18" y1="11" x2="18.01" y2="11" />
      <rect x="2" y="6" width="20" height="12" rx="2" />
    </svg>
  ),

  // Platform icons
  Zhihu: ({ size = 18, className = '' }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path d="M5.721 0C2.251 0 0 2.25 0 5.719V18.28C0 21.751 2.252 24 5.721 24h12.56C21.751 24 24 21.75 24 18.281V5.72C24 2.249 21.75 0 18.281 0zm1.964 4.078c-.271.73-.5 1.434-.68 2.11h4.587c.545-.006.645.644.608.945-.073.59-.582.875-1.098.86h-1.82v7.48c0 .645-.523.867-.958.867-.45 0-.97-.222-.97-.867V7.993H6.098c-.328-.023-.69-.24-.69-.748 0-.503.362-.725.69-.748h.287c.18-.676.408-1.38.68-2.11-.612-.22-.925-.66-.925-1.16 0-.628.523-1.151 1.152-1.151.634 0 1.152.523 1.152 1.152 0 .498-.313.94-.925 1.159zm9.17 1.322c.595 0 .93.408.93.873 0 .464-.335.872-.93.872h-1.912v7.635c0 .645-.523.867-.958.867-.45 0-.97-.222-.97-.867V7.145H9.13c-.594 0-.93-.408-.93-.872 0-.465.336-.873.93-.873z"/>
    </svg>
  ),
  Weibo: ({ size = 18, className = '' }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path d="M10.098 20.323c-3.977.391-7.414-1.406-7.672-4.02-.259-2.609 2.759-5.047 6.74-5.441 3.979-.394 7.413 1.404 7.671 4.018.259 2.6-2.759 5.049-6.739 5.443zM9.05 17.219c-.384.616-1.208.884-1.829.602-.612-.279-.793-.991-.406-1.593.379-.595 1.176-.861 1.793-.601.622.263.82.972.442 1.592zm1.27-1.627c-.141.237-.449.353-.689.253-.236-.09-.313-.361-.177-.586.138-.227.436-.346.672-.24.239.09.315.36.194.573zm.176-2.719c-1.893-.493-4.033.45-4.857 2.118-.836 1.704-.026 3.591 1.886 4.21 1.983.64 4.318-.341 5.132-2.179.8-1.793-.201-3.642-2.161-4.149zm7.563-1.224c-.346-.105-.578-.175-.4-.638.386-.998.426-1.86.003-2.474-.791-1.15-2.956-1.09-5.463-.034 0 0-.782.345-.583-.277.387-1.217.329-2.236-.272-2.824-1.362-1.332-4.983.051-8.085 3.092C.903 11.57 0 14.125 0 16.34c0 4.238 5.428 6.816 10.736 6.816 6.963 0 11.598-4.043 11.598-7.252 0-1.935-1.635-3.036-3.575-3.555zm1.716-3.094c-.078-.167-.222-.34-.444-.352-.222-.011-.4.133-.4.352v1.778c0 .222.178.4.4.4.222 0 .4-.178.4-.4V9.133c0-.067-.011-.133-.044-.2zm1.333-1.422c-.078-.166-.222-.34-.444-.355-.222 0-.4.133-.4.355v3.2c0 .222.178.4.4.4.222 0 .4-.178.4-.4v-3.2zm1.778 1.333c-.078-.166-.222-.34-.445-.355-.222 0-.4.133-.4.355v1.778c0 .222.178.4.4.4.223 0 .4-.178.4-.4V9.956z"/>
    </svg>
  ),
  Bilibili: ({ size = 18, className = '' }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path d="M17.813 4.653h.854c1.51.054 2.769.578 3.773 1.574 1.004.995 1.524 2.249 1.56 3.76v7.36c-.036 1.51-.556 2.769-1.56 3.773s-2.262 1.524-3.773 1.56H5.333c-1.51-.036-2.769-.556-3.773-1.56S.036 18.858 0 17.347v-7.36c.036-1.511.556-2.765 1.56-3.76 1.004-.996 2.262-1.52 3.773-1.574h.774l-1.174-1.12a1.234 1.234 0 0 1-.373-.906c0-.356.124-.658.373-.907l.027-.027c.267-.249.573-.373.92-.373.347 0 .653.124.92.373L9.653 4.44c.071.071.134.142.187.213h4.267a.836.836 0 0 1 .16-.213l2.853-2.747c.267-.249.573-.373.92-.373.347 0 .662.151.929.4.267.249.391.551.391.907 0 .355-.124.657-.373.906zM5.333 7.24c-.746.018-1.373.276-1.88.773-.506.498-.769 1.13-.786 1.894v7.52c.017.764.28 1.395.786 1.893.507.498 1.134.756 1.88.773h13.334c.746-.017 1.373-.275 1.88-.773.506-.498.769-1.129.786-1.893v-7.52c-.017-.765-.28-1.396-.786-1.894-.507-.497-1.134-.755-1.88-.773zM8 11.107c.373 0 .684.124.933.373.25.249.383.569.4.96v1.173c-.017.391-.15.711-.4.96-.249.25-.56.374-.933.374s-.684-.125-.933-.374c-.25-.249-.383-.569-.4-.96V12.44c0-.373.129-.689.386-.947.258-.257.574-.386.947-.386zm8 0c.373 0 .684.124.933.373.25.249.383.569.4.96v1.173c-.017.391-.15.711-.4.96-.249.25-.56.374-.933.374s-.684-.125-.933-.374c-.25-.249-.383-.569-.4-.96V12.44c.017-.391.15-.711.4-.96.249-.249.56-.373.933-.373z"/>
    </svg>
  ),
  Github: ({ size = 18, className = '' }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
    </svg>
  ),
  Juejin: ({ size = 18, className = '' }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path d="M12 14.316l7.454-5.88-2.022-1.625L12 11.1l-5.432-4.288-2.022 1.625 7.454 5.88zm0-7.247l2.89-2.298L12 2.453l-2.89 2.318 2.89 2.298zM4.654 8.953L12 14.769l7.346-5.816-2.023-1.625L12 13.144l-5.323-4.216-2.023 1.625zM12 17.1l-2.89-2.298-2.022 1.625L12 22.19l4.912-3.963-2.022-1.625L12 17.1z"/>
    </svg>
  ),
  Douyin: ({ size = 18, className = '' }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z"/>
    </svg>
  ),
  Search: ({ size = 18, className = '' }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <circle cx="11" cy="11" r="8" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  ),
  Basketball: ({ size = 18, className = '' }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <circle cx="12" cy="12" r="10" />
      <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
      <path d="M2 12h20" />
    </svg>
  ),
  News: ({ size = 18, className = '' }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M4 22h16a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2H8a2 2 0 0 0-2 2v16a2 2 0 0 1-2 2Zm0 0a2 2 0 0 1-2-2v-9c0-1.1.9-2 2-2h2" />
      <path d="M18 14h-8" />
      <path d="M15 18h-5" />
      <path d="M10 6h8v4h-8V6Z" />
    </svg>
  ),
  Sparkles: ({ size = 18, className = '' }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z" />
      <path d="M5 3v4" />
      <path d="M19 17v4" />
      <path d="M3 5h4" />
      <path d="M17 19h4" />
    </svg>
  ),
  Megaphone: ({ size = 18, className = '' }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="m3 11 18-5v12L3 13v-2z" />
      <path d="M11.6 16.8a3 3 0 1 1-5.8-1.6" />
    </svg>
  ),

  // UI icons
  Sun: ({ size = 18, className = '' }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2" />
      <path d="M12 20v2" />
      <path d="m4.93 4.93 1.41 1.41" />
      <path d="m17.66 17.66 1.41 1.41" />
      <path d="M2 12h2" />
      <path d="M20 12h2" />
      <path d="m6.34 17.66-1.41 1.41" />
      <path d="m19.07 4.93-1.41 1.41" />
    </svg>
  ),
  Moon: ({ size = 18, className = '' }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" />
    </svg>
  ),
  Menu: ({ size = 20, className = '' }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <line x1="4" x2="20" y1="12" y2="12" />
      <line x1="4" x2="20" y1="6" y2="6" />
      <line x1="4" x2="20" y1="18" y2="18" />
    </svg>
  ),
  X: ({ size = 20, className = '' }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M18 6 6 18" />
      <path d="m6 6 12 12" />
    </svg>
  ),
  Fish: ({ size = 24, className = '' }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c1.5 0 2.5-1 2.5-2.5 0-.5-.2-1-.4-1.4-.3-.4-.4-.8-.4-1.2 0-1.1.9-2 2-2h2.3c3.3 0 6-2.7 6-6 0-4.4-4.5-8-10-8zm-3 12c-.8 0-1.5-.7-1.5-1.5S8.2 11 9 11s1.5.7 1.5 1.5S9.8 14 9 14zm3-4c-.8 0-1.5-.7-1.5-1.5S11.2 7 12 7s1.5.7 1.5 1.5S12.8 10 12 10zm4 2c-.8 0-1.5-.7-1.5-1.5S15.2 9 16 9s1.5.7 1.5 1.5S16.8 12 16 12z"/>
    </svg>
  ),
  ChevronRight: ({ size = 12, className = '' }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="m9 18 6-6-6-6" />
    </svg>
  ),
  ChevronDown: ({ size = 12, className = '' }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="m6 9 6 6 6-6" />
    </svg>
  ),
}

// Navigation items with SVG icons
const navItems = [
  { id: 'home', icon: Icons.Home, label: '首页' },
  { id: 'todo', icon: Icons.CheckCircle, label: '待办' },
  { id: 'tools', icon: Icons.Wrench, label: '工具箱' },
  { id: 'games', icon: Icons.Gamepad, label: '游戏中心' },
]

// Platform items with SVG icons
const platformItems = [
  { id: 'platform_zhihu', key: 'zhihu', icon: Icons.Zhihu, label: '知乎', stroke: false },
  { id: 'platform_weibo', key: 'weibo', icon: Icons.Sparkles, label: '微博', stroke: true },
  { id: 'platform_bilibili', key: 'bilibili', icon: Icons.Bilibili, label: 'B站', stroke: false },
  { id: 'platform_github', key: 'github', icon: Icons.Github, label: 'GitHub', stroke: false },
  { id: 'platform_juejin', key: 'juejin', icon: Icons.Juejin, label: '掘金', stroke: false },
  { id: 'platform_douyin', key: 'douyin', icon: Icons.Douyin, label: '抖音', stroke: false },
  { id: 'platform_baidu', key: 'baidu', icon: Icons.Search, label: '百度', stroke: true },
  { id: 'platform_hupu', key: 'hupu', icon: Icons.Basketball, label: '虎扑', stroke: true },
  { id: 'platform_36kr', key: '36kr', icon: Icons.News, label: '36氪', stroke: true },
  { id: 'platform_sspai', key: 'sspai', icon: Icons.Sparkles, label: '少数派', stroke: true },
  { id: 'platform_toutiao', key: 'toutiao', icon: Icons.Megaphone, label: '头条', stroke: true },
]

export default function Sidebar({ activePage, onNavigate }) {
  const { colors, toggleTheme, isDark } = useTheme()
  const [hoveredId, setHoveredId] = useState(null)
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768)
  const [isCollapsed, setIsCollapsed] = useState(window.innerWidth <= 768)
  const [platformExpanded, setPlatformExpanded] = useState(false)

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
          boxShadow: `0 4px 16px ${colors.accent}40`,
          fontSize: 20, cursor: 'pointer', display: 'flex',
          alignItems: 'center', justifyContent: 'center',
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = 'scale(1.1)'
          e.currentTarget.style.boxShadow = `0 6px 24px ${colors.accent}60`
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = 'scale(1)'
          e.currentTarget.style.boxShadow = `0 4px 16px ${colors.accent}40`
        }}
      >
        <Icons.Menu size={22} />
      </button>
    )
  }

  return (
    <>
      {isMobile && !isCollapsed && (
        <div
          onClick={() => setIsCollapsed(true)}
          style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
            zIndex: 99, transition: 'opacity 0.3s',
            backdropFilter: 'blur(2px)',
          }}
        />
      )}
      <nav style={{
        width: isMobile ? 220 : 64, minWidth: isMobile ? 220 : 64,
        background: colors.sidebarBg,
        display: 'flex', flexDirection: 'column', alignItems: isMobile ? 'flex-start' : 'center',
        borderRight: `1px solid ${colors.border}`,
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        position: isMobile ? 'fixed' : 'relative',
        left: isMobile ? (isCollapsed ? -220 : 0) : 0,
        top: 0, bottom: 0, zIndex: 100,
      }}>
      {/* Logo area */}
      <div style={{
        width: '100%', display: 'flex', alignItems: 'center',
        justifyContent: isMobile ? 'space-between' : 'center',
        padding: isMobile ? '20px 16px 16px' : '20px 0 16px',
        borderBottom: `1px solid ${colors.border}`,
        marginBottom: 8, transition: 'border-color 0.3s',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Icons.Fish size={28} style={{ color: colors.accent }} />
        </div>
        {isMobile && (
          <button
            onClick={() => setIsCollapsed(true)}
            style={{
              background: 'none', border: 'none',
              color: colors.textSecondary, cursor: 'pointer',
              padding: 4, borderRadius: 6,
              transition: 'all 0.2s',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = colors.hover
              e.currentTarget.style.color = colors.text
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'transparent'
              e.currentTarget.style.color = colors.textSecondary
            }}
          >
            <Icons.X size={20} />
          </button>
        )}
      </div>

      {/* Nav items */}
      <div style={{
        display: 'flex', flexDirection: 'column',
        alignItems: isMobile ? 'stretch' : 'center',
        gap: 4, flex: 1, width: isMobile ? '100%' : 'auto', padding: isMobile ? '0 12px' : 0,
        overflowY: 'auto', overflowX: 'hidden',
      }}>
        {navItems.map((item) => {
          const isActive = activePage === item.id || (item.id === 'home' && activePage.startsWith('platform_'))
          const isHovered = hoveredId === item.id
          const isHome = item.id === 'home'
          const IconComponent = item.icon
          return (
            <div key={item.id} style={{ width: isMobile ? '100%' : 'auto' }}>
              <button
                style={{
                  width: isMobile ? '100%' : 48, height: 48,
                  display: 'flex', flexDirection: isMobile ? 'row' : 'column',
                  alignItems: 'center', justifyContent: isMobile ? 'flex-start' : 'center',
                  gap: isMobile ? 12 : 0,
                  padding: isMobile ? '0 12px' : 0,
                  borderRadius: 12,
                  cursor: 'pointer', border: 'none', position: 'relative',
                  background: isActive ? colors.accentLight : isHovered ? colors.hover : 'transparent',
                  transform: isHovered && !isMobile ? 'scale(1.08)' : 'scale(1)',
                  transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
                }}
                onClick={() => {
                  if (isHome) {
                    setPlatformExpanded(!platformExpanded)
                  }
                  handleNavigate(item.id)
                }}
                onMouseEnter={() => setHoveredId(item.id)}
                onMouseLeave={() => setHoveredId(null)}
              >
                {/* Active indicator bar */}
                {isActive && (
                  <span style={{
                    position: 'absolute', left: isMobile ? 0 : -6,
                    top: '50%', transform: 'translateY(-50%)',
                    width: isMobile ? 4 : 3, height: isMobile ? 28 : 24,
                    borderRadius: 3,
                    background: `linear-gradient(180deg, ${colors.accent}, ${colors.accent}80)`,
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                    boxShadow: `0 0 12px ${colors.accent}60`,
                  }} />
                )}
                <IconComponent
                  size={20}
                  className="nav-icon"
                  style={{
                    color: isActive ? colors.accent : colors.textSecondary,
                    transition: 'color 0.2s, transform 0.2s',
                    transform: isHovered ? 'scale(1.1)' : 'scale(1)',
                  }}
                />
                <span style={{
                  fontSize: isMobile ? 14 : 10, marginTop: isMobile ? 0 : 4,
                  fontWeight: isActive ? 600 : 500,
                  color: isActive ? colors.accent : colors.textSecondary,
                  transition: 'color 0.2s',
                }}>{item.label}</span>

                {/* Expand indicator for home */}
                {isHome && (
                  <span style={{
                    position: 'absolute', right: isMobile ? 12 : '50%',
                    bottom: isMobile ? '50%' : 4,
                    transform: isMobile ? 'translateY(50%)' : 'translateX(50%)',
                    color: colors.textSecondary,
                    transition: 'transform 0.2s, color 0.2s',
                    display: 'flex',
                    alignItems: 'center',
                  }}>
                    {platformExpanded ?
                      <Icons.ChevronDown size={12} /> :
                      <Icons.ChevronRight size={12} />
                    }
                  </span>
                )}

                {/* Tooltip with left-pointing arrow (desktop only) */}
                {isHovered && !isMobile && (
                  <span style={{
                    position: 'absolute', left: 56, top: '50%', transform: 'translateY(-50%)',
                    background: colors.cardBg, color: colors.text,
                    padding: '6px 14px', borderRadius: 8, fontSize: 12,
                    whiteSpace: 'nowrap', zIndex: 1000, pointerEvents: 'none',
                    border: `1px solid ${colors.border}`,
                    boxShadow: `0 4px 12px ${colors.shadow}`,
                    display: 'flex', alignItems: 'center',
                    fontWeight: 500,
                  }}>
                    {/* Left-pointing triangle */}
                    <span style={{
                      position: 'absolute', left: -6, top: '50%', transform: 'translateY(-50%)',
                      width: 0, height: 0,
                      borderTop: '6px solid transparent',
                      borderBottom: '6px solid transparent',
                      borderRight: `6px solid ${colors.border}`,
                    }} />
                    <span style={{
                      position: 'absolute', left: -5, top: '50%', transform: 'translateY(-50%)',
                      width: 0, height: 0,
                      borderTop: '6px solid transparent',
                      borderBottom: '6px solid transparent',
                      borderRight: `6px solid ${colors.cardBg}`,
                    }} />
                    {item.label}
                  </span>
                )}
              </button>

              {/* Platform submenu */}
              {isHome && platformExpanded && (
                <div style={{
                  display: 'flex', flexDirection: 'column',
                  gap: 2, marginTop: 4, marginLeft: isMobile ? 20 : 0,
                  paddingLeft: isMobile ? 0 : 4,
                }}>
                  {platformItems.map((platform) => {
                    const isPlatformActive = activePage === platform.id
                    const isPlatformHovered = hoveredId === platform.id
                    const PlatformIcon = platform.icon
                    return (
                      <button
                        key={platform.id}
                        style={{
                          width: isMobile ? '100%' : 44, height: 44,
                          display: 'flex', flexDirection: isMobile ? 'row' : 'column',
                          alignItems: 'center', justifyContent: isMobile ? 'flex-start' : 'center',
                          gap: isMobile ? 10 : 0,
                          padding: isMobile ? '0 12px' : 0,
                          borderRadius: 10,
                          cursor: 'pointer', border: 'none', position: 'relative',
                          background: isPlatformActive ? colors.accentLight : isPlatformHovered ? colors.hover : 'transparent',
                          transform: isPlatformHovered && !isMobile ? 'scale(1.05)' : 'scale(1)',
                          transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
                          marginLeft: isMobile ? 0 : 4,
                        }}
                        onClick={() => handleNavigate(platform.id)}
                        onMouseEnter={() => setHoveredId(platform.id)}
                        onMouseLeave={() => setHoveredId(null)}
                      >
                        {isPlatformActive && (
                          <span style={{
                            position: 'absolute', left: isMobile ? 0 : -2,
                            top: '50%', transform: 'translateY(-50%)',
                            width: isMobile ? 3 : 2, height: isMobile ? 20 : 16,
                            borderRadius: 2,
                            background: colors.accent,
                            boxShadow: `0 0 8px ${colors.accent}50`,
                          }} />
                        )}
                        <PlatformIcon
                          size={18}
                          style={{
                            color: isPlatformActive ? colors.accent : colors.textSecondary,
                            transition: 'color 0.2s, transform 0.2s',
                            transform: isPlatformHovered ? 'scale(1.1)' : 'scale(1)',
                          }}
                        />
                        {isMobile && (
                          <span style={{
                            fontSize: 13,
                            fontWeight: isPlatformActive ? 600 : 500,
                            color: isPlatformActive ? colors.accent : colors.textSecondary,
                          }}>{platform.label}</span>
                        )}

                        {isPlatformHovered && !isMobile && (
                          <span style={{
                            position: 'absolute', left: 52, top: '50%', transform: 'translateY(-50%)',
                            background: colors.cardBg, color: colors.text,
                            padding: '5px 12px', borderRadius: 8, fontSize: 12,
                            whiteSpace: 'nowrap', zIndex: 1000, pointerEvents: 'none',
                            border: `1px solid ${colors.border}`,
                            boxShadow: `0 4px 12px ${colors.shadow}`,
                            fontWeight: 500,
                          }}>
                            <span style={{
                              position: 'absolute', left: -5, top: '50%', transform: 'translateY(-50%)',
                              width: 0, height: 0,
                              borderTop: '5px solid transparent',
                              borderBottom: '5px solid transparent',
                              borderRight: `5px solid ${colors.cardBg}`,
                            }} />
                            {platform.label}
                          </span>
                        )}
                      </button>
                    )
                  })}
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Bottom section: theme toggle + version */}
      <div style={{
        display: 'flex', flexDirection: isMobile ? 'row' : 'column',
        alignItems: 'center', justifyContent: isMobile ? 'space-between' : 'center',
        padding: isMobile ? '14px 16px' : '14px 0',
        gap: 8, borderTop: `1px solid ${colors.border}`,
        width: '100%', transition: 'border-color 0.3s',
      }}>
        <button
          onClick={toggleTheme}
          onMouseEnter={() => setHoveredId('theme')}
          onMouseLeave={() => setHoveredId(null)}
          style={{
            width: isMobile ? '100%' : 44, height: 44,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            gap: isMobile ? 10 : 0,
            borderRadius: 12, cursor: 'pointer',
            border: `1px solid ${colors.border}`,
            background: hoveredId === 'theme' ? colors.hover : 'transparent',
            color: colors.text, position: 'relative',
            transform: hoveredId === 'theme' && !isMobile ? 'scale(1.08)' : 'scale(1)',
            transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
          }}
          title={isDark ? '切换日间模式' : '切换夜间模式'}
        >
          {isDark ?
            <Icons.Sun size={18} style={{ color: '#FCD34D' }} /> :
            <Icons.Moon size={18} style={{ color: '#818CF8' }} />
          }
          {isMobile && (
            <span style={{
              fontSize: 14,
              fontWeight: 500,
              color: colors.text,
            }}>
              {isDark ? '日间模式' : '夜间模式'}
            </span>
          )}
          {hoveredId === 'theme' && !isMobile && (
            <span style={{
              position: 'absolute', left: 52, top: '50%', transform: 'translateY(-50%)',
              background: colors.cardBg, color: colors.text,
              padding: '6px 14px', borderRadius: 8, fontSize: 12,
              whiteSpace: 'nowrap', zIndex: 1000, pointerEvents: 'none',
              border: `1px solid ${colors.border}`,
              boxShadow: `0 4px 12px ${colors.shadow}`,
              fontWeight: 500,
            }}>
              <span style={{
                position: 'absolute', left: -6, top: '50%', transform: 'translateY(-50%)',
                width: 0, height: 0,
                borderTop: '6px solid transparent',
                borderBottom: '6px solid transparent',
                borderRight: `6px solid ${colors.border}`,
              }} />
              <span style={{
                position: 'absolute', left: -5, top: '50%', transform: 'translateY(-50%)',
                width: 0, height: 0,
                borderTop: '6px solid transparent',
                borderBottom: '6px solid transparent',
                borderRight: `6px solid ${colors.cardBg}`,
              }} />
              {isDark ? '日间模式' : '夜间模式'}
            </span>
          )}
        </button>
        <span style={{
          fontSize: 11, color: colors.textMuted, letterSpacing: 0.5,
          fontWeight: 500,
        }}>v1.1</span>
      </div>
    </nav>
    </>
  )
}
