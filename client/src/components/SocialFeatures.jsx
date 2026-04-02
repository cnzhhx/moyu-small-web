import { useState, useEffect, useCallback } from 'react';
import { useTheme } from '../ThemeContext.jsx';

const STORAGE_KEY = 'moyu-hotlist-favorites';
const SHARE_HISTORY_KEY = 'moyu-share-history';

// 获取收藏列表
export function getFavorites() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
  } catch {
    return [];
  }
}

// 保存收藏
export function saveFavorite(item) {
  const favorites = getFavorites();
  const exists = favorites.find(f => f.url === item.url);
  if (exists) return false;

  const newFavorite = {
    ...item,
    id: Date.now().toString(),
    savedAt: new Date().toISOString(),
    tags: [],
    notes: '',
  };
  favorites.unshift(newFavorite);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(favorites.slice(0, 100))); // 最多保存100条
  return true;
}

// 移除收藏
export function removeFavorite(id) {
  const favorites = getFavorites().filter(f => f.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(favorites));
}

// 更新收藏
export function updateFavorite(id, updates) {
  const favorites = getFavorites().map(f =>
    f.id === id ? { ...f, ...updates } : f
  );
  localStorage.setItem(STORAGE_KEY, JSON.stringify(favorites));
}

// 导出收藏为图片（模拟）
export function generateShareCard(item) {
  const canvas = document.createElement('canvas');
  canvas.width = 600;
  canvas.height = 300;
  const ctx = canvas.getContext('2d');

  // Background
  const gradient = ctx.createLinearGradient(0, 0, 600, 300);
  gradient.addColorStop(0, '#e94560');
  gradient.addColorStop(1, '#ff6b8a');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 600, 300);

  // Title
  ctx.fillStyle = '#fff';
  ctx.font = 'bold 24px Arial';
  ctx.fillText('🔥 摸鱼岛热榜', 30, 50);

  // Item title
  ctx.font = 'bold 20px Arial';
  const title = item.title.length > 25 ? item.title.slice(0, 25) + '...' : item.title;
  ctx.fillText(title, 30, 120);

  // Source
  ctx.font = '16px Arial';
  ctx.fillStyle = 'rgba(255,255,255,0.8)';
  ctx.fillText(`来源: ${item.source || '未知'}`, 30, 160);

  // QR code placeholder
  ctx.fillStyle = '#fff';
  ctx.fillRect(450, 150, 120, 120);
  ctx.fillStyle = '#000';
  ctx.font = '12px Arial';
  ctx.fillText('扫码查看', 480, 285);

  return canvas.toDataURL();
}

