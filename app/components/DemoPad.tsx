'use client';

import { useGlove } from '../hooks/useGlove';
import { SHAPES } from '../lib/simulator';

/** Hand-shape buttons that drive the demo glove — only shown when it is active. */
export function DemoPad({ compact = false }: { compact?: boolean }) {
  const { demo } = useGlove();
  if (!demo) return null;
  return (
    <section aria-label="Demo glove" className="rounded-2xl border-[1.5px] border-dashed border-[var(--line)] p-3">
      <p className="mb-2 text-[0.82em] font-semibold text-[var(--muted)]">
        ✨ Demo glove — tap a hand shape to perform it (adds realistic sensor noise and tremor)
      </p>
      <div className={`grid gap-2 ${compact ? 'grid-cols-4' : 'grid-cols-4 sm:grid-cols-8'}`}>
        {SHAPES.map((s) => (
          <button
            key={s.id}
            type="button"
            className="key key--soft flex flex-col items-center gap-0.5 py-2"
            aria-label={`Perform ${s.label}`}
            onClick={() => demo.perform(s)}
          >
            <span aria-hidden className="text-[1.6em] leading-none">{s.icon}</span>
            <span className="text-[0.66em]">{s.label}</span>
          </button>
        ))}
      </div>
    </section>
  );
}
