import 'dotenv/config';
import { createApp } from './app.js';
import { loadDatabase } from './db/store.js';

const PORT = Number(process.env.API_PORT ?? 3001);

loadDatabase();
const app = createApp();

app.listen(PORT, '0.0.0.0', () => {
  const mode = process.env.NODE_ENV === 'production' ? '演示/生产' : '开发';
  console.log(`[KneeJoy] ${mode}模式已启动 http://localhost:${PORT}`);
  console.log(`[KneeJoy] 健康检查 GET /api/v1/health`);
  if (process.env.NODE_ENV === 'production') {
    console.log(`[KneeJoy] 在浏览器打开 http://localhost:${PORT} 即可使用`);
  }
});
