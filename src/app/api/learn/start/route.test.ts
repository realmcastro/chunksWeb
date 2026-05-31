import { describe, it, expect, vi, beforeEach } from 'vitest';
import { buildRequest, parseResponse } from '../../__tests__/setup';

vi.mock('next/headers', () => ({
  cookies: vi.fn().mockResolvedValue({ get: vi.fn(), set: vi.fn(), delete: vi.fn() }),
}));

vi.mock('@/lib/auth/session', () => ({
  getUserId: vi.fn().mockResolvedValue(1),
  getUserIdFromCookie: vi.fn().mockResolvedValue(1),
  SESSION_COOKIE_OPTIONS: {},
}));

vi.mock('@/lib/db/sqlite', () => ({
  startChunkProgress: vi.fn(),
}));

function uniqueIp() {
  return `192.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`;
}

describe('POST /api/learn/start', () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it('returns 401 when not authenticated', async () => {
    vi.doMock('@/lib/auth/session', () => ({
      getUserId: vi.fn().mockResolvedValue(null),
      getUserIdFromCookie: vi.fn().mockResolvedValue(null),
      SESSION_COOKIE_OPTIONS: {},
    }));
    vi.doMock('@/lib/db/sqlite', () => ({
      startChunkProgress: vi.fn(),
    }));

    const { POST } = await import('./route');
    const req = buildRequest('/api/learn/start', { chunkIds: [1, 2, 3] }, { ip: uniqueIp() });

    const res = await POST(req);
    const { status, body } = await parseResponse(res);

    expect(status).toBe(401);
    expect((body as { error: string }).error).toBe('Not authenticated');
  });

  it('returns 400 when chunkIds is missing', async () => {
    vi.doMock('@/lib/auth/session', () => ({
      getUserId: vi.fn().mockResolvedValue(1),
      getUserIdFromCookie: vi.fn().mockResolvedValue(1),
      SESSION_COOKIE_OPTIONS: {},
    }));
    vi.doMock('@/lib/db/sqlite', () => ({
      startChunkProgress: vi.fn(),
    }));

    const { POST } = await import('./route');
    const req = buildRequest('/api/learn/start', {}, { ip: uniqueIp() });

    const res = await POST(req);
    const { status, body } = await parseResponse(res);

    expect(status).toBe(400);
    expect((body as { error: string }).error).toContain('chunkIds');
  });

  it('returns 400 when chunkIds is empty array', async () => {
    vi.doMock('@/lib/auth/session', () => ({
      getUserId: vi.fn().mockResolvedValue(1),
      getUserIdFromCookie: vi.fn().mockResolvedValue(1),
      SESSION_COOKIE_OPTIONS: {},
    }));
    vi.doMock('@/lib/db/sqlite', () => ({
      startChunkProgress: vi.fn(),
    }));

    const { POST } = await import('./route');
    const req = buildRequest('/api/learn/start', { chunkIds: [] }, { ip: uniqueIp() });

    const res = await POST(req);
    const { status } = await parseResponse(res);

    expect(status).toBe(400);
  });

  it('returns 400 when all chunkIds are invalid (non-positive)', async () => {
    vi.doMock('@/lib/auth/session', () => ({
      getUserId: vi.fn().mockResolvedValue(1),
      getUserIdFromCookie: vi.fn().mockResolvedValue(1),
      SESSION_COOKIE_OPTIONS: {},
    }));
    vi.doMock('@/lib/db/sqlite', () => ({
      startChunkProgress: vi.fn(),
    }));

    const { POST } = await import('./route');
    const req = buildRequest('/api/learn/start', { chunkIds: [0, -1, -5] }, { ip: uniqueIp() });

    const res = await POST(req);
    const { status } = await parseResponse(res);

    expect(status).toBe(400);
  });

  it('returns 200 with started count on happy path', async () => {
    const mockStartChunkProgress = vi.fn();
    vi.doMock('@/lib/auth/session', () => ({
      getUserId: vi.fn().mockResolvedValue(1),
      getUserIdFromCookie: vi.fn().mockResolvedValue(1),
      SESSION_COOKIE_OPTIONS: {},
    }));
    vi.doMock('@/lib/db/sqlite', () => ({
      startChunkProgress: mockStartChunkProgress,
    }));

    const { POST } = await import('./route');
    const req = buildRequest('/api/learn/start', { chunkIds: [1, 2, 3] }, { ip: uniqueIp() });

    const res = await POST(req);
    const { status, body } = await parseResponse(res);

    expect(status).toBe(200);
    expect((body as { success: boolean }).success).toBe(true);
    expect((body as { started: number }).started).toBe(3);
    expect(mockStartChunkProgress).toHaveBeenCalledWith(1, [1, 2, 3]);
  });

  it('filters out non-number values from chunkIds', async () => {
    const mockStartChunkProgress = vi.fn();
    vi.doMock('@/lib/auth/session', () => ({
      getUserId: vi.fn().mockResolvedValue(1),
      getUserIdFromCookie: vi.fn().mockResolvedValue(1),
      SESSION_COOKIE_OPTIONS: {},
    }));
    vi.doMock('@/lib/db/sqlite', () => ({
      startChunkProgress: mockStartChunkProgress,
    }));

    const { POST } = await import('./route');
    const req = buildRequest(
      '/api/learn/start',
      { chunkIds: [1, 'abc', null, 2, 0] },
      { ip: uniqueIp() },
    );

    const res = await POST(req);
    const { status, body } = await parseResponse(res);

    expect(status).toBe(200);
    expect((body as { started: number }).started).toBe(2);
    expect(mockStartChunkProgress).toHaveBeenCalledWith(1, [1, 2]);
  });
});
