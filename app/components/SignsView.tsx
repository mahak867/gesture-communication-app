'use client';

import { useMemo, useState } from 'react';
import { useApp } from '../hooks/useApp';
import { useProfiles } from '../hooks/useProfiles';
import { evaluate } from '../lib/recognizer';
import { STARTER_SIGNS, type Sign, type SignAction } from '../lib/profiles';
import { Calibrate } from './Calibrate';
import { RecordSign } from './RecordSign';
import { Sheet } from './Sheet';

const ACTION_LABEL: Record<SignAction, string> = {
  say: 'Word / phrase',
  speak: 'Speak the sentence',
  delete: 'Delete last word',
  clear: 'Clear sentence',
  help: 'Emergency — alarm',
  next: 'Move highlight (control the boards)',
  select: 'Press highlighted button',
};

export function SignsView() {
  const { active, addSign, removeSign, updateSign } = useProfiles();
  const { settings } = useApp();
  const [recording, setRecording] = useState<Sign | null>(null);
  const [adding, setAdding] = useState(false);
  const [calibrating, setCalibrating] = useState(false);

  const signs = useMemo(() => active?.signs ?? [], [active]);
  const report = useMemo(
    () => evaluate(signs.map((s) => ({ id: s.id, samples: s.samples })), settings.strictness),
    [signs, settings.strictness],
  );
  if (!active) return null;

  const tested = Object.values(report).filter((r) => r.total > 0);
  const overall = tested.length ? Math.round((100 * tested.reduce((a, r) => a + r.correct, 0)) / tested.reduce((a, r) => a + r.total, 0)) : null;
  const nameOf = (id: string) => signs.find((s) => s.id === id)?.output ?? id;

  const create = (s: Omit<Sign, 'id' | 'createdAt' | 'samples'>) => {
    const sign = addSign({ ...s, samples: [] });
    setAdding(false);
    setRecording(sign);
  };

  return (
    <div className="grid gap-4">
      <section className="card grid gap-3 p-4 sm:grid-cols-[1fr_auto_auto] sm:items-center">
        <div className="min-w-0">
          <h2 className="text-[1.15em] font-bold">{active.name}’s signs</h2>
          <p className="text-[0.88em] text-[var(--muted)]">
            {signs.length} signs · {active.calibrated ? 'glove calibrated' : 'glove not calibrated yet'}
            {overall != null && ` · self-test ${overall}%`}
          </p>
        </div>
        <div className="grid grid-cols-2 gap-2 sm:contents">
        <button type="button" className={`key px-4 py-3 ${active.calibrated ? '' : 'key--accent'}`} onClick={() => setCalibrating(true)}>
          {active.calibrated ? 'Recalibrate' : '① Calibrate glove'}
        </button>
        <button type="button" className={`key px-4 py-3 ${active.calibrated ? 'key--accent' : ''}`} onClick={() => (active.calibrated ? setAdding(true) : setCalibrating(true))}>
          ＋ Teach a sign
        </button>
        </div>
      </section>

      {signs.length === 0 ? (
        <div className="card grid place-items-center gap-3 p-8 text-center">
          <span aria-hidden className="text-[3rem]">✋</span>
          <p className="max-w-md">
            Every person moves differently, so GestureTalk learns <b>your own</b> signs. Start with <b>Yes</b>, <b>No</b> and <b>Help</b> — each takes about 20 seconds to teach.
          </p>
          <button type="button" className="key key--accent px-6 py-3" onClick={() => (active.calibrated ? setAdding(true) : setCalibrating(true))}>Teach the first sign</button>
        </div>
      ) : (
        <ul className="grid gap-2 sm:grid-cols-2">
          {signs.map((s) => {
            const r = report[s.id];
            const acc = r && r.total ? Math.round((100 * r.correct) / r.total) : null;
            const worst = r && Object.entries(r.confusedWith).sort((a, b) => b[1] - a[1])[0];
            return (
              <li key={s.id} className={`card grid gap-2 p-3 ${s.urgent ? 'border-[var(--urgent)]' : ''}`}>
                <div className="flex items-start gap-2">
                  <div className="min-w-0 flex-1">
                    <p className="text-[1.1em] font-bold break-words">{s.output}</p>
                    <p className="text-[0.8em] text-[var(--muted)]">
                      {ACTION_LABEL[s.action]}{s.instant && s.action === 'say' ? ' · speaks instantly' : ''} · {s.samples.length} samples
                    </p>
                  </div>
                  <Quality acc={acc} samples={s.samples.length} />
                </div>
                {worst && acc != null && acc < 100 && (
                  <p className="rounded-lg bg-[var(--tint-feel)] px-2 py-1 text-[0.8em]">
                    Sometimes read as {worst[0] === '(not recognised)' ? 'nothing' : `“${nameOf(worst[0])}”`} — add practice or make it more distinct.
                  </p>
                )}
                <div className="grid grid-cols-3 gap-2 text-[0.85em]">
                  <button type="button" className="key py-2" onClick={() => setRecording(s)}>{s.samples.length ? '＋ Practice' : 'Record'}</button>
                  {s.action === 'say' ? (
                    <button type="button" className="key py-2" aria-pressed={s.instant} onClick={() => updateSign(s.id, { instant: !s.instant })}>
                      {s.instant ? 'Instant ✓' : 'Instant off'}
                    </button>
                  ) : <span />}
                  <button type="button" className="key key--ghost py-2" onClick={() => confirm(`Delete “${s.output}”?`) && removeSign(s.id)}>Delete</button>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      <p className="text-[0.82em] text-[var(--muted)]">
        Self-test: each recorded attempt is checked against the others. Signs below 80% need more practice or a more distinct movement.
        As abilities change, add new practice — older samples are replaced automatically, and with “learn from use” on, recognised signs keep teaching the glove.
      </p>

      {adding && <AddSign existing={signs} onCreate={create} onClose={() => setAdding(false)} />}
      {recording && <RecordSign sign={recording} onClose={() => setRecording(null)} />}
      {calibrating && <Calibrate onClose={() => setCalibrating(false)} />}
    </div>
  );
}

function Quality({ acc, samples }: { acc: number | null; samples: number }) {
  if (samples === 0) return <span className="rounded-full bg-[var(--tint-feel)] px-2 py-1 text-[0.75em] font-bold">Not taught</span>;
  if (acc == null) return <span className="rounded-full bg-[var(--surface-2)] px-2 py-1 text-[0.75em] font-bold">Needs 2+</span>;
  const tone = acc >= 80 ? 'bg-[var(--yes)] text-white' : acc >= 50 ? 'bg-[var(--focus)] text-black' : 'bg-[var(--urgent)] text-white';
  return <span className={`rounded-full px-2 py-1 text-[0.75em] font-bold tabular-nums ${tone}`}>{acc}%</span>;
}

function AddSign({ existing, onCreate, onClose }: {
  existing: Sign[];
  onCreate: (s: Omit<Sign, 'id' | 'createdAt' | 'samples'>) => void;
  onClose: () => void;
}) {
  const { settings } = useApp();
  const [text, setText] = useState('');
  const [action, setAction] = useState<SignAction>('say');
  const [instant, setInstant] = useState(false);
  const have = new Set(existing.map((s) => s.output.toLowerCase()));
  const starters = STARTER_SIGNS.filter((s) => !have.has((settings.lang === 'hi' ? s.hi : s.output).toLowerCase()));

  return (
    <Sheet title="Teach a sign" onClose={onClose} wide>
      {starters.length > 0 && (
        <>
          <h3 className="mb-2 font-bold">Suggested</h3>
          <div className="mb-5 grid gap-2 sm:grid-cols-2">
            {starters.map((s) => {
              const out = settings.lang === 'hi' ? s.hi : s.output;
              return (
                <button
                  key={s.output}
                  type="button"
                  className={`key flex flex-col items-start px-3 py-2.5 text-left ${s.urgent ? 'key--tint-pain' : ''}`}
                  onClick={() => onCreate({ output: out, action: s.action, instant: s.instant, urgent: s.urgent })}
                >
                  <span>{out}</span>
                  {s.tip && <span className="text-[0.75em] font-normal text-[var(--muted)]">{s.tip}</span>}
                </button>
              );
            })}
          </div>
        </>
      )}
      <h3 className="mb-2 font-bold">Your own</h3>
      <form
        className="grid gap-3"
        onSubmit={(e) => {
          e.preventDefault();
          if (action === 'say' && !text.trim()) return;
          onCreate({ output: text.trim() || ACTION_LABEL[action], action, instant: action === 'say' && instant, urgent: action === 'help' });
        }}
      >
        <label className="grid gap-1">
          <span className="text-[0.9em] font-semibold">What should it say?</span>
          <input
            className="min-h-12 rounded-xl border-[1.5px] border-[var(--line)] bg-[var(--surface-2)] px-3"
            value={text}
            maxLength={120}
            placeholder="e.g. “my daughter”, “turn me over”, “I love you”"
            onChange={(e) => setText(e.target.value)}
            enterKeyHint="done"
          />
        </label>
        <label className="grid gap-1">
          <span className="text-[0.9em] font-semibold">Type</span>
          <select className="min-h-12 rounded-xl border-[1.5px] border-[var(--line)] bg-[var(--surface-2)] px-3" value={action} onChange={(e) => setAction(e.target.value as SignAction)}>
            {(Object.keys(ACTION_LABEL) as SignAction[]).map((a) => <option key={a} value={a}>{ACTION_LABEL[a]}</option>)}
          </select>
        </label>
        {action === 'say' && (
          <label className="flex items-center gap-3">
            <input type="checkbox" className="h-6 w-6 accent-[var(--accent)]" checked={instant} onChange={(e) => setInstant(e.target.checked)} />
            Speak straight away (for whole phrases). Off = add to the sentence being built.
          </label>
        )}
        <button type="submit" className="key key--accent py-3">Next: record it</button>
      </form>
    </Sheet>
  );
}
