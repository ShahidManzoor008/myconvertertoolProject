// Use SendGrid's HTTP API directly; the SDK pulled in an unpatched merge utility.
export const sendNotification = async (to, subject, text) => {
  if (!process.env.SENDGRID_API_KEY || !process.env.SENDGRID_FROM_EMAIL) {
    throw new Error('SendGrid notifications are not configured');
  }
  if (typeof to !== 'string' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(to) ||
      typeof subject !== 'string' || subject.length > 200 ||
      typeof text !== 'string' || text.length > 10000) throw new Error('Invalid notification');
  const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
    method: 'POST',
    headers: { Authorization: `Bearer ${process.env.SENDGRID_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ personalizations: [{ to: [{ email: to }] }], from: { email: process.env.SENDGRID_FROM_EMAIL },
      subject, content: [{ type: 'text/plain', value: text }] }),
    signal: AbortSignal.timeout(15000),
  });
  if (!response.ok) throw new Error(`Notification provider returned HTTP ${response.status}`);
};
