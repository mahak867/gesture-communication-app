'use client';

import { useState } from 'react';
import { useApp } from '../hooks/useApp';
import { BODY_PARTS, PAIN_LEVELS, painSentence } from '../lib/vocab';
import { Key } from './Key';

/** Two steps, each optional: where does it hurt, then how much. Faces + numbers (Wong-Baker style). */
export function PainBoard() {
  const { settings, say } = useApp();
  const [part, setPart] = useState<string | undefined>();
  const hi = settings.lang === 'hi';

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h2 className="mb-2 text-[1.1em] font-bold">{hi ? '1. दर्द कहाँ है? (वैकल्पिक)' : '1. Where does it hurt? (optional)'}</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {BODY_PARTS.map((b) => (
            <Key
              key={b.id}
              label={b.text[settings.lang]}
              variant={part === b.id ? 'selected' : 'default'}
              className="py-4 text-[1.05em] capitalize"
              onActivate={() => setPart((p) => (p === b.id ? undefined : b.id))}
            >
              {b.text[settings.lang]}
            </Key>
          ))}
        </div>
      </div>
      <div>
        <h2 className="mb-2 text-[1.1em] font-bold">{hi ? '2. कितना दर्द है?' : '2. How much does it hurt?'}</h2>
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
          {PAIN_LEVELS.map((l) => (
            <Key
              key={l.level}
              label={`${l.level} out of 10, ${l.text[settings.lang]}`}
              variant={l.level >= 6 ? 'urgent' : 'default'}
              className="flex flex-col items-center gap-1 py-3"
              onActivate={() => {
                const s = painSentence(settings.lang, l.level, part);
                say(s.text, { urgent: s.urgent });
                setPart(undefined);
              }}
            >
              <span aria-hidden className="text-[2.2em] leading-none">{l.face}</span>
              <span className="text-[1.3em] font-bold">{l.level}</span>
              <span className="text-[0.8em]">{l.text[settings.lang]}</span>
            </Key>
          ))}
        </div>
      </div>
    </div>
  );
}
