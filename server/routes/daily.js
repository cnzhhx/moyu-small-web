import { Router } from 'express';
import axios from 'axios';

const router = Router();

// ============ 每日一言 ============
router.get('/sentence', async (_req, res) => {
  try {
    const { data } = await axios.get('https://v1.hitokoto.cn/', {
      headers: { 'User-Agent': 'Mozilla/5.0' },
      timeout: 5000,
    });
    res.json({
      success: true,
      data: {
        content: data.hitokoto || '',
        from: data.from || '',
        author: data.from_who || '',
      },
    });
  } catch {
    res.json({
      success: true,
      data: {
        content: '摸鱼一时爽，一直摸鱼一直爽。',
        from: '摸鱼学导论',
        author: '佚名',
      },
    });
  }
});

// ============ 假期倒计时 ============
const holidays = [
  { name: '元旦', date: '2025-01-01' },
  { name: '春节', date: '2025-01-28' },
  { name: '清明节', date: '2025-04-04' },
  { name: '劳动节', date: '2025-05-01' },
  { name: '端午节', date: '2025-05-31' },
  { name: '中秋节', date: '2025-10-06' },
  { name: '国庆节', date: '2025-10-01' },
  { name: '元旦', date: '2026-01-01' },
  { name: '春节', date: '2026-02-17' },
  { name: '清明节', date: '2026-04-05' },
  { name: '劳动节', date: '2026-05-01' },
  { name: '端午节', date: '2026-06-19' },
  { name: '中秋节', date: '2026-09-25' },
  { name: '国庆节', date: '2026-10-01' },
];

router.get('/countdown', (_req, res) => {
  const now = new Date();
  now.setHours(0, 0, 0, 0);

  const upcoming = holidays
    .map((h) => {
      const target = new Date(h.date + 'T00:00:00+08:00');
      const diff = Math.ceil((target - now) / (1000 * 60 * 60 * 24));
      return { ...h, days: diff };
    })
    .filter((h) => h.days > 0)
    .sort((a, b) => a.days - b.days);

  res.json({
    success: true,
    data: {
      next: upcoming[0] || null,
      list: upcoming.slice(0, 5),
    },
  });
});

export default router;
