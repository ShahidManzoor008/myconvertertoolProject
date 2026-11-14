import express from 'express';
import mongoose from 'mongoose';
import rateLimit from 'express-rate-limit';
import { adminAuth } from '../middleware/auth.js';
import { AIWriterJob, AIWriterMeter } from '../models/AIWriter.js';
import { briefInput } from '../utils/aiWriterPolicy.js';
import { z } from 'zod';
import { getWriterProviderStatus } from '../utils/aiWriterCredentials.js';
import { cancelWriterJob, enqueueWriter, getWriterSettings, pauseWriter, updateWriterSettings, saveWriterProvider, removeWriterProvider, testWriterConnection, writerTick } from '../utils/aiWriterService.js';
import logger from '../utils/logger.js';

const router = express.Router();
router.use(adminAuth, (_req, res, next) => { res.set('Cache-Control', 'private, no-store'); next(); });
router.use(rateLimit({ windowMs: 60000, limit: 30, skip: () => process.env.NODE_ENV === 'test' }));
const handle = action => async (req, res) => {
  try { await action(req, res); }
  catch (error) {
    const validation = error.name === 'ZodError';
    res.status(validation ? 400 : (error.status || 500)).json({ message: validation ? error.issues.map(issue => `${issue.path.join('.')}: ${issue.message}`).join(' ').slice(0, 700) : (error.status ? error.message : 'AI Writer is temporarily unavailable. Please try again.') });
  }
};
router.get('/', handle(async (_req, res) => {
  const [settings, jobs, usage] = await Promise.all([
    getWriterSettings(),
    AIWriterJob.find().sort({ createdAt: -1 }).limit(30).select('-settings -owner -leaseUntil -brief').populate('article', 'slug title status').lean(),
    AIWriterMeter.findById(`month:${new Date().toISOString().slice(0, 7)}`).lean(),
  ]);
  res.json({ settings, jobs, usage: usage || { requests: 0, tokens: 0 }, provider: await getWriterProviderStatus(), serverMonthlyRequestLimit: Number(process.env.GEMINI_WRITER_MAX_MONTHLY_REQUESTS || 90) });
}));
router.put('/provider', handle(async (req, res) => { res.json(await saveWriterProvider(req.body)); }));
router.post('/provider/disconnect', handle(async (req, res) => {
  const input = z.object({ revision: z.number().int().nonnegative() }).strict().parse(req.body);
  res.json(await removeWriterProvider(input.revision));
}));
router.post('/provider/test', handle(async (_req, res) => { res.json(await testWriterConnection()); }));
router.put('/settings', handle(async (req, res) => { res.json(await updateWriterSettings(req.body)); }));
router.post('/pause', handle(async (_req, res) => { res.json(await pauseWriter()); }));
const kick = () => { if (process.env.NODE_ENV !== 'test') setImmediate(() => writerTick().catch(() => logger.warn('AI Writer could not start the requested run. Check writer history.'))); };
router.post('/generate', handle(async (req, res) => { const input = briefInput.parse(req.body); const job = await enqueueWriter(input.brief); res.status(202).json({ id: job._id, message: 'Queued. Writing starts now when the worker is available.' }); kick(); }));
router.post('/generate-test', handle(async (req, res) => {
  const input = briefInput.parse(req.body);
  const job = await enqueueWriter(input.brief, 'test');
  res.status(202).json({ id: job._id, message: 'Test blog queued. It will always be saved as a private draft.' }); kick();
}));
router.get('/jobs/:id', handle(async (req, res) => {
  if (!mongoose.isObjectIdOrHexString(req.params.id)) return res.status(400).json({ message: 'Invalid run ID.' });
  const job = await AIWriterJob.findById(req.params.id).select('-settings -owner -leaseUntil -brief').populate('article', 'slug title status excerpt').lean();
  if (!job) return res.status(404).json({ message: 'Run not found.' });
  res.json(job);
}));
router.post('/jobs/:id/cancel', handle(async (req, res) => {
  if (!mongoose.isObjectIdOrHexString(req.params.id)) return res.status(400).json({ message: 'Invalid run ID.' });
  res.json(await cancelWriterJob(req.params.id));
}));
router.post('/history/cleanup', handle(async (_req, res) => {
  const result = await AIWriterJob.deleteMany({ state: { $nin: ['running', 'queued'] }, completedAt: { $lt: new Date(Date.now() - 7 * 86400000) } });
  res.json({ removed: result.deletedCount });
}));
export default router;
