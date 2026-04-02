import { useState, useEffect, useMemo, useRef, useCallback } from 'react'
import { useTheme } from '../ThemeContext.jsx'
import { useToast } from '../App.jsx'

const STORAGE_KEY = 'moyu-todos'

// SVG Icons - Retro-Futurism Style
const Icons = {
  clipboard: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M16 4h2a2 2 0 012 2v14a2 2 0 01-2 2H6a2 2 0 01-2-2V6a2 2 0 012-2h2"/>
      <rect x="8" y="2" width="8" height="4" rx="1" ry="1"/>
    </svg>
  ),
  upload: (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/>
      <polyline points="17,8 12,3 7,8"/>
      <line x1="12" y1="3" x2="12" y2="15"/>
    </svg>
  ),
  download: (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/>
      <polyline points="7,10 12,15 17,10"/>
      <line x1="12" y1="15" x2="12" y2="3"/>
    </svg>
  ),
  csv: (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/>
      <polyline points="14,2 14,8 20,8"/>
      <line x1="8" y1="13" x2="16" y2="13"/>
      <line x1="8" y1="17" x2="16" y2="17"/>
    </svg>
  ),
  trash: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="3,6 5,6 21,6"/>
      <path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/>
      <line x1="10" y1="11" x2="10" y2="17"/>
      <line x1="14" y1="11" x2="14" y2="17"/>
    </svg>
  ),
  arrowUp: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="18,15 12,9 6,15"/>
    </svg>
  ),
  arrowDown: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="6,9 12,15 18,9"/>
    </svg>
  ),
  check: (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
      <path d="M2.5 6L5 8.5L9.5 3.5" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  ),
  sparkles: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2L13.09 8.26L18 6L14.74 10.91L21 12L14.74 13.09L18 18L13.09 15.74L12 22L10.91 15.74L6 18L9.26 13.09L3 12L9.26 10.91L6 6L10.91 8.26L12 2Z"/>
    </svg>
  ),
  trophy: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 15a7 7 0 007-7V4H5v4a7 7 0 007 7zm-2 4h4v2h-4v-2zm-4-2h10v2H6v-2z"/>
    </svg>
  ),
  rocket: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2C8 6 8 12 8 12s0 6 4 10c4-4 4-10 4-10s0-6-4-10zm0 14c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2z"/>
    </svg>
  ),
  fire: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 23c-3.866 0-7-2.239-7-5 0-1.636.785-3.088 2-4.018V6c0-2.21 1.79-4 4-4s4 1.79 4 4v7.982c1.215.93 2 2.382 2 4.018 0 2.761-3.134 5-7 5z"/>
    </svg>
  ),
  fish: (
    <svg width="32" height="32" viewBox="0 0 64 64" fill="currentColor">
      <ellipse cx="32" cy="32" rx="20" ry="14"/>
      <circle cx="44" cy="30" r="3" fill="#0F172A"/>
      <path d="M12 32c-6-4-6-12 0-16" fill="none" stroke="currentColor" strokeWidth="3"/>
    </svg>
  ),
  folder: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z"/>
    </svg>
  ),
  close: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="6" x2="6" y2="18"/>
      <line x1="6" y1="6" x2="18" y2="18"/>
    </svg>
  ),
  plus: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="5" x2="12" y2="19"/>
      <line x1="5" y1="12" x2="19" y2="12"/>
    </svg>
  ),
}

function loadTodos() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

function saveTodos(todos) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(todos))
}

function relativeTime(ts) {
  const diff = Date.now() - ts
  const sec = Math.floor(diff / 1000)
  if (sec < 60) return '刚刚'
  const min = Math.floor(sec / 60)
  if (min < 60) return `${min}分钟前`
  const hr = Math.floor(min / 60)
  if (hr < 24) return `${hr}小时前`
  const day = Math.floor(hr / 24)
  if (day === 1) return '昨天'
  return `${day}天前`
}

const PRIORITY_META = {
  high: { color: '#EF4444', label: '高', gradient: 'linear-gradient(135deg, #EF4444, #DC2626)' },
  medium: { color: '#F59E0B', label: '中', gradient: 'linear-gradient(135deg, #F59E0B, #D97706)' },
  low: { color: '#22C55E', label: '低', gradient: 'linear-gradient(135deg, #22C55E, #16A34A)' },
}

const PRIORITY_ORDER = { high: 0, medium: 1, low: 2 }

function getMotivation(rate) {
  if (rate === 0) return { text: '新的一天，从第一个任务开始吧', icon: Icons.sparkles }
  if (rate < 0.3) return { text: '才刚开始，继续加油', icon: Icons.rocket }
  if (rate < 0.6) return { text: '进度不错，保持节奏', icon: Icons.sparkles }
  if (rate < 1) return { text: '快完成了，冲刺一下', icon: Icons.fire }
  return { text: '全部搞定！今天的你超棒', icon: Icons.trophy }
}

