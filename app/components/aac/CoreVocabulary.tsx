'use client';
// Core vocabulary board — 200 high-frequency words cover 80% of all human communication
// Based on research by Gail Van Tatenhove and David Beukelman on core word AAC
// Critical for users who cannot spell (severe CP, young patients, cognitive impairment)
import { useState } from 'react';

interface Props { onSpeak: (text: string) => void; }

type Category = 'social' | 'verbs' | 'descriptors' | 'questions' | 'body' | 'needs';

const CORE: Record<Category, { label: string; emoji: string; words: string[] }> = {
  social:      { label:'Social',     emoji:'💬', words:['Hello','Goodbye','Thank you','Sorry','Please','You are welcome','I love you','Me too','I know','No problem','Good morning','Good night'] },
  verbs:       { label:'Verbs',      emoji:'⚡', words:['Want','Need','Help','Stop','Go','Come','Look','Feel','Think','Know','Can','Like','Have','Give','Make','Put','Turn','See','Hear','Say'] },
  descriptors: { label:'Describe',   emoji:'🎨', words:['Good','Bad','More','Less','Big','Small','Hot','Cold','Fast','Slow','Better','Worse','Different','Same','Happy','Sad','Tired','Ready','Right','Wrong'] },
  questions:   { label:'Questions',  emoji:'❓', words:['Who','What','When','Where','Why','How','Which','Can you','Do you','Is it','Are you','Will you','How much','How long','What time'] },
  body:        { label:'Body',       emoji:'🫀', words:['Head','Eye','Ear','Mouth','Throat','Chest','Arm','Hand','Leg','Foot','Back','Stomach','Heart','Breath','Pain','Hurt'] },
  needs:       { label:'Needs',      emoji:'🛏️', words:['Water','Food','Medicine','Bathroom','Sleep','Sit up','Lie down','Warm','Cold','Light','Dark','Quiet','Loud','Turn over','Suction','Call nurse'] },
};

const CATEGORIES = Object.keys(CORE) as Category[];

export default function CoreVocabulary({ onSpeak }: Props) {
  const [cat, setCat] = useState<Category>('social');
  return (
    <div className="flex flex-col gap-3">
      {/* Category tabs */}
      <div className="flex gap-1.5 flex-wrap">
        {CATEGORIES.map(c => (
          <button key={c} onClick={() => setCat(c)}
            aria-pressed={c === cat}
            className={`px-3 min-h-[36px] rounded-xl text-xs font-medium border transition-all flex items-center gap-1 ${c === cat ? 'border-cyan-500 bg-cyan-900/40 text-cyan-300' : 'border-gray-700 bg-gray-800/40 text-gray-400 hover:text-gray-200'}`}>
            <span aria-hidden="true">{CORE[c].emoji}</span>
            {CORE[c].label}
          </button>
        ))}
      </div>
      {/* Word grid */}
      <div className="grid grid-cols-3 gap-2" role="group" aria-label={`${CORE[cat].label} words`}>
        {CORE[cat].words.map(word => (
          <button key={word} onClick={() => onSpeak(word)}
            className="min-h-[48px] px-2 bg-gray-800 hover:bg-gray-700 border border-gray-700 hover:border-gray-500 rounded-xl text-sm text-gray-200 font-medium transition-all active:scale-95 leading-tight">
            {word}
          </button>
        ))}
      </div>
    </div>
  );
}
