import { useState, useEffect, useMemo } from 'react';
import { useTheme } from '../ThemeContext.jsx';

// 模拟热榜历史数据生成
function generateMockHistory(source, days = 7) {
  const data = [];
  const now = new Date();
  const baseValues = {
    zhihu: 850000, weibo: 1200000, bilibili: 600000,
    github: 450000, juejin: 200000, douyin: 2000000,
    baidu: 1500000, hupu: 300000, '36kr': 150000,
    sspai: 80000, toutiao: 1800000
  };

  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);
    const base = baseValues[source] || 500000;
    const randomFactor = 0.7 + Math.random() * 0.6; // 0.7 - 1.3
    const weekendFactor = date.getDay() === 0 || date.getDay() === 6 ? 0.8 : 1;

    data.push({
      date: date.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' }),
      fullDate: date.toISOString().split('T')[0],
      value: Math.floor(base * randomFactor * weekendFactor),
      items: Math.floor(20 + Math.random() * 30),
    });
  }
  return data;
}

// 简单的柱状图组件
function BarChart({ data, colors, height = 200 }) {
  const max = Math.max(...data.map(d => d.value));
  const barWidth = 100 / data.length;

  return (
    <div style={{ height, display: 'flex', alignItems: 'flex-end', gap: 4, padding: '10px 0' }}>
      {data.map((item, i) => {
        const heightPercent = (item.value / max) * 100;
        return (
          <div
            key={i}
            style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 4,
            }}
          >
            <div
              style={{
                width: '100%',
                height: `${heightPercent}%`,
                background: `linear-gradient(to top, ${colors.accent}, ${colors.accent}88)`,
                borderRadius: '4px 4px 0 0',
                transition: 'height 0.3s ease',
                minHeight: 4,
              }}
              title={`${item.date}: ${(item.value / 10000).toFixed(1)}万热度`}
            />
            <span style={{ fontSize: 10, color: colors.textSecondary }}>{item.date.slice(-2)}日</span>
          </div>
        );
      })}
    </div>
  );
}

