import express from 'express';
import { auth } from '../middleware/auth.js';
import { sendNotification } from '../services/notifications.js';

const router = express.Router();

// Send notification (internal use)
router.post('/send', auth, async (req, res) => {
  try {
    await sendNotification(req.body.to, req.body.subject, req.body.text);
    res.json({ message: 'Notification sent' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to send' });
  }
});

export default router;