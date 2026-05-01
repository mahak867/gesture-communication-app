import { NextRequest, NextResponse } from "next/server";

const OLLAMA = process.env.OLLAMA_URL ?? "http://localhost:11434";
const MODEL = "gemma3:4b"; // Gemma 3 multimodal

export async function POST(req: NextRequest) {
  try {
    const { frameBase64, currentGesture, context } = await req.json();

    if (!frameBase64) {
      return NextResponse.json({ error: "frameBase64 required" }, { status: 400 });
    }

    const system = `You are a multimodal AI for an AAC app helping mute patients in Indian hospitals communicate.
Analyze the hand gesture in this camera frame.
MediaPipe landmark system identified: "${currentGesture ?? "unknown"}".
Context: ${context ?? "medical"} — Indian hospital.

Return ONLY this pipe-separated format:
GESTURE|CONFIDENCE|DESCRIPTION|EMOTION|URGENCY

- GESTURE: what the person is communicating (word or short phrase, e.g. "help", "pain", "water", "yes")
- CONFIDENCE: 0.0–1.0 
- DESCRIPTION: 8 words max describing the hand shape
- EMOTION: one word (neutral/distressed/fearful/calm/urgent)
- URGENCY: low/medium/high

Example: help|0.93|Open palm raised, fingers spread|distressed|high`;

    const body = {
      model: MODEL,
      prompt: "What is this patient trying to communicate with this hand gesture?",
      system,
      images: [frameBase64.replace(/^data:image\/[a-z]+;base64,/, "")],
      stream: false,
      options: { num_predict: 40, temperature: 0.1, top_p: 0.95 },
    };

    const start = Date.now();
    const ollamaRes = await fetch(`${OLLAMA}/api/generate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(6000),
    });

    if (!ollamaRes.ok) throw new Error(`Ollama ${ollamaRes.status}`);

    const data = await ollamaRes.json();
    const raw = (data.response ?? "").trim();
    const latencyMs = Date.now() - start;

    // Parse pipe-separated response
    const parts = raw.replace(/"/g, "").split("|").map((s: string) => s.trim());
    const result = {
      gesture: parts[0] || currentGesture || "unknown",
      confidence: Math.min(1, Math.max(0, parseFloat(parts[1]) || 0.7)),
      description: parts[2] || "Gesture detected",
      emotion: parts[3] || "neutral",
      urgency: (parts[4] || "low") as "low" | "medium" | "high",
      latencyMs,
      model: MODEL,
      raw,
    };

    return NextResponse.json(result);
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    // Return graceful degraded result instead of 500
    return NextResponse.json({
      gesture: "unknown",
      confidence: 0,
      description: "Gemma vision offline",
      emotion: "neutral",
      urgency: "low",
      latencyMs: 0,
      model: MODEL,
      offline: true,
      error: msg,
    });
  }
}
