'use client';

import { useApp } from '../hooks/useApp';
import { QUICK } from '../lib/vocab';
import { Key } from './Key';

export function MessageBar({ onShow }: { onShow: () => void }) {
  const { message, setMessage, say, settings } = useApp();
  const hi = settings.lang === 'hi';
  const empty = !message.trim();

  return (
    <section aria-label="Message" className="card flex flex-col gap-2 p-2">
      <output
        aria-live="polite"
        className="block min-h-[3.25rem] px-3 pt-2 text-[1.45em] font-semibold leading-snug break-words"
      >
        {message || <span className="font-normal text-[var(--muted)]">{hi ? 'अपना संदेश यहाँ बनाइए…' : 'Your message appears here…'}</span>}
      </output>
      <div className="grid grid-cols-[2fr_1fr_1fr_1fr] gap-2">
        <Key label="Speak message" variant="accent" className="py-3 text-[1.05em]" onActivate={() => say(message)}>
          <span aria-hidden>🔊</span> {hi ? 'बोलें' : 'Speak'}
        </Key>
        <Key label="Show message to the other person" variant="soft" className="py-3" onActivate={onShow}>
          <span aria-hidden className="block text-[1.2em] leading-none">🪧</span>
          <span className="text-[0.75em]">{hi ? 'दिखाएँ' : 'Show'}</span>
        </Key>
        <Key
          label="Delete last word"
          variant="soft"
          className={`py-3 ${empty ? 'opacity-50' : ''}`}
          onActivate={() => setMessage((m) => m.trimEnd().replace(/\S+$/u, ''))}
        >
          <span aria-hidden className="block text-[1.2em] leading-none">⌫</span>
          <span className="text-[0.75em]">{hi ? 'शब्द' : 'Word'}</span>
        </Key>
        <Key label="Clear message" variant="soft" className={`py-3 ${empty ? 'opacity-50' : ''}`} onActivate={() => setMessage('')}>
          <span aria-hidden className="block text-[1.2em] leading-none">✕</span>
          <span className="text-[0.75em]">{hi ? 'साफ़' : 'Clear'}</span>
        </Key>
      </div>
    </section>
  );
}

export function QuickBar() {
  const { say, settings } = useApp();
  const t = (k: keyof typeof QUICK) => QUICK[k].text[settings.lang];
  const hi = settings.lang === 'hi';
  return (
    <nav aria-label="Quick answers" className="grid grid-cols-[1.3fr_1.3fr_1fr_1fr] gap-2">
      <Key label={t('yes')} variant="yes" className="py-4 text-[1.5em]" onActivate={() => say(t('yes'))}>
        <span aria-hidden>👍</span> {t('yes')}
      </Key>
      <Key label={t('no')} variant="no" className="py-4 text-[1.5em]" onActivate={() => say(t('no'))}>
        <span aria-hidden>👎</span> {t('no')}
      </Key>
      <Key label={t('maybe')} className="py-2 text-[0.85em] leading-tight" onActivate={() => say(t('maybe'))}>
        <span aria-hidden className="block text-[1.5em]">🤔</span>
        {hi ? 'पता नहीं' : 'Not sure'}
      </Key>
      <Key label={t('help')} variant="urgent" className="py-2 text-[0.95em]" onActivate={() => say(t('help'), { urgent: true })}>
        <span aria-hidden className="block text-[1.5em]">🚨</span>
        {hi ? 'मदद' : 'Help'}
      </Key>
    </nav>
  );
}
