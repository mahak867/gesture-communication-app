'use client';
// Symbol/picture grid — like Proloquo2Go. Critical for non-literate users and children.
// Uses emoji as symbols (accessible, no licensing, cross-platform)
import { useState } from 'react';

interface Symbol { id: string; emoji: string; label: string; phrase: string; color: string; }
interface Props { onSpeak: (text: string) => void; }

type Page = 'home' | 'feelings' | 'body' | 'actions' | 'food' | 'medical';

const PAGES: Record<Page, { label: string; emoji: string; symbols: Symbol[] }> = {
  home: { label: 'Home', emoji: '🏠', symbols: [
    { id:'yes',     emoji:'✅', label:'Yes',       phrase:'Yes',                       color:'bg-emerald-900/40 border-emerald-700' },
    { id:'no',      emoji:'❌', label:'No',        phrase:'No',                        color:'bg-red-900/40    border-red-700'     },
    { id:'help',    emoji:'🆘', label:'Help',      phrase:'Help me',                   color:'bg-violet-900/40 border-violet-700'  },
    { id:'pain',    emoji:'😣', label:'Pain',      phrase:'I am in pain',              color:'bg-red-900/40    border-red-700'     },
    { id:'water',   emoji:'💧', label:'Water',     phrase:'I need water please',       color:'bg-blue-900/40   border-blue-700'    },
    { id:'toilet',  emoji:'🚻', label:'Toilet',    phrase:'I need to use the bathroom',color:'bg-yellow-900/40 border-yellow-700'  },
    { id:'nurse',   emoji:'👩‍⚕️',label:'Nurse',  phrase:'Please call the nurse',     color:'bg-cyan-900/40   border-cyan-700'    },
    { id:'family',  emoji:'👨‍👩‍👧',label:'Family', phrase:'I want to see my family', color:'bg-pink-900/40   border-pink-700'    },
    { id:'feelings',emoji:'💛', label:'Feelings',  phrase:'__nav:feelings',            color:'bg-amber-900/40  border-amber-700'   },
    { id:'body',    emoji:'🫀', label:'Body',      phrase:'__nav:body',                color:'bg-rose-900/40   border-rose-700'    },
    { id:'food',    emoji:'🍽️', label:'Food',      phrase:'__nav:food',                color:'bg-green-900/40  border-green-700'   },
    { id:'medical', emoji:'💊', label:'Medical',   phrase:'__nav:medical',             color:'bg-teal-900/40   border-teal-700'    },
  ]},
  feelings: { label: 'Feelings', emoji: '💛', symbols: [
    { id:'happy',      emoji:'😊', label:'Happy',    phrase:'I am happy',              color:'bg-yellow-900/40 border-yellow-700' },
    { id:'sad',        emoji:'😢', label:'Sad',      phrase:'I am sad',                color:'bg-blue-900/40   border-blue-700'   },
    { id:'scared',     emoji:'😨', label:'Scared',   phrase:'I am scared',             color:'bg-purple-900/40 border-purple-700' },
    { id:'angry',      emoji:'😠', label:'Angry',    phrase:'I am frustrated',         color:'bg-red-900/40    border-red-700'    },
    { id:'tired',      emoji:'😴', label:'Tired',    phrase:'I am very tired',         color:'bg-gray-800      border-gray-600'   },
    { id:'confused',   emoji:'😕', label:'Confused', phrase:'I am confused',           color:'bg-orange-900/40 border-orange-700' },
    { id:'bored',      emoji:'😐', label:'Bored',    phrase:'I am bored',              color:'bg-gray-800      border-gray-600'   },
    { id:'lonely',     emoji:'🥺', label:'Lonely',   phrase:'I feel lonely',           color:'bg-indigo-900/40 border-indigo-700' },
    { id:'grateful',   emoji:'🙏', label:'Grateful', phrase:'I am grateful, thank you',color:'bg-emerald-900/40 border-emerald-700'},
    { id:'home_back',  emoji:'🏠', label:'Back',     phrase:'__nav:home',              color:'bg-gray-800      border-gray-600'   },
  ]},
  body: { label: 'Body', emoji: '🫀', symbols: [
    { id:'head',    emoji:'🤕', label:'Head',    phrase:'My head hurts',       color:'bg-red-900/40 border-red-700' },
    { id:'chest',   emoji:'🫀', label:'Chest',   phrase:'My chest hurts',      color:'bg-red-900/40 border-red-700' },
    { id:'stomach', emoji:'🤢', label:'Stomach', phrase:'My stomach hurts',    color:'bg-red-900/40 border-red-700' },
    { id:'back',    emoji:'🦴', label:'Back',    phrase:'My back hurts',       color:'bg-red-900/40 border-red-700' },
    { id:'leg',     emoji:'🦵', label:'Leg',     phrase:'My leg hurts',        color:'bg-red-900/40 border-red-700' },
    { id:'arm',     emoji:'💪', label:'Arm',     phrase:'My arm hurts',        color:'bg-red-900/40 border-red-700' },
    { id:'cold',    emoji:'🥶', label:'Cold',    phrase:'I am cold',           color:'bg-blue-900/40 border-blue-700' },
    { id:'hot',     emoji:'🥵', label:'Hot',     phrase:'I am hot',            color:'bg-orange-900/40 border-orange-700' },
    { id:'breathe', emoji:'😮‍💨',label:'Breath', phrase:'I cannot breathe well',color:'bg-red-900/40 border-red-700' },
    { id:'home_back2',emoji:'🏠',label:'Back',   phrase:'__nav:home',          color:'bg-gray-800 border-gray-600' },
  ]},
  food: { label: 'Food', emoji: '🍽️', symbols: [
    { id:'hungry',  emoji:'🍽️', label:'Hungry',   phrase:'I am hungry',           color:'bg-green-900/40 border-green-700' },
    { id:'thirsty', emoji:'💧', label:'Thirsty',  phrase:'I am thirsty',          color:'bg-blue-900/40  border-blue-700'  },
    { id:'water2',  emoji:'🥛', label:'Water',    phrase:'Water please',          color:'bg-blue-900/40  border-blue-700'  },
    { id:'juice',   emoji:'🧃', label:'Juice',    phrase:'Juice please',          color:'bg-orange-900/40 border-orange-700'},
    { id:'food2',   emoji:'🍚', label:'Food',     phrase:'Food please',           color:'bg-green-900/40 border-green-700' },
    { id:'sweet',   emoji:'🍬', label:'Sweet',    phrase:'Something sweet please',color:'bg-pink-900/40  border-pink-700'  },
    { id:'nausea',  emoji:'🤢', label:'Nausea',   phrase:'I feel nauseous',       color:'bg-red-900/40   border-red-700'   },
    { id:'noteat',  emoji:'🚫', label:'No Food',  phrase:'I do not want food now',color:'bg-gray-800     border-gray-600'  },
    { id:'home_back3',emoji:'🏠',label:'Back',    phrase:'__nav:home',            color:'bg-gray-800     border-gray-600'  },
  ]},
  medical: { label: 'Medical', emoji: '💊', symbols: [
    { id:'meds',    emoji:'💊', label:'Medicine', phrase:'I need my medicine',       color:'bg-teal-900/40 border-teal-700' },
    { id:'doctor',  emoji:'👨‍⚕️',label:'Doctor',  phrase:'Please call the doctor',   color:'bg-cyan-900/40 border-cyan-700' },
    { id:'nurse2',  emoji:'👩‍⚕️',label:'Nurse',   phrase:'Please call the nurse',    color:'bg-cyan-900/40 border-cyan-700' },
    { id:'iv',      emoji:'💉', label:'IV',       phrase:'My IV is beeping',         color:'bg-amber-900/40 border-amber-700'},
    { id:'turn',    emoji:'🔄', label:'Turn me',  phrase:'Please turn me over',      color:'bg-indigo-900/40 border-indigo-700'},
    { id:'situp',   emoji:'🪑', label:'Sit up',   phrase:'Please help me sit up',    color:'bg-indigo-900/40 border-indigo-700'},
    { id:'pain2',   emoji:'😣', label:'Pain',     phrase:'I am in pain',             color:'bg-red-900/40 border-red-700'   },
    { id:'allergy', emoji:'⚠️', label:'Allergy',  phrase:'I have an allergy',        color:'bg-orange-900/40 border-orange-700'},
    { id:'suction', emoji:'🫁', label:'Suction',  phrase:'I need suction',           color:'bg-gray-800 border-gray-600'   },
    { id:'home_back4',emoji:'🏠',label:'Back',    phrase:'__nav:home',               color:'bg-gray-800 border-gray-600'   },
  ]},
  actions: { label: 'Actions', emoji: '⚡', symbols: [
    { id:'stop',    emoji:'🛑', label:'Stop',     phrase:'Please stop',        color:'bg-red-900/40 border-red-700' },
    { id:'more',    emoji:'➕', label:'More',     phrase:'More please',        color:'bg-emerald-900/40 border-emerald-700' },
    { id:'less',    emoji:'➖', label:'Less',     phrase:'Less please',        color:'bg-amber-900/40 border-amber-700' },
    { id:'wait',    emoji:'⏳', label:'Wait',     phrase:'Please wait',        color:'bg-gray-800 border-gray-600' },
    { id:'repeat',  emoji:'🔁', label:'Repeat',   phrase:'Please say that again',color:'bg-blue-900/40 border-blue-700'},
    { id:'slower',  emoji:'🐢', label:'Slower',   phrase:'Please speak slower',color:'bg-indigo-900/40 border-indigo-700'},
    { id:'home_back5',emoji:'🏠',label:'Back',    phrase:'__nav:home',         color:'bg-gray-800 border-gray-600' },
  ]},
};

