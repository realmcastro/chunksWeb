"""
Import French grammar structures from JSON batch files into the grammar_structures table.
Uses INSERT OR IGNORE to avoid duplicates.
"""

import json
import sqlite3
import sys
from pathlib import Path

sys.stdout = open(sys.stdout.fileno(), mode='w', encoding='utf8', buffering=1)

DB_PATH = r"C:\Users\mathe\OneDrive\Documentos\ChunksWeb\chunks_v1.db"
FR_DIR = Path(__file__).parent / "fr"

STMT = """
INSERT OR IGNORE INTO grammar_structures (
  language, category_id, source_file, entry_index, entry_total, structure_label,
  core_meaning, primary_communicative_fn, when_to_use, pattern,
  key_variations, essential_vocabulary_slots, common_learner_mistakes,
  chunk_compatibility, primary_function, key_forms, essential_vocabulary,
  why_it_matters, common_mistakes, created_at, updated_at
) VALUES (
  'fr',?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?
)
"""


def get_grammar_files():
    """Get all French grammar JSON files from the fr directory."""
    if not FR_DIR.exists():
        print(f"ERROR: Directory {FR_DIR} does not exist")
        return []
    return sorted(FR_DIR.glob("french_grammar_batch*.json"))


def load_grammar_from_json(path: Path) -> list:
    print(f"\n→ Loading {path.name}")
    with open(path, "r", encoding="utf-8") as f:
        data = json.load(f)
    print(f"  OK: {len(data)} grammar structures parsed")
    return data


def import_grammar(conn: sqlite3.Connection, structures: list, source: str, entry_total: int) -> int:
    cur = conn.cursor()
    inserted = 0
    
    for idx, g in enumerate(structures, 1):
        variations = g.get("key_variations", "")
        if isinstance(variations, list):
            variations = "|".join(variations)
        
        mistakes = g.get("common_learner_mistakes", "")
        if isinstance(mistakes, list):
            mistakes = "|".join(mistakes)
        
        def _join(v):
            if isinstance(v, list):
                return "|".join(str(x) for x in v)
            return v or ""

        result = cur.execute(STMT, (
            1,  # category_id (default)
            source,
            idx,
            entry_total,
            g.get("structure_label", ""),
            g.get("core_meaning", ""),
            g.get("primary_communicative_fn", ""),
            g.get("when_to_use", ""),
            g.get("pattern", ""),
            variations,
            _join(g.get("essential_vocabulary_slots", "")),
            mistakes,
            _join(g.get("chunk_compatibility", "")),
            g.get("primary_function", ""),
            _join(g.get("key_forms", "")),
            _join(g.get("essential_vocabulary", "")),
            g.get("why_it_matters", ""),
            _join(g.get("common_mistakes", "")),
            int(__import__('time').time()),
            int(__import__('time').time()),
        ))
        if result.rowcount:
            inserted += 1
    conn.commit()
    skipped = len(structures) - inserted
    print(f"  Inserted: {inserted}  Skipped (duplicates): {skipped}")
    return inserted


def main():
    conn = sqlite3.connect(DB_PATH)
    cur = conn.cursor()

    cur.execute("SELECT COUNT(*) FROM grammar_structures")
    baseline = cur.fetchone()[0]
    print(f"Grammar structures in DB before import: {baseline}")

    grammar_files = get_grammar_files()
    print(f"\nFound {len(grammar_files)} grammar files to import")

    total_new = 0
    for json_path in grammar_files:
        structures = load_grammar_from_json(json_path)
        if structures:
            total_new += import_grammar(conn, structures, json_path.name, len(structures))

    cur.execute("SELECT COUNT(*) FROM grammar_structures")
    final = cur.fetchone()[0]

    print(f"\n{'='*50}")
    print(f"Grammar before : {baseline}")
    print(f"Grammar after  : {final}")
    print(f"New grammar    : {final - baseline}")

    conn.close()
    print(f"\n✓ Import complete: {total_new} new French grammar structures imported")


if __name__ == "__main__":
    main()