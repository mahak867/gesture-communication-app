// Personal sign recognition.
//
// People with ALS, stroke or cerebral palsy rarely produce textbook sign
// language handshapes, so instead of a fixed pretrained model we learn each
// person's own signs from a few examples (few-shot), the approach used by
// open glove projects such as SignSpeak and ESP32 k-NN gloves:
//
//   frames ─▶ Segmenter (finds one sign between rests / holds)
//          ─▶ resample to fixed length
//          ─▶ DTW nearest-neighbour against the person's recorded samples
//          ─▶ reject if too far from anything known (never guess)
//
// Pure TypeScript, no dependencies, runs in the browser in well under 5 ms.

import { FEATURES } from './sensors';

export type Seq = number[][]; // [time][feature]

/** Feature weights: finger bends carry most meaning, orientation some, motion a little. */
export const WEIGHTS = [1, 1, 1, 1, 1, 0.6, 0.6, 0.6, 0.4];
export const RESAMPLE_LEN = 24;

// ───────────────────────── Segmentation ─────────────────────────

export interface SegmenterOptions {
  /** Distance from rest that counts as "signing". */
  startThreshold: number;
  /** Below this the hand is considered back at rest. */
  endThreshold: number;
  /** Frames the hand must be still (but not at rest) to count as a held sign. */
  holdFrames: number;
  /** Movement over the last ~0.1 s (smoothed) below this counts as still. */
  stillThreshold: number;
  minFrames: number;
  maxFrames: number;
}

export const DEFAULT_SEGMENTER: SegmenterOptions = {
  startThreshold: 0.35,
  endThreshold: 0.2,
  holdFrames: 18, // ~0.35 s at 50 Hz
  stillThreshold: 0.07,
  minFrames: 8,
  maxFrames: 150, // 3 s
};

export function weightedDistance(a: number[], b: number[]): number {
  let s = 0;
  for (let i = 0; i < FEATURES; i++) {
    const d = (a[i] - b[i]) * WEIGHTS[i];
    s += d * d;
  }
  return Math.sqrt(s);
}

/** Distance from rest using only shape + orientation (motion alone shouldn't start a sign). */
function restDistance(x: number[], rest: number[]): number {
  let s = 0;
  for (let i = 0; i < 8; i++) {
    const d = (x[i] - rest[i]) * WEIGHTS[i];
    s += d * d;
  }
  return Math.sqrt(s);
}

type State = 'rest' | 'active' | 'holding';

/**
 * Streams feature frames and emits one segment per sign. A sign ends when the
 * hand returns to rest (movement signs) or holds still away from rest (shape
 * signs). After a held sign it waits for the hand to relax before listening
 * again, so one hold produces exactly one sign.
 */
export class Segmenter {
  private state: State = 'rest';
  private buf: Seq = [];
  private pre: Seq = [];
  private still = 0;
  private calm = 0;
  private over = 0;
  private smooth: number[] | null = null;
  private recent: Seq = [];
  private opts: SegmenterOptions;

  constructor(
    private rest: number[],
    opts: Partial<SegmenterOptions> = {},
  ) {
    this.opts = { ...DEFAULT_SEGMENTER, ...opts };
  }

  setRest(rest: number[]) {
    this.rest = rest;
  }

  get busy(): boolean {
    return this.state !== 'rest';
  }

  /** 0..1 how close a held shape is to being accepted (for UI feedback). */
  get holdProgress(): number {
    return this.state === 'active' ? Math.min(1, this.still / this.opts.holdFrames) : 0;
  }

  reset() {
    this.recent = this.recent.slice(-6);
    this.state = 'rest';
    this.buf = [];
    this.pre = [];
    this.still = this.calm = this.over = 0;
  }

  push(raw: number[]): Seq | null {
    const o = this.opts;
    // Low-pass filter: sensor noise and mild tremor must not look like movement.
    this.smooth = this.smooth ? this.smooth.map((v, i) => v + (raw[i] - v) * 0.35) : [...raw];
    const x = this.smooth;
    this.recent.push(x);
    if (this.recent.length > 6) this.recent.shift();
    const d = restDistance(x, this.rest);

    if (this.state === 'holding') {
      if (d < o.endThreshold) {
        if (++this.calm >= 5) this.reset();
      } else this.calm = 0;
      return null;
    }

    if (this.state === 'rest') {
      this.pre.push(x);
      if (this.pre.length > 5) this.pre.shift();
      if (d > o.startThreshold) {
        if (++this.over >= 3) {
          this.state = 'active';
          this.buf = [...this.pre];
          this.still = this.calm = 0;
        }
      } else this.over = 0;
      return null;
    }

    // active
    this.buf.push(x);
    const moved = this.recent.length >= 6 ? weightedDistance(x, this.recent[0]) : 1;
    this.still = moved < o.stillThreshold && d > o.startThreshold ? this.still + 1 : 0;
    this.calm = d < o.endThreshold ? this.calm + 1 : 0;

    if (this.still >= o.holdFrames) return this.finish('holding');
    if (this.calm >= 6) return this.finish('rest');
    if (this.buf.length >= o.maxFrames) return this.finish('holding');
    return null;
  }

