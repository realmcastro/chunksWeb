import { NextResponse } from 'next/server';
import { getExamplesForGrammarStructure } from '@/lib/db/sqlite';

/*
! Invariantes, contratos, pré-condições e decisões críticas e riscos.
? Descrição técnica relevante que não seja óbvia pelo nome.

- GET /api/grammar/structures/[id]/examples - Returns examples for a grammar structure
*/
export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const structureId = parseInt(id, 10);

    if (isNaN(structureId)) {
      return NextResponse.json({ error: 'Invalid structure ID' }, { status: 400 });
    }

    const examples = getExamplesForGrammarStructure(structureId);

    return NextResponse.json({
      examples: examples.map((ex) => ({
        id: ex.id,
        text_en: ex.text_en,
        text_target: ex.text_target,
      })),
      count: examples.length,
    });
  } catch (error) {
    console.error('Error fetching grammar structure examples:', error);
    return NextResponse.json({ error: 'Failed to fetch examples' }, { status: 500 });
  }
}
