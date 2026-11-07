import { afterEach, test, expect, vi } from 'vitest';
import { safeStorage } from './storage';
afterEach(() => vi.unstubAllGlobals());
test('blocked browser storage does not break optional histories or public API access', () => {
  vi.stubGlobal('localStorage', {getItem(){throw new Error('Blocked')},setItem(){throw new Error('Blocked')},removeItem(){throw new Error('Blocked')}});
  expect(safeStorage.getItem('history')).toBeNull();
  expect(safeStorage.setItem('history','[]')).toBe(false);
  expect(safeStorage.removeItem('history')).toBe(false);
});
