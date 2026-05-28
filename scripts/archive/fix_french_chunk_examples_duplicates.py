#!/usr/bin/env python3
"""
Fix French chunk examples that weren't imported due to duplicate chunk_text entries.

The previous import script matched by chunk_text only, but some chunks have
duplicate entries in the DB. This script tries to match by chunk_text AND
source_file to find the correct chunk ID.
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
    files = list(FR_CHUNKS_DIR.glob("french_chunks_batch*.json"))
    
    def get_batch_num(f: Path) -> int:
        import re
        match = re.search(r'batch(\d+)', f.name)
        return int(match.group(1)) if match else 0
    
    return sorted(files, key=get_batch_num)


def load_chunks(path: Path) -> list:
    with open(path, 'r', encoding='utf-8') as f:
        return json.load(f)


def import_chunk_examples_flexible(conn: sqlite3.Connection, chunks: list, source_file: str) -> int:
    """Import examples, matching by chunk_text AND source_file."""
    cur = conn.cursor()
    inserted = 0
    
    for chunk in chunks:
        chunk_text = chunk.get("chunk_text", "").strip()
        if not chunk_text:
            continue
        
        # Try to find chunk by chunk_text AND source_file
        cur.execute(
            "SELECT id FROM chunks WHERE chunk_text = ? AND source_file = ?",
            (chunk_text, source_file)
        )
        row = cur.fetchone()
        
        if not row:
            # Fallback: find chunk by chunk_text where source_file matches pattern
            cur.execute(
                "SELECT id FROM chunks WHERE chunk_text = ? AND source_file LIKE 'french_chunks%' LIMIT 1",
                (chunk_text,)
            )
            row = cur.fetchone()
        
        if not row:
            continue
        
        chunk_id = row[0]
        
        # Check if examples already exist for this chunk
        cur.execute("SELECT COUNT(*) FROM examples WHERE item_type='chunk' AND item_id=?", (chunk_id,))
        if cur.fetchone()[0] > 0:
            continue
        
        # Import up to 3 examples
        for i in [1, 2, 3]:
            example_key = f"example_{i}"
            translation_key = f"example_{i}_translation"
            
            if example_key not in chunk:
                continue
            
            text_en = chunk[example_key]
            text_target = chunk.get(translation_key, "")
            
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
    print("FIXING FRENCH CHUNK EXAMPLES (DUPLICATE FIX)")
    print("=" * 60)
    
    conn = sqlite3.connect(DB_PATH)
    
    cur = conn.cursor()
    cur.execute("SELECT COUNT(*) FROM chunks c JOIN examples e ON c.id = e.item_id AND e.item_type='chunk' WHERE c.source_file LIKE 'french_chunks%'")
    before = cur.fetchone()[0]
    print(f"\nFrench chunks with examples before: {before}")
    
    files = get_chunk_files()
    print(f"Found {len(files)} batch files\n")
    
    total_inserted = 0
    
    for filepath in files:
        chunks = load_chunks(filepath)
        inserted = import_chunk_examples_flexible(conn, chunks, filepath.name)
        if inserted > 0:
            print(f"  [OK] {filepath.name}: {inserted} examples fixed")
        total_inserted += inserted
    
    cur.execute("SELECT COUNT(*) FROM chunks c JOIN examples e ON c.id = e.item_id AND e.item_type='chunk' WHERE c.source_file LIKE 'french_chunks%'")
    after = cur.fetchone()[0]
    
    print(f"\n{'='*60}")
    print(f"French chunks with examples before: {before}")
    print(f"New examples added:                {total_inserted}")
    print(f"French chunks with examples after:  {after}")
    print("=" * 60)
    
    conn.close()


if __name__ == "__main__":
    main()