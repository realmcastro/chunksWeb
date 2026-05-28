#!/usr/bin/env python3
"""
Import French chunk examples into the examples table.

French chunks have example_1, example_2, example_3 in JSON but the examples
weren't imported into the DB. This script imports them.

examples table schema:
- item_type: 'chunk' for chunks
- item_id: chunk.id in DB
- example_index: 1, 2, or 3
- text_en: French example sentence
- text_target: English translation (example_X_translation)
- is_canonical: 1 for first example, 0 for others
"""

import json
import sqlite3
import sys
import time
from pathlib import Path

sys.stdout = open(sys.stdout.fileno(), mode='w', encoding='utf8', buffering=1)

DB_PATH = r"C:\Users\mathe\OneDrive\Documentos\ChunksWeb\chunks_v1.db"
FR_CHUNKS_DIR = Path(__file__).parent / "fr"

INSERT_STMT = """
INSERT OR IGNORE INTO examples (
  item_type, item_id, example_index, text_en, text_target, 
  audio_path, is_canonical, created_at
) VALUES (?, ?, ?, ?, ?, NULL, ?, ?)
"""


def get_chunk_files():
    """Get all French chunk JSON files."""
    files = list(FR_CHUNKS_DIR.glob("french_chunks_batch*.json"))
    
    def get_batch_num(f: Path) -> int:
        import re
        match = re.search(r'batch(\d+)', f.name)
        return int(match.group(1)) if match else 0
    
    return sorted(files, key=get_batch_num)


def load_chunks(path: Path) -> list:
    """Load chunks from JSON file."""
    print(f"  Loading {path.name}...")
    with open(path, 'r', encoding='utf-8') as f:
        return json.load(f)


def import_chunk_examples(conn: sqlite3.Connection, chunks: list, source_file: str) -> int:
    """Import examples for chunks. Returns count of examples inserted."""
    cur = conn.cursor()
    inserted = 0
    
    for chunk in chunks:
        chunk_text = chunk.get("chunk_text", "").strip()
        if not chunk_text:
            continue
        
        # Find chunk ID in DB by chunk_text
        cur.execute("SELECT id FROM chunks WHERE chunk_text = ? AND source_file LIKE 'french_chunks%'", (chunk_text,))
        row = cur.fetchone()
        if not row:
            continue
        
        chunk_id = row[0]
        
        # Import up to 3 examples
        for i in [1, 2, 3]:
            example_key = f"example_{i}"
            translation_key = f"example_{i}_translation"
            
            if example_key not in chunk:
                continue
            
            text_en = chunk[example_key]
            text_target = chunk.get(translation_key, "")
            
            # Skip pattern breakdowns like "à + tout + à + l'heure"
            if '+' in text_en and len(text_en) < 30:
                continue
            
            cur.execute(INSERT_STMT, (
                'chunk',
                chunk_id,
                i,
                text_en,
                text_target,
                1 if i == 1 else 0,
                int(time.time())
            ))
            
            if cur.rowcount:
                inserted += 1
    
    conn.commit()
    return inserted


def main():
    print("=" * 60)
    print("IMPORTING FRENCH CHUNK EXAMPLES")
    print("=" * 60)
    
    conn = sqlite3.connect(DB_PATH)
    
    # Check current state
    cur = conn.cursor()
    cur.execute("SELECT COUNT(*) FROM examples WHERE item_type='chunk'")
    before = cur.fetchone()[0]
    print(f"\nExamples in DB before: {before}")
    
    files = get_chunk_files()
    print(f"Found {len(files)} French chunk batch files\n")
    
    total_inserted = 0
    
    for filepath in files:
        chunks = load_chunks(filepath)
        inserted = import_chunk_examples(conn, chunks, filepath.name)
        if inserted > 0:
            print(f"  [OK] {filepath.name}: {inserted} examples imported")
        total_inserted += inserted
    
    # Final state
    cur.execute("SELECT COUNT(*) FROM examples WHERE item_type='chunk'")
    after = cur.fetchone()[0]
    
    print(f"\n{'='*60}")
    print(f"Examples before: {before}")
    print(f"Examples added:  {total_inserted}")
    print(f"Examples after:   {after}")
    print("=" * 60)
    
    conn.close()


if __name__ == "__main__":
    main()