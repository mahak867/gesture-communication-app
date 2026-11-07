// A profile is one person: their calibration and their personal sign vocabulary.
// Several patients can share a ward tablet, so profiles are switchable and
// exportable (backup, or move to a new device).

import { DEFAULT_CALIBRATION, type Calibration } from './sensors';
import type { Seq } from './recognizer';
import type { Lang } from './vocab';

export type SignAction = 'say' | 'speak' | 'delete' | 'clear' | 'help';

export interface Sign {
  id: string;
  /** What appears in the sentence, e.g. "water" or "I need the toilet". */
  output: string;
  action: SignAction;
  /** Speak immediately when recognised (good for whole phrases and yes/no). */
  instant: boolean;
  urgent: boolean;
  samples: Seq[]; // resampled feature sequences
  createdAt: number;
}

export interface Profile {
  id: string;
  name: string;
  lang: Lang;
  calibration: Calibration;
  calibrated: boolean;
  /** Feature vector of the relaxed hand — the segmenter's rest pose. */
  rest: number[];
  signs: Sign[];
}

export const SAMPLES_PER_SIGN = 4;

export const uid = () => Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4);

export function newProfile(name: string, lang: Lang = 'en'): Profile {
  return {
    id: uid(),
    name: name.trim() || 'Patient',
    lang,
    calibration: { relaxed: [...DEFAULT_CALIBRATION.relaxed], bent: [...DEFAULT_CALIBRATION.bent] },
    calibrated: false,
    rest: [0, 0, 0, 0, 0, 0, 0, 1, 0],
    signs: [],
  };
}

/**
 * Suggested first vocabulary for hospital / ALS / stroke communication.
 * Ordered by need: control signs first so a person can always say yes, no
 * and call for help even with only three signs learned.
 */
export const STARTER_SIGNS: { output: string; hi: string; action: SignAction; instant: boolean; urgent: boolean; tip: string }[] = [
  { output: 'Yes', hi: 'हाँ', action: 'say', instant: true, urgent: false, tip: 'Something easy and quick, e.g. thumb up' },
  { output: 'No', hi: 'नहीं', action: 'say', instant: true, urgent: false, tip: 'Clearly different from yes, e.g. wrist turn' },
  { output: 'Help! I need someone now', hi: 'मदद! मुझे अभी किसी की ज़रूरत है', action: 'help', instant: true, urgent: true, tip: 'Something you never do by accident' },
  { output: 'I am in pain', hi: 'मुझे दर्द हो रहा है', action: 'say', instant: true, urgent: false, tip: '' },
  { output: 'water', hi: 'पानी', action: 'say', instant: false, urgent: false, tip: '' },
  { output: 'toilet', hi: 'शौचालय', action: 'say', instant: false, urgent: false, tip: '' },
  { output: 'please call the nurse', hi: 'कृपया नर्स को बुलाइए', action: 'say', instant: true, urgent: false, tip: '' },
  { output: 'thank you', hi: 'धन्यवाद', action: 'say', instant: true, urgent: false, tip: '' },
  { output: '(speak sentence)', hi: '(वाक्य बोलें)', action: 'speak', instant: false, urgent: false, tip: 'Says everything signed so far' },
  { output: '(delete last)', hi: '(पिछला हटाएँ)', action: 'delete', instant: false, urgent: false, tip: 'Undo a wrong sign' },
];

// ───────── validation for stored / imported data ─────────

const isNumArr = (v: unknown, len?: number): v is number[] =>
  Array.isArray(v) && (len == null || v.length === len) && v.every((n) => typeof n === 'number' && Number.isFinite(n));

function isSeq(v: unknown): v is Seq {
  return Array.isArray(v) && v.length > 0 && v.length <= 200 && v.every((f) => isNumArr(f, 9));
}

function isSign(v: unknown): v is Sign {
  const s = v as Sign;
  return (
    !!s && typeof s.id === 'string' && typeof s.output === 'string' && s.output.length <= 200 &&
    ['say', 'speak', 'delete', 'clear', 'help'].includes(s.action) &&
    typeof s.instant === 'boolean' && typeof s.urgent === 'boolean' &&
    Array.isArray(s.samples) && s.samples.length <= 20 && s.samples.every(isSeq)
  );
}

export function isProfile(v: unknown): v is Profile {
  const p = v as Profile;
  return (
    !!p && typeof p.id === 'string' && typeof p.name === 'string' && (p.lang === 'en' || p.lang === 'hi') &&
    !!p.calibration && isNumArr(p.calibration.relaxed, 5) && isNumArr(p.calibration.bent, 5) &&
    typeof p.calibrated === 'boolean' && isNumArr(p.rest, 9) &&
    Array.isArray(p.signs) && p.signs.length <= 300 && p.signs.every(isSign)
  );
}

export function isProfileList(v: unknown): v is Profile[] {
  return Array.isArray(v) && v.every(isProfile);
}

// ───────── sentence building ─────────

export interface Token {
  text: string;
  signId?: string;
}

/** Join signed words into readable text: capitalise, avoid doubled spaces/punctuation. */
export function sentenceText(tokens: Token[]): string {
  const s = tokens.map((t) => t.text.trim()).filter(Boolean).join(' ').replace(/\s+([?.!,])/g, '$1');
  return s ? s[0].toUpperCase() + s.slice(1) : '';
}
