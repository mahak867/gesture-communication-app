import { NextRequest, NextResponse } from "next/server";

const OLLAMA = process.env.OLLAMA_URL ?? "http://localhost:11434";
const MODEL = process.env.OLLAMA_MODEL ?? "gemma4";

export async function POST(req: NextRequest) {
  try {
    const { messages, patientName, wardContext } = await req.json();
    if (!messages?.length) return NextResponse.json({ error: "messages required" }, { status: 400 });

    const transcript = messages
      .map((m: { text: string; timestamp: string; source: string }) =>
        `[${new Date(m.timestamp).toLocaleTimeString("en-IN")}] (${m.source}): ${m.text}`)
      .join("\n");

    const system = `You are a clinical documentation AI for an Indian hospital.
Generate a structured SOAP note from this AAC (Augmentative and Alternative Communication) session.
The patient is non-verbal. These messages are what they communicated via gesture/AAC device.
Patient name: ${patientName ?? "Patient"}.
Ward context: ${wardContext ?? "General ward, Indian hospital"}.

Format your response EXACTLY as:

SUBJECTIVE
[Patient's complaints and symptoms as communicated via AAC — quote key phrases]

OBJECTIVE
[Observable communication patterns: urgency level, emotional state, frequency of pain reports]

ASSESSMENT
[Brief clinical interpretation — what does this communication pattern suggest?]

PLAN
[Recommended immediate nursing actions based on this session]

HANDOFF NOTE
[1-2 sentence summary for the next shift nurse — plain English]`;

    const start = Date.now();
    const res = await fetch(`${OLLAMA}/api/generate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: MODEL,
        prompt: `Generate a SOAP clinical note from this AAC session transcript:\n\n${transcript}`,
        system,
        stream: false,
        options: { num_predict: 400, temperature: 0.2 },
      }),
      signal: AbortSignal.timeout(15000),
    });

    if (!res.ok) throw new Error(`Ollama ${res.status}`);
    const data = await res.json();

    return NextResponse.json({
      note: (data.response ?? "").trim(),
      latencyMs: Date.now() - start,
      model: MODEL,
      messageCount: messages.length,
      generatedAt: new Date().toISOString(),
    });
  } catch (err) {
    return NextResponse.json({
      note: generateFallbackSOAP(err),
      offline: true,
    });
  }
}

function generateFallbackSOAP(err: unknown): string {
  void err;
  return `SUBJECTIVE
Patient communicated via AAC device (GestureTalk). Unable to generate AI summary — Gemma offline.

OBJECTIVE
Review conversation log in GestureTalk for full transcript.

ASSESSMENT
Manual review required.

PLAN
Check GestureTalk conversation log. Contact on-call physician if urgent messages detected.

HANDOFF NOTE
Patient used AAC device this shift. Review app log for full communication record.`;
}
