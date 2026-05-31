import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getUserIdFromCookie } from '@/lib/auth/session';
import {
  getStudyDomains,
  getUserDomains,
  createStudyDomain,
  enrollUserInDomain,
  deactivateUserDomain,
  getStudyDomainBySlug,
} from '@/lib/db/sqlite';
import {
  CreateDomainInputSchema,
  toStudyDomainDTO,
  type StudyDomainRow,
} from '@/features/study/domain/StudyDomain';

const PatchDomainSchema = z.object({
  domainId: z.number().int().positive(),
  action: z.enum(['enroll', 'deactivate']),
});

export async function GET() {
  const userId = await getUserIdFromCookie();
  if (!userId) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

  const allDomains = getStudyDomains().map((d) => toStudyDomainDTO(d as StudyDomainRow));
  const userEnrolled = getUserDomains(userId);
  const enrolledIds = new Set(userEnrolled.map((ud) => ud.domain_id));

  return NextResponse.json({
    domains: allDomains,
    enrolled: userEnrolled.map((ud) => ({
      domainId: ud.domain_id,
      slug: ud.slug,
      name: ud.name,
      active: ud.active === 1,
      sortOrder: ud.sort_order,
    })),
    enrolledIds: Array.from(enrolledIds),
  });
}

export async function POST(request: Request) {
  const userId = await getUserIdFromCookie();
  if (!userId) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

  const body: unknown = await request.json();
  const parsed = CreateDomainInputSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const input = parsed.data;

  const existing = getStudyDomainBySlug(input.slug);
  if (existing) {
    return NextResponse.json({ error: 'Domain slug already exists' }, { status: 409 });
  }

  const domain = createStudyDomain({
    slug: input.slug,
    name: input.name,
    type: input.type,
    contentSchema: input.contentSchema ? JSON.stringify(input.contentSchema) : undefined,
    enabledModes: input.enabledModes ? JSON.stringify(input.enabledModes) : undefined,
    sm2Enabled: input.sm2Enabled,
    algorithm: input.algorithm,
    icon: input.icon,
    color: input.color,
    createdBy: userId,
  });

  enrollUserInDomain(userId, domain.id);

  return NextResponse.json({ domain: toStudyDomainDTO(domain as StudyDomainRow) }, { status: 201 });
}

export async function PATCH(request: Request) {
  const userId = await getUserIdFromCookie();
  if (!userId) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

  const body: unknown = await request.json();
  const parsed = PatchDomainSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { domainId, action } = parsed.data;

  if (action === 'enroll') {
    const ud = enrollUserInDomain(userId, domainId);
    return NextResponse.json({ enrolled: ud });
  }

  deactivateUserDomain(userId, domainId);
  return NextResponse.json({ deactivated: domainId });
}
