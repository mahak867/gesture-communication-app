// components/QuickPhrases.tsx
'use client';
import { useState, useId, useCallback } from 'react';
import type { CustomPhrase } from '../hooks/useCustomPhrases';

// ── Types ─────────────────────────────────────────────────────────────────────
interface Phrase {
  text: string;
  emoji: string;
  emojiLabel: string;
}

interface Category {
  name: string;
  accent: string;
  isEmergency?: boolean;
  phrases: Phrase[];
}

type LangCode = 'en' | 'es' | 'fr';

// ── Phrase data ───────────────────────────────────────────────────────────────
const CATEGORIES_BY_LANG: Record<LangCode, Category[]> = {
  en: [
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
      isEmergency: true,
      phrases: [
        { text: 'Call a doctor',   emoji: '🏥', emojiLabel: 'hospital' },
        { text: 'I am in pain',    emoji: '😣', emojiLabel: 'persevering face' },
        { text: 'Call 911',        emoji: '🚨', emojiLabel: 'emergency light' },
        { text: 'I need medicine', emoji: '💊', emojiLabel: 'pill' },
        { text: 'I am allergic',   emoji: '⚠️', emojiLabel: 'warning' },
        { text: 'Help me please',  emoji: '🆘', emojiLabel: 'SOS' },
      ],
    },
  ],

  es: [
    {
      name: 'Saludos',
      accent: 'hover:bg-blue-900/30 hover:border-blue-700',
      phrases: [
        { text: '¡Hola!',           emoji: '👋', emojiLabel: 'mano saludando' },
        { text: 'Buenos días',      emoji: '🌅', emojiLabel: 'amanecer' },
        { text: 'Adiós',            emoji: '🤝', emojiLabel: 'apretón de manos' },
        { text: 'Gracias',          emoji: '🙏', emojiLabel: 'manos juntas' },
        { text: 'Por favor',        emoji: '🤲', emojiLabel: 'manos abiertas' },
        { text: 'De nada',          emoji: '😊', emojiLabel: 'sonrisa' },
      ],
    },
    {
      name: 'Necesidades básicas',
      accent: 'hover:bg-cyan-900/30 hover:border-cyan-700',
      phrases: [
        { text: 'Necesito agua',             emoji: '💧', emojiLabel: 'gota de agua' },
        { text: 'Tengo hambre',              emoji: '🍽️', emojiLabel: 'plato' },
        { text: 'Necesito ayuda',            emoji: '🆘', emojiLabel: 'SOS' },
        { text: '¿Dónde está el baño?',     emoji: '🚻', emojiLabel: 'baño' },
        { text: 'Estoy cansado',             emoji: '😴', emojiLabel: 'cara dormida' },
        { text: 'Necesito descansar',        emoji: '🛌', emojiLabel: 'persona en cama' },
      ],
    },
    {
      name: 'Respuestas',
      accent: 'hover:bg-violet-900/30 hover:border-violet-700',
      phrases: [
        { text: 'Sí',                    emoji: '✅', emojiLabel: 'marca de verificación' },
        { text: 'No',                    emoji: '❌', emojiLabel: 'cruz' },
        { text: 'Entiendo',              emoji: '👍', emojiLabel: 'pulgar arriba' },
        { text: 'No entiendo',           emoji: '🤔', emojiLabel: 'cara pensativa' },
        { text: 'Repita por favor',      emoji: '🔁', emojiLabel: 'repetir' },
        { text: 'Un momento por favor',  emoji: '⏳', emojiLabel: 'reloj de arena' },
      ],
    },
    {
      name: 'Emergencia',
      accent: 'hover:bg-red-900/30 hover:border-red-700',
      isEmergency: true,
      phrases: [
        { text: 'Llame a un médico',   emoji: '🏥', emojiLabel: 'hospital' },
        { text: 'Tengo dolor',         emoji: '😣', emojiLabel: 'cara de dolor' },
        { text: 'Llame al 911',        emoji: '🚨', emojiLabel: 'luz de emergencia' },
        { text: 'Necesito medicamento', emoji: '💊', emojiLabel: 'pastilla' },
        { text: 'Soy alérgico',        emoji: '⚠️', emojiLabel: 'advertencia' },
        { text: 'Ayúdeme por favor',   emoji: '🆘', emojiLabel: 'SOS' },
      ],
    },
  ],

  fr: [
    {
      name: 'Salutations',
      accent: 'hover:bg-blue-900/30 hover:border-blue-700',
      phrases: [
        { text: 'Bonjour !',         emoji: '👋', emojiLabel: 'main qui salue' },
        { text: 'Bonjour (matin)',   emoji: '🌅', emojiLabel: 'lever du soleil' },
        { text: 'Au revoir',         emoji: '🤝', emojiLabel: 'poignée de main' },
        { text: 'Merci',             emoji: '🙏', emojiLabel: 'mains jointes' },
        { text: "S'il vous plaît",   emoji: '🤲', emojiLabel: 'mains ouvertes' },
        { text: 'De rien',           emoji: '😊', emojiLabel: 'sourire' },
      ],
    },
    {
      name: 'Besoins de base',
      accent: 'hover:bg-cyan-900/30 hover:border-cyan-700',
      phrases: [
        { text: "J'ai besoin d'eau",              emoji: '💧', emojiLabel: "goutte d'eau" },
        { text: "J'ai faim",                      emoji: '🍽️', emojiLabel: 'assiette' },
        { text: "J'ai besoin d'aide",             emoji: '🆘', emojiLabel: 'SOS' },
        { text: 'Où sont les toilettes ?',        emoji: '🚻', emojiLabel: 'toilettes' },
        { text: 'Je suis fatigué',                emoji: '😴', emojiLabel: 'visage endormi' },
        { text: "J'ai besoin de me reposer",      emoji: '🛌', emojiLabel: 'personne au lit' },
      ],
    },
    {
      name: 'Réponses',
      accent: 'hover:bg-violet-900/30 hover:border-violet-700',
      phrases: [
        { text: 'Oui',                       emoji: '✅', emojiLabel: 'coche' },
        { text: 'Non',                       emoji: '❌', emojiLabel: 'croix' },
        { text: 'Je comprends',              emoji: '👍', emojiLabel: 'pouce levé' },
        { text: 'Je ne comprends pas',       emoji: '🤔', emojiLabel: 'visage pensif' },
        { text: "Répétez s'il vous plaît",   emoji: '🔁', emojiLabel: 'répéter' },
        { text: 'Un moment',                 emoji: '⏳', emojiLabel: 'sablier' },
      ],
    },
    {
      name: 'Urgence',
      accent: 'hover:bg-red-900/30 hover:border-red-700',
      isEmergency: true,
      phrases: [
        { text: 'Appelez un médecin',       emoji: '🏥', emojiLabel: 'hôpital' },
        { text: "J'ai mal",                 emoji: '😣', emojiLabel: 'visage souffrant' },
        { text: 'Appelez le 15',            emoji: '🚨', emojiLabel: "lumière d'urgence" },
        { text: 'J\'ai besoin de médicaments', emoji: '💊', emojiLabel: 'pilule' },
        { text: 'Je suis allergique',       emoji: '⚠️', emojiLabel: 'avertissement' },
        { text: 'Aidez-moi',               emoji: '🆘', emojiLabel: 'SOS' },
      ],
    },
  ],
};

