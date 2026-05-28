import { NextResponse } from 'next/server';
import {
  getRandomGrammarStructures,
  getExamplesForGrammarStructure,
  getCategoryById,
} from '@/lib/db/sqlite';
import { getUserId } from '@/lib/auth/session';

export async function GET(request: Request) {
  try {
    const userId = await getUserId();
    if (!userId) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '10', 10);
    const categoryId = searchParams.get('categoryId')
      ? parseInt(searchParams.get('categoryId')!, 10)
      : undefined;
    const language = searchParams.get('language') || undefined;

    const structures = getRandomGrammarStructures(categoryId, limit, language);

    const withDetails = structures.map((s) => {
      const examples = getExamplesForGrammarStructure(s.id);
      const category = getCategoryById(s.category_id);

      return {
        id: s.id.toString(),
        label: s.structure_label,
        meaning: s.core_meaning,
        function: s.primary_communicative_fn || null,
        whenToUse: s.when_to_use || null,
        pattern: s.pattern || null,
        keyVariations: s.key_variations || null,
        whyItMatters: s.why_it_matters || null,
        commonMistakes: s.common_learner_mistakes || s.common_mistakes || null,
        examples: examples.map((ex) => ({
          id: ex.id.toString(),
          sentence: ex.text_en,
          translation: ex.text_target || undefined,
        })),
        category: {
          id: category?.id.toString() || '0',
          name: category?.name || 'Grammar',
          color: category?.color_hex || '#607d8b',
        },
      };
    });

    return NextResponse.json({ structures: withDetails, count: withDetails.length });
  } catch (error) {
    console.error('Error fetching grammar structures for study:', error);
    return NextResponse.json({ error: 'Failed to fetch structures' }, { status: 500 });
  }
}
