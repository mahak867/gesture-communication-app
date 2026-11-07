import { isProfile, newProfile, sentenceText } from '../app/lib/profiles';
import { parseBattery } from '../app/lib/glove';
import { activeFingers, features, DEFAULT_CALIBRATION } from '../app/lib/sensors';

describe('profiles', () => {
  it('validates stored and imported profiles', () => {
    const p = newProfile('Asha');
    expect(isProfile(p)).toBe(true);
    expect(isProfile({ ...p, signs: [{ id: 'x', output: 'hi', action: 'hack', instant: true, urgent: false, samples: [] }] })).toBe(false);
    expect(isProfile({ ...p, rest: [1, 2] })).toBe(false);
    expect(isProfile(null)).toBe(false);
  });
  it('builds readable sentences', () => {
    expect(sentenceText([{ text: 'water' }, { text: 'please' }])).toBe('Water please');
    expect(sentenceText([{ text: 'where' }, { text: '?' }])).toBe('Where?');
    expect(sentenceText([])).toBe('');
  });
});

describe('sensors', () => {
  it('ignores fingers that barely move', () => {
    const cal = { relaxed: [1000, 1000, 1000, 1000, 1000], bent: [2000, 1050, 2000, 2000, 2000] };
    expect(activeFingers(cal)).toEqual([true, false, true, true, true]);
    const f = features({ flex: [1500, 1050, 1000, 2000, 1000], accel: [0, 0, 1], gyro: [0, 0, 0], button: false, seq: 0 }, cal);
    expect(f[0]).toBeCloseTo(0.5);
    expect(f[1]).toBe(0);
    expect(f[3]).toBeCloseTo(1);
    expect(f[7]).toBeCloseTo(1);
  });
  it('works whichever way the divider voltage moves', () => {
    const cal = { relaxed: [2000, ...DEFAULT_CALIBRATION.relaxed.slice(1)], bent: [1000, ...DEFAULT_CALIBRATION.bent.slice(1)] };
    const f = features({ flex: [1250, 1200, 1200, 1200, 1200], accel: [0, 0, 1], gyro: [0, 0, 0], button: false, seq: 0 }, cal);
    expect(f[0]).toBeCloseTo(0.75);
  });
  it('parses battery', () => {
    expect(parseBattery('82')).toBe(82);
    expect(parseBattery('140')).toBeNull();
  });
});
