import { NextResponse } from 'next/server';
import { getFeynmanAnalytics } from '@/lib/db/sqlite';
import { getUserId } from '@/lib/auth/session';

export async function GET() {
  try {
    const userId = await getUserId();
    if (!userId) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const analytics = getFeynmanAnalytics(userId);
    return NextResponse.json(analytics);
  } catch (error) {
    console.error('Error fetching feynman analytics:', error);
    return NextResponse.json({ error: 'Failed to fetch analytics' }, { status: 500 });
  }
}
