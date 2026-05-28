import { NextResponse } from 'next/server';
import { getGrammarStructureById, getExamplesForGrammarStructure } from '@/lib/db/sqlite';

/*
! Invariantes, contratos, pré-condições e decisões críticas e riscos.
? Descrição técnica relevante que não seja óbvia pelo nome.

- GET /api/grammar/structures/[id] - Returns a grammar structure by ID
- Optional query param: examples=true to include examples
*/
export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const includeExamples = searchParams.get('examples') === 'true';

    const structureId = parseInt(id, 10);
    if (isNaN(structureId)) {
      return NextResponse.json({ error: 'Invalid structure ID' }, { status: 400 });
    }

    const structure = getGrammarStructureById(structureId);
    if (!structure) {
      return NextResponse.json({ error: 'Structure not found' }, { status: 404 });
    }

    const response: Record<string, unknown> = { structure };

    if (includeExamples) {
      const examples = getExamplesForGrammarStructure(structureId);
      response.examples = examples;
    }

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error fetching grammar structure:', error);
    return NextResponse.json({ error: 'Failed to fetch grammar structure' }, { status: 500 });
  }
}
