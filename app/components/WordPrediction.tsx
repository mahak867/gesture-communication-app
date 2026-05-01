"use client";
import { useEffect, useState, useCallback } from "react";

interface Props {
  partialText: string;
  context?: "medical" | "daily" | "emergency" | "general";
  language?: "en" | "hi" | "ta";
  onSelect: (completion: string) => void;
}

export default function WordPrediction({ partialText, context = "general", language = "en", onSelect }: Props) {
  const [completions, setCompletions] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [gemmaOnline, setGemmaOnline] = useState<boolean | null>(null);

  const fetchCompletions = useCallback(async () => {
    if (!partialText || partialText.trim().length < 2) {
      setCompletions([]);
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/gemma-complete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: partialText, context, language }),
      });
      const data = await res.json();
      setCompletions(data.completions ?? []);
      setGemmaOnline(true);
    } catch {
      setGemmaOnline(false);
      setCompletions([]);
    } finally {
      setLoading(false);
    }
  }, [partialText, context, language]);

  useEffect(() => {
    const timer = setTimeout(fetchCompletions, 600);
    return () => clearTimeout(timer);
  }, [fetchCompletions]);

  if (!partialText || partialText.trim().length < 2) return null;

  return (
    <div className="w-full">
      {/* Gemma status indicator */}
      <div className="flex items-center gap-2 mb-2">
        <div className={`w-2 h-2 rounded-full ${gemmaOnline === null ? "bg-gray-400" : gemmaOnline ? "bg-green-400 animate-pulse" : "bg-red-400"}`} />
        <span className="text-xs text-gray-400">
          {gemmaOnline === null ? "Gemma 4 connecting..." : gemmaOnline ? "Gemma 4 on-device" : "Gemma offline — using fallback"}
        </span>
      </div>

      {/* Suggestion chips */}
      {loading ? (
        <div className="flex gap-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-10 w-32 bg-gray-700 rounded-lg animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="flex flex-wrap gap-2">
          {completions.map((c, i) => (
            <button
              key={i}
              onClick={() => onSelect(c)}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white text-sm rounded-lg transition-colors touch-manipulation min-h-[44px] font-medium shadow"
              aria-label={`Suggestion: ${c}`}
            >
              {c}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
