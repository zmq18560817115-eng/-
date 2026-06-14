#!/bin/bash
# 双击启动：需本机已安装 Node.js（https://nodejs.org）
cd "$(dirname "$0")"
osascript -e 'tell application "Terminal" to do script "cd \"'"$(pwd)"'\" && bash scripts/start-production.sh"'
