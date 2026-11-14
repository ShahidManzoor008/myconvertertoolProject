import crypto from 'node:crypto';
import Conversion from '../models/Conversion.js';
import UsageMetric from '../models/UsageMetric.js';
import UserDailyUsage from '../models/UserDailyUsage.js';
import AnonymousVisitorDay from '../models/AnonymousVisitorDay.js';
import logger from './logger.js';

const TOOL_NAMES = new Set([
  'site', 'pdf-converter', 'file-to-pdf', 'batch-to-pdf', 'images-to-pdf',
  'markdown-to-docx', 'excel-to-pdf', 'pdf-to-excel', 'file-compressor',
  'pdf-compress', 'image-compress', 'pdf-merge', 'pdf-split', 'pdf-rotate', 'pdf-reorder', 'pdf-extract-images', 'pdf-watermark', 'pdf-protect',
  'json-formatter', 'base64-encoder', 'base64-decoder', 'url-encoder',
  'minify-js', 'minify-css', 'minify-html', 'minify-json', 'beautify-js', 'beautify-css',
  'beautify-html', 'beautify-json', 'qr-code-generator', 'qrcode-generator', 'meta-tag-preview',
  'text-case-converter', 'word-counter', 'tools', 'blog', 'about', 'contact',
  'text-case-upper', 'text-case-lower', 'text-case-capitalize', 'text-case-sentence',
  'base64-encode', 'base64-decode', 'url-encode', 'url-decode', 'url-base64encode', 'url-base64decode',
]);

export const normalizeToolName = value => {
  const name = typeof value === 'string' ? value.toLowerCase().slice(0, 64) : '';
  return TOOL_NAMES.has(name) ? name : 'other';
};

const utcDay = (value = new Date()) => {
  const date = new Date(value);
  date.setUTCHours(0, 0, 0, 0);
  return date;
};

const safePart = value => String(value ?? '').replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 64) || 'none';
const FAILURE_REASONS = new Set(['timeout', 'invalid-file', 'invalid-input', 'service-unavailable', 'resource-limit', 'conversion-error']);

const increment = async (Model, key, fields) => {
  try {
    await Model.updateOne({ key }, {
      $setOnInsert: { key, ...fields },
      $inc: { count: 1 },
    }, { upsert: true });
  } catch (error) {
    if (error?.code !== 11000) throw error;
    await Model.updateOne({ key }, { $inc: { count: 1 } });
  }
};

export const classifyFailure = error => {
  const status = Number(error?.statusCode || error?.status || 0);
  const message = String(error?.message || '').toLowerCase();
  if (status === 408 || /timed?s*out|timeout|deadline/.test(message)) return 'timeout';
  if (/invalid[- ]input/.test(message)) return 'invalid-input';
  if ([400, 413, 415, 422].includes(status) || /invalid|unsupported|corrupt|password-protected/.test(message)) return 'invalid-file';
  if (/not installed|unavailable|spawn|enoent|service.*down/.test(message)) return 'service-unavailable';
  if (/memory|heap|resource/.test(message)) return 'resource-limit';
  return 'conversion-error';
};

/**
 * Store compact daily counters only. Filenames, file sizes and raw errors are
 * intentionally discarded; account-level counters are kept only with consent.
 */
export const logConversion = async ({ toolName, userId, status = 'success', reason, analyticsAllowed = false }) => {
  if (!analyticsAllowed) return true;
  const tool = normalizeToolName(toolName);
  const outcome = status === 'success' ? 'success' : 'failure';
  const classifiedReason = FAILURE_REASONS.has(reason) ? reason : classifyFailure({ message: reason });
  const failureReason = outcome === 'success' ? 'none' : safePart(classifiedReason);
  const day = utcDay();
  const dayKey = day.toISOString().slice(0, 10);
  const audience = userId ? 'registered' : 'anonymous';
  const key = [dayKey, tool, 'conversion', outcome, failureReason, audience].join(':');

  try {
    await increment(UsageMetric, key, { day, toolName: tool, action: 'conversion', outcome, reason: failureReason, audience });
    if (userId) {
      const accountKey = [dayKey, String(userId), tool, outcome, failureReason].join(':');
      await increment(UserDailyUsage, accountKey, { day, userId, toolName: tool, action: 'conversion', outcome, reason: failureReason,
        expiresAt: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000) });
    }
    return true;
  } catch (error) {
    logger.error({ error, toolName: tool }, 'Failed to update daily usage metrics');
    return false;
  }
};

