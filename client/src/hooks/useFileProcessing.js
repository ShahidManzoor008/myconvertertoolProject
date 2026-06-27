import { useState, useCallback } from 'react';
import { pdfApi } from '../utils/apiClient';
import { createFormDataWithFiles } from '../utils/fileUtils';
import { AppError } from '../utils/AppError';
import { getFileBlob } from '../utils/fileDownloadUtils';

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

  const createConvertedFile = useCallback((result, originalName, index = 0) => {
    const blob = getFileBlob(result);

    if (!blob && !result?.base64 && !result?.url) {
      throw new Error('The server did not return a downloadable PDF file.');
    }

    return {
      ...(result && typeof result === 'object' && !(result instanceof Blob) ? result : {}),
      id: `${Date.now()}-${index}-${originalName}`,
      blob,
      originalName,
      filename: (result?.filename || originalName).replace(/\.[^.]+$/, '') + '.pdf',
      mimeType: blob?.type || result?.mimeType || 'application/pdf',
      size: blob?.size || result?.size || 0,
    };
  }, []);

  // Process a single file
  const processFile = useCallback(async (file, selectedOperation, currentOperation) => {
    try {
      const formData = createFormDataWithFiles(file, {
        operation: currentOperation,
      });

      const apiCall = (selectedOperation === 'convert') ? pdfApi.convert : pdfApi.edit;
      const result = await apiCall(formData, { responseType: 'blob' });
      const resultWithDetails = createConvertedFile(result, file.name);
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
  }, [showPopup, addToRecent, createConvertedFile]);

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
      const resultList = Array.isArray(results) ? results : [results];

      const newConvertedFiles = resultList.map((result, index) => {
        const originalFile = files[index] || files[0];
        const originalName = originalFile ? originalFile.name : `file_${index}`;
        return createConvertedFile(result, originalName, index);
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
  }, [showPopup, addToRecent, createConvertedFile]);

  // Clear converted files
  const clearConvertedFiles = useCallback(() => {
    setConvertedFiles([]);
  }, []);

  const removeConvertedFile = useCallback((indexToRemove) => {
    setConvertedFiles((prev) => prev.filter((_, index) => index !== indexToRemove));
  }, []);

  return {
    loading,
    convertedFiles,
    canProcessSingle,
    processFile,
    startProcessingAll,
    clearConvertedFiles,
    removeConvertedFile,
    setLoading,
  };
};
