# ESP32 固件 — 推杆 + 加热 + 震动

> 路径：`firmware/esp32-kneejoy/KneeJoy_Device/`  
> 专业人员交付文档：**[交付说明.md](../../交付说明.md)**

---

## 架构（与 Web UI 对齐）

```
手机 Web UI 点「开始理疗」
        ↓ HTTPS
云服务器写入 START { left_force, right_force, temp, vibration, duration }
        ↓ Wi-Fi 每 2 秒轮询
ESP32 cloud_client
        ↓
TherapySession 统一调度
   ├─ ActuatorDriver   左右推杆（拉力 N → PWM / L298N H桥）
   ├─ HeaterDriver     加热（temp ℃ → PWM）
   └─ VibrationDriver  震动（0~3 档 → PWM）
        ↑
SafetyMonitor（安全夹 GPIO34 + 急停 GPIO35）
```

| UI 参数 | 固件模块 | 物理含义 |
|---------|----------|----------|
| `left_force` / `right_force` | `actuator.cpp` | 推杆伸出速度/力度 |
| `temp` | `heater.cpp` | 加热 PWM（35~50℃ 映射） |
| `vibration` | `vibration.cpp` | 震动档位 0~3 |
| `duration` | `therapy_session.cpp` | 倒计时，到 0 自动 STOP |
| 安全夹 | `safety.cpp` | 未插紧拒绝 START，运行中脱落紧急停 |

---

## 文件说明

| 文件 | 作用 |
|------|------|
| `KneeJoy_Device.ino` | 主程序：初始化 + 主循环 |
| `actuator.cpp` | 推杆驱动（移植 STM32 motor.c 正/停逻辑） |
| `heater.cpp` | 加热驱动 |
| `vibration.cpp` | 震动驱动 |
| `therapy_session.cpp` | START/STOP/SYNC + 倒计时 |
| `safety.cpp` | 安全夹、急停、拉力校验 |
| `cloud_client.cpp` | Wi-Fi + 云端轮询/上报 |
| `serial_cmd.cpp` | 串口本地调试（无需云端） |
| `config.h` | Wi-Fi、引脚、硬件模式（自己创建） |

---

## 第 1 步：安装 Arduino IDE

1. 下载 [Arduino IDE](https://www.arduino.cc/en/software)
2. **Settings → Additional boards manager URLs** 添加：  
   `https://espressif.github.io/arduino-esp32/package_esp32_index.json`
3. **Boards Manager** 安装 **esp32 by Espressif**
4. **Tools → Board → ESP32 Dev Module**

---

## 第 2 步：配置并上传

1. 打开 `KneeJoy_Device/KneeJoy_Device.ino`
2. 复制 `config.example.h` → `config.h`（同目录）
3. 修改 `config.h` 里的 Wi-Fi 名称和密码
4. USB 连接 ESP32，**Tools → Port** 选择串口
5. 点击上传

---

## 第 3 步：接线

### 模式 A — DEMO_LED（默认，无推杆也能演示）

在 `config.h` 中保持：
```cpp
#define HARDWARE_PROFILE PROFILE_DEMO_LED
```

| ESP32 引脚 | 接什么 |
|------------|--------|
| GPIO 25 | LED + 220Ω（左推杆模拟） |
| GPIO 26 | LED + 220Ω（右推杆模拟） |
| GPIO 27 | LED + 220Ω（加热模拟） |
| GPIO 14 | LED + 220Ω（震动模拟） |
| GPIO 34 | 安全夹开关 → GND（插紧=LOW） |
| GPIO 2 | 板载蓝灯（运行亮） |

### 模式 B — L298N 真实推杆

```cpp
#define HARDWARE_PROFILE PROFILE_L298N
```

| ESP32 | L298N |
|-------|-------|
| GPIO 25 (ENA) | 左电机 EN |
| GPIO 32/33 (IN1/IN2) | 左电机方向 |
| GPIO 26 (ENB) | 右电机 EN |
| GPIO 27/14 (IN3/IN4) | 右电机方向 |
| GPIO 18 | 加热 MOSFET 门极 |
| GPIO 19 | 震动 MOSFET 门极 |

**注意：** 加热片、震动马达、推杆电机必须经驱动模块，勿 GPIO 直连。

---

## 第 4 步：本地测试（不连云）

1. 打开串口监视器 **115200**
2. 安全夹 GPIO34 接 GND
3. 发送：

```
@STxCMD: L_F=15,R_F=15,TEMP=42,VIB=1,DUR=1
```

应看到四个 LED/模块同时工作，1 分钟后自动停。

停止：
```
@STxSTOP
```

---

## 第 5 步：与手机 UI 联调（本地）

1. 电脑运行 `bash start-dev.sh`（API 在 3001 端口）
2. `config.h` 里把 `API_HOST` 改为你电脑局域网 IP（如 `192.168.1.100`），`API_PORT` 改 `3001`
3. ESP32 上电，串口出现 `[云端] Ping 成功`
4. 手机浏览器打开 `http://你的电脑IP:3000`
5. 登录 **18612345678 / pass_pat_1**
6. 设置页点 **Wi-Fi 连接** → 康复页点 **开始理疗**
7. 串口应出现：`[云端] 命令=START` → `[理疗] START L=15N ...`

---

## 常见问题

| 现象 | 处理 |
|------|------|
| 拒绝 START：安全夹未插紧 | GPIO34 接 GND |
| 命令一直是 NONE | 网页先 Wi-Fi 连接，再点开始理疗 |
| Ping 失败 | 检查 DEVICE_ID / TOKEN；确认 API_HOST 为电脑 IP 且 server 已启动 |
| 推杆不动但 LED 亮 | 改 `PROFILE_L298N` 并检查 L298N 接线/供电 |

---

## 从 STM32 迁移了什么

| STM32 原功能 | ESP32 对应 |
|--------------|------------|
| `Motor1_CW` / `Motor2_CW` 推杆伸出 | `ActuatorDriver::setLeft/RightForce` |
| `Motor_Stop` 停止 | `ActuatorDriver::stopAll` |
| 超重 >7kg 停推杆 | 暂无 HX711；可后续加 ADC/传感器模块 |
| 按键控制 | 改为云端/串口 `@STxCMD` 控制 |
| LCD 显示 | 改为串口日志 + 手机 UI 显示 |

---

**一句话：** 上传 v2 固件 → 串口 `@STxCMD` 本地三模块能动 → Ping 成功 → 手机点开始 → 推杆+加热+震动联动。
