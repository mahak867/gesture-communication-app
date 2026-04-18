'use client';
import { useState, useCallback, useRef, useId } from 'react';
import CameraView from './components/CameraView';
import SentenceBuilder from './components/SentenceBuilder';
import QuickPhrases from './components/QuickPhrases';
import ConversationLog, { type Message } from './components/ConversationLog';
import GestureGuide from './components/GestureGuide';
import VoiceSettings from './components/VoiceSettings';
import StatsPanel from './components/StatsPanel';
import { useSpeech } from './hooks/useSpeech';
import { useStats } from './hooks/useStats';
import { useCustomPhrases } from './hooks/useCustomPhrases';
import type { GestureResult } from './lib/gestures';

type Tab = 'builder' | 'phrases' | 'guide' | 'log' | 'settings';

const TABS: { id: Tab; label: string; icon: string }[] = [
  { id: 'builder',  label: 'Build',    icon: '✏️' },
  { id: 'phrases',  label: 'Phrases',  icon: '💬' },
  { id: 'guide',    label: 'Guide',    icon: '📖' },
  { id: 'log',      label: 'Log',      icon: '📋' },
  { id: 'settings', label: 'Settings', icon: '⚙️' },
];

function makeId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

export default function GestureTalkApp() {
  const { speak, stop, voices, isSpeaking, updateSettings } = useSpeech();
  const { stats, incrementGesture, incrementMessage } = useStats();
  const { phrases: customPhrases, addPhrase, removePhrase } = useCustomPhrases();
  const tabsId = useId();

  // Sentence being built letter-by-letter via gestures
  const [sentence, setSentence] = useState('');
  // Manual type-to-speak input
  const [typedInput, setTypedInput] = useState('');
  // Conversation history (capped at 50)
  const [messages, setMessages] = useState<Message[]>([]);
  // Active right-panel tab
  const [activeTab, setActiveTab] = useState<Tab>('builder');
  // Currently detected gesture + dwell progress
  const [currentGesture, setCurrentGesture] = useState<GestureResult | null>(null);
  const [dwellProgress, setDwellProgress] = useState(0);

  // Refs for tab buttons (keyboard arrow-key navigation)
  const tabRefs = useRef<Record<Tab, HTMLButtonElement | null>>({
    builder: null, phrases: null, guide: null, log: null, settings: null,
  });

  /* ── Helpers ── */
  const addMessage = useCallback(
    (text: string, source: Message['source']) => {
      setMessages((prev) => [
        ...prev.slice(-49),
        { id: makeId(), text, source, timestamp: new Date() },
      ]);
    },
    [],
  );

  const speakAndLog = useCallback(
    (text: string, source: Message['source']) => {
      const trimmed = text.trim();
      if (!trimmed) return;
      speak(trimmed);
      addMessage(trimmed, source);
      incrementMessage(trimmed);
    },
    [speak, addMessage, incrementMessage],
  );

  /* ── Camera callbacks ── */
  const handleConfirm = useCallback(
    (gesture: GestureResult) => {
      incrementGesture();
      if (gesture.category === 'command') {
        if (gesture.id === 'five') {
          setSentence((prev) => (prev.endsWith(' ') ? prev : prev + ' '));
        } else if (gesture.id === 'thumbsup') {
          setSentence((prev) => {
            const trimmed = prev.trim();
            if (trimmed) speakAndLog(trimmed, 'gesture');
            return prev;
          });
        } else if (gesture.id === 'thumbsdown') {
          setSentence((prev) => prev.slice(0, -1));
        } else if (gesture.id === 'clear') {
          setSentence('');
        }
      } else {
        setSentence((prev) => prev + gesture.label);
      }
    },
    [speakAndLog, incrementGesture],
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
    speakAndLog(sentence, 'gesture');
  }, [sentence, speakAndLog]);

  const handleClear = useCallback(() => setSentence(''), []);
  const handleBackspace = useCallback(
    () => setSentence((prev) => prev.slice(0, -1)),
    [],
  );

  /* ── Type to speak ── */
  const typedInputId = `${tabsId}-typed`;
  const handleTypedSpeak = useCallback(() => {
    speakAndLog(typedInput, 'typed');
    setTypedInput('');
  }, [typedInput, speakAndLog]);

  /* ── Quick phrase ── */
  const handlePhrase = useCallback(
    (text: string) => speakAndLog(text, 'phrase'),
    [speakAndLog],
  );

  /* ── Repeat from log ── */
  const handleRepeat = useCallback((text: string) => speak(text), [speak]);

  /* ── Voice test ── */
  const handleVoiceTest = useCallback(
    () => speak('Hello! GestureTalk is ready. Your voice settings sound great.'),
    [speak],
  );

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
                          Press Enter or the speaker button to read aloud
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
                            onClick={() => setMessages([])}
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
                      <StatsPanel stats={stats} />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </main>
  );
}
