import { actionFor, HoldDetector } from '../app/lib/gestures';
import { parseBattery, parseGloveEvent } from '../app/lib/glove';
import { nextIndex } from '../app/hooks/useScanner';

describe('camera gestures', () => {
  it('maps only the supported categories', () => {
    expect(actionFor('Thumb_Up')).toBe('yes');
    expect(actionFor('Closed_Fist')).toBeNull();
  });
  it('fires once after a steady hold', () => {
    const h = new HoldDetector(800, 0.6);
    expect(h.update('Thumb_Up', 0.9, 0)).toBeNull();
    expect(h.update('Thumb_Up', 0.9, 500)).toBeNull();
    expect(h.update('Thumb_Up', 0.9, 850)).toBe('Thumb_Up');
    expect(h.update('Thumb_Up', 0.9, 2000)).toBeNull();
  });
  it('restarts when the gesture changes or confidence drops', () => {
    const h = new HoldDetector(800, 0.6);
    h.update('Thumb_Up', 0.9, 0);
    h.update('Thumb_Up', 0.3, 400);
    expect(h.update('Thumb_Up', 0.9, 900)).toBeNull();
    expect(h.update('Thumb_Up', 0.9, 1800)).toBe('Thumb_Up');
  });
  it('ignores None', () => {
    const h = new HoldDetector(100);
    h.update('None', 1, 0);
    expect(h.update('None', 1, 500)).toBeNull();
  });
});

describe('glove protocol', () => {
  it('parses events and rejects junk', () => {
    expect(parseGloveEvent(' yes\n')).toBe('YES');
    expect(parseGloveEvent(new TextEncoder().encode('HELP').buffer)).toBe('HELP');
    expect(parseGloveEvent('DROP TABLE')).toBeNull();
  });
  it('parses battery percent', () => {
    expect(parseBattery('82')).toBe(82);
    expect(parseBattery('140')).toBeNull();
  });
});

describe('scanner', () => {
  it('wraps around', () => {
    expect(nextIndex(-1, 3)).toBe(0);
    expect(nextIndex(2, 3)).toBe(0);
    expect(nextIndex(0, 0)).toBe(-1);
    expect(nextIndex(0, 3, -1)).toBe(2);
    expect(nextIndex(-1, 3, -1)).toBe(2);
  });
});
