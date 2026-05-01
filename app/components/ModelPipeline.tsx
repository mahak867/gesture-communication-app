"use client";
import { useEffect, useState } from "react";
import { checkAllModels, type ModelHealth } from "../lib/pipeline";

interface StageDisplay {
  id: string;
  name: string;
  detail: string;
  icon: string;
  latencyMs: number | null;
  status: "idle" | "running" | "done" | "error" | "offline";
}

interface Props {
  stages?: StageDisplay[];
  lastGesture?: string;
  visionDescription?: string;
  emotionTag?: string | null;
  streamingText?: string;
  translation?: string | null;
  translationLang?: string;
  compact?: boolean;
}

const STATUS_COLOR: Record<string, string> = {
  idle:    "bg-gray-700 text-gray-400",
  running: "bg-yellow-800 text-yellow-300 animate-pulse",
  done:    "bg-green-900 text-green-300",
  error:   "bg-red-900 text-red-300",
  offline: "bg-gray-800 text-gray-600",
};

const PIPELINE_STAGES = [
  { id: "mediapipe", name: "MediaPipe", detail: "21-point hand tracking", icon: "👁️", model: "Local WASM" },
  { id: "vision",    name: "Gemma Vision", detail: "Frame → gesture meaning", icon: "🤖", model: "gemma3:4b" },
  { id: "ensemble",  name: "Ensemble", detail: "Confidence merge", icon: "⚡", model: "Math" },
  { id: "text",      name: "Gemma Text", detail: "Sentence completion", icon: "✍️", model: "gemma3:4b" },
  { id: "translate", name: "Gemma Translate", detail: "Hindi/Tamil/Telugu", icon: "🌐", model: "gemma3:4b" },
  { id: "tts",       name: "Web Speech", detail: "Text → voice output", icon: "🔊", model: "OS TTS" },
];

