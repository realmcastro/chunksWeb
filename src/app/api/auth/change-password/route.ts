import { NextResponse } from 'next/server';
import { getUserById, verifyPassword, hashPassword, updatePasswordHash } from '@/lib/db/sqlite';
import { getUserId } from '@/lib/auth/session';
import { parseJson } from '@/lib/validation/parse';
import { changePasswordSchema } from '@/lib/validation/schemas';
import { enforceRateLimit, RATE_LIMITS } from '@/lib/rate-limit';
import { logger } from '@/lib/logger';

/*
! POST /api/auth/change-password — authenticated password rotation.
!
! Flow:
!   1. Auth guard (must already have a session).
!   2. Rate limit (5/min/user) — defends against credential-stuffing
!      patterns that hop from login to change-password to lock accounts.
!   3. Verify `currentPassword` against the stored hash.
!   4. Re-hash and persist `newPassword`.
!
! NOTE: We do NOT invalidate other sessions on change because the current
! session model is a self-contained signed-ish cookie with no server-side
! revocation list. F5 ("logout all devices") in the backlog will rebuild
! sessions on top of a `token_version` column so this endpoint can bump it.
*/

export async function POST(request: Request) {
  const userId = await getUserId();
  if (!userId) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

  const limited = enforceRateLimit(request, userId, RATE_LIMITS.changePassword);
  if (limited) return limited;

  const parsed = await parseJson(request, changePasswordSchema);
  if (!parsed.ok) return parsed.error;
  const { currentPassword, newPassword } = parsed.data;

  const user = getUserById(userId);
  if (!user) {
    logger.warn('change-password: session userId references missing user', { userId });
    return NextResponse.json({ error: 'Account not found' }, { status: 404 });
  }

  if (!verifyPassword(currentPassword, user.password_hash)) {
    return NextResponse.json({ error: 'Current password is incorrect' }, { status: 401 });
  }

  try {
    updatePasswordHash(userId, hashPassword(newPassword));
    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error('change-password: failed to update hash', { error, userId });
    return NextResponse.json({ error: 'Failed to update password' }, { status: 500 });
  }
}
