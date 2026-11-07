'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { useApp } from './useApp';
import { useGlove } from './useGlove';
import { useProfiles } from './useProfiles';
import { useSegments, type LiveRef } from './useSegments';
import { classify, resample, type Seq } from '../lib/recognizer';
import { sentenceText, type Sign, type Token } from '../lib/profiles';

export interface Recognition {
  at: number;
  sign: Sign | null; // null = not recognised
  confidence: number;
}

interface TranslatorState {
  tokens: Token[];
  sentence: string;
  last: Recognition | null;
  live: React.RefObject<LiveRef>;
  /** Pause recognition (e.g. while recording a new sign). */
  setPaused: (p: boolean) => void;
  undo: () => void;
  clear: () => void;
  speakSentence: () => void;
  /** Route segments to a recorder instead of the translator. */
  setCapture: (fn: ((seg: Seq) => void) | null) => void;
}

const Ctx = createContext<TranslatorState | null>(null);
const LEARN_MIN_CONFIDENCE = 0.55;
const LEARN_DELAY_MS = 5000;

export function TranslatorProvider({ children }: { children: ReactNode }) {
  const { settings, say, setMessage } = useApp();
  const { active, addSample } = useProfiles();
  const { buzz, status } = useGlove();
  const [tokens, setTokens] = useState<Token[]>([]);
  const [last, setLast] = useState<Recognition | null>(null);
  const [paused, setPaused] = useState(false);
  const capture = useRef<((seg: Seq) => void) | null>(null);
  const pendingLearn = useRef<{ signId: string; sample: Seq; timer: ReturnType<typeof setTimeout> } | null>(null);
  const autoTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const tokensRef = useRef<Token[]>([]);
  useEffect(() => {
    tokensRef.current = tokens;
    setMessage(sentenceText(tokens));
  }, [tokens, setMessage]);

  const cancelLearn = () => {
    if (pendingLearn.current) clearTimeout(pendingLearn.current.timer);
    pendingLearn.current = null;
  };

  const speakSentence = useCallback(() => {
    const text = sentenceText(tokensRef.current);
    if (text) say(text);
    setTokens([]);
  }, [say]);

  const undo = useCallback(() => {
    cancelLearn(); // the last recognition was wrong — never learn from it
    setTokens((t) => t.slice(0, -1));
  }, []);

  const clear = useCallback(() => {
    cancelLearn();
    setTokens([]);
  }, []);

  const onSegment = useCallback(
    (seg: Seq) => {
      if (capture.current) {
        capture.current(seg);
        return;
      }
      if (paused || !active) return;
      const templates = active.signs.map((s) => ({ id: s.id, samples: s.samples }));
      const m = classify(seg, templates, settings.strictness);
      const sign = active.signs.find((s) => s.id === m.id) ?? null;
      setLast({ at: Date.now(), sign, confidence: m.confidence });

      if (!sign) {
        buzz(25); // short tick: "seen, not understood"
        return;
      }
      buzz(sign.urgent ? 300 : 80);

      // Learn from use: if nobody undoes this within a few seconds, keep it as a new sample.
      cancelLearn();
      if (settings.learnFromUse && m.confidence >= LEARN_MIN_CONFIDENCE && sign.action === 'say') {
        const sample = resample(seg);
        pendingLearn.current = {
          signId: sign.id,
          sample,
          timer: setTimeout(() => {
            addSample(sign.id, sample);
            pendingLearn.current = null;
          }, LEARN_DELAY_MS),
        };
      }

      if (autoTimer.current) clearTimeout(autoTimer.current);
      switch (sign.action) {
        case 'speak':
          speakSentence();
          return;
        case 'delete':
          setTokens((t) => t.slice(0, -1));
          return;
        case 'clear':
          setTokens([]);
          return;
        case 'help':
          say(sign.output, { urgent: true });
          return;
        case 'say':
          if (sign.instant) say(sign.output, { urgent: sign.urgent });
          else setTokens((t) => [...t, { text: sign.output, signId: sign.id }]);
      }
      if (settings.autoSpeakMs > 0 && !sign.instant) autoTimer.current = setTimeout(speakSentence, settings.autoSpeakMs);
    },
    [paused, active, settings.strictness, settings.learnFromUse, settings.autoSpeakMs, buzz, addSample, say, speakSentence],
  );

  const live = useSegments(active, onSegment, status === 'connected');

  useEffect(() => () => {
    cancelLearn();
    if (autoTimer.current) clearTimeout(autoTimer.current);
  }, []);

  const setCapture = useCallback((fn: ((seg: Seq) => void) | null) => {
    capture.current = fn;
  }, []);

  const value = useMemo<TranslatorState>(
    () => ({ tokens, sentence: sentenceText(tokens), last, live, setPaused, undo, clear, speakSentence, setCapture }),
    [tokens, last, live, undo, clear, speakSentence, setCapture],
  );
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useTranslator(): TranslatorState {
  const v = useContext(Ctx);
  if (!v) throw new Error('useTranslator must be used inside <TranslatorProvider>');
  return v;
}
