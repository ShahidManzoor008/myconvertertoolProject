import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import PropTypes from "prop-types";

// Define a mapping for colors to Tailwind CSS classes
const colorMap = {
  red: 'bg-red-500 hover:bg-red-600 dark:bg-red-700 dark:hover:bg-red-800',
  blue: 'bg-blue-500 hover:bg-blue-600 dark:bg-blue-700 dark:hover:bg-blue-800',
  green: 'bg-green-500 hover:bg-green-600 dark:bg-green-700 dark:hover:bg-green-800',
  yellow: 'bg-yellow-500 hover:bg-yellow-600 dark:bg-yellow-700 dark:hover:bg-yellow-800',
  indigo: 'bg-indigo-500 hover:bg-indigo-600 dark:bg-indigo-700 dark:hover:bg-indigo-800',
  purple: 'bg-purple-500 hover:bg-purple-600 dark:bg-purple-700 dark:hover:bg-purple-800',
  pink: 'bg-pink-500 hover:bg-pink-600 dark:bg-pink-700 dark:hover:bg-pink-800',
  teal: 'bg-teal-500 hover:bg-teal-600 dark:bg-teal-700 dark:hover:bg-teal-800',
  gray: 'bg-gray-400 hover:bg-gray-500 dark:bg-gray-600 dark:hover:bg-gray-700', // For "Coming Soon"
};

const ToolCard = ({ title, link, icon, color }) => {
  const cardClasses = colorMap[color] || 'bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600'; // Default gray if color not found
  const textColor = 'text-white dark:text-gray-100'; // Ensure text is visible on colored backgrounds

  return (
    <motion.div
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      className={`p-6 ${cardClasses} ${textColor} rounded-lg text-center shadow-md hover:shadow-2xl transition-transform transform hover:scale-105`}
    >
      <Link to={link} className="flex flex-col items-center" aria-label={`Go to ${title} tool`}>
        <span className="text-4xl" aria-hidden="true">{icon}</span>
        <h3 className="text-lg font-bold mt-2">{title}</h3>
      </Link>
    </motion.div>
  );
};

ToolCard.propTypes = {
  title: PropTypes.string.isRequired,
  link: PropTypes.string.isRequired,
  icon: PropTypes.node.isRequired,
  color: PropTypes.string.isRequired,
};

export default ToolCard;