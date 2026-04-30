// hooks/useSpeech.ts
'use client';
import { useCallback, useEffect, useRef, useState } from 'react';

export interface SpeechSettings {
  rate: number;
  pitch: number;
  voiceIndex: number;
}

const SPEECH_STORAGE_KEY = 'gesturetalk-voice-settings';

function loadSpeechSettings(): SpeechSettings {
  if (typeof window === 'undefined') return { rate: 1.0, pitch: 1.0, voiceIndex: 0 };
  try {
    const raw = localStorage.getItem(SPEECH_STORAGE_KEY);
    if (raw) return { rate: 1.0, pitch: 1.0, voiceIndex: 0, ...JSON.parse(raw) };
  } catch { /* ignore */ }
  return { rate: 1.0, pitch: 1.0, voiceIndex: 0 };
}

export function useSpeech(initialSettings?: Partial<SpeechSettings>) {
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [isSpeaking, setIsSpeaking] = useState(false);
  // Use a lazy initializer so localStorage is only read once at mount, not every render
  const settingsRef = useRef<SpeechSettings | null>(null);
  if (settingsRef.current === null) {
    const persisted = loadSpeechSettings();
    settingsRef.current = {
      rate: initialSettings?.rate ?? persisted.rate,
      pitch: initialSettings?.pitch ?? persisted.pitch,
      voiceIndex: initialSettings?.voiceIndex ?? persisted.voiceIndex,
    };
  }

  // Load available voices (async in some browsers)
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const load = () => {
      const v = window.speechSynthesis.getVoices();
      if (v.length) setVoices(v);
    };
    load();
    window.speechSynthesis.addEventListener('voiceschanged', load);
    return () => window.speechSynthesis.removeEventListener('voiceschanged', load);
  }, []);

  const updateSettings = useCallback((patch: Partial<SpeechSettings>) => {
    const next = { ...settingsRef.current!, ...patch };
    settingsRef.current = next;
    try {
      localStorage.setItem(SPEECH_STORAGE_KEY, JSON.stringify(next));
    } catch { /* ignore quota errors */ }
  }, []);

  const speak = useCallback((text: string) => {
    if (typeof window === 'undefined' || !window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const utt = new SpeechSynthesisUtterance(text);
    const { rate, pitch, voiceIndex } = settingsRef.current!;
    utt.rate = rate;
    utt.pitch = pitch;
    const available = window.speechSynthesis.getVoices();
    if (available[voiceIndex]) utt.voice = available[voiceIndex];
    utt.onstart = () => setIsSpeaking(true);
    utt.onend = () => setIsSpeaking(false);
    utt.onerror = () => setIsSpeaking(false);
    window.speechSynthesis.speak(utt);
  }, []);

  const stop = useCallback(() => {
    window.speechSynthesis?.cancel();
    setIsSpeaking(false);
  }, []);

  return { speak, stop, voices, isSpeaking, updateSettings };
}