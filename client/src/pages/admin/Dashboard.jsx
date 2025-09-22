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

const DashboardCard = ({ title, value, change, icon: Icon, changeType }) => (
  <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm font-medium text-gray-600 dark:text-gray-400">{title}</p>
        <p className="text-2xl font-semibold text-gray-900 dark:text-white mt-1">{value}</p>
      </div>
      <div className={`p-3 rounded-full ${
        changeType === 'increase' ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'
      }`}>
        <Icon className="h-6 w-6" />
      </div>
    </div>
    <div className="flex items-center mt-4">
      {changeType === 'increase' ? (
        <ArrowUpRight className="h-4 w-4 text-green-500" />
      ) : (
        <ArrowDownRight className="h-4 w-4 text-red-500" />
      )}
      <span className={`text-sm font-medium ml-1 ${
        changeType === 'increase' ? 'text-green-600' : 'text-red-600'
      }`}>
        {change}% from last month
      </span>
    </div>
  </div>
);

DashboardCard.propTypes = {
  title: PropTypes.string.isRequired,
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
  change: PropTypes.number.isRequired,
  icon: PropTypes.elementType.isRequired,
  changeType: PropTypes.oneOf(['increase', 'decrease']).isRequired,
};

const Dashboard = () => {
  const [stats, setStats] = useState({
    users: { total: 0, change: 0 },
    posts: { total: 0, change: 0 },
    tools: { total: 0, change: 0 },
    conversions: { total: 0, change: 0 }
  });

  useEffect(() => {
    // TODO: Fetch actual stats from your API
    // For now using dummy data
    setStats({
      users: { total: 1205, change: 12 },
      posts: { total: 34, change: 8 },
      tools: { total: 15, change: -2 },
      conversions: { total: 8432, change: 24 }
    });
  }, []);

  const cards = [
    {
      title: 'Total Users',
      value: stats.users.total.toLocaleString(),
      change: stats.users.change,
      icon: Users,
      changeType: stats.users.change >= 0 ? 'increase' : 'decrease'
    },
    {
      title: 'Blog Posts',
      value: stats.posts.total.toLocaleString(),
      change: stats.posts.change,
      icon: FileText,
      changeType: stats.posts.change >= 0 ? 'increase' : 'decrease'
    },
    {
      title: 'Active Tools',
      value: stats.tools.total.toLocaleString(),
      change: stats.tools.change,
      icon: Wrench,
      changeType: stats.tools.change >= 0 ? 'increase' : 'decrease'
    },
    {
      title: 'Conversions Today',
      value: stats.conversions.total.toLocaleString(),
      change: stats.conversions.change,
      icon: TrendingUp,
      changeType: stats.conversions.change >= 0 ? 'increase' : 'decrease'
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
        {/* Recent Activity */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">Recent Activity</h3>
          </div>
          <div className="p-6">
            <div className="flow-root">
              <ul className="-mb-8">
                {/* Add your activity items here */}
                <li className="text-sm text-gray-500 dark:text-gray-400">
                  No recent activity
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">Quick Stats</h3>
          </div>
          <div className="p-6">
            {/* Add your quick stats here */}
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Loading statistics...
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;