// GestureTalk Glove — Bluetooth Low Energy protocol (must match hardware/glove/firmware).
//
// Service      GLOVE_SERVICE
//  ├─ EVENT     notify  UTF-8 text, one event per notification, e.g. "YES"
//  ├─ BATTERY   read/notify  UTF-8 integer percent, e.g. "82"
//  └─ COMMAND   write   UTF-8 text: "CAL" (start calibration), "BUZZ" (test vibration)

export const GLOVE_SERVICE = '6e7a0001-5a1f-4c2b-9d3e-7f1a2b3c4d5e';
export const GLOVE_EVENT = '6e7a0002-5a1f-4c2b-9d3e-7f1a2b3c4d5e';
export const GLOVE_BATTERY = '6e7a0003-5a1f-4c2b-9d3e-7f1a2b3c4d5e';
export const GLOVE_COMMAND = '6e7a0004-5a1f-4c2b-9d3e-7f1a2b3c4d5e';

export type GloveEvent = 'YES' | 'NO' | 'NEXT' | 'PREV' | 'SELECT' | 'HELP' | 'CAL_OPEN' | 'CAL_FIST' | 'CAL_DONE';

const EVENTS: readonly GloveEvent[] = ['YES', 'NO', 'NEXT', 'PREV', 'SELECT', 'HELP', 'CAL_OPEN', 'CAL_FIST', 'CAL_DONE'];

export const GLOVE_GESTURES: { event: GloveEvent; how: string }[] = [
  { event: 'YES', how: 'Thumb up (thumb straight, fingers curled, back of hand down)' },
  { event: 'NO', how: 'Thumb down (same shape, hand turned over)' },
  { event: 'NEXT', how: 'Point with the index finger → move highlight forward' },
  { event: 'PREV', how: 'Two fingers (index + middle) → move highlight back' },
  { event: 'SELECT', how: 'Make a fist briefly → press the highlighted button' },
  { event: 'HELP', how: 'Hold a fist for 3 seconds → urgent alarm' },
];

export function parseGloveEvent(raw: DataView | ArrayBuffer | string): GloveEvent | null {
  const text = typeof raw === 'string' ? raw : new TextDecoder().decode(raw);
  const t = text.trim().toUpperCase();
  return (EVENTS as readonly string[]).includes(t) ? (t as GloveEvent) : null;
}

export function parseBattery(raw: DataView | ArrayBuffer | string): number | null {
  const text = typeof raw === 'string' ? raw : new TextDecoder().decode(raw);
  const n = Number.parseInt(text.trim(), 10);
  return Number.isFinite(n) && n >= 0 && n <= 100 ? n : null;
}
