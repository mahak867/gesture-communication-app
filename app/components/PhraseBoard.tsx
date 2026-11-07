'use client';

import { useApp } from '../hooks/useApp';
import type { Board, Phrase } from '../lib/vocab';
import { Key } from './Key';

export function PhraseBoard({ board }: { board: Board }) {
  const { settings, say, setMessage } = useApp();

  const choose = (ph: Phrase) => {
    const text = ph.text[settings.lang];
    if (settings.speakOnTap || ph.urgent) say(text, { urgent: ph.urgent });
    else setMessage((m) => (m ? `${m.trimEnd()} ${text}` : text));
  };

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
      {board.phrases.map((ph) => (
        <Key
          key={ph.id}
          label={ph.text[settings.lang]}
          variant={ph.urgent ? 'urgent' : 'default'}
          className="flex min-h-[6.5em] flex-col items-center justify-center gap-1 p-2 text-center text-[1.05em]"
          onActivate={() => choose(ph)}
        >
          <span aria-hidden className="text-[2em] leading-none">{ph.icon}</span>
          <span>{ph.text[settings.lang]}</span>
        </Key>
      ))}
    </div>
  );
}
