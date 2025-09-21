import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import PropTypes from 'prop-types';
import { FiTrendingUp, FiUsers, FiClock, FiActivity } from 'react-icons/fi';
import { Line, Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

const StatCard = ({ title, value, percentage, trend, icon: Icon }) => (
  <motion.div
    whileHover={{ scale: 1.02 }}
    className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6"
  >
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm text-gray-500 dark:text-gray-400">{title}</p>
        <h3 className="text-2xl font-bold text-gray-800 dark:text-white">{value}</h3>
      </div>
      <div className={`p-3 rounded-full bg-${trend === 'up' ? 'green' : 'red'}-100`}>
        <Icon className={`w-6 h-6 text-${trend === 'up' ? 'green' : 'red'}-500`} />
      </div>
    </div>
    <div className="mt-4 flex items-center">
      <span className={`text-${trend === 'up' ? 'green' : 'red'}-500 text-sm font-medium`}>
        {percentage}%
      </span>
      <span className="text-gray-500 dark:text-gray-400 text-sm ml-2">vs last month</span>
    </div>
  </motion.div>
);

const TrafficChart = ({ data }) => {
  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
      },
      title: {
        display: true,
        text: 'Website Traffic',
      },
    },
    scales: {
      y: {
        beginAtZero: true,
      },
    },
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
      <div style={{ height: '300px' }}>
        <Line data={data} options={options} />
      </div>
    </div>
  );
};

const ToolUsageChart = ({ data }) => {
  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
      },
      title: {
        display: true,
        text: 'Tool Usage',
      },
    },
    scales: {
      y: {
        beginAtZero: true,
      },
    },
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
      <div style={{ height: '300px' }}>
        <Bar data={data} options={options} />
      </div>
    </div>
  );
};

const PopularPages = ({ pages }) => (
  <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
    <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">Popular Pages</h3>
    <div className="space-y-4">
      {pages.map((page, index) => (
        <div key={index} className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <FiActivity className="text-blue-500" />
            <span className="text-sm text-gray-800 dark:text-white">{page.path}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-gray-500">{page.views} views</span>
            <span className={`text-xs ${page.trend === 'up' ? 'text-green-500' : 'text-red-500'}`}>
              {page.percentage}%
            </span>
          </div>
        </div>
      ))}
    </div>
  </div>
);

