import { NextResponse } from "next/server";

const OLLAMA = process.env.OLLAMA_URL ?? "http://localhost:11434";

export async function GET() {
  const start = Date.now();
  try {
    const res = await fetch(`${OLLAMA}/api/tags`, {
      signal: AbortSignal.timeout(3000),
    });
    if (!res.ok) {
      return NextResponse.json(
        { status: "offline", available: false, latencyMs: Date.now() - start, models: [] },
        { status: 503 }
      );
    }
    const data = await res.json();
    const models: string[] = (data.models ?? []).map((m: { name: string }) => m.name);
    const hasGemma = models.some((m) => m.includes("gemma"));
    return NextResponse.json({
      status: "ok",
      available: true,
      hasGemma,
      models,
      latencyMs: Date.now() - start,
    });
  } catch {
    return NextResponse.json(
      { status: "offline", available: false, latencyMs: Date.now() - start, models: [] },
      { status: 503 }
    );
  }
}
