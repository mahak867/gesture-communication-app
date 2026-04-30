// app/lib/gestures.ts
// Gesture mapping for MediaPipe Tasks GestureRecognizer + supplemental landmark logic.
//
// The Tasks API returns one of these built-in category names:
//   None | Closed_Fist | Open_Palm | Pointing_Up | Thumb_Down | Thumb_Up | Victory | ILoveYou
//
// We map those to app actions, then fall back to landmark math for extra letters.

export interface Landmark {
  x: number;
  y: number;
  z: number;
}

export type GestureCategory = 'letter' | 'number' | 'command';

export interface GestureResult {
  id: string;
  label: string;
  category: GestureCategory;
  emoji: string;
}

export interface GestureGuideEntry extends GestureResult {
  description: string;
}

// ── Built-in Tasks API gesture names ────────────────────────────────────────
// Returned by GestureRecognizer.recognizeForVideo() as result.gestures[i][0].categoryName
const BUILTIN_MAP: Record<string, GestureResult> = {
  Open_Palm:   { id: 'five',       label: 'SPACE', category: 'command', emoji: '✋' },
  Thumb_Up:    { id: 'thumbsup',   label: 'SPEAK', category: 'command', emoji: '👍' },
  Thumb_Down:  { id: 'thumbsdown', label: 'BACK',  category: 'command', emoji: '👎' },
  Pointing_Up: { id: 'one',        label: '1',     category: 'number',  emoji: '☝️' },
  Victory:     { id: 'two',        label: '2',     category: 'number',  emoji: '✌️' },
  ILoveYou:    { id: 'Y',          label: 'Y',     category: 'letter',  emoji: '🤙' },
  // Closed_Fist is handled by landmark math below (A vs CLEAR vs other combos)
};

/**
 * Map a Tasks API gesture category name to a GestureResult.
 * Returns null for "None" or unrecognised names.
 */
export function mapBuiltinGesture(categoryName: string): GestureResult | null {
  if (categoryName === 'None' || categoryName === 'Closed_Fist') return null;
  return BUILTIN_MAP[categoryName] ?? null;
}

// ── Supplemental landmark-based detection ────────────────────────────────────
// Used for gestures the built-in model doesn't cover:
// A, F, I, K, L, 3, 4, CLEAR — and to disambiguate Closed_Fist.
//
// Landmark indices (MediaPipe 21-point hand model):
//   0=wrist | Thumb:1-4 | Index:5-8 | Middle:9-12 | Ring:13-16 | Pinky:17-20

function fingerUp(tip: Landmark, pip: Landmark, threshold = 0.03): boolean {
  return tip.y < pip.y - threshold;
}

/**
 * Detect gestures from raw landmarks.
 * Call this when the Tasks API returns "None" or "Closed_Fist" to get finer-grained results,
 * OR as a full fallback when the Tasks API isn't available.
 */
export function detectGestureFromLandmarks(
  lms: Landmark[],
  isLeftHand = false,
): GestureResult | null {
  if (lms.length < 21) return null;

  const iUp = fingerUp(lms[8],  lms[6]);
  const mUp = fingerUp(lms[12], lms[10]);
  const rUp = fingerUp(lms[16], lms[14]);
  const pUp = fingerUp(lms[20], lms[18]);

  const tUp   = lms[4].y < lms[3].y - 0.03;
  const tDown = lms[4].y > lms[2].y + 0.04 && lms[4].y > lms[0].y - 0.02;
  const tOut  = isLeftHand
    ? lms[4].x > lms[3].x + 0.07
    : lms[4].x < lms[3].x - 0.07;

  // Commands first (most fingers up → fewer false positives)
  if (iUp && mUp && rUp && pUp && tUp)  return { id: 'five',      label: 'SPACE', category: 'command', emoji: '✋' };
  if (tUp && !iUp && !mUp && !rUp && !pUp && !tOut) return { id: 'thumbsup', label: 'SPEAK', category: 'command', emoji: '👍' };
  if (tDown && !iUp && !mUp && !rUp && !pUp)         return { id: 'thumbsdown', label: 'BACK', category: 'command', emoji: '👎' };
  // CLEAR: rock-on (index + pinky, no thumb, no middle, no ring)
  if (iUp && !mUp && !rUp && pUp && !tUp && !tOut)   return { id: 'clear', label: 'CLEAR', category: 'command', emoji: '🤘' };

  // Numbers
  if (iUp && mUp && rUp && pUp && !tUp) return { id: 'four',  label: '4', category: 'number', emoji: '4️⃣' };
  if (iUp && mUp && rUp && !pUp)        return { id: 'three', label: '3', category: 'number', emoji: '3️⃣' };
  // K: index + middle + thumb out — before generic "2"
  if (iUp && mUp && !rUp && !pUp && tOut) return { id: 'K', label: 'K', category: 'letter', emoji: '✌️' };
  if (iUp && mUp && !rUp && !pUp)         return { id: 'two', label: '2', category: 'number', emoji: '✌️' };
  if (iUp && !mUp && !rUp && !pUp && !tUp && !tOut) return { id: 'one', label: '1', category: 'number', emoji: '☝️' };

  // Letters
  if (!iUp && !mUp && !rUp && !pUp && tOut)   return { id: 'A', label: 'A', category: 'letter', emoji: '✊' };
  if (!iUp && mUp && rUp && pUp && !tUp && !tOut) return { id: 'F', label: 'F', category: 'letter', emoji: '🖖' };
  if (!iUp && !mUp && !rUp && pUp && !tUp)    return { id: 'I', label: 'I', category: 'letter', emoji: '🤙' };
  if (iUp && !mUp && !rUp && !pUp && tOut)    return { id: 'L', label: 'L', category: 'letter', emoji: '👆' };
  if (tUp && pUp && !iUp && !mUp && !rUp)     return { id: 'Y', label: 'Y', category: 'letter', emoji: '🤙' };

  return null;
}

