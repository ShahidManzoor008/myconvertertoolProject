import PropTypes from 'prop-types';
import { motion } from 'framer-motion';
import { 
  RotateCw, 
  Image as ImageIcon, 
  FileDown,
  MoveVertical,
  Stamp,
  Lock,
  Edit,
  
} from 'lucide-react';

const PdfOperations = ({ onOperation, loading, currentOperation }) => {
  const operations = [
    {
      id: 'edit',
      name: 'Edit PDF',
      icon: <Edit className="w-5 h-5" />,
      description: 'Add text, shapes, and annotations'
    },
    {
      id: 'rotate',
      name: 'Rotate Pages',
      icon: <RotateCw className="w-5 h-5" />,
      description: 'Rotate PDF pages'
    },
    {
      id: 'reorder',
      name: 'Reorder Pages',
      icon: <MoveVertical className="w-5 h-5" />,
      description: 'Change page order'
    },
    {
      id: 'watermark',
      name: 'Add Watermark',
      icon: <Stamp className="w-5 h-5" />,
      description: 'Add text or image watermark'
    },
    {
      id: 'compress',
      name: 'Compress PDF',
      icon: <FileDown className="w-5 h-5" />,
      description: 'Reduce PDF file size'
    },
    {
      id: 'protect',
      name: 'Protect PDF',
      icon: <Lock className="w-5 h-5" />,
      description: 'Add password protection'
    },
    {
      id: 'extract-images',
      name: 'Extract Images',
      icon: <ImageIcon className="w-5 h-5" />,
      description: 'Extract images from PDF'
    }
  ];

  const handleOperationClick = (operation) => {
    onOperation(operation.id);
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-4">
      <h3 className="text-lg font-semibold mb-4 text-gray-700 dark:text-gray-200">
        PDF Operations
      </h3>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
        {operations.map((operation) => (
          <motion.button
            key={operation.id}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => handleOperationClick(operation)}
            disabled={loading}
            className={`flex flex-col items-center p-4 rounded-lg transition-colors ${
              currentOperation === operation.id
                ? 'bg-blue-50 dark:bg-blue-900'
                : 'bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600'
            } ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            <div className={`mb-2 ${
              currentOperation === operation.id
                ? 'text-blue-500'
                : 'text-gray-600 dark:text-gray-300'
            }`}>
              {operation.icon}
            </div>
            <span className="text-sm font-medium text-gray-700 dark:text-gray-200">
              {operation.name}
            </span>
            <span className="text-xs text-gray-500 dark:text-gray-400 text-center mt-1">
              {operation.description}
            </span>
          </motion.button>
        ))}
      </div>
    </div>
  );
};

PdfOperations.propTypes = {
  onOperation: PropTypes.func.isRequired,
  loading: PropTypes.bool.isRequired,
  currentOperation: PropTypes.string.isRequired,
};

export default PdfOperations;