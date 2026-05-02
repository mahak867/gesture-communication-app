// app/lib/voice-banking/index.ts — Voice banking for ALS patients
// ALS patients lose speech progressively. Voice banking lets them record their voice
// BEFORE losing it, so the TTS sounds like them rather than a generic robot voice.
// Integrates with Web Speech Synthesis API + local recordings.

export interface VoiceBank {
  id:          string;
  name:        string;
  createdAt:   number;
  sampleCount: number;
  phrases:     VoiceSample[];
  status:      'recording' | 'complete' | 'processing';
}

export interface VoiceSample {
  id:       string;
  phrase:   string;
  audioUrl: string;  // blob: URL from MediaRecorder
  duration: number;  // seconds
  recordedAt: number;
}

// 50 target phrases — enough for a basic voice model
// Phonetically diverse to capture the full range of speech sounds
export const VOICE_BANKING_PHRASES: string[] = [
  // Short common phrases
  'Yes', 'No', 'Please', 'Thank you', 'Help me', 'I need water',
  'I am in pain', 'Call the nurse', 'I love you', 'I am okay',
  // Sentences with diverse phonemes
  'The quick brown fox jumps over the lazy dog',
  'She sells seashells by the seashore',
  'Peter Piper picked a peck of pickled peppers',
  'How much wood would a woodchuck chuck',
  'I wish to speak and be heard clearly',
  // Medical
  'I cannot breathe properly', 'My head is hurting very much',
  'Please call my doctor right away', 'I need my medication now',
  'I feel dizzy and unwell today',
  // Personal
  'My name is', 'I was born in', 'My favourite food is',
  'I used to work as', 'My family means everything to me',
  // Emotional
  'I am happy today', 'I feel frustrated and need help',
  'I am scared and need reassurance', 'I am grateful for your care',
  // Numbers & spellings
  'One two three four five six seven eight nine ten',
  'A B C D E F G H I J K L M N O P Q R S T U V W X Y Z',
  // Questions
  'What time is it', 'When can I go home', 'Who is coming to visit',
  'Where is my family', 'Can you help me please',
  // Common daily
  'I want to sit up please', 'Please turn off the light',
  'I am too cold', 'I am too hot', 'I cannot sleep',
  'I need to use the bathroom', 'I am not hungry right now',
  'Can you repeat that please', 'I did not understand',
  'Please speak slowly', 'I am tired and need rest',
  // Longer passage
  'Every person deserves to be heard, no matter how they communicate. My voice is my identity and I want to preserve it.',
];

const BANK_KEY = 'gesturetalk-voice-bank';

export function loadVoiceBank(): VoiceBank | null {
  try {
    const raw = localStorage.getItem(BANK_KEY);
    return raw ? JSON.parse(raw) as VoiceBank : null;
  } catch { return null; }
}

export function saveVoiceBank(bank: VoiceBank): void {
  try { localStorage.setItem(BANK_KEY, JSON.stringify(bank)); } catch { /* ignore */ }
}

export function createVoiceBank(name: string): VoiceBank {
  return { id:`vb-${Date.now()}`, name, createdAt:Date.now(), sampleCount:0, phrases:[], status:'recording' };
}

export function getProgress(bank: VoiceBank): number {
  return Math.round((bank.phrases.length / VOICE_BANKING_PHRASES.length) * 100);
}

export function getRemainingPhrases(bank: VoiceBank): string[] {
  const recorded = new Set(bank.phrases.map(p => p.phrase));
  return VOICE_BANKING_PHRASES.filter(p => !recorded.has(p));
}

// Export all recordings as a ZIP for uploading to ModelTalker/Acapela
export async function exportForModelTalker(bank: VoiceBank): Promise<void> {
  // Build a simple text manifest since we can't zip in browser without a lib
  const manifest = bank.phrases.map((p,i) =>
    `${String(i+1).padStart(3,'0')}_${p.phrase.replace(/\W+/g,'_').slice(0,30)}.wav\t${p.phrase}`
  ).join('\n');
  const blob = new Blob([manifest], { type: 'text/plain' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href = url; a.download = `${bank.name}-voice-bank-manifest.txt`; a.click();
  URL.revokeObjectURL(url);
}
