import express from 'express';
import { adminAuth } from '../middleware/auth.js';
import User from '../models/User.js';
import Blog from '../models/Blog.js';
import Conversion from '../models/Conversion.js';
import UserDailyUsage from '../models/UserDailyUsage.js';
import AnonymousVisitorDay from '../models/AnonymousVisitorDay.js';
import { getTotalConversions, getUsageAnalytics } from '../utils/statsUtils.js';
import { body, validationResult } from 'express-validator';
import { lstat, readdir, rm, stat, statfs, unlink } from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import mongoose from 'mongoose';
import { getConversionCapacityStatus } from '../middleware/conversionCapacity.js';

const router = express.Router();

// Get dashboard stats
router.get('/stats', adminAuth, async (req, res) => {
  try {
    const stats = {
      users: await User.countDocuments(),
      activeUsers: await User.countDocuments({ status: 'active' }),
      posts: await Blog.countDocuments(),
      conversions: await getTotalConversions(),
    };
    res.json(stats);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/analytics', adminAuth, async (req, res) => {
  try {
    const days = Math.min(90, Math.max(1, Number.parseInt(req.query.days, 10) || 30));
    res.set('Cache-Control', 'no-store').json(await getUsageAnalytics({ days }));
  } catch (error) {
    res.status(500).json({ error: 'Could not load usage analytics.' });
  }
});

const uploadsDirectory = path.resolve(process.cwd(), 'uploads');
const TEMP_FILE_AGE_MS = 6 * 60 * 60 * 1000;
const LEGACY_RETENTION_MS = 90 * 24 * 60 * 60 * 1000;

async function findStaleUploadFiles(now = Date.now()) {
  if ((await lstat(uploadsDirectory).catch(() => null))?.isSymbolicLink()) return [];
  const entries = await readdir(uploadsDirectory, { withFileTypes: true }).catch(() => []);
  const stale = [];
  const measureDirectory = async directory => {
    let total = 0;
    const children = await readdir(directory, { withFileTypes: true }).catch(() => []);
    for (const child of children) {
      const childPath = path.join(directory, child.name);
      if (child.isDirectory()) total += await measureDirectory(childPath);
      else if (child.isFile()) total += (await stat(childPath).catch(() => null))?.size || 0;
    }
    return total;
  };
  const consider = async (filePath, isDirectory) => {
    const details = await stat(filePath).catch(() => null);
    if (details && now - details.mtimeMs > TEMP_FILE_AGE_MS) {
      stale.push({ filePath, size: isDirectory ? await measureDirectory(filePath) : details.size, isDirectory });
    }
  };
  for (const entry of entries) {
    if (!entry.isFile()) continue; // Keep blog images and all nested user content untouched.
    await consider(path.join(uploadsDirectory, entry.name), false);
  }

  const tempRoot = os.tmpdir();
  const tempEntries = await readdir(tempRoot, { withFileTypes: true }).catch(() => []);
  for (const entry of tempEntries) {
    const filePath = path.join(tempRoot, entry.name);
    if (entry.isDirectory() && ['myconvertertool-sheet-', 'converter-batch-'].some(prefix => entry.name.startsWith(prefix))) {
      await consider(filePath, true);
    }
  }
  const spreadsheetUploads = path.join(tempRoot, 'myconvertertool-uploads');
  const uploadEntries = await readdir(spreadsheetUploads, { withFileTypes: true }).catch(() => []);
  for (const entry of uploadEntries) {
    if (entry.isFile()) await consider(path.join(spreadsheetUploads, entry.name), false);
  }
  return stale;
}

async function getCleanupPreview() {
  const now = Date.now();
  const oldLegacyLogs = await Conversion.countDocuments({ createdAt: { $lt: new Date(now - LEGACY_RETENTION_MS) } });
  const oldAccountRollups = await UserDailyUsage.countDocuments({ expiresAt: { $lt: new Date(now) } });
  const oldVisitorMarkers = await AnonymousVisitorDay.countDocuments({ expiresAt: { $lt: new Date(now) } });
  const staleFiles = await findStaleUploadFiles(now);
  const [disk, pageStats] = await Promise.all([
    statfs(uploadsDirectory).catch(() => null),
    Promise.resolve(process.memoryUsage()),
  ]);
  const totalDiskBytes = disk ? Number(disk.blocks) * Number(disk.bsize) : null;
  const freeDiskBytes = disk ? Number(disk.bavail) * Number(disk.bsize) : null;
  return {
    legacyConversionLogs: oldLegacyLogs,
    accountDailyRollups: oldAccountRollups,
    anonymousVisitorMarkers: oldVisitorMarkers,
    temporaryFiles: staleFiles.length,
    temporaryBytes: staleFiles.reduce((total, item) => total + item.size, 0),
    system: {
      uptimeSeconds: Math.floor(process.uptime()),
      processRssBytes: pageStats.rss,
      systemMemoryTotalBytes: os.totalmem(),
      systemMemoryFreeBytes: os.freemem(),
      diskTotalBytes: totalDiskBytes,
      diskFreeBytes: freeDiskBytes,
      database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
      conversionCapacity: getConversionCapacityStatus(),
    },
  };
}

router.get('/maintenance/preview', adminAuth, async (_req, res) => {
  try { res.set('Cache-Control', 'no-store').json(await getCleanupPreview()); }
  catch { res.status(500).json({ error: 'Could not inspect cleanup candidates.' }); }
});

router.post('/maintenance/cleanup', adminAuth, async (req, res) => {
  if (req.body?.confirm !== true) return res.status(400).json({ error: 'Confirm the cleanup operation first.' });
  try {
    const now = Date.now();
    const [legacyLogs, accountRollups, visitorMarkers] = await Promise.all([
      Conversion.deleteMany({ createdAt: { $lt: new Date(now - LEGACY_RETENTION_MS) } }),
      UserDailyUsage.deleteMany({ expiresAt: { $lt: new Date(now) } }),
      AnonymousVisitorDay.deleteMany({ expiresAt: { $lt: new Date(now) } }),
    ]);
    const staleFiles = await findStaleUploadFiles(now);
    let removedFiles = 0;
    let removedBytes = 0;
    for (const file of staleFiles) {
      try {
        if (file.isDirectory) await rm(file.filePath, { recursive: true, force: true });
        else await unlink(file.filePath);
        removedFiles += 1; removedBytes += file.size;
      }
      catch { /* A concurrent request may already have removed the temporary file. */ }
    }
    auditLog('analytics_cleanup', { legacyLogs: legacyLogs.deletedCount, accountRollups: accountRollups.deletedCount,
      visitorMarkers: visitorMarkers.deletedCount, temporaryFiles: removedFiles, temporaryBytes: removedBytes }, req.user.id);
    res.json({ removed: { legacyConversionLogs: legacyLogs.deletedCount, accountDailyRollups: accountRollups.deletedCount,
      anonymousVisitorMarkers: visitorMarkers.deletedCount, temporaryFiles: removedFiles, temporaryBytes: removedBytes },
      message: 'Expired analytics records and stale app-owned temporary files were removed. Long-term aggregate metrics were retained.' });
  } catch (error) {
    res.status(500).json({ error: 'Cleanup did not finish. Review server logs before retrying.' });
  }
});

// Get all users (with pagination)
router.get('/users', adminAuth, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;
    const total = await User.countDocuments();
    const users = await User.find({})
      .select('-password')
      .skip(skip)
      .limit(limit);
    res.json({ users, page, limit, total });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Simple audit logger
function auditLog(action, details, adminId) {
  const log = {
    timestamp: new Date().toISOString(),
    action,
    details,
    adminId
  };
  console.log('[AUDIT]', JSON.stringify(log));
}

// Update user
router.put(
  '/users/:id',
  adminAuth,
  [
    body('email').optional().isEmail().withMessage('Valid email required'),
    body('name').optional().isLength({ min: 2 }).withMessage('Name must be at least 2 characters'),
    body('role').optional().isIn(['user', 'admin']).withMessage('Role must be user or admin'),
    body('status').optional().isIn(['active', 'inactive']).withMessage('Status must be active or inactive'),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    try {
      const { name, email, role, status } = req.body;
      const userId = req.params.id;

      const targetUser = await User.findById(userId);
      if (!targetUser) {
        return res.status(404).json({ error: 'User not found' });
      }

      // Prevent self-role-change
      if (userId === req.user.id && role && role !== req.user.role) {
        return res.status(400).json({ error: 'Cannot modify own role' });
      }

      // Check if trying to modify another admin
      if (targetUser.role === 'admin' && req.user.id !== userId) {
        return res.status(403).json({ error: 'Cannot modify other admin users' });
      }

      const updatedUser = await User.findByIdAndUpdate(
        userId,
        { name, email, role, status },
        { new: true }
      ).select('-password');

      // Log role change
      if (role && role !== targetUser.role) {
        auditLog('role_change', { userId, from: targetUser.role, to: role }, req.user.id);
      }
      auditLog('user_update', { userId, updatedFields: { name, email, role, status } }, req.user.id);

      res.json(updatedUser);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
);

// Delete user
router.delete('/users/:id', adminAuth, async (req, res) => {
  try {
    const userId = req.params.id;
    if (userId === req.user.id) {
      return res.status(400).json({ error: 'Cannot delete yourself' });
    }
    await User.findByIdAndDelete(userId);
    auditLog('user_delete', { userId }, req.user.id);
    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
