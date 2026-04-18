'use client';
import { useReducer, useCallback, useRef, useId, useEffect, useState } from 'react';
import CameraView from './components/CameraView';
import SentenceBuilder from './components/SentenceBuilder';
import QuickPhrases from './components/QuickPhrases';
import ConversationLog from './components/ConversationLog';
import GestureGuide from './components/GestureGuide';
import VoiceSettings from './components/VoiceSettings';
import StatsPanel from './components/StatsPanel';
import OnboardingOverlay, { shouldShowOnboarding } from './components/OnboardingOverlay';
import { useSpeech } from './hooks/useSpeech';
import { useStats } from './hooks/useStats';
import { useCustomPhrases } from './hooks/useCustomPhrases';
import { useConversationLog } from './hooks/useConversationLog';
import type { GestureResult } from './lib/gestures';
import { sentenceReducer } from './lib/sentenceReducer';

type Tab = 'builder' | 'phrases' | 'guide' | 'log' | 'settings';

const TABS: { id: Tab; label: string; icon: string }[] = [
  { id: 'builder',  label: 'Build',    icon: '✏️' },
  { id: 'phrases',  label: 'Phrases',  icon: '💬' },
  { id: 'guide',    label: 'Guide',    icon: '📖' },
  { id: 'log',      label: 'Log',      icon: '📋' },
  { id: 'settings', label: 'Settings', icon: '⚙️' },
];

