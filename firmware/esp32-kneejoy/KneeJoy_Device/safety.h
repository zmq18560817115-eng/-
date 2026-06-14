#ifndef KNEEJOY_SAFETY_H
#define KNEEJOY_SAFETY_H

#include <Arduino.h>
#include "config.h"

class SafetyMonitor {
 public:
  void begin();
  bool clipAttached() const;
  bool emergencyPressed() const;
  bool canStart(int leftForce, int rightForce, int maxForce) const;
  const char *startBlockReason() const;

 private:
  mutable const char *_blockReason = nullptr;
};

#endif
