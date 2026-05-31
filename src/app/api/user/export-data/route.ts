import { NextResponse } from 'next/server';
import { getUserIdFromCookie } from '@/lib/auth/session';
import { exportUserData } from '@/lib/db/sqlite';
import { logger } from '@/lib/logger';
import { enforceRateLimit, RATE_LIMITS } from '@/lib/rate-limit';

/*
! GDPR/LGPD data portability: returns all user data as JSON.
! Rate-limited to prevent abuse (3 req/min).
! Sets Content-Disposition to trigger download in browsers.
*/

export async function GET(request: Request) {
  const limited = enforceRateLimit(request, null, RATE_LIMITS.exportData);
  if (limited) return limited;

  const userId = await getUserIdFromCookie();
  if (!userId) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  try {
    const data = exportUserData(userId);

    logger.info('Data export requested', { userId });

    return new NextResponse(JSON.stringify(data, null, 2), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename="olifes-data-export-${userId}.json"`,
      },
    });
  } catch (error) {
    logger.error('Data export error', { error, userId });
    return NextResponse.json({ error: 'Failed to export data' }, { status: 500 });
  }
}
