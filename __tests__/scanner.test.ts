import { nextIndex } from '../app/hooks/useScanner';
it('scanner wraps both ways', () => {
  expect(nextIndex(-1, 3)).toBe(0);
  expect(nextIndex(2, 3)).toBe(0);
  expect(nextIndex(0, 3, -1)).toBe(2);
  expect(nextIndex(0, 0)).toBe(-1);
});
