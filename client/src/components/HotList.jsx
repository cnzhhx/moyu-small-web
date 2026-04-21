import { useState, useEffect, useCallback, useRef } from 'react'
import { useTheme } from '../ThemeContext.jsx'
import { 
  RefreshCwIcon, 
  ExternalLinkIcon,
  FlameIcon,
  MessageCircleIcon,
  VideoIcon,
  AwardIcon,
  SearchIcon,
  MusicIcon,
  NewspaperIcon,
} from './Icons.jsx'

// 热榜平台配置 - SVG 图标替代 emoji
const PLATFORMS = [
  { key: 'zhihu', label: '知乎', icon: MessageCircleIcon, color: '#0084ff' },
  { key: 'weibo', label: '微博', icon: FlameIcon, color: '#e6162d' },
  { key: 'bilibili', label: 'B站', icon: VideoIcon, color: '#fb7299' },
  { key: 'juejin', label: '掘金', icon: AwardIcon, color: '#1e80ff' },
  { key: 'douyin', label: '抖音', icon: MusicIcon, color: '#000000' },
  { key: 'baidu', label: '百度', icon: SearchIcon, color: '#2932e1' },
  { key: '36kr', label: '36氪', icon: NewspaperIcon, color: '#4285f4' },
  { key: 'toutiao', label: '头条', icon: FlameIcon, color: '#ed4040' },
]

// 响应式列数配置
function getGridColumns(width) {
  if (width >= 1800) return 4
  if (width >= 1400) return 3
  if (width >= 900) return 2
  return 1
}

// 格式化时间差（友好显示）
function formatTimeAgo(dateString) {
  if (!dateString) return '未知';

  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return '刚刚';
  if (diffMins < 60) return `${diffMins}分钟前`;
  if (diffHours < 24) return `${diffHours}小时前`;
  if (diffDays === 1) return '昨天';
  return `${diffDays}天前`;
}

// 排名徽章组件
function RankBadge({ rank, theme, tokens }) {
  const isTop3 = rank <= 3
  const colors = {
    1: { bg: '#FFD700', text: '#000' },
    2: { bg: '#C0C0C0', text: '#000' },
    3: { bg: '#CD7F32', text: '#fff' },
  }
  
  return (
    <div
      style={{
        width: '28px',
        height: '28px',
        borderRadius: tokens.borderRadius.base,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: tokens.typography.fontSize.sm,
        fontWeight: tokens.typography.fontWeight.bold,
        background: isTop3 ? colors[rank].bg : theme.bg.tertiary,
        color: isTop3 ? colors[rank].text : theme.text.tertiary,
        flexShrink: 0,
        boxShadow: isTop3 ? '0 2px 8px rgba(0,0,0,0.2)' : 'none',
      }}
    >
      {rank}
    </div>
  )
}



// 图片占位符组件
function ImagePlaceholder({ theme, tokens }) {
  return (
    <div
      style={{
        width: '60px',
        height: '45px',
        borderRadius: tokens.borderRadius.sm,
        background: theme.bg.tertiary,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
      }}
    >
      <VideoIcon size={16} color={theme.text.tertiary} />
    </div>
  )
}

