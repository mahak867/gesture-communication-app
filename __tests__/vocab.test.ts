import { BOARDS, painSentence, QUICK } from '../app/lib/vocab';
import { buildPrompt, parseSuggestions } from '../app/lib/suggest';

describe('vocabulary', () => {
  it('has unique ids and both languages everywhere', () => {
    const all = [...BOARDS.flatMap((b) => b.phrases), ...Object.values(QUICK)];
    expect(new Set(all.map((p) => p.id)).size).toBe(all.length);
    all.forEach((p) => { expect(p.text.en).toBeTruthy(); expect(p.text.hi).toBeTruthy(); });
  });
  it('builds pain sentences and flags severe pain', () => {
    expect(painSentence('en', 8, 'chest')).toEqual({ text: 'I have very bad pain in my chest (8/10)', urgent: true });
    expect(painSentence('hi', 2).urgent).toBe(false);
    expect(painSentence('hi', 4, 'head').text).toContain('सिर');
  });
});

describe('AI suggestions', () => {
  it('quotes and truncates user text', () => {
    const p = buildPrompt('say "hi"'.repeat(100), 'en');
    expect(p).not.toContain('"hi"');
    expect(p.length).toBeLessThan(900);
  });
  it('cleans model output', () => {
    expect(parseSuggestions('1. I want water\n2) I want water\n- "Call my son"\n\nok')).toEqual(['I want water', 'Call my son']);
  });
});
