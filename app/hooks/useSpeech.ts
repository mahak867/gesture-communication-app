// hooks/useSpeech.ts
'use client';
import { useCallback, useEffect, useRef, useState } from 'react';

export interface SpeechSettings {
  rate: number;
  pitch: number;
  voiceIndex: number;
}

export function useSpeech(initialSettings?: Partial<SpeechSettings>) {
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const settingsRef = useRef<SpeechSettings>({
    rate: initialSettings?.rate ?? 1.0,
    pitch: initialSettings?.pitch ?? 1.0,
    voiceIndex: initialSettings?.voiceIndex ?? 0,
  });

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
    settingsRef.current = { ...settingsRef.current, ...patch };
  }, []);

  const speak = useCallback((text: string) => {
    if (typeof window === 'undefined' || !window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const utt = new SpeechSynthesisUtterance(text);
    const { rate, pitch, voiceIndex } = settingsRef.current;
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