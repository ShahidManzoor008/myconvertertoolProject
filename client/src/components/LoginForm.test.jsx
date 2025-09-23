import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter as Router } from 'react-router-dom';
import LoginForm from './LoginForm';
import { vi } from 'vitest';

// Mock the useAuth hook
const mockLogin = vi.fn();
vi.mock('../context/useAuth', () => ({
  useAuth: () => ({
    login: mockLogin,
    user: null,
    isAuthenticated: false,
  }),
}));

describe('LoginForm', () => {
  beforeEach(() => {
    mockLogin.mockClear();
    // Reset fetch mock between tests
    try {
      vi.unstubAllGlobals();
    } catch {
      // ignore when no globals were stubbed
    }
  });

  test('renders login form with email and password fields', () => {
    render(
      <Router>
        <LoginForm />
      </Router>
    );

    expect(screen.getByPlaceholderText(/email/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/password/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /login/i })).toBeInTheDocument();
  });

  test('allows typing in email and password fields', () => {
    render(
      <Router>
        <LoginForm />
      </Router>
    );

    const emailInput = screen.getByPlaceholderText(/email/i);
    const passwordInput = screen.getByPlaceholderText(/password/i);

    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    fireEvent.change(passwordInput, { target: { value: 'password123' } });

    expect(emailInput.value).toBe('test@example.com');
    expect(passwordInput.value).toBe('password123');
  });

  test('calls login function with correct credentials on submission', async () => {
    mockLogin.mockResolvedValueOnce({ success: true });

    // Mock successful /api/auth/login response
    vi.stubGlobal('fetch', vi.fn(() => Promise.resolve({
      ok: true,
      json: async () => ({ token: 'abc123', user: { id: '1', role: 'user' } })
    })));

    render(
      <Router>
        <LoginForm />
      </Router>
    );

    const emailInput = screen.getByPlaceholderText(/email/i);
    const passwordInput = screen.getByPlaceholderText(/password/i);
    const submitButton = screen.getByRole('button', { name: /login/i });

    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
  fireEvent.change(passwordInput, { target: { value: 'Password123' } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalledTimes(1);
      // Login is called with the server response data (token + user)
      expect(mockLogin).toHaveBeenCalledWith({ token: 'abc123', user: { id: '1', role: 'user' } });
    });
  });

  test('displays error message on failed login', async () => {
    mockLogin.mockRejectedValueOnce(new Error('Invalid credentials'));

    // Mock failed /api/auth/login response
    vi.stubGlobal('fetch', vi.fn(() => Promise.resolve({
      ok: false,
      status: 401,
      json: async () => ({ message: 'Invalid credentials', code: 'invalid_credentials' })
    })));

    render(
      <Router>
        <LoginForm />
      </Router>
    );

    const emailInput = screen.getByPlaceholderText(/email/i);
    const passwordInput = screen.getByPlaceholderText(/password/i);
    const submitButton = screen.getByRole('button', { name: /login/i });

    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
  fireEvent.change(passwordInput, { target: { value: 'Wrongpass1' } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/invalid email or password/i)).toBeInTheDocument();
    });
  });
});
