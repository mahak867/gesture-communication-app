// hooks/useStats.ts
'use client';
import { useState, useCallback } from 'react';

export interface SessionStats {
  gesturesConfirmed: number;
  messagesSent: number;
  wordsSent: number;
  sessionStarted: Date;
}

export function useStats() {
  const [stats, setStats] = useState<SessionStats>({
    gesturesConfirmed: 0,
    messagesSent: 0,
    wordsSent: 0,
    sessionStarted: new Date(),
  });

  const incrementGesture = useCallback(() => {
    setStats((s) => ({ ...s, gesturesConfirmed: s.gesturesConfirmed + 1 }));
  }, []);

  const incrementMessage = useCallback((text: string) => {
    const wordCount = text.trim().split(/\s+/).filter(Boolean).length;
    setStats((s) => ({
      ...s,
      messagesSent: s.messagesSent + 1,
      wordsSent: s.wordsSent + wordCount,
    }));
  }, []);

  return { stats, incrementGesture, incrementMessage };
}
