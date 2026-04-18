import { describe, it, expect } from 'vitest';
import { sentenceReducer } from '../app/lib/sentenceReducer';
import type { SentenceState } from '../app/lib/sentenceReducer';

const empty: SentenceState = { current: '', history: [] };

describe('sentenceReducer', () => {
  describe('append', () => {
    it('appends a character to the current sentence', () => {
      const next = sentenceReducer(empty, { type: 'append', char: 'H' });
      expect(next.current).toBe('H');
    });

    it('pushes the previous value into history', () => {
      const state: SentenceState = { current: 'Hi', history: [] };
      const next = sentenceReducer(state, { type: 'append', char: '!' });
      expect(next.history).toEqual(['Hi']);
      expect(next.current).toBe('Hi!');
    });

    it('keeps at most 30 history entries', () => {
      let state: SentenceState = { current: '', history: Array(30).fill('x') };
      state = sentenceReducer(state, { type: 'append', char: 'A' });
      expect(state.history).toHaveLength(30);
    });
  });

  describe('space', () => {
    it('appends a space to the sentence', () => {
      const state: SentenceState = { current: 'Hello', history: [] };
      const next = sentenceReducer(state, { type: 'space' });
      expect(next.current).toBe('Hello ');
    });

    it('does not add a second space when sentence already ends with one', () => {
      const state: SentenceState = { current: 'Hello ', history: [] };
      const next = sentenceReducer(state, { type: 'space' });
      expect(next).toBe(state); // same reference — no change
    });
  });

  describe('backspace', () => {
    it('removes the last character', () => {
      const state: SentenceState = { current: 'Hi', history: [] };
      const next = sentenceReducer(state, { type: 'backspace' });
      expect(next.current).toBe('H');
    });

    it('is a no-op on an empty sentence', () => {
      const next = sentenceReducer(empty, { type: 'backspace' });
      expect(next).toBe(empty);
    });
  });

  describe('clear', () => {
    it('resets the current sentence to empty', () => {
      const state: SentenceState = { current: 'Hello world', history: [] };
      const next = sentenceReducer(state, { type: 'clear' });
      expect(next.current).toBe('');
      expect(next.history).toEqual(['Hello world']);
    });

    it('is a no-op when already empty', () => {
      const next = sentenceReducer(empty, { type: 'clear' });
      expect(next).toBe(empty);
    });
  });

  describe('undo', () => {
    it('restores the previous sentence from history', () => {
      const state: SentenceState = { current: 'Hi!', history: ['Hi'] };
      const next = sentenceReducer(state, { type: 'undo' });
      expect(next.current).toBe('Hi');
      expect(next.history).toEqual([]);
    });

    it('is a no-op when history is empty', () => {
      const next = sentenceReducer(empty, { type: 'undo' });
      expect(next).toBe(empty);
    });

    it('multiple undos walk back through history', () => {
      let state: SentenceState = { current: '', history: [] };
      state = sentenceReducer(state, { type: 'append', char: 'A' });
      state = sentenceReducer(state, { type: 'append', char: 'B' });
      state = sentenceReducer(state, { type: 'append', char: 'C' });
      expect(state.current).toBe('ABC');

      state = sentenceReducer(state, { type: 'undo' });
      expect(state.current).toBe('AB');
      state = sentenceReducer(state, { type: 'undo' });
      expect(state.current).toBe('A');
      state = sentenceReducer(state, { type: 'undo' });
      expect(state.current).toBe('');
    });
  });
});
