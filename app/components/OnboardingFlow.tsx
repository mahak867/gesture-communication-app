"use client";
import { useState } from "react";

const STEPS = [
  {
    emoji: "👋",
    title: "Welcome to GestureTalk",
    body: "This app helps you communicate using hand gestures — even if you cannot speak. Everything runs on your device. No data ever leaves your phone.",
    action: "Let's start",
  },
  {
    emoji: "📷",
    title: "Allow camera access",
    body: "GestureTalk needs your camera to see your hand gestures. Your video is processed only on this device — it is never recorded or sent anywhere.",
    action: "I understand",
  },
  {
    emoji: "✋",
    title: "Hold your hand up",
    body: "Show your hand clearly to the camera with good lighting. Keep it steady for about 1.5 seconds and the gesture will be detected. Try making a fist.",
    action: "Got it",
  },
  {
    emoji: "🤖",
    title: "Gemma 4 AI is your helper",
    body: "As you spell words, Gemma AI will suggest complete sentences. Tap any suggestion to use it instantly — it learns what you say most often.",
    action: "Sounds good",
  },
  {
    emoji: "🚨",
    title: "Emergency button",
    body: "The red EMERGENCY button will alert everyone nearby immediately. Use it any time you need urgent help. It also works offline.",
    action: "I found it",
  },
  {
    emoji: "💊",
    title: "Phrase packs",
    body: "Ready-made phrases for pain, medical needs, daily life, and more. Tap any phrase to speak it instantly — no spelling needed.",
    action: "Show me",
  },
  {
    emoji: "🏥",
    title: "You are ready",
    body: "GestureTalk is completely free — forever. Built for people who deserve to be heard. Your caregiver or nurse can also see your messages in the Caregiver Dashboard.",
    action: "Start communicating",
  },
];

interface Props { onComplete: () => void; }

export default function OnboardingFlow({ onComplete }: Props) {
  const [step, setStep] = useState(0);
  const current = STEPS[step];

  const next = () => {
    if (step < STEPS.length - 1) setStep((s) => s + 1);
    else { localStorage.setItem("gesturetalk_onboarded", "true"); onComplete(); }
  };

  return (
    <div className="fixed inset-0 bg-gray-950 z-50 flex flex-col items-center justify-center p-6">
      <div className="max-w-sm w-full text-center space-y-6">
        {/* Progress dots */}
        <div className="flex justify-center gap-2">
          {STEPS.map((_, i) => (
            <div key={i} className={`h-2 rounded-full transition-all ${i === step ? "w-6 bg-blue-500" : i < step ? "w-2 bg-blue-800" : "w-2 bg-gray-700"}`} />
          ))}
        </div>

        <div className="text-6xl">{current.emoji}</div>
        <h2 className="text-2xl font-bold text-white">{current.title}</h2>
        <p className="text-gray-300 leading-relaxed">{current.body}</p>

        <button
          onClick={next}
          className="w-full bg-blue-600 hover:bg-blue-500 text-white font-semibold py-4 rounded-2xl text-lg touch-manipulation min-h-[56px]"
        >
          {current.action}
        </button>

        {step > 0 && (
          <button onClick={onComplete} className="text-gray-500 text-sm underline">
            Skip setup
          </button>
        )}
      </div>
    </div>
  );
}
