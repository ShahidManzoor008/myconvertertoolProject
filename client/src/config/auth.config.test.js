import { getGoogleClientId } from './auth.config';
import { authApi } from '../utils/apiClient';
vi.mock('../utils/apiClient', () => ({ authApi: { getConfig: vi.fn() } }));
test('rejects missing and malformed runtime client IDs', async () => {
  for (const googleClientId of [undefined, '', 'your-google-client-id']) {
    authApi.getConfig.mockResolvedValueOnce({ googleClientId });
    await expect(getGoogleClientId()).rejects.toThrow('temporarily unavailable');
  }
});
test('returns the server client ID without a frontend build variable', async () => {
  authApi.getConfig.mockResolvedValueOnce({ googleClientId: '123-test.apps.googleusercontent.com' });
  await expect(getGoogleClientId()).resolves.toBe('123-test.apps.googleusercontent.com');
});
