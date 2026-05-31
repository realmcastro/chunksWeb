import { describe, it, expect } from 'vitest';
import {
  StudyDomainSchema,
  CreateDomainInputSchema,
  DomainImportSchema,
  toStudyDomainDTO,
  type StudyDomainRow,
} from '../domain/StudyDomain';

const VALID_ROW: StudyDomainRow = {
  id: 1,
  slug: 'en-language',
  name: 'English',
  type: 'language',
  content_schema: '{"front":"text","back":"text"}',
  enabled_modes: '["flashcard","quiz"]',
  sm2_enabled: 1,
  spaced_repetition_algorithm: 'sm2',
  icon: '🇬🇧',
  color: '#3b82f6',
  created_by: null,
  is_system: 1,
  created_at: 1748649600,
  deleted_at: null,
};

describe('StudyDomainSchema', () => {
  it('parses a valid row', () => {
    expect(StudyDomainSchema.safeParse(VALID_ROW).success).toBe(true);
  });

  it('rejects missing id', () => {
    const { id: _id, ...without } = VALID_ROW;
    expect(StudyDomainSchema.safeParse(without).success).toBe(false);
  });

  it('rejects invalid type', () => {
    expect(StudyDomainSchema.safeParse({ ...VALID_ROW, type: 'unsupported' }).success).toBe(false);
  });

  it('accepts all valid domain types', () => {
    const types = ['language', 'programming', 'science', 'math', 'custom'] as const;
    for (const type of types) {
      expect(StudyDomainSchema.safeParse({ ...VALID_ROW, type }).success).toBe(true);
    }
  });

  it('rejects invalid algorithm', () => {
    expect(
      StudyDomainSchema.safeParse({ ...VALID_ROW, spaced_repetition_algorithm: 'anki' }).success,
    ).toBe(false);
  });

  it('accepts null icon and color', () => {
    expect(
      StudyDomainSchema.safeParse({ ...VALID_ROW, icon: null, color: null }).success,
    ).toBe(true);
  });

  it('accepts null deleted_at', () => {
    expect(StudyDomainSchema.safeParse({ ...VALID_ROW, deleted_at: null }).success).toBe(true);
  });
});

describe('toStudyDomainDTO', () => {
  it('maps id, slug, name, type', () => {
    const dto = toStudyDomainDTO(VALID_ROW);
    expect(dto.id).toBe(1);
    expect(dto.slug).toBe('en-language');
    expect(dto.name).toBe('English');
    expect(dto.type).toBe('language');
  });

  it('parses contentSchema JSON string to object', () => {
    const dto = toStudyDomainDTO(VALID_ROW);
    expect(dto.contentSchema).toEqual({ front: 'text', back: 'text' });
  });

  it('parses enabledModes JSON string to array', () => {
    const dto = toStudyDomainDTO(VALID_ROW);
    expect(dto.enabledModes).toEqual(['flashcard', 'quiz']);
  });

  it('converts sm2_enabled=1 to true', () => {
    expect(toStudyDomainDTO(VALID_ROW).sm2Enabled).toBe(true);
  });

  it('converts sm2_enabled=0 to false', () => {
    expect(toStudyDomainDTO({ ...VALID_ROW, sm2_enabled: 0 }).sm2Enabled).toBe(false);
  });

  it('converts is_system=1 to true', () => {
    expect(toStudyDomainDTO(VALID_ROW).isSystem).toBe(true);
  });

  it('converts is_system=0 to false', () => {
    expect(toStudyDomainDTO({ ...VALID_ROW, is_system: 0 }).isSystem).toBe(false);
  });

  it('passes through algorithm', () => {
    expect(toStudyDomainDTO(VALID_ROW).algorithm).toBe('sm2');
    expect(toStudyDomainDTO({ ...VALID_ROW, spaced_repetition_algorithm: 'fsrs' }).algorithm).toBe('fsrs');
  });

  it('passes through icon and color (including null)', () => {
    expect(toStudyDomainDTO(VALID_ROW).icon).toBe('🇬🇧');
    expect(toStudyDomainDTO({ ...VALID_ROW, icon: null }).icon).toBeNull();
  });
});

