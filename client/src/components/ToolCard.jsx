import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import PropTypes from "prop-types";

const colorClasses = {
  blue: {
    glow: "bg-blue-500",
    icon: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
  },
  green: {
    glow: "bg-green-500",
    icon: "bg-green-500/10 text-green-600 dark:text-green-400",
  },
  yellow: {
    glow: "bg-yellow-500",
    icon: "bg-yellow-500/10 text-yellow-600 dark:text-yellow-400",
  },
  pink: {
    glow: "bg-pink-500",
    icon: "bg-pink-500/10 text-pink-600 dark:text-pink-400",
  },
  purple: {
    glow: "bg-purple-500",
    icon: "bg-purple-500/10 text-purple-600 dark:text-purple-400",
  },
  indigo: {
    glow: "bg-indigo-500",
    icon: "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400",
  },
  red: {
    glow: "bg-red-500",
    icon: "bg-red-500/10 text-red-600 dark:text-red-400",
  },
  teal: {
    glow: "bg-teal-500",
    icon: "bg-teal-500/10 text-teal-600 dark:text-teal-400",
  },
};

const ToolCard = ({ title, link, icon, color, description }) => {
  const classes = colorClasses[color] || colorClasses.blue;

  return (
    <motion.div
      whileHover={{ y: -5 }}
      whileTap={{ scale: 0.98 }}
      className="group relative h-full"
    >
      <Link
        to={link}
        className="block h-full p-6 glass-card border border-slate-200/50 dark:border-slate-700/50 hover:border-blue-500/50 dark:hover:border-blue-400/50 overflow-hidden"
      >
        <div className={`absolute top-0 right-0 w-24 h-24 -mr-8 -mt-8 rounded-full opacity-10 blur-2xl transition-all group-hover:opacity-20 ${classes.glow}`} />

        <div className="relative z-10 flex h-full flex-col items-center text-center">
          <div className={`p-4 rounded-2xl ${classes.icon} mb-4 transition-transform group-hover:scale-110`}>
            <span className="text-4xl">{icon}</span>
          </div>
          <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
            {title}
          </h3>
          <p className="text-sm leading-relaxed text-slate-500 dark:text-slate-400">
            {description || "Open this free online utility."}
          </p>
        </div>
      </Link>
    </motion.div>
  );
};

ToolCard.propTypes = {
  title: PropTypes.string.isRequired,
  link: PropTypes.string.isRequired,
  icon: PropTypes.node.isRequired,
  color: PropTypes.string.isRequired,
  description: PropTypes.string,
};

export default ToolCard;
