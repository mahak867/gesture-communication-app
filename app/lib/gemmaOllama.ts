const OLLAMA = "http://localhost:11434";
const MODEL = "gemma4";

export interface GemmaStatus {
  available: boolean;
  model: string;
  latencyMs?: number;
}

export async function checkGemmaStatus(): Promise<GemmaStatus> {
  try {
    const start = Date.now();
    const res = await fetch(`${OLLAMA}/api/tags`, { signal: AbortSignal.timeout(3000) });
    if (!res.ok) return { available: false, model: MODEL };
    const data = await res.json();
    const available = data.models?.some((m: { name: string }) => m.name.includes("gemma"));
    return { available, model: MODEL, latencyMs: Date.now() - start };
  } catch {
    return { available: false, model: MODEL };
  }
}

export async function checkOllamaStatus(): Promise<boolean> {
  const s = await checkGemmaStatus();
  return s.available;
}

export async function getSentenceCompletions(partial: string): Promise<string[]> {
  if (!partial || partial.trim().length < 2) return [];
  try {
    const res = await fetch(`${OLLAMA}/api/generate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: MODEL,
        prompt: `You help mute hospital patients communicate. Complete this partial message with 3 short natural options separated by |. No numbering. Just the phrases. Partial: "${partial}"`,
        stream: false,
        options: { num_predict: 60, temperature: 0.3 },
      }),
      signal: AbortSignal.timeout(5000),
    });
    const data = await res.json();
    return data.response?.split("|").map((s: string) => s.trim()).filter(Boolean).slice(0, 3) ?? [];
  } catch {
    return ["I need help", "Please come here", "Thank you"];
  }
}

export async function classifyGestureFromLandmarks(
  landmarks: number[][],
  handedness: "Left" | "Right"
): Promise<{ letter: string; confidence: number; alternatives: string[] }> {
  try {
    const landmarkStr = landmarks
      .slice(0, 21)
      .map((l, i) => `${i}:[${l.map((v: number) => v.toFixed(2)).join(",")}]`)
      .join(" ");
    const res = await fetch(`${OLLAMA}/api/generate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: MODEL,
        prompt: `ASL expert. Hand: ${handedness}. Landmarks: ${landmarkStr}. Reply ONLY: LETTER|CONFIDENCE|ALT1|ALT2`,
        stream: false,
        options: { num_predict: 20, temperature: 0.1 },
      }),
      signal: AbortSignal.timeout(4000),
    });
    const data = await res.json();
    const parts = (data.response ?? "").split("|");
    if (parts.length >= 2) {
      return {
        letter: parts[0].trim().toUpperCase().charAt(0) || "?",
        confidence: parseFloat(parts[1]) || 0.7,
        alternatives: parts.slice(2).map((s: string) => s.trim()).filter(Boolean),
      };
    }
  } catch { /* fall through */ }
  return { letter: "?", confidence: 0, alternatives: [] };
}

export async function generateCaregiverSummary(
  messages: Array<{ text: string; timestamp: string }>
): Promise<string> {
  const log = messages.slice(-30).map((m) => `[${m.timestamp}] ${m.text}`).join("\n");
  try {
    const res = await fetch(`${OLLAMA}/api/generate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: MODEL,
        prompt: `Summarise this patient communication log for a nurse. Highlight pain, urgent needs, emotional patterns.\n\n${log}`,
        stream: false,
        options: { num_predict: 200, temperature: 0.3 },
      }),
      signal: AbortSignal.timeout(10000),
    });
    const data = await res.json();
    return data.response ?? "Summary unavailable.";
  } catch {
    return "Gemma offline. Please review messages manually.";
  }
}

export async function translateMessage(text: string, targetLang: string): Promise<string> {
  try {
    const res = await fetch(`${OLLAMA}/api/generate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: MODEL,
        prompt: `Translate to ${targetLang}. Reply with ONLY the translation, nothing else: "${text}"`,
        stream: false,
        options: { num_predict: 80, temperature: 0.2 },
      }),
      signal: AbortSignal.timeout(5000),
    });
    const data = await res.json();
    return data.response?.trim() ?? text;
  } catch {
    return text;
  }
}
