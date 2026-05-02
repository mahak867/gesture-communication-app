/**
 * GestureTalk — Multi-Modal AI Pipeline
 * 
 * Stage 1: MediaPipe (10ms)  → 21 landmarks → rule-based gesture ID
 * Stage 2: Gemma 4 Vision (300ms) → raw frame → gesture description + emotion
 * Stage 3: Ensemble          → merge S1+S2, confidence-weighted
 * Stage 4: Gemma 4 Text      → gesture word → sentence completion (streaming)
 * Stage 5: Gemma 4 Translate → completed sentence → regional language
 * Stage 6: Web Speech TTS    → speech output
 * 
 * All stages run on-device. No data leaves the device.
 */

export interface PipelineStage {
  id: string;
  name: string;
  model: string;
  latencyMs: number | null;
  status: "idle" | "running" | "done" | "error" | "offline";
  lastOutput: string;
}

export interface PipelineResult {
  gesture: string;
  confidence: number;
  description: string;       // Gemma vision description
  completions: string[];     // Gemma text suggestions
  translation: string | null;
  emotionTag: string | null; // Gemma detected emotion from face
  stages: PipelineStage[];
  totalLatencyMs: number;
}

export type PipelineListener = (result: Partial<PipelineResult> & { stages: PipelineStage[] }) => void;

const OLLAMA = typeof window !== "undefined"
  ? (process.env.NEXT_PUBLIC_OLLAMA_URL ?? "http://localhost:11434")
  : "http://localhost:11434";

const VISION_MODEL = process.env.OLLAMA_MODEL ?? "gemma4";          // Gemma 4 — multimodal vision+text
const TEXT_MODEL   = process.env.OLLAMA_MODEL ?? "gemma4";          // Gemma 4 text mode
const FAST_MODEL   = process.env.OLLAMA_MODEL ?? "gemma4";          // Gemma 4 (single model for all stages)

// ─── Ollama multimodal generate ──────────────────────────────────────────────
async function ollamaGenerate(opts: {
  model: string;
  prompt: string;
  system?: string;
  images?: string[];   // base64 PNG/JPEG
  maxTokens?: number;
  timeoutMs?: number;
}): Promise<string> {
  const body: Record<string, unknown> = {
    model: opts.model,
    prompt: opts.prompt,
    stream: false,
    options: {
      num_predict: opts.maxTokens ?? 80,
      temperature: 0.2,
      top_p: 0.9,
    },
  };
  if (opts.system) body.system = opts.system;
  if (opts.images?.length) body.images = opts.images;

  const res = await fetch(`${OLLAMA}/api/generate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(opts.timeoutMs ?? 8000),
  });
  if (!res.ok) throw new Error(`Ollama ${res.status}`);
  const data = await res.json();
  return (data.response ?? "").trim();
}

// ─── Stage 2: Gemma Vision — analyze raw camera frame ────────────────────────
export async function analyzeFrameWithGemma(
  frameBase64: string,  // base64 JPEG from canvas
  currentLandmarkGesture: string
): Promise<{ gesture: string; confidence: number; description: string; emotion: string | null }> {
  const system = `You are a multimodal AI analyzing camera frames for an AAC (Augmentative and Alternative Communication) app helping mute hospital patients communicate.
Your job: look at the hand gesture in the image and identify what the person is trying to communicate.
The MediaPipe system already identified the gesture as: "${currentLandmarkGesture}".
Confirm or correct this. Also note any emotional expression visible.

Return ONLY this exact format (one line):
GESTURE|CONFIDENCE|DESCRIPTION|EMOTION
Example: "help"|0.94|"Person holding up open hand, palm facing out — universal help sign"|"distressed"

Rules:
- GESTURE: the word/phrase this gesture means in context (medical AAC, Indian hospital)
- CONFIDENCE: 0.0-1.0
- DESCRIPTION: max 10 words, what you see
- EMOTION: one word emotion or "neutral"`;

  const prompt = `What gesture is this person making and what do they want to communicate?`;

  try {
    const raw = await ollamaGenerate({
      model: VISION_MODEL,
      prompt,
      system,
      images: [frameBase64],
      maxTokens: 60,
      timeoutMs: 5000,
    });

    const parts = raw.replace(/"/g, "").split("|");
    if (parts.length >= 3) {
      return {
        gesture: parts[0].trim() || currentLandmarkGesture,
        confidence: Math.min(1, Math.max(0, parseFloat(parts[1]) || 0.75)),
        description: parts[2].trim(),
        emotion: parts[3]?.trim() || null,
      };
    }
  } catch { /* offline fallback */ }

  return {
    gesture: currentLandmarkGesture,
    confidence: 0.6,
    description: `MediaPipe: ${currentLandmarkGesture}`,
    emotion: null,
  };
}

// ─── Stage 4: Gemma Text — streaming sentence completion ──────────────────────
export async function* streamSentenceCompletion(
  partialText: string,
  context: "medical" | "daily" | "emergency" | "general",
  language: string
): AsyncGenerator<string> {
  const contextMap: Record<string, string> = {
    medical:   "hospital patient in India, focus on medical needs, pain, medication",
    daily:     "daily home life, food, water, comfort, family",
    emergency: "EMERGENCY — suggest urgent help phrases",
    general:   "general AAC communication for non-verbal person",
  };

  const system = `You are an AAC assistant. Complete the partial message from a mute patient.
Context: ${contextMap[context]}.
Language: ${language === "hi" ? "Hindi" : language === "ta" ? "Tamil" : language === "te" ? "Telugu" : "English"}.
Return ONLY 3 short completions separated by |. Under 8 words each. No extra text.`;

  const prompt = `Complete: "${partialText}"`;

  // Try streaming first
  try {
    const res = await fetch(`${OLLAMA}/api/generate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: TEXT_MODEL,
        prompt,
        system,
        stream: true,
        options: { num_predict: 60, temperature: 0.3 },
      }),
      signal: AbortSignal.timeout(8000),
    });

    if (!res.ok || !res.body) throw new Error("stream failed");

    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      const chunk = decoder.decode(value, { stream: true });
      for (const line of chunk.split("\n")) {
        if (!line.trim()) continue;
        try {
          const parsed = JSON.parse(line);
          if (parsed.response) {
            buffer += parsed.response;
            yield buffer; // emit partial result
          }
        } catch { /* skip malformed */ }
      }
    }
    return;
  } catch { /* fall through to non-streaming */ }

  // Non-streaming fallback
  try {
    const result = await ollamaGenerate({ model: FAST_MODEL, prompt, system, maxTokens: 60 });
    yield result;
  } catch {
    yield getFallbackCompletions(partialText).join(" | ");
  }
}

