"use client";
import { useEffect, useState, useRef, useCallback } from "react";

interface EmotionResult {
  emotion: string;
  confidence: number;
  painLevel: number;
  notes: string;
  offline?: boolean;
}

const EMOTION_CONFIG: Record<string, { color: string; bg: string; icon: string; urgent: boolean }> = {
  pain:      { color: "text-red-300",    bg: "bg-red-900/30 border-red-700/50",      icon: "😰", urgent: true  },
  distressed:{ color: "text-orange-300", bg: "bg-orange-900/30 border-orange-700/50",icon: "😟", urgent: true  },
  fearful:   { color: "text-yellow-300", bg: "bg-yellow-900/30 border-yellow-700/50",icon: "😨", urgent: true  },
  urgent:    { color: "text-red-400",    bg: "bg-red-900/40 border-red-600/60",      icon: "🚨", urgent: true  },
  confused:  { color: "text-blue-300",   bg: "bg-blue-900/20 border-blue-700/30",    icon: "😕", urgent: false },
  calm:      { color: "text-green-300",  bg: "bg-green-900/20 border-green-700/30",  icon: "😌", urgent: false },
  exhausted: { color: "text-gray-300",   bg: "bg-gray-800/40 border-gray-600/30",    icon: "😴", urgent: false },
  neutral:   { color: "text-gray-400",   bg: "bg-gray-800/20 border-gray-700/20",    icon: "😐", urgent: false },
};

interface Props {
  frameRef: React.RefObject<string | null>;
  onEmotionChange?: (emotion: string, painLevel: number) => void;
  compact?: boolean;
}

export default function EmotionDetector({ frameRef, onEmotionChange, compact = false }: Props) {
  const [result, setResult] = useState<EmotionResult | null>(null);
  const [scanning, setScanning] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const lastFrameRef = useRef<string>("");

  const scan = useCallback(async () => {
    const frame = frameRef.current;
    if (!frame || frame === lastFrameRef.current) return;
    lastFrameRef.current = frame;
    setScanning(true);

    try {
      const res = await fetch("/api/gemma-emotion", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ frameBase64: frame }),
        signal: AbortSignal.timeout(5000),
      });
      const data: EmotionResult = await res.json();
      setResult(data);
      onEmotionChange?.(data.emotion, data.painLevel);
    } catch {
      // Silent fail — emotion detection is supplementary
    } finally {
      setScanning(false);
    }
  }, [frameRef, onEmotionChange]);

  // Scan every 5 seconds when there's a new frame
  useEffect(() => {
    intervalRef.current = setInterval(scan, 5000);
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [scan]);

  if (!result && !scanning) return null;

  const cfg = EMOTION_CONFIG[result?.emotion ?? "neutral"] ?? EMOTION_CONFIG.neutral;

  if (compact) {
    return (
      <div className={`flex items-center gap-1.5 px-2 py-1 rounded-full border text-xs ${cfg.bg} ${cfg.color}`}>
        <span>{cfg.icon}</span>
        <span className="capitalize font-medium">{result?.emotion ?? "…"}</span>
        {result?.painLevel ? <span className="opacity-70">pain {result.painLevel}/10</span> : null}
        {scanning && <span className="w-1.5 h-1.5 rounded-full bg-current animate-ping" />}
      </div>
    );
  }

  return (
    <div className={`rounded-xl border p-3 space-y-2 ${cfg.bg}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-2xl" aria-hidden="true">{cfg.icon}</span>
          <div>
            <p className={`text-sm font-bold capitalize ${cfg.color}`}>
              {result?.emotion ?? "Scanning…"}
              {cfg.urgent && <span className="ml-2 text-[10px] bg-red-700 text-white px-1.5 py-0.5 rounded-full">ALERT</span>}
            </p>
            {result?.notes && <p className="text-xs text-gray-400">{result.notes}</p>}
          </div>
        </div>
        <div className="text-right">
          <p className="text-xs text-gray-500">Gemma 4 Vision</p>
          {result?.confidence ? (
            <p className="text-xs text-gray-400">{Math.round(result.confidence * 100)}% conf.</p>
          ) : null}
        </div>
      </div>

      {result?.painLevel ? (
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-400">Pain:</span>
          <div className="flex-1 bg-gray-700 rounded-full h-1.5">
            <div
              className="h-1.5 rounded-full bg-red-500 transition-all duration-500"
              style={{ width: `${result.painLevel * 10}%` }}
            />
          </div>
          <span className="text-xs text-red-400 font-bold">{result.painLevel}/10</span>
        </div>
      ) : null}

      {result?.offline && (
        <p className="text-[10px] text-gray-600">Gemma offline — demo values</p>
      )}
    </div>
  );
}
