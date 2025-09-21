import express from 'express';
import jwt from 'jsonwebtoken';
import { OAuth2Client } from 'google-auth-library';
import crypto from 'crypto';
import { body, validationResult } from 'express-validator';
import { auth } from '../middleware/auth.js';
import User from '../models/User.js';
import Session from '../models/Session.js';
import { sendEmail } from '../utils/email.js';

const router = express.Router();
const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// User Registration (non-OAuth)
router.post(
  '/register',
  [
    body('name').isLength({ min: 2 }).withMessage('Name must be at least 2 characters'),
    body('email').isEmail().withMessage('Valid email required'),
    body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    try {
      const { name, email, password } = req.body;
      let user = await User.findOne({ email });
      if (user) {
        return res.status(400).json({ error: 'Email already registered' });
      }
      // First user is admin
      const isFirstUser = (await User.countDocuments()) === 0;
      user = new User({
        name,
        email,
        password,
        role: isFirstUser ? 'admin' : 'user',
        status: 'active',
        emailVerified: false
      });
      await user.save();
      res.status(201).json({ message: 'Registration successful' });
    } catch (error) {
      res.status(500).json({ error: 'Registration failed' });
    }
  }
);

// User Login (non-OAuth)
router.post(
  '/login',
  [
    body('email').isEmail().withMessage('Valid email required'),
    body('password').notEmpty().withMessage('Password is required'),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    try {
      const { email, password } = req.body;
      const user = await User.findOne({ email });
      if (!user || !(await user.comparePassword(password))) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }
      if (user.status !== 'active') {
        return res.status(403).json({ error: 'Account is not active' });
      }
      // Create session
      const session = new Session({
        user: user._id,
        token: jwt.sign(
          { userId: user._id },
          process.env.JWT_SECRET,
          { expiresIn: '7d' }
        ),
        userAgent: req.headers['user-agent']
      });
      await session.save();
      res.json({
        token: session.token,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          avatar: user.avatar
        }
      });
    } catch (error) {
      res.status(500).json({ error: 'Login failed' });
    }
  }
);

// Profile Update (authenticated)
router.put(
  '/profile',
  auth,
  [
    body('name').optional().isLength({ min: 2 }).withMessage('Name must be at least 2 characters'),
    body('password').optional().isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    try {
      const updates = {};
      if (req.body.name) updates.name = req.body.name;
      if (req.body.password) updates.password = req.body.password;
      const user = await User.findByIdAndUpdate(req.user._id, updates, { new: true }).select('-password');
      res.json(user);
    } catch (error) {
      res.status(500).json({ error: 'Profile update failed' });
    }
  }
);

// Token Verification Endpoint
router.get('/verify', auth, async (req, res) => {
  try {
    // Get session from database
    const session = await Session.findOne({
      user: req.user._id,
      token: req.token,
      isValid: true
    });

    if (!session) {
      throw new Error('Invalid session');
    }

    // Update last activity
    session.lastActivity = new Date();
    await session.save();

    res.json({
      user: {
        id: req.user._id,
        name: req.user.name,
        email: req.user.email,
        role: req.user.role
      }
    });
  } catch (error) {
    res.status(401).json({ error: 'Invalid token' });
  }
});

// Google OAuth Login/Signup
router.post('/google', async (req, res) => {
  try {
    const { token } = req.body;
    const ticket = await googleClient.verifyIdToken({
      idToken: token,
      audience: process.env.GOOGLE_CLIENT_ID
    });

    const { email, name, picture } = ticket.getPayload();

    // Find or create user
    let user = await User.findOne({ email });
    
    if (!user) {
      // Create new user
      // Check if this is the first user (make them admin)
      const isFirstUser = await User.countDocuments() === 0;
      
      user = new User({
        email,
        name,
        password: crypto.randomBytes(32).toString('hex'), // Random password for OAuth users
        avatar: picture,
        status: 'active',
        role: isFirstUser ? 'admin' : 'user', // First user becomes admin
        emailVerified: true // Google OAuth means email is verified
      });
      await user.save();
    }

    // Create session
    const session = new Session({
      user: user._id,
      token: jwt.sign(
        { userId: user._id },
        process.env.JWT_SECRET,
        { expiresIn: '7d' }
      ),
      userAgent: req.headers['user-agent']
    });
    await session.save();

    res.json({
      token: session.token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        avatar: user.avatar
      }
    });
  } catch (error) {
    res.status(401).json({ error: 'Invalid token' });
  }
});

// Logout
router.post('/logout', auth, async (req, res) => {
  try {
    // Invalidate current session
    await Session.findOneAndUpdate(
      { token: req.token },
      { isValid: false }
    );
    res.json({ message: 'Logged out successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Logout failed' });
  }
});

// Request Password Reset
router.post(
  '/reset-password/request',
  body('email').isEmail().withMessage('Valid email required'),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    try {
      const { email } = req.body;
      const user = await User.findOne({ email });

      if (!user) {
        // Return success even if user doesn't exist (security)
        return res.json({ message: 'If your email exists, you will receive a password reset link' });
      }

      // Generate reset token
      const resetToken = crypto.randomBytes(32).toString('hex');
      const resetTokenExpiry = new Date(Date.now() + 3600000); // 1 hour

      user.resetToken = resetToken;
      user.resetTokenExpiry = resetTokenExpiry;
      await user.save();

  // Build a safe reset URL using configured FRONTEND_URL only
  const frontendBase = process.env.FRONTEND_URL || '';
  const resetUrl = `${frontendBase.replace(/\/$/, '')}/reset-password/${resetToken}`;
      await sendEmail({
        to: user.email,
        subject: 'Password Reset Request',
        text: `To reset your password, click the following link: ${resetUrl}\nThis link will expire in 1 hour.`,
        html: `
          <p>To reset your password, click the following link:</p>
          <a href="${resetUrl}">Reset Password</a>
          <p>This link will expire in 1 hour.</p>
        `
      });

      res.json({ message: 'If your email exists, you will receive a password reset link' });
    } catch (error) {
      res.status(500).json({ error: 'Failed to request password reset' });
    }
  }
);

// Reset Password
router.post(
  '/reset-password',
  [
    body('token').notEmpty().withMessage('Token is required'),
    body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    try {
      const { token, password } = req.body;
      const user = await User.findOne({
        resetToken: token,
        resetTokenExpiry: { $gt: Date.now() }
      });

      if (!user) {
        return res.status(400).json({ error: 'Invalid or expired reset token' });
      }

      // Update password and clear reset token
      user.password = password;
      user.resetToken = undefined;
      user.resetTokenExpiry = undefined;
      await user.save();

      // Invalidate all sessions for this user
      await Session.updateMany(
        { user: user._id },
        { isValid: false }
      );

      res.json({ message: 'Password reset successful' });
    } catch (error) {
      res.status(500).json({ error: 'Failed to reset password' });
    }
  }
);

// Get User Sessions
router.get('/sessions', auth, async (req, res) => {
  try {
    const sessions = await Session.find({
      user: req.user._id,
      isValid: true
    }).select('-token');

    res.json(sessions);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch sessions' });
  }
});

// Revoke Session
router.delete('/sessions/:id', auth, async (req, res) => {
  try {
    await Session.findOneAndUpdate(
      {
        _id: req.params.id,
        user: req.user._id
      },
      { isValid: false }
    );

    res.json({ message: 'Session revoked successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to revoke session' });
  }
});

export default router;