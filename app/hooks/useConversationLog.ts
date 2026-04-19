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

/** Returns true if write succeeded. */
function tryPersistMessages(msgs: Message[]): boolean {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(msgs));
    return true;
  } catch {
    return false;
  }
}

export function useConversationLog() {
  // Lazy initialiser — loads from localStorage once at mount
  const [messages, setMessages] = useState<Message[]>(loadMessages);
  // Set to true when localStorage quota is exceeded so the UI can warn the user
  const [storageWarning, setStorageWarning] = useState(false);

  const addMessage = useCallback((text: string, source: Message['source']) => {
    let failed = false;
    setMessages((prev) => {
      const next = [
        ...prev.slice(-(MAX_MESSAGES - 1)),
        { id: makeId(), text, source, timestamp: new Date() },
      ];
      if (!tryPersistMessages(next)) failed = true;
      return next;
    });
    // Defer setState outside the updater to satisfy react-hooks/set-state-in-effect
    setTimeout(() => {
      if (failed) setStorageWarning(true);
    }, 0);
  }, []);

  const clearMessages = useCallback(() => {
    setMessages([]);
    tryPersistMessages([]);
    setStorageWarning(false);
  }, []);

  const dismissStorageWarning = useCallback(() => setStorageWarning(false), []);

  return { messages, addMessage, clearMessages, storageWarning, dismissStorageWarning };
}
