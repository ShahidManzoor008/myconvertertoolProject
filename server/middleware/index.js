import cors from 'cors';
import AppError from '../utils/AppError.js';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { securityMiddleware } from './security.js';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import express from 'express';
import { pinoHttp } from 'pino-http';
import logger from '../utils/logger.js';
import { AUTH_COOKIE_NAME } from '../utils/authCookies.js';

export const setupMiddleware = (app, allowedOrigins) => {
  // Enhanced security middleware configuration
  const corsOptions = {
    origin: (origin, callback) => {
      if (allowedOrigins.includes(origin) || !origin) {
        callback(null, true);
      } else {
        callback(new AppError('Origin is not allowed', 403));
      }
    },
    credentials: true,
  };
  app.use(cors(corsOptions));

  // API responses may include account or conversion data. Keep browsers and
  // intermediary caches from retaining them. Public immutable blog images get
  // their explicit long-lived cache policy in the route handler.
  app.use('/api', (req, res, next) => {
    if (!req.path.startsWith('/blog/images/')) res.setHeader('Cache-Control', 'no-store');
    next();
  });

  // Import and use enhanced security middleware
  app.use(securityMiddleware);

  // Basic Helmet configuration (CSP is handled by securityMiddleware)
  app.use(
    helmet({
      contentSecurityPolicy: false, // Disabled because we handle it in securityMiddleware
      crossOriginOpenerPolicy: false, // Explicitly disable Helmet's COOP management
      // GIS must receive the site origin when loading its cross-origin button.
      referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
    })
  );

  // Compress responses
  app.use(compression());

  // Parse cookies and JSON with size limits
  app.use(cookieParser());
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

  // Cookie-authenticated state changes must originate from an approved site.
  app.use('/api', (req, res, next) => {
    const safeMethod = ['GET', 'HEAD', 'OPTIONS'].includes(req.method);
    if (!safeMethod) {
      const origin = req.get('origin');
      if ((origin && !allowedOrigins.includes(origin)) || (req.cookies?.[AUTH_COOKIE_NAME] && !origin)) {
        return res.status(403).json({ error: 'Request origin is not allowed.' });
      }
    }
    next();
  });

  // Structured HTTP logging
  app.use(pinoHttp({ logger }));

  // Trust proxy for secure cookies in production
  app.set('trust proxy', 1);

  // Rate Limiting
  const globalLimiter = rateLimit({
    skip: () => process.env.NODE_ENV === 'test',
    windowMs: 1 * 60 * 1000, // 1 minute
    max: 30, // Global limit
    message: { error: "Too many requests, please try again later." },
  });
  const authLimiter = rateLimit({
    // Loading a public sign-in setting is not a login attempt.
    skip: (req) => process.env.NODE_ENV === 'test' || (req.method === 'GET' && req.path === '/config'),
    windowMs: 1 * 60 * 1000, // 1 minute
    max: 5, // Stricter limit for auth endpoints
    message: { error: "Too many auth requests, please try again later." },
  });
  app.use('/api', globalLimiter);
  app.use("/api/auth", authLimiter);
};
