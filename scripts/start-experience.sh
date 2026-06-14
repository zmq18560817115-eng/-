#!/usr/bin/env bash
# 体验版公网演示：获取 HTTPS 地址，填入 app.js 的 PROD_API_HOST
set -e
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"
PORT="${API_PORT:-8080}"

echo ""
echo "============================================"
echo "  膝悦 · 体验版公网 HTTPS 隧道"
echo "============================================"
echo ""

# 检查后端
echo "▶ 检查本地后端 http://127.0.0.1:${PORT} ..."
if ! curl -sf "http://127.0.0.1:${PORT}/api/v1/health" >/dev/null 2>&1; then
  echo ""
  echo "❌ 后端未运行！本脚本不会显示公网地址。"
  echo ""
  echo "请按顺序操作："
  echo "  【终端 1】先运行并保持不关："
  echo "    cd \"${ROOT}\""
  echo "    bash scripts/start-production.sh"
  echo ""
  echo "  【终端 2】等看到「演示/生产模式已启动」后，再运行："
  echo "    bash scripts/start-experience.sh"
  echo ""
  exit 1
fi

echo "✅ 后端已就绪"
echo ""
echo "▶ 正在启动 localtunnel（首次约需 10~30 秒，请耐心等待）..."
echo ""

LT_LOG="$(mktemp)"
trap 'rm -f "$LT_LOG"' EXIT

npx --yes localtunnel --port "$PORT" 2>&1 | tee "$LT_LOG" &
LT_PID=$!

URL=""
for i in $(seq 1 60); do
  # 兼容多种输出格式
  URL="$(grep -oE 'https://[a-zA-Z0-9-]+\.loca\.lt' "$LT_LOG" 2>/dev/null | head -1 || true)"
  if [ -z "$URL" ]; then
    URL="$(grep -oE 'https://[a-zA-Z0-9-]+\.localtunnel\.me' "$LT_LOG" 2>/dev/null | head -1 || true)"
  fi

  if [ -n "$URL" ]; then
    DOMAIN="$(echo "$URL" | sed 's|https://||')"
    echo ""
    echo "============================================"
    echo "  ✅ 公网地址已生成（复制下面整行到 app.js）"
    echo "============================================"
    echo ""
    echo "  var PROD_API_HOST = '${URL}';"
    echo ""
    echo "============================================"
    echo "  合法域名（公众平台 request 域名填这个）："
    echo "  ${DOMAIN}"
    echo "============================================"
    echo ""
    echo "验证：浏览器打开 ${URL}/api/v1/health"
    echo "      应看到 {\"status\":\"ok\",...}"
    echo ""
    echo "然后："
    echo "  1. 改 app.js → 保存 → 开发者工具上传 → 设为体验版"
    echo "  2. mp.weixin.qq.com → 开发设置 → 服务器域名 → 添加上面域名"
    echo "  3. 添加体验成员 → 分享体验版二维码"
    echo ""
    echo "⚠️  保持本窗口和后端窗口都开着，关掉隧道就失效"
    echo "    按 Ctrl+C 可停止隧道"
    echo ""
    wait "$LT_PID"
    exit 0
  fi

  if [ $((i % 5)) -eq 0 ]; then
    echo "   … 仍在连接 (${i}s)，首次运行可能在下载依赖…"
  fi
  sleep 1
done

kill "$LT_PID" 2>/dev/null || true
echo ""
echo "❌ 60 秒内未获取到隧道地址。"
echo ""
echo "可改用 ngrok（更稳定）："
echo "  1. 打开 https://dashboard.ngrok.com 注册并复制 authtoken"
echo "  2. ngrok config add-authtoken 你的token"
echo "  3. ngrok http ${PORT}"
echo "  4. 复制 Forwarding 里的 https 地址到 app.js"
echo ""
exit 1
