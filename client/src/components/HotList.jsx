import { useState, useEffect, useCallback, useRef } from 'react'
import { useTheme } from '../ThemeContext.jsx'
import { useToast } from '../App.jsx'
import HotlistAnalytics from './HotlistAnalytics.jsx'
import { ShareButton, FavoritesPanel } from './SocialFeatures.jsx'

// SVG Icons - Retro-Futurism Style
const Icons = {
  refresh: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 12a9 9 0 11-2.636-6.364"/>
      <path d="M21 3v6h-6"/>
    </svg>
  ),
  chart: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 20V10"/>
      <path d="M12 20V4"/>
      <path d="M6 20v-6"/>
    </svg>
  ),
  empty: (
    <svg width="48" height="48" viewBox="0 0 64 64" fill="none">
      <circle cx="32" cy="32" r="28" stroke="currentColor" strokeWidth="2" strokeDasharray="4 4" opacity="0.4"/>
      <rect x="20" y="28" width="24" height="3" rx="1.5" fill="currentColor" opacity="0.3"/>
      <rect x="24" y="34" width="16" height="3" rx="1.5" fill="currentColor" opacity="0.3"/>
      <circle cx="26" cy="22" r="4" fill="currentColor" opacity="0.2"/>
      <circle cx="38" cy="22" r="4" fill="currentColor" opacity="0.2"/>
    </svg>
  ),
  error: (
    <svg width="48" height="48" viewBox="0 0 64 64" fill="none">
      <circle cx="32" cy="32" r="28" stroke="currentColor" strokeWidth="2" opacity="0.4"/>
      <circle cx="32" cy="32" r="16" fill="currentColor" opacity="0.1"/>
      <path d="M24 24l16 16M40 24l-16 16" stroke="currentColor" strokeWidth="3" strokeLinecap="round" opacity="0.6"/>
    </svg>
  ),
  star: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
    </svg>
  ),
}

// Platform icons as SVG
const PlatformIcons = {
  zhihu: <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><text x="4" y="18" fontSize="14" fontWeight="bold">知</text></svg>,
  weibo: <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="12" r="10" strokeWidth="0"/><text x="6" y="16" fontSize="10" fill="#fff">微</text></svg>,
  bilibili: <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><rect x="2" y="6" width="20" height="14" rx="4"/><circle cx="8" cy="13" r="2" fill="#fff"/><circle cx="16" cy="13" r="2" fill="#fff"/></svg>,
  juejin: <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><polygon points="12,2 22,10 12,18 2,10"/></svg>,
  github: <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.477 2 2 6.477 2 12c0 4.42 2.865 8.17 6.839 9.49.5.092.682-.217.682-.482 0-.237-.008-.866-.013-1.7-2.782.604-3.369-1.34-3.369-1.34-.454-1.156-1.11-1.464-1.11-1.464-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.831.092-.646.35-1.086.636-1.336-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.294 2.747-1.025 2.747-1.025.546 1.377.203 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.578.688.48C19.138 20.167 22 16.418 22 12c0-5.523-4.477-10-10-10z"/></svg>,
  douyin: <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-5.2 1.74 2.89 2.89 0 012.31-4.64 2.93 2.93 0 01.88.13V9.4a6.84 6.84 0 00-1-.05A6.33 6.33 0 005 20.1a6.34 6.34 0 0010.86-4.43v-7a8.16 8.16 0 004.77 1.52v-3.4a4.85 4.85 0 01-1-.1z"/></svg>,
  baidu: <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M5.927 12.497c2.063-.443 1.782-2.909 1.72-3.448-.101-.87-.853-2.357-2.364-2.247-1.859.135-1.99 2.129-1.99 2.129-.226 1.363.574 3.009 2.634 3.566zm4.088-4.99c1.356 0 2.456-1.498 2.456-3.346C12.471 2.312 11.371.814 10.015.814c-1.356 0-2.456 1.498-2.456 3.347 0 1.848 1.1 3.346 2.456 3.346zm6.037.222c1.567.181 2.364-1.367 2.545-2.497.18-1.13-.536-2.469-1.698-2.648-1.162-.18-2.324.85-2.506 2.16-.18 1.31.091 2.804 1.659 2.985zm3.46 4.316s-2.216-1.617-3.46-2.23c-1.513-.746-3.116-.238-3.88.683-.764.922-.68 2.27-.238 2.954.443.684 1.862 1.407 1.862 1.407s-1.637 1.063-1.862 1.776c-.226.713.028 1.716.903 2.103.875.386 1.85.101 2.42-.523.57-.624.625-1.63.282-2.32-.343-.689-1.246-1.27-1.246-1.27s2.574-.226 3.474-1.547c.9-1.32.438-2.277.438-2.277s1.093.464 1.307 1.244z"/></svg>,
  hupu: <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="12" r="10"/><text x="7" y="16" fontSize="10" fill="#fff">虎</text></svg>,
  '36kr': <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><rect x="2" y="4" width="20" height="16" rx="2"/><text x="5" y="15" fontSize="8" fill="#fff">36</text></svg>,
  sspai: <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/></svg>,
  toutiao: <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M7 12h10M12 7v10" stroke="#fff" strokeWidth="2"/></svg>,
}

