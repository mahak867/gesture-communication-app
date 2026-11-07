'use client';

import { useRef, useState, type ReactNode } from 'react';
import { useApp } from '../hooks/useApp';

interface Props {
  onActivate: () => void;
  children: ReactNode;
  label: string;
  className?: string;
  variant?: 'default' | 'urgent' | 'yes' | 'no' | 'ghost' | 'selected';
}

const VARIANTS: Record<NonNullable<Props['variant']>, string> = {
  default: 'bg-[var(--key)] text-[var(--fg)] border-[var(--line)]',
  urgent: 'bg-[var(--urgent)] text-white border-transparent',
  yes: 'bg-[var(--yes)] text-white border-transparent',
  no: 'bg-[var(--no)] text-white border-transparent',
  ghost: 'bg-transparent text-[var(--fg)] border-[var(--line)]',
  selected: 'bg-[var(--accent)] text-white border-transparent',
};

/**
 * Accessible button honouring the user's activation method:
 * tap (on press), release (on lift — a slip off the key cancels), or dwell (hold).
 * Keyboard and switch users always activate with Enter/Space via onClick.
 */
export function Key({ onActivate, children, label, className = '', variant = 'default' }: Props) {
  const { settings, allowActivation } = useApp();
  const [dwell, setDwell] = useState(0);
  const timer = useRef<number | null>(null);
  const startedAt = useRef(0);
  const pointerUsed = useRef(false);

  const fire = () => {
    if (!allowActivation()) return;
    navigator.vibrate?.(30);
    onActivate();
  };

  const cancelDwell = () => {
    if (timer.current) cancelAnimationFrame(timer.current);
    timer.current = null;
    setDwell(0);
  };

  // rAF timestamps and event.timeStamp share the same clock.
  const tickDwell = (now: number) => {
    const p = (now - startedAt.current) / settings.dwellMs;
    if (p >= 1) {
      cancelDwell();
      fire();
      return;
    }
    setDwell(p);
    timer.current = requestAnimationFrame(tickDwell);
  };

  return (
    <button
      type="button"
      aria-label={label}
      data-scan
      className={`key relative overflow-hidden rounded-2xl border-2 font-semibold select-none
        focus-visible:outline-4 focus-visible:outline-offset-2 focus-visible:outline-[var(--focus)]
        active:scale-[0.97] transition-transform ${VARIANTS[variant]} ${className}`}
      onPointerDown={(e) => {
        pointerUsed.current = true;
        if (settings.activation === 'tap') fire();
        if (settings.activation === 'dwell') {
          e.currentTarget.setPointerCapture?.(e.pointerId);
          startedAt.current = e.timeStamp;
          timer.current = requestAnimationFrame(tickDwell);
        }
      }}
      onPointerUp={(e) => {
        if (settings.activation === 'release') {
          const r = e.currentTarget.getBoundingClientRect();
          const inside = e.clientX >= r.left && e.clientX <= r.right && e.clientY >= r.top && e.clientY <= r.bottom;
          if (inside) fire();
        }
        cancelDwell();
      }}
      onPointerCancel={cancelDwell}
      onPointerLeave={() => settings.activation === 'dwell' && cancelDwell()}
      onClick={() => {
        // Pointer input is handled above; clicks from keyboard/switch/scanning land here.
        if (pointerUsed.current) {
          pointerUsed.current = false;
          return;
        }
        fire();
      }}
    >
      {dwell > 0 && (
        <span aria-hidden className="absolute inset-x-0 bottom-0 h-1.5 bg-[var(--focus)]" style={{ width: `${dwell * 100}%` }} />
      )}
      {children}
    </button>
  );
}
