// Local-only release preview. Never connect this harness to a production database.
import mongoose from 'mongoose';
import express from 'express';
import jwt from 'jsonwebtoken';
import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { setupMiddleware } from '../middleware/index.js';
import routes from '../routes/blog.js';
import User from '../models/User.js';
import Session from '../models/Session.js';
import Blog from '../models/Blog.js';
import { auth } from '../middleware/auth.js';
import { renderArticleHtml } from '../utils/pageSeo.js';
const uri = new URL(process.env.MONGODB_URI || 'mongodb://invalid');
if (process.env.NODE_ENV !== 'test' || uri.hostname !== '127.0.0.1' || uri.port !== '27019' || uri.pathname !== '/blog_preview_test') throw new Error('The blog preview requires its dedicated local test database.');
process.env.JWT_SECRET = 'local-blog-preview-only';
await mongoose.connect(process.env.MONGODB_URI);
let user = await User.findOne({ email: 'blog-preview@example.com' });
if (!user) user = await User.create({ name: 'Preview Admin', email: 'blog-preview@example.com', password: 'LocalPreview123!', role: 'admin' });
const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET);
await Session.updateOne({ token }, { $set: { user: user._id, isValid: true } }, { upsert: true });
await writeFile('/home/ubuntu/.cache/mct-blog-preview-session', token, { mode: 0o600 });
const app = express();
setupMiddleware(app, ['http://127.0.0.1:5055']);
app.get('/api/auth/verify', auth, (req, res) => res.json({ user: { _id: req.user._id, name: req.user.name, role: req.user.role, email: req.user.email } }));
app.get('/api/stats/total', (_req, res) => res.json({ total: 123 }));
app.get('/api/stats/analytics/consent', (_req, res) => res.json({ choice: 'rejected', analyticsAllowed: false }));
app.use('/api/blog', routes);
app.use('/api', (_req, res) => res.status(404).json({ message: 'Not part of this preview.' }));
const dist = process.env.FRONTEND_BUILD_DIR;
if (!dist?.startsWith('/home/ubuntu/.cache/mct-blog-release')) throw new Error('Use the isolated frontend build folder.');
app.use(express.static(dist, { index: false, redirect: false }));
app.get('/{*path}', async (req, res) => {
  try {
    if (req.path.startsWith('/blog/')) {
      const post = await Blog.findOne({ slug: req.path.slice(6), status: 'published' }).lean();
      if (post) return res.type('html').send(await renderArticleHtml(await readFile(path.join(dist, 'index.html'), 'utf8'), post));
    }
    res.sendFile('app.html', { root: dist });
  } catch (error) { res.status(500).send(error.message); }
});
const server = app.listen(5055, '127.0.0.1', () => console.log(`Local blog preview on 127.0.0.1:5055; PID ${process.pid}`));
process.on('SIGTERM', () => server.close(async () => { await mongoose.disconnect(); process.exit(0); }));
