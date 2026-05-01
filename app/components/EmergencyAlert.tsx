"use client";
import { useState, useEffect, useCallback } from "react";

interface Props {
  onDismiss?: () => void;
}

const EMERGENCY_PHRASES = [
  "EMERGENCY — Please help me NOW",
  "Call 911 immediately",
  "I cannot breathe",
  "I am in severe pain",
  "Please call my family",
  "I need a doctor urgently",
];

export default function EmergencyAlert({ onDismiss }: Props) {
  const [active, setActive] = useState(false);
  const [selectedPhrase, setSelectedPhrase] = useState(EMERGENCY_PHRASES[0]);
  const [countdown, setCountdown] = useState(10);

  const triggerEmergency = useCallback(() => {
    setActive(true);
    setCountdown(10);
    // Haptic feedback
    if (navigator.vibrate) navigator.vibrate([500, 200, 500, 200, 500]);
    // Audio alert
    try {
      const ctx = new AudioContext();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.frequency.value = 880;
      osc.type = "square";
      gain.gain.value = 0.3;
      osc.start();
      setTimeout(() => { osc.stop(); ctx.close(); }, 2000);
    } catch { /* audio not supported */ }
    // Speak the phrase
    if ("speechSynthesis" in window) {
      const utt = new SpeechSynthesisUtterance(selectedPhrase);
      utt.rate = 0.9;
      utt.pitch = 1.2;
      utt.volume = 1;
      speechSynthesis.speak(utt);
    }
  }, [selectedPhrase]);

  useEffect(() => {
    if (!active) return;
    if (countdown <= 0) return;
    const timer = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [active, countdown]);

  const dismiss = () => {
    setActive(false);
    if (navigator.vibrate) navigator.vibrate(100);
    onDismiss?.();
  };

  if (active) {
    return (
      <div className="fixed inset-0 bg-red-600 z-50 flex flex-col items-center justify-center p-6 animate-pulse"
        role="alertdialog" aria-live="assertive" aria-label="Emergency alert active">
        <div className="text-white text-center">
          <div className="text-8xl mb-6">🚨</div>
          <h1 className="text-4xl font-bold mb-4">EMERGENCY</h1>
          <p className="text-2xl mb-8 font-medium">{selectedPhrase}</p>
          <div className="text-6xl font-mono mb-8">{countdown}</div>
          <button
            onClick={dismiss}
            className="bg-white text-red-600 font-bold text-xl px-10 py-4 rounded-2xl touch-manipulation min-h-[60px]"
            aria-label="Dismiss emergency alert"
          >
            DISMISS
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <select
        value={selectedPhrase}
        onChange={(e) => setSelectedPhrase(e.target.value)}
        className="w-full bg-gray-800 text-white border border-gray-600 rounded-lg p-3 text-sm"
        aria-label="Select emergency phrase"
      >
        {EMERGENCY_PHRASES.map((p) => (
          <option key={p} value={p}>{p}</option>
        ))}
      </select>
      <button
        onClick={triggerEmergency}
        className="w-full bg-red-600 hover:bg-red-500 active:bg-red-700 text-white font-bold text-xl py-5 rounded-2xl touch-manipulation min-h-[60px] shadow-lg"
        aria-label="Trigger emergency alert"
      >
        🚨 EMERGENCY
      </button>
    </div>
  );
}
