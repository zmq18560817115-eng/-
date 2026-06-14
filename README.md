# 膝悦 KneeJoy — Web 原型

React + Vite 前端 + Express 后端。患者/医生/家属全流程、理疗参数与硬件状态均在 Web 端演示；真实设备驱动接口预留于 `src/hardware/`（当前为 mock，后续可接 BLE/Wi-Fi）。

> 微信小程序代码已归档至 `_archive/miniprogram/`，不再作为主线开发。

## 快速启动

**环境：** Node.js 18+

```bash
npm install
bash start-dev.sh
```

- 前端：http://localhost:3000  
- 后端：http://localhost:3001/api/v1/health  

或一键演示（单端口 8080，含构建后静态页）：

```bash
bash scripts/start-production.sh
# 浏览器 http://localhost:8080
```

双击 macOS：`启动演示版(本地).command`

## 演示账号

| 角色 | 手机号 | 密码 |
|------|--------|------|
| 患者 | 18612345678 | pass_pat_1 |
| 医生 | 13800138001 | pass_doc_1 |
| 家属 | 13099990000 | pass_fam_1 |

## 目录结构

```
src/              Web 前端（React）
src/hardware/     硬件连接层（mock → 后续真实驱动）
server/           REST API + JSON 数据库
scripts/          启动与校验脚本
_archive/         已停更的微信小程序代码
```

## 软硬件后续路线

1. **云端部署（免费）**：见 [docs/云端部署与硬件联调指南.md](docs/云端部署与硬件联调指南.md)，Render + Docker 一键部署  
2. **真实硬件**：在 `src/hardware/` 实现 Wi-Fi/BLE 适配器，替换 `mockAdapter.ts`  
3. **设备固件**：ESP32 协议与 `server/routes/patients.ts` 设备 telemetry 对齐  

## 其他命令

```bash
npm run build          # 构建 Web 前端到 dist/
npm run verify:api     # 校验 API 接口
bash scripts/clean-miniprogram-cache.sh   # 清理小程序临时缓存
```

可选：在 `.env.local` 配置 `GEMINI_API_KEY`（AI 相关功能）。
