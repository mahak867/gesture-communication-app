/*
 * GestureTalk Glove firmware
 * Board:   Seeed Studio XIAO ESP32S3  (Arduino-ESP32 core 3.x, "XIAO_ESP32S3")
 * Sensors: 5 × flex sensor (voltage dividers), MPU-6050 IMU (I2C)
 * Output:  BLE events to the GestureTalk web app, vibration motor feedback
 *
 * The glove does the gesture recognition itself and sends short text events
 * ("YES", "NEXT", ...) so the app stays simple and the radio link is tiny.
 *
 * Accessibility design:
 *  - Per-user calibration (open hand / gentle fist) stored in flash.
 *  - Fingers that barely move during calibration are marked "ignored" and act
 *    as wildcards, so people with limited movement in some fingers can still
 *    use every gesture their remaining fingers can make.
 *  - Every gesture must be held steady (HOLD_MS) before it fires, and fires
 *    once per hold — tremor and spasms do not produce streams of events.
 *  - Haptic confirmation on every event, and a warning pulse before HELP.
 *
 * Protocol must match app/lib/glove.ts.
 */

#include <Arduino.h>
#include <Wire.h>
#include <Preferences.h>
#include <BLEDevice.h>
#include <BLEServer.h>
#include <BLEUtils.h>
#include <BLE2902.h>

// ───────────────────────── Pins (XIAO ESP32S3) ─────────────────────────
// Flex sensors must be on ADC1 (GPIO1–10) — ADC2 is unreliable with the radio on.
static const uint8_t FLEX_PIN[5] = {1, 2, 3, 4, 7};  // D0 thumb, D1 index, D2 middle, D3 ring, D8 pinky
static const uint8_t PIN_SDA = 5;                     // D4
static const uint8_t PIN_SCL = 6;                     // D5
static const uint8_t PIN_MOTOR = 43;                  // D6 → NPN/MOSFET gate
static const uint8_t PIN_BUTTON = 44;                 // D7 → button to GND (internal pull-up)
static const uint8_t PIN_BATT = 9;                    // D10 ← 100k/100k divider from BAT+
static const uint8_t PIN_LED = 21;                    // on-board user LED (active LOW)

// ───────────────────────── BLE UUIDs ─────────────────────────
#define SVC_UUID  "6e7a0001-5a1f-4c2b-9d3e-7f1a2b3c4d5e"
#define EVT_UUID  "6e7a0002-5a1f-4c2b-9d3e-7f1a2b3c4d5e"
#define BAT_UUID  "6e7a0003-5a1f-4c2b-9d3e-7f1a2b3c4d5e"
#define CMD_UUID  "6e7a0004-5a1f-4c2b-9d3e-7f1a2b3c4d5e"

// ───────────────────────── Tuning ─────────────────────────
static const float BENT = 0.60f;          // normalised bend above this = finger curled
static const float STRAIGHT = 0.35f;      // below this = finger straight (hysteresis gap in between)
static const uint32_t HOLD_MS = 600;      // pose must be steady this long to fire
static const uint32_t REPEAT_MS = 1200;   // NEXT/PREV auto-repeat while held
static const uint32_t SELECT_MIN_MS = 300;
static const uint32_t HELP_WARN_MS = 1500;
static const uint32_t HELP_MS = 3000;
static const float TILT_G = 0.5f;         // |accel Y| above this decides thumb up vs down
static const int MIN_RANGE_MV = 150;      // calibration range below this → finger ignored
static const uint8_t MPU_ADDR = 0x68;

// ───────────────────────── State ─────────────────────────
enum Finger { THUMB, INDEX, MIDDLE, RING, PINKY };
enum Pose { P_NONE, P_OPEN, P_FIST, P_THUMB, P_POINT, P_TWO };

Preferences prefs;
BLECharacteristic *evtChar = nullptr;
BLECharacteristic *batChar = nullptr;
volatile bool connected = false;
volatile bool calRequested = false;
volatile bool buzzRequested = false;

int calOpen[5] = {1200, 1200, 1200, 1200, 1200};  // mV, overwritten by calibration
int calFist[5] = {2200, 2200, 2200, 2200, 2200};
bool ignored[5] = {false, false, false, false, false};
float filtered[5] = {0};
bool imuOk = false;
float accelY = 0;

// ───────────────────────── Helpers ─────────────────────────
void buzz(uint16_t ms) {
  digitalWrite(PIN_MOTOR, HIGH);
  delay(ms);
  digitalWrite(PIN_MOTOR, LOW);
}

void sendEvent(const char *e) {
  Serial.printf("EVENT %s\n", e);
  if (connected && evtChar) {
    evtChar->setValue((uint8_t *)e, strlen(e));
    evtChar->notify();
  }
}

