import { NextRequest } from "next/server";

const OLLAMA = process.env.OLLAMA_URL ?? "http://localhost:11434";
const MODEL = "gemma3:4b";

export async function POST(req: NextRequest) {
  const { partialText, context, language } = await req.json();

  const contextMap: Record<string, string> = {
    medical:   "patient in Indian hospital — medical needs, pain, medication, doctors",
    daily:     "daily home life — food, water, comfort, family",
    emergency: "EMERGENCY — urgent help, breathing, pain, calling family",
    general:   "general AAC communication, non-verbal person",
  };

  const langMap: Record<string, string> = {
    en: "English", hi: "Hindi", ta: "Tamil", te: "Telugu", bn: "Bengali",
  };

  const system = `AAC assistant for mute hospital patients. Complete partial messages.
Context: ${contextMap[context ?? "medical"]}.
Language: ${langMap[language ?? "en"]}.
Rules: Return ONLY 3 completions separated by |. Each under 9 words. Natural, caring tone.`;

  try {
    const ollamaRes = await fetch(`${OLLAMA}/api/generate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: MODEL,
        prompt: `Complete: "${partialText}"`,
        system,
        stream: true,
        options: { num_predict: 60, temperature: 0.25 },
      }),
      signal: AbortSignal.timeout(10000),
    });

    if (!ollamaRes.ok || !ollamaRes.body) throw new Error("stream failed");

    // Proxy the Ollama stream directly to the client
    const { readable, writable } = new TransformStream();
    ollamaRes.body.pipeTo(writable);
    return new Response(readable, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        "X-Accel-Buffering": "no",
      },
    });
  } catch {
    return new Response(
      JSON.stringify({ response: "I need help | Please come here | Thank you", done: true }),
      { headers: { "Content-Type": "application/json" } }
    );
  }
}
