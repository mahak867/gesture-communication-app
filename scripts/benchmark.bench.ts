// Recognition benchmark on the demo-glove simulator.
// Run: npm run benchmark   → writes docs/benchmark.json and prints a table.
// NOTE: simulated hands, not patient data. It measures the pipeline's behaviour
// under controlled noise and tremor; real-world accuracy must come from field trials.
import { writeFileSync } from 'node:fs';
import { classify, resample, Segmenter, type Seq, type Template } from '../app/lib/recognizer';
import { features } from '../app/lib/sensors';
import { DemoGlove, SHAPES, SIM_CALIBRATION } from '../app/lib/simulator';

function segments(tremor: number, ids: string[], holdBase = 700): Seq[] {
  const g = new DemoGlove(() => {});
  g.tremor = tremor;
  let rest = features(g.next(), SIM_CALIBRATION);
  for (let i = 0; i < 30; i++) rest = features(g.next(), SIM_CALIBRATION);
  ids.forEach((id, i) => g.perform(SHAPES.find((s) => s.id === id)!, holdBase + ((i * 137) % 500)));
  const seg = new Segmenter(rest);
  const out: Seq[] = [];
  for (let i = 0; i < ids.length * 120 + 120; i++) {
    const s = seg.push(features(g.next(), SIM_CALIBRATION));
    if (s) out.push(s);
  }
  return out;
}

const TRAIN = 4;
const TEST = 15;
const rows: Record<string, number | string>[] = [];

it('benchmark', () => {
  for (const [label, tremor] of [['steady', 0.1], ['mild tremor', 0.5], ['strong tremor', 1.0]] as const) {
    const ids = SHAPES.map((s) => s.id);
    const heldOut = 'pinch';
    const taught = ids.filter((i) => i !== heldOut);
    const templates: Template[] = taught.map((id) => ({ id, samples: segments(tremor, Array(TRAIN).fill(id)).map((s) => resample(s)) }));

    let correct = 0, wrong = 0, missed = 0, n = 0, segErrors = 0, ms = 0;
    for (const id of taught) {
      const segs = segments(tremor, Array(TEST).fill(id));
      segErrors += Math.abs(segs.length - TEST);
      for (const s of segs) {
        const t0 = performance.now();
        const m = classify(s, templates);
        ms += performance.now() - t0;
        n++;
        if (m.id === id) correct++;
        else if (m.id === null) missed++;
        else wrong++;
      }
    }
    const unk = segments(tremor, Array(TEST).fill(heldOut));
    const falseAccept = unk.filter((s) => classify(s, templates).id !== null).length;

    rows.push({
      condition: label,
      signs: taught.length,
      trainPerSign: TRAIN,
      trials: n,
      accuracy: +(correct / n).toFixed(3),
      wrongSign: +(wrong / n).toFixed(3),
      notRecognised: +(missed / n).toFixed(3),
      untaughtRejected: +(1 - falseAccept / unk.length).toFixed(3),
      segmentationErrors: segErrors,
      msPerSign: +(ms / n).toFixed(2),
    });
  }
  writeFileSync('docs/benchmark.json', JSON.stringify({ generated: new Date().toISOString(), note: 'Simulated demo-glove hands (scripts/benchmark.bench.ts). Not patient data.', rows }, null, 2));
  console.table(rows);
}, 120000);
