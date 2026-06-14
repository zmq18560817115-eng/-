#include "actuator.h"
#include "config.h"

void ActuatorDriver::begin() {
#if HARDWARE_PROFILE == PROFILE_DEMO_LED
  pinMode(PIN_ACTUATOR_LEFT, OUTPUT);
  pinMode(PIN_ACTUATOR_RIGHT, OUTPUT);
#elif HARDWARE_PROFILE == PROFILE_L298N
  pinMode(PIN_LEFT_ENA, OUTPUT);
  pinMode(PIN_LEFT_IN1, OUTPUT);
  pinMode(PIN_LEFT_IN2, OUTPUT);
  pinMode(PIN_RIGHT_ENB, OUTPUT);
  pinMode(PIN_RIGHT_IN3, OUTPUT);
  pinMode(PIN_RIGHT_IN4, OUTPUT);
#endif
  stopAll();
}

int ActuatorDriver::forceToPwm(int forceN, int maxForceN) const {
  int clampedForce = constrain(forceN, 0, maxForceN);
  if (clampedForce == 0) return 0;
  return map(clampedForce, 0, maxForceN, ACTUATOR_PWM_MIN, 255);
}

void ActuatorDriver::driveDemoPwm(uint8_t pin, int forceN, int maxForceN) {
  analogWrite(pin, forceToPwm(forceN, maxForceN));
}

// 对应 STM32 Motor_CW：IN1=HIGH IN2=LOW，ENA 调速
void ActuatorDriver::driveHBridge(uint8_t ena, uint8_t in1, uint8_t in2, int forceN, int maxForceN) {
  int pwm = forceToPwm(forceN, maxForceN);
  if (pwm == 0) {
    stopHBridge(ena, in1, in2);
    return;
  }
  digitalWrite(in1, HIGH);
  digitalWrite(in2, LOW);
  analogWrite(ena, pwm);
}

void ActuatorDriver::stopHBridge(uint8_t ena, uint8_t in1, uint8_t in2) {
  analogWrite(ena, 0);
  digitalWrite(in1, LOW);
  digitalWrite(in2, LOW);
}

void ActuatorDriver::setLeftForce(int forceN, int maxForceN) {
#if HARDWARE_PROFILE == PROFILE_DEMO_LED
  driveDemoPwm(PIN_ACTUATOR_LEFT, forceN, maxForceN);
#elif HARDWARE_PROFILE == PROFILE_L298N
  driveHBridge(PIN_LEFT_ENA, PIN_LEFT_IN1, PIN_LEFT_IN2, forceN, maxForceN);
#endif
}

void ActuatorDriver::setRightForce(int forceN, int maxForceN) {
#if HARDWARE_PROFILE == PROFILE_DEMO_LED
  driveDemoPwm(PIN_ACTUATOR_RIGHT, forceN, maxForceN);
#elif HARDWARE_PROFILE == PROFILE_L298N
  driveHBridge(PIN_RIGHT_ENB, PIN_RIGHT_IN3, PIN_RIGHT_IN4, forceN, maxForceN);
#endif
}

void ActuatorDriver::stopAll() {
#if HARDWARE_PROFILE == PROFILE_DEMO_LED
  analogWrite(PIN_ACTUATOR_LEFT, 0);
  analogWrite(PIN_ACTUATOR_RIGHT, 0);
#elif HARDWARE_PROFILE == PROFILE_L298N
  stopHBridge(PIN_LEFT_ENA, PIN_LEFT_IN1, PIN_LEFT_IN2);
  stopHBridge(PIN_RIGHT_ENB, PIN_RIGHT_IN3, PIN_RIGHT_IN4);
#endif
}
