import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import PropTypes from "prop-types";

const ToolCard = ({ title, link, icon, color }) => {
  return (
    <motion.div
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      className={`p-6 bg-${color} text-white rounded-lg text-center shadow-md hover:shadow-2xl transition-transform transform hover:scale-105`}
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
