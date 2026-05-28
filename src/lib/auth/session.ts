import { cookies } from 'next/headers';
import { sessionPayloadSchema, type SessionPayload } from '@/lib/validation/schemas';

const SESSION_DURATION_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

export type SessionData = SessionPayload;

/*
! Reads + validates the session cookie. Returns null for: missing cookie,
! malformed JSON, schema mismatch, or expired payload. Never throws.
!
! Schema validation (sessionPayloadSchema) guards every downstream caller
! that trusts `userId`/`username` types — a tampered cookie with a string
! userId, missing expiresAt, etc. is rejected here, not later in SQL.
*/
export async function getSession(): Promise<SessionData | null> {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get('session');
  if (!sessionCookie) return null;

  let raw: unknown;
  try {
    raw = JSON.parse(sessionCookie.value);
  } catch {
    return null;
  }

  const parsed = sessionPayloadSchema.safeParse(raw);
  if (!parsed.success) return null;

  if (Date.now() > parsed.data.expiresAt) return null;

  return parsed.data;
}

export async function getUserId(): Promise<number | null> {
  const session = await getSession();
  return session?.userId ?? null;
}

/*
! Backwards-compatible alias. Many API routes import this name (a pre-existing
! convention); kept as the public helper so call sites stay short.
*/
export const getUserIdFromCookie = getUserId;

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
