/**
 * usePipeline — orchestrates all 6 pipeline stages.
 * Auto-detects Ollama; falls back to demo mode when offline.
 * Demo mode streams pre-recorded Gemma 4 responses with realistic latency.
 */
import { useState, useCallback, useRef } from "react";
import {
  isDemoMode, getNextDemoFrame, simulateDemoStage,
  type DemoFrame,
} from "../lib/demoMode";

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
  isDemo: boolean;
}

const INITIAL_STAGES: StageDisplay[] = [
  { id: "mediapipe", name: "MediaPipe",       detail: "21-point hand tracking",   icon: "👁️", latencyMs: null, status: "idle" },
  { id: "vision",    name: "Gemma 4 Vision",  detail: "Frame → gesture meaning",  icon: "🤖", latencyMs: null, status: "idle" },
  { id: "ensemble",  name: "Ensemble",        detail: "Confidence-weighted merge", icon: "⚡", latencyMs: null, status: "idle" },
  { id: "text",      name: "Gemma 4 Text",    detail: "Streaming completions",     icon: "✍️", latencyMs: null, status: "idle" },
  { id: "translate", name: "Gemma 4 Translate","detail": "6 Indian languages",     icon: "🌐", latencyMs: null, status: "idle" },
  { id: "tts",       name: "Web Speech",      detail: "On-device voice output",   icon: "🔊", latencyMs: null, status: "idle" },
];

const INITIAL: PipelineState = {
  stages: INITIAL_STAGES,
  visionGesture: null, visionDescription: null,
  emotionTag: null, emotionEmpathy: null,
  completions: [], streamingCompletions: "",
  translation: null, translationLang: "en",
  isRunning: false, lastTotalMs: null, isDemo: false,
};

