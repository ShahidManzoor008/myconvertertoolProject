// Utility functions for file operations

export const getFileBlob = (fileData) => {
  if (fileData instanceof Blob) return fileData;
  if (fileData?.blob instanceof Blob) return fileData.blob;
  if (fileData?.file instanceof Blob) return fileData.file;
  return null;
};

export const downloadFile = (fileData, filename, showPopup) => {
  try {
    const link = document.createElement('a');
    const blob = getFileBlob(fileData);
    const downloadName = filename || fileData?.filename || fileData?.originalName || fileData?.name || 'document.pdf';

    if (fileData?.base64) {
      link.href = `data:application/pdf;base64,${fileData.base64}`;
    } else if (fileData?.url) {
      link.href = fileData.url;
    } else if (blob) {
      const objectUrl = URL.createObjectURL(blob);
      link.href = objectUrl;
      link.download = downloadName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setTimeout(() => URL.revokeObjectURL(objectUrl), 0);

      if (showPopup) {
        showPopup(`${downloadName} downloaded.`);
      }
      return;
    } else {
      throw new Error('Invalid file data format');
    }

    link.download = downloadName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    if (showPopup) {
      showPopup(`${downloadName} downloaded.`);
    }
  } catch (error) {
    console.error('Download failed:', error);
    if (showPopup) {
      showPopup('Download failed. Please try again.');
    }
  }
};

export const createBlobFromBase64 = (base64Data) => {
  try {
    return new Blob([Uint8Array.from(atob(base64Data), c => c.charCodeAt(0))], {
      type: 'application/pdf'
    });
  } catch (error) {
    console.error('Failed to create blob from base64:', error);
    return null;
  }
};
