#include "heater.h"
#include "config.h"

void HeaterDriver::begin() {
  pinMode(PIN_HEATER, OUTPUT);
  stop();
}

int HeaterDriver::tempToPwm(int tempC) const {
  int t = constrain(tempC, TEMP_MIN_C, TEMP_MAX_C);
  // 35℃≈30%  42℃≈60%  50℃≈95%
  return map(t, TEMP_MIN_C, TEMP_MAX_C, 76, 242);
}

void HeaterDriver::setTemperature(int tempC) {
  _tempC = constrain(tempC, 0, TEMP_MAX_C);
  if (_tempC < TEMP_MIN_C) {
    stop();
    return;
  }
  analogWrite(PIN_HEATER, tempToPwm(_tempC));
}

void HeaterDriver::stop() {
  _tempC = 0;
  analogWrite(PIN_HEATER, 0);
}

int HeaterDriver::currentTemperature() const {
  return _tempC;
}
