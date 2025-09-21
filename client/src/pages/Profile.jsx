import { useState } from 'react';
import { useAuth } from '../context/useAuth';

const Profile = () => {
  const { user, isAuthenticated } = useAuth();
  const [form, setForm] = useState({ name: user?.name || '', password: '' });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState(null);

  if (!isAuthenticated) {
    return <div className="max-w-md mx-auto mt-10 p-4 bg-white border rounded">Please log in to view your profile.</div>;
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
          'Authorization': `Bearer ${sessionStorage.getItem('auth_token')}`,
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
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto mt-10 p-4 bg-white border rounded">
      <h2 className="text-xl font-bold mb-4">Profile</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block mb-1 font-medium">Email</label>
          <input type="email" value={user.email} disabled className="w-full p-2 border rounded bg-gray-100" />
        </div>
        <div>
          <label className="block mb-1 font-medium">Name</label>
          <input
            type="text"
            name="name"
            value={form.name}
            onChange={handleChange}
            className="w-full p-2 border rounded"
            minLength={2}
            required
          />
        </div>
        <div>
          <label className="block mb-1 font-medium">New Password</label>
          <input
            type="password"
            name="password"
            value={form.password}
            onChange={handleChange}
            className="w-full p-2 border rounded"
            minLength={8}
            placeholder="Leave blank to keep current password"
          />
        </div>
        <button type="submit" className="w-full bg-blue-600 text-white p-2 rounded" disabled={loading}>
          {loading ? 'Updating...' : 'Update Profile'}
        </button>
        {error && <div className="text-red-600">{error}</div>}
        {success && <div className="text-green-600">Profile updated!</div>}
      </form>
    </div>
  );
};

export default Profile;
