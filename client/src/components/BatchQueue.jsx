import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FileText,
  X,
  Play,
  Pause,
  RefreshCw,
  AlertCircle,
  CheckCircle,
  Trash2,
  Download
} from 'lucide-react';
import PropTypes from 'prop-types';

const BatchQueue = ({ files, onRemoveFile, onStartProcessing, onPauseProcessing, onDownload, showAuthPopup }) => {
  const [queueStatus, setQueueStatus] = useState('idle'); // idle, processing, paused
  const [processedFiles, setProcessedFiles] = useState([]);
  const [currentFile, setCurrentFile] = useState(null);
  const [error, setError] = useState(null);

  // Process the next file in the queue
  const processNextFile = useCallback(async () => {
    if (queueStatus !== 'processing') return;

    const remainingFiles = files.filter(
      file => !processedFiles.find(pf => pf.originalName === file.name)
    );

    if (remainingFiles.length === 0) {
      setQueueStatus('idle');
      setCurrentFile(null);
      return;
    }

    const fileToProcess = remainingFiles[0];
    setCurrentFile(fileToProcess);

    try {
      await onStartProcessing(fileToProcess);
      setProcessedFiles(prev => [
        ...prev,
        { originalName: fileToProcess.name, status: 'completed' }
      ]);
    } catch (err) {
      setProcessedFiles(prev => [
        ...prev,
        { originalName: fileToProcess.name, status: 'error', error: err.message }
      ]);
      setError(`Error processing ${fileToProcess.name}: ${err.message}`);
    }
  }, [queueStatus, files, processedFiles, onStartProcessing]);

  useEffect(() => {
    if (queueStatus === 'processing') {
      processNextFile();
    }
  }, [queueStatus, processedFiles, processNextFile]);

  const toggleProcessing = () => {
    if (queueStatus === 'processing') {
      setQueueStatus('paused');
      onPauseProcessing?.();
    } else {
      setQueueStatus('processing');
    }
  };

  const clearError = () => setError(null);

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-200">
          Processing Queue
        </h3>
        <div className="flex items-center gap-2">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={toggleProcessing}
            disabled={files.length === 0}
            className={`flex items-center gap-1 px-3 py-1.5 rounded-md ${
              queueStatus === 'processing'
                ? 'bg-yellow-500 hover:bg-yellow-600'
                : 'bg-green-500 hover:bg-green-600'
            } text-white disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            {queueStatus === 'processing' ? (
              <>
                <Pause className="w-4 h-4" />
                Pause
              </>
            ) : (
              <>
                <Play className="w-4 h-4" />
                {queueStatus === 'paused' ? 'Resume' : 'Start Processing'}
              </>
            )}
          </motion.button>
          {processedFiles.length > 0 && (
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={onDownload}
              className="flex items-center gap-1 px-3 py-1.5 rounded-md bg-blue-500 hover:bg-blue-600 text-white"
            >
              <Download className="w-4 h-4" />
              Download All
            </motion.button>
          )}
          {processedFiles.length > 0 && !isLoggedIn && (
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={showAuthPopup}
              className="flex items-center gap-1 px-3 py-1.5 rounded-md bg-purple-500 hover:bg-purple-600 text-white"
            >
              <Save className="w-4 h-4" />
              Save to My Account
            </motion.button>
          )}
        </div>
      </div>

      {/* Queue List */}
      <div className="space-y-2 max-h-[300px] overflow-y-auto">
        <AnimatePresence>
          {files.map((file) => {
            const processedFile = processedFiles.find(
              pf => pf.originalName === file.name
            );
            const isProcessing = currentFile?.name === file.name;

            return (
              <motion.div
                key={file.name}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: -100 }}
                className={`flex items-center justify-between p-3 rounded-lg ${
                  processedFile?.status === 'error'
                    ? 'bg-red-50 dark:bg-red-900'
                    : processedFile?.status === 'completed'
                    ? 'bg-green-50 dark:bg-green-900'
                    : isProcessing
                    ? 'bg-blue-50 dark:bg-blue-900'
                    : 'bg-gray-50 dark:bg-gray-700'
                }`}
              >
                <div className="flex items-center gap-2">
                  <FileText className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                  <span className="text-sm text-gray-700 dark:text-gray-200">
                    {file.name}
                  </span>
                  {isProcessing && (
                    <RefreshCw className="w-4 h-4 animate-spin text-blue-500" />
                  )}
                  {processedFile?.status === 'completed' && (
                    <CheckCircle className="w-4 h-4 text-green-500" />
                  )}
                  {processedFile?.status === 'error' && (
                    <AlertCircle className="w-4 h-4 text-red-500" />
                  )}
                </div>
                <button
                  onClick={() => onRemoveFile(file)}
                  className="p-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-full"
                >
                  {processedFile ? (
                    <Trash2 className="w-4 h-4 text-gray-500" />
                  ) : (
                    <X className="w-4 h-4 text-gray-500" />
                  )}
                </button>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {/* Error Message */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="mt-4 p-3 bg-red-100 dark:bg-red-900 rounded-lg"
          >
            <div className="flex items-start gap-2">
              <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm text-red-700 dark:text-red-200">{error}</p>
              </div>
              <button
                onClick={clearError}
                className="p-1 hover:bg-red-200 dark:hover:bg-red-800 rounded-full"
              >
                <X className="w-4 h-4 text-red-500" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

BatchQueue.propTypes = {
  files: PropTypes.array.isRequired,
  onRemoveFile: PropTypes.func.isRequired,
  onStartProcessing: PropTypes.func.isRequired,
  onPauseProcessing: PropTypes.func,
  onDownload: PropTypes.func.isRequired,
};

export default BatchQueue;