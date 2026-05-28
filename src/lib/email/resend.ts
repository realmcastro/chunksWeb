import { Resend } from 'resend';
import { logger } from '@/lib/logger';

/*
! Password reset email via Resend.
! Returns false on failure — caller must not reveal send status to the user.
! In dev without RESEND_API_KEY, logs the token to console for manual testing.
*/

const resend = process.env.RESEND_API_KEY
  ? new Resend(process.env.RESEND_API_KEY)
  : null;

const FROM_ADDRESS = process.env.EMAIL_FROM || 'noreply@chunks.app';

export async function sendPasswordResetEmail(
  to: string,
  resetToken: string,
): Promise<boolean> {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  const resetUrl = `${baseUrl}/reset-password/${resetToken}`;

  if (!resend) {
    logger.warn('RESEND_API_KEY not set — logging reset link to console', { to, resetUrl });
    return true;
  }

  try {
    const { error } = await resend.emails.send({
      from: FROM_ADDRESS,
      to,
      subject: 'Reset your password',
      html: `
        <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
          <h2>Password Reset</h2>
          <p>You requested a password reset. Click the link below to set a new password:</p>
          <p>
            <a href="${resetUrl}"
               style="display:inline-block;padding:12px 24px;background:#0f172a;color:#fff;text-decoration:none;border-radius:6px;">
              Reset Password
            </a>
          </p>
          <p style="color:#666;font-size:14px;">
            This link expires in 30 minutes. If you did not request this, ignore this email.
          </p>
          <p style="color:#999;font-size:12px;">&mdash; Chunks</p>
        </div>
      `,
    });

    if (error) {
      logger.error('Resend email send failed', { error, to });
      return false;
    }
    return true;
  } catch (error) {
    logger.error('Resend email exception', { error, to });
    return false;
  }
}
