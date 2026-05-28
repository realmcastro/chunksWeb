import { NextResponse } from 'next/server';
import { createUser, getUserByUsername, hashPassword } from '@/lib/db/sqlite';
import { cookies } from 'next/headers';
import { buildSessionPayload, SESSION_COOKIE_OPTIONS } from '@/lib/auth/session';
import { parseJson } from '@/lib/validation/parse';
import { registerSchema } from '@/lib/validation/schemas';
import { logger } from '@/lib/logger';
import { enforceRateLimit, RATE_LIMITS } from '@/lib/rate-limit';

export async function POST(request: Request) {
  const limited = enforceRateLimit(request, null, RATE_LIMITS.authRegister);
  if (limited) return limited;

  const parsed = await parseJson(request, registerSchema);
  if (!parsed.ok) return parsed.error;
  const { username, password } = parsed.data;

  try {
    const existingUser = getUserByUsername(username);
    if (existingUser) {
      return NextResponse.json({ error: 'Username already taken' }, { status: 409 });
    }

    const user = createUser(username, hashPassword(password));
    if (!user) {
      return NextResponse.json({ error: 'Failed to create user' }, { status: 500 });
    }

    const cookieStore = await cookies();
    cookieStore.set('session', buildSessionPayload(user.id, user.username), SESSION_COOKIE_OPTIONS);

    return NextResponse.json({ success: true, user: { id: user.id, username: user.username } });
  } catch (error) {
    logger.error('Register error', { error, username });
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
