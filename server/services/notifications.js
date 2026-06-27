import sgMail from '@sendgrid/mail';

if (process.env.SENDGRID_API_KEY) {
  sgMail.setApiKey(process.env.SENDGRID_API_KEY);
} else {
  console.warn('SENDGRID_API_KEY not set – SendGrid notifications disabled');
}

export const sendNotification = async (to, subject, text) => {
  const msg = {
    to,
    from: process.env.SENDGRID_FROM_EMAIL || 'no-reply@example.com',
    subject,
    text,
  };
  try {
    await sgMail.send(msg);
  } catch (err) {
    console.error('SendGrid send error', err);
  }
};