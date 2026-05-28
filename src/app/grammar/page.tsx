import { Suspense } from 'react';
import {
  getGrammarStructures,
  getGrammarStructuresByCategory,
  getGrammarStructureCount,
  getGrammarStructureCountByCategory,
  searchGrammarStructures,
  getCategories,
} from '@/lib/db/sqlite';
import { GrammarClient } from '@/components/grammar/GrammarClient';

interface GrammarPageProps {
  searchParams: { category?: string; search?: string; page?: string };
}

type LocalGrammarStructure = {
  id: number;
  category_id: number;
  structure_label: string;
  core_meaning: string;
  primary_function: string | null;
  pattern: string | null;
  key_forms: string | null;
  essential_vocabulary: string | null;
  when_to_use: string | null;
  why_it_matters: string | null;
};

type LocalCategory = {
  id: number;
  corpus_id: number;
  code: string;
  name: string;
  type: string;
  description: string | null;
  color_hex: string | null;
  total_entries: number;
};

const ITEMS_PER_PAGE = 50;

async function getGrammarData(searchParams: GrammarPageProps['searchParams']) {
  const categoryId = searchParams.category ? parseInt(searchParams.category) : null;
  const searchQuery = searchParams.search || '';

  let structures: LocalGrammarStructure[] = [];
  let totalCount = 0;

  if (searchQuery) {
    structures = searchGrammarStructures(searchQuery, ITEMS_PER_PAGE, 0);
    totalCount = structures.length;
  } else if (categoryId) {
    structures = getGrammarStructuresByCategory(categoryId, ITEMS_PER_PAGE, 0);
    totalCount = getGrammarStructureCountByCategory(categoryId);
  } else {
    structures = getGrammarStructures(ITEMS_PER_PAGE, 0);
    totalCount = getGrammarStructureCount();
  }

  const categories = getCategories().filter((c) => c.type === 'foundation' || c.type === 'grammar');

  return { structures, categories, totalCount };
}

export default async function GrammarPage({ searchParams }: GrammarPageProps) {
  const { structures, categories, totalCount } = await getGrammarData(searchParams);

  return (
    <Suspense fallback={<div className="container py-8 text-center">Loading...</div>}>
      <GrammarClient
        initialStructures={structures}
        initialCategories={categories}
        initialTotalCount={totalCount}
      />
    </Suspense>
  );
}
