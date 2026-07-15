import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import MinifyBeautifyTool from './MinifyBeautifyTool';
import { HelmetProvider } from 'react-helmet-async';
import { MemoryRouter } from 'react-router-dom';

// Mock dependencies
vi.mock('js-beautify', () => ({
  js: (code) => code,
  css: (code) => code,
  html: (code) => code,
}));

describe('MinifyBeautifyTool', () => {
  it('renders correctly', () => {
    render(
      <MemoryRouter>
        <HelmetProvider>
          <MinifyBeautifyTool />
        </HelmetProvider>
      </MemoryRouter>
    );
    expect(screen.getByRole('button', { name: /Beautify Code/i })).toBeInTheDocument();
  });
});