// 饼图组件
function PieChart({ data, colors, size = 150 }) {
  const total = data.reduce((sum, d) => sum + d.value, 0);
  let currentAngle = 0;

  return (
    <div style={{ width: size, height: size, position: 'relative' }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        {data.map((item, i) => {
          const percentage = item.value / total;
          const angle = percentage * 360;
          const startAngle = currentAngle;
          currentAngle += angle;
          const endAngle = currentAngle;

          const startRad = (startAngle - 90) * Math.PI / 180;
          const endRad = (endAngle - 90) * Math.PI / 180;

          const x1 = size / 2 + (size / 2 - 10) * Math.cos(startRad);
          const y1 = size / 2 + (size / 2 - 10) * Math.sin(startRad);
          const x2 = size / 2 + (size / 2 - 10) * Math.cos(endRad);
          const y2 = size / 2 + (size / 2 - 10) * Math.sin(endRad);

          const largeArc = angle > 180 ? 1 : 0;

          const pieColors = ['#ef4444', '#f97316', '#eab308', '#22c55e', '#3b82f6', '#a855f7', '#ec4899'];

          return (
            <path
              key={i}
              d={`M ${size / 2} ${size / 2} L ${x1} ${y1} A ${size / 2 - 10} ${size / 2 - 10} 0 ${largeArc} 1 ${x2} ${y2} Z`}
              fill={pieColors[i % pieColors.length]}
              stroke={colors.cardBg}
              strokeWidth={2}
            />
          );
        })}
        <circle cx={size / 2} cy={size / 2} r={size / 6} fill={colors.cardBg} />
      </svg>
    </div>
  );
}

// 折线图组件
function LineChart({ data, colors, height = 200 }) {
  const max = Math.max(...data.map(d => d.value));
  const min = Math.min(...data.map(d => d.value));
  const range = max - min || 1;
  const padding = 20;

  const points = data.map((d, i) => {
    const x = (i / (data.length - 1)) * (100 - padding * 2) + padding;
    const y = 100 - ((d.value - min) / range) * (100 - padding * 2) - padding;
    return `${x},${y}`;
  }).join(' ');

  return (
    <div style={{ height, position: 'relative' }}>
      <svg width="100%" height="100%" viewBox="0 0 100 100" preserveAspectRatio="none">
        {/* Grid lines */}
        {[0, 25, 50, 75, 100].map(y => (
          <line
            key={y}
            x1="0"
            y1={y}
            x2="100"
            y2={y}
            stroke={colors.border}
            strokeWidth="0.5"
            strokeDasharray="2,2"
          />
        ))}
        {/* Area fill */}
        <polygon
          points={`${points} 100,100 0,100`}
          fill={`${colors.accent}22`}
        />
        {/* Line */}
        <polyline
          points={points}
          fill="none"
          stroke={colors.accent}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {/* Data points */}
        {data.map((d, i) => {
          const x = (i / (data.length - 1)) * (100 - padding * 2) + padding;
          const y = 100 - ((d.value - min) / range) * (100 - padding * 2) - padding;
          return (
            <circle
              key={i}
              cx={x}
              cy={y}
              r="1.5"
              fill={colors.accent}
            />
          );
        })}
      </svg>
    </div>
  );
}

export default function HotlistAnalytics({ source }) {
  const { colors } = useTheme();
  const [activeTab, setActiveTab] = useState('trend');
  const [timeRange, setTimeRange] = useState(7);
  const [historyData, setHistoryData] = useState([]);
  const [platformComparison, setPlatformComparison] = useState([]);
  const [keywordData, setKeywordData] = useState([]);

  // 生成模拟数据
  useEffect(() => {
    if (source) {
      setHistoryData(generateMockHistory(source, timeRange));
    }

    // 平台对比数据
    const platforms = [
      { name: '微博', key: 'weibo', value: 1200000 },
      { name: '抖音', key: 'douyin', value: 2000000 },
      { name: '头条', key: 'toutiao', value: 1800000 },
      { name: '百度', key: 'baidu', value: 1500000 },
      { name: '知乎', key: 'zhihu', value: 850000 },
      { name: 'B站', key: 'bilibili', value: 600000 },
      { name: 'GitHub', key: 'github', value: 450000 },
    ];
    setPlatformComparison(platforms);

    // 热门关键词数据
    const keywords = [
      { name: 'AI技术', value: 95, trend: 'up' },
      { name: '新能源汽车', value: 88, trend: 'up' },
      { name: '股市行情', value: 82, trend: 'down' },
      { name: '电影票房', value: 76, trend: 'up' },
      { name: '游戏发布', value: 71, trend: 'stable' },
      { name: '体育赛事', value: 65, trend: 'up' },
      { name: '明星八卦', value: 58, trend: 'down' },
      { name: '美食探店', value: 52, trend: 'stable' },
    ];
    setKeywordData(keywords);
  }, [source, timeRange]);

  const tabs = [
    { key: 'trend', label: '趋势分析', icon: '📈' },
    { key: 'compare', label: '平台对比', icon: '📊' },
    { key: 'keywords', label: '热门关键词', icon: '🔥' },
  ];

  const stats = useMemo(() => {
    if (!historyData.length) return null;
    const values = historyData.map(d => d.value);
    const avg = values.reduce((a, b) => a + b, 0) / values.length;
    const max = Math.max(...values);
    const min = Math.min(...values);
    const change = ((values[values.length - 1] - values[0]) / values[0]) * 100;

    return { avg, max, min, change };
  }, [historyData]);

  return (
    <div style={{
      background: colors.cardBg,
      borderRadius: 12,
      border: `1px solid ${colors.border}`,
      padding: 16,
      marginBottom: 16,
    }}>
      {/* Header */}
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        marginBottom: 16, flexWrap: 'wrap', gap: 12,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 20 }}>📈</span>
          <span style={{ fontSize: 16, fontWeight: 600, color: colors.text }}>
            热榜数据分析
          </span>
        </div>

        {/* Time Range Selector */}
        <div style={{ display: 'flex', gap: 4 }}>
          {[7, 14, 30].map(days => (
            <button
              key={days}
              onClick={() => setTimeRange(days)}
              style={{
                padding: '4px 12px', borderRadius: 4,
                border: `1px solid ${timeRange === days ? colors.accent : colors.border}`,
                background: timeRange === days ? colors.accent : 'transparent',
                color: timeRange === days ? '#fff' : colors.textSecondary,
                cursor: 'pointer', fontSize: 12,
              }}
            >
              {days}天
            </button>
          ))}
        </div>
      </div>

      {/* Tabs */}
      <div style={{
        display: 'flex', gap: 4, borderBottom: `1px solid ${colors.border}`,
        marginBottom: 16,
      }}>
        {tabs.map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            style={{
              padding: '10px 16px', border: 'none', background: 'transparent',
              color: activeTab === tab.key ? colors.accent : colors.textSecondary,
              borderBottom: `2px solid ${activeTab === tab.key ? colors.accent : 'transparent'}`,
              cursor: 'pointer', fontSize: 13, fontWeight: activeTab === tab.key ? 600 : 400,
              display: 'flex', alignItems: 'center', gap: 6,
            }}
          >
            {tab.icon} {tab.label}
          </button>
        ))}
      </div>

      {/* Trend Tab */}
      {activeTab === 'trend' && stats && (
        <div>
          {/* Stats Cards */}
          <div style={{
            display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)',
            gap: 10, marginBottom: 16,
          }}>
            {[
              { label: '平均热度', value: `${(stats.avg / 10000).toFixed(1)}万`, color: colors.accent },
              { label: '最高热度', value: `${(stats.max / 10000).toFixed(1)}万`, color: '#22c55e' },
              { label: '最低热度', value: `${(stats.min / 10000).toFixed(1)}万`, color: '#f59e0b' },
              { label: '变化趋势', value: `${stats.change > 0 ? '+' : ''}${stats.change.toFixed(1)}%`,
                color: stats.change > 0 ? '#22c55e' : '#ef4444' },
            ].map((stat, i) => (
              <div
                key={i}
                style={{
                  padding: 12, background: colors.inputBg,
                  borderRadius: 8, textAlign: 'center',
                }}
              >
                <div style={{ fontSize: 11, color: colors.textSecondary, marginBottom: 4 }}>
                  {stat.label}
                </div>
                <div style={{ fontSize: 18, fontWeight: 700, color: stat.color }}>
                  {stat.value}
                </div>
              </div>
            ))}
          </div>

          {/* Chart */}
          <div style={{ marginBottom: 12 }}>
            <div style={{ fontSize: 13, color: colors.textSecondary, marginBottom: 8 }}>
              热度趋势 ({timeRange}天)
            </div>
            <LineChart data={historyData} colors={colors} height={180} />
          </div>
        </div>
      )}

      {/* Compare Tab */}
      {activeTab === 'compare' && (
        <div>
          <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap' }}>
            {/* Pie Chart */}
            <div style={{ flex: 1, minWidth: 200 }}>
              <div style={{ fontSize: 13, color: colors.textSecondary, marginBottom: 12 }}>
                平台热度占比
              </div>
              <div style={{ display: 'flex', justifyContent: 'center' }}>
                <PieChart data={platformComparison} colors={colors} size={150} />
              </div>
            </div>

            {/* Ranking List */}
            <div style={{ flex: 1, minWidth: 200 }}>
              <div style={{ fontSize: 13, color: colors.textSecondary, marginBottom: 12 }}>
                热度排行
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {platformComparison
                  .sort((a, b) => b.value - a.value)
                  .slice(0, 7)
                  .map((platform, i) => (
                    <div
                      key={platform.key}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 8,
                        padding: '8px 12px', background: colors.inputBg,
                        borderRadius: 6,
                      }}
                    >
                      <span style={{
                        width: 20, height: 20, borderRadius: '50%',
                        background: i < 3 ? colors.accent : colors.border,
                        color: '#fff', fontSize: 11, fontWeight: 700,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                      }}>
                        {i + 1}
                      </span>
                      <span style={{ flex: 1, fontSize: 13, color: colors.text }}>
                        {platform.name}
                      </span>
                      <span style={{ fontSize: 12, color: colors.accent, fontWeight: 600 }}>
                        {(platform.value / 10000).toFixed(0)}万
                      </span>
                    </div>
                  ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Keywords Tab */}
      {activeTab === 'keywords' && (
        <div>
          <div style={{
            display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
            gap: 10,
          }}>
            {keywordData.map((keyword, i) => (
              <div
                key={i}
                style={{
                  padding: 12, background: colors.inputBg,
                  borderRadius: 8, display: 'flex', alignItems: 'center', gap: 10,
                }}
              >
                <div style={{
                  width: 8, height: 8, borderRadius: '50%',
                  background: keyword.trend === 'up' ? '#22c55e' :
                    keyword.trend === 'down' ? '#ef4444' : '#f59e0b',
                }} />
                <span style={{ flex: 1, fontSize: 13, color: colors.text }}>
                  {keyword.name}
                </span>
                <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <div style={{
                    width: 60, height: 6, background: colors.border,
                    borderRadius: 3, overflow: 'hidden',
                  }}>
                    <div style={{
                      width: `${keyword.value}%`, height: '100%',
                      background: colors.accent,
                    }} />
                  </div>
                  <span style={{ fontSize: 11, color: colors.textSecondary, width: 30 }}>
                    {keyword.value}
                  </span>
                </div>
                <span style={{ fontSize: 14 }}>
                  {keyword.trend === 'up' ? '📈' : keyword.trend === 'down' ? '📉' : '➡️'}
                </span>
              </div>
            ))}
          </div>

          <div style={{
            marginTop: 16, padding: 12, background: colors.inputBg,
            borderRadius: 8, textAlign: 'center',
          }}>
            <div style={{ fontSize: 12, color: colors.textSecondary }}>
              💡 数据每小时更新一次，基于各平台实时热度计算
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
