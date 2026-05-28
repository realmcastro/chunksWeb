import { NextResponse } from 'next/server';
import { createChallenge } from '@/lib/auth/captcha-store';

/*
! Generates a server-side math CAPTCHA challenge.
! Returns challengeId + expression for the client to display.
! Answer is stored server-side — client never sees it.
! No auth required — this is called before login/register.
*/

export async function GET() {
  const challenge = createChallenge();

  return NextResponse.json({
    challengeId: challenge.challengeId,
    expression: challenge.expression,
    expiresAt: challenge.expiresAt,
  });
}
