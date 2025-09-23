import { useState, useCallback } from 'react';
import { processPdfFiles } from '../utils/pdfProcessing';
import { AppError } from '../utils/AppError';

export const usePdfOperations = (onError) => {
  const [loading, setLoading] = useState(false);
  const [convertedFiles, setConvertedFiles] = useState([]);

  const handleSingleOperation = useCallback(async (file, operation, options = {}) => {
    setLoading(true);
    try {
      const result = await processPdfFiles.convert(file, operation, options);
      setConvertedFiles([result]);
      return result;
    } catch (error) {
      if (error instanceof AppError) {
        onError(error);
      } else {
        onError(new AppError('Operation failed', 500));
      }
      throw error;
    } finally {
      setLoading(false);
    }
  }, [onError]);

  const handleBatchOperation = useCallback(async (files, operation) => {
    setLoading(true);
    try {
      const results = await processPdfFiles.batch(files, operation);
      setConvertedFiles(results);
      return results;
    } catch (error) {
      if (error instanceof AppError) {
        onError(error);
      } else {
        onError(new AppError('Batch operation failed', 500));
      }
      throw error;
    } finally {
      setLoading(false);
    }
  }, [onError]);

  const downloadSingle = useCallback(async (fileId, filename) => {
    setLoading(true);
    try {
      await processPdfFiles.downloadSingle(fileId, filename);
    } catch (error) {
      if (error instanceof AppError) {
        onError(error);
      } else {
        onError(new AppError('Download failed', 500));
      }
      throw error;
    } finally {
      setLoading(false);
    }
  }, [onError]);

  const downloadBatch = useCallback(async (files) => {
    setLoading(true);
    try {
      await processPdfFiles.downloadBatch(files);
    } catch (error) {
      if (error instanceof AppError) {
        onError(error);
      } else {
        onError(new AppError('Batch download failed', 500));
      }
      throw error;
    } finally {
      setLoading(false);
    }
  }, [onError]);

  const clearFiles = useCallback(() => {
    setConvertedFiles([]);
  }, []);

  return {
    loading,
    convertedFiles,
    handleSingleOperation,
    handleBatchOperation,
    downloadSingle,
    downloadBatch,
    clearFiles
  };
};