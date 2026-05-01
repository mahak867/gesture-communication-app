"use client";
import { useState } from "react";

interface Phrase { text: string; emoji: string; urgent?: boolean; }
interface Pack { name: string; emoji: string; color: string; phrases: Phrase[]; }

const PACKS: Pack[] = [
  {
    name: "Emergency", emoji: "🚨", color: "bg-red-900 border-red-500",
    phrases: [
      { text: "Help me now", emoji: "🆘", urgent: true },
      { text: "Call 911", emoji: "📞", urgent: true },
      { text: "I cannot breathe", emoji: "😮‍💨", urgent: true },
      { text: "Call my family", emoji: "👨‍👩‍👧", urgent: true },
      { text: "I am falling", emoji: "⚠️", urgent: true },
      { text: "Get the nurse", emoji: "👩‍⚕️", urgent: true },
    ],
  },
  {
    name: "Pain", emoji: "🩺", color: "bg-orange-900 border-orange-500",
    phrases: [
      { text: "Pain level 10 — severe", emoji: "😰" },
      { text: "Pain level 5 — moderate", emoji: "😣" },
      { text: "My head hurts", emoji: "🤕" },
      { text: "My chest hurts", emoji: "💔" },
      { text: "My stomach hurts", emoji: "🤢" },
      { text: "I need pain medication", emoji: "💊" },
      { text: "The pain is getting worse", emoji: "📈" },
      { text: "The pain is better now", emoji: "📉" },
    ],
  },
  {
    name: "Daily Needs", emoji: "🌅", color: "bg-blue-900 border-blue-500",
    phrases: [
      { text: "I am thirsty", emoji: "💧" },
      { text: "I am hungry", emoji: "🍽️" },
      { text: "I need to use the bathroom", emoji: "🚻" },
      { text: "I am cold", emoji: "🥶" },
      { text: "I am hot", emoji: "🥵" },
      { text: "I cannot sleep", emoji: "😴" },
      { text: "Please adjust my pillow", emoji: "🛏️" },
      { text: "Turn the light off please", emoji: "💡" },
      { text: "I want to sit up", emoji: "🪑" },
      { text: "I am tired", emoji: "😫" },
    ],
  },
  {
    name: "Medical", emoji: "🏥", color: "bg-green-900 border-green-500",
    phrases: [
      { text: "I need my medication", emoji: "💊" },
      { text: "Please check my IV", emoji: "💉" },
      { text: "I feel dizzy", emoji: "😵" },
      { text: "I feel nauseous", emoji: "🤢" },
      { text: "I want to speak to a doctor", emoji: "👨‍⚕️" },
      { text: "I have an allergy", emoji: "⚠️" },
      { text: "This is my blood type", emoji: "🩸" },
      { text: "I have diabetes", emoji: "📋" },
      { text: "Please call my caregiver", emoji: "📲" },
    ],
  },
  {
    name: "Emotions", emoji: "💭", color: "bg-purple-900 border-purple-500",
    phrases: [
      { text: "I am scared", emoji: "😨" },
      { text: "I am anxious", emoji: "😰" },
      { text: "I am frustrated", emoji: "😤" },
      { text: "I am happy", emoji: "😊" },
      { text: "I am sad", emoji: "😢" },
      { text: "I feel lonely", emoji: "💔" },
      { text: "Thank you so much", emoji: "🙏" },
      { text: "I love you", emoji: "❤️" },
      { text: "I understand", emoji: "👍" },
      { text: "I do not understand", emoji: "❓" },
    ],
  },
  {
    name: "ISL / Indian", emoji: "🇮🇳", color: "bg-yellow-900 border-yellow-500",
    phrases: [
      { text: "Paani chahiye — I need water", emoji: "💧" },
      { text: "Dard ho raha hai — I am in pain", emoji: "🩺" },
      { text: "Doctor ko bulao — Call the doctor", emoji: "👨‍⚕️" },
      { text: "Ghar jaana hai — I want to go home", emoji: "🏠" },
      { text: "Maa ko bulao — Call my mother", emoji: "👩" },
      { text: "Theek hoon — I am okay", emoji: "✅" },
      { text: "Madad karo — Please help", emoji: "🆘" },
      { text: "Dawai chahiye — I need medicine", emoji: "💊" },
    ],
  },
];

interface Props {
  onSelect: (text: string) => void;
}

export default function PhrasePacks({ onSelect }: Props) {
  const [activePack, setActivePack] = useState(0);

  return (
    <div className="space-y-3">
      {/* Pack tabs */}
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
        {PACKS.map((pack, i) => (
          <button
            key={pack.name}
            onClick={() => setActivePack(i)}
            className={`flex-shrink-0 px-3 py-2 rounded-lg text-sm font-medium transition-colors touch-manipulation ${
              activePack === i ? "bg-white text-black" : "bg-gray-800 text-gray-300 hover:bg-gray-700"
            }`}
            aria-label={`${pack.name} phrases`}
            aria-pressed={activePack === i}
          >
            {pack.emoji} {pack.name}
          </button>
        ))}
      </div>

      {/* Phrase grid */}
      <div className={`border rounded-xl p-3 ${PACKS[activePack].color}`}>
        <div className="grid grid-cols-2 gap-2">
          {PACKS[activePack].phrases.map((phrase) => (
            <button
              key={phrase.text}
              onClick={() => {
                onSelect(phrase.text);
                if (navigator.vibrate) navigator.vibrate(50);
                if ("speechSynthesis" in window) {
                  speechSynthesis.cancel();
                  const utt = new SpeechSynthesisUtterance(phrase.text);
                  speechSynthesis.speak(utt);
                }
              }}
              className={`text-left p-3 rounded-lg text-sm transition-colors touch-manipulation min-h-[56px] ${
                phrase.urgent
                  ? "bg-red-600 hover:bg-red-500 text-white font-bold"
                  : "bg-gray-800 hover:bg-gray-700 text-white"
              }`}
              aria-label={phrase.text}
            >
              <span className="text-lg mr-2">{phrase.emoji}</span>
              <span className="leading-snug">{phrase.text}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
