// components/CameraView.tsx
'use client';
import { useEffect, useRef, useState, useCallback } from 'react';
import { resolveGesture, type GestureResult, type Landmark } from '../lib/gestures';
import type { GestureRecognizer, GestureRecognizerResult } from '@mediapipe/tasks-vision';

// ── Shared AudioContext (one instance, reused for every beep) ────────────────
let _audioCtx: AudioContext | null = null;
function getAudioCtx(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  try {
    if (!_audioCtx || _audioCtx.state === 'closed') {
      const Ctor =
        window.AudioContext ??
        (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!Ctor) return null;
      _audioCtx = new Ctor();
    }
    return _audioCtx;
  } catch { return null; }
}

function playConfirmTone() {
  const ctx = getAudioCtx();
  if (!ctx) return;
  try {
    if (ctx.state === 'suspended') ctx.resume();
    const osc  = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.type = 'sine';
    osc.frequency.value = 880;
    gain.gain.setValueAtTime(0.18, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.12);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.12);
  } catch { /* unavailable */ }
}

function triggerHaptic() {
  if (typeof navigator === 'undefined') return;
  try {
    (navigator as Navigator & { vibrate?: (ms: number) => void }).vibrate?.(50);
  } catch { /* unavailable */ }
}

// ── Drawing helpers ──────────────────────────────────────────────────────────
// MediaPipe Tasks hand connections (21-landmark model)
const CONNECTIONS: [number, number][] = [
  [0,1],[1,2],[2,3],[3,4],
  [0,5],[5,6],[6,7],[7,8],
  [0,9],[9,10],[10,11],[11,12],
  [0,13],[13,14],[14,15],[15,16],
  [0,17],[17,18],[18,19],[19,20],
  [5,9],[9,13],[13,17],
];
const TIP_INDICES = new Set([4, 8, 12, 16, 20]);

function lmPx(lm: Landmark, w: number, h: number) {
  return { x: (1 - lm.x) * w, y: lm.y * h };
}

