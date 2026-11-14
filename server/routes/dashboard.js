import express from 'express';
import { auth } from '../middleware/auth.js';
import Conversion from '../models/Conversion.js';
import UserDailyUsage from '../models/UserDailyUsage.js';

const router = express.Router();

// Get user's dashboard stats
router.get('/stats', auth, async (req, res) => {
  try {
    const userId = req.user._id;
    
    const [legacyConversions, totalConversions, recentActivity] = await Promise.all([
      Conversion.countDocuments({ userId, status: 'success' }),
      UserDailyUsage.aggregate([
        { $match: { userId, action: 'conversion', outcome: 'success' } },
        { $group: { _id: '$toolName', count: { $sum: '$count' } } },
      ]),
      UserDailyUsage.find({ userId, action: 'conversion' })
        .sort({ day: -1 })
        .limit(30)
        .select('toolName outcome reason count day -_id')
    ]);

    res.json({
      user: {
        id: userId,
        name: req.user.name,
        email: req.user.email,
        role: req.user.role
      },
      stats: {
        totalConversions: legacyConversions + totalConversions.reduce((sum, row) => sum + row.count, 0),
        recentActivity
      }
    });
  } catch (error) {
    console.error('Dashboard Stats Error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;
