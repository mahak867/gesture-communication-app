// components/QuickPhrases.tsx
'use client';

interface Phrase {
  text: string;
  emoji: string;
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
      { text: 'Hello!', emoji: '👋' },
      { text: 'Good morning', emoji: '🌅' },
      { text: 'Goodbye', emoji: '🤝' },
      { text: 'Thank you', emoji: '🙏' },
      { text: 'Please', emoji: '🤲' },
      { text: 'You\'re welcome', emoji: '😊' },
    ],
  },
  {
    name: 'Basic Needs',
    accent: 'hover:bg-cyan-900/30 hover:border-cyan-700',
    phrases: [
      { text: 'I need water', emoji: '💧' },
      { text: 'I am hungry', emoji: '🍽️' },
      { text: 'I need help', emoji: '🆘' },
      { text: 'Where is the bathroom?', emoji: '🚻' },
      { text: 'I am tired', emoji: '😴' },
      { text: 'I need to rest', emoji: '🛌' },
    ],
  },
  {
    name: 'Responses',
    accent: 'hover:bg-violet-900/30 hover:border-violet-700',
    phrases: [
      { text: 'Yes', emoji: '✅' },
      { text: 'No', emoji: '❌' },
      { text: 'I understand', emoji: '👍' },
      { text: 'I don\'t understand', emoji: '🤔' },
      { text: 'Please repeat', emoji: '🔁' },
      { text: 'One moment please', emoji: '⏳' },
    ],
  },
  {
    name: 'Emergency',
    accent: 'hover:bg-red-900/30 hover:border-red-700',
    phrases: [
      { text: 'Call a doctor', emoji: '🏥' },
      { text: 'I am in pain', emoji: '😣' },
      { text: 'Call 911', emoji: '🚨' },
      { text: 'I need medicine', emoji: '💊' },
      { text: 'I am allergic', emoji: '⚠️' },
      { text: 'Help me please', emoji: '🆘' },
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
                className={`bg-gray-800 border border-gray-700 ${cat.accent} rounded-lg p-2.5 flex items-center gap-2 transition-all duration-150 hover:scale-[1.02] active:scale-[0.97] text-left`}
              >
                <span className="text-xl flex-shrink-0" aria-hidden>{p.emoji}</span>
                <span className="text-xs text-white leading-tight">{p.text}</span>
              </button>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
