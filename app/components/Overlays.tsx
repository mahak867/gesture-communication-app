'use client';

import { useEffect, useState } from 'react';
import { useApp } from '../hooks/useApp';

/** Full-screen alert after an urgent message. Carer taps to acknowledge. */
export function AlarmOverlay() {
  const { alarm, dismissAlarm, settings } = useApp();
  if (!alarm) return null;
  return (
    <div
      role="alertdialog"
      aria-modal="true"
      aria-label="Urgent message"
      className="overlay alarm-pulse fixed inset-0 z-50 flex flex-col items-center justify-center gap-6 bg-[var(--urgent)] p-6 pb-[max(1.5rem,env(safe-area-inset-bottom))] text-center text-white"
    >
      <span aria-hidden className="text-[3.5rem]">🚨</span>
      <p className="max-w-3xl text-[clamp(2rem,7vw,4.5rem)] font-black leading-[1.05] tracking-tight">{alarm}</p>
      {settings.patientName && <p className="text-[1.5rem] font-semibold opacity-90">— {settings.patientName}</p>}
      <button
        type="button"
        data-scan
        autoFocus
        onClick={dismissAlarm}
        className="key mt-4 w-full max-w-sm border-transparent bg-white py-5 text-[1.4rem] font-extrabold text-[var(--urgent)]"
      >
        ✓ I’m here — stop alarm
      </button>
    </div>
  );
}

/**
 * Shows the message huge, for the person across the bed. Optional flip so a
 * tablet lying on the patient’s lap reads the right way up for the visitor.
 */
export function PartnerView({ onClose }: { onClose: () => void }) {
  const { message, history } = useApp();
  const [flip, setFlip] = useState(false);
  const text = message.trim() || history[0]?.text || '';

  useEffect(() => {
    const k = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', k);
    return () => window.removeEventListener('keydown', k);
  }, [onClose]);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Message for the other person"
      className="overlay fixed inset-0 z-40 flex flex-col bg-white p-4 pt-[max(1rem,env(safe-area-inset-top))] pb-[max(1rem,env(safe-area-inset-bottom))] text-black"
    >
      <p
        className={`flex flex-1 items-center justify-center text-center text-[clamp(2.5rem,9vw,7rem)] font-extrabold leading-[1.05] tracking-tight break-words transition-transform duration-300 ${flip ? 'rotate-180' : ''}`}
      >
        {text || '…'}
      </p>
      <div className="grid grid-cols-2 gap-3">
        <button type="button" data-scan onClick={() => setFlip((f) => !f)} className="key border-black/15 bg-white py-4 text-[1.2rem] text-black">
          ⇅ Flip
        </button>
        <button type="button" data-scan autoFocus onClick={onClose} className="key border-transparent bg-black py-4 text-[1.2rem] text-white">
          Close
        </button>
      </div>
    </div>
  );
}

export function History() {
  const { history, say, clearHistory, settings } = useApp();
  if (history.length === 0) {
    return (
      <div className="card grid place-items-center gap-2 p-10 text-center text-[var(--muted)]">
        <span aria-hidden className="text-[2.5em]">🕘</span>
        {settings.lang === 'hi' ? 'अभी तक कुछ नहीं बोला गया।' : 'Nothing has been said yet.'}
      </div>
    );
  }
  return (
    <div className="flex flex-col gap-3">
      <p className="text-[0.9em] text-[var(--muted)]">Tap a line to say it again.</p>
      <ul className="card divide-y divide-[var(--line)] overflow-hidden p-0">
        {history.map((h) => (
          <li key={h.at + h.text}>
            <button
              type="button"
              data-scan
              onClick={() => say(h.text)}
              className="flex w-full items-start gap-3 px-4 py-3.5 text-left text-[1.05em] transition-colors active:bg-[var(--surface-2)]"
            >
              <span className="w-12 shrink-0 pt-0.5 text-[0.75em] tabular-nums text-[var(--muted)]">
                {new Date(h.at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
              <span className="flex-1">{h.text}</span>
              {h.urgent && <span className="rounded-full bg-[var(--urgent)] px-2 py-0.5 text-[0.7em] font-bold text-white">URGENT</span>}
            </button>
          </li>
        ))}
      </ul>
      <button
        type="button"
        onClick={() => confirm('Delete the whole history from this device?') && clearHistory()}
        className="key key--ghost self-start px-4 py-2 text-[0.9em] text-[var(--muted)]"
      >
        Delete history
      </button>
    </div>
  );
}
