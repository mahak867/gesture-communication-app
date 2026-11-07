'use client';

import { useEffect, useRef } from 'react';
import type { LiveRef } from '../hooks/useSegments';
import { FINGERS } from '../lib/sensors';

/**
 * Live finger-bend bars + "signing" state. Updated straight from the frame
 * ref inside requestAnimationFrame (transform only), so 50 Hz data never
 * re-renders React.
 */
export function HandViz({ live, inactive = [] }: { live: React.RefObject<LiveRef>; inactive?: boolean[] }) {
  const bars = useRef<(HTMLSpanElement | null)[]>([]);
  const ring = useRef<HTMLSpanElement>(null);
  const label = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    let raf = 0;
    const tick = () => {
      const l = live.current;
      const f = l?.features;
      bars.current.forEach((el, i) => {
        if (!el) return;
        const v = f ? Math.min(1, Math.max(0, f[i])) : 0;
        el.style.transform = `scaleY(${0.06 + v * 0.94})`;
      });
      if (ring.current) ring.current.style.transform = `scaleX(${l?.holdProgress ?? 0})`;
      if (label.current) {
        const s = !f ? 'Waiting for glove…' : l.busy ? 'Reading sign…' : 'Ready — relaxed';
        if (label.current.textContent !== s) label.current.textContent = s;
        label.current.dataset.busy = String(!!l?.busy);
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [live]);

  return (
    <div className="flex items-end gap-4" aria-hidden>
      <div className="flex h-20 items-end gap-1.5">
        {FINGERS.map((name, i) => (
          <div key={name} className="flex flex-col items-center gap-1">
            <div className="relative h-16 w-4 overflow-hidden rounded-full bg-[var(--surface-2)] ring-1 ring-[var(--line)]">
              <span
                ref={(el) => { bars.current[i] = el; }}
                className={`absolute inset-0 origin-bottom rounded-full ${inactive[i] ? 'bg-[var(--line)]' : 'bg-[var(--accent)]'}`}
                style={{ transform: 'scaleY(0.06)', transition: 'transform 60ms linear' }}
              />
            </div>
            <span className="text-[0.6em] uppercase text-[var(--muted)]">{name[0]}</span>
          </div>
        ))}
      </div>
      <div className="flex min-w-0 flex-1 flex-col gap-1.5 pb-5">
        <span ref={label} className="live-label text-[0.9em] font-semibold" />
        <div className="h-1.5 overflow-hidden rounded-full bg-[var(--surface-2)]">
          <span ref={ring} className="block h-full origin-left rounded-full bg-[var(--focus)]" style={{ transform: 'scaleX(0)' }} />
        </div>
      </div>
    </div>
  );
}
