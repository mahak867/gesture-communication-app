import { LANGS, type Lang } from './vocab';

export function speechSupported(): boolean {
  return typeof window !== 'undefined' && 'speechSynthesis' in window;
}

/** Pick the chosen voice, else the best match for the language, else the browser default. */
export function pickVoice(voices: SpeechSynthesisVoice[], lang: Lang, voiceURI: string) {
  const chosen = voices.find((v) => v.voiceURI === voiceURI);
  if (chosen) return chosen;
  const tag = LANGS.find((l) => l.id === lang)?.bcp47 ?? 'en-IN';
  const base = tag.split('-')[0];
  return (
    voices.find((v) => v.lang === tag) ??
    voices.find((v) => v.lang.toLowerCase().startsWith(base)) ??
    null
  );
}

export function speak(text: string, opts: { lang: Lang; rate: number; voiceURI: string }) {
  if (!speechSupported() || !text.trim()) return;
  const synth = window.speechSynthesis;
  synth.cancel();
  const u = new SpeechSynthesisUtterance(text);
  const voice = pickVoice(synth.getVoices(), opts.lang, opts.voiceURI);
  if (voice) u.voice = voice;
  u.lang = voice?.lang ?? LANGS.find((l) => l.id === opts.lang)?.bcp47 ?? 'en-IN';
  u.rate = opts.rate;
  synth.speak(u);
}

export function stopSpeaking() {
  if (speechSupported()) window.speechSynthesis.cancel();
}

let ctx: AudioContext | null = null;

/** Loud repeating two-tone chime to get a carer's attention. Returns a stop function. */
export function startAlarm(): () => void {
  if (typeof window === 'undefined') return () => {};
  try {
    const Ctor =
      window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctor) return () => {};
    ctx ??= new Ctor();
    const audio = ctx;
    void audio.resume();
    const beep = () => {
      [880, 660].forEach((f, i) => {
        const o = audio.createOscillator();
        const g = audio.createGain();
        o.frequency.value = f;
        o.connect(g);
        g.connect(audio.destination);
        const t = audio.currentTime + i * 0.3;
        g.gain.setValueAtTime(0.4, t);
        g.gain.exponentialRampToValueAtTime(0.001, t + 0.28);
        o.start(t);
        o.stop(t + 0.3);
      });
      navigator.vibrate?.([200, 100, 200]);
    };
    beep();
    const id = window.setInterval(beep, 1200);
    return () => window.clearInterval(id);
  } catch {
    return () => {};
  }
}
