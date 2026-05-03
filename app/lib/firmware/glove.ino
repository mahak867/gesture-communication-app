/**
 * GestureTalk Glove Firmware
 * Hardware: Seeed XIAO nRF52840 + ADS1115 (I2C, 0x48) + BNO055 (I2C, 0x28)
 * Libraries: ArduinoBLE 1.3.6+, Adafruit_ADS1X15, Adafruit_BNO055
 * 
 * Reads 5 flex sensors via ADS1115 + wrist orientation via BNO055.
 * Streams packed byte array via BLE GATT notification at 20Hz.
 * 
 * I2C bus: SDA=D4, SCL=D5 (XIAO default)
 * ADS1115 ADDR pin → GND → address 0x48
 * BNO055 default address 0x28
 */

#include <ArduinoBLE.h>
#include <Adafruit_ADS1X15.h>
#include <Adafruit_BNO055.h>

// BLE UUIDs — must match useGlove.ts
BLEService gloveService("12340000-E8F2-537E-4F6C-D104768A1214");
// Flex: 5 bytes (thumb, index, middle, ring, pinky), each 0-255 (mapped from 0-1023)
BLECharacteristic flexChar("12340001-E8F2-537E-4F6C-D104768A1214", BLERead | BLENotify, 5);
BLEStringCharacteristic imuChar("12340002-E8F2-537E-4F6C-D104768A1214", BLERead | BLENotify, 20);

Adafruit_ADS1115 ads;
Adafruit_BNO055  bno = Adafruit_BNO055(55, 0x28);

// Calibration — run Calibration mode first, save to EEPROM
// These are starting defaults
int16_t calMin[5] = {3200, 2900, 3100, 2950, 2800}; // straight finger (raw 16-bit ADS1115)
int16_t calMax[5] = {8000, 7800, 7900, 7850, 7700}; // fully bent

uint8_t mapFlex(int16_t raw, int i) {
  // Map raw ADS reading to 0-255
  float norm = (float)(raw - calMin[i]) / (float)(calMax[i] - calMin[i]);
  norm = constrain(norm, 0.0, 1.0);
  return (uint8_t)(norm * 255);
}

unsigned long lastUpdate = 0;

void setup() {
  Serial.begin(115200);

  // ADS1115 at 0x48 (ADDR → GND)
  ads.setGain(GAIN_ONE); // ±4.096V range, 0.125mV per bit
  if (!ads.begin(0x48)) {
    Serial.println("ADS1115 not found — check I2C wiring");
    while (1);
  }

  // BNO055 at 0x28
  if (!bno.begin()) {
    Serial.println("BNO055 not found — check wiring");
    // Continue without IMU — glove still works for flex-only gestures
  } else {
    bno.setExtCrystalUse(true);
  }

  if (!BLE.begin()) {
    Serial.println("BLE init failed");
    while (1);
  }

  BLE.setLocalName("GestureTalk-Glove");
  BLE.setAdvertisedService(gloveService);
  gloveService.addCharacteristic(flexChar);
  gloveService.addCharacteristic(imuChar);
  BLE.addService(gloveService);
  BLE.advertise();

  Serial.println("GestureTalk Glove advertising");
}

void loop() {
  BLEDevice central = BLE.central();

  if (central) {
    Serial.println("Connected: " + central.address());

    while (central.connected()) {
      if (millis() - lastUpdate >= 50) { // 20Hz
        lastUpdate = millis();

        // Read 4 flex sensors from ADS1115 (A0-A3 = index, middle, ring, pinky)
        int16_t raw[5];
        raw[1] = ads.readADC_SingleEnded(0); // index
        raw[2] = ads.readADC_SingleEnded(1); // middle
        raw[3] = ads.readADC_SingleEnded(2); // ring
        raw[4] = ads.readADC_SingleEnded(3); // pinky
        // Thumb on XIAO direct ADC pin A0
        raw[0] = analogRead(A0) * 4; // scale 0-1023 → 0-4095 range

        uint8_t packed[5];
        for (int i = 0; i < 5; i++) packed[i] = mapFlex(raw[i], i);
        flexChar.writeValue(packed, 5);

        // IMU
        sensors_event_t orient;
        bno.getEvent(&orient, Adafruit_BNO055::VECTOR_EULER);
        String imu = String(orient.orientation.z, 1) + "," + String(orient.orientation.y, 1);
        imuChar.writeValue(imu);

        // Debug
        Serial.print("Flex:");
        for (int i = 0; i < 5; i++) { Serial.print(packed[i]); Serial.print(","); }
        Serial.print(" IMU:" + imu);
        Serial.println();
      }
    }
    Serial.println("Disconnected");
  }
}
