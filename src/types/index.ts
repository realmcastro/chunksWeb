// Shared types used across pages and API routes

export interface ChunkExample {
  id: string;
  sentence: string;
  translation?: string;
}

export interface ChunkCategory {
  id: string;
  name: string;
  level: string;
  color?: string;
}

/** Formatted chunk as returned by /api/chunks/random and /api/feynman/chunks */
export interface FormattedChunk {
  id: string;
  chunk: string;
  meaning: string;
  note?: string | null;
  examples: ChunkExample[];
  category: ChunkCategory;
}

export interface LastFeynmanExplanation {
  text: string;
  quality: number | null;
  createdAt: number | null;
}

/** Chunk with prior Feynman explanation data, as returned by /api/feynman/chunks */
export interface FeynmanChunk extends FormattedChunk {
  explanation?: string | null;
  lastExplanation?: LastFeynmanExplanation | null;
}

export interface GrammarStructureItem {
  id: string;
  label: string;
  meaning: string;
  function: string | null;
  whenToUse: string | null;
  pattern: string | null;
  keyVariations: string | null;
  whyItMatters: string | null;
  commonMistakes: string | null;
  examples: ChunkExample[];
  category: { id: string; name: string; color: string };
}

export interface ExplanationEntry {
  id: number;
  explanation: string;
  quality: number;
  created_at: number;
}

export interface ChunkGroup {
  chunk_id: number;
  chunk_text: string;
  meaning: string;
  explanations: ExplanationEntry[];
}

export interface ProgressStats {
  totalChunks: number;
  totalGrammar: number;
  mastered: number;
  dueToday: number;
  streak: number;
  startedChunks?: number;
  categoryProgress: CategoryProgress[];
}

export interface CategoryProgress {
  id: number;
  name: string;
  color_hex: string | null;
  chunks: number;
  grammarStructures: number;
  mastered: number;
  percentage: number;
}
