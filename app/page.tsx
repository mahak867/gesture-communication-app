'use client';
import { useState, useCallback } from 'react';
import CameraView from './components/CameraView';
import SentenceBuilder from './components/SentenceBuilder';
import QuickPhrases from './components/QuickPhrases';
import ConversationLog, { type Message } from './components/ConversationLog';
import GestureGuide from './components/GestureGuide';
import { useSpeech } from './hooks/useSpeech';
import type { GestureResult } from './lib/gestures';

type Tab = 'builder' | 'phrases' | 'guide' | 'log';

const TABS: { id: Tab; label: string; icon: string }[] = [
  { id: 'builder', label: 'Builder', icon: '✏️' },
  { id: 'phrases', label: 'Phrases', icon: '💬' },
  { id: 'guide',   label: 'Guide',   icon: '📖' },
  { id: 'log',     label: 'Log',     icon: '📋' },
];

function makeId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

export default function GestureTalkApp() {
  const { speak } = useSpeech();

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
    },
    [speak, addMessage],
  );

  /* ── Camera callbacks ── */
  const handleConfirm = useCallback(
    (gesture: GestureResult) => {
      if (gesture.category === 'command') {
        if (gesture.id === 'five') {
          // Open hand = SPACE
          setSentence((prev) => (prev.endsWith(' ') ? prev : prev + ' '));
        } else if (gesture.id === 'thumbsup') {
          // Thumbs up = SPEAK
          setSentence((prev) => {
            const trimmed = prev.trim();
            if (trimmed) speakAndLog(trimmed, 'gesture');
            return prev;
          });
        } else if (gesture.id === 'thumbsdown') {
          // Thumbs down = BACKSPACE
          setSentence((prev) => prev.slice(0, -1));
        }
      } else {
        // Letter or number — append to sentence
        setSentence((prev) => prev + gesture.label);
      }
    },
    [speakAndLog],
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

  /* ── Derived ── */
  const isDetecting = currentGesture !== null;

  return (
    <main className="h-screen bg-gray-950 text-white flex flex-col overflow-hidden">

      {/* ── Header ── */}
      <header className="flex-shrink-0 bg-gray-900 border-b border-gray-800 px-4 py-2.5 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <span className="text-2xl" aria-hidden>🤟</span>
          <div>
            <h1 className="text-base font-bold leading-tight">GestureTalk</h1>
            <p className="text-xs text-gray-500">Sign Language → Voice & Text</p>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs text-gray-400">
          <span
            className={`w-2 h-2 rounded-full flex-shrink-0 ${
              isDetecting ? 'bg-cyan-400 animate-pulse' : 'bg-gray-600'
            }`}
          />
          <span>{isDetecting ? `Detecting: ${currentGesture?.label}` : 'Watching…'}</span>
        </div>
      </header>

      {/* ── Body ── */}
      <div className="flex-1 flex flex-col md:flex-row overflow-hidden min-h-0">

        {/* Camera panel (left) */}
        <div className="w-full md:w-3/5 h-[45vh] md:h-full flex-shrink-0">
          <CameraView
            onConfirm={handleConfirm}
            onGestureChange={handleGestureChange}
          />
        </div>

        {/* Control panel (right) */}
        <div className="flex-1 flex flex-col bg-gray-900 border-t md:border-t-0 md:border-l border-gray-800 overflow-hidden min-h-0">

          {/* Tabs */}
          <div className="flex border-b border-gray-800 flex-shrink-0">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 py-2.5 text-xs flex flex-col items-center gap-0.5 transition-colors ${
                  activeTab === tab.id
                    ? 'text-cyan-400 border-b-2 border-cyan-500 bg-gray-800/40'
                    : 'text-gray-500 hover:text-gray-300'
                }`}
              >
                <span aria-hidden>{tab.icon}</span>
                <span>{tab.label}</span>
                {tab.id === 'log' && messages.length > 0 && (
                  <span className="text-[10px] bg-cyan-800 text-cyan-200 rounded-full px-1 leading-tight">
                    {messages.length}
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* Tab content */}
          <div className="flex-1 overflow-y-auto p-4 min-h-0">

            {/* ── Builder tab ── */}
            {activeTab === 'builder' && (
              <div className="flex flex-col gap-5">
                <SentenceBuilder
                  text={sentence}
                  currentGesture={currentGesture}
                  progress={dwellProgress}
                  onSpeak={handleSpeak}
                  onClear={handleClear}
                  onBackspace={handleBackspace}
                />

                {/* Type to speak */}
                <div className="flex flex-col gap-2">
                  <label className="text-xs uppercase text-gray-500 font-bold">
                    ⌨️ Type to Speak
                  </label>
                  <div className="flex gap-2">
                    <input
                      value={typedInput}
                      onChange={(e) => setTypedInput(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleTypedSpeak()}
                      placeholder="Type anything…"
                      className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm outline-none focus:ring-2 focus:ring-cyan-600 placeholder-gray-600"
                    />
                    <button
                      onClick={handleTypedSpeak}
                      disabled={!typedInput.trim()}
                      className="bg-cyan-700 hover:bg-cyan-600 disabled:bg-gray-700 disabled:cursor-not-allowed px-4 py-2 rounded-lg text-sm font-bold transition-colors"
                    >
                      🔊
                    </button>
                  </div>
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
            {activeTab === 'phrases' && (
              <QuickPhrases onSpeak={handlePhrase} />
            )}

            {/* ── Guide tab ── */}
            {activeTab === 'guide' && <GestureGuide />}

            {/* ── Log tab ── */}
            {activeTab === 'log' && (
              <div className="flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs uppercase text-gray-500 font-bold">
                    Conversation History
                  </span>
                  {messages.length > 0 && (
                    <button
                      onClick={() => setMessages([])}
                      className="text-xs text-red-500 hover:text-red-400 transition-colors"
                    >
                      Clear all
                    </button>
                  )}
                </div>
                <ConversationLog messages={messages} onRepeat={handleRepeat} maxHeight="100%" />
              </div>
            )}

          </div>
        </div>
      </div>
    </main>
  );
}
