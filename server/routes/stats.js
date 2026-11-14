import express from 'express';
import crypto from 'node:crypto';
import { getTotalConversions, logConversion, normalizeToolName, recordPageView } from '../utils/statsUtils.js';
import { optionalAuth } from '../middleware/auth.js';
import { clearVisitorCookie, setAnalyticsConsentCookie, setVisitorCookie } from '../utils/authCookies.js';

const router = express.Router();
router.use(optionalAuth);

router.get('/analytics/consent', (req, res) => {
  const choice = ['accepted', 'rejected'].includes(req.cookies?.mct_analytics_consent) ? req.cookies.mct_analytics_consent : null;
  res.set('Cache-Control', 'no-store').json({ choice, analyticsAllowed: choice === 'accepted' });
});

router.post('/analytics/consent', (req, res) => {
  if (typeof req.body?.analytics !== 'boolean') return res.status(400).json({ error: 'Choose whether optional analytics are allowed.' });
  setAnalyticsConsentCookie(res, req.body.analytics, req);
  if (req.body.analytics) {
    setVisitorCookie(res, req.cookies?.mct_analytics_visitor || crypto.randomBytes(24).toString('hex'), req);
  } else {
    clearVisitorCookie(res, req);
  }
  res.set('Cache-Control', 'no-store').json({ analyticsAllowed: req.body.analytics });
});

router.post('/analytics/visit', async (req, res) => {
  if (req.cookies?.mct_analytics_consent !== 'accepted') return res.status(204).end();
  const visitorId = req.user ? undefined : (req.cookies?.mct_analytics_visitor || crypto.randomBytes(24).toString('hex'));
  if (visitorId && !req.cookies?.mct_analytics_visitor) setVisitorCookie(res, visitorId, req);
  const toolName = normalizeToolName(req.body?.toolName || 'site');
  await recordPageView({ toolName, userId: req.user?._id, visitorId, analyticsAllowed: true });
  res.status(204).end();
});

// @route   POST /api/stats/increment
// @desc    Increment conversion counter for a client-side tool
// @access  Public
router.post('/increment', async (req, res) => {
  try {
    const { toolName, status, reason } = req.body;
    if (typeof toolName !== 'string' || !/^[a-z0-9-]{1,64}$/.test(toolName)
      || (status !== undefined && !['success', 'failure'].includes(status))
      || (reason !== undefined && !['invalid-input', 'conversion-error'].includes(reason))) {
      return res.status(400).json({ error: 'Tool name is required' });
    }

    const recorded = await logConversion({
      toolName,
      userId: req.user?._id,
      analyticsAllowed: req.cookies?.mct_analytics_consent === 'accepted',
      status: status || 'success',
      reason,
    });

    if (!recorded) return res.status(503).json({ error: 'Usage statistics are temporarily unavailable.' });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to increment stats' });
  }
});

// @route   GET /api/stats/total
// @desc    Get total number of successful conversions across all tools
// @access  Public
router.get('/total', async (req, res) => {
  try {
    const total = await getTotalConversions();
    res.json({ total });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch stats' });
  }
});

export default router;
