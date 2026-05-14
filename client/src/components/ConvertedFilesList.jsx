import { motion } from 'framer-motion';
import { Eye } from 'lucide-react';

const ConvertedFilesList = ({ files, onPreview, onDownload }) => {
  if (files.length === 0) return null;

  return (
    <div className="mt-6">
      <h4 className="text-lg font-semibold text-gray-700 dark:text-gray-200 mb-2">Converted Files:</h4>
      <ul className="list-disc list-inside text-gray-600 dark:text-gray-300">
        {files.map((file, index) => {
          const converted = file.filename ? file : (file[0] || {});
          return (
            <li key={index} className="flex items-center justify-between py-1">
              <span className="truncate">{converted.filename || file.originalName}</span>
              <div className="flex items-center gap-2">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => onPreview(converted)}
                  disabled={false} // You can add logic to disable if already viewing
                  className="ml-2 px-3 py-1 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
                >
                  <Eye className="w-4 h-4" />
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => onDownload(converted)}
                  className="px-3 py-1 bg-green-500 text-white rounded-md hover:bg-green-600 transition-colors"
                >
                  Download
                </motion.button>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
};

export default ConvertedFilesList;