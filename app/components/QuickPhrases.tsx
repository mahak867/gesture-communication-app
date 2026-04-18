// components/QuickPhrases.tsx
'use client';

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
}

export default function QuickPhrases({ onSpeak }: QuickPhrasesProps) {
  return (
    <div className="flex flex-col gap-5">
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
