import { describe, it, expect } from 'vitest';
import { detectGesture } from '../app/lib/gestures';
import type { Landmark } from '../app/lib/gestures';

/**
 * Build a minimal 21-landmark array.
 * Default values place every landmark at (0.5, 0.5, 0) — all fingers "folded".
 * Override individual landmarks to trigger specific gesture conditions.
 */
function makeLandmarks(overrides: Partial<Record<number, Partial<Landmark>>> = {}): Landmark[] {
  const lms: Landmark[] = Array.from({ length: 21 }, () => ({ x: 0.5, y: 0.5, z: 0 }));
  for (const [idx, patch] of Object.entries(overrides)) {
    lms[Number(idx)] = { ...lms[Number(idx)], ...patch };
  }
  return lms;
}

/**
 * Return landmarks where the named fingers are clearly extended upward.
 * `fingerUp` checks: tip.y < pip.y - 0.03
 *   index:  tip=8, pip=6
 *   middle: tip=12, pip=10
 *   ring:   tip=16, pip=14
 *   pinky:  tip=20, pip=18
 *   thumb (up): tip=4, base=3  → tip.y < base.y - 0.03
 *   thumb (out right hand): tip.x < base.x - 0.07
 */
function withFingersUp(fingers: ('index' | 'middle' | 'ring' | 'pinky' | 'thumbUp' | 'thumbOut' | 'thumbDown')[]): Landmark[] {
  const overrides: Partial<Record<number, Partial<Landmark>>> = {};

  for (const f of fingers) {
    switch (f) {
      case 'index':
        overrides[8] = { y: 0.1 };  // tip high
        overrides[6] = { y: 0.5 };  // pip low → tip.y < pip.y - 0.03 ✓
        break;
      case 'middle':
        overrides[12] = { y: 0.1 };
        overrides[10] = { y: 0.5 };
        break;
      case 'ring':
        overrides[16] = { y: 0.1 };
        overrides[14] = { y: 0.5 };
        break;
      case 'pinky':
        overrides[20] = { y: 0.1 };
        overrides[18] = { y: 0.5 };
        break;
      case 'thumbUp':
        // tUp: lms[4].y < lms[3].y - 0.03
        overrides[4] = { y: 0.1 };
        overrides[3] = { y: 0.5 };
        break;
      case 'thumbOut':
        // tOut (right hand): lms[4].x < lms[3].x - 0.07
        overrides[4] = { x: 0.1 };
        overrides[3] = { x: 0.5 };
        break;
      case 'thumbDown':
        // tDown: lms[4].y > lms[2].y + 0.04 && lms[4].y > lms[0].y - 0.02
        overrides[4] = { y: 0.9 };
        overrides[2] = { y: 0.8 };  // 0.9 > 0.8 + 0.04 = 0.84 ✓
        overrides[0] = { y: 0.9 };  // 0.9 > 0.9 - 0.02 = 0.88 ✓
        break;
    }
  }

  return makeLandmarks(overrides);
}

describe('detectGesture', () => {
  it('returns null for a neutral closed hand', () => {
    expect(detectGesture(makeLandmarks())).toBeNull();
  });

  describe('numbers', () => {
    it('detects 1 — index only up', () => {
      const result = detectGesture(withFingersUp(['index']));
      expect(result?.id).toBe('one');
      expect(result?.label).toBe('1');
      expect(result?.category).toBe('number');
    });

    it('detects 2 — index + middle up (no thumb)', () => {
      const result = detectGesture(withFingersUp(['index', 'middle']));
      expect(result?.id).toBe('two');
      expect(result?.label).toBe('2');
    });

    it('detects 3 — index + middle + ring up', () => {
      const result = detectGesture(withFingersUp(['index', 'middle', 'ring']));
      expect(result?.id).toBe('three');
      expect(result?.label).toBe('3');
    });

    it('detects 4 — index + middle + ring + pinky up (no thumb)', () => {
      const result = detectGesture(withFingersUp(['index', 'middle', 'ring', 'pinky']));
      expect(result?.id).toBe('four');
      expect(result?.label).toBe('4');
    });
  });

  describe('commands', () => {
    it('detects SPACE (five / open hand) — all fingers + thumb up', () => {
      const result = detectGesture(withFingersUp(['index', 'middle', 'ring', 'pinky', 'thumbUp']));
      expect(result?.id).toBe('five');
      expect(result?.label).toBe('SPACE');
      expect(result?.category).toBe('command');
    });

    it('detects SPEAK (thumbs up) — only thumb up', () => {
      const result = detectGesture(withFingersUp(['thumbUp']));
      expect(result?.id).toBe('thumbsup');
      expect(result?.label).toBe('SPEAK');
    });

    it('detects BACK (thumbs down)', () => {
      const result = detectGesture(withFingersUp(['thumbDown']));
      expect(result?.id).toBe('thumbsdown');
      expect(result?.label).toBe('BACK');
    });

    it('detects CLEAR (rock-on: index + pinky, no thumb)', () => {
      const result = detectGesture(withFingersUp(['index', 'pinky']));
      expect(result?.id).toBe('clear');
      expect(result?.label).toBe('CLEAR');
    });
  });

  describe('letters', () => {
    it('detects A — closed fist with thumb out sideways', () => {
      const result = detectGesture(withFingersUp(['thumbOut']));
      expect(result?.id).toBe('A');
      expect(result?.category).toBe('letter');
    });

    it('detects I — pinky only up', () => {
      const result = detectGesture(withFingersUp(['pinky']));
      expect(result?.id).toBe('I');
      expect(result?.label).toBe('I');
    });

    it('detects L — index up + thumb out', () => {
      const result = detectGesture(withFingersUp(['index', 'thumbOut']));
      expect(result?.id).toBe('L');
      expect(result?.label).toBe('L');
    });

    it('detects K — index + middle + thumb out (right hand)', () => {
      const result = detectGesture(withFingersUp(['index', 'middle', 'thumbOut']));
      expect(result?.id).toBe('K');
      expect(result?.label).toBe('K');
    });

    it('detects Y — thumb up + pinky up', () => {
      const result = detectGesture(withFingersUp(['thumbUp', 'pinky']));
      expect(result?.id).toBe('Y');
      expect(result?.label).toBe('Y');
    });

    it('detects F — middle + ring + pinky up, no index or thumb', () => {
      const result = detectGesture(withFingersUp(['middle', 'ring', 'pinky']));
      expect(result?.id).toBe('F');
      expect(result?.label).toBe('F');
    });
  });

  describe('isLeftHand flag', () => {
    it('detects A on left hand when thumb points to the right (tOut left)', () => {
      // For left hand: tOut = lms[4].x > lms[3].x + 0.07
      const lms = makeLandmarks({ 4: { x: 0.9 }, 3: { x: 0.5 } });
      const result = detectGesture(lms, true);
      expect(result?.id).toBe('A');
    });
  });
});
