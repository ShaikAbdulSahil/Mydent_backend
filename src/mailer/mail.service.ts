/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-call */

import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Resend } from 'resend';

@Injectable()
export class MailerService {
  private readonly logger = new Logger(MailerService.name);
  private resend?: Resend;

  constructor(private readonly config: ConfigService) {
    const apiKey = this.config.get<string>('RESEND_API_KEY');
    if (!apiKey) {
      this.logger.error('RESEND_API_KEY is not set');
    } else {
      this.resend = new Resend(apiKey);
    }
  }

  async sendResetPasswordEmail(
    email: string,
    token: string,
  ): Promise<{ statusCode: number; id?: string }> {
    if (!this.resend) {
      throw new Error('Email service misconfigured');
    }

    // Hardcoded values per request (except RESEND_API_KEY)
    const baseUrl = 'https://doctor-appointment-5j6e.onrender.com';
    const from = 'Mydent <no-reply@mydent.app>';
    const resetLink = `${baseUrl}/reset-password.html?token=${token}`;
    const html = `
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
    `;

    try {
      const { data, error } = await this.resend.emails.send({
        from,
        to: email,
        subject: 'Password Reset - Mydent',
        html,
      });

      if (error) {
        const statusCode = (error as unknown as { statusCode?: number }).statusCode ?? 500;
        this.logger.error(
          `Resend failed with status ${statusCode} for ${email}: ${error.message}`,
        );
        throw new Error('Failed to send email');
      }

      const id = data?.id;
      const statusCode = 202; // Resend accepts messages asynchronously
      this.logger.log(
        `Resend accepted email to ${email} with status ${statusCode}${id ? `, id ${id}` : ''}`,
      );
      return { statusCode, id };
    } catch (err) {
      const statusCode = (err as unknown as { statusCode?: number }).statusCode ?? 500;
      this.logger.error(
        `Error sending email via Resend (status ${statusCode})`,
        err as Error,
      );
      throw err;
    }
  }
}
