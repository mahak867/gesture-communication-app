// The firmware (C++) and the app (TypeScript) must agree on every byte of a
// sensor frame. Golden vectors are produced by the firmware's own packing code:
//   make -C hardware/glove/firmware/test
import vectors from '../hardware/glove/firmware/test/vectors.json';
import { encodeFrame, parseFrame } from '../app/lib/sensors';

describe('firmware ↔ app frame compatibility', () => {
  it('has vectors', () => expect(vectors.vectors.length).toBeGreaterThanOrEqual(3));

  vectors.vectors.forEach((v, i) => {
    it(`decodes firmware vector ${i} exactly`, () => {
      const f = parseFrame(new DataView(new Uint8Array(v.bytes).buffer))!;
      expect(f.flex).toEqual(v.flex);
      expect(f.accel.map((g) => Math.round(g * 1000))).toEqual(v.accelMg);
      expect(f.gyro).toEqual(v.gyroDiv8.map((d) => d * 8));
      expect(f.button).toBe(v.button);
      expect(f.seq).toBe(v.seq);
    });

    it(`app encoder reproduces firmware vector ${i} byte-for-byte`, () => {
      const bytes = new Uint8Array(
        encodeFrame({
          flex: v.flex as [number, number, number, number, number],
          accel: v.accelMg.map((m) => m / 1000) as [number, number, number],
          gyro: v.gyroDiv8.map((d) => d * 8) as [number, number, number],
          button: v.button,
          seq: v.seq,
        }).buffer,
      );
      expect([...bytes]).toEqual(v.bytes);
    });
  });
});
