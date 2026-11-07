/*
 * GestureTalk Glove firmware — sensor streaming
 * Board:   Seeed Studio XIAO ESP32S3  (Arduino-ESP32 core 3.x, board "XIAO_ESP32S3")
 * Sensors: 5 × flex sensor (voltage dividers), MPU-6050 IMU (I2C)
 * Output:  50 Hz BLE sensor frames + vibration feedback on command
 *
 * The glove is deliberately simple: it measures and streams. All learning and
 * recognition of the wearer's personal signs happens in the GestureTalk app,
 * so signs can be taught, improved and backed up without reflashing.
 *
 * Frame format (20 bytes, little-endian) — must match app/lib/sensors.ts:
 *   uint16[5] flex mV (thumb..pinky) | int16[3] accel milli-g | int8[3] gyro deg/s ÷ 8
 *   | uint8 (bit7 = pod button, bits0-6 = sequence)
 */

#include <Arduino.h>
#include <Wire.h>
#include <BLEDevice.h>
#include <BLEServer.h>
#include <BLEUtils.h>
#include <BLE2902.h>

// ───────── Pins (XIAO ESP32S3). Flex sensors on ADC1 only — ADC2 is unreliable with BLE. ─────────
static const uint8_t FLEX_PIN[5] = {1, 2, 3, 4, 7};  // D0 thumb, D1 index, D2 middle, D3 ring, D8 pinky
static const uint8_t PIN_SDA = 5;     // D4
static const uint8_t PIN_SCL = 6;     // D5
static const uint8_t PIN_MOTOR = 43;  // D6 → 1 kΩ → NPN base
static const uint8_t PIN_BUTTON = 44; // D7 → button → GND
static const uint8_t PIN_BATT = 9;    // D10 ← 100k/100k divider from BAT+
static const uint8_t PIN_LED = 21;    // user LED, active LOW

#define SVC_UUID   "6e7a0001-5a1f-4c2b-9d3e-7f1a2b3c4d5e"
#define FRAME_UUID "6e7a0002-5a1f-4c2b-9d3e-7f1a2b3c4d5e"
#define BAT_UUID   "6e7a0003-5a1f-4c2b-9d3e-7f1a2b3c4d5e"
#define CMD_UUID   "6e7a0004-5a1f-4c2b-9d3e-7f1a2b3c4d5e"

static const uint32_t FRAME_INTERVAL_US = 20000;  // 50 Hz
static const uint8_t MPU_ADDR = 0x68;

BLECharacteristic *frameChar = nullptr;
BLECharacteristic *batChar = nullptr;
volatile bool connected = false;
volatile uint16_t buzzMs = 0;   // set from the BLE callback, executed in loop()
uint32_t buzzUntil = 0;
bool imuOk = false;
uint8_t seq = 0;

// ───────── Sensors ─────────
uint16_t readFlex(uint8_t pin) {
  uint32_t sum = 0;
  for (int i = 0; i < 4; i++) sum += analogReadMilliVolts(pin);  // light oversampling
  return sum / 4;
}

bool mpuInit() {
  Wire.beginTransmission(MPU_ADDR);
  Wire.write(0x6B); Wire.write(0x00);           // wake
  if (Wire.endTransmission() != 0) return false;
  Wire.beginTransmission(MPU_ADDR);
  Wire.write(0x1A); Wire.write(0x03);           // DLPF ~44 Hz: removes vibration noise
  Wire.endTransmission();
  Wire.beginTransmission(MPU_ADDR);
  Wire.write(0x1B); Wire.write(0x08);           // gyro ±500 °/s
  Wire.endTransmission();
  return true;
}

void readImu(int16_t acc_mg[3], int8_t gyro_div8[3]) {
  acc_mg[0] = acc_mg[1] = 0; acc_mg[2] = 1000;  // sane default if the IMU is missing
  gyro_div8[0] = gyro_div8[1] = gyro_div8[2] = 0;
  if (!imuOk) return;
  Wire.beginTransmission(MPU_ADDR);
  Wire.write(0x3B);
  if (Wire.endTransmission(false) != 0) return;
  if (Wire.requestFrom(MPU_ADDR, (uint8_t)14) != 14) return;
  int16_t raw[7];
  for (int i = 0; i < 7; i++) raw[i] = (Wire.read() << 8) | Wire.read();
  for (int i = 0; i < 3; i++) acc_mg[i] = (int32_t)raw[i] * 1000 / 16384;       // ±2 g
  for (int i = 0; i < 3; i++) {
    int32_t dps = (int32_t)raw[4 + i] * 10 / 655;                                // ±500 °/s → 65.5 LSB/°/s
    gyro_div8[i] = (int8_t)constrain(dps / 8, -128, 127);
  }
}

int batteryPercent() {
  int mv = analogReadMilliVolts(PIN_BATT) * 2;
  return constrain(map(mv, 3300, 4150, 0, 100), 0, 100);
}

