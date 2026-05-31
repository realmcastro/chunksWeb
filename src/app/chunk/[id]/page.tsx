import { notFound } from 'next/navigation';
import {
  getChunkById,
  getExamplesForChunk,
  getVariationsForChunk,
  getCategories,
  isFavorite,
  isChunkInStudy,
  getChunkProgress,
} from '@/lib/db/sqlite';
import { getUserId } from '@/lib/auth/session';
import { ChunkDetailClient } from '@/components/chunks/ChunkDetailClient';
import type { Metadata } from 'next';

interface ChunkDetailPageProps {
  params: { id: string };
}

export async function generateMetadata({ params }: ChunkDetailPageProps): Promise<Metadata> {
  const id = parseInt(params.id);
  if (isNaN(id)) return { title: "Chunk Not Found - OLife'S" };

  const chunk = getChunkById(id);
  if (!chunk) return { title: "Chunk Not Found - OLife'S" };

  return {
    title: `${chunk.chunk_text} - OLife'S`,
    description: chunk.meaning,
  };
}

export default async function ChunkDetailPage({ params }: ChunkDetailPageProps) {
  const id = parseInt(params.id);
  if (isNaN(id)) notFound();

  const chunk = getChunkById(id);
  if (!chunk) notFound();

  const examples = getExamplesForChunk(id);
  const variations = getVariationsForChunk(id);
  const categories = getCategories();
  const category = categories.find((c) => c.id === chunk.category_id);

  const userId = await getUserId();
  const initialFavorite = userId ? isFavorite(userId, id) : false;
  const initialInStudy = userId ? isChunkInStudy(userId, id) : false;
  const progress = userId && initialInStudy ? getChunkProgress(userId, id) : null;

  return (
    <ChunkDetailClient
      chunk={chunk}
      examples={examples}
      variations={variations}
      category={category || null}
      isAuthenticated={userId !== null}
      initialFavorite={initialFavorite}
      initialInStudy={initialInStudy}
      initialProgress={
        progress
          ? {
              repetitions: progress.repetitions,
              easeFactor: progress.ease_factor,
              interval: progress.interval,
              nextReview: progress.next_review,
              lastReviewed: progress.last_reviewed,
            }
          : null
      }
    />
  );
}
