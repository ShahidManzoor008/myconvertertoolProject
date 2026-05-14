import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import PropTypes from "prop-types";

const CategoryCard = ({ title, link, color }) => {
  return (
    <motion.div 
      whileHover={{ y: -4 }} 
      transition={{ type: "spring", stiffness: 300 }}
    >
      <Link
        to={link}
        className="block p-8 glass-card border-none relative overflow-hidden group"
        aria-label={`View ${title} tools`}
      >
        <div className={`absolute inset-0 bg-gradient-to-br from-${color}-500/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />
        
        <div className="relative z-10">
          <div className={`w-12 h-1 bg-${color}-500 mb-4 rounded-full transition-all group-hover:w-full`} />
          <h3 className="text-xl font-extrabold text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
            {title}
          </h3>
          <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
            Explore {title.toLowerCase()} suite
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
};

export default CategoryCard;
