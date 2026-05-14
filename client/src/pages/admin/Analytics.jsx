

import { useState, useEffect } from 'react';
import { adminApi } from '../../utils/apiClient';
import LoadingSpinner from '../../components/LoadingSpinner';

const Analytics = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const data = await adminApi.getStats();
        setStats(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  if (loading) return <LoadingSpinner message="Fetching analytics..." />;

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Analytics Dashboard</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-2">User Growth</h3>
          <p className="text-3xl font-bold text-blue-600">{stats?.users || 0}</p>
          <p className="text-sm text-gray-500">Total registered users</p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-2">Conversions</h3>
          <p className="text-3xl font-bold text-green-600">{stats?.conversions || 0}</p>
          <p className="text-sm text-gray-500">Total successful tool uses</p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-2">Content</h3>
          <p className="text-3xl font-bold text-purple-600">{stats?.posts || 0}</p>
          <p className="text-sm text-gray-500">Total blog posts</p>
        </div>
      </div>

      <div className="mt-8 bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <h3 className="text-xl font-bold mb-4">Activity Overview</h3>
        <p className="text-gray-600 dark:text-gray-400">
          More detailed analytics and charts will appear here as data accumulates.
        </p>
      </div>
    </div>
  );
};

export default Analytics;