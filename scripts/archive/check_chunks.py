#!/usr/bin/env py
import sqlite3, json
from pathlib import Path

conn = sqlite3.connect('chunks_v1.db')
cur = conn.cursor()

# Check French chunks in DB
cur.execute('SELECT chunk_text FROM chunks WHERE language="fr"')
db_chunks = [row[0] for row in cur.fetchall() if row[0]]
print(f'French chunk_texts in DB: {len(db_chunks)}')

# Check French chunks in JSON
json_chunks = []
for p in sorted(Path('scripts/fr').glob('french_chunks_batch*.json')):
    with open(p, 'r', encoding='utf-8') as f:
        for item in json.load(f):
            ct = item.get('chunk_text', '').strip()
            if ct:
                json_chunks.append(ct)

print(f'French chunk_texts in JSON: {len(json_chunks)}')

# Sample from DB
print("\nSample from DB (first 10):")
for ct in db_chunks[:10]:
    print(f"  '{ct}'")

# Sample from JSON
print("\nSample from JSON (first 10):")
for ct in json_chunks[:10]:
    print(f"  '{ct}'")

conn.close()