export const recordPageView = async ({ toolName, userId, visitorId, analyticsAllowed = false }) => {
  if (!analyticsAllowed) return false;
  const tool = normalizeToolName(toolName);
  const day = utcDay();
  const dayKey = day.toISOString().slice(0, 10);
  try {
    if (visitorId && !userId) {
      const secret = process.env.ANALYTICS_HASH_SECRET || process.env.JWT_SECRET || 'local-analytics-secret';
      const visitorHash = crypto.createHmac('sha256', secret).update(visitorId).digest('hex');
      const key = `${dayKey}:${visitorHash}`;
      try {
        await AnonymousVisitorDay.create({ key, day, visitorHash, expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) });
        await increment(UsageMetric, `${dayKey}:site:page-view:unique:none:anonymous`, {
          day, toolName: 'site', action: 'page-view', outcome: 'unique', reason: 'none', audience: 'anonymous',
        });
      } catch (error) {
        if (error?.code !== 11000) throw error;
      }
    }
    const audience = userId ? 'registered' : 'anonymous';
    await increment(UsageMetric, `${dayKey}:${tool}:page-view:view:none:${audience}`, {
      day, toolName: tool, action: 'page-view', outcome: 'success', reason: 'none', audience,
    });
    if (userId) {
      await increment(UserDailyUsage, `${dayKey}:${userId}:${tool}:page-view`, {
        day, userId, toolName: tool, action: 'page-view', outcome: 'success', reason: 'none',
        expiresAt: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
      });
    }
    return true;
  } catch (error) {
    logger.warn({ error, toolName: tool }, 'Failed to record consented page view');
    return false;
  }
};

export const getTotalConversions = async () => {
  const [rollups, legacy] = await Promise.all([
    UsageMetric.aggregate([{ $match: { action: 'conversion', outcome: 'success' } }, { $group: { _id: null, count: { $sum: '$count' } } }]),
    Conversion.countDocuments({ status: 'success' }),
  ]);
  return (rollups[0]?.count || 0) + legacy;
};

export const getUsageAnalytics = async ({ days = 30 } = {}) => {
  const start = utcDay();
  start.setUTCDate(start.getUTCDate() - Math.max(1, Math.min(90, days)) + 1);
  const base = [{ $match: { day: { $gte: start } } }];
  const [byTool, outcomes, pageViews, daily, anonymousVisitorHashes] = await Promise.all([
    UsageMetric.aggregate([...base, { $match: { action: 'conversion' } }, { $group: { _id: '$toolName', successes: { $sum: { $cond: [{ $eq: ['$outcome', 'success'] }, '$count', 0] } }, failures: { $sum: { $cond: [{ $eq: ['$outcome', 'failure'] }, '$count', 0] } } } }, { $sort: { successes: -1, failures: -1 } }]),
    UsageMetric.aggregate([...base, { $match: { action: 'conversion', outcome: 'failure' } }, { $group: { _id: '$reason', count: { $sum: '$count' } } }, { $sort: { count: -1 } }]),
    UsageMetric.aggregate([...base, { $match: { action: 'page-view', outcome: 'success' } }, { $group: { _id: '$toolName', count: { $sum: '$count' } } }, { $sort: { count: -1 } }]),
    UsageMetric.aggregate([...base, { $group: { _id: { day: '$day', audience: '$audience', action: '$action', outcome: '$outcome' }, count: { $sum: '$count' } } }, { $sort: { '_id.day': 1 } }]),
    AnonymousVisitorDay.distinct('visitorHash', { day: { $gte: utcDay(new Date(Date.now() - 29 * 24 * 60 * 60 * 1000)) } }),
  ]);
  const activeAccountIds = await UserDailyUsage.distinct('userId', { day: { $gte: start } });
  return { days: Math.max(1, Math.min(90, days)), byTool, pageViews, failuresByReason: outcomes,
    anonymousUniqueVisitors: anonymousVisitorHashes.length, activeRegisteredUsers: activeAccountIds.length, daily };
};
