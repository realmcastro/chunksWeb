import { NextResponse } from 'next/server';
import type { ZodSchema, ZodError } from 'zod';

/*
! Helper that pairs `request.json()` with a Zod schema.
! Returns either { data } on success or { error } where `error` is a ready
! NextResponse with shape { error: string, fields?: Record<string, string> }.
! Route handlers should `return error` immediately on failure.
*/

export type ParseResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: NextResponse };

function formatZodError(err: ZodError): { error: string; fields: Record<string, string> } {
  const fields: Record<string, string> = {};
  for (const issue of err.issues) {
    const key = issue.path.join('.') || '_';
    if (!fields[key]) fields[key] = issue.message;
  }
  const firstMessage = err.issues[0]?.message ?? 'Invalid request body';
  return { error: firstMessage, fields };
}

export async function parseJson<T>(
  request: Request,
  schema: ZodSchema<T>,
): Promise<ParseResult<T>> {
  let raw: unknown;
  try {
    raw = await request.json();
  } catch {
    return {
      ok: false,
      error: NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 }),
    };
  }

  const parsed = schema.safeParse(raw);
  if (!parsed.success) {
    return {
      ok: false,
      error: NextResponse.json(formatZodError(parsed.error), { status: 400 }),
    };
  }

  return { ok: true, data: parsed.data };
}
