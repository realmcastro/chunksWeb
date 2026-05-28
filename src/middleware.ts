import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/*
! Edge middleware — first-line CSRF defence for mutation routes.
!
! Strategy: Sec-Fetch-Site header check.
!   - Modern browsers attach Sec-Fetch-Site automatically; cross-site form
!     submits and fetch() calls from other origins reveal themselves as
!     "cross-site". Same-origin requests get "same-origin"/"same-site"/"none".
!   - Legacy browsers (no Sec-Fetch-Site) fall back to Origin / Referer host
!     check against the request host.
!
! Applied only to mutating verbs (POST, PUT, PATCH, DELETE) on /api/*.
! GET requests are exempt because they must not produce side effects
! (any mutating GET is a separate bug to fix at the route level).
!
! Auth endpoints (login/register) still go through this guard: although
! they create sessions, the same-origin policy is what stops a malicious
! third-party site from logging the user in or out without their consent.
*/

const SAFE_SITE_VALUES = new Set(['same-origin', 'same-site', 'none']);
const MUTATION_METHODS = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);

function rejectCsrf() {
  return NextResponse.json({ error: 'Cross-site request blocked' }, { status: 403 });
}

function isSameOrigin(request: NextRequest): boolean {
  const origin = request.headers.get('origin');
  const referer = request.headers.get('referer');
  const host = request.headers.get('host');
  if (!host) return false;

  const candidate = origin ?? referer;
  if (!candidate) {
    // No Origin / Referer (rare for browser requests). Treat as suspicious.
    return false;
  }

  try {
    const url = new URL(candidate);
    return url.host === host;
  } catch {
    return false;
  }
}

export function middleware(request: NextRequest) {
  if (!MUTATION_METHODS.has(request.method)) return NextResponse.next();
  if (!request.nextUrl.pathname.startsWith('/api/')) return NextResponse.next();

  const fetchSite = request.headers.get('sec-fetch-site');
  if (fetchSite) {
    return SAFE_SITE_VALUES.has(fetchSite) ? NextResponse.next() : rejectCsrf();
  }

  // Legacy browser fallback.
  return isSameOrigin(request) ? NextResponse.next() : rejectCsrf();
}

export const config = {
  matcher: ['/api/:path*'],
};