// ─── Stage 5: Gemma Translation ───────────────────────────────────────────────
export async function translateWithGemma(
  text: string,
  targetLang: "hi" | "ta" | "te" | "bn" | "mr" | "en"
): Promise<string> {
  const langNames: Record<string, string> = {
    hi: "Hindi (Devanagari script)",
    ta: "Tamil",
    te: "Telugu",
    bn: "Bengali",
    mr: "Marathi",
    en: "English",
  };

  if (targetLang === "en") return text;

  const system = `You are a translator for AAC hospital communication in India.
Translate naturally. Medical context. Use simple words a nurse would understand.
Return ONLY the translated text. No romanization. Use native script.`;

  try {
    return await ollamaGenerate({
      model: TEXT_MODEL,
      prompt: `Translate to ${langNames[targetLang]}: "${text}"`,
      system,
      maxTokens: 80,
      timeoutMs: 6000,
    });
  } catch {
    return text;
  }
}

// ─── Stage 6: Gemma Emotion-Aware Response ────────────────────────────────────
export async function generateEmpathyResponse(
  text: string,
  emotion: string
): Promise<string> {
  if (!emotion || emotion === "neutral") return "";
  const system = `You are a compassionate caregiver AI. A mute patient just communicated and appears ${emotion}.
Suggest a SHORT empathetic nurse response (under 10 words). Return ONLY the response text.`;
  try {
    return await ollamaGenerate({
      model: FAST_MODEL,
      prompt: `Patient said: "${text}". They appear ${emotion}. Suggest a nurse's response.`,
      system,
      maxTokens: 30,
      timeoutMs: 4000,
    });
  } catch {
    return "";
  }
}

// ─── Model health check ────────────────────────────────────────────────────────
export interface ModelHealth {
  available: boolean;
  models: string[];
  hasVision: boolean;
  hasText: boolean;
  latencyMs: number;
}

export async function checkAllModels(): Promise<ModelHealth> {
  const start = Date.now();
  try {
    const res = await fetch(`${OLLAMA}/api/tags`, { signal: AbortSignal.timeout(3000) });
    if (!res.ok) return { available: false, models: [], hasVision: false, hasText: false, latencyMs: 0 };
    const data = await res.json();
    const models: string[] = (data.models ?? []).map((m: { name: string }) => m.name);
    const hasGemma = models.some(m => m.includes("gemma"));
    return {
      available: true,
      models,
      hasVision: hasGemma,
      hasText: hasGemma,
      latencyMs: Date.now() - start,
    };
  } catch {
    return { available: false, models: [], hasVision: false, hasText: false, latencyMs: 0 };
  }
}

// ─── Fallbacks ─────────────────────────────────────────────────────────────────
function getFallbackCompletions(partial: string): string[] {
  const p = partial.toLowerCase();
  if (p.includes("pain") || p.includes("hurt")) return ["I need pain relief", "Pain is severe — level 8", "Please call doctor now"];
  if (p.includes("water") || p.includes("thirst")) return ["I need water please", "Very thirsty", "Please bring water"];
  if (p.includes("help")) return ["I need help now", "Please come here", "Emergency — help me"];
  if (p.includes("breath")) return ["Cannot breathe — emergency", "Oxygen please", "Call nurse urgently"];
  return ["I need help", "Please come here", "Thank you"];
}
