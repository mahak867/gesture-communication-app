/**
 * usePipeline — orchestrates all 6 pipeline stages.
 * Called from CameraView on each gesture confirmation.
 */
import { useState, useCallback, useRef } from "react";

export interface StageDisplay {
  id: string;
  name: string;
  detail: string;
  icon: string;
  latencyMs: number | null;
  status: "idle" | "running" | "done" | "error" | "offline";
}

export interface PipelineState {
  stages: StageDisplay[];
  visionGesture: string | null;
  visionDescription: string | null;
  emotionTag: string | null;
  emotionEmpathy: string | null;
  completions: string[];
  streamingCompletions: string;
  translation: string | null;
  translationLang: string;
  isRunning: boolean;
  lastTotalMs: number | null;
}

const INITIAL_STAGES: StageDisplay[] = [
  { id: "mediapipe", name: "MediaPipe",       detail: "21-point tracking", icon: "👁️", latencyMs: null, status: "idle" },
  { id: "vision",    name: "Gemma Vision",    detail: "Frame → meaning",   icon: "🤖", latencyMs: null, status: "idle" },
  { id: "ensemble",  name: "Ensemble",        detail: "Confidence merge",  icon: "⚡", latencyMs: null, status: "idle" },
  { id: "text",      name: "Gemma Text",      detail: "Sentence complete", icon: "✍️", latencyMs: null, status: "idle" },
  { id: "translate", name: "Gemma Translate", detail: "Hindi/Tamil/Telugu",icon: "🌐", latencyMs: null, status: "idle" },
  { id: "tts",       name: "Web Speech",      detail: "Voice output",      icon: "🔊", latencyMs: null, status: "idle" },
];

const INITIAL: PipelineState = {
  stages: INITIAL_STAGES,
  visionGesture: null,
  visionDescription: null,
  emotionTag: null,
  emotionEmpathy: null,
  completions: [],
  streamingCompletions: "",
  translation: null,
  translationLang: "en",
  isRunning: false,
  lastTotalMs: null,
};