export default function SymbolGrid({ onSpeak }: Props) {
  const [page, setPage] = useState<Page>('home');
  const current = PAGES[page];

  function handleSymbol(phrase: string) {
    if (phrase.startsWith('__nav:')) {
      setPage(phrase.replace('__nav:', '') as Page);
    } else {
      onSpeak(phrase);
    }
  }

  return (
    <div className="flex flex-col gap-3">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-xs text-gray-500">
        <span className="text-lg">{current.emoji}</span>
        <span className="font-medium text-gray-300">{current.label}</span>
        {page !== 'home' && (
          <button onClick={() => setPage('home')} className="ml-auto text-cyan-500 hover:text-cyan-400 min-h-[36px] px-2">
            ← Home
          </button>
        )}
      </div>
      {/* Symbol grid */}
      <div className="grid grid-cols-4 gap-2" role="grid" aria-label={`${current.label} symbols`}>
        {current.symbols.map(sym => (
          <button key={sym.id} onClick={() => handleSymbol(sym.phrase)}
            aria-label={sym.label}
            className={`min-h-[64px] flex flex-col items-center justify-center gap-1 rounded-xl border transition-all active:scale-95 ${sym.color}`}>
            <span className="text-2xl" aria-hidden="true">{sym.emoji}</span>
            <span className="text-[11px] text-gray-300 font-medium leading-tight text-center px-1">{sym.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
