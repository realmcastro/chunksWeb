import { z } from 'zod';

export const DOMAIN_TYPES = ['language', 'programming', 'science', 'math', 'custom'] as const;
export type DomainType = (typeof DOMAIN_TYPES)[number];

export const STUDY_MODES = [
  'flashcard',
  'quiz',
  'feynman',
  'pronunciation',
  'dictation',
  'cloze',
  'audio',
] as const;
export type StudyMode = (typeof STUDY_MODES)[number];

export const StudyDomainSchema = z.object({
  id: z.number().int().positive(),
  slug: z.string().min(1).max(64),
  name: z.string().min(1).max(128),
  type: z.enum(DOMAIN_TYPES),
  content_schema: z.string(),
  enabled_modes: z.string(),
  sm2_enabled: z.number().int().min(0).max(1),
  spaced_repetition_algorithm: z.enum(['sm2', 'fsrs', 'none']),
  icon: z.string().nullable(),
  color: z.string().nullable(),
  created_by: z.number().int().nullable(),
  is_system: z.number().int().min(0).max(1),
  created_at: z.number().int(),
  deleted_at: z.number().int().nullable(),
});

export type StudyDomainRow = z.infer<typeof StudyDomainSchema>;

export interface StudyDomainDTO {
  id: number;
  slug: string;
  name: string;
  type: DomainType;
  contentSchema: Record<string, unknown>;
  enabledModes: StudyMode[];
  sm2Enabled: boolean;
  algorithm: 'sm2' | 'fsrs' | 'none';
  icon: string | null;
  color: string | null;
  isSystem: boolean;
  createdAt: number;
}

export function toStudyDomainDTO(row: StudyDomainRow): StudyDomainDTO {
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    type: row.type as DomainType,
    contentSchema: JSON.parse(row.content_schema) as Record<string, unknown>,
    enabledModes: JSON.parse(row.enabled_modes) as StudyMode[],
    sm2Enabled: row.sm2_enabled === 1,
    algorithm: row.spaced_repetition_algorithm as StudyDomainDTO['algorithm'],
    icon: row.icon,
    color: row.color,
    isSystem: row.is_system === 1,
    createdAt: row.created_at,
  };
}

export const CreateDomainInputSchema = z.object({
  slug: z
    .string()
    .min(1)
    .max(64)
    .regex(/^[a-z0-9-]+$/, 'slug must be lowercase alphanumeric with hyphens'),
  name: z.string().min(1).max(128),
  type: z.enum(DOMAIN_TYPES),
  contentSchema: z.record(z.string(), z.unknown()).optional(),
  enabledModes: z.array(z.enum(STUDY_MODES)).optional(),
  sm2Enabled: z.boolean().optional(),
  algorithm: z.enum(['sm2', 'fsrs', 'none']).optional(),
  icon: z.string().max(8).optional(),
  color: z
    .string()
    .regex(/^#[0-9a-fA-F]{6}$/)
    .optional(),
});

export type CreateDomainInput = z.infer<typeof CreateDomainInputSchema>;

export const DomainImportSchema = z.object({
  version: z.literal(1),
  domain: z.string(),
  schema_version: z.string(),
  chunks: z.array(z.record(z.string(), z.unknown())),
});

export type DomainImport = z.infer<typeof DomainImportSchema>;
