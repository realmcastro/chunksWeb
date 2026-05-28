"""
Import French vocabulary from JSON batch files into the vocabulary_words table.
Uses INSERT OR IGNORE to avoid duplicates based on the unique word constraint.
"""

import json
import sqlite3
import sys
from pathlib import Path

sys.stdout = open(sys.stdout.fileno(), mode='w', encoding='utf8', buffering=1)

DB_PATH = r"C:\Users\mathe\OneDrive\Documentos\ChunksWeb\chunks_v1.db"
FR_DIR = Path(__file__).parent / "fr"

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
  'fr', ?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?
)
"""


def get_vocab_files():
    """Get all French vocabulary JSON files from the fr directory."""
    if not FR_DIR.exists():
        print(f"ERROR: Directory {FR_DIR} does not exist")
        return []
    return sorted(FR_DIR.glob("french_vocab_*.json"))


def load_words_from_json(path: Path) -> list:
    print(f"\n→ Loading {path.name}")
    with open(path, "r", encoding="utf-8") as f:
        data = json.load(f)
    print(f"  OK: {len(data)} words parsed")
    return data


def import_words(conn: sqlite3.Connection, words: list, source: str) -> int:
    cur = conn.cursor()
    inserted = 0
    for w in words:
        examples = w.get("examples", [])
        example_1 = w.get("example_1") or (examples[0] if len(examples) > 0 else "")
        example_2 = w.get("example_2") or (examples[1] if len(examples) > 1 else "")
        example_3 = w.get("example_3") or (examples[2] if len(examples) > 2 else "")
        example_1_t = w.get("example_1_translation", "")
        example_2_t = w.get("example_2_translation", "")
        example_3_t = w.get("example_3_translation", "")

        image_tags = w.get("image_tags", [])
        if isinstance(image_tags, list):
            image_tags = ", ".join(image_tags)

        result = cur.execute(STMT, (
            w.get("category", ""),
            w.get("subcategory", ""),
            w.get("word", ""),
            w.get("phonetic", ""),
            w.get("part_of_speech", ""),
            w.get("cefr_level", w.get("level", "")),
            w.get("frequency_rank", ""),
            w.get("regional_variant", ""),
            w.get("article", ""),
            w.get("plural_form", ""),
            w.get("countability", ""),
            w.get("primary_meaning", w.get("meaning", "")),
            w.get("secondary_meaning", ""),
            w.get("usage_notes", ""),
            w.get("common_collocations", ""),
            w.get("synonyms", ""),
            w.get("antonyms", ""),
            w.get("image_search_query", ""),
            w.get("image_context", ""),
            image_tags,
            example_1,
            example_1_t,
            example_2,
            example_2_t,
            example_3,
            example_3_t,
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


def main():
    conn = sqlite3.connect(DB_PATH)
    cur = conn.cursor()

    cur.execute("SELECT COUNT(*) FROM vocabulary_words")
    baseline = cur.fetchone()[0]
    print(f"Words in DB before import: {baseline}")

    vocab_files = get_vocab_files()
    print(f"\nFound {len(vocab_files)} vocabulary files to import")

    total_new = 0
    for json_path in vocab_files:
        words = load_words_from_json(json_path)
        if words:
            total_new += import_words(conn, words, str(json_path))

    cur.execute("SELECT COUNT(*) FROM vocabulary_words")
    final = cur.fetchone()[0]

    print(f"\n{'='*50}")
    print(f"Words before : {baseline}")
    print(f"Words after  : {final}")
    print(f"New words    : {final - baseline}")

    print("\nBreakdown by CEFR level:")
    cur.execute("""
        SELECT cefr_level, COUNT(*) 
        FROM vocabulary_words 
        WHERE cefr_level IN ('A1', 'A2', 'B1', 'B2', 'C1', 'C2')
        GROUP BY cefr_level 
        ORDER BY cefr_level
    """)
    for row in cur.fetchall():
        print(f"  {row[0] or '(none)'}: {row[1]}")

    conn.close()
    print(f"\n✓ Import complete: {total_new} new French words imported")


if __name__ == "__main__":
    main()
