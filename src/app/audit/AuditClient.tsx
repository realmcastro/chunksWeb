'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { cn } from '@/lib/utils/cn';
import { toast } from '@/lib/hooks/useToast';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type Tab = 'chunks' | 'grammar' | 'vocab';
type Lang = 'all' | 'en' | 'fr' | 'de';

interface PagedResult<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}

type AnyRecord = Record<string, unknown>;

// ---------------------------------------------------------------------------
// Field metadata: labels + textarea rows per entity type
// ---------------------------------------------------------------------------

const CHUNK_FIELDS: { key: string; label: string; rows?: number }[] = [
  { key: 'chunk_text', label: 'Chunk text', rows: 2 },
  { key: 'meaning', label: 'Meaning', rows: 2 },
  { key: 'language', label: 'Language' },
  { key: 'primary_function', label: 'Primary function', rows: 2 },
  { key: 'communicative_purpose', label: 'Communicative purpose', rows: 2 },
  { key: 'trigger_situations', label: 'Trigger situations', rows: 2 },
  { key: 'contexts', label: 'Contexts', rows: 2 },
  { key: 'cefr_level_id', label: 'CEFR level (1=A1…6=C2)' },
  { key: 'output_priority', label: 'Output priority' },
  { key: 'frequency', label: 'Frequency' },
  { key: 'formulaicity', label: 'Formulaicity' },
  { key: 'construction_type', label: 'Construction type' },
  { key: 'acquisition_priority', label: 'Acquisition priority' },
  { key: 'pattern', label: 'Pattern', rows: 2 },
  { key: 'core_structure', label: 'Core structure', rows: 2 },
  { key: 'substitution_slots', label: 'Substitution slots', rows: 3 },
  { key: 'typical_collocates', label: 'Typical collocates', rows: 2 },
  { key: 'common_substitutions', label: 'Common substitutions', rows: 2 },
  { key: 'variations', label: 'Variations', rows: 2 },
  { key: 'common_mistakes', label: 'Common mistakes', rows: 3 },
  { key: 'similar_contrasting', label: 'Similar / contrasting', rows: 3 },
  { key: 'interference_warnings', label: 'Interference warnings', rows: 3 },
  { key: 'nuance', label: 'Nuance', rows: 3 },
  { key: 'pragmatic_effect', label: 'Pragmatic effect', rows: 2 },
  { key: 'recall_cue', label: 'Recall cue' },
  { key: 'spacing_tag', label: 'Spacing tag' },
  { key: 'upgrade_path', label: 'Upgrade path', rows: 2 },
  { key: 'chunk_family', label: 'Chunk family', rows: 2 },
  { key: 'is_idiom', label: 'Is idiom (0/1)' },
];

const GRAMMAR_FIELDS: { key: string; label: string; rows?: number }[] = [
  { key: 'structure_label', label: 'Structure label', rows: 2 },
  { key: 'core_meaning', label: 'Core meaning', rows: 3 },
  { key: 'language', label: 'Language' },
  { key: 'primary_communicative_fn', label: 'Primary communicative fn', rows: 2 },
  { key: 'when_to_use', label: 'When to use', rows: 3 },
  { key: 'pattern', label: 'Pattern', rows: 2 },
  { key: 'key_variations', label: 'Key variations', rows: 3 },
  { key: 'essential_vocabulary_slots', label: 'Essential vocabulary slots', rows: 3 },
  { key: 'common_learner_mistakes', label: 'Common learner mistakes', rows: 3 },
  { key: 'chunk_compatibility', label: 'Chunk compatibility', rows: 3 },
  { key: 'primary_function', label: 'Primary function', rows: 2 },
  { key: 'key_forms', label: 'Key forms', rows: 2 },
  { key: 'essential_vocabulary', label: 'Essential vocabulary', rows: 3 },
  { key: 'why_it_matters', label: 'Why it matters', rows: 3 },
  { key: 'common_mistakes', label: 'Common mistakes', rows: 3 },
];

