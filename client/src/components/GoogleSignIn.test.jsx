import { render, screen, waitFor, fireEvent, act, cleanup } from '@testing-library/react';
import GoogleSignIn from './GoogleSignIn';
import { getGoogleClientId } from '../config/auth.config';
import { loadGoogleIdentityScript } from '../utils/googleIdentity';

const { login, navigate } = vi.hoisted(() => ({ login: vi.fn(), navigate: vi.fn() }));
vi.mock('../hooks/useAuth', () => ({ useAuth: () => ({ login }) }));
vi.mock('react-router-dom', () => ({ useNavigate: () => navigate }));
vi.mock('../config/auth.config', () => ({ getGoogleClientId: vi.fn() }));
vi.mock('../utils/googleIdentity', () => ({ loadGoogleIdentityScript: vi.fn() }));
let initialize;
beforeEach(() => {
  vi.clearAllMocks();
  getGoogleClientId.mockResolvedValue('123-test.apps.googleusercontent.com');
  loadGoogleIdentityScript.mockResolvedValue();
  initialize = vi.fn();
  window.google = { accounts: { id: { initialize, renderButton: vi.fn() } } };
});
afterEach(() => { cleanup(); delete window.google; });

test('uses runtime configuration and keeps initialization stable across rerenders', async () => {
  const view = render(<GoogleSignIn />);
  await waitFor(() => expect(initialize).toHaveBeenCalledTimes(1));
  expect(initialize.mock.calls[0][0].client_id).toBe('123-test.apps.googleusercontent.com');
  view.rerender(<GoogleSignIn disabled />);
  expect(initialize).toHaveBeenCalledTimes(1);
});

test('configuration failure is visible and can be retried without initializing undefined credentials', async () => {
  getGoogleClientId.mockRejectedValueOnce(new Error('Google sign-in is temporarily unavailable.'));
  render(<GoogleSignIn />);
  expect(await screen.findByRole('alert')).toHaveTextContent('temporarily unavailable');
  expect(initialize).not.toHaveBeenCalled();
  fireEvent.click(screen.getByRole('button', { name: 'Try again' }));
  await waitFor(() => expect(initialize).toHaveBeenCalledTimes(1));
});

test('script failure is visible and retry initializes the button', async () => {
  loadGoogleIdentityScript.mockRejectedValueOnce(new Error('Could not load Google sign-in.'));
  render(<GoogleSignIn />);
  expect(await screen.findByRole('alert')).toHaveTextContent('Could not load');
  fireEvent.click(screen.getByRole('button', { name: 'Try again' }));
  await waitFor(() => expect(initialize).toHaveBeenCalledTimes(1));
});

test('rejected credentials display an error and do not redirect', async () => {
  login.mockRejectedValueOnce(new Error('Google sign-in failed.'));
  render(<GoogleSignIn />);
  await waitFor(() => expect(initialize).toHaveBeenCalled());
  await act(() => initialize.mock.calls[0][0].callback({ credential: 'google-token' }));
  expect(screen.getByRole('alert')).toHaveTextContent('Google sign-in failed');
  expect(navigate).not.toHaveBeenCalled();
});

test('successful credentials call the latest callback and redirect only after login', async () => {
  login.mockResolvedValueOnce(true);
  const onSuccess = vi.fn();
  const view = render(<GoogleSignIn redirectTo="/" />);
  await waitFor(() => expect(initialize).toHaveBeenCalled());
  view.rerender(<GoogleSignIn redirectTo="/admin/dashboard" onSuccess={onSuccess} />);
  await act(() => initialize.mock.calls[0][0].callback({ credential: 'google-token' }));
  expect(login).toHaveBeenCalledWith({ tokenId: 'google-token' });
  expect(onSuccess).toHaveBeenCalledOnce();
  expect(navigate).toHaveBeenCalledWith('/admin/dashboard');
});
