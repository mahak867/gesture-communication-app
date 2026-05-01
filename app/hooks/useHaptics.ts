export type HapticPattern = 
  | "confirm"      // gesture confirmed
  | "error"        // gesture failed
  | "speak"        // about to speak
  | "emergency"    // emergency triggered
  | "select"       // phrase selected
  | "undo"         // undo action
  | "navigate"     // tab change
  | "warning";     // caution

const PATTERNS: Record<HapticPattern, number | number[]> = {
  confirm:   [50, 30, 50],
  error:     [200, 100, 200, 100, 200],
  speak:     50,
  emergency: [300, 100, 300, 100, 600],
  select:    [30, 20, 80],
  undo:      [100, 50, 100],
  navigate:  20,
  warning:   [150, 50, 150],
};

export function vibrate(pattern: HapticPattern) {
  if (typeof window === "undefined") return;
  if (!navigator.vibrate) return;
  navigator.vibrate(PATTERNS[pattern]);
}

export function useHaptics() {
  const haptic = (pattern: HapticPattern) => vibrate(pattern);
  return { haptic };
}
