import nodemailer from 'nodemailer';
import { config } from '../lib/config.js';

const transporter = nodemailer.createTransport({
  host: config.SMTP_HOST,
  port: config.SMTP_PORT,
  auth: config.SMTP_USER
    ? { user: config.SMTP_USER, pass: config.SMTP_PASS }
    : undefined,
});

export const emailService = {
  async sendVerification(email: string, token: string): Promise<void> {
    const link = `${config.BASE_URL}/api/auth/verify/${token}`;
    await transporter.sendMail({
      from: config.FROM_EMAIL,
      to: email,
      subject: 'Verify your RentReview email',
      html: `
        <h2>Welcome to RentReview</h2>
        <p>Click the link below to verify your email address:</p>
        <a href="${link}">${link}</a>
        <p>This link expires in 24 hours.</p>
      `,
    });
  },

  async sendReviewRequestNotification(email: string, requesterName: string): Promise<void> {
    await transporter.sendMail({
      from: config.FROM_EMAIL,
      to: email,
      subject: 'You have a new review request on RentReview',
      html: `
        <h2>New Review Request</h2>
        <p><strong>${requesterName}</strong> has sent you a mutual review request.</p>
        <p>Log in to RentReview to accept or decline.</p>
      `,
    });
  },

  async sendReviewRevealNotification(email: string): Promise<void> {
    await transporter.sendMail({
      from: config.FROM_EMAIL,
      to: email,
      subject: 'Your RentReview reviews have been revealed',
      html: `
        <h2>Reviews Revealed</h2>
        <p>Both reviews in your rental review session have been submitted and are now visible.</p>
        <p>Log in to RentReview to see your results.</p>
      `,
    });
  },
};
