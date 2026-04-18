// hooks/useConversationLog.ts
'use client';
import { useState, useCallback } from 'react';
import type { Message } from '../components/ConversationLog';

const STORAGE_KEY = 'gesturetalk-conversation-log';
const MAX_MESSAGES = 50;

function makeId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

/** Deserialise stored messages, converting ISO timestamp strings back to Date objects. */
function loadMessages(): Message[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as Array<Omit<Message, 'timestamp'> & { timestamp: string }>;
    return parsed.map((m) => ({ ...m, timestamp: new Date(m.timestamp) }));
  } catch {
    return [];
  }
}

function persistMessages(msgs: Message[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(msgs));
  } catch { /* storage quota exceeded — silently skip */ }
}

export function useConversationLog() {
  // Lazy initialiser — loads from localStorage once at mount
  const [messages, setMessages] = useState<Message[]>(loadMessages);

  const addMessage = useCallback((text: string, source: Message['source']) => {
    setMessages((prev) => {
      const next = [
        ...prev.slice(-(MAX_MESSAGES - 1)),
        { id: makeId(), text, source, timestamp: new Date() },
      ];
      persistMessages(next);
      return next;
    });
  }, []);

  const clearMessages = useCallback(() => {
    setMessages([]);
    persistMessages([]);
  }, []);

  return { messages, addMessage, clearMessages };
}
