'use client';

import { useEffect, useState, type ReactNode } from 'react';
import { useApp } from '../hooks/useApp';
import { speak, speechSupported } from '../lib/speech';
import { LANGS } from '../lib/vocab';
import type { Activation } from '../lib/settings';

function Row({ label, hint, children }: { label: string; hint?: string; children: ReactNode }) {
  return (
    <label className="card flex flex-col gap-1.5 p-4">
      <span className="font-semibold">{label}</span>
      {hint && <span className="text-[0.85em] text-[var(--muted)]">{hint}</span>}
      {children}
    </label>
  );
}

const input = 'min-h-12 rounded-xl border-[1.5px] border-[var(--line)] bg-[var(--surface-2)] px-3 text-[var(--fg)]';

export function SettingsPanel() {
  const { settings: s, setSettings } = useApp();
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);

  useEffect(() => {
    if (!speechSupported()) return;
    const update = () => setVoices(window.speechSynthesis.getVoices());
    update();
    window.speechSynthesis.addEventListener('voiceschanged', update);
    return () => window.speechSynthesis.removeEventListener('voiceschanged', update);
  }, []);

  const langVoices = voices.filter((v) => v.lang.toLowerCase().startsWith(s.lang));

  return (
    <div className="grid gap-3 sm:grid-cols-2">
      <Row label="Language">
        <select className={input} value={s.lang} onChange={(e) => setSettings({ lang: e.target.value as 'en' | 'hi', voiceURI: '' })}>
          {LANGS.map((l) => <option key={l.id} value={l.id}>{l.label}</option>)}
        </select>
      </Row>

      <Row label="Voice" hint={langVoices.length ? undefined : 'No voice for this language is installed on this device; the default voice will be used.'}>
        <div className="flex gap-2">
          <select className={`${input} flex-1`} value={s.voiceURI} onChange={(e) => setSettings({ voiceURI: e.target.value })}>
            <option value="">Automatic</option>
            {langVoices.map((v) => <option key={v.voiceURI} value={v.voiceURI}>{v.name}</option>)}
          </select>
          <button type="button" className={input} onClick={() => speak(s.lang === 'hi' ? 'नमस्ते, यह मेरी आवाज़ है' : 'Hello, this is my voice', s)}>
            ▶ Test
          </button>
        </div>
      </Row>

      <Row label={`Speaking speed: ${s.rate.toFixed(1)}×`}>
        <input type="range" className="h-10 accent-[var(--accent)]" min={0.5} max={1.5} step={0.1} value={s.rate} onChange={(e) => setSettings({ rate: +e.target.value })} />
      </Row>

      <Row label={`Button size: ${Math.round(s.scale * 100)}%`} hint="Bigger buttons are easier to hit with a weak or shaky hand.">
        <input type="range" className="h-10 accent-[var(--accent)]" min={0.8} max={1.6} step={0.1} value={s.scale} onChange={(e) => setSettings({ scale: +e.target.value })} />
      </Row>

      <Row label="How buttons are pressed">
        <select className={input} value={s.activation} onChange={(e) => setSettings({ activation: e.target.value as Activation })}>
          <option value="release">On lift — slide off to cancel (recommended)</option>
          <option value="tap">On touch — fastest</option>
          <option value="dwell">Hold still — for tremor or unsteady hands</option>
        </select>
      </Row>

      {s.activation === 'dwell' && (
        <Row label={`Hold time: ${(s.dwellMs / 1000).toFixed(1)} s`}>
          <input type="range" className="h-10 accent-[var(--accent)]" min={300} max={3000} step={100} value={s.dwellMs} onChange={(e) => setSettings({ dwellMs: +e.target.value })} />
        </Row>
      )}

      <Row label={`Ignore repeat presses for: ${(s.debounceMs / 1000).toFixed(2)} s`} hint="Stops accidental double presses.">
        <input type="range" className="h-10 accent-[var(--accent)]" min={0} max={2000} step={50} value={s.debounceMs} onChange={(e) => setSettings({ debounceMs: +e.target.value })} />
      </Row>

      <Row label="Phrase buttons" hint="Speak straight away, or add to the message so you can build a longer sentence.">
        <select className={input} value={s.speakOnTap ? 'speak' : 'build'} onChange={(e) => setSettings({ speakOnTap: e.target.value === 'speak' })}>
          <option value="speak">Speak straight away</option>
          <option value="build">Add to message</option>
        </select>
      </Row>

      <Row label="Switch scanning" hint="Highlights each button in turn. Press Space/Enter or your switch to choose.">
        <input type="checkbox" className="h-7 w-7 accent-[var(--accent)]" checked={s.scanning} onChange={(e) => setSettings({ scanning: e.target.checked })} />
      </Row>

      {s.scanning && (
        <Row label={`Scan speed: ${(s.scanMs / 1000).toFixed(1)} s per button`}>
          <input type="range" className="h-10 accent-[var(--accent)]" min={500} max={5000} step={100} value={s.scanMs} onChange={(e) => setSettings({ scanMs: +e.target.value })} />
        </Row>
      )}

      <Row label="High contrast">
        <input type="checkbox" className="h-7 w-7 accent-[var(--accent)]" checked={s.highContrast} onChange={(e) => setSettings({ highContrast: e.target.checked })} />
      </Row>

      <Row label="Patient name" hint="Shown on the urgent alert so staff know who is calling.">
        <input className={input} value={s.patientName} maxLength={60} onChange={(e) => setSettings({ patientName: e.target.value })} />
      </Row>

      <Row label="AI sentence suggestions (optional)" hint="Needs Ollama running on the computer serving this app. Off by default; nothing is sent to the internet.">
        <input type="checkbox" className="h-7 w-7 accent-[var(--accent)]" checked={s.aiSuggestions} onChange={(e) => setSettings({ aiSuggestions: e.target.checked })} />
      </Row>
    </div>
  );
}
