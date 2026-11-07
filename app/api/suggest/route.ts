import { NextResponse } from 'next/server';
import { buildPrompt, MAX_INPUT, parseSuggestions } from '../../lib/suggest';

// Talks to an Ollama server you run yourself (default: on this machine).
// Nothing is sent to any third-party service.
const OLLAMA_URL = process.env.OLLAMA_URL ?? 'http://localhost:11434';
const OLLAMA_MODEL = process.env.OLLAMA_MODEL ?? 'gemma3';
const TIMEOUT_MS = 8000;

export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'invalid JSON' }, { status: 400 });
  }
  const { text, lang } = (body ?? {}) as { text?: unknown; lang?: unknown };
  if (typeof text !== 'string' || !text.trim() || text.length > MAX_INPUT) {
    return NextResponse.json({ error: 'text must be 1–300 characters' }, { status: 400 });
  }

  try {
    const res = await fetch(`${OLLAMA_URL}/api/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: OLLAMA_MODEL,
        prompt: buildPrompt(text, lang === 'hi' ? 'hi' : 'en'),
        stream: false,
        options: { num_predict: 80, temperature: 0.4 },
      }),
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
    if (!res.ok) throw new Error(`Ollama HTTP ${res.status}`);
    const data = (await res.json()) as { response?: unknown };
    const suggestions = typeof data.response === 'string' ? parseSuggestions(data.response) : [];
    return NextResponse.json({ suggestions });
  } catch {
    return NextResponse.json({ suggestions: [], error: 'local AI unavailable' }, { status: 503 });
  }
}
