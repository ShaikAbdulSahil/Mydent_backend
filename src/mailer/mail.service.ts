/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-call */

import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class MailerService {
  private readonly logger = new Logger(MailerService.name);

  constructor(private readonly config: ConfigService) { }

  async sendResetPasswordEmail(
    email: string,
    token: string,
  ): Promise<{ statusCode: number; id?: string }> {
    const apiKey = this.config.get<string>('RESEND_API_KEY');
    if (!apiKey) {
      this.logger.error('RESEND_API_KEY is not set');
      throw new Error('Email service misconfigured');
    }

    const baseUrl =
      process.env.API_BASE_URL || 'https://doctor-appointment-5j6e.onrender.com';
    const fromName = this.config.get<string>('MAIL_FROM_NAME') || 'Mydent';
    const fromAddress =
      this.config.get<string>('MAIL_FROM_ADDRESS') || 'no-reply@mydent.app';

    const from = `${fromName} <${fromAddress}>`;
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
      const res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from,
          to: email,
          subject: 'Password Reset - Mydent',
          html,
        }),
      });

      const statusCode = res.status;
      let id: string | undefined;
      let payload: unknown;
      const text = await res.text();
      try {
        payload = text ? JSON.parse(text) : {};
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        id = (payload as any)?.id as string | undefined;
      } catch {
        payload = text;
      }

      if (res.ok) {
        this.logger.log(
          `Resend accepted email to ${email} with status ${statusCode}${id ? `, id ${id}` : ''}`,
        );
        return { statusCode, id };
      }

      this.logger.error(
        `Resend failed with status ${statusCode} for ${email}: ${typeof payload === 'string' ? payload : JSON.stringify(payload)}`,
      );
      throw new Error('Failed to send email');
    } catch (err) {
      this.logger.error('Error sending email via Resend', err as Error);
      throw err;
    }
  }
}
