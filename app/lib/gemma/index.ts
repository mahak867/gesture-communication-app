// Gemma 4 on-device via Ollama — required for Gemma 4 Good hackathon (May 18 2026)
// Features: AAC autocomplete, gesture classification, phrase expansion, emotion detection
const OLLAMA_BASE = process.env.NEXT_PUBLIC_OLLAMA_URL ?? 'http://localhost:11434';
const MODEL = process.env.NEXT_PUBLIC_GEMMA_MODEL ?? 'gemma4';
const TIMEOUT_MS = 5000;

export interface GemmaStatus { available: boolean; model: string | null; error: string | null; }

export async function checkGemmaStatus(): Promise<GemmaStatus> {
  try {
    const ctrl = new AbortController();
    const tid = setTimeout(() => ctrl.abort(), 2000);
    const res = await fetch(`${OLLAMA_BASE}/api/tags`, { signal: ctrl.signal });
    clearTimeout(tid);
    if (!res.ok) return { available: false, model: null, error: `HTTP ${res.status}` };
    const data = await res.json() as { models: Array<{ name: string }> };
    const has = data.models?.some(m => m.name.startsWith('gemma'));
    return { available: has, model: has ? MODEL : null, error: has ? null : 'Run: ollama pull gemma4 (or gemma3:4b if gemma4 unavailable)' };
  } catch { return { available: false, model: null, error: 'Ollama not running at ' + OLLAMA_BASE }; }
}

async function complete(prompt: string, maxTokens = 40): Promise<string> {
  const ctrl = new AbortController();
  const tid = setTimeout(() => ctrl.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(`${OLLAMA_BASE}/api/generate`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, signal: ctrl.signal,
      body: JSON.stringify({ model: MODEL, prompt, stream: false, options: { num_predict: maxTokens, temperature: 0.3 } }),
    });
    clearTimeout(tid);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json() as { response: string };
    return (data.response ?? '').trim();
  } catch { clearTimeout(tid); return ''; }
}

export async function autocompleteAAC(partial: string, context: 'general' | 'medical' | 'emergency' = 'general'): Promise<string[]> {
  if (!partial.trim()) return [];
  const ctx = context === 'medical' ? 'Patient is in hospital.' : context === 'emergency' ? 'Emergency medical situation.' : 'Daily communication.';
  const prompt = `AAC assistant for a mute person. ${ctx}\nComplete this in 4 ways (under 10 words each, one per line, no numbers/bullets):\n"${partial}"\n4 completions:`;
  const raw = await complete(prompt, 80);
  if (!raw) return [];
  return raw.split('\n').map(l => l.replace(/^\d+[\.\)]\s*|^[-•]\s*/, '').trim()).filter(l => l.length > 2 && l.length < 120).slice(0, 4);
}

export interface LandmarkSummary { fingersUp: string[]; thumbOut: boolean; fistClosed: boolean; handedness: 'left' | 'right'; }

export async function classifyGestureFromDescription(summary: LandmarkSummary): Promise<string | null> {
  const desc = `Hand:${summary.handedness}. Fingers up:${summary.fingersUp.join(',') || 'none'}. Thumb out:${summary.thumbOut}. Fist:${summary.fistClosed}.`;
  const prompt = `ASL gesture classifier. One word reply from: A-Z SPACE SPEAK BACK CLEAR UNKNOWN.\nHand: ${desc}\nGesture:`;
  const raw = await complete(prompt, 5);
  if (!raw) return null;
  const token = raw.trim().toUpperCase().split(/\s/)[0];
  const valid = new Set(['A','B','C','D','E','F','G','H','I','J','K','L','M','N','O','P','Q','R','S','T','U','V','W','X','Y','Z','SPACE','SPEAK','BACK','CLEAR']);
  return valid.has(token) ? token : null;
}

export async function expandMedicalPhrase(input: string): Promise<string> {
  const prompt = `Mute hospital patient. Expand to a clear natural sentence (under 12 words). Reply with sentence only.\nInput:"${input}"\nExpanded:`;
  return (await complete(prompt, 30)) || input;
}

export async function detectEmotionalState(sentence: string): Promise<'distressed'|'pain'|'calm'|'urgent'|'unknown'> {
  const prompt = `Classify AAC message emotion. One word: distressed pain calm urgent unknown.\nMessage:"${sentence}"\nState:`;
  const raw = (await complete(prompt, 5)).trim().toLowerCase();
  const valid = ['distressed','pain','calm','urgent','unknown'] as const;
  return (valid as readonly string[]).includes(raw) ? raw as typeof valid[number] : 'unknown';
}