const VOCAB_FIELDS: { key: string; label: string; rows?: number }[] = [
  { key: 'word', label: 'Word' },
  { key: 'language', label: 'Language' },
  { key: 'phonetic', label: 'Phonetic' },
  { key: 'part_of_speech', label: 'Part of speech' },
  { key: 'cefr_level', label: 'CEFR level' },
  { key: 'category', label: 'Category' },
  { key: 'subcategory', label: 'Subcategory' },
  { key: 'article', label: 'Article' },
  { key: 'plural_form', label: 'Plural form' },
  { key: 'countability', label: 'Countability' },
  { key: 'regional_variant', label: 'Regional variant' },
  { key: 'frequency_rank', label: 'Frequency rank' },
  { key: 'primary_meaning', label: 'Primary meaning', rows: 2 },
  { key: 'secondary_meaning', label: 'Secondary meaning', rows: 2 },
  { key: 'usage_notes', label: 'Usage notes', rows: 3 },
  { key: 'common_collocations', label: 'Common collocations', rows: 2 },
  { key: 'synonyms', label: 'Synonyms' },
  { key: 'antonyms', label: 'Antonyms' },
  { key: 'image_search_query', label: 'Image search query' },
  { key: 'image_context', label: 'Image context', rows: 2 },
  { key: 'image_tags', label: 'Image tags' },
  { key: 'example_1', label: 'Example 1', rows: 2 },
  { key: 'example_1_translation', label: 'Example 1 translation', rows: 2 },
  { key: 'example_2', label: 'Example 2', rows: 2 },
  { key: 'example_2_translation', label: 'Example 2 translation', rows: 2 },
  { key: 'example_3', label: 'Example 3', rows: 2 },
  { key: 'example_3_translation', label: 'Example 3 translation', rows: 2 },
  { key: 'pronunciation_tips', label: 'Pronunciation tips', rows: 3 },
  { key: 'memory_hook', label: 'Memory hook', rows: 2 },
  { key: 'related_words', label: 'Related words', rows: 2 },
  { key: 'common_mistakes', label: 'Common mistakes', rows: 3 },
  { key: 'learning_priority', label: 'Learning priority' },
];

const FIELDS_MAP: Record<Tab, { key: string; label: string; rows?: number }[]> = {
  chunks: CHUNK_FIELDS,
  grammar: GRAMMAR_FIELDS,
  vocab: VOCAB_FIELDS,
};

const ENDPOINT_MAP: Record<Tab, string> = {
  chunks: '/api/audit/chunks',
  grammar: '/api/audit/grammar',
  vocab: '/api/audit/vocab',
};

const DISPLAY_COLS: Record<Tab, string[]> = {
  chunks: ['id', 'language', 'chunk_text', 'meaning', 'cefr_level_id'],
  grammar: ['id', 'language', 'structure_label', 'core_meaning'],
  vocab: ['id', 'language', 'word', 'cefr_level', 'primary_meaning'],
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function useDebounce<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}

function truncate(s: unknown, max = 60): string {
  const str = String(s ?? '');
  return str.length > max ? str.slice(0, max) + '…' : str;
}

// ---------------------------------------------------------------------------
// Edit Drawer
// ---------------------------------------------------------------------------

interface DrawerProps {
  tab: Tab;
  item: AnyRecord;
  onClose: () => void;
  onSaved: (updated: AnyRecord) => void;
}

