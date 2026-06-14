#!/bin/bash
# 双击启动：无需安装 Node，只需本机有 Docker Desktop
cd "$(dirname "$0")"

if ! command -v docker >/dev/null 2>&1; then
  osascript -e 'display alert "请先安装 Docker Desktop" message "下载地址：https://www.docker.com/products/docker-desktop/"'
  exit 1
fi

if ! docker info >/dev/null 2>&1; then
  osascript -e 'display alert "请先打开 Docker Desktop" message "启动 Docker 后再次双击本文件。"'
  exit 1
fi

echo "正在构建并启动膝悦演示版（首次约 1～3 分钟）..."
docker compose up --build -d

if [ $? -eq 0 ]; then
  sleep 2
  open "http://localhost:8080"
  osascript -e 'display notification "浏览器已打开 http://localhost:8080" with title "膝悦演示版已启动"'
  echo ""
  echo "演示版地址: http://localhost:8080"
  echo "停止服务: 在项目目录执行 docker compose down"
else
  osascript -e 'display alert "启动失败" message "请查看终端里的错误信息。"'
fi
