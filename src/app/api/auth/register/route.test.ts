import { describe, it, expect, vi } from 'vitest';
import { POST } from './route';
import { buildRequest, parseResponse } from '../../__tests__/setup';
import { createChallenge } from '@/lib/auth/captcha-store';
import { createUser, hashPassword } from '@/lib/db/sqlite';

/*
! next/headers mocked at top level — same sqlite instance across test + route.
*/
vi.mock('next/headers', () => ({
  cookies: vi.fn().mockResolvedValue({ get: vi.fn(), set: vi.fn(), delete: vi.fn() }),
}));

let ipCounter = 0;
function uniqueIp() {
  return `172.16.${Math.floor(++ipCounter / 255)}.${ipCounter % 255 + 1}`;
}

let userCounter = 0;
function uniqueUsername() {
  return `reg_user_${++userCounter}`;
}

async function freshCaptcha() {
  const { challengeId, expression } = createChallenge();
  const [a, op, b] = expression.split(' ');
  const answer =
    op === '+' ? Number(a) + Number(b) : op === '-' ? Number(a) - Number(b) : Number(a) * Number(b);
  return { captchaId: challengeId, captchaAnswer: answer };
}

describe('POST /api/auth/register', () => {
  it('returns 200 and creates user on valid payload', async () => {
    const captcha = await freshCaptcha();
    const req = buildRequest(
      '/api/auth/register',
      { username: uniqueUsername(), password: 'ValidPass1!', email: `t${Date.now()}@ex.com`, honeypot: '', ...captcha },
      { ip: uniqueIp() },
    );

    const res = await POST(req);
    const { status, body } = await parseResponse(res);

    expect(status).toBe(200);
    expect((body as { success: boolean }).success).toBe(true);
  });

  it('returns 409 when username already taken', async () => {
    const username = uniqueUsername();
    createUser(username, hashPassword('anypass'), undefined);

    const captcha = await freshCaptcha();
    const req = buildRequest(
      '/api/auth/register',
      { username, password: 'ValidPass1!', honeypot: '', ...captcha },
      { ip: uniqueIp() },
    );

    const res = await POST(req);
    const { status, body } = await parseResponse(res);

    expect(status).toBe(409);
    expect((body as { error: string }).error).toBe('Username already taken');
  });

  it('returns 400 when honeypot is filled', async () => {
    const captcha = await freshCaptcha();
    const req = buildRequest(
      '/api/auth/register',
      { username: uniqueUsername(), password: 'ValidPass1!', honeypot: 'spam', ...captcha },
      { ip: uniqueIp() },
    );

    const res = await POST(req);
    const { status } = await parseResponse(res);

    expect(status).toBe(400);
  });

  it('returns 400 on invalid captcha', async () => {
    const req = buildRequest(
      '/api/auth/register',
      {
        username: uniqueUsername(),
        password: 'ValidPass1!',
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

  it('returns 400 on missing required fields', async () => {
    const req = buildRequest('/api/auth/register', { username: uniqueUsername() }, { ip: uniqueIp() });

    const res = await POST(req);
    const { status } = await parseResponse(res);

    expect(status).toBe(400);
  });
});
