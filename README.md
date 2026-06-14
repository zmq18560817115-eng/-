# 膝悦 KneeJoy

ESP32 硬件 + Web UI + 本地 API。  
**专业人员请阅读：[交付说明.md](交付说明.md)**

## 三个硬件运行代码


| 模块  | 文件                                                    |
| --- | ----------------------------------------------------- |
| 推杆  | `firmware/esp32-kneejoy/KneeJoy_Device/actuator.cpp`  |
| 加热  | `firmware/esp32-kneejoy/KneeJoy_Device/heater.cpp`    |
| 震动  | `firmware/esp32-kneejoy/KneeJoy_Device/vibration.cpp` |


调度：`therapy_session.cpp` · 入口：`KneeJoy_Device.ino`

## 快速启动

```bash
npm install
bash start-dev.sh
```

- 前端 [http://localhost:3000](http://localhost:3000)
- API [http://localhost:3001/api/v1/health](http://localhost:3001/api/v1/health)

## ESP32 配置（三步）

`config.h` 已默认连接云服务器 **kneejoy.onrender.com**（无需开电脑）。

```bash
# 1. 编辑固件目录下的 config.h，只填 Wi-Fi 名称和密码
#    firmware/esp32-kneejoy/KneeJoy_Device/config.h

# 2. Arduino IDE 打开 KneeJoy_Device.ino 上传

# 3. 手机打开 https://kneejoy.onrender.com 联调
```

本地联调时把 `config.h` 改为电脑 IP + `API_PORT 3001` + `API_USE_TLS 0`，或运行 `bash scripts/setup-esp32-config.sh`。

## 串口快速测试（115200）

安全夹 GPIO34 接 GND 后发送：

```
@STxCMD: L_F=15,R_F=15,TEMP=42,VIB=1
@STxSTOP
```

## 演示账号


| 角色  | 手机号         | 密码         |
| --- | ----------- | ---------- |
| 患者  | 18612345678 | pass_pat_1 |


## 常用命令

```bash
npm run server
npm run verify:api
bash scripts/start-production.sh
```

