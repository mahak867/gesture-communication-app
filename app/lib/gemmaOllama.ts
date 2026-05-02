const OLLAMA = "http://localhost:11434";
const MODEL = "gemma3:4b";

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

export async function checkOllamaStatus(): Promise<boolean> {
  try {
    const res = await fetch(`${OLLAMA}/api/tags`, { signal: AbortSignal.timeout(2000) });
    return res.ok;
  } catch { return false; }
}
