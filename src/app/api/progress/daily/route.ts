import { NextResponse } from 'next/server';
import { getTodayStudiedCount, getTodayFeynmanCount } from '@/lib/db/sqlite';
import { getUserId } from '@/lib/auth/session';

export async function GET() {
  try {
    const userId = await getUserId();
    if (!userId) {
      return NextResponse.json({ chunksToday: 0, feynmanToday: 0 });
    }

    const chunksToday = getTodayStudiedCount(userId);
    const feynmanToday = getTodayFeynmanCount(userId);

    return NextResponse.json({ chunksToday, feynmanToday });
  } catch (error) {
    console.error('Error fetching daily progress:', error);
    return NextResponse.json({ chunksToday: 0, feynmanToday: 0 });
  }
}
