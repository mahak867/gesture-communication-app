// Camera gestures are deliberately few. People with weak or unsteady hands
// cannot fingerspell reliably, and misreads in a hospital are dangerous, so we
// only use MediaPipe's most robust built-in gestures and require them to be
// held steady before anything happens.

export type GestureAction = 'yes' | 'no' | 'help' | 'speak' | 'next';

export const GESTURES: { category: string; action: GestureAction; icon: string; label: string }[] = [
  { category: 'Thumb_Up', action: 'yes', icon: '👍', label: 'Thumb up → “Yes”' },
  { category: 'Thumb_Down', action: 'no', icon: '👎', label: 'Thumb down → “No”' },
  { category: 'Open_Palm', action: 'help', icon: '✋', label: 'Open palm → call for help' },
  { category: 'Victory', action: 'speak', icon: '✌️', label: 'Two fingers → speak message' },
  { category: 'Pointing_Up', action: 'next', icon: '☝️', label: 'Point up → next scan item' },
];

export function actionFor(category: string): GestureAction | null {
  return GESTURES.find((g) => g.category === category)?.action ?? null;
}

/**
 * Confirms a gesture only after it has been seen continuously for `holdMs`
 * with at least `minScore` confidence, then locks until the hand changes,
 * so one held gesture fires exactly once.
 */
export class HoldDetector {
  private current: string | null = null;
  private since = 0;
  private fired = false;

  constructor(
    private holdMs = 800,
    private minScore = 0.6,
  ) {}

  /** Feed one frame. Returns the category when it is confirmed, else null. */
  update(category: string | null, score: number, now: number): string | null {
    const cat = category && category !== 'None' && score >= this.minScore ? category : null;
    if (cat !== this.current) {
      this.current = cat;
      this.since = now;
      this.fired = false;
      return null;
    }
    if (!cat || this.fired) return null;
    if (now - this.since >= this.holdMs) {
      this.fired = true;
      return cat;
    }
    return null;
  }

  /** 0..1 progress toward confirming the current gesture (for a visual ring). */
  progress(now: number): number {
    if (!this.current || this.fired) return 0;
    return Math.min(1, (now - this.since) / this.holdMs);
  }

  get gesture(): string | null {
    return this.current;
  }
}
