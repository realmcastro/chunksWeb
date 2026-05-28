"""
Import German vocabulary from JSON batch files in scripts/de/ into vocabulary_words.
Uses INSERT OR IGNORE to skip duplicates based on the unique word constraint.
"""

import json
import sqlite3
import sys
from pathlib import Path

sys.stdout.reconfigure(encoding="utf-8")

DB_PATH = Path(__file__).parent.parent / "chunks_v1.db"
DE_DIR = Path(__file__).parent / "de"

STMT = """
INSERT OR IGNORE INTO vocabulary_words (
  language, category, subcategory, word, phonetic, part_of_speech, cefr_level,
  frequency_rank, regional_variant, article, plural_form, countability,
  primary_meaning, secondary_meaning, usage_notes, common_collocations,
  synonyms, antonyms, image_search_query, image_context, image_tags,
  example_1, example_1_translation, example_2, example_2_translation,
  example_3, example_3_translation, pronunciation_tips, memory_hook,
  related_words, common_mistakes, learning_priority
) VALUES (
  'de', ?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?
)
"""


def import_file(conn: sqlite3.Connection, path: Path) -> int:
    with open(path, "r", encoding="utf-8") as f:
        words = json.load(f)

    cur = conn.cursor()
    inserted = 0
    for w in words:
        image_tags = w.get("image_tags", "")
        if isinstance(image_tags, list):
            image_tags = ", ".join(image_tags)

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
            image_tags,
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
    print(f"  {path.name}: {inserted} inserted, {skipped} skipped (duplicates)")
    return inserted


def main() -> None:
    vocab_files = sorted(DE_DIR.glob("vocab_*.json"))
    if not vocab_files:
        print(f"ERROR: No vocab_*.json files found in {DE_DIR}")
        return

    conn = sqlite3.connect(str(DB_PATH))
    cur = conn.cursor()

    cur.execute("SELECT COUNT(*) FROM vocabulary_words WHERE language='de'")
    baseline = cur.fetchone()[0]
    print(f"German words before import: {baseline}")
    print(f"Files to import: {len(vocab_files)}\n")

    total_inserted = 0
    for path in vocab_files:
        total_inserted += import_file(conn, path)

    cur.execute("SELECT COUNT(*) FROM vocabulary_words WHERE language='de'")
    final = cur.fetchone()[0]

    print(f"\nGerman words before : {baseline}")
    print(f"German words after  : {final}")
    print(f"New words inserted  : {total_inserted}")

    print("\nBreakdown by CEFR level (German):")
    cur.execute("""
        SELECT cefr_level, COUNT(*)
        FROM vocabulary_words
        WHERE language = 'de'
        GROUP BY cefr_level
        ORDER BY cefr_level
    """)
    for row in cur.fetchall():
        print(f"  {row[0] or '(none)'}: {row[1]}")

    conn.close()
    print(f"\nDone.")


if __name__ == "__main__":
    main()
