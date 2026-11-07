import { applySuggestion, currentFragment, learn, predict } from '../app/lib/prediction';

describe('prediction', () => {
  it('finds the fragment being typed', () => {
    expect(currentFragment('i want wa')).toBe('wa');
    expect(currentFragment('i want ')).toBe('');
  });
  it('suggests words starting with the fragment', () => {
    const s = predict('i want wa', {});
    expect(s).toContain('water');
    s.forEach((w) => expect(w.startsWith('wa')).toBe(true));
  });
  it('ranks learned words first', () => {
    expect(predict('m', { mango: 50 })[0]).toBe('mango');
  });
  it('replaces the fragment with the suggestion', () => {
    expect(applySuggestion('i want wa', 'water')).toBe('i want water ');
    expect(applySuggestion('i ', 'need')).toBe('i need ');
  });
  it('learns words and caps the dictionary size', () => {
    const l = learn({}, 'Call my Daughter please, call');
    expect(l.call).toBe(2);
    expect(l.daughter).toBe(1);
    const many = Object.fromEntries(Array.from({ length: 20 }, (_, i) => [`w${i}`, i]));
    expect(Object.keys(learn(many, 'zz', 10)).length).toBe(10);
  });
  it('handles Hindi text', () => {
    expect(learn({}, 'मुझे पानी चाहिए')['पानी']).toBe(1);
    expect(currentFragment('मुझे पा')).toBe('पा');
  });
});
