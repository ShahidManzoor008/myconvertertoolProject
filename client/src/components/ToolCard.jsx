import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import PropTypes from "prop-types";

const ToolCard = ({ title, link, icon, color }) => {
  return (
    <motion.div
      whileHover={{ y: -5 }}
      whileTap={{ scale: 0.98 }}
      className="group relative"
    >
      <Link 
        to={link} 
        className="block p-6 glass-card border border-slate-200/50 dark:border-slate-700/50 hover:border-blue-500/50 dark:hover:border-blue-400/50 overflow-hidden"
      >
        <div className={`absolute top-0 right-0 w-24 h-24 -mr-8 -mt-8 rounded-full opacity-10 blur-2xl transition-all group-hover:opacity-20 bg-${color}-500`} />
        
        <div className="relative z-10 flex flex-col items-center text-center">
          <div className={`p-4 rounded-2xl bg-${color}-500/10 text-${color}-600 dark:text-${color}-400 mb-4 transition-transform group-hover:scale-110`}>
            <span className="text-4xl">{icon}</span>
          </div>
          <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
            {title}
          </h3>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Professional conversion tool
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
};

export default ToolCard;