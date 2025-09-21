import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Document, Page } from 'react-pdf';
import PropTypes from 'prop-types';

const ThumbnailsSidebar = ({ file, numPages, currentPage, onPageChange }) => {
  const [thumbnails, setThumbnails] = useState([]);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (numPages > 0) {
      setThumbnails(Array.from({ length: numPages }, (_, i) => i + 1));
    }
  }, [numPages]);

  const handleThumbnailClick = (pageNumber) => {
    onPageChange(pageNumber);
  };

  const toggleSidebar = () => {
    setIsCollapsed(!isCollapsed);
  };

  return (
    <motion.div
      initial={{ width: 200 }}
      animate={{ width: isCollapsed ? 40 : 200 }}
      transition={{ duration: 0.3 }}
      className={`bg-gray-100 dark:bg-gray-800 h-full flex ${
        isCollapsed ? 'items-center' : ''
      }`}
    >
      <button
        onClick={toggleSidebar}
        className="absolute top-2 right-2 p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
      >
        {isCollapsed ? (
          <ChevronRight className="w-4 h-4" />
        ) : (
          <ChevronLeft className="w-4 h-4" />
        )}
      </button>

      {!isCollapsed && (
        <div className="w-full overflow-y-auto p-2 space-y-2">
          {thumbnails.map((pageNum) => (
            <motion.div
              key={pageNum}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => handleThumbnailClick(pageNum)}
              className={`cursor-pointer rounded-lg overflow-hidden border-2 ${
                currentPage === pageNum
                  ? 'border-blue-500'
                  : 'border-transparent'
              }`}
            >
              <div className="relative aspect-[1/1.4]">
                <Document file={file} error={setError}>
                  <Page
                    pageNumber={pageNum}
                    width={180}
                    renderAnnotationLayer={false}
                    renderTextLayer={false}
                  />
                </Document>
                <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-50 text-white text-center text-xs py-1">
                  Page {pageNum}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {error && (
        <div className="text-red-500 text-sm p-2">
          Error loading thumbnails: {error.message}
        </div>
      )}
    </motion.div>
  );
};

ThumbnailsSidebar.propTypes = {
  file: PropTypes.oneOfType([
    PropTypes.string,
    PropTypes.object,
  ]).isRequired,
  numPages: PropTypes.number,
  currentPage: PropTypes.number.isRequired,
  onPageChange: PropTypes.func.isRequired,
};

export default ThumbnailsSidebar;