const LANG_LABELS: Record<LangCode, string> = { en: '🇬🇧 EN', es: '🇪🇸 ES', fr: '🇫🇷 FR' };

// ── Emergency share helper ────────────────────────────────────────────────────
function shareEmergency(text: string) {
  if (typeof navigator === 'undefined') return;
  if (navigator.share) {
    navigator.share({ title: 'Emergency', text }).catch(() => { /* user cancelled */ });
  } else {
    // Fallback: open SMS compose on mobile; desktop will open default mail client or SMS app
    const encoded = encodeURIComponent(text);
    window.open(`sms:?body=${encoded}`, '_self');
  }
}

// ── Component ─────────────────────────────────────────────────────────────────
interface QuickPhrasesProps {
  onSpeak: (text: string) => void;
  customPhrases: CustomPhrase[];
  onAddPhrase: (text: string, emoji: string) => void;
  onRemovePhrase: (id: string) => void;
  /** Current sentence text — used in emergency share button. */
  currentSentence?: string;
}

export default function QuickPhrases({
  onSpeak,
  customPhrases,
  onAddPhrase,
  onRemovePhrase,
  currentSentence = '',
}: QuickPhrasesProps) {
  const inputId = useId();
  const [inputText, setInputText] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [lang, setLang] = useState<LangCode>('en');

  const handleAdd = useCallback(() => {
    const trimmed = inputText.trim();
    if (!trimmed) return;
    onAddPhrase(trimmed, '⭐');
    setInputText('');
    setShowForm(false);
  }, [inputText, onAddPhrase]);

  const categories = CATEGORIES_BY_LANG[lang];

  return (
    <div className="flex flex-col gap-5">

      {/* ── Language selector ── */}
      <div className="flex items-center gap-2">
        <span className="text-xs text-gray-500 font-bold uppercase">🌐 Language</span>
        <div className="flex gap-1 ml-auto">
          {(Object.keys(LANG_LABELS) as LangCode[]).map((code) => (
            <button
              key={code}
              onClick={() => setLang(code)}
              aria-pressed={lang === code}
              className={`text-xs px-2.5 py-1 rounded-lg min-h-[32px] transition-colors ${
                lang === code
                  ? 'bg-cyan-700 text-white font-semibold'
                  : 'bg-gray-800 text-gray-400 hover:text-gray-200'
              }`}
            >
              {LANG_LABELS[code]}
            </button>
          ))}
        </div>
      </div>

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
      {categories.map((cat) => (
        <div key={cat.name}>
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-xs uppercase text-gray-500 font-bold">{cat.name}</h3>
            {cat.isEmergency && currentSentence.trim() && (
              <button
                onClick={() => shareEmergency(currentSentence.trim())}
                aria-label={`Share current message: "${currentSentence.trim()}"`}
                title="Share current sentence via SMS / share sheet"
                className="text-xs text-red-400 hover:text-red-300 transition-colors flex items-center gap-1 min-h-[32px] px-2"
              >
                <span aria-hidden="true">📤</span> Share message
              </button>
            )}
          </div>
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