int readMilliVolts(uint8_t pin) {
  uint32_t sum = 0;
  for (int i = 0; i < 8; i++) sum += analogReadMilliVolts(pin);
  return sum / 8;
}

void readFlex() {
  for (int i = 0; i < 5; i++) {
    float mv = readMilliVolts(FLEX_PIN[i]);
    filtered[i] = filtered[i] == 0 ? mv : filtered[i] * 0.7f + mv * 0.3f;  // low-pass against noise/tremor
  }
}

/** 0 = as open as calibration, 1 = as curled as calibration. Works whichever way the divider swings. */
float bend(int i) {
  float range = calFist[i] - calOpen[i];
  if (fabsf(range) < 1) return 0;
  return constrain((filtered[i] - calOpen[i]) / range, 0.0f, 1.0f);
}

bool isBent(int i) { return ignored[i] || bend(i) > BENT; }
bool isStraight(int i) { return ignored[i] || bend(i) < STRAIGHT; }

bool mpuInit() {
  Wire.beginTransmission(MPU_ADDR);
  Wire.write(0x6B);  // PWR_MGMT_1
  Wire.write(0x00);  // wake up
  return Wire.endTransmission() == 0;
}

void readImu() {
  if (!imuOk) return;
  Wire.beginTransmission(MPU_ADDR);
  Wire.write(0x3D);  // ACCEL_YOUT_H
  if (Wire.endTransmission(false) != 0) return;
  if (Wire.requestFrom(MPU_ADDR, (uint8_t)2) != 2) return;
  int16_t raw = (Wire.read() << 8) | Wire.read();
  accelY = accelY * 0.8f + (raw / 16384.0f) * 0.2f;  // ±2 g range → g
}

Pose classify() {
  bool othersBent = isBent(INDEX) && isBent(MIDDLE) && isBent(RING) && isBent(PINKY);
  bool allStraight = isStraight(THUMB) && isStraight(INDEX) && isStraight(MIDDLE) && isStraight(RING) && isStraight(PINKY);
  if (allStraight) return P_OPEN;
  if (othersBent && isBent(THUMB)) return P_FIST;
  if (othersBent && isStraight(THUMB) && !ignored[THUMB]) return P_THUMB;
  if (isStraight(INDEX) && !ignored[INDEX] && isBent(MIDDLE) && isBent(RING) && isBent(PINKY)) return P_POINT;
  if (isStraight(INDEX) && isStraight(MIDDLE) && !ignored[INDEX] && !ignored[MIDDLE] && isBent(RING) && isBent(PINKY)) return P_TWO;
  return P_NONE;
}

// ───────────────────────── Calibration ─────────────────────────
void sampleAverage(int out[5], uint32_t ms) {
  long sum[5] = {0};
  int n = 0;
  uint32_t end = millis() + ms;
  while (millis() < end) {
    for (int i = 0; i < 5; i++) sum[i] += readMilliVolts(FLEX_PIN[i]);
    n++;
    delay(10);
  }
  for (int i = 0; i < 5; i++) out[i] = sum[i] / max(n, 1);
}

void loadCalibration() {
  prefs.begin("glove", true);
  if (prefs.getBool("valid", false)) {
    prefs.getBytes("open", calOpen, sizeof(calOpen));
    prefs.getBytes("fist", calFist, sizeof(calFist));
    prefs.getBytes("ign", ignored, sizeof(ignored));
  }
  prefs.end();
}

void calibrate() {
  sendEvent("CAL_OPEN");
  buzz(150);
  delay(1500);                 // time to relax the hand
  sampleAverage(calOpen, 2000);
  sendEvent("CAL_FIST");
  buzz(150); delay(100); buzz(150);
  delay(1500);
  sampleAverage(calFist, 2000);
  for (int i = 0; i < 5; i++) {
    ignored[i] = abs(calFist[i] - calOpen[i]) < MIN_RANGE_MV;
    Serial.printf("finger %d open=%d fist=%d %s\n", i, calOpen[i], calFist[i], ignored[i] ? "IGNORED" : "");
    filtered[i] = 0;
  }
  prefs.begin("glove", false);
  prefs.putBytes("open", calOpen, sizeof(calOpen));
  prefs.putBytes("fist", calFist, sizeof(calFist));
  prefs.putBytes("ign", ignored, sizeof(ignored));
  prefs.putBool("valid", true);
  prefs.end();
  buzz(400);
  sendEvent("CAL_DONE");
}

// ───────────────────────── Battery ─────────────────────────
int batteryPercent() {
  int mv = readMilliVolts(PIN_BATT) * 2;  // 1:2 divider
  return constrain(map(mv, 3300, 4150, 0, 100), 0, 100);
}

void publishBattery() {
  char buf[5];
  snprintf(buf, sizeof(buf), "%d", batteryPercent());
  batChar->setValue((uint8_t *)buf, strlen(buf));
  if (connected) batChar->notify();
}