void publishBattery() {
  char buf[5];
  snprintf(buf, sizeof(buf), "%d", batteryPercent());
  batChar->setValue((uint8_t *)buf, strlen(buf));
  if (connected) batChar->notify();
}

// ───────── BLE ─────────
class ServerCB : public BLEServerCallbacks {
  void onConnect(BLEServer *) override { connected = true; digitalWrite(PIN_LED, LOW); buzzMs = 60; }
  void onDisconnect(BLEServer *s) override {
    connected = false;
    digitalWrite(PIN_LED, HIGH);
    s->getAdvertising()->start();
  }
};

class CommandCB : public BLECharacteristicCallbacks {
  void onWrite(BLECharacteristic *c) override {
    String v = String(c->getValue().c_str());
    v.trim();
    v.toUpperCase();
    if (v.startsWith("BUZZ")) {
      int ms = v.length() > 5 ? v.substring(5).toInt() : 80;
      buzzMs = constrain(ms, 10, 1000);
    }
  }
};

void setupBle() {
  BLEDevice::init("GestureTalk Glove");
  BLEDevice::setMTU(64);
  BLEServer *server = BLEDevice::createServer();
  server->setCallbacks(new ServerCB());
  BLEService *svc = server->createService(SVC_UUID);
  frameChar = svc->createCharacteristic(FRAME_UUID, BLECharacteristic::PROPERTY_NOTIFY);
  frameChar->addDescriptor(new BLE2902());
  batChar = svc->createCharacteristic(BAT_UUID, BLECharacteristic::PROPERTY_READ | BLECharacteristic::PROPERTY_NOTIFY);
  batChar->addDescriptor(new BLE2902());
  BLECharacteristic *cmd = svc->createCharacteristic(CMD_UUID, BLECharacteristic::PROPERTY_WRITE | BLECharacteristic::PROPERTY_WRITE_NR);
  cmd->setCallbacks(new CommandCB());
  svc->start();
  BLEAdvertising *adv = BLEDevice::getAdvertising();
  adv->addServiceUUID(SVC_UUID);
  adv->setScanResponse(true);
  adv->setMinPreferred(0x06);  // helps iOS/Android pick a short connection interval
  BLEDevice::startAdvertising();
}

// ───────── Main ─────────
void setup() {
  Serial.begin(115200);
  pinMode(PIN_MOTOR, OUTPUT);
  digitalWrite(PIN_MOTOR, LOW);
  pinMode(PIN_BUTTON, INPUT_PULLUP);
  pinMode(PIN_LED, OUTPUT);
  digitalWrite(PIN_LED, HIGH);
  analogReadResolution(12);
  for (int i = 0; i < 5; i++) analogSetPinAttenuation(FLEX_PIN[i], ADC_11db);
  analogSetPinAttenuation(PIN_BATT, ADC_11db);
  Wire.begin(PIN_SDA, PIN_SCL, 400000);
  imuOk = mpuInit();
  Serial.printf("GestureTalk Glove — IMU %s\n", imuOk ? "ok" : "MISSING");
  setupBle();
  publishBattery();
}

void loop() {
  static uint32_t nextFrame = micros();
  static uint32_t lastBattery = 0;
  static uint32_t lastLog = 0;
  uint32_t nowMs = millis();

  // Haptics (non-blocking).
  if (buzzMs) { digitalWrite(PIN_MOTOR, HIGH); buzzUntil = nowMs + buzzMs; buzzMs = 0; }
  if (buzzUntil && (int32_t)(nowMs - buzzUntil) >= 0) { digitalWrite(PIN_MOTOR, LOW); buzzUntil = 0; }

  if (nowMs - lastBattery > 60000) { lastBattery = nowMs; publishBattery(); }

  if ((int32_t)(micros() - nextFrame) < 0) return;
  nextFrame += FRAME_INTERVAL_US;

  uint8_t pkt[20];
  uint16_t flex[5];
  for (int i = 0; i < 5; i++) {
    flex[i] = readFlex(FLEX_PIN[i]);
    pkt[i * 2] = flex[i] & 0xFF;
    pkt[i * 2 + 1] = flex[i] >> 8;
  }
  int16_t acc[3];
  int8_t gyro[3];
  readImu(acc, gyro);
  for (int i = 0; i < 3; i++) {
    pkt[10 + i * 2] = acc[i] & 0xFF;
    pkt[11 + i * 2] = (uint16_t)acc[i] >> 8;
    pkt[16 + i] = (uint8_t)gyro[i];
  }
  bool button = digitalRead(PIN_BUTTON) == LOW;
  pkt[19] = (button ? 0x80 : 0) | (seq++ & 0x7F);

  if (connected) {
    frameChar->setValue(pkt, sizeof(pkt));
    frameChar->notify();
  }

  if (nowMs - lastLog > 500) {  // human-readable check in Serial Monitor
    lastLog = nowMs;
    Serial.printf("flex %4u %4u %4u %4u %4u  acc %5d %5d %5d  btn %d\n",
                  flex[0], flex[1], flex[2], flex[3], flex[4], acc[0], acc[1], acc[2], button);
  }
}
