import { cookies } from 'next/headers';

const SESSION_DURATION_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

export interface SessionData {
  userId: number;
  username: string;
  expiresAt: number;
}

export async function getSession(): Promise<SessionData | null> {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get('session');
  if (!sessionCookie) return null;

  try {
    const session = JSON.parse(sessionCookie.value) as Partial<SessionData>;
    if (!session.userId) return null;

    // Reject expired sessions
    if (session.expiresAt && Date.now() > session.expiresAt) return null;

    return session as SessionData;
  } catch {
    return null;
  }
}

export async function getUserId(): Promise<number | null> {
  const session = await getSession();
  return session?.userId ?? null;
}

export function buildSessionPayload(userId: number, username: string): string {
  const payload: SessionData = {
    userId,
    username,
    expiresAt: Date.now() + SESSION_DURATION_MS,
  };
  return JSON.stringify(payload);
}

export const SESSION_COOKIE_OPTIONS = {
  httpOnly: true,
  sameSite: 'lax' as const,
  maxAge: SESSION_DURATION_MS / 1000,
};
