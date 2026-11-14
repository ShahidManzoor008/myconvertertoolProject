import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';
import RegisterForm from './RegisterForm';

const { register } = vi.hoisted(() => ({ register: vi.fn() }));
vi.mock('../hooks/useAuth', () => ({ useAuth: () => ({ register }) }));
vi.mock('./GoogleSignIn', () => ({ default: () => null }));
beforeEach(() => vi.clearAllMocks());
afterEach(cleanup);

function setup() {
  const onSuccess = vi.fn();
  render(<MemoryRouter initialEntries={['/register']}><Routes>
    <Route path="/register" element={<RegisterForm onSuccess={onSuccess} />} />
    <Route path="/" element={<h1>Registration complete</h1>} />
  </Routes></MemoryRouter>);
  fireEvent.change(screen.getByLabelText('Full Name'), { target: { value: 'Test User' } });
  fireEvent.change(screen.getByLabelText('Email Address'), { target: { value: 'test@example.com' } });
  fireEvent.change(screen.getByLabelText('Secure Password'), { target: { value: 'StrongPassword123!' } });
  return onSuccess;
}

test('a rejected registration stays on the form and explains the failure', async () => {
  register.mockResolvedValue(false);
  const onSuccess = setup();
  fireEvent.click(screen.getByRole('button', { name: /Get Started for Free/ }));
  expect(await screen.findByRole('alert')).toHaveTextContent('could not create your account');
  expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Create Account');
  expect(onSuccess).not.toHaveBeenCalled();
  expect(screen.queryByText('Account created successfully!')).not.toBeInTheDocument();
});

test('successful registration invokes the callback and continues to the homepage', async () => {
  register.mockResolvedValue(true);
  const onSuccess = setup();
  expect(screen.getByLabelText('Secure Password')).toHaveAttribute('autocomplete', 'new-password');
  fireEvent.click(screen.getByRole('button', { name: /Get Started for Free/ }));
  await screen.findByRole('heading', { name: 'Registration complete' });
  expect(onSuccess).toHaveBeenCalledTimes(1);
  expect(register).toHaveBeenCalledWith('Test User', 'test@example.com', 'StrongPassword123!');
});
