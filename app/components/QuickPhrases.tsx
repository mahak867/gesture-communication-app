// components/QuickPhrases.tsx
'use client';
import { useState, useId } from 'react';
import type { CustomPhrase } from '../hooks/useCustomPhrases';

interface Phrase {
  text: string;
  emoji: string;
  emojiLabel: string;
}

interface Category {
  name: string;
  accent: string;
  phrases: Phrase[];
}

const CATEGORIES: Category[] = [
  {
    name: 'Greetings',
    accent: 'hover:bg-blue-900/30 hover:border-blue-700',
    phrases: [
      { text: 'Hello!',           emoji: '👋', emojiLabel: 'waving hand' },
      { text: 'Good morning',     emoji: '🌅', emojiLabel: 'sunrise' },
      { text: 'Goodbye',          emoji: '🤝', emojiLabel: 'handshake' },
      { text: 'Thank you',        emoji: '🙏', emojiLabel: 'folded hands' },
      { text: 'Please',           emoji: '🤲', emojiLabel: 'open hands' },
      { text: "You're welcome",   emoji: '😊', emojiLabel: 'smile' },
    ],
  },
  {
    name: 'Basic Needs',
    accent: 'hover:bg-cyan-900/30 hover:border-cyan-700',
    phrases: [
      { text: 'I need water',           emoji: '💧', emojiLabel: 'water droplet' },
      { text: 'I am hungry',            emoji: '🍽️', emojiLabel: 'plate' },
      { text: 'I need help',            emoji: '🆘', emojiLabel: 'SOS' },
      { text: 'Where is the bathroom?', emoji: '🚻', emojiLabel: 'restroom' },
      { text: 'I am tired',             emoji: '😴', emojiLabel: 'sleeping face' },
      { text: 'I need to rest',         emoji: '🛌', emojiLabel: 'person in bed' },
    ],
  },
  {
    name: 'Responses',
    accent: 'hover:bg-violet-900/30 hover:border-violet-700',
    phrases: [
      { text: 'Yes',                emoji: '✅', emojiLabel: 'check mark' },
      { text: 'No',                 emoji: '❌', emojiLabel: 'cross mark' },
      { text: 'I understand',       emoji: '👍', emojiLabel: 'thumbs up' },
      { text: "I don't understand", emoji: '🤔', emojiLabel: 'thinking face' },
      { text: 'Please repeat',      emoji: '🔁', emojiLabel: 'repeat' },
      { text: 'One moment please',  emoji: '⏳', emojiLabel: 'hourglass' },
    ],
  },
  {
    name: 'Emergency',
    accent: 'hover:bg-red-900/30 hover:border-red-700',
    phrases: [
      { text: 'Call a doctor',   emoji: '🏥', emojiLabel: 'hospital' },
      { text: 'I am in pain',    emoji: '😣', emojiLabel: 'persevering face' },
      { text: 'Call 911',        emoji: '🚨', emojiLabel: 'emergency light' },
      { text: 'I need medicine', emoji: '💊', emojiLabel: 'pill' },
      { text: 'I am allergic',   emoji: '⚠️', emojiLabel: 'warning' },
      { text: 'Help me please',  emoji: '🆘', emojiLabel: 'SOS' },
    ],
  },
];

interface QuickPhrasesProps {
  onSpeak: (text: string) => void;
  customPhrases: CustomPhrase[];
  onAddPhrase: (text: string, emoji: string) => void;
  onRemovePhrase: (id: string) => void;
}

export default function QuickPhrases({
  onSpeak,
  customPhrases,
  onAddPhrase,
  onRemovePhrase,
}: QuickPhrasesProps) {
  const inputId = useId();
  const [inputText, setInputText] = useState('');
  const [showForm, setShowForm] = useState(false);

  function handleAdd() {
    const trimmed = inputText.trim();
    if (!trimmed) return;
    onAddPhrase(trimmed, '⭐');
    setInputText('');
    setShowForm(false);
  }

  return (
    <div className="flex flex-col gap-5">

      {/* ── My Phrases (custom) ── */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-xs uppercase text-gray-500 font-bold">⭐ My Phrases</h3>
          <button
            onClick={() => setShowForm((v) => !v)}
            aria-expanded={showForm}
            aria-label={showForm ? 'Cancel adding phrase' : 'Add a custom phrase'}
            className="text-xs text-cyan-400 hover:text-cyan-300 transition-colors min-h-[36px] px-2"
          >
            {showForm ? '✕ Cancel' : '＋ Add'}
          </button>
        </div>

        {showForm && (
          <div className="flex gap-2 mb-3">
            <input
              id={inputId}
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
              placeholder="Enter your phrase…"
              aria-label="New custom phrase text"
              className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm outline-none focus:ring-2 focus:ring-cyan-600 placeholder-gray-600"
            />
            <button
              onClick={handleAdd}
              disabled={!inputText.trim()}
              aria-label="Save custom phrase"
              className="bg-cyan-700 hover:bg-cyan-600 disabled:bg-gray-700 disabled:cursor-not-allowed text-white text-sm px-3 rounded-lg min-h-[44px] transition-colors"
            >
              Save
            </button>
          </div>
        )}

        {customPhrases.length === 0 ? (
          <p className="text-xs text-gray-600 italic py-2">
            No custom phrases yet — tap ＋ Add to create one.
          </p>
        ) : (
          <div className="grid grid-cols-2 gap-2">
            {customPhrases.map((p) => (
              <div key={p.id} className="relative group">
                <button
                  onClick={() => onSpeak(p.text)}
                  aria-label={`Say: ${p.text}`}
                  className="w-full bg-gray-800 border border-gray-700 hover:bg-amber-900/20 hover:border-amber-700 rounded-xl min-h-[52px] px-2.5 py-2 flex items-center gap-2 transition-all duration-150 hover:scale-[1.02] active:scale-[0.97] text-left"
                >
                  <span className="text-xl flex-shrink-0" aria-hidden="true">{p.emoji}</span>
                  <span className="text-sm text-white leading-tight truncate">{p.text}</span>
                </button>
                <button
                  onClick={() => onRemovePhrase(p.id)}
                  aria-label={`Remove phrase: ${p.text}`}
                  className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-800 hover:bg-red-700 text-white rounded-full text-[10px] items-center justify-center hidden group-hover:flex group-focus-within:flex transition-colors"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Built-in phrase categories ── */}
      {CATEGORIES.map((cat) => (
        <div key={cat.name}>
          <h3 className="text-xs uppercase text-gray-500 font-bold mb-2">{cat.name}</h3>
          <div className="grid grid-cols-2 gap-2">
            {cat.phrases.map((p) => (
              <button
                key={p.text}
                onClick={() => onSpeak(p.text)}
                aria-label={`Say: ${p.text}`}
                className={`bg-gray-800 border border-gray-700 ${cat.accent} rounded-xl min-h-[52px] px-2.5 py-2 flex items-center gap-2 transition-all duration-150 hover:scale-[1.02] active:scale-[0.97] text-left w-full`}
              >
                <span className="text-xl flex-shrink-0" aria-hidden="true">{p.emoji}</span>
                <span className="text-sm text-white leading-tight">{p.text}</span>
              </button>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
