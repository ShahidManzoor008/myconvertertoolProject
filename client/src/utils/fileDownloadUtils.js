// Utility functions for file operations

export const downloadFile = (fileData, filename, showPopup) => {
  try {
    const link = document.createElement('a');

    // Handle different file data formats
    if (fileData.base64) {
      link.href = `data:application/pdf;base64,${fileData.base64}`;
    } else if (fileData.url) {
      link.href = fileData.url;
    } else if (fileData instanceof Blob) {
      link.href = URL.createObjectURL(fileData);
    } else {
      throw new Error('Invalid file data format');
    }

    link.download = filename || 'document.pdf';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    if (showPopup) {
      showPopup(`${filename || 'document.pdf'} downloaded.`);
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