// 收藏夹组件
export function FavoritesPanel({ colors, onClose }) {
  const [favorites, setFavorites] = useState([]);
  const [selectedTag, setSelectedTag] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [editNotes, setEditNotes] = useState('');

  useEffect(() => {
    setFavorites(getFavorites());
  }, []);

  const allTags = [...new Set(favorites.flatMap(f => f.tags || []))];

  const filtered = favorites.filter(f => {
    const matchesTag = selectedTag === 'all' || (f.tags || []).includes(selectedTag);
    const matchesSearch = f.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         f.source?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesTag && matchesSearch;
  });

  const handleDelete = (id) => {
    if (confirm('确定要删除这条收藏吗？')) {
      removeFavorite(id);
      setFavorites(getFavorites());
    }
  };

  const handleExport = () => {
    const data = JSON.stringify(favorites, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `moyu-favorites-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const imported = JSON.parse(event.target.result);
        if (Array.isArray(imported)) {
          const current = getFavorites();
          const merged = [...imported, ...current].filter((f, i, arr) =>
            arr.findIndex(t => t.url === f.url) === i
          ).slice(0, 100);
          localStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
          setFavorites(merged);
          alert(`成功导入 ${imported.length} 条收藏`);
        }
      } catch {
        alert('导入失败，请检查文件格式');
      }
    };
    reader.readAsText(file);
  };

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
      zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center',
    }} onClick={onClose}>
      <div
        style={{
          background: colors.cardBg,
          borderRadius: 16,
          border: `1px solid ${colors.border}`,
          width: '90%', maxWidth: 600, maxHeight: '80vh',
          display: 'flex', flexDirection: 'column',
          boxShadow: `0 20px 60px ${colors.shadow}`,
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{
          padding: 16, borderBottom: `1px solid ${colors.border}`,
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 24 }}>⭐</span>
            <span style={{ fontSize: 18, fontWeight: 600, color: colors.text }}>
              我的收藏 ({favorites.length})
            </span>
          </div>
          <button onClick={onClose} style={{
            background: 'none', border: 'none', fontSize: 20,
            color: colors.textSecondary, cursor: 'pointer',
          }}>✕</button>
        </div>

        {/* Toolbar */}
        <div style={{ padding: 12, borderBottom: `1px solid ${colors.border}` }}>
          <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
            <input
              type="text"
              placeholder="搜索收藏..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              style={{
                flex: 1, padding: 8, borderRadius: 6,
                border: `1px solid ${colors.border}`, background: colors.inputBg,
                color: colors.text, fontSize: 13,
              }}
            />
            <button onClick={handleExport} style={{
              padding: '8px 12px', borderRadius: 6,
              border: `1px solid ${colors.border}`, background: colors.inputBg,
              color: colors.text, cursor: 'pointer', fontSize: 12,
            }}>📤 导出</button>
            <label style={{
              padding: '8px 12px', borderRadius: 6,
              border: `1px solid ${colors.border}`, background: colors.inputBg,
              color: colors.text, cursor: 'pointer', fontSize: 12,
            }}>
              📥 导入
              <input type="file" accept=".json" onChange={handleImport} style={{ display: 'none' }} />
            </label>
          </div>

          {/* Tags */}
          {allTags.length > 0 && (
            <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
              <button
                onClick={() => setSelectedTag('all')}
                style={{
                  padding: '4px 10px', borderRadius: 12,
                  border: `1px solid ${selectedTag === 'all' ? colors.accent : colors.border}`,
                  background: selectedTag === 'all' ? colors.accent : 'transparent',
                  color: selectedTag === 'all' ? '#fff' : colors.textSecondary,
                  cursor: 'pointer', fontSize: 11,
                }}
              >
                全部
              </button>
              {allTags.map(tag => (
                <button
                  key={tag}
                  onClick={() => setSelectedTag(tag)}
                  style={{
                    padding: '4px 10px', borderRadius: 12,
                    border: `1px solid ${selectedTag === tag ? colors.accent : colors.border}`,
                    background: selectedTag === tag ? colors.accent : 'transparent',
                    color: selectedTag === tag ? '#fff' : colors.textSecondary,
                    cursor: 'pointer', fontSize: 11,
                  }}
                >
                  {tag}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* List */}
        <div style={{ flex: 1, overflow: 'auto', padding: 12 }}>
          {filtered.length === 0 ? (
            <div style={{
              textAlign: 'center', padding: 40, color: colors.textMuted,
            }}>
              <div style={{ fontSize: 48, marginBottom: 12 }}>📭</div>
              <div>暂无收藏</div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {filtered.map(item => (
                <div
                  key={item.id}
                  style={{
                    padding: 12, background: colors.inputBg,
                    borderRadius: 8, border: `1px solid ${colors.border}`,
                  }}
                >
                  <div style={{ display: 'flex', gap: 8, marginBottom: 6 }}>
                    <span style={{ fontSize: 12, color: colors.accent }}>
                      {item.source}
                    </span>
                    <span style={{ fontSize: 12, color: colors.textMuted }}>
                      {new Date(item.savedAt).toLocaleDateString('zh-CN')}
                    </span>
                  </div>
                  <a
                    href={item.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      color: colors.text, fontSize: 14, fontWeight: 500,
                      textDecoration: 'none', display: 'block', marginBottom: 8,
                    }}
                  >
                    {item.title}
                  </a>
                  {item.hot && (
                    <div style={{ fontSize: 12, color: colors.accent, marginBottom: 6 }}>
                      🔥 {item.hot}
                    </div>
                  )}

                  {/* Notes */}
                  {editingId === item.id ? (
                    <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                      <input
                        type="text"
                        value={editNotes}
                        onChange={e => setEditNotes(e.target.value)}
                        placeholder="添加备注..."
                        style={{
                          flex: 1, padding: 6, borderRadius: 4,
                          border: `1px solid ${colors.border}`, background: colors.cardBg,
                          color: colors.text, fontSize: 12,
                        }}
                      />
                      <button onClick={() => {
                        updateFavorite(item.id, { notes: editNotes });
                        setFavorites(getFavorites());
                        setEditingId(null);
                      }} style={{
                        padding: '6px 12px', borderRadius: 4,
                        border: 'none', background: colors.accent, color: '#fff',
                        cursor: 'pointer', fontSize: 12,
                      }}>保存</button>
                    </div>
                  ) : item.notes ? (
                    <div style={{ fontSize: 12, color: colors.textSecondary, marginTop: 6 }}>
                      📝 {item.notes}
                    </div>
                  ) : null}

                  {/* Actions */}
                  <div style={{
                    display: 'flex', gap: 8, marginTop: 8,
                    justifyContent: 'flex-end',
                  }}>
                    <button onClick={() => {
                      setEditingId(item.id);
                      setEditNotes(item.notes || '');
                    }} style={{
                      padding: '4px 8px', borderRadius: 4,
                      border: 'none', background: 'transparent',
                      color: colors.textSecondary, cursor: 'pointer', fontSize: 12,
                    }}>📝 备注</button>
                    <button onClick={() => {
                      navigator.clipboard.writeText(`${item.title}\n${item.url}`);
                      alert('已复制到剪贴板');
                    }} style={{
                      padding: '4px 8px', borderRadius: 4,
                      border: 'none', background: 'transparent',
                      color: colors.textSecondary, cursor: 'pointer', fontSize: 12,
                    }}>📋 复制</button>
                    <button onClick={() => handleDelete(item.id)} style={{
                      padding: '4px 8px', borderRadius: 4,
                      border: 'none', background: 'transparent',
                      color: '#ef4444', cursor: 'pointer', fontSize: 12,
                    }}>🗑️ 删除</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// 分享按钮组件
export function ShareButton({ item, colors }) {
  const [showMenu, setShowMenu] = useState(false);
  const [isFavorited, setIsFavorited] = useState(false);

  useEffect(() => {
    const favorites = getFavorites();
    setIsFavorited(favorites.some(f => f.url === item.url));
  }, [item.url]);

  const handleFavorite = () => {
    if (isFavorited) {
      const favorites = getFavorites();
      const found = favorites.find(f => f.url === item.url);
      if (found) removeFavorite(found.id);
      setIsFavorited(false);
    } else {
      saveFavorite(item);
      setIsFavorited(true);
    }
  };

  const handleShare = (type) => {
    const text = `${item.title} - 来自摸鱼岛`;
    const url = item.url;

    switch (type) {
      case 'weibo':
        window.open(`https://service.weibo.com/share/share.php?title=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`);
        break;
      case 'twitter':
        window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`);
        break;
      case 'copy':
        navigator.clipboard.writeText(`${text}\n${url}`);
        alert('已复制到剪贴板');
        break;
      case 'image':
        const imgUrl = generateShareCard(item);
        const a = document.createElement('a');
        a.href = imgUrl;
        a.download = `share-${Date.now()}.png`;
        a.click();
        break;
    }
    setShowMenu(false);
  };

  return (
    <div style={{ position: 'relative' }}>
      <div style={{ display: 'flex', gap: 4 }}>
        <button
          onClick={handleFavorite}
          style={{
            padding: '4px 8px', borderRadius: 4,
            border: 'none', background: 'transparent',
            color: isFavorited ? '#f59e0b' : colors.textSecondary,
            cursor: 'pointer', fontSize: 14,
            transition: 'all 0.2s',
          }}
          title={isFavorited ? '取消收藏' : '收藏'}
        >
          {isFavorited ? '⭐' : '☆'}
        </button>
        <button
          onClick={() => setShowMenu(!showMenu)}
          style={{
            padding: '4px 8px', borderRadius: 4,
            border: 'none', background: 'transparent',
            color: colors.textSecondary, cursor: 'pointer', fontSize: 14,
          }}
        >
          📤
        </button>
      </div>

      {showMenu && (
        <>
          <div
            style={{ position: 'fixed', inset: 0 }}
            onClick={() => setShowMenu(false)}
          />
          <div style={{
            position: 'absolute', right: 0, top: '100%',
            marginTop: 4,
            background: colors.cardBg,
            border: `1px solid ${colors.border}`,
            borderRadius: 8,
            boxShadow: `0 4px 16px ${colors.shadow}`,
            zIndex: 100,
            minWidth: 120,
          }}>
            {[
              { key: 'copy', label: '复制链接', icon: '📋' },
              { key: 'image', label: '生成卡片', icon: '🖼️' },
              { key: 'weibo', label: '微博', icon: '📱' },
              { key: 'twitter', label: 'Twitter', icon: '🐦' },
            ].map(action => (
              <button
                key={action.key}
                onClick={() => handleShare(action.key)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 8,
                  padding: '10px 14px', width: '100%',
                  border: 'none', background: 'transparent',
                  color: colors.text, cursor: 'pointer', fontSize: 13,
                  textAlign: 'left',
                  transition: 'background 0.15s',
                }}
                onMouseEnter={e => e.currentTarget.style.background = colors.hover}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
              >
                <span>{action.icon}</span>
                <span>{action.label}</span>
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

export default { getFavorites, saveFavorite, removeFavorite, FavoritesPanel, ShareButton };
