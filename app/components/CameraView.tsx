// components/CameraView.tsx
'use client';
import { useEffect, useRef, useState, useCallback } from 'react';
import Script from 'next/script';
import { detectGesture, type GestureResult, type Landmark } from '../lib/gestures';

// ── Minimal MediaPipe Hands types (loaded at runtime via CDN) ─────────────────
interface HandednessEntry {
  label: 'Left' | 'Right';
  score: number;
}
interface HandsResults {
  image: CanvasImageSource;
  multiHandLandmarks?: Landmark[][];
  multiHandedness?: HandednessEntry[];
}
interface HandsInstance {
  setOptions(opts: Record<string, unknown>): void;
  onResults(cb: (r: HandsResults) => void): void;
  send(input: { image: CanvasImageSource }): Promise<void>;
}
interface HandsConstructor {
  new (config: { locateFile: (f: string) => string }): HandsInstance;
}


const DWELL_MS = 1500;   // hold a gesture this long to confirm it
const COOLDOWN_MS = 800; // min gap between two confirmations

// MediaPipe hand-bone connections (landmark index pairs)
const CONNECTIONS: [number, number][] = [
  [0, 1], [1, 2], [2, 3], [3, 4],          // thumb
  [0, 5], [5, 6], [6, 7], [7, 8],          // index
  [0, 9], [9, 10], [10, 11], [11, 12],     // middle
  [0, 13], [13, 14], [14, 15], [15, 16],   // ring
  [0, 17], [17, 18], [18, 19], [19, 20],   // pinky
  [5, 9], [9, 13], [13, 17],               // knuckle ridge
];

const TIP_INDICES = new Set([4, 8, 12, 16, 20]);

// ── Drawing helpers ───────────────────────────────────────────────────────────
/** Convert a MediaPipe normalised landmark to canvas pixel coords (x is mirrored). */
function lmPx(lm: Landmark, w: number, h: number) {
  return { x: (1 - lm.x) * w, y: lm.y * h };
}

function drawSkeleton(
  ctx: CanvasRenderingContext2D,
  lms: Landmark[],
  w: number,
  h: number,
) {
  // Connections
  ctx.strokeStyle = 'rgba(0, 255, 128, 0.75)';
  ctx.lineWidth = 2;
  for (const [a, b] of CONNECTIONS) {
    const pa = lmPx(lms[a], w, h);
    const pb = lmPx(lms[b], w, h);
    ctx.beginPath();
    ctx.moveTo(pa.x, pa.y);
    ctx.lineTo(pb.x, pb.y);
    ctx.stroke();
  }
  // Dots
  for (let i = 0; i < lms.length; i++) {
    const p = lmPx(lms[i], w, h);
    const isTip = TIP_INDICES.has(i);
    ctx.beginPath();
    ctx.arc(p.x, p.y, isTip ? 6 : 4, 0, Math.PI * 2);
    ctx.fillStyle = isTip ? '#FF6B6B' : '#FFFFFF';
    ctx.fill();
    ctx.strokeStyle = 'rgba(0, 255, 128, 0.5)';
    ctx.lineWidth = 1;
    ctx.stroke();
  }
}

function drawGestureLabel(
  ctx: CanvasRenderingContext2D,
  lms: Landmark[],
  w: number,
  h: number,
  gesture: GestureResult,
  confirmed: boolean,
) {
  const tip = lmPx(lms[12], w, h); // middle-finger tip as anchor
  const x = tip.x;
  const y = tip.y - 20;

  ctx.save();
  ctx.font = 'bold 28px sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'bottom';

  const label = `${gesture.emoji} ${gesture.label}`;
  const tw = ctx.measureText(label).width + 22;
  const th = 42;
  const bx = x - tw / 2;
  const by = y - th;

  ctx.fillStyle = confirmed
    ? 'rgba(0, 180, 80, 0.9)'
    : 'rgba(15, 23, 42, 0.85)';
  ctx.fillRect(bx, by, tw, th);

  ctx.strokeStyle = confirmed ? '#22c55e' : '#06b6d4';
  ctx.lineWidth = 2;
  ctx.strokeRect(bx, by, tw, th);

  ctx.fillStyle = '#FFFFFF';
  ctx.fillText(label, x, y - 5);
  ctx.restore();
}

function drawDwellRing(
  ctx: CanvasRenderingContext2D,
  lms: Landmark[],
  w: number,
  h: number,
  progress: number,
) {
  const wrist = lmPx(lms[0], w, h);
  const r = 32;

  // Background ring
  ctx.beginPath();
  ctx.arc(wrist.x, wrist.y, r, 0, Math.PI * 2);
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
  ctx.lineWidth = 5;
  ctx.stroke();

  if (progress > 0) {
    ctx.beginPath();
    ctx.arc(
      wrist.x,
      wrist.y,
      r,
      -Math.PI / 2,
      -Math.PI / 2 + progress * Math.PI * 2,
    );
    ctx.strokeStyle = progress >= 0.99 ? '#22c55e' : '#06b6d4';
    ctx.lineWidth = 5;
    ctx.stroke();
  }
}

// ── Component ─────────────────────────────────────────────────────────────────
export interface CameraViewProps {
  onConfirm: (gesture: GestureResult) => void;
  onGestureChange?: (gesture: GestureResult | null, progress: number) => void;
}

