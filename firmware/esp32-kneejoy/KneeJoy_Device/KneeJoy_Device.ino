/**
 * 膝悦 KneeJoy — ESP32 设备固件（演示版）
 *
 * 功能：
 * 1. 连 Wi-Fi
 * 2. 每 2 秒向云服务器要命令（START / STOP）
 * 3. 收到 START 驱动引脚（推杆/LED），收到 STOP 停止
 * 4. 每 5 秒上报运行状态
 *
 * 使用前：复制 config.example.h 为 config.h 并填写 Wi-Fi
 */

#include <WiFi.h>
#include <WiFiClientSecure.h>
#include "config.h"

// ---------- 运行状态 ----------
bool gRunning = false;
int gLeftForce = 0;
int gRightForce = 0;
int gTemp = 40;
int gVibration = 0;
int gMaxForce = 35;
int gTimeLeftSec = 0;
unsigned long gLastPoll = 0;
unsigned long gLastTelemetry = 0;
unsigned long gLastTick = 0;
int gBattery = 95;

WiFiClientSecure gClient;

// ---------- 工具：串口打印 ----------
void logLine(const String &msg) {
  Serial.println(msg);
}

bool safetyClipOk() {
  // 插紧时开关接 GND → LOW
  return digitalRead(PIN_SAFETY_CLIP) == LOW;
}

void stopActuators() {
  gRunning = false;
  analogWrite(PIN_ACTUATOR_LEFT, 0);
  analogWrite(PIN_ACTUATOR_RIGHT, 0);
  analogWrite(PIN_HEATER, 0);
  analogWrite(PIN_VIBRATION, 0);
  digitalWrite(PIN_STATUS_LED, LOW);
  logLine("[硬件] STOP — 已停止");
}

void startActuators(int leftF, int rightF, int temp, int vib, int maxF, int durationMin) {
  if (!safetyClipOk()) {
    logLine("[安全] 安全夹未插紧，拒绝 START");
    return;
  }
  if (leftF > maxF || rightF > maxF) {
    logLine("[安全] 拉力超限，拒绝 START");
    return;
  }

  gRunning = true;
  gLeftForce = leftF;
  gRightForce = rightF;
  gTemp = temp;
  gVibration = vib;
  gMaxForce = maxF;
  gTimeLeftSec = durationMin * 60;

  // 演示：把「力」映射为 PWM 0~255（真实产品接 motor driver）
  int pwmL = map(constrain(leftF, 0, maxF), 0, maxF, 0, 255);
  int pwmR = map(constrain(rightF, 0, maxF), 0, maxF, 0, 255);
  analogWrite(PIN_ACTUATOR_LEFT, pwmL);
  analogWrite(PIN_ACTUATOR_RIGHT, pwmR);
  analogWrite(PIN_HEATER, map(constrain(temp, 35, 50), 35, 50, 80, 255));
  analogWrite(PIN_VIBRATION, vib * 60);

  digitalWrite(PIN_STATUS_LED, HIGH);

  logLine("[硬件] START L=" + String(leftF) + " R=" + String(rightF) +
          " T=" + String(temp) + " V=" + String(vib));
}

// ---------- 简易 JSON 取值（不依赖 ArduinoJson 库）----------
String jsonGetString(const String &body, const char *key) {
  String pattern = String("\"") + key + "\":\"";
  int i = body.indexOf(pattern);
  if (i < 0) return "";
  i += pattern.length();
  int j = body.indexOf('"', i);
  if (j < 0) return "";
  return body.substring(i, j);
}

int jsonGetInt(const String &body, const char *key, int fallback = 0) {
  String pattern = String("\"") + key + "\":";
  int i = body.indexOf(pattern);
  if (i < 0) return fallback;
  i += pattern.length();
  return body.substring(i).toInt();
}

// ---------- HTTP 请求 ----------
String httpRequest(const char *method, const String &path, const String &body = "") {
  if (!gClient.connect(API_HOST, API_PORT)) {
    logLine("[网络] 连接失败 " + String(API_HOST));
    return "";
  }

  gClient.printf("%s %s HTTP/1.1\r\n", method, path.c_str());
  gClient.printf("Host: %s\r\n", API_HOST);
  gClient.printf("X-Device-Id: %s\r\n", DEVICE_ID);
  gClient.printf("X-Device-Token: %s\r\n", DEVICE_TOKEN);
  gClient.print("Connection: close\r\n");
  if (body.length() > 0) {
    gClient.print("Content-Type: application/json\r\n");
    gClient.printf("Content-Length: %u\r\n", body.length());
  }
  gClient.print("\r\n");
  if (body.length() > 0) {
    gClient.print(body);
  }

  // 跳过 HTTP 头
  String response = "";
  bool headersDone = false;
  unsigned long start = millis();
  while (gClient.connected() && millis() - start < 15000) {
    while (gClient.available()) {
      String line = gClient.readStringUntil('\n');
      if (!headersDone) {
        if (line == "\r") headersDone = true;
      } else {
        response += line;
      }
    }
  }
  gClient.stop();
  return response;
}

