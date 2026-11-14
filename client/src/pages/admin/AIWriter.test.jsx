import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, afterEach, test, expect, vi } from 'vitest';
import AIWriter from './AIWriter';
import GeminiConnection from '../../components/admin/GeminiConnection';
import { apiClient } from '../../utils/apiClient';
vi.mock('../../utils/apiClient', () => ({ apiClient: { get: vi.fn(), post: vi.fn(), put: vi.fn() } }));
const initial = () => ({
  settings: { enabled: false, paused: false, mode: 'draft', articlesPerDay: 1, timezone: 'UTC', hour: 9, topics: 'AI and technology', instructions: 'Keep articles useful.', excludedTopics: '', primaryDomains: ['blog.google'], monthlyRequestLimit: 90, revision: 3 },
  provider: { configured: true, canTest: true, keyConfigured: true, keyFingerprint: 'test1234', model: 'gemini-2.5-flash', revision: 0, requestsEnabled: true, source: 'environment', message: 'Server credentials configured.', billingMode: 'free' },
  serverMonthlyRequestLimit: 90, usage: { requests: 2, tokens: 1234, searches: 1 }, jobs: [],
});
let data;
beforeEach(() => { vi.clearAllMocks(); data = initial(); apiClient.get.mockImplementation(async () => structuredClone(data)); apiClient.post.mockResolvedValue({ message: 'Queued.' }); apiClient.put.mockImplementation(async (_url, input) => { data.settings = { ...input, revision: input.revision + 1 }; }); });
afterEach(cleanup);
const setup = () => render(<MemoryRouter><AIWriter /></MemoryRouter>);

