import { useState, useEffect, useCallback } from 'react';
import { Search, Trash2, UserCheck, UserX } from 'lucide-react';
import { adminApi } from '../../utils/apiClient';

const PAGE_SIZE = 20;

const Users = () => {
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState(null);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const fetchUsers = useCallback(async () => {
    setLoading(true); setError('');
    try {
      const data = await adminApi.getUsers(page, PAGE_SIZE);
      setUsers(data.users || []); setTotal(data.total || 0);
    } catch (err) {
      setError(err.message || 'Failed to fetch users');
    } finally { setLoading(false); }
  }, [page]);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  const updateUser = async (user, remove = false) => {
    if (remove && !window.confirm(`Delete the account for ${user.name || user.email}? This cannot be undone.`)) return;
    setBusyId(user._id); setError(''); setMessage('');
    try {
      if (remove) {
        await adminApi.deleteUser(user._id);
        setMessage('User account deleted.');
        if (users.length === 1 && page > 1) setPage(current => current - 1);
        else await fetchUsers();
      } else {
        const status = user.status === 'active' ? 'inactive' : 'active';
        await adminApi.updateUser(user._id, { status });
        setUsers(current => current.map(item => item._id === user._id ? { ...item, status } : item));
        setMessage(`Account ${status === 'active' ? 'activated' : 'deactivated'}.`);
      }
    } catch (err) { setError(err.message || 'The account could not be updated. Please try again.'); }
    finally { setBusyId(null); }
  };

  const filteredUsers = users.filter(user =>
    [user.name, user.email].some(value => value?.toLowerCase().includes(search.trim().toLowerCase()))
  );
  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const actionClass = 'inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-lg hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50 dark:hover:bg-gray-700';

  return (
    <div className="space-y-5">
      <div>
        <h1 className="font-semibold text-gray-900 dark:text-white">Users</h1>
        <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">Manage registered accounts and their active status.</p>
      </div>
      {error && <div role="alert" className="rounded-lg bg-red-50 p-4 text-sm text-red-800 dark:bg-red-950/30 dark:text-red-200"><p>{error}</p><button type="button" onClick={fetchUsers} disabled={loading || !!busyId} className="mt-1 min-h-11 font-semibold underline">Reload users</button></div>}
      {message && <p role="status" className="text-sm text-green-800 dark:text-green-300">{message}</p>}
      <div className="max-w-md">
        <label htmlFor="user-search" className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Search this page</label>
        <div className="relative">
          <Search aria-hidden="true" className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
          <input id="user-search" type="search" placeholder="Name or email" value={search} onChange={event => setSearch(event.target.value)} className="w-full rounded-lg border border-gray-300 bg-white py-2 pl-10 pr-4 dark:border-gray-600 dark:bg-gray-800" />
        </div>
        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">Filters the accounts on the current page.</p>
      </div>
      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800">
        <div role="region" aria-label="User accounts table, scroll horizontally for more columns" tabIndex={0} className="overflow-x-auto" aria-busy={loading}>
          <table className="w-full min-w-[44rem] divide-y divide-gray-200 text-left text-sm dark:divide-gray-700">
            <thead className="bg-gray-50 text-xs uppercase text-gray-600 dark:bg-gray-900/40 dark:text-gray-300">
              <tr>{['Name', 'Email', 'Role', 'Status', 'Joined', 'Actions'].map(label => <th key={label} scope="col" className="px-4 py-3 font-semibold">{label}</th>)}</tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {loading ? <tr><td colSpan="6" className="px-4 py-8 text-center text-gray-500 dark:text-gray-400">Loading users…</td></tr>
                : filteredUsers.length === 0 ? <tr><td colSpan="6" className="px-4 py-8 text-center text-gray-500 dark:text-gray-400">{search ? 'No accounts match this search on the current page.' : 'No users found.'}</td></tr>
                : filteredUsers.map(user => (
                  <tr key={user._id}>
                    <th scope="row" className="px-4 py-3 text-left font-medium text-gray-900 dark:text-white">
                      <div className="flex items-center gap-3"><span aria-hidden="true" className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-blue-50 font-semibold text-blue-700 dark:bg-blue-950 dark:text-blue-300">{(user.name || 'U').charAt(0).toUpperCase()}</span><span className="max-w-48 break-words">{user.name || 'Unnamed account'}</span></div>
                    </th>
                    <td className="max-w-64 break-words px-4 py-3 text-gray-600 dark:text-gray-300">{user.email}</td>
                    <td className="px-4 py-3">{user.role}</td>
                    <td className="px-4 py-3"><span className={`rounded-full px-2 py-1 text-xs font-medium ${user.status === 'active' ? 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-200' : 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-200'}`}>{user.status || 'Unknown'}</span></td>
                    <td className="whitespace-nowrap px-4 py-3 text-gray-600 dark:text-gray-300">{user.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'Unavailable'}</td>
                    <td className="px-4 py-3"><div className="flex gap-1">
                      <button type="button" disabled={!!busyId} onClick={() => updateUser(user)} aria-label={`${user.status === 'active' ? 'Deactivate' : 'Activate'} ${user.name || user.email}`} title={user.status === 'active' ? 'Deactivate account' : 'Activate account'} className={`${actionClass} text-blue-700 dark:text-blue-300`}>{user.status === 'active' ? <UserX aria-hidden="true" size={20} /> : <UserCheck aria-hidden="true" size={20} />}</button>
                      <button type="button" disabled={!!busyId} onClick={() => updateUser(user, true)} aria-label={`Delete ${user.name || user.email}`} title="Delete account" className={`${actionClass} text-red-700 dark:text-red-300`}><Trash2 aria-hidden="true" size={20} /></button>
                    </div></td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-gray-200 px-4 py-3 text-sm dark:border-gray-700">
          <p role="status">Page {page} of {pages} · {total.toLocaleString()} accounts</p>
          <div className="flex gap-2">
            <button type="button" disabled={loading || !!busyId || page <= 1} onClick={() => { setSearch(''); setPage(current => current - 1); }} className="min-h-11 rounded-lg border border-gray-300 px-3 disabled:opacity-50 dark:border-gray-600">Previous</button>
            <button type="button" disabled={loading || !!busyId || page >= pages} onClick={() => { setSearch(''); setPage(current => current + 1); }} className="min-h-11 rounded-lg border border-gray-300 px-3 disabled:opacity-50 dark:border-gray-600">Next</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Users;
