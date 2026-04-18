// components/ConversationLog.tsx
'use client';
import { useEffect, useRef, useCallback, useState } from 'react';

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
  showExport?: boolean;
  /** CSS font-size multiplier applied to message text (default 1). */
  fontSize?: number;
}

export default function ConversationLog({
  messages,
  onRepeat,
  maxHeight = '220px',
  showExport = false,
  fontSize = 1,
}: ConversationLogProps) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length]);

  const handleExport = useCallback(() => {
    if (messages.length === 0) return;
    const lines = messages.map((m) => {
      const time = m.timestamp.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      });
      return `[${time}] (${m.source}) ${m.text}`;
    });
    const content = `GestureTalk Conversation Export\n${new Date().toLocaleString()}\n${'─'.repeat(40)}\n${lines.join('\n')}\n`;
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `gesturetalk-${Date.now()}.txt`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 10_000);
  }, [messages]);

  if (messages.length === 0) {
    return (
      <div className="flex items-center justify-center py-8 text-gray-600 text-sm italic select-none">
        No messages yet…
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      {showExport && (
        <div className="flex justify-end">
          <button
            onClick={handleExport}
            aria-label="Download conversation as text file"
            className="text-xs text-gray-500 hover:text-gray-300 transition-colors flex items-center gap-1 min-h-[36px] px-2"
          >
            <span aria-hidden="true">⬇️</span> Export .txt
          </button>
        </div>
      )}
      <div
        className="flex flex-col gap-1.5 overflow-y-auto pr-1"
        style={{ maxHeight }}
        aria-label="Conversation history"
        aria-live="polite"
        aria-relevant="additions"
      >
        {messages.map((msg) => (
          <MessageRow
            key={msg.id}
            msg={msg}
            onRepeat={onRepeat}
            fontSize={fontSize}
          />
        ))}
        <div ref={bottomRef} />
      </div>
    </div>
  );
}

// ── Per-message row with independent copy state ───────────────────────────────
interface MessageRowProps {
  msg: Message;
  onRepeat?: (text: string) => void;
  fontSize: number;
}

function MessageRow({ msg, onRepeat, fontSize }: MessageRowProps) {
  const meta = SOURCE_META[msg.source];
  const [copied, setCopied] = useState(false);

  const timeLabel = msg.timestamp.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
  });

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(msg.text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch { /* clipboard unavailable */ }
  }, [msg.text]);

  return (
    <div className="flex items-stretch gap-1">
      {/* Main message — click to repeat */}
      <div
        role={onRepeat ? 'button' : undefined}
        tabIndex={onRepeat ? 0 : undefined}
        onClick={onRepeat ? () => onRepeat(msg.text) : undefined}
        onKeyDown={onRepeat ? (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onRepeat(msg.text); } } : undefined}
        aria-label={onRepeat ? `Repeat: "${msg.text}" — ${meta.label} at ${timeLabel}` : undefined}
        className={`flex-1 flex items-start gap-2 rounded-xl px-3 py-2.5 bg-gray-800/60 border border-gray-700/50 ${onRepeat ? 'cursor-pointer hover:bg-gray-700/60 transition-colors' : ''} min-h-[44px]`}
      >
        <span className="text-lg mt-0.5 flex-shrink-0" aria-hidden="true">
          {meta.icon}
        </span>
        <div className="flex-1 min-w-0">
          <p className="text-white break-words" style={{ fontSize: `${fontSize}em` }}>{msg.text}</p>
          <p className="text-xs mt-0.5">
            <span className={meta.color}>{meta.label}</span>
            <span className="text-gray-600 ml-1.5">{timeLabel}</span>
          </p>
        </div>
        {onRepeat && (
          <span className="text-gray-500 text-xs mt-0.5 flex-shrink-0 select-none" aria-hidden="true">
            🔊
          </span>
        )}
      </div>

      {/* Copy button */}
      <button
        onClick={handleCopy}
        aria-label={copied ? 'Copied!' : `Copy message: ${msg.text}`}
        title={copied ? 'Copied!' : 'Copy to clipboard'}
        className="flex-shrink-0 w-9 rounded-xl bg-gray-800/60 border border-gray-700/50 hover:bg-gray-700/60 transition-colors flex items-center justify-center text-sm"
      >
        {copied ? '✅' : '📋'}
      </button>
    </div>
  );
}
