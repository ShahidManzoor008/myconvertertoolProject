import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { beforeEach, afterEach, test, expect, vi } from 'vitest';
import EditBlogPost from './EditBlogPost';
import { apiClient } from '../../utils/apiClient';
vi.mock('../../hooks/useAuth', () => ({ useAuth: () => ({ user: { _id: 'editor-admin', name: 'Editor Admin' } }) }));
vi.mock('../../utils/apiClient', () => ({ apiClient: { get: vi.fn(), post: vi.fn(), put: vi.fn() }, blogApi: { uploadImage: vi.fn() } }));
const article = { title: 'Saved article', content: '## A section\n\nThis is a useful article with enough text for publication.', contentFormat: 'markdown', status: 'draft', author: 'Editor Admin', category: 'Developer', excerpt: '', tags: [], coverImage: '', coverThumbnail: '', coverAlt: '', revision: 3, slug: 'saved-article' };
const setup = (path = '/admin/posts/new') => render(<MemoryRouter initialEntries={[path]}><Routes><Route path="/admin/posts/new" element={<EditBlogPost />} /><Route path="/admin/posts/:slug/edit" element={<EditBlogPost />} /><Route path="/admin/posts" element={<h1>Article management</h1>} /></Routes></MemoryRouter>);
beforeEach(() => {
  vi.clearAllMocks(); sessionStorage.clear();
  apiClient.get.mockResolvedValue(article);
  apiClient.post.mockImplementation(async (path, data) => path === '/api/blog/preview' ? { html: '<h2>A section</h2><p>Preview body.</p>', readingTime: 1 } : { ...article, ...data, revision: 1 });
});
afterEach(cleanup);

test('new article uses Markdown and saves the full publishing details as a private draft', async () => {
  setup(); await waitFor(() => expect(screen.getByRole('button', { name: 'Save draft' })).not.toBeDisabled());
  fireEvent.change(screen.getByLabelText('Article title'), { target: { value: 'My new guide' } });
  fireEvent.change(screen.getByLabelText('Markdown'), { target: { value: '## Getting started\n\nA useful explanation of this workflow.' } });
  fireEvent.change(screen.getByLabelText('Tags'), { target: { value: 'PDF, guides' } });
  fireEvent.click(screen.getByRole('button', { name: 'Save draft' }));
  await waitFor(() => expect(apiClient.post).toHaveBeenCalledWith('/api/blog/posts', expect.objectContaining({ title: 'My new guide', contentFormat: 'markdown', status: 'draft', tags: 'PDF, guides' })));
});
test('failed saves keep all text visible and unsaved navigation is protected', async () => {
  apiClient.put.mockRejectedValue(new Error('This article changed in another tab. Reload it before saving.'));
  setup('/admin/posts/saved-article/edit'); await screen.findByDisplayValue(article.title);
  fireEvent.change(screen.getByLabelText('Markdown'), { target: { value: '## My unsaved work\n\nKeep this text on screen.' } });
  const unload = new Event('beforeunload', { cancelable: true }); window.dispatchEvent(unload); expect(unload.defaultPrevented).toBe(true);
  fireEvent.click(screen.getByRole('button', { name: 'Save draft' }));
  expect(await screen.findByRole('alert')).toHaveTextContent('changed in another tab');
  expect(screen.getByLabelText('Markdown')).toHaveValue('## My unsaved work\n\nKeep this text on screen.');
  expect(apiClient.put).toHaveBeenCalledWith('/api/blog/posts/saved-article', expect.objectContaining({ revision: 3 }));
});
test('preview comes from the server renderer and does not replace the Markdown source', async () => {
  setup('/admin/posts/saved-article/edit'); await screen.findByDisplayValue(article.title);
  expect(await screen.findByText('Preview body.', {}, { timeout: 6000 })).toBeInTheDocument();
  expect(apiClient.post).toHaveBeenCalledWith('/api/blog/preview', { content: article.content, contentFormat: 'markdown' }, expect.objectContaining({ signal: expect.any(AbortSignal) }));
  expect(screen.getByLabelText('Markdown')).toHaveValue(article.content);
});