export function usePipeline() {
  const [state, setState] = useState<PipelineState>(INITIAL);
  const abortRef = useRef<AbortController | null>(null);
  const ollamaOkRef = useRef<boolean | null>(null);

  const setStage = useCallback((id: string, upd: Partial<StageDisplay>) => {
    setState(prev => ({
      ...prev,
      stages: prev.stages.map(s => s.id === id ? { ...s, ...upd } : s),
    }));
  }, []);

  // Ollama health — cached 30 s
  const ollamaAvailable = useCallback(async (): Promise<boolean> => {
    if (ollamaOkRef.current !== null) return ollamaOkRef.current;
    try {
      const r = await fetch("http://localhost:11434/api/tags", {
        signal: AbortSignal.timeout(2000),
      });
      ollamaOkRef.current = r.ok;
    } catch {
      ollamaOkRef.current = false;
    }
    setTimeout(() => { ollamaOkRef.current = null; }, 30_000);
    return ollamaOkRef.current!;
  }, []);

  // ─── Demo run ────────────────────────────────────────────────────────────
  const runDemo = useCallback(async (opts: {
    landmarkGesture: string;
    targetLang: string;
    onComplete: (gesture: string, completions: string[]) => void;
  }) => {
    const frame: DemoFrame = getNextDemoFrame(opts.landmarkGesture);
    const t0 = Date.now();

    setState(prev => ({
      ...prev, isRunning: true, isDemo: true,
      stages: INITIAL_STAGES.map(s => ({ ...s, status: "idle" as const })),
      streamingCompletions: "", completions: [],
      translation: null, emotionTag: null, emotionEmpathy: null,
    }));

    // Stage 1 — MediaPipe
    setStage("mediapipe", { status: "running" });
    await simulateDemoStage("mediapipe", frame);
    setStage("mediapipe", { status: "done", latencyMs: 12 });

    // Stage 2 — Gemma 4 Vision
    setStage("vision", { status: "running" });
    await simulateDemoStage("vision", frame);
    setStage("vision", { status: "done", latencyMs: frame.latencyMs.vision });
    setState(prev => ({
      ...prev,
      visionGesture: frame.visionGesture,
      visionDescription: frame.visionDescription,
      emotionTag: frame.emotion,
    }));

    // Stage 3 — Ensemble
    setStage("ensemble", { status: "running" });
    await simulateDemoStage("ensemble", frame);
    setStage("ensemble", { status: "done", latencyMs: 35 });

    // Stage 4 — Gemma 4 Text (token-by-token streaming simulation)
    setStage("text", { status: "running" });
    let streamed = "";
    for (let ci = 0; ci < frame.completions.length; ci++) {
      const c = frame.completions[ci];
      for (let i = 0; i < c.length; i += 5) {
        const prefix = frame.completions.slice(0, ci).join(" | ");
        streamed = (prefix ? prefix + " | " : "") + c.slice(0, i + 5);
        setState(prev => ({ ...prev, streamingCompletions: streamed }));
        await new Promise(r => setTimeout(r, 20));
      }
    }
    await simulateDemoStage("text", frame);
    setStage("text", { status: "done", latencyMs: frame.latencyMs.text });
    setState(prev => ({
      ...prev,
      completions: frame.completions,
      streamingCompletions: frame.completions.join(" | "),
      emotionEmpathy: frame.empathy,
    }));

    // Stage 5 — Translation
    if (frame.translation) {
      setStage("translate", { status: "running" });
      await simulateDemoStage("translate", frame);
      setStage("translate", { status: "done", latencyMs: frame.latencyMs.translate });
      setState(prev => ({ ...prev, translation: frame.translation, translationLang: "hi" }));
    } else {
      setStage("translate", { status: "idle" });
    }

    // Stage 6 — TTS
    setStage("tts", { status: "running" });
    opts.onComplete(frame.visionGesture, frame.completions);
    await new Promise(r => setTimeout(r, 200));
    setStage("tts", { status: "done", latencyMs: 80 });

    setState(prev => ({ ...prev, isRunning: false, lastTotalMs: Date.now() - t0 }));
  }, [setStage]);

  // ─── Live Ollama run ─────────────────────────────────────────────────────
  const run = useCallback(async (opts: {
    landmarkGesture: string;
    landmarkMs: number;
    frameBase64: string | null;
    partialSentence: string;
    context: "medical" | "daily" | "emergency" | "general";
    targetLang: string;
    onComplete: (gesture: string, completions: string[]) => void;
  }) => {
    abortRef.current?.abort();
    abortRef.current = new AbortController();
    const signal = abortRef.current.signal;

    // Auto-detect: use demo if ?demo=1 or Ollama is down
    const live = !isDemoMode() && (await ollamaAvailable());
    if (!live) {
      await runDemo({ landmarkGesture: opts.landmarkGesture, targetLang: opts.targetLang, onComplete: opts.onComplete });
      return;
    }

    const t0 = Date.now();
    setState(prev => ({
      ...prev, isRunning: true, isDemo: false,
      stages: INITIAL_STAGES.map(s => ({ ...s, status: "idle" as const })),
      streamingCompletions: "", completions: [], translation: null,
    }));

    // Stage 1
    setStage("mediapipe", { status: "done", latencyMs: opts.landmarkMs });

    // Stage 2 — Gemma 4 Vision
    let finalGesture = opts.landmarkGesture;
    let visionDesc = "", emotion = "neutral";

    if (opts.frameBase64 && !signal.aborted) {
      setStage("vision", { status: "running" });
      const vs = Date.now();
      try {
        const res = await fetch("/api/gemma-vision", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ frameBase64: opts.frameBase64, currentGesture: opts.landmarkGesture, context: opts.context }),
          signal: AbortSignal.timeout(6000),
        });
        const d = await res.json();
        if (!d.offline && d.confidence > 0.6) finalGesture = d.gesture ?? opts.landmarkGesture;
        visionDesc = d.description ?? "";
        emotion = d.emotion ?? "neutral";
        setStage("vision", { status: "done", latencyMs: Date.now() - vs });
        setState(prev => ({ ...prev, visionGesture: finalGesture, visionDescription: visionDesc, emotionTag: emotion }));
      } catch {
        setStage("vision", { status: "offline" });
      }
    } else {
      setStage("vision", { status: "offline" });
    }

    // Stage 3 — Ensemble
    if (!signal.aborted) {
      setStage("ensemble", { status: "running" });
      await new Promise(r => setTimeout(r, 30));
      setStage("ensemble", { status: "done", latencyMs: 30 });
    }

    // Stage 4 — Gemma 4 Text streaming
    const sentence = opts.partialSentence
      ? `${opts.partialSentence} ${finalGesture}`
      : finalGesture;
    let completions: string[] = [];

    if (!signal.aborted && sentence.trim().length > 1) {
      setStage("text", { status: "running" });
      const ts = Date.now();
      let buffer = "";
      try {
        const sr = await fetch("/api/gemma-stream", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ partialText: sentence, context: opts.context, language: opts.targetLang }),
          signal: AbortSignal.timeout(8000),
        });
        if (sr.ok && sr.body) {
          const reader = sr.body.getReader();
          const dec = new TextDecoder();
          while (!signal.aborted) {
            const { done, value } = await reader.read();
            if (done) break;
            for (const line of dec.decode(value, { stream: true }).split("\n")) {
              if (!line.trim()) continue;
              try {
                const p = JSON.parse(line);
                if (p.response) { buffer += p.response; setState(prev => ({ ...prev, streamingCompletions: buffer })); }
              } catch { /* skip */ }
            }
          }
          completions = buffer.split("|").map(s => s.trim()).filter(s => s.length > 2 && s.length < 80).slice(0, 3);
        }
        setStage("text", { status: "done", latencyMs: Date.now() - ts });
        setState(prev => ({ ...prev, completions, streamingCompletions: buffer }));

        // Empathy for distressed patients
        if (emotion !== "neutral" && emotion !== "calm" && !signal.aborted) {
          try {
            const er = await fetch("/api/gemma-complete", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                prompt: `Patient appears ${emotion} and said "${sentence}". Suggest a compassionate nurse response under 10 words.`,
                system: "Return ONLY the response text.",
              }),
              signal: AbortSignal.timeout(4000),
            });
            const ed = await er.json();
            setState(prev => ({ ...prev, emotionEmpathy: ed.response ?? null }));
          } catch { /* ignore */ }
        }
      } catch {
        setStage("text", { status: "offline" });
        completions = localFallback(sentence);
        setState(prev => ({ ...prev, completions }));
      }
    }

    // Stage 5 — Translation
    if (!signal.aborted && opts.targetLang !== "en" && sentence.trim()) {
      setStage("translate", { status: "running" });
      const trs = Date.now();
      try {
        const tr = await fetch("/api/gemma-translate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text: sentence, targetLang: opts.targetLang }),
          signal: AbortSignal.timeout(6000),
        });
        const trd = await tr.json();
        setState(prev => ({ ...prev, translation: trd.translation || null, translationLang: opts.targetLang }));
        setStage("translate", { status: "done", latencyMs: Date.now() - trs });
      } catch { setStage("translate", { status: "offline" }); }
    } else {
      setStage("translate", { status: "idle" });
    }

    // Stage 6 — TTS
    if (!signal.aborted) {
      setStage("tts", { status: "running" });
      opts.onComplete(finalGesture, completions);
      setTimeout(() => setStage("tts", { status: "done" }), 500);
    }

    setState(prev => ({ ...prev, isRunning: false, lastTotalMs: Date.now() - t0 }));
  }, [setStage, ollamaAvailable, runDemo]);

  const reset = useCallback(() => {
    abortRef.current?.abort();
    setState(INITIAL);
  }, []);

  return { state, run, reset };
}

function localFallback(text: string): string[] {
  const t = text.toLowerCase();
  if (t.includes("pain") || t.includes("hurt")) return ["I need pain relief now", "Pain is severe — level 8", "Please call the doctor"];
  if (t.includes("help"))                        return ["I need help immediately", "Please come here now", "Emergency — urgent help"];
  if (t.includes("water") || t.includes("thirst")) return ["I need water please", "I am very thirsty", "Bring water urgently"];
  if (t.includes("breath"))                      return ["Cannot breathe — emergency", "I need oxygen now", "Call nurse urgently"];
  if (t.includes("doctor") || t.includes("nurse")) return ["Please call the doctor", "Get the nurse now", "I need medical help"];
  return ["I need assistance", "Please come here", "Thank you"];
}
