import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getUserIdFromCookie } from '@/lib/auth/session';
import { getUserById, verifyPassword, softDeleteUser } from '@/lib/db/sqlite';
import { parseJson } from '@/lib/validation/parse';
import { deleteAccountSchema } from '@/lib/validation/schemas';
import { logger } from '@/lib/logger';
import { enforceRateLimit, RATE_LIMITS } from '@/lib/rate-limit';

/*
! Soft-deletes the authenticated user's account.
! Requires password re-entry as anti-CSRF intent confirmation.
! Sets deleted_at on the user row; actual data purge happens
! after 30-day grace period via cleanup script.
! Clears session cookie immediately — user is logged out.
*/

export async function DELETE(request: Request) {
  const limited = enforceRateLimit(request, null, RATE_LIMITS.deleteAccount);
  if (limited) return limited;

  const userId = await getUserIdFromCookie();
  if (!userId) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  const parsed = await parseJson(request, deleteAccountSchema);
  if (!parsed.ok) return parsed.error;
  const { password } = parsed.data;

  try {
    const user = getUserById(userId);
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    if (!verifyPassword(password, user.password_hash)) {
      return NextResponse.json({ error: 'Invalid password' }, { status: 401 });
    }

    softDeleteUser(userId);

    const cookieStore = await cookies();
    cookieStore.delete('session');

    logger.info('Account deletion requested', { userId, username: user.username });

    return NextResponse.json({
      success: true,
      message: 'Account scheduled for deletion. Data will be permanently removed after 30 days.',
    });
  } catch (error) {
    logger.error('Account deletion error', { error, userId });
    return NextResponse.json({ error: 'Failed to delete account' }, { status: 500 });
  }
}
