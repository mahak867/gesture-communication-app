// Offline word prediction: a small base lexicon of words common in care
// settings, boosted by words the user has actually typed before.
// Pure functions — the caller owns persistence.

const BASE_WORDS = `
i you me my we it is am are was not no yes please thank thanks help want need
can can't don't do have feel feeling pain hurt hurts sore water drink food eat hungry
thirsty toilet bathroom nurse doctor family mother father wife husband son daughter
friend call come here now later wait stop again more less tired sleep cold hot
scared afraid sick dizzy breathe breathing chest head stomach back leg arm throat
mouth tube medicine bed move turn sit up down left right light tv phone glasses
home when what where why how long today tomorrow night morning okay good bad better
worse very little bit itchy blanket pillow window door open close quiet loud talk
understand know think love miss sorry hello goodbye pray music
`
  .trim()
  .split(/\s+/);

export type Learned = Record<string, number>;

const WORD_RE = /[\p{L}\p{M}\p{N}'’]+/gu;

/** Return the partial word being typed at the end of the text ('' after a space). */
export function currentFragment(text: string): string {
  const m = /[\p{L}\p{M}\p{N}'’]+$/u.exec(text);
  return m ? m[0] : '';
}

/** Up to `limit` suggestions for the fragment at the end of `text`. */
export function predict(text: string, learned: Learned, limit = 4): string[] {
  const frag = currentFragment(text).toLowerCase();
  const scores = new Map<string, number>();
  BASE_WORDS.forEach((w, i) => scores.set(w, 1 - i / (BASE_WORDS.length * 2)));
  for (const [w, n] of Object.entries(learned)) scores.set(w, (scores.get(w) ?? 0) + n);

  return [...scores.entries()]
    .filter(([w]) => (frag ? w.startsWith(frag) && w !== frag : true))
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([w]) => w);
}

/** Replace the fragment at the end of `text` with `word` and add a space. */
export function applySuggestion(text: string, word: string): string {
  const frag = currentFragment(text);
  return text.slice(0, text.length - frag.length) + word + ' ';
}

/** Count words from a spoken sentence so future predictions favour them. */
export function learn(learned: Learned, sentence: string, cap = 500): Learned {
  const next = { ...learned };
  for (const w of sentence.toLowerCase().match(WORD_RE) ?? []) {
    if (w.length < 2) continue;
    next[w] = (next[w] ?? 0) + 1;
  }
  const keys = Object.keys(next);
  if (keys.length > cap) {
    keys
      .sort((a, b) => next[a] - next[b])
      .slice(0, keys.length - cap)
      .forEach((k) => delete next[k]);
  }
  return next;
}
