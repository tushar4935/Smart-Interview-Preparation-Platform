const nodemailer = require('nodemailer');
const logger = require('../config/logger');

let transporter;

// if SMTP creds are present we send for real, otherwise fall back to a dev
// transport that just logs the link. keeps local dev zero-config.
const getTransporter = () => {
  if (transporter) return transporter;
  if (process.env.SMTP_HOST) {
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT) || 587,
      secure: Number(process.env.SMTP_PORT) === 465,
      auth: process.env.SMTP_USER ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS } : undefined,
    });
  } else {
    transporter = {
      sendMail: async (opts) => {
        logger.info(`[email:dev] to=${opts.to} subject="${opts.subject}"`);
        logger.info(`[email:dev] ${opts.text}`);
        return { messageId: `dev-${Date.now()}` };
      },
    };
  }
  return transporter;
};

const FROM = process.env.EMAIL_FROM || 'Interview Prep <no-reply@interviewprep.dev>';
const clientUrl = () => process.env.CLIENT_URL || 'http://localhost:5173';

const sendVerificationEmail = async (to, name, token) => {
  const link = `${clientUrl()}/verify-email?token=${token}`;
  await getTransporter().sendMail({
    from: FROM,
    to,
    subject: 'Verify your email',
    text: `Hi ${name}, confirm your Interview Prep account: ${link}`,
    html: `<p>Hi ${name},</p><p>Confirm your account by clicking <a href="${link}">this link</a>.</p><p>${link}</p>`,
  });
  return link;
};

const sendPasswordResetEmail = async (to, name, token) => {
  const link = `${clientUrl()}/reset-password?token=${token}`;
  await getTransporter().sendMail({
    from: FROM,
    to,
    subject: 'Reset your password',
    text: `Hi ${name}, reset your password here (expires in 1 hour): ${link}`,
    html: `<p>Hi ${name},</p><p>Reset your password <a href="${link}">here</a>. This link expires in 1 hour.</p><p>${link}</p>`,
  });
  return link;
};

module.exports = { sendVerificationEmail, sendPasswordResetEmail };
