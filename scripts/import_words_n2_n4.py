"""
Import vocabulary words from WordN2.docx, WordN3.docx, WordN4.docx
into the existing vocabulary_words table (INSERT OR IGNORE to avoid duplicates).
"""

import json
import re
import sqlite3
import sys
from docx import Document

sys.stdout = open(sys.stdout.fileno(), mode='w', encoding='utf8', buffering=1)

DB_PATH  = r"C:\Users\mathe\OneDrive\Documentos\ChunksWeb\chunks_v1.db"
DOCX_FILES = [
    r"C:\Users\mathe\OneDrive\Documentos\chunks\WordN2.docx",
    r"C:\Users\mathe\OneDrive\Documentos\chunks\WordN3.docx",
    r"C:\Users\mathe\OneDrive\Documentos\chunks\WordN4.docx",
]

# ── JSON repair ────────────────────────────────────────────────────────────────

def fix_json_string_quotes(s: str) -> str:
    """Escape unescaped double-quotes that appear inside JSON string values."""
    result = []
    in_string = False
    escape_next = False

    for i, c in enumerate(s):
        if escape_next:
            result.append(c)
            escape_next = False
            continue

        if c == '\\':
            result.append(c)
            escape_next = True
            continue

        if c == '"' and not in_string:
            in_string = True
            result.append(c)
            continue

        if c == '"' and in_string:
            # Look ahead past whitespace
            j = i + 1
            while j < len(s) and s[j] in ' \t\n\r':
                j += 1
            if j < len(s) and s[j] in ':,}]':
                in_string = False
                result.append(c)
            else:
                result.append('\\"')
            continue

        result.append(c)

    return ''.join(result)


def extract_words_from_docx(path: str) -> list:
    print(f"\n→ Extracting from {path}")
    doc = Document(path)
    full_text = "\n".join(p.text for p in doc.paragraphs)

    match = re.search(r'\[\s*\{.*\}\s*\]', full_text, re.DOTALL)
    if not match:
        print(f"  ERROR: No JSON array found in {path}")
        return []

    raw = match.group(0)
    fixed = fix_json_string_quotes(raw)

    try:
        data = json.loads(fixed)
        print(f"  OK: {len(data)} words parsed")
        return data
    except json.JSONDecodeError as e:
        print(f"  JSON error at pos {e.pos}: {e.msg}")
        ctx = fixed[max(0, e.pos-100):min(len(fixed), e.pos+100)]
        print(f"  Context: {repr(ctx)}")
        return []


# ── DB import ──────────────────────────────────────────────────────────────────

STMT = """
INSERT OR IGNORE INTO vocabulary_words (
  category, subcategory, word, phonetic, part_of_speech, cefr_level,
  frequency_rank, regional_variant, article, plural_form, countability,
  primary_meaning, secondary_meaning, usage_notes, common_collocations,
  synonyms, antonyms, image_search_query, image_context, image_tags,
  example_1, example_1_translation, example_2, example_2_translation,
  example_3, example_3_translation, pronunciation_tips, memory_hook,
  related_words, common_mistakes, learning_priority
) VALUES (
  ?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?
)
"""

def import_words(conn: sqlite3.Connection, words: list, source: str) -> int:
    cur = conn.cursor()
    inserted = 0
    for w in words:
        result = cur.execute(STMT, (
            w.get("category", ""),
            w.get("subcategory", ""),
            w.get("word", ""),
            w.get("phonetic", ""),
            w.get("part_of_speech", ""),
            w.get("cefr_level", ""),
            w.get("frequency_rank"),
            w.get("regional_variant", ""),
            w.get("article", ""),
            w.get("plural_form", ""),
            w.get("countability", ""),
            w.get("primary_meaning", ""),
            w.get("secondary_meaning", ""),
            w.get("usage_notes", ""),
            w.get("common_collocations", ""),
            w.get("synonyms", ""),
            w.get("antonyms", ""),
            w.get("image_search_query", ""),
            w.get("image_context", ""),
            w.get("image_tags", ""),
            w.get("example_1", ""),
            w.get("example_1_translation", ""),
            w.get("example_2", ""),
            w.get("example_2_translation", ""),
            w.get("example_3", ""),
            w.get("example_3_translation", ""),
            w.get("pronunciation_tips", ""),
            w.get("memory_hook", ""),
            w.get("related_words", ""),
            w.get("common_mistakes", ""),
            w.get("learning_priority", ""),
        ))
        if result.rowcount:
            inserted += 1
    conn.commit()
    skipped = len(words) - inserted
    print(f"  Inserted: {inserted}  Skipped (duplicates): {skipped}")
    return inserted


# ── Main ───────────────────────────────────────────────────────────────────────

conn = sqlite3.connect(DB_PATH)
cur = conn.cursor()

# Show baseline
cur.execute("SELECT COUNT(*) FROM vocabulary_words")
baseline = cur.fetchone()[0]
print(f"Words in DB before import: {baseline}")

total_new = 0
for path in DOCX_FILES:
    words = extract_words_from_docx(path)
    if words:
        total_new += import_words(conn, words, path)

cur.execute("SELECT COUNT(*) FROM vocabulary_words")
final = cur.fetchone()[0]
print(f"\n{'='*50}")
print(f"Words before : {baseline}")
print(f"Words after  : {final}")
print(f"New words    : {final - baseline}")

print("\nBreakdown by CEFR level:")
cur.execute("SELECT cefr_level, COUNT(*) FROM vocabulary_words GROUP BY cefr_level ORDER BY cefr_level")
for row in cur.fetchall():
    print(f"  {row[0] or '(none)'}: {row[1]}")

print("\nBreakdown by category:")
cur.execute("SELECT category, COUNT(*) FROM vocabulary_words GROUP BY category ORDER BY category")
for row in cur.fetchall():
    print(f"  {row[0] or '(none)'}: {row[1]}")

conn.close()
