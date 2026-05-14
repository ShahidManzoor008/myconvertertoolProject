import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';

export const useFileUpload = (selectedOperation) => {
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [popupMessage, setPopupMessage] = useState("");

  // Determine accepted file types based on the chosen high-level operation
  const getAcceptForOperation = useCallback((op) => {
    switch (op) {
      case 'convert':
        return {
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document": ['.docx'],
          "application/msword": ['.doc'],
          "application/vnd.ms-excel": ['.xlsx', '.xls'],
          "application/vnd.ms-powerpoint": ['.ppt', '.pptx'],
          "text/markdown": ['.md', '.MD'],
          "text/plain": ['.txt'],
          'image/jpeg': ['.jpg', '.jpeg'],
          'image/png': ['.png'],
        };
      case 'edit':
        return {
          'application/pdf': ['.pdf'],
        };
      default:
        return getAcceptForOperation('convert');
    }
  }, []);

  // Show a popup message for 2.5 seconds
  const showPopup = useCallback((message) => {
    setPopupMessage(message);
    setTimeout(() => setPopupMessage(""), 2500);
  }, []);

  // Configure dropzone for file uploads
  const { getRootProps, getInputProps } = useDropzone({
    multiple: true,
    accept: getAcceptForOperation(selectedOperation || 'convert'),
    onDrop: (acceptedFiles, rejectedFiles) => {
      if (rejectedFiles.length > 0) {
        showPopup(`Invalid file types: ${rejectedFiles.map((f) => f.name).join(", ")}`);
      }

      const allowedMimeTypes = getAcceptForOperation(selectedOperation || 'convert');
      const allowedExtensions = Object.values(allowedMimeTypes).flat().map(ext => ext.substring(1));

      const filteredFiles = acceptedFiles.filter((file) => {
        const ext = file.name.split(".").pop().toLowerCase();
        return allowedExtensions.includes(ext);
      });

      if (filteredFiles.length === 0) {
        showPopup("No valid files selected!");
        return;
      }

      setUploadedFiles(filteredFiles);
      showPopup(`${filteredFiles.length} valid file(s) selected`);
    },
  });

  // Clear selected files
  const handleClearSelection = useCallback(() => {
    setUploadedFiles([]);
    showPopup("Selection cleared");
  }, [showPopup]);

  // Remove specific file
  const removeFile = useCallback((index) => {
    setUploadedFiles(prev => {
      const newFiles = prev.filter((_, i) => i !== index);
      showPopup(`${prev[index].name} removed.`);
      return newFiles;
    });
  }, [showPopup]);

  return {
    uploadedFiles,
    popupMessage,
    getRootProps,
    getInputProps,
    handleClearSelection,
    removeFile,
    showPopup,
    getAcceptForOperation,
  };
};