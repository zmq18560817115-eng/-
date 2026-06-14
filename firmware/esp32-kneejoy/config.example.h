/**
 * 复制本文件为 config.h 并填写你的 Wi-Fi 与设备信息
 * （config.h 已在 .gitignore，不会上传到 GitHub）
 */
#ifndef KNEEJOY_CONFIG_H
#define KNEEJOY_CONFIG_H

// ===== 1. Wi-Fi（填你实验室/家里的路由器）=====
#define WIFI_SSID "你的WiFi名称"
#define WIFI_PASSWORD "你的WiFi密码"

// ===== 2. 云服务器（一般不用改）=====
#define API_HOST "kneejoy.onrender.com"
#define API_PORT 443

// ===== 3. 设备身份（与云端 seed 一致，演示机默认如下）=====
// 绑定患者 18612345678 / pass_pat_1（王大爷）
#define DEVICE_ID "KJ-DEMO-001"
#define DEVICE_TOKEN "kneejoy-demo-token-2026"

// ===== 4. 引脚（按你的面包板接线修改）=====
// 推杆/电机方向 A（或用 LED 模拟）
#define PIN_ACTUATOR_LEFT 25
#define PIN_ACTUATOR_RIGHT 26
// 加热（演示可用 LED）
#define PIN_HEATER 27
// 震动（演示可用 LED）
#define PIN_VIBRATION 14
// 安全夹：插紧时接地 LOW（INPUT_PULLUP）
#define PIN_SAFETY_CLIP 34
// 板载状态灯
#define PIN_STATUS_LED 2

// 轮询间隔（毫秒）
#define POLL_INTERVAL_MS 2000
#define TELEMETRY_INTERVAL_MS 5000

#endif