export default function ModelPipeline({
  stages = [],
  lastGesture,
  visionDescription,
  emotionTag,
  streamingText,
  translation,
  translationLang,
  compact = false,
}: Props) {
  const [health, setHealth] = useState<ModelHealth | null>(null);
  const [checking, setChecking] = useState(false);

  useEffect(() => {
    let mounted = true;
    const check = async () => {
      setChecking(true);
      const h = await checkAllModels();
      if (mounted) { setHealth(h); setChecking(false); }
    };
    check();
    const t = setInterval(check, 30000);
    return () => { mounted = false; clearInterval(t); };
  }, []);

  const getStageStatus = (id: string): StageDisplay["status"] => {
    const s = stages.find(x => x.id === id);
    if (s) return s.status;
    if (!health?.available && (id === "vision" || id === "text" || id === "translate")) return "offline";
    return "idle";
  };

  const getStageLatency = (id: string): number | null => {
    return stages.find(x => x.id === id)?.latencyMs ?? null;
  };

  if (compact) {
    return (
      <div className="flex items-center gap-2 flex-wrap">
        {PIPELINE_STAGES.map(stage => {
          const status = getStageStatus(stage.id);
          return (
            <div key={stage.id} className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium ${STATUS_COLOR[status]}`}>
              <span aria-hidden="true">{stage.icon}</span>
              <span>{stage.name}</span>
              {status === "running" && <span className="w-1.5 h-1.5 rounded-full bg-current animate-ping" />}
              {status === "done" && getStageLatency(stage.id) !== null && (
                <span className="opacity-60">{getStageLatency(stage.id)}ms</span>
              )}
            </div>
          );
        })}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-xs uppercase text-gray-500 font-bold">🤖 Multi-Modal AI Pipeline</h3>
        <div className={`flex items-center gap-1.5 text-[10px] px-2.5 py-1 rounded-full border ${
          checking ? "bg-yellow-900/30 border-yellow-700 text-yellow-400" :
          health?.available ? "bg-green-900/30 border-green-700 text-green-400" :
          "bg-gray-800 border-gray-700 text-gray-500"
        }`}>
          <span className={`w-1.5 h-1.5 rounded-full ${checking ? "bg-yellow-400 animate-pulse" : health?.available ? "bg-green-400" : "bg-gray-600"}`} />
          {checking ? "Checking…" : health?.available ? `Gemma online · ${health.latencyMs}ms` : "Gemma offline — local fallback"}
        </div>
      </div>

      {/* Pipeline diagram */}
      <div className="relative">
        {/* Connector line */}
        <div className="absolute left-4 top-5 bottom-5 w-0.5 bg-gradient-to-b from-cyan-800 via-purple-800 to-blue-800 opacity-40" aria-hidden="true" />

        <div className="space-y-2">
          {PIPELINE_STAGES.map((stage, i) => {
            const status = getStageStatus(stage.id);
            const latency = getStageLatency(stage.id);
            const isActive = status === "running" || status === "done";

            return (
              <div key={stage.id} className={`relative flex gap-3 pl-1 transition-all duration-200`}>
                {/* Node dot */}
                <div className={`relative z-10 flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-base border-2 transition-all ${
                  status === "running" ? "border-yellow-400 bg-yellow-900/40 scale-110" :
                  status === "done" ? "border-green-500 bg-green-900/30" :
                  status === "offline" ? "border-gray-700 bg-gray-800/50 opacity-40" :
                  "border-gray-700 bg-gray-800/60"
                }`}>
                  {stage.icon}
                </div>

                {/* Content */}
                <div className={`flex-1 min-w-0 bg-gray-800/40 border rounded-xl p-2.5 transition-all ${
                  isActive ? "border-gray-600" : "border-gray-700/40"
                }`}>
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-white">{stage.name}</span>
                        <span className="text-[10px] text-gray-600">{stage.model}</span>
                      </div>
                      <p className="text-[10px] text-gray-500 mt-0.5">{stage.detail}</p>
                    </div>
                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      {latency !== null && (
                        <span className="text-[10px] text-gray-500 font-mono">{latency}ms</span>
                      )}
                      <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${STATUS_COLOR[status]}`}>
                        {status}
                      </span>
                    </div>
                  </div>

                  {/* Stage-specific output */}
                  {status === "done" && (
                    <div className="mt-1.5 text-[10px] text-gray-400 truncate">
                      {stage.id === "mediapipe" && lastGesture && `→ ${lastGesture}`}
                      {stage.id === "vision" && visionDescription && `→ "${visionDescription}"`}
                      {stage.id === "ensemble" && lastGesture && `→ "${lastGesture}" confirmed`}
                      {stage.id === "text" && streamingText && `→ ${streamingText.split("|")[0]?.trim()}`}
                      {stage.id === "translate" && translation && `→ [${translationLang?.toUpperCase() ?? ""}] ${translation}`}
                      {stage.id === "tts" && `→ 🔊 spoken`}
                    </div>
                  )}
                  {stage.id === "vision" && emotionTag && emotionTag !== "neutral" && status === "done" && (
                    <div className="mt-1 text-[10px] text-amber-400">😟 Emotion detected: {emotionTag}</div>
                  )}
                </div>

                {/* Arrow connector (not on last item) */}
                {i < PIPELINE_STAGES.length - 1 && (
                  <div className="absolute left-4 -bottom-1.5 text-gray-700 text-[8px]" aria-hidden="true">▼</div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Available models */}
      {health?.available && health.models.length > 0 && (
        <div className="bg-gray-800/40 border border-gray-700/50 rounded-xl p-3 space-y-1.5">
          <p className="text-[10px] text-gray-500 font-bold uppercase">Loaded models</p>
          <div className="flex flex-wrap gap-1.5">
            {health.models.map(m => (
              <span key={m} className="text-[10px] bg-gray-700 text-gray-300 px-2 py-0.5 rounded-full">{m}</span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
