"use client";
import { useState } from "react";

interface GestureAnalysis {
  gesture_id: string;
  phrase: string;
  urgency: "low" | "medium" | "high" | "critical";
  emotion?: string;
  confidence: number;
  suggested_action?: string;
  hindi_phrase?: string;
  latencyMs?: number;
  functionCalling?: boolean;
  offline?: boolean;
}

const URGENCY_STYLE: Record<string, string> = {
  critical: "bg-red-900/50 border-red-500 text-red-300",
  high:     "bg-orange-900/40 border-orange-600 text-orange-300",
  medium:   "bg-yellow-900/30 border-yellow-700 text-yellow-300",
  low:      "bg-gray-800 border-gray-600 text-gray-300",
};

const DEMO_GESTURES = [
  { id: "pain",    label: "Pain",    emoji: "🩺" },
  { id: "help",    label: "Help",    emoji: "🆘" },
  { id: "breathe", label: "Breathe", emoji: "😮‍💨" },
  { id: "water",   label: "Water",   emoji: "💧" },
];

export default function FunctionCallingDemo() {
  const [result, setResult] = useState<GestureAnalysis | null>(null);
  const [loading, setLoading] = useState(false);
  const [activeId, setActiveId] = useState<string | null>(null);

  const analyze = async (gestureId: string) => {
    setLoading(true);
    setActiveId(gestureId);
    setResult(null);

    try {
      const res = await fetch("/api/gemma-function", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          landmarkGesture: gestureId,
          context: "ICU ward, Indian government hospital",
          patientHistory: null,
        }),
        signal: AbortSignal.timeout(10000),
      });
      setResult(await res.json());
    } catch {
      // Demo fallback
      const fallbacks: Record<string, GestureAnalysis> = {
        pain:    { gesture_id: "pain",    phrase: "I am in severe pain — please help me", urgency: "critical", emotion: "distressed", confidence: 0.97, suggested_action: "Assess pain level, administer prescribed analgesic", hindi_phrase: "मुझे बहुत दर्द है", functionCalling: true, offline: true },
        help:    { gesture_id: "help",    phrase: "I need immediate help", urgency: "critical", emotion: "fearful",    confidence: 0.98, suggested_action: "Attend to patient immediately", hindi_phrase: "मुझे मदद चाहिए", functionCalling: true, offline: true },
        breathe: { gesture_id: "breathe", phrase: "I cannot breathe",    urgency: "critical", emotion: "fearful",    confidence: 0.99, suggested_action: "Check O2 saturation, call physician stat", hindi_phrase: "सांस नहीं आ रही", functionCalling: true, offline: true },
        water:   { gesture_id: "water",   phrase: "I need water please",  urgency: "medium",   emotion: "neutral",    confidence: 0.91, suggested_action: "Bring water if not NPO", hindi_phrase: "पानी चाहिए", functionCalling: true, offline: true },
      };
      setResult(fallbacks[gestureId] ?? fallbacks.help);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-xs font-bold uppercase text-gray-500 mb-1">⚙️ Gemma 4 Function Calling</h3>
        <p className="text-xs text-gray-600">Structured JSON output with type-safe gesture analysis</p>
      </div>

      <div className="grid grid-cols-4 gap-2">
        {DEMO_GESTURES.map(g => (
          <button
            key={g.id}
            onClick={() => analyze(g.id)}
            disabled={loading}
            className={`flex flex-col items-center gap-1 py-3 rounded-xl text-xs font-medium border transition-colors min-h-[60px] touch-manipulation ${
              activeId === g.id && !loading
                ? "bg-cyan-900/40 border-cyan-600 text-cyan-300"
                : "bg-gray-800 border-gray-700 text-gray-300 hover:bg-gray-700"
            }`}
          >
            <span className="text-xl">{g.emoji}</span>
            <span>{g.label}</span>
          </button>
        ))}
      </div>

      {loading && (
        <div className="flex items-center gap-2 text-xs text-cyan-400 animate-pulse">
          <span className="w-3 h-3 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin" />
          Gemma 4 calling analyze_patient_gesture()…
        </div>
      )}

      {result && !loading && (
        <div className={`rounded-xl border p-4 space-y-3 ${URGENCY_STYLE[result.urgency]}`}>
          <div className="flex items-start justify-between gap-2">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full border ${URGENCY_STYLE[result.urgency]}`}>
                  {result.urgency} urgency
                </span>
                {result.functionCalling && (
                  <span className="text-[10px] text-cyan-400 bg-cyan-900/30 border border-cyan-800/50 px-2 py-0.5 rounded-full">
                    ƒ() structured output
                  </span>
                )}
                {result.offline && (
                  <span className="text-[10px] text-amber-400">demo</span>
                )}
              </div>
              <p className="text-sm font-semibold text-white">&ldquo;{result.phrase}&rdquo;</p>
            </div>
            <span className="text-xs text-gray-500 font-mono flex-shrink-0">
              {Math.round(result.confidence * 100)}%
            </span>
          </div>

          {result.hindi_phrase && (
            <div className="flex items-center gap-2 bg-black/20 rounded-lg px-3 py-2">
              <span className="text-sm">🇮🇳</span>
              <span className="text-sm text-blue-300">{result.hindi_phrase}</span>
            </div>
          )}

          {result.suggested_action && (
            <div className="flex gap-2 bg-black/20 rounded-lg px-3 py-2">
              <span className="text-sm flex-shrink-0">👩‍⚕️</span>
              <p className="text-xs text-gray-300">{result.suggested_action}</p>
            </div>
          )}

          {/* Raw JSON preview */}
          <details className="group">
            <summary className="text-[10px] text-gray-600 cursor-pointer hover:text-gray-400 select-none">
              View raw JSON output ▾
            </summary>
            <pre className="mt-2 text-[10px] text-green-400 bg-black/40 rounded-lg p-3 overflow-auto max-h-32 font-mono">
              {JSON.stringify({ ...result, latencyMs: result.latencyMs ?? "–" }, null, 2)}
            </pre>
          </details>
        </div>
      )}
    </div>
  );
}
