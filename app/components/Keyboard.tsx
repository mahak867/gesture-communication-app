'use client';

import { useEffect, useMemo, useState } from 'react';
import { useApp } from '../hooks/useApp';
import { applySuggestion, predict } from '../lib/prediction';
import { Key } from './Key';

const LAYOUTS = {
  abc: ['abcdefg', 'hijklmn', 'opqrstu', 'vwxyz'],
  qwerty: ['qwertyuiop', 'asdfghjkl', 'zxcvbnm'],
} as const;

export function Keyboard() {
  const { message, setMessage, learned, settings } = useApp();
  const [layout, setLayout] = useState<keyof typeof LAYOUTS>('abc');
  const words = useMemo(() => predict(message, learned), [message, learned]);
  const ai = useAiSuggestions(message, settings.aiSuggestions, settings.lang);

  const type = (s: string) => setMessage((m) => m + s);

  return (
    <div className="flex flex-col gap-2">
      <div className="grid min-h-[3.25rem] grid-cols-4 gap-2" aria-label="Word suggestions">
        {words.map((w) => (
          <Key key={w} label={`Suggestion ${w}`} variant="soft" className="py-3 text-[1.1em]" onActivate={() => setMessage((m) => applySuggestion(m, w))}>
            {w}
          </Key>
        ))}
      </div>

      {ai.length > 0 && (
        <div className="flex flex-col gap-2" aria-label="Sentence suggestions from local AI">
          {ai.map((s) => (
            <Key key={s} label={`Use sentence: ${s}`} variant="tint-talk" className="px-3 py-2.5 text-left" onActivate={() => setMessage(s)}>
              ✨ {s}
            </Key>
          ))}
        </div>
      )}

      {LAYOUTS[layout].map((row) => (
        <div key={row} className="flex gap-1.5">
          {[...row].map((c) => (
            <Key key={c} label={c} className="min-w-0 flex-1 py-4 text-[1.35em] uppercase" onActivate={() => type(c)}>
              {c}
            </Key>
          ))}
        </div>
      ))}

      <div className="grid grid-cols-[1fr_3fr_1fr_1fr] gap-1.5">
        <Key label="Switch keyboard layout" className="py-3 text-[0.8em]" onActivate={() => setLayout((l) => (l === 'abc' ? 'qwerty' : 'abc'))}>
          {layout === 'abc' ? 'QWERTY' : 'ABC'}
        </Key>
        <Key label="Space" className="py-3" onActivate={() => type(' ')}>
          space
        </Key>
        <Key label="Question mark" className="py-3 text-[1.3em]" onActivate={() => type('? ')}>
          ?
        </Key>
        <Key label="Delete letter" className="py-3 text-[1.3em]" onActivate={() => setMessage((m) => m.slice(0, -1))}>
          ⌫
        </Key>
      </div>

      <label className="mt-2 flex flex-col gap-1 text-[0.9em] text-[var(--muted)]">
        Or type with your device keyboard (any language):
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          rows={2}
          className="card p-3 text-[var(--fg)]" autoCapitalize="sentences" enterKeyHint="done"
        />
      </label>
    </div>
  );
}

/** Optional local-AI sentence completion. Silent and empty when the AI is off or unreachable. */
function useAiSuggestions(text: string, enabled: boolean, lang: string): string[] {
  const [out, setOut] = useState<string[]>([]);
  const words = text.trim().split(/\s+/).filter(Boolean).length;
  const active = enabled && words >= 2;

  useEffect(() => {
    if (!active) return;
    const ctl = new AbortController();
    const t = setTimeout(async () => {
      try {
        const r = await fetch('/api/suggest', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text, lang }),
          signal: ctl.signal,
        });
        const j = (await r.json()) as { suggestions?: unknown };
        setOut(Array.isArray(j.suggestions) ? j.suggestions.filter((s): s is string => typeof s === 'string') : []);
      } catch {
        /* AI is optional */
      }
    }, 600);
    return () => {
      clearTimeout(t);
      ctl.abort();
    };
  }, [text, lang, active]);

  return active ? out : [];
}
