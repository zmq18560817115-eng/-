#!/usr/bin/env bash
# 一键生成公网分享链接（免费 Pinggy，约 60 分钟有效）
set -e
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

PORT="${API_PORT:-8080}"

if ! curl -sf "http://localhost:${PORT}/api/v1/health" >/dev/null 2>&1; then
  echo "演示服务未在 ${PORT} 端口运行，正在启动..."
  export NODE_ENV=production
  export API_PORT="$PORT"
  if [ ! -d dist ]; then
    npm run build:prod
  fi
  npm run start:prod &
  sleep 2
fi

echo ""
echo "正在创建公网链接（请保持本窗口不要关闭）..."
echo ""

ssh -o StrictHostKeyChecking=no -p 443 -R0:127.0.0.1:${PORT} free.pinggy.io
