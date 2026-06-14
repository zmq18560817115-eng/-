/**
 * 复制本文件为 config.h 并填写你的 Wi-Fi 与设备信息
 * （config.h 已在 .gitignore，不会上传到 GitHub）
 */
#ifndef KNEEJOY_CONFIG_H
#define KNEEJOY_CONFIG_H

// ===== 1. Wi-Fi =====
#define WIFI_SSID "你的WiFi名称"
#define WIFI_PASSWORD "你的WiFi密码"

// ===== 2. API 服务器 =====
// 【云部署·推荐】不依赖电脑，手机打开 https://kneejoy.onrender.com
#define API_HOST "kneejoy.onrender.com"
#define API_PORT 443
#define API_USE_TLS 1

// 【本地联调】改用电脑局域网 IP，并设 API_USE_TLS 0、API_PORT 3001
// #define API_HOST "192.168.1.100"
// #define API_PORT 3001
// #define API_USE_TLS 0

// ===== 3. 设备身份（与云端 seed 一致）=====
// 绑定患者 18612345678 / pass_pat_1（王大爷）
#define DEVICE_ID "KJ-DEMO-001"
#define DEVICE_TOKEN "kneejoy-demo-token-2026"

// ===== 4. 硬件接线模式 =====
// PROFILE_DEMO_LED  — 每路一个 GPIO+PWM，接 LED 即可演示（默认）
// PROFILE_L298N     — L298N 双 H 桥，每路电机 IN1+IN2+ENA，适合真实推杆
#define HARDWARE_PROFILE PROFILE_DEMO_LED

#define PROFILE_DEMO_LED 1
#define PROFILE_L298N 2

#if HARDWARE_PROFILE == PROFILE_DEMO_LED
// 单引脚 PWM 演示（无推杆时接 LED+220Ω 电阻）
#define PIN_ACTUATOR_LEFT 25
#define PIN_ACTUATOR_RIGHT 26
#define PIN_HEATER 27
#define PIN_VIBRATION 14

#elif HARDWARE_PROFILE == PROFILE_L298N
// 左推杆：ENA=PWM 调速，IN1/IN2 控制方向（伸出=正转）
#define PIN_LEFT_ENA 25
#define PIN_LEFT_IN1 32
#define PIN_LEFT_IN2 33
// 右推杆
#define PIN_RIGHT_ENB 26
#define PIN_RIGHT_IN3 27
#define PIN_RIGHT_IN4 14
// 加热 / 震动（MOSFET 驱动，勿直连大电流负载）
#define PIN_HEATER 18
#define PIN_VIBRATION 19
#endif

// 安全夹：插紧时接 GND → 读 LOW；未插为 HIGH
#define PIN_SAFETY_CLIP 34
// 急停按钮（可选）：按下接 GND → LOW 时立刻全停；不用则接 3.3V 或悬空
#define PIN_EMERGENCY_STOP 35
#define EMERGENCY_STOP_ACTIVE LOW

// 板载状态灯（运行中亮）
#define PIN_STATUS_LED 2

// ===== 5. 理疗参数范围（与 Web UI 一致）=====
#define FORCE_MIN_N 5
#define FORCE_MAX_N 35
#define TEMP_MIN_C 35
#define TEMP_MAX_C 50
#define VIBRATION_MAX_LEVEL 3
#define ACTUATOR_PWM_MIN 80 // 推杆最低有效 PWM（避免电机不转）

// ===== 6. 通信间隔（毫秒）=====
#define POLL_INTERVAL_MS 2000
#define TELEMETRY_INTERVAL_MS 5000

#define FIRMWARE_VERSION "2.1.0"
// 上电自检：1=各模块短脉冲（接线验证）；量产设为 0
#define ENABLE_BOOT_SELF_TEST 0

#endif
