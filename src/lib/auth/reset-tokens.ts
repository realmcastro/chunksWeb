import crypto from 'crypto';

/*
! Token lifecycle for password reset:
! 1. generateResetToken() → raw base64url token (sent via email)
! 2. hashResetToken(raw) → SHA-256 hex digest (stored in DB)
! 3. getResetTokenExpiry() → 30-minute TTL as unix epoch seconds
!
! Raw token NEVER stored. DB only holds the hash.
*/

export function generateResetToken(): string {
  return crypto.randomBytes(32).toString('base64url');
}

export function hashResetToken(rawToken: string): string {
  return crypto.createHash('sha256').update(rawToken).digest('hex');
}

export function getResetTokenExpiry(): number {
  return Math.floor(Date.now() / 1000) + 30 * 60;
}
