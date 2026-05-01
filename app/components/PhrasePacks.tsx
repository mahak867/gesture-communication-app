"use client";
import { useState, useMemo } from "react";

interface Phrase { text: string; emoji: string; urgent?: boolean; }
interface Pack { name: string; emoji: string; color: string; phrases: Phrase[]; }

const PACKS: Pack[] = [
  {
    name: "Emergency", emoji: "🚨", color: "bg-red-900 border-red-500",
    phrases: [
      { text: "Help me now", emoji: "🆘", urgent: true },
      { text: "Call 112", emoji: "📞", urgent: true },
      { text: "I cannot breathe", emoji: "😮‍💨", urgent: true },
      { text: "Call my family", emoji: "👨‍👩‍👧", urgent: true },
      { text: "I am falling", emoji: "⚠️", urgent: true },
      { text: "Get the nurse", emoji: "👩‍⚕️", urgent: true },
      { text: "I need a doctor now", emoji: "🏥", urgent: true },
      { text: "I am having a seizure", emoji: "🚑", urgent: true },
    ],
  },
  {
    name: "Pain", emoji: "🩺", color: "bg-orange-900 border-orange-500",
    phrases: [
      { text: "Pain level 10 — severe", emoji: "😰" },
      { text: "Pain level 7 — bad", emoji: "😣" },
      { text: "Pain level 5 — moderate", emoji: "😖" },
      { text: "Pain level 2 — mild", emoji: "🙁" },
      { text: "My head hurts", emoji: "🤕" },
      { text: "My chest hurts", emoji: "💔" },
      { text: "My stomach hurts", emoji: "🤢" },
      { text: "My back is hurting", emoji: "🦴" },
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
      { text: "Please open the window", emoji: "🪟" },
      { text: "I need a blanket", emoji: "🛋️" },
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
      { text: "I have diabetes", emoji: "📋" },
      { text: "Please call my caregiver", emoji: "📲" },
      { text: "I need a blood pressure check", emoji: "🩺" },
      { text: "My wound is bleeding", emoji: "🩸" },
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
      { text: "Please repeat that", emoji: "🔄" },
      { text: "Yes", emoji: "✅" },
      { text: "No", emoji: "❌" },
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
      { text: "Bhookh lagi hai — I am hungry", emoji: "🍽️" },
      { text: "Thanda lag raha hai — I am cold", emoji: "🥶" },
    ],
  },
  {
    name: "BSL / British", emoji: "🇬🇧", color: "bg-indigo-900 border-indigo-500",
    phrases: [
      { text: "Can you help me please", emoji: "🙋" },
      { text: "I need assistance", emoji: "🆘" },
      { text: "Where is the nurse", emoji: "👩‍⚕️" },
      { text: "Please call 999", emoji: "📞", urgent: true },
      { text: "I am in hospital", emoji: "🏥" },
      { text: "I cannot speak", emoji: "🤐" },
      { text: "Please be patient with me", emoji: "⏳" },
      { text: "I use sign language", emoji: "🤟" },
    ],
  },
];

interface Props {
  onSelect: (text: string) => void;
}

export default function PhrasePacks({ onSelect }: Props) {
  const [activePack, setActivePack] = useState(0);
  const [search, setSearch] = useState("");

  // Search across ALL packs when query entered
  const searchResults = useMemo(() => {
    if (!search.trim()) return null;
    const q = search.toLowerCase();
    const results: (Phrase & { packName: string })[] = [];
    for (const pack of PACKS) {
      for (const phrase of pack.phrases) {
        if (phrase.text.toLowerCase().includes(q)) {
          results.push({ ...phrase, packName: pack.name });
        }
      }
    }
    return results;
  }, [search]);

  const speak = (text: string) => {
    onSelect(text);
    if (navigator.vibrate) navigator.vibrate(50);
    if ("speechSynthesis" in window) {
      speechSynthesis.cancel();
      const utt = new SpeechSynthesisUtterance(text);
      speechSynthesis.speak(utt);
    }
  };

  return (
    <div className="space-y-3">
      {/* Search bar */}
      <div className="relative">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">🔍</span>
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search all phrases…"
          className="w-full bg-gray-800 border border-gray-700 text-white rounded-xl pl-9 pr-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-cyan-600 placeholder-gray-500"
          aria-label="Search phrases"
        />
        {search && (
          <button
            onClick={() => setSearch("")}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white text-lg"
            aria-label="Clear search"
          >×</button>
        )}
      </div>

      {/* Search results */}
      {searchResults !== null ? (
        <div className="space-y-2">
          {searchResults.length === 0 ? (
            <p className="text-center text-gray-500 text-sm py-4">No phrases match &quot;{search}&quot;</p>
          ) : (
            <>
              <p className="text-xs text-gray-500">{searchResults.length} result{searchResults.length !== 1 ? "s" : ""}</p>
              <div className="grid grid-cols-2 gap-2">
                {searchResults.map((phrase) => (
                  <button
                    key={phrase.text}
                    onClick={() => speak(phrase.text)}
                    className={`text-left p-3 rounded-lg text-sm transition-colors touch-manipulation min-h-[56px] ${
                      phrase.urgent
                        ? "bg-red-600 hover:bg-red-500 text-white font-bold"
                        : "bg-gray-800 hover:bg-gray-700 text-white"
                    }`}
                    aria-label={phrase.text}
                  >
                    <span className="text-base mr-1">{phrase.emoji}</span>
                    <span className="leading-snug text-xs text-gray-400"> {phrase.packName}</span>
                    <div className="leading-snug">{phrase.text}</div>
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      ) : (
        <>
          {/* Pack tabs — scrollable */}
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
            {PACKS.map((pack, i) => (
              <button
                key={pack.name}
                onClick={() => setActivePack(i)}
                className={`flex-shrink-0 px-3 py-2 rounded-lg text-xs font-medium transition-colors touch-manipulation ${
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
                  onClick={() => speak(phrase.text)}
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
        </>
      )}
    </div>
  );
}