const fishKeyframes = `
@keyframes fishFloat {
  0%, 100% { transform: translateY(0px); }
  50% { transform: translateY(-10px); }
}
@keyframes progressFill {
  from { width: 0%; }
}
@keyframes progressGlow {
  0%, 100% { box-shadow: 0 0 4px rgba(34, 197, 94, 0.4); }
  50% { box-shadow: 0 0 12px rgba(34, 197, 94, 0.6); }
}
@keyframes fadeIn {
  from { opacity: 0; transform: translateY(8px); }
  to { opacity: 1; transform: translateY(0); }
}
@keyframes checkPop {
  0% { transform: scale(0.8); }
  50% { transform: scale(1.15); }
  100% { transform: scale(1); }
}
@keyframes slideIn {
  from { opacity: 0; transform: translateX(-12px); }
  to { opacity: 1; transform: translateX(0); }
}
@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.6; }
}
@keyframes bounce {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-4px); }
}
`

export default function TodoList() {
  const { colors } = useTheme()
  const showToast = useToast()
  const [todos, setTodos] = useState(loadTodos)
  const [input, setInput] = useState('')
  const [priority, setPriority] = useState('medium')
  const [filter, setFilter] = useState('all')
  const [sortBy, setSortBy] = useState('time') // 'time' | 'priority'
  const [hoveredId, setHoveredId] = useState(null)
  const [hoveredBtn, setHoveredBtn] = useState(null)

  // 拖拽排序状态
  const [draggedId, setDraggedId] = useState(null)
  const [dragOverId, setDragOverId] = useState(null)

  // 导入相关状态
  const [showImportModal, setShowImportModal] = useState(false)
  const [importMode, setImportMode] = useState('merge') // 'merge' | 'replace'
  const [importText, setImportText] = useState('')
  const [importError, setImportError] = useState('')
  const fileInputRef = useRef(null)

  useEffect(() => { saveTodos(todos) }, [todos])

  const addTodo = () => {
    const text = input.trim()
    if (!text) return
    setTodos(prev => [...prev, { id: Date.now(), text, done: false, priority, createdAt: Date.now() }])
    setInput('')
    showToast && showToast('任务添加成功！', 'success')
  }

  const handleKeyDown = (e) => { if (e.key === 'Enter') addTodo() }

  const toggleTodo = (id) => {
    setTodos(prev => prev.map(t => t.id === id ? { ...t, done: !t.done } : t))
  }

  const deleteTodo = (id) => {
    setTodos(prev => prev.filter(t => t.id !== id))
  }

  const moveItem = (id, dir) => {
    setTodos(prev => {
      const idx = prev.findIndex(t => t.id === id)
      if (idx < 0) return prev
      const target = idx + dir
      if (target < 0 || target >= prev.length) return prev
      const next = [...prev]
      ;[next[idx], next[target]] = [next[target], next[idx]]
      return next
    })
  }

  // 拖拽处理函数
  const handleDragStart = (e, id) => {
    setDraggedId(id)
    e.dataTransfer.effectAllowed = 'move'
    // 设置拖拽时的透明图片
    const el = e.target
    if (el) {
      e.dataTransfer.setDragImage(el, 20, 20)
    }
  }

  const handleDragOver = (e, id) => {
    e.preventDefault()
    if (id !== draggedId) {
      setDragOverId(id)
    }
  }

  const handleDragLeave = () => {
    setDragOverId(null)
  }

  const handleDrop = (e, targetId) => {
    e.preventDefault()
    setDragOverId(null)
    if (!draggedId || draggedId === targetId) {
      setDraggedId(null)
      return
    }
    setTodos(prev => {
      const draggedIdx = prev.findIndex(t => t.id === draggedId)
      const targetIdx = prev.findIndex(t => t.id === targetId)
      if (draggedIdx < 0 || targetIdx < 0) return prev
      const next = [...prev]
      const [removed] = next.splice(draggedIdx, 1)
      next.splice(targetIdx, 0, removed)
      return next
    })
    setDraggedId(null)
    showToast && showToast('排序已更新', 'success')
  }

  const handleDragEnd = () => {
    setDraggedId(null)
    setDragOverId(null)
  }

  // 导入处理函数
  const validateTodoItem = (item) => {
    if (!item || typeof item !== 'object') return false
    if (typeof item.text !== 'string' || !item.text.trim()) return false
    if (typeof item.id !== 'number' && typeof item.id !== 'string') return false
    return true
  }

  const parseImportData = (text) => {
    try {
      // 尝试解析 JSON
      const data = JSON.parse(text)
      if (Array.isArray(data)) {
        return data.filter(validateTodoItem).map(t => ({
          ...t,
          id: Date.now() + Math.random(), // 重新生成 ID 避免冲突
          done: !!t.done,
          priority: ['high', 'medium', 'low'].includes(t.priority) ? t.priority : 'medium',
          createdAt: t.createdAt || Date.now(),
        }))
      }
      // 尝试解析 CSV
      if (text.includes(',') && text.includes('\n')) {
        const lines = text.trim().split('\n')
        const headers = lines[0].split(',').map(h => h.trim().toLowerCase())
        const textIdx = headers.findIndex(h => h.includes('内容') || h.includes('text') || h.includes('content'))
        const doneIdx = headers.findIndex(h => h.includes('完成') || h.includes('done') || h.includes('状态'))
        const priorityIdx = headers.findIndex(h => h.includes('优先级') || h.includes('priority'))

        const items = []
        for (let i = 1; i < lines.length; i++) {
          const cols = lines[i].split(',').map(c => c.trim().replace(/^"|"$/g, ''))
          const text = textIdx >= 0 ? cols[textIdx] : cols[1]
          if (text) {
            let priority = 'medium'
            if (priorityIdx >= 0) {
              const p = cols[priorityIdx]
              if (p === '高' || p.includes('high')) priority = 'high'
              else if (p === '低' || p.includes('low')) priority = 'low'
            }
            items.push({
              id: Date.now() + Math.random() + i,
              text: text,
              done: doneIdx >= 0 ? (cols[doneIdx] === '已完成' || cols[doneIdx] === 'true') : false,
              priority,
              createdAt: Date.now(),
            })
          }
        }
        return items
      }
      return []
    } catch (err) {
      throw new Error('无法解析数据格式，请检查是否为有效的 JSON 或 CSV')
    }
  }

  const handleImport = () => {
    setImportError('')
    if (!importText.trim()) {
      setImportError('请输入要导入的数据')
      return
    }
    try {
      const items = parseImportData(importText)
      if (items.length === 0) {
        setImportError('未找到有效的任务数据')
        return
      }
      if (importMode === 'replace') {
        setTodos(items)
        showToast && showToast(`已导入 ${items.length} 个任务（覆盖模式）`, 'success')
      } else {
        setTodos(prev => [...prev, ...items])
        showToast && showToast(`已导入 ${items.length} 个任务（合并模式）`, 'success')
      }
      setShowImportModal(false)
      setImportText('')
    } catch (err) {
      setImportError(err.message)
    }
  }

  const handleFileSelect = (e) => {
    const file = e.target.files[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => {
      setImportText(ev.target.result)
    }
    reader.readAsText(file)
  }

  const openImportModal = () => {
    setShowImportModal(true)
    setImportError('')
    setImportText('')
  }

  const clearCompleted = () => { setTodos(prev => prev.filter(t => !t.done)) }

  const activeCount = todos.filter(t => !t.done).length
  const doneCount = todos.filter(t => t.done).length
  const total = todos.length
  const completionRate = total > 0 ? doneCount / total : 0
  const pct = Math.round(completionRate * 100)

  const filtered = useMemo(() => {
    let list = todos.filter(t => {
      if (filter === 'active') return !t.done
      if (filter === 'done') return t.done
      return true
    })
    if (sortBy === 'priority') {
      list = [...list].sort((a, b) => (PRIORITY_ORDER[a.priority] || 1) - (PRIORITY_ORDER[b.priority] || 1))
    }
    // 'time' keeps insertion order (already sorted by createdAt naturally)
    return list
  }, [todos, filter, sortBy])

  const filterCounts = {
    all: total,
    active: activeCount,
    done: doneCount,
  }

  const FILTERS = [
    { key: 'all', label: '全部' },
    { key: 'active', label: '未完成' },
    { key: 'done', label: '已完成' },
  ]

  // Empty state illustrations - Retro-Futurism style
  const EmptyStateIllustration = () => (
    <svg width="140" height="110" viewBox="0 0 140 110" fill="none" style={{ marginBottom: 20 }}>
      {/* Background glow */}
      <circle cx="70" cy="55" r="45" fill={colors.accentLight} opacity="0.3"/>
      <circle cx="70" cy="55" r="35" fill={colors.accentLight} opacity="0.5"/>

      {/* Clipboard body */}
      <rect x="40" y="30" width="60" height="70" rx="8" fill={colors.cardBg} stroke={colors.accent} strokeWidth="2"/>

      {/* Clipboard clip */}
      <rect x="55" y="22" width="30" height="12" rx="4" fill={colors.accent}/>

      {/* Lines on clipboard */}
      <rect x="52" y="48" width="36" height="4" rx="2" fill={colors.border}/>
      <rect x="52" y="58" width="28" height="4" rx="2" fill={colors.border}/>
      <rect x="52" y="68" width="32" height="4" rx="2" fill={colors.border}/>
      <rect x="52" y="78" width="20" height="4" rx="2" fill={colors.border}/>

      {/* Decorative elements */}
      <circle cx="30" cy="35" r="4" fill={colors.accent} opacity="0.6">
        <animate attributeName="opacity" values="0.6;1;0.6" dur="2s" repeatCount="indefinite"/>
      </circle>
      <circle cx="110" cy="45" r="3" fill={colors.accent} opacity="0.4">
        <animate attributeName="opacity" values="0.4;0.8;0.4" dur="2.5s" repeatCount="indefinite"/>
      </circle>
      <circle cx="115" cy="75" r="5" fill={colors.accentLight} opacity="0.5">
        <animate attributeName="opacity" values="0.5;1;0.5" dur="3s" repeatCount="indefinite"/>
      </circle>
    </svg>
  )

  // Empty state logic
  const renderEmpty = () => {
    if (total === 0) {
      return (
        <div style={{ textAlign: 'center', padding: '48px 20px', color: colors.textMuted }}>
          <EmptyStateIllustration />
          <div style={{ fontSize: 17, fontWeight: 600, marginBottom: 8, color: colors.text }}>暂无待办任务</div>
          <div style={{ fontSize: 14, marginBottom: 20, color: colors.textSecondary }}>开始规划你的一天吧</div>
          <button
            onClick={() => document.querySelector('input[placeholder*="做什么"]').focus()}
            style={{
              padding: '12px 28px', borderRadius: 24, border: 'none',
              background: `linear-gradient(135deg, ${colors.accent}, ${colors.accent}dd)`,
              color: '#fff', fontSize: 14,
              fontWeight: 600, cursor: 'pointer', transition: 'all 0.25s ease',
              boxShadow: `0 2px 12px ${colors.accent}40`,
              display: 'inline-flex', alignItems: 'center', gap: 8,
            }}
            onMouseEnter={e => {
              e.currentTarget.style.transform = 'translateY(-2px)'
              e.currentTarget.style.boxShadow = `0 6px 20px ${colors.accent}60`
            }}
            onMouseLeave={e => {
              e.currentTarget.style.transform = 'translateY(0)'
              e.currentTarget.style.boxShadow = `0 2px 12px ${colors.accent}40`
            }}
          >
            {Icons.plus}
            <span>添加第一个任务</span>
          </button>
        </div>
      )
    }
    if (filter === 'done' && doneCount === 0) {
      return (
        <div style={{ textAlign: 'center', padding: '48px 20px', color: colors.textMuted, fontSize: 14 }}>
          <div style={{ color: colors.accent, marginBottom: 12, opacity: 0.6 }}>{Icons.clipboard}</div>
          <div style={{ color: colors.textSecondary }}>还没有完成的任务哦，加油</div>
        </div>
      )
    }
    if (filter === 'active' && activeCount === 0) {
      return (
        <div style={{ textAlign: 'center', padding: '48px 20px', color: colors.textMuted }}>
          <div style={{
            color: colors.accent,
            marginBottom: 12,
            animation: 'bounce 1s ease-in-out infinite',
          }}>
            <svg width="40" height="40" viewBox="0 0 64 64" fill="currentColor">
              <ellipse cx="32" cy="32" rx="24" ry="16"/>
              <circle cx="46" cy="29" r="4" fill={colors.cardBg}/>
              <path d="M8 32c-8-6-8-16 0-22" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round"/>
            </svg>
          </div>
          <div style={{ fontSize: 15, fontWeight: 500, color: colors.textSecondary }}>所有任务已完成！</div>
          <div style={{ fontSize: 13, marginTop: 4, opacity: 0.7 }}>奖励自己摸会儿鱼吧</div>
        </div>
      )
    }
    // filtered empty but not the above cases
    return (
      <div style={{ textAlign: 'center', padding: '48px 20px', color: colors.textMuted, fontSize: 14 }}>
        当前筛选条件下没有任务
      </div>
    )
  }

  const btnBase = (isActive) => ({
    padding: '5px 12px', borderRadius: 8, border: 'none',
    background: isActive ? colors.accentLight : 'transparent',
    color: isActive ? colors.accent : colors.textSecondary,
    cursor: 'pointer', fontSize: 12, fontWeight: isActive ? 600 : 400,
    transition: 'all 0.2s',
  })

  // 导出功能
  const exportTodos = (format) => {
    const timestamp = new Date().toISOString().split('T')[0]
    try {
      if (format === 'json') {
        const data = JSON.stringify(todos, null, 2)
        const blob = new Blob([data], { type: 'application/json' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `todos-${timestamp}.json`
        a.click()
        URL.revokeObjectURL(url)
      } else if (format === 'csv') {
        const headers = 'ID,内容,完成状态,优先级,创建时间\n'
        const rows = todos.map(t => `${t.id},"${t.text.replace(/"/g, '""')}",${t.done ? '已完成' : '未完成'},${PRIORITY_META[t.priority]?.label || '中'},${new Date(t.createdAt).toLocaleString('zh-CN')}`).join('\n')
        const data = headers + rows
        const blob = new Blob(['\ufeff' + data], { type: 'text/csv;charset=utf-8;' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `todos-${timestamp}.csv`
        a.click()
        URL.revokeObjectURL(url)
      }
      showToast && showToast(`导出成功！已保存为 ${format.toUpperCase()}`, 'success')
    } catch (err) {
      showToast && showToast('导出失败，请重试', 'error')
    }
  }

  return (
    <div style={{ padding: 16, height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <style>{fishKeyframes}</style>

      <div style={{
        background: colors.cardBg, borderRadius: 14, border: `1px solid ${colors.border}`,
        display: 'flex', flexDirection: 'column', overflow: 'hidden', flex: 1,
        boxShadow: `0 2px 12px ${colors.shadow}`,
        transition: 'background 0.3s, border-color 0.3s, box-shadow 0.3s',
      }}>

        {/* ===== HEADER ===== */}
        <div style={{
          padding: '18px 20px 14px', borderBottom: `1px solid ${colors.border}`,
          display: 'flex', flexDirection: 'column', gap: 4,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{
                fontSize: 18, fontWeight: 700, color: colors.text,
                display: 'flex', alignItems: 'center', gap: 8,
              }}>
                <span style={{ color: colors.accent }}>{Icons.clipboard}</span>
                每日待办
              </span>
              {total > 0 && (
                <span style={{
                  fontSize: 11, fontWeight: 600, background: colors.accentLight,
                  color: colors.accent, padding: '3px 10px', borderRadius: 12,
                }}>
                  {total}
                </span>
              )}
            </div>
            <div style={{ display: 'flex', gap: 6 }}>
              <button
                onClick={openImportModal}
                style={{
                  padding: '6px 12px', borderRadius: 8,
                  border: `1px solid ${colors.border}`, background: 'transparent',
                  color: colors.textSecondary, cursor: 'pointer', fontSize: 11,
                  transition: 'all 0.2s ease', display: 'flex', alignItems: 'center', gap: 4,
                }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = colors.accent; e.currentTarget.style.color = colors.accent }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = colors.border; e.currentTarget.style.color = colors.textSecondary }}
                title="导入数据"
              >
                {Icons.upload}
                <span>导入</span>
              </button>
              {total > 0 && (
                <>
                  <button
                    onClick={() => exportTodos('json')}
                    style={{
                      padding: '6px 12px', borderRadius: 8,
                      border: `1px solid ${colors.border}`, background: 'transparent',
                      color: colors.textSecondary, cursor: 'pointer', fontSize: 11,
                      transition: 'all 0.2s ease', display: 'flex', alignItems: 'center', gap: 4,
                    }}
                    onMouseEnter={e => { e.currentTarget.style.borderColor = colors.accent; e.currentTarget.style.color = colors.accent }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor = colors.border; e.currentTarget.style.color = colors.textSecondary }}
                    title="导出为 JSON"
                  >
                    {Icons.download}
                    <span>JSON</span>
                  </button>
                  <button
                    onClick={() => exportTodos('csv')}
                    style={{
                      padding: '6px 12px', borderRadius: 8,
                      border: `1px solid ${colors.border}`, background: 'transparent',
                      color: colors.textSecondary, cursor: 'pointer', fontSize: 11,
                      transition: 'all 0.2s ease', display: 'flex', alignItems: 'center', gap: 4,
                    }}
                    onMouseEnter={e => { e.currentTarget.style.borderColor = colors.accent; e.currentTarget.style.color = colors.accent }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor = colors.border; e.currentTarget.style.color = colors.textSecondary }}
                    title="导出为 CSV"
                  >
                    {Icons.csv}
                    <span>CSV</span>
                  </button>
                </>
              )}
            </div>
          </div>
          <div style={{
            fontSize: 12, color: colors.textMuted, marginTop: 2,
            display: 'flex', alignItems: 'center', gap: 6,
          }}>
            {getMotivation(completionRate).icon && (
              <span style={{ color: colors.accent, opacity: 0.7 }}>
                {getMotivation(completionRate).icon}
              </span>
            )}
            <span>{getMotivation(completionRate).text}</span>
          </div>
        </div>

        {/* ===== INPUT AREA ===== */}
        <div style={{ padding: '14px 20px', borderBottom: `1px solid ${colors.border}` }}>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <input
              style={{
                flex: 1, padding: '9px 14px', borderRadius: 10,
                border: `1px solid ${colors.border}`, background: colors.inputBg,
                color: colors.text, fontSize: 14, outline: 'none',
                transition: 'all 0.2s',
              }}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="今天要做什么..."
              onFocus={e => { e.target.style.borderColor = colors.accent }}
              onBlur={e => { e.target.style.borderColor = colors.border }}
            />
            <button
              style={{
                padding: '10px 20px', borderRadius: 12, border: 'none',
                background: `linear-gradient(135deg, ${colors.accent}, ${colors.accent}dd)`,
                color: '#fff', fontSize: 14,
                fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap',
                transition: 'all 0.2s ease',
                opacity: input.trim() ? 1 : 0.6,
                boxShadow: input.trim() ? `0 2px 10px ${colors.accent}40` : 'none',
              }}
              onClick={addTodo}
              onMouseDown={e => { e.currentTarget.style.transform = 'scale(0.96)' }}
              onMouseUp={e => { e.currentTarget.style.transform = 'scale(1)' }}
              onMouseEnter={e => { if (input.trim()) e.currentTarget.style.boxShadow = `0 4px 14px ${colors.accent}60` }}
              onMouseLeave={e => { e.currentTarget.style.boxShadow = `0 2px 10px ${colors.accent}40` }}
            >
              添加
            </button>
          </div>
          {/* Priority selector - enhanced */}
          <div style={{ display: 'flex', gap: 8, marginTop: 12, alignItems: 'center' }}>
            <span style={{ fontSize: 12, color: colors.textMuted, marginRight: 4 }}>优先级</span>
            {Object.entries(PRIORITY_META).map(([key, meta]) => (
              <button
                key={key}
                onClick={() => setPriority(key)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 6,
                  padding: '5px 12px', borderRadius: 14, border: 'none',
                  background: priority === key ? `${meta.color}18` : 'transparent',
                  color: priority === key ? meta.color : colors.textMuted,
                  cursor: 'pointer', fontSize: 12, fontWeight: priority === key ? 600 : 400,
                  transition: 'all 0.2s ease',
                  outline: priority === key ? `2px solid ${meta.color}40` : '2px solid transparent',
                }}
              >
                <span style={{
                  width: 8, height: 8, borderRadius: '50%',
                  background: meta.gradient,
                  display: 'inline-block',
                  opacity: priority === key ? 1 : 0.5,
                  transition: 'opacity 0.2s ease',
                  boxShadow: priority === key ? `0 0 6px ${meta.color}60` : 'none',
                }} />
                {meta.label}
              </button>
            ))}
          </div>
        </div>

        {/* ===== PROGRESS BAR ===== */}
        {total > 0 && (
          <div style={{ padding: '14px 20px 10px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <span style={{ fontSize: 12, color: colors.textSecondary, fontWeight: 500 }}>
                已完成 {doneCount}/{total} ({pct}%)
              </span>
            </div>
            <div style={{
              height: 8,
              borderRadius: 4,
              background: colors.border,
              overflow: 'hidden',
              transition: 'background 0.3s',
            }}>
              <div style={{
                height: '100%',
                borderRadius: 4,
                background: `linear-gradient(90deg, ${colors.accent}, #4ADE80)`,
                width: `${pct}%`,
                transition: 'width 0.6s cubic-bezier(0.4, 0, 0.2, 1)',
                animation: pct > 0 ? 'progressFill 0.8s ease-out, progressGlow 2s ease-in-out infinite' : 'none',
                boxShadow: `0 0 8px ${colors.accent}50`,
              }} />
            </div>
          </div>
        )}

        {/* ===== FILTER / SORT BAR ===== */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '8px 20px 10px', borderBottom: `1px solid ${colors.border}`,
          flexWrap: 'wrap', gap: 6,
        }}>
          <div style={{ display: 'flex', gap: 4 }}>
            {FILTERS.map(f => (
              <button
                key={f.key}
                style={btnBase(filter === f.key)}
                onClick={() => setFilter(f.key)}
              >
                {f.label} ({filterCounts[f.key]})
              </button>
            ))}
          </div>
          <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
            <button
              style={btnBase(sortBy === 'time')}
              onClick={() => setSortBy('time')}
            >
              按时间
            </button>
            <button
              style={btnBase(sortBy === 'priority')}
              onClick={() => setSortBy('priority')}
            >
              按优先级
            </button>
            {doneCount > 0 && (
              <button
                style={{
                  padding: '5px 10px', borderRadius: 8,
                  border: `1px solid ${colors.border}`, background: 'transparent',
                  color: colors.textSecondary, cursor: 'pointer', fontSize: 12,
                  transition: 'all 0.2s', marginLeft: 4,
                }}
                onClick={clearCompleted}
                onMouseEnter={e => { e.currentTarget.style.borderColor = colors.accent; e.currentTarget.style.color = colors.accent }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = colors.border; e.currentTarget.style.color = colors.textSecondary }}
              >
                清除已完成
              </button>
            )}
          </div>
        </div>

        {/* ===== TODO LIST ===== */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '4px 0' }}>
          {filtered.length === 0 ? renderEmpty() : (
            filtered.map((todo, idx) => {
              const isHovered = hoveredId === todo.id
              const isDragged = draggedId === todo.id
              const isDragOver = dragOverId === todo.id
              const pm = PRIORITY_META[todo.priority] || PRIORITY_META.medium
              return (
                <div
                  key={todo.id}
                  draggable
                  onDragStart={(e) => handleDragStart(e, todo.id)}
                  onDragOver={(e) => handleDragOver(e, todo.id)}
                  onDragLeave={handleDragLeave}
                  onDrop={(e) => handleDrop(e, todo.id)}
                  onDragEnd={handleDragEnd}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 12,
                    padding: '12px 20px',
                    transition: 'all 0.2s ease',
                    background: isDragOver ? colors.accentLight : (isHovered ? colors.hover : 'transparent'),
                    opacity: isDragged ? 0.4 : 1,
                    transform: isDragged ? 'scale(0.96) rotate(1deg)' : 'none',
                    borderTop: isDragOver ? `2px solid ${colors.accent}` : '2px solid transparent',
                    cursor: 'grab',
                    animation: `slideIn 0.3s ease-out ${idx * 0.03}s both`,
                  }}
                  onMouseEnter={() => setHoveredId(todo.id)}
                  onMouseLeave={() => { setHoveredId(null); setHoveredBtn(null) }}
                >
                  {/* Priority indicator - enhanced */}
                  <span style={{
                    width: 8, height: 8, borderRadius: '50%',
                    background: pm.gradient,
                    flexShrink: 0,
                    opacity: todo.done ? 0.3 : 1,
                    transition: 'all 0.2s ease',
                    boxShadow: todo.done ? 'none' : `0 0 6px ${pm.color}60`,
                  }} />

                  {/* Custom checkbox - enhanced */}
                  <button
                    onClick={() => toggleTodo(todo.id)}
                    style={{
                      width: 22, height: 22, borderRadius: '50%', flexShrink: 0,
                      border: todo.done ? `2px solid ${colors.accent}` : `2px solid ${colors.border}`,
                      background: todo.done ? `linear-gradient(135deg, ${colors.accent}, #4ADE80)` : 'transparent',
                      cursor: 'pointer', display: 'flex', alignItems: 'center',
                      justifyContent: 'center', padding: 0,
                      transition: 'all 0.25s ease',
                      animation: todo.done ? 'checkPop 0.3s ease-out' : 'none',
                      boxShadow: todo.done ? `0 0 8px ${colors.accent}50` : 'none',
                    }}
                  >
                    {todo.done && Icons.check}
                  </button>

                  {/* Text + time */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{
                      fontSize: 14, color: colors.text, lineHeight: 1.5,
                      textDecoration: todo.done ? 'line-through' : 'none',
                      opacity: todo.done ? 0.4 : 1,
                      transition: 'opacity 0.3s ease',
                      overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                    }}>
                      {todo.text}
                    </div>
                    <div style={{ fontSize: 11, color: colors.textMuted, marginTop: 3 }}>
                      {relativeTime(todo.createdAt || todo.id)}
                    </div>
                  </div>

                  {/* Action buttons - enhanced */}
                  <div style={{
                    display: 'flex', gap: 4,
                    opacity: isHovered ? 1 : 0,
                    transition: 'opacity 0.2s ease',
                    pointerEvents: isHovered ? 'auto' : 'none',
                  }}>
                    {[
                      { icon: Icons.arrowUp, title: '上移', action: () => moveItem(todo.id, -1), key: 'up' },
                      { icon: Icons.arrowDown, title: '下移', action: () => moveItem(todo.id, 1), key: 'down' },
                      { icon: Icons.trash, title: '删除', action: () => deleteTodo(todo.id), key: 'delete' },
                    ].map(btn => {
                      const bKey = `${todo.id}-${btn.key}`
                      return (
                        <button
                          key={btn.key}
                          title={btn.title}
                          onClick={btn.action}
                          onMouseEnter={() => setHoveredBtn(bKey)}
                          onMouseLeave={() => setHoveredBtn(null)}
                          style={{
                            width: 28, height: 28, borderRadius: 8, border: 'none',
                            background: hoveredBtn === bKey ? colors.accentLight : 'transparent',
                            color: hoveredBtn === bKey ? colors.accent : colors.textMuted,
                            cursor: 'pointer',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            padding: 0, transition: 'all 0.15s ease',
                          }}
                        >
                          {btn.icon}
                        </button>
                      )
                    })}
                  </div>
                </div>
              )
            })
          )}
        </div>

        {/* ===== STATISTICS FOOTER ===== */}
        {total > 0 && (
          <div style={{
            padding: '12px 20px', borderTop: `1px solid ${colors.border}`,
            fontSize: 12, color: colors.textMuted, textAlign: 'center',
            transition: 'color 0.3s, border-color 0.3s',
            display: 'flex', justifyContent: 'center', gap: 16,
          }}>
            <span>今日完成 <strong style={{ color: colors.accent }}>{doneCount}</strong> 项</span>
            <span style={{ opacity: 0.4 }}>|</span>
            <span>剩余 <strong style={{ color: colors.textSecondary }}>{activeCount}</strong> 项</span>
            <span style={{ opacity: 0.4 }}>|</span>
            <span>效率 <strong style={{ color: pct >= 80 ? colors.accent : colors.textSecondary }}>{pct}%</strong></span>
          </div>
        )}
      </div>

      {/* ===== IMPORT MODAL ===== */}
      {showImportModal && (
        <div
          style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            zIndex: 1000, backdropFilter: 'blur(6px)',
          }}
          onClick={() => setShowImportModal(false)}
        >
          <div
            style={{
              background: colors.cardBg, borderRadius: 20,
              border: `1px solid ${colors.border}`, width: '90%', maxWidth: 500,
              maxHeight: '80vh', overflow: 'auto', padding: 28,
              boxShadow: `0 12px 40px ${colors.shadow}`,
              animation: 'fadeIn 0.25s ease-out',
            }}
            onClick={e => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h3 style={{
                margin: 0, color: colors.text, fontSize: 18,
                display: 'flex', alignItems: 'center', gap: 10,
              }}>
                <span style={{ color: colors.accent }}>{Icons.upload}</span>
                导入任务
              </h3>
              <button
                onClick={() => setShowImportModal(false)}
                style={{
                  background: colors.hover, border: 'none', color: colors.textSecondary,
                  cursor: 'pointer', padding: '6px',
                  borderRadius: 8, transition: 'all 0.2s ease',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}
                onMouseEnter={e => { e.currentTarget.style.background = colors.accentLight; e.currentTarget.style.color = colors.accent }}
                onMouseLeave={e => { e.currentTarget.style.background = colors.hover; e.currentTarget.style.color = colors.textSecondary }}
              >
                {Icons.close}
              </button>
            </div>

            {/* 导入模式选择 */}
            <div style={{ marginBottom: 18 }}>
              <span style={{ fontSize: 13, color: colors.textSecondary, marginRight: 12 }}>导入模式：</span>
              <label style={{ marginRight: 16, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                <input
                  type="radio"
                  value="merge"
                  checked={importMode === 'merge'}
                  onChange={() => setImportMode('merge')}
                  style={{ accentColor: colors.accent }}
                />
                <span style={{ fontSize: 13, color: colors.text }}>合并到现有</span>
              </label>
              <label style={{ cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                <input
                  type="radio"
                  value="replace"
                  checked={importMode === 'replace'}
                  onChange={() => setImportMode('replace')}
                  style={{ accentColor: colors.accent }}
                />
                <span style={{ fontSize: 13, color: colors.text }}>覆盖现有</span>
              </label>
            </div>

            {/* 文件上传 */}
            <div style={{ marginBottom: 14 }}>
              <input
                ref={fileInputRef}
                type="file"
                accept=".json,.csv"
                onChange={handleFileSelect}
                style={{ display: 'none' }}
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                style={{
                  padding: '12px 18px', borderRadius: 12,
                  border: `1px dashed ${colors.border}`, background: colors.inputBg,
                  color: colors.textSecondary, cursor: 'pointer', fontSize: 13,
                  width: '100%', transition: 'all 0.2s ease',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = colors.accent; e.currentTarget.style.color = colors.accent }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = colors.border; e.currentTarget.style.color = colors.textSecondary }}
              >
                {Icons.folder}
                <span>选择 JSON 或 CSV 文件</span>
              </button>
            </div>

            {/* 文本输入 */}
            <textarea
              value={importText}
              onChange={e => setImportText(e.target.value)}
              placeholder="或在此粘贴 JSON/CSV 数据..."
              style={{
                width: '100%', minHeight: 150, padding: 14,
                background: colors.inputBg, border: `1px solid ${colors.border}`,
                borderRadius: 12, color: colors.text, fontSize: 13,
                fontFamily: 'monospace', resize: 'vertical', boxSizing: 'border-box',
                outline: 'none', transition: 'border-color 0.2s ease',
              }}
              onFocus={e => { e.target.style.borderColor = colors.accent }}
              onBlur={e => { e.target.style.borderColor = colors.border }}
            />

            {/* 错误提示 */}
            {importError && (
              <div style={{
                color: '#EF4444', fontSize: 12, marginTop: 10,
                padding: '8px 12px', background: 'rgba(239, 68, 68, 0.1)',
                borderRadius: 8, display: 'flex', alignItems: 'center', gap: 6,
              }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10"/>
                  <line x1="12" y1="8" x2="12" y2="12"/>
                  <line x1="12" y1="16" x2="12.01" y2="16"/>
                </svg>
                {importError}
              </div>
            )}

            {/* 操作按钮 */}
            <div style={{ display: 'flex', gap: 10, marginTop: 20, justifyContent: 'flex-end' }}>
              <button
                onClick={() => setShowImportModal(false)}
                style={{
                  padding: '10px 22px', borderRadius: 10,
                  border: `1px solid ${colors.border}`, background: 'transparent',
                  color: colors.textSecondary, cursor: 'pointer', fontSize: 14,
                  transition: 'all 0.2s ease',
                }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = colors.accent; e.currentTarget.style.color = colors.accent }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = colors.border; e.currentTarget.style.color = colors.textSecondary }}
              >取消</button>
              <button
                onClick={handleImport}
                style={{
                  padding: '10px 28px', borderRadius: 10,
                  border: 'none', background: `linear-gradient(135deg, ${colors.accent}, ${colors.accent}dd)`,
                  color: '#fff', cursor: 'pointer', fontSize: 14, fontWeight: 600,
                  transition: 'all 0.2s ease',
                  boxShadow: `0 2px 10px ${colors.accent}40`,
                }}
                onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = `0 4px 14px ${colors.accent}50` }}
                onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = `0 2px 10px ${colors.accent}40` }}
              >导入</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
