"""
Import French chunks from JSON batch files into the chunks table.
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
INSERT OR IGNORE INTO chunks (
  category_id, source_file, entry_index, entry_total, chunk_text, meaning,
  primary_function, communicative_purpose, trigger_situations, contexts,
  cefr_level_id, pattern, typical_collocates, common_mistakes, created_at, updated_at
) VALUES (
  ?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?
)
"""


def get_chunk_files():
    """Get all French chunk JSON files from the fr directory."""
    if not FR_DIR.exists():
        print(f"ERROR: Directory {FR_DIR} does not exist")
        return []
    return sorted(FR_DIR.glob("french_chunks_batch*.json"))


def load_chunks_from_json(path: Path) -> list:
    print(f"\n→ Loading {path.name}")
    with open(path, "r", encoding="utf-8") as f:
        data = json.load(f)
    print(f"  OK: {len(data)} chunks parsed")
    return data


def cefr_to_id(level: str) -> int:
    """Convert CEFR level string to ID."""
    mapping = {"A1": 1, "A2": 2, "B1": 3, "B2": 4, "C1": 5, "C2": 6}
    return mapping.get(level.upper(), 0)


def import_chunks(conn: sqlite3.Connection, chunks: list, source: str, entry_total: int) -> int:
    cur = conn.cursor()
    inserted = 0
    
    for idx, c in enumerate(chunks, 1):
        patterns = c.get("patterns", c.get("pattern", ""))
        if isinstance(patterns, list):
            patterns = "|".join(patterns)
        
        collocates = c.get("collocates", c.get("typical_collocates", ""))
        if isinstance(collocates, list):
            collocates = "|".join(collocates)
        
        result = cur.execute(STMT, (
            1,  # category_id (default)
            source,
            idx,
            entry_total,
            c.get("chunk_text", ""),
            c.get("meaning", ""),
            c.get("primary_function", ""),
            c.get("communicative_purpose", ""),
            c.get("trigger_situations", ""),
            c.get("contexts", ""),
            cefr_to_id(c.get("level", "A2")),
            patterns,
            collocates,
            c.get("common_mistakes", ""),
            int(__import__('time').time()),
            int(__import__('time').time()),
        ))
        if result.rowcount:
            inserted += 1
    conn.commit()
    skipped = len(chunks) - inserted
    print(f"  Inserted: {inserted}  Skipped (duplicates): {skipped}")
    return inserted


def main():
    conn = sqlite3.connect(DB_PATH)
    cur = conn.cursor()

    cur.execute("SELECT COUNT(*) FROM chunks")
    baseline = cur.fetchone()[0]
    print(f"Chunks in DB before import: {baseline}")

    chunk_files = get_chunk_files()
    print(f"\nFound {len(chunk_files)} chunk files to import")

    total_new = 0
    for json_path in chunk_files:
        chunks = load_chunks_from_json(json_path)
        if chunks:
            total_new += import_chunks(conn, chunks, json_path.name, len(chunks))

    cur.execute("SELECT COUNT(*) FROM chunks")
    final = cur.fetchone()[0]

    print(f"\n{'='*50}")
    print(f"Chunks before : {baseline}")
    print(f"Chunks after  : {final}")
    print(f"New chunks    : {final - baseline}")

    conn.close()
    print(f"\n✓ Import complete: {total_new} new French chunks imported")


if __name__ == "__main__":
    main()