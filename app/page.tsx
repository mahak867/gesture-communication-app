'use client';
import { useReducer, useCallback, useRef, useId, useEffect, useState } from 'react';
import CameraView from './components/CameraView';
import SentenceBuilder from './components/SentenceBuilder';
import QuickPhrases from './components/QuickPhrases';
import ConversationLog from './components/ConversationLog';
import GestureGuide from './components/GestureGuide';
import VoiceSettings from './components/VoiceSettings';
import StatsPanel from './components/StatsPanel';
import { shouldShowOnboarding } from './components/OnboardingOverlay';
import EmergencyAlert from './components/EmergencyAlert';
import PhrasePacks from './components/PhrasePacks';
import GemmaStatusBadge from './components/GemmaStatusBadge';
import OnboardingFlow from './components/OnboardingFlow';
import { useSpeech } from './hooks/useSpeech';
import { useStats } from './hooks/useStats';
import { useCustomPhrases } from './hooks/useCustomPhrases';
import { useConversationLog } from './hooks/useConversationLog';
import { useAnalytics } from './hooks/useAnalytics';
import { useHaptics } from './hooks/useHaptics';
import { useHighContrast } from './hooks/useHighContrast';
import { useOneHanded } from './hooks/useOneHanded';
import { useProfiles } from './hooks/useProfiles';
import PainScale from './components/PainScale';
import ConversationExport from './components/ConversationExport';
import ProfileSelector from './components/ProfileSelector';
import SLPMode from './components/SLPMode';
import GestureTrainer from './components/GestureTrainer';
import OnDeviceBadge from './components/OnDeviceBadge';
import SOAPNote from './components/SOAPNote';
import EmotionDetector from './components/EmotionDetector';
import FunctionCallingDemo from './components/FunctionCallingDemo';
import ModelPipeline from './components/ModelPipeline';
import { usePipeline } from './hooks/usePipeline';
import { isDemoMode } from './lib/demoMode';
import { useTremorCompensation } from './hooks/useTremorCompensation';
import YesNoBar from './components/aac/YesNoBar';
import SymbolGrid from './components/aac/SymbolGrid';
import CoreVocabulary from './components/aac/CoreVocabulary';
import FatigueMode from './components/aac/FatigueMode';
import type { GestureResult } from './lib/gestures';
import { sentenceReducer } from './lib/sentenceReducer';

type Tab = 'builder' | 'phrases' | 'emergency' | 'guide' | 'log' | 'pipeline' | 'settings';

const TABS: { id: Tab; label: string; icon: string }[] = [
  { id: 'builder',   label: 'Build',     icon: '✏️' },
  { id: 'phrases',   label: 'Phrases',   icon: '💬' },
  { id: 'emergency', label: 'Emergency', icon: '🚨' },
  { id: 'pipeline',  label: 'AI',        icon: '🤖' },
  { id: 'guide',     label: 'Guide',     icon: '📖' },
  { id: 'log',       label: 'Log',       icon: '📋' },
  { id: 'settings',  label: 'Settings',  icon: '⚙️' },
];

