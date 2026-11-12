import { cleanup } from '@testing-library/react';
let loadGoogleIdentityScript;
beforeEach(async () => {
  vi.resetModules();
  vi.useFakeTimers();
  delete window.google;
  ({ loadGoogleIdentityScript } = await import('./googleIdentity'));
});
afterEach(() => {
  document.querySelectorAll('script[data-google-identity]').forEach(script => script.remove());
  delete window.google;
  vi.useRealTimers();
  cleanup();
});

test('concurrent mounts share one SDK request and resolve after the SDK is ready', async () => {
  const first = loadGoogleIdentityScript();
  expect(loadGoogleIdentityScript()).toBe(first);
  expect(document.querySelectorAll('script[data-google-identity]')).toHaveLength(1);
  window.google = { accounts: { id: {} } };
  document.querySelector('script[data-google-identity]').dispatchEvent(new Event('load'));
  await expect(first).resolves.toBeUndefined();
});

test('failed SDK requests are removed and a new attempt can succeed', async () => {
  const first = loadGoogleIdentityScript();
  const rejected = expect(first).rejects.toThrow('Could not load');
  document.querySelector('script[data-google-identity]').dispatchEvent(new Event('error'));
  await rejected;
  expect(document.querySelector('script[data-google-identity]')).toBeNull();
  const second = loadGoogleIdentityScript();
  window.google = { accounts: { id: {} } };
  document.querySelector('script[data-google-identity]').dispatchEvent(new Event('load'));
  await expect(second).resolves.toBeUndefined();
});

test('blocked SDK requests time out with a retryable error', async () => {
  const result = loadGoogleIdentityScript();
  const rejected = expect(result).rejects.toThrow('Could not load');
  await vi.advanceTimersByTimeAsync(15000);
  await rejected;
  expect(document.querySelector('script[data-google-identity]')).toBeNull();
});
