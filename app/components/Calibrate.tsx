'use client';

import { useEffect, useRef, useState } from 'react';
import { useGlove } from '../hooks/useGlove';
import { useProfiles } from '../hooks/useProfiles';
import { activeFingers, features, FINGERS, sensorFaults, type Calibration, type Frame } from '../lib/sensors';
import { SHAPES } from '../lib/simulator';
import { Sheet } from './Sheet';

type Step = 'intro' | 'relaxed' | 'bent' | 'done';
const CAPTURE_MS = 3000;

const mean = (rows: number[][]) => rows[0].map((_, i) => rows.reduce((a, r) => a + r[i], 0) / rows.length);

/**
 * Two-step calibration on the wearer: relaxed hand, then their fullest
 * comfortable bend. Works with partial movement — fingers that don't move
 * are detected and ignored instead of breaking recognition.
 */
export function Calibrate({ onClose }: { onClose: () => void }) {
  const { subscribe, demo } = useGlove();
  const { active, update } = useProfiles();
  const [step, setStep] = useState<Step>('intro');
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<Calibration | null>(null);
  const relaxedFrames = useRef<Frame[]>([]);

  useEffect(() => {
    if (step !== 'relaxed' && step !== 'bent') return;
    const frames: Frame[] = [];
    const start = performance.now();
    if (step === 'bent' && demo) demo.perform(SHAPES[0], CAPTURE_MS + 600);
    const settle = 600; // ignore the first moments while the hand gets into position
    const unsub = subscribe((f) => {
      const t = performance.now() - start;
      if (t > settle) frames.push(f);
      setProgress(Math.min(1, t / (CAPTURE_MS + settle)));
      if (t < CAPTURE_MS + settle || frames.length < 10) return;
      unsub();
      if (step === 'relaxed') {
        relaxedFrames.current = frames;
        setStep('bent');
      } else {
        const relaxed = mean(relaxedFrames.current.map((x) => x.flex));
        // Use the most-bent part of the capture: the 80th percentile of distance from relaxed.
        const bent = relaxed.map((r, i) => {
          const vals = frames.map((x) => x.flex[i]).sort((a, b) => Math.abs(a - r) - Math.abs(b - r));
          return vals[Math.floor(vals.length * 0.8)];
        });
        setResult({ relaxed, bent });
        setStep('done');
      }
    });
    return unsub;
  }, [step, subscribe, demo]);

  const save = () => {
    if (!result) return;
    const act = activeFingers(result);
    const rest = mean(relaxedFrames.current.map((f) => features(f, result, act)));
    update({ calibration: result, rest, calibrated: true });
    onClose();
  };

  const act = result ? activeFingers(result) : [];
  const faults = result ? sensorFaults(result) : [];

  return (
    <Sheet title={`Calibrate glove${active ? ` for ${active.name}` : ''}`} onClose={onClose}>
      {step === 'intro' && (
        <div className="grid gap-4">
          <p>Takes about 10 seconds. Do it once per person, and again if the glove is put on differently.</p>
          <ol className="grid gap-2">
            <li className="rounded-xl bg-[var(--surface-2)] p-3"><b>1.</b> Rest the hand, fully relaxed.</li>
            <li className="rounded-xl bg-[var(--surface-2)] p-3"><b>2.</b> Bend the fingers as far as is comfortable — a gentle fist. Only bend what moves; that’s fine.</li>
          </ol>
          <button type="button" className="key key--accent py-4" onClick={() => setStep('relaxed')}>Start</button>
        </div>
      )}

      {(step === 'relaxed' || step === 'bent') && (
        <div className="grid place-items-center gap-4 py-4 text-center">
          <span aria-hidden className="text-[4rem]">{step === 'relaxed' ? '🖐️' : '✊'}</span>
          <p className="text-[1.4em] font-bold" aria-live="assertive">
            {step === 'relaxed' ? 'Relax the hand…' : 'Now bend the fingers…'}
          </p>
          <div className="h-3 w-full overflow-hidden rounded-full bg-[var(--surface-2)]">
            <span className="block h-full origin-left rounded-full bg-[var(--accent)]" style={{ transform: `scaleX(${progress})` }} />
          </div>
        </div>
      )}

      {step === 'done' && result && (
        <div className="grid gap-4">
          <ul className="grid grid-cols-5 gap-2 text-center">
            {FINGERS.map((f, i) => (
              <li key={f} className={`rounded-xl p-2 ${act[i] ? 'bg-[var(--tint-needs)]' : 'bg-[var(--surface-2)] text-[var(--muted)]'}`}>
                <span className="block text-[0.8em] capitalize">{f}</span>
                <span className="text-[1.2em]">{act[i] ? '✓' : '—'}</span>
              </li>
            ))}
          </ul>
          <p className="text-[0.92em] text-[var(--muted)]">
            {act.every(Boolean)
              ? 'All five fingers move well.'
              : `${act.filter(Boolean).length} of 5 fingers move enough to use. The others are ignored — signs will use orientation and the fingers that move.`}
          </p>
          {faults.some(Boolean) && (
            <p role="alert" className="rounded-xl bg-[var(--tint-pain)] p-3">
              ⚠️ The {FINGERS.filter((_, i) => faults[i]).join(', ')} sensor reads at its limit — it may be unplugged or broken. Check the cable and solder joints.
            </p>
          )}
          {act.filter(Boolean).length === 0 && (
            <p role="alert" className="rounded-xl bg-[var(--tint-pain)] p-3">No finger movement detected. Check the glove fit and sensor wiring, then try again. Wrist movements alone can still be taught as signs.</p>
          )}
          <div className="grid grid-cols-2 gap-2">
            <button type="button" className="key py-3" onClick={() => { setResult(null); setStep('relaxed'); }}>Redo</button>
            <button type="button" className="key key--accent py-3" onClick={save}>Save</button>
          </div>
        </div>
      )}
    </Sheet>
  );
}
