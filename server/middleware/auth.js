import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import Session from '../models/Session.js';

const auth = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    if (!token) {
      throw new Error('Authentication required');
    }

    // Verify JWT token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Find valid session
    const session = await Session.findOne({
      token,
      isValid: true
    });

    if (!session) {
      throw new Error('Invalid session');
    }

    // Find user
    const user = await User.findOne({ _id: decoded.userId });

    if (!user) {
      throw new Error('User not found');
    }

    // Update session activity
    session.lastActivity = new Date();
    await session.save();

    req.user = user;
    req.token = token;
    req.session = session;
    next();
  } catch (error) {
    res.status(401).json({ error: 'Please authenticate' });
  }
};

const checkRole = (roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Access denied' });
    }

    next();
  };
};

const adminAuth = async (req, res, next) => {
  try {
    // First verify the token and session
    await auth(req, res, () => {
      // Then check if user is admin
      if (req.user.role !== 'admin' || req.user.status !== 'active') {
        throw new Error('Admin access required');
      }
      next();
    });
  } catch (error) {
    res.status(403).json({ error: 'Admin access required' });
  }
};

export { auth, adminAuth };