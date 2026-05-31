export const ROLES = {
  OWNER: 'owner',
  ADMIN: 'admin',
  VIEWER: 'viewer',
  AGENT: 'agent',
} as const;

export type Role = (typeof ROLES)[keyof typeof ROLES];

export const MODULES = [
  'study',
  'reading',
  'journal',
  'tracking',
  'admin',
  'search',
  'domains',
] as const;

export type Module = (typeof MODULES)[number];

export type Action = 'read' | 'write' | 'delete';
