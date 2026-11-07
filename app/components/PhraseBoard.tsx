'use client';

import { useApp } from '../hooks/useApp';
import type { Board, Phrase } from '../lib/vocab';
import { Key, type KeyVariant } from './Key';

const TINT: Record<string, KeyVariant> = { needs: 'tint-needs', feel: 'tint-feel', talk: 'tint-talk' };

export function PhraseBoard({ board }: { board: Board }) {
  const { settings, say, setMessage } = useApp();
  const tint = TINT[board.id] ?? 'default';

  const choose = (ph: Phrase) => {
    const text = ph.text[settings.lang];
    if (settings.speakOnTap || ph.urgent) say(text, { urgent: ph.urgent });
    else setMessage((m) => (m ? `${m.trimEnd()} ${text}` : text));
  };

  return (
    <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-4">
      {board.phrases.map((ph) => (
        <Key
          key={ph.id}
          label={ph.text[settings.lang]}
          variant={ph.urgent ? 'urgent' : tint}
          className="flex min-h-[7.25em] flex-col items-center justify-center gap-2 px-2 py-3 text-center text-[1.02em] leading-tight"
          onActivate={() => choose(ph)}
        >
          <span aria-hidden className="text-[2.2em] leading-none">{ph.icon}</span>
          <span>{ph.text[settings.lang]}</span>
        </Key>
      ))}
    </div>
  );
}
