import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import Session from '../models/Session.js';
import { AUTH_COOKIE_NAME, clearAuthCookie } from '../utils/authCookies.js';

const tokenFrom = (req, allowBearer = false) => req.cookies?.[AUTH_COOKIE_NAME]
  || (allowBearer ? req.header('Authorization')?.replace(/^Bearer\s+/i, '') : null);

const loadAuth = async (req, { allowBearer = false } = {}) => {
  const token = tokenFrom(req, allowBearer);
  if (!token) throw new Error('Authentication required');
  const decoded = jwt.verify(token, process.env.JWT_SECRET);
  const [session, user] = await Promise.all([
    Session.findOne({ token, isValid: true }),
    User.findOne({ _id: decoded.userId, status: 'active' }),
  ]);
  if (!session || !user) throw new Error('Invalid session');
  req.user = user;
  req.token = token;
  req.session = session;
  await Session.updateOne({ _id: session._id }, { $set: { lastActivity: new Date() } });
  return user;
};

const auth = async (req, res, next) => {
  try {
    await loadAuth(req);
    next();
  } catch (error) {
    if (req.cookies?.[AUTH_COOKIE_NAME]) clearAuthCookie(res, req);
    res.status(401).json({ error: 'Please authenticate' });
  }
};

const legacyBearerAuth = async (req, res, next) => {
  try { await loadAuth(req, { allowBearer: true }); next(); }
  catch { res.status(401).json({ error: 'Please sign in again.' }); }
};

const optionalAuth = async (req, _res, next) => {
  try {
    if (tokenFrom(req)) await loadAuth(req);
  } catch {
    // Expired optional sessions must not prevent public tools from working.
    if (req.cookies?.[AUTH_COOKIE_NAME]) clearAuthCookie(_res, req);
  }
  next();
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
    await loadAuth(req);
    if (req.user.role !== 'admin') return res.status(403).json({ error: 'Admin access required' });
    next();
  } catch (error) {
    if (req.cookies?.[AUTH_COOKIE_NAME]) clearAuthCookie(res, req);
    res.status(401).json({ error: 'Admin access required' });
  }
};

export { auth, legacyBearerAuth, optionalAuth, adminAuth, loadAuth };
