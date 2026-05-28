import {
  getChunks,
  getCategories,
  getChunkCount,
  getDueChunksCount,
  getCurrentStreak,
  getUserRecentChunkIds,
  getChunksByIds,
  getStartedChunksForUser,
} from '@/lib/db/sqlite';
import { DashboardClient } from '@/components/dashboard/DashboardClient';

/*
! Invariantes, contratos, pré-condições e decisões críticas.
? Descrição técnica relevante.

- Dashboard: Página principal "Today-focused"  
- Prioriza ações claras e feedback de progresso
- Usa conexão direta SQLite (melhor performance para leitura)
- Homepage usa userId=1 por default (dashboard global)
*/

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

// Default userId for homepage (global stats)
const DEFAULT_USER_ID = 1;

async function getStats() {
  const totalChunks = getChunkCount();
  const categories = getCategories();
  const dueToday = getDueChunksCount(DEFAULT_USER_ID);
  const streak = getCurrentStreak(DEFAULT_USER_ID);

  return {
    totalChunks,
    totalCategories: categories.length,
    dueToday,
    streak,
  };
}

async function getRecentChunks(): Promise<LocalChunk[]> {
  // Try to get chunks from user's recent study sessions
  const recentIds = getUserRecentChunkIds(DEFAULT_USER_ID, 10);
  if (recentIds.length > 0) {
    return getChunksByIds(recentIds);
  }
  // Fallback: get user's started chunks ordered by most recent activity
  return getStartedChunksForUser(DEFAULT_USER_ID, 10);
}

async function getCategoryList(): Promise<LocalCategory[]> {
  return getCategories();
}

export default async function DashboardPage() {
  const stats = await getStats();
  const recentChunks = await getRecentChunks();
  const categories = await getCategoryList();

  return <DashboardClient stats={stats} recentChunks={recentChunks} categories={categories} />;
}
