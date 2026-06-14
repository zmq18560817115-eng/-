#ifndef KNEEJOY_ACTUATOR_H
#define KNEEJOY_ACTUATOR_H

#include <Arduino.h>

// 推杆驱动：移植自 STM32 motor.c 的 CW/CCW/Stop 逻辑
class ActuatorDriver {
 public:
  void begin();
  void setLeftForce(int forceN, int maxForceN);
  void setRightForce(int forceN, int maxForceN);
  void stopAll();

 private:
  void driveDemoPwm(uint8_t pin, int forceN, int maxForceN);
  void driveHBridge(uint8_t ena, uint8_t in1, uint8_t in2, int forceN, int maxForceN);
  void stopHBridge(uint8_t ena, uint8_t in1, uint8_t in2);
  int forceToPwm(int forceN, int maxForceN) const;
};

#endif
