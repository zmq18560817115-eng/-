#include "therapy_session.h"
#include <cstring>

void TherapySession::begin(ActuatorDriver *actuator, HeaterDriver *heater, VibrationDriver *vibration,
                           SafetyMonitor *safety) {
  _actuator = actuator;
  _heater = heater;
  _vibration = vibration;
  _safety = safety;
  _running = false;
  _timeLeftSec = 0;
  haltOutputs();
}

bool TherapySession::start(const TherapyParams &params) {
  _params = params;
  _params.leftForce = constrain(_params.leftForce, 0, _params.maxForceLimit);
  _params.rightForce = constrain(_params.rightForce, 0, _params.maxForceLimit);
  _params.temp = constrain(_params.temp, 0, TEMP_MAX_C);
  _params.vibration = constrain(_params.vibration, 0, VIBRATION_MAX_LEVEL);

  if (!_safety->canStart(_params.leftForce, _params.rightForce, _params.maxForceLimit)) {
    Serial.print("[安全] 拒绝 START：");
    Serial.println(_safety->startBlockReason());
    return false;
  }

  _running = true;
  _timeLeftSec = _params.durationMin * 60;
  _lastSecondTick = millis();
  _stopReason = nullptr;
  applyOutputs();
  digitalWrite(PIN_STATUS_LED, HIGH);

  Serial.print("[理疗] START L=");
  Serial.print(_params.leftForce);
  Serial.print("N R=");
  Serial.print(_params.rightForce);
  Serial.print("N T=");
  Serial.print(_params.temp);
  Serial.print("C V=");
  Serial.print(_params.vibration);
  Serial.print(" 时长=");
  Serial.print(_params.durationMin);
  Serial.println("min");
  return true;
}

void TherapySession::syncParams(const TherapyParams &params) {
  _params = params;
  _params.leftForce = constrain(_params.leftForce, 0, _params.maxForceLimit);
  _params.rightForce = constrain(_params.rightForce, 0, _params.maxForceLimit);
  _params.temp = constrain(_params.temp, 0, TEMP_MAX_C);
  _params.vibration = constrain(_params.vibration, 0, VIBRATION_MAX_LEVEL);
  _timeLeftSec = _params.durationMin * 60;

  Serial.println("[理疗] SYNC — 参数已同步，等待 START");
  if (_running) {
    applyOutputs();
  }
}

void TherapySession::stop(const char *reason) {
  if (_running) {
    Serial.print("[理疗] STOP — ");
    Serial.println(reason);
  }
  _running = false;
  _timeLeftSec = 0;
  _stopReason = reason;
  haltOutputs();
}

void TherapySession::applyOutputs() {
  _actuator->setLeftForce(_params.leftForce, _params.maxForceLimit);
  _actuator->setRightForce(_params.rightForce, _params.maxForceLimit);
  _heater->setTemperature(_params.temp);
  _vibration->setLevel(_params.vibration);
}

void TherapySession::haltOutputs() {
  _actuator->stopAll();
  _heater->stop();
  _vibration->stop();
  digitalWrite(PIN_STATUS_LED, LOW);
}

void TherapySession::tick(unsigned long nowMs) {
  if (!_running) return;

  if (!_safety->clipAttached()) {
    stop("安全夹脱落");
    return;
  }
  if (_safety->emergencyPressed()) {
    stop("急停触发");
    return;
  }

  if (nowMs - _lastSecondTick >= 1000) {
    _lastSecondTick = nowMs;
    if (_timeLeftSec > 0) {
      _timeLeftSec--;
    }
    if (_timeLeftSec <= 0) {
      stop("理疗时长结束");
    }
  }
}

TherapyTelemetry TherapySession::telemetry() const {
  TherapyTelemetry t;
  t.running = _running;
  t.leftForce = _running ? _params.leftForce : 0;
  t.rightForce = _running ? _params.rightForce : 0;
  t.temp = _heater->currentTemperature();
  t.vibration = _vibration->currentLevel();
  t.timeLeftSec = _timeLeftSec;
  t.maxForceLimit = _params.maxForceLimit;
  t.safetyClipAttached = _safety->clipAttached();
  t.batteryLevel = 95; // 无 ADC 时固定演示值；后续可接分压到 ADC 引脚
  if (!t.safetyClipAttached ||
      (_stopReason != nullptr && strstr(_stopReason, "急停") != nullptr)) {
    t.hardwareStatus = "Error";
  } else {
    t.hardwareStatus = "Normal";
  }
  return t;
}

bool TherapySession::isRunning() const {
  return _running;
}
