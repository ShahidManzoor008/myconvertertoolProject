import { useState, useCallback } from 'react';
import { pdfApi } from '../utils/apiClient';
import { createFormDataWithFiles } from '../utils/fileUtils';
import { AppError } from '../utils/AppError';

export const useFileProcessing = (showPopup, addToRecent) => {
  const [loading, setLoading] = useState(false);
  const [convertedFiles, setConvertedFiles] = useState([]);

  // Helper: determine file extension
  const getFileExt = useCallback((file) => (file?.name || '').split('.').pop().toLowerCase(), []);

  // Determine if a single file can be processed for the selected operation
  const canProcessSingle = useCallback((file, operation) => {
    if (!file) return false;
    const ext = getFileExt(file);
    switch (operation) {
      case 'convert': {
        const acceptedTypes = [
          'docx', 'doc', 'xlsx', 'xls', 'ppt', 'pptx', 'md', 'txt',
          'jpg', 'jpeg', 'png'
        ];
        return acceptedTypes.includes(ext);
      }
      case 'edit':
        return ext === 'pdf';
      default:
        return false;
    }
  }, [getFileExt]);

  // Process a single file
  const processFile = useCallback(async (file, selectedOperation, currentOperation) => {
    try {
      const formData = createFormDataWithFiles(file, {
        operation: currentOperation,
      });

      const apiCall = (selectedOperation === 'convert') ? pdfApi.convert : pdfApi.edit;
      const result = await apiCall(formData, { responseType: 'blob' });
      const resultWithDetails = {
        file: result,
        originalName: file.name,
        filename: file.name.replace(/\.[^.]+$/, '') + '.pdf',
        mimeType: result.type || 'application/pdf',
        size: result.size,
      };
      setConvertedFiles(prev => [...prev, resultWithDetails]);
      addToRecent(resultWithDetails);
      return resultWithDetails;
    } catch (err) {
      if (err instanceof AppError && err.status === 401) {
        throw err; // Re-throw for auth handling
      }
      showPopup(`${currentOperation} operation failed: ${err.message}`);
      throw err;
    }
  }, [showPopup, addToRecent]);

  // Batch processing: start sequential processing of all uploaded files
  const startProcessingAll = useCallback(async (files, selectedOperation, currentOperation) => {
    if (files.length === 0) return showPopup('No files to process');

    setLoading(true);
    try {
      const formData = createFormDataWithFiles(files, {
        operation: currentOperation,
      });

      const apiCall = (selectedOperation === 'convert') ? pdfApi.convert : pdfApi.edit;
      const results = await apiCall(formData, { responseType: 'blob' });

      const newConvertedFiles = results.map((result, index) => {
        const originalFile = files[index];
        const originalName = originalFile ? originalFile.name : `file_${index}`;
        return {
          file: result,
          originalName,
          filename: originalName.replace(/\.[^.]+$/, '') + '.pdf',
          mimeType: result.type || 'application/pdf',
          size: result.size,
        };
      });

      setConvertedFiles(prev => [...prev, ...newConvertedFiles]);
      newConvertedFiles.forEach(file => addToRecent(file));
      showPopup('Batch processing complete');
    } catch (err) {
      if (err instanceof AppError && err.status === 401) {
        throw err; // Re-throw for auth handling
      }
      showPopup(`${currentOperation} operation failed: ${err.message}`);
    } finally {
      setLoading(false);
    }
  }, [showPopup, addToRecent]);

  // Clear converted files
  const clearConvertedFiles = useCallback(() => {
    setConvertedFiles([]);
  }, []);

  return {
    loading,
    convertedFiles,
    canProcessSingle,
    processFile,
    startProcessingAll,
    clearConvertedFiles,
    setLoading,
  };
};