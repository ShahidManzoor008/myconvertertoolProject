import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import PropTypes from 'prop-types';
import GoogleSignIn from './GoogleSignIn';

const RegisterForm = ({ onSuccess }) => {
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();
  

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(false);
    try {
      await register(form.name, form.email, form.password);
      setSuccess(true);
      if (onSuccess) onSuccess();
      navigate('/');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 max-w-md mx-auto p-4 border rounded bg-white dark:bg-gray-800 dark:border-gray-700 text-gray-900 dark:text-gray-200">
      <h2 className="text-xl font-bold text-gray-900 dark:text-white">Register</h2>
      <input
        type="text"
        name="name"
        placeholder="Name"
        value={form.name}
        onChange={handleChange}
        className="w-full p-2 border rounded form-control text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-700"
        required
        minLength={2}
      />
      <input
        type="email"
        name="email"
        placeholder="Email"
        value={form.email}
        onChange={handleChange}
        className="w-full p-2 border rounded form-control text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-700"
        required
      />
      <input
        type="password"
        name="password"
        placeholder="Password (min 8 chars)"
        value={form.password}
        onChange={handleChange}
        className="w-full p-2 border rounded form-control text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-700"
        required
        minLength={8}
      />
      <button type="submit" className="w-full bg-blue-600 text-white p-2 rounded" disabled={loading}>
        {loading ? 'Registering...' : 'Register'}
      </button>
      <div className="text-center my-2 text-gray-600 dark:text-gray-400">or</div>
      <div className="max-w-md mx-auto">
        <GoogleSignIn redirectTo="/" buttonText="Continue with Google" />
      </div>
      {error && <div className="text-red-600">{error}</div>}
      {success && <div className="text-green-600">Registration successful! You can now log in.</div>}
      <div className="text-center">
        <Link to="/login" className="text-blue-600 dark:text-blue-400 hover:underline">
          Already have an account? Log in
        </Link>
      </div>
    </form>
  );
};

RegisterForm.propTypes = {
  onSuccess: PropTypes.func,
};

export default RegisterForm;
