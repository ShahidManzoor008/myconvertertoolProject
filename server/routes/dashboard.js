import express from 'express';
import { auth } from '../middleware/auth.js';
import Conversion from '../models/Conversion.js';

const router = express.Router();

// Get user's dashboard stats
router.get('/stats', auth, async (req, res) => {
  try {
    const userId = req.user._id;
    
    const [totalConversions, recentActivity] = await Promise.all([
      Conversion.countDocuments({ userId, status: 'success' }),
      Conversion.find({ userId })
        .sort({ createdAt: -1 })
        .limit(10)
        .select('toolName fileName status createdAt')
    ]);

    res.json({
      user: {
        id: userId,
        name: req.user.name,
        email: req.user.email,
        role: req.user.role
      },
      stats: {
        totalConversions,
        recentActivity
      }
    });
  } catch (error) {
    console.error('Dashboard Stats Error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;