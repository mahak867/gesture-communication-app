import type { Lang } from './vocab';

export type Activation = 'tap' | 'release' | 'dwell';

export interface Settings {
  lang: Lang;
  /** tap = on press; release = on lift (forgives slips/tremor); dwell = hold still. */
  activation: Activation;
  dwellMs: number;
  /** Ignore repeated activations within this window (tremor / accidental double hits). */
  debounceMs: number;
  /** 1 = normal, up to 1.6 = larger buttons/text for low vision or weak motor control. */
  scale: number;
  highContrast: boolean;
  speakOnTap: boolean;
  rate: number;
  voiceURI: string;
  /** One-switch scanning: Space/Enter (or a Bluetooth switch) selects the highlighted item. */
  scanning: boolean;
  scanMs: number;
  /** Optional local AI sentence suggestions (needs Ollama running on this machine). */
  aiSuggestions: boolean;
  patientName: string;
}

export const DEFAULT_SETTINGS: Settings = {
  lang: 'en',
  activation: 'release',
  dwellMs: 900,
  debounceMs: 350,
  scale: 1,
  highContrast: false,
  speakOnTap: true,
  rate: 0.9,
  voiceURI: '',
  scanning: false,
  scanMs: 1500,
  aiSuggestions: false,
  patientName: '',
};

const clamp = (n: unknown, lo: number, hi: number, d: number) =>
  typeof n === 'number' && Number.isFinite(n) ? Math.min(hi, Math.max(lo, n)) : d;

/** Merge stored (possibly old or corrupt) settings onto defaults, clamping numbers. */
export function normalizeSettings(raw: unknown): Settings {
  const s = (raw && typeof raw === 'object' ? raw : {}) as Partial<Record<keyof Settings, unknown>>;
  const d = DEFAULT_SETTINGS;
  return {
    lang: s.lang === 'hi' ? 'hi' : 'en',
    activation: s.activation === 'tap' || s.activation === 'dwell' ? s.activation : 'release',
    dwellMs: clamp(s.dwellMs, 300, 3000, d.dwellMs),
    debounceMs: clamp(s.debounceMs, 0, 2000, d.debounceMs),
    scale: clamp(s.scale, 0.8, 1.6, d.scale),
    highContrast: s.highContrast === true,
    speakOnTap: s.speakOnTap !== false,
    rate: clamp(s.rate, 0.5, 1.5, d.rate),
    voiceURI: typeof s.voiceURI === 'string' ? s.voiceURI : '',
    scanning: s.scanning === true,
    scanMs: clamp(s.scanMs, 500, 5000, d.scanMs),
    aiSuggestions: s.aiSuggestions === true,
    patientName: typeof s.patientName === 'string' ? s.patientName.slice(0, 60) : '',
  };
}
