import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import PropTypes from 'prop-types';
import { FiUsers, FiFileText, FiTool, FiActivity } from 'react-icons/fi';

const StatCard = ({ title, value, icon: Icon, color }) => (
  <motion.div
    whileHover={{ scale: 1.02 }}
    className={`p-6 rounded-lg shadow-lg bg-white dark:bg-gray-800`}
  >
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm text-gray-500 dark:text-gray-400">{title}</p>
        <h3 className="text-2xl font-bold text-gray-800 dark:text-white">{value}</h3>
      </div>
      <div className={`p-3 rounded-full ${color}`}>
        <Icon className="w-6 h-6 text-white" />
      </div>
    </div>
  </motion.div>
);

const RecentActivity = ({ activities }) => (
  <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
    <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">Recent Activity</h3>
    <div className="space-y-4">
      {activities.map((activity, index) => (
        <div key={index} className="flex items-center gap-4">
          <div className={`p-2 rounded-full ${activity.color}`}>
            {activity.icon}
          </div>
          <div>
            <p className="text-sm text-gray-800 dark:text-white">{activity.description}</p>
            <p className="text-xs text-gray-500">{activity.time}</p>
          </div>
        </div>
      ))}
    </div>
  </div>
);

const PopularTools = ({ tools }) => (
  <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
    <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">Popular Tools</h3>
    <div className="space-y-4">
      {tools.map((tool, index) => (
        <div key={index} className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <FiTool className="text-blue-500" />
            <span className="text-sm text-gray-800 dark:text-white">{tool.name}</span>
          </div>
          <span className="text-sm font-medium text-gray-500">{tool.uses} uses</span>
        </div>
      ))}
    </div>
  </div>
);

const Dashboard = () => {
  const [stats, setStats] = useState({
    users: 0,
    blogs: 0,
    tools: 0,
    conversions: 0
  });

  const [activities, setActivities] = useState([]);
  const [popularTools, setPopularTools] = useState([]);

  useEffect(() => {
    // Fetch dashboard data
    const fetchDashboardData = async () => {
      try {
        // TODO: Replace with actual API calls
        setStats({
          users: 120,
          blogs: 15,
          tools: 25,
          conversions: 1543
        });

        setActivities([
          {
            icon: <FiUsers className="text-white w-4 h-4" />,
            color: 'bg-blue-500',
            description: 'New user registration',
            time: '5 minutes ago'
          },
          {
            icon: <FiFileText className="text-white w-4 h-4" />,
            color: 'bg-green-500',
            description: 'New blog post published',
            time: '1 hour ago'
          },
          {
            icon: <FiActivity className="text-white w-4 h-4" />,
            color: 'bg-purple-500',
            description: 'PDF conversion completed',
            time: '2 hours ago'
          }
        ]);

        setPopularTools([
          { name: 'PDF Converter', uses: 523 },
          { name: 'JSON Formatter', uses: 342 },
          { name: 'Text Case Converter', uses: 289 },
          { name: 'Base64 Encoder', uses: 156 },
          { name: 'URL Encoder', uses: 134 }
        ]);
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      }
    };

    fetchDashboardData();
  }, []);

  return (
    <div className="p-6 space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Users"
          value={stats.users}
          icon={FiUsers}
          color="bg-blue-500"
        />
        <StatCard
          title="Blog Posts"
          value={stats.blogs}
          icon={FiFileText}
          color="bg-green-500"
        />
        <StatCard
          title="Available Tools"
          value={stats.tools}
          icon={FiTool}
          color="bg-purple-500"
        />
        <StatCard
          title="Total Conversions"
          value={stats.conversions}
          icon={FiActivity}
          color="bg-orange-500"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <RecentActivity activities={activities} />
        <PopularTools tools={popularTools} />
      </div>
    </div>
  );
};

StatCard.propTypes = {
  title: PropTypes.string.isRequired,
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
  icon: PropTypes.elementType.isRequired,
  color: PropTypes.string.isRequired
};

RecentActivity.propTypes = {
  activities: PropTypes.arrayOf(
    PropTypes.shape({
      icon: PropTypes.element.isRequired,
      color: PropTypes.string.isRequired,
      description: PropTypes.string.isRequired,
      time: PropTypes.string.isRequired
    })
  ).isRequired
};

PopularTools.propTypes = {
  tools: PropTypes.arrayOf(
    PropTypes.shape({
      name: PropTypes.string.isRequired,
      uses: PropTypes.number.isRequired
    })
  ).isRequired
};

export default Dashboard;