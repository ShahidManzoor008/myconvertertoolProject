import { promises as fileSystem } from 'node:fs';
import Blog from './models/Blog.js';
import { renderArticleHtml, renderPageHtml, makeSitemap } from './utils/pageSeo.js';
// ============================
// 📂 Server: index.js
// ============================

import express from 'express';
import { conversionCapacity } from './middleware/conversionCapacity.js';
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
import spreadsheetConversionRouter from './routes/spreadsheetConversion.js';
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
app.use(['/api/convert', '/api/editor', '/api/pdf', '/api/batch'], conversionCapacity);

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
app.use('/api/convert', spreadsheetConversionRouter);
app.use('/api/dashboard', auth, dashboardRouter);
app.use('/api/notifications', auth, notificationsRouter);
app.use('/api/stats', statsRouter);
app.use('/api/admin', adminRouter);

// Serve uploaded blog images with long-term caching (immutable filenames)
app.use('/api/blog/images', express.static(path.join(__dirname, 'uploads', 'blog-images'), {
  maxAge: '30d',
  immutable: true,
}));

// Serve static files from the React app with hashed asset caching
const clientBuildPath = process.env.FRONTEND_BUILD_DIR || path.join(__dirname, '../client/dist');
const readRoutes = async () => JSON.parse(await fileSystem.readFile(path.join(clientBuildPath, 'routes-manifest.json'), 'utf8'));
app.get('/sitemap.xml', async (_req, res, next) => {
  try {
    const routes = await readRoutes();
    let posts = [];
    try { posts = await Blog.find({}).select('slug updatedAt').limit(5000).maxTimeMS(3000).lean(); } catch { /* Keep public page discovery available if the database is unavailable. */ }
    res.type('application/xml').set('Cache-Control', 'public, max-age=300').send(makeSitemap(routes, posts));
  } catch (error) { next(error); }
});
app.use(express.static(clientBuildPath, {
  index: false,
  redirect: false,
  setHeaders: (res, filePath) => {
    if (filePath.endsWith('.html')) {
      res.setHeader('Cache-Control', 'no-cache');
      return;
    }

    if (filePath.includes(`assets`)) {
      res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
      return;
    }

    res.setHeader('Cache-Control', 'public, max-age=86400');
  },
}));

// ============================
// Import error handlers
import { errorHandler, handleUncaughtErrors } from './utils/errorHandler.js';
import AppError from './utils/AppError.js';

// The catch-all handler: for any request that doesn't
// match one above, send back React's index.html file.
app.get('/{*any}', async (req, res, next) => {
  if (req.path.startsWith('/api')) return next();
  res.setHeader('Cache-Control', 'no-cache');
  const pathname = req.path.replace(/\/+$/, '') || '/';
  if (['/tools/pdf', '/tools/pdf-editor'].includes(pathname)) return res.redirect(301, '/tools/pdf-converter');
  try {
    const routes = await readRoutes();
    const route = routes.find(item => item.path === pathname);
    if (route) return res.sendFile(path.join(clientBuildPath, pathname.slice(1), 'index.html'));
    const template = await fileSystem.readFile(path.join(clientBuildPath, 'index.html'), 'utf8');
    if (pathname.startsWith('/blog/')) {
      const slug = decodeURIComponent(pathname.slice(6));
      if (slug.length <= 300 && !slug.includes('/')) {
        const post = await Blog.findOne({ slug }).maxTimeMS(5000).lean();
        if (post) return res.type('html').send(renderArticleHtml(template, post));
      }
    }
    if (['/login', '/register', '/profile', '/admin'].includes(pathname) || pathname.startsWith('/admin/')) {
      const title = pathname === '/login' ? 'Sign in' : pathname === '/register' ? 'Create account' : 'My account';
      res.setHeader('X-Robots-Tag', 'noindex, follow');
      return res.type('html').send(renderPageHtml(template, { title: title + ' | MyConverterTool', description: 'Access your MyConverterTool account.', pathname, robots: 'noindex, follow',
        content: `<section class="py-12"><h1>${title}</h1><p>Enable JavaScript to access your account.</p></section>` }));
    }
    res.setHeader('X-Robots-Tag', 'noindex, follow');
    return res.status(404).sendFile(path.join(clientBuildPath, '404.html'));
  } catch (error) {
    if (error instanceof URIError) return res.status(400).send('Invalid URL');
    console.error('Page rendering failed:', error.message);
    return res.status(503).set('Retry-After', '60').send('This page is temporarily unavailable. Please try again shortly.');
  }
});

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
  server = app.listen(port, process.env.HOST || '127.0.0.1', () => {
    logger.info(`API running on port:${port}`);
  });

  // Handle uncaught errors
  handleUncaughtErrors(server);
}

export default app; // Export the app for testing