function drawSkeleton(ctx: CanvasRenderingContext2D, lms: Landmark[], w: number, h: number) {
  ctx.strokeStyle = 'rgba(0,255,128,0.75)';
  ctx.lineWidth = 2;
  for (const [a, b] of CONNECTIONS) {
    const pa = lmPx(lms[a], w, h);
    const pb = lmPx(lms[b], w, h);
    ctx.beginPath();
    ctx.moveTo(pa.x, pa.y);
    ctx.lineTo(pb.x, pb.y);
    ctx.stroke();
  }
  for (let i = 0; i < lms.length; i++) {
    const p = lmPx(lms[i], w, h);
    const isTip = TIP_INDICES.has(i);
    ctx.beginPath();
    ctx.arc(p.x, p.y, isTip ? 6 : 4, 0, Math.PI * 2);
    ctx.fillStyle = isTip ? '#FF6B6B' : '#FFFFFF';
    ctx.fill();
    ctx.strokeStyle = 'rgba(0,255,128,0.5)';
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
  confidence: number,
) {
  const tip = lmPx(lms[12], w, h);
  const x = tip.x;
  const y = tip.y - 20;
  ctx.save();
  ctx.font = 'bold 28px sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'bottom';
  const label = `${gesture.emoji} ${gesture.label}${confidence > 0 ? ` ${Math.round(confidence * 100)}%` : ''}`;
  const tw = ctx.measureText(label).width + 22;
  const th = 42;
  const bx = x - tw / 2;
  const by = y - th;
  ctx.fillStyle = confirmed ? 'rgba(0,180,80,0.9)' : 'rgba(15,23,42,0.85)';
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
  ctx.beginPath();
  ctx.arc(wrist.x, wrist.y, r, 0, Math.PI * 2);
  ctx.strokeStyle = 'rgba(255,255,255,0.15)';
  ctx.lineWidth = 5;
  ctx.stroke();
  if (progress > 0) {
    ctx.beginPath();
    ctx.arc(wrist.x, wrist.y, r, -Math.PI / 2, -Math.PI / 2 + progress * Math.PI * 2);
    ctx.strokeStyle = progress >= 0.99 ? '#22c55e' : '#06b6d4';
    ctx.lineWidth = 5;
    ctx.stroke();
  }
}

// ── Per-hand dwell tracking ──────────────────────────────────────────────────
interface HandState {
  currentId: string | null;
  dwellStart: number;
  lastConfirm: number;
}
const makeHandState = (): HandState => ({ currentId: null, dwellStart: 0, lastConfirm: 0 });
const COOLDOWN_MS = 800;
const MAX_HANDS = 2;

// ── Component ────────────────────────────────────────────────────────────────
export interface CameraViewProps {
  onConfirm: (gesture: GestureResult) => void;
  onGestureChange?: (gesture: GestureResult | null, progress: number) => void;
  dwellMs?: number;
}

type LoadState = 'loading-model' | 'loading-camera' | 'ready' | 'error';

export default function CameraView({ onConfirm, onGestureChange, dwellMs = 1500 }: CameraViewProps) {
  const videoRef  = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const [loadState, setLoadState] = useState<LoadState>('loading-model');
  const [camError, setCamError]   = useState<string | null>(null);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('user');

  // Stable refs so callbacks don't go stale inside rAF loops
  const onConfirmRef       = useRef(onConfirm);
  const onGestureChangeRef = useRef(onGestureChange);
  const dwellMsRef         = useRef(dwellMs);
  useEffect(() => { onConfirmRef.current       = onConfirm;       }, [onConfirm]);
  useEffect(() => { onGestureChangeRef.current = onGestureChange; }, [onGestureChange]);
  useEffect(() => { dwellMsRef.current         = dwellMs;         }, [dwellMs]);

  const handsStateRef  = useRef<HandState[]>(Array.from({ length: MAX_HANDS }, makeHandState));
  const lastNotifyRef  = useRef(0);
  const animFrameRef   = useRef<number | null>(null);
  const streamRef      = useRef<MediaStream | null>(null);
  const recognizerRef  = useRef<GestureRecognizer | null>(null);

  // ── Frame processing ───────────────────────────────────────────────────────
  const processFrame = useCallback((result: GestureRecognizerResult) => {
    const canvas = canvasRef.current;
    const video  = videoRef.current;
    if (!canvas || !video) return;
    const ctx2d = canvas.getContext('2d');
    if (!ctx2d) return;

    const w = canvas.width;
    const h = canvas.height;

    // Draw mirrored video frame
    ctx2d.save();
    ctx2d.translate(w, 0);
    ctx2d.scale(-1, 1);
    ctx2d.drawImage(video, 0, 0, w, h);
    ctx2d.restore();

    const handCount = result.landmarks?.length ?? 0;

    if (handCount === 0) {
      const anyActive = handsStateRef.current.some((hs) => hs.currentId !== null);
      if (anyActive) {
        handsStateRef.current.forEach((hs) => { hs.currentId = null; });
        onGestureChangeRef.current?.(null, 0);
      }
      return;
    }

    const now = Date.now();
    let bestGesture: GestureResult | null = null;
    let bestProgress = 0;

    for (let hi = 0; hi < Math.min(handCount, MAX_HANDS); hi++) {
      const lms        = result.landmarks[hi] as Landmark[];
      const isLeft     = result.handedness?.[hi]?.[0]?.categoryName === 'Left';
      // Confidence score from the Tasks model (0–1), 0 when using landmark fallback
      const confidence = result.gestures?.[hi]?.[0]?.score ?? 0;
      const categoryName = result.gestures?.[hi]?.[0]?.categoryName ?? 'None';

      // resolveGesture: tries built-in Tasks result, falls back to landmark math
      const gesture = resolveGesture(categoryName, lms, isLeft);
      const hs = handsStateRef.current[hi];

      if (gesture) {
        if (gesture.id !== hs.currentId) {
          hs.currentId  = gesture.id;
          hs.dwellStart = now;
        }
        const elapsed  = now - hs.dwellStart;
        const progress = Math.min(elapsed / dwellMsRef.current, 1);

        if (progress > bestProgress) {
          bestProgress = progress;
          bestGesture  = gesture;
        }

        const confirmed = progress >= 0.99;
        if (confirmed && now - hs.lastConfirm > COOLDOWN_MS) {
          hs.lastConfirm = now;
          hs.currentId   = null;
          playConfirmTone();
          triggerHaptic();
          onConfirmRef.current(gesture);
          onGestureChangeRef.current?.(null, 0);
        }

        drawSkeleton(ctx2d, lms, w, h);
        drawGestureLabel(ctx2d, lms, w, h, gesture, confirmed, confidence);
        drawDwellRing(ctx2d, lms, w, h, progress);
      } else {
        if (hs.currentId !== null) hs.currentId = null;
        drawSkeleton(ctx2d, lms, w, h);
      }
    }

    // Clear state for hands that left the frame
    for (let hi = handCount; hi < MAX_HANDS; hi++) {
      handsStateRef.current[hi].currentId = null;
    }

    if (now - lastNotifyRef.current > 100) {
      onGestureChangeRef.current?.(bestGesture, bestProgress);
      lastNotifyRef.current = now;
    }
  }, []);

  // ── Initialise MediaPipe Tasks GestureRecognizer ───────────────────────────
  useEffect(() => {
    let cancelled = false;

    async function init() {
      try {
        // Dynamic import so Next.js doesn't try to SSR the WASM module
        const { GestureRecognizer, FilesetResolver } = await import('@mediapipe/tasks-vision');

        const vision = await FilesetResolver.forVisionTasks(
          'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm',
        );

        const recognizer = await GestureRecognizer.createFromOptions(vision, {
          baseOptions: {
            modelAssetPath:
              'https://storage.googleapis.com/mediapipe-models/gesture_recognizer/gesture_recognizer/float16/1/gesture_recognizer.task',
            delegate: 'GPU',
          },
          runningMode: 'VIDEO',
          numHands: MAX_HANDS,
          minHandDetectionConfidence: 0.65,
          minHandPresenceConfidence:  0.65,
          minTrackingConfidence:      0.65,
        });

        if (cancelled) { recognizer.close(); return; }
        recognizerRef.current = recognizer;
        if (!cancelled) setLoadState('loading-camera');
      } catch (err) {
        if (!cancelled) {
          console.error('[GestureRecognizer] init failed:', err);
          setCamError('Failed to load AI model. Check your connection and reload.');
          setLoadState('error');
        }
      }
    }

    init();
    return () => { cancelled = true; };
  }, []);

  // ── Start camera + rAF loop ────────────────────────────────────────────────
  useEffect(() => {
    if (loadState !== 'loading-camera') return;
    let cancelled = false;

    // Stop any existing stream
    if (animFrameRef.current) { cancelAnimationFrame(animFrameRef.current); animFrameRef.current = null; }
    if (streamRef.current) { streamRef.current.getTracks().forEach((t) => t.stop()); streamRef.current = null; }

    navigator.mediaDevices
      .getUserMedia({ video: { facingMode, width: { ideal: 1280 }, height: { ideal: 720 } } })
      .then((stream) => {
        if (cancelled) { stream.getTracks().forEach((t) => t.stop()); return; }
        streamRef.current = stream;
        const video = videoRef.current;
        if (!video) return;
        video.srcObject = stream;
        video.play().then(() => {
          if (cancelled) return;
          setCamError(null);
          setLoadState('ready');

          let lastTs = -1;
          const loop = () => {
            const recognizer = recognizerRef.current;
            if (recognizer && video.readyState >= 2) {
              const now = performance.now();
              if (now !== lastTs) {
                const result = recognizer.recognizeForVideo(video, now);
                lastTs = now;
                processFrame(result);
              }
            }
            animFrameRef.current = requestAnimationFrame(loop);
          };
          loop();
        });
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        let msg = 'Camera access failed. Please allow permissions and reload.';
        if (err instanceof DOMException) {
          if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError')
            msg = 'Camera permission denied. Click the camera icon in the address bar → Allow, then reload.';
          else if (err.name === 'NotFoundError')
            msg = 'No camera found. Connect a camera and reload.';
          else if (err.name === 'NotReadableError')
            msg = 'Camera already in use by another app. Close it, then reload.';
          else if (err.name === 'OverconstrainedError')
            msg = 'Camera settings not supported. Try switching cameras.';
          else if (err.name === 'NotSupportedError')
            msg = 'Camera API not supported. Try Chrome, Firefox, or Safari 15.4+.';
        }
        setCamError(msg);
        setLoadState('error');
      });

    return () => {
      cancelled = true;
      if (animFrameRef.current) { cancelAnimationFrame(animFrameRef.current); animFrameRef.current = null; }
      if (streamRef.current) { streamRef.current.getTracks().forEach((t) => t.stop()); streamRef.current = null; }
    };
  }, [loadState, facingMode, processFrame]);

  // ── Cleanup recognizer on unmount ─────────────────────────────────────────
  useEffect(() => {
    return () => {
      recognizerRef.current?.close();
      recognizerRef.current = null;
    };
  }, []);

  const isReady   = loadState === 'ready';
  const rearLabel = facingMode === 'user' ? 'Switch to rear camera' : 'Switch to front camera';

  return (
    <div className="relative w-full h-full bg-gray-950 overflow-hidden">

      {/* Loading state */}
      {loadState !== 'ready' && loadState !== 'error' && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-950 z-10 gap-5 px-8">
          <div className="w-14 h-14 border-4 border-t-cyan-400 border-gray-700 rounded-full animate-spin" role="status" aria-label="Loading" />
          <div className="flex flex-col items-center gap-1 text-center">
            <p className="text-gray-200 text-sm font-semibold">
              {loadState === 'loading-model' ? 'Loading AI model…' : 'Starting camera…'}
            </p>
            <p className="text-gray-600 text-xs">
              {loadState === 'loading-model'
                ? 'Downloading MediaPipe Gesture Recognizer (first load only)'
                : 'Please allow camera access when prompted'}
            </p>
          </div>
          <div className="flex items-center gap-3 text-xs">
            {(['loading-model', 'loading-camera', 'ready'] as const).map((step, i) => {
              const steps = ['loading-model', 'loading-camera', 'ready'] as const;
              const currentIdx = steps.indexOf(loadState as typeof steps[number]);
              const done = i < currentIdx;
              const active = i === currentIdx;
              return (
                <span key={step} className={`flex items-center gap-1 ${done || active ? 'text-cyan-400' : 'text-gray-600'}`}>
                  <span aria-hidden="true">{done ? '✓' : '○'}</span>
                  {['AI Model', 'Camera', 'Ready'][i]}
                  {i < 2 && <span className="text-gray-700 ml-3">→</span>}
                </span>
              );
            })}
          </div>
        </div>
      )}

      {/* Error state */}
      {loadState === 'error' && (
        <div role="alert" className="absolute inset-0 flex flex-col items-center justify-center bg-gray-950 z-10 gap-3 px-8 text-center">
          <span className="text-5xl" aria-hidden="true">📷</span>
          <p className="text-red-400 font-semibold text-base">Camera Unavailable</p>
          <p className="text-gray-400 text-sm">{camError}</p>
          <div className="flex gap-2 mt-2">
            <button
              onClick={() => window.location.reload()}
              className="bg-cyan-700 hover:bg-cyan-600 text-white text-sm px-4 py-2 rounded-lg transition-colors min-h-[44px]"
            >
              Reload page
            </button>
            <button
              onClick={() => { setFacingMode((m) => m === 'user' ? 'environment' : 'user'); setLoadState('loading-camera'); }}
              className="bg-gray-800 hover:bg-gray-700 border border-gray-700 text-white text-sm px-4 py-2 rounded-lg transition-colors min-h-[44px]"
            >
              Try other camera
            </button>
          </div>
        </div>
      )}

      {/* Instruction overlay */}
      {isReady && (
        <div className="absolute top-3 left-0 right-0 flex justify-center z-10 pointer-events-none">
          <span className="bg-black/60 text-gray-200 text-xs px-3 py-1.5 rounded-full">
            Hold a gesture for {(dwellMs / 1000).toFixed(1)} s to confirm · 2 hands · GPU-accelerated
          </span>
        </div>
      )}

      {/* Camera-facing toggle */}
      {isReady && (
        <button
          onClick={() => { setFacingMode((m) => m === 'user' ? 'environment' : 'user'); setLoadState('loading-camera'); }}
          aria-label={rearLabel}
          title={rearLabel}
          className="absolute bottom-3 right-3 z-10 bg-black/60 hover:bg-black/80 text-white rounded-full w-11 h-11 flex items-center justify-center transition-colors text-lg"
        >
          🔄
        </button>
      )}

      <video ref={videoRef} className="hidden" autoPlay playsInline muted />
      <canvas
        ref={canvasRef}
        width={1280}
        height={720}
        className="w-full h-full object-cover"
        role="img"
        aria-label="Live camera feed with hand gesture overlay"
      />
    </div>
  );
}
