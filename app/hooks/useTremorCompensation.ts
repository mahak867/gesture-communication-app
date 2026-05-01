import { useRef, useCallback } from "react";

const ALPHA = 0.35; // smoothing factor — lower = more smoothing

export function useTremorCompensation(enabled: boolean = true) {
  const smoothed = useRef<number[][] | null>(null);

  const smooth = useCallback(
    (landmarks: number[][]): number[][] => {
      if (!enabled) return landmarks;
      if (!smoothed.current || smoothed.current.length !== landmarks.length) {
        smoothed.current = landmarks.map((l) => [...l]);
        return smoothed.current;
      }
      smoothed.current = landmarks.map((lm, i) =>
        lm.map((val, j) => ALPHA * val + (1 - ALPHA) * (smoothed.current![i]?.[j] ?? val))
      );
      return smoothed.current;
    },
    [enabled]
  );

  const reset = useCallback(() => { smoothed.current = null; }, []);

  return { smooth, reset };
}
