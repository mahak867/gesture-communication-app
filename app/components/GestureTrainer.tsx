"use client";
import { useState, useRef, useEffect, useCallback } from "react";

interface Sample { gesture: string; timestamp: string; vectors: number[][]; }
const STORAGE_KEY = "gesturetalk-custom-gestures";

function loadSamples(): Record<string, Sample[]> {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "{}"); }
  catch { return {}; }
}
function saveSamples(s: Record<string, Sample[]>) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(s)); } catch { /* ignore */ }
}

interface Props { onGestureReady?: (label: string) => void; }

export default function GestureTrainer({ onGestureReady }: Props) {
  const [step, setStep] = useState<"name" | "record" | "done">("name");
  const [name, setName] = useState("");
  const [phrase, setPhrase] = useState("");
  const [recording, setRecording] = useState(false);
  const [countdown, setCountdown] = useState(3);
  const [sampleCount, setSampleCount] = useState(0);
  const [samples, setSamples] = useState<Record<string, Sample[]>>(() =>
    typeof window !== "undefined" ? loadSamples() : {}
  );
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const TARGET_SAMPLES = 5;

  // Simulate landmark capture (real app: wire into CameraView)
  const captureFrame = useCallback((): number[][] => {
    // In production this reads actual MediaPipe landmarks from shared state
    return Array.from({ length: 21 }, () => [Math.random(), Math.random(), Math.random()]);
  }, []);

  const startRecording = () => {
    setCountdown(3);
    setRecording(true);
    setSampleCount(0);
    let count = 3;
    const cd = setInterval(() => {
      count -= 1;
      setCountdown(count);
      if (count <= 0) {
        clearInterval(cd);
        let captured = 0;
        intervalRef.current = setInterval(() => {
          const vectors = captureFrame();
          setSamples(prev => {
            const key = name.trim();
            const existing = prev[key] ?? [];
            const updated = [...existing, { gesture: key, timestamp: new Date().toISOString(), vectors }];
            const next = { ...prev, [key]: updated };
            saveSamples(next);
            return next;
          });
          captured += 1;
          setSampleCount(captured);
          if (captured >= TARGET_SAMPLES) {
            clearInterval(intervalRef.current!);
            setRecording(false);
            setStep("done");
            onGestureReady?.(name.trim());
          }
        }, 400);
      }
    }, 1000);
  };

  useEffect(() => () => { if (intervalRef.current) clearInterval(intervalRef.current); }, []);

  const deleteGesture = (key: string) => {
    setSamples(prev => {
      const next = { ...prev };
      delete next[key];
      saveSamples(next);
      return next;
    });
    setDeleteConfirm(null);
  };

  const savedGestures = Object.keys(samples);

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-xs uppercase text-gray-500 font-bold mb-1">🎯 Personalised Gesture Training</h3>
        <p className="text-xs text-gray-500">
          Train custom gestures unique to this patient — useful for physical differences or prosthetics.
        </p>
      </div>

      {/* Saved gestures list */}
      {savedGestures.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs text-gray-500 font-bold uppercase">Trained gestures ({savedGestures.length})</p>
          {savedGestures.map(key => (
            <div key={key} className="flex items-center gap-3 bg-gray-800/60 border border-gray-700/50 rounded-xl px-4 py-2.5">
              <span className="text-lg">🤟</span>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-white font-medium">{key}</p>
                <p className="text-xs text-gray-400">{samples[key]?.length} samples</p>
              </div>
              {deleteConfirm === key ? (
                <div className="flex gap-1">
                  <button onClick={() => deleteGesture(key)} className="text-xs bg-red-700 text-white px-2 py-1 rounded">Delete</button>
                  <button onClick={() => setDeleteConfirm(null)} className="text-xs bg-gray-600 text-gray-300 px-2 py-1 rounded">Cancel</button>
                </div>
              ) : (
                <button onClick={() => setDeleteConfirm(key)} className="text-gray-600 hover:text-red-400 text-sm min-h-[36px] px-2" aria-label={`Delete ${key}`}>🗑️</button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Training flow */}
      {step === "name" && (
        <div className="space-y-3 bg-gray-800/40 border border-gray-700/50 rounded-xl p-4">
          <p className="text-sm text-white font-medium">Add new gesture</p>
          <input
            type="text"
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="Gesture name (e.g. 'thumbs up left hand')"
            maxLength={30}
            className="w-full bg-gray-900 border border-gray-600 text-white rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-cyan-600"
            aria-label="Gesture name"
          />
          <input
            type="text"
            value={phrase}
            onChange={e => setPhrase(e.target.value)}
            placeholder="Phrase this gesture speaks (optional)"
            className="w-full bg-gray-900 border border-gray-600 text-white rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-cyan-600"
            aria-label="Phrase to speak"
          />
          <button
            disabled={!name.trim()}
            onClick={() => setStep("record")}
            className="w-full bg-cyan-700 hover:bg-cyan-600 disabled:bg-gray-700 text-white font-bold min-h-[44px] rounded-xl text-sm transition-colors"
          >
            Next: Record gesture
          </button>
        </div>
      )}

      {step === "record" && (
        <div className="space-y-3 bg-gray-800/40 border border-gray-700/50 rounded-xl p-4 text-center">
          <p className="text-white font-medium">Recording: <span className="text-cyan-400">&quot;{name}&quot;</span></p>
          <p className="text-xs text-gray-400">Hold your gesture in front of the camera</p>
          {recording && countdown > 0 && (
            <div className="text-5xl font-bold text-yellow-400 my-4">{countdown}</div>
          )}
          {recording && countdown === 0 && (
            <div className="space-y-2">
              <div className="w-full bg-gray-700 rounded-full h-3">
                <div
                  className="bg-cyan-500 h-3 rounded-full transition-all duration-300"
                  style={{ width: `${(sampleCount / TARGET_SAMPLES) * 100}%` }}
                />
              </div>
              <p className="text-xs text-gray-400">{sampleCount} / {TARGET_SAMPLES} samples captured</p>
            </div>
          )}
          {!recording && (
            <button
              onClick={startRecording}
              className="w-full bg-red-700 hover:bg-red-600 text-white font-bold min-h-[52px] rounded-xl text-sm animate-pulse"
            >
              🔴 Start Recording
            </button>
          )}
          <button onClick={() => setStep("name")} className="text-xs text-gray-500 hover:text-gray-300">← Back</button>
        </div>
      )}

      {step === "done" && (
        <div className="bg-green-900/30 border border-green-700/50 rounded-xl p-4 text-center space-y-3">
          <div className="text-4xl">✅</div>
          <p className="text-white font-medium">&quot;{name}&quot; trained successfully!</p>
          <p className="text-xs text-gray-400">{TARGET_SAMPLES} samples captured. This gesture is now active.</p>
          <button
            onClick={() => { setStep("name"); setName(""); setPhrase(""); setSampleCount(0); }}
            className="w-full bg-gray-700 hover:bg-gray-600 text-white text-sm min-h-[44px] rounded-xl"
          >
            Train another gesture
          </button>
        </div>
      )}
    </div>
  );
}