// ───────────────────────── BLE ─────────────────────────
class ServerCB : public BLEServerCallbacks {
  void onConnect(BLEServer *) override { connected = true; digitalWrite(PIN_LED, LOW); }
  void onDisconnect(BLEServer *s) override {
    connected = false;
    digitalWrite(PIN_LED, HIGH);
    s->getAdvertising()->start();  // be discoverable again straight away
  }
};

class CommandCB : public BLECharacteristicCallbacks {
  void onWrite(BLECharacteristic *c) override {
    String v = String(c->getValue().c_str());
    v.trim();
    v.toUpperCase();
    if (v == "CAL") calRequested = true;   // handled in loop(), never block the BLE task
    else if (v == "BUZZ") buzzRequested = true;
  }
};

void setupBle() {
  BLEDevice::init("GestureTalk Glove");
  BLEServer *server = BLEDevice::createServer();
  server->setCallbacks(new ServerCB());
  BLEService *svc = server->createService(SVC_UUID);
  evtChar = svc->createCharacteristic(EVT_UUID, BLECharacteristic::PROPERTY_NOTIFY);
  evtChar->addDescriptor(new BLE2902());
  batChar = svc->createCharacteristic(BAT_UUID, BLECharacteristic::PROPERTY_READ | BLECharacteristic::PROPERTY_NOTIFY);
  batChar->addDescriptor(new BLE2902());
  BLECharacteristic *cmd = svc->createCharacteristic(CMD_UUID, BLECharacteristic::PROPERTY_WRITE);
  cmd->setCallbacks(new CommandCB());
  svc->start();
  BLEAdvertising *adv = BLEDevice::getAdvertising();
  adv->addServiceUUID(SVC_UUID);
  adv->setScanResponse(true);
  BLEDevice::startAdvertising();
}

// ───────────────────────── Main ─────────────────────────
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

  Wire.begin(PIN_SDA, PIN_SCL);
  imuOk = mpuInit();
  Serial.printf("IMU %s\n", imuOk ? "ok" : "missing (thumb up/down will both send YES)");

  loadCalibration();
  setupBle();
  publishBattery();
  buzz(80);
}

void loop() {
  static Pose pose = P_NONE;
  static uint32_t poseSince = 0;
  static bool fired = false;
  static uint32_t lastRepeat = 0;
  static bool helpWarned = false;
  static uint32_t lastBattery = 0;
  static uint32_t buttonDown = 0;

  uint32_t now = millis();

  // Button: hold 2 s to calibrate (carers can do this without the app).
  if (digitalRead(PIN_BUTTON) == LOW) {
    if (!buttonDown) buttonDown = now;
    if (now - buttonDown > 2000) { calRequested = true; buttonDown = 0; while (digitalRead(PIN_BUTTON) == LOW) delay(10); }
  } else buttonDown = 0;

  if (calRequested) { calRequested = false; calibrate(); pose = P_NONE; return; }
  if (buzzRequested) { buzzRequested = false; buzz(300); }
  if (now - lastBattery > 60000) { lastBattery = now; publishBattery(); }

  readFlex();
  readImu();
  Pose p = classify();
  uint32_t held = now - poseSince;

  if (p != pose) {
    // Fist released: short fist = SELECT (HELP already fired if it was long).
    if (pose == P_FIST && !fired && held >= SELECT_MIN_MS) { sendEvent("SELECT"); buzz(60); }
    pose = p;
    poseSince = now;
    fired = false;
    helpWarned = false;
    delay(20);
    return;
  }

  switch (pose) {
    case P_FIST:
      if (!fired && !helpWarned && held >= HELP_WARN_MS) { helpWarned = true; buzz(40); }  // "keep holding for help"
      if (!fired && held >= HELP_MS) { fired = true; sendEvent("HELP"); buzz(250); delay(100); buzz(250); }
      break;
    case P_THUMB:
      if (!fired && held >= HOLD_MS) {
        fired = true;
        sendEvent(imuOk && accelY < -TILT_G ? "NO" : "YES");
        buzz(80);
      }
      break;
    case P_POINT:
    case P_TWO:
      if (!fired && held >= HOLD_MS) { fired = true; lastRepeat = now; sendEvent(pose == P_POINT ? "NEXT" : "PREV"); buzz(40); }
      else if (fired && now - lastRepeat >= REPEAT_MS) { lastRepeat = now; sendEvent(pose == P_POINT ? "NEXT" : "PREV"); buzz(30); }
      break;
    default:
      break;
  }

  static uint32_t lastLog = 0;
  if (now - lastLog > 250) {
    lastLog = now;
    Serial.printf("bend %.2f %.2f %.2f %.2f %.2f  ay=%.2f pose=%d\n", bend(0), bend(1), bend(2), bend(3), bend(4), accelY, pose);
  }
  delay(20);  // ~50 Hz
}
