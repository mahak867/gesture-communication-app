// components/ConversationLog.tsx
'use client';
import { useEffect, useRef } from 'react';

export interface Message {
  id: string;
  text: string;
  source: 'gesture' | 'phrase' | 'typed';
  timestamp: Date;
}

const SOURCE_META: Record<Message['source'], { icon: string; label: string; color: string }> = {
  gesture: { icon: '🤟', label: 'Gesture', color: 'text-cyan-400' },
  phrase:  { icon: '💬', label: 'Phrase',  color: 'text-violet-400' },
  typed:   { icon: '⌨️', label: 'Typed',   color: 'text-amber-400' },
};

interface ConversationLogProps {
  messages: Message[];
  onRepeat?: (text: string) => void;
  maxHeight?: string;
}

export default function ConversationLog({
  messages,
  onRepeat,
  maxHeight = '220px',
}: ConversationLogProps) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length]);

  if (messages.length === 0) {
    return (
      <div className="flex items-center justify-center py-8 text-gray-600 text-sm italic select-none">
        No messages yet…
      </div>
    );
  }

  return (
    <div
      className="flex flex-col gap-1.5 overflow-y-auto pr-1"
      style={{ maxHeight }}
      aria-label="Conversation history"
      aria-live="polite"
    >
      {messages.map((msg) => {
        const meta = SOURCE_META[msg.source];
        return (
          <div
            key={msg.id}
            role={onRepeat ? 'button' : undefined}
            tabIndex={onRepeat ? 0 : undefined}
            onClick={() => onRepeat?.(msg.text)}
            onKeyDown={(e) => e.key === 'Enter' && onRepeat?.(msg.text)}
            className={`flex items-start gap-2 rounded-lg px-3 py-2 bg-gray-800/60 border border-gray-700/50 ${
              onRepeat ? 'cursor-pointer hover:bg-gray-700/60 transition-colors' : ''
            }`}
            title={onRepeat ? 'Click to repeat this message' : undefined}
          >
            <span className="text-lg mt-0.5 flex-shrink-0" aria-hidden>
              {meta.icon}
            </span>
            <div className="flex-1 min-w-0">
              <p className="text-white text-sm break-words">{msg.text}</p>
              <p className="text-xs mt-0.5">
                <span className={meta.color}>{meta.label}</span>
                <span className="text-gray-600 ml-1.5">
                  {msg.timestamp.toLocaleTimeString('en-US', {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </span>
              </p>
            </div>
            {onRepeat && (
              <span className="text-gray-600 text-xs mt-0.5 flex-shrink-0 select-none">🔊</span>
            )}
          </div>
        );
      })}
      <div ref={bottomRef} />
    </div>
  );
}
