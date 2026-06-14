/**
 * 膝悦 KneeJoy — ESP32 全功能固件 v2.1.0
 *
 * 硬件模块：actuator(推杆) + heater(加热) + vibration(震动)
 * 配置：config.h（交付见项目根目录 交付说明.md）
 */

#include <WiFi.h>
#include <cstring>
#include "config.h"
#include "actuator.h"
#include "cloud_client.h"
#include "heater.h"
#include "safety.h"
#include "serial_cmd.h"
#include "therapy_session.h"
#include "vibration.h"

ActuatorDriver gActuator;
HeaterDriver gHeater;
VibrationDriver gVibration;
SafetyMonitor gSafety;
TherapySession gSession;
CloudClient gCloud;
SerialCommandParser gSerialCmd;

unsigned long gLastPoll = 0;
unsigned long gLastTelemetry = 0;
uint8_t gWifiFailStreak = 0;

bool configLooksValid() {
  if (strlen(WIFI_SSID) == 0 || strcmp(WIFI_SSID, "你的WiFi名称") == 0 ||
      strcmp(WIFI_SSID, "请修改为你的WiFi名称") == 0) {
    Serial.println("[配置] 警告：WIFI_SSID 未修改，请在 config.h 填写");
    return false;
  }
  if (strlen(WIFI_PASSWORD) == 0 || strcmp(WIFI_PASSWORD, "你的WiFi密码") == 0 ||
      strcmp(WIFI_PASSWORD, "请修改为你的WiFi密码") == 0) {
    Serial.println("[配置] 警告：WIFI_PASSWORD 未修改，请在 config.h 填写");
    return false;
  }
  if (strlen(DEVICE_ID) == 0 || strlen(DEVICE_TOKEN) == 0) {
    Serial.println("[配置] 错误：DEVICE_ID / DEVICE_TOKEN 不能为空");
    return false;
  }
  return true;
}

void runBootSelfTest() {
  Serial.println("[自检] 模块输出短脉冲测试…");
  gActuator.setLeftForce(10, 35);
  gActuator.setRightForce(10, 35);
  gHeater.setTemperature(40);
  gVibration.setLevel(1);
  delay(400);
  gActuator.stopAll();
  gHeater.stop();
  gVibration.stop();
  Serial.println("[自检] 完成");
}

void printBanner() {
  Serial.println();
  Serial.println("========================================");
  Serial.print("  膝悦 KneeJoy ESP32 v");
  Serial.println(FIRMWARE_VERSION);
  Serial.print("  设备ID: ");
  Serial.println(DEVICE_ID);
  Serial.print("  API: ");
#if API_USE_TLS
  Serial.print("https://");
#else
  Serial.print("http://");
#endif
  Serial.print(API_HOST);
  Serial.print(":");
  Serial.println(API_PORT);
#if HARDWARE_PROFILE == PROFILE_DEMO_LED
  Serial.println("  硬件: DEMO_LED");
#else
  Serial.println("  硬件: L298N");
#endif
  Serial.println("  串口: @STxCMD / @STxSTOP / STATUS");
  Serial.println("========================================");
}

void setup() {
  Serial.begin(115200);
  delay(500);
  printBanner();
  configLooksValid();

  pinMode(PIN_STATUS_LED, OUTPUT);
  digitalWrite(PIN_STATUS_LED, LOW);

  gActuator.begin();
  gHeater.begin();
  gVibration.begin();
  gSafety.begin();
  gSession.begin(&gActuator, &gHeater, &gVibration, &gSafety);
  gCloud.begin();
  gSerialCmd.begin();

#if ENABLE_BOOT_SELF_TEST
  runBootSelfTest();
#endif

  if (gCloud.ensureWiFi()) {
    gCloud.ping();
    gWifiFailStreak = 0;
  } else {
    gWifiFailStreak++;
  }

  gLastPoll = millis();
  gLastTelemetry = millis();
}

void loop() {
  unsigned long now = millis();

  gSerialCmd.poll(gSession);
  gSession.tick(now);

  if (!gCloud.ensureWiFi()) {
    gWifiFailStreak++;
    if (gWifiFailStreak % 5 == 1) {
      Serial.println("[Wi-Fi] 未连接，2 秒后重试（串口命令仍可用）");
    }
    delay(2000);
    return;
  }
  gWifiFailStreak = 0;

  if (now - gLastPoll >= POLL_INTERVAL_MS) {
    gLastPoll = now;
    gCloud.pollCommand(gSession);
  }

  if (now - gLastTelemetry >= TELEMETRY_INTERVAL_MS) {
    gLastTelemetry = now;
    gCloud.sendTelemetry(gSession.telemetry());
  }
}
