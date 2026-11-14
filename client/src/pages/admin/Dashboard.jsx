import { useState, useEffect, useCallback } from 'react';
import {
  Users,
  FileText,
  TrendingUp,
} from 'lucide-react';
import PropTypes from 'prop-types';
import { Link } from 'react-router-dom';
import { adminApi } from '../../utils/apiClient';

const DashboardCard = ({ title, value, icon: Icon }) => (
  <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm font-medium text-gray-600 dark:text-gray-400">{title}</p>
        <p className="text-2xl font-semibold text-gray-900 dark:text-white mt-1">{value}</p>
      </div>
      <div className="p-3 rounded-full bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400">
        <Icon className="h-6 w-6" />
      </div>
    </div>
  </div>
);

DashboardCard.propTypes = {
  title: PropTypes.string.isRequired,
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
  icon: PropTypes.elementType.isRequired,
};

const Dashboard = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchStats = useCallback(async () => {
    setLoading(true); setError('');
    try {
      setStats(await adminApi.getStats());
    } catch {
      setError('Website statistics could not be loaded. Please try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchStats(); }, [fetchStats]);
  const count = key => stats && typeof stats[key] === 'number' ? stats[key].toLocaleString() : '—';

  const cards = [
    {
      title: 'Total Users',
      value: count('users'),
      icon: Users,
    },
    {
      title: 'Active Accounts',
      value: count('activeUsers'),
      icon: Users,
    },
    {
      title: 'Blog Posts',
      value: count('posts'),
      icon: FileText,
    },
    {
      title: 'Total Conversions',
      value: count('conversions'),
      icon: TrendingUp,
    }
  ];

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">Dashboard</h1>
        <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
          An overview of your website statistics and performance
        </p>
      </div>

      {error && <div role="alert" className="mb-5 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800 dark:border-red-900 dark:bg-red-950/30 dark:text-red-200">
        <p>{error}</p><button type="button" onClick={fetchStats} className="mt-2 min-h-11 font-semibold underline">Try again</button>
      </div>}
      {loading && <p role="status" className="mb-4 text-sm text-gray-500 dark:text-gray-400">Loading website statistics…</p>}
      <div aria-busy={loading} className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map((card) => (
          <DashboardCard key={card.title} {...card} />
        ))}
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <section className="rounded-lg border border-gray-200 bg-white p-5 dark:border-gray-700 dark:bg-gray-800">
          <h2 className="text-base font-semibold text-gray-900 dark:text-white">Conversion activity</h2>
          <p className="mt-2 text-sm leading-6 text-gray-600 dark:text-gray-400">See successful conversions, failure reasons, and the tools visitors use most.</p>
          <Link to="/admin/analytics" className="mt-3 inline-flex min-h-11 items-center text-sm font-semibold text-blue-700 underline dark:text-blue-300">View usage analytics</Link>
        </section>
        <section className="rounded-lg border border-gray-200 bg-white p-5 dark:border-gray-700 dark:bg-gray-800">
          <h2 className="text-base font-semibold text-gray-900 dark:text-white">Service resources & cleanup</h2>
          <p className="mt-2 text-sm leading-6 text-gray-600 dark:text-gray-400">Check current database, memory, and disk status, and preview expired temporary files before cleanup.</p>
          <Link to="/admin/analytics#maintenance" className="mt-3 inline-flex min-h-11 items-center text-sm font-semibold text-blue-700 underline dark:text-blue-300">Check resources & cleanup</Link>
        </section>
      </div>
    </div>
  );
};

export default Dashboard;
