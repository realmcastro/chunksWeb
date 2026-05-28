#!/usr/bin/env py
"""Diagnostic script to identify French content incorrectly tagged as English."""
import json
import sqlite3
from pathlib import Path

DB_PATH = Path("chunks_v1.db")
FR_DIR = Path("scripts/fr")


def collect_french_words():
    french_words = set()
    for path in sorted(FR_DIR.glob("french_vocab_*.json")):
        with open(path, "r", encoding="utf-8") as f:
            for item in json.load(f):
                word = item.get("word", "").strip()
                if word:
                    french_words.add(word)
    return french_words


def main():
    print("=== DIAGNOSTIC REPORT ===\n")

    conn = sqlite3.connect(str(DB_PATH))
    cur = conn.cursor()

    # Vocabulary words
    french_words = collect_french_words()
    print(f"French words in JSON files: {len(french_words)}")

    print("\n--- vocabulary_words ---")
    cur.execute("SELECT language, COUNT(*) FROM vocabulary_words GROUP BY language ORDER BY COUNT(*) DESC")
    for row in cur.fetchall():
        print(f"  language='{row[0] or 'NULL'}': {row[1]} records")

    if french_words:
        placeholders = ",".join("?" * len(french_words))
        cur.execute(
            f"SELECT word, cefr_level, category FROM vocabulary_words WHERE language = 'en' AND word IN ({placeholders})",
            list(french_words),
        )
        wrong = cur.fetchall()
        print(f"\nFrench words marked as 'en': {len(wrong)}")
        for row in wrong[:10]:
            print(f"  '{row[0]}' (CEFR={row[1]}, cat={row[2]})")

    # Chunks
    print("\n--- chunks ---")
    cur.execute("SELECT language, COUNT(*) FROM chunks GROUP BY language ORDER BY COUNT(*) DESC")
    for row in cur.fetchall():
        print(f"  language='{row[0] or 'NULL'}': {row[1]} records")

    print("\n--- French source files in chunks ---")
    cur.execute('SELECT source_file, language, COUNT(*) FROM chunks WHERE source_file LIKE "french_%" GROUP BY source_file, language')
    for row in cur.fetchall():
        print(f"  '{row[0]}' -> language='{row[1]}': {row[2]} records")

    # Grammar
    print("\n--- grammar_structures ---")
    cur.execute("SELECT language, COUNT(*) FROM grammar_structures GROUP BY language ORDER BY COUNT(*) DESC")
    for row in cur.fetchall():
        print(f"  language='{row[0] or 'NULL'}': {row[1]} records")

    conn.close()
    print("\n=== END ===")


if __name__ == "__main__":
    main()