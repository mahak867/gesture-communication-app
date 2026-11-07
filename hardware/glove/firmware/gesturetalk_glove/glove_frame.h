// GestureTalk Glove — pure helpers shared by the firmware and its host tests.
// No Arduino dependencies: compiled and unit-tested on a PC with g++
// (hardware/glove/firmware/test), and checked byte-for-byte against the app's
// TypeScript decoder (app/lib/sensors.ts) through golden vectors.
#pragma once
#include <stdint.h>
#include <string.h>

namespace glove {

static const int FRAME_BYTES = 20;

// Clamp helper usable without Arduino's constrain().
template <typename T> inline T clampv(T v, T lo, T hi) { return v < lo ? lo : (v > hi ? hi : v); }

// MPU-6050 at ±2 g: 16384 LSB/g → milli-g.
inline int16_t accelRawToMg(int16_t raw) { return (int16_t)((int32_t)raw * 1000 / 16384); }

// MPU-6050 at ±500 °/s: 65.5 LSB/(°/s) → (°/s) ÷ 8, saturated to int8.
inline int8_t gyroRawToDiv8(int16_t raw) {
  int32_t dps = (int32_t)raw * 10 / 655;
  return (int8_t)clampv<int32_t>(dps / 8, -128, 127);
}

// Pack one sensor frame. Layout (little-endian):
//  0..9   uint16[5] flex mV | 10..15 int16[3] accel milli-g | 16..18 int8[3] gyro °/s÷8
//  19     bit7 = button, bits0..6 = sequence
inline void packFrame(uint8_t out[FRAME_BYTES], const uint16_t flex[5], const int16_t acc[3], const int8_t gyro[3],
                      bool button, uint8_t seq) {
  for (int i = 0; i < 5; i++) {
    out[i * 2] = flex[i] & 0xFF;
    out[i * 2 + 1] = flex[i] >> 8;
  }
  for (int i = 0; i < 3; i++) {
    uint16_t a = (uint16_t)acc[i];
    out[10 + i * 2] = a & 0xFF;
    out[11 + i * 2] = a >> 8;
    out[16 + i] = (uint8_t)gyro[i];
  }
  out[19] = (uint8_t)((button ? 0x80 : 0) | (seq & 0x7F));
}

// Li-Po voltage (after undoing the 1:2 divider) → percent, linear 3.30 V..4.15 V.
inline int batteryPercentFromMv(int batteryMv) {
  return clampv((batteryMv - 3300) * 100 / (4150 - 3300), 0, 100);
}

// Parse a "BUZZ <ms>" command (case-insensitive, surrounding spaces ok).
// Returns the duration clamped to 10..1000 ms, 80 ms if no number, or 0 if not a BUZZ command.
inline uint16_t parseBuzzMs(const char *cmd) {
  while (*cmd == ' ' || *cmd == '\t' || *cmd == '\r' || *cmd == '\n') cmd++;
  const char *kw = "BUZZ";
  for (int i = 0; i < 4; i++) {
    char c = cmd[i];
    if (c >= 'a' && c <= 'z') c -= 32;
    if (c != kw[i]) return 0;
  }
  cmd += 4;
  if (*cmd && *cmd != ' ' && *cmd != '\t' && *cmd != '\r' && *cmd != '\n') return 0;  // e.g. "BUZZER"
  while (*cmd == ' ' || *cmd == '\t') cmd++;
  if (*cmd < '0' || *cmd > '9') return 80;
  long ms = 0;
  while (*cmd >= '0' && *cmd <= '9' && ms < 100000) ms = ms * 10 + (*cmd++ - '0');
  return (uint16_t)clampv<long>(ms, 10, 1000);
}

// A flex divider reading pinned near a rail means an open or shorted sensor.
inline bool flexLooksDisconnected(uint16_t mv) { return mv < 60 || mv > 3240; }

}  // namespace glove
