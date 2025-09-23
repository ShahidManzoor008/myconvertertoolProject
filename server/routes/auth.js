import express from 'express';
import { body } from 'express-validator';
import { auth } from '../middleware/auth.js';
import {
  registerUser,
  loginUser,
  updateProfile,
  verifyToken,
  googleAuth,
  logoutUser,
  requestPasswordReset,
  resetPassword,
  getUserSessions,
  revokeSession
} from '../controllers/authController.js';

const router = express.Router();

// User Registration (non-OAuth)
router.post(
  '/register',
  [
    body('name').isLength({ min: 2 }).withMessage('Name must be at least 2 characters'),
    body('email').isEmail().withMessage('Valid email required'),
    body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),
  ],
  registerUser
);

// User Login (non-OAuth)
router.post(
  '/login',
  [
    body('email').isEmail().withMessage('Valid email required'),
    body('password').notEmpty().withMessage('Password is required'),
  ],
  loginUser
);

// Profile Update (authenticated)
router.put(
  '/profile',
  auth,
  [
    body('name').optional().isLength({ min: 2 }).withMessage('Name must be at least 2 characters'),
    body('password').optional().isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),
  ],
  updateProfile
);

// Token Verification Endpoint
router.get('/verify', auth, verifyToken);

// Google OAuth Login/Signup
router.post('/google', googleAuth);

// Logout
router.post('/logout', auth, logoutUser);

// Request Password Reset
router.post(
  '/reset-password/request',
  body('email').isEmail().withMessage('Valid email required'),
  requestPasswordReset
);

// Reset Password
router.post(
  '/reset-password',
  [
    body('token').notEmpty().withMessage('Token is required'),
    body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),
  ],
  resetPassword
);

// Get User Sessions
router.get('/sessions', auth, getUserSessions);

// Revoke Session
router.delete('/sessions/:id', auth, revokeSession);

export default router;