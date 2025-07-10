import nodemailer from 'nodemailer';
import { logger } from '../utils/logger';
import { config } from '../config';

// Create reusable transporter
const transporter = nodemailer.createTransport({
  host: config.SMTP_HOST,
  port: config.SMTP_PORT,
  secure: config.SMTP_PORT === 465,
  auth: {
    user: config.SMTP_USER,
    pass: config.SMTP_PASS
  }
});

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

export const sendEmail = async (options: EmailOptions): Promise<void> => {
  try {
    const mailOptions = {
      from: config.FROM_EMAIL,
      to: options.to,
      subject: options.subject,
      html: options.html,
      text: options.text || options.html.replace(/<[^>]*>/g, '')
    };

    if (process.env.NODE_ENV === 'test') {
      logger.info('Email send skipped in test environment', mailOptions);
      return;
    }

    if (!config.SMTP_USER || !config.SMTP_PASS) {
      logger.warn('Email configuration missing, skipping email send');
      return;
    }

    const info = await transporter.sendMail(mailOptions);
    logger.info('Email sent successfully', {
      messageId: info.messageId,
      to: options.to,
      subject: options.subject
    });
  } catch (error) {
    logger.error('Failed to send email', error);
    throw new Error('Failed to send email');
  }
};

export const sendVerificationEmail = async (email: string, token: string): Promise<void> => {
  const verificationUrl = `${config.CLIENT_URL}/verify-email?token=${token}`;
  
  await sendEmail({
    to: email,
    subject: 'Verify your email address',
    html: `
      <h1>Welcome to Niazi Tribe!</h1>
      <p>Please click the link below to verify your email address:</p>
      <a href="${verificationUrl}">Verify Email</a>
      <p>Or copy and paste this URL into your browser:</p>
      <p>${verificationUrl}</p>
      <p>This link will expire in 24 hours.</p>
    `
  });
};

export const sendPasswordResetEmail = async (email: string, token: string): Promise<void> => {
  const resetUrl = `${config.CLIENT_URL}/reset-password?token=${token}`;
  
  await sendEmail({
    to: email,
    subject: 'Reset your password',
    html: `
      <h1>Password Reset Request</h1>
      <p>You requested to reset your password. Click the link below to proceed:</p>
      <a href="${resetUrl}">Reset Password</a>
      <p>Or copy and paste this URL into your browser:</p>
      <p>${resetUrl}</p>
      <p>If you didn't request this, please ignore this email.</p>
      <p>This link will expire in 1 hour.</p>
    `
  });
}; 