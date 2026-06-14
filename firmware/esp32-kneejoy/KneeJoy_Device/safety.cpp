#include "safety.h"

void SafetyMonitor::begin() {
  pinMode(PIN_SAFETY_CLIP, INPUT_PULLUP);
  pinMode(PIN_EMERGENCY_STOP, INPUT_PULLUP);
}

bool SafetyMonitor::clipAttached() const {
  return digitalRead(PIN_SAFETY_CLIP) == LOW;
}

bool SafetyMonitor::emergencyPressed() const {
  return digitalRead(PIN_EMERGENCY_STOP) == EMERGENCY_STOP_ACTIVE;
}

bool SafetyMonitor::canStart(int leftForce, int rightForce, int maxForce) const {
  if (!clipAttached()) {
    _blockReason = "安全夹未插紧";
    return false;
  }
  if (emergencyPressed()) {
    _blockReason = "急停按钮已按下";
    return false;
  }
  if (leftForce > maxForce || rightForce > maxForce) {
    _blockReason = "拉力超过安全上限";
    return false;
  }
  if (leftForce < FORCE_MIN_N || rightForce < FORCE_MIN_N) {
    _blockReason = "拉力低于有效范围";
    return false;
  }
  _blockReason = nullptr;
  return true;
}

const char *SafetyMonitor::startBlockReason() const {
  return _blockReason;
}
