// Built-in vocabulary. Every phrase keeps a fixed position on its board so
// people can build motor memory ("motor planning") — a core principle of
// good AAC design. Never reorder these arrays at runtime.

export type Lang = 'en' | 'hi';

export const LANGS: { id: Lang; label: string; bcp47: string }[] = [
  { id: 'en', label: 'English', bcp47: 'en-IN' },
  { id: 'hi', label: 'हिन्दी', bcp47: 'hi-IN' },
];

export type Text = Record<Lang, string>;

export interface Phrase {
  id: string;
  icon: string;
  text: Text;
  /** Urgent phrases also trigger the attention alert. */
  urgent?: boolean;
}

export interface Board {
  id: string;
  icon: string;
  title: Text;
  phrases: Phrase[];
}

const p = (id: string, icon: string, en: string, hi: string, urgent = false): Phrase => ({
  id,
  icon,
  text: { en, hi },
  urgent,
});

export const BOARDS: Board[] = [
  {
    id: 'needs',
    icon: '🙋',
    title: { en: 'Needs', hi: 'ज़रूरतें' },
    phrases: [
      p('nurse', '🛎️', 'Please call the nurse', 'कृपया नर्स को बुलाइए', true),
      p('cant-breathe', '😮‍💨', 'I can’t breathe well', 'मुझे साँस लेने में दिक्कत है', true),
      p('water', '💧', 'I want water', 'मुझे पानी चाहिए'),
      p('toilet', '🚻', 'I need the toilet', 'मुझे शौचालय जाना है'),
      p('suction', '🫁', 'I need suction', 'मुझे सक्शन चाहिए'),
      p('reposition', '🛏️', 'Please move me', 'कृपया मेरी करवट बदलिए'),
      p('cold', '🥶', 'I am cold', 'मुझे ठंड लग रही है'),
      p('hot', '🥵', 'I am hot', 'मुझे गर्मी लग रही है'),
      p('sleep', '😴', 'I want to sleep', 'मैं सोना चाहता/चाहती हूँ'),
      p('light', '💡', 'Light on / off, please', 'कृपया बत्ती जलाइए / बुझाइए'),
      p('glasses', '👓', 'I need my glasses', 'मुझे मेरा चश्मा चाहिए'),
      p('phone', '📱', 'I want my phone', 'मुझे मेरा फ़ोन चाहिए'),
    ],
  },
  {
    id: 'feel',
    icon: '💬',
    title: { en: 'Feelings', hi: 'भावनाएँ' },
    phrases: [
      p('scared', '😨', 'I am scared', 'मुझे डर लग रहा है'),
      p('sick', '🤢', 'I feel sick', 'मेरा जी मिचला रहा है'),
      p('dizzy', '😵‍💫', 'I feel dizzy', 'मुझे चक्कर आ रहे हैं'),
      p('tired', '🥱', 'I am tired', 'मैं थक गया/गई हूँ'),
      p('better', '🙂', 'I feel better', 'मैं बेहतर महसूस कर रहा/रही हूँ'),
      p('worse', '😣', 'I feel worse', 'मेरी तबीयत और खराब लग रही है', true),
      p('lonely', '🫂', 'Please stay with me', 'कृपया मेरे पास रहिए'),
      p('frustrated', '😤', 'I am frustrated', 'मैं परेशान हूँ'),
      p('thanks', '🙏', 'Thank you', 'धन्यवाद'),
    ],
  },
  {
    id: 'talk',
    icon: '🗣️',
    title: { en: 'Conversation', hi: 'बातचीत' },
    phrases: [
      p('wait', '✋', 'Wait, I am still typing', 'रुकिए, मैं अभी लिख रहा/रही हूँ'),
      p('repeat', '🔁', 'Please say that again', 'कृपया फिर से कहिए'),
      p('dont-understand', '🤷', 'I don’t understand', 'मुझे समझ नहीं आया'),
      p('explain', '❓', 'What is happening to me?', 'मेरे साथ क्या हो रहा है?'),
      p('family', '👨‍👩‍👧', 'Please call my family', 'कृपया मेरे परिवार को बुलाइए'),
      p('doctor', '🩺', 'I want to talk to the doctor', 'मुझे डॉक्टर से बात करनी है'),
      p('how-long', '⏳', 'How long will this take?', 'इसमें कितना समय लगेगा?'),
      p('go-home', '🏠', 'When can I go home?', 'मैं घर कब जा सकता/सकती हूँ?'),
      p('not-now', '⏸️', 'Not now, please', 'अभी नहीं, कृपया'),
    ],
  },
];

/** Answers that must always be one tap away (ICU research: yes/no is used most). */
export const QUICK = {
  yes: p('yes', '👍', 'Yes', 'हाँ'),
  no: p('no', '👎', 'No', 'नहीं'),
  maybe: p('maybe', '🤔', 'I’m not sure', 'पता नहीं'),
  help: p('help', '🚨', 'Help! I need someone now', 'मदद! मुझे अभी किसी की ज़रूरत है', true),
};

export const BODY_PARTS: { id: string; text: Text }[] = [
  { id: 'head', text: { en: 'head', hi: 'सिर' } },
  { id: 'throat', text: { en: 'throat', hi: 'गला' } },
  { id: 'chest', text: { en: 'chest', hi: 'छाती' } },
  { id: 'stomach', text: { en: 'stomach', hi: 'पेट' } },
  { id: 'back', text: { en: 'back', hi: 'पीठ' } },
  { id: 'arm', text: { en: 'arm', hi: 'बाँह' } },
  { id: 'leg', text: { en: 'leg', hi: 'पैर' } },
  { id: 'wound', text: { en: 'wound / drip site', hi: 'घाव / ड्रिप की जगह' } },
];

export const PAIN_LEVELS: { level: number; face: string; text: Text }[] = [
  { level: 0, face: '😀', text: { en: 'no pain', hi: 'कोई दर्द नहीं' } },
  { level: 2, face: '🙂', text: { en: 'a little pain', hi: 'थोड़ा दर्द' } },
  { level: 4, face: '😐', text: { en: 'some pain', hi: 'कुछ दर्द' } },
  { level: 6, face: '😟', text: { en: 'bad pain', hi: 'ज़्यादा दर्द' } },
  { level: 8, face: '😣', text: { en: 'very bad pain', hi: 'बहुत ज़्यादा दर्द' } },
  { level: 10, face: '😭', text: { en: 'the worst pain', hi: 'असहनीय दर्द' } },
];

/** Build the sentence spoken from the pain board. Level >= 6 is treated as urgent. */
export function painSentence(lang: Lang, level: number, partId?: string): { text: string; urgent: boolean } {
  const lvl = PAIN_LEVELS.find((l) => l.level === level) ?? PAIN_LEVELS[0];
  const part = BODY_PARTS.find((b) => b.id === partId);
  let text: string;
  if (lang === 'hi') {
    text = part
      ? `मेरे ${part.text.hi} में ${lvl.text.hi} है (${level}/10)`
      : `मुझे ${lvl.text.hi} है (${level}/10)`;
  } else {
    text = part ? `I have ${lvl.text.en} in my ${part.text.en} (${level}/10)` : `I have ${lvl.text.en} (${level}/10)`;
  }
  return { text, urgent: level >= 6 };
}
