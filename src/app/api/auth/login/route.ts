import { NextResponse } from 'next/server';
import { getUserByUsername, verifyPassword, hashPassword, updatePasswordHash } from '@/lib/db/sqlite';
import { cookies } from 'next/headers';
import { buildSessionPayload, SESSION_COOKIE_OPTIONS } from '@/lib/auth/session';
import { validateChallenge } from '@/lib/auth/captcha-store';
import { parseJson } from '@/lib/validation/parse';
import { loginSchema } from '@/lib/validation/schemas';
import { logger } from '@/lib/logger';
import { enforceRateLimit, RATE_LIMITS } from '@/lib/rate-limit';

/*
! Captcha + honeypot validated BEFORE bcrypt to prevent cost amplification.
! A bot skipping the captcha page and hitting this endpoint directly
! gets rejected at zero computational cost.
*/

export async function POST(request: Request) {
  const limited = enforceRateLimit(request, null, RATE_LIMITS.authLogin);
  if (limited) return limited;

  const parsed = await parseJson(request, loginSchema);
  if (!parsed.ok) return parsed.error;
  const { username, password, captchaId, captchaAnswer, honeypot } = parsed.data;

  if (honeypot) {
    return NextResponse.json({ error: 'Verification failed' }, { status: 400 });
  }

  if (!validateChallenge(captchaId, captchaAnswer)) {
    return NextResponse.json({ error: 'Verification failed' }, { status: 400 });
  }

  try {
    const user = getUserByUsername(username);
    if (!user) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    if (!verifyPassword(password, user.password_hash)) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    if (user.deleted_at) {
      return NextResponse.json(
        { error: 'This account has been scheduled for deletion' },
        { status: 403 },
      );
    }

    const isBcrypt = user.password_hash.startsWith('$2b$') || user.password_hash.startsWith('$2a$');
    if (!isBcrypt) {
      updatePasswordHash(user.id, hashPassword(password));
    }

    const cookieStore = await cookies();
    cookieStore.set('session', buildSessionPayload(user.id, user.username), SESSION_COOKIE_OPTIONS);

    return NextResponse.json({ success: true, user: { id: user.id, username: user.username } });
  } catch (error) {
    logger.error('Login error', { error, username });
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
