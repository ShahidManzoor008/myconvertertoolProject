import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { motion } from 'framer-motion';
import PropTypes from 'prop-types';
import GoogleSignIn from './GoogleSignIn';
import LoadingSpinner from './LoadingSpinner';

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
    <div className="w-full max-w-md mx-auto">
      <form 
        onSubmit={handleSubmit} 
        className="glass-card p-1 overflow-hidden"
      >
        <div className="bg-white dark:bg-slate-900 rounded-[2rem] p-8 sm:p-10 shadow-inner">
          <div className="text-center mb-10">
            <div className="w-16 h-16 rounded-2xl bg-indigo-600 flex items-center justify-center text-white shadow-lg mx-auto mb-6">
              <span className="material-icons text-3xl">person_add</span>
            </div>
            <h2 className="text-3xl font-black tracking-tighter text-slate-900 dark:text-white mb-2 uppercase">Create Account</h2>
            <p className="text-sm text-slate-500 font-medium uppercase tracking-widest">Join our professional community</p>
          </div>

          <div className="space-y-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-1">Full Name</label>
              <input
                type="text"
                name="name"
                placeholder="John Doe"
                value={form.name}
                onChange={handleChange}
                className="w-full p-4 rounded-xl bg-slate-50 dark:bg-slate-800 border-2 border-transparent focus:border-indigo-500/50 transition-all font-bold text-slate-900 dark:text-white outline-none"
                required
                minLength={2}
              />
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-1">Email Address</label>
              <input
                type="email"
                name="email"
                placeholder="name@company.com"
                value={form.email}
                onChange={handleChange}
                className="w-full p-4 rounded-xl bg-slate-50 dark:bg-slate-800 border-2 border-transparent focus:border-indigo-500/50 transition-all font-bold text-slate-900 dark:text-white outline-none"
                required
              />
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-1">Secure Password</label>
              <input
                type="password"
                name="password"
                placeholder="••••••••"
                value={form.password}
                onChange={handleChange}
                className="w-full p-4 rounded-xl bg-slate-50 dark:bg-slate-800 border-2 border-transparent focus:border-indigo-500/50 transition-all font-bold text-slate-900 dark:text-white outline-none"
                required
                minLength={8}
              />
            </div>
          </div>

          <button 
            type="submit" 
            className={`w-full btn-primary py-4 mt-10 !bg-indigo-600 shadow-indigo-500/25 relative overflow-hidden group ${loading ? 'opacity-80' : ''}`}
            disabled={loading}
          >
            <span className={`flex items-center justify-center gap-2 transition-transform duration-300 ${loading ? 'translate-y-10' : ''}`}>
              Get Started for Free <span className="material-icons text-sm">rocket_launch</span>
            </span>
            {loading && (
              <div className="absolute inset-0 flex items-center justify-center">
                <LoadingSpinner size="sm" className="text-white" />
              </div>
            )}
          </button>

          <div className="relative my-10 text-center">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-100 dark:border-slate-800"></div>
            </div>
            <span className="relative px-4 bg-white dark:bg-slate-900 text-[10px] font-black text-slate-400 uppercase tracking-widest">Rapid Onboarding</span>
          </div>

          <GoogleSignIn 
            redirectTo="/" 
            buttonText="Sign up with Google"
            className="w-full !rounded-xl !border-none !bg-slate-50 dark:!bg-slate-800 !shadow-none hover:!bg-slate-100 transition-colors"
          />

          {error && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
              className="mt-8 p-4 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-500 text-center text-xs font-bold"
            >
              {error}
            </motion.div>
          )}

          {success && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
              className="mt-8 p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 text-center text-xs font-bold"
            >
              Account created successfully!
            </motion.div>
          )}

          <p className="text-center mt-10 text-xs font-bold text-slate-500 uppercase tracking-widest">
            Member already? <Link to="/login" className="text-indigo-600 hover:underline">Sign In</Link>
          </p>
        </div>
      </form>
    </div>
  );
};

RegisterForm.propTypes = {
  onSuccess: PropTypes.func,
};

export default RegisterForm;
