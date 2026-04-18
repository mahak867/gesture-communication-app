// components/VoiceSettings.tsx
'use client';
import { useState, useId } from 'react';
import type { SpeechSettings } from '../hooks/useSpeech';

const SPEECH_STORAGE_KEY = 'gesturetalk-voice-settings';

function loadPersistedSettings(): { rate: number; pitch: number; voiceIndex: number } {
  if (typeof window === 'undefined') return { rate: 1.0, pitch: 1.0, voiceIndex: 0 };
  try {
    const raw = localStorage.getItem(SPEECH_STORAGE_KEY);
    if (raw) return { rate: 1.0, pitch: 1.0, voiceIndex: 0, ...JSON.parse(raw) };
  } catch { /* ignore */ }
  return { rate: 1.0, pitch: 1.0, voiceIndex: 0 };
}

interface VoiceSettingsProps {
  voices: SpeechSynthesisVoice[];
  isSpeaking: boolean;
  onUpdate: (patch: Partial<SpeechSettings>) => void;
  onTest: () => void;
}

export default function VoiceSettings({
  voices,
  isSpeaking,
  onUpdate,
  onTest,
}: VoiceSettingsProps) {
  const id = useId();
  // Lazy initialisers restore persisted values so settings survive page refresh
  const [rate, setRate]         = useState<number>(() => loadPersistedSettings().rate);
  const [pitch, setPitch]       = useState<number>(() => loadPersistedSettings().pitch);
  const [voiceIdx, setVoiceIdx] = useState<number>(() => loadPersistedSettings().voiceIndex);

  function handleRate(v: number) {
    setRate(v);
    onUpdate({ rate: v });
  }
  function handlePitch(v: number) {
    setPitch(v);
    onUpdate({ pitch: v });
  }
  function handleVoice(idx: number) {
    setVoiceIdx(idx);
    onUpdate({ voiceIndex: idx });
  }

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h3 className="text-xs uppercase text-gray-500 font-bold mb-3">🔊 Voice Settings</h3>
        <div className="flex flex-col gap-4 bg-gray-800/60 border border-gray-700/60 rounded-xl p-4">

          {/* Voice selector */}
          <div className="flex flex-col gap-1.5">
            <label htmlFor={`${id}-voice`} className="text-xs text-gray-400 font-medium">
              Voice
            </label>
            {voices.length === 0 ? (
              <p className="text-xs text-gray-600 italic">
                No voices loaded — try reloading the page
              </p>
            ) : (
              <select
                id={`${id}-voice`}
                value={voiceIdx}
                onChange={(e) => handleVoice(Number(e.target.value))}
                className="bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm outline-none focus:ring-2 focus:ring-cyan-600"
              >
                {voices.map((v, i) => (
                  <option key={v.name} value={i}>
                    {v.name} ({v.lang})
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Rate */}
          <div className="flex flex-col gap-1.5">
            <div className="flex justify-between">
              <label htmlFor={`${id}-rate`} className="text-xs text-gray-400 font-medium">
                Speed
              </label>
              <span className="text-xs text-cyan-400 font-mono">{rate.toFixed(1)}×</span>
            </div>
            <input
              id={`${id}-rate`}
              type="range"
              min={0.5}
              max={2.0}
              step={0.1}
              value={rate}
              onChange={(e) => handleRate(Number(e.target.value))}
              aria-label={`Speech speed: ${rate.toFixed(1)} times`}
              className="w-full accent-cyan-400"
            />
            <div className="flex justify-between text-[10px] text-gray-600">
              <span>Slow</span><span>Normal</span><span>Fast</span>
            </div>
          </div>

          {/* Pitch */}
          <div className="flex flex-col gap-1.5">
            <div className="flex justify-between">
              <label htmlFor={`${id}-pitch`} className="text-xs text-gray-400 font-medium">
                Pitch
              </label>
              <span className="text-xs text-cyan-400 font-mono">{pitch.toFixed(1)}</span>
            </div>
            <input
              id={`${id}-pitch`}
              type="range"
              min={0.5}
              max={2.0}
              step={0.1}
              value={pitch}
              onChange={(e) => handlePitch(Number(e.target.value))}
              aria-label={`Speech pitch: ${pitch.toFixed(1)}`}
              className="w-full accent-cyan-400"
            />
            <div className="flex justify-between text-[10px] text-gray-600">
              <span>Low</span><span>Normal</span><span>High</span>
            </div>
          </div>

          {/* Test button */}
          <button
            onClick={onTest}
            disabled={isSpeaking}
            aria-label="Test current voice settings"
            className="flex items-center justify-center gap-2 bg-cyan-700 hover:bg-cyan-600 disabled:bg-gray-700 disabled:cursor-not-allowed text-white text-sm font-medium px-4 min-h-[44px] rounded-xl transition-colors"
          >
            <span aria-hidden="true">{isSpeaking ? '🔊' : '▶'}</span>
            {isSpeaking ? 'Speaking…' : 'Test Voice'}
          </button>
        </div>
      </div>
    </div>
  );
}
