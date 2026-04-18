// components/SentenceBuilder.tsx
'use client';
import type { GestureResult } from '../lib/gestures';

interface SentenceBuilderProps {
  text: string;
  currentGesture: GestureResult | null;
  progress: number;
  onSpeak: () => void;
  onClear: () => void;
  onBackspace: () => void;
}

export default function SentenceBuilder({
  text,
  currentGesture,
  progress,
  onSpeak,
  onClear,
  onBackspace,
}: SentenceBuilderProps) {
  const progressPct = Math.round(progress * 100);
  const isConfirming = progress > 0 && progress < 1;

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
        className="min-h-[90px] max-h-[160px] overflow-y-auto bg-gray-800 border border-gray-700 rounded-xl p-4 font-mono text-base text-white leading-relaxed break-words"
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

      {/* ── Character count ── */}
      {text && (
        <p className="text-xs text-gray-600 -mt-1" aria-live="polite">
          {text.length} character{text.length !== 1 ? 's' : ''}
        </p>
      )}

      {/* ── Action buttons — min 44×44px touch targets ── */}
      <div className="grid grid-cols-3 gap-2">
        <button
          onClick={onBackspace}
          aria-label="Delete last character (gesture: thumbs down)"
          className="bg-gray-800 hover:bg-gray-700 border border-gray-700 text-white min-h-[44px] rounded-xl text-sm flex items-center justify-center gap-1.5 transition-colors active:scale-95"
        >
          <span aria-hidden="true">⌫</span>
          <span className="hidden sm:inline">Back</span>
        </button>

        <button
          onClick={onClear}
          aria-label="Clear all text"
          className="bg-gray-800 hover:bg-red-950 border border-gray-700 hover:border-red-800 text-white min-h-[44px] rounded-xl text-sm flex items-center justify-center gap-1.5 transition-colors active:scale-95"
        >
          <span aria-hidden="true">🗑️</span>
          <span className="hidden sm:inline">Clear</span>
        </button>

        <button
          onClick={onSpeak}
          disabled={!text.trim()}
          aria-label="Speak sentence aloud (gesture: thumbs up)"
          aria-disabled={!text.trim()}
          className="bg-cyan-600 hover:bg-cyan-500 disabled:bg-gray-700 disabled:cursor-not-allowed text-white font-bold min-h-[44px] rounded-xl text-sm flex items-center justify-center gap-1.5 transition-colors active:scale-95"
        >
          <span aria-hidden="true">🔊</span>
          Speak
        </button>
      </div>
    </div>
  );
}
