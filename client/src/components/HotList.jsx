import { useState, useEffect, useCallback, useRef } from 'react'
import { useTheme } from '../ThemeContext.jsx'
import { useToast } from '../App.jsx'

const TABS = [
  { key: 'zhihu', label: '知乎', icon: '💬' },
  { key: 'weibo', label: '微博', icon: '🔥' },
  { key: 'bilibili', label: 'B站', icon: '📺' },
  { key: 'juejin', label: '掘金', icon: '💎' },
  { key: 'github', label: 'GitHub', icon: '🐙' },
  { key: 'douyin', label: '抖音', icon: '🎵' },
  { key: 'baidu', label: '百度', icon: '🔍' },
  { key: 'hupu', label: '虎扑', icon: '🏀' },
  { key: '36kr', label: '36氪', icon: '📰' },
  { key: 'sspai', label: '少数派', icon: '✨' },
  { key: 'toutiao', label: '头条', icon: '📢' },
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
    animation: 'hotlist-shimmer 1.5s infinite ease-in-out',
  }
  return (
    <div style={{ padding: '4px 0', display: 'flex', flexDirection: 'column', gap: 10 }}>
      {SKELETON_WIDTHS.map((w, i) => (
        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ ...base, width: 28, height: 28, flexShrink: 0, animationDelay: `${i * 0.08}s` }} />
          <div style={{ ...base, width: w, height: 20, flex: 1, animationDelay: `${i * 0.08}s` }} />
        </div>
      ))}
    </div>
  )
}

function EmptyState({ colors }) {
  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      padding: '48px 16px', color: colors.textMuted, gap: 8,
    }}>
      <span style={{ fontSize: 36 }}>📭</span>
      <span style={{ fontSize: 14 }}>暂无数据</span>
    </div>
  )
}

function ErrorState({ colors, onRetry }) {
  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      padding: '48px 16px', color: colors.textMuted, gap: 12,
    }}>
      <span style={{ fontSize: 36 }}>😵</span>
      <span style={{ fontSize: 14 }}>加载失败，请稍后重试</span>
      <button
        onClick={onRetry}
        style={{
          padding: '6px 20px', borderRadius: 20, border: 'none',
          background: colors.accent, color: '#fff', fontSize: 13,
          cursor: 'pointer', transition: 'opacity 0.2s',
        }}
        onMouseEnter={(e) => { e.currentTarget.style.opacity = '0.85' }}
        onMouseLeave={(e) => { e.currentTarget.style.opacity = '1' }}
      >
        重试
      </button>
    </div>
  )
}

function RankBadge({ rank, colors }) {
  const isTop3 = rank <= 3
  const medalColors = { 1: '#ffd700', 2: '#c0c0c0', 3: '#cd7f32' }
  const bg = isTop3 ? medalColors[rank] : colors.inputBg
  const color = isTop3 ? '#fff' : colors.textSecondary
  return (
    <span style={{
      width: 28, height: 28, borderRadius: 8, display: 'inline-flex',
      alignItems: 'center', justifyContent: 'center', fontSize: 12,
      fontWeight: 700, background: bg, color, flexShrink: 0,
      transition: 'background 0.2s',
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
    width: 32, height: 32, borderRadius: '50%', border: 'none',
    background: colors.hover, color: colors.textSecondary,
    cursor: loading ? 'default' : 'pointer', fontSize: 16,
    display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
    flexShrink: 0, transition: 'background 0.2s',
    animation: loading ? 'hotlist-spin 1s linear infinite' : 'none',
  }

  const listContainerStyle = {
    flex: 1, overflowY: 'auto', padding: '4px 12px 12px',
    scrollbarWidth: 'thin',
    scrollbarColor: `${colors.scrollThumb} ${colors.scrollTrack}`,
  }

  const itemStyle = (isHover) => ({
    display: 'flex', alignItems: 'center', gap: 10,
    padding: '8px 10px', borderRadius: 10,
    transition: 'background 0.15s ease',
    cursor: 'pointer', textDecoration: 'none',
    background: isHover ? colors.hover : 'transparent',
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
          title="刷新"
          onMouseEnter={(e) => { if (!loading) e.currentTarget.style.background = colors.accentLight }}
          onMouseLeave={(e) => { e.currentTarget.style.background = colors.hover }}
        >
          🔄
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
          </div>
        )}
        <div style={{ width: 12, flexShrink: 0 }} />
      </div>

      {/* Content */}
      <div style={listContainerStyle}>
        {loading ? (
          <SkeletonLoader colors={colors} />
        ) : error && items.length === 0 ? (
          <ErrorState colors={colors} onRetry={handleRefresh} />
        ) : items.length === 0 ? (
          <EmptyState colors={colors} />
        ) : (
          items.map((item, idx) => (
            <a
              key={idx}
              href={item.url}
              target="_blank"
              rel="noopener noreferrer"
              title={item.title}
              style={itemStyle(hoveredIdx === idx)}
              onMouseEnter={() => setHoveredIdx(idx)}
              onMouseLeave={() => setHoveredIdx(null)}
            >
              <RankBadge rank={idx + 1} colors={colors} />
              <span style={{
                flex: 1, fontSize: 14, color: colors.text,
                overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                transition: 'color 0.15s',
              }}>
                {item.title}
              </span>
              {item.hot && (
                <span style={{
                  fontSize: 12, color: colors.accent, flexShrink: 0,
                  fontWeight: 500, opacity: 0.85,
                }}>
                  {item.hot}
                </span>
              )}
            </a>
          ))
        )}
      </div>

      {/* Update time footer */}
      {updateTime && !loading && (
        <div style={{
          padding: '8px 14px', fontSize: 11, color: colors.textMuted,
          borderTop: `1px solid ${colors.border}`, textAlign: 'right',
          transition: 'color 0.2s',
        }}>
          更新于 {formatRelativeTime(updateTime)}
        </div>
      )}
    </div>
  )
}

export default function HotList() {
  const [sources, setSources] = useState(['zhihu', 'weibo'])
  const [isSingle, setIsSingle] = useState(window.innerWidth < 900)

  useEffect(() => {
    const onResize = () => setIsSingle(window.innerWidth < 900)
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])

  const handleSourceChange = (panelIdx, newSource) => {
    setSources((prev) => {
      const next = [...prev]
      next[panelIdx] = newSource
      return next
    })
  }

  const panelCount = isSingle ? 1 : 2

  return (
    <>
      <style>{`
        @keyframes hotlist-shimmer {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
        @keyframes hotlist-spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        .hotlist-hide-scrollbar::-webkit-scrollbar { display: none; }
      `}</style>
      <div style={{
        display: 'grid',
        gridTemplateColumns: isSingle ? '1fr' : '1fr 1fr',
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
