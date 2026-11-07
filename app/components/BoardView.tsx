'use client';

import { useState } from 'react';
import { useApp } from '../hooks/useApp';
import { BOARDS } from '../lib/vocab';
import { MessageBar } from './MessageBar';
import { PhraseBoard } from './PhraseBoard';
import { PainBoard } from './PainBoard';
import { Keyboard } from './Keyboard';
import { DemoPad } from './DemoPad';

type Sub = 'needs' | 'feel' | 'talk' | 'pain' | 'type';

const SUBS: { id: Sub; icon: string; en: string; hi: string }[] = [
  { id: 'needs', icon: '🙋', en: 'Needs', hi: 'ज़रूरतें' },
  { id: 'feel', icon: '💬', en: 'Feelings', hi: 'भावनाएँ' },
  { id: 'talk', icon: '🗣️', en: 'Talk', hi: 'बातचीत' },
  { id: 'pain', icon: '🤕', en: 'Pain', hi: 'दर्द' },
  { id: 'type', icon: '⌨️', en: 'Type', hi: 'लिखें' },
];

/** Touch boards: for days the hand is too tired for the glove, or for carers. */
export function BoardView({ onShow }: { onShow: () => void }) {
  const { settings } = useApp();
  const [sub, setSub] = useState<Sub>('needs');
  const board = BOARDS.find((b) => b.id === sub);

  return (
    <div className="grid gap-3">
      <MessageBar onShow={onShow} />
      <div role="tablist" aria-label="Boards" className="no-scrollbar -mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
        {SUBS.map((s) => (
          <button
            key={s.id}
            type="button"
            role="tab"
            data-scan
            aria-selected={sub === s.id}
            onClick={() => setSub(s.id)}
            className={`pill shrink-0 ${sub === s.id ? 'pill--cta' : ''}`}
          >
            <span aria-hidden>{s.icon}</span>
            {s[settings.lang]}
          </button>
        ))}
      </div>
      <div key={sub} className="fade-in">
        {board && <PhraseBoard board={board} />}
        {sub === 'pain' && <PainBoard />}
        {sub === 'type' && <Keyboard />}
      </div>
      <DemoPad />
    </div>
  );
}
