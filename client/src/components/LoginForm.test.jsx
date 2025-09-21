import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter as Router } from 'react-router-dom';
import { AuthProvider } from '../context/AuthContext';
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
  });

  test('renders login form with email and password fields', () => {
    render(
      <Router>
        <AuthProvider>
          <LoginForm />
        </AuthProvider>
      </Router>
    );

    expect(screen.getByPlaceholderText(/email/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/password/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /login/i })).toBeInTheDocument();
  });

  test('allows typing in email and password fields', () => {
    render(
      <Router>
        <AuthProvider>
          <LoginForm />
        </AuthProvider>
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

    render(
      <Router>
        <AuthProvider>
          <LoginForm />
        </AuthProvider>
      </Router>
    );

    const emailInput = screen.getByPlaceholderText(/email/i);
    const passwordInput = screen.getByPlaceholderText(/password/i);
    const submitButton = screen.getByRole('button', { name: /login/i });

    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    fireEvent.change(passwordInput, { target: { value: 'password123' } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalledTimes(1);
      expect(mockLogin).toHaveBeenCalledWith('test@example.com', 'password123');
    });
  });

  test('displays error message on failed login', async () => {
    mockLogin.mockRejectedValueOnce(new Error('Invalid credentials'));

    render(
      <Router>
        <AuthProvider>
          <LoginForm />
        </AuthProvider>
      </Router>
    );

    const emailInput = screen.getByPlaceholderText(/email/i);
    const passwordInput = screen.getByPlaceholderText(/password/i);
    const submitButton = screen.getByRole('button', { name: /login/i });

    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    fireEvent.change(passwordInput, { target: { value: 'wrongpassword' } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/invalid credentials/i)).toBeInTheDocument();
    });
  });
});
