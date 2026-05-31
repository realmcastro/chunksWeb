import { describe, it, expect, vi, beforeEach } from 'vitest';
import { POST } from './route';
import { buildRequest, parseResponse } from '../../__tests__/setup';
import { createChallenge } from '@/lib/auth/captcha-store';
import { createUser, hashPassword } from '@/lib/db/sqlite';

/*
! next/headers must be mocked before the route module is loaded.
! The mock applies to the shared module cache — same sqlite DB instance for
! both createUser() calls and the route handler.
*/
vi.mock('next/headers', () => ({
  cookies: vi.fn().mockResolvedValue({ get: vi.fn(), set: vi.fn(), delete: vi.fn() }),
}));

let ipCounter = 0;
function uniqueIp() {
  return `10.0.${Math.floor(++ipCounter / 255)}.${ipCounter % 255 + 1}`;
}

async function freshCaptcha() {
  const { challengeId, expression } = createChallenge();
  const [a, op, b] = expression.split(' ');
  const answer =
    op === '+' ? Number(a) + Number(b) : op === '-' ? Number(a) - Number(b) : Number(a) * Number(b);
  return { captchaId: challengeId, captchaAnswer: answer };
}

describe('POST /api/auth/login', () => {
  it('returns 401 for unknown username', async () => {
    const captcha = await freshCaptcha();
    const req = buildRequest(
      '/api/auth/login',
      { username: 'nobody_exists_xyz', password: 'pass123', honeypot: '', ...captcha },
      { ip: uniqueIp() },
    );

    const res = await POST(req);
    const { status, body } = await parseResponse(res);

    expect(status).toBe(401);
    expect((body as { error: string }).error).toBe('Invalid credentials');
  });

  it('returns 401 for wrong password', async () => {
    createUser('logintest_wrong_pw', hashPassword('correctpass'), undefined);
    const captcha = await freshCaptcha();
    const req = buildRequest(
      '/api/auth/login',
      { username: 'logintest_wrong_pw', password: 'wrongpass', honeypot: '', ...captcha },
      { ip: uniqueIp() },
    );

    const res = await POST(req);
    const { status, body } = await parseResponse(res);

    expect(status).toBe(401);
    expect((body as { error: string }).error).toBe('Invalid credentials');
  });

  it('returns 200 and session on valid credentials', async () => {
    createUser('logintest_ok', hashPassword('goodpass'), undefined);
    const captcha = await freshCaptcha();
    const req = buildRequest(
      '/api/auth/login',
      { username: 'logintest_ok', password: 'goodpass', honeypot: '', ...captcha },
      { ip: uniqueIp() },
    );

    const res = await POST(req);
    const { status, body } = await parseResponse(res);

    expect(status).toBe(200);
    expect((body as { success: boolean }).success).toBe(true);
  });

  it('returns 400 when honeypot is filled', async () => {
    const captcha = await freshCaptcha();
    const req = buildRequest(
      '/api/auth/login',
      { username: 'any', password: 'any', honeypot: 'bot', ...captcha },
      { ip: uniqueIp() },
    );

    const res = await POST(req);
    const { status } = await parseResponse(res);

    expect(status).toBe(400);
  });

  it('returns 400 on invalid captcha', async () => {
    const req = buildRequest(
      '/api/auth/login',
      {
        username: 'any',
        password: 'any',
        honeypot: '',
        captchaId: '00000000-0000-0000-0000-000000000000',
        captchaAnswer: 0,
      },
      { ip: uniqueIp() },
    );

    const res = await POST(req);
    const { status } = await parseResponse(res);

    expect(status).toBe(400);
  });

  it('returns 400 on malformed body', async () => {
    const req = new Request('http://localhost/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-forwarded-for': uniqueIp() },
      body: 'not-json',
    });

    const res = await POST(req);
    const { status } = await parseResponse(res);

    expect(status).toBe(400);
  });
});