describe('CreateDomainInputSchema', () => {
  const VALID_INPUT = { slug: 'my-domain', name: 'My Domain', type: 'custom' as const };

  it('accepts minimal valid input', () => {
    expect(CreateDomainInputSchema.safeParse(VALID_INPUT).success).toBe(true);
  });

  it('accepts full valid input with all optional fields', () => {
    const result = CreateDomainInputSchema.safeParse({
      ...VALID_INPUT,
      contentSchema: { front: 'text' },
      enabledModes: ['flashcard', 'quiz'],
      sm2Enabled: true,
      algorithm: 'sm2',
      icon: '🔬',
      color: '#ff0000',
    });
    expect(result.success).toBe(true);
  });

  it('rejects slug with uppercase letters', () => {
    expect(CreateDomainInputSchema.safeParse({ ...VALID_INPUT, slug: 'MyDomain' }).success).toBe(false);
  });

  it('rejects slug with spaces', () => {
    expect(CreateDomainInputSchema.safeParse({ ...VALID_INPUT, slug: 'my domain' }).success).toBe(false);
  });

  it('rejects slug with special chars (underscore)', () => {
    expect(CreateDomainInputSchema.safeParse({ ...VALID_INPUT, slug: 'my_domain' }).success).toBe(false);
  });

  it('accepts slug with hyphens and numbers', () => {
    expect(CreateDomainInputSchema.safeParse({ ...VALID_INPUT, slug: 'my-domain-2' }).success).toBe(true);
  });

  it('rejects empty slug', () => {
    expect(CreateDomainInputSchema.safeParse({ ...VALID_INPUT, slug: '' }).success).toBe(false);
  });

  it('rejects invalid color (not hex)', () => {
    expect(CreateDomainInputSchema.safeParse({ ...VALID_INPUT, color: 'red' }).success).toBe(false);
    expect(CreateDomainInputSchema.safeParse({ ...VALID_INPUT, color: 'rgb(0,0,0)' }).success).toBe(false);
  });

  it('accepts 6-digit lowercase and uppercase hex', () => {
    expect(CreateDomainInputSchema.safeParse({ ...VALID_INPUT, color: '#ff0000' }).success).toBe(true);
    expect(CreateDomainInputSchema.safeParse({ ...VALID_INPUT, color: '#FF0000' }).success).toBe(true);
  });

  it('rejects 3-digit hex shorthand', () => {
    expect(CreateDomainInputSchema.safeParse({ ...VALID_INPUT, color: '#f00' }).success).toBe(false);
  });

  it('rejects invalid type', () => {
    expect(CreateDomainInputSchema.safeParse({ ...VALID_INPUT, type: 'invalid-type' }).success).toBe(false);
  });

  it('rejects invalid algorithm', () => {
    expect(CreateDomainInputSchema.safeParse({ ...VALID_INPUT, algorithm: 'anki' }).success).toBe(false);
  });

  it('rejects missing name', () => {
    const { name: _n, ...without } = VALID_INPUT;
    expect(CreateDomainInputSchema.safeParse(without).success).toBe(false);
  });
});

describe('DomainImportSchema', () => {
  const VALID_IMPORT = {
    version: 1 as const,
    domain: 'en-language',
    schema_version: '1.0',
    chunks: [{ front: 'hello', back: 'olá' }],
  };

  it('accepts valid import object', () => {
    expect(DomainImportSchema.safeParse(VALID_IMPORT).success).toBe(true);
  });

  it('accepts empty chunks array', () => {
    expect(DomainImportSchema.safeParse({ ...VALID_IMPORT, chunks: [] }).success).toBe(true);
  });

  it('rejects wrong version number', () => {
    expect(DomainImportSchema.safeParse({ ...VALID_IMPORT, version: 2 }).success).toBe(false);
  });

  it('rejects missing chunks field', () => {
    const { chunks: _c, ...without } = VALID_IMPORT;
    expect(DomainImportSchema.safeParse(without).success).toBe(false);
  });

  it('rejects missing domain field', () => {
    const { domain: _d, ...without } = VALID_IMPORT;
    expect(DomainImportSchema.safeParse(without).success).toBe(false);
  });
});
