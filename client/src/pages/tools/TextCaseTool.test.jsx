import { render, screen, fireEvent } from '@testing-library/react';
import { test, expect, vi } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import TextCaseTool from './TextCaseTool';
vi.mock('../../utils/apiClient', () => ({ statsApi: { increment: vi.fn().mockResolvedValue({ success: true }) } }));
test('clipboard denial remains visible after transforming text', async () => {
  Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText: vi.fn().mockRejectedValue(new Error('denied')) } });
  render(<MemoryRouter><HelmetProvider><TextCaseTool /></HelmetProvider></MemoryRouter>);
  fireEvent.change(screen.getByRole('textbox', { name: 'Text input' }), { target: { value: 'HELLO. WORLD!' } });
  fireEvent.click(screen.getByRole('button', { name: /Sentence/ }));
  expect(await screen.findByText('Hello. World!')).toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: 'Copy result' }));
  expect(await screen.findByRole('alert')).toHaveTextContent('Clipboard access blocked');
});
