import { DEFAULT_SETTINGS, normalizeSettings } from '../app/lib/settings';
import { load, save } from '../app/lib/storage';

describe('settings', () => {
  it('falls back to defaults for garbage', () => {
    expect(normalizeSettings(null)).toEqual(DEFAULT_SETTINGS);
    expect(normalizeSettings('x')).toEqual(DEFAULT_SETTINGS);
  });
  it('clamps numbers and rejects unknown enums', () => {
    const s = normalizeSettings({ scale: 9, dwellMs: -5, lang: 'fr', activation: 'nope', rate: NaN });
    expect(s.scale).toBe(1.6);
    expect(s.dwellMs).toBe(300);
    expect(s.lang).toBe('en');
    expect(s.activation).toBe('release');
    expect(s.rate).toBe(DEFAULT_SETTINGS.rate);
  });
  it('round-trips through storage and survives corrupt JSON', () => {
    save('k', { a: 1 });
    expect(load('k', null)).toEqual({ a: 1 });
    localStorage.setItem('bad', '{not json');
    expect(load('bad', 'fallback')).toBe('fallback');
    expect(load('k', 'v', (x): x is string => typeof x === 'string')).toBe('v');
  });
});
