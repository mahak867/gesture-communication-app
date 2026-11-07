'use client';

import { useEffect } from 'react';

// Single-switch scanning: focus moves through every [data-scan] control in
// turn; the user's switch (usually mapped to Space or Enter by the switch
// interface) activates the focused button natively.

const EVENT = 'gt:scan-next';

function scanTargets(): HTMLElement[] {
  return [...document.querySelectorAll<HTMLElement>('[data-scan]')].filter((el) => el.offsetParent !== null);
}

/** Move scan focus to the next control. Safe to call from anywhere (e.g. a camera gesture). */
export function advanceScan(direction: 1 | -1 = 1) {
  window.dispatchEvent(new CustomEvent(EVENT, { detail: direction }));
}

export function nextIndex(current: number, length: number, direction: 1 | -1 = 1): number {
  if (length === 0) return -1;
  if (current < 0) return direction === 1 ? 0 : length - 1;
  return (current + direction + length) % length;
}

export function useScanner(enabled: boolean, intervalMs: number) {
  useEffect(() => {
    const step = (e?: Event) => {
      const dir = e instanceof CustomEvent && e.detail === -1 ? -1 : 1;
      const els = scanTargets();
      const i = els.indexOf(document.activeElement as HTMLElement);
      const el = els[nextIndex(i, els.length, dir)];
      el?.focus({ preventScroll: false });
      el?.scrollIntoView({ block: 'nearest' });
    };
    window.addEventListener(EVENT, step);
    if (!enabled) return () => window.removeEventListener(EVENT, step);

    document.documentElement.dataset.scanning = 'true';
    let id = window.setInterval(() => step(), intervalMs);
    // After a selection, restart the timer so the user isn't rushed.
    const restart = () => {
      window.clearInterval(id);
      id = window.setInterval(() => step(), intervalMs);
    };
    window.addEventListener('keydown', restart);
    return () => {
      window.clearInterval(id);
      window.removeEventListener(EVENT, step);
      window.removeEventListener('keydown', restart);
      delete document.documentElement.dataset.scanning;
    };
  }, [enabled, intervalMs]);
}
