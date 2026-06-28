import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import PropTypes from "prop-types";
import { memo } from "react";

const colorClasses = {
  blue: {
    gradient: "from-blue-500/20",
    bar: "bg-blue-500",
  },
  green: {
    gradient: "from-green-500/20",
    bar: "bg-green-500",
  },
  yellow: {
    gradient: "from-yellow-500/20",
    bar: "bg-yellow-500",
  },
  pink: {
    gradient: "from-pink-500/20",
    bar: "bg-pink-500",
  },
};

const CategoryCard = ({ title, link, color, description }) => {
  const classes = colorClasses[color] || colorClasses.blue;

  return (
    <motion.div
      whileHover={{ y: -4 }}
      transition={{ type: "spring", stiffness: 300 }}
      className="h-full"
    >
      <Link
        to={link}
        className="block h-full p-8 glass-card border-none relative overflow-hidden group"
        aria-label={`View ${title} tools`}
      >
        <div className={`absolute inset-0 bg-gradient-to-br ${classes.gradient} to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />

        <div className="relative z-10">
          <div className={`w-12 h-1 ${classes.bar} mb-4 rounded-full transition-all group-hover:w-full`} />
          <h3 className="text-xl font-extrabold text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
            {title}
          </h3>
          <p className="mt-2 text-sm leading-relaxed text-slate-500 dark:text-slate-400">
            {description || `Explore ${title.toLowerCase()} suite`}
          </p>
        </div>
      </Link>
    </motion.div>
  );
};

CategoryCard.propTypes = {
  title: PropTypes.string.isRequired,
  link: PropTypes.string.isRequired,
  color: PropTypes.string.isRequired,
  description: PropTypes.string,
};

export default memo(CategoryCard);
