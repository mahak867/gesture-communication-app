// components/SentenceBuilder.tsx
'use client';
import { useState, useCallback } from 'react';
import type { GestureResult } from '../lib/gestures';

interface SentenceBuilderProps {
  text: string;
  currentGesture: GestureResult | null;
  progress: number;
  isSpeaking: boolean;
  onSpeak: () => void;
  onClear: () => void;
  onBackspace: () => void;
  onUndo?: () => void;
  canUndo?: boolean;
  /** CSS font-size multiplier for the sentence display (default 1). */
  fontSize?: number;
}

export default function SentenceBuilder({
  text,
  currentGesture,
  progress,
  isSpeaking,
  onSpeak,
  onClear,
  onBackspace,
  onUndo,
  canUndo = false,
  fontSize = 1,
}: SentenceBuilderProps) {
  const progressPct = Math.round(progress * 100);
  const isConfirming = progress > 0 && progress < 1;
  const wordCount = text.trim() ? text.trim().split(/\s+/).length : 0;

  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(async () => {
    if (!text.trim()) return;
    try {
      await navigator.clipboard.writeText(text.trim());
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // Clipboard API not available (e.g. older WebView) — silently skip
    }
  }, [text]);

  return (
    <div className="flex flex-col gap-3">
      {/* ── Current gesture indicator ── */}
      <div
        className="min-h-[64px] bg-gray-800 border border-gray-700 rounded-xl px-4 flex items-center gap-3"
        aria-label={
          currentGesture
            ? `Detecting gesture: ${currentGesture.label}, ${progressPct}% confirmed`
            : 'No gesture detected'
        }
      >
        {currentGesture ? (
          <>
            <span className="text-3xl flex-shrink-0" aria-hidden="true">{currentGesture.emoji}</span>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-1">
                <span className="text-white font-bold text-sm truncate">
                  {currentGesture.label}
                  <span className="ml-2 text-xs font-normal text-gray-400 uppercase">
                    {currentGesture.category}
                  </span>
                </span>
                <span className="text-xs text-gray-400 ml-2 flex-shrink-0" aria-hidden="true">
                  {progressPct}%
                </span>
              </div>
              <div
                className="w-full bg-gray-700 rounded-full h-2 overflow-hidden"
                role="progressbar"
                aria-valuenow={progressPct}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-label={`Dwell progress: ${progressPct}%`}
              >
                <div
                  className="h-2 rounded-full transition-all duration-100"
                  style={{
                    width: `${progressPct}%`,
                    backgroundColor: progress >= 0.99 ? '#22c55e' : '#06b6d4',
                    boxShadow: isConfirming ? '0 0 6px rgba(6,182,212,0.6)' : undefined,
                  }}
                />
              </div>
            </div>
          </>
        ) : (
          <span className="text-gray-500 text-sm italic select-none">
            ✋ Hold a gesture to type…
          </span>
        )}
      </div>

      {/* ── Text display ── */}
      <div
        className="min-h-[90px] max-h-[160px] overflow-y-auto bg-gray-800 border border-gray-700 rounded-xl p-4 font-mono leading-relaxed break-words"
        style={{ fontSize: `${fontSize}em` }}
        aria-label="Sentence being built"
        aria-live="polite"
        aria-atomic="false"
      >
        {text ? (
          <>
            {text}
            <span
              aria-hidden="true"
              className="inline-block w-0.5 h-5 bg-cyan-400 ml-0.5 align-middle animate-pulse"
            />
          </>
        ) : (
          <span className="text-gray-600 italic select-none">
            Your sentence will appear here…
          </span>
        )}
      </div>

      {/* ── Character / word count ── */}
      {text && (
        <p className="text-xs text-gray-600 -mt-1" aria-live="polite">
          {text.length} character{text.length !== 1 ? 's' : ''} · {wordCount} word{wordCount !== 1 ? 's' : ''}
        </p>
      )}

      {/* ── Action buttons — min 44×44px touch targets ── */}
      <div className="grid grid-cols-2 gap-2">
        <button
          onClick={onBackspace}
          aria-label="Delete last character (gesture: thumbs down)"
          className="bg-gray-800 hover:bg-gray-700 border border-gray-700 text-white min-h-[44px] rounded-xl text-sm flex items-center justify-center gap-1.5 transition-colors active:scale-95"
        >
          <span aria-hidden="true">⌫</span>
          <span>Back</span>
        </button>

        <button
          onClick={onClear}
          aria-label="Clear all text (gesture: rock-on 🤘)"
          className="bg-gray-800 hover:bg-red-950 border border-gray-700 hover:border-red-800 text-white min-h-[44px] rounded-xl text-sm flex items-center justify-center gap-1.5 transition-colors active:scale-95"
        >
          <span aria-hidden="true">🗑️</span>
          <span>Clear</span>
        </button>

        {onUndo && (
          <button
            onClick={onUndo}
            disabled={!canUndo}
            aria-label="Undo last gesture (Ctrl+Z)"
            className="bg-gray-800 hover:bg-gray-700 disabled:bg-gray-800 disabled:opacity-40 border border-gray-700 text-white min-h-[44px] rounded-xl text-sm flex items-center justify-center gap-1.5 transition-colors active:scale-95"
          >
            <span aria-hidden="true">↩️</span>
            <span>Undo</span>
          </button>
        )}

        <button
          onClick={handleCopy}
          disabled={!text.trim()}
          aria-label={copied ? 'Copied to clipboard' : 'Copy sentence to clipboard'}
          className="bg-gray-800 hover:bg-gray-700 disabled:bg-gray-800 disabled:opacity-40 border border-gray-700 text-white min-h-[44px] rounded-xl text-sm flex items-center justify-center gap-1.5 transition-colors active:scale-95"
        >
          <span aria-hidden="true">{copied ? '✅' : '📋'}</span>
          <span>{copied ? 'Copied!' : 'Copy'}</span>
        </button>

        <button
          onClick={onSpeak}
          disabled={!text.trim() || isSpeaking}
          aria-label={isSpeaking ? 'Speaking…' : 'Speak sentence aloud (gesture: thumbs up)'}
          aria-disabled={!text.trim() || isSpeaking}
          className={`${onUndo ? 'col-span-2' : 'col-span-1'} text-white font-bold min-h-[44px] rounded-xl text-sm flex items-center justify-center gap-1.5 transition-all active:scale-95 ${
            isSpeaking
              ? 'bg-cyan-500 animate-pulse cursor-not-allowed'
              : 'bg-cyan-600 hover:bg-cyan-500 disabled:bg-gray-700 disabled:cursor-not-allowed'
          }`}
        >
          <span aria-hidden="true">🔊</span>
          <span>{isSpeaking ? 'Speaking…' : 'Speak'}</span>
        </button>
      </div>
    </div>
  );
}
