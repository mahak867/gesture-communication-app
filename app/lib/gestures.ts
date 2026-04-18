// app/lib/gestures.ts
// Pure gesture-detection logic for MediaPipe Hands landmarks.

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

/** Returns true when a finger's tip is clearly extended above its PIP joint. */
function fingerUp(tip: Landmark, pip: Landmark, threshold = 0.03): boolean {
  return tip.y < pip.y - threshold;
}

/**
 * Detects a hand gesture from 21 MediaPipe Landmarks.
 *
 * Landmark indices:
 *   0 = wrist
 *   Thumb:  CMC=1  MCP=2  IP=3   TIP=4
 *   Index:  MCP=5  PIP=6  DIP=7  TIP=8
 *   Middle: MCP=9  PIP=10 DIP=11 TIP=12
 *   Ring:   MCP=13 PIP=14 DIP=15 TIP=16
 *   Pinky:  MCP=17 PIP=18 DIP=19 TIP=20
 */
export function detectGesture(
  lms: Landmark[],
  isLeftHand = false,
): GestureResult | null {
  const iUp = fingerUp(lms[8], lms[6]);
  const mUp = fingerUp(lms[12], lms[10]);
  const rUp = fingerUp(lms[16], lms[14]);
  const pUp = fingerUp(lms[20], lms[18]);

  // Thumb pointing straight up
  const tUp = lms[4].y < lms[3].y - 0.03;
  // Thumb pointing straight down
  const tDown = lms[4].y > lms[2].y + 0.04 && lms[4].y > lms[0].y - 0.02;
  // Thumb extended sideways (away from palm, accounting for hand side)
  const tOut = isLeftHand
    ? lms[4].x > lms[3].x + 0.07
    : lms[4].x < lms[3].x - 0.07;

  // --- Numbers / open-hand commands (checked first, most fingers up) ---
  if (iUp && mUp && rUp && pUp && tUp)
    return { id: 'five', label: 'SPACE', category: 'command', emoji: '✋' };
  if (iUp && mUp && rUp && pUp && !tUp)
    return { id: 'four', label: '4', category: 'number', emoji: '4️⃣' };
  if (iUp && mUp && rUp && !pUp)
    return { id: 'three', label: '3', category: 'number', emoji: '3️⃣' };
  // K: index + middle up with thumb out — checked before "2" so tOut differentiates them
  if (iUp && mUp && !rUp && !pUp && tOut)
    return { id: 'K', label: 'K', category: 'letter', emoji: '✌️' };
  if (iUp && mUp && !rUp && !pUp)
    return { id: 'two', label: '2', category: 'number', emoji: '✌️' };
  if (iUp && !mUp && !rUp && !pUp && !tUp && !tOut)
    return { id: 'one', label: '1', category: 'number', emoji: '☝️' };

  // --- Command gestures (checked before letters to avoid collisions) ---
  if (tUp && !iUp && !mUp && !rUp && !pUp && !tOut)
    return { id: 'thumbsup', label: 'SPEAK', category: 'command', emoji: '👍' };
  if (tDown && !iUp && !mUp && !rUp && !pUp)
    return { id: 'thumbsdown', label: 'BACK', category: 'command', emoji: '👎' };

  // CLEAR: index + pinky extended (rock-on / horns shape) — no thumb, no middle, no ring
  if (iUp && !mUp && !rUp && pUp && !tUp && !tOut)
    return { id: 'clear', label: 'CLEAR', category: 'command', emoji: '🤘' };

  // --- Letter gestures ---
  // A: closed fist with thumb extended sideways
  if (!iUp && !mUp && !rUp && !pUp && tOut)
    return { id: 'A', label: 'A', category: 'letter', emoji: '✊' };
  // F: middle + ring + pinky up, index and thumb folded (index curls to touch thumb)
  if (!iUp && mUp && rUp && pUp && !tUp && !tOut)
    return { id: 'F', label: 'F', category: 'letter', emoji: '🖖' };
  // I: pinky only (no index)
  if (!iUp && !mUp && !rUp && pUp && !tUp)
    return { id: 'I', label: 'I', category: 'letter', emoji: '🤙' };
  // L: index up + thumb extended sideways
  if (iUp && !mUp && !rUp && !pUp && tOut)
    return { id: 'L', label: 'L', category: 'letter', emoji: '👆' };
  // Y: thumb + pinky up (hang-loose)
  if (tUp && pUp && !iUp && !mUp && !rUp)
    return { id: 'Y', label: 'Y', category: 'letter', emoji: '🤙' };

  return null;
}

export const GESTURE_GUIDE: GestureGuideEntry[] = [
  // Letters
  {
    id: 'A',
    label: 'A',
    category: 'letter',
    emoji: '✊',
    description: 'Fist with thumb pointing to the side',
  },
  {
    id: 'F',
    label: 'F',
    category: 'letter',
    emoji: '🖖',
    description: 'Middle + ring + pinky up; index curls to touch thumb',
  },
  {
    id: 'I',
    label: 'I',
    category: 'letter',
    emoji: '🤙',
    description: 'Pinky finger up, all others folded',
  },
  {
    id: 'K',
    label: 'K',
    category: 'letter',
    emoji: '✌️',
    description: 'Index + middle up with thumb pointing sideways',
  },
  {
    id: 'L',
    label: 'L',
    category: 'letter',
    emoji: '👆',
    description: 'Index up + thumb out sideways (L-shape)',
  },
  {
    id: 'Y',
    label: 'Y',
    category: 'letter',
    emoji: '🤙',
    description: 'Thumb + pinky extended (hang loose)',
  },
  // Numbers (note: 2=V, 3=W, 4=B share the same hand shape)
  {
    id: 'one',
    label: '1',
    category: 'number',
    emoji: '☝️',
    description: 'Index finger only pointing up',
  },
  {
    id: 'two',
    label: '2 / V',
    category: 'number',
    emoji: '✌️',
    description: 'Index + middle up (peace sign) — also used for ASL V',
  },
  {
    id: 'three',
    label: '3 / W',
    category: 'number',
    emoji: '3️⃣',
    description: 'Index + middle + ring up — also used for ASL W',
  },
  {
    id: 'four',
    label: '4 / B',
    category: 'number',
    emoji: '4️⃣',
    description: 'All 4 fingers up, thumb tucked — also used for ASL B',
  },
  // Commands
  {
    id: 'five',
    label: 'SPACE',
    category: 'command',
    emoji: '✋',
    description: 'Open hand — inserts a space',
  },
  {
    id: 'thumbsup',
    label: 'SPEAK',
    category: 'command',
    emoji: '👍',
    description: 'Thumbs up — speaks the sentence aloud',
  },
  {
    id: 'thumbsdown',
    label: 'BACK',
    category: 'command',
    emoji: '👎',
    description: 'Thumbs down — deletes the last character',
  },
  {
    id: 'clear',
    label: 'CLEAR',
    category: 'command',
    emoji: '🤘',
    description: 'Rock-on (index + pinky) — clears the sentence',
  },
];