const TABS = [
  { key: 'zhihu', label: '知乎', icon: PlatformIcons.zhihu },
  { key: 'weibo', label: '微博', icon: PlatformIcons.weibo },
  { key: 'bilibili', label: 'B站', icon: PlatformIcons.bilibili },
  { key: 'juejin', label: '掘金', icon: PlatformIcons.juejin },
  { key: 'github', label: 'GitHub', icon: PlatformIcons.github },
  { key: 'douyin', label: '抖音', icon: PlatformIcons.douyin },
  { key: 'baidu', label: '百度', icon: PlatformIcons.baidu },
  { key: 'hupu', label: '虎扑', icon: PlatformIcons.hupu },
  { key: '36kr', label: '36氪', icon: PlatformIcons['36kr'] },
  { key: 'sspai', label: '少数派', icon: PlatformIcons.sspai },
  { key: 'toutiao', label: '头条', icon: PlatformIcons.toutiao },
]

const SKELETON_WIDTHS = ['90%', '75%', '85%', '60%', '80%', '70%', '88%', '65%']

function formatRelativeTime(timeStr) {
  if (!timeStr) return ''
  const now = Date.now()
  const then = new Date(timeStr).getTime()
  if (isNaN(then)) return timeStr
  const diff = Math.max(0, Math.floor((now - then) / 1000))
  if (diff < 60) return '刚刚'
  if (diff < 3600) return `${Math.floor(diff / 60)}分钟前`
  if (diff < 86400) return `${Math.floor(diff / 3600)}小时前`
  return `${Math.floor(diff / 86400)}天前`
}

function SkeletonLoader({ colors }) {
  const base = {
    borderRadius: 8,
    background: `linear-gradient(90deg, ${colors.inputBg} 25%, ${colors.hover} 50%, ${colors.inputBg} 75%)`,
    backgroundSize: '200% 100%',
    animation: 'hotlist-shimmer 1.8s infinite ease-in-out',
  }
  return (
    <div style={{ padding: '8px 0', display: 'flex', flexDirection: 'column', gap: 12 }}>
      {SKELETON_WIDTHS.map((w, i) => (
        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '0 4px' }}>
          <div style={{
            ...base,
            width: 32,
            height: 32,
            flexShrink: 0,
            animationDelay: `${i * 0.1}s`,
            borderRadius: 10,
          }} />
          <div style={{
            ...base,
            width: w,
            height: 18,
            flex: 1,
            animationDelay: `${i * 0.1}s`,
            borderRadius: 6,
          }} />
        </div>
      ))}
    </div>
  )
}

