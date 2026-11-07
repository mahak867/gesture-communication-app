// GestureTalk Glove — Bluetooth Low Energy protocol (must match hardware/glove/firmware).
//
// Service      GLOVE_SERVICE
//  ├─ FRAME     notify      20-byte sensor frame at 50 Hz (see lib/sensors.ts)
//  ├─ BATTERY   read/notify UTF-8 integer percent, e.g. "82"
//  └─ COMMAND   write       UTF-8 text: "BUZZ <ms>" (haptic confirmation)
//
// The glove only streams sensor data; all learning and recognition happens in
// the app, so a person's signs can be taught, backed up and improved without
// reflashing the glove.

export const GLOVE_SERVICE = '6e7a0001-5a1f-4c2b-9d3e-7f1a2b3c4d5e';
export const GLOVE_FRAME = '6e7a0002-5a1f-4c2b-9d3e-7f1a2b3c4d5e';
export const GLOVE_BATTERY = '6e7a0003-5a1f-4c2b-9d3e-7f1a2b3c4d5e';
export const GLOVE_COMMAND = '6e7a0004-5a1f-4c2b-9d3e-7f1a2b3c4d5e';

export function parseBattery(raw: DataView | ArrayBuffer | string): number | null {
  const text = typeof raw === 'string' ? raw : new TextDecoder().decode(raw);
  const n = Number.parseInt(text.trim(), 10);
  return Number.isFinite(n) && n >= 0 && n <= 100 ? n : null;
}
