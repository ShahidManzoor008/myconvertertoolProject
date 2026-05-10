import sgMail from '@sendgrid/mail';

sgMail.setApiKey(process.env.SENDGRID_API_KEY);

export const sendNotification = async (to, subject, text) => {
  const msg = {
    to,
    from: process.env.FROM_EMAIL,
    subject,
    text,
  };
  await sgMail.send(msg);
};