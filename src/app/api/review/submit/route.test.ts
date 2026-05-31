import { describe, it, expect, vi, beforeEach } from 'vitest';
import { buildRequest, parseResponse } from '../../__tests__/setup';

vi.mock('next/headers', () => ({
  cookies: vi.fn().mockResolvedValue({ get: vi.fn(), set: vi.fn(), delete: vi.fn() }),
}));

vi.mock('@/lib/auth/session', () => ({
  getUserId: vi.fn().mockResolvedValue(1),
  getUserIdFromCookie: vi.fn().mockResolvedValue(1),
  getSession: vi.fn().mockResolvedValue(null),
  buildSessionPayload: vi.fn().mockReturnValue('{}'),
  SESSION_COOKIE_OPTIONS: {},
}));

vi.mock('@/lib/db/sqlite', () => ({
  getChunkProgress: vi.fn().mockReturnValue(null),
  updateChunkProgress: vi.fn(),
  recordStudySession: vi.fn(),
  getChunkById: vi.fn().mockReturnValue({ id: 1, domain_id: 1 }),
}));

// Prevent emit() from hitting real DB — tested separately in eventBus tests
vi.mock('@/lib/events/eventBus', () => ({ emit: vi.fn() }));
vi.mock('@/lib/events/subscribers', () => ({}));

function uniqueIp() {
  return `172.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`;
}

describe('POST /api/review/submit', () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it('returns 401 when not authenticated', async () => {
    vi.doMock('@/lib/auth/session', () => ({
      getUserId: vi.fn().mockResolvedValue(null),
      getUserIdFromCookie: vi.fn().mockResolvedValue(null),
      SESSION_COOKIE_OPTIONS: {},
    }));

    const { POST } = await import('./route');
    const req = buildRequest('/api/review/submit', { chunkId: 1, quality: 4 }, { ip: uniqueIp() });

    const res = await POST(req);
    const { status, body } = await parseResponse(res);

    expect(status).toBe(401);
    expect((body as { error: string }).error).toBe('Not authenticated');
  });

  it('returns 400 on invalid quality (out of range)', async () => {
    vi.doMock('@/lib/auth/session', () => ({
      getUserId: vi.fn().mockResolvedValue(1),
      getUserIdFromCookie: vi.fn().mockResolvedValue(1),
      SESSION_COOKIE_OPTIONS: {},
    }));
    vi.doMock('@/lib/db/sqlite', () => ({
      getChunkProgress: vi.fn().mockReturnValue(null),
      updateChunkProgress: vi.fn(),
      recordStudySession: vi.fn(),
      getChunkById: vi.fn().mockReturnValue({ id: 1, domain_id: 1 }),
    }));

    const { POST } = await import('./route');
    const req = buildRequest('/api/review/submit', { chunkId: 1, quality: 9 }, { ip: uniqueIp() });

    const res = await POST(req);
    const { status } = await parseResponse(res);

    expect(status).toBe(400);
  });

  it('returns 400 on missing chunkId', async () => {
    vi.doMock('@/lib/auth/session', () => ({
      getUserId: vi.fn().mockResolvedValue(1),
      getUserIdFromCookie: vi.fn().mockResolvedValue(1),
      SESSION_COOKIE_OPTIONS: {},
    }));
    vi.doMock('@/lib/db/sqlite', () => ({
      getChunkProgress: vi.fn().mockReturnValue(null),
      updateChunkProgress: vi.fn(),
      recordStudySession: vi.fn(),
      getChunkById: vi.fn().mockReturnValue({ id: 1, domain_id: 1 }),
    }));

    const { POST } = await import('./route');
    const req = buildRequest('/api/review/submit', { quality: 4 }, { ip: uniqueIp() });

    const res = await POST(req);
    const { status } = await parseResponse(res);

    expect(status).toBe(400);
  });

  it('returns 200 with SM-2 result on happy path (first review)', async () => {
    vi.doMock('@/lib/auth/session', () => ({
      getUserId: vi.fn().mockResolvedValue(1),
      getUserIdFromCookie: vi.fn().mockResolvedValue(1),
      SESSION_COOKIE_OPTIONS: {},
    }));
    vi.doMock('@/lib/db/sqlite', () => ({
      getChunkProgress: vi.fn().mockReturnValue(null),
      updateChunkProgress: vi.fn(),
      recordStudySession: vi.fn(),
      getChunkById: vi.fn().mockReturnValue({ id: 1, domain_id: 1 }),
    }));

    const { POST } = await import('./route');
    const req = buildRequest('/api/review/submit', { chunkId: 1, quality: 4 }, { ip: uniqueIp() });

    const res = await POST(req);
    const { status, body } = await parseResponse(res);

    expect(status).toBe(200);
    expect((body as { success: boolean }).success).toBe(true);
    expect(typeof (body as { interval: number }).interval).toBe('number');
    expect(typeof (body as { repetitions: number }).repetitions).toBe('number');
  });

  it('increments repetitions correctly through SM-2 (quality >= 3)', async () => {
    vi.doMock('@/lib/auth/session', () => ({
      getUserId: vi.fn().mockResolvedValue(1),
      getUserIdFromCookie: vi.fn().mockResolvedValue(1),
      SESSION_COOKIE_OPTIONS: {},
    }));
    vi.doMock('@/lib/db/sqlite', () => ({
      getChunkProgress: vi.fn().mockReturnValue({
        repetitions: 1,
        ease_factor: 2.5,
        interval: 1,
      }),
      updateChunkProgress: vi.fn(),
      recordStudySession: vi.fn(),
      getChunkById: vi.fn().mockReturnValue({ id: 1, domain_id: 1 }),
    }));

    const { POST } = await import('./route');
    const req = buildRequest('/api/review/submit', { chunkId: 1, quality: 4 }, { ip: uniqueIp() });

    const res = await POST(req);
    const { status, body } = await parseResponse(res);

    expect(status).toBe(200);
    expect((body as { repetitions: number }).repetitions).toBe(2);
    expect((body as { interval: number }).interval).toBe(6);
  });
});
