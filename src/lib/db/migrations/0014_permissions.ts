import type { Database } from 'better-sqlite3';

export const name = '0014_permissions';

const SYSTEM_ROLES = ['owner', 'admin', 'viewer', 'agent'] as const;

const MODULES = ['study', 'reading', 'journal', 'tracking', 'admin', 'search', 'domains'] as const;

export function up(db: Database): void {
  db.exec(`
    CREATE TABLE IF NOT EXISTS roles (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      slug TEXT NOT NULL UNIQUE
    );

    CREATE TABLE IF NOT EXISTS user_roles (
      user_id INTEGER NOT NULL REFERENCES users(id),
      role_id INTEGER NOT NULL REFERENCES roles(id),
      granted_at INTEGER NOT NULL DEFAULT (strftime('%s','now')),
      PRIMARY KEY(user_id, role_id)
    );

    CREATE TABLE IF NOT EXISTS module_permissions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL REFERENCES users(id),
      module TEXT NOT NULL CHECK(module IN ('study','reading','journal','tracking','admin','search','domains')),
      can_read INTEGER NOT NULL DEFAULT 1,
      can_write INTEGER NOT NULL DEFAULT 1,
      can_delete INTEGER NOT NULL DEFAULT 0,
      granted_by INTEGER REFERENCES users(id),
      granted_at INTEGER NOT NULL DEFAULT (strftime('%s','now'))
    );

    CREATE INDEX IF NOT EXISTS idx_user_roles_user ON user_roles(user_id);
    CREATE INDEX IF NOT EXISTS idx_module_perms_user ON module_permissions(user_id, module);
  `);

  /*
  ! Seed system roles.
  */
  const insertRole = db.prepare('INSERT OR IGNORE INTO roles (slug) VALUES (?)');
  for (const slug of SYSTEM_ROLES) {
    insertRole.run(slug);
  }

  const ownerRole = db.prepare("SELECT id FROM roles WHERE slug = 'owner'").get() as { id: number };

  /*
  ! Grant every existing user the owner role for their own data.
  ! This ensures backward compatibility — no existing user loses access.
  */
  const users = db.prepare('SELECT id FROM users').all() as Array<{ id: number }>;
  const grantOwner = db.prepare(`
    INSERT OR IGNORE INTO user_roles (user_id, role_id) VALUES (?, ?)
  `);
  for (const user of users) {
    grantOwner.run(user.id, ownerRole.id);

    // Grant full permissions on all modules to each owner
    for (const mod of MODULES) {
      db.prepare(`
        INSERT OR IGNORE INTO module_permissions (user_id, module, can_read, can_write, can_delete)
        VALUES (?, ?, 1, 1, 1)
      `).run(user.id, mod);
    }
  }
}

export function down(db: Database): void {
  db.exec(`
    DROP INDEX IF EXISTS idx_module_perms_user;
    DROP INDEX IF EXISTS idx_user_roles_user;
    DROP TABLE IF EXISTS module_permissions;
    DROP TABLE IF EXISTS user_roles;
    DROP TABLE IF EXISTS roles;
  `);
}