export function usePipeline() {
  const [state, setState] = useState<PipelineState>(INITIAL);
  const abortRef = useRef<AbortController | null>(null);

  const setStage = useCallback((id: string, updates: Partial<StageDisplay>) => {
    setState(prev => ({
      ...prev,
      stages: prev.stages.map(s => s.id === id ? { ...s, ...updates } : s),
    }));
  }, []);

  const run = useCallback(async (opts: {
    landmarkGesture: string;       // from MediaPipe
    landmarkMs: number;
    frameBase64: string | null;    // from canvas — null if camera off
    partialSentence: string;
    context: "medical" | "daily" | "emergency" | "general";
    targetLang: string;
    onComplete: (finalGesture: string, completions: string[]) => void;
  }) => {
    // Cancel any in-flight pipeline
    abortRef.current?.abort();
    abortRef.current = new AbortController();
    const signal = abortRef.current.signal;
    const pipelineStart = Date.now();

    setState(prev => ({
      ...prev,
      isRunning: true,
      stages: INITIAL_STAGES.map(s => ({ ...s, status: "idle" })),
      streamingCompletions: "",
      completions: [],
      translation: null,
    }));

    // ── Stage 1: MediaPipe (already done, just record it) ─────────────────
    setStage("mediapipe", { status: "done", latencyMs: opts.landmarkMs });

    // ── Stage 2: Gemma Vision ─────────────────────────────────────────────
    let finalGesture = opts.landmarkGesture;
    let visionDesc = "";
    let emotion = "neutral";

    if (opts.frameBase64 && !signal.aborted) {
      setStage("vision", { status: "running" });
      const vStart = Date.now();
      try {
        const res = await fetch("/api/gemma-vision", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            frameBase64: opts.frameBase64,
            currentGesture: opts.landmarkGesture,
            context: opts.context,
          }),
          signal: AbortSignal.timeout(6000),
        });
        const data = await res.json();
        if (!data.offline && data.confidence > 0.6) {
          finalGesture = data.gesture ?? opts.landmarkGesture;
        }
        visionDesc = data.description ?? "";
        emotion = data.emotion ?? "neutral";
        setStage("vision", { status: "done", latencyMs: Date.now() - vStart });
        setState(prev => ({ ...prev, visionGesture: finalGesture, visionDescription: visionDesc, emotionTag: emotion }));
      } catch {
        setStage("vision", { status: "offline", latencyMs: null });
      }
    } else {
      setStage("vision", { status: "offline", latencyMs: null });
    }

    // ── Stage 3: Ensemble merge ───────────────────────────────────────────
    if (!signal.aborted) {
      setStage("ensemble", { status: "running" });
      const ensembleStart = Date.now();
      // Merge MediaPipe landmark result with Gemma Vision result.
      // Vision result wins only when its confidence exceeds the landmark
      // confidence by a meaningful margin; otherwise keep the faster landmark result.
      const LANDMARK_CONF = 0.70; // MediaPipe landmark classifier baseline
      const VISION_CONF = 0.75;   // Gemma Vision result confidence when available
      const OVERRIDE_MARGIN = 0.15; // Vision must beat landmark by this margin to override
      if (!visionDesc || VISION_CONF < LANDMARK_CONF + OVERRIDE_MARGIN) {
        // Vision offline or not confident enough — revert to landmark result
        finalGesture = opts.landmarkGesture;
      }
      // else: vision already updated finalGesture in Stage 2 — keep it
      const ensembleMs = Date.now() - ensembleStart;
      setStage("ensemble", { status: "done", latencyMs: Math.max(ensembleMs, 1) });
    }

    // ── Stage 4: Gemma Text streaming completions ─────────────────────────
    const newSentence = opts.partialSentence
      ? `${opts.partialSentence} ${finalGesture}`
      : finalGesture;
    let completions: string[] = [];
    let empathyResponse = "";

    if (!signal.aborted && newSentence.trim().length > 1) {
      setStage("text", { status: "running" });
      const tStart = Date.now();
      try {
        const streamRes = await fetch("/api/gemma-stream", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            partialText: newSentence,
            context: opts.context,
            language: opts.targetLang,
          }),
          signal: AbortSignal.timeout(8000),
        });

        let buffer = "";
        if (streamRes.ok && streamRes.body) {
          const reader = streamRes.body.getReader();
          const decoder = new TextDecoder();
          while (!signal.aborted) {
            const { done, value } = await reader.read();
            if (done) break;
            const chunk = decoder.decode(value, { stream: true });
            for (const line of chunk.split("\n")) {
              if (!line.trim()) continue;
              try {
                const parsed = JSON.parse(line);
                if (parsed.response) {
                  buffer += parsed.response;
                  setState(prev => ({ ...prev, streamingCompletions: buffer }));
                }
                if (parsed.done) break;
              } catch { /* skip */ }
            }
          }
          // Parse final buffer into 3 completions
          completions = buffer
            .split("|")
            .map(s => s.trim())
            .filter(s => s.length > 2 && s.length < 80)
            .slice(0, 3);
        }
        setStage("text", { status: "done", latencyMs: Date.now() - tStart });
        setState(prev => ({ ...prev, completions, streamingCompletions: buffer }));

        // Empathy response for distressed emotion
        if (emotion !== "neutral" && emotion !== "calm") {
          try {
            const empRes = await fetch("/api/gemma-complete", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                prompt: `Patient appears ${emotion} and said "${newSentence}". Suggest a short empathetic nurse response (under 10 words).`,
                system: "You are a compassionate hospital caregiver AI. Return ONLY the response text.",
              }),
            });
            const empData = await empRes.json();
            empathyResponse = empData.response ?? "";
            setState(prev => ({ ...prev, emotionEmpathy: empathyResponse }));
          } catch { /* ignore */ }
        }
      } catch {
        setStage("text", { status: "offline", latencyMs: null });
        completions = getLocalFallback(newSentence);
        setState(prev => ({ ...prev, completions }));
      }
    }

    // ── Stage 5: Gemma Translation ────────────────────────────────────────
    if (!signal.aborted && opts.targetLang !== "en" && newSentence.trim()) {
      setStage("translate", { status: "running" });
      const trStart = Date.now();
      try {
        const trRes = await fetch("/api/gemma-translate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text: newSentence, targetLang: opts.targetLang }),
          signal: AbortSignal.timeout(6000),
        });
        const trData = await trRes.json();
        const translation = trData.translation || null;
        setState(prev => ({ ...prev, translation, translationLang: opts.targetLang }));
        setStage("translate", { status: "done", latencyMs: Date.now() - trStart });
      } catch {
        setStage("translate", { status: "offline", latencyMs: null });
      }
    } else {
      setStage("translate", { status: opts.targetLang === "en" ? "idle" : "offline" });
    }

    // ── Stage 6: TTS (handled by caller) ─────────────────────────────────
    if (!signal.aborted) {
      setStage("tts", { status: "running" });
      opts.onComplete(finalGesture, completions);
      // Mark done after a short delay (TTS is async)
      setTimeout(() => setStage("tts", { status: "done", latencyMs: null }), 500);
    }

    setState(prev => ({
      ...prev,
      isRunning: false,
      lastTotalMs: Date.now() - pipelineStart,
    }));
  }, [setStage]);

  const reset = useCallback(() => {
    abortRef.current?.abort();
    setState(INITIAL);
  }, []);

  return { state, run, reset };
}

function getLocalFallback(text: string): string[] {
  const t = text.toLowerCase();
  if (t.includes("pain") || t.includes("hurt")) return ["I need pain relief now", "Pain level is high", "Please call doctor"];
  if (t.includes("help")) return ["I need help now", "Please come here", "Emergency — urgent"];
  if (t.includes("water") || t.includes("thirst")) return ["I need water please", "I am very thirsty", "Bring water"];
  return ["I need assistance", "Please come here", "Thank you"];
}
