// components/OnboardingOverlay.tsx
'use client';
import { useState } from 'react';

const SEEN_KEY = 'gesturetalk-onboarding-seen';

const STEPS = [
  {
    icon: '📷',
    title: 'Point your camera at your hand',
    body: 'GestureTalk uses your device camera to detect hand gestures in real time. No video ever leaves your device.',
  },
  {
    icon: '✋',
    title: 'Hold a gesture to confirm',
    body: 'Form a gesture and hold it steady. A ring around your wrist fills up — when it completes, the letter or command is confirmed.',
  },
  {
    icon: '👍',
    title: 'Speak your message',
    body: 'Build words letter-by-letter (A, I, L, Y…), add spaces with an open hand ✋, then give a thumbs-up 👍 to speak the sentence aloud.',
  },
  {
    icon: '💬',
    title: 'Quick phrases & custom phrases',
    body: 'Tap the Phrases tab for instant one-tap messages. Add your own phrases and they\'ll be saved to this device.',
  },
];

interface OnboardingOverlayProps {
  onDismiss: () => void;
}

export default function OnboardingOverlay({ onDismiss }: OnboardingOverlayProps) {
  const [step, setStep] = useState(0);
  const isLast = step === STEPS.length - 1;
  const current = STEPS[step];

  function handleNext() {
    if (isLast) {
      try { localStorage.setItem(SEEN_KEY, '1'); } catch { /* ignore */ }
      onDismiss();
    } else {
      setStep((s) => s + 1);
    }
  }

  function handleSkip() {
    try { localStorage.setItem(SEEN_KEY, '1'); } catch { /* ignore */ }
    onDismiss();
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Welcome to GestureTalk"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm px-4"
    >
      <div className="bg-gray-900 border border-gray-700 rounded-2xl max-w-sm w-full p-6 flex flex-col gap-5 shadow-2xl">
        {/* Header */}
        <div className="flex items-center gap-2">
          <span className="text-2xl" aria-hidden="true">🤟</span>
          <span className="text-sm font-bold text-white">Welcome to GestureTalk</span>
        </div>

        {/* Step indicator */}
        <div className="flex gap-1.5" aria-label={`Step ${step + 1} of ${STEPS.length}`}>
          {STEPS.map((_, i) => (
            <div
              key={i}
              className={`h-1 flex-1 rounded-full transition-colors ${i <= step ? 'bg-cyan-500' : 'bg-gray-700'}`}
            />
          ))}
        </div>

        {/* Step content */}
        <div className="flex flex-col items-center text-center gap-3 py-2">
          <span className="text-5xl" aria-hidden="true">{current.icon}</span>
          <h2 className="text-base font-bold text-white">{current.title}</h2>
          <p className="text-sm text-gray-400 leading-relaxed">{current.body}</p>
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <button
            onClick={handleSkip}
            className="flex-1 text-sm text-gray-500 hover:text-gray-300 min-h-[44px] rounded-xl transition-colors"
          >
            Skip
          </button>
          <button
            onClick={handleNext}
            className="flex-[2] bg-cyan-700 hover:bg-cyan-600 text-white text-sm font-semibold min-h-[44px] rounded-xl transition-colors"
          >
            {isLast ? 'Get Started 🚀' : 'Next →'}
          </button>
        </div>
      </div>
    </div>
  );
}

/** Returns true if the onboarding has NOT been seen yet. */
export function shouldShowOnboarding(): boolean {
  if (typeof window === 'undefined') return false;
  try { return !localStorage.getItem(SEEN_KEY); } catch { return false; }
}
