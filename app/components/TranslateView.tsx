'use client';

import { useEffect, useState } from 'react';
import { useApp } from '../hooks/useApp';
import { useGlove } from '../hooks/useGlove';
import { useProfiles } from '../hooks/useProfiles';
import { useTranslator } from '../hooks/useTranslator';
import { activeFingers } from '../lib/sensors';
import { DemoPad } from './DemoPad';
import { HandViz } from './HandViz';
import { Key } from './Key';
import { QuickBar } from './MessageBar';

/** The main screen: sign with the glove, see and hear the translation. */
export function TranslateView({ onShow, goSigns }: { onShow: () => void; goSigns: () => void }) {
  const { status, startDemo } = useGlove();
  const { active } = useProfiles();
  const { sentence, tokens, last, live, undo, clear, speakSentence } = useTranslator();
  const { settings } = useApp();
  const hi = settings.lang === 'hi';
  const connected = status === 'connected';
  const ready = connected && !!active?.calibrated && (active?.signs.some((s) => s.samples.length > 0) ?? false);

  return (
    <div className="grid gap-3">
      {/* What the person is saying — large, for everyone in the room. */}
      <section aria-label="Translation" className="card grid gap-3 p-4">
        <p aria-live="polite" className="min-h-[2.6em] text-[clamp(1.6rem,6vw,2.6rem)] font-extrabold leading-tight tracking-tight break-words">
          {sentence || (
            <span className="font-semibold text-[var(--muted)]">
              {ready ? (hi ? 'इशारा कीजिए…' : 'Start signing…') : hi ? 'अनुवाद यहाँ दिखेगा' : 'The translation appears here'}
            </span>
          )}
        </p>
        <LastSign last={last} />
        <div className="grid grid-cols-[2fr_1fr_1fr_1fr] gap-2">
          <Key label="Speak sentence" variant="accent" className="py-3.5 text-[1.05em]" onActivate={speakSentence}>
            🔊 {hi ? 'बोलें' : 'Speak'}
          </Key>
          <Key label="Show to the other person" variant="soft" className="py-2" onActivate={onShow}>
            <span aria-hidden className="block text-[1.2em] leading-none">🪧</span><span className="text-[0.72em]">{hi ? 'दिखाएँ' : 'Show'}</span>
          </Key>
          <Key label="Undo last sign" variant="soft" className={`py-2 ${tokens.length ? '' : 'opacity-50'}`} onActivate={undo}>
            <span aria-hidden className="block text-[1.2em] leading-none">↶</span><span className="text-[0.72em]">{hi ? 'वापस' : 'Undo'}</span>
          </Key>
          <Key label="Clear sentence" variant="soft" className={`py-2 ${tokens.length ? '' : 'opacity-50'}`} onActivate={clear}>
            <span aria-hidden className="block text-[1.2em] leading-none">✕</span><span className="text-[0.72em]">{hi ? 'साफ़' : 'Clear'}</span>
          </Key>
        </div>
      </section>

      {!connected ? (
        <Setup
          icon="🧤"
          title="Connect the glove"
          text="Tap “Connect glove” at the top. No glove yet? Try the demo glove — it behaves like the real one."
          action={{ label: '✨ Use demo glove', run: startDemo }}
        />
      ) : !active?.calibrated || !active.signs.some((s) => s.samples.length) ? (
        <Setup
          icon="✋"
          title={!active?.calibrated ? 'Calibrate and teach signs' : 'Teach the first signs'}
          text="GestureTalk learns this person’s own signs — no sign language needed. Yes, No and Help take about a minute."
          action={{ label: 'Go to Signs', run: goSigns }}
        />
      ) : null}

      {connected && (
        <section className="card p-4" aria-label="Glove sensors">
          <HandViz live={live} inactive={active ? activeFingers(active.calibration).map((a) => !a) : []} />
        </section>
      )}

      <DemoPad />

      <div>
        <p className="mb-2 text-[0.82em] font-semibold text-[var(--muted)]">{hi ? 'या छूकर' : 'Or by touch'}</p>
        <QuickBar />
      </div>
    </div>
  );
}

function Setup({ icon, title, text, action }: { icon: string; title: string; text: string; action: { label: string; run: () => void } }) {
  return (
    <section className="card flex flex-wrap items-center gap-4 border-[var(--accent)] p-4">
      <span aria-hidden className="text-[2.4rem]">{icon}</span>
      <div className="min-w-0 flex-1">
        <h2 className="text-[1.1em] font-bold">{title}</h2>
        <p className="text-[0.92em] text-[var(--muted)]">{text}</p>
      </div>
      <button type="button" className="key key--accent px-5 py-3" onClick={action.run}>{action.label}</button>
    </section>
  );
}

/** Shows the most recent recognition for a few seconds: what was understood and how sure. */
function LastSign({ last }: { last: ReturnType<typeof useTranslator>['last'] }) {
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    if (!last) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- show briefly after each recognition
    setVisible(true);
    const t = setTimeout(() => setVisible(false), 3500);
    return () => clearTimeout(t);
  }, [last]);
  if (!last || !visible) return <div className="h-8" aria-hidden />;
  return (
    <div key={last.at} className="fade-in flex h-8 items-center gap-2 text-[0.9em]" role="status">
      {last.sign ? (
        <>
          <span className="rounded-full bg-[var(--tint-needs)] px-3 py-1 font-semibold">✓ {last.sign.output}</span>
          <span className="text-[var(--muted)] tabular-nums">{Math.round(last.confidence * 100)}% sure</span>
        </>
      ) : (
        <span className="rounded-full bg-[var(--surface-2)] px-3 py-1 text-[var(--muted)]">Sign not recognised — try again</span>
      )}
    </div>
  );
}
