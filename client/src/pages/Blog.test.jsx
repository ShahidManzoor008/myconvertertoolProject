import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import { test, beforeEach, afterEach, expect, vi } from 'vitest';
import Blog from './Blog';
import { blogApi, apiClient } from '../utils/apiClient';
vi.mock('../utils/apiClient', () => ({ blogApi: { getPosts: vi.fn() }, apiClient: { get: vi.fn() } }));
const guide = { title: 'A useful PDF guide', slug: 'pdf-guide', excerpt: 'Practical instructions for converting a document.', author: 'Team', createdAt: '2026-11-01', readingTime: 2 };
const setup = () => render(<MemoryRouter><HelmetProvider><Blog /></HelmetProvider></MemoryRouter>);
beforeEach(() => { vi.clearAllMocks(); apiClient.get.mockResolvedValue([{ _id: 'PDF', count: 1 }]); });
afterEach(cleanup);
test('load-more failure preserves the articles already loaded', async () => {
  blogApi.getPosts.mockResolvedValueOnce({ posts: [guide], hasNextPage: true, nextCursor: 'cursor' }).mockRejectedValueOnce(new Error('Network unavailable'));
  setup(); await screen.findByText(guide.title);
  fireEvent.click(screen.getByRole('button', { name: 'Load more guides' }));
  expect(await screen.findByRole('alert')).toHaveTextContent('current results are still here');
  expect(screen.getByText(guide.title)).toBeInTheDocument();
});
test('search and topic filters request server-side matches and can be cleared', async () => {
  blogApi.getPosts.mockResolvedValue({ posts: [guide], hasNextPage: false });
  setup(); await screen.findByText(guide.title);
  fireEvent.change(screen.getByRole('searchbox', { name: 'Search guides' }), { target: { value: 'spreadsheet' } });
  fireEvent.click(screen.getByRole('button', { name: 'Search' }));
  await waitFor(() => expect(blogApi.getPosts).toHaveBeenLastCalledWith(expect.objectContaining({ search: 'spreadsheet' })));
  fireEvent.change(screen.getByRole('combobox', { name: 'Topic' }), { target: { value: 'PDF' } });
  await waitFor(() => expect(blogApi.getPosts).toHaveBeenLastCalledWith(expect.objectContaining({ search: 'spreadsheet', category: 'PDF' })));
  fireEvent.click(screen.getByRole('button', { name: 'Clear filters' }));
  await waitFor(() => expect(screen.getByRole('searchbox')).toHaveValue(''));
});
