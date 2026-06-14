#include "serial_cmd.h"

void SerialCommandParser::begin() {
  _buffer = "";
}

TherapyParams SerialCommandParser::parseCmdLine(const String &line) const {
  TherapyParams p;
  auto readInt = [&](const char *key, int fallback) {
    String tag = String(key) + "=";
    int idx = line.indexOf(tag);
    if (idx < 0) return fallback;
    idx += tag.length();
    return line.substring(idx).toInt();
  };

  p.leftForce = readInt("L_F", 15);
  p.rightForce = readInt("R_F", 15);
  p.temp = readInt("TEMP", 42);
  p.vibration = readInt("VIB", 1);
  p.durationMin = readInt("DUR", 20);
  p.maxForceLimit = readInt("MAX", 35);
  return p;
}

void SerialCommandParser::handleLine(const String &line, TherapySession &session) {
  if (line.startsWith("@STxSTOP")) {
    session.stop("串口 STOP");
    return;
  }
  if (line.startsWith("@STxCMD:")) {
    TherapyParams p = parseCmdLine(line);
    session.start(p);
    return;
  }
  if (line.equalsIgnoreCase("STATUS")) {
    TherapyTelemetry t = session.telemetry();
    Serial.print("[状态] running=");
    Serial.print(t.running);
    Serial.print(" L=");
    Serial.print(t.leftForce);
    Serial.print(" R=");
    Serial.print(t.rightForce);
    Serial.print(" T=");
    Serial.print(t.temp);
    Serial.print(" V=");
    Serial.print(t.vibration);
    Serial.print(" left=");
    Serial.println(t.timeLeftSec);
  }
}

void SerialCommandParser::poll(TherapySession &session) {
  while (Serial.available()) {
    char c = Serial.read();
    if (c == '\n' || c == '\r') {
      if (_buffer.length() > 0) {
        handleLine(_buffer, session);
        _buffer = "";
      }
      continue;
    }
    if (_buffer.length() < 120) {
      _buffer += c;
    }
  }
}
