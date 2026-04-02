import { useState, useEffect, useMemo, useRef, useCallback } from 'react'
import { useTheme } from '../ThemeContext.jsx'
import { useToast } from '../App.jsx'

const STORAGE_KEY = 'moyu-todos'

function loadTodos() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

function saveTodos(todos) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(todos))
  } catch {}
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
  high: { color: '#ef4444', label: '高', emoji: '🔴' },
  medium: { color: '#eab308', label: '中', emoji: '🟡' },
  low: { color: '#22c55e', label: '低', emoji: '🟢' },
}

const PRIORITY_ORDER = { high: 0, medium: 1, low: 2 }

function getMotivation(rate) {
  if (rate === 0) return '新的一天，从第一个任务开始吧 💪'
  if (rate < 0.3) return '才刚开始，继续加油 🚀'
  if (rate < 0.6) return '进度不错，保持节奏 🎯'
  if (rate < 1) return '快完成了，冲刺一下 🔥'
  return '全部搞定！今天的你超棒 🏆'
}

const fishKeyframes = `
@keyframes fishFloat {
  0%, 100% { transform: translateY(0px); }
  50% { transform: translateY(-10px); }
}
@keyframes progressFill {
  from { width: 0%; }
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

  // Empty state illustrations
  const EmptyStateIllustration = () => (
    <svg width="120" height="100" viewBox="0 0 120 100" fill="none" style={{ marginBottom: 16 }}>
      <circle cx="60" cy="50" r="35" fill={colors.accentLight} opacity="0.5" />
      <rect x="35" y="45" width="50" height="6" rx="3" fill={colors.border} />
      <rect x="40" y="55" width="40" height="6" rx="3" fill={colors.border} />
      <circle cx="45" cy="35" r="6" fill={colors.accent} opacity="0.6" />
      <circle cx="75" cy="35" r="6" fill={colors.accent} opacity="0.6" />
      <path d="M50 65Q60 72 70 65" stroke={colors.accent} strokeWidth="3" strokeLinecap="round" fill="none" />
    </svg>
  )

  // Empty state logic
  const renderEmpty = () => {
    if (total === 0) {
      return (
        <div style={{ textAlign: 'center', padding: '48px 20px', color: colors.textMuted }}>
          <EmptyStateIllustration />
          <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 8, color: colors.text }}>暂无待办任务</div>
          <div style={{ fontSize: 14, marginBottom: 20 }}>开始规划你的一天吧 ✨</div>
          <button
            onClick={() => document.querySelector('input[placeholder*="做什么"]').focus()}
            style={{
              padding: '10px 24px', borderRadius: 20, border: 'none',
              background: colors.accent, color: '#fff', fontSize: 14,
              fontWeight: 500, cursor: 'pointer', transition: 'all 0.2s',
              boxShadow: `0 2px 8px ${colors.accent}40`,
            }}
            onMouseEnter={e => { e.currentTarget.style.transform = 'scale(1.02)'; e.currentTarget.style.boxShadow = `0 4px 12px ${colors.accent}60` }}
            onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.boxShadow = `0 2px 8px ${colors.accent}40` }}
          >
            + 添加第一个任务
          </button>
        </div>
      )
    }
    if (filter === 'done' && doneCount === 0) {
      return (
        <div style={{ textAlign: 'center', padding: '48px 20px', color: colors.textMuted, fontSize: 14 }}>
          还没有完成的任务哦，加油 💪
        </div>
      )
    }
    if (filter === 'active' && activeCount === 0) {
      return (
        <div style={{ textAlign: 'center', padding: '48px 20px', color: colors.textMuted }}>
          <div style={{ fontSize: 32, marginBottom: 8 }}>🎉</div>
          <div style={{ fontSize: 15 }}>所有任务已完成！奖励自己摸会儿鱼吧</div>
          <div style={{ fontSize: 32, marginTop: 8, animation: 'fishFloat 2.5s ease-in-out infinite' }}>🐟</div>
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
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
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
              <span style={{ fontSize: 18, fontWeight: 700, color: colors.text }}>📋 每日待办</span>
              {total > 0 && (
                <span style={{
                  fontSize: 11, fontWeight: 600, background: colors.accentLight,
                  color: colors.accent, padding: '2px 8px', borderRadius: 10,
                }}>
                  {total}
                </span>
              )}
            </div>
            <div style={{ display: 'flex', gap: 6 }}>
              <button
                onClick={openImportModal}
                style={{
                  padding: '5px 10px', borderRadius: 6,
                  border: `1px solid ${colors.border}`, background: 'transparent',
                  color: colors.textSecondary, cursor: 'pointer', fontSize: 11,
                  transition: 'all 0.2s', display: 'flex', alignItems: 'center', gap: 4,
                }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = colors.accent; e.currentTarget.style.color = colors.accent }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = colors.border; e.currentTarget.style.color = colors.textSecondary }}
                title="导入数据"
              >
                <span>⬆️</span> 导入
              </button>
              {total > 0 && (
                <>
                  <button
                    onClick={() => exportTodos('json')}
                    style={{
                      padding: '5px 10px', borderRadius: 6,
                      border: `1px solid ${colors.border}`, background: 'transparent',
                      color: colors.textSecondary, cursor: 'pointer', fontSize: 11,
                      transition: 'all 0.2s', display: 'flex', alignItems: 'center', gap: 4,
                    }}
                    onMouseEnter={e => { e.currentTarget.style.borderColor = colors.accent; e.currentTarget.style.color = colors.accent }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor = colors.border; e.currentTarget.style.color = colors.textSecondary }}
                    title="导出为 JSON"
                  >
                    <span>⬇️</span> JSON
                  </button>
                  <button
                    onClick={() => exportTodos('csv')}
                    style={{
                      padding: '5px 10px', borderRadius: 6,
                      border: `1px solid ${colors.border}`, background: 'transparent',
                      color: colors.textSecondary, cursor: 'pointer', fontSize: 11,
                      transition: 'all 0.2s', display: 'flex', alignItems: 'center', gap: 4,
                    }}
                    onMouseEnter={e => { e.currentTarget.style.borderColor = colors.accent; e.currentTarget.style.color = colors.accent }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor = colors.border; e.currentTarget.style.color = colors.textSecondary }}
                    title="导出为 CSV"
                  >
                    <span>📊</span> CSV
                  </button>
                </>
              )}
            </div>
          </div>
          <div style={{ fontSize: 12, color: colors.textMuted, marginTop: 2 }}>
            {getMotivation(completionRate)}
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
                padding: '9px 18px', borderRadius: 10, border: 'none',
                background: colors.accent, color: '#fff', fontSize: 14,
                fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap',
                transition: 'opacity 0.2s, transform 0.15s',
                opacity: input.trim() ? 1 : 0.6,
              }}
              onClick={addTodo}
              onMouseDown={e => { e.currentTarget.style.transform = 'scale(0.96)' }}
              onMouseUp={e => { e.currentTarget.style.transform = 'scale(1)' }}
            >
              添加
            </button>
          </div>
          {/* Priority selector */}
          <div style={{ display: 'flex', gap: 6, marginTop: 10, alignItems: 'center' }}>
            <span style={{ fontSize: 12, color: colors.textMuted, marginRight: 4 }}>优先级</span>
            {Object.entries(PRIORITY_META).map(([key, meta]) => (
              <button
                key={key}
                onClick={() => setPriority(key)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 4,
                  padding: '3px 10px', borderRadius: 12, border: 'none',
                  background: priority === key ? `${meta.color}22` : 'transparent',
                  color: priority === key ? meta.color : colors.textMuted,
                  cursor: 'pointer', fontSize: 12, fontWeight: priority === key ? 600 : 400,
                  transition: 'all 0.2s',
                  outline: priority === key ? `2px solid ${meta.color}44` : '2px solid transparent',
                }}
              >
                <span style={{
                  width: 8, height: 8, borderRadius: '50%', background: meta.color,
                  display: 'inline-block', opacity: priority === key ? 1 : 0.4,
                  transition: 'opacity 0.2s',
                }} />
                {meta.label}
              </button>
            ))}
          </div>
        </div>

        {/* ===== PROGRESS BAR ===== */}
        {total > 0 && (
          <div style={{ padding: '12px 20px 8px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
              <span style={{ fontSize: 12, color: colors.textSecondary, fontWeight: 500 }}>
                已完成 {doneCount}/{total} ({pct}%)
              </span>
            </div>
            <div style={{
              height: 6, borderRadius: 3, background: colors.border,
              overflow: 'hidden', transition: 'background 0.3s',
            }}>
              <div style={{
                height: '100%', borderRadius: 3,
                background: `linear-gradient(90deg, ${colors.accent}, ${colors.accent}cc)`,
                width: `${pct}%`,
                transition: 'width 0.5s cubic-bezier(0.4, 0, 0.2, 1)',
                animation: 'progressFill 0.8s ease-out',
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
            filtered.map(todo => {
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
                    display: 'flex', alignItems: 'center', gap: 10,
                    padding: '10px 20px', transition: 'all 0.15s',
                    background: isDragOver ? colors.accentLight : (isHovered ? colors.hover : 'transparent'),
                    opacity: isDragged ? 0.5 : 1,
                    transform: isDragged ? 'scale(0.98)' : 'none',
                    borderTop: isDragOver ? `2px solid ${colors.accent}` : '2px solid transparent',
                    cursor: 'move',
                    animation: 'fadeIn 0.25s ease-out',
                  }}
                  onMouseEnter={() => setHoveredId(todo.id)}
                  onMouseLeave={() => { setHoveredId(null); setHoveredBtn(null) }}
                >
                  {/* Priority dot */}
                  <span style={{
                    width: 7, height: 7, borderRadius: '50%', background: pm.color,
                    flexShrink: 0, opacity: todo.done ? 0.3 : 0.85,
                    transition: 'opacity 0.2s',
                  }} />

                  {/* Custom checkbox */}
                  <button
                    onClick={() => toggleTodo(todo.id)}
                    style={{
                      width: 20, height: 20, borderRadius: '50%', flexShrink: 0,
                      border: todo.done ? `2px solid ${colors.accent}` : `2px solid ${colors.border}`,
                      background: todo.done ? colors.accent : 'transparent',
                      cursor: 'pointer', display: 'flex', alignItems: 'center',
                      justifyContent: 'center', padding: 0,
                      transition: 'all 0.2s',
                      animation: todo.done ? 'checkPop 0.25s ease-out' : 'none',
                    }}
                  >
                    {todo.done && (
                      <svg width="11" height="11" viewBox="0 0 12 12" fill="none">
                        <path d="M2.5 6L5 8.5L9.5 3.5" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    )}
                  </button>

                  {/* Text + time */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{
                      fontSize: 14, color: colors.text, lineHeight: 1.4,
                      textDecoration: todo.done ? 'line-through' : 'none',
                      opacity: todo.done ? 0.4 : 1,
                      transition: 'opacity 0.3s',
                      overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                    }}>
                      {todo.text}
                    </div>
                    <div style={{ fontSize: 11, color: colors.textMuted, marginTop: 2 }}>
                      {relativeTime(todo.createdAt || todo.id)}
                    </div>
                  </div>

                  {/* Action buttons - hover only */}
                  <div style={{
                    display: 'flex', gap: 2,
                    opacity: isHovered ? 1 : 0,
                    transition: 'opacity 0.2s',
                    pointerEvents: isHovered ? 'auto' : 'none',
                  }}>
                    {[
                      { label: '↑', title: '上移', action: () => moveItem(todo.id, -1) },
                      { label: '↓', title: '下移', action: () => moveItem(todo.id, 1) },
                      { label: '🗑', title: '删除', action: () => deleteTodo(todo.id) },
                    ].map(btn => {
                      const bKey = `${todo.id}-${btn.label}`
                      return (
                        <button
                          key={btn.label}
                          title={btn.title}
                          onClick={btn.action}
                          onMouseEnter={() => setHoveredBtn(bKey)}
                          onMouseLeave={() => setHoveredBtn(null)}
                          style={{
                            width: 26, height: 26, borderRadius: 6, border: 'none',
                            background: hoveredBtn === bKey ? colors.accentLight : 'transparent',
                            color: hoveredBtn === bKey ? colors.accent : colors.textMuted,
                            cursor: 'pointer', fontSize: btn.label === '🗑' ? 13 : 14,
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            padding: 0, transition: 'all 0.15s',
                          }}
                        >
                          {btn.label}
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
            padding: '10px 20px', borderTop: `1px solid ${colors.border}`,
            fontSize: 12, color: colors.textMuted, textAlign: 'center',
            transition: 'color 0.3s, border-color 0.3s',
          }}>
            今日完成 {doneCount} 项 | 剩余 {activeCount} 项 | 效率 {pct}%
          </div>
        )}
      </div>

      {/* ===== IMPORT MODAL ===== */}
      {showImportModal && (
        <div
          style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            zIndex: 1000, backdropFilter: 'blur(4px)',
          }}
          onClick={() => setShowImportModal(false)}
        >
          <div
            style={{
              background: colors.cardBg, borderRadius: 16,
              border: `1px solid ${colors.border}`, width: '90%', maxWidth: 500,
              maxHeight: '80vh', overflow: 'auto', padding: 24,
              boxShadow: `0 8px 32px ${colors.shadow}`,
            }}
            onClick={e => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h3 style={{ margin: 0, color: colors.text, fontSize: 18 }}>📥 导入任务</h3>
              <button
                onClick={() => setShowImportModal(false)}
                style={{
                  background: 'transparent', border: 'none', color: colors.textSecondary,
                  cursor: 'pointer', fontSize: 20, padding: '0 4px',
                }}
              >✕</button>
            </div>

            {/* 导入模式选择 */}
            <div style={{ marginBottom: 16 }}>
              <span style={{ fontSize: 13, color: colors.textSecondary, marginRight: 12 }}>导入模式：</span>
              <label style={{ marginRight: 16, cursor: 'pointer' }}>
                <input
                  type="radio"
                  value="merge"
                  checked={importMode === 'merge'}
                  onChange={() => setImportMode('merge')}
                  style={{ accentColor: colors.accent, marginRight: 6 }}
                />
                <span style={{ fontSize: 13, color: colors.text }}>合并到现有</span>
              </label>
              <label style={{ cursor: 'pointer' }}>
                <input
                  type="radio"
                  value="replace"
                  checked={importMode === 'replace'}
                  onChange={() => setImportMode('replace')}
                  style={{ accentColor: colors.accent, marginRight: 6 }}
                />
                <span style={{ fontSize: 13, color: colors.text }}>覆盖现有</span>
              </label>
            </div>

            {/* 文件上传 */}
            <div style={{ marginBottom: 12 }}>
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
                  padding: '8px 16px', borderRadius: 8,
                  border: `1px dashed ${colors.border}`, background: colors.inputBg,
                  color: colors.textSecondary, cursor: 'pointer', fontSize: 13,
                  width: '100%', marginBottom: 12,
                }}
              >
                📁 选择 JSON 或 CSV 文件
              </button>
            </div>

            {/* 文本输入 */}
            <textarea
              value={importText}
              onChange={e => setImportText(e.target.value)}
              placeholder="或在此粘贴 JSON/CSV 数据..."
              style={{
                width: '100%', minHeight: 150, padding: 12,
                background: colors.inputBg, border: `1px solid ${colors.border}`,
                borderRadius: 8, color: colors.text, fontSize: 13,
                fontFamily: 'monospace', resize: 'vertical', boxSizing: 'border-box',
                outline: 'none',
              }}
            />

            {/* 错误提示 */}
            {importError && (
              <div style={{ color: colors.accent, fontSize: 12, marginTop: 8 }}>
                ⚠️ {importError}
              </div>
            )}

            {/* 操作按钮 */}
            <div style={{ display: 'flex', gap: 10, marginTop: 16, justifyContent: 'flex-end' }}>
              <button
                onClick={() => setShowImportModal(false)}
                style={{
                  padding: '10px 20px', borderRadius: 8,
                  border: `1px solid ${colors.border}`, background: 'transparent',
                  color: colors.textSecondary, cursor: 'pointer', fontSize: 14,
                }}
              >取消</button>
              <button
                onClick={handleImport}
                style={{
                  padding: '10px 24px', borderRadius: 8,
                  border: 'none', background: colors.accent, color: '#fff',
                  cursor: 'pointer', fontSize: 14, fontWeight: 600,
                }}
              >导入</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
