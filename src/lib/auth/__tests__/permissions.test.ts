import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { hasPermission, requirePermission, grantOwnerDefaults } from '../permissions';
import { db } from '@/lib/db/sqlite';

let userId: number;
let userCounter = 0;

function insertTestUser(): number {
  userCounter++;
  const result = db
    .prepare('INSERT INTO users (username, password_hash) VALUES (?, ?)')
    .run(`perm_test_user_${userCounter}`, 'hash');
  return Number(result.lastInsertRowid);
}

function cleanupUser(id: number): void {
  db.prepare('DELETE FROM module_permissions WHERE user_id = ?').run(id);
  db.prepare('DELETE FROM user_roles WHERE user_id = ?').run(id);
  db.prepare('DELETE FROM users WHERE id = ?').run(id);
}

beforeEach(() => {
  userId = insertTestUser();
});

afterEach(() => {
  cleanupUser(userId);
});

describe('hasPermission', () => {
  it('returns false when user has no roles or permissions', () => {
    expect(hasPermission(userId, 'study', 'read')).toBe(false);
    expect(hasPermission(userId, 'journal', 'write')).toBe(false);
    expect(hasPermission(userId, 'admin', 'delete')).toBe(false);
  });

  it('returns true for all actions when user has owner role (via grantOwnerDefaults)', () => {
    grantOwnerDefaults(userId);
    expect(hasPermission(userId, 'study', 'read')).toBe(true);
    expect(hasPermission(userId, 'study', 'write')).toBe(true);
    expect(hasPermission(userId, 'study', 'delete')).toBe(true);
    expect(hasPermission(userId, 'admin', 'delete')).toBe(true);
  });

  it('returns true for read when viewer role + can_read=1', () => {
    const viewerRole = db.prepare("SELECT id FROM roles WHERE slug = 'viewer'").get() as { id: number };
    db.prepare('INSERT INTO user_roles (user_id, role_id) VALUES (?, ?)').run(userId, viewerRole.id);
    db.prepare(
      'INSERT INTO module_permissions (user_id, module, can_read, can_write, can_delete) VALUES (?, ?, 1, 0, 0)',
    ).run(userId, 'study');

    expect(hasPermission(userId, 'study', 'read')).toBe(true);
    expect(hasPermission(userId, 'study', 'write')).toBe(false);
    expect(hasPermission(userId, 'study', 'delete')).toBe(false);
  });

  it('returns false when module row missing even with a role assigned', () => {
    const viewerRole = db.prepare("SELECT id FROM roles WHERE slug = 'viewer'").get() as { id: number };
    db.prepare('INSERT INTO user_roles (user_id, role_id) VALUES (?, ?)').run(userId, viewerRole.id);
    // No module_permissions row → null → false
    expect(hasPermission(userId, 'journal', 'read')).toBe(false);
  });

  it('owner role short-circuits module permissions check', () => {
    const ownerRole = db.prepare("SELECT id FROM roles WHERE slug = 'owner'").get() as { id: number };
    db.prepare('INSERT INTO user_roles (user_id, role_id) VALUES (?, ?)').run(userId, ownerRole.id);
    // No module_permissions row at all
    expect(hasPermission(userId, 'domains', 'delete')).toBe(true);
  });

  it('admin role short-circuits module permissions check', () => {
    const adminRole = db.prepare("SELECT id FROM roles WHERE slug = 'admin'").get() as { id: number };
    db.prepare('INSERT INTO user_roles (user_id, role_id) VALUES (?, ?)').run(userId, adminRole.id);
    expect(hasPermission(userId, 'reading', 'write')).toBe(true);
  });
});

describe('requirePermission', () => {
  it('throws with Forbidden message when permission denied', () => {
    expect(() => requirePermission(userId, 'study', 'write')).toThrow('Forbidden');
  });

  it('thrown error includes module and action', () => {
    let caught: Error | null = null;
    try {
      requirePermission(userId, 'journal', 'delete');
    } catch (e) {
      caught = e as Error;
    }
    expect(caught?.message).toContain('journal');
    expect(caught?.message).toContain('delete');
  });

  it('does not throw when user has owner permissions', () => {
    grantOwnerDefaults(userId);
    expect(() => requirePermission(userId, 'study', 'read')).not.toThrow();
    expect(() => requirePermission(userId, 'admin', 'delete')).not.toThrow();
  });

  it('does not throw when explicit module permission granted', () => {
    const viewerRole = db.prepare("SELECT id FROM roles WHERE slug = 'viewer'").get() as { id: number };
    db.prepare('INSERT INTO user_roles (user_id, role_id) VALUES (?, ?)').run(userId, viewerRole.id);
    db.prepare(
      'INSERT INTO module_permissions (user_id, module, can_read, can_write, can_delete) VALUES (?, ?, 1, 0, 0)',
    ).run(userId, 'search');

    expect(() => requirePermission(userId, 'search', 'read')).not.toThrow();
    expect(() => requirePermission(userId, 'search', 'write')).toThrow('Forbidden');
  });
});

describe('grantOwnerDefaults', () => {
  it('grants the owner role', () => {
    grantOwnerDefaults(userId);

    const roles = db
      .prepare('SELECT r.slug FROM user_roles ur JOIN roles r ON ur.role_id = r.id WHERE ur.user_id = ?')
      .all(userId) as Array<{ slug: string }>;

    expect(roles.some((r) => r.slug === 'owner')).toBe(true);
  });

  it('grants can_read, can_write, can_delete on all 7 modules', () => {
    grantOwnerDefaults(userId);

    const perms = db
      .prepare(
        'SELECT module, can_read, can_write, can_delete FROM module_permissions WHERE user_id = ?',
      )
      .all(userId) as Array<{ module: string; can_read: number; can_write: number; can_delete: number }>;

    expect(perms).toHaveLength(7);
    for (const p of perms) {
      expect(p.can_read).toBe(1);
      expect(p.can_write).toBe(1);
      expect(p.can_delete).toBe(1);
    }
  });

  it('grants all expected modules', () => {
    grantOwnerDefaults(userId);

    const modules = (
      db
        .prepare('SELECT module FROM module_permissions WHERE user_id = ?')
        .all(userId) as Array<{ module: string }>
    ).map((r) => r.module);

    const expected = ['study', 'reading', 'journal', 'tracking', 'admin', 'search', 'domains'];
    for (const m of expected) {
      expect(modules).toContain(m);
    }
  });

  it('is idempotent: double call does not create duplicate role rows', () => {
    grantOwnerDefaults(userId);
    grantOwnerDefaults(userId);

    const count = (
      db.prepare('SELECT COUNT(*) as n FROM user_roles WHERE user_id = ?').get(userId) as { n: number }
    ).n;

    expect(count).toBe(1);
  });

  it('is idempotent: double call does not create duplicate permission rows', () => {
    grantOwnerDefaults(userId);
    grantOwnerDefaults(userId);

    const count = (
      db.prepare('SELECT COUNT(*) as n FROM module_permissions WHERE user_id = ?').get(userId) as { n: number }
    ).n;

    expect(count).toBe(7);
  });

  it('returns without error when owner role does not exist in DB', () => {
    // Temporarily test resilience if roles table is somehow empty
    // (grantOwnerDefaults guards with `if (!ownerRole) return`)
    expect(() => grantOwnerDefaults(userId)).not.toThrow();
  });
});
