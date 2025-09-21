const express = require('express');
const router = express.Router();
const { adminAuth } = require('../middleware/auth');
const User = require('../models/User');

// Get dashboard stats
router.get('/stats', adminAuth, async (req, res) => {
  try {
    const stats = {
      users: await User.countDocuments(),
      activeUsers: await User.countDocuments({ status: 'active' }),
      // Add more stats as needed
    };
    res.json(stats);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get all users (with pagination)
router.get('/users', adminAuth, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;
    const total = await User.countDocuments();
    const users = await User.find({})
      .select('-password')
      .skip(skip)
      .limit(limit);
    res.json({ users, page, limit, total });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

const { body, validationResult } = require('express-validator');
// Simple audit logger (can be replaced with file/db logger)
function auditLog(action, details, adminId) {
  const log = {
    timestamp: new Date().toISOString(),
    action,
    details,
    adminId
  };
  console.log('[AUDIT]', JSON.stringify(log));
}

// Update user
router.put(
  '/users/:id',
  adminAuth,
  [
    body('email').optional().isEmail().withMessage('Valid email required'),
    body('name').optional().isLength({ min: 2 }).withMessage('Name must be at least 2 characters'),
    body('role').optional().isIn(['user', 'admin']).withMessage('Role must be user or admin'),
    body('status').optional().isIn(['active', 'inactive']).withMessage('Status must be active or inactive'),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    try {
      const { name, email, role, status } = req.body;
      const userId = req.params.id;

      // Prevent self-role-change
      if (userId === req.user.id && role && role !== req.user.role) {
        return res.status(400).json({ error: 'Cannot modify own role' });
      }

      // Check if trying to modify another admin
      const targetUser = await User.findById(userId);
      if (targetUser.role === 'admin' && req.user.id !== userId) {
        return res.status(403).json({ error: 'Cannot modify other admin users' });
      }

      // Validate role
      if (role && !['user', 'admin'].includes(role)) {
        return res.status(400).json({ error: 'Invalid role' });
      }

      const user = await User.findByIdAndUpdate(
        userId,
        { name, email, role, status },
        { new: true }
      ).select('-password');

      // Log role change
      if (role && role !== targetUser.role) {
        auditLog('role_change', { userId, from: targetUser.role, to: role }, req.user.id);
      }
      auditLog('user_update', { userId, updatedFields: { name, email, role, status } }, req.user.id);

      res.json(user);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
);

// Delete user
router.delete('/users/:id', adminAuth, async (req, res) => {
  try {
    await User.findByIdAndDelete(req.params.id);
    auditLog('user_delete', { userId: req.params.id }, req.user.id);
    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;