'use client';
// Always-visible YES / NO / MAYBE / HELP bar — the single most critical AAC feature
// Used by ALS, stroke, aphasia patients who may only manage head nods or eye gaze
interface Props { onSpeak: (text: string) => void; visible?: boolean; }
const BUTTONS = [
  { label:'YES',   emoji:'✅', color:'bg-emerald-700 hover:bg-emerald-600 border-emerald-500', text:'Yes' },
  { label:'NO',    emoji:'❌', color:'bg-red-800    hover:bg-red-700    border-red-600',    text:'No'  },
  { label:'MAYBE', emoji:'🤔', color:'bg-amber-700  hover:bg-amber-600  border-amber-500',  text:'Maybe, I am not sure' },
  { label:'HELP',  emoji:'🆘', color:'bg-violet-700 hover:bg-violet-600 border-violet-500', text:'Help me please' },
];
export default function YesNoBar({ onSpeak, visible = true }: Props) {
  if (!visible) return null;
  return (
    <div className="flex gap-2 w-full" role="group" aria-label="Quick response buttons">
      {BUTTONS.map(b => (
        <button key={b.label} onClick={() => onSpeak(b.text)}
          aria-label={b.label}
          className={`flex-1 min-h-[56px] flex flex-col items-center justify-center gap-0.5 rounded-xl border font-bold text-white transition-all active:scale-95 ${b.color}`}>
          <span className="text-xl" aria-hidden="true">{b.emoji}</span>
          <span className="text-xs">{b.label}</span>
        </button>
      ))}
    </div>
  );
}
