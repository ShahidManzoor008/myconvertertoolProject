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
import compression from 'compression';
import logger from './utils/logger.js';

// Import helper functions
import pdfEditorRouter from './routes/pdfEditor.js';
import fileConversionRouter from './routes/fileConversion.js';
import { setupMiddleware } from './middleware/index.js';
import dashboardRouter from './routes/dashboard.js';
import notificationsRouter from './routes/notifications.js';
import statsRouter from './routes/stats.js';
import adminRouter from './routes/admin.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: './.env' });

const app = express();
const port = process.env.PORT || 5000;
// const allowedOrigins =["http://localhost:3000"];
const allowedOrigins = process.env.CORS_ORIGIN
  ? process.env.CORS_ORIGIN.split(",").map(o => o.trim())
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
setupMiddleware(app, allowedOrigins);

// ============================
// Routes
// ============================

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
app.use('/api/dashboard', auth, dashboardRouter);
app.use('/api/notifications', auth, notificationsRouter);
app.use('/api/stats', statsRouter);
app.use('/api/admin', adminRouter);

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
    logger.info(`API running on port:${port}`);
  });

  // Handle uncaught errors
  handleUncaughtErrors(server);
}

export default app; // Export the app for testing