/**
 * Primary gesture detection function used by CameraView.
 *
 * Prefers the Tasks API built-in result, falls back to landmark math for:
 *  - Gestures the model returns as "None" or "Closed_Fist"
 *  - Extra letters (A, F, I, K, L, 3, 4, CLEAR) not covered by the built-in model
 */
export function resolveGesture(
  builtinCategoryName: string,
  landmarks: Landmark[],
  isLeftHand = false,
): GestureResult | null {
  // 1. Try built-in model result first
  const builtin = mapBuiltinGesture(builtinCategoryName);
  if (builtin) return builtin;

  // 2. Fall back to landmark math (covers Closed_Fist disambiguation + extra letters)
  return detectGestureFromLandmarks(landmarks, isLeftHand);
}

// ── Legacy entry point (used by tests, kept for compatibility) ───────────────
export function detectGesture(lms: Landmark[], isLeftHand = false): GestureResult | null {
  return detectGestureFromLandmarks(lms, isLeftHand);
}

// ── Gesture guide (shown in the Guide tab) ───────────────────────────────────
export const GESTURE_GUIDE: GestureGuideEntry[] = [
  // Letters
  { id: 'A',  label: 'A',    category: 'letter',  emoji: '✊',  description: 'Closed fist with thumb extended sideways' },
  { id: 'F',  label: 'F',    category: 'letter',  emoji: '🖖',  description: 'Middle + ring + pinky up; index curls to touch thumb' },
  { id: 'I',  label: 'I',    category: 'letter',  emoji: '🤙',  description: 'Pinky finger up, all others folded' },
  { id: 'K',  label: 'K',    category: 'letter',  emoji: '✌️', description: 'Index + middle up with thumb out sideways' },
  { id: 'L',  label: 'L',    category: 'letter',  emoji: '👆',  description: 'Index up + thumb out sideways (L-shape)' },
  { id: 'Y',  label: 'Y',    category: 'letter',  emoji: '🤙',  description: 'Thumb + pinky extended — hang loose (also ILoveYou sign)' },
  // Numbers
  { id: 'one',   label: '1',    category: 'number',  emoji: '☝️', description: 'Index finger only pointing up' },
  { id: 'two',   label: '2/V',  category: 'number',  emoji: '✌️', description: 'Index + middle up — peace sign' },
  { id: 'three', label: '3/W',  category: 'number',  emoji: '3️⃣', description: 'Index + middle + ring up' },
  { id: 'four',  label: '4/B',  category: 'number',  emoji: '4️⃣', description: 'All 4 fingers up, thumb tucked' },
  // Commands
  { id: 'five',      label: 'SPACE', category: 'command', emoji: '✋', description: 'Open hand — inserts a space' },
  { id: 'thumbsup',  label: 'SPEAK', category: 'command', emoji: '👍', description: 'Thumbs up — speaks the sentence aloud' },
  { id: 'thumbsdown',label: 'BACK',  category: 'command', emoji: '👎', description: 'Thumbs down — deletes the last character' },
  { id: 'clear',     label: 'CLEAR', category: 'command', emoji: '🤘', description: 'Rock-on (index + pinky) — clears the sentence' },
];
