#ifndef KNEEJOY_SERIAL_CMD_H
#define KNEEJOY_SERIAL_CMD_H

#include <Arduino.h>
#include "therapy_session.h"

// 本地串口调试：与文档 @STxCMD / @STxSTOP 格式一致，无需云端即可测三模块
class SerialCommandParser {
 public:
  void begin();
  void poll(TherapySession &session);

 private:
  String _buffer;
  TherapyParams parseCmdLine(const String &line) const;
  void handleLine(const String &line, TherapySession &session);
};

#endif
