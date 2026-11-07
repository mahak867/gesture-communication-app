'use client';

import { useRef, useState, type ReactNode } from 'react';
import { useApp } from '../hooks/useApp';

export type KeyVariant =
  | 'default' | 'urgent' | 'yes' | 'no' | 'ghost' | 'soft' | 'selected' | 'accent'
  | 'tint-needs' | 'tint-feel' | 'tint-talk' | 'tint-pain';

interface Props {
  onActivate: () => void;
  children: ReactNode;
  label: string;
  className?: string;
  variant?: KeyVariant;
  pressed?: boolean;
}

/**
 * Accessible button honouring the user's activation method:
 * tap (on press), release (on lift — sliding off cancels), or dwell (hold still).
 * Keyboard, switch and glove users activate through onClick.
 */
export function Key({ onActivate, children, label, className = '', variant = 'default', pressed }: Props) {
  const { settings, allowActivation } = useApp();
  const [dwell, setDwell] = useState(0);
  const timer = useRef<number | null>(null);
  const startedAt = useRef(0);
  const pointerUsed = useRef(false);

  const fire = () => {
    if (!allowActivation()) return;
    navigator.vibrate?.(25);
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
      aria-pressed={pressed}
      data-scan
      className={`key ${variant === 'default' ? '' : `key--${variant}`} ${className}`}
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
      onClick={() => {
        if (pointerUsed.current) {
          pointerUsed.current = false;
          return;
        }
        fire();
      }}
    >
      {dwell > 0 && <span aria-hidden className="dwell-bar" style={{ transform: `scaleX(${dwell})` }} />}
      {children}
    </button>
  );
}
