#!/usr/bin/env py
"""
Comprehensive check for French words incorrectly tagged as English.
This uses the actual French vocabulary JSON files to find matches.
"""
import json
import sqlite3
from pathlib import Path

DB_PATH = "chunks_v1.db"
FR_DIR = Path("scripts/fr")

def load_french_words():
    """Load all French words from vocabulary JSON files."""
    words = set()
    for path in sorted(FR_DIR.glob("french_vocab_*.json")):
        with open(path, "r", encoding="utf-8") as f:
            for item in json.load(f):
                w = item.get("word", "").strip()
                if w and len(w) > 1:
                    words.add(w)
    return words

def check_mislabeled():
    conn = sqlite3.connect(DB_PATH)
    cur = conn.cursor()
    
    french_words = load_french_words()
    print(f"French vocabulary words loaded: {len(french_words)}")
    
    # Check vocabulary_words for French words marked as English
    placeholders = ",".join("?" * len(french_words))
    cur.execute(
        f"SELECT word, cefr_level, category, subcategory FROM vocabulary_words WHERE language = 'en' AND word IN ({placeholders})",
        list(french_words)
    )
    mislabeled = cur.fetchall()
    
    print(f"\nFrench words incorrectly tagged as 'en' in vocabulary_words: {len(mislabeled)}")
    if mislabeled:
        print("\nWords to fix:")
        for row in mislabeled:
            print(f"  '{row[0]}' (CEFR={row[1]}, cat={row[2]}, subcat={row[3]})")
    
    # Also check chunks for French text in English-tagged chunks
    print("\n--- Checking chunks ---")
    cur.execute('SELECT COUNT(*) FROM chunks WHERE language = "en"')
    en_chunks = cur.fetchone()[0]
    print(f"English chunks: {en_chunks}")
    
    cur.execute('SELECT COUNT(*) FROM chunks WHERE language = "fr"')
    fr_chunks = cur.fetchone()[0]
    print(f"French chunks: {fr_chunks}")
    
    conn.close()
    
    return mislabeled

if __name__ == "__main__":
    to_fix = check_mislabeled()
    if to_fix:
        print(f"\nFound {len(to_fix)} words to fix")