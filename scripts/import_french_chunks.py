"""
Import French chunks from JSON batch files into the chunks table.
Inserts all rich fields from JSON + examples into the examples table.
Uses INSERT OR IGNORE to avoid duplicates.
"""

import json
import sqlite3
import sys
import time
from pathlib import Path

sys.stdout = open(sys.stdout.fileno(), mode='w', encoding='utf8', buffering=1)

DB_PATH = r"C:\Users\mathe\OneDrive\Documentos\ChunksWeb\chunks_v1.db"
FR_DIR = Path(__file__).parent / "fr"

STMT = """
INSERT OR IGNORE INTO chunks (
  language, category_id, source_file, entry_index, entry_total,
  chunk_text, meaning, primary_function, communicative_purpose,
  trigger_situations, contexts, cefr_level_id, output_priority,
  frequency, formulaicity, construction_type, acquisition_priority,
  pattern, core_structure, substitution_slots, typical_collocates,
  common_substitutions, variations, common_mistakes, similar_contrasting,
  interference_warnings, nuance, pragmatic_effect, recall_cue,
  spacing_tag, upgrade_path, chunk_family, is_idiom,
  created_at, updated_at
) VALUES (
  'fr',?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?
)
"""

EXAMPLE_STMT = """
INSERT OR IGNORE INTO examples (
  item_type, item_id, example_index, text_en, text_target, is_canonical
) VALUES ('chunk', ?, ?, ?, ?, ?)
"""

CEFR_MAP = {"A1": 1, "A2": 2, "B1": 3, "B2": 4, "C1": 5, "C2": 6}


def _str(v):
    if isinstance(v, list):
        return " | ".join(str(x) for x in v)
    return v or ""


def _cefr(level: str) -> int:
    return CEFR_MAP.get((level or "").upper(), 2)  # default A2


def get_chunk_files():
    if not FR_DIR.exists():
        print(f"ERROR: {FR_DIR} not found")
        return []
    return sorted(FR_DIR.glob("french_chunks_batch*.json"))


def load_chunks(path: Path) -> list:
    print(f"\n→ {path.name}")
    try:
        with open(path, "r", encoding="utf-8") as f:
            data = json.load(f)
        print(f"  {len(data)} chunks")
        return data
    except json.JSONDecodeError as e:
        print(f"  ERROR: invalid JSON — {e}")
        return []


def import_chunks(conn: sqlite3.Connection, chunks: list, source: str) -> int:
    cur = conn.cursor()
    now = int(time.time())
    inserted = 0

    for idx, c in enumerate(chunks, 1):
        result = cur.execute(STMT, (
            1,                                  # category_id
            source,
            idx,
            len(chunks),                        # entry_total
            _str(c.get("chunk_text")),
            _str(c.get("meaning")),
            _str(c.get("primary_function")),
            _str(c.get("communicative_purpose")),
            _str(c.get("trigger_situations")),
            _str(c.get("contexts")),
            _cefr(c.get("level") or c.get("cefr_level")),
            _str(c.get("output_priority")),
            _str(c.get("frequency")),
            _str(c.get("formulaicity")),
            _str(c.get("construction_type")),
            _str(c.get("acquisition_priority")),
            _str(c.get("patterns") or c.get("pattern")),
            _str(c.get("core_structure")),
            _str(c.get("substitution_slots")),
            _str(c.get("collocates") or c.get("typical_collocates")),
            _str(c.get("common_substitutions")),
            _str(c.get("variations")),
            _str(c.get("common_mistakes")),
            _str(c.get("similar_contrasting")),
            _str(c.get("interference_warnings")),
            _str(c.get("nuance")),
            _str(c.get("pragmatic_effect")),
            _str(c.get("recall_cue")),
            _str(c.get("spacing_tag")),
            _str(c.get("upgrade_path")),
            _str(c.get("chunk_family")),
            int(c.get("is_idiom") or 0),
            now,
            now,
        ))

        if result.rowcount:
            inserted += 1
            chunk_id = cur.lastrowid
            _insert_examples(cur, chunk_id, c)

    conn.commit()
    skipped = len(chunks) - inserted
    print(f"  inserted={inserted}  skipped={skipped}")
    return inserted


def _insert_examples(cur: sqlite3.Cursor, chunk_id: int, c: dict):
    pairs = [
        (c.get("example_1", ""), c.get("example_1_translation", ""), 1),
        (c.get("example_2", ""), c.get("example_2_translation", ""), 0),
        (c.get("example_3", ""), c.get("example_3_translation", ""), 0),
    ]
    # also handle legacy `examples` array format
    legacy = c.get("examples", [])
    if legacy and not any(p[0] for p in pairs):
        pairs = [(ex, "", i == 0) for i, ex in enumerate(legacy[:3])]

    for i, (text, translation, canonical) in enumerate(pairs, 1):
        if text:
            cur.execute(EXAMPLE_STMT, (chunk_id, i, text, translation or None, int(canonical)))


def main():
    conn = sqlite3.connect(DB_PATH)
    cur = conn.cursor()

    cur.execute("SELECT COUNT(*) FROM chunks WHERE language='fr'")
    baseline = cur.fetchone()[0]
    print(f"FR chunks before: {baseline}")

    files = get_chunk_files()
    print(f"Files found: {len(files)}")

    total = 0
    for p in files:
        chunks = load_chunks(p)
        if chunks:
            total += import_chunks(conn, chunks, p.name)

    cur.execute("SELECT COUNT(*) FROM chunks WHERE language='fr'")
    final = cur.fetchone()[0]

    print(f"\n{'='*50}")
    print(f"FR chunks before : {baseline}")
    print(f"FR chunks after  : {final}")
    print(f"New chunks       : {final - baseline}")

    cur.execute("""
        SELECT cefr_levels.code, COUNT(chunks.id)
        FROM chunks
        LEFT JOIN cefr_levels ON chunks.cefr_level_id = cefr_levels.id
        WHERE chunks.language='fr'
        GROUP BY cefr_levels.code
        ORDER BY cefr_levels.sort_order
    """)
    print("\nBreakdown by CEFR:")
    for row in cur.fetchall():
        print(f"  {row[0] or '?'}: {row[1]}")

    conn.close()
    print(f"\n✓ Done: {total} FR chunks imported")


if __name__ == "__main__":
    main()
