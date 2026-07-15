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

  const createConvertedFile = useCallback((result, originalName, index = 0, operation = 'convert') => {
    const fileResult = Array.isArray(result) ? result[0] : result;
    const blob = getFileBlob(fileResult);

    if (!blob && !fileResult?.base64 && !fileResult?.url) {
      throw new Error('The server did not return a downloadable PDF file.');
    }

    const outputExtension = 'pdf';
    const defaultName = {
      merge: 'merged.pdf',
      split: 'split.pdf',
      rotate: 'rotated.pdf',
      compress: 'compressed.pdf',
      watermark: 'watermarked.pdf',
    }[operation];

    return {
      ...(fileResult && typeof fileResult === 'object' && !(fileResult instanceof Blob) ? fileResult : {}),
      id: `${Date.now()}-${index}-${originalName}`,
      blob,
      originalName,
      filename: fileResult?.filename || defaultName || `${originalName.replace(/\.[^.]+$/, '')}.${outputExtension}`,
      mimeType: blob?.type || fileResult?.mimeType || 'application/pdf',
      size: blob?.size || fileResult?.size || 0,
      previewable: outputExtension === 'pdf',
    };
  }, []);

  const buildPdfOperationFormData = useCallback((files, operation, options = {}) => {
    const fileList = Array.isArray(files) ? files : [files];
    const formData = new FormData();

    if (operation === 'merge') {
      fileList.forEach((file) => formData.append('files', file));
      return formData;
    }

    formData.append('file', fileList[0]);

    if (operation === 'rotate') {
      formData.append('rotations', JSON.stringify(options.rotations || [{ pageIndex: 0, angle: 90 }]));
    }

    if (operation === 'split') {
      formData.append('ranges', JSON.stringify(options.ranges || [[0, 0]]));
    }

    if (operation === 'watermark') {
      formData.append('watermarkText', options.watermarkText || '');
      formData.append('options', JSON.stringify(options.watermarkOptions || {}));
    }

    return formData;
  }, []);

  // Process a single file
  const processFile = useCallback(async (file, selectedOperation, currentOperation, operationOptions = {}) => {
    try {
      const isConvertMode = selectedOperation === 'convert';
      const formData = isConvertMode
        ? createFormDataWithFiles(file, { operation: currentOperation })
        : buildPdfOperationFormData(file, currentOperation, operationOptions);
      const result = isConvertMode
        ? await pdfApi.convert(formData)
        : await pdfApi.operation(currentOperation, formData, { responseType: 'blob' });
      const resultWithDetails = createConvertedFile(result, file.name, 0, isConvertMode ? 'convert' : currentOperation);
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
  }, [showPopup, addToRecent, createConvertedFile, buildPdfOperationFormData]);

  // Batch processing: start sequential processing of all uploaded files
  const startProcessingAll = useCallback(async (files, selectedOperation, currentOperation, operationOptions = {}) => {
    if (files.length === 0) return showPopup('No files to process');

    setLoading(true);
    try {
      const isConvertMode = selectedOperation === 'convert';
      const formData = isConvertMode
        ? createFormDataWithFiles(files, { operation: currentOperation })
        : buildPdfOperationFormData(files, currentOperation, operationOptions);
      const results = isConvertMode
        ? await pdfApi.convert(formData)
        : await pdfApi.operation(currentOperation, formData, { responseType: 'blob' });
      const resultList = Array.isArray(results) ? results : [results];

      const newConvertedFiles = resultList.map((result, index) => {
        const originalFile = files[index] || files[0];
        const originalName = originalFile ? originalFile.name : `file_${index}`;
        return createConvertedFile(result, originalName, index, isConvertMode ? 'convert' : currentOperation);
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
  }, [showPopup, addToRecent, createConvertedFile, buildPdfOperationFormData]);

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
