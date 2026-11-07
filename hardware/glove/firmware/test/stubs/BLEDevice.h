#pragma once
#include "Arduino.h"
class BLEServer;
class BLECharacteristic;
class BLEDescriptor { public: virtual ~BLEDescriptor() {} };
class BLEServerCallbacks { public: virtual ~BLEServerCallbacks() {} virtual void onConnect(BLEServer *) {} virtual void onDisconnect(BLEServer *) {} };
class BLECharacteristicCallbacks { public: virtual ~BLECharacteristicCallbacks() {} virtual void onWrite(BLECharacteristic *) {} };
class BLECharacteristic {
 public:
  static const uint32_t PROPERTY_READ = 1, PROPERTY_WRITE = 2, PROPERTY_NOTIFY = 4, PROPERTY_WRITE_NR = 8;
  void addDescriptor(BLEDescriptor *);
  void setCallbacks(BLECharacteristicCallbacks *);
  void setValue(uint8_t *data, size_t len);
  void notify();
  String getValue();
};
class BLEService { public: BLECharacteristic *createCharacteristic(const char *uuid, uint32_t props); void start(); };
class BLEAdvertising { public: void addServiceUUID(const char *); void setScanResponse(bool); void setMinPreferred(uint16_t); void start(); };
class BLEServer { public: void setCallbacks(BLEServerCallbacks *); BLEService *createService(const char *); BLEAdvertising *getAdvertising(); };
class BLEDevice {
 public:
  static void init(const char *name);
  static void setMTU(uint16_t);
  static BLEServer *createServer();
  static BLEAdvertising *getAdvertising();
  static void startAdvertising();
};