export default function CameraView({ onConfirm, onGestureChange }: CameraViewProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isReady, setIsReady] = useState(false);
  const [camError, setCamError] = useState<string | null>(null);

  // Keep callback refs stable so the animation loop never stales
  const onConfirmRef = useRef(onConfirm);
  useEffect(() => { onConfirmRef.current = onConfirm; }, [onConfirm]);
  const onGestureChangeRef = useRef(onGestureChange);
  useEffect(() => { onGestureChangeRef.current = onGestureChange; }, [onGestureChange]);

  // Dwell timer state — managed in refs to avoid re-renders inside the loop
  const currentIdRef = useRef<string | null>(null);
  const dwellStartRef = useRef(0);
  const lastConfirmRef = useRef(0);
  const lastNotifyRef = useRef(0);
  const animFrameRef = useRef<number | null>(null);
  const handsRef = useRef<HandsInstance | null>(null);

  const onResults = useCallback((results: HandsResults) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const w = canvas.width;
    const h = canvas.height;

    // Draw mirrored camera frame
    ctx.save();
    ctx.translate(w, 0);
    ctx.scale(-1, 1);
    ctx.drawImage(results.image, 0, 0, w, h);
    ctx.restore();

    if (!results.multiHandLandmarks?.length) {
      if (currentIdRef.current !== null) {
        currentIdRef.current = null;
        onGestureChangeRef.current?.(null, 0);
      }
      return;
    }

    const lms = results.multiHandLandmarks[0];
    const isLeft = results.multiHandedness?.[0]?.label === 'Left';
    const gesture = detectGesture(lms, isLeft);
    const now = Date.now();

    if (gesture) {
      if (gesture.id !== currentIdRef.current) {
        currentIdRef.current = gesture.id;
        dwellStartRef.current = now;
      }

      const elapsed = now - dwellStartRef.current;
      const progress = Math.min(elapsed / DWELL_MS, 1);

      // Throttle React state update to ~10 fps
      if (now - lastNotifyRef.current > 100) {
        onGestureChangeRef.current?.(gesture, progress);
        lastNotifyRef.current = now;
      }

      const confirmed = progress >= 0.99;
      if (confirmed && now - lastConfirmRef.current > COOLDOWN_MS) {
        lastConfirmRef.current = now;
        currentIdRef.current = null;
        onConfirmRef.current(gesture);
        onGestureChangeRef.current?.(null, 0);
      }

      drawSkeleton(ctx, lms, w, h);
      drawGestureLabel(ctx, lms, w, h, gesture, confirmed);
      drawDwellRing(ctx, lms, w, h, progress);
    } else {
      if (currentIdRef.current !== null) {
        currentIdRef.current = null;
        onGestureChangeRef.current?.(null, 0);
      }
      drawSkeleton(ctx, lms, w, h);
    }
  }, []);

  useEffect(() => {
    if (!isReady) return;
    const Hands = (window as unknown as { Hands?: HandsConstructor }).Hands;
    if (!Hands) return;

    const hands = new Hands({
      locateFile: (file: string) =>
        `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`,
    });
    hands.setOptions({
      maxNumHands: 1,
      modelComplexity: 1,
      minDetectionConfidence: 0.7,
      minTrackingConfidence: 0.7,
    });
    hands.onResults(onResults);
    handsRef.current = hands;

    navigator.mediaDevices
      .getUserMedia({ video: { width: 1280, height: 720, facingMode: 'user' } })
      .then((stream) => {
        if (!videoRef.current) return;
        videoRef.current.srcObject = stream;
        videoRef.current.play();
        const loop = async () => {
          if (videoRef.current && handsRef.current) {
            await (handsRef.current as HandsInstance).send({ image: videoRef.current });
          }
          animFrameRef.current = requestAnimationFrame(loop);
        };
        loop();
      })
      .catch(() => {
        setCamError('Camera access denied. Please allow camera permissions and reload.');
      });

    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [isReady, onResults]);

  return (
    <div className="relative w-full h-full bg-gray-950 overflow-hidden">
      {/* Load MediaPipe Hands from CDN */}
      <Script
        src="https://cdn.jsdelivr.net/npm/@mediapipe/hands/hands.js"
        strategy="afterInteractive"
        onLoad={() => setIsReady(true)}
      />

      {/* Loading state */}
      {!isReady && !camError && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-950 z-10 gap-4">
          <div className="w-12 h-12 border-4 border-t-cyan-400 border-gray-700 rounded-full animate-spin" />
          <p className="text-gray-300 text-sm font-medium">Loading AI hand-tracking model…</p>
          <p className="text-gray-600 text-xs">This may take a few seconds</p>
        </div>
      )}

      {/* Camera permission error */}
      {camError && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-950 z-10 gap-3 px-8 text-center">
          <span className="text-5xl">📷</span>
          <p className="text-red-400 font-semibold">Camera Unavailable</p>
          <p className="text-gray-400 text-sm">{camError}</p>
        </div>
      )}

      {/* Instruction overlay (shown after ready) */}
      {isReady && !camError && (
        <div className="absolute top-3 left-0 right-0 flex justify-center z-10 pointer-events-none">
          <span className="bg-black/60 text-gray-300 text-xs px-3 py-1 rounded-full">
            Hold a gesture for 1.5 s to confirm
          </span>
        </div>
      )}

      <video ref={videoRef} className="hidden" autoPlay playsInline muted />
      <canvas
        ref={canvasRef}
        width={1280}
        height={720}
        className="w-full h-full object-cover"
      />
    </div>
  );
}
