import { pdfApi, batchApi } from './apiClient';
import { createFormDataWithFiles, createFileFromBlob, validateFile, ALLOWED_FILE_TYPES } from './fileUtils';
import { FileProcessingError, FileSizeError, FileTypeError } from './AppError';

/**
 * Handles PDF file processing operations
 */
export const processPdfFiles = {
  /**
   * Convert a single PDF file using the specified operation
   * @param {File} file - The file to convert
   * @param {string} operation - The conversion operation to perform
   * @param {Object} options - Additional options for the conversion
   * @returns {Promise<Object>} The conversion result
   * @throws {FileTypeError} If file type is invalid
   * @throws {FileSizeError} If file size exceeds limit
   * @throws {FileProcessingError} If conversion fails
   */
  async convert(file, operation, options = {}) {
    try {
      // Validate file type and size
      validateFile(file, ALLOWED_FILE_TYPES.pdf);

      const formData = createFormDataWithFiles(file, {
        operation,
        ...options
      });

      return await pdfApi.convert(formData);
    } catch (error) {
      console.error(`Error in ${operation} operation:`, error);
      if (error instanceof FileTypeError || error instanceof FileSizeError) {
        throw error;
      }
      throw new FileProcessingError(`Failed to process PDF: ${error.message}`);
    }
  },

  /**
   * Process multiple PDF files in batch
   * @param {File[]} files - Array of files to process
   * @param {string} operation - The operation to perform on each file
   * @returns {Promise<Array>} Array of processing results
   * @throws {FileTypeError} If any file type is invalid
   * @throws {FileSizeError} If any file size exceeds limit
   * @throws {FileProcessingError} If batch processing fails
   */
  async batch(files, operation) {
    try {
      const results = [];
      
      // Validate all files before processing
      for (const file of files) {
        validateFile(file, ALLOWED_FILE_TYPES.pdf);
      }
      
      for (const file of files) {
        try {
          const formData = createFormDataWithFiles(file, { operation });
          const result = await pdfApi.convert(formData);
          results.push({
            ...result,
            originalName: file.name,
            status: 'success'
          });
        } catch (error) {
          results.push({
            originalName: file.name,
            status: 'error',
            error: error.message
          });
        }
      }

      if (results.every(result => result.status === 'error')) {
        throw new FileProcessingError('All files failed to process');
      }

      return results;
    } catch (error) {
      console.error('Error in batch processing:', error);
      if (error instanceof FileTypeError || error instanceof FileSizeError) {
        throw error;
      }
      throw new FileProcessingError(`Batch processing failed: ${error.message}`);
    }
  },

  /**
   * Download a single processed file
   * @param {string} fileId - The ID of the file to download
   * @param {string} filename - The name to save the file as
   * @throws {FileProcessingError} If download fails
   */
  async downloadSingle(fileId, filename) {
    try {
      const blob = await pdfApi.download(fileId);
      // Validate that we received a PDF
      if (blob.type !== 'application/pdf') {
        throw new FileTypeError('Received invalid file type from server');
      }
      await createFileFromBlob(blob, filename);
    } catch (error) {
      console.error('Error downloading file:', error);
      if (error instanceof FileTypeError) {
        throw error;
      }
      throw new FileProcessingError(`Failed to download file: ${error.message}`);
    }
  },

  /**
   * Download multiple processed files as a zip
   * @param {Array} files - Array of file information objects
   * @throws {FileProcessingError} If batch download fails
   */
  async downloadBatch(files) {
    try {
      const blob = await batchApi.download(files);
      // Validate that we received a zip file
      if (blob.type !== 'application/zip') {
        throw new FileTypeError('Received invalid file type from server');
      }
      await createFileFromBlob(blob, 'processed_files.zip');
    } catch (error) {
      console.error('Error downloading batch:', error);
      if (error instanceof FileTypeError) {
        throw error;
      }
      throw new FileProcessingError(`Failed to download files: ${error.message}`);
    }
  }
};
