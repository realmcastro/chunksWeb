#!/usr/bin/env py
"""Check French vocabulary in database vs JSON files."""
import json
import sqlite3
from pathlib import Path

fr_dir = Path("scripts/fr")
conn = sqlite3.connect("chunks_v1.db")
cur = conn.cursor()

# Collect words from JSON
json_words = set()
for path in sorted(fr_dir.glob("french_vocab_*.json")):
    with open(path, "r", encoding="utf-8") as f:
        data = json.load(f)
    for item in data:
        w = item.get("word", "").strip()
        if w:
            json_words.add(w)

print(f"Words in JSON files: {len(json_words)}")

# Collect words from DB
cur.execute('SELECT word FROM vocabulary_words WHERE language="fr"')
db_words = set(row[0] for row in cur.fetchall())
print(f"Words in DB (fr): {len(db_words)}")

# Find discrepancies
in_db_not_json = sorted(db_words - json_words)
in_json_not_db = sorted(json_words - db_words)

print(f"In DB but not JSON: {len(in_db_not_json)}")
for w in in_db_not_json:
    print(f"  {w}")

print(f"In JSON but not DB: {len(in_json_not_db)}")
for w in in_json_not_db:
    print(f"  {w}")

conn.close()