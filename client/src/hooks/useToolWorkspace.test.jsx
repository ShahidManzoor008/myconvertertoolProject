import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter, Routes, Route, Link } from 'react-router-dom';
import { expect, test, vi } from 'vitest';
import { useToolWorkspace } from './useToolWorkspace';
import PageNavigation from '../components/PageNavigation';

function Tool() {
  const ref = useToolWorkspace();
  return <div ref={ref} tabIndex={-1} role="region" aria-label="Tool workspace"><textarea aria-label="Input" /><Link to="/">Home</Link><Link to="/tools/pdf-converter">Reopen tool</Link></div>;
}

test('navigation lands at a mounted workspace, focuses the region, and resets other pages', () => {
  const scroll = vi.fn();
  const top = vi.spyOn(window, 'scrollTo').mockImplementation(() => {});
  const old = HTMLElement.prototype.scrollIntoView;
  HTMLElement.prototype.scrollIntoView = scroll;
  try {
    render(<MemoryRouter><PageNavigation /><Routes>
      <Route path="/" element={<Link to="/tools/pdf-converter">Open PDF</Link>} />
      <Route path="/tools/pdf-converter" element={<Tool />} />
    </Routes></MemoryRouter>);
    fireEvent.click(screen.getByText('Open PDF'));
    expect(scroll).toHaveBeenCalledWith({ block: 'start', behavior: 'instant' });
    expect(screen.getByRole('region')).toHaveFocus();
    expect(screen.getByRole('textbox')).not.toHaveFocus();
    fireEvent.click(screen.getByText('Reopen tool'));
    expect(scroll).toHaveBeenCalledTimes(2);
    fireEvent.click(screen.getByText('Home'));
    expect(top).toHaveBeenLastCalledWith({ top: 0, left: 0, behavior: 'instant' });
  } finally {
    HTMLElement.prototype.scrollIntoView = old;
    top.mockRestore();
  }
});
