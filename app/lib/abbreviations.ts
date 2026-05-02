// app/lib/abbreviations.ts — Abbreviation expansion for faster AAC input
// Common shortcuts mute users type that expand to full phrases
// SLPs can customise per patient

export interface Abbreviation { short: string; expansion: string; }

export const DEFAULT_ABBREVIATIONS: Abbreviation[] = [
  // Emergency
  { short:'hlp',   expansion:'Help me please' },
  { short:'sos',   expansion:'Emergency please help me now' },
  { short:'911',   expansion:'Call emergency services now' },
  { short:'nrs',   expansion:'Please call the nurse' },
  { short:'doc',   expansion:'Please call the doctor' },
  // Pain
  { short:'pn',    expansion:'I am in pain' },
  { short:'hp',    expansion:'My head hurts' },
  { short:'cp',    expansion:'My chest hurts' },
  { short:'bp',    expansion:'My back hurts' },
  { short:'sp',    expansion:'My stomach hurts' },
  // Needs
  { short:'wtr',   expansion:'Water please' },
  { short:'fd',    expansion:'I am hungry, food please' },
  { short:'bthr',  expansion:'I need to use the bathroom' },
  { short:'slp',   expansion:'I want to sleep' },
  { short:'meds',  expansion:'I need my medication' },
  { short:'cld',   expansion:'I am cold, can I have a blanket' },
  { short:'hot',   expansion:'I am too hot' },
  // Responses
  { short:'y',     expansion:'Yes' },
  { short:'n',     expansion:'No' },
  { short:'mb',    expansion:'Maybe, I am not sure' },
  { short:'ok',    expansion:'I am okay, thank you' },
  { short:'ty',    expansion:'Thank you' },
  { short:'sry',   expansion:'I am sorry' },
  { short:'plz',   expansion:'Please' },
  { short:'idk',   expansion:'I do not know' },
  // Medical
  { short:'nv',    expansion:'I feel nauseous' },
  { short:'dzy',   expansion:'I feel dizzy' },
  { short:'br',    expansion:'I cannot breathe well' },
  { short:'alg',   expansion:'I have an allergy' },
  { short:'iv',    expansion:'My IV is beeping' },
  { short:'stn',   expansion:'I need suction' },
  { short:'trn',   expansion:'Please turn me over' },
  { short:'sup',   expansion:'Please help me sit up' },
  // Family
  { short:'fam',   expansion:'I want to see my family' },
  { short:'hm',    expansion:'I want to go home' },
  { short:'ily',   expansion:'I love you' },
  { short:'ms',    expansion:'I miss you' },
];

const ABBREV_KEY = 'gesturetalk-abbreviations';

export function loadAbbreviations(): Abbreviation[] {
  try {
    const raw     = localStorage.getItem(ABBREV_KEY);
    const custom  = raw ? (JSON.parse(raw) as Abbreviation[]) : [];
    const customs = new Set(custom.map(a => a.short));
    // Custom overrides defaults with same key
    return [...DEFAULT_ABBREVIATIONS.filter(a => !customs.has(a.short)), ...custom];
  } catch { return DEFAULT_ABBREVIATIONS; }
}

export function saveAbbreviations(abbrevs: Abbreviation[]): void {
  // Only save customisations (not defaults)
  const custom = abbrevs.filter(a =>
    !DEFAULT_ABBREVIATIONS.some(d => d.short === a.short && d.expansion === a.expansion)
  );
  try { localStorage.setItem(ABBREV_KEY, JSON.stringify(custom)); } catch { /* ignore */ }
}

export function expandAbbreviation(input: string, abbrevs: Abbreviation[]): string {
  const trimmed = input.trim().toLowerCase();
  const match   = abbrevs.find(a => a.short === trimmed);
  return match ? match.expansion : input;
}

export function checkForAbbreviation(text: string, abbrevs: Abbreviation[]): string | null {
  // Check if the last word typed matches an abbreviation
  const words = text.trim().split(/\s+/);
  const last  = words[words.length - 1]?.toLowerCase();
  if (!last) return null;
  const match = abbrevs.find(a => a.short === last);
  if (!match) return null;
  return words.slice(0, -1).concat(match.expansion).join(' ');
}
