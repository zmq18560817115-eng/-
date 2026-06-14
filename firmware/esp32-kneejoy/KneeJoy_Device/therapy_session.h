#ifndef KNEEJOY_THERAPY_SESSION_H
#define KNEEJOY_THERAPY_SESSION_H

#include <Arduino.h>
#include "actuator.h"
#include "heater.h"
#include "safety.h"
#include "vibration.h"

struct TherapyParams {
  int leftForce = 15;
  int rightForce = 15;
  int temp = 42;
  int vibration = 1;
  int durationMin = 20;
  int maxForceLimit = 35;
};

struct TherapyTelemetry {
  bool running = false;
  int leftForce = 0;
  int rightForce = 0;
  int temp = 0;
  int vibration = 0;
  int timeLeftSec = 0;
  int maxForceLimit = 35;
  bool safetyClipAttached = true;
  int batteryLevel = 95;
  const char *hardwareStatus = "Normal";
};

// 统一调度推杆 + 加热 + 震动，对齐 Web UI 的 START/STOP/SYNC
class TherapySession {
 public:
  void begin(ActuatorDriver *actuator, HeaterDriver *heater, VibrationDriver *vibration,
             SafetyMonitor *safety);

  bool start(const TherapyParams &params);
  void syncParams(const TherapyParams &params);
  void stop(const char *reason = "手动停止");

  void tick(unsigned long nowMs);
  TherapyTelemetry telemetry() const;
  bool isRunning() const;

 private:
  ActuatorDriver *_actuator = nullptr;
  HeaterDriver *_heater = nullptr;
  VibrationDriver *_vibration = nullptr;
  SafetyMonitor *_safety = nullptr;

  TherapyParams _params;
  bool _running = false;
  int _timeLeftSec = 0;
  unsigned long _lastSecondTick = 0;
  const char *_stopReason = nullptr;

  void applyOutputs();
  void haltOutputs();
};

#endif
