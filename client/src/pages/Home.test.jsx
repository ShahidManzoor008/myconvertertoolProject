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
  const actionLinkCount = primaryTools.reduce((total, tool) => total + tool.actions.length, 0);
  expect(directory.compareDocumentPosition(categories) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  expect(within(directory).getAllByRole('link')).toHaveLength(actionLinkCount);
  expect(within(directory).getByRole('link', { name: /Excel → PDF/ })).toHaveAttribute('href', '/tools/excel-pdf?mode=excel-to-pdf');
  expect(within(directory).getByRole('link', { name: /PDF → Excel/ })).toHaveAttribute('href', '/tools/excel-pdf?mode=pdf-to-excel');
  fireEvent.change(screen.getByRole('searchbox'), { target: { value: 'markdown' } });
  const markdownActionCount = primaryTools
    .filter(tool => [tool.name, tool.category, tool.description, ...(tool.keywords || [])].join(' ').toLowerCase().includes('markdown'))
    .reduce((total, tool) => total + tool.actions.length, 0);
  expect(within(directory).getAllByRole('link')).toHaveLength(markdownActionCount);
  expect(within(directory).getByRole('link', { name: /Paste Markdown → DOCX/ })).toHaveAttribute('href', '/tools/markdown-to-docx?mode=paste');
  expect(within(directory).getByRole('link', { name: /Upload .md → DOCX/ })).toHaveAttribute('href', '/tools/markdown-to-docx?mode=upload');
  fireEvent.click(screen.getByRole('button', { name: 'Developer' }));
  expect(screen.getByText('No tools match your search')).toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: /Clear filters/ }));
  expect(within(directory).getAllByRole('link')).toHaveLength(actionLinkCount);
  await screen.findByText('Tips & practical guides');
});