function EditDrawer({ tab, item, onClose, onSaved }: DrawerProps) {
  const fields = FIELDS_MAP[tab];
  const [form, setForm] = useState<AnyRecord>(() => ({ ...item }));
  const [jsonText, setJsonText] = useState(() => JSON.stringify(item, null, 2));
  const [jsonError, setJsonError] = useState('');
  const [mode, setMode] = useState<'form' | 'json'>('form');
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState('');

  // keep json in sync when form changes
  const syncJsonFromForm = useCallback((f: AnyRecord) => {
    setJsonText(JSON.stringify(f, null, 2));
    setJsonError('');
  }, []);

  const handleFieldChange = (key: string, value: string) => {
    const updated = { ...form, [key]: value };
    setForm(updated);
    syncJsonFromForm(updated);
  };

  const handleJsonChange = (raw: string) => {
    setJsonText(raw);
    try {
      const parsed = JSON.parse(raw);
      setForm(parsed);
      setJsonError('');
    } catch (e) {
      setJsonError((e as Error).message);
    }
  };

  const handleSave = async () => {
    if (jsonError) return;
    setSaving(true);
    setSaveMsg('');
    try {
      const id = form.id;
      const res = await fetch(`${ENDPOINT_MAP[tab]}/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      setSaveMsg('Saved ✓');
      onSaved(form);
      toast.success('Record saved');
      setTimeout(() => setSaveMsg(''), 2000);
    } catch (err) {
      setSaveMsg(`Error: ${(err as Error).message}`);
      toast.error('Save failed', { description: (err as Error).message });
    } finally {
      setSaving(false);
    }
  };

  const handleCopyJson = () => {
    navigator.clipboard.writeText(jsonText).catch(() => null);
  };

  return (
    <div className="fixed inset-0 z-50 flex">
      {/* backdrop */}
      <div
        className="flex-1 bg-black/40"
        onClick={onClose}
        aria-label="Close drawer"
      />

      {/* panel */}
      <div className="w-full max-w-2xl bg-background border-l border-border flex flex-col shadow-2xl overflow-hidden">
        {/* header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-border shrink-0">
          <div className="flex items-center gap-3">
            <span className="text-sm font-semibold text-foreground">
              {tab === 'chunks' && String(form.chunk_text ?? '').slice(0, 50)}
              {tab === 'grammar' && String(form.structure_label ?? '').slice(0, 50)}
              {tab === 'vocab' && String(form.word ?? '').slice(0, 50)}
            </span>
            <span className="text-xs text-muted-foreground">#{String(form.id)}</span>
          </div>
          <div className="flex items-center gap-2">
            {saveMsg && (
              <span
                className={cn(
                  'text-xs font-medium',
                  saveMsg.startsWith('Error') ? 'text-destructive' : 'text-green-600 dark:text-green-400',
                )}
              >
                {saveMsg}
              </span>
            )}
            <button
              onClick={handleSave}
              disabled={saving || !!jsonError}
              className="px-3 py-1.5 text-xs font-medium rounded bg-primary text-primary-foreground disabled:opacity-50 hover:opacity-90 transition-opacity"
            >
              {saving ? 'Saving…' : 'Save'}
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded hover:bg-muted text-muted-foreground"
              aria-label="Close"
            >
              ✕
            </button>
          </div>
        </div>

        {/* mode tabs */}
        <div className="flex gap-1 px-4 pt-3 shrink-0">
          <button
            onClick={() => setMode('form')}
            className={cn(
              'px-3 py-1 text-xs rounded-md font-medium transition-colors',
              mode === 'form'
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted',
            )}
          >
            Form
          </button>
          <button
            onClick={() => setMode('json')}
            className={cn(
              'px-3 py-1 text-xs rounded-md font-medium transition-colors',
              mode === 'json'
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted',
            )}
          >
            JSON
          </button>
          {mode === 'json' && (
            <button
              onClick={handleCopyJson}
              className="ml-auto px-3 py-1 text-xs rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            >
              Copy
            </button>
          )}
        </div>

        {/* body */}
        <div className="flex-1 overflow-y-auto px-4 pb-6 pt-3">
          {mode === 'form' ? (
            <div className="space-y-4">
              {fields.map(({ key, label, rows }) => (
                <div key={key}>
                  <label className="block text-xs font-medium text-muted-foreground mb-1">
                    {label}
                  </label>
                  {rows && rows > 1 ? (
                    <textarea
                      rows={rows}
                      value={String(form[key] ?? '')}
                      onChange={(e) => handleFieldChange(key, e.target.value)}
                      className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground resize-y focus:outline-none focus:ring-1 focus:ring-ring"
                    />
                  ) : (
                    <input
                      type="text"
                      value={String(form[key] ?? '')}
                      onChange={(e) => handleFieldChange(key, e.target.value)}
                      className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                    />
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div>
              {jsonError && (
                <p className="text-xs text-destructive mb-2 font-mono">{jsonError}</p>
              )}
              <textarea
                value={jsonText}
                onChange={(e) => handleJsonChange(e.target.value)}
                rows={40}
                spellCheck={false}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-xs font-mono text-foreground resize-y focus:outline-none focus:ring-1 focus:ring-ring"
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main audit client
// ---------------------------------------------------------------------------

export function AuditClient() {
  const [tab, setTab] = useState<Tab>('chunks');
  const [lang, setLang] = useState<Lang>('all');
  const [q, setQ] = useState('');
  const [page, setPage] = useState(1);
  const [result, setResult] = useState<PagedResult<AnyRecord> | null>(null);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState<AnyRecord | null>(null);

  const debouncedQ = useDebounce(q, 300);
  const abortRef = useRef<AbortController | null>(null);

  const fetchData = useCallback(async () => {
    abortRef.current?.abort();
    const ctrl = new AbortController();
    abortRef.current = ctrl;

    setLoading(true);
    try {
      const params = new URLSearchParams({
        q: debouncedQ,
        lang,
        page: String(page),
      });
      const res = await fetch(`${ENDPOINT_MAP[tab]}?${params}`, {
        signal: ctrl.signal,
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data: PagedResult<AnyRecord> = await res.json();
      setResult(data);
    } catch (err) {
      if ((err as Error).name !== 'AbortError') setResult(null);
    } finally {
      setLoading(false);
    }
  }, [tab, lang, debouncedQ, page]);

  useEffect(() => {
    void fetchData();
  }, [fetchData]);

  // reset page when filters change
  useEffect(() => {
    setPage(1);
  }, [tab, lang, debouncedQ]);

  const handleTabChange = (t: Tab) => {
    setTab(t);
    setSelected(null);
    setResult(null);
  };

  const handleSaved = (updated: AnyRecord) => {
    setResult((prev) =>
      prev
        ? {
            ...prev,
            items: prev.items.map((item) =>
              item.id === updated.id ? updated : item,
            ),
          }
        : prev,
    );
    setSelected(updated);
  };

  const cols = DISPLAY_COLS[tab];
  const totalPages = result ? Math.ceil(result.total / result.pageSize) : 0;

  return (
    <div className="space-y-4">
      {/* Tab bar + lang filter */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex rounded-lg border border-border overflow-hidden">
          {(['chunks', 'grammar', 'vocab'] as Tab[]).map((t) => (
            <button
              key={t}
              onClick={() => handleTabChange(t)}
              className={cn(
                'px-4 py-2 text-sm font-medium capitalize transition-colors',
                tab === t
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted',
              )}
            >
              {t}
            </button>
          ))}
        </div>

        <div className="flex rounded-lg border border-border overflow-hidden">
          {(['all', 'en', 'fr', 'de'] as Lang[]).map((l) => (
            <button
              key={l}
              onClick={() => setLang(l)}
              className={cn(
                'px-3 py-2 text-xs font-medium uppercase transition-colors',
                lang === l
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted',
              )}
            >
              {l}
            </button>
          ))}
        </div>

        {result && (
          <span className="text-xs text-muted-foreground ml-auto">
            {result.total.toLocaleString()} results
          </span>
        )}
      </div>

      {/* Search */}
      <div className="relative">
        <input
          type="search"
          placeholder={`Search ${tab}…`}
          value={q}
          onChange={(e) => setQ(e.target.value)}
          className="w-full rounded-lg border border-input bg-background pl-4 pr-4 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
        />
        {loading && (
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground animate-pulse">
            …
          </span>
        )}
      </div>

      {/* Table */}
      <div className="rounded-lg border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-muted/50 border-b border-border">
                {cols.map((col) => (
                  <th
                    key={col}
                    className="px-4 py-2.5 text-left text-xs font-semibold text-muted-foreground whitespace-nowrap"
                  >
                    {col}
                  </th>
                ))}
                <th className="px-4 py-2.5 w-16" />
              </tr>
            </thead>
            <tbody>
              {!result || loading ? (
                <tr>
                  <td
                    colSpan={cols.length + 1}
                    className="px-4 py-8 text-center text-muted-foreground text-xs"
                  >
                    {loading ? 'Loading…' : 'No results'}
                  </td>
                </tr>
              ) : result.items.length === 0 ? (
                <tr>
                  <td
                    colSpan={cols.length + 1}
                    className="px-4 py-8 text-center text-muted-foreground text-xs"
                  >
                    No results for &ldquo;{q}&rdquo;
                  </td>
                </tr>
              ) : (
                result.items.map((item) => (
                  <tr
                    key={String(item.id)}
                    className={cn(
                      'border-b border-border last:border-0 hover:bg-muted/30 cursor-pointer transition-colors',
                      selected?.id === item.id && 'bg-primary/5',
                    )}
                    onClick={() => setSelected(item)}
                  >
                    {cols.map((col) => (
                      <td
                        key={col}
                        className="px-4 py-2.5 text-xs text-foreground max-w-xs"
                      >
                        {col === 'id' ? (
                          <span className="font-mono text-muted-foreground">
                            {String(item[col])}
                          </span>
                        ) : col === 'language' ? (
                          <span
                            className={cn(
                              'inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold uppercase',
                              item[col] === 'fr' && 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',
                              item[col] === 'en' && 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300',
                              item[col] === 'de' && 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300',
                            )}
                          >
                            {String(item[col])}
                          </span>
                        ) : (
                          <span className="line-clamp-2">
                            {truncate(item[col], 80)}
                          </span>
                        )}
                      </td>
                    ))}
                    <td className="px-4 py-2.5 text-right">
                      <span className="text-xs text-muted-foreground hover:text-primary transition-colors">
                        Edit →
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      {result && totalPages > 1 && (
        <div className="flex items-center justify-between">
          <button
            disabled={page === 1}
            onClick={() => setPage((p) => p - 1)}
            className="px-3 py-1.5 text-xs rounded border border-border text-muted-foreground hover:text-foreground hover:bg-muted disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            ← Previous
          </button>
          <span className="text-xs text-muted-foreground">
            Page {page} of {totalPages}
          </span>
          <button
            disabled={page === totalPages}
            onClick={() => setPage((p) => p + 1)}
            className="px-3 py-1.5 text-xs rounded border border-border text-muted-foreground hover:text-foreground hover:bg-muted disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            Next →
          </button>
        </div>
      )}

      {/* Edit drawer */}
      {selected && (
        <EditDrawer
          tab={tab}
          item={selected}
          onClose={() => setSelected(null)}
          onSaved={handleSaved}
        />
      )}
    </div>
  );
}
