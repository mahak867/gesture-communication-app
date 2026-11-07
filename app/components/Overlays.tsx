'use client';

import { useEffect, useState } from 'react';
import { useApp } from '../hooks/useApp';

/** Full-screen alert after an urgent message. Carer taps to acknowledge. */
export function AlarmOverlay() {
  const { alarm, dismissAlarm, settings } = useApp();
  if (!alarm) return null;
  return (
    <div role="alertdialog" aria-modal="true" aria-label="Urgent message" className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-8 bg-[var(--urgent)] p-6 text-center text-white">
      <p className="text-[clamp(2rem,7vw,4.5rem)] font-black leading-tight">{alarm}</p>
      {settings.patientName && <p className="text-2xl">— {settings.patientName}</p>}
      <button
        type="button"
        data-scan
        autoFocus
        onClick={dismissAlarm}
        className="rounded-2xl bg-white px-8 py-5 text-2xl font-bold text-[var(--urgent)]"
      >
        ✓ I’m here (stop alarm)
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
    <div role="dialog" aria-modal="true" aria-label="Message for the other person" className="fixed inset-0 z-40 flex flex-col bg-white p-4 text-black">
      <p className={`flex flex-1 items-center justify-center text-center text-[clamp(2.5rem,9vw,7rem)] font-bold leading-tight break-words ${flip ? 'rotate-180' : ''}`}>
        {text || '…'}
      </p>
      <div className="grid grid-cols-2 gap-2">
        <button type="button" data-scan onClick={() => setFlip((f) => !f)} className="rounded-2xl border-2 border-black py-4 text-xl font-bold">
          ⇅ Flip
        </button>
        <button type="button" data-scan autoFocus onClick={onClose} className="rounded-2xl bg-black py-4 text-xl font-bold text-white">
          Close
        </button>
      </div>
    </div>
  );
}

export function History() {
  const { history, say, clearHistory, settings } = useApp();
  if (history.length === 0) {
    return <p className="text-[var(--muted)]">{settings.lang === 'hi' ? 'अभी तक कुछ नहीं बोला गया।' : 'Nothing has been said yet.'}</p>;
  }
  return (
    <div className="flex flex-col gap-2">
      <ul className="flex flex-col gap-2">
        {history.map((h) => (
          <li key={h.at + h.text}>
            <button
              type="button"
              data-scan
              onClick={() => say(h.text)}
              className={`w-full rounded-xl border-2 px-4 py-3 text-left text-[1.1em] ${h.urgent ? 'border-[var(--urgent)]' : 'border-[var(--line)]'} bg-[var(--panel)]`}
            >
              <span className="mr-3 text-[0.8em] text-[var(--muted)]">
                {new Date(h.at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
              {h.text}
            </button>
          </li>
        ))}
      </ul>
      <button
        type="button"
        onClick={() => confirm('Delete the whole history from this device?') && clearHistory()}
        className="self-start rounded-xl border-2 border-[var(--line)] px-4 py-2 text-[var(--muted)]"
      >
        Delete history
      </button>
    </div>
  );
}
