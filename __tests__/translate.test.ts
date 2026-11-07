import { decide, shouldLearn } from '../app/lib/translate';
import { isProfile, newProfile, type Sign } from '../app/lib/profiles';
import { sensorFaults } from '../app/lib/sensors';

const sign = (o: Partial<Sign>): Sign => ({ id: 's', output: 'water', action: 'say', instant: false, urgent: false, samples: [], createdAt: 0, ...o });
const toks = [{ text: 'my' }, { text: 'daughter' }];

describe('decide', () => {
  it('adds word signs to the sentence and arms auto-speak', () => {
    const d = decide(sign({}), toks);
    expect(d.tokens.map((t) => t.text)).toEqual(['my', 'daughter', 'water']);
    expect(d.effects).toEqual([]);
    expect(d.armAutoSpeak).toBe(true);
  });
  it('speaks instant phrases without touching the sentence', () => {
    const d = decide(sign({ instant: true, output: 'Yes' }), toks);
    expect(d.tokens).toBe(toks);
    expect(d.effects).toEqual([{ kind: 'say', text: 'Yes', urgent: false }]);
  });
  it('speak sign says the whole sentence and clears it', () => {
    const d = decide(sign({ action: 'speak' }), toks);
    expect(d.effects).toEqual([{ kind: 'say', text: 'My daughter', urgent: false }]);
    expect(d.tokens).toEqual([]);
  });
  it('speak sign with an empty sentence says nothing', () => {
    expect(decide(sign({ action: 'speak' }), []).effects).toEqual([]);
  });
  it('delete and clear edit the sentence', () => {
    expect(decide(sign({ action: 'delete' }), toks).tokens.map((t) => t.text)).toEqual(['my']);
    expect(decide(sign({ action: 'clear' }), toks).tokens).toEqual([]);
  });
  it('help raises an urgent message and keeps the sentence', () => {
    const d = decide(sign({ action: 'help', output: 'Help!' }), toks);
    expect(d.effects).toEqual([{ kind: 'say', text: 'Help!', urgent: true }]);
    expect(d.tokens).toBe(toks);
  });
  it('navigation signs drive the boards', () => {
    expect(decide(sign({ action: 'next' }), toks).effects).toEqual([{ kind: 'scan', direction: 1 }]);
    expect(decide(sign({ action: 'select' }), toks).effects).toEqual([{ kind: 'select' }]);
  });
});

describe('shouldLearn', () => {
  it('learns only confident ordinary word signs when enabled', () => {
    expect(shouldLearn(sign({}), 0.8, true)).toBe(true);
    expect(shouldLearn(sign({}), 0.3, true)).toBe(false);
    expect(shouldLearn(sign({}), 0.9, false)).toBe(false);
    expect(shouldLearn(sign({ action: 'help', urgent: true }), 0.9, true)).toBe(false);
    expect(shouldLearn(sign({ action: 'next' }), 0.9, true)).toBe(false);
  });
});

describe('profiles accept navigation signs', () => {
  it('validates next/select actions', () => {
    const p = newProfile('A');
    p.signs.push(sign({ action: 'next' }), sign({ id: 't', action: 'select' }));
    expect(isProfile(p)).toBe(true);
  });
});

describe('sensorFaults', () => {
  it('flags sensors stuck at a rail in both calibration poses', () => {
    expect(sensorFaults({ relaxed: [0, 1200, 3300, 1200, 1200], bent: [10, 2200, 3290, 1200, 3300] })).toEqual([true, false, true, false, false]);
  });
});
