// Raw glove frames and their conversion to features the recognizer uses.
//
// BLE frame packet (20 bytes, little-endian — fits the default BLE MTU):
//   0..9   uint16 ×5  flex sensor millivolts: thumb, index, middle, ring, pinky
//   10..15 int16  ×3  accelerometer, milli-g (x, y, z)
//   16..18 int8   ×3  gyroscope, degrees/s ÷ 8 (x, y, z)
//   19     uint8      bit 7 = pod button pressed, bits 0..6 = sequence number

export const FRAME_BYTES = 20;
export const FRAME_HZ = 50;
export const FINGERS = ['thumb', 'index', 'middle', 'ring', 'pinky'] as const;

export interface Frame {
  flex: [number, number, number, number, number]; // mV
  accel: [number, number, number]; // g
  gyro: [number, number, number]; // deg/s
  button: boolean;
  seq: number;
}

export function parseFrame(view: DataView): Frame | null {
  if (view.byteLength < FRAME_BYTES) return null;
  const u16 = (o: number) => view.getUint16(o, true);
  const i16 = (o: number) => view.getInt16(o, true);
  const last = view.getUint8(19);
  return {
    flex: [u16(0), u16(2), u16(4), u16(6), u16(8)],
    accel: [i16(10) / 1000, i16(12) / 1000, i16(14) / 1000],
    gyro: [view.getInt8(16) * 8, view.getInt8(17) * 8, view.getInt8(18) * 8],
    button: (last & 0x80) !== 0,
    seq: last & 0x7f,
  };
}

/** Inverse of parseFrame — used by the demo glove and tests. */
export function encodeFrame(f: Frame): DataView {
  const v = new DataView(new ArrayBuffer(FRAME_BYTES));
  f.flex.forEach((mv, i) => v.setUint16(i * 2, Math.max(0, Math.min(65535, Math.round(mv))), true));
  f.accel.forEach((g, i) => v.setInt16(10 + i * 2, Math.max(-32768, Math.min(32767, Math.round(g * 1000))), true));
  f.gyro.forEach((d, i) => v.setInt8(16 + i, Math.max(-128, Math.min(127, Math.round(d / 8)))));
  v.setUint8(19, (f.button ? 0x80 : 0) | (f.seq & 0x7f));
  return v;
}

/** Per-person calibration: their relaxed hand and their fullest comfortable bend. */
export interface Calibration {
  relaxed: number[]; // mV per finger
  bent: number[]; // mV per finger
}

export const DEFAULT_CALIBRATION: Calibration = {
  relaxed: [1200, 1200, 1200, 1200, 1200],
  bent: [2200, 2200, 2200, 2200, 2200],
};

/** A finger whose calibrated range is tiny cannot carry information (e.g. paralysed). */
export const MIN_RANGE_MV = 120;

export function activeFingers(cal: Calibration): boolean[] {
  return cal.relaxed.map((r, i) => Math.abs(cal.bent[i] - r) >= MIN_RANGE_MV);
}

/** A divider pinned near 0 V or 3.3 V means an open or shorted sensor (matches the firmware self-test). */
export function sensorFaults(cal: Calibration): boolean[] {
  const bad = (mv: number) => mv < 60 || mv > 3240;
  return cal.relaxed.map((r, i) => bad(r) && bad(cal.bent[i]));
}

/**
 * Feature vector (9 values):
 *  0..4  bend per finger, 0 = relaxed, 1 = full bend (inactive fingers → 0)
 *  5..7  gravity direction (unit vector) — hand orientation
 *  8     rotation speed, scaled so ~300°/s ≈ 1
 */
export const FEATURES = 9;

export function features(f: Frame, cal: Calibration, active = activeFingers(cal)): number[] {
  const out = new Array<number>(FEATURES);
  for (let i = 0; i < 5; i++) {
    const range = cal.bent[i] - cal.relaxed[i];
    out[i] = active[i] ? clamp((f.flex[i] - cal.relaxed[i]) / range, -0.5, 1.5) : 0;
  }
  const [ax, ay, az] = f.accel;
  const n = Math.hypot(ax, ay, az) || 1;
  out[5] = ax / n;
  out[6] = ay / n;
  out[7] = az / n;
  out[8] = Math.min(2, Math.hypot(...f.gyro) / 300);
  return out;
}

const clamp = (x: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, x));
