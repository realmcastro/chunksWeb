/*
! Cron script: purges soft-deleted users past the 30-day grace period.
!
! Usage: npx tsx scripts/cleanup-deleted-users.ts
!
! Intended to run on a schedule (daily cron). Safe to run manually.
! Each purged user is logged with their ID for audit trail.
*/

import { getSoftDeletedUsersForPurge, hardDeleteUser } from '../src/lib/db/sqlite';

const GRACE_DAYS = 30;

function main() {
  const userIds = getSoftDeletedUsersForPurge(GRACE_DAYS);

  if (userIds.length === 0) {
    console.log(`[cleanup] No users past ${GRACE_DAYS}-day grace period. Nothing to do.`);
    return;
  }

  console.log(`[cleanup] Found ${userIds.length} user(s) past grace period. Purging...`);

  for (const userId of userIds) {
    try {
      hardDeleteUser(userId);
      console.log(`[cleanup] Hard-deleted user ${userId}`);
    } catch (err: unknown) {
      console.error(
        `[cleanup] Failed to delete user ${userId}: ${err instanceof Error ? err.message : String(err)}`
      );
    }
  }

  console.log(`[cleanup] Done. Purged ${userIds.length} user(s).`);
}

main();
