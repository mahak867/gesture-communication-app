import { classify, dtw, evaluate, resample, Segmenter, type Seq, type Template } from '../app/lib/recognizer';
import { encodeFrame, features, parseFrame } from '../app/lib/sensors';
import { DemoGlove, SHAPES, SIM_CALIBRATION } from '../app/lib/simulator';

const shape = (id: string) => SHAPES.find((s) => s.id === id)!;

/** Run the demo glove through the real segmenter and collect segments. */
function captureSegments(glove: DemoGlove, frames: number, perform: () => void = () => {}): Seq[] {
  // Measure the relaxed hand first (as calibration does), then sign.
  let rest = features(glove.next(), SIM_CALIBRATION);
  for (let i = 0; i < 30; i++) rest = features(glove.next(), SIM_CALIBRATION);
  perform();
  const seg = new Segmenter(rest);
  const out: Seq[] = [];
  for (let i = 0; i < frames; i++) {
    const s = seg.push(features(glove.next(), SIM_CALIBRATION));
    if (s) out.push(s);
  }
  return out;
}

function record(id: string, n: number): Seq[] {
  const g = new DemoGlove(() => {});
  return captureSegments(g, n * 120 + 100, () => {
    for (let i = 0; i < n; i++) g.perform(shape(id), 700 + i * 120);
  }).map((s) => resample(s));
}

describe('frames', () => {
  it('round-trips the 20-byte BLE packet', () => {
    const f = new DemoGlove(() => {}).next();
    const back = parseFrame(encodeFrame({ ...f, button: true, seq: 99 }))!;
    back.flex.forEach((v, i) => expect(Math.abs(v - f.flex[i])).toBeLessThanOrEqual(1));
    expect(back.accel[2]).toBeCloseTo(f.accel[2], 2);
    expect(back.button).toBe(true);
    expect(back.seq).toBe(99);
    expect(parseFrame(new DataView(new ArrayBuffer(10)))).toBeNull();
  });
});

describe('dtw / resample', () => {
  it('resamples to a fixed length and keeps endpoints', () => {
    const r = resample([[0, 0, 0, 0, 0, 0, 0, 0, 0], [1, 1, 1, 1, 1, 1, 1, 1, 1]], 5);
    expect(r).toHaveLength(5);
    expect(r[2][0]).toBeCloseTo(0.5);
  });
  it('is zero for identical sequences and tolerates time shifts', () => {
    const a = resample(record('point', 1)[0]);
    expect(dtw(a, a)).toBe(0);
    const shifted = [...a.slice(2), a[a.length - 1], a[a.length - 1]];
    expect(dtw(a, shifted)).toBeLessThan(0.1);
  });
});

describe('segmenter', () => {
  it('emits exactly one segment per performed sign', () => {
    const g = new DemoGlove(() => {});
    expect(captureSegments(g, 400, () => ['fist', 'point', 'two'].forEach((s) => g.perform(shape(s))))).toHaveLength(3);
  });
  it('stays quiet while the hand rests', () => {
    expect(captureSegments(new DemoGlove(() => {}), 300)).toHaveLength(0);
  });
});

describe('few-shot recognition', () => {
  const ids = ['fist', 'point', 'thumb', 'thumbdown', 'two', 'wave'];
  const templates: Template[] = ids.map((id) => ({ id, samples: record(id, 4) }));

  it('records 4 samples per sign', () => {
    templates.forEach((t) => expect(t.samples).toHaveLength(4));
  });

  it('recognises new performances of every taught sign', () => {
    for (const id of ids) {
      const seg = record(id, 1)[0];
      expect(classify(seg, templates).id).toBe(id);
    }
  });

  it('tells thumb up from thumb down using orientation', () => {
    expect(classify(record('thumbdown', 1)[0], templates).id).toBe('thumbdown');
  });

  it('rejects a sign that was never taught', () => {
    expect(classify(record('ily', 1)[0], templates.filter((t) => t.id !== 'ily')).id).toBeNull();
  });

  it('leave-one-out evaluation reports high accuracy', () => {
    const r = evaluate(templates);
    const correct = Object.values(r).reduce((a, b) => a + b.correct, 0);
    const total = Object.values(r).reduce((a, b) => a + b.total, 0);
    expect(correct / total).toBeGreaterThanOrEqual(0.9);
  });
});
