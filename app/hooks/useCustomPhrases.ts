// hooks/useCustomPhrases.ts
'use client';
import { useState, useCallback } from 'react';

export interface CustomPhrase {
  id: string;
  text: string;
  emoji: string;
}

const STORAGE_KEY = 'gesturetalk-custom-phrases';

function loadFromStorage(): CustomPhrase[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as CustomPhrase[]) : [];
  } catch {
    return [];
  }
}

export function useCustomPhrases() {
  // Lazy initializer — runs once at mount, avoids a setState-in-effect
  const [phrases, setPhrases] = useState<CustomPhrase[]>(loadFromStorage);

  const persist = useCallback((next: CustomPhrase[]) => {
    setPhrases(next);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch {
      // storage quota exceeded — silently skip
    }
  }, []);

  const addPhrase = useCallback(
    (text: string, emoji = '⭐') => {
      const trimmed = text.trim();
      if (!trimmed) return;
      persist([...phrases, { id: `${Date.now()}`, text: trimmed, emoji }]);
    },
    [phrases, persist],
  );

  const removePhrase = useCallback(
    (id: string) => {
      persist(phrases.filter((p) => p.id !== id));
    },
    [phrases, persist],
  );

  return { phrases, addPhrase, removePhrase };
}
