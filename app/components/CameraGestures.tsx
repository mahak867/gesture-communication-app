'use client';

import { useEffect, useRef, useState } from 'react';
import type { GestureRecognizer } from '@mediapipe/tasks-vision';
import { useApp } from '../hooks/useApp';
import { actionFor, GESTURES, HoldDetector, type GestureAction } from '../lib/gestures';
import { QUICK } from '../lib/vocab';
import { advanceScan } from '../hooks/useScanner';

// Pinned to the installed package version so the WASM matches the JS.
const WASM = 'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.35/wasm';
const MODEL =
  'https://storage.googleapis.com/mediapipe-models/gesture_recognizer/gesture_recognizer/float16/1/gesture_recognizer.task';

type Status = 'off' | 'loading' | 'on' | 'error';

/**
 * Optional hands-free input. Video never leaves the device: frames are processed
 * in the browser by MediaPipe and discarded.
 */
export function CameraGestures() {
  const { settings, say, message } = useApp();
  const [enabled, setEnabled] = useState(false);
  const [status, setStatus] = useState<Status>('off');
  const [error, setError] = useState('');
  const [seen, setSeen] = useState<{ cat: string | null; progress: number }>({ cat: null, progress: 0 });
  const videoRef = useRef<HTMLVideoElement>(null);
  const actRef = useRef<(a: GestureAction) => void>(() => {});

  useEffect(() => {
    actRef.current = (a) => {
      const t = (k: keyof typeof QUICK) => QUICK[k].text[settings.lang];
      if (a === 'yes') say(t('yes'));
      else if (a === 'no') say(t('no'));
      else if (a === 'help') say(t('help'), { urgent: true });
      else if (a === 'speak') say(message);
      else if (a === 'next') advanceScan();
    };
  }, [settings.lang, say, message]);

  useEffect(() => {
    if (!enabled) return;
    let cancelled = false;
    let stream: MediaStream | null = null;
    let recognizer: GestureRecognizer | null = null;
    let raf = 0;
    const hold = new HoldDetector(800, 0.6);

    (async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user', width: 640, height: 480 } });
        if (cancelled) return;
        const video = videoRef.current!;
        video.srcObject = stream;
        await video.play();
        const { FilesetResolver, GestureRecognizer } = await import('@mediapipe/tasks-vision');
        const fileset = await FilesetResolver.forVisionTasks(WASM);
        recognizer = await GestureRecognizer.createFromOptions(fileset, {
          baseOptions: { modelAssetPath: MODEL, delegate: 'GPU' },
          runningMode: 'VIDEO',
          numHands: 1,
        });
        if (cancelled) return;
        setStatus('on');
        let lastUi = 0;
        const loop = () => {
          if (cancelled || !recognizer) return;
          const now = performance.now();
          if (video.readyState >= 2) {
            const r = recognizer.recognizeForVideo(video, now);
            const top = r.gestures[0]?.[0];
            const confirmed = hold.update(top?.categoryName ?? null, top?.score ?? 0, now);
            if (confirmed) {
              const a = actionFor(confirmed);
              if (a) actRef.current(a);
            }
            if (now - lastUi > 100) {
              lastUi = now;
              setSeen({ cat: hold.gesture, progress: hold.progress(now) });
            }
          }
          raf = requestAnimationFrame(loop);
        };
        raf = requestAnimationFrame(loop);
      } catch (e) {
        if (cancelled) return;
        setEnabled(false);
        setError(e instanceof Error && e.name === 'NotAllowedError' ? 'Camera permission was denied.' : 'Could not start the camera or gesture model (it needs internet the first time).');
        setStatus('error');
      }
    })();

    return () => {
      cancelled = true;
      cancelAnimationFrame(raf);
      recognizer?.close();
      stream?.getTracks().forEach((t) => t.stop());
    };
  }, [enabled]);

  const running = enabled;
  const g = GESTURES.find((x) => x.category === seen.cat);

  return (
    <div className="flex flex-col gap-3">
      <button
        type="button"
        data-scan
        onClick={() => {
          setStatus(running ? 'off' : 'loading');
          setEnabled(!running);
        }}
        className="rounded-2xl bg-[var(--accent)] px-4 py-4 text-[1.2em] font-bold text-white"
      >
        {running ? '⏹ Stop camera' : '📷 Start hands-free gestures'}
      </button>
      {status === 'error' && <p role="alert" className="text-[var(--urgent)]">{error}</p>}

      <div className={`relative overflow-hidden rounded-2xl bg-black ${running ? '' : 'hidden'}`}>
        <video ref={videoRef} playsInline muted className="w-full -scale-x-100" />
        {status !== 'on' && <p className="absolute inset-0 grid place-items-center text-white">Loading…</p>}
        {g && (
          <div className="absolute bottom-3 left-3 flex items-center gap-2 rounded-xl bg-black/70 px-3 py-2 text-white">
            <span className="text-2xl">{g.icon}</span>
            <span className="h-2 w-24 rounded bg-white/30">
              <span className="block h-2 rounded bg-[var(--yes)]" style={{ width: `${seen.progress * 100}%` }} />
            </span>
          </div>
        )}
      </div>

      <ul className="grid gap-1 text-[1em]">
        {GESTURES.map((x) => (
          <li key={x.category} className="rounded-xl bg-[var(--panel)] px-3 py-2">
            <span aria-hidden className="mr-2 text-xl">{x.icon}</span>
            {x.label}
          </li>
        ))}
      </ul>
      <p className="text-[0.9em] text-[var(--muted)]">
        Hold a gesture steady for about a second. The video is processed on this device and is never recorded or uploaded.
      </p>
    </div>
  );
}