export default function GestureTalkApp() {
  const { speak, stop, voices, isSpeaking, updateSettings } = useSpeech();
  const { stats, incrementGesture, incrementMessage } = useStats();
  const { phrases: customPhrases, addPhrase, removePhrase } = useCustomPhrases();
  const { messages, addMessage, clearMessages } = useConversationLog();
  const tabsId = useId();

  // Sentence builder with undo history
  const [sentenceState, dispatchSentence] = useReducer(sentenceReducer, {
    current: '',
    history: [],
  });
  const sentence = sentenceState.current;
  const canUndo = sentenceState.history.length > 0;

  // Onboarding: shown once on first visit
  const [showOnboarding, setShowOnboarding] = useState<boolean>(() => shouldShowOnboarding());

  // Manual type-to-speak input
  const [typedInput, setTypedInput] = useState('');
  // Active right-panel tab
  const [activeTab, setActiveTab] = useState<Tab>('builder');
  // Currently detected gesture + dwell progress
  const [currentGesture, setCurrentGesture] = useState<GestureResult | null>(null);
  const [dwellProgress, setDwellProgress] = useState(0);

  // Configurable dwell time in ms (persisted to localStorage)
  const [dwellMs, setDwellMs] = useState<number>(() => {
    if (typeof window === 'undefined') return 1500;
    try {
      const v = localStorage.getItem('gesturetalk-dwell-ms');
      return v ? Number(v) : 1500;
    } catch { return 1500; }
  });

  // Auto-speak: speak + clear sentence after N seconds of inactivity
  const [autoSpeak, setAutoSpeak] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    try { return localStorage.getItem('gesturetalk-autospeak') === 'true'; } catch { return false; }
  });

  // Text size: CSS font-size multiplier (1 / 1.25 / 1.5)
  const [fontSize, setFontSize] = useState<number>(() => {
    if (typeof window === 'undefined') return 1;
    try {
      const v = localStorage.getItem('gesturetalk-fontsize');
      return v ? Number(v) : 1;
    } catch { return 1; }
  });

  // Refs for stable callbacks inside timers / effects
  const autoSpeakTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const autoSpeakRef = useRef(autoSpeak);
  useEffect(() => { autoSpeakRef.current = autoSpeak; }, [autoSpeak]);

  // Ref to always hold the latest sentence (avoids stale closures in timers)
  const sentenceRef = useRef(sentence);
  useEffect(() => { sentenceRef.current = sentence; }, [sentence]);

  // Refs for tab buttons (keyboard arrow-key navigation)
  const tabRefs = useRef<Record<Tab, HTMLButtonElement | null>>({
    builder: null, phrases: null, guide: null, log: null, settings: null,
  });

  /* ── Helpers ── */
  // Stable speak-and-log ref so it can be called from timer callbacks
  const speakAndLogFn = useCallback(
    (text: string, source: 'gesture' | 'phrase' | 'typed') => {
      const trimmed = text.trim();
      if (!trimmed) return;
      speak(trimmed);
      addMessage(trimmed, source);
      incrementMessage(trimmed);
    },
    [speak, addMessage, incrementMessage],
  );
  const speakAndLogRef = useRef(speakAndLogFn);
  useEffect(() => { speakAndLogRef.current = speakAndLogFn; }, [speakAndLogFn]);

  /* ── Camera callbacks ── */
  const handleConfirm = useCallback(
    (gesture: GestureResult) => {
      incrementGesture();

      if (gesture.category === 'command') {
        if (gesture.id === 'five') {
          dispatchSentence({ type: 'space' });
        } else if (gesture.id === 'thumbsup') {
          // Use sentenceRef to avoid stale closure; speak then clear
          if (sentenceRef.current.trim()) {
            speakAndLogRef.current(sentenceRef.current.trim(), 'gesture');
            dispatchSentence({ type: 'clear' });
          }
        } else if (gesture.id === 'thumbsdown') {
          dispatchSentence({ type: 'backspace' });
        } else if (gesture.id === 'clear') {
          dispatchSentence({ type: 'clear' });
        }
      } else {
        dispatchSentence({ type: 'append', char: gesture.label });
      }

      // Auto-speak: reset inactivity timer on every confirmed gesture
      if (autoSpeakTimerRef.current) clearTimeout(autoSpeakTimerRef.current);
      if (autoSpeakRef.current) {
        autoSpeakTimerRef.current = setTimeout(() => {
          const current = sentenceRef.current.trim();
          if (current) {
            speakAndLogRef.current(current, 'gesture');
            dispatchSentence({ type: 'clear' });
          }
        }, 3000);
      }
    },
    [incrementGesture],
  );

  const handleGestureChange = useCallback(
    (gesture: GestureResult | null, progress: number) => {
      setCurrentGesture(gesture);
      setDwellProgress(progress);
    },
    [],
  );

  /* ── Builder actions ── */
  const handleSpeak = useCallback(() => {
    if (sentenceRef.current.trim()) speakAndLogRef.current(sentenceRef.current.trim(), 'gesture');
  }, []);

  const handleClear    = useCallback(() => dispatchSentence({ type: 'clear' }), []);
  const handleBackspace = useCallback(() => dispatchSentence({ type: 'backspace' }), []);
  const handleUndo     = useCallback(() => dispatchSentence({ type: 'undo' }), []);

  /* ── Type to speak ── */
  const typedInputId = `${tabsId}-typed`;
  const handleTypedSpeak = useCallback(() => {
    speakAndLogRef.current(typedInput, 'typed');
    setTypedInput('');
  }, [typedInput]);

  /* ── Quick phrase ── */
  const handlePhrase = useCallback(
    (text: string) => speakAndLogRef.current(text, 'phrase'),
    [],
  );

  /* ── Repeat from log ── */
  const handleRepeat = useCallback((text: string) => speak(text), [speak]);

  /* ── Voice test ── */
  const handleVoiceTest = useCallback(
    () => speak('Hello! GestureTalk is ready. Your voice settings sound great.'),
    [speak],
  );

  /* ── Dwell time change ── */
  const handleDwellChange = useCallback((ms: number) => {
    setDwellMs(ms);
    try { localStorage.setItem('gesturetalk-dwell-ms', String(ms)); } catch { /* ignore */ }
  }, []);

  /* ── Auto-speak toggle ── */
  const handleAutoSpeakToggle = useCallback((enabled: boolean) => {
    setAutoSpeak(enabled);
    try { localStorage.setItem('gesturetalk-autospeak', String(enabled)); } catch { /* ignore */ }
    if (!enabled && autoSpeakTimerRef.current) {
      clearTimeout(autoSpeakTimerRef.current);
    }
  }, []);

  /* ── Font size change ── */
  const handleFontSizeChange = useCallback((size: number) => {
    setFontSize(size);
    try { localStorage.setItem('gesturetalk-fontsize', String(size)); } catch { /* ignore */ }
  }, []);

  /* ── Keyboard shortcuts ── */
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      // Don't intercept when the user is typing in a text input
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement ||
        e.target instanceof HTMLSelectElement
      ) return;

      if (e.key === ' ' && !e.ctrlKey && !e.metaKey) {
        e.preventDefault();
        const cur = sentenceRef.current.trim();
        if (cur && !isSpeaking) speakAndLogRef.current(cur, 'gesture');
      } else if (e.key === 'Backspace' && !e.ctrlKey && !e.metaKey) {
        e.preventDefault();
        dispatchSentence({ type: 'backspace' });
      } else if (e.key === 'Escape') {
        e.preventDefault();
        dispatchSentence({ type: 'clear' });
      } else if (e.key === 'z' && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        dispatchSentence({ type: 'undo' });
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [isSpeaking]);

  // Clean up auto-speak timer on unmount
  useEffect(() => {
    return () => {
      if (autoSpeakTimerRef.current) clearTimeout(autoSpeakTimerRef.current);
    };
  }, []);

  /* ── Tab keyboard navigation (ARIA APG roving tabindex pattern) ── */
  const handleTabKeyDown = useCallback(
    (e: React.KeyboardEvent, currentId: Tab) => {
      const ids = TABS.map((t) => t.id);
      const idx = ids.indexOf(currentId);
      let next: Tab | null = null;
      if (e.key === 'ArrowRight') next = ids[(idx + 1) % ids.length];
      if (e.key === 'ArrowLeft')  next = ids[(idx - 1 + ids.length) % ids.length];
      if (e.key === 'Home') next = ids[0];
      if (e.key === 'End')  next = ids[ids.length - 1];
      if (next) {
        e.preventDefault();
        setActiveTab(next);
        tabRefs.current[next]?.focus();
      }
    },
    [],
  );

  /* ── Derived ── */
  const isDetecting = currentGesture !== null;
  const statusText = isDetecting
    ? `Detecting: ${currentGesture?.label}`
    : isSpeaking
    ? 'Speaking'
    : 'Watching for gestures';

  return (
    <main className="h-screen h-dvh bg-gray-950 text-white flex flex-col overflow-hidden">

      {/* ── Header ── */}
      <header
        className="flex-shrink-0 border-b px-4 py-3 flex items-center justify-between"
        style={{
          background: 'linear-gradient(135deg, #030712 0%, #0c1120 60%, #030f1c 100%)',
          borderBottomColor: 'rgba(6,182,212,0.18)',
        }}
      >
        <div className="flex items-center gap-2.5">
          <span className="text-2xl" aria-hidden="true">🤟</span>
          <div>
            <h1 className="text-base font-bold leading-tight tracking-tight">GestureTalk</h1>
            <p className="text-[10px] text-cyan-700 leading-none mt-0.5 font-medium uppercase tracking-widest">
              Sign Language · Voice · Text
            </p>
          </div>
        </div>

        {/* Speaking / gesture status */}
        <div
          aria-live="polite"
          aria-atomic="true"
          className="flex items-center gap-2 text-xs text-gray-400"
        >
          <span className="sr-only">{statusText}</span>

          {/* Glowing dot */}
          <span
            aria-hidden="true"
            className={`w-2.5 h-2.5 rounded-full flex-shrink-0 transition-colors ${
              isSpeaking
                ? 'bg-emerald-400 animate-pulse speaking-glow'
                : isDetecting
                ? 'bg-cyan-400 animate-pulse status-dot-active'
                : 'bg-gray-600'
            }`}
          />

          <span aria-hidden="true" className="hidden sm:inline">
            {isSpeaking
              ? 'Speaking…'
              : isDetecting
              ? `Detecting: ${currentGesture?.label}`
              : 'Watching…'}
          </span>

          {/* Auto-speak indicator */}
          {autoSpeak && (
            <span
              className="hidden sm:inline text-[10px] bg-violet-900/50 border border-violet-800/60 text-violet-300 px-2 py-0.5 rounded-full"
              aria-label="Auto-speak enabled"
            >
              ⚡ Auto
            </span>
          )}

          {/* Stop speech button (visible only while speaking) */}
          {isSpeaking && (
            <button
              onClick={stop}
              aria-label="Stop speaking"
              className="ml-1 text-[10px] bg-red-900/50 hover:bg-red-800/70 border border-red-800/60 text-red-300 px-2 py-0.5 rounded-full transition-colors min-h-[28px]"
            >
              ■ Stop
            </button>
          )}
        </div>
      </header>

      {/* ── Body ── */}
      <div className="flex-1 flex flex-col md:flex-row overflow-hidden min-h-0">

        {/* Camera panel */}
        <div
          className="w-full md:w-3/5 h-[38vh] sm:h-[45vh] md:h-full flex-shrink-0"
          aria-label="Camera view for gesture detection"
        >
          <CameraView
            onConfirm={handleConfirm}
            onGestureChange={handleGestureChange}
            dwellMs={dwellMs}
          />
        </div>

        {/* Control panel */}
        <div className="flex-1 flex flex-col bg-gray-900 border-t md:border-t-0 md:border-l border-gray-800 overflow-hidden min-h-0">

          {/* Tab list */}
          <div
            role="tablist"
            aria-label="App sections"
            className="flex border-b border-gray-800 flex-shrink-0"
          >
            {TABS.map((tab) => {
              const isActive = activeTab === tab.id;
              const panelId = `${tabsId}-panel-${tab.id}`;
              const tabId   = `${tabsId}-tab-${tab.id}`;
              return (
                <button
                  key={tab.id}
                  id={tabId}
                  ref={(el) => { tabRefs.current[tab.id] = el; }}
                  role="tab"
                  aria-selected={isActive}
                  aria-controls={panelId}
                  tabIndex={isActive ? 0 : -1}
                  onClick={() => setActiveTab(tab.id)}
                  onKeyDown={(e) => handleTabKeyDown(e, tab.id)}
                  className={`flex-1 min-h-[44px] py-1.5 text-[10px] sm:text-xs flex flex-col items-center justify-center gap-0.5 transition-colors ${
                    isActive
                      ? 'text-cyan-400 border-b-2 border-cyan-500 bg-gray-800/40'
                      : 'text-gray-500 hover:text-gray-300'
                  }`}
                >
                  <span aria-hidden="true">{tab.icon}</span>
                  <span>{tab.label}</span>
                  {tab.id === 'log' && messages.length > 0 && (
                    <span
                      aria-label={`${messages.length} messages`}
                      className="text-[9px] bg-cyan-800 text-cyan-200 rounded-full px-1 leading-tight"
                    >
                      {messages.length}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Tab panels */}
          <div className="flex-1 overflow-y-auto min-h-0">
            {TABS.map((tab) => {
              const isActive = activeTab === tab.id;
              const panelId = `${tabsId}-panel-${tab.id}`;
              const tabId   = `${tabsId}-tab-${tab.id}`;
              return (
                <div
                  key={tab.id}
                  id={panelId}
                  role="tabpanel"
                  aria-labelledby={tabId}
                  hidden={!isActive}
                  className="p-4"
                >
                  {/* ── Builder tab ── */}
                  {tab.id === 'builder' && (
                    <div className="flex flex-col gap-5">
                      <SentenceBuilder
                        text={sentence}
                        currentGesture={currentGesture}
                        progress={dwellProgress}
                        isSpeaking={isSpeaking}
                        onSpeak={handleSpeak}
                        onClear={handleClear}
                        onBackspace={handleBackspace}
                        onUndo={handleUndo}
                        canUndo={canUndo}
                        fontSize={fontSize}
                      />

                      {/* Type to speak */}
                      <div className="flex flex-col gap-2">
                        <label
                          htmlFor={typedInputId}
                          className="text-xs uppercase text-gray-500 font-bold"
                        >
                          ⌨️ Type to Speak
                        </label>
                        <div className="flex gap-2">
                          <input
                            id={typedInputId}
                            value={typedInput}
                            onChange={(e) => setTypedInput(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleTypedSpeak()}
                            placeholder="Type anything…"
                            aria-describedby={`${typedInputId}-hint`}
                            className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm outline-none focus:ring-2 focus:ring-cyan-600 placeholder-gray-600"
                          />
                          <button
                            onClick={handleTypedSpeak}
                            disabled={!typedInput.trim() || isSpeaking}
                            aria-label="Speak typed text aloud"
                            className="bg-cyan-700 hover:bg-cyan-600 disabled:bg-gray-700 disabled:cursor-not-allowed min-w-[44px] min-h-[44px] px-4 rounded-lg text-sm font-bold transition-colors"
                          >
                            🔊
                          </button>
                        </div>
                        <p id={`${typedInputId}-hint`} className="text-xs text-gray-600">
                          Press Enter or the speaker button to read aloud · Keyboard shortcuts: Space=Speak, Backspace=Delete, Esc=Clear, Ctrl+Z=Undo
                        </p>
                      </div>

                      {/* Recent messages (preview) */}
                      {messages.length > 0 && (
                        <div>
                          <div className="text-xs uppercase text-gray-500 font-bold mb-2">
                            Recent Messages
                          </div>
                          <ConversationLog
                            messages={messages.slice(-4)}
                            onRepeat={handleRepeat}
                            maxHeight="140px"
                            fontSize={fontSize}
                          />
                        </div>
                      )}
                    </div>
                  )}

                  {/* ── Phrases tab ── */}
                  {tab.id === 'phrases' && (
                    <QuickPhrases
                      onSpeak={handlePhrase}
                      customPhrases={customPhrases}
                      onAddPhrase={addPhrase}
                      onRemovePhrase={removePhrase}
                      currentSentence={sentence}
                    />
                  )}

                  {/* ── Guide tab ── */}
                  {tab.id === 'guide' && <GestureGuide />}

                  {/* ── Log tab ── */}
                  {tab.id === 'log' && (
                    <div className="flex flex-col gap-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs uppercase text-gray-500 font-bold">
                          Conversation History
                        </span>
                        {messages.length > 0 && (
                          <button
                            onClick={clearMessages}
                            aria-label="Clear all conversation history"
                            className="text-xs text-red-500 hover:text-red-400 transition-colors min-h-[44px] px-2"
                          >
                            Clear all
                          </button>
                        )}
                      </div>
                      <ConversationLog
                        messages={messages}
                        onRepeat={handleRepeat}
                        maxHeight="100%"
                        showExport={messages.length > 0}
                        fontSize={fontSize}
                      />
                    </div>
                  )}

                  {/* ── Settings tab ── */}
                  {tab.id === 'settings' && (
                    <div className="flex flex-col gap-6">
                      <VoiceSettings
                        voices={voices}
                        isSpeaking={isSpeaking}
                        onUpdate={updateSettings}
                        onTest={handleVoiceTest}
                      />

                      {/* Dwell time setting */}
                      <div>
                        <h3 className="text-xs uppercase text-gray-500 font-bold mb-3">⏱️ Gesture Sensitivity</h3>
                        <div className="bg-gray-800/60 border border-gray-700/60 rounded-xl p-4 flex flex-col gap-3">
                          <div className="flex justify-between items-center">
                            <label htmlFor={`${tabsId}-dwell`} className="text-xs text-gray-400 font-medium">
                              Hold duration
                            </label>
                            <span className="text-xs text-cyan-400 font-mono">{(dwellMs / 1000).toFixed(1)} s</span>
                          </div>
                          <input
                            id={`${tabsId}-dwell`}
                            type="range"
                            min={500}
                            max={3000}
                            step={100}
                            value={dwellMs}
                            onChange={(e) => handleDwellChange(Number(e.target.value))}
                            aria-label={`Gesture hold duration: ${(dwellMs / 1000).toFixed(1)} seconds`}
                            className="w-full accent-cyan-400"
                          />
                          <div className="flex justify-between text-[10px] text-gray-600">
                            <span>0.5 s (quick)</span><span>1.5 s (default)</span><span>3 s (slow)</span>
                          </div>
                          <p className="text-[11px] text-gray-600 leading-relaxed">
                            How long you must hold a gesture before it is confirmed. Reduce for faster input; increase to avoid accidental triggers.
                          </p>
                        </div>
                      </div>

                      {/* Auto-speak toggle */}
                      <div>
                        <h3 className="text-xs uppercase text-gray-500 font-bold mb-3">⚡ Auto-Speak</h3>
                        <div className="bg-gray-800/60 border border-gray-700/60 rounded-xl p-4 flex flex-col gap-3">
                          <div className="flex items-center justify-between">
                            <span className="text-xs text-gray-400 font-medium">Auto-speak after 3 s of inactivity</span>
                            <button
                              role="switch"
                              aria-checked={autoSpeak}
                              onClick={() => handleAutoSpeakToggle(!autoSpeak)}
                              className={`relative w-11 h-6 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-cyan-500 ${autoSpeak ? 'bg-cyan-600' : 'bg-gray-700'}`}
                              aria-label="Toggle auto-speak mode"
                            >
                              <span
                                className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${autoSpeak ? 'translate-x-5' : 'translate-x-0'}`}
                              />
                            </button>
                          </div>
                          <p className="text-[11px] text-gray-600 leading-relaxed">
                            When enabled, GestureTalk automatically speaks and clears your sentence 3 seconds after your last confirmed gesture.
                          </p>
                        </div>
                      </div>

                      {/* Text size */}
                      <div>
                        <h3 className="text-xs uppercase text-gray-500 font-bold mb-3">🔡 Text Size</h3>
                        <div className="bg-gray-800/60 border border-gray-700/60 rounded-xl p-4 flex flex-col gap-3">
                          <div className="flex justify-between items-center">
                            <label htmlFor={`${tabsId}-fontsize`} className="text-xs text-gray-400 font-medium">
                              Message font size
                            </label>
                            <span className="text-xs text-cyan-400 font-mono">
                              {fontSize === 1 ? 'Normal' : fontSize === 1.25 ? 'Large' : 'X-Large'}
                            </span>
                          </div>
                          <input
                            id={`${tabsId}-fontsize`}
                            type="range"
                            min={1}
                            max={1.5}
                            step={0.25}
                            value={fontSize}
                            onChange={(e) => handleFontSizeChange(Number(e.target.value))}
                            aria-label={`Text size: ${fontSize === 1 ? 'Normal' : fontSize === 1.25 ? 'Large' : 'Extra Large'}`}
                            className="w-full accent-cyan-400"
                          />
                          <div className="flex justify-between text-[10px] text-gray-600">
                            <span>Normal</span><span>Large</span><span>X-Large</span>
                          </div>
                        </div>
                      </div>

                      <StatsPanel stats={stats} />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* First-run onboarding */}
      {showOnboarding && (
        <OnboardingOverlay onDismiss={() => setShowOnboarding(false)} />
      )}
    </main>
  );
}
