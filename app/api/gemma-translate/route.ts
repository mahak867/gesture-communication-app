import { NextRequest, NextResponse } from "next/server";

const OLLAMA = process.env.OLLAMA_URL ?? "http://localhost:11434";
const MODEL = process.env.OLLAMA_MODEL ?? "gemma4";

const LANG_NAMES: Record<string, string> = {
  hi: "Hindi (Devanagari script)",
  ta: "Tamil",
  te: "Telugu",
  bn: "Bengali",
  mr: "Marathi",
  pa: "Punjabi (Gurmukhi script)",
  en: "English",
};

export async function POST(req: NextRequest) {
  try {
    const { text, targetLang } = await req.json();
    if (!text || !targetLang) return NextResponse.json({ error: "text and targetLang required" }, { status: 400 });
    if (targetLang === "en") return NextResponse.json({ translation: text, cached: true });

    const system = `You are a medical translator for AAC hospital communication in India.
Translate short patient messages naturally. Simple words. Medical context.
Return ONLY the translated text in ${LANG_NAMES[targetLang] ?? targetLang} script. No romanization. No explanation.`;

    const start = Date.now();
    const ollamaRes = await fetch(`${OLLAMA}/api/generate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: MODEL,
        prompt: `Translate to ${LANG_NAMES[targetLang] ?? targetLang}: "${text}"`,
        system,
        stream: false,
        options: { num_predict: 80, temperature: 0.1 },
      }),
      signal: AbortSignal.timeout(6000),
    });

    if (!ollamaRes.ok) throw new Error(`Ollama ${ollamaRes.status}`);
    const data = await ollamaRes.json();

    return NextResponse.json({
      translation: (data.response ?? "").trim() || text,
      latencyMs: Date.now() - start,
      model: MODEL,
    });
  } catch {
    return NextResponse.json({ translation: "", error: "offline", fallback: true });
  }
}
