import { db } from '@/lib/db/sqlite';
import { ROLES, type Module, type Action, type Role } from './roles';

/*
! Permission check middleware for module-level access control.
! Throws a Response with 403 if the user lacks the required permission.
! Owner always has full access to their own data.
*/

interface PermissionRow {
  can_read: number;
  can_write: number;
  can_delete: number;
}

interface RoleRow {
  slug: string;
}

function getUserRoles(userId: number): Role[] {
  return (
    db
      .prepare(`
        SELECT r.slug FROM user_roles ur
        JOIN roles r ON ur.role_id = r.id
        WHERE ur.user_id = ?
      `)
      .all(userId) as RoleRow[]
  ).map((r) => r.slug as Role);
}

function getModulePermission(userId: number, module: Module): PermissionRow | null {
  return (
    db
      .prepare(
        'SELECT can_read, can_write, can_delete FROM module_permissions WHERE user_id = ? AND module = ?',
      )
      .get(userId, module) as PermissionRow | undefined
  ) ?? null;
}

/*
? Returns true if userId has the given action on the module.
? Falls back to explicit module_permissions when not an owner/admin.
*/
export function hasPermission(userId: number, module: Module, action: Action): boolean {
  const roles = getUserRoles(userId);

  if (roles.includes(ROLES.OWNER) || roles.includes(ROLES.ADMIN)) return true;

  const perm = getModulePermission(userId, module);
  if (!perm) return false;

  switch (action) {
    case 'read':   return perm.can_read === 1;
    case 'write':  return perm.can_write === 1;
    case 'delete': return perm.can_delete === 1;
  }
}

/*
! Call in route handlers before business logic.
! Throws a NextResponse 403 if permission denied.
! Usage: await requirePermission(userId, 'journal', 'write')
*/
export function requirePermission(userId: number, module: Module, action: Action): void {
  if (!hasPermission(userId, module, action)) {
    throw Object.assign(new Error(`Forbidden: ${module}:${action}`), { statusCode: 403 });
  }
}

/*
? Grants owner role + full module permissions for a newly registered user.
? Called from auth/register route after user creation.
*/
export function grantOwnerDefaults(userId: number): void {
  const ownerRole = db
    .prepare("SELECT id FROM roles WHERE slug = 'owner'")
    .get() as { id: number } | undefined;

  if (!ownerRole) return;

  db.prepare('INSERT OR IGNORE INTO user_roles (user_id, role_id) VALUES (?, ?)').run(
    userId,
    ownerRole.id,
  );

  const modules: Module[] = ['study', 'reading', 'journal', 'tracking', 'admin', 'search', 'domains'];
  for (const mod of modules) {
    /*
    ! module_permissions has no UNIQUE(user_id, module) constraint, so INSERT OR IGNORE
    ! won't deduplicate. Check existence first to keep this function idempotent.
    */
    const exists = db
      .prepare('SELECT 1 FROM module_permissions WHERE user_id = ? AND module = ?')
      .get(userId, mod);
    if (!exists) {
      db.prepare(
        'INSERT INTO module_permissions (user_id, module, can_read, can_write, can_delete) VALUES (?, ?, 1, 1, 1)',
      ).run(userId, mod);
    }
  }
}
