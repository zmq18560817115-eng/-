#include "vibration.h"
#include "config.h"

void VibrationDriver::begin() {
  pinMode(PIN_VIBRATION, OUTPUT);
  stop();
}

int VibrationDriver::levelToPwm(int level) const {
  switch (constrain(level, 0, VIBRATION_MAX_LEVEL)) {
    case 0: return 0;
    case 1: return 90;
    case 2: return 170;
    default: return 255;
  }
}

void VibrationDriver::setLevel(int level) {
  _level = constrain(level, 0, VIBRATION_MAX_LEVEL);
  analogWrite(PIN_VIBRATION, levelToPwm(_level));
}

void VibrationDriver::stop() {
  _level = 0;
  analogWrite(PIN_VIBRATION, 0);
}

int VibrationDriver::currentLevel() const {
  return _level;
}
