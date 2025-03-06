import { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

const Popup = ({ message, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, 2000); // Auto close after 2 seconds

    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        className="fixed top-4 right-4 bg-blue-600 text-white px-4 py-2 rounded-md shadow-md"
      >
        {message}
      </motion.div>
    </AnimatePresence>
  );
};

export default Popup;
