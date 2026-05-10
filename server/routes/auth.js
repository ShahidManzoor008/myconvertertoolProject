import express from 'express';
import { auth } from '../middleware/auth.js';
import {
  validate,
  registerSchema,
  loginSchema,
  updateProfileSchema,
  requestPasswordResetSchema,
  resetPasswordSchema
} from '../utils/validation.js';
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
  validate(registerSchema),
  registerUser
);

// User Login (non-OAuth)
router.post(
  '/login',
  validate(loginSchema),
  loginUser
);

// Profile Update (authenticated)
router.put(
  '/profile',
  auth,
  validate(updateProfileSchema),
  updateProfile
);

// Token Verification Endpoint
router.get('/verify', auth, verifyToken);

// Google OAuth Login/Signup
router.post('/google', googleAuth);

// Logout
router.post('/logout', auth, logoutUser);

// Get Profile (authenticated)
router.get('/profile', auth, async (req, res) => {
  try {
    res.json({
      user: {
        id: req.user._id,
        name: req.user.name,
        email: req.user.email,
        role: req.user.role,
        avatar: req.user.avatar
      }
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch profile' });
  }
});

// Request Password Reset
router.post(
  '/reset-password/request',
  validate(requestPasswordResetSchema),
  requestPasswordReset
);

// Reset Password
router.post(
  '/reset-password',
  validate(resetPasswordSchema),
  resetPassword
);

// Get User Sessions
router.get('/sessions', auth, getUserSessions);

// Revoke Session
router.delete('/sessions/:id', auth, revokeSession);

export default router;