// Shared UI utility functions for popups and downloads

/**
 * Show a temporary popup message
 * @param {Function} setPopupMessage - React setState function
 * @param {string} message - Message to display
 * @param {number} duration - Duration in ms (default: 2500)
 */
export function showPopup(setPopupMessage, message, duration = 2500) {
  setPopupMessage(message);
  setTimeout(() => setPopupMessage(''), duration);
}

/**
 * Download text content as a file
 * @param {string} content - Content to download
 * @param {string} filename - Name of the file
 * @param {string} mimeType - MIME type (default: 'text/plain')
 */
export function handleDownload(content, filename = 'output.txt', mimeType = 'text/plain') {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
