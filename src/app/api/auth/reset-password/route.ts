import { NextResponse } from 'next/server';
import { parseJson } from '@/lib/validation/parse';
import { resetPasswordSchema } from '@/lib/validation/schemas';
import {
  findValidResetToken,
  consumeResetToken,
  getUserById,
  updatePasswordHash,
  hashPassword,
} from '@/lib/db/sqlite';
import { hashResetToken } from '@/lib/auth/reset-tokens';
import { enforceRateLimit, RATE_LIMITS } from '@/lib/rate-limit';
import { logger } from '@/lib/logger';

export async function POST(request: Request) {
  const limited = enforceRateLimit(request, null, RATE_LIMITS.resetPassword);
  if (limited) return limited;

  const parsed = await parseJson(request, resetPasswordSchema);
  if (!parsed.ok) return parsed.error;

  const { token, newPassword } = parsed.data;

  try {
    const tokenHash = hashResetToken(token);
    const tokenRecord = findValidResetToken(tokenHash);
    if (!tokenRecord) {
      return NextResponse.json(
        { error: 'Invalid or expired reset link' },
        { status: 400 },
      );
    }

    const user = getUserById(tokenRecord.user_id);
    if (!user) {
      return NextResponse.json(
        { error: 'Invalid or expired reset link' },
        { status: 400 },
      );
    }

    consumeResetToken(tokenRecord.id);
    updatePasswordHash(user.id, hashPassword(newPassword));

    logger.info('Password reset completed', { userId: user.id });
    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error('Password reset error', { error });
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
