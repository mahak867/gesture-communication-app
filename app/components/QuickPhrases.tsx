// components/QuickPhrases.tsx
import React from 'react';
import { useSpeech } from '@/hooks/useSpeech';

const phrases = [
  { text: "Hello", icon: "👋" },
  { text: "Thank You", icon: "🙏" },
  { text: "Yes", icon: "✅" },
  { text: "No", icon: "❌" },
  { text: "I need water", icon: "💧" },
  { text: "I need help", icon: "🆘" },
  { text: "I am hungry", icon: "🍕" },
  { text: "Where is the bathroom?", icon: "🚻" },
];

export default function QuickPhrases({ onSpeak }: { onSpeak: (text: string) => void }) {
  const { speak } = useSpeech();

  const handleClick = (text: string) => {
    speak(text);
    onSpeak(text);
  };

  return (
    <div className="grid grid-cols-2 gap-3 w-full">
      {phrases.map((phrase) => (
        <button
          key={phrase.text}
          onClick={() => handleClick(phrase.text)}
          className="bg-slate-800 hover:bg-slate-700 border border-slate-600 rounded-lg p-3 flex items-center gap-2 transition-all duration-200 hover:scale-105 active:scale-95"
        >
          <span className="text-2xl">{phrase.icon}</span>
          <span className="text-sm font-medium text-white">{phrase.text}</span>
        </button>
      ))}
    </div>
  );
}