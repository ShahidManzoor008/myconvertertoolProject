import Conversion from '../models/Conversion.js';
import logger from './logger.js';

/**
 * Logs a tool conversion to the database.
 * @param {Object} data - Conversion data
 * @param {string} data.toolName - Name of the tool used
 * @param {string} [data.userId] - ID of the user (optional)
 * @param {string} [data.fileName] - Name of the file (optional)
 * @param {number} [data.fileSize] - Size of the file in bytes (optional)
 * @param {string} [data.status] - Status of the conversion (default: 'success')
 */
export const logConversion = async ({ toolName, userId, fileName, fileSize, status = 'success' }) => {
  try {
    await Conversion.create({
      userId,
      toolName,
      fileName,
      fileSize,
      status,
    });
    logger.debug({ toolName, fileName }, 'Conversion logged successfully');
  } catch (error) {
    logger.error({ error, toolName }, 'Failed to log conversion');
  }
};

/**
 * Gets the total number of successful conversions.
 * @returns {Promise<number>} Total conversion count
 */
export const getTotalConversions = async () => {
  try {
    return await Conversion.countDocuments({ status: 'success' });
  } catch (error) {
    logger.error(error, 'Failed to get total conversions');
    return 0;
  }
};
