'use client';

import { useState } from 'react';
import { useGlove } from '../hooks/useGlove';
import { useProfiles } from '../hooks/useProfiles';

/** Header pill showing glove state; opens a sheet to connect the real glove or the demo glove. */
export function GloveBar() {
  const { status, source, battery, error, bleSupported, connectBle, startDemo, disconnect } = useGlove();
  const { active } = useProfiles();
  const [open, setOpen] = useState(false);
  const on = status === 'connected';

  const dot = on ? 'dot dot--on' : status === 'connecting' || status === 'reconnecting' ? 'dot dot--busy' : 'dot';
  const label = on
    ? source === 'demo' ? 'Demo glove' : `Glove${battery != null ? ` · ${battery}%` : ''}`
    : status === 'reconnecting' ? 'Reconnecting…' : status === 'connecting' ? 'Connecting…' : 'Connect glove';

  return (
    <>
      <button
        type="button"
        className={`pill ${on || status === 'reconnecting' ? '' : 'pill--cta'}`}
        aria-haspopup="dialog"
        aria-label={`Glove: ${label}`}
        onClick={() => setOpen(true)}
      >
        <span aria-hidden>🧤</span>
        <span className={dot} aria-hidden />
        <span className="whitespace-nowrap">{label}</span>
        {battery != null && battery < 20 && source === 'ble' && <span className="text-[var(--urgent)]">🔋!</span>}
      </button>

      {open && (
        <div className="overlay fixed inset-0 z-40 flex items-end bg-black/40 sm:items-center sm:justify-center" onClick={() => setOpen(false)}>
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Glove connection"
            className="sheet card max-h-[85dvh] w-full overflow-y-auto rounded-b-none p-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] sm:max-w-md sm:rounded-b-[22px]"
            onClick={(e) => e.stopPropagation()}
          >
            <div aria-hidden className="mx-auto mb-4 h-1.5 w-10 rounded-full bg-[var(--line)] sm:hidden" />
            <h2 className="text-[1.3em] font-bold">Glove</h2>
            <p className="mb-4 text-[0.92em] text-[var(--muted)]">
              {on
                ? source === 'demo'
                  ? 'Using the demo glove — make hand shapes with the buttons on the Translate screen.'
                  : `Connected${battery != null ? ` · battery ${battery}%` : ''}. Signs are recognised on this device.`
                : 'Connect the GestureTalk glove over Bluetooth, or try everything with the demo glove.'}
            </p>
            {error && <p role="alert" className="mb-3 rounded-xl bg-[var(--tint-pain)] p-3">{error}</p>}
            {on && active && !active.calibrated && (
              <p className="mb-3 rounded-xl bg-[var(--tint-feel)] p-3 text-[0.92em]">Next: calibrate the glove for {active.name} on the Signs screen.</p>
            )}

            <div className="grid gap-2">
              {on ? (
                <button type="button" className="key py-4" onClick={() => { disconnect(); setOpen(false); }}>Disconnect</button>
              ) : (
                <>
                  <button
                    type="button"
                    className="key key--accent py-4 text-[1.05em]"
                    disabled={!bleSupported || status === 'connecting'}
                    onClick={async () => { await connectBle(); setOpen(false); }}
                  >
                    🧤 Connect GestureTalk glove
                  </button>
                  {!bleSupported && (
                    <p className="text-[0.85em] text-[var(--muted)]">This browser has no Bluetooth. Use Chrome or Edge on Android, Windows, macOS or ChromeOS.</p>
                  )}
                  <button type="button" className="key py-4" onClick={() => { startDemo(); setOpen(false); }}>
                    ✨ Try the demo glove (no hardware)
                  </button>
                </>
              )}
            </div>
            <p className="mt-4 text-[0.82em] text-[var(--muted)]">Build your own glove for about ₹4,000 — see hardware/glove in the project repository.</p>
            <button type="button" className="key key--ghost mt-3 w-full py-3" onClick={() => setOpen(false)}>Close</button>
          </div>
        </div>
      )}
    </>
  );
}
