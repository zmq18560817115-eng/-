#!/usr/bin/env bash
# 清理小程序相关本地缓存与临时文件（不影响 Web 原型与后端）
set -e
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

echo "▶ 清理小程序构建临时目录..."
rm -rf .tmp-pillow .tmp-pillow-lib

echo "▶ 清理 Vite 构建产物（下次启动会重新 build）..."
rm -rf dist

echo ""
echo "✅ 项目内缓存已清理。"
echo ""
echo "若微信开发者工具仍显示旧项目，请手动："
echo "  工具 → 清缓存 → 全部清除"
echo "  并关闭指向项目根目录（非 _archive/miniprogram）的旧工程"
echo ""
echo "Web 原型启动：bash start-dev.sh"
echo "演示版启动：  bash scripts/start-production.sh"
