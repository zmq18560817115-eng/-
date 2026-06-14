#ifndef KNEEJOY_HEATER_H
#define KNEEJOY_HEATER_H

#include <Arduino.h>

// 恒温加热：UI temp(℃) → PWM 占空比（毕设阶段开环控制，不接温度传感器）
class HeaterDriver {
 public:
  void begin();
  void setTemperature(int tempC);
  void stop();
  int currentTemperature() const;

 private:
  int _tempC = 0;
  int tempToPwm(int tempC) const;
};

#endif