void pollCommands() {
  String body = httpRequest("GET", "/api/v1/device/commands");
  if (body.length() == 0) return;

  String cmd = jsonGetString(body, "command");
  if (cmd.length() == 0) cmd = "NONE";

  logLine("[云端] 命令=" + cmd);

  if (cmd == "START") {
    int lf = jsonGetInt(body, "left_force", 15);
    int rf = jsonGetInt(body, "right_force", 15);
    int tp = jsonGetInt(body, "temp", 42);
    int vb = jsonGetInt(body, "vibration", 1);
    int dur = jsonGetInt(body, "duration", 20);
    int mx = jsonGetInt(body, "max_force_limit", 35);
    startActuators(lf, rf, tp, vb, mx, dur);
  } else if (cmd == "STOP") {
    stopActuators();
    gTimeLeftSec = 0;
  } else if (cmd == "SYNC") {
    logLine("[云端] SYNC — 参数已同步，等待 START");
  }
}

void sendTelemetry() {
  String payload = "{";
  payload += "\"is_running\":" + String(gRunning ? "true" : "false") + ",";
  payload += "\"left_force\":" + String(gLeftForce) + ",";
  payload += "\"right_force\":" + String(gRightForce) + ",";
  payload += "\"temp\":" + String(gTemp) + ",";
  payload += "\"vibration\":" + String(gVibration) + ",";
  payload += "\"time_left_seconds\":" + String(gTimeLeftSec) + ",";
  payload += "\"max_force_limit\":" + String(gMaxForce) + ",";
  payload += "\"is_safety_clip_attached\":" + String(safetyClipOk() ? "true" : "false") + ",";
  payload += "\"battery_level\":" + String(gBattery) + ",";
  payload += "\"hardware_status\":\"" + String(safetyClipOk() ? "Normal" : "Error") + "\"";
  payload += "}";

  String resp = httpRequest("POST", "/api/v1/device/telemetry", payload);
  if (resp.indexOf("\"ok\":true") >= 0) {
    logLine("[云端] 状态已上报");
  }
}

void pingCloud() {
  String body = httpRequest("GET", "/api/v1/device/ping");
  if (body.indexOf("\"ok\":true") >= 0) {
    logLine("[云端] Ping 成功，设备通道 OK");
  } else {
    logLine("[云端] Ping 失败，请检查 DEVICE_ID / TOKEN");
  }
}

void setupWiFi() {
  logLine("[Wi-Fi] 正在连接: " + String(WIFI_SSID));
  WiFi.mode(WIFI_STA);
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
  int retry = 0;
  while (WiFi.status() != WL_CONNECTED && retry < 40) {
    delay(500);
    Serial.print(".");
    retry++;
  }
  Serial.println();
  if (WiFi.status() == WL_CONNECTED) {
    logLine("[Wi-Fi] 已连接 IP=" + WiFi.localIP().toString());
  } else {
    logLine("[Wi-Fi] 连接失败，请检查 config.h 里的账号密码");
  }
}

void setup() {
  Serial.begin(115200);
  delay(500);
  logLine("");
  logLine("========================================");
  logLine("  膝悦 KneeJoy ESP32 固件启动");
  logLine("  设备ID: " + String(DEVICE_ID));
  logLine("========================================");

  pinMode(PIN_ACTUATOR_LEFT, OUTPUT);
  pinMode(PIN_ACTUATOR_RIGHT, OUTPUT);
  pinMode(PIN_HEATER, OUTPUT);
  pinMode(PIN_VIBRATION, OUTPUT);
  pinMode(PIN_SAFETY_CLIP, INPUT_PULLUP);
  pinMode(PIN_STATUS_LED, OUTPUT);
  stopActuators();

  // 演示用：跳过 HTTPS 证书校验（毕设可先用；量产应换正式证书）
  gClient.setInsecure();

  setupWiFi();
  if (WiFi.status() == WL_CONNECTED) {
    pingCloud();
  }

  gLastPoll = millis();
  gLastTelemetry = millis();
  gLastTick = millis();
}

void loop() {
  if (WiFi.status() != WL_CONNECTED) {
    logLine("[Wi-Fi] 断开，尝试重连…");
    setupWiFi();
    delay(2000);
    return;
  }

  unsigned long now = millis();

  // 运行倒计时
  if (gRunning && now - gLastTick >= 1000) {
    gLastTick = now;
    if (gTimeLeftSec > 0) {
      gTimeLeftSec--;
    }
    if (gTimeLeftSec <= 0) {
      stopActuators();
    }
    if (!safetyClipOk()) {
      logLine("[安全] 安全夹脱落，紧急停止");
      stopActuators();
    }
  }

  if (now - gLastPoll >= POLL_INTERVAL_MS) {
    gLastPoll = now;
    pollCommands();
  }

  if (now - gLastTelemetry >= TELEMETRY_INTERVAL_MS) {
    gLastTelemetry = now;
    sendTelemetry();
  }
}
