/**
 * GestureTalk Wristband Firmware
 * Hardware: Seeed XIAO nRF52840 Sense + BNO055 IMU
 * Libraries: ArduinoBLE 1.3.6+, Adafruit_BNO055
 * 
 * Broadcasts roll/pitch/yaw via BLE GATT notification at 20Hz.
 * Maps tilt angles to wrist gestures for FatigueMode.
 * 
 * Flash via Arduino IDE:
 *   Board: "Seeed XIAO nRF52840 Sense"
 *   Upload speed: 921600
 */

#include <ArduinoBLE.h>
#include <Adafruit_BNO055.h>
#include <Wire.h>

// BLE UUIDs — must match useWristband.ts
BLEService gestureService("19B10000-E8F2-537E-4F6C-D104768A1214");
BLEStringCharacteristic imuChar("19B10001-E8F2-537E-4F6C-D104768A1214", BLERead | BLENotify, 20);
BLEByteCharacteristic  batChar("19B10002-E8F2-537E-4F6C-D104768A1214", BLERead, 1);

Adafruit_BNO055 bno = Adafruit_BNO055(55, 0x28); // try 0x29 if 0x28 fails

const int LED_CONNECTED = LED_BUILTIN;
unsigned long lastUpdate = 0;

void setup() {
  Serial.begin(115200);
  pinMode(LED_CONNECTED, OUTPUT);
  
  // Init BNO055
  if (!bno.begin()) {
    Serial.println("BNO055 not found — check wiring and I2C address");
    while (1) { digitalWrite(LED_CONNECTED, !digitalRead(LED_CONNECTED)); delay(200); }
  }
  bno.setExtCrystalUse(true);
  
  // Init BLE
  if (!BLE.begin()) {
    Serial.println("BLE init failed");
    while (1);
  }
  
  BLE.setLocalName("GestureTalk-Wrist");
  BLE.setAdvertisedService(gestureService);
  gestureService.addCharacteristic(imuChar);
  gestureService.addCharacteristic(batChar);
  BLE.addService(gestureService);
  
  // Set initial battery (static 90% — real battery monitoring needs ADC pin)
  batChar.writeValue(90);
  
  BLE.advertise();
  Serial.println("GestureTalk Wristband advertising — waiting for connection");
}

void loop() {
  BLEDevice central = BLE.central();
  
  if (central) {
    Serial.println("Connected: " + central.address());
    digitalWrite(LED_CONNECTED, HIGH);
    
    while (central.connected()) {
      // 20Hz update rate — sufficient for wrist gesture detection
      if (millis() - lastUpdate >= 50) {
        lastUpdate = millis();
        
        sensors_event_t orientationData;
        bno.getEvent(&orientationData, Adafruit_BNO055::VECTOR_EULER);
        
        float roll  = orientationData.orientation.z; // -180 to 180
        float pitch = orientationData.orientation.y; // -90 to 90
        float yaw   = orientationData.orientation.x; // 0 to 360
        
        // Format: "roll,pitch,yaw" as compact string
        String payload = String(roll, 1) + "," + String(pitch, 1) + "," + String(yaw, 1);
        imuChar.writeValue(payload);
        
        // Serial debug (disable in production for power saving)
        Serial.println("IMU: " + payload);
      }
    }
    
    digitalWrite(LED_CONNECTED, LOW);
    Serial.println("Disconnected");
  }
}