// 热榜列表项组件
function HotListItem({ item, index, theme, tokens }) {
  const [isHovered, setIsHovered] = useState(false)
  const [imageLoaded, setImageLoaded] = useState(false)
  const [imageError, setImageError] = useState(false)
  
  const hasImage = item.image && !imageError
  
  return (
    <a
      href={item.url}
      target="_blank"
      rel="noopener noreferrer"
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        padding: '10px 12px',
        borderRadius: tokens.borderRadius.md,
        background: isHovered ? theme.glass.backgroundHover : 'transparent',
        border: `1px solid ${isHovered ? theme.border.hover : 'transparent'}`,
        textDecoration: 'none',
        cursor: 'pointer',
        transform: isHovered ? 'translateX(4px)' : 'translateX(0)',
        transition: `all ${tokens.animation.duration.fast} ${tokens.animation.easing.smooth}`,
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* 排名 */}
      <RankBadge rank={index + 1} theme={theme} tokens={tokens} />
      
      {/* 缩略图 - 仅在有时显示 */}
      {hasImage && (
        <div
          style={{
            width: '60px',
            height: '45px',
            borderRadius: tokens.borderRadius.sm,
            overflow: 'hidden',
            flexShrink: 0,
            background: theme.bg.tertiary,
            position: 'relative',
          }}
        >
          {!imageLoaded && (
            <div
              style={{
                position: 'absolute',
                inset: 0,
                background: theme.bg.tertiary,
                animation: 'pulse 1.5s ease-in-out infinite',
              }}
            />
          )}
          <img
            src={item.image}
            alt=""
            loading="lazy"
            onLoad={() => setImageLoaded(true)}
            onError={() => setImageError(true)}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              opacity: imageLoaded ? 1 : 0,
              transition: 'opacity 0.2s ease',
            }}
          />
        </div>
      )}
      
      {/* 标题 */}
      <span
        style={{
          flex: 1,
          fontSize: tokens.typography.fontSize.sm,
          color: theme.text.primary,
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
          fontWeight: isHovered ? tokens.typography.fontWeight.medium : tokens.typography.fontWeight.normal,
          transition: `font-weight ${tokens.animation.duration.fast} ease`,
        }}
        title={item.title}
      >
        {item.title}
      </span>
      
      {/* 热度 */}
      {item.hot && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            padding: '4px 10px',
            borderRadius: tokens.borderRadius.full,
            background: `${theme.accent.primary}15`,
            border: `1px solid ${theme.accent.primary}30`,
            flexShrink: 0,
          }}
        >
          <FlameIcon size={12} color={theme.accent.primary} />
          <span
            style={{
              fontSize: tokens.typography.fontSize.xs,
              fontWeight: tokens.typography.fontWeight.semibold,
              color: theme.accent.primary,
            }}
          >
            {item.hot}
          </span>
        </div>
      )}
      
      {/* 外部链接图标 */}
      {isHovered && (
        <ExternalLinkIcon 
          size={16} 
          color={theme.text.tertiary}
          style={{ animation: 'fadeIn 0.2s ease' }}
        />
      )}
    </a>
  )
}

// 骨架屏组件
function SkeletonLoader({ theme, tokens }) {
  return (
    <div style={{ padding: '8px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
      {Array.from({ length: 10 }).map((_, i) => (
        <div
          key={i}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            padding: '10px 12px',
          }}
        >
          <div
            style={{
              width: '28px',
              height: '28px',
              borderRadius: tokens.borderRadius.base,
              background: theme.bg.tertiary,
              animation: 'pulse 1.5s ease-in-out infinite',
              animationDelay: `${i * 0.05}s`,
            }}
          />
          <div
            style={{
              flex: 1,
              height: '16px',
              borderRadius: tokens.borderRadius.sm,
              background: theme.bg.tertiary,
              animation: 'pulse 1.5s ease-in-out infinite',
              animationDelay: `${i * 0.05 + 0.02}s`,
            }}
          />
        </div>
      ))}
    </div>
  )
}

