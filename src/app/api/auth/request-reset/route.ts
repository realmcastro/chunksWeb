import { NextResponse } from 'next/server';
import { parseJson } from '@/lib/validation/parse';
import { requestResetSchema } from '@/lib/validation/schemas';
import { validateChallenge } from '@/lib/auth/captcha-store';
import {
  getUserByEmail,
  createPasswordResetToken,
  deleteExpiredResetTokens,
} from '@/lib/db/sqlite';
import {
  generateResetToken,
  hashResetToken,
  getResetTokenExpiry,
} from '@/lib/auth/reset-tokens';
import { sendPasswordResetEmail } from '@/lib/email/resend';
import { enforceRateLimit, checkRateLimit, RATE_LIMITS } from '@/lib/rate-limit';
import { logger } from '@/lib/logger';

/*
! Always returns 200 regardless of whether the email exists.
! This prevents email enumeration attacks. Per-email rate limit
! (1/hour) is enforced silently — exceeding it still returns 200.
*/
export async function POST(request: Request) {
  const limited = enforceRateLimit(request, null, RATE_LIMITS.requestReset);
  if (limited) return limited;

  const parsed = await parseJson(request, requestResetSchema);
  if (!parsed.ok) return parsed.error;

  const { captchaId, captchaAnswer, honeypot } = parsed.data;

  if (honeypot) {
    return NextResponse.json({ error: 'Verification failed' }, { status: 400 });
  }

  if (!validateChallenge(captchaId, captchaAnswer)) {
    return NextResponse.json({ error: 'Verification failed' }, { status: 400 });
  }

  const email = parsed.data.email.toLowerCase();
  const successResponse = NextResponse.json({ success: true });

  const perEmailCheck = checkRateLimit(
    `auth/request-reset:email:${email}`,
    { limit: 1, windowMs: 3_600_000 },
  );
  if (!perEmailCheck.allowed) return successResponse;

  try {
    const user = getUserByEmail(email);
    if (!user) return successResponse;

    deleteExpiredResetTokens();

    const rawToken = generateResetToken();
    const tokenHash = hashResetToken(rawToken);
    const expiresAt = getResetTokenExpiry();

    createPasswordResetToken(user.id, tokenHash, expiresAt);
    await sendPasswordResetEmail(email, rawToken);

    logger.info('Password reset requested', { userId: user.id });
  } catch (error) {
    logger.error('Password reset request error', { error, email });
  }

  return successResponse;
}
