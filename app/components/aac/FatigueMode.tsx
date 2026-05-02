'use client';
// Fatigue / ALS late-stage mode — minimal UI, massive buttons, single-action per screen
// Designed for users with very limited movement or energy (late-stage ALS, locked-in)
// 4 huge buttons fill the entire screen — yes/no/help/speak only
import { useState } from 'react';

interface Props { onSpeak: (text: string) => void; onExit: () => void; }

type FatigueScreen = 'main' | 'needs' | 'pain' | 'feelings';

const MAIN = [
  { label:'YES',   emoji:'✅', text:'Yes',           bg:'bg-emerald-800', next: null },
  { label:'NO',    emoji:'❌', text:'No',            bg:'bg-red-900',     next: null },
  { label:'PAIN',  emoji:'😣', text:null,            bg:'bg-orange-900',  next:'pain' as const },
  { label:'NEEDS', emoji:'🆘', text:null,            bg:'bg-violet-900',  next:'needs' as const },
];

const PAIN_OPTIONS = [
  { label:'Mild 1-3',    text:'My pain is mild, level 2 out of 10',  bg:'bg-yellow-800' },
  { label:'Moderate 4-6',text:'My pain is moderate, level 5 out of 10', bg:'bg-orange-800' },
  { label:'Severe 7-9',  text:'My pain is severe, level 8 out of 10', bg:'bg-red-800' },
  { label:'Worst',       text:'My pain is the worst, level 10 out of 10', bg:'bg-red-950' },
];

const NEEDS_OPTIONS = [
  { label:'WATER 💧', text:'I need water please',         bg:'bg-blue-800' },
  { label:'NURSE 👩‍⚕️',text:'Please call the nurse',      bg:'bg-cyan-800' },
  { label:'TOILET 🚻',text:'I need the bathroom',         bg:'bg-amber-800' },
  { label:'TURN 🔄',  text:'Please turn me over',         bg:'bg-indigo-800' },
];

export default function FatigueMode({ onSpeak, onExit }: Props) {
  const [screen, setScreen] = useState<FatigueScreen>('main');

  return (
    <div className="fixed inset-0 z-50 bg-black flex flex-col" role="dialog" aria-label="Fatigue mode — simplified communication">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-gray-800 flex-shrink-0">
        <div className="flex items-center gap-2">
          <span className="text-xl" aria-hidden="true">😴</span>
          <span className="text-sm font-bold text-gray-300">Fatigue Mode</span>
        </div>
        {screen !== 'main' && (
          <button onClick={() => setScreen('main')} className="text-gray-500 hover:text-gray-300 min-h-[44px] px-3 text-sm">← Back</button>
        )}
        <button onClick={onExit} className="text-gray-600 hover:text-gray-400 min-h-[44px] px-3 text-xs">Exit</button>
      </div>

      {/* Main screen */}
      {screen === 'main' && (
        <div className="flex-1 grid grid-cols-2 gap-3 p-3">
          {MAIN.map(b => (
            <button key={b.label}
              onClick={() => b.next ? setScreen(b.next) : b.text && onSpeak(b.text)}
              aria-label={b.label}
              className={`${b.bg} rounded-2xl flex flex-col items-center justify-center gap-3 text-white transition-all active:scale-95 border border-white/10`}>
              <span className="text-6xl" aria-hidden="true">{b.emoji}</span>
              <span className="text-2xl font-black tracking-wide">{b.label}</span>
            </button>
          ))}
        </div>
      )}

      {/* Pain screen */}
      {screen === 'pain' && (
        <div className="flex-1 flex flex-col gap-3 p-3">
          <p className="text-center text-gray-400 text-sm py-2">Select pain level</p>
          {PAIN_OPTIONS.map(o => (
            <button key={o.label} onClick={() => { onSpeak(o.text); setScreen('main'); }}
              className={`flex-1 ${o.bg} rounded-2xl flex items-center justify-center text-white text-xl font-bold active:scale-95 border border-white/10`}>
              {o.label}
            </button>
          ))}
        </div>
      )}

      {/* Needs screen */}
      {screen === 'needs' && (
        <div className="flex-1 grid grid-cols-2 gap-3 p-3">
          {NEEDS_OPTIONS.map(o => (
            <button key={o.label} onClick={() => { onSpeak(o.text); setScreen('main'); }}
              className={`${o.bg} rounded-2xl flex items-center justify-center text-white text-lg font-bold text-center px-3 active:scale-95 border border-white/10`}>
              {o.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
