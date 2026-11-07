#pragma once
#include <stdint.h>
struct TwoWire {
  bool begin(int sda, int scl, uint32_t freq);
  void beginTransmission(uint8_t);
  size_t write(uint8_t);
  uint8_t endTransmission(bool stop = true);
  uint8_t requestFrom(uint8_t addr, uint8_t n);
  int read();
};
extern TwoWire Wire;
