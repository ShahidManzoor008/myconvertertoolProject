import { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { motion, AnimatePresence } from 'framer-motion';
import { User, Mail, Shield, Save, CheckCircle2 } from 'lucide-react';
import SEO from '../utils/SEO';

const Profile = () => {
  const { user, isAuthenticated } = useAuth();
  const [form, setForm] = useState({ name: user?.name || '', password: '' });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState(null);

  if (!isAuthenticated) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="glass-card p-12 text-center max-w-md">
          <h2 className="text-2xl font-black mb-4 uppercase tracking-tight">Identity Required</h2>
          <p className="text-slate-500 font-medium mb-8">Please authenticate to access your professional profile.</p>
          <a href="/login" className="btn-primary inline-flex">Go to Login</a>
        </div>
      </div>
    );
  }

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(false);
    try {
      const res = await fetch('/api/auth/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
        },
        body: JSON.stringify({
          name: form.name,
          password: form.password || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || (data.errors && data.errors[0]?.msg) || 'Update failed');
      setSuccess(true);
      setForm(f => ({ ...f, password: '' }));
      setTimeout(() => setSuccess(false), 5000);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="pb-24">
      <SEO title="My Profile - MyConverterTool Account" />
      
      {/* Header */}
      <section className="text-center py-12 md:py-16" data-aos="fade-down">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-600/10 text-blue-600 dark:text-blue-400 text-[10px] font-black uppercase tracking-widest border border-blue-600/20 mb-6">
          <Shield size={12} />
          Account Management
        </div>
        <h1 className="text-5xl md:text-7xl font-black tracking-tighter mb-4 leading-tight text-slate-900 dark:text-white">
          Identity <span className="gradient-text">Portal</span>
        </h1>
        <p className="text-lg text-slate-500 dark:text-slate-400 max-w-xl mx-auto leading-relaxed font-medium">
          Manage your personal details and security credentials from one secure location.
        </p>
      </section>

      <div className="max-w-4xl mx-auto px-4 grid grid-cols-1 lg:grid-cols-12 gap-10">
        {/* Profile Card */}
        <div className="lg:col-span-4">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
            className="glass-card p-1 text-center"
          >
            <div className="bg-white dark:bg-slate-900 rounded-[2rem] p-10 flex flex-col items-center">
              <div className="w-24 h-24 rounded-[2rem] bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white text-3xl font-black shadow-xl mb-6">
                {user.name.charAt(0)}
              </div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-1">{user.name}</h2>
              <p className="text-xs font-black uppercase tracking-widest text-slate-400 mb-6">{user.role}</p>
              
              <div className="w-full pt-6 border-t border-slate-100 dark:border-slate-800 flex flex-col gap-3">
                <div className="flex items-center gap-3 text-left">
                  <div className="w-8 h-8 rounded-lg bg-slate-50 dark:bg-slate-800 flex items-center justify-center text-slate-400">
                    <Mail size={14} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[10px] font-black uppercase text-slate-400 tracking-tighter">Verified Email</p>
                    <p className="text-xs font-bold text-slate-700 dark:text-slate-200 truncate">{user.email}</p>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Edit Panel */}
        <div className="lg:col-span-8">
          <motion.div 
            initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}
            className="glass-card p-1"
          >
            <form onSubmit={handleSubmit} className="bg-white dark:bg-slate-900 rounded-[2rem] p-8 sm:p-10 shadow-inner">
              <h3 className="text-sm font-black uppercase tracking-widest text-slate-400 mb-8 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-blue-600" />
                Update Information
              </h3>

              <div className="space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-1">Display Name</label>
                  <div className="relative">
                    <User size={18} className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300" />
                    <input
                      type="text"
                      name="name"
                      value={form.name}
                      onChange={handleChange}
                      className="w-full pl-14 pr-6 py-5 rounded-2xl bg-slate-50 dark:bg-slate-800 border-2 border-transparent focus:border-blue-500/50 outline-none transition-all font-bold text-slate-900 dark:text-white"
                      placeholder="Your name"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-1">Email (Fixed)</label>
                  <div className="relative opacity-60">
                    <Mail size={18} className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300" />
                    <input
                      type="email"
                      value={user.email}
                      disabled
                      className="w-full pl-14 pr-6 py-5 rounded-2xl bg-slate-100 dark:bg-slate-950 border-none font-bold text-slate-400 cursor-not-allowed"
                    />
                  </div>
                </div>

                <div className="space-y-2 pt-6">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-1">New Password</label>
                  <input
                    type="password"
                    name="password"
                    value={form.password}
                    onChange={handleChange}
                    className="w-full p-5 rounded-2xl bg-slate-50 dark:bg-slate-800 border-2 border-transparent focus:border-blue-500/50 outline-none transition-all font-bold text-slate-900 dark:text-white"
                    placeholder="••••••••"
                    minLength={8}
                  />
                  <p className="text-[10px] font-medium text-slate-400 px-1 italic">Leave blank if you don't wish to change it.</p>
                </div>
              </div>

              <div className="mt-10 flex flex-col sm:flex-row items-center justify-between gap-6">
                <button
                  type="submit"
                  disabled={loading}
                  className="btn-primary w-full sm:w-auto px-10 py-4 shadow-blue-500/25"
                >
                  <Save size={18} />
                  {loading ? 'Processing...' : 'Save All Changes'}
                </button>

                <AnimatePresence>
                  {success && (
                    <motion.div 
                      initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }}
                      className="flex items-center gap-2 text-emerald-500 font-bold text-sm"
                    >
                      <CheckCircle2 size={16} />
                      Updates synchronized
                    </motion.div>
                  )}
                  {error && (
                    <motion.div 
                      initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }}
                      className="text-red-500 font-bold text-sm"
                    >
                      {error}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </form>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
