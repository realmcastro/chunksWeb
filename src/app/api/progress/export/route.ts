import { NextResponse } from 'next/server';
import { getProgressExport, type ExportRow } from '@/lib/db/sqlite';
import { getUserId } from '@/lib/auth/session';
import { logger } from '@/lib/logger';

/*
? GET /api/progress/export?format=json|csv — bulk dump the user's progress + favorites.
? CSV escapes double-quotes by doubling them per RFC 4180. JSON returns a typed array.
*/

function csvEscape(value: string | number | null | undefined): string {
  if (value === null || value === undefined) return '';
  const str = String(value);
  if (/[",\n\r]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

function rowsToCsv(rows: ExportRow[]): string {
  const headers = [
    'chunk_id',
    'chunk_text',
    'repetitions',
    'ease_factor',
    'interval',
    'next_review',
    'last_reviewed',
    'favorited',
  ];
  const lines = [headers.join(',')];
  for (const row of rows) {
    lines.push(
      [
        row.chunk_id,
        csvEscape(row.chunk_text),
        row.repetitions,
        row.ease_factor,
        row.interval,
        row.next_review,
        row.last_reviewed,
        row.favorited,
      ].join(','),
    );
  }
  return lines.join('\n');
}

export async function GET(request: Request) {
  const userId = await getUserId();
  if (!userId) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const format = searchParams.get('format') === 'csv' ? 'csv' : 'json';

  try {
    const rows = getProgressExport(userId);
    if (format === 'csv') {
      return new NextResponse(rowsToCsv(rows), {
        status: 200,
        headers: {
          'Content-Type': 'text/csv; charset=utf-8',
          'Content-Disposition': 'attachment; filename="chunksweb-progress.csv"',
        },
      });
    }
    return new NextResponse(JSON.stringify({ rows, exportedAt: new Date().toISOString() }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        'Content-Disposition': 'attachment; filename="chunksweb-progress.json"',
      },
    });
  } catch (error) {
    logger.error('Failed to export progress', { error, userId });
    return NextResponse.json({ error: 'Failed to export progress' }, { status: 500 });
  }
}
