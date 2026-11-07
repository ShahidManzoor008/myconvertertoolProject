import { render, screen, fireEvent } from '@testing-library/react';
import { test, expect } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import JsonFormatter from './JsonFormatter';
test('analysis counts user values and each inconsistent array once while preserving large numbers', async () => {
  render(<MemoryRouter><HelmetProvider><JsonFormatter /></HelmetProvider></MemoryRouter>);
  fireEvent.change(screen.getByRole('textbox', { name: 'JSON input' }), { target: { value: '{"snake_one":900719925474099312345,"snake_two":[1,"two"]}' } });
  fireEvent.click(screen.getByRole('button', { name: /Format Code/ }));
  expect(await screen.findByText(/900719925474099312345/, { selector: 'pre' })).toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: /analyze/i }));
  expect(await screen.findByText('100% consistent (snakeCase convention)')).toBeInTheDocument();
  expect(screen.getByText('Found 1 arrays with inconsistent items')).toBeInTheDocument();
  expect(screen.getByText('Numbers').previousElementSibling).toHaveTextContent('2');
  expect(screen.getByText('Objects').previousElementSibling).toHaveTextContent('1');
});