function EmptyState({ colors }) {
  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      padding: '56px 16px', color: colors.textMuted, gap: 12,
    }}>
      <div style={{
        color: colors.textMuted,
        opacity: 0.6,
        animation: 'hotlist-float 3s ease-in-out infinite',
      }}>
        {Icons.empty}
      </div>
      <span style={{ fontSize: 15, fontWeight: 500, color: colors.textSecondary }}>暂无数据</span>
      <span style={{ fontSize: 12, opacity: 0.7 }}>请尝试切换平台或稍后刷新</span>
    </div>
  )
}

function ErrorState({ colors, onRetry }) {
  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      padding: '56px 16px', color: colors.textMuted, gap: 12,
    }}>
      <div style={{
        color: colors.accent,
        opacity: 0.5,
        animation: 'hotlist-pulse 2s ease-in-out infinite',
      }}>
        {Icons.error}
      </div>
      <span style={{ fontSize: 15, fontWeight: 500, color: colors.textSecondary }}>加载失败</span>
      <span style={{ fontSize: 12, opacity: 0.7 }}>网络连接异常，请稍后重试</span>
      <button
        onClick={onRetry}
        style={{
          marginTop: 8,
          padding: '8px 24px',
          borderRadius: 20,
          border: 'none',
          background: `linear-gradient(135deg, ${colors.accent}, ${colors.accent}dd)`,
          color: '#fff',
          fontSize: 13,
          fontWeight: 500,
          cursor: 'pointer',
          transition: 'all 0.2s ease',
          boxShadow: `0 2px 8px ${colors.accent}40`,
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = 'translateY(-1px)'
          e.currentTarget.style.boxShadow = `0 4px 12px ${colors.accent}60`
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = 'translateY(0)'
          e.currentTarget.style.boxShadow = `0 2px 8px ${colors.accent}40`
        }}
      >
        重新加载
      </button>
    </div>
  )
}

function RankBadge({ rank, colors }) {
  const isTop3 = rank <= 3
  // Retro-Futurism medal gradients
  const medalStyles = {
    1: {
      background: 'linear-gradient(135deg, #FFD700 0%, #FFA500 50%, #FFD700 100%)',
      boxShadow: '0 2px 8px rgba(255, 215, 0, 0.4)',
      color: '#1E293B',
    },
    2: {
      background: 'linear-gradient(135deg, #E8E8E8 0%, #C0C0C0 50%, #A8A8A8 100%)',
      boxShadow: '0 2px 8px rgba(192, 192, 192, 0.4)',
      color: '#1E293B',
    },
    3: {
      background: 'linear-gradient(135deg, #CD7F32 0%, #B87333 50%, #CD7F32 100%)',
      boxShadow: '0 2px 8px rgba(205, 127, 50, 0.4)',
      color: '#fff',
    },
  }

  const style = isTop3 ? medalStyles[rank] : {
    background: colors.inputBg,
    color: colors.textSecondary,
    boxShadow: 'none',
  }

  return (
    <span style={{
      width: 32,
      height: 32,
      borderRadius: 10,
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: 13,
      fontWeight: 700,
      flexShrink: 0,
      transition: 'all 0.2s ease',
      ...style,
    }}>
      {rank}
    </span>
  )
}

