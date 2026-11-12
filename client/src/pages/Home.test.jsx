import { render, screen, fireEvent, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import { expect, test, vi } from 'vitest';
import Home from './Home';
import { primaryTools } from '../data/tools';
vi.mock('../utils/apiClient', () => ({ blogApi: { getPosts: vi.fn().mockResolvedValue({ posts: [] }) } }));

test('the full searchable toolkit comes before categories and filters can be cleared', async () => {
  render(<MemoryRouter><HelmetProvider><Home /></HelmetProvider></MemoryRouter>);
  const directory = screen.getByRole('region', { name: 'Find the right tool' });
  const categories = screen.getByRole('region', { name: 'Explore by category' });
  expect(directory.compareDocumentPosition(categories) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  expect(within(directory).getAllByRole('link')).toHaveLength(primaryTools.length);
  fireEvent.change(screen.getByRole('searchbox'), { target: { value: 'markdown' } });
  expect(within(directory).getAllByRole('link')).toHaveLength(1);
  expect(within(directory).getByRole('link', { name: /Markdown to DOCX/ })).toHaveAttribute('href', '/tools/markdown-to-docx');
  fireEvent.click(screen.getByRole('button', { name: 'Developer' }));
  expect(screen.getByText('No tools match your search')).toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: /Clear filters/ }));
  expect(within(directory).getAllByRole('link')).toHaveLength(primaryTools.length);
  await screen.findByText('Tips & practical guides');
});
