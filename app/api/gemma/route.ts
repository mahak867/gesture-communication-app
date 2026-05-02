import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
const Schema = z.object({ type: z.enum(['autocomplete','gesture','expand','emotion']), payload: z.record(z.string(), z.unknown()) });
const OLLAMA = process.env.OLLAMA_URL ?? 'http://localhost:11434';
const MODEL  = 'gemma3:4b';
async function ollama(prompt: string, maxTokens = 60): Promise<string> {
  const res = await fetch(`${OLLAMA}/api/generate`, { method:'POST', headers:{'Content-Type':'application/json'},
    body: JSON.stringify({ model:MODEL, prompt, stream:false, options:{ num_predict:maxTokens, temperature:0.3 } }) });
  if (!res.ok) throw new Error(`Ollama HTTP ${res.status}`);
  const data = await res.json() as { response: string };
  return (data.response ?? '').trim();
}
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = Schema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error:'Invalid request' }, { status:400 });
    const { type, payload } = parsed.data;
    let result: unknown;
    switch (type) {
      case 'autocomplete': {
        const partial = String(payload.partial ?? '');
        const ctx = String(payload.context ?? 'general');
        const raw = await ollama(`AAC mute patient. ${ctx==='medical'?'Hospital.':''}\nComplete in 4 ways (under 10 words, one per line):\n"${partial}"`, 100);
        result = raw.split('\n').map((l:string)=>l.replace(/^\d+[\.\)]\s*|^[-•]\s*/,'').trim()).filter((l:string)=>l.length>2).slice(0,4);
        break;
      }
      case 'gesture': {
        result = (await ollama(`ASL classifier. One word: A-Z SPACE SPEAK BACK CLEAR UNKNOWN.\n${String(payload.description??'')}\nGesture:`,5)).trim().toUpperCase().split(/\s/)[0];
        break;
      }
      case 'expand': {
        result = await ollama(`Mute patient shorthand. Expand to natural sentence under 12 words:\n"${String(payload.input??'')}"\nExpanded:`,35);
        break;
      }
      case 'emotion': {
        result = (await ollama(`Classify emotion: distressed pain calm urgent unknown.\n"${String(payload.sentence??'')}"\nState:`,5)).trim().toLowerCase();
        break;
      }
    }
    return NextResponse.json({ result });
  } catch (err) { console.error('[Gemma]',err); return NextResponse.json({ error:'Gemma unavailable', result:null }, { status:503 }); }
}
