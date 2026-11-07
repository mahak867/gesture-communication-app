'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { DEFAULT_SETTINGS, normalizeSettings, type Settings } from '../lib/settings';
import { load, save } from '../lib/storage';
import { learn, type Learned } from '../lib/prediction';
import { speak, startAlarm, stopSpeaking } from '../lib/speech';

export interface HistoryItem {
  text: string;
  at: number;
  urgent?: boolean;
}

interface AppState {
  settings: Settings;
  setSettings: (patch: Partial<Settings>) => void;
  message: string;
  setMessage: (m: string | ((m: string) => string)) => void;
  history: HistoryItem[];
  clearHistory: () => void;
  learned: Learned;
  /** Speak text aloud, log it, and raise the alarm if urgent. */
  say: (text: string, opts?: { urgent?: boolean }) => void;
  alarm: string | null;
  dismissAlarm: () => void;
  /** Shared guard so tremor / double hits don't fire twice. */
  allowActivation: () => boolean;
}

const Ctx = createContext<AppState | null>(null);

const K = { settings: 'gt.settings', history: 'gt.history', learned: 'gt.learned' };
const MAX_HISTORY = 100;

const isHistory = (v: unknown): v is HistoryItem[] =>
  Array.isArray(v) && v.every((h) => h && typeof h.text === 'string' && typeof h.at === 'number');
const isLearned = (v: unknown): v is Learned =>
  !!v && typeof v === 'object' && Object.values(v).every((n) => typeof n === 'number');

export function AppProvider({ children }: { children: ReactNode }) {
  const [settings, setSettingsState] = useState<Settings>(DEFAULT_SETTINGS);
  const [message, setMessage] = useState('');
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [learned, setLearned] = useState<Learned>({});
  const [alarm, setAlarm] = useState<string | null>(null);
  const [ready, setReady] = useState(false);
  const stopAlarmRef = useRef<() => void>(() => {});
  const lastActivation = useRef(0);

  // Load after mount so server and client render the same first frame.
  useEffect(() => {
    /* eslint-disable react-hooks/set-state-in-effect -- one-time hydration from localStorage */
    setSettingsState(normalizeSettings(load(K.settings, {})));
    setHistory(load(K.history, [], isHistory));
    setLearned(load(K.learned, {}, isLearned));
    setReady(true);
    /* eslint-enable react-hooks/set-state-in-effect */
  }, []);

  useEffect(() => { if (ready) save(K.settings, settings); }, [settings, ready]);
  useEffect(() => { if (ready) save(K.history, history); }, [history, ready]);
  useEffect(() => { if (ready) save(K.learned, learned); }, [learned, ready]);

  const settingsRef = useRef(settings);
  useEffect(() => { settingsRef.current = settings; }, [settings]);

  const setSettings = useCallback((patch: Partial<Settings>) => {
    setSettingsState((s) => normalizeSettings({ ...s, ...patch }));
  }, []);

  const dismissAlarm = useCallback(() => {
    stopAlarmRef.current();
    stopAlarmRef.current = () => {};
    setAlarm(null);
  }, []);

  const say = useCallback((text: string, opts?: { urgent?: boolean }) => {
    const t = text.trim();
    if (!t) return;
    const s = settingsRef.current;
    speak(t, { lang: s.lang, rate: s.rate, voiceURI: s.voiceURI });
    setHistory((h) => [{ text: t, at: Date.now(), urgent: opts?.urgent }, ...h].slice(0, MAX_HISTORY));
    setLearned((l) => learn(l, t));
    if (opts?.urgent) {
      stopAlarmRef.current();
      stopAlarmRef.current = startAlarm();
      setAlarm(t);
    }
  }, []);

  const allowActivation = useCallback(() => {
    const now = Date.now();
    if (now - lastActivation.current < settingsRef.current.debounceMs) return false;
    lastActivation.current = now;
    return true;
  }, []);

  useEffect(() => () => { stopAlarmRef.current(); stopSpeaking(); }, []);

  const value = useMemo<AppState>(
    () => ({
      settings, setSettings, message, setMessage, history,
      clearHistory: () => setHistory([]),
      learned, say, alarm, dismissAlarm, allowActivation,
    }),
    [settings, setSettings, message, history, learned, say, alarm, dismissAlarm, allowActivation],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useApp(): AppState {
  const v = useContext(Ctx);
  if (!v) throw new Error('useApp must be used inside <AppProvider>');
  return v;
}
