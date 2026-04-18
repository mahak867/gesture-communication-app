// components/GestureGuide.tsx
import { GESTURE_GUIDE } from '../lib/gestures';

const CATEGORY_STYLE = {
  letter:  'bg-violet-950/60 border-violet-700/50 text-violet-200',
  number:  'bg-blue-950/60 border-blue-700/50 text-blue-200',
  command: 'bg-emerald-950/60 border-emerald-700/50 text-emerald-200',
} as const;

const CATEGORY_LABEL = {
  letter:  'Letters',
  number:  'Numbers',
  command: 'Commands',
} as const;

const CATEGORY_BADGE = {
  letter:  'bg-violet-900/60 text-violet-300',
  number:  'bg-blue-900/60 text-blue-300',
  command: 'bg-emerald-900/60 text-emerald-300',
} as const;

const CATEGORIES = ['letter', 'number', 'command'] as const;

export default function GestureGuide() {
  return (
    <div className="flex flex-col gap-5">
      <p className="text-xs text-gray-500 leading-relaxed">
        Hold any gesture below for <strong className="text-gray-400">1.5 seconds</strong> to
        confirm it. The dwell ring on your wrist shows progress.
      </p>

      {CATEGORIES.map((cat) => {
        const entries = GESTURE_GUIDE.filter((g) => g.category === cat);
        return (
          <div key={cat}>
            <div className="flex items-center gap-2 mb-2">
              <h3 className="text-xs uppercase font-bold text-gray-400">
                {CATEGORY_LABEL[cat]}
              </h3>
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${CATEGORY_BADGE[cat]}`}>
                {entries.length}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {entries.map((g) => (
                <div
                  key={g.id}
                  className={`border rounded-xl p-3 flex flex-col items-center gap-1.5 ${CATEGORY_STYLE[cat]}`}
                  title={g.description}
                >
                  <span className="text-3xl" aria-hidden>{g.emoji}</span>
                  <span className="text-sm font-bold">{g.label}</span>
                  <span className="text-xs text-center opacity-70 leading-tight">
                    {g.description}
                  </span>
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
