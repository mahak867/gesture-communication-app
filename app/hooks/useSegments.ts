'use client';

import { useEffect, useRef } from 'react';
import { useGlove } from './useGlove';
import { activeFingers, features } from '../lib/sensors';
import { Segmenter, type Seq } from '../lib/recognizer';
import type { Profile } from '../lib/profiles';

export interface LiveRef {
  features: number[] | null;
  busy: boolean;
  holdProgress: number;
  button: boolean;
}

/**
 * Turns the glove's frame stream into sign segments using the profile's
 * calibration. Translation and recording both use this, so a sign is captured
 * exactly the same way when it is taught and when it is used.
 */
export function useSegments(profile: Profile | null, onSegment: (seg: Seq) => void, enabled = true) {
  const { subscribe } = useGlove();
  const live = useRef<LiveRef>({ features: null, busy: false, holdProgress: 0, button: false });
  const cb = useRef(onSegment);
  useEffect(() => {
    cb.current = onSegment;
  }, [onSegment]);

  const cal = profile?.calibration;
  const rest = profile?.rest;

  useEffect(() => {
    if (!enabled || !cal || !rest) return;
    const active = activeFingers(cal);
    const seg = new Segmenter(rest);
    return subscribe((f) => {
      const x = features(f, cal, active);
      const out = seg.push(x);
      live.current = { features: x, busy: seg.busy, holdProgress: seg.holdProgress, button: f.button };
      if (out) cb.current(out);
    });
  }, [subscribe, enabled, cal, rest]);

  return live;
}
