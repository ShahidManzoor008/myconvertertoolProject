import { useState, useEffect } from 'react';
import {
  Users,
  FileText,
  Wrench,
  TrendingUp,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react';
import PropTypes from 'prop-types';
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
  const [stats, setStats] = useState({
    users: 0,
    activeUsers: 0,
    posts: 0,
    conversions: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const data = await adminApi.getStats();
      setStats(data);
    } catch (err) {
      console.error('Failed to fetch stats:', err);
    } finally {
      setLoading(false);
    }
  };

  const cards = [
    {
      title: 'Total Users',
      value: stats.users.toLocaleString(),
      icon: Users,
    },
    {
      title: 'Active Users',
      value: stats.activeUsers.toLocaleString(),
      icon: Users,
    },
    {
      title: 'Blog Posts',
      value: stats.posts.toLocaleString(),
      icon: FileText,
    },
    {
      title: 'Total Conversions',
      value: stats.conversions.toLocaleString(),
      icon: TrendingUp,
    }
  ];

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">Dashboard</h1>
        <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
          An overview of your website statistics and performance
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((card) => (
          <DashboardCard key={card.title} {...card} />
        ))}
      </div>

      <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Recent Activity placeholder */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">Recent Activity</h3>
          </div>
          <div className="p-6">
            <div className="flow-root">
              <ul className="-mb-8">
                <li className="text-sm text-gray-500 dark:text-gray-400">
                  No recent activity logged yet.
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* System Health placeholder */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">System Health</h3>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-600 dark:text-gray-400">API Status</span>
                <span className="px-2 py-1 text-xs font-semibold text-green-800 bg-green-100 rounded-full">Operational</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Database</span>
                <span className="px-2 py-1 text-xs font-semibold text-green-800 bg-green-100 rounded-full">Connected</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;