function HotPanel({ source, onSourceChange }) {
  const { colors } = useTheme()
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(false)
  const [updateTime, setUpdateTime] = useState('')
  const [hoveredIdx, setHoveredIdx] = useState(null)
  const [hoveredTab, setHoveredTab] = useState(null)
  const [hoveredBtn, setHoveredBtn] = useState(null)
  const [showAnalytics, setShowAnalytics] = useState(false)
  const tabBarRef = useRef(null)

  const fetchData = useCallback((src) => {
    setLoading(true)
    setError(false)
    fetch(`/api/hotlist/${src}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.success) {
          setItems(data.data || [])
          setUpdateTime(data.updateTime || '')
        } else {
          setError(true)
        }
      })
      .catch(() => {
        setItems([])
        setError(true)
      })
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    if (source) fetchData(source)
  }, [source, fetchData])

  const handleRefresh = () => {
    if (!loading && source) fetchData(source)
  }

  const showToast = useToast()

  // 导出当前热榜
  const exportHotlist = (format) => {
    const sourceName = TABS.find(t => t.key === source)?.label || source
    const timestamp = new Date().toISOString().split('T')[0]
    try {
      if (format === 'json') {
        const data = JSON.stringify({ source: sourceName, updateTime, items }, null, 2)
        const blob = new Blob([data], { type: 'application/json' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `${sourceName}-hotlist-${timestamp}.json`
        a.click()
        URL.revokeObjectURL(url)
      } else if (format === 'csv') {
        const headers = '排名,标题,热度,链接\n'
        const rows = items.map((item, idx) => `${idx + 1},"${(item.title || '').replace(/"/g, '""')}",${item.hot || ''},${item.url || ''}`).join('\n')
        const data = headers + rows
        const blob = new Blob(['\ufeff' + data], { type: 'text/csv;charset=utf-8;' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `${sourceName}-hotlist-${timestamp}.csv`
        a.click()
        URL.revokeObjectURL(url)
      }
      showToast && showToast(`导出成功！已保存为 ${format.toUpperCase()}`, 'success')
    } catch (err) {
      showToast && showToast('导出失败，请重试', 'error')
    }
  }

  const tabBarStyle = {
    display: 'flex', alignItems: 'center', gap: 6,
    padding: '12px 12px 8px', overflowX: 'auto',
    scrollbarWidth: 'none', msOverflowStyle: 'none',
  }

  const tabStyle = (isActive, isHover) => ({
    padding: '5px 14px', borderRadius: 20, border: 'none',
    background: isActive ? colors.accent : isHover ? colors.hover : 'transparent',
    color: isActive ? '#fff' : colors.textSecondary,
    cursor: 'pointer', fontSize: 13, fontWeight: isActive ? 600 : 400,
    transition: 'all 0.2s ease', whiteSpace: 'nowrap', flexShrink: 0,
    lineHeight: '22px',
  })

  const refreshBtnStyle = {
    width: 36,
    height: 36,
    borderRadius: '50%',
    border: 'none',
    background: colors.hover,
    color: colors.textSecondary,
    cursor: loading ? 'default' : 'pointer',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    transition: 'all 0.2s ease',
    animation: loading ? 'hotlist-spin 1s linear infinite' : 'none',
  }

  const listContainerStyle = {
    flex: 1, overflowY: 'auto', padding: '4px 12px 12px',
    scrollbarWidth: 'thin',
    scrollbarColor: `${colors.scrollThumb} ${colors.scrollTrack}`,
  }

  const itemStyle = (isHover, idx) => ({
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    padding: '10px 12px',
    borderRadius: 12,
    transition: 'all 0.2s ease',
    cursor: 'pointer',
    textDecoration: 'none',
    background: isHover ? colors.hover : 'transparent',
    animation: `hotlist-fadeIn 0.3s ease-out ${idx * 0.03}s both`,
  })

  return (
    <div style={{
      background: colors.cardBg, borderRadius: 14,
      border: `1px solid ${colors.border}`,
      boxShadow: `0 2px 12px ${colors.shadow}`,
      display: 'flex', flexDirection: 'column', overflow: 'hidden',
      transition: 'background 0.3s, border-color 0.3s, box-shadow 0.3s',
      minHeight: 0,
    }}>
      {/* Tab bar + refresh */}
      <div style={{ display: 'flex', alignItems: 'center', borderBottom: `1px solid ${colors.border}` }}>
        <div ref={tabBarRef} style={tabBarStyle} className="hotlist-hide-scrollbar">
          {TABS.map((t) => (
            <button
              key={t.key}
              style={tabStyle(source === t.key, hoveredTab === t.key)}
              onClick={() => onSourceChange(t.key)}
              onMouseEnter={() => setHoveredTab(t.key)}
              onMouseLeave={() => setHoveredTab(null)}
            >
              {t.icon} {t.label}
            </button>
          ))}
        </div>
        <button
          style={refreshBtnStyle}
          onClick={handleRefresh}
          title="刷新数据"
          onMouseEnter={(e) => { if (!loading) {
            e.currentTarget.style.background = colors.accentLight
            e.currentTarget.style.color = colors.accent
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = colors.hover
            e.currentTarget.style.color = colors.textSecondary
          }}
        >
          {Icons.refresh}
        </button>
        {items.length > 0 && (
          <div style={{ display: 'flex', gap: 6, marginRight: 8 }}>
            <button
              onClick={() => exportHotlist('json')}
              onMouseEnter={() => setHoveredBtn('json')}
              onMouseLeave={() => setHoveredBtn(null)}
              style={{
                padding: '5px 10px', borderRadius: 6,
                border: `1px solid ${hoveredBtn === 'json' ? colors.accent : colors.border}`,
                background: hoveredBtn === 'json' ? colors.accentLight : 'transparent',
                color: hoveredBtn === 'json' ? colors.accent : colors.textSecondary,
                cursor: 'pointer', fontSize: 11,
                transition: 'all 0.2s', whiteSpace: 'nowrap',
              }}
              title="导出为 JSON"
            >
              JSON
            </button>
            <button
              onClick={() => exportHotlist('csv')}
              onMouseEnter={() => setHoveredBtn('csv')}
              onMouseLeave={() => setHoveredBtn(null)}
              style={{
                padding: '5px 10px', borderRadius: 6,
                border: `1px solid ${hoveredBtn === 'csv' ? colors.accent : colors.border}`,
                background: hoveredBtn === 'csv' ? colors.accentLight : 'transparent',
                color: hoveredBtn === 'csv' ? colors.accent : colors.textSecondary,
                cursor: 'pointer', fontSize: 11,
                transition: 'all 0.2s', whiteSpace: 'nowrap',
              }}
              title="导出为 CSV"
            >
              CSV
            </button>
            <button
              onClick={() => setShowAnalytics(!showAnalytics)}
              onMouseEnter={() => setHoveredBtn('analytics')}
              onMouseLeave={() => setHoveredBtn(null)}
              style={{
                padding: '6px 12px', borderRadius: 8,
                border: `1px solid ${showAnalytics ? colors.accent : hoveredBtn === 'analytics' ? colors.accent : colors.border}`,
                background: showAnalytics ? colors.accentLight : hoveredBtn === 'analytics' ? colors.accentLight : 'transparent',
                color: showAnalytics ? colors.accent : hoveredBtn === 'analytics' ? colors.accent : colors.textSecondary,
                cursor: 'pointer', fontSize: 11,
                transition: 'all 0.2s ease',
                whiteSpace: 'nowrap',
                display: 'flex',
                alignItems: 'center',
                gap: 4,
              }}
              title="数据分析"
            >
              {Icons.chart}
              <span>分析</span>
            </button>
          </div>
        )}
        <div style={{ width: 12, flexShrink: 0 }} />
      </div>

      {/* Analytics Panel */}
      {showAnalytics && (
        <div style={{ maxHeight: 400, overflow: 'auto', padding: '0 12px' }}>
          <HotlistAnalytics source={source} />
        </div>
      )}

      {/* Content */}
      <div style={{ ...listContainerStyle, display: showAnalytics ? 'none' : 'block' }}>
        {loading ? (
          <SkeletonLoader colors={colors} />
        ) : error && items.length === 0 ? (
          <ErrorState colors={colors} onRetry={handleRefresh} />
        ) : items.length === 0 ? (
          <EmptyState colors={colors} />
        ) : (
          items.map((item, idx) => (
            <div
              key={idx}
              style={itemStyle(hoveredIdx === idx, idx)}
              onMouseEnter={() => setHoveredIdx(idx)}
              onMouseLeave={() => setHoveredIdx(null)}
            >
              <a
                href={item.url}
                target="_blank"
                rel="noopener noreferrer"
                title={item.title}
                style={{
                  display: 'flex', alignItems: 'center', gap: 10, flex: 1,
                  textDecoration: 'none', color: 'inherit', minWidth: 0,
                }}
              >
                <RankBadge rank={idx + 1} colors={colors} />
                <span style={{
                  flex: 1, fontSize: 14, color: colors.text,
                  overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                  transition: 'color 0.15s',
                }}>
                  {item.title}
                </span>
              </a>
              <div style={{ display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0 }}>
                {item.hot && (
                  <span style={{
                    fontSize: 12, color: colors.accent,
                    marginRight: 8,
                  }}>
                    {item.hot}
                  </span>
                )}
                <ShareButton item={{ ...item, source: TABS.find(t => t.key === source)?.label || source }} colors={colors} />
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}

function FavoritesButton({ colors, onClick }) {
  return (
    <button
      onClick={onClick}
      style={{
        position: 'fixed', bottom: 80, right: 20, zIndex: 99,
        width: 52, height: 52, borderRadius: '50%',
        background: `linear-gradient(135deg, ${colors.accent}, ${colors.accent}dd)`,
        color: '#fff',
        border: 'none',
        boxShadow: `0 4px 16px ${colors.accent}50`,
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        transition: 'all 0.25s ease',
      }}
      title="我的收藏"
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'scale(1.08)'
        e.currentTarget.style.boxShadow = `0 6px 20px ${colors.accent}60`
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'scale(1)'
        e.currentTarget.style.boxShadow = `0 4px 16px ${colors.accent}50`
      }}
    >
      {Icons.star}
    </button>
  )
}

export default function HotList({ singleSource = null }) {
  // 如果是单平台模式，只显示一个面板
  const [sources, setSources] = useState(singleSource ? [singleSource] : ['zhihu', 'weibo'])
  const [isSingle, setIsSingle] = useState(window.innerWidth < 900 || !!singleSource)
  const [showFavorites, setShowFavorites] = useState(false)

  useEffect(() => {
    if (singleSource) {
      setIsSingle(true)
      setSources([singleSource])
      return
    }
    const onResize = () => setIsSingle(window.innerWidth < 900)
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [singleSource])

  const handleSourceChange = (panelIdx, newSource) => {
    if (singleSource) return // 单平台模式不允许切换
    setSources((prev) => {
      const next = [...prev]
      next[panelIdx] = newSource
      return next
    })
  }

  const panelCount = singleSource ? 1 : (isSingle ? 1 : 2)
  const { colors } = useTheme()

  return (
    <>
      {showFavorites && (
        <FavoritesPanel colors={colors} onClose={() => setShowFavorites(false)} />
      )}
      <FavoritesButton colors={colors} onClick={() => setShowFavorites(true)} />
      <style>{`
        @keyframes hotlist-shimmer {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
        @keyframes hotlist-spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        @keyframes hotlist-float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-6px); }
        }
        @keyframes hotlist-pulse {
          0%, 100% { opacity: 0.5; transform: scale(1); }
          50% { opacity: 0.7; transform: scale(1.02); }
        }
        @keyframes hotlist-fadeIn {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .hotlist-hide-scrollbar::-webkit-scrollbar { display: none; }
      `}</style>
      <div style={{
        display: 'grid',
        gridTemplateColumns: isSingle || singleSource ? '1fr' : '1fr 1fr',
        gap: 16, padding: 16, height: '100%',
        overflow: 'hidden', boxSizing: 'border-box',
      }}>
        {Array.from({ length: panelCount }).map((_, i) => (
          <HotPanel
            key={i}
            source={sources[i]}
            onSourceChange={(src) => handleSourceChange(i, src)}
          />
        ))}
      </div>
    </>
  )
}
