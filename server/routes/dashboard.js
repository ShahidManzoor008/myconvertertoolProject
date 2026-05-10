import express from 'express';
import { auth } from '../middleware/auth.js';

const router = express.Router();

// Get user's dashboard stats
router.get('/stats', auth, async (req, res) => {
  try {
    // Placeholder for dashboard stats - can be expanded later
    res.json({
      user: {
        id: req.user._id,
        name: req.user.name,
        email: req.user.email,
        role: req.user.role
      },
      stats: {
        totalConversions: 0, // Placeholder
        recentActivity: [] // Placeholder
      }
    });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;