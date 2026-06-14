#include "cloud_client.h"
#include "config.h"
#include <WiFi.h>
#if API_USE_TLS
#include <WiFiClientSecure.h>
static WiFiClientSecure gHttpClient;
#else
#include <WiFiClient.h>
static WiFiClient gHttpClient;
#endif

namespace {

bool connectHttp() {
  return gHttpClient.connect(API_HOST, API_PORT);
}

void stopHttp() {
  gHttpClient.stop();
}

}  // namespace

void CloudClient::begin() {
#if API_USE_TLS
  gHttpClient.setInsecure();
#endif
}

bool CloudClient::ensureWiFi() {
  if (WiFi.status() == WL_CONNECTED) return true;

  Serial.println("[Wi-Fi] 断开，尝试重连…");
  WiFi.mode(WIFI_STA);
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);

  for (int i = 0; i < 40 && WiFi.status() != WL_CONNECTED; i++) {
    delay(500);
    Serial.print(".");
  }
  Serial.println();

  if (WiFi.status() == WL_CONNECTED) {
    Serial.print("[Wi-Fi] 已连接 IP=");
    Serial.println(WiFi.localIP());
    return true;
  }

  Serial.println("[Wi-Fi] 连接失败，请检查 config.h");
  return false;
}

String CloudClient::httpRequest(const char *method, const String &path, const String &body) {
  if (!connectHttp()) {
    Serial.print("[网络] 连接失败 ");
    Serial.print(API_HOST);
    Serial.print(":");
    Serial.println(API_PORT);
    return "";
  }

  gHttpClient.printf("%s %s HTTP/1.1\r\n", method, path.c_str());
  gHttpClient.printf("Host: %s\r\n", API_HOST);
  gHttpClient.printf("X-Device-Id: %s\r\n", DEVICE_ID);
  gHttpClient.printf("X-Device-Token: %s\r\n", DEVICE_TOKEN);
  gHttpClient.print("Connection: close\r\n");
  if (body.length() > 0) {
    gHttpClient.print("Content-Type: application/json\r\n");
    gHttpClient.printf("Content-Length: %u\r\n", body.length());
  }
  gHttpClient.print("\r\n");
  if (body.length() > 0) {
    gHttpClient.print(body);
  }

  String response;
  bool headersDone = false;
  unsigned long start = millis();
  while (gHttpClient.connected() && millis() - start < 15000) {
    while (gHttpClient.available()) {
      String line = gHttpClient.readStringUntil('\n');
      if (!headersDone) {
        if (line == "\r") headersDone = true;
      } else {
        response += line;
      }
    }
  }
  stopHttp();
  return response;
}

String CloudClient::jsonGetString(const String &body, const char *key) {
  String pattern = String("\"") + key + "\":\"";
  int i = body.indexOf(pattern);
  if (i < 0) return "";
  i += pattern.length();
  int j = body.indexOf('"', i);
  if (j < 0) return "";
  return body.substring(i, j);
}

int CloudClient::jsonGetInt(const String &body, const char *key, int fallback) {
  String pattern = String("\"") + key + "\":";
  int i = body.indexOf(pattern);
  if (i < 0) return fallback;
  i += pattern.length();
  return body.substring(i).toInt();
}

TherapyParams CloudClient::paramsFromJson(const String &body) {
  TherapyParams p;
  p.leftForce = jsonGetInt(body, "left_force", 15);
  p.rightForce = jsonGetInt(body, "right_force", 15);
  p.temp = jsonGetInt(body, "temp", 42);
  p.vibration = jsonGetInt(body, "vibration", 1);
  p.durationMin = jsonGetInt(body, "duration", 20);
  p.maxForceLimit = jsonGetInt(body, "max_force_limit", 35);
  return p;
}

bool CloudClient::ping() {
  String body = httpRequest("GET", "/api/v1/device/ping");
  if (body.indexOf("\"ok\":true") >= 0) {
    Serial.println("[云端] Ping 成功，设备通道 OK");
    return true;
  }
  Serial.println("[云端] Ping 失败，请检查 DEVICE_ID / TOKEN / API_HOST");
  return false;
}

bool CloudClient::pollCommand(TherapySession &session) {
  String body = httpRequest("GET", "/api/v1/device/commands");
  if (body.length() == 0) return false;

  String cmd = jsonGetString(body, "command");
  if (cmd.length() == 0) cmd = "NONE";

  Serial.print("[云端] 命令=");
  Serial.println(cmd);

  if (cmd == "START") {
    session.start(paramsFromJson(body));
  } else if (cmd == "STOP") {
    session.stop("云端 STOP");
  } else if (cmd == "SYNC") {
    session.syncParams(paramsFromJson(body));
  }
  return true;
}

bool CloudClient::sendTelemetry(const TherapyTelemetry &t) {
  String payload = "{";
  payload += "\"is_running\":" + String(t.running ? "true" : "false") + ",";
  payload += "\"left_force\":" + String(t.leftForce) + ",";
  payload += "\"right_force\":" + String(t.rightForce) + ",";
  payload += "\"temp\":" + String(t.temp) + ",";
  payload += "\"vibration\":" + String(t.vibration) + ",";
  payload += "\"time_left_seconds\":" + String(t.timeLeftSec) + ",";
  payload += "\"max_force_limit\":" + String(t.maxForceLimit) + ",";
  payload += "\"is_safety_clip_attached\":" + String(t.safetyClipAttached ? "true" : "false") + ",";
  payload += "\"battery_level\":" + String(t.batteryLevel) + ",";
  payload += "\"hardware_status\":\"" + String(t.hardwareStatus) + "\"";
  payload += "}";

  String resp = httpRequest("POST", "/api/v1/device/telemetry", payload);
  if (resp.indexOf("\"ok\":true") >= 0) {
    Serial.println("[云端] 状态已上报");
    return true;
  }
  return false;
}
