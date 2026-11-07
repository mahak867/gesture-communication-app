// Demo glove: produces realistic raw frames so the whole platform can be
// tried, taught and tested without hardware. Hand shapes are smoothly
// interpolated with sensor noise and slight tremor.

import { FRAME_HZ, type Calibration, type Frame } from './sensors';

export interface Shape {
  id: string;
  icon: string;
  label: string;
  bend: [number, number, number, number, number]; // 0 relaxed .. 1 full bend
  /** Gravity direction in the glove's frame. */
  gravity: [number, number, number];
  /** Optional wrist shake while the shape is held (movement signs). */
  wave?: boolean;
}

const FLAT: [number, number, number] = [0, 0, 1];

export const SHAPES: Shape[] = [
  { id: 'fist', icon: '✊', label: 'Fist', bend: [0.9, 1, 1, 1, 1], gravity: FLAT },
  { id: 'thumb', icon: '👍', label: 'Thumb up', bend: [0, 1, 1, 1, 1], gravity: [0, 1, 0] },
  { id: 'thumbdown', icon: '👎', label: 'Thumb down', bend: [0, 1, 1, 1, 1], gravity: [0, -1, 0] },
  { id: 'point', icon: '☝️', label: 'Point', bend: [0.8, 0, 1, 1, 1], gravity: FLAT },
  { id: 'two', icon: '✌️', label: 'Two fingers', bend: [0.8, 0, 0, 1, 1], gravity: FLAT },
  { id: 'ily', icon: '🤟', label: 'I-L-Y', bend: [0, 0, 1, 1, 0], gravity: FLAT },
  { id: 'pinch', icon: '🤏', label: 'Pinch', bend: [0.5, 0.6, 0.1, 0.1, 0.1], gravity: FLAT },
  { id: 'wave', icon: '👋', label: 'Wave', bend: [0.1, 0.1, 0.1, 0.1, 0.1], gravity: [0.7, 0, 0.7], wave: true },
];

export const SIM_CALIBRATION: Calibration = {
  relaxed: [1300, 1250, 1220, 1260, 1300],
  bent: [2300, 2450, 2500, 2400, 2250],
};

type Phase = { target: Shape | null; until: number };

export class DemoGlove {
  private bend = [0.05, 0.05, 0.05, 0.05, 0.05];
  private gravity: [number, number, number] = [0, 0, 1];
  private queue: Phase[] = [];
  private t = 0;
  private seq = 0;
  private timer: ReturnType<typeof setInterval> | null = null;
  /** 0 = steady, 1 = strong tremor. */
  tremor = 0.15;
  button = false;

  constructor(private onFrame: (f: Frame) => void) {}

  start() {
    if (this.timer) return;
    this.timer = setInterval(() => this.onFrame(this.next()), 1000 / FRAME_HZ);
  }

  stop() {
    if (this.timer) clearInterval(this.timer);
    this.timer = null;
  }

  /** Make a shape: move in, hold, relax — like a person signing. */
  perform(shape: Shape, holdMs = 900) {
    const now = this.t;
    const last = this.queue.length ? this.queue[this.queue.length - 1].until : now;
    this.queue.push({ target: shape, until: Math.max(now, last) + 250 + holdMs }, { target: null, until: Math.max(now, last) + 250 + holdMs + 700 });
  }

  /** Advance one frame (exposed for tests: no timers needed). */
  next(): Frame {
    this.t += 1000 / FRAME_HZ;
    while (this.queue.length && this.queue[0].until < this.t) this.queue.shift();
    const target = this.queue[0]?.target ?? null;
    const goal = target ? target.bend : [0.05, 0.05, 0.05, 0.05, 0.05];
    const g = target ? target.gravity : ([0, 0, 1] as [number, number, number]);
    const k = 0.18; // smoothing: hand takes ~250 ms to change shape
    this.bend = this.bend.map((b, i) => b + (goal[i] - b) * k);
    this.gravity = this.gravity.map((v, i) => v + (g[i] - v) * k) as [number, number, number];

    const shake = target?.wave ? Math.sin(this.t / 90) * 0.5 : 0;
    const tremor = () => (Math.random() - 0.5) * 0.04 * (1 + this.tremor * 4);
    const flex = this.bend.map((b, i) => {
      const cal = SIM_CALIBRATION;
      const v = b + tremor();
      return cal.relaxed[i] + (cal.bent[i] - cal.relaxed[i]) * v + (Math.random() - 0.5) * 12;
    }) as Frame['flex'];
    const gx = this.gravity[0] + shake * 0.6;
    const accel: Frame['accel'] = [gx + tremor(), this.gravity[1] + tremor(), this.gravity[2] + tremor()];
    const gyro: Frame['gyro'] = [shake * 260 + tremor() * 200, tremor() * 200, tremor() * 200];
    return { flex, accel, gyro, button: this.button, seq: this.seq++ & 0x7f };
  }
}
