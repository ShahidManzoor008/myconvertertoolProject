import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import PropTypes from "prop-types";

const CategoryCard = ({ title, link, color }) => {
  return (
    <motion.div whileHover={{ scale: 1.05 }} transition={{ duration: 0.3 }}>
      <Link
        to={link}
        className={`block p-6 bg-${color}-500 text-white rounded-md text-center shadow-lg transition-transform duration-300 transform hover:shadow-2xl`}
        aria-label={`View ${title} tools`}
      >
        <h3 className="text-lg font-bold">{title}</h3>
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