test('saved admin instructions use revision protection and editing them blocks generation until saved', async () => {
  setup(); await screen.findByDisplayValue('Keep articles useful.');
  fireEvent.change(screen.getByLabelText(/Standing instructions/), { target: { value: 'Explain free AI tools for students, without promotional language.' } });
  expect(screen.getByRole('button', { name: 'Generate now' })).toBeDisabled();
  fireEvent.click(screen.getByRole('button', { name: 'Save instructions & settings' }));
  await waitFor(() => expect(apiClient.put).toHaveBeenCalledWith('/api/ai-writer/settings', expect.objectContaining({ instructions: 'Explain free AI tools for students, without promotional language.', revision: 3 })));
  await waitFor(() => expect(screen.getByRole('button', { name: 'Generate now' })).not.toBeDisabled());
});
test('one-time briefs are sent to generation without replacing standing instructions', async () => {
  setup(); await screen.findByDisplayValue('Keep articles useful.');
  fireEvent.change(screen.getByLabelText('One-time article instructions'), { target: { value: 'Cover a recent document AI release.' } });
  fireEvent.click(screen.getByRole('button', { name: 'Generate now' }));
  await waitFor(() => expect(apiClient.post).toHaveBeenCalledWith('/api/ai-writer/generate', { brief: 'Cover a recent document AI release.' }));
  expect(screen.getByLabelText(/Standing instructions/)).toHaveValue('Keep articles useful.');
  expect(apiClient.put).not.toHaveBeenCalled();
});
test('failed settings saves retain instructions and pause is an immediate separate control', async () => {
  apiClient.put.mockRejectedValue(new Error('Settings changed in another tab. Reload before saving.'));
  setup(); await screen.findByDisplayValue('Keep articles useful.');
  fireEvent.change(screen.getByLabelText(/Standing instructions/), { target: { value: 'Keep my unsaved guidance.' } });
  fireEvent.click(screen.getByRole('button', { name: 'Save instructions & settings' }));
  expect(await screen.findByRole('alert')).toHaveTextContent('another tab');
  expect(screen.getByLabelText(/Standing instructions/)).toHaveValue('Keep my unsaved guidance.');
  fireEvent.click(screen.getByRole('button', { name: 'Pause all writing' }));
  await waitFor(() => expect(apiClient.post).toHaveBeenCalledWith('/api/ai-writer/pause', {}));
});
test('provider setup is required before enabling schedule or generating', async () => {
  data.provider.configured = false; setup(); await screen.findByDisplayValue('Keep articles useful.');
  expect(screen.getByLabelText('Enable daily schedule')).toBeDisabled();
  expect(screen.getByRole('button', { name: 'Generate now' })).toBeDisabled();
  expect(screen.getByRole('button', { name: 'Save instructions & settings' })).not.toBeDisabled();
});
test('admin can replace the key securely without seeing or preserving the previous key', async () => {
  apiClient.put.mockImplementation(async (url, input) => { if (url.endsWith('/provider')) data.provider = { ...data.provider, revision: 1, source: 'admin' }; return input; });
  setup(); await screen.findByDisplayValue('Keep articles useful.');
  const key = screen.getByLabelText(/Replace Gemini API key/);
  expect(key).toHaveAttribute('type', 'password'); expect(key).toHaveValue('');
  fireEvent.change(key, { target: { value: 'AIzaSy-my-new-private-key-for-admin1234' } });
  expect(screen.getByRole('button', { name: 'Write test blog' })).toBeDisabled();
  fireEvent.click(screen.getByRole('button', { name: 'Save Gemini connection' }));
  await waitFor(() => expect(apiClient.put).toHaveBeenCalledWith('/api/ai-writer/provider', expect.objectContaining({ apiKey: 'AIzaSy-my-new-private-key-for-admin1234', model: 'gemini-2.5-flash', revision: 0 })));
  await waitFor(() => expect(key).toHaveValue(''));
  expect(JSON.stringify(localStorage)).not.toContain('AIzaSy-my-new-private-key-for-admin1234');
});
test('connection testing shows its result and a one-click test links to a private draft', async () => {
  const id = '111111111111111111111111';
  apiClient.post.mockImplementation(async url => url.endsWith('/provider/test') ? { ok: true, message: 'Connection successful. Google accepted the key.', checkedAt: new Date().toISOString(), latencyMs: 100 } : { id, message: 'Test blog queued.' });
  const completed = { _id: id, state: 'draft', trigger: 'test', createdAt: new Date().toISOString(), reasons: [], usage: { requests: 2, tokens: 1200 }, article: { title: 'An AI test article', slug: 'ai-test-article', status: 'draft', excerpt: 'A useful test article.' } };
  apiClient.get.mockImplementation(async url => {
    if (url.includes('/jobs/')) { data.jobs = [completed]; data.usage = { requests: 4, tokens: 2434 }; return completed; }
    return structuredClone(data);
  });
  setup(); await screen.findByDisplayValue('Keep articles useful.');
  fireEvent.click(screen.getByRole('button', { name: 'Test connection' }));
  expect(await screen.findByText('Connection successful. Google accepted the key.')).toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: 'Write test blog' }));
  await waitFor(() => expect(apiClient.post).toHaveBeenCalledWith('/api/ai-writer/generate-test', { brief: '' }));
  expect(await screen.findByText('Test draft ready')).toBeInTheDocument();
  expect(screen.getByRole('link', { name: 'Open test draft' })).toHaveAttribute('href', '/admin/posts/ai-test-article/edit');
  expect(await screen.findByRole('link', { name: /An AI test article · Edit article/ })).toBeInTheDocument();
  expect(screen.queryByRole('button', { name: 'Cancel run' })).not.toBeInTheDocument();
});
test('failed connection saves retain the new key for retry and do not enable generation', async () => {
  apiClient.put.mockRejectedValue(new Error('Gemini settings changed in another tab. Reload before saving.'));
  setup(); await screen.findByDisplayValue('Keep articles useful.');
  fireEvent.change(screen.getByLabelText(/Replace Gemini API key/), { target: { value: 'AIzaSy-unsaved-private-key-for-retry123' } });
  fireEvent.click(screen.getByRole('button', { name: 'Save Gemini connection' }));
  expect(await screen.findByRole('alert')).toHaveTextContent('another tab');
  expect(screen.getByLabelText(/Replace Gemini API key/)).toHaveValue('AIzaSy-unsaved-private-key-for-retry123');
  expect(screen.getByRole('button', { name: 'Write test blog' })).toBeDisabled();
});
test('editing a connection retains its original revision when another admin changes it', async () => {
  const callbacks = { onChanged: vi.fn(), onDirtyChange: vi.fn(), onBusyChange: vi.fn() };
  const view = render(<GeminiConnection provider={data.provider} {...callbacks} />);
  fireEvent.change(screen.getByLabelText(/Gemini model ID/), { target: { value: 'gemini-2.5-pro' } });
  view.rerender(<GeminiConnection provider={{ ...data.provider, revision: 1, model: 'gemini-3-flash' }} {...callbacks} />);
  fireEvent.click(screen.getByRole('button', { name: 'Save Gemini connection' }));
  await waitFor(() => expect(apiClient.put).toHaveBeenCalledWith('/api/ai-writer/provider', expect.objectContaining({ revision: 0, model: 'gemini-2.5-pro' })));
});
