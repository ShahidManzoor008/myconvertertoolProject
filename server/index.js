// ============================
// 📂 Server: index.js
// ============================

import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import mongoose from 'mongoose';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import path from 'path';
import connectDB from './config/db.js';
import pdfOperationsRouter from './routes/pdfOperations.js';
import authRouter from './routes/auth.js'; // Import authRouter
import { auth } from './middleware/auth.js'; // Keep auth middleware import
import blogRouter from './routes/blog.js';
import batchDownloadRouter from './routes/batchDownload.js';
import morgan from 'morgan';

// Import helper functions
import pdfEditorRouter from './routes/pdfEditor.js';
import fileConversionRouter from './routes/fileConversion.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: './.env' });

const app = express();
const port = process.env.PORT || 5000;
// const allowedOrigins =["http://localhost:3000"];
const allowedOrigins = process.env.CORS_ORIGIN 
  ? process.env.CORS_ORIGIN.split(",") 
  : [
      "http://localhost:5173",
      "http://127.0.0.1:5173",
      "http://localhost:3000",
      "http://127.0.0.1:3000"
    ];
// ============================
// ️ Connect to MongoDB (skip when running tests — jest.setup handles it)
// ============================
if (process.env.NODE_ENV !== 'test' && process.env.JEST_WORKER_ID === undefined) {
  connectDB();
}

// ============================
// 🛡️ Enable CORS and Security Middleware
// ============================
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
import { securityMiddleware } from './middleware/security.js';
app.use(securityMiddleware);

// Basic Helmet configuration (CSP is handled by securityMiddleware)
app.use(
  helmet({
    contentSecurityPolicy: false, // Disabled because we handle it in securityMiddleware
    crossOriginOpenerPolicy: false, // Explicitly disable Helmet's COOP management
  })
);

// Parse cookies and JSON with size limits
app.use(cookieParser());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Development logging
app.use(morgan('dev'));

// Trust proxy for secure cookies in production
app.set('trust proxy', 1);

// ============================
// 🛡️ Rate Limiting
// ============================
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

// ============================
// Routes
// ============================
// Add route logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.originalUrl}`);
  next();
});

// Mount specific path routes first
// When running tests, skip auth middleware to exercise endpoints directly
if (process.env.NODE_ENV === 'test' || process.env.JEST_WORKER_ID !== undefined) {
  app.use('/api/pdf', pdfOperationsRouter);
  // simple health endpoint for tests
  app.get('/health', (req, res) => res.send('OK'));
} else {
  app.use('/api/pdf', auth, pdfOperationsRouter);
}
app.use('/api/blog', blogRouter);
app.use('/api/auth', authRouter);

// Then mount the more generic routes with specific prefixes
app.use('/api/batch', batchDownloadRouter);
app.use('/api/editor', pdfEditorRouter);
app.use('/api/convert', fileConversionRouter);

// Serve uploaded blog images
app.use('/api/blog/images', express.static(path.join(__dirname, 'uploads', 'blog-images')));

// ============================
// Import error handlers
import { errorHandler, handleUncaughtErrors } from './utils/errorHandler.js';
import AppError from './utils/AppError.js';

// Handle undefined routes
app.use((req, res, next) => {
  next(new AppError(`Can't find ${req.originalUrl} on this server!`, 404));
});

// Global error handling middleware
app.use(errorHandler);

// 🚀 Start Backend Server (only when not running tests)
// ============================
let server;
if (process.env.NODE_ENV !== 'test' && process.env.JEST_WORKER_ID === undefined) {
  server = app.listen(port, () => {
    console.log(`API running on port:${port}`);
  });

  // Handle uncaught errors
  handleUncaughtErrors(server);
}

export default app; // Export the app for testing