const Analytics = () => {
  const [stats, setStats] = useState({
    visitors: { value: 0, percentage: 0, trend: 'up' },
    pageViews: { value: 0, percentage: 0, trend: 'up' },
    avgTime: { value: '0:00', percentage: 0, trend: 'up' },
    toolUsage: { value: 0, percentage: 0, trend: 'up' },
  });

  const [trafficData, setTrafficData] = useState({
    labels: [],
    datasets: [],
  });

  const [toolUsageData, setToolUsageData] = useState({
    labels: [],
    datasets: [],
  });

  const [popularPages, setPopularPages] = useState([]);

  useEffect(() => {
    fetchAnalyticsData();
  }, []);

  const fetchAnalyticsData = async () => {
    try {
      // TODO: Replace with actual API calls
      // Simulated data for demonstration
      setStats({
        visitors: { value: '1,234', percentage: 12.5, trend: 'up' },
        pageViews: { value: '5,678', percentage: 8.3, trend: 'up' },
        avgTime: { value: '2:45', percentage: -3.2, trend: 'down' },
        toolUsage: { value: '892', percentage: 15.7, trend: 'up' },
      });

      setTrafficData({
        labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
        datasets: [
          {
            label: 'This Week',
            data: [65, 59, 80, 81, 56, 55, 40],
            fill: true,
            borderColor: 'rgb(75, 192, 192)',
            backgroundColor: 'rgba(75, 192, 192, 0.2)',
            tension: 0.4,
          },
          {
            label: 'Last Week',
            data: [45, 79, 50, 41, 86, 35, 50],
            fill: true,
            borderColor: 'rgb(153, 102, 255)',
            backgroundColor: 'rgba(153, 102, 255, 0.2)',
            tension: 0.4,
          },
        ],
      });

      setToolUsageData({
        labels: ['PDF Tools', 'JSON Tools', 'Text Tools', 'Image Tools', 'Code Tools'],
        datasets: [
          {
            label: 'Usage Count',
            data: [300, 250, 200, 150, 100],
            backgroundColor: [
              'rgba(255, 99, 132, 0.5)',
              'rgba(54, 162, 235, 0.5)',
              'rgba(255, 206, 86, 0.5)',
              'rgba(75, 192, 192, 0.5)',
              'rgba(153, 102, 255, 0.5)',
            ],
            borderColor: [
              'rgba(255, 99, 132, 1)',
              'rgba(54, 162, 235, 1)',
              'rgba(255, 206, 86, 1)',
              'rgba(75, 192, 192, 1)',
              'rgba(153, 102, 255, 1)',
            ],
            borderWidth: 1,
          },
        ],
      });

      setPopularPages([
        { path: '/tools/pdf-converter', views: 345, percentage: '+12.5', trend: 'up' },
        { path: '/tools/json-formatter', views: 289, percentage: '+8.3', trend: 'up' },
        { path: '/tools/text-case', views: 234, percentage: '-3.2', trend: 'down' },
        { path: '/blog/getting-started', views: 198, percentage: '+15.7', trend: 'up' },
        { path: '/tools/base64', views: 167, percentage: '+5.2', trend: 'up' },
      ]);
    } catch (error) {
      console.error('Error fetching analytics data:', error);
    }
  };

  return (
    <div className="p-6 space-y-6">
      <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Analytics</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Visitors"
          value={stats.visitors.value}
          percentage={stats.visitors.percentage}
          trend={stats.visitors.trend}
          icon={FiUsers}
        />
        <StatCard
          title="Page Views"
          value={stats.pageViews.value}
          percentage={stats.pageViews.percentage}
          trend={stats.pageViews.trend}
          icon={FiActivity}
        />
        <StatCard
          title="Avg. Time on Site"
          value={stats.avgTime.value}
          percentage={stats.avgTime.percentage}
          trend={stats.avgTime.trend}
          icon={FiClock}
        />
        <StatCard
          title="Tool Usage"
          value={stats.toolUsage.value}
          percentage={stats.toolUsage.percentage}
          trend={stats.toolUsage.trend}
          icon={FiTrendingUp}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <TrafficChart data={trafficData} />
        <ToolUsageChart data={toolUsageData} />
      </div>

      <div className="grid grid-cols-1">
        <PopularPages pages={popularPages} />
      </div>
    </div>
  );
};

StatCard.propTypes = {
  title: PropTypes.string.isRequired,
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
  percentage: PropTypes.number.isRequired,
  trend: PropTypes.oneOf(['up', 'down']).isRequired,
  icon: PropTypes.elementType.isRequired,
};

TrafficChart.propTypes = {
  data: PropTypes.shape({
    labels: PropTypes.arrayOf(PropTypes.string).isRequired,
    datasets: PropTypes.arrayOf(
      PropTypes.shape({
        label: PropTypes.string.isRequired,
        data: PropTypes.arrayOf(PropTypes.number).isRequired,
        fill: PropTypes.bool,
        borderColor: PropTypes.string,
        backgroundColor: PropTypes.string,
        tension: PropTypes.number,
      })
    ).isRequired,
  }).isRequired,
};

ToolUsageChart.propTypes = {
  data: PropTypes.shape({
    labels: PropTypes.arrayOf(PropTypes.string).isRequired,
    datasets: PropTypes.arrayOf(
      PropTypes.shape({
        label: PropTypes.string.isRequired,
        data: PropTypes.arrayOf(PropTypes.number).isRequired,
        backgroundColor: PropTypes.oneOfType([
          PropTypes.string,
          PropTypes.arrayOf(PropTypes.string),
        ]),
        borderColor: PropTypes.oneOfType([
          PropTypes.string,
          PropTypes.arrayOf(PropTypes.string),
        ]),
        borderWidth: PropTypes.number,
      })
    ).isRequired,
  }).isRequired,
};

PopularPages.propTypes = {
  pages: PropTypes.arrayOf(
    PropTypes.shape({
      path: PropTypes.string.isRequired,
      views: PropTypes.number.isRequired,
      percentage: PropTypes.string.isRequired,
      trend: PropTypes.oneOf(['up', 'down']).isRequired,
    })
  ).isRequired,
};

export default Analytics;