/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-call */

import { Injectable } from '@nestjs/common';
import * as nodemailer from 'nodemailer';

@Injectable()
export class MailerService {
  private transporter: nodemailer.Transporter;

  constructor() {
    this.transporter = nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 587,
      secure: false,
      auth: {
        user: 'shaikfarhat79@gmail.com',
        pass: 'logfhjbomczyjsjm',
      },
      tls: {
        ciphers: 'SSLv3',
      },
    });
  }

  async sendResetPasswordEmail(email: string, token: string): Promise<void> {
    const baseUrl = process.env.API_BASE_URL || 'https://doctor-appointment-5j6e.onrender.com';
    const resetLink = `${baseUrl}/reset-password.html?token=${token}`;
    const mailOptions = {
      from: `"Mydent" <shaikfarhat79@gmail.com>`,
      to: email,
      subject: 'Password Reset - Mydent',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
          <h2 style="color: #023c69; text-align: center;">Password Reset Request</h2>
          <p style="color: #555; font-size: 16px;">Hi,</p>
          <p style="color: #555; font-size: 16px;">You requested a password reset for your Mydent account. Click the button below to open the app and reset your password:</p>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${resetLink}" target="_blank" style="background-color: #007AFF; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 16px;">Reset Password</a>
          </div>
          
          <p style="color: #555; font-size: 14px;">This link will expire in 10 minutes.</p>
          
          <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
          
          <p style="color: #999; font-size: 12px;">If the button above doesn't work, copy this token into the app manually:</p>
          <div style="background: #f4f4f4; padding: 10px; border-radius: 4px; text-align: center; font-family: monospace; font-size: 18px; letter-spacing: 2px; color: #333;">
            ${token}
          </div>
        </div>
      `,
    };

    try {
      await this.transporter.sendMail(mailOptions);
      // simple runtime log for now
      // eslint-disable-next-line no-console
      console.log(`Reset email sent to ${email}`);
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Error sending email:', error);
      throw new Error('Failed to send email');
    }
  }
}
