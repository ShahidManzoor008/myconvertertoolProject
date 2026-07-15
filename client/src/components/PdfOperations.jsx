import PropTypes from 'prop-types';
import { motion } from 'framer-motion';
import { 
  RotateCw, 
  FileDown,
  Stamp,
  Merge,
  Scissors,
} from 'lucide-react';

const PdfOperations = ({ onOperation, loading, currentOperation, uploadedCount }) => {
  const operations = [
    {
      id: 'merge',
      name: 'Merge',
      icon: <Merge className="w-5 h-5" />,
      description: 'Combine 2 or more PDFs',
      disabled: uploadedCount > 0 && uploadedCount < 2,
      disabledReason: 'Upload at least 2 PDFs'
    },
    {
      id: 'rotate',
      name: 'Rotate Pages',
      icon: <RotateCw className="w-5 h-5" />,
      description: 'Rotate all pages in one PDF',
      disabled: uploadedCount > 1,
      disabledReason: 'Use one PDF'
    },
    {
      id: 'split',
      name: 'Split',
      icon: <Scissors className="w-5 h-5" />,
      description: 'Extract a page range',
      disabled: uploadedCount > 1,
      disabledReason: 'Use one PDF'
    },
    {
      id: 'watermark',
      name: 'Add Watermark',
      icon: <Stamp className="w-5 h-5" />,
      description: 'Stamp text on every page',
      disabled: uploadedCount > 1,
      disabledReason: 'Use one PDF'
    },
    {
      id: 'compress',
      name: 'Compress PDF',
      icon: <FileDown className="w-5 h-5" />,
      description: 'Reduce PDF file size',
      disabled: uploadedCount > 1,
      disabledReason: 'Use one PDF'
    }
  ];

  const handleOperationClick = (operation) => {
    onOperation(operation.id);
  };

  return (
    <div>
      <h3 className="text-sm font-black uppercase tracking-widest mb-4 text-slate-400">
        PDF Operations
      </h3>
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
        {operations.map((operation) => (
          <motion.button
            key={operation.id}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => !operation.disabled && handleOperationClick(operation)}
            disabled={loading || operation.disabled}
            className={`flex min-h-32 flex-col items-center justify-center p-4 rounded-2xl border text-center transition-all ${
              currentOperation === operation.id
                ? 'border-red-500 bg-red-50 text-red-700 dark:bg-red-950/30 dark:text-red-300'
                : 'border-slate-200 bg-white text-slate-700 hover:border-red-300 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200'
            } ${(loading || operation.disabled) ? 'opacity-45 cursor-not-allowed' : ''}`}
          >
            <div className={`mb-2 ${
              currentOperation === operation.id
                ? 'text-red-600'
                : 'text-slate-500'
            }`}>
              {operation.icon}
            </div>
            <span className="text-sm font-black">
              {operation.name}
            </span>
            <span className="text-xs text-slate-500 text-center mt-1">
              {operation.disabled ? operation.disabledReason : operation.description}
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
  uploadedCount: PropTypes.number.isRequired,
};

export default PdfOperations;
