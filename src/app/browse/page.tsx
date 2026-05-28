import { Suspense } from 'react';
import {
  getChunks,
  getCategories,
  getChunkCount,
  getChunksByCategory,
  getChunkCountByCategory,
  searchChunks,
  getChunksByPriority,
  getChunkCountByPriority,
} from '@/lib/db/sqlite';
import { BrowseClient } from '@/components/browse/BrowseClient';

interface BrowsePageProps {
  searchParams: {
    category?: string;
    search?: string;
    page?: string;
    priority?: string;
    language?: string;
  };
}

type LocalChunk = {
  id: number;
  chunk_text: string;
  meaning: string;
  category_id: number;
  frequency: string | null;
  pattern: string | null;
  cefr_level_id: number | null;
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

async function getChunksData(searchParams: BrowsePageProps['searchParams']) {
  const categoryId = searchParams.category ? parseInt(searchParams.category) : null;
  const searchQuery = searchParams.search || '';
  const acquisitionPriority = searchParams.priority || '';
  const language = searchParams.language || 'en';

  let chunks: LocalChunk[] = [];
  let totalCount = 0;

  if (searchQuery) {
    chunks = searchChunks(searchQuery, ITEMS_PER_PAGE, 0, language);
    totalCount = chunks.length;
  } else if (categoryId) {
    chunks = getChunksByCategory(categoryId, ITEMS_PER_PAGE, 0, language);
    totalCount = getChunkCountByCategory(categoryId, language);
  } else if (acquisitionPriority) {
    chunks = getChunksByPriority(acquisitionPriority, ITEMS_PER_PAGE, 0, language);
    totalCount = getChunkCountByPriority(acquisitionPriority);
  } else {
    chunks = getChunks(ITEMS_PER_PAGE, 0, language);
    totalCount = getChunkCount(language);
  }

  const categories = getCategories();

  return { chunks, categories, totalCount };
}

export default async function BrowsePage({ searchParams }: BrowsePageProps) {
  const { chunks, categories, totalCount } = await getChunksData(searchParams);

  return (
    <Suspense fallback={<div className="container py-8 text-center">Loading...</div>}>
      <BrowseClient
        initialChunks={chunks}
        initialCategories={categories}
        initialTotalCount={totalCount}
      />
    </Suspense>
  );
}
