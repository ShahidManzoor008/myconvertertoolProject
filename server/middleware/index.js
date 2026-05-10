import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { securityMiddleware } from './security.js';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import express from 'express';
import { pinoHttp } from 'pino-http';
import logger from '../utils/logger.js';

export const setupMiddleware = (app, allowedOrigins) => {
  // Enhanced security middleware configuration
  const corsOptions = {
    origin: (origin, callback) => {
      if (allowedOrigins.includes(origin) || !origin) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true,
  };
  app.use(cors(corsOptions));

  // Import and use enhanced security middleware
  app.use(securityMiddleware);

  // Basic Helmet configuration (CSP is handled by securityMiddleware)
  app.use(
    helmet({
      contentSecurityPolicy: false, // Disabled because we handle it in securityMiddleware
      crossOriginOpenerPolicy: false, // Explicitly disable Helmet's COOP management
    })
  );

  // Compress responses
  app.use(compression());

  // Parse cookies and JSON with size limits
  app.use(cookieParser());
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

  // Structured HTTP logging
  app.use(pinoHttp({ logger }));

  // Trust proxy for secure cookies in production
  app.set('trust proxy', 1);

  // Rate Limiting
  const globalLimiter = rateLimit({
    windowMs: 1 * 60 * 1000, // 1 minute
    max: 30, // Global limit
    message: { error: "Too many requests, please try again later." },
  });
  const authLimiter = rateLimit({
    windowMs: 1 * 60 * 1000, // 1 minute
    max: 5, // Stricter limit for auth endpoints
    message: { error: "Too many auth requests, please try again later." },
  });
  app.use(globalLimiter);
  app.use("/api/auth", authLimiter);
};