  private finish(next: State): Seq | null {
    // Trim trailing rest/still frames so samples recorded at different speeds still align.
    const trim = next === 'rest' ? this.calm : Math.max(0, this.still - 4);
    const seg = this.buf.slice(0, Math.max(1, this.buf.length - trim));
    const enough = seg.length >= this.opts.minFrames;
    if (next === 'rest') this.reset();
    else {
      this.state = 'holding';
      this.buf = [];
      this.calm = 0;
    }
    return enough ? seg : null;
  }
}

// ───────────────────────── Matching ─────────────────────────

/** Linear resampling to a fixed number of frames. */
export function resample(seq: Seq, len = RESAMPLE_LEN): Seq {
  if (seq.length === 0) return [];
  if (seq.length === 1) return Array.from({ length: len }, () => [...seq[0]]);
  const out: Seq = [];
  for (let i = 0; i < len; i++) {
    const t = (i * (seq.length - 1)) / (len - 1);
    const a = Math.floor(t);
    const b = Math.min(seq.length - 1, a + 1);
    const w = t - a;
    out.push(seq[a].map((v, k) => v * (1 - w) + seq[b][k] * w));
  }
  return out;
}

/** Dynamic time warping with a Sakoe–Chiba band, normalised by path length. */
export function dtw(a: Seq, b: Seq, band = 4): number {
  const n = a.length;
  const m = b.length;
  const w = Math.max(band, Math.abs(n - m));
  const INF = Number.POSITIVE_INFINITY;
  let prev = new Array<number>(m + 1).fill(INF);
  let cur = new Array<number>(m + 1).fill(INF);
  prev[0] = 0;
  for (let i = 1; i <= n; i++) {
    cur.fill(INF);
    for (let j = Math.max(1, i - w); j <= Math.min(m, i + w); j++) {
      const cost = weightedDistance(a[i - 1], b[j - 1]);
      cur[j] = cost + Math.min(prev[j], cur[j - 1], prev[j - 1]);
    }
    [prev, cur] = [cur, prev];
  }
  return prev[m] / (n + m);
}

export interface Template {
  id: string;
  samples: Seq[]; // already resampled
}

export interface Match {
  id: string | null;
  distance: number;
  /** 0..1, how clearly the best sign beats the runner-up and the reject limit. */
  confidence: number;
  runnerUp: string | null;
}

/**
 * Reject limit for one sign: wider when the person's own samples vary more
 * (e.g. tremor), but never below `floor`. `strictness` 0.5 (lenient) .. 2 (strict).
 */
export function signLimit(samples: Seq[], strictness = 1, floor = 0.12): number {
  if (samples.length < 2) return floor * 2 / strictness;
  let sum = 0;
  let n = 0;
  for (let i = 0; i < samples.length; i++)
    for (let j = i + 1; j < samples.length; j++) {
      sum += dtw(samples[i], samples[j]);
      n++;
    }
  return Math.max(floor, (sum / n) * 2.2) / strictness;
}

export function classify(seg: Seq, templates: Template[], strictness = 1): Match {
  const q = resample(seg);
  const best = templates
    .filter((t) => t.samples.length > 0)
    .map((t) => ({
      id: t.id,
      d: Math.min(...t.samples.map((s) => dtw(q, s))),
      limit: signLimit(t.samples, strictness),
    }))
    .sort((x, y) => x.d - y.d);

  if (best.length === 0) return { id: null, distance: Infinity, confidence: 0, runnerUp: null };
  const [top, second] = best;
  const fit = Math.max(0, 1 - top.d / top.limit);
  const margin = second ? Math.min(1, (second.d - top.d) / Math.max(top.d, 1e-6)) : 1;
  const confidence = Math.round(fit * Math.min(1, 0.4 + margin) * 100) / 100;
  const accepted = top.d <= top.limit && confidence >= 0.15;
  return { id: accepted ? top.id : null, distance: top.d, confidence: accepted ? confidence : 0, runnerUp: second?.id ?? null };
}

/**
 * Leave-one-out check of the whole vocabulary: for every recorded sample, would
 * it be recognised as its own sign? Returns per-sign accuracy and confusions,
 * so carers can see which signs need re-recording or are too alike.
 */
export function evaluate(templates: Template[], strictness = 1) {
  const report: Record<string, { correct: number; total: number; confusedWith: Record<string, number> }> = {};
  for (const t of templates) {
    report[t.id] = { correct: 0, total: 0, confusedWith: {} };
    if (t.samples.length < 2) continue;
    t.samples.forEach((s, i) => {
      const others = templates.map((u) => (u.id === t.id ? { ...u, samples: u.samples.filter((_, k) => k !== i) } : u));
      const m = classify(s, others, strictness);
      report[t.id].total++;
      if (m.id === t.id) report[t.id].correct++;
      else {
        const k = m.id ?? '(not recognised)';
        report[t.id].confusedWith[k] = (report[t.id].confusedWith[k] ?? 0) + 1;
      }
    });
  }
  return report;
}
