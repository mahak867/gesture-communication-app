'use client';

import { useApp } from '../hooks/useApp';
import { QUICK } from '../lib/vocab';
import { Key } from './Key';

export function MessageBar({ onShow }: { onShow: () => void }) {
  const { message, setMessage, say, settings } = useApp();
  const empty = !message.trim();
  const ph = settings.lang === 'hi' ? 'अपना संदेश यहाँ बनाइए…' : 'Your message appears here…';

  return (
    <section aria-label="Message" className="flex flex-col gap-2">
      <output
        aria-live="polite"
        className="min-h-[3.5rem] rounded-2xl border-2 border-[var(--line)] bg-[var(--panel)] px-4 py-3 text-[1.5em] leading-snug break-words"
      >
        {message || <span className="text-[var(--muted)]">{ph}</span>}
      </output>
      <div className="grid grid-cols-4 gap-2 text-[0.95em]">
        <Key label="Speak message" variant="selected" className="py-3" onActivate={() => say(message)}>
          🔊 Speak
        </Key>
        <Key label="Show message to the other person" className="py-3" onActivate={onShow}>
          🪧 Show
        </Key>
        <Key label="Delete last word" className="py-3" onActivate={() => setMessage((m) => m.trimEnd().replace(/\S+$/u, ''))}>
          ⌫ Word
        </Key>
        <Key label="Clear message" className="py-3" onActivate={() => setMessage('')}>
          ✕ Clear
        </Key>
      </div>
      {empty ? null : <span className="sr-only">{message.length} characters</span>}
    </section>
  );
}

export function QuickBar() {
  const { say, settings } = useApp();
  const t = (k: keyof typeof QUICK) => QUICK[k].text[settings.lang];
  return (
    <nav aria-label="Quick answers" className="grid grid-cols-4 gap-2">
      <Key label={t('yes')} variant="yes" className="py-4 text-[1.4em]" onActivate={() => say(t('yes'))}>
        👍 {t('yes')}
      </Key>
      <Key label={t('no')} variant="no" className="py-4 text-[1.4em]" onActivate={() => say(t('no'))}>
        👎 {t('no')}
      </Key>
      <Key label={t('maybe')} className="py-4 text-[1.05em]" onActivate={() => say(t('maybe'))}>
        🤔 {t('maybe')}
      </Key>
      <Key label={t('help')} variant="urgent" className="py-4 text-[1.2em]" onActivate={() => say(t('help'), { urgent: true })}>
        🚨 {settings.lang === 'hi' ? 'मदद' : 'Help'}
      </Key>
    </nav>
  );
}
