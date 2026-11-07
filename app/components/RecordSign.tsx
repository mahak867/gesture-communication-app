'use client';

import { useEffect, useRef, useState } from 'react';
import { useGlove } from '../hooks/useGlove';
import { useProfiles } from '../hooks/useProfiles';
import { useTranslator } from '../hooks/useTranslator';
import { classify, dtw, resample, type Seq } from '../lib/recognizer';
import { SAMPLES_PER_SIGN, type Sign } from '../lib/profiles';
import { DemoPad } from './DemoPad';
import { HandViz } from './HandViz';
import { Sheet } from './Sheet';

/**
 * Teach a sign by doing it a few times. Each attempt is checked against the
 * others (inconsistent attempt) and against the person's other signs (too
 * similar), so problems are caught while recording, not in daily use.
 */
export function RecordSign({ sign, onClose }: { sign: Sign; onClose: () => void }) {
  const { active, updateSign } = useProfiles();
  const { setCapture, live } = useTranslator();
  const { buzz, status } = useGlove();
  const [samples, setSamples] = useState<Seq[]>([]);
  const [warning, setWarning] = useState('');
  const target = Math.max(SAMPLES_PER_SIGN, sign.samples.length ? 2 : SAMPLES_PER_SIGN);
  const adding = sign.samples.length > 0;

  const samplesRef = useRef<Seq[]>([]);
  const commit = (next: Seq[]) => {
    samplesRef.current = next;
    setSamples(next);
  };

  useEffect(() => {
    setCapture((seg) => {
      const prev = samplesRef.current;
      if (prev.length >= target) return;
      const s = resample(seg);
      const all = [...sign.samples, ...prev];
      let warn = '';
      if (all.length >= 2) {
        const nearest = Math.min(...all.map((x) => dtw(s, x)));
        const spread = dtw(all[0], all[all.length - 1]);
        if (nearest > Math.max(0.25, spread * 3)) warn = 'That attempt looked quite different from the others. Keep it only if it is a real way you make this sign.';
      }
      const others = (active?.signs ?? []).filter((o) => o.id !== sign.id && o.samples.length > 0);
      const clash = classify(s, others.map((o) => ({ id: o.id, samples: o.samples })), 1.3);
      if (clash.id) warn = `This looks a lot like “${others.find((o) => o.id === clash.id)?.output}”. Try a more different movement, or they may get mixed up.`;
      setWarning(warn);
      buzz(80);
      commit([...prev, s]);
    });
    return () => setCapture(null);
  }, [setCapture, sign, active, target, buzz]);

  const done = samples.length >= target;
  const save = () => {
    updateSign(sign.id, { samples: [...sign.samples, ...samples].slice(-8) });
    onClose();
  };

  return (
    <Sheet title={`${adding ? 'Add practice to' : 'Teach'} “${sign.output}”`} onClose={onClose} wide>
      <div className="grid gap-4">
        <p className="text-[0.95em]">
          Do the sign <b>{target} times</b>. Start from a relaxed hand, make the sign, then either hold it still for a moment or
          relax again. Make it the way that is comfortable — it doesn’t need to be “correct” sign language.
        </p>
        {status !== 'connected' && <p role="alert" className="rounded-xl bg-[var(--tint-feel)] p-3">Connect the glove (or the demo glove) first.</p>}

        <div className="card p-4"><HandViz live={live} /></div>

        <div className="flex items-center justify-center gap-3" aria-live="polite" aria-label={`${samples.length} of ${target} recorded`}>
          {Array.from({ length: target }, (_, i) => (
            <span
              key={i}
              className={`grid h-12 w-12 place-items-center rounded-full text-[1.2em] font-bold transition-colors ${i < samples.length ? 'bg-[var(--yes)] text-white' : 'bg-[var(--surface-2)] text-[var(--muted)] ring-1 ring-[var(--line)]'}`}
            >
              {i < samples.length ? '✓' : i + 1}
            </span>
          ))}
        </div>
        {warning && <p role="status" className="rounded-xl bg-[var(--tint-feel)] p-3 text-[0.92em]">⚠️ {warning}</p>}

        <DemoPad compact />

        <div className="grid grid-cols-3 gap-2">
          <button type="button" className="key py-3" onClick={onClose}>Cancel</button>
          <button type="button" className="key py-3" disabled={!samples.length} onClick={() => { commit(samplesRef.current.slice(0, -1)); setWarning(''); }}>
            Undo last
          </button>
          <button type="button" className="key key--accent py-3" disabled={!done} onClick={save}>
            Save
          </button>
        </div>
      </div>
    </Sheet>
  );
}
