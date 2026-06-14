#!/usr/bin/env bash
# 体验版公网演示：获取 HTTPS 地址，填入 app.js 的 PROD_API_HOST
set -e
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"
PORT="${API_PORT:-8080}"
TUNNEL="${TUNNEL:-auto}"

print_success() {
  local url="$1"
  local domain
  domain="$(echo "$URL" | sed 's|https://||' | sed 's|/.*||')"
  echo ""
  echo "============================================"
  echo "  ✅ 公网地址已生成（复制下面整行到 app.js）"
  echo "============================================"
  echo ""
  echo "  var PROD_API_HOST = '${url}';"
  echo ""
  echo "============================================"
  echo "  合法域名（公众平台 request 域名填这个）："
  echo "  ${domain}"
  echo "============================================"
  echo ""
  echo "验证：浏览器打开 ${url}/api/v1/health"
  echo "      应看到 {\"status\":\"ok\",...}"
  echo ""
  echo "然后："
  echo "  1. 改 app.js → 保存 → 开发者工具上传 → 设为体验版"
  echo "  2. mp.weixin.qq.com → 开发设置 → 服务器域名 → 添加上面域名"
  echo "  3. 添加体验成员 → 分享体验版二维码"
  echo ""
  echo "⚠️  保持本窗口和后端窗口都开着，关掉隧道就会 503"
  echo "    按 Ctrl+C 可停止隧道"
  echo ""
}

verify_tunnel() {
  local url="$1"
  local i code body
  echo "▶ 正在验证公网连通性..."
  for i in 1 2 3 4 5; do
    body="$(curl -s -m 12 -H "Bypass-Tunnel-Reminder: true" "${url}/api/v1/health" 2>/dev/null || true)"
    code="$(curl -s -m 12 -o /dev/null -w "%{http_code}" -H "Bypass-Tunnel-Reminder: true" "${url}/api/v1/health" 2>/dev/null || echo "000")"
    if echo "$body" | grep -q '"status":"ok"'; then
      echo "✅ 公网验证通过"
      return 0
    fi
    if [ "$code" = "503" ]; then
      echo "   … 503 隧道未就绪，${i}/5 次重试"
    elif [ "$code" = "502" ]; then
      echo "   … 502 网关错误，${i}/5 次重试（localtunnel 偶发）"
    else
      echo "   … HTTP ${code}，${i}/5 次重试"
    fi
    sleep 3
  done
  echo ""
  echo "⚠️  地址已生成但公网验证未通过。"
  echo "   若浏览器显示 503：本窗口被关闭或隧道进程退出"
  echo "   若显示 502：localtunnel 不稳定，建议改用 ngrok（见下方说明）"
  echo ""
  return 1
}

ngrok_token_valid() {
  command -v ngrok >/dev/null 2>&1 || return 1
  local cfg="${HOME}/Library/Application Support/ngrok/ngrok.yml"
  [ -f "$cfg" ] || cfg="${HOME}/.ngrok2/ngrok.yml"
  [ -f "$cfg" ] || return 1
  local token
  token="$(grep -E '^[[:space:]]*authtoken:' "$cfg" 2>/dev/null | head -1 | sed 's/.*authtoken:[[:space:]]*//')"
  [ -n "$token" ] || return 1
  echo "$token" | grep -qiE '你的|paste|example|placeholder|xxx' && return 1
  [ "${#token}" -ge 20 ] || return 1
  return 0
}

start_ngrok() {
  echo "▶ 使用 ngrok（推荐，比 localtunnel 稳定）..."
  ngrok http "$PORT" --log=stdout >"$LT_LOG" 2>&1 &
  LT_PID=$!
  local i url
  for i in $(seq 1 30); do
    url="$(curl -sf "http://127.0.0.1:4040/api/tunnels" 2>/dev/null | grep -oE '"public_url":"https://[^"]+"' | head -1 | sed 's/"public_url":"//;s/"$//' || true)"
    if [ -n "$url" ]; then
      URL="$url"
      return 0
    fi
    sleep 1
  done
  return 1
}

start_localtunnel() {
  echo "▶ 使用 localtunnel（窗口必须一直保持打开）..."
  SUBDOMAIN="${LT_SUBDOMAIN:-}"
  LT_ARGS=(--port "$PORT" --local-host 127.0.0.1)
  if [ -n "$SUBDOMAIN" ]; then
    LT_ARGS+=(--subdomain "$SUBDOMAIN")
    echo "   固定子域名: ${SUBDOMAIN}.loca.lt"
  fi
  npx --yes localtunnel "${LT_ARGS[@]}" 2>&1 | tee "$LT_LOG" &
  LT_PID=$!
  local i url
  for i in $(seq 1 60); do
    url="$(grep -oE 'https://[a-zA-Z0-9-]+\.loca\.lt' "$LT_LOG" 2>/dev/null | head -1 || true)"
    if [ -n "$url" ]; then
      URL="$url"
      return 0
    fi
    if [ $((i % 5)) -eq 0 ]; then
      echo "   … 仍在连接 (${i}s)…"
    fi
    sleep 1
  done
  return 1
}

echo ""
echo "============================================"
echo "  膝悦 · 体验版公网 HTTPS 隧道"
echo "============================================"
echo ""

echo "▶ 检查本地后端 http://127.0.0.1:${PORT} ..."
if ! curl -sf "http://127.0.0.1:${PORT}/api/v1/health" >/dev/null 2>&1; then
  echo ""
  echo "❌ 后端未运行！"
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

LT_LOG="$(mktemp)"
trap 'rm -f "$LT_LOG"' EXIT
URL=""
LT_PID=""

pick_tunnel() {
  if [ "$TUNNEL" = "ngrok" ]; then echo ngrok; return; fi
  if [ "$TUNNEL" = "localtunnel" ] || [ "$TUNNEL" = "lt" ]; then echo localtunnel; return; fi
  if ngrok_token_valid; then echo ngrok; return; fi
  echo localtunnel
}

MODE="$(pick_tunnel)"
if [ "$MODE" = "ngrok" ]; then
  start_ngrok || { kill "$LT_PID" 2>/dev/null || true; MODE=localtunnel; start_localtunnel || true; }
else
  start_localtunnel || true
fi

if [ -z "$URL" ]; then
  kill "$LT_PID" 2>/dev/null || true
  echo ""
  echo "❌ 未能启动隧道。"
  echo ""
  echo "推荐改用 ngrok（免费、稳定）："
  echo "  1. 打开 https://dashboard.ngrok.com/get-started/your-authtoken"
  echo "  2. 复制 token，在终端执行："
  echo "       ngrok config add-authtoken <你的token>"
  echo "  3. 再运行："
  echo "       TUNNEL=ngrok bash scripts/start-experience.sh"
  echo ""
  echo "或手动：ngrok http ${PORT}，把 Forwarding 的 https 地址填进 app.js"
  echo ""
  exit 1
fi

verify_tunnel "$URL" || true
print_success "$URL"
wait "$LT_PID"
