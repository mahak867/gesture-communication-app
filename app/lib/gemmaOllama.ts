/**
 * GestureTalk — Gemma 4 On-Device Integration via Ollama
 * Runs 100% locally. No data leaves the device.
 * Required for Gemma 4 Good Hackathon eligibility.
 */

const OLLAMA_BASE = process.env.NEXT_PUBLIC_OLLAMA_URL || "http://localhost:11434";
const MODEL = process.env.NEXT_PUBLIC_GEMMA_MODEL || "gemma2:2b";

export interface GemmaStatus {
  available: boolean;
  model: string;
  latencyMs?: number;
}

// ─── Health check ─────────────────────────────────────────────────────────────
export async function checkGemmaStatus(): Promise<GemmaStatus> {
  try {
    const start = Date.now();
    const res = await fetch(`${OLLAMA_BASE}/api/tags`, { signal: AbortSignal.timeout(3000) });
    if (!res.ok) return { available: false, model: MODEL };
    const data = await res.json();
    const available = data.models?.some((m: { name: string }) => m.name.startsWith("gemma"));
    return { available, model: MODEL, latencyMs: Date.now() - start };
  } catch {
    return { available: false, model: MODEL };
  }
}

// ─── Core generate function ───────────────────────────────────────────────────
async function generate(prompt: string, system: string, maxTokens = 80): Promise<string> {
  const res = await fetch(`${OLLAMA_BASE}/api/generate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: MODEL,
      prompt,
      system,
      stream: false,
      options: { num_predict: maxTokens, temperature: 0.3, top_p: 0.9 },
    }),
    signal: AbortSignal.timeout(8000),
  });
  if (!res.ok) throw new Error(`Ollama error: ${res.status}`);
  const data = await res.json();
  return data.response?.trim() ?? "";
}

// ─── 1. Sentence autocomplete ─────────────────────────────────────────────────
export async function getSentenceCompletions(
  partialText: string,
  context: "medical" | "daily" | "emergency" | "general" = "general",
  language: "en" | "hi" | "ta" = "en"
): Promise<string[]> {
  const contextGuide: Record<string, string> = {
    medical: "The user is a patient in a hospital. Prioritise medical needs, pain, medication, doctor requests.",
    daily: "The user is at home. Focus on daily needs, food, water, comfort, family.",
    emergency: "EMERGENCY context. Suggest urgent help phrases immediately.",
    general: "General AAC communication for a non-verbal person.",
  };

  const langGuide: Record<string, string> = {
    en: "Respond in English only.",
    hi: "Respond in Hindi only.",
    ta: "Respond in Tamil only.",
  };

  const system = `You are an AAC (Augmentative and Alternative Communication) assistant helping a mute or non-verbal person communicate.
${contextGuide[context]}
${langGuide[language]}
Rules:
- Return ONLY 3 short, natural sentence completions separated by | 
- Each completion must be under 10 words
- No explanations, no numbering, no extra text
- Make completions feel natural and human, not robotic`;

  const prompt = `Complete this partial message from a non-verbal person: "${partialText}"
Return exactly 3 completions separated by |`;

  try {
    const raw = await generate(prompt, system, 60);
    const completions = raw
      .split("|")
      .map((s) => s.trim())
      .filter((s) => s.length > 0 && s.length < 80)
      .slice(0, 3);

    if (completions.length === 0) return getFallbackCompletions(partialText);
    return completions;
  } catch {
    return getFallbackCompletions(partialText);
  }
}

// ─── 2. Gesture classification from landmarks ─────────────────────────────────
export async function classifyGestureFromLandmarks(
  landmarks: number[][],
  handedness: "Left" | "Right"
): Promise<{ letter: string; confidence: number; alternatives: string[] }> {
  // First try fast local math classification
  const localResult = classifyLocally(landmarks, handedness);
  if (localResult.confidence > 0.85) return localResult;

  // Fall back to Gemma for ambiguous cases
  try {
    const landmarkStr = landmarks
      .slice(0, 21)
      .map((l, i) => `${i}:[${l.map((v) => v.toFixed(3)).join(",")}]`)
      .join(" ");

    const system = `You are an ASL (American Sign Language) expert. Given hand landmark coordinates, identify the letter being signed.
Return ONLY: LETTER|CONFIDENCE|ALT1|ALT2 (e.g. A|0.92|E|S)
No other text.`;

    const prompt = `Hand: ${handedness}
Landmarks (index:[x,y,z]): ${landmarkStr}
What ASL letter is this?`;

    const raw = await generate(prompt, system, 20);
    const parts = raw.split("|");
    if (parts.length >= 2) {
      return {
        letter: parts[0].trim().toUpperCase(),
        confidence: parseFloat(parts[1]) || 0.7,
        alternatives: parts.slice(2).map((s) => s.trim()).filter(Boolean),
      };
    }
  } catch {
    // fall through to local result
  }
  return localResult;
}

// ─── 3. Caregiver summary ─────────────────────────────────────────────────────
export async function generateCaregiverSummary(
  messages: Array<{ text: string; timestamp: string }>,
  timeframe: "daily" | "weekly" = "daily"
): Promise<string> {
  const messageLog = messages
    .slice(-50)
    .map((m) => `[${m.timestamp}] ${m.text}`)
    .join("\n");

  const system = `You are a medical AI assistant summarising communication logs for a caregiver or nurse.
Be compassionate, clinical, and concise. Highlight pain mentions, repeated requests, emotional patterns, and urgent needs.`;

  const prompt = `Summarise this ${timeframe} communication log from a non-verbal patient:

${messageLog}

Write a caregiver summary with:
1. Key needs expressed
2. Pain or discomfort mentions  
3. Emotional patterns
4. Urgent alerts (if any)
5. Recommendations`;

  try {
    return await generate(prompt, system, 200);
  } catch {
    return `Summary unavailable — Ollama offline. ${messages.length} messages recorded. Please review manually.`;
  }
}

// ─── 4. Real-time translation ─────────────────────────────────────────────────
export async function translateMessage(
  text: string,
  targetLang: "hi" | "ta" | "en" | "ar"
): Promise<string> {
  const langNames: Record<string, string> = {
    hi: "Hindi", ta: "Tamil", en: "English", ar: "Arabic",
  };

  const system = `You are a translator for AAC communication. Translate the message naturally.
Return ONLY the translated text. No explanations.`;

  const prompt = `Translate to ${langNames[targetLang]}: "${text}"`;

  try {
    return await generate(prompt, system, 60);
  } catch {
    return text; // fallback: return original
  }
}

// ─── Local landmark classifier (fast, no AI needed) ──────────────────────────
function classifyLocally(
  landmarks: number[][],
  handedness: string
): { letter: string; confidence: number; alternatives: string[] } {
  if (!landmarks || landmarks.length < 21) {
    return { letter: "?", confidence: 0, alternatives: [] };
  }

  const lm = landmarks;
  // Finger tip indices: thumb=4, index=8, middle=12, ring=16, pinky=20
  // Finger pip indices: thumb=3, index=6, middle=10, ring=14, pinky=18

  // For left hand, thumb tip extends to the right (larger x); right hand extends left
  const isLeft = handedness.toLowerCase() === "left";
  const thumbUp = isLeft ? lm[4][0] > lm[2][0] : lm[4][0] < lm[2][0];
  const indexUp = lm[8][1] < lm[6][1];
  const middleUp = lm[12][1] < lm[10][1];
  const ringUp = lm[16][1] < lm[14][1];
  const pinkyUp = lm[20][1] < lm[18][1];

  const allCurled = !indexUp && !middleUp && !ringUp && !pinkyUp;
  const allUp = indexUp && middleUp && ringUp && pinkyUp;

  if (allCurled && !thumbUp) return { letter: "A", confidence: 0.9, alternatives: ["E", "S"] };
  if (allCurled && thumbUp) return { letter: "A", confidence: 0.85, alternatives: ["A", "T"] };
  if (allUp && thumbUp) return { letter: "B", confidence: 0.88, alternatives: ["4", "F"] };
  if (indexUp && !middleUp && !ringUp && !pinkyUp) return { letter: "D", confidence: 0.85, alternatives: ["1", "G"] };
  if (indexUp && middleUp && !ringUp && !pinkyUp) return { letter: "U", confidence: 0.82, alternatives: ["V", "H"] };
  if (pinkyUp && !indexUp && !middleUp && !ringUp) return { letter: "I", confidence: 0.88, alternatives: ["J"] };
  if (thumbUp && pinkyUp && !indexUp && !middleUp && !ringUp) return { letter: "Y", confidence: 0.9, alternatives: ["6"] };
  if (indexUp && pinkyUp && !middleUp && !ringUp) return { letter: "L", confidence: 0.85, alternatives: [] };
  if (allUp && !thumbUp) return { letter: "4", confidence: 0.8, alternatives: ["B"] };

  return { letter: "?", confidence: 0.3, alternatives: ["A", "B", "C"] };
}

// ─── Fallback completions when Gemma is offline ───────────────────────────────
function getFallbackCompletions(partial: string): string[] {
  const p = partial.toLowerCase();
  if (p.includes("pain") || p.includes("hurt")) return ["I need pain medication", "The pain is severe", "Please call a doctor"];
  if (p.includes("water") || p.includes("drink")) return ["I need water please", "I am very thirsty", "Can I have some water"];
  if (p.includes("help")) return ["I need help now", "Please help me", "Call someone please"];
  if (p.includes("doctor") || p.includes("nurse")) return ["Please call the nurse", "I need to see a doctor", "Can you get someone"];
  return ["I need help", "Please come here", "Thank you"];
}
