import { useState, useEffect, useMemo } from 'react'
import { useTheme } from '../ThemeContext.jsx'

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
  const [todos, setTodos] = useState(loadTodos)
  const [input, setInput] = useState('')
  const [priority, setPriority] = useState('medium')
  const [filter, setFilter] = useState('all')
  const [sortBy, setSortBy] = useState('time') // 'time' | 'priority'
  const [hoveredId, setHoveredId] = useState(null)
  const [hoveredBtn, setHoveredBtn] = useState(null)

  useEffect(() => { saveTodos(todos) }, [todos])

  const addTodo = () => {
    const text = input.trim()
    if (!text) return
    setTodos(prev => [...prev, { id: Date.now(), text, done: false, priority, createdAt: Date.now() }])
    setInput('')
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

  // Empty state logic
  const renderEmpty = () => {
    if (total === 0) {
      return (
        <div style={{ textAlign: 'center', padding: '48px 20px', color: colors.textMuted }}>
          <div style={{ fontSize: 40, marginBottom: 12, animation: 'fishFloat 3s ease-in-out infinite' }}>🐟</div>
          <div style={{ fontSize: 15, lineHeight: 1.6 }}>暂无待办，享受摸鱼时光</div>
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
              const pm = PRIORITY_META[todo.priority] || PRIORITY_META.medium
              return (
                <div
                  key={todo.id}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 10,
                    padding: '10px 20px', transition: 'background 0.15s',
                    background: isHovered ? colors.hover : 'transparent',
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
    </div>
  )
}
