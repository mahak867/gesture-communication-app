// Minimal Arduino-ESP32 API surface so the sketch can be compiled on a PC
// (syntax and type check only — it is never run). See test/Makefile.
#pragma once
#include <stdint.h>
#include <stddef.h>
#include <string.h>
#include <stdio.h>
#define HIGH 1
#define LOW 0
#define INPUT 0
#define OUTPUT 1
#define INPUT_PULLUP 2
typedef enum { ADC_0db, ADC_2_5db, ADC_6db, ADC_11db } adc_attenuation_t;
void pinMode(uint8_t, uint8_t);
void digitalWrite(uint8_t, uint8_t);
int digitalRead(uint8_t);
uint32_t analogReadMilliVolts(uint8_t);
void analogReadResolution(uint8_t);
void analogSetPinAttenuation(uint8_t, adc_attenuation_t);
uint32_t millis();
uint32_t micros();
void delay(uint32_t);
struct HardwareSerial { void begin(unsigned long); int printf(const char *, ...); };
extern HardwareSerial Serial;
class String {
 public:
  String(const char * = "");
  const char *c_str() const;
};
