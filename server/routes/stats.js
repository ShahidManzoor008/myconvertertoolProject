import express from 'express';
import { getTotalConversions, logConversion } from '../utils/statsUtils.js';

const router = express.Router();
// @route   POST /api/stats/increment
// @desc    Increment conversion counter for a client-side tool
// @access  Public
router.post('/increment', async (req, res) => {
  try {
    const { toolName, fileName, fileSize } = req.body;
    if (typeof toolName !== 'string' || !/^[a-z0-9-]{1,64}$/.test(toolName) || (fileSize !== undefined && (!Number.isFinite(fileSize) || fileSize < 0 || fileSize > 100 * 1024 * 1024)) || (fileName !== undefined && (typeof fileName !== 'string' || fileName.length > 255))) {
      return res.status(400).json({ error: 'Tool name is required' });
    }

    const recorded = await logConversion({
      toolName,
      userId: req.user?._id, // If user is logged in
      fileName,
      fileSize
    });

    if (!recorded) return res.status(503).json({ error: 'Usage statistics are temporarily unavailable.' });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to increment stats' });
  }
});

// @route   GET /api/stats/total
// @desc    Get total number of successful conversions across all tools
// @access  Public
router.get('/total', async (req, res) => {
  try {
    const total = await getTotalConversions();
    res.json({ total });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch stats' });
  }
});

export default router;
