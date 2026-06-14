#ifndef KNEEJOY_VIBRATION_H
#define KNEEJOY_VIBRATION_H

#include <Arduino.h>

// 震动揉捏：UI vibration 0~3 档 → PWM
class VibrationDriver {
 public:
  void begin();
  void setLevel(int level);
  void stop();
  int currentLevel() const;

 private:
  int _level = 0;
  int levelToPwm(int level) const;
};

#endif
