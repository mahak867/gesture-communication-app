'use client';
import { useState, useEffect, useCallback, useRef } from 'react';
import { checkGemmaStatus, type GemmaStatus } from '../lib/gemma';

export function useGemma() {
  const [status,      setStatus]      = useState<GemmaStatus>({ available: false, model: null, error: null });
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [loading,     setLoading]     = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    checkGemmaStatus().then(setStatus);
    const iv = setInterval(() => checkGemmaStatus().then(setStatus), 30_000);
    return () => clearInterval(iv);
  }, []);

  const autocomplete = useCallback((partial: string, context: 'general'|'medical'|'emergency' = 'medical') => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!partial.trim() || partial.length < 3) { setSuggestions([]); return; }
    debounceRef.current = setTimeout(async () => {
      setLoading(true);
      try {
        const res  = await fetch('/api/gemma', { method:'POST', headers:{'Content-Type':'application/json'},
          body: JSON.stringify({ type:'autocomplete', payload:{ partial, context } }) });
        const data = await res.json() as { result: string[] };
        setSuggestions(Array.isArray(data.result) ? data.result : []);
      } catch { setSuggestions([]); }
      setLoading(false);
    }, 600);
  }, []);

  const expand = useCallback(async (input: string): Promise<string> => {
    try {
      const res  = await fetch('/api/gemma', { method:'POST', headers:{'Content-Type':'application/json'},
        body: JSON.stringify({ type:'expand', payload:{ input } }) });
      const data = await res.json() as { result: string };
      return data.result || input;
    } catch { return input; }
  }, []);

  const clearSuggestions = useCallback(() => setSuggestions([]), []);

  return { status, suggestions, loading, autocomplete, expand, clearSuggestions };
}
