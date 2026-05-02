import { NextRequest, NextResponse } from "next/server";

const OLLAMA = process.env.OLLAMA_URL ?? "http://localhost:11434";
const MODEL = process.env.OLLAMA_MODEL ?? "gemma4";

export async function POST(req: NextRequest) {
  try {
    const { frameBase64 } = await req.json();
    if (!frameBase64) return NextResponse.json({ emotion: "neutral", confidence: 0 });

    const system = `You are a clinical emotion detection AI for an Indian hospital AAC system.
Analyze the patient's facial expression in this camera frame.
Focus on: pain indicators, distress signals, fear, confusion, urgency.
This is a medical context — accuracy matters.

Return ONLY this format (one line):
EMOTION|CONFIDENCE|PAIN_LEVEL|NOTES
- EMOTION: neutral/pain/distress/fearful/confused/calm/urgent/exhausted
- CONFIDENCE: 0.0-1.0
- PAIN_LEVEL: 0-10 (0 if not pain-related)
- NOTES: max 8 words describing visible signs

Example: pain|0.91|7|Furrowed brow, eyes closed, grimacing`;

    const start = Date.now();
    const res = await fetch(`${OLLAMA}/api/generate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: MODEL,
        prompt: "What emotional state and pain level does this patient appear to be in?",
        system,
        images: [frameBase64.replace(/^data:image\/[a-z]+;base64,/, "")],
        stream: false,
        options: { num_predict: 30, temperature: 0.1 },
      }),
      signal: AbortSignal.timeout(5000),
    });

    if (!res.ok) throw new Error(`Ollama ${res.status}`);
    const data = await res.json();
    const raw  = (data.response ?? "").trim().replace(/"/g, "");
    const parts = raw.split("|");

    return NextResponse.json({
      emotion:     parts[0]?.trim() ?? "neutral",
      confidence:  Math.min(1, Math.max(0, parseFloat(parts[1]) || 0)),
      painLevel:   Math.min(10, Math.max(0, parseInt(parts[2]) || 0)),
      notes:       parts[3]?.trim() ?? "",
      latencyMs:   Date.now() - start,
      model: MODEL,
    });
  } catch {
    return NextResponse.json({ emotion: "neutral", confidence: 0, painLevel: 0, notes: "", offline: true });
  }
}
