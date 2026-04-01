import express from 'express';
import cors from 'cors';
import hotlistRouter from './routes/hotlist.js';
import dailyRouter from './routes/daily.js';

const app = express();
const PORT = 3001;

app.use(cors({
  origin: ['http://localhost:5173'],
  credentials: true,
}));

app.use(express.json());

// 路由注册
app.use('/api/hotlist', hotlistRouter);
app.use('/api/daily', dailyRouter);

// 健康检查
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.listen(PORT, () => {
  console.log(`摸鱼服务器已启动: http://localhost:${PORT}`);
});