export default function GestureTalkApp() {
  const { speak, stop, voices, isSpeaking, updateSettings } = useSpeech();
  const { stats, incrementGesture, incrementMessage } = useStats();
  const { phrases: customPhrases, addPhrase, removePhrase, clearPhrases, storageWarning: phraseStorageWarning, dismissStorageWarning: dismissPhraseWarning } = useCustomPhrases();
  const { messages, addMessage, clearMessages, storageWarning: logStorageWarning, dismissStorageWarning: dismissLogWarning } = useConversationLog();
  const { track } = useAnalytics();
  const { haptic } = useHaptics();
  const { highContrast, toggleHighContrast } = useHighContrast();
  const { oneHandedMode, setOneHandedMode } = useOneHanded();
  const { profiles, activeProfile, activeId: activeProfileId, switchProfile, addProfile, removeProfile } = useProfiles();
  const { state: pipeline, run: runPipeline, reset: resetPipeline } = usePipeline();
  const [targetLang, setTargetLang] = useState<string>(() =>
    typeof window !== 'undefined' ? (localStorage.getItem('gesturetalk-lang') ?? 'en') : 'en'
  );
  // Frame capture ref — updated by CameraView
  const lastFrameRef = useRef<string | null>(null);
  const [demoActive] = useState<boolean>(() => typeof window !== 'undefined' && isDemoMode());
  // Latest hand landmarks ref — updated by CameraView on every frame, used by GestureTrainer
  const latestLandmarksRef = useRef<number[][] | null>(null);
  const [confidenceThreshold, setConfidenceThreshold] = useState(() => {
    if (typeof window === 'undefined') return 75;
    return Number(localStorage.getItem('gesturetalk-confidence') ?? 75);
  });
  // Sync confidence to localStorage
  useEffect(() => {
    localStorage.setItem('gesturetalk-confidence', String(confidenceThreshold));
  }, [confidenceThreshold]);
  const { smooth: tremorSmooth } = useTremorCompensation(true);
  const [fatigueModeActive, setFatigueModeActive] = useState(false);
  const [aacSubTab, setAacSubTab] = useState<'phrases'|'symbols'|'core'|'custom'>('phrases');
  const tabsId = useId();

  // Sentence builder with undo history
  const [sentenceState, dispatchSentence] = useReducer(sentenceReducer, {
    current: '',
    history: [],
  });
  const sentence = sentenceState.current;
  const canUndo = sentenceState.history.length > 0;

  // Onboarding: shown once on first visit — use new 7-step flow
  const [showOnboarding, setShowOnboarding] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    return !localStorage.getItem('gesturetalk_onboarded') && shouldShowOnboarding();
  });

  // Gemma context for word prediction
  const [gemmaContext, setGemmaContext] = useState<'medical' | 'daily' | 'emergency' | 'general'>('medical');

  // Manual type-to-speak input
  const [typedInput, setTypedInput] = useState('');
  // Active right-panel tab
  const [activeTab, setActiveTab] = useState<Tab>('builder');
  // Currently detected gesture + dwell progress
  const [currentGesture, setCurrentGesture] = useState<GestureResult | null>(null);
  const [dwellProgress, setDwellProgress] = useState(0);

  // Confirmation states for destructive actions
  const [confirmClearLog, setConfirmClearLog] = useState(false);
  const [confirmClearAll, setConfirmClearAll] = useState(false);

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
    builder: null, phrases: null, emergency: null, pipeline: null, guide: null, log: null, settings: null,
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
      track('message_spoken', { source, words: trimmed.split(' ').length });
    },
    [speak, addMessage, incrementMessage, track],
  );
  const speakAndLogRef = useRef(speakAndLogFn);
  useEffect(() => { speakAndLogRef.current = speakAndLogFn; }, [speakAndLogFn]);

  /* ── Camera callbacks ── */
  const handleConfirm = useCallback(
    (gesture: GestureResult) => {
      incrementGesture();
      track('gesture_detected', { id: gesture.id, label: gesture.label, category: gesture.category });
      haptic('confirm');

      // Run the full multi-modal pipeline
      runPipeline({
        landmarkGesture: gesture.label,
        landmarkMs: 0,
        frameBase64: lastFrameRef.current,
        partialSentence: sentence,
        context: gemmaContext,
        targetLang,
        onComplete: (finalGesture, completions) => {
          dispatchSentence({ type: 'append', char: finalGesture });
          // Show pipeline completions in state
          if (completions.length > 0) {
            // completions are surfaced via pipeline.state.completions
          }
        },
      });

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
    [incrementGesture, track, runPipeline, sentence, gemmaContext, targetLang, haptic],
  );

  const handleGestureChange = useCallback(
    (gesture: GestureResult | null, progress: number) => {
      setCurrentGesture(gesture);
      setDwellProgress(progress);
    },
    [],
  );

  const handleLandmarksUpdate = useCallback(
    (landmarks: number[][]) => {
      latestLandmarksRef.current = landmarks;
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

  /* ── Clear all app data ── */
  const handleClearAllData = useCallback(() => {
    clearMessages();
    clearPhrases();
    setDwellMs(1500);
    setAutoSpeak(false);
    setFontSize(1);
    try {
      ['gesturetalk-dwell-ms', 'gesturetalk-autospeak', 'gesturetalk-fontsize',
        'gesturetalk-voice-settings'].forEach((k) => localStorage.removeItem(k));
    } catch { /* ignore */ }
    setConfirmClearAll(false);
    // Reload so voice settings component also resets to defaults
    window.location.reload();
  }, [clearMessages, clearPhrases]);

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

      {/* Demo mode banner */}
      {(demoActive || pipeline.isDemo) && (
        <div className="flex-shrink-0 bg-amber-500 text-black text-xs font-bold text-center py-1.5 px-4 flex items-center justify-center gap-2" role="status" aria-live="polite">
          <span>🎬</span>
          <span>DEMO MODE — Pre-recorded Gemma 4 responses (Ollama offline)</span>
          <a href="?demo=1" className="underline opacity-70 ml-2">force demo</a>
        </div>
      )}

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

          {/* Gemma status badge — shown on medium+ screens */}
          <span className="hidden md:block">
            <GemmaStatusBadge />
          </span>

          {/* On-device guarantee badge */}
          <span className="hidden lg:block">
            <OnDeviceBadge />
          </span>

          {/* Caregiver link */}
          <a
            href="/caregiver"
            className="hidden sm:flex items-center gap-1 text-[10px] bg-blue-900/40 border border-blue-800/50 text-blue-300 px-2 py-0.5 rounded-full hover:bg-blue-800/60 transition-colors"
            aria-label="Open caregiver dashboard"
            title="Caregiver Dashboard"
          >
            👩‍⚕️ Caregiver
          </a>

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
            onLandmarksUpdate={handleLandmarksUpdate}
            onFrame={(b64) => { lastFrameRef.current = b64; }}
            tremorSmooth={tremorSmooth}
            dwellMs={dwellMs}
          />
          {/* Gemma 4 face emotion — compact badge below camera */}
          <div className="px-2 pb-2">
            <EmotionDetector
              frameRef={lastFrameRef}
              compact
              onEmotionChange={(emotion, painLevel) => {
                if (painLevel >= 7) track('high_pain_detected', { painLevel, emotion });
              }}
            />
          </div>
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

                      {/* Multi-modal pipeline status (compact) */}
                      {pipeline.isRunning && (
                        <div className="space-y-2">
                          <p className="text-xs text-gray-500 font-bold uppercase">⚡ Pipeline Running</p>
                          <ModelPipeline stages={pipeline.stages} compact />
                        </div>
                      )}

                      {/* Gemma 4 completions from pipeline */}
                      {(pipeline.completions.length > 0 || pipeline.streamingCompletions) && !pipeline.isRunning && (
                        <div>
                          <div className="text-xs uppercase text-gray-500 font-bold mb-2">
                            🤖 Gemma 4 Suggestions
                            {pipeline.visionDescription && (
                              <span className="normal-case text-gray-600 ml-2 font-normal">
                                · vision: {pipeline.visionDescription}
                              </span>
                            )}
                          </div>
                          <div className="flex flex-col gap-2">
                            {(pipeline.completions.length > 0
                              ? pipeline.completions
                              : pipeline.streamingCompletions.split('|').map(s => s.trim()).filter(Boolean)
                            ).map((completion, i) => (
                              <button
                                key={i}
                                onClick={() => {
                                  speakAndLogFn(completion, 'typed');
                                  dispatchSentence({ type: 'clear' });
                                  track('gemma_completion_used', { completion });
                                }}
                                className="text-left bg-gray-800/70 hover:bg-gray-700 border border-gray-700/60 hover:border-cyan-700/60 text-white text-sm px-4 py-3 rounded-xl transition-colors min-h-[48px] touch-manipulation"
                                aria-label={`Use suggestion: ${completion}`}
                              >
                                <span className="text-cyan-400 mr-2 text-xs font-bold">{i + 1}</span>
                                {completion}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Streaming indicator */}
                      {pipeline.isRunning && pipeline.streamingCompletions && (
                        <div className="bg-gray-800/40 border border-gray-700/40 rounded-xl p-3">
                          <p className="text-xs text-gray-500 mb-1">Gemma typing…</p>
                          <p className="text-gray-300 text-sm">{pipeline.streamingCompletions}</p>
                        </div>
                      )}

                      {/* Translation badge */}
                      {pipeline.translation && (
                        <div className="flex items-center gap-2 bg-blue-900/20 border border-blue-700/30 rounded-lg px-3 py-2">
                          <span className="text-blue-400 text-xs">🌐</span>
                          <span className="text-blue-300 text-sm">{pipeline.translation}</span>
                        </div>
                      )}

                      {/* Context selector for pipeline */}
                      <div className="flex gap-2 flex-wrap">
                        {(['medical', 'daily', 'emergency', 'general'] as const).map((ctx) => (
                          <button
                            key={ctx}
                            onClick={() => setGemmaContext(ctx)}
                            className={`px-3 py-1.5 rounded-full text-xs font-medium capitalize transition-colors ${
                              gemmaContext === ctx
                                ? 'bg-cyan-700 text-white'
                                : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                            }`}
                            aria-pressed={gemmaContext === ctx}
                            aria-label={`Set context to ${ctx}`}
                          >
                            {ctx === 'medical' ? '🏥' : ctx === 'daily' ? '🌅' : ctx === 'emergency' ? '🚨' : '💬'} {ctx}
                          </button>
                        ))}
                      </div>

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

                  {/* ── Emergency tab ── */}
                  {tab.id === 'emergency' && (
                    <div className="flex flex-col gap-4">
                      <div className="text-xs uppercase text-gray-500 font-bold">🚨 Emergency Alert</div>
                      <EmergencyAlert onDismiss={() => track('emergency_triggered', { dismissed: true })} />

                      {/* Pain scale */}
                      <div className="border-t border-gray-800 pt-4">
                        <PainScale onReport={(text) => speakAndLogFn(text, 'phrase')} />
                      </div>

                      <div className="border-t border-gray-800 pt-4">
                        <div className="text-xs uppercase text-gray-500 font-bold mb-3">🆘 Emergency Phrases</div>
                        <div className="grid grid-cols-1 gap-2">
                          {[
                            { text: 'HELP ME NOW — EMERGENCY', emoji: '🆘' },
                            { text: 'I cannot breathe', emoji: '😮‍💨' },
                            { text: 'I am in severe pain', emoji: '😰' },
                            { text: 'Call my family now', emoji: '👨‍👩‍👧' },
                            { text: 'I need a doctor urgently', emoji: '👨‍⚕️' },
                            { text: 'Please call 112', emoji: '📞' },
                          ].map((p) => (
                            <button
                              key={p.text}
                              onClick={() => speakAndLogFn(p.text, 'phrase')}
                              className="flex items-center gap-3 w-full bg-red-950 hover:bg-red-900 border border-red-800 text-white text-sm font-semibold px-4 min-h-[52px] rounded-xl transition-colors touch-manipulation"
                              aria-label={p.text}
                            >
                              <span className="text-xl">{p.emoji}</span>
                              <span>{p.text}</span>
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* ── Phrases tab ── */}
                  {tab.id === 'phrases' && (
                    <div className="flex flex-col gap-3">
                      {/* Always-visible YES/NO bar */}
                      <YesNoBar onSpeak={(t) => speakAndLogFn(t, 'phrase')} />

                      {/* AAC sub-tab selector */}
                      <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-hide">
                        {([
                          { id: 'phrases', label: '🗂️ Packs' },
                          { id: 'symbols', label: '🎨 Symbols' },
                          { id: 'core',    label: '🔤 Core' },
                          { id: 'custom',  label: '⭐ Custom' },
                        ] as const).map(st => (
                          <button key={st.id} onClick={() => setAacSubTab(st.id)}
                            aria-pressed={aacSubTab === st.id}
                            className={`flex-shrink-0 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${aacSubTab === st.id ? 'bg-white text-black' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'}`}>
                            {st.label}
                          </button>
                        ))}
                        <button onClick={() => setFatigueModeActive(true)}
                          className="flex-shrink-0 px-3 py-1.5 rounded-lg text-xs font-medium bg-red-900/40 border border-red-800/50 text-red-300 hover:bg-red-800/50 transition-colors">
                          😴 Fatigue
                        </button>
                      </div>

                      {aacSubTab === 'phrases' && <PhrasePacks onSelect={(text) => speakAndLogFn(text, 'phrase')} />}
                      {aacSubTab === 'symbols' && <SymbolGrid onSpeak={(t) => speakAndLogFn(t, 'phrase')} />}
                      {aacSubTab === 'core'    && <CoreVocabulary onSpeak={(t) => speakAndLogFn(t, 'phrase')} />}
                      {aacSubTab === 'custom'  && (
                        <QuickPhrases
                          onSpeak={handlePhrase}
                          customPhrases={customPhrases}
                          onAddPhrase={addPhrase}
                          onRemovePhrase={removePhrase}
                          currentSentence={sentence}
                        />
                      )}
                    </div>
                  )}

                  {/* Fatigue mode — full screen overlay */}
                  {fatigueModeActive && (
                    <div className="fixed inset-0 z-50 bg-gray-950">
                      <FatigueMode
                        onSpeak={(t) => speakAndLogFn(t, 'phrase')}
                        onExit={() => setFatigueModeActive(false)}
                      />
                    </div>
                  )}

                  {/* ── Guide tab ── */}
                  {/* ── AI Pipeline tab ── */}
                  {tab.id === 'pipeline' && (
                    <div className="flex flex-col gap-4">
                      <ModelPipeline
                        stages={pipeline.stages}
                        lastGesture={pipeline.visionGesture ?? undefined}
                        visionDescription={pipeline.visionDescription ?? undefined}
                        emotionTag={pipeline.emotionTag}
                        streamingText={pipeline.streamingCompletions}
                        translation={pipeline.translation}
                        translationLang={pipeline.translationLang}
                      />

                      {/* Translation language selector */}
                      <div className="space-y-2">
                        <p className="text-xs text-gray-500 font-bold uppercase">🌐 Output Language</p>
                        <div className="grid grid-cols-3 gap-2">
                          {[
                            { code: 'en', label: 'English', flag: '🇬🇧' },
                            { code: 'hi', label: 'Hindi', flag: '🇮🇳' },
                            { code: 'ta', label: 'Tamil', flag: '🇮🇳' },
                            { code: 'te', label: 'Telugu', flag: '🇮🇳' },
                            { code: 'bn', label: 'Bengali', flag: '🇮🇳' },
                            { code: 'mr', label: 'Marathi', flag: '🇮🇳' },
                          ].map(lang => (
                            <button
                              key={lang.code}
                              onClick={() => {
                                setTargetLang(lang.code);
                                localStorage.setItem('gesturetalk-lang', lang.code);
                              }}
                              aria-pressed={targetLang === lang.code}
                              className={`flex items-center gap-2 px-3 py-2.5 rounded-xl text-xs font-medium transition-colors min-h-[44px] ${
                                targetLang === lang.code
                                  ? 'bg-cyan-700 text-white border border-cyan-500'
                                  : 'bg-gray-800 text-gray-400 hover:bg-gray-700 border border-gray-700'
                              }`}
                            >
                              <span>{lang.flag}</span>
                              <span>{lang.label}</span>
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Live translation output */}
                      {pipeline.translation && (
                        <div className="bg-blue-900/30 border border-blue-700/50 rounded-xl p-4 space-y-2">
                          <p className="text-xs text-blue-400 font-bold uppercase">Gemma Translation</p>
                          <p className="text-white text-lg font-medium">{pipeline.translation}</p>
                          <button
                            onClick={() => {
                              if ('speechSynthesis' in window) {
                                speechSynthesis.cancel();
                                const utt = new SpeechSynthesisUtterance(pipeline.translation!);
                                speechSynthesis.speak(utt);
                              }
                            }}
                            className="text-xs text-blue-400 hover:text-blue-300"
                          >
                            🔊 Speak translation
                          </button>
                        </div>
                      )}

                      {/* Emotion / empathy */}
                      {pipeline.emotionTag && pipeline.emotionTag !== 'neutral' && (
                        <div className="bg-amber-900/30 border border-amber-700/50 rounded-xl p-4 space-y-2">
                          <p className="text-xs text-amber-400 font-bold uppercase">😟 Emotion Detected: {pipeline.emotionTag}</p>
                          {pipeline.emotionEmpathy && (
                            <div>
                              <p className="text-xs text-gray-400 mb-1">Suggested nurse response:</p>
                              <p className="text-white font-medium text-sm">&quot;{pipeline.emotionEmpathy}&quot;</p>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Last pipeline timing */}
                      {pipeline.lastTotalMs !== null && (
                        <p className="text-xs text-gray-600 text-center">
                          Last full pipeline: {pipeline.lastTotalMs}ms total
                        </p>
                      )}

                      {/* ── Demo trigger panel — works without Ollama ── */}
                      <div className="bg-amber-900/20 border border-amber-700/40 rounded-xl p-4 space-y-3">
                        <div className="flex items-center gap-2">
                          <span className="text-amber-400 text-sm">🎬</span>
                          <p className="text-xs text-amber-400 font-bold uppercase">Try the pipeline — no Ollama needed</p>
                        </div>
                        <p className="text-xs text-gray-400 leading-relaxed">
                          Tap any gesture to fire all 6 pipeline stages with pre-recorded Gemma 4 responses.
                          Realistic latency simulation. Works 100% offline.
                        </p>
                        <div className="grid grid-cols-3 gap-2">
                          {[
                            { id: 'pain',    label: 'Pain',    emoji: '🩺' },
                            { id: 'help',    label: 'Help',    emoji: '🆘' },
                            { id: 'water',   label: 'Water',   emoji: '💧' },
                            { id: 'doctor',  label: 'Doctor',  emoji: '👨‍⚕️' },
                            { id: 'breathe', label: 'Breathe', emoji: '😮‍💨' },
                            { id: 'family',  label: 'Family',  emoji: '👨‍👩‍👧' },
                          ].map((g) => (
                            <button
                              key={g.id}
                              disabled={pipeline.isRunning}
                              onClick={() => runPipeline({
                                landmarkGesture: g.id,
                                landmarkMs: 12,
                                frameBase64: null,
                                partialSentence: '',
                                context: 'medical',
                                targetLang: targetLang,
                                onComplete: (finalGesture, completions) => {
                                  if (completions[0]) speakAndLogFn(completions[0], 'phrase');
                                  dispatchSentence({ type: 'append', char: finalGesture });
                                },
                              })}
                              className="flex flex-col items-center gap-1 bg-gray-800 hover:bg-amber-900/30 disabled:opacity-40 disabled:cursor-not-allowed border border-gray-700 hover:border-amber-700/60 text-white text-xs py-3 rounded-xl transition-colors touch-manipulation min-h-[60px]"
                              aria-label={`Demo ${g.label} gesture through full AI pipeline`}
                            >
                              <span className="text-xl">{g.emoji}</span>
                              <span className="font-medium">{g.label}</span>
                            </button>
                          ))}
                        </div>
                        {pipeline.isRunning && (
                          <p className="text-xs text-amber-400/70 text-center animate-pulse">
                            ⚡ Pipeline running…
                          </p>
                        )}
                      </div>

                      {/* Gemma 4 Function Calling */}
                      <div className="border-t border-gray-800 pt-4">
                        <FunctionCallingDemo />
                      </div>

                      {/* Gemma 4 Face Emotion (full version) */}
                      <div className="border-t border-gray-800 pt-4">
                        <h3 className="text-xs font-bold uppercase text-gray-500 mb-3">😟 Gemma 4 Emotion Detection</h3>
                        <EmotionDetector
                          frameRef={lastFrameRef}
                          onEmotionChange={(emotion, painLevel) => {
                            if (painLevel >= 7) track('high_pain_detected', { painLevel, emotion });
                          }}
                        />
                      </div>

                      {/* SOAP Note generator */}
                      <div className="border-t border-gray-800 pt-4">
                        <SOAPNote messages={messages} patientName={activeProfile?.name} />
                      </div>

                      <button
                        onClick={resetPipeline}
                        className="text-xs text-gray-500 hover:text-gray-300 self-center py-2"
                      >
                        Reset pipeline
                      </button>
                    </div>
                  )}

                  {tab.id === 'guide' && <GestureGuide />}

                  {/* ── Log tab ── */}
                  {tab.id === 'log' && (
                    <div className="flex flex-col gap-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs uppercase text-gray-500 font-bold">
                          Conversation History
                        </span>
                        {messages.length > 0 && !confirmClearLog && (
                          <button
                            onClick={() => setConfirmClearLog(true)}
                            aria-label="Clear all conversation history"
                            className="text-xs text-red-500 hover:text-red-400 transition-colors min-h-[44px] px-2"
                          >
                            Clear all
                          </button>
                        )}
                        {confirmClearLog && (
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-gray-400">Clear history?</span>
                            <button
                              onClick={() => { clearMessages(); setConfirmClearLog(false); }}
                              aria-label="Confirm clear all history"
                              className="text-xs text-red-400 hover:text-red-300 font-semibold min-h-[36px] px-2 transition-colors"
                            >
                              Yes, clear
                            </button>
                            <button
                              onClick={() => setConfirmClearLog(false)}
                              aria-label="Cancel clear"
                              className="text-xs text-gray-500 hover:text-gray-300 min-h-[36px] px-2 transition-colors"
                            >
                              Cancel
                            </button>
                          </div>
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

                      {/* Confidence threshold */}
                      <div>
                        <h3 className="text-xs uppercase text-gray-500 font-bold mb-3">🎯 Gesture Confidence Threshold</h3>
                        <div className="bg-gray-800/60 border border-gray-700/60 rounded-xl p-4 flex flex-col gap-3">
                          <div className="flex justify-between items-center">
                            <label htmlFor={`${tabsId}-confidence`} className="text-xs text-gray-400 font-medium">
                              Minimum confidence
                            </label>
                            <span className="text-xs text-cyan-400 font-mono">{confidenceThreshold}%</span>
                          </div>
                          <input
                            id={`${tabsId}-confidence`}
                            type="range" min={50} max={99} step={1}
                            value={confidenceThreshold}
                            onChange={(e) => setConfidenceThreshold(Number(e.target.value))}
                            className="w-full accent-cyan-400"
                            aria-label={`Confidence threshold: ${confidenceThreshold}%`}
                          />
                          <div className="flex justify-between text-[10px] text-gray-600">
                            <span>50% (permissive)</span><span>75% (default)</span><span>99% (strict)</span>
                          </div>
                          <p className="text-[11px] text-gray-600">Higher = fewer false positives but needs clearer gestures.</p>
                        </div>
                      </div>

                      {/* High contrast mode */}
                      <div>
                        <h3 className="text-xs uppercase text-gray-500 font-bold mb-3">🎨 Accessibility</h3>
                        <div className="bg-gray-800/60 border border-gray-700/60 rounded-xl p-4 space-y-3">
                          <div className="flex items-center justify-between">
                            <span className="text-xs text-gray-400 font-medium">High contrast mode (WCAG 2.1 AA)</span>
                            <button
                              role="switch"
                              aria-checked={highContrast}
                              onClick={toggleHighContrast}
                              className={`relative w-11 h-6 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-cyan-500 ${highContrast ? 'bg-yellow-500' : 'bg-gray-700'}`}
                              aria-label="Toggle high contrast mode"
                            >
                              <span className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${highContrast ? 'translate-x-5' : 'translate-x-0'}`} />
                            </button>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-xs text-gray-400 font-medium">One-handed mode</span>
                            <div className="flex gap-1">
                              {(['off', 'left', 'right'] as const).map(side => (
                                <button
                                  key={side}
                                  onClick={() => setOneHandedMode(side)}
                                  aria-pressed={oneHandedMode === side}
                                  className={`px-2 py-1 text-xs rounded-lg transition-colors ${oneHandedMode === side ? 'bg-cyan-700 text-white' : 'bg-gray-700 text-gray-400'}`}
                                >
                                  {side === 'off' ? 'Off' : side === 'left' ? '◀ L' : 'R ▶'}
                                </button>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Profiles */}
                      <div>
                        <h3 className="text-xs uppercase text-gray-500 font-bold mb-3">👤 Patient Profiles</h3>
                        <ProfileSelector
                          profiles={profiles}
                          activeId={activeProfileId}
                          onSwitch={switchProfile}
                          onAdd={addProfile}
                          onRemove={removeProfile}
                        />
                      </div>

                      {/* SLP Mode */}
                      <div>
                        <h3 className="text-xs uppercase text-gray-500 font-bold mb-3">👩‍⚕️ SLP Configuration</h3>
                        <SLPMode />
                      </div>

                      {/* Gesture trainer */}
                      <div>
                        <h3 className="text-xs uppercase text-gray-500 font-bold mb-3">🎯 Personalised Gesture Training</h3>
                        <GestureTrainer captureFrame={() => latestLandmarksRef.current} />
                      </div>

                      {/* Export conversation */}
                      <div>
                        <h3 className="text-xs uppercase text-gray-500 font-bold mb-3">📤 Export Conversation</h3>
                        <ConversationExport messages={messages} />
                        <div className="mt-4">
                          <SOAPNote messages={messages} patientName={activeProfile?.name} />
                        </div>
                      </div>

                      {/* Links */}
                      <div className="flex flex-wrap gap-2">
                        <a href="/caregiver" className="text-xs text-cyan-400 underline">Caregiver Dashboard</a>
                        <span className="text-gray-700">·</span>
                        <a href="/analytics" className="text-xs text-cyan-400 underline">Analytics</a>
                        <span className="text-gray-700">·</span>
                        <a href="/privacy" className="text-xs text-cyan-400 underline">Privacy Policy</a>
                        <span className="text-gray-700">·</span>
                        <a href="/waitlist" className="text-xs text-cyan-400 underline">Waitlist</a>
                      </div>

                      {/* Data & Storage */}
                      <div>
                        <h3 className="text-xs uppercase text-gray-500 font-bold mb-3">💾 Data &amp; Storage</h3>
                        <div className="bg-gray-800/60 border border-gray-700/60 rounded-xl p-4 flex flex-col gap-3">
                          <p className="text-[11px] text-gray-500 leading-relaxed">
                            All data is stored locally on this device only — nothing is sent to any server.
                            Conversation history (last 50 messages) and custom phrases are saved in your browser&apos;s localStorage.
                          </p>
                          <div className="flex flex-col gap-2">
                            <button
                              onClick={() => { clearMessages(); setConfirmClearAll(false); }}
                              aria-label="Clear conversation history"
                              className="flex items-center gap-2 text-sm text-left text-gray-300 hover:text-white bg-gray-800 hover:bg-gray-700 border border-gray-700 rounded-lg px-3 min-h-[44px] transition-colors"
                            >
                              <span aria-hidden="true">🗑️</span>
                              Clear conversation history
                            </button>
                            <button
                              onClick={clearPhrases}
                              aria-label="Clear all custom phrases"
                              className="flex items-center gap-2 text-sm text-left text-gray-300 hover:text-white bg-gray-800 hover:bg-gray-700 border border-gray-700 rounded-lg px-3 min-h-[44px] transition-colors"
                            >
                              <span aria-hidden="true">💬</span>
                              Clear custom phrases
                            </button>
                            {!confirmClearAll ? (
                              <button
                                onClick={() => setConfirmClearAll(true)}
                                aria-label="Clear all app data and reset settings"
                                className="flex items-center gap-2 text-sm text-left text-red-400 hover:text-red-300 bg-gray-800 hover:bg-red-950/40 border border-gray-700 hover:border-red-800/60 rounded-lg px-3 min-h-[44px] transition-colors"
                              >
                                <span aria-hidden="true">⚠️</span>
                                Clear all data &amp; reset settings…
                              </button>
                            ) : (
                              <div className="flex flex-col gap-2 bg-red-950/30 border border-red-800/50 rounded-lg p-3">
                                <p className="text-xs text-red-300 leading-relaxed">
                                  This will delete all conversation history, custom phrases, and reset all settings to defaults. The page will reload. This cannot be undone.
                                </p>
                                <div className="flex gap-2">
                                  <button
                                    onClick={handleClearAllData}
                                    aria-label="Confirm clear all data"
                                    className="flex-1 bg-red-700 hover:bg-red-600 text-white text-sm font-semibold min-h-[44px] rounded-lg transition-colors"
                                  >
                                    Yes, clear everything
                                  </button>
                                  <button
                                    onClick={() => setConfirmClearAll(false)}
                                    aria-label="Cancel"
                                    className="flex-1 bg-gray-700 hover:bg-gray-600 text-white text-sm min-h-[44px] rounded-lg transition-colors"
                                  >
                                    Cancel
                                  </button>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* First-run onboarding — new 7-step flow */}
      {showOnboarding && (
        <OnboardingFlow onComplete={() => { setShowOnboarding(false); track('session_start', {}); }} />
      )}

      {/* Storage quota warning toast */}
      {(logStorageWarning || phraseStorageWarning) && (
        <div
          role="alert"
          aria-live="assertive"
          className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 flex items-start gap-3 bg-amber-900/95 border border-amber-700/70 text-amber-100 text-xs rounded-xl px-4 py-3 shadow-xl max-w-sm w-[calc(100%-2rem)]"
        >
          <span className="text-base flex-shrink-0 mt-0.5" aria-hidden="true">⚠️</span>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-amber-200">Storage quota reached</p>
            <p className="mt-0.5 text-amber-300/80 leading-relaxed">
              Some data could not be saved to this device. Clear conversation history or custom phrases in
              Settings → Data &amp; Storage to free up space.
            </p>
          </div>
          <button
            onClick={() => { dismissLogWarning(); dismissPhraseWarning(); }}
            aria-label="Dismiss storage warning"
            className="flex-shrink-0 text-amber-400 hover:text-amber-200 text-lg leading-none transition-colors -mt-0.5 ml-1"
          >
            ×
          </button>
        </div>
      )}
    </main>
  );
}