// 翻页组件
function Pagination({ currentPage, totalPages, onPageChange, theme, tokens }) {
  const canPrev = currentPage > 1
  const canNext = currentPage < totalPages
  
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '12px',
        padding: '10px 16px',
        borderTop: `1px solid ${theme.border.default}`,
      }}
    >
      {/* 上一页按钮 */}
      <button
        onClick={() => onPageChange(currentPage - 1)}
        disabled={!canPrev}
        style={{
          width: '32px',
          height: '32px',
          borderRadius: tokens.borderRadius.md,
          background: canPrev ? theme.bg.tertiary : 'transparent',
          border: `1px solid ${canPrev ? theme.border.default : theme.border.default}`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: canPrev ? 'pointer' : 'not-allowed',
          opacity: canPrev ? 1 : 0.4,
          transition: `all ${tokens.animation.duration.fast} ease`,
        }}
        title="上一页"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={theme.text.secondary} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="15 18 9 12 15 6"></polyline>
        </svg>
      </button>
      
      {/* 页码指示器 */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
        }}
      >
        {Array.from({ length: totalPages }).map((_, i) => {
          const pageNum = i + 1
          const isActive = pageNum === currentPage
          return (
            <button
              key={pageNum}
              onClick={() => onPageChange(pageNum)}
              style={{
                minWidth: '28px',
                height: '28px',
                borderRadius: tokens.borderRadius.md,
                background: isActive ? theme.accent.primary : 'transparent',
                border: `1px solid ${isActive ? theme.accent.primary : theme.border.default}`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                fontSize: tokens.typography.fontSize.xs,
                fontWeight: isActive ? tokens.typography.fontWeight.semibold : tokens.typography.fontWeight.medium,
                color: isActive ? '#fff' : theme.text.secondary,
                transition: `all ${tokens.animation.duration.fast} ease`,
              }}
            >
              {pageNum}
            </button>
          )
        })}
      </div>
      
      {/* 下一页按钮 */}
      <button
        onClick={() => onPageChange(currentPage + 1)}
        disabled={!canNext}
        style={{
          width: '32px',
          height: '32px',
          borderRadius: tokens.borderRadius.md,
          background: canNext ? theme.bg.tertiary : 'transparent',
          border: `1px solid ${canNext ? theme.border.default : theme.border.default}`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: canNext ? 'pointer' : 'not-allowed',
          opacity: canNext ? 1 : 0.4,
          transition: `all ${tokens.animation.duration.fast} ease`,
        }}
        title="下一页"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={theme.text.secondary} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="9 18 15 12 9 6"></polyline>
        </svg>
      </button>
    </div>
  )
}

// 空状态组件
function EmptyState({ theme, tokens, onRetry }) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '48px 24px',
        gap: '16px',
      }}
    >
      <div
        style={{
          width: '64px',
          height: '64px',
          borderRadius: tokens.borderRadius.xl,
          background: theme.bg.tertiary,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <SearchIcon size={32} color={theme.text.tertiary} />
      </div>
      <span
        style={{
          fontSize: tokens.typography.fontSize.base,
          color: theme.text.secondary,
          fontWeight: tokens.typography.fontWeight.medium,
        }}
      >
        暂无数据
      </span>
      {onRetry && (
        <button
          onClick={onRetry}
          style={{
            padding: '10px 20px',
            borderRadius: tokens.borderRadius.md,
            background: theme.gradient.primary,
            border: 'none',
            color: '#fff',
            fontSize: tokens.typography.fontSize.sm,
            fontWeight: tokens.typography.fontWeight.medium,
            cursor: 'pointer',
            transition: `all ${tokens.animation.duration.fast} ease`,
            boxShadow: theme.shadow.md,
          }}
        >
          重新加载
        </button>
      )}
    </div>
  )
}

