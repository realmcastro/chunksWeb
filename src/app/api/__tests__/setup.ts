import { vi } from 'vitest';
import { buildSessionPayload } from '@/lib/auth/session';

/*
! Test DB is in-memory SQLite (TEST_DB_PATH=':memory:' set in vitest-setup.ts).
! Schema is initialized automatically when sqlite.ts is imported (runPendingMigrations).
*/

/*
! Builds a valid session cookie value for the given userId/username.
! Use with vi.mocked(cookies).mockResolvedValue(mockCookieStore(userId, username)).
*/
export function mockSessionCookie(userId: number, username = 'testuser') {
  return buildSessionPayload(userId, username);
}

/*
! Returns a cookie store mock that resolves the session cookie for the given userId.
*/
export function mockCookieStore(userId: number, username = 'testuser') {
  const value = mockSessionCookie(userId, username);
  return {
    get: vi.fn().mockReturnValue({ value }),
    set: vi.fn(),
    delete: vi.fn(),
  };
}

/*
! Builds a Request for a route handler call.
*/
export function buildRequest(
  path: string,
  body: unknown,
  options: { ip?: string; method?: string } = {},
): Request {
  const { ip = `127.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.1`, method = 'POST' } = options;
  return new Request(`http://localhost${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      'x-forwarded-for': ip,
    },
    body: JSON.stringify(body),
  });
}

/*
! Parses a Response and returns status + body as JSON.
*/
export async function parseResponse(response: Response): Promise<{ status: number; body: unknown }> {
  const body = await response.json();
  return { status: response.status, body };
}
