# ESP32 固件 — 超详细小白步骤

> 文件夹：`firmware/esp32-kneejoy/`  
> 云端 API 已就绪：`/api/v1/device/commands` 和 `/api/v1/device/telemetry`

---

## 第 0 步：你要准备什么


| 物品          | 说明                      |
| ----------- | ----------------------- |
| ESP32 开发板   | 带 Wi-Fi，常见 ESP32-DevKit |
| USB 数据线     | 能传数据（不是只能充电的线）          |
| 电脑          | Mac / Windows 都行        |
| Arduino IDE | 免费软件，后面会教安装             |
| 路由器 Wi-Fi   | ESP32 要能上网              |


**演示设备账号（已写在云端）：**

```
设备 ID：  KJ-DEMO-001
设备密钥： kneejoy-demo-token-2026
绑定患者：18612345678 / pass_pat_1（王大爷）
```

---

## 第 1 步：安装 Arduino IDE（10 分钟）

1. 打开 [https://www.arduino.cc/en/software](https://www.arduino.cc/en/software) 下载安装
2. 打开 Arduino IDE
3. 菜单 **Arduino IDE → Settings → Additional boards manager URLs**
4. 粘贴：`https://espressif.github.io/arduino-esp32/package_esp32_index.json`
5. **Tools → Board → Boards Manager**，搜索 **esp32**，安装 **esp32 by Espressif**
6. **Tools → Board → ESP32 Arduino → ESP32 Dev Module**

---

## 第 2 步：打开我们的代码（5 分钟）

1. 在 Arduino IDE：**File → Open**
2. 选项目里的文件：
  `firmware/esp32-kneejoy/KneeJoy_Device/KneeJoy_Device.ino`
3. 把同目录上一级的 `config.example.h` **复制一份**，改名为 `**config.h`**
  （和 .ino 同目录，或放在 `KneeJoy_Device/` 里 — 与 .ino 同文件夹即可）
4. 用记事本打开 `config.h`，只改这两行：

```cpp
#define WIFI_SSID "你家的WiFi名字"
#define WIFI_PASSWORD "你家的WiFi密码"
```

其他先别动。

---

## 第 3 步：接线（面包板演示，15 分钟）

默认引脚（可在 config.h 改）：


| ESP32 引脚 | 接什么               | 说明                  |
| -------- | ----------------- | ------------------- |
| GPIO 25  | 推杆驱动 IN1 或 LED+电阻 | 左侧拉力                |
| GPIO 26  | 推杆驱动 IN2 或 LED+电阻 | 右侧拉力                |
| GPIO 27  | LED 或加热模块         | 加热演示                |
| GPIO 14  | LED 或震动模块         | 震动演示                |
| GPIO 34  | 安全夹开关一端           | 另一端接 **GND**；插紧=LOW |
| GPIO 2   | 板载蓝灯              | 运行时会亮               |


**没有推杆时**：只接 2 个 LED 也能演示「START 灯亮、STOP 灯灭」。

---

## 第 4 步：上传程序（5 分钟）

1. USB 连接 ESP32 和电脑
2. **Tools → Port** 选 `/dev/cu.usbserial-xxx`（Mac）或 COM 口（Windows）
3. 点击 **→ 上传**（箭头按钮）
4. 等底部显示 **Done uploading**

---

## 第 5 步：看串口是否成功（最重要）

1. **Tools → Serial Monitor**
2. 右下角选 **115200 baud**
3. 按一下 ESP32 的 **RST** 复位键

**成功时应看到：**

```
========================================
  膝悦 KneeJoy ESP32 固件启动
  设备ID: KJ-DEMO-001
========================================
[Wi-Fi] 已连接 IP=192.168.x.x
[云端] Ping 成功，设备通道 OK
[云端] 状态已上报
```

如果 Ping 失败：检查 `DEVICE_ID` / `DEVICE_TOKEN` 是否和上面一致。

如果 Wi-Fi 失败：检查 config.h 里的名字密码。

---

## 第 6 步：手机和云联动（完整演示）

### 6.1 确保云端最新代码已部署

后端加了设备 API，需要 push 到 GitHub，等 Render 部署 Live。

### 6.2 操作顺序

1. **ESP32 上电**，串口看到 Ping 成功
2. 手机浏览器打开 **[https://kneejoy.onrender.com](https://kneejoy.onrender.com)**
3. 登录 **18612345678 / pass_pat_1**
4. 在「康复设置」里点 **Wi-Fi 连接**（告诉云：要用 Wi-Fi 设备）
5. 回到「智能康复」，点 **开始理疗**
6. **串口应出现：** `[云端] 命令=START` → `[硬件] START ...`
7. 点 **停止** → 串口 `命令=STOP` → 灯灭/推杆停

---

## 常见问题

### Q：串口一直「连接失败 kneejoy.onrender.com」

- 等 30 秒再试（Render 免费版可能在睡觉）  
- 手机浏览器先打开 health 页面唤醒

### Q：命令一直是 NONE

- 网页要先点 **Wi-Fi 连接**  
- 要点 **开始理疗**（不是只改参数）  
- 患者必须是 **王大爷**（设备绑在 2001 账号）

### Q：START 但硬件不动

- 看串口是否「安全夹未插紧」→ 把 GPIO34 接 GND  
- 检查推杆/LED 接线

---

## 文件说明


| 文件                   | 作用                            |
| -------------------- | ----------------------------- |
| `KneeJoy_Device.ino` | 主程序                           |
| `config.h`           | 你的 Wi-Fi 和引脚（自己创建，勿上传 GitHub） |
| `config.example.h`   | 配置模板                          |


---

## 下一步（真实推杆）

1. 把 GPIO25/26 接到 **L298N / 继电器模块** 再接推杆
2. 把 `map(...)` PWM 改成你的 driver 逻辑
3. 安全夹、急停按钮必须接在 ESP32 上，不能只在网页判断

---

**一句话：** 上传固件 → 串口 Ping 成功 → 手机点开始 → 串口出现 START → 推杆/LED 动。