// 单个热榜面板组件
function HotPanel({ platform, theme, tokens }) {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [updateTime, setUpdateTime] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  
  const ITEMS_PER_PAGE = 10
  const totalPages = Math.ceil(items.length / ITEMS_PER_PAGE)
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE
  const currentItems = items.slice(startIndex, startIndex + ITEMS_PER_PAGE)

  const fetchData = useCallback(async () => {
    setLoading(true)
    setError(false)
    try {
      const res = await fetch(`/api/hotlist/${platform.key}`)
      const data = await res.json()
      if (data.success) {
        setItems(data.data || [])
        setUpdateTime(data.updateTime || '')
        setCurrentPage(1) // 重置到第一页
      } else {
        setError(true)
      }
    } catch {
      setError(true)
      setItems([])
    } finally {
      setLoading(false)
    }
  }, [platform.key])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const handlePageChange = useCallback((page) => {
    setCurrentPage(page)
  }, [])

  const Icon = platform.icon

  return (
    <div
      style={{
        background: theme.gradient.card,
        borderRadius: tokens.borderRadius.lg,
        border: `1px solid ${theme.border.default}`,
        boxShadow: theme.shadow.md,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        height: '100%',
        minHeight: '400px',
      }}
    >
      {/* 头部：平台标题 + 刷新按钮 */}
      <div
        style={{
          padding: '12px 16px',
          borderBottom: `1px solid ${theme.border.default}`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '12px',
        }}
      >
        {/* 平台信息 */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
          }}
        >
          <div
            style={{
              width: '32px',
              height: '32px',
              borderRadius: tokens.borderRadius.md,
              background: `${platform.color}15`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Icon size={18} color={platform.color} />
          </div>
          <span
            style={{
              fontSize: tokens.typography.fontSize.base,
              fontWeight: tokens.typography.fontWeight.semibold,
              color: theme.text.primary,
            }}
          >
            {platform.label}
          </span>
        </div>

        {/* 刷新按钮 */}
        <button
          onClick={fetchData}
          disabled={loading}
          style={{
            width: '32px',
            height: '32px',
            borderRadius: tokens.borderRadius.md,
            background: theme.bg.tertiary,
            border: `1px solid ${theme.border.default}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: loading ? 'not-allowed' : 'pointer',
            transition: `all ${tokens.animation.duration.fast} ease`,
          }}
          title="刷新"
        >
          <RefreshCwIcon
            size={16}
            color={theme.text.secondary}
            style={{
              animation: loading ? 'spin 1s linear infinite' : 'none',
            }}
          />
        </button>
      </div>

      {/* 列表内容 */}
      <div
        style={{
          flex: 1,
          overflowY: 'auto',
          overflowX: 'hidden',
          padding: '8px',
        }}
      >
        {loading ? (
          <SkeletonLoader theme={theme} tokens={tokens} />
        ) : error ? (
          <EmptyState theme={theme} tokens={tokens} onRetry={fetchData} />
        ) : items.length === 0 ? (
          <EmptyState theme={theme} tokens={tokens} />
        ) : (
          currentItems.map((item, idx) => (
            <HotListItem
              key={startIndex + idx}
              item={item}
              index={startIndex + idx}
              theme={theme}
              tokens={tokens}
            />
          ))
        )}
      </div>

      {/* 分页组件 */}
      {!loading && !error && items.length > 0 && totalPages > 1 && (
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={handlePageChange}
          theme={theme}
          tokens={tokens}
        />
      )}

      {/* 底部更新时间 */}
      {updateTime && !loading && (
        <div
          style={{
            padding: '10px 16px',
            borderTop: `1px solid ${theme.border.default}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <div
              style={{
                width: '6px',
                height: '6px',
                borderRadius: '50%',
                background: '#22c55e',
                animation: 'pulse 2s ease-in-out infinite',
              }}
            />
            <span
              style={{
                fontSize: tokens.typography.fontSize.xs,
                color: theme.text.tertiary,
              }}
              title={new Date(updateTime).toLocaleString('zh-CN')}
            >
              {formatTimeAgo(updateTime)}
            </span>
          </div>
          <span
            style={{
              fontSize: tokens.typography.fontSize.xs,
              color: theme.text.tertiary,
            }}
          >
            共 {items.length} 条 · 第 {currentPage}/{totalPages || 1} 页
          </span>
        </div>
      )}
    </div>
  )
}

// 主组件
export default function HotList() {
  const { theme, tokens } = useTheme()
  const [columns, setColumns] = useState(getGridColumns(window.innerWidth))

  useEffect(() => {
    const handleResize = () => setColumns(getGridColumns(window.innerWidth))
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: `repeat(${columns}, 1fr)`,
        gap: '20px',
        height: '100%',
        overflow: 'auto',
        boxSizing: 'border-box',
      }}
    >
      {PLATFORMS.map((platform) => (
        <HotPanel
          key={platform.key}
          platform={platform}
          theme={theme}
          tokens={tokens}
        />
      ))}
      
      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
      `}</style>
    </div>
  )
}
