// app/lib/sentenceReducer.ts
// Pure reducer for the sentence builder with undo history.

export interface SentenceState {
  current: string;
  history: string[];
}

export type SentenceAction =
  | { type: 'append'; char: string }
  | { type: 'space' }
  | { type: 'backspace' }
  | { type: 'clear' }
  | { type: 'undo' };

export function sentenceReducer(state: SentenceState, action: SentenceAction): SentenceState {
  const pushHistory = () => [...state.history.slice(-29), state.current];
  switch (action.type) {
    case 'append':
      return { current: state.current + action.char, history: pushHistory() };
    case 'space':
      if (state.current.endsWith(' ')) return state;
      return { current: state.current + ' ', history: pushHistory() };
    case 'backspace':
      if (state.current.length === 0) return state;
      return { current: state.current.slice(0, -1), history: pushHistory() };
    case 'clear':
      if (state.current === '') return state;
      return { current: '', history: pushHistory() };
    case 'undo':
      if (state.history.length === 0) return state;
      return {
        current: state.history[state.history.length - 1],
        history: state.history.slice(0, -1),
      };
  }
}
