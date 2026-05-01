"use client";
import { useState } from "react";

const PAIN_LEVELS = [
  { level: 0, label: "No pain",    emoji: "😊", color: "bg-green-600",  description: "Completely comfortable" },
  { level: 1, label: "Very mild",  emoji: "🙂", color: "bg-green-500",  description: "Hardly noticeable" },
  { level: 2, label: "Mild",       emoji: "😐", color: "bg-lime-500",   description: "Noticeable but manageable" },
  { level: 3, label: "Moderate",   emoji: "😕", color: "bg-yellow-500", description: "Distracting" },
  { level: 4, label: "Moderate",   emoji: "😟", color: "bg-yellow-600", description: "Hard to ignore" },
  { level: 5, label: "Moderate",   emoji: "😣", color: "bg-amber-500",  description: "Affects daily activities" },
  { level: 6, label: "Severe",     emoji: "😫", color: "bg-orange-500", description: "Difficulty concentrating" },
  { level: 7, label: "Severe",     emoji: "😤", color: "bg-orange-600", description: "Interferes with sleep" },
  { level: 8, label: "Very severe",emoji: "😰", color: "bg-red-500",    description: "Hard to do anything" },
  { level: 9, label: "Very severe",emoji: "😭", color: "bg-red-600",    description: "Screaming / crying" },
  { level: 10, label: "Worst",     emoji: "🤯", color: "bg-red-700",    description: "Unbearable — emergency" },
];

interface Props {
  onReport: (text: string) => void;
}

export default function PainScale({ onReport }: Props) {
  const [selected, setSelected] = useState<number | null>(null);
  const [reported, setReported] = useState(false);

  const report = (level: number) => {
    setSelected(level);
    setReported(false);
  };

  const speak = () => {
    if (selected === null) return;
    const p = PAIN_LEVELS[selected];
    const text = `Pain level ${selected} out of 10 — ${p.label}. ${p.description}.`;
    onReport(text);
    if (navigator.vibrate) navigator.vibrate(selected >= 7 ? [200, 100, 200] : [50]);
    if ("speechSynthesis" in window) {
      speechSynthesis.cancel();
      const utt = new SpeechSynthesisUtterance(text);
      utt.rate = 0.9;
      speechSynthesis.speak(utt);
    }
    setReported(true);
  };

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-xs uppercase text-gray-500 font-bold mb-1">🩺 Pain Scale (0–10)</h3>
        <p className="text-xs text-gray-500">Tap your current pain level, then press Report</p>
      </div>

      {/* Scale grid — 2 rows of 6 */}
      <div className="grid grid-cols-6 gap-1.5 sm:gap-2">
        {PAIN_LEVELS.map((p) => (
          <button
            key={p.level}
            onClick={() => report(p.level)}
            className={`flex flex-col items-center justify-center rounded-xl p-1.5 sm:p-2 min-h-[56px] transition-all touch-manipulation border-2 ${
              selected === p.level
                ? `${p.color} border-white scale-105 shadow-lg`
                : `bg-gray-800 border-transparent hover:border-gray-600`
            }`}
            aria-label={`Pain level ${p.level}: ${p.label}`}
            aria-pressed={selected === p.level}
          >
            <span className="text-lg sm:text-xl">{p.emoji}</span>
            <span className={`text-xs font-bold mt-0.5 ${selected === p.level ? "text-white" : "text-gray-300"}`}>
              {p.level}
            </span>
          </button>
        ))}
      </div>

      {/* Selected level detail */}
      {selected !== null && (
        <div className={`rounded-xl p-4 border ${PAIN_LEVELS[selected].color} bg-opacity-20 border-opacity-50 space-y-3`}>
          <div className="flex items-center gap-3">
            <span className="text-4xl">{PAIN_LEVELS[selected].emoji}</span>
            <div>
              <p className="font-bold text-white text-lg">Level {selected} — {PAIN_LEVELS[selected].label}</p>
              <p className="text-gray-300 text-sm">{PAIN_LEVELS[selected].description}</p>
            </div>
          </div>

          <button
            onClick={speak}
            className={`w-full font-bold text-white py-3 rounded-xl min-h-[52px] touch-manipulation transition-colors ${
              reported
                ? "bg-green-700 hover:bg-green-600"
                : "bg-white/10 hover:bg-white/20 border border-white/30"
            }`}
            aria-label={`Report pain level ${selected} aloud`}
          >
            {reported ? "✅ Reported" : `🔊 Report pain level ${selected}`}
          </button>
        </div>
      )}

      {/* Location selector */}
      <div>
        <p className="text-xs text-gray-500 mb-2">Where is the pain? (tap to speak)</p>
        <div className="grid grid-cols-3 gap-2">
          {[
            { label: "Head", emoji: "🧠" },
            { label: "Chest", emoji: "💔" },
            { label: "Stomach", emoji: "🫃" },
            { label: "Back", emoji: "🦴" },
            { label: "Arms", emoji: "💪" },
            { label: "Legs", emoji: "🦵" },
          ].map((loc) => (
            <button
              key={loc.label}
              onClick={() => {
                const text = selected !== null
                  ? `Pain in my ${loc.label.toLowerCase()}, level ${selected}`
                  : `Pain in my ${loc.label.toLowerCase()}`;
                onReport(text);
                if ("speechSynthesis" in window) {
                  speechSynthesis.cancel();
                  speechSynthesis.speak(new SpeechSynthesisUtterance(text));
                }
              }}
              className="flex items-center gap-2 bg-gray-800 hover:bg-gray-700 border border-gray-700 text-white text-xs px-3 min-h-[40px] rounded-lg transition-colors touch-manipulation"
              aria-label={`Pain in ${loc.label}`}
            >
              <span>{loc.emoji}</span> {loc.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
