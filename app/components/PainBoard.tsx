'use client';

import { useState } from 'react';
import { useApp } from '../hooks/useApp';
import { BODY_PARTS, PAIN_LEVELS, painSentence } from '../lib/vocab';
import { Key } from './Key';

/** Two steps: where (optional), then how much. Faces + numbers (Wong-Baker style). */
export function PainBoard() {
  const { settings, say } = useApp();
  const [part, setPart] = useState<string | undefined>();
  const hi = settings.lang === 'hi';
  const partName = BODY_PARTS.find((b) => b.id === part)?.text[settings.lang];

  return (
    <div className="flex flex-col gap-5">
      <section>
        <h2 className="mb-2 flex items-baseline gap-2 text-[1.05em] font-bold">
          <Step n={1} />
          {hi ? 'दर्द कहाँ है?' : 'Where does it hurt?'}
          <span className="text-[0.8em] font-normal text-[var(--muted)]">{hi ? 'वैकल्पिक' : 'optional'}</span>
        </h2>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {BODY_PARTS.map((b) => (
            <Key
              key={b.id}
              label={b.text[settings.lang]}
              pressed={part === b.id}
              variant={part === b.id ? 'selected' : 'tint-pain'}
              className="py-4 text-[1.02em] capitalize"
              onActivate={() => setPart((p) => (p === b.id ? undefined : b.id))}
            >
              {b.text[settings.lang]}
            </Key>
          ))}
        </div>
      </section>
      <section>
        <h2 className="mb-2 flex items-baseline gap-2 text-[1.05em] font-bold">
          <Step n={2} />
          {hi ? 'कितना दर्द है?' : 'How much?'}
          {partName && <span className="text-[0.85em] font-normal capitalize text-[var(--muted)]">· {partName}</span>}
        </h2>
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
          {PAIN_LEVELS.map((l) => (
            <Key
              key={l.level}
              label={`${l.level} out of 10, ${l.text[settings.lang]}`}
              variant={l.level >= 6 ? 'urgent' : 'default'}
              className="flex flex-col items-center gap-1 px-1 py-3"
              onActivate={() => {
                const s = painSentence(settings.lang, l.level, part);
                say(s.text, { urgent: s.urgent });
                setPart(undefined);
              }}
            >
              <span aria-hidden className="text-[2.1em] leading-none">{l.face}</span>
              <span className="text-[1.35em] font-extrabold tabular-nums">{l.level}</span>
              <span className="text-[0.75em] leading-tight">{l.text[settings.lang]}</span>
            </Key>
          ))}
        </div>
        <div aria-hidden className="mt-2 h-2 rounded-full" style={{ background: 'linear-gradient(90deg, var(--yes), var(--focus), var(--urgent))' }} />
      </section>
    </div>
  );
}

function Step({ n }: { n: number }) {
  return (
    <span aria-hidden className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-[var(--fg)] text-[0.8em] text-[var(--bg)]">
      {n}
    </span>
  );
}
