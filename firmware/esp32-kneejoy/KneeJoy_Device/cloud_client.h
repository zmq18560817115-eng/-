#ifndef KNEEJOY_CLOUD_CLIENT_H
#define KNEEJOY_CLOUD_CLIENT_H

#include <Arduino.h>
#include "therapy_session.h"

class CloudClient {
 public:
  void begin();
  bool ensureWiFi();
  bool ping();
  bool pollCommand(TherapySession &session);
  bool sendTelemetry(const TherapyTelemetry &t);

 private:
  String httpRequest(const char *method, const String &path, const String &body = "");
  static String jsonGetString(const String &body, const char *key);
  static int jsonGetInt(const String &body, const char *key, int fallback = 0);
  static TherapyParams paramsFromJson(const String &body